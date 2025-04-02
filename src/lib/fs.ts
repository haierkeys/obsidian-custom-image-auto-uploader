import { TFile, TAbstractFile } from "obsidian";

import { timestampToDate, hashContent, stringToDate, dump } from "./helps";
import BetterSync from "../main";


/**
 消息推送操作方法 Message Push Operation Method
 */

export const NoteModify = async function (file: TAbstractFile, plugin: BetterSync) {
  if (!file.path.endsWith(".md")) return
  if (!(file instanceof TFile)) {
    return
  }
  const content: string = await plugin.app.vault.cachedRead(file)
  const contentHash = hashContent(content)

  if (plugin.SyncSkipFiles[file.path] && plugin.SyncSkipFiles[file.path] == contentHash) {
    return
  }

  const data = {
    vault: plugin.settings.vault,
    ctime: file.stat.ctime,
    mtime: file.stat.mtime,
    path: file.path,
    pathHash: hashContent(file.path),
    content: content,
    contentHash: contentHash,
  }
  plugin.websocket.MsgSend("NoteModify", data, "json")
  plugin.SyncSkipFiles[file.path] = data.contentHash

  dump(`NoteModify Send`, data.path, data.contentHash, data.mtime, data.pathHash)

}

export const FileContentModify = async function (file: TAbstractFile, content: string, plugin: BetterSync) {
  if (!file.path.endsWith(".md")) return

  if (!(file instanceof TFile)) {
    return
  }

  const contentHash = hashContent(content)
  if (plugin.SyncSkipFiles[file.path] && plugin.SyncSkipFiles[file.path] == contentHash) {
    return
  }

  // 异步读取文件内容
  const data = {
    vault: plugin.settings.vault,
    ctime: file.stat.ctime,
    mtime: file.stat.mtime,
    path: file.path,
    pathHash: hashContent(file.path),
    content: content,
    contentHash: hashContent(content),
  }
  plugin.websocket.MsgSend("NoteContentModify", data, "json")
  plugin.SyncSkipFiles[file.path] = data.contentHash

  dump(`FileContentModify Send`, data.path, data.contentHash, data.mtime, data.pathHash)
}

export const NoteDelete = async function (file: TAbstractFile, plugin: BetterSync) {
  if (!(file instanceof TFile)) {
    return
  }
  if (plugin.SyncSkipDelFiles[file.path]) {
    delete plugin.SyncSkipDelFiles[file.path]
    return
  }
  NoteDeleteByPath(file.path, plugin)
}

export const NoteDeleteByPath = async function (path: string, plugin: BetterSync) {
  const data = {
    vault: plugin.settings.vault,
    path: path,
    pathHash: hashContent(path),
  }
  plugin.websocket.MsgSend("NoteDelete", data, "json")
  dump(`Send NoteDelete`, data.path, data.path, data.pathHash)
}

export const FileRename = async function (file: TAbstractFile, oldfile: string, plugin: BetterSync) {
  if (!(file instanceof TFile)) {
    return
  }
  NoteDeleteByPath(oldfile, plugin)
  NoteModify(file, plugin)
  dump("rename", file, oldfile)
}

/**
  调用动作操作方法  Invoke action operation method
 */

export const OverrideRemoteAllFiles = async function (plugin: BetterSync) {
  if (plugin.websocket.isSyncAllFilesInProgress) {
    return
  }

  plugin.websocket.isSyncAllFilesInProgress = true
  const files = plugin.app.vault.getMarkdownFiles()
  for (const file of files) {
    const content: string = await plugin.app.vault.cachedRead(file)
    const data = {
      vault: plugin.settings.vault,
      ctime: file.stat.ctime,
      mtime: file.stat.mtime,
      path: file.path,
      pathHash: hashContent(file.path),
      content: content,
      contentHash: hashContent(content),
    }
    plugin.websocket.MsgSend("NoteModifyOverride", data, "json")
  }
  plugin.websocket.isSyncAllFilesInProgress = false
  plugin.settings.lastSyncTime = 0
  await plugin.saveData(plugin.settings)
  NoteSync(plugin)
}

export const SyncAllFiles = async function (plugin: BetterSync) {
  if (plugin.websocket.isSyncAllFilesInProgress) {
    return
  }
  await NoteSync(plugin)

  plugin.websocket.isSyncAllFilesInProgress = true
  const files = await plugin.app.vault.getMarkdownFiles()
  for (const file of files) {
    const content: string = await plugin.app.vault.cachedRead(file)
    const data = {
      vault: plugin.settings.vault,
      ctime: file.stat.ctime,
      mtime: file.stat.mtime,
      path: file.path,
      pathHash: hashContent(file.path),
      content: content,
      contentHash: hashContent(content),
    }
    await plugin.websocket.MsgSend("NoteModify", data, "json",true)
  }
  plugin.websocket.isSyncAllFilesInProgress = false
  plugin.settings.lastSyncTime = 0
  await plugin.saveData(plugin.settings)
  NoteSync(plugin)
}

export const NoteSync = async function (plugin: BetterSync) {
  if (plugin.websocket.isSyncAllFilesInProgress) {
    return
  }
  const data = {
    vault: plugin.settings.vault,
    lastTime: Number(plugin.settings.lastSyncTime),
  }
  plugin.websocket.MsgSend("NoteSync", data, "json")
  plugin.websocket.isSyncAllFilesInProgress = true
}

/**
  消息接收操作方法  Message receiving methods
 */

interface ReceiveData {
  vault: string
  path: string
  pathHash: string
  action: string
  content: string
  contentHash: string
  ctime: number
  mtime: number
  lastTime: number
}

// ReceiveNoteModify 接收文件修改
export const ReceiveNoteModify = async function (data: any, plugin: BetterSync) {
  if (data.vault != plugin.settings.vault) {
    return
  }
  if (plugin.SyncSkipFiles[data.path] && plugin.SyncSkipFiles[data.path] == data.contentHash) {
    return
  }
  dump(`ReceiveNoteSyncModify:`, data.action, data.path, data.contentHash, data.mtime, data.pathHash)

  const fileExists = await plugin.app.vault.adapter.exists(data.path)

  if (fileExists) {
    const file = plugin.app.vault.getFileByPath(data.path)
    if (file && data.contentHash != hashContent(await plugin.app.vault.cachedRead(file))) {
      plugin.SyncSkipFiles[data.path] = data.contentHash
      await plugin.app.vault.modify(file, data.content, { ctime: data.ctime, mtime: data.mtime })
    }
  } else {
    const folder = data.path.split("/").slice(0, -1).join("/")
    if (folder != "") {
      const dirExists = await plugin.app.vault.adapter.exists(folder)
      if (!dirExists) await plugin.app.vault.createFolder(folder)
    }
    plugin.SyncSkipFiles[data.path] = data.contentHash
    await plugin.app.vault.create(data.path, data.content, { ctime: data.ctime, mtime: data.mtime })
  }
}

export const ReceiveNoteDelete = async function (data: any, plugin: BetterSync) {
  if (data.vault != plugin.settings.vault) {
    delete plugin.SyncSkipDelFiles[data.path]
    return
  }
  dump(`ReceiveNoteSyncDelete:`, data.action, data.path, data.mtime, data.pathHash)
  if (data.action == "delete") {
    const file = plugin.app.vault.getFileByPath(data.path)
    if (file instanceof TFile) {
      plugin.SyncSkipDelFiles[data.path] = "{ReceiveNoteSyncDelete}"
      plugin.app.vault.delete(file)
      //await plugin.app.vault.delete(file)s
    }
  }
}

export const ReceiveNoteEnd = async function (data: any, plugin: BetterSync) {
  if (data.vault != plugin.settings.vault) {
    return
  }
  dump(`ReceiveNoteSyncEnd:`, data.vault, data, data.lastTime)
  plugin.settings.lastSyncTime = data.lastTime
  await plugin.saveData(plugin.settings)
  plugin.websocket.isSyncAllFilesInProgress = false
}

type ReceiveSyncMethod = (data: any, plugin: BetterSync) => void

export const syncReceiveMethodHandlers: Map<string, ReceiveSyncMethod> = new Map([
  ["NoteSyncModify", ReceiveNoteModify],
  ["NoteSyncDelete", ReceiveNoteDelete],
  ["NoteSyncEnd", ReceiveNoteEnd],
])

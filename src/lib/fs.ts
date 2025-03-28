import { TFile, TAbstractFile } from "obsidian";

import { timestampToDate, hashContent, stringToDate, dump } from "./helps";
import BetterSync from "../main";


/**
 WebSocket 客户端消息接收操作相关
 */

export const FileModify = async function (file: TAbstractFile, plugin: BetterSync) {
  if (!file.path.endsWith(".md")) return
  if (!(file instanceof TFile)) {
    return
  }
  const content: string = await this.app.vault.cachedRead(file)
  const contentHash = hashContent(content)

  if (plugin.SyncSkipFiles[file.path] && plugin.SyncSkipFiles[file.path] == contentHash) {
    return
  }

  const data = {
    vault: plugin.settings.vault,
    mtime: timestampToDate(file.stat.mtime),
    path: file.path,
    pathHash: hashContent(file.path),
    content: content,
    contentHash: contentHash,
  }
  plugin.websocket.send("FileModify", data, "json")

  dump(`FileModify Send FileModify`, data.path, data.contentHash, data.mtime, data.pathHash)
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
    mtime: timestampToDate(file.stat.mtime),
    path: file.path,
    pathHash: hashContent(file.path),
    content: content,
    contentHash: contentHash,
  }
  plugin.websocket.send("FileModify", data, "json")
  plugin.SyncSkipFiles[file.path] = data.contentHash

  dump(`FileContentModify Send FileModify`, data.path, data.contentHash, data.mtime, data.pathHash)
}

export const FileDelete = async function (file: TAbstractFile, plugin: BetterSync) {
  if (!(file instanceof TFile)) {
    return
  }
  FileDeleteByPath(file.path, plugin)
}

export const FileDeleteByPath = async function (path: string, plugin: BetterSync) {
  if (plugin.SyncSkipFiles[path]) {
    delete plugin.SyncSkipFiles[path]
    return
  }
  const data = {
    vault: plugin.settings.vault,
    path: path,
    pathHash: hashContent(path),
  }
  plugin.websocket.send("FileDelete", data, "json")
  dump(`Send FileDelete`, data.path, data.path, data.pathHash)
}

export const FileRename = async function (file: TAbstractFile, oldfile: string, plugin: BetterSync) {
  if (!(file instanceof TFile)) {
    return
  }
  FileDeleteByPath(oldfile, plugin)
  FileModify(file, plugin)
  dump("rename", file, oldfile)
}

export const OverrideRemoteAllFiles = async function (plugin: BetterSync) {
  if (plugin.isSyncAllFilesInProgress) {
    return
  }
  plugin.settings.lastSyncTime = "1970-01-01 00:00:00"
  await plugin.saveData(plugin.settings)
  plugin.isSyncAllFilesInProgress = true
  const files = plugin.app.vault.getMarkdownFiles()
  for (const file of files) {
    const content: string = await this.app.vault.cachedRead(file)
    const data = {
      vault: plugin.settings.vault,
      mtime: timestampToDate(file.stat.mtime),
      path: file.path,
      pathHash: hashContent(file.path),
      content: content,
      contentHash: hashContent(content),
    }
    plugin.websocket.send("FileModifyOverride", data, "json")
  }
  plugin.isSyncAllFilesInProgress = false
  SyncFiles(plugin)
}

export const SyncAllFiles = async function (plugin: BetterSync) {
  if (plugin.isSyncAllFilesInProgress) {
    return
  }
  plugin.settings.lastSyncTime = "1970-01-01 00:00:00"
  await plugin.saveData(plugin.settings)
  plugin.isSyncAllFilesInProgress = true
  const files = plugin.app.vault.getMarkdownFiles()
  for (const file of files) {
    const content: string = await this.app.vault.cachedRead(file)
    const data = {
      vault: plugin.settings.vault,
      mtime: timestampToDate(file.stat.mtime),
      path: file.path,
      pathHash: hashContent(file.path),
      content: content,
      contentHash: hashContent(content),
    }
    plugin.websocket.send("FileModify", data, "json")
  }
  plugin.isSyncAllFilesInProgress = false
  SyncFiles(plugin)
}

export const SyncFiles = async function (plugin: BetterSync) {
  if (plugin.isSyncAllFilesInProgress) {
    return
  }
  const data = {
    vault: plugin.settings.vault,
    lastUpdateAt: stringToDate(plugin.settings.lastSyncTime),
  }
  plugin.websocket.send("SyncFiles", data, "json")
  plugin.isSyncAllFilesInProgress = true
}

/**
  消息接收操作相关
 */

export const ReceiveSyncFileModify = async function (data: any, plugin: BetterSync) {
  if (data.vault != plugin.settings.vault) {
    return
  }
  dump(`ReceiveSyncFileModify:`, data.action, data.path, data.contentHash, data.mtime, data.pathHash)

  const fileExists = await plugin.app.vault.adapter.exists(data.path)

  if (fileExists) {
    const file = plugin.app.vault.getFileByPath(data.path)
    if (file && data.contentHash != hashContent(await plugin.app.vault.cachedRead(file))) {
      plugin.SyncSkipFiles[data.path] = data.contentHash
      await plugin.app.vault.modify(file, data.content)
    }
  } else {
    const folder = data.path.split("/").slice(0, -1).join("/")
    if (folder != "") {
      const dirExists = await plugin.app.vault.adapter.exists(folder)
      if (!dirExists) await plugin.app.vault.createFolder(folder)
    }
    plugin.SyncSkipFiles[data.path] = data.contentHash
    await plugin.app.vault.create(data.path, data.content)
  }
}
export const ReceiveSyncFileDelete = async function (data: any, plugin: BetterSync) {
  if (data.vault != plugin.settings.vault) {
    return
  }
  dump(`ReceiveSyncFileDelete:`, data.action, data.path, data.mtime, data.pathHash)
  if (data.action == "delete") {
    const file = plugin.app.vault.getFileByPath(data.path)
    if (file instanceof TFile) {
      plugin.SyncSkipFiles[data.path] = "{ReceiveSyncFileDelete}"
      plugin.app.vault.delete(file)
      //await plugin.app.vault.delete(file)s
    }
  }
}

export const ReceiveSyncFilesEnd = async function (data: any, plugin: BetterSync) {
  if (data.vault != plugin.settings.vault) {
    return
  }

  dump(`ReceiveSyncFilesEnd:`, data.vault, data, data.lastUpdateAt)
  plugin.settings.lastSyncTime = data.lastUpdateAt
  await plugin.saveData(plugin.settings)
  plugin.isSyncAllFilesInProgress = false
}

type ReceiveSyncMethod = (data: any, plugin: BetterSync) => void

export const syncReceiveMethodHandlers: Map<string, ReceiveSyncMethod> = new Map([
  ["SyncFileModify", ReceiveSyncFileModify],
  ["SyncFileDelete", ReceiveSyncFileDelete],
  ["SyncFilesEnd", ReceiveSyncFilesEnd],
])

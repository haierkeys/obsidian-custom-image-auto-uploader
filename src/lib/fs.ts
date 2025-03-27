import { TFile, Vault, Notice, TAbstractFile } from "obsidian"
import BetterSync from "../main"
import { timestampToDate, hashContent,stringToDate, dump } from "./helps"

/**
 WebSocket 客户端消息接收操作相关
 */

export async function FileModify(file: TAbstractFile, plugin: BetterSync) {
  if (!file.path.endsWith(".md")) return
  if (!(file instanceof TFile)) {
    return
  }
  if (plugin.SerSyncFiles[file.path] && plugin.SerSyncFiles[file.path] == hashContent(await plugin.app.vault.cachedRead(file))) {
    delete plugin.SerSyncFiles[file.path]
    return
  }
  // 异步读取文件内容
  const body: string = await this.app.vault.cachedRead(file)
  const data = {
    vault: plugin.settings.vault,
    mtime: timestampToDate(file.stat.mtime),
    path: file.path,
    pathHash: hashContent(file.path),
    content: body,
    contentHash: hashContent(body),
  }
  plugin.websocket.send("FileModify", data, "json")

  dump(`Send FileModify`, data.path, data.contentHash, data.mtime, data.pathHash)
}


export async function FileContentModify(file: TAbstractFile, content: string, plugin: BetterSync) {
  if (!file.path.endsWith(".md")) return
  if (!(file instanceof TFile)) {
    return
  }
  if (plugin.SerSyncFiles[file.path] && plugin.SerSyncFiles[file.path] == hashContent(content)) {
    delete plugin.SerSyncFiles[file.path]
    return
  }
  // 异步读取文件内容
  const data = {
    vault: plugin.settings.vault,
    mtime: timestampToDate(file.stat.mtime),
    path: file.path,
    pathHash: hashContent(file.path),
    content: content,
    contentHash: hashContent(content),
  }
  plugin.websocket.send("FileModify", data, "json")

  dump(`Send FileModify`, data.path, data.contentHash, data.mtime, data.pathHash)
}

export async function FileDelete(file: TAbstractFile, plugin: BetterSync) {
  if (!(file instanceof TFile)) {
    return
  }
  if (plugin.SerSyncFiles[file.path]) {
    delete plugin.SerSyncFiles[file.path]
    return
  }
  const data = {
    vault: plugin.settings.vault,
    path: file.path,
    pathHash: hashContent(file.path),
  }

  plugin.websocket.send("FileDelete", data, "json")
  dump(`Send FileDelete`, data.path, data.path, data.pathHash)
}

export const FileRename = async function (abstractFile: TAbstractFile, oldfile: string, plugin: BetterSync) {
  if (!(abstractFile instanceof TFile)) {
    return
  }
  dump("Created item is not a file:", abstractFile.path)
  const file = abstractFile as TFile
  if (!file.path.endsWith(".md")) return
  // 异步读取文件内容
  const body: string = await this.app.vault.cachedRead(file)
  plugin.websocket.send("FileDelete", { vault: plugin.settings.vault, mtime: timestampToDate(file.stat.mtime), path: oldfile, pathHash: hashContent(oldfile) }, "json")
  plugin.websocket.send(
    "FileCreate",
    {
      vault: plugin.settings.vault,
      mtime: timestampToDate(file.stat.mtime),
      path: file.path,
      pathHash: hashContent(file.path),
      content: body,
      contentHash: hashContent(body),
    },
    "json"
  )
  dump("rename", file, oldfile)
}

export const SyncFileModify = async function (data: any, plugin: BetterSync) {
  if (data.vault != plugin.settings.vault) {
    return
  }
  dump(`Get SyncModify:`, data.action, data.path, data.contentHash, data.mtime, data.pathHash)
  const fileExists = await this.app.vault.adapter.exists(data.path)
  if (data.action == "delete") {
    const file = plugin.app.vault.getFileByPath(data.path)
    if (file instanceof TFile) {
      plugin.SerSyncFiles[data.path] = data.contentHash
      plugin.app.vault.delete(file)
      //await plugin.app.vault.delete(file)s
    }
  } else {
    if (fileExists) {
      const file = plugin.app.vault.getFileByPath(data.path)
      if (file && data.contentHash != hashContent(await plugin.app.vault.cachedRead(file))) {
        plugin.SerSyncFiles[data.path] = data.contentHash
        await plugin.app.vault.modify(file, data.content)
      }
    } else {
      await plugin.app.vault.create(data.path, data.content)
    }
  }
}
export const SyncFileDelete = async function (data: any, plugin: BetterSync) {
  if (data.vault != plugin.settings.vault) {
    return
  }
  dump(`Get SyncFileDelete:`, data.action, data.path, data.contentHash, data.mtime, data.pathHash)
  if (data.action == "delete") {
    const file = plugin.app.vault.getFileByPath(data.path)
    if (file instanceof TFile) {
      plugin.SerSyncFiles[data.path] = data.contentHash
      plugin.app.vault.delete(file)
      //await plugin.app.vault.delete(file)s
    }
  }
}

export const InitAllFiles = async function (plugin: BetterSync) {
  const files = plugin.app.vault.getMarkdownFiles()
  for (const file of files) {
    const body: string = await this.app.vault.cachedRead(file)

    plugin.websocket.send(
      "FileModify",
      {
        vault: plugin.settings.vault,
        mtime: timestampToDate(file.stat.mtime),
        path: file.path,
        pathHash: hashContent(file.path),
        content: body,
        contentHash: hashContent(body),
      },
      "json"
    )
  }
}

export const SyncAllFiles = async function (plugin: BetterSync) {
  // const currentDate = new Date()
  // const formattedDate = format(currentDate, "yyyy-MM-dd HH:mm:ss")
  plugin.websocket.send("ModifyFiles", { vault: plugin.settings.vault, updatedAt: stringToDate(plugin.settings.lastSyncTime) }, "json")
}

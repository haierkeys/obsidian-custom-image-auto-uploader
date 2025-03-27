import { Plugin, MarkdownFileInfo } from "obsidian"
import { SettingTab, PluginSettings, DEFAULT_SETTINGS } from "./setting"
import { WebSocketClient } from "./lib/websocket"
import { FileModify, FileDelete, FileRename, FileContentModify, InitAllFiles, SyncAllFiles } from "./lib/fs"

interface ContentHashes {
  [key: string]: string
}
interface ContentStore {
  [key: string]: string
}
interface SerSyncFiles {
  [key: string]: string
}

export default class BetterSync extends Plugin {
  settingTab: SettingTab
  settings: PluginSettings
  websocket: WebSocketClient
  contentHashes: ContentHashes = {}
  contentStore: ContentStore = {}
  remoteContentStore: ContentStore = {}
  SerSyncFiles: SerSyncFiles = {}
  editSyncTimeout: any

  async onload() {
    const currentDate = new Date()
    console.log(currentDate)

    // 初始化哈希存储和内容存储
    this.contentHashes = {}
    this.contentStore = {}
    // 模拟远程服务器存储
    this.remoteContentStore = {}

    await this.loadSettings()
    this.settingTab = new SettingTab(this.app, this)
    // 注册设置选项
    this.addSettingTab(this.settingTab)
    this.websocket = new WebSocketClient(this)

    if (this.settings.syncEnabled) {
      this.websocket.register()
    } else {
      this.websocket.unRegister()
    }

    // 注册文件事件
    this.registerEvent(this.app.vault.on("create", (abstractFile) => FileModify(abstractFile, this)))
    this.registerEvent(this.app.vault.on("modify", (abstractFile) => FileModify(abstractFile, this)))
    this.registerEvent(this.app.vault.on("delete", (abstractFile) => FileDelete(abstractFile, this)))
    this.registerEvent(this.app.vault.on("rename", (abstractFile, oldfile) => FileRename(abstractFile, oldfile, this)))

    // 注册编译器事件
    this.registerEvent(
      this.app.workspace.on("editor-change", async (editor, mdFile) => {
        clearTimeout(this.editSyncTimeout)
        this.editSyncTimeout = setTimeout(() => {
          if (mdFile.file) FileContentModify(mdFile.file, editor.getValue(), this)
        }, 200)
      })
    )

    // 注册命令
    this.addCommand({
      id: "InitAllNotes",
      name: "强制同步本地覆盖到远端",
      callback: async () => InitAllFiles(this),
    })

    this.addCommand({
      id: "SyncAllFiles",
      name: "同步全部笔记",
      callback: async () => SyncAllFiles(this),
    })
  }

  onunload() {
    console.log("onunload")
    this.websocket.unRegister()
  }

  async loadSettings() {
    this.settings = Object.assign({}, DEFAULT_SETTINGS, await this.loadData())
  }

  async saveSettings(isStatusCheck: boolean = true) {
    if (this.settings.api && this.settings.apiToken) {
      this.settings.wsApi = this.settings.api.replace(/^http/, "ws")
    }
    if (this.settings.syncEnabled) {
      this.websocket.register()
    } else {
      this.websocket.unRegister()
    }

    await this.saveData(this.settings)
  }
}

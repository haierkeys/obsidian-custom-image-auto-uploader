import { Plugin, TFile } from "obsidian"
import { SettingTab, PluginSettings, DEFAULT_SETTINGS } from "./setting"
import { NoteDown, NoteUp, WebSocketClient } from "./utils"
import { diff } from "diff-match-patch-es"
interface ContentHashes {
  [key: string]: string
}
interface ContentStore {
  [key: string]: string
}

export default class BetterSync extends Plugin {
  settingTab: SettingTab
  settings: PluginSettings
  websocket: WebSocketClient
  contentHashes: ContentHashes = {}
  contentStore: ContentStore = {}
  remoteContentStore: ContentStore = {}

  async onload() {
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
      this.websocket.connect()
    }

    console.log(this.websocket.wsIsOpen)

    this.registerEvent(
      this.app.vault.on("create", async (abstractFile) => {
        if (!(abstractFile instanceof TFile)) {
          console.log("Created item is not a file:", abstractFile.path)
          return
        }
        const file = abstractFile as TFile

        if (!file.path.endsWith(".md")) return
        // 异步读取文件内容
        const body: string = await this.app.vault.cachedRead(file)
        // 发送 WebSocket 消息至指定通道
        this.websocket.send("create", { filePath: file.path, fileBody: body })
      })
    )

    this.registerEvent(
      this.app.vault.on("modify", async (abstractFile) => {
        if (!(abstractFile instanceof TFile)) {
          console.log("Created item is not a file:", abstractFile.path)
          return
        }
        const file = abstractFile as TFile

        if (!file.path.endsWith(".md")) return
        // 异步读取文件内容
        const body: string = await this.app.vault.cachedRead(file)
        this.websocket.send("modify", { filePath: file.path, fileBody: body }, "json")
        console.log("modify", file)
      })
    )

    this.registerEvent(
      this.app.vault.on("delete", (file) => {
        this.websocket.send("delete", file.path)
        console.log("delete", file)
      })
    )

    this.registerEvent(
      this.app.vault.on("rename", (file, oldPath) => {
        console.log("rename", file, oldPath)
      })
    )
  }





  onunload() {}

  async loadSettings() {
    this.settings = Object.assign({}, DEFAULT_SETTINGS, await this.loadData())
  }

  async saveSettings(isStatusCheck: boolean = true) {
    if (this.settings.api && this.settings.apiToken) {
      this.settings.wsApi = this.settings.api.replace(/^http/, "ws")
    }
    this.websocket.close()
    if (this.settings.syncEnabled) {
      this.websocket.reConnect()
    }

    await this.saveData(this.settings)
  }
}

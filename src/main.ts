import { Plugin } from "obsidian"
import { SettingTab, PluginSettings, DEFAULT_SETTINGS } from "./setting"
import { NoteDown, NoteUp, WebSocketConnect } from "./utils"
import { DownTask, UploadTask } from "./interface"
import { $ } from "./lang"


export default class BetterSync extends Plugin {
  settingTab: SettingTab
  settings: PluginSettings
  websocket: WebSocket


  async onload() {
    await this.loadSettings()
    this.settingTab = new SettingTab(this.app, this)
    // 注册设置选项
    this.addSettingTab(this.settingTab);

    WebSocketConnect(this)


  }

  async ContentUploadImage() {
    if (!this.app.workspace.activeEditor || !this.app.workspace.activeEditor.editor) return

    let cursor = this.app.workspace.activeEditor.editor.getCursor()


  }


  onunload() {}

  async loadSettings() {
    this.settings = Object.assign({}, DEFAULT_SETTINGS, await this.loadData())
  }

  async saveSettings(isStatusCheck: boolean = true) {
    if (this.settings.api && this.settings.apiToken) {
      this.settings.wsApi = this.settings.api.replace(/^http/, 'ws')
    }
    await this.saveData(this.settings)
  }
}

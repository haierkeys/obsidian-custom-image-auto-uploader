import { Plugin } from "obsidian";

import { FileModify, FileDelete, FileRename, FileContentModify, OverrideRemoteAllFiles, SyncFiles, SyncAllFiles } from "./lib/fs";
import { SettingTab, PluginSettings, DEFAULT_SETTINGS } from "./setting";
import { WebSocketClient } from "./lib/websocket";
import { AddRibbonIcon } from "./lib/menu";
import { $ } from "./lang/lang";


interface SyncSkipFiles {
  [key: string]: string
}

export default class BetterSync extends Plugin {
  settingTab: SettingTab
  settings: PluginSettings
  websocket: WebSocketClient
  SyncSkipFiles: SyncSkipFiles = {}
  editorChangeTimeout: any
  isSyncAllFilesInProgress: boolean = false
  ribbonIcon: HTMLElement
  ribbonIconInterval: any
  ribbonIconStatus: boolean = false

  async onload() {
    this.SyncSkipFiles = {}

    await this.loadSettings()
    this.settingTab = new SettingTab(this.app, this)
    // 注册设置选项
    this.addSettingTab(this.settingTab)
    this.websocket = new WebSocketClient(this)

    this.isSyncAllFilesInProgress = false
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
        clearTimeout(this.editorChangeTimeout)
        this.editorChangeTimeout = setTimeout(() => {
          if (mdFile.file) FileContentModify(mdFile.file, editor.getValue(), this)
        }, 200)
      })
    )

    // 注册命令
    this.addCommand({
      id: "init-all-files",
      name: $("同步全部笔记(覆盖远端)"),
      callback: async () => OverrideRemoteAllFiles(this),
    })

    this.addCommand({
      id: "init-all-files",
      name: $("同步全部笔记"),
      callback: async () => SyncAllFiles(this),
    })



    this.addCommand({
      id: "sync-files",
      name: "同步笔记",
      callback: async () => SyncFiles(this),
    })
    AddRibbonIcon(this)
  }

  onunload() {
    // 取消注册文件事件
    this.isSyncAllFilesInProgress = false
    clearInterval(this.ribbonIconInterval)
    this.websocket.unRegister()
  }

  async loadSettings() {
    this.settings = Object.assign({}, DEFAULT_SETTINGS, await this.loadData())
  }

  async saveSettings() {
    if (this.settings.api && this.settings.apiToken) {
      this.settings.wsApi = this.settings.api.replace(/^http/, "ws")
    }
    if (this.settings.syncEnabled) {
      this.websocket.register()
      //SyncFiles(this)
    } else {
      this.websocket.unRegister()
    }
    await this.saveData(this.settings)
  }
}

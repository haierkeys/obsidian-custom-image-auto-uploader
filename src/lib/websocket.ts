import { Notice } from "obsidian"
import BetterSync from "../main"
import { dump } from "./helps"
import { SyncFileModify, SyncFileDelete } from "./fs"

export class WebSocketClient {
  private ws: WebSocket
  private wsApi: string
  private Plugin: BetterSync
  public wsIsOpen: boolean = false
  public checkConnection: any
  public checkReConnectTimeout: any
  public timeConnect = 0
  private isRegister: boolean = false
  constructor(plugin: BetterSync) {
    this.Plugin = plugin
    this.wsApi = plugin.settings.wsApi
  }
  public sleep(ms: number): Promise<void> {
    return new Promise((resolve) => setTimeout(resolve, ms))
  }
  public isConnected(): boolean {
    return this.wsIsOpen
  }
  public register() {
    if (!this.ws || this.ws.readyState !== WebSocket.OPEN) {
      this.isRegister = true
      this.ws = new WebSocket(this.Plugin.settings.wsApi + "/api/user/sync?lang=en")
      this.ws.onerror = (error) => {
        //this.checkReConnect()
      }
      this.ws.onopen = (e: Event): void => {
        this.timeConnect = 0
        this.wsIsOpen = true
        dump("Connected to the WebSocket server")
        this.send("Authorization", this.Plugin.settings.apiToken)
        this.receive()
        this.check()
      }
      this.ws.onclose = (e) => {
        if (this.isRegister) {
          this.checkReConnect()
        }
        this.wsIsOpen = false
        clearInterval(this.checkConnection)
        dump("WebSocket connection closed1")
      }
    }
  }
  public unRegister() {
    clearInterval(this.checkConnection)
    clearTimeout(this.checkReConnectTimeout)
    this.wsIsOpen = false
    this.isRegister = false
    if (this.ws) {
      this.ws.close(1000, "unRegister")
    }
    dump("WebSocket unRegister")
  }
  public checkReConnect() {
    clearTimeout(this.checkReConnectTimeout)
    if (this.ws && this.ws.readyState === WebSocket.CLOSED) {
      this.checkReConnectTimeout = setTimeout(() => {
        this.timeConnect++
        dump("WebSocket connection closed, reconnecting...", this.timeConnect)
        this.register()
      }, 5000)
    }
  }
  public check() {
    clearInterval(this.checkConnection)
    this.checkConnection = setInterval(() => {
      if (this.ws && this.ws.readyState === WebSocket.OPEN) {
        this.wsIsOpen = true
        clearInterval(this.checkConnection)
        //dump("WebSocket connection is open.")
      }
    }, 5000)
  }
  public async send(action: string, data: any, type: string = "text") {
    // 循环检查 WebSocket 连接是否打开
    while (this.ws.readyState !== WebSocket.OPEN) {
      dump("WebSocket 连接未打开，等待重试...")
      await this.sleep(3000) // 每隔一秒重试一次
    }
    if (type == "text") {
      this.ws.send(action + "|" + data)
    } else if (type == "json") {
      this.ws.send(action + "|" + JSON.stringify(data))
    }
  }
  public receive() {
    this.ws.onmessage = (event) => {
      // 使用字符串的 indexOf 找到第一个分隔符的位置
      let msgData: string = event.data
      let msgAction: string = ""
      const index = event.data.indexOf("|")
      if (index !== -1) {
        msgData = event.data.slice(index + 1)
        msgAction = event.data.slice(0, index)
      }
      const data = JSON.parse(msgData)
      if (data.code == 0 || data.code > 100) {
        new Notice("操作失效" + data.msg)
      } else {
        if (msgAction == "SyncFileModify") {
          SyncFileModify(data.data, this.Plugin)
        }

        if (msgAction == "SyncFileDelete") {
          SyncFileDelete(data.data, this.Plugin)
        }
      }
    }
  }
}

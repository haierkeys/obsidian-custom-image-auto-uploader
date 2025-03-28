import { Notice, moment } from "obsidian";

import { syncReceiveMethodHandlers, SyncAllFiles } from "./fs";
import { dump, sleep } from "./helps";
import BetterSync from "../main";


export class WebSocketClient {
  private ws: WebSocket
  private wsApi: string
  private plugin: BetterSync
  public wsIsOpen: boolean = false
  public checkConnection: any
  public checkReConnectTimeout: any
  public timeConnect = 0

  private isRegister: boolean = false
  constructor(plugin: BetterSync) {
    this.plugin = plugin
    this.wsApi = plugin.settings.wsApi
  }

  public isConnected(): boolean {
    return this.wsIsOpen
  }
  public register() {
    if (!this.ws || this.ws.readyState !== WebSocket.OPEN) {
      this.isRegister = true
      this.ws = new WebSocket(this.plugin.settings.wsApi + "/api/user/sync?lang=" + moment.locale())
      this.ws.onerror = (error) => { }
      this.ws.onopen = (e: Event): void => {
        this.timeConnect = 0
        this.wsIsOpen = true
        dump("Connected to the WebSocket server")
        this.send("Authorization", this.plugin.settings.apiToken)

        this.startHandle()
        this.receive()
        this.check()
      }
      this.ws.onclose = (e) => {
        this.wsIsOpen = false
        clearInterval(this.checkConnection)
        if (this.isRegister) {
          this.checkReConnect()
        }
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


  //ddd
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
  public startHandle() {
    SyncAllFiles(this.plugin)
  }
  public check() {
    // 检查 WebSocket 连接是否打开
    this.checkConnection = setInterval(() => {
      if (this.ws && this.ws.readyState === WebSocket.OPEN) {
        this.wsIsOpen = true
      } else {
        this.wsIsOpen = false
      }
    }, 3000)
  }
  public async send(action: string, data: any, type: string = "text") {
    // 循环检查 WebSocket 连接是否打开
    while (this.ws.readyState !== WebSocket.OPEN) {
      if (!this.isRegister) {
        return
      }
      dump("WebSocket 连接未连通，发送等待...")
      await sleep(5000) // 每隔一秒重试一次
    }

    while (this.plugin.isSyncAllFilesInProgress == true) {
      if (!this.isRegister) {
        return
      }
      dump("正在进行所有笔记同步任务,同步任务延后发送...")
      await sleep(6000) // 每隔一秒重试一次
    }

    if (type == "text") {
      this.ws.send(action + "|" + data)
    } else if (type == "json") {
      this.ws.send(action + "|" + JSON.stringify(data))
    }
    //
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
      dump(data)
      if (data.code == 0 || data.code > 100) {
        new Notice("API Error:" + data.msg)
      } else {
        const handler = syncReceiveMethodHandlers.get(msgAction)

        if (handler) {
          handler(data.data, this.plugin)
        }
      }
    }
  }
}

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
      this.ws.onerror = (error) => {}
      this.ws.onopen = (e: Event): void => {
        this.timeConnect = 0
        this.wsIsOpen = true
        dump("Service Connected")
        this.Send("Authorization", this.plugin.settings.apiToken)
        dump("Service Authorization")
        this.StartHandle()
        this.OnlineStatusCheck()
      }
      this.ws.onclose = (e) => {
        this.wsIsOpen = false
        clearInterval(this.checkConnection)
        if (this.isRegister) {
          this.checkReConnect()
        }
        dump("Service Close")
      }
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
          new Notice("Service Error: Code=" + data.code + " Msg=" + data.msg + data.details)
        } else {
          const handler = syncReceiveMethodHandlers.get(msgAction)

          if (handler) {
            handler(data.data, this.plugin)
          }
        }
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
    dump("Service unRegister")
  }

  //ddd
  public checkReConnect() {
    clearTimeout(this.checkReConnectTimeout)
    if (this.timeConnect > 15) {
      return
    }
    if (this.ws && this.ws.readyState === WebSocket.CLOSED) {
      this.timeConnect++
      this.checkReConnectTimeout = setTimeout(() => {
        dump("Service waiting reConnect : " + this.timeConnect)
        this.register()
      }, 3000 * this.timeConnect)
    }
  }
  public StartHandle() {
    SyncAllFiles(this.plugin)
  }

  public OnlineStatusCheck() {
    // 检查 WebSocket 连接是否打开
    this.checkConnection = setInterval(() => {
      if (this.ws && this.ws.readyState === WebSocket.OPEN) {
        this.wsIsOpen = true
      } else {
        this.wsIsOpen = false
      }
    }, 3000)
  }

  public async MsgSend(action: string, data: any, type: string = "text") {
    // 循环检查 WebSocket 连接是否打开
    while (this.ws.readyState !== WebSocket.OPEN) {
      if (!this.isRegister) return
      dump("Service Not Connected，MsgSend Waiting...")
      await sleep(5000) // 每隔一秒重试一次
    }
    // 检查是否有同步任务正在进行中
    while (this.plugin.isSyncAllFilesInProgress == true) {
      if (!this.isRegister) {
        return
      }
      dump("Sync Task InProgress, MsgSend Waiting...")
      await sleep(5000) // 每隔一秒重试一次
    }
    this.Send(action, data, type)
  }

  public async Send(action: string, data: any, type: string = "text") {
    if (type == "text") {
      this.ws.send(action + "|" + data)
    } else if (type == "json") {
      this.ws.send(action + "|" + JSON.stringify(data))
    }
  }
}

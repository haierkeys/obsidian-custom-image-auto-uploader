import { TFile, Vault, Notice, Plugin } from "obsidian"
import { fileTypeFromBuffer, FileTypeResult } from "file-type"
import BetterSync from "./main"
import { UploadSet } from "./setting"
import sq from 'src/lang/locale/sq';

export interface ImageDownResult {
  err: boolean
  msg: string
  path?: string
  type?: FileTypeResult
}

export interface ImageUploadResult {
  err: boolean
  msg: string
  imageUrl?: string
  apiError?: string
}

/**
 * 从给定的路径中提取目录名
 * @param path - 包含文件名的路径
 * @returns 路径中的目录名部分
 */
export function getDirname(path: string): string {
  let folderList = path.split("/")
  folderList.pop()
  return folderList.join("/")
}

/**
 * 检查并创建文件夹
 * @param path - 文件夹路径
 * @param vault - Vault实例
 */
export async function checkCreateFolder(path: string, vault: Vault) {
  if (path != "" && !vault.getFolderByPath(path)) {
    vault.createFolder(path)
  }
}

/**
 * 获取附件保存路径
 * @param file - 文件名
 * @param plugin - 插件实例
 * @returns 附件保存路径
 */
export async function getAttachmentSavePath(file: string, plugin: BetterSync): Promise<string> {
  return await plugin.app.fileManager.getAvailablePathForAttachment(file)
}

/**
 * 获取附件上传路径
 * @param image - 图片名
 * @param plugin - 插件实例
 * @returns 附件上传路径
 */
export async function getAttachmentUploadPath(image: string, plugin: BetterSync): Promise<TFile | null> {
  return plugin.app.metadataCache.getFirstLinkpathDest(image, image)
}

export class WebSocketClient {
  private ws: WebSocket
  private wsApi: string
  private Plugin: BetterSync
  public wsIsOpen: boolean = false
  public checkConnection: any

  constructor(plugin: BetterSync) {
    this.Plugin = plugin
    this.wsApi = plugin.settings.wsApi
  }

  public connect() {
    if (!this.ws || this.ws.readyState !== WebSocket.OPEN) {
      this.ws = new WebSocket(this.Plugin.settings.wsApi + "/api/user/sync?lang=en")
      this.ws.onopen = (e: Event): void => {
        console.log("Connected to the WebSocket server")
        this.send("Authorization", this.Plugin.settings.apiToken)
        this.Receive()
        this.check()
      }
    }
  }

  public reConnect() {
    this.close()
    this.connect()
  }

  public close() {
    this.wsIsOpen = false
    if (this.ws && this.ws.readyState === WebSocket.OPEN) {
      this.ws.close(1000, "User manually closed the connection")
    }
    clearTimeout(this.checkConnection)
  }

  public check() {
    this.checkConnection = setInterval(() => {
      if (this.ws && this.ws.readyState === WebSocket.OPEN) {
        this.wsIsOpen = true
        clearTimeout(this.checkConnection)
        console.log("WebSocket connection is open.")
      }
    }, 3000)
  }

  public isConnected(): boolean {
    return this.wsIsOpen
  }

  public async send(action: string, data: any, type: string = "text") {
    // 循环检查 WebSocket 连接是否打开
    while (this.ws.readyState !== WebSocket.OPEN) {
      console.log("WebSocket 连接未打开，等待重试...")
      await this.sleep(1000) // 每隔一秒重试一次
    }
    if (type == "text") {
      this.ws.send(action + "|" + data)
    } else if (type == "json") {
      this.ws.send(action + "|" + JSON.stringify(data))
    }
  }

  public sleep(ms: number): Promise<void> {
    return new Promise((resolve) => setTimeout(resolve, ms))
  }

  public Receive() {
    this.ws.onmessage = (event) => {
      const data = JSON.parse(event.data)
      console.log(`Received message:`, data)
    }
    this.ws.onerror = (error) => {
      console.error("WebSocket error:", error)
    }
    this.ws.onclose = () => {
      this.wsIsOpen = false
      clearTimeout(this.checkConnection)
      console.log("Disconnected from the WebSocket server")
    }
  }
}
 function hashContent(content: string) {
    // 使用简单的哈希函数生成哈希值
    let hash = 0;
    for (let i = 0; i < content.length; i++) {
      const char = content.charCodeAt(i);
      hash = ((hash << 5) - hash) + char;
      hash &= hash;
    }
    return hash;
  }

/**
 *
 * @param path - 图片路径
 * @param postdata - 上传数据
 * @param plugin - 插件实例
 * @returns 上传结果
 */
export async function NoteUp(plugin: BetterSync): Promise<ImageUploadResult> {
  let response
  try {
    response = await fetch(plugin.settings.api, { method: "GET", headers: plugin.settings.apiToken == "" ? new Headers() : new Headers({ Authorization: plugin.settings.apiToken }) })
  } catch (error) {
    return { err: true, msg: "网络错误,请检查网络是否通畅" }
  }

  if (response && !response.ok) {
    let result = await response.text()
    return { err: true, msg: "网络错误,请检查网络是否通畅" }
  }

  let result = await response.json()

  if (result && !result.status) {
    return { err: true, msg: "API Error:" + result.message + result.details.join(""), apiError: result.details.join("") }
  } else {
    return { err: false, msg: result.message, imageUrl: result.data.imageUrl }
  }
}

/**
 * 上传文件
 * @param path - 图片路径
 * @param postdata - 上传数据
 * @param plugin - 插件实例
 * @returns 上传结果
 */
export async function NoteDown(file: TFile, postData: UploadSet | undefined, plugin: BetterSync): Promise<ImageUploadResult> {
  let body = await file.vault.readBinary(file)

  if (!postData) return { err: true, msg: "扩展参数为空" }

  let compressedBody = body

  let requestData = new FormData()
  requestData.append("imagefile", new Blob([compressedBody], { type: `image/${file.extension}` }), file.name)

  Object.keys(postData).forEach((v, i, p) => {
    requestData.append(v, postData[v])
  })

  let response
  try {
    response = await fetch(plugin.settings.api, { method: "POST", headers: plugin.settings.apiToken == "" ? new Headers() : new Headers({ Authorization: plugin.settings.apiToken }), body: requestData })
  } catch (error) {
    return { err: true, msg: "网络错误,请检查网络是否通畅" }
  }

  if (response && !response.ok) {
    let result = await response.text()
    return { err: true, msg: "网络错误,请检查网络是否通畅" }
  }

  let result = await response.json()

  if (result && !result.status) {
    return { err: true, msg: "API Error:" + result.message + result.details.join(""), apiError: result.details.join("") }
  } else {
    return { err: false, msg: result.message, imageUrl: result.data.imageUrl }
  }
}

/**
 * 显示错误通知
 * @param message 错误信息
 */
export function showErrorDialog(message: string): void {
  new Notice(message)
}

import { Menu, Plugin } from "obsidian";

import { imageDown, imageUpload, statusCheck, replaceInText, hasExcludeDomain, autoAddExcludeDomain, metadataCacheHandle, generateRandomString, showTaskNotice, showErrorNotice, getAttachmentUploadPath, setMenu } from "./utils";
import { SettingTab, PluginSettings, DEFAULT_SETTINGS } from "./setting";
import { DownTask, UploadTask } from "./interface";
import { $ } from "./lang";


//const mdImageRegex = /!\[([^\]]*)\][\(|\[](.*?)\s*("(?:.*[^"])")?\s*[\)|\]]|!\[\[([^\]]*)\]\]/g
// @lqllife 增加支持 ![[image.png|alt]]
const mdImageRegex = /!\[([^\]]*)\][\(|\[](.*?)\s*("(?:.*[^"])")?\s*[\)|\]]|!\[\[([^\]|]*)\|?([^\]]*)\]\]/g


export default class CustomImageAutoUploader extends Plugin {
  settingTab: SettingTab
  settings: PluginSettings
  statusBar: HTMLElement[] = []
  downloadStatus: { current: number; total: number } = { current: 0, total: 0 }
  uploadStatus: { current: number; total: number } = { current: 0, total: 0 }
  // 添加状态显示类型变量
  statusType: "download" | "upload" | "all" | "none" = "none"
  fromPluginSet = false

  /**
   * 重置任务状态并设置显示类型
   * @param type 显示类型：'download' | 'upload' | 'all' | 'none'
   * @param reset 是否重置计数，默认为 true
   */
  resetStatus(type: "download" | "upload" | "all" | "none", reset: boolean = true): void {
    // 设置显示类型
    this.statusType = type

    // 重置计数
    if (reset) {
      this.downloadStatus = { current: 0, total: 0 }
      this.uploadStatus = { current: 0, total: 0 }
    }

    // 更新状态栏显示
    statusCheck(this)
  }

  async onload() {
    await this.loadSettings()

    statusCheck(this)

    this.settingTab = new SettingTab(this.app, this)
    // 注册设置选项
    this.addSettingTab(this.settingTab);

    // 注册编译器事件
    this.registerEvent(
      this.app.workspace.on("editor-change", async () => {
        if (!this.fromPluginSet) {
          this.resetStatus("all", true)
          await this.ContentImageAutoHandle()
          await this.MetadataImageAutoHandle()
          showTaskNotice(this, "all")
        }
      })
    )

    // 注册命令
    this.addCommand({
      id: "down-all-images",
      name: $("下载全部图片"),
      callback: async () => {
        this.resetStatus("download", true)
        await this.ContentDownImage()
        await this.MetadataDownImage()
        showTaskNotice(this, "download")
      },
    })
    this.addCommand({
      id: "upload-all-images",
      name: $("上传全部图片"),
      callback: async () => {
        this.resetStatus("upload", true)
        await this.ContentUploadImage()
        await this.MetadataUploadImage()
        showTaskNotice(this, "upload")
      },
    })

    // 注册菜单
    this.registerEvent(
      this.app.workspace.on("file-menu", (menu: Menu) => {
        setMenu(menu, this)
      })
    )
    this.registerEvent(
      this.app.workspace.on("editor-menu", (menu: Menu) => {
        setMenu(menu, this)
      })
    )

    this.addRibbonIcon("image", "Custom Image Auto Uploader / " + $("Custom Image Auto Uploader"), (event) => {
      const menu = new Menu()
      setMenu(menu, this, true)
      menu.showAtMouseEvent(event)
    })
  }

  async ContentImageAutoHandle(isManual: boolean = false) {
    if (this.settings.isAutoDown || isManual) {
      await this.ContentDownImage()
    }
    if (this.settings.isAutoUpload || isManual) {
      await sleep(this.settings.afterUploadTimeout)
      await this.ContentUploadImage()
    }
  }

  async MetadataImageAutoHandle(isManual: boolean = false) {
    if (this.settings.isAutoDown || isManual) {
      await this.MetadataDownImage()
    }
    if (this.settings.isAutoUpload || isManual) {
      await sleep(this.settings.afterUploadTimeout)
      await this.MetadataUploadImage()
    }
  }

  async ContentDownImage() {
    if (!this.app.workspace.activeEditor || !this.app.workspace.activeEditor.editor) return

    let cursor = this.app.workspace.activeEditor.editor.getCursor()
    let fileFullContent = this.app.workspace.activeEditor.editor.getValue() || ""
    if (!fileFullContent) return

    let filePropertyContent = ""
    let filePropertyContentEndLine = 0
    let fileContent = ""
    const propertyMatch = fileFullContent.match(/^---\n((?:.|\n)*)---\n/gm)
    if (propertyMatch) {
      fileContent = fileFullContent.substring(propertyMatch[0].length)
      filePropertyContent = propertyMatch[0]

      const activeFile = this.app.workspace.getActiveFile()
      if (activeFile) {
        const cachedMetadata = this.app.metadataCache.getFileCache(activeFile)
        filePropertyContentEndLine = cachedMetadata?.frontmatterPosition?.end.line || 0
      }
    } else {
      fileContent = fileFullContent
    }

    // 第一次循环：收集任务并统计数量
    const downloadTasks: DownTask[] = []

    const matches = fileContent.matchAll(mdImageRegex)
    for (const match of matches) {
      if (!/^http/.test(match[2]) || hasExcludeDomain(match[2], this.settings.excludeDomains)) {
        continue
      }

      let imageAlt = match[3] ? match[3] : match[1] ? match[1] : match[5] ? match[5] : ""
      imageAlt = imageAlt.replaceAll('"', "")
      downloadTasks.push({
        matchText: match[0],
        imageAlt,
        imageUrl: match[2],
      })

      this.downloadStatus.total++
      statusCheck(this)
    }

    // 第二次循环：批量异步处理任务
    let isModify = false
    const downloadResults = await Promise.all(
      downloadTasks.map(async (task) => {
        const result = await imageDown(task.imageUrl, this)
        return { task, result }
      })
    )
    // 处理下载结果
    for (const { task, result } of downloadResults) {
      if (result.err) {
        showErrorNotice(result.msg)
      } else if (result.path) {
        isModify = true
        this.downloadStatus.current++
        statusCheck(this)
        fileContent = replaceInText(fileContent, task.matchText, task.imageAlt, result.path, task.imageUrl)
      }
    }

    if (isModify) {
      this.fromPluginSet = true

      this.app.workspace.activeEditor?.editor?.setValue(filePropertyContent + fileContent)
      await this.app.workspace.activeEditor?.editor?.setCursor({ line: cursor.line - filePropertyContentEndLine, ch: 0 })

      this.fromPluginSet = false
    }
  }

  async ContentUploadImage() {
    if (!this.app.workspace.activeEditor || !this.app.workspace.activeEditor.editor) return

    let cursor = this.app.workspace.activeEditor.editor.getCursor()

    let fileFullContent = this.app.workspace.activeEditor.editor.getValue() || ""
    if (!fileFullContent) return

    let filePropertyContent = ""
    let fileContent = ""
    const propertyMatch = fileFullContent.match(/^---\n((?:.|\n)*)---\n/gm)
    if (propertyMatch) {
      fileContent = fileFullContent.substring(propertyMatch[0].length)
      filePropertyContent = propertyMatch[0]
    } else {
      fileContent = fileFullContent
    }

    const uploadTasks: UploadTask[] = []
    const matches = fileContent.matchAll(mdImageRegex)
    for (const match of matches) {
      if (/^http/.test(match[2]) || /^http/.test(match[4])) {
        continue
      }

      const file = match[2] ? match[2] : match[4]
      let readfile = await getAttachmentUploadPath(file, this)
      if (!readfile) continue

      const imageAlt = match[3] ? match[3] : match[1] ? match[1] : match[5] ? match[5] : file
      uploadTasks.push({
        matchText: match[0],
        imageAlt,
        imageFile: readfile,
      })
      this.uploadStatus.total++
      statusCheck(this)
    }

    // 第二次循环：批量异步处理任务
    let isModify = false
    const uploadResults = await Promise.all(
      uploadTasks.map(async (task) => {
        const result = await imageUpload(task.imageFile, this.settings.contentSet, this)
        return { task, result }
      })
    )
    // 处理上传结果
    for (const { task, result } of uploadResults) {
      if (result.err) {
        showErrorNotice(result.msg)
      } else if (result.imageUrl) {
        isModify = true
        this.uploadStatus.current++
        statusCheck(this)

        const searchStr = this.settings.uploadImageRandomSearch ? `?${generateRandomString(10)}` : ""
        fileContent = replaceInText(fileContent, task.matchText, task.imageAlt, result.imageUrl + searchStr)
        autoAddExcludeDomain(result.imageUrl, this)
      }
    }

    if (isModify) {
      this.fromPluginSet = true

      this.app.workspace.activeEditor?.editor?.setValue(filePropertyContent + fileContent)
      await this.app.workspace.activeEditor?.editor?.setCursor(cursor)

      this.fromPluginSet = false
    }
  }

  /**
   * 处理当前活动文件中的元数据图片下载任务
   * @param isWorkspace - 是否处理工作区中的所有文件，默认为 false
   */
  async MetadataDownImage() {
    if (this.settings.propertyNeedSets.length === 0) {
      return
    }
    const activeFile = this.app.workspace.getActiveFile()
    if (!activeFile) return

    const cachedMetadata = this.app.metadataCache.getFileCache(activeFile)
    if (!cachedMetadata) return

    // 第一次循环：收集任务并统计数量
    const downloadTasks: DownTask[] = []
    const metadata = metadataCacheHandle(cachedMetadata, this)
    for (const item of metadata) {
      for (const pic of item.value) {
        if (!/^http/.test(pic) || hasExcludeDomain(pic, this.settings.excludeDomains)) {
          continue
        }
        downloadTasks.push({
          matchText: pic,
          imageAlt: "",
          imageUrl: pic,
          metadataItem: item,
        })
        this.downloadStatus.total++
        statusCheck(this)
      }
    }

    // 第二次循环：批量异步处理任务
    let isModify = false
    const downloadResults = await Promise.all(
      downloadTasks.map(async (task) => {
        const result = await imageDown(task.imageUrl, this)
        return { task, result }
      })
    )

    // 处理下载结果
    for (const { task, result } of downloadResults) {
      if (result.err) {
        showErrorNotice(result.msg)
      } else if (result.path && task.metadataItem) {
        isModify = true
        this.downloadStatus.current++
        statusCheck(this)
        const index = task.metadataItem.value.indexOf(task.matchText)
        if (index !== -1) {
          task.metadataItem.value[index] = result.path
        }
      }
    }

    if (isModify) {
      this.fromPluginSet = true
      await this.app.fileManager.processFrontMatter(activeFile, (frontmatter) => {
        for (const item of metadata) {
          frontmatter[item.key] = item.type === "string" ? item.value[0] : item.value
        }
      })
      setTimeout(() => {
        this.fromPluginSet = false
      }, 1000)
    }
  }

  async MetadataUploadImage() {
    if (this.settings.propertyNeedSets.length === 0) {
      return
    }
    const activeFile = this.app.workspace.getActiveFile()
    if (!activeFile) return

    const cachedMetadata = this.app.metadataCache.getFileCache(activeFile)
    if (!cachedMetadata) return

    // 第一次循环：收集任务并统计数量
    const uploadTasks: UploadTask[] = []
    const metadata = metadataCacheHandle(cachedMetadata, this)
    for (const item of metadata) {
      for (const pic of item.value) {
        if (/^http/.test(pic)) {
          continue
        }
        let readfile = await getAttachmentUploadPath(pic, this)
        if (!readfile) continue

        if (!item.params) continue

        uploadTasks.push({
          matchText: pic,
          imageAlt: "",
          imageFile: readfile,
          metadataItem: item,
        })

        this.uploadStatus.total++
        statusCheck(this)
      }
    }
    // 第二次循环：批量异步处理任务
    let isModify = false
    const uploadResults = await Promise.all(
      uploadTasks.map(async (task) => {
        const result = await imageUpload(task.imageFile, task.metadataItem?.params, this)
        return { task, result }
      })
    )

    // 处理上传结果
    for (const { task, result } of uploadResults) {
      if (result.err) {
        showErrorNotice(result.msg)
      } else if (result.imageUrl && task.metadataItem) {
        isModify = true
        this.uploadStatus.current++
        statusCheck(this)
        const searchStr = this.settings.uploadImageRandomSearch ? `?${generateRandomString(10)}` : ""
        const index = task.metadataItem.value.indexOf(task.matchText)
        if (index !== -1) {
          task.metadataItem.value[index] = result.imageUrl + searchStr
        }
      }
    }

    if (isModify) {
      this.fromPluginSet = true
      await this.app.fileManager.processFrontMatter(activeFile, (frontmatter) => {
        for (const item of metadata) {
          frontmatter[item.key] = item.type === "string" ? item.value[0] : item.value
        }
      })
      setTimeout(() => {
        this.fromPluginSet = false
      }, 1000)
    }
  }

  onunload() {}

  async loadSettings() {
    this.settings = Object.assign({}, DEFAULT_SETTINGS, await this.loadData())
  }

  async saveSettings(isStatusCheck: boolean = true) {
    await this.saveData(this.settings)
    if (isStatusCheck) {
      this.resetStatus("none")
    }
  }
}

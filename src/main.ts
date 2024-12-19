import { Menu, MenuItem, TFile, Plugin, Notice } from "obsidian"
import { SettingTab, PluginSettings, DEFAULT_SETTINGS } from "./setting"
import { imageDown, imageUpload, statusCheck, replaceInText, hasExcludeDomain, autoAddExcludeDomain, metadataCacheHandle, generateRandomString } from "./utils"
import { $ } from "./lang"

const mdImageRegex = /!\[([^\]]*)\][\(|\[](.*?)\s*("(?:.*[^"])")?\s*[\)|\]]|!\[\[([^\]]*)\]\]/g

export default class CustomImageAutoUploader extends Plugin {
  settings: PluginSettings
  statusBar: any

  async onload() {
    await this.loadSettings()
    this.statusBar = this.addStatusBarItem()
    statusCheck(this)

    // 注册设置选项
    this.addSettingTab(new SettingTab(this.app, this))

    // 注册命令
    this.addCommand({
      id: "down-all-images",
      name: $("下载全部图片"),
      callback: async () => {
        await this.ContentDownImage()
        await this.MetadataDownImage()
      },
    })
    this.addCommand({
      id: "upload-all-images",
      name: $("上传全部图片"),
      callback: async () => {
        await this.ContentUploadImage()
        await this.MetadataUploadImage()
      },
    })

    // 注册菜单
    this.registerEvent(
      this.app.workspace.on("file-menu", (menu: Menu, file: TFile) => {
        menu.addItem((item: MenuItem) => {
          item
            .setIcon("download")
            .setTitle($("下载全部图片"))
            .onClick(async () => {
              await this.ContentDownImage()
              await this.MetadataDownImage()
            })
        })
        menu.addItem((item: MenuItem) => {
          item
            .setIcon("upload")
            .setTitle($("上传全部图片"))
            .onClick(async () => {
              await this.ContentUploadImage()
              await this.MetadataUploadImage()
            })
        })
      })
    )

    // 注册编译器事件
    this.registerEvent(
      this.app.workspace.on("editor-change", async () => {
        await this.ContentImageAutoHandle(true)
        await this.MetadataImageAutoHandle(true)
      })
    )
  }

  async ContentImageAutoHandle(isWorkspace = false) {
    if (this.settings.isAutoDown) {
      await this.ContentDownImage(true)
    }
    if (this.settings.isAutoUpload) {
      await sleep(this.settings.afterUploadTimeout)
      await this.ContentUploadImage(true)
    }
  }

  async MetadataImageAutoHandle(isWorkspace = false) {
    if (this.settings.isAutoDown) {
      await this.MetadataDownImage(true)
    }
    if (this.settings.isAutoUpload) {
      await sleep(this.settings.afterUploadTimeout)
      await this.MetadataUploadImage(true)
    }
  }

  async ContentDownImage(isWorkspace = false) {
    const cursor = this.app.workspace.activeEditor?.editor?.getCursor()
    let fileFullContent = ""
    let filePropertyContent = ""
    let fileContent = ""
    const activeFile = this.app.workspace.getActiveFile()

    if (this.app.workspace.activeEditor) {
      isWorkspace = true
    }

    if (isWorkspace) {
      fileFullContent = this.app.workspace.activeEditor?.editor?.getValue() || ""
    } else if (activeFile instanceof TFile) {
      fileFullContent = await this.app.vault.read(activeFile)
    }

    if (!fileFullContent) {
      return
    }

    const propertyMatch = fileFullContent.match(/^---\n((?:.|\n)*)---\n/gm)
    if (propertyMatch) {
      fileContent = fileFullContent.substring(propertyMatch[0].length)
      filePropertyContent = propertyMatch[0]
    } else {
      fileContent = fileFullContent
    }

    let isModify = false
    let downCount = 0
    let downSussCount = 0

    const matches = fileContent.matchAll(mdImageRegex)

    for (const match of matches) {
      if (!/^http/.test(match[2]) || hasExcludeDomain(match[2], this.settings.excludeDomains)) {
        continue
      }

      downCount++

      const imgURL = match[2]
      let imageAlt = match[3] ? match[3] : match[1] ? match[1] : ""
      imageAlt = imageAlt.replaceAll('"', "")

      const result = await imageDown(imgURL, this)
      if (result.err) {
        new Notice(result.msg)
      } else {
        isModify = true
        downSussCount++
        fileContent = replaceInText(fileContent, match[0], imageAlt, result.path || "", imgURL)
      }
    }

    if (isModify) {
      if (isWorkspace) {
        this.app.workspace.activeEditor?.editor?.setValue(filePropertyContent + fileContent)
        if (cursor) {
          await this.app.workspace.activeEditor?.editor?.setCursor(cursor)
        }
      } else if (activeFile instanceof TFile) {
        await this.app.vault.modify(activeFile, filePropertyContent + fileContent)
      }
      if (!this.settings.isCloseNotice) {
        new Notice(`Down Result:\nsucceed: ${downSussCount} \nfailed: ${downCount - downSussCount}`)
      }
    }
  }

  async ContentUploadImage(isWorkspace = false) {
    const cursor = this.app.workspace.activeEditor?.editor?.getCursor()
    let fileFullContent = ""
    let filePropertyContent = ""
    let fileContent = ""
    const activeFile = this.app.workspace.getActiveFile()

    if (this.app.workspace.activeEditor) {
      isWorkspace = true
    }

    if (isWorkspace) {
      fileFullContent = this.app.workspace.activeEditor?.editor?.getValue() || ""
    } else if (activeFile instanceof TFile) {
      fileFullContent = await this.app.vault.read(activeFile)
    }

    if (!fileFullContent) {
      return
    }

    const propertyMatch = fileFullContent.match(/^---\n((?:.|\n)*)---\n/gm)
    if (propertyMatch) {
      fileContent = fileFullContent.substring(propertyMatch[0].length)
      filePropertyContent = propertyMatch[0]
    } else {
      fileContent = fileFullContent
    }

    let isModify = false
    let uploadCount = 0
    let uploadSussCount = 0

    const matches = fileContent.matchAll(mdImageRegex)

    for (const match of matches) {
      if (/^http/.test(match[2]) || /^http/.test(match[4])) {
        continue
      }

      uploadCount++

      const file = match[2] ? match[2] : match[4]
      const imageAlt = match[3] ? match[3] : match[1] ? match[1] : file

      const result = await imageUpload(file, this.settings.contentSet, this)

      if (result.err) {
        new Notice(result.msg)
      } else if (result.imageUrl) {
        isModify = true
        uploadSussCount++
        const searchStr = this.settings.uploadImageRandomSearch ? `?${generateRandomString(10)}` : ""
        fileContent = replaceInText(fileContent, match[0], imageAlt, result.imageUrl + searchStr)
        autoAddExcludeDomain(result.imageUrl, this)
      }
    }

    if (isModify) {
      if (isWorkspace) {
        this.app.workspace.activeEditor?.editor?.setValue(filePropertyContent + fileContent)
        if (cursor) {
          await this.app.workspace.activeEditor?.editor?.setCursor(cursor)
        }
      } else if (activeFile instanceof TFile) {
        await this.app.vault.modify(activeFile, filePropertyContent + fileContent)
      }

      if (!this.settings.isCloseNotice) {
        new Notice(`Upload Result:\nsucceed: ${uploadSussCount} \nfailed: ${uploadCount - uploadSussCount}`)
      }
    }
  }

  async MetadataDownImage(isWorkspace = false) {
    if (this.settings.propertyNeedSets.length === 0) {
      return
    }

    const activeFile = this.app.workspace.getActiveFile()

    if (this.app.workspace.activeEditor) {
      isWorkspace = true
    }

    if (activeFile) {
      let isModify = false
      let downCount = 0
      let downSussCount = 0

      const metadata = metadataCacheHandle(activeFile, this)
      for (const item of metadata) {
        for (let i = 0; i < item.value.length; i++) {
          const pic = item.value[i]
          if (!/^http/.test(pic) || hasExcludeDomain(pic, this.settings.excludeDomains)) {
            continue
          }

          downCount++
          const result = await imageDown(pic, this)
          if (result.err) {
            new Notice(result.msg)
          } else if (result.path) {
            item.value[i] = result.path
            isModify = true
            downSussCount++
          }
        }
      }

      if (isModify) {
        await this.app.fileManager.processFrontMatter(activeFile, (frontmatter) => {
          for (const item of metadata) {
            frontmatter[item.key] = item.type === "string" ? item.value[0] : item.value
          }
        })
        if (!this.settings.isCloseNotice) {
          new Notice(`Metadata Down Result:\nsucceed: ${downSussCount} \nfailed: ${downCount - downSussCount}`)
        }
      }
    }
  }

  async MetadataUploadImage(isWorkspace = false) {
    const activeFile = this.app.workspace.getActiveFile()

    if (this.app.workspace.activeEditor) {
      isWorkspace = true
    }

    if (activeFile) {
      let isModify = false
      let uploadCount = 0
      let uploadSussCount = 0

      const metadata = metadataCacheHandle(activeFile, this)

      for (const item of metadata) {
        for (let i = 0; i < item.value.length; i++) {
          const pic = item.value[i]
          if (/^http/.test(pic)) {
            continue
          }
          uploadCount++
          const result = await imageUpload(pic, item.params, this)
          if (result.err) {
            new Notice(result.msg)
          } else if (result.imageUrl) {
            const searchStr = this.settings.uploadImageRandomSearch ? `?${generateRandomString(10)}` : ""
            item.value[i] = result.imageUrl + searchStr
            isModify = true
            uploadSussCount++
          }
        }
      }

      if (isModify) {
        await this.app.fileManager.processFrontMatter(activeFile, (frontmatter) => {
          for (const item of metadata) {
            frontmatter[item.key] = item.type === "string" ? item.value[0] : item.value
          }
        })
        if (!this.settings.isCloseNotice) {
          new Notice(`Metadata Upload Result:\nsucceed: ${uploadSussCount} \nfailed: ${uploadCount - uploadSussCount}`)
        }
      }
    }
  }

  onunload() {}

  async loadSettings() {
    this.settings = Object.assign({}, DEFAULT_SETTINGS, await this.loadData())
  }

  async saveSettings() {
    await this.saveData(this.settings)
    statusCheck(this)
  }
}

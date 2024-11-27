import {
  App,
  Editor,
  Menu,
  MenuItem,
  TFile,
  Plugin,
  FileSystemAdapter,
  Notice,
} from "obsidian";
import { SettingTab, PluginSettings, DEFAULT_SETTINGS } from "./setting";
import {
  imageDown,
  imageUpload,
  getFileSaveRandomName,
  checkCreateFolder,
  statusCheck,
  dump,
  replaceInText,
  hasExcludeDomain,
  autoAddExcludeDomain,
} from "./utils";

const mdImageRegex =
  /!\[([^\]]*)\]\((.*?)\s*("(?:.*[^"])")?\s*\)|!\[\[([^\]]*)\]\]/g;

export default class CustomImageAutoUploader extends Plugin {
  settings: PluginSettings;
  statusBar: any;

  basePath = function () {
    return this.app.vault.adapter instanceof FileSystemAdapter
      ? this.app.vault.adapter.getBasePath()
      : "";
  };

  onload = async () => {
    await this.loadSettings();

    this.statusBar = this.addStatusBarItem();

    statusCheck(this);

    this.addCommand({
      id: "down-all-images",
      name: "下载全部图片",
      callback: this.downImage,
    });

    //注册笔记菜单
    this.registerEvent(
      this.app.workspace.on("file-menu", (menu: Menu, file: TFile) => {
        menu.addItem((item: MenuItem) => {
          item
            .setIcon("download")
            .setTitle("下载全部图片")
            .onClick((e) => {
              this.downImage();
            });
        });
      })
    );

    this.addCommand({
      id: "upload-all-images",
      name: "上传全部图片",
      callback: this.uploadImage,
    });

    //注册笔记菜单
    this.registerEvent(
      this.app.workspace.on("file-menu", (menu: Menu, file: TFile) => {
        menu.addItem((item: MenuItem) => {
          item
            .setIcon("upload")
            .setTitle("上传全部图片")
            .onClick((e) => {
              this.uploadImage();
            });
        });
      })
    );

    this.addSettingTab(new SettingTab(this.app, this));

    this.registerEvent(
      this.app.workspace.on(
        "editor-change",
        async function () {
          if (this.settings.isAutoDown) {
            await this.downImage(true);
          }
        }.bind(this)
      )
    );

    // ![这是图片](https://markdown.com.cn/assets/img/philly-magic-garden.9c0b4415.jpg "Magic Gardens")
    // ![这是图片](https://markdown.com.cn/assets/img/philly-magic-garden.9c0b4415.jpg)
  };

  downImage = async (isWorkspace = false) => {
    //   let dir = await this.app.fileManager.getAvailablePathForAttachment("todo.png");

    let fileContent = "";
    let activeFile = this.app.workspace.getActiveFile();

    if (this.app.workspace.activeEditor) {
      isWorkspace = true;
    }

    if (isWorkspace) {
      fileContent = <string>this.app.workspace.activeEditor?.editor?.getValue();
    } else if (activeFile instanceof TFile) {
      fileContent = await this.app.vault.read(activeFile);
    }

    let isModify = false;
    let downCount = 0;
    let downSussCount = 0;

    const matches: IterableIterator<RegExpMatchArray> =
      fileContent.matchAll(mdImageRegex);

    const nameSet = new Set();
    for (const match of matches) {
      if (!/^http/.test(match[2])) {
        continue;
      }

      if (hasExcludeDomain(match[2], this.settings.excludeDomains)) {
        continue;
      }

      downCount++;

      let imgURL = match[2];
      let imageSaveName = getFileSaveRandomName(nameSet);
      let imageSaveKey =
        (this.settings.saveDir ? this.settings.saveDir + "/" : "") +
        imageSaveName;
      let imageAlt = match[3] ? match[3] : match[1] ? match[1] : "";
      imageAlt = imageAlt.replaceAll('"', "");

      let result = await imageDown(imgURL, imageSaveKey, this);
      if (result.err) {
        new Notice(result.msg);
      } else {
        isModify = true;
        downSussCount++;
        fileContent = replaceInText(
          fileContent,
          match[0],
          imageAlt,
          result.path ? result.path : "",
          imgURL
        );
      }
    }

    if (isModify) {
      if (isWorkspace) {
        this.app.workspace.activeEditor?.editor?.setValue(fileContent);
      } else if (activeFile instanceof TFile) {
        this.app.vault.modify(activeFile, fileContent);
      }
      if (this.settings.isNotice) {
        new Notice(
          `Down Result:\nsucceed: ${downSussCount} \nfailed: ${
            downCount - downSussCount
          }`
        );
      }
    }

    if (this.settings.isAutoUpload) {
      // 需要等待500 毫秒
      sleep(this.settings.afterUploadTimeout).then(() => {
        this.uploadImage(isWorkspace);
      });
    }
  };

  uploadImage = async (isWorkspace = false) => {
    let fileContent = "";
    let activeFile = this.app.workspace.getActiveFile();

    if (this.app.workspace.activeEditor) {
      isWorkspace = true;
    }

    if (isWorkspace) {
      fileContent = <string>this.app.workspace.activeEditor?.editor?.getValue();
    } else if (activeFile instanceof TFile) {
      fileContent = await this.app.vault.cachedRead(activeFile);
    }

    let isModify = false;
    let uploadCount = 0;
    let uploadSussCount = 0;

    const matches: IterableIterator<RegExpMatchArray> =
      fileContent.matchAll(mdImageRegex);

    for (const match of matches) {
      if (/^http/.test(match[2]) || /^http/.test(match[4])) {
        continue;
      }

      uploadCount++;

      let file = match[2] ? match[2] : match[4];
      let imageAlt = match[3] ? match[3] : match[1] ? match[1] : file;

      let result = await imageUpload(file, this);

      if (result.err) {
        new Notice(result.msg);
      } else if (result.imageUrl) {
        isModify = true;
        uploadSussCount++;
        fileContent = replaceInText(
          fileContent,
          match[0],
          imageAlt,
          result.imageUrl
        );
        autoAddExcludeDomain(result.imageUrl, this);
      }
    }

    if (isModify) {
      if (isWorkspace) {
        this.app.workspace.activeEditor?.editor?.setValue(fileContent);
      } else if (activeFile instanceof TFile) {
        this.app.vault.modify(activeFile, fileContent);
      }

      if (this.settings.isNotice) {
        new Notice(
          `Upload Result:\nsucceed: ${uploadSussCount} \nfailed: ${
            uploadCount - uploadSussCount
          }`
        );
      }
    }
  };
  onunload() {}

  loadSettings = async () => {
    this.settings = Object.assign({}, DEFAULT_SETTINGS, await this.loadData());
  };

  saveSettings = async () => {
    await this.saveData(this.settings);
    statusCheck(this);
  };
}

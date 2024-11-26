import {
  App,
  Editor,
  Menu,
  MenuItem,
  TFile,
  Plugin,
  FileSystemAdapter,
  requestUrl,
} from "obsidian";
import { SettingTab, PluginSettings, DEFAULT_SETTINGS } from "./setting";
import {
  imageDown,
  getFileSaveName,
  checkCreateFolder,
  statusCheck,
  dump,
  replaceInText,
} from "./utils";
import { debug } from "console";

// Remember to rename these classes and interfaces!

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

    // this.addCommand({
    //   id: "download-images",
    //   name: "download images",
    //   callback: this.processActivePage(false),
    // });

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
            .setIcon("arrow-down-to-line")
            .setTitle("下载全部图片")
            .onClick((e) => {
              this.downImage();
            });
        });
      })
    );
    this.addSettingTab(new SettingTab(this.app, this));

    this.registerEvent(
      this.app.workspace.on(
        "editor-change",
        async function () {

          console.log(this.settings);
          if (this.settings.isAutoDown) {
             console.log(this.settings);
             await this.downImage(true);
          }
        }.bind(this)
      )
    );

    //  this.registerEvent(
    //    this.app.workspace.on(
    //      "editor-change",
    //      function () {
    //        this.downImage();
    //      }.bind(this)
    //    )
    //  );

    // this.app.workspace.on("editor-change", function () {
    //   this.app.this.downImage();
    // });

    // ![这是图片](https://markdown.com.cn/assets/img/philly-magic-garden.9c0b4415.jpg "Magic Gardens")
    // ![这是图片](https://markdown.com.cn/assets/img/philly-magic-garden.9c0b4415.jpg)
  };

  downImage = async (isWorkspace = false) => {
    checkCreateFolder(this.settings.saveDir, this.app.vault);

    let fileContent = "";
    let activeFile = this.app.workspace.getActiveFile();

    if (this.app.workspace.activeEditor) {
      isWorkspace = true;
    }

    console.log("isWorkspace", isWorkspace);

    if (!isWorkspace) {
      if (activeFile instanceof TFile) {
        fileContent = await this.app.vault.read(activeFile);
      }
    } else {
      fileContent = <string>this.app.workspace.activeEditor?.editor?.getValue();
    }

    // workspace.activeEditor;
    //fileContent = <string>this.app.workspace.activeEditor?.editor?.getValue();

    let isModify = false;

    const mdImageRegex = /!\[[^\]]*\]\((.*?)\s*("(?:.*[^"])")?\s*\)/g;

    const matches: IterableIterator<RegExpMatchArray> =
      fileContent.matchAll(mdImageRegex);

    const nameSet = new Set();
    for (const match of matches) {
      if (!/^http/.test(match[1])) {
        continue;
      }
      console.log(match[0]);

      let imgURL = match[1];
      let imageSaveName = getFileSaveName(nameSet);
      let imageSaveKey =
        (this.settings.saveDir ? this.settings.saveDir + "/" : "") +
        imageSaveName;
      let imageAlt = match[2] ? match[2] : "";
      imageAlt= imageAlt.replaceAll('"','');



      let result = await imageDown(imgURL, imageSaveKey, this);

      if (!result.err) {
        isModify = true;
        fileContent = replaceInText(
          fileContent,
          match[0],
          imgURL,
          result.path ? result.path : "",
          imageAlt
        );
      }
    }

    if (isModify) {
      if (!isWorkspace) {
        if (activeFile instanceof TFile) {
          this.app.vault.modify(activeFile, fileContent);
        }
      }
      // workspace.activeEditor
      else {
        this.app.workspace.activeEditor?.editor?.setValue(fileContent);
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

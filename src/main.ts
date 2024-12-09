import { Menu, MenuItem, TFile, Plugin, moment, Notice } from "obsidian";
import { SettingTab, PluginSettings, DEFAULT_SETTINGS } from "./setting";
import { imageDown, imageUpload, getFileSaveRandomName, statusCheck, replaceInText, hasExcludeDomain, autoAddExcludeDomain, metadataCacheHandle } from "./utils";
import { $ } from "./lang";

const mdImageRegex =
  /!\[([^\]]*)\][\(|\[](.*?)\s*("(?:.*[^"])")?\s*[\)|\]]|!\[\[([^\]]*)\]\]/g;

export default class CustomImageAutoUploader extends Plugin {
  settings: PluginSettings;
  statusBar: any;

  onload = async () => {
    await this.loadSettings();

    this.statusBar = this.addStatusBarItem();
    statusCheck(this);

    //注册设置选项
    this.addSettingTab(new SettingTab(this.app, this));

    //注册命令
    this.addCommand({
      id: "down-all-images",
      name: $("下载全部图片"),
      callback: function () {
        this.ContentDownImage(), this.MetadataDownImage();
      },
    });
    this.addCommand({
      id: "upload-all-images",
      name: $("上传全部图片"),
      callback: function () {
        this.ContentUploadImage(), this.MetadataUploadImage();
      },
    });

    //注册菜单
    this.registerEvent(
      this.app.workspace.on("file-menu", (menu: Menu, file: TFile) => {
        menu.addItem((item: MenuItem) => {
          item
            .setIcon("download")
            .setTitle($("下载全部图片"))
            .onClick((e) => {
              this.ContentDownImage(), this.MetadataDownImage();
            });
        });
        menu.addItem((item: MenuItem) => {
          item
            .setIcon("upload")
            .setTitle($("上传全部图片"))
            .onClick((e) => {
              this.ContentUploadImage(), this.MetadataUploadImage();
            });
        });
      })
    );

    //注册编译器事件
    this.registerEvent(
      this.app.workspace.on(
        "editor-change",
        async function () {
          this.ContentImageAutoHandle(true);
          this.MetadataImageAutoHandle(true);
        }.bind(this)
      )
    );
  };

  ContentImageAutoHandle = async (isWorkspace = false) => {
    if (this.settings.isAutoDown) {
      await this.ContentDownImage(true);
    }
    if (this.settings.isAutoUpload) {
      sleep(this.settings.afterUploadTimeout).then(() => {
        this.ContentUploadImage(true);
      });
    }
  };

  MetadataImageAutoHandle = async (isWorkspace = false) => {
    if (this.settings.isAutoDown) {
      await this.MetadataDownImage(true);
    }
    if (this.settings.isAutoUpload) {
      sleep(this.settings.afterUploadTimeout).then(() => {
        this.ContentUploadImage(true);
      });
    }
  };

  //下载
  ContentDownImage = async (isWorkspace = false) => {
    let cursor = this.app.workspace.activeEditor?.editor?.getCursor();
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

    const matches: IterableIterator<RegExpMatchArray> = fileContent.matchAll(mdImageRegex);

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
      let imageSaveKey = (this.settings.saveDir ? this.settings.saveDir + "/" : "") + imageSaveName;
      let imageAlt = match[3] ? match[3] : match[1] ? match[1] : "";
      imageAlt = imageAlt.replaceAll('"', "");

      let result = await imageDown(imgURL, imageSaveKey, this);
      if (result.err) {
        new Notice(result.msg);
      } else {
        isModify = true;
        downSussCount++;
        fileContent = replaceInText(fileContent, match[0], imageAlt, result.path ? result.path : "", imgURL);
      }
    }

    if (isModify) {
      if (isWorkspace) {
        this.app.workspace.activeEditor?.editor?.setValue(fileContent);
        if (cursor) {
          this.app.workspace.activeEditor?.editor?.setCursor(cursor);
        }
      } else if (activeFile instanceof TFile) {
        this.app.vault.modify(activeFile, fileContent);
      }
      if (!this.settings.isCloseNotice) {
        new Notice(`Down Result:\nsucceed: ${downSussCount} \nfailed: ${downCount - downSussCount}`);
      }
    }
  };

  //上传部分
  ContentUploadImage = async (isWorkspace = false) => {
    let cursor = this.app.workspace.activeEditor?.editor?.getCursor();
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

    const matches: IterableIterator<RegExpMatchArray> = fileContent.matchAll(mdImageRegex);

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
        fileContent = replaceInText(fileContent, match[0], imageAlt, result.imageUrl);
        autoAddExcludeDomain(result.imageUrl, this);
      }
    }

    if (isModify) {
      if (isWorkspace) {
        this.app.workspace.activeEditor?.editor?.setValue(fileContent);
        if (cursor) {
          this.app.workspace.activeEditor?.editor?.setCursor(cursor);
        }
      } else if (activeFile instanceof TFile) {
        this.app.vault.modify(activeFile, fileContent);
      }

      if (!this.settings.isCloseNotice) {
        new Notice(`Upload Result:\nsucceed: ${uploadSussCount} \nfailed: ${uploadCount - uploadSussCount}`);
      }
    }
  };

  //下载
  MetadataDownImage = async (isWorkspace = false) => {
    console.log(this.settings);

    if (this.settings.metadataUploadSets.length == 0) {
      return;
    }

    const nameSet = new Set();
    let cursor = this.app.workspace.activeEditor?.editor?.getCursor();
    let fileContent = "";
    let activeFile = this.app.workspace.getActiveFile();

    if (this.app.workspace.activeEditor) {
      isWorkspace = true;
    }

    if (!activeFile) {
      return;
    } else {
      let isModify = false;
      let downCount = 0;
      let downSussCount = 0;

      const metadata = metadataCacheHandle(activeFile, this);

      for (const item of metadata) {
        for (const pic of item.value) {
          if ((/^http/.test(pic) || /^https/.test(pic)) && !hasExcludeDomain(pic, this.settings.excludeDomains)) {
            let imageSaveName = getFileSaveRandomName(nameSet);
            let imageSaveKey = (this.settings.saveDir ? this.settings.saveDir + "/" : "") + imageSaveName;
            let result = await imageDown(pic, imageSaveKey, this);
            if (result.err) {
              new Notice(result.msg);
            } else {
              isModify = true;
              downSussCount++;
            }
          }
        }
      }
    }
  };

  //上传部分
  MetadataUploadImage = async (isWorkspace = false) => {
    let cursor = this.app.workspace.activeEditor?.editor?.getCursor();
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

    const matches: IterableIterator<RegExpMatchArray> = fileContent.matchAll(mdImageRegex);

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
        fileContent = replaceInText(fileContent, match[0], imageAlt, result.imageUrl);
        autoAddExcludeDomain(result.imageUrl, this);
      }
    }

    if (isModify) {
      if (isWorkspace) {
        this.app.workspace.activeEditor?.editor?.setValue(fileContent);
        if (cursor) {
          this.app.workspace.activeEditor?.editor?.setCursor(cursor);
        }
      } else if (activeFile instanceof TFile) {
        this.app.vault.modify(activeFile, fileContent);
      }

      if (this.settings.isNotice) {
        new Notice(`Upload Result:\nsucceed: ${uploadSussCount} \nfailed: ${uploadCount - uploadSussCount}`);
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

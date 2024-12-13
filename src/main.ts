import { Menu, MenuItem, TFile, Plugin, Notice, } from "obsidian";
import { SettingTab, PluginSettings, UploadSet, DEFAULT_SETTINGS } from "./setting";
import { imageDown, imageUpload, statusCheck, replaceInText, hasExcludeDomain, autoAddExcludeDomain, metadataCacheHandle, generateRandomString } from "./utils";
import { $ } from "./lang";

const mdImageRegex = /!\[([^\]]*)\][\(|\[](.*?)\s*("(?:.*[^"])")?\s*[\)|\]]|!\[\[([^\]]*)\]\]/g;

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
      callback: async function () {
        await this.ContentDownImage(), this.MetadataDownImage();
      },
    });
    this.addCommand({
      id: "upload-all-images",
      name: $("上传全部图片"),
      callback: async function () {
        await this.ContentUploadImage(), this.MetadataUploadImage();
      },
    });

    //注册菜单
    this.registerEvent(
      this.app.workspace.on("file-menu", (menu: Menu, file: TFile) => {
        menu.addItem((item: MenuItem) => {
          item
            .setIcon("download")
            .setTitle($("下载全部图片"))
            .onClick(async (e) => {
              await this.ContentDownImage(),this.MetadataDownImage();
            });
        });
        menu.addItem((item: MenuItem) => {
          item
            .setIcon("upload")
            .setTitle($("上传全部图片"))
            .onClick(async (e) => {
              await this.ContentUploadImage(), this.MetadataUploadImage();
            });
        });
      })
    );

    //注册编译器事件
    this.registerEvent(
      this.app.workspace.on(
        "editor-change",
        async function () {
          await this.ContentImageAutoHandle(true);
          await this.MetadataImageAutoHandle(true);
        }.bind(this)
      )
    );
  };

  ContentImageAutoHandle = async (isWorkspace = false) => {
    if (this.settings.isAutoDown) {
      await this.ContentDownImage(true);
    }
    if (this.settings.isAutoUpload) {
      sleep(this.settings.afterUploadTimeout).then(async () => {
        await this.ContentUploadImage(true);
      });
    }
  };

  MetadataImageAutoHandle = async (isWorkspace = false) => {
    if (this.settings.isAutoDown) {
      await this.MetadataDownImage(true);
    }
    if (this.settings.isAutoUpload) {
      sleep(this.settings.afterUploadTimeout).then(async () => {
        await this.MetadataUploadImage(true);
      });
    }
  };

  //下载
  ContentDownImage = async (isWorkspace = false) => {
    let cursor = this.app.workspace.activeEditor?.editor?.getCursor();
    let fileFullContent = "";
    let filePropertyContent = "";
    let fileContent = "";
    let activeFile = this.app.workspace.getActiveFile();

    if (this.app.workspace.activeEditor) {
      isWorkspace = true;
    }

    if (isWorkspace) {
      fileFullContent = <string>this.app.workspace.activeEditor?.editor?.getValue();
    } else if (activeFile instanceof TFile) {
      fileFullContent = await this.app.vault.read(activeFile);
    }

    if (!fileFullContent) {
      return;
    }

    const propertyMatch = fileFullContent.match(/^---\n((?:.|\n)*)---\n/mg);
    if (propertyMatch) {
      fileContent = fileFullContent.substring(propertyMatch[0].length);
      filePropertyContent = propertyMatch[0];
    } else {
      fileContent = fileFullContent;
    }

    let isModify = false;
    let downCount = 0;
    let downSussCount = 0;

    const matches: IterableIterator<RegExpMatchArray> = fileContent.matchAll(mdImageRegex);

    for (const match of matches) {
      if (!/^http/.test(match[2]) || hasExcludeDomain(match[2], this.settings.excludeDomains)) {
        continue;
      }

      downCount++;

      let imgURL = match[2];
      let imageAlt = match[3] ? match[3] : match[1] ? match[1] : "";
      imageAlt = imageAlt.replaceAll('"', "");

      let result = await imageDown(imgURL, this);
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
        await this.app.workspace.activeEditor?.editor?.setValue(filePropertyContent + fileContent);
        if (cursor) {
          await this.app.workspace.activeEditor?.editor?.setCursor(cursor);
        }
      } else if (activeFile instanceof TFile) {
        await this.app.vault.modify(activeFile, filePropertyContent + fileContent);
      }
      if (!this.settings.isCloseNotice) {
        new Notice(`Down Result:\nsucceed: ${downSussCount} \nfailed: ${downCount - downSussCount}`);
      }
    }
  };

  //上传部分
  ContentUploadImage = async (isWorkspace = false) => {
    let cursor = this.app.workspace.activeEditor?.editor?.getCursor();
    let fileFullContent = "";
    let filePropertyContent = "";
    let fileContent = "";
    let activeFile = this.app.workspace.getActiveFile();

    if (this.app.workspace.activeEditor) {
      isWorkspace = true;
    }

    if (isWorkspace) {
      fileFullContent = <string>this.app.workspace.activeEditor?.editor?.getValue();
    } else if (activeFile instanceof TFile) {
      fileFullContent = await this.app.vault.read(activeFile);
    }

    if (!fileFullContent) {
      return;
    }
    const propertyMatch = fileFullContent.match(/^---\n((?:.|\n)*)---\n/mg);

    if (propertyMatch) {
      fileContent = fileFullContent.substring(propertyMatch[0].length);
      filePropertyContent = propertyMatch[0];
    } else {
      fileContent = fileFullContent;
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

      let result = await imageUpload(file, this.settings.contentSet, this);

      if (result.err) {
        new Notice(result.msg);
      } else if (result.imageUrl) {
        isModify = true;
        uploadSussCount++;
        let searchStr = "";
        if (this.settings.uploadImageRandomSearch) {
          searchStr = `?${generateRandomString(10)}`;
        }

        fileContent = replaceInText(fileContent, match[0], imageAlt, result.imageUrl + searchStr);
        autoAddExcludeDomain(result.imageUrl, this);
      }
    }

    if (isModify) {
      if (isWorkspace) {
        await this.app.workspace.activeEditor?.editor?.setValue(filePropertyContent + fileContent);
        if (cursor) {
          await this.app.workspace.activeEditor?.editor?.setCursor(cursor);
        }
      } else if (activeFile instanceof TFile) {
        await this.app.vault.modify(activeFile, filePropertyContent + fileContent);
      }

      if (!this.settings.isCloseNotice) {
        new Notice(`Upload Result:\nsucceed: ${uploadSussCount} \nfailed: ${uploadCount - uploadSussCount}`);
      }
    }
  };

  //下载
  MetadataDownImage = async (isWorkspace = false) => {
    if (this.settings.propertyNeedSets.length == 0) {
      return;
    }


    let activeFile = this.app.workspace.getActiveFile();

    if (this.app.workspace.activeEditor) {
      isWorkspace = true;
    }

    if (activeFile) {
      let isModify = false;
      let downCount = 0;
      let downSussCount = 0;

      const metadata = metadataCacheHandle(activeFile, this);
      for (const i in metadata) {
        const item = metadata[i];
        for (const y in item.value) {
          const pic = item.value[y];
          if (!/^http/.test(pic) || hasExcludeDomain(pic, this.settings.excludeDomains)) {
            continue;
          }

          downCount++;
          let result = await imageDown(pic, this);
          if (result.err) {
            new Notice(result.msg);
          } else {
            if (result.path) {
              metadata[i].value[y] = result.path;
              isModify = true;
              downSussCount++;
            }
          }
        }
      }

      if (isModify) {
        this.app.fileManager.processFrontMatter(activeFile, (frontmatter) => {
          for (const item of metadata) {
            if (item.type == "string") {
              frontmatter[item.key] = item.value[0];
            } else {
              frontmatter[item.key] = item.value;
            }
          }
        });
        if (!this.settings.isCloseNotice) {
          new Notice(`Metadata Down Result:\nsucceed: ${downSussCount} \nfailed: ${downCount - downSussCount}`);
        }
      }
    }
  };

  //上传部分
  MetadataUploadImage = async (isWorkspace = false) => {

    let activeFile = this.app.workspace.getActiveFile();

    if (this.app.workspace.activeEditor) {
      isWorkspace = true;
    }

    if (activeFile) {
      let isModify = false;
      let uploadCount = 0;
      let uploadSussCount = 0;

      const metadata = metadataCacheHandle(activeFile, this);

      for (const i in metadata) {
        const item = metadata[i];
        for (const y in item.value) {
          const pic = item.value[y];
          if (/^http/.test(pic)) {
            continue;
          }
          uploadCount++;
          let result = await imageUpload(pic, item.params, this);
          if (result.err) {
            new Notice(result.msg);
          } else {
            if (result.imageUrl) {
              let searchStr = "";
              if (this.settings.uploadImageRandomSearch) {
                searchStr = `?${generateRandomString(10)}`;
              }
              metadata[i].value[y] = result.imageUrl + searchStr;
              isModify = true;
              uploadSussCount++;
            }
          }
        }
      }

      if (isModify) {
        this.app.fileManager.processFrontMatter(activeFile, (frontmatter) => {
          for (const item of metadata) {
            if (item.type == "string") {
              frontmatter[item.key] = item.value[0];
            } else {
              frontmatter[item.key] = item.value;
            }
          }
        });
        if (!this.settings.isCloseNotice) {
          new Notice(`Metadata Upload Result:\nsucceed: ${uploadSussCount} \nfailed: ${uploadCount - uploadSussCount}`);
        }
      }
    }
  };

  onunload() { }

  loadSettings = async () => {
    this.settings = Object.assign({}, DEFAULT_SETTINGS, await this.loadData());
  };

  saveSettings = async () => {
    await this.saveData(this.settings);
    statusCheck(this);
  };
}

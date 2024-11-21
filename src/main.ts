import {
  MarkdownView,
  Plugin,
  FileSystemAdapter,
  Editor,
  Menu,
  MenuItem,
  TFile,
  TFolder,
  normalizePath,
  Notice,
  addIcon,
  requestUrl,
  MarkdownFileInfo,
  App,
} from "obsidian";

import { resolve, relative, join, parse, posix, basename, dirname } from "path";
import { existsSync, mkdirSync, writeFileSync, unlink } from "fs";

import fixPath from "fix-path";
import imageType from "image-type";

import {
  isAssetTypeAnImage,
  isAnImage,
  getFolderFromPath,
  getUrlAsset,
  arrayToObject,
} from "./utils";

import { RemoteUploader } from "./uploader";
import Helper, { Image } from "./helper";
import { t } from "./lang/helpers";

import { SettingTab, PluginSettings, DEFAULT_SETTINGS } from "./setting";
import { error } from "console";

interface KeyImageFiles {
  [propName: string]: Promise<ArrayBuffer>;
}

export default class autoImageRemoteUploaderPlugin extends Plugin {
  settings: PluginSettings;
  helper: Helper;
  editor: Editor;
  RemoteUploader: RemoteUploader;
  uploader: RemoteUploader;

  async loadSettings() {
    this.settings = Object.assign(DEFAULT_SETTINGS, await this.loadData());
  }

  async saveSettings() {
    await this.saveData(this.settings);
  }

  onunload() {}

  async onload() {
    await this.loadSettings();

    this.helper = new Helper(this.app);
    this.RemoteUploader = new RemoteUploader(this.settings, this);
    this.uploader = this.RemoteUploader;

    addIcon(
      "upload",
      `<svg t="1636630783429" class="icon" viewBox="0 0 100 100" version="1.1" p-id="4649" xmlns="http://www.w3.org/2000/svg">
      <path d="M 71.638 35.336 L 79.408 35.336 C 83.7 35.336 87.178 38.662 87.178 42.765 L 87.178 84.864 C 87.178 88.969 83.7 92.295 79.408 92.295 L 17.249 92.295 C 12.957 92.295 9.479 88.969 9.479 84.864 L 9.479 42.765 C 9.479 38.662 12.957 35.336 17.249 35.336 L 25.019 35.336 L 25.019 42.765 L 17.249 42.765 L 17.249 84.864 L 79.408 84.864 L 79.408 42.765 L 71.638 42.765 L 71.638 35.336 Z M 49.014 10.179 L 67.326 27.688 L 61.835 32.942 L 52.849 24.352 L 52.849 59.731 L 45.078 59.731 L 45.078 24.455 L 36.194 32.947 L 30.702 27.692 L 49.012 10.181 Z" p-id="4650" fill="#8a8a8a"></path>
    </svg>`
    );

    this.addSettingTab(new SettingTab(this.app, this));

    this.addCommand({
      id: "Upload all images",
      name: "Upload all images",
      checkCallback: (checking: boolean) => {
        let leaf = this.app.workspace.activeLeaf;
        if (leaf) {
          if (!checking) {
            this.uploadAllFile();
          }
          return true;
        }
        return false;
      },
    });
    this.addCommand({
      id: "Download all images",
      name: "Download all images",
      checkCallback: (checking: boolean) => {
        let leaf = this.app.workspace.activeLeaf;
        if (leaf) {
          if (!checking) {
            this.downloadAllImageFiles();
          }
          return true;
        }
        return false;
      },
    });

    this.setupPasteHandler();
    this.registerFileMenu();

    this.registerSelection();
  }

  registerSelection() {
    this.registerEvent(
      this.app.workspace.on(
        "editor-menu",
        (menu: Menu, editor: Editor, info: MarkdownView | MarkdownFileInfo) => {
          if (this.app.workspace.getLeavesOfType("markdown").length === 0) {
            return;
          }
          const selection = editor.getSelection();
          if (selection) {
            const markdownRegex = /!\[.*\]\((.*)\)/g;
            const markdownMatch = markdownRegex.exec(selection);
            if (markdownMatch && markdownMatch.length > 1) {
              const markdownUrl = markdownMatch[1];
              if (
                this.settings.uploadedImages.find(
                  (item: { imgUrl: string }) => item.imgUrl === markdownUrl
                )
              ) {
                this.addMenu(menu, markdownUrl, editor);
              }
            }
          }
        }
      )
    );

    const UploadAllImagesMenuHandler = (menu: Menu, file: TFile) => {
      menu.addItem((item: MenuItem) => {
        item.setTitle("Upload all images").onClick(e => {
          this.uploadAllFile();
        });
      });
    };

    const DownloadAllImagesMenuHandler = (menu: Menu, file: TFile) => {
      menu.addItem((item: MenuItem) => {
        item.setTitle("Download all images").onClick(e => {
          this.downloadAllImageFiles();
        });
      });
    };

    this.registerEvent(
      this.app.workspace.on("file-menu", DownloadAllImagesMenuHandler)
    );
    this.registerEvent(
      this.app.workspace.on("file-menu", UploadAllImagesMenuHandler)
    );
  }

  addMenu = (menu: Menu, imgPath: string, editor: Editor) => {};

  getDefaultNoteFileFolder(): TFolder {
    const activeFile = this.app.workspace.getActiveFile();
    let newFileLocation = (this.app.vault as any).getConfig("newFileLocation");

    return (
      (newFileLocation == "folder"
        ? getFolderFromPath(
            this.app,
            (this.app.vault as any).getConfig("newFileFolderPath")
          )
        : newFileLocation == "current" && activeFile
        ? getFolderFromPath(this.app, activeFile.path)
        : this.app.vault.getRoot()) ?? this.app.vault.getRoot()
    );
  }

  // 获取当前文件所属的附件文件夹
  getFileAssetPath() {
    const basePath = (
      this.app.vault.adapter as FileSystemAdapter
    ).getBasePath();
    return join(basePath, this.getDefaultNoteFileFolder().path);
  }

  async downloadAllImageFiles() {
    if (this.app.workspace.getActiveViewOfType(MarkdownView) == null) {
      new Notice(t("Please select the markdown note you want to edit"));
      return;
    }

    const activeFile = this.app.workspace.getActiveFile();
    const folderPath = this.getFileAssetPath();

    const fileArray = this.helper.getAllFiles();
    if (!existsSync(folderPath)) {
      mkdirSync(folderPath);
    }

    let imageArray = [];
    const nameSet = new Set();
    for (const file of fileArray) {
      if (!file.path.startsWith("http")) {
        continue;
      }

      const url = file.path;
      const asset = getUrlAsset(url);
      let name = decodeURI(parse(asset).name).replaceAll(
        /[\\\\/:*?\"<>|]/g,
        "-"
      );

      // 如果文件名已存在，则用随机值替换，不对文件后缀进行判断
      if (existsSync(join(folderPath))) {
        name = (Math.random() + 1).toString(36).substr(2, 5);
      }
      if (nameSet.has(name)) {
        name = `${name}-${(Math.random() + 1).toString(36).substr(2, 5)}`;
      }
      nameSet.add(name);

      const response = await this.download(url, folderPath, name);
      if (response.ok) {
        const activeFolder = normalizePath(
          this.app.workspace.getActiveFile().parent.path
        );
        const abstractActiveFolder = (
          this.app.vault.adapter as FileSystemAdapter
        ).getFullPath(activeFolder);

        imageArray.push({
          source: file.source,
          name: name,
          path: normalizePath(relative(abstractActiveFolder, response.path)),
        });
      }
    }

    let value = this.helper.getValue();
    imageArray.map(image => {
      let name = this.handleName(image.name);

      value = value.replace(
        image.source,
        `![${name}](${encodeURI(image.path)})`
      );
    });

    const currentFile = this.app.workspace.getActiveFile();
    if (activeFile.path !== currentFile.path) {
      new Notice(
        t("The current file has been changed, and the download has failed")
      );
      return;
    }
    this.helper.setValue(value);

    new Notice(
      `all: ${fileArray.length}\nsuccess: ${imageArray.length}\nfailed: ${
        fileArray.length - imageArray.length
      }`
    );
  }

  async download(url: string, folderPath: string, name: string) {
    const response = await requestUrl({ url });
    const type = await imageType(new Uint8Array(response.arrayBuffer));

    if (response.status !== 200) {
      return {
        ok: false,
        msg: "error",
      };
    }
    if (!type) {
      return {
        ok: false,
        msg: "error",
      };
    }

    const buffer = Buffer.from(response.arrayBuffer);

    try {
      const path = join(folderPath, `${name}.${type.ext}`);

      writeFileSync(path, buffer);
      return {
        ok: true,
        msg: "ok",
        path: path,
        type,
      };
    } catch (err) {
      return {
        ok: false,
        msg: err,
      };
    }
  }

  registerFileMenu() {
    this.registerEvent(
      this.app.workspace.on(
        "file-menu",
        (menu: Menu, file: TFile, source: string, leaf) => {
          if (source === "canvas-menu") return false;
          if (!isAssetTypeAnImage(file.path)) return false;

          menu.addItem((item: MenuItem) => {
            item
              .setTitle("Upload")
              .setIcon("upload")
              .onClick(() => {
                if (!(file instanceof TFile)) {
                  return false;
                }
                this.fileMenuUpload(file);
              });
          });
        }
      )
    );
  }

  fileMenuUpload(file: TFile) {
    let content = this.helper.getValue();

    const basePath = (
      this.app.vault.adapter as FileSystemAdapter
    ).getBasePath();
    let imageList: Image[] = [];
    const fileArray = this.helper.getAllFiles();

    for (const match of fileArray) {
      const imageName = match.name;
      const encodedUri = match.path;

      const fileName = basename(decodeURI(encodedUri));

      if (file && file.name === fileName) {
        const abstractImageFile = join(basePath, file.path);

        if (isAssetTypeAnImage(abstractImageFile)) {
          imageList.push({
            path: abstractImageFile,
            originalPath: file.path,
            name: imageName,
            source: match.source,
          });
        }
      }
    }

    if (imageList.length === 0) {
      new Notice(t("No image file was parsed"));
      return;
    }

    Array.from(imageList).forEach((image, index) => {
      0;
      this.uploader.uploadUrlFile(image.path).then(res => {
        if (res != undefined && res.status) {
          const uploadImage = res.data.imageUrl;

          let name = this.handleName(
            res.data.imageTitle != "" ? res.data.imageTitle : image.name
          );
          content = content.replaceAll(
            image.source,
            `![${name}](${uploadImage})`
          );

          this.helper.setValue(content);

          if (this.settings.deleteSource) {
            imageList.map(image => {
              if (!image.path.startsWith("http")) {
                unlink(image.path, () => {});
              }
            });
          }
        } else {
          new Notice(t("Upload error"));
        }
      });
    });
  }

  filterFile(fileArray: Image[]) {
    const imageList: Image[] = [];

    for (const match of fileArray) {
      if (match.path.startsWith("http")) {
        if (this.settings.workOnNetWork) {
          if (
            !this.helper.hasBlackDomain(
              match.path,
              this.settings.newWorkBlackDomains
            )
          ) {
            imageList.push({
              path: match.path,
              originalPath: match.path,
              name: match.name,
              source: match.source,
            });
          }
        }
      } else {
        imageList.push({
          path: match.path,
          originalPath: match.path,
          name: match.name,
          source: match.source,
        });
      }
    }

    return imageList;
  }
  getFile(fileName: string, fileMap: any) {
    if (!fileMap) {
      fileMap = arrayToObject(this.app.vault.getFiles(), "name");
    }
    return fileMap[fileName];
  }

  // uploda all file
  uploadAllFile() {
    if (this.app.workspace.getActiveViewOfType(MarkdownView) == null) {
      new Notice(t("Please select the markdown note you want to edit"));
      return;
    }

    let content = this.helper.getValue();

    const basePath = (
      this.app.vault.adapter as FileSystemAdapter
    ).getBasePath();
    const activeFile = this.app.workspace.getActiveFile();
    const fileMap = arrayToObject(this.app.vault.getFiles(), "name");

    const filePathMap = arrayToObject(this.app.vault.getFiles(), "path");

    const fileArray = this.filterFile(this.helper.getAllFiles());

    let imageList: Image[] = [];

    let fileList: KeyImageFiles = {};

    for (const match of fileArray) {
      const imageName = match.name;
      const encodedUri = match.path;

      if (encodedUri.startsWith("http")) {
        imageList.push({
          path: match.path,
          originalPath: match.path,
          name: imageName,
          source: match.source,
        });
      } else {
        const fileName = basename(decodeURI(encodedUri));
        let file;
        // 绝对路径
        if (filePathMap[decodeURI(encodedUri)]) {
          file = filePathMap[decodeURI(encodedUri)];
        }

        // 相对路径
        if (
          (!file && decodeURI(encodedUri).startsWith("./")) ||
          decodeURI(encodedUri).startsWith("../")
        ) {
          const filePath = resolve(
            join(basePath, dirname(activeFile.path)),
            decodeURI(encodedUri)
          );

          if (existsSync(filePath)) {
            const path = normalizePath(
              relative(
                basePath,
                resolve(
                  join(basePath, dirname(activeFile.path)),
                  decodeURI(encodedUri)
                )
              )
            );
            file = filePathMap[path];
          }
        }

        // 尽可能短路径
        if (!file) {
          file = this.getFile(fileName, fileMap);
        }

        if (file) {
          const abstractImageFile = join(basePath, file.path);

          if (isAssetTypeAnImage(abstractImageFile)) {
            imageList.push({
              path: abstractImageFile,
              originalPath: file.path,
              name: imageName,
              source: match.source,
            });

            fileList[abstractImageFile] = this.app.vault.readBinary(file);
          }
        }
      }
    }

    if (imageList.length === 0) {
      new Notice(t("No image file was parsed"));
      return;
    } else {
      new Notice(
        imageList.length +
          t("image files have been found, and the upload has started")
      );
    }

    Array.from(imageList).forEach((image, index) => {
      let file = fileList[image.path];

      async function example(
        file: Promise<ArrayBuffer>,
        image: Image,
        _this: autoImageRemoteUploaderPlugin
      ) {
        try {
          let rfile = await file;

          _this.uploader.uploadFileByBlob(rfile, image).then(res => {
            if (res != undefined && res.status) {
              const uploadImage = res.data.imageUrl;
              let name = _this.handleName(
                res.data.imageTitle != "" ? res.data.imageTitle : image.name
              );
              content = content.replaceAll(
                image.source,
                `![${name}](${uploadImage})`
              );
              const currentFile = _this.app.workspace.getActiveFile();
              if (activeFile.path !== currentFile.path) {
                new Notice(
                  t(
                    "The current file has been changed, and the upload has failed"
                  )
                );
                return;
              }
              _this.helper.setValue(content);
              if (_this.settings.deleteSource) {
                imageList.map(image => {
                  if (!image.path.startsWith("http")) {
                    unlink(image.path, () => {});
                  }
                });
              }
            } else {
              new Notice(t("Upload error"));
            }
          });
        } catch (err) {
          console.dir(err);
        }
      }

      example(file, image, this);

      let totalLength = 0;
    });
  }

  setupPasteHandler() {
    this.registerEvent(
      this.app.workspace.on(
        "editor-paste",
        async (
          evt: ClipboardEvent,
          editor: Editor,
          markdownView: MarkdownView
        ) => {
          const allowUpload = this.helper.getFrontmatterValue(
            "image-auto-upload",
            this.settings.uploadByClipSwitch
          );

          let files = evt.clipboardData.files;

          // 剪贴板内容有md格式的图片时
          if (this.settings.workOnNetWork) {
            const clipboardValue = evt.clipboardData.getData("text/plain");
            const imageList = this.helper
              .getImageLink(clipboardValue)
              .filter(image => image.path.startsWith("http"))
              .filter(
                image =>
                  !this.helper.hasBlackDomain(
                    image.path,
                    this.settings.newWorkBlackDomains
                  )
              );

            if (imageList.length !== 0) {
              Array.from(imageList).forEach((image, index) => {
                this.uploader.uploadUrlFile(image.path).then(res => {
                  if (res != undefined && res.status) {
                    const uploadImage = res.data.imageUrl;
                    let value = this.helper.getValue();
                    let name = this.handleName(
                      res.data.imageTitle != ""
                        ? res.data.imageTitle
                        : image.name
                    );
                    value = value.replaceAll(
                      image.source,
                      `![${name}](${uploadImage})`
                    );
                    this.helper.setValue(value);
                  } else {
                    new Notice(t("Upload error"));
                  }
                });
              });
            }
          }

          // 剪贴板中是图片时进行上传
          if (this.canUpload(evt.clipboardData)) {
            Array.from(files).forEach((file, index) => {
              this.uploadFileAndEmbedImgurImage(
                editor,
                async (editor: Editor, pasteId: string) => {
                  let res = await this.uploader.uploadFile(file);
                  if (res != undefined && res.status) {
                    return {
                      url: res.data.imageUrl,
                      name: res.data.imageTitle,
                    };
                  } else {
                    return null;
                  }
                },
                evt.clipboardData
              ).catch();
            });
            evt.preventDefault();
          }
        }
      )
    );

    this.registerEvent(
      this.app.workspace.on(
        "editor-drop",
        async (evt: DragEvent, editor: Editor, markdownView: MarkdownView) => {
          const allowUpload = this.helper.getFrontmatterValue(
            "image-auto-upload",
            this.settings.uploadByClipSwitch
          );
          let files = evt.dataTransfer.files;

          if (!allowUpload) {
            return;
          }

          if (files.length !== 0 && files[0].type.startsWith("image")) {
            let files = evt.dataTransfer.files;
            Array.from(files).forEach((image, index) => {
              this.uploader.uploadFile(image).then(res => {
                if (res != undefined && res.status) {
                  console.log(res);
                  let pasteId = (Math.random() + 1).toString(36).substr(2, 5);

                  this.insertTemporaryText(editor, pasteId);
                  this.embedMarkDownImage(
                    editor,
                    pasteId,
                    res.data.imageUrl,
                    res.data.imageTitle != ""
                      ? res.data.imageTitle
                      : files[0].name
                  );
                } else {
                  new Notice(t("Upload error"));
                }
              });
            });
            evt.preventDefault();
          }
        }
      )
    );
  }

  canUpload(clipboardData: DataTransfer) {
    this.settings.applyImage;
    const files = clipboardData.files;
    const text = clipboardData.getData("text");

    const hasImageFile =
      files.length !== 0 && files[0].type.startsWith("image");
    if (hasImageFile) {
      if (!!text) {
        return this.settings.applyImage;
      } else {
        return true;
      }
    } else {
      return false;
    }
  }

  async uploadFileAndEmbedImgurImage(
    editor: Editor,
    callback: Function,
    clipboardData: DataTransfer
  ) {
    let pasteId = (Math.random() + 1).toString(36).substr(2, 5);
    this.insertTemporaryText(editor, pasteId);
    const name = clipboardData.files[0].name;

    try {
      const c = await callback(editor, pasteId);

      if (c != null) {
        this.embedMarkDownImage(
          editor,
          pasteId,
          c.url,
          c.name != "" ? c.name : name
        );
      } else {
        this.handleFailedUpload(editor, pasteId, t("Upload error"));
      }
    } catch (e) {
      this.handleFailedUpload(editor, pasteId, e);
    }
  }

  insertTemporaryText(editor: Editor, pasteId: string) {
    let progressText = autoImageRemoteUploaderPlugin.progressTextFor(pasteId);
    editor.replaceSelection(progressText + "\n");
  }

  private static progressTextFor(id: string) {
    return `![Uploading file...${id}]()`;
  }

  embedMarkDownImage(
    editor: Editor,
    pasteId: string,
    imageUrl: any,
    name: string = ""
  ) {
    let progressText = autoImageRemoteUploaderPlugin.progressTextFor(pasteId);
    name = this.handleName(name);

    let markDownImage = `![${name}](${imageUrl})`;

    autoImageRemoteUploaderPlugin.replaceFirstOccurrence(
      editor,
      progressText,
      markDownImage
    );
  }

  handleFailedUpload(editor: Editor, pasteId: string, reason: any) {
    new Notice(reason);
    let progressText = autoImageRemoteUploaderPlugin.progressTextFor(pasteId);
    autoImageRemoteUploaderPlugin.replaceFirstOccurrence(
      editor,
      progressText,
      t(
        "Upload error, please check your Vault configuration and network connection"
      )
    );
  }

  handleName(name: string) {
    const imageSizeSuffix = this.settings.imageSizeSuffix || "";

    if (this.settings.imageDesc === "origin") {
      return `${name}${imageSizeSuffix}`;
    } else if (this.settings.imageDesc === "none") {
      return "";
    } else if (this.settings.imageDesc === "removeDefault") {
      if (name === "image.png") {
        return "";
      } else {
        return `${name}${imageSizeSuffix}`;
      }
    } else {
      return `${name}${imageSizeSuffix}`;
    }
  }

  static replaceFirstOccurrence(
    editor: Editor,
    target: string,
    replacement: string
  ) {
    let lines = editor.getValue().split("\n");
    for (let i = 0; i < lines.length; i++) {
      let ch = lines[i].indexOf(target);
      if (ch != -1) {
        let from = { line: i, ch: ch };
        let to = { line: i, ch: ch + target.length };
        editor.replaceRange(replacement, from, to);
        break;
      }
    }
  }
}

import { App, PluginSettingTab, Notice, Setting, Platform } from "obsidian";

import CustomImageAutoUploader from "./main";

export interface PluginSettings {
  //是否自动上传
  isAutoUpload: boolean;
  isAutoDown: boolean;
  //API地址
  api: string;
  //API Token
  apiToken: string;
  //处理排除的域名清单
  handlExcludeDomains: string;
  //// 是否处理剪贴板图片
  // isHandleClipboard: boolean;
  //插件保存目录
  saveDir: string;
  //本地图片上传后是否删除
  isDeleteSource: boolean;
  [propName: string]: any;
}

export const DEFAULT_SETTINGS: PluginSettings = {
  isAutoUpload: true,
  isAutoDown: true,
  api: "http://127.0.0.1:36677/upload",
  apiToken: "",
  handlExcludeDomains: "",
  saveDir: "",
  isDeleteSource: false,
};

export class SettingTab extends PluginSettingTab {
  plugin: CustomImageAutoUploader;

  constructor(app: App, plugin: CustomImageAutoUploader) {
    super(app, plugin);
    this.plugin = plugin;
  }

  display(): void {
    const { containerEl: set } = this;

    set.empty();

    new Setting(set)
      .setName("是否自动上传")
      .setDesc("如果关闭,您只能手动上传图片")
      .addToggle((toggle) =>
        toggle
          .setValue(this.plugin.settings.isAutoUpload)
          .onChange(async (value) => {
            this.plugin.settings.isAutoUpload = value;
            this.display();
            await this.plugin.saveSettings();
          })
      );

    new Setting(set)
      .setName("是否自动下载")
      .setDesc("如果关闭,您只能手动下载图片")
      .addToggle((toggle) =>
        toggle
          .setValue(this.plugin.settings.isAutoDown)
          .onChange(async (value) => {
            this.plugin.settings.isAutoDown = value;
            this.display();
            await this.plugin.saveSettings();
          })
      );

    new Setting(set)
      .setName("API")
      .setDesc("API地址")
      .addText((text) =>
        text
          .setPlaceholder("Enter your secret")
          .setValue(this.plugin.settings.api)
          .onChange(async (value) => {
            this.plugin.settings.api = value;
            await this.plugin.saveSettings();
          })
      );

    new Setting(set)
      .setName("API_TOKEN")
      .setDesc("API_TOKEN")
      .addText((text) =>
        text
          .setPlaceholder("Enter your secret")
          .setValue(this.plugin.settings.apiToken)
          .onChange(async (value) => {
            this.plugin.settings.api = value;
            await this.plugin.saveSettings();
          })
      );

    new Setting(set)
      .setName("域名排除")
      .setDesc(
        `

        排除名单内的域名不会被处理,包括下载/上传

        `
      )
      .addTextArea((text) =>
        text
          .setPlaceholder("Enter your secret")
          .setValue(this.plugin.settings.handlExcludeDomains)
          .onChange(async (value) => {
            this.plugin.settings.handlExcludeDomains = value;
            await this.plugin.saveSettings();
          })
      );

    new Setting(set)
      .setName("是否删除源文件")
      .setDesc("是否删除源文件")
      .addToggle((toggle) =>
        toggle
          .setValue(this.plugin.settings.isDeleteSource)
          .onChange(async (value) => {
            this.plugin.settings.isDeleteSource = value;
            this.display();
            await this.plugin.saveSettings();
          })
      );

    new Setting(set).setName("Support").setHeading();
    new Setting(set)
      .setName("Donate")
      .setDesc(
        "If you like this Plugin, consider donating to support continued development."
      )
      .addButton((bt) => {
        bt.buttonEl.outerHTML =
          "<a href='https://ko-fi.com/F1F195IQ5' target='_blank'><img height='36' style='border:0px;height:36px;' src='https://cdn.ko-fi.com/cdn/kofi3.png?v=3' border='0' alt='Buy Me a Coffee at ko-fi.com' /></a>";
      });

    const debugDiv = set.createDiv();
    debugDiv.setAttr("align", "center");
    debugDiv.setAttr("style", "margin: var(--size-4-2)");

    const debugButton = debugDiv.createEl("button");
    debugButton.setText("Copy Debug Information");
    debugButton.onclick = async () => {
      await window.navigator.clipboard.writeText(
        JSON.stringify(
          {
            settings: this.plugin.settings,
            pluginVersion: this.plugin.manifest.version,
          },
          null,
          4
        )
      );
      new Notice(
        "Debug information copied to clipboard. May contain sensitive information!"
      );
    };

    if (Platform.isDesktopApp) {
      const info = set.createDiv();
      info.setAttr("align", "center");
      info.setText(
        "Debugging and logging:\nYou can always see the logs of this and every other plugin by opening the console with"
      );
      const keys = set.createDiv();
      keys.setAttr("align", "center");
      keys.addClass("custom-shortcuts");
      if (Platform.isMacOS === true) {
        keys.createEl("kbd", { text: "CMD (⌘) + OPTION (⌥) + I" });
      } else {
        keys.createEl("kbd", { text: "CTRL + SHIFT + I" });
      }
    }
  }
}

import { App, PluginSettingTab, Notice, Setting, Platform } from "obsidian";

import CustomImageAutoUploader from "./main";

export interface PluginSettings {
  //是否自动上传
  isAutoUpload: boolean;
  isAutoDown: boolean;
  isNotice: boolean;
  afterUploadTimeout: number;
  //API地址
  api: string;
  //API Token
  apiToken: string;
  //处理排除的域名清单
  excludeDomains: string;
  //// 是否处理剪贴板图片
  // isHandleClipboard: boolean;
  //插件保存目录
  saveDir: string;
  //本地图片上传后是否删除
  isDeleteSource: boolean;

  [propName: string]: any;
}

// ![这是图片](https://markdown.com.cn/assets/img/philly-magic-garden.9c0b4415.jpg)

export const DEFAULT_SETTINGS: PluginSettings = {
  isAutoUpload: true,
  isAutoDown: true,
  isNotice: true,
  afterUploadTimeout: 1000,
  api: "http://127.0.0.1:36677/upload",
  apiToken: "",
  excludeDomains: "",
  saveDir: "",
  isDeleteSource: true,
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

    new Setting(set).setName("通用设置").setHeading();

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
      .setName("上传间隔时间")
      .setDesc("上传间隔时间,单位为毫秒,默认设置1s")
      .addText((text) =>
        text
          .setValue(this.plugin.settings.afterUploadTimeout.toString())
          .onChange(async (value) => {
            this.plugin.settings.afterUploadTimeout = Number(value);
            await this.plugin.saveSettings();
          })
      );

    new Setting(set)
      .setName("关闭提示")
      .setDesc("关闭右上角结果提示")
      .addToggle((toggle) =>
        toggle
          .setValue(this.plugin.settings.isNotice)
          .onChange(async (value) => {
            this.plugin.settings.isNotice = value;
            this.display();
            await this.plugin.saveSettings();
          })
      );

    new Setting(set).setName("API 设置").setHeading();

    new Setting(set)
      .setName("API 地址")
      .setDesc("Image Api Gateway 地址")
      .addText((text) =>
        text
          .setPlaceholder("输入您的 Image Api Gateway 地址")
          .setValue(this.plugin.settings.api)
          .onChange(async (value) => {
            this.plugin.settings.api = value;
            await this.plugin.saveSettings();
          })
      );

    new Setting(set)
      .setName("API 访问令牌")
      .setDesc("用于访问API的令牌")
      .addText((text) =>
        text
          .setPlaceholder("Enter your API Token")
          .setValue(this.plugin.settings.apiToken)
          .onChange(async (value) => {
            this.plugin.settings.apiToken = value;
            await this.plugin.saveSettings();
          })
      );

    new Setting(set)
      .setName("API 服务搭建")
      .setDesc("项目地址")
      .addButton((bt) => {
        bt.buttonEl.outerHTML =
          "<a href='https://github.com/haierkeys/image-api-gateway' target='_blank'>https://github.com/haierkeys/image-api-gateway</a>";
      });

    new Setting(set).setName("下载设置").setHeading();

    new Setting(set)
      .setName("下载域名排除")
      .setDesc("在排除名单内的图片地址不会被下载,一行一个域名,支持 * 通配符")
      .addTextArea((text) =>
        text
          .setPlaceholder("Enter your secret")
          .setValue(this.plugin.settings.excludeDomains)
          .onChange(async (value) => {
            this.plugin.settings.excludeDomains = value;
            await this.plugin.saveSettings();
          })
      );
    new Setting(set).setName("上传设置").setHeading();
    new Setting(set)
      .setName("是否上传后删除原图片")
      .setDesc("是否上传后删除原图片")
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
          "<a href='https://ko-fi.com/haierkeys' target='_blank'><img height='36' style='border:0px;height:36px;' src='https://cdn.ko-fi.com/cdn/kofi3.png?v=3' border='0' alt='Buy Me a Coffee at ko-fi.com' /></a>";
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

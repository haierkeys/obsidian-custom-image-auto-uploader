import { App, PluginSettingTab, Notice, Setting, Platform } from "obsidian";
import CustomImageAutoUploader from "./main";
import { $ } from "./lang";

export interface PluginSettings {
  //是否自动上传
  isAutoUpload: boolean;
  isAutoDown: boolean;
  isCloseNotice: boolean;
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


/**
 *

![这是图片](https://markdown.com.cn/assets/img/philly-magic-garden.9c0b4415.jpg)

 */


export const DEFAULT_SETTINGS: PluginSettings = {
  isAutoUpload: true,
  isAutoDown: true,
  isCloseNotice: true,
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

    new Setting(set)
      .setName($("是否自动上传"))
      .setDesc($("如果关闭,您只能手动上传图片"))
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
      .setName($("是否自动下载"))
      .setDesc($("如果关闭,您只能手动下载图片"))
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
      .setName($("上传间隔时间"))
      .setDesc($("单位为毫秒,默认设置1s"))
      .addText((text) =>
        text
          .setValue(this.plugin.settings.afterUploadTimeout.toString())
          .onChange(async (value) => {
            this.plugin.settings.afterUploadTimeout = Number(value);
            await this.plugin.saveSettings();
          })
      );

    new Setting(set)
      .setName($("关闭提示"))
      .setDesc($("关闭右上角结果提示"))
      .addToggle((toggle) =>
        toggle
          .setValue(this.plugin.settings.isCloseNotice)
          .onChange(async (value) => {
            this.plugin.settings.isCloseNotice = value;
            this.display();
            await this.plugin.saveSettings();
          })
      );



    new Setting(set).setName($("下载")).setHeading();

    new Setting(set)
      .setName($("下载域名排除"))
      .setDesc($("在排除名单内的图片地址不会被下载,一行一个域名,支持 * 通配符"))
      .addTextArea((text) =>
        text
          .setPlaceholder($("Enter your secret"))
          .setValue(this.plugin.settings.excludeDomains)
          .onChange(async (value) => {
            this.plugin.settings.excludeDomains = value;
            await this.plugin.saveSettings();
          })
      );
    new Setting(set).setName($("上传")).setHeading();


    new Setting(set)
      .setName($("API 地址"))
      .setDesc($("Image api 网关地址"))
      .addText((text) =>
        text
          .setPlaceholder($("输入您的 Image api 网关地址"))
          .setValue(this.plugin.settings.api)
          .onChange(async (value) => {
            this.plugin.settings.api = value;
            await this.plugin.saveSettings();
          })
      );

    new Setting(set)
      .setName($("API 访问令牌"))
      .setDesc($("用于访问API的令牌"))
      .addText((text) =>
        text
          .setPlaceholder($("输入您的 API 访问令牌"))
          .setValue(this.plugin.settings.apiToken)
          .onChange(async (value) => {
            this.plugin.settings.apiToken = value;
            await this.plugin.saveSettings();
          })
      );


    new Setting(set)
      .setName($("API 服务搭建"))
      .setDesc($("项目地址"))
      .settingEl
      .createEl('a', { text: 'https://github.com/haierkeys/image-api-gateway', href: 'https://github.com/haierkeys/image-api-gateway' });


    new Setting(set)
      .setName($("是否上传后删除原图片"))
      .setDesc($("在图片上传后是否删除本地原图片"))
      .addToggle((toggle) =>
        toggle
          .setValue(this.plugin.settings.isDeleteSource)
          .onChange(async (value) => {
            this.plugin.settings.isDeleteSource = value;
            this.display();
            await this.plugin.saveSettings();
          })
      );

    new Setting(set).setName($("支持")).setHeading();
    let y = new Setting(set)
      .setName($("捐赠"))
      .setDesc(
        $("如果您喜欢这个插件，请考虑捐赠以支持继续开发。")
      ).settingEl
      .createEl('a', { href: 'https://ko-fi.com/haierkeys' })
      .createEl('img', { attr: { src: kofiImage, height: '36', border: '0', alt: 'Buy Me a Coffee at ko-fi.com', style: "height:36px!important;border:0px!important;" } });

    const debugDiv = set.createDiv();
    debugDiv.setAttr("align", "center");
    debugDiv.setAttr("style", "margin: var(--size-4-2)");

    const debugButton = debugDiv.createEl("button");
    debugButton.setText($("复制 Debug 信息"));
    debugButton.onclick = async () => {
      await window.navigator.clipboard.writeText(
        JSON.stringify(
          {
            settings: this.plugin.settings,
            pluginVersion: this.plugin.manifest.version,
          }, null, 4
        )
      );
      new Notice($("将调试信息复制到剪贴板, 可能包含敏感信!"));
    };

    if (Platform.isDesktopApp) {
      const info = set.createDiv();
      info.setAttr("align", "center");
      info.setText($("通过快捷键打开控制台，你可以看到这个插件和其他插件的日志"));

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


let kofiImage: string = 'data:image/png;base64,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'
import { App, PluginSettingTab, Notice, Setting, Platform } from "obsidian";
import CustomImageAutoUploader from "./main";
import { $ } from "./lang";

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


/**
 *

![这是图片](https://markdown.com.cn/assets/img/philly-magic-garden.9c0b4415.jpg)

 */


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

    new Setting(set).setName($("通用")).setHeading();

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
          .setValue(this.plugin.settings.isNotice)
          .onChange(async (value) => {
            this.plugin.settings.isNotice = value;
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
      .setDesc($("Image Api Gateway 地址"))
      .addText((text) =>
        text
          .setPlaceholder($("输入您的 Image Api Gateway 地址"))
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
      .createEl('img', { attr: { src: "https://cdn.ko-fi.com/cdn/kofi3.png?v=3", height: '36', border: '0', alt: 'Buy Me a Coffee at ko-fi.com', style: "height:36px!important;border:0px!important;" } });

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

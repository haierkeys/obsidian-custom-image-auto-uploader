[中文文档](https://github.com/haierkeys/obsidian-custom-image-auto-uploader/blob/master/readme-zh.md) / [English Document](https://github.com/haierkeys/obsidian-custom-image-auto-uploader/blob/master/README.md)


<h1 align="center">自定义图片上传云端保存插件 For Obsidian</h1>

<p align="center">
<img src="https://img.shields.io/github/release/haierkeys/obsidian-custom-image-auto-uploader" alt="version">
<img src="https://img.shields.io/github/license/haierkeys/obsidian-custom-image-auto-uploader.svg" alt="license" >
</p>

您可以在 电脑和手机 端上将笔记中的图片批量下载,批量上传保存到远端服务器、家庭 NAS、WebDAV 或者云存储上（阿里云 OSS 、亚马逊 S3 、Cloudflare R2 、MinIO ）,并且您还可以对图片进行拉伸裁剪以及修改尺寸。

![](https://github.com/user-attachments/assets/0878061b-d77c-48c5-aa61-cc5154612a7b)

## 插件功能:
- **批量下载**笔记内网络图片到本地
- **批量上传**笔记中本地图片到远端服务 ( [ Custom Image Gateway](https://github.com/haierkeys/custom-image-gateway) )
- 拖拽,粘贴 上传图片
- 批量将笔记内图片保存到 **远端服务器**，例如您的 Web 服务器或家庭 NAS，以及保存在WebDAV服务器内。
- 批量将笔记内图片保存到云存储内，例如阿里云 OSS、亚马逊 S3、Cloudflare R2。
- 支持多端使用, 支持 Windows, MacOS, Linux, Android, iOS
- 支持多国语言
- 增加笔记属性或正文内图片拉伸裁剪功能 (例如 对 hugo 博客标题图 cover 进行)
  - 等比左上填充(裁剪)
  - 等比居中填充(裁剪)
  - 固定尺寸拉伸
  - 等比适应

## 价格

如果觉得这个插件很有用，并且想要支持它的继续开发，你可以在这里支持我:
[<img src="https://cdn.ko-fi.com/cdn/kofi3.png?v=3" alt="BuyMeACoffee" width="100">](https://ko-fi.com/haierkeys)

## 快速开始

1. 安装插件
  打开 OBSidian 社区插件市场, 搜索 **Custom Image Auto Uploader** 安装
2. 打开插件配置项，将 **上传设置** > **API 网关地址** 设置为您的 **Custom Image Gateway** 地址,
   例如: `http://127.0.0.1:9000/api/upload`
3. 设置 **API 访问令牌**。
4. 在远端服务启动 **Custom Image Gateway** 服务。
5. 创建一个笔记,并复制一个图片检查是否上传成功。

## 上传图片 API 搭建

此插件需要 配置 **Custom Image Gateway** 才能完成上传工作。
**Custom Image Gateway** 为免费工具, 部署使用请参考 [https://github.com/haierkeys/custom-image-gateway](https://github.com/haierkeys/custom-image-gateway)。


[中文文档](readme-zh.md) / [English Document](README.md)

# Custom Image Auto Uploader For Obsidian / 自定义图片自动上传插件

您可以将笔记中的图片上传保存到您的远端服务器、家庭 NAS 或者同步保存在您的云存储上（阿里云 OSS、亚马逊 S3、Cloudflare R2）。

- 拖拽上传图片
- 粘贴图片上传
- 右键点击上传图片
- 批量下载网页图片到本地
- 批量上传笔记中所有本地图片文件
- 批量将笔记中所有本地图片文件上传到远端服务器，例如您的 Web 服务器或家庭 NAS。
- 您还可以选择同时同步到云存储，例如阿里云 OSS、亚马逊 S3、Cloudflare R2。

## 价格

本插件免费提供给大家使用，但如果您想表示感谢或支持继续开发，请随时通过以下任一方式为我提供一点帮助：

- [![Paypal](https://img.shields.io/badge/paypal-HaierSpi-yellow?style=social&logo=paypal)](https://paypal.me/haierspi)

- [<img src="https://cdn.buymeacoffee.com/buttons/v2/default-yellow.png" alt="BuyMeACoffee" width="100">](https://www.buymeacoffee.com/haierspi)
<img src="https://raw.githubusercontent.com/haierkeys/obsidian-custom-image-auto-uploader/main/bmc_qr.png" style="width:120px;height:auto;">

- afdian: https://afdian.net/a/haierspi

# 快速开始

1. 安装插件
2. 打开插件配置项，将 **image-upload-api** 设置为您的图片上传 API `http://127.0.0.1:8000/api/upload`，并设置 **authorization-token**。
3. 启动 **obsidian-image-api-gateway** 服务。
4. 打开 **obsidian-image-api-gateway** 服务并检查是否上传成功。

## 图片上传 API 服务器

此插件需要 **obsidian-image-api-gateway** 才能正常工作。请参考 [obsidian-image-api-gateway](https://github.com/haierkeys/obsidian-image-api-gateway)。

## 帮助

## 剪贴板上传

支持直接上传从剪贴板粘贴的图片，目前支持从系统复制图片并直接上传。
通过设置 `frontmatter` 来控制单个文件上传，默认值为 `true`，若要关闭控制，请将值设置为 `false`。

支持的图片格式：".png"、".jpg"、".jpeg"、".bmp"、".gif"、".svg"、".tiff"。

```yaml
---
image-auto-upload: true
---
```
## 帮助

### 剪贴板上传

支持从剪贴板粘贴图片时直接上传，目前支持从系统复制图片直接上传。

支持通过设置`frontmatter`来控制单个文件上传，默认值为`true`，如需关闭控制，请将值设置为`false`。

支持“.png”、“.jpg”、“.jpeg”、“.bmp”、“.gif”、“.svg”、“.tiff”。

```yaml
---
image-auto-upload: true
---
```

### 批量上传文件中所有图片文件

输入`ctrl+P`调出面板，输入`upload all images`，回车后自动开始上传。

路径解析优先级，会按优先级顺序查找路径：

1. 绝对路径，指基于库的绝对路径
2. 相对路径，以./或./或.开头
3. 尽量短

### 批量下载网页图片到本地

输入`ctrl+P`调出面板，输入`download all images`并回车，下载会自动开始。

### 支持右键菜单上传图片

支持标准md和wiki格式。支持相对路径和绝对路径，需要正确设置，否则会出现奇怪的问题。

### 拖拽上传

支持图片的拖拽。

## 感谢

https://github.com/renmu123/obsidian-image-auto-upload-plugin
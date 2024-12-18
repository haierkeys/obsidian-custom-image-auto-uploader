[中文文档](https://github.com/haierkeys/obsidian-custom-image-auto-uploader/blob/master/readme-zh.md) / [English Document](https://github.com/haierkeys/obsidian-custom-image-auto-uploader/blob/master/README.md)

# 自定义图片自动上传插件 / Custom Image Auto Uploader For Obsidian

您可以将笔记中的图片上传保存到您的远端服务器、家庭 NAS 或者同步保存在您的云存储上（阿里云 OSS、亚马逊 S3、Cloudflare R2）。

![](https://github.com/user-attachments/assets/0878061b-d77c-48c5-aa61-cc5154612a7b)

## 插件功能:
- **批量下载**笔记内网络图片到本地
- **批量上传**笔记中本地图片到远端服务 ( [ Image Api Gateway](https://github.com/haierkeys/obsidian-image-api-gateway) )
- 拖拽,粘贴 上传图片
- 批量将笔记内图片保存到 **远端服务器**，例如您的 Web 服务器或家庭 NAS。
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



## 快速开始

1. 安装插件
2. 打开插件配置项，将 **上传设置** > **API 地址** 设置为您的 **Image Api Gateway** 地址,
   例如: `http://127.0.0.1:8000/api/upload`
3. 设置 **API 访问令牌**。
4. 在远端服务启动 **Image Api Gateway** 服务。
5. 创建一个笔记,并复制一个图片检查是否上传成功。

## 上传图片 API 搭建

此插件需要 配置 **Image Api Gateway** 才能完成上传工作。
**Image Api Gateway** 为免费工具, 部署使用请参考 [https://github.com/haierkeys/obsidian-image-api-gateway](https://github.com/haierkeys/obsidian-image-api-gateway)。



## 开发相关

```bash
pnpm install
pnpm run dev
pnpm run build
```
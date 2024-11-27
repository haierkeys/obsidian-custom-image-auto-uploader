
[中文文档](readme-zh.md) / [English Document](README.md)

# Custom Image Auto Uploader For Obsidian / 自定义图片自动上传插件

您可以将笔记中的图片上传保存到您的远端服务器、家庭 NAS 或者同步保存在您的云存储上（阿里云 OSS、亚马逊 S3、Cloudflare R2）。

- 拖拽上传图片
- 粘贴图片上传
- 批量下载网络图片到本地
- 批量上传笔记中本地图片文件到远端服务器
- 批量将笔记中所有本地图片文件上传到远端服务器，例如您的 Web 服务器或家庭 NAS。
- 您还可以选择同时同步到云存储，例如阿里云 OSS、亚马逊 S3、Cloudflare R2。

## 价格

如果觉得这个插件很有用，并且想要支持它的继续开发，你可以在这里支持我:

- [<img src="https://cdn.ko-fi.com/cdn/kofi3.png?v=3" alt="BuyMeACoffee" width="100">](https://ko-fi.com/haierkeys)

## 快速开始

1. 安装插件
2. 打开插件配置项，将 **上传设置** > **API 地址** 设置为您的 **Image Api Gateway** 地址,
   例如: `http://127.0.0.1:8000/api/upload`
3. 设置 **API 访问令牌**。
4. 在远端服务启动 **Image Api Gateway** 服务。
5. 创建一个笔记,并复制一个图片检查是否上传成功。

## 上传图片 API 搭建

此插件需要 配置 **Image Api Gateway** 才能完成上传工作。
**Image Api Gateway** 为免费工具, 部署使用请参考 [https://github.com/haierkeys/image-api-gateway](https://github.com/haierkeys/image-api-gateway)。





## 开发

### 安装

`pnpm install`

### 运行

`pnpm run dev`

### 编译

`pnpm run build`


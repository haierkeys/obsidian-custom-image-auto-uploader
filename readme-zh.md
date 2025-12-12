[中文文档](readme-zh.md) / [English Document](README.md)

<h1 align="center">Obsidian Custom Image Auto Uploader</h1>

<p align="center">
    <a href="https://github.com/haierkeys/obsidian-custom-image-auto-uploader/releases"><img src="https://img.shields.io/github/release/haierkeys/obsidian-custom-image-auto-uploader?style=flat-square" alt="release"></a>
    <a href="https://github.com/haierkeys/obsidian-custom-image-auto-uploader/blob/master/LICENSE"><img src="https://img.shields.io/github/license/haierkeys/obsidian-custom-image-auto-uploader?style=flat-square" alt="license"></a>
</p>

<p align="center">
  <strong>Obsidian 笔记图片一键云端同步与处理插件</strong>
  <br>
  <em>支持 批量下载 / 上传 / 裁剪 / 压缩 / 多图床支持</em>
</p>

<p align="center">
您可以在 电脑和手机 端上将笔记中的图片批量下载, 批量上传保存到远端服务器、家庭 NAS、WebDAV 或者云存储上（阿里云 OSS 、亚马逊 S3 、Cloudflare R2 、MinIO ），并且您还可以对图片进行拉伸裁剪以及修改尺寸。
</p>

<div align="center">
    <img src="https://github.com/user-attachments/assets/0878061b-d77c-48c5-aa61-cc5154612a7b" alt="preview" width="800" />
</div>

---

## ✨ 核心功能

* **⬇️ 批量下载**：一键将笔记内的网络图片下载至本地。
* **☁️ 批量上传**：将本地图片上传至远端服务，支持多种存储后端：
    * **自建服务**：配合 [Custom Image Gateway](https://github.com/haierkeys/custom-image-gateway) 使用。
    * **云存储**：阿里云 OSS, Amazon S3, Cloudflare R2, MinIO 等。
    * **通用协议**：WebDAV, 远端服务器, 家庭 NAS。
* **✂️ 图片处理**：支持在笔记属性或正文中即时处理图片（如博客封面图）：
    * 等比左上填充 (Cover)
    * 等比居中填充 (Contain)
    * 固定尺寸拉伸 (Stretch)
    * 等比适应 (Fit)
* **📱 全平台支持**：Windows, MacOS, Linux, Android, iOS。
* **🖱️ 便捷操作**：支持拖拽, 粘贴自动上传。
* **🌍 多语言支持**：内置多国语言包。

## 🗺️ 路线图 (Roadmap)

我们正在持续改进，以下是未来的开发计划：

- [ ] **多笔记批量上传下载**：可以一键下载/上传整个笔记仓库所有笔记中的图片。
- [ ] **清理未连接图片**：可以一键清理笔记仓库中未和笔记连接的本地图片。

## 🚀 快速开始

1.  **安装插件**
    打开 Obsidian 社区插件市场，搜索 **Custom Image Auto Uploader** 并安装。

2.  **配置网关 (可选)**
    若使用自建图床，请将 **上传设置** > **API 网关地址** 设置为您的 **Custom Image Gateway** 地址。
    > 例如: `http://127.0.0.1:9000/api/upload`

3.  **配置鉴权**
    设置 **API 访问令牌** (Token) 以确保安全。

4.  **启动服务**
    确保远端 **Custom Image Gateway** 服务已启动并可访问。

5.  **验证**
    创建一个新笔记，复制图片进去，检查是否上传成功。

## ⚙️ 后端服务 (API 网关)

本插件的高级功能需要配合 **Custom Image Gateway** 使用。

> **Custom Image Gateway** 是一个免费开源的图片上传网关工具。

*   **项目地址**: [haierkeys/custom-image-gateway](https://github.com/haierkeys/custom-image-gateway)
*   **部署文档**: 请参考项目主页进行部署。

## ☕ 赞助与支持

如果觉得这个插件很有用，并且想要支持它的继续开发，欢迎请我喝杯咖啡：

[<img src="https://cdn.ko-fi.com/cdn/kofi3.png?v=3" alt="BuyMeACoffee" width="100">](https://ko-fi.com/haierkeys)

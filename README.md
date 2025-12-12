[中文文档](readme-zh.md) / [English Document](README.md)

<h1 align="center">Obsidian Custom Image Auto Uploader</h1>

<p align="center">
    <a href="https://github.com/haierkeys/obsidian-custom-image-auto-uploader/releases"><img src="https://img.shields.io/github/release/haierkeys/obsidian-custom-image-auto-uploader?style=flat-square" alt="release"></a>
    <a href="https://github.com/haierkeys/obsidian-custom-image-auto-uploader/blob/master/LICENSE"><img src="https://img.shields.io/github/license/haierkeys/obsidian-custom-image-auto-uploader?style=flat-square" alt="license"></a>
</p>

<p align="center">
  <strong>Obsidian Note Image Cloud Sync & Processing Plugin</strong>
  <br>
  <em>Supports Batch Download / Upload / Crop / Compress / Multiple Image Hosts</em>
</p>

<p align="center">
You can batch download images from notes on PC and Mobile, batch upload and save to remote servers, home NAS, WebDAV, or cloud storage (Aliyun OSS, Amazon S3, Cloudflare R2, MinIO), and you can also stretch, crop, and resize images.
</p>

<div align="center">
    <img src="https://github.com/user-attachments/assets/0878061b-d77c-48c5-aa61-cc5154612a7b" alt="preview" width="800" />
</div>

---

## ✨ Core Features

* **⬇️ Batch Download**: One-click download of network images in notes to local storage.
* **☁️ Batch Upload**: Upload local images to remote services, supporting multiple storage backends:
    * **Self-hosted Service**: Use with [Custom Image Gateway](https://github.com/haierkeys/custom-image-gateway).
    * **Cloud Storage**: Aliyun OSS, Amazon S3, Cloudflare R2, MinIO, etc.
    * **Universal Protocols**: WebDAV, Remote Server, Home NAS.
* **✂️ Image Processing**: Support real-time image processing in note properties or content (e.g., blog cover images):
    * Proportional Fill Top-Left (Cover)
    * Proportional Fill Center (Contain)
    * Fixed Size Stretch (Stretch)
    * Proportional Fit (Fit)
* **📱 All Platforms Supported**: Windows, MacOS, Linux, Android, iOS.
* **🖱️ Easy Operation**: Drag & drop, paste auto-upload.
* **🌍 Multi-language Support**: Built-in multi-language support.

## 🗺️ Roadmap

We are continuously improving, here are the future development plans:

- [ ] **Batch Upload/Download for Multiple Notes**: One-click download/upload of images in all notes of the entire repository.
- [ ] **Clean Unlinked Images**: One-click cleanup of local images in the repository that are not linked to any notes.

## 🚀 Quick Start

1.  **Install Plugin**
    Open Obsidian Community Plugins market, search for **Custom Image Auto Uploader** and install.

2.  **Configure Gateway (Optional)**
    If using a self-hosted image host, set **Upload Settings** > **API Gateway Address** to your **Custom Image Gateway** address.
    > Example: `http://127.0.0.1:9000/api/upload`

3.  **Configure Auth**
    Set **API Access Token** (Token) to ensure security.

4.  **Start Service**
    Ensure the remote **Custom Image Gateway** service is started and accessible.

5.  **Verify**
    Create a new note, copy an image into it, and check if it uploads successfully.

## ⚙️ Backend Service (API Gateway)

The advanced features of this plugin require **Custom Image Gateway** to work.

> **Custom Image Gateway** is a free and open-source image upload gateway tool.

*   **Project URL**: [haierkeys/custom-image-gateway](https://github.com/haierkeys/custom-image-gateway)
*   **Deployment Docs**: Please refer to the project homepage for deployment instructions.

## ☕ Sponsor & Support

If you find this plugin useful and want to support its continued development, please buy me a coffee:

[<img src="https://cdn.ko-fi.com/cdn/kofi3.png?v=3" alt="BuyMeACoffee" width="100">](https://ko-fi.com/haierkeys)

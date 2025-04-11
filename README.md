[中文文档](https://github.com/haierkeys/obsidian-custom-image-auto-uploader/blob/master/readme-zh.md) / [English Document](https://github.com/haierkeys/obsidian-custom-image-auto-uploader/blob/master/README.md)


<h1 align="center">Obsidian Custom Image Auto Uploader</h1>

<p align="center">
<img src="https://img.shields.io/github/release/haierkeys/obsidian-custom-image-auto-uploader" alt="version">
<img src="https://img.shields.io/github/license/haierkeys/obsidian-custom-image-auto-uploader.svg" alt="license" >
</p>

You can batch download images from notes on both computer and mobile devices, batch upload and save them to remote servers, home NAS, WebDAV, or cloud storage (Alibaba Cloud OSS, Amazon S3, Cloudflare R2, MinIO), and you can also stretch, crop, and resize images.

![](https://github.com/user-attachments/assets/0878061b-d77c-48c5-aa61-cc5154612a7b)

## Plugin Features:
- **Batch download** online images in notes to local
- **Batch upload** local images in notes to remote services ([Image Api Gateway](https://github.com/haierkeys/obsidian-image-api-gateway))
- Drag and drop, paste images to upload
- Batch save images in notes to **remote server**, such as your web server or home NAS, and save them in WebDAV server.
- Batch save images in notes to cloud storage, such as Alibaba Cloud OSS, Amazon S3, Cloudflare R2.
- Support multi-end use, support Windows, MacOS, Linux, Android, iOS
- Support multiple languages
- Add image stretching and cropping function in note attributes or text content (e.g., for hugo blog cover image)
  - Proportional top-left fill (crop)
  - Proportional center fill (crop)
  - Fixed size stretch
  - Proportional fit

## Price

If you find this plugin useful and want to support its continued development, you can support me here:
[<img src="https://cdn.ko-fi.com/cdn/kofi3.png?v=3" alt="BuyMeACoffee" width="100">](https://ko-fi.com/haierkeys)

## Quick Start

1. Install the plugin
   Open the OBSidian community plugin market, search **Custom Image Auto Uploader** for installation
2. Open plugin settings, set **Upload Settings** > **API Gateway Address** to your **Image Api Gateway** address,
   e.g., `http://127.0.0.1:9000/api/upload`
3. Set **API Access Token**.
4. Start **Image Api Gateway** service on remote server.
5. Create a note and copy an image to check if the upload is successful.

## Upload Image API Setup

This plugin requires configuring **Image Api Gateway** to complete the upload work.
**Image Api Gateway** is a free tool, for deployment and usage, please refer to [https://github.com/haierkeys/obsidian-image-api-gateway](https://github.com/haierkeys/obsidian-image-api-gateway).

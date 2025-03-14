

[中文文档](https://github.com/haierkeys/obsidian-custom-image-auto-uploader/blob/master/readme-zh.md) / [English Document](https://github.com/haierkeys/obsidian-custom-image-auto-uploader/blob/master/README.md)


<h1 align="center">Custom Image Auto Uploader Plugin for Obsidian</h1>

<p align="center">
<img src="https://img.shields.io/github/release/haierkeys/obsidian-custom-image-auto-uploader" alt="version">
<img src="https://img.shields.io/github/license/haierkeys/obsidian-custom-image-auto-uploader.svg" alt="license" >
</p>

You can batch download images from your notes on 💻 desktop, 📱 iOS, and 🤖 Android platforms, and batch upload and save them to a remote server, home NAS, or cloud storage (such as Alibaba Cloud OSS, Amazon S3, Cloudflare R2, MinIO). Additionally, you can stretch, crop, and resize the images.

![](https://github.com/user-attachments/assets/0878061b-d77c-48c5-aa61-cc5154612a7b)

## Plugin Features:
- **Batch download** network images from notes to local storage
- **Batch upload** local images from notes to remote services ([Image Api Gateway](https://github.com/haierkeys/obsidian-image-api-gateway))
- Drag and drop, or paste to upload images
- Batch save images in notes to **remote servers**, such as your web server or home NAS
- Batch save images in notes to cloud storage, such as Aliyun OSS, Amazon S3, Cloudflare R2, MinIO
- Supports multiple platforms: Windows, MacOS, Linux, Android, iOS
- Multi-language support
- Add image stretching, cropping, and resizing functionality to note properties or inline images (e.g., for Hugo blog cover images)
  - Proportional top-left fill (crop)
  - Proportional center fill (crop)
  - Fixed size stretch
  - Proportional fit

## Pricing

If you find this plugin useful and would like to support its continued development, you can support me here:
[<img src="https://cdn.ko-fi.com/cdn/kofi3.png?v=3" alt="BuyMeACoffee" width="100">](https://ko-fi.com/haierkeys)

## Quick Start

1. Install the plugin
   Open the Obsidian community plugin marketplace, search for **Custom Image Auto Uploader**, and install it.
2. Open the plugin configuration and set the **Upload Settings** > **API Address** to your **Image Api Gateway** address,
   e.g., `http://127.0.0.1:8000/api/upload`
3. Set the **API Access Token**.
4. Start the **Image Api Gateway** service on your remote server.
5. Create a note and copy an image to check if the upload works.

## Setting Up the Upload Image API

This plugin requires configuring **Image Api Gateway** to complete the upload process.
**Image Api Gateway** is a free tool, and for deployment instructions, please refer to [https://github.com/haierkeys/obsidian-image-api-gateway](https://github.com/haierkeys/obsidian-image-api-gateway).

## Development Related

```bash
pnpm install
pnpm run dev
pnpm run build
```


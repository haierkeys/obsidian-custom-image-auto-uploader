[中文文档](readme-zh.md) / [英文文档](README.md)

# Custom Image Auto Uploader For Obsidian

You can upload and save images from your notes to your remote server, home NAS, or sync them to your cloud storage (Alibaba Cloud OSS, Amazon S3, Cloudflare R2).

- Drag and drop image upload
- Paste Image Upload
- Right click image upload
- Batch download web images to local
- Batch upload all local image files in notes
- Batch upload all local image files of notes to a remote server, e.g. your web server or your home NAS.
- You can choose to synchronize to cloud storage at the same time, e.g. Alibaba Cloud OSS, Amazon S3, Cloudflare R2.

## Price

This plugin is provided free of charge to everyone, but if you would like to show your appreciation or help support the continued development, please feel free to provide me with a little help in any of the following ways:

- [![Paypal](https://img.shields.io/badge/paypal-HaierSpi-yellow?style=social&logo=paypal)](https://paypal.me/haierspi)

- [<img src="https://cdn.buymeacoffee.com/buttons/v2/default-yellow.png" alt="BuyMeACoffee" width="100">](https://www.buymeacoffee.com/haierspi)
<img src="https://raw.githubusercontent.com/haierkeys/obsidian-custom-image-auto-uploader/main/bmc_qr.png" style="width:120px;height:auto;">

- afdian: https://afdian.net/a/haierspi

# Getting Started

1. Install the plugin
2. Open the plugin configuration item, set **image-upload-api** to your image upload API `http://127.0.0.1:8000/api/upload`, and set **authorization-token**.
3. Start the **obsidian-image-api-gateway** service.
4. Open the **obsidian-image-api-gateway** service and see if it uploads successfully

## Image Upload API Server

This plugin requires **obsidian-image-api-gateway** https://github.com/haierkeys/obsidian-image-api-gateway to work properly.

## Help

### Clipboard Upload

Support uploading images directly when you paste them from clipboard, currently support copying images from the system and uploading them directly.
Support to control single file upload by setting `frontmatter`, default value is `true`, to turn off control, please set the value to `false`.

Support ".png", ".jpg", ".jpeg", ".bmp", ".gif", ".svg", ".tiff".

```yaml
---
image-auto-upload: true
---
```

###  Batch upload all image files in a file

Type `ctrl+P` to call out the panel, type `upload all images`, hit enter and the upload will start automatically.

Path resolution priority, it will look up the paths in order of priority:

1. absolute path, refers to the absolute path based on the library
2. relative paths, which start with . / or . / or .
3. as short as possible

### Batch download web images to local

Type `ctrl+P` to call out the panel, type `download all images` and click enter, the download will start automatically.

### Support right-click menu to upload images

Standard md and wiki formats are supported. Relative and absolute paths are supported, you need to set them correctly, otherwise it will cause strange problems.

### Drag-and-drop uploading
Drag and drop of images is supported.

## Thanks to

https://github.com/renmu123/obsidian-image-auto-upload-plugin
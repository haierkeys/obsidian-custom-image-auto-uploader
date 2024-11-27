[中文文档](readme-zh.md) / [English Document](README.md)

# Custom Image Auto Uploader For Obsidian

You can upload and save images from your notes to your remote server, home NAS, or synchronize them to your cloud storage (Alibaba Cloud OSS, Amazon S3, Cloudflare R2).

- Drag-and-drop image upload
- Paste image upload
- Batch download online images to local storage
- Batch upload local image files in notes to remote servers
- Batch upload all local image files in notes to remote servers, such as your web server or home NAS
- Optionally synchronize to cloud storage services like Alibaba Cloud OSS, Amazon S3, or Cloudflare R2

## Pricing

If you find this plugin useful and want to support its continued development, you can support me here:

- [<img src="https://cdn.ko-fi.com/cdn/kofi3.png?v=3" alt="BuyMeACoffee" width="100">](https://ko-fi.com/haierkeys)

## Quick Start

1. Install the plugin.
2. Open the plugin settings and configure the **Upload Settings** > **API Address** to your **Image API Gateway** address, e.g., `http://127.0.0.1:8000/api/upload`.
3. Set the **API Access Token**.
4. Start the **Image API Gateway** service on the remote server.
5. Create a note and upload an image to check if it works successfully.

## Setting Up the Image Upload API

This plugin requires the **Image API Gateway** to be configured for image uploads.
**Image API Gateway** is a free tool, refer to [https://github.com/haierkeys/image-api-gateway](https://github.com/haierkeys/image-api-gateway) for deployment instructions.

## Development

### Installation

```bash
pnpm install
```

### Run

```bash
pnpm run dev
```

### Build

```bash
pnpm run build
```

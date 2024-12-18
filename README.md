[中文文档](https://github.com/haierkeys/obsidian-custom-image-auto-uploader/blob/master/readme-zh.md) / [English Document](https://github.com/haierkeys/obsidian-custom-image-auto-uploader/blob/master/README.md)


# **Custom Image Auto Uploader For Obsidian**

This plugin allows you to upload and save images in your notes to your remote server, home NAS, or cloud storage such as Alibaba Cloud OSS, Amazon S3, or Cloudflare R2.

![](https://github.com/user-attachments/assets/0878061b-d77c-48c5-aa61-cc5154612a7b)


## **Plugin Features**
- **Batch Download** network images in your notes to local storage.
- **Batch Upload** local images in your notes to remote services ([Image API Gateway](https://github.com/haierkeys/obsidian-image-api-gateway)).
- Drag and paste to upload images seamlessly.
- Save images in notes **to remote servers**, such as your web server or home NAS.
- Save images in notes **to cloud storage**, such as Alibaba Cloud OSS, Amazon S3, or Cloudflare R2.
- Multi-platform support: **Windows, macOS, Linux, Android, iOS**.
- Multi-language support.
- Add resizing and cropping functionality for images, either in note properties or inline text (e.g., for Hugo blog cover images):
  - Proportional top-left crop
  - Proportional center crop
  - Fixed-size stretch
  - Proportional fit


## **Pricing**

If you find this plugin useful and would like to support its continued development, you can contribute here:

- [<img src="https://cdn.ko-fi.com/cdn/kofi3.png?v=3" alt="BuyMeACoffee" width="100">](https://ko-fi.com/haierkeys)



## **Quick Start**

1. Install the plugin.
2. Open the plugin settings and configure **Upload Settings** > **API Address** to your **Image API Gateway** URL.
   Example: `http://127.0.0.1:8000/api/upload`
3. Set the **API Access Token**.
4. Start the **Image API Gateway** service on your remote server.
5. Create a note and upload an image to verify that the upload works correctly.


## **Image Upload API Setup**

This plugin requires the **Image API Gateway** to upload images.
**Image API Gateway** is a free tool. To deploy and use it, refer to:
[https://github.com/haierkeys/obsidian-image-api-gateway](https://github.com/haierkeys/obsidian-image-api-gateway).


## **Development**

```bash
pnpm install
pnpm run dev
pnpm run build
```


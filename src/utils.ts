import { requestUrl, Vault } from "obsidian";

import { fileTypeFromBuffer, FileTypeResult } from "file-type";
import CustomImageAutoUploader from "./main";

export interface ImageDownResult {
  err: boolean;
  path?: string;
  alt?: string;
  type?: FileTypeResult;
}

export function getUrlFileName(url: string) {
  let pathname = new URL(url).pathname;
  let fileName = pathname.substring(pathname.lastIndexOf("/") + 1);
  return decodeURI(fileName).replaceAll(/[\\\\/:*?\"<>|]/g, "-");
}

export function getFileSaveName(nameSet: Set<unknown>) {
  let name = (Math.random() + 1).toString(36).substr(2, 5);
  if (nameSet.has(name)) {
    name = `${name}-${(Math.random() + 1).toString(36).substr(2, 5)}`;
  }
  nameSet.add(name);
  return name;
}

export async function checkCreateFolder(path: string, vault: Vault) {
  if (!vault.getFolderByPath(path)) {
    vault.createFolder(path);
  }
}

export function dump(...vars: any) {
  console.log(...vars);
}

/**
 * @param content The full text body to search
 * @param toReplace Search string, this is what will be replaced
 * @param url The HTTP url to the image source
 * @param path The local filepath to the new image
 */
export function replaceInText(
  content: string,
  toReplace: string,
  url: string,
  path: string,
  alt?: string
) {
  let newLink = "";

  dump(alt);
  if (alt) {
    newLink = `![${alt} (${url})](${path})`;
  } else {
    newLink = `![(${url})](${path})`;
  }

  return content.split(toReplace).join(newLink);
}

export function statusCheck(plugin: CustomImageAutoUploader) {
  let title = "";

  title = plugin.settings.isAutoUpload ? "自动上传 🟢" : "自动上传 ⚪";
  title += plugin.settings.isAutoDown ? " 自动下载 🟢" : " 自动下载 ⚪";


    //  plugin.statusBar.setText("自动上传 yes 自动下载 yes");
  plugin.statusBar.setText(title);
}

export async function imageDown(
  url: string,
  name: string,
  plugin: CustomImageAutoUploader
): Promise<ImageDownResult> {
  const response = await requestUrl({ url });

  if (response.status !== 200) {
    return {
      err: false,
    };
  }

  const imageExtensions = new Set([
    "jpg",
    "png",
    "gif",
    "webp",
    "flif",
    "cr2",
    "tif",
    "bmp",
    "jxr",
    "psd",
    "ico",
    "bpg",
    "jp2",
    "jpm",
    "jpx",
    "heic",
    "cur",
    "dcm",
    "avif",
  ]);

  let type = <FileTypeResult>await fileTypeFromBuffer(response.arrayBuffer);

  if (!imageExtensions.has(type.ext) && type) {
    return {
      err: true,
    };
  }

  const buffer = Buffer.from(response.arrayBuffer);

  try {
    const path = `${name}.${type.ext}`;
    plugin.app.vault.createBinary(path, buffer);

    return {
      err: false,
      path: path,
      type,
    };
  } catch (err) {
    return {
      err: true,
    };
  }
}

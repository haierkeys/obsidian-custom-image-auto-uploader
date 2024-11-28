import { requestUrl, TFile, Vault, } from "obsidian";
import { fileTypeFromBuffer, FileTypeResult } from "file-type";
import CustomImageAutoUploader from "./main";
import { $ } from "./lang";

export interface ImageDownResult {
  err: boolean;
  msg: string;
  path?: string;
  type?: FileTypeResult;
}

export interface ImageUploadResult {
  err: boolean;
  msg: string;
  imageUrl?: string;
  apiError?: string;
}

/**
 * 返回URL中文文件名
 * @param url
 * @returns string
 */
export function getUrlFileName(url: string): string {
  let pathname = new URL(url).pathname;
  let fileName = pathname.substring(pathname.lastIndexOf("/") + 1);
  return decodeURI(fileName).replaceAll(/[\\\\/:*?\"<>|]/g, "-");
}

/**
 * 返回随机保存文件名
 * @param nameSet
 * @returns string
 */
export function getFileSaveRandomName(nameSet: Set<unknown>): string {
  let name = (Math.random() + 1).toString(36).substr(2, 5);
  if (nameSet.has(name)) {
    name = `${name}-${(Math.random() + 1).toString(36).substr(2, 5)}`;
  }
  nameSet.add(name);
  return name;
}

export function getDirname(path: string): string {
  let folderList = path.split("/");
  folderList.pop();
  return folderList.join("/");
}

export async function checkCreateFolder(path: string, vault: Vault) {

  if (path != "" && !vault.getFolderByPath(path)) {
    vault.createFolder(path);
  }

}

export async function getAttachmentFolder(file: string, plugin: CustomImageAutoUploader) {
  let folder = await plugin.app.fileManager.getAvailablePathForAttachment("");
  let folderList = folder.split("/");
  return folderList[0] ? folderList[0] + "/" + file : file;
}


/**
 * 替换文本中的图片链接
 * @param content 文本内容
 * @param search 查找内容
 * @param desc 图片地址
 * @param path 图片本地路径 或者 网址路径
 * @param url 图片描述
 * @returns string
 */
export function replaceInText(content: string, search: string, desc: string, path: string, url?: string): string {
  let newLink = "";

  if (url) {
    newLink = `![${desc} (${url})](${path})`;
  } else {
    newLink = `![${desc}](${path})`;
  }

  return content.split(search).join(newLink);
}

export function statusCheck(plugin: CustomImageAutoUploader): void {

  let title = "";

  title = plugin.settings.isAutoUpload ? $("自动上传") + "🟢" : $("自动上传") + "⚪";
  title += plugin.settings.isAutoDown ? $("自动下载") + "🟢" : $("自动下载") + "⚪";
  plugin.statusBar.setText(title);
}

export function hasExcludeDomain(src: string, excludeDomains: string): boolean {

  if (excludeDomains.trim() === "") {
    return false;
  }

  let url = new URL(src);
  let has = false;

  const domain = url.hostname;

  const excludeDomainList = excludeDomains.split("\n").filter((item) => item !== "");

  excludeDomainList.forEach(function (item) {
    item = item.replace(/\./g, "\\."); //将.替换为\.，因为.在正则表达式中有特殊含义
    item = item.replace("*", ".*");

    var patt = new RegExp("^" + item, "i"); //正则表达式
    var res = patt.exec(domain); //执行匹配，并获取到匹配结果

    if (res != null) {
      has = true;
      return;
    }
  });
  return has;
}

export function autoAddExcludeDomain(src: string, plugin: CustomImageAutoUploader): void {

  let url = new URL(src);
  const domain = url.hostname;
  let has = hasExcludeDomain(src, plugin.settings.excludeDomains);

  if (!has) {
    plugin.settings.excludeDomains += `\n${domain}`;
    plugin.settings.excludeDomains = plugin.settings.excludeDomains.trim();
  }
  plugin.saveSettings();
}

/**
 * 图片下载
 * @param url
 * @param name
 * @param plugin
 * @returns Promise<ImageDownResult>
 */
export async function imageDown(url: string, name: string, plugin: CustomImageAutoUploader): Promise<ImageDownResult> {

  const response = await requestUrl({ url });

  if (response.status !== 200) {
    return { err: false, msg: $("网络错误,请检查网络是否通畅"), };
  }

  const imageExtensions = new Set(["jpg", "png", "gif", "webp", "flif", "cr2", "tif", "bmp", "jxr", "psd", "ico", "bpg", "jp2", "jpm", "jpx", "heic", "cur", "dcm", "avif",]);

  let type = <FileTypeResult>await fileTypeFromBuffer(response.arrayBuffer);

  if (!imageExtensions.has(type.ext) && type) {
    return { err: true, msg: $("下载文件不是允许的图片类型"), };
  }

  try {
    const path = `${name}.${type.ext}`;
    let userPath = await getAttachmentFolder(path, plugin);
    checkCreateFolder(getDirname(userPath), this.app.vault);

    await plugin.app.vault.createBinary(userPath, response.arrayBuffer);

    return { err: false, msg: "", path: path, type, };
  } catch (err) {
    return { err: true, msg: $("图片文件创建失败:") + err.message, };
  }
}

/**
 * 图片上传
 * @param path
 * @param plugin CustomImageAutoUploader
 * @returns Promise<ImageUploadResult>
 */
export async function imageUpload(path: string, plugin: CustomImageAutoUploader): Promise<ImageUploadResult> {
  //获取用户设置的附件目录
  let userPath = await getAttachmentFolder(path, plugin);

  let file = this.app.vault.getFileByPath(userPath);

  if (!file) {
    return { err: true, msg: $("待上传图片不存在"), };
  }

  let body = await file.vault.readBinary(file);

  let requestData = new FormData();
  requestData.append("imagefile", new Blob([body]), file.name);

  let response;
  try {
    response = await fetch(
      plugin.settings.api, { method: "POST", headers: plugin.settings.apiToken == "" ? new Headers() : new Headers({ Authorization: plugin.settings.apiToken }), body: requestData, }
    );
  } catch (error) {
    return { err: true, msg: $("网络错误,请检查网络是否通畅"), };
  }

  if (response && !response.ok) {
    let result = await response.text();
    return { err: true, msg: $("网络错误,请检查网络是否通畅"), };
  }

  let result = await response.json();

  if (result && !result.status) {
    return { err: true, msg: "API Error:" + result.message + result.details.join(""), apiError: result.details.join(""), };
  } else {
    if (plugin.settings.isDeleteSource && file instanceof TFile) {
      plugin.app.vault.delete(file, true);
    }

    return { err: false, msg: result.message, imageUrl: result.data.imageUrl, };
  }
}

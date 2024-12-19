import { requestUrl, TFile, Vault } from "obsidian";
import { fileTypeFromBuffer, FileTypeResult } from "file-type";
import CustomImageAutoUploader from "./main";
import { $ } from "./lang";
import { UploadSet } from "./setting";
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
 * 从URL中提取文件名
 * @param url - 文件的URL
 * @param hasExt - 是否包含扩展名
 * @returns 提取的文件名
 */
export function getUrlFileName(url: string, hasExt: Boolean = true): string {
  let pathname = new URL(url).pathname;
  let fileName = pathname.substring(pathname.lastIndexOf("/") + 1);
  fileName = fileName.substring(0, fileName.lastIndexOf('.'))
  return decodeURI(fileName).replaceAll(/[\\\\/:*?\"<>|]/g, "-");
}

/**
 * 从给定的路径中提取目录名
 * @param path - 包含文件名的路径
 * @returns 路径中的目录名部分
 */
export function getDirname(path: string): string {
  let folderList = path.split("/");
  folderList.pop();
  return folderList.join("/");
}

/**
 * 生成指定长度的随机字符串
 * @param length - 随机字符串的长度
 * @returns 生成的随机字符串
 */
export function generateRandomString(length: number): string {
  // 定义包含所有可能字符的字符串
  const characters = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
  let result = '';
  // 循环生成随机字符串
  for (let i = 0; i < length; i++) {
    // 生成一个随机索引
    const randomIndex = Math.floor(Math.random() * characters.length);
    // 将随机索引对应的字符添加到结果字符串中
    result += characters[randomIndex];
  }
  // 返回生成的随机字符串
  return result;
}

/**
 * 生成文件的随机保存键
 * @returns 生成的随机保存键
 */
const nameSet = new Set();
export function getFileRandomSaveKey(): string {
  let name = (Math.random() + 1).toString(36).substr(2, 5);
  if (nameSet.has(name)) {
    name = `${name}-${(Math.random() + 1).toString(36).substr(2, 5)}`;
  }
  nameSet.add(name);
  return name;
}

/**
 * 检查并创建文件夹
 * @param path - 文件夹路径
 * @param vault - Vault实例
 */
export async function checkCreateFolder(path: string, vault: Vault) {
  if (path != "" && !vault.getFolderByPath(path)) {
    vault.createFolder(path);
  }
}

/**
 * 获取附件保存路径
 * @param file - 文件名
 * @param plugin - 插件实例
 * @returns 附件保存路径
 */
export async function getAttachmentSavePath(file: string, plugin: CustomImageAutoUploader): Promise<string> {
  return await plugin.app.fileManager.getAvailablePathForAttachment(file);
}

/**
 * 获取附件上传路径
 * @param image - 图片名
 * @param plugin - 插件实例
 * @returns 附件上传路径
 */
export async function getAttachmentUploadPath(image: string, plugin: CustomImageAutoUploader): Promise<TFile | null> {
  return plugin.app.metadataCache.getFirstLinkpathDest(image, image);
}

/**
 * 替换文本中的内容
 * @param content - 原始内容
 * @param search - 要替换的内容
 * @param desc - 描述
 * @param path - 路径
 * @param url - URL（可选）
 * @returns 替换后的内容
 */
export function replaceInText(content: string, search: string, desc: string, path: string, url?: string): string {
  let newLink = "";

  if (url) {
    newLink = `![${desc}](${path})`;
  } else {
    newLink = `![${desc}](${path})`;
  }

  return content.split(search).join(newLink);
}

/**
 * 检查插件状态
 * @param plugin - 插件实例
 */
export function statusCheck(plugin: CustomImageAutoUploader): void {
  let title = "";

  title = plugin.settings.isAutoUpload ? $("自动上传") + "🟢" : $("自动上传") + "⚪";
  title += plugin.settings.isAutoDown ? $("自动下载") + "🟢" : $("自动下载") + "⚪";
  plugin.statusBar.setText(title);
}

/**
 * 检查是否包含排除的域名
 * @param src - 源URL
 * @param excludeDomains - 排除的域名列表
 * @returns 是否包含排除的域名
 */
export function hasExcludeDomain(src: string, excludeDomains: string): boolean {
  if (excludeDomains.trim() === "" || !/^http/.test(src)) {
    return false;
  }

  let url = new URL(src);
  let has = false;

  const domain = url.hostname;

  const excludeDomainList = excludeDomains.split("\n").filter((item) => item !== "");

  excludeDomainList.forEach(function (item) {
    item = item.replace(/\./g, "\\."); //将.替换为\.，因为.在正则表达式中有特殊含义
    item = item.replace("*", ".*");

    let patt = new RegExp("^" + item, "i"); //正则表达式
    let res = patt.exec(domain); //执行匹配，并获取到匹配结果

    if (res != null) {
      has = true;
      return;
    }
  });
  return has;
}

/**
 * 自动添加排除的域名
 * @param src - 源URL
 * @param plugin - 插件实例
 */
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
 * 下载图片
 * @param url - 图片URL
 * @param plugin - 插件实例
 * @returns 下载结果
 */
export async function imageDown(url: string, plugin: CustomImageAutoUploader): Promise<ImageDownResult> {
  const response = await requestUrl({ url });

  if (response.status !== 200) {
    return { err: false, msg: $("网络错误,请检查网络是否通畅") };
  }

  const imageExtensions = new Set(["jpg", "png", "gif", "webp", "flif", "cr2", "tif", "bmp", "jxr", "psd", "ico", "bpg", "jp2", "jpm", "jpx", "heic", "cur", "dcm", "avif"]);

  let type = <FileTypeResult>await fileTypeFromBuffer(response.arrayBuffer);

  if (!imageExtensions.has(type.ext) && type) {
    return { err: true, msg: $("下载文件不是允许的图片类型") };
  }

  let urlObj = new URL(url);

  try {
    const name = getUrlFileName(url, false) != "" ? getUrlFileName(url, false) : getFileRandomSaveKey();
    const path = `${name}.${type.ext}`;
    const userPath = await getAttachmentSavePath(path, plugin);
    checkCreateFolder(getDirname(userPath), this.app.vault);

    await plugin.app.vault.createBinary(userPath, response.arrayBuffer);

    return { err: false, msg: "", path: path, type };
  } catch (err) {
    return { err: true, msg: $("图片文件创建失败:") + err.message };
  }
}

/**
 * 上传图片
 * @param path - 图片路径
 * @param postdata - 上传数据
 * @param plugin - 插件实例
 * @returns 上传结果
 */
export async function imageUpload(path: string, postdata: UploadSet, plugin: CustomImageAutoUploader): Promise<ImageUploadResult> {
  //获取用户设置的附件目录
  let file = await getAttachmentUploadPath(path, plugin);

  if (!file) {
    return { err: true, msg: $("待上传图片不存在") };
  }

  let body = await file.vault.readBinary(file);

  let requestData = new FormData();
  requestData.append("imagefile", new Blob([body]), file.name);
  Object.keys(postdata).forEach((v, i, p) => {
    requestData.append(v, postdata[v]);
  });

  let response;
  try {
    response = await fetch(plugin.settings.api, { method: "POST", headers: plugin.settings.apiToken == "" ? new Headers() : new Headers({ Authorization: plugin.settings.apiToken }), body: requestData });
  } catch (error) {
    return { err: true, msg: $("网络错误,请检查网络是否通畅") };
  }

  if (response && !response.ok) {
    let result = await response.text();
    return { err: true, msg: $("网络错误,请检查网络是否通畅") };
  }

  let result = await response.json();

  if (result && !result.status) {
    return { err: true, msg: "API Error:" + result.message + result.details.join(""), apiError: result.details.join("") };
  } else {
    if (plugin.settings.isDeleteSource && file instanceof TFile) {
      plugin.app.fileManager.trashFile(file);
    }

    return { err: false, msg: result.message, imageUrl: result.data.imageUrl };
  }
}

/**
 * 处理元数据缓存
 * @param activeFile - 当前文件
 * @param plugin - 插件实例
 * @returns 处理后的元数据
 */
export interface Metadata {
  key: string;
  type: string;
  value: Array<string>;
  params: UploadSet;
}




/**
 * 处理文件的元数据缓存
 * @param activeFile - 当前活动文件
 * @param plugin - 插件实例
 * @returns 处理后的元数据数组
 */
export function metadataCacheHandle(activeFile: TFile, plugin: CustomImageAutoUploader): Metadata[] {
  const cache = plugin.app.metadataCache.getFileCache(activeFile);

  let metadataNeedKeys = Array<string>();

  plugin.settings.propertyNeedSets.forEach((item, i) => {
    metadataNeedKeys[i] = item.key;
  });

  let handleMetadata: Metadata[] = [];

  if (cache?.frontmatter) {
    Object.keys(cache.frontmatter).forEach((key) => {
      if (cache?.frontmatter && metadataNeedKeys.includes(key)) {
        let i: number = metadataNeedKeys.indexOf(key);
        if (typeof cache.frontmatter[key] == "string") {
          const match = cache.frontmatter[key].match(/^\!\[\[(.*)\]\]$/);
          if (match) {
            cache.frontmatter[key] = match[1];
          }
          handleMetadata.push({ key: key, type: "string", value: [<string>cache.frontmatter[key]], params: plugin.settings.propertyNeedSets[i] });
        } else if (Array.isArray(cache.frontmatter[key])) {
          let pics = [];
          for (let index = 0; index < cache.frontmatter[key].length; index++) {
            pics.push(<string>cache.frontmatter[key][index]);
          }
          handleMetadata.push({ key: key, type: "array", value: pics, params: plugin.settings.propertyNeedSets[i] });
        }
      }
    });
  }

  return handleMetadata;
}

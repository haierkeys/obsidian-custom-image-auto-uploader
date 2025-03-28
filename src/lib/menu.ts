import BetterSync from "../main";
import { SyncFiles } from "./fs";
import { $ } from "../lang/lang";


export const AddRibbonIcon = async function (plugin: BetterSync) {
  clearInterval(plugin.ribbonIconInterval)
  plugin.ribbonIconInterval = setInterval(() => {
    if (plugin.websocket.wsIsOpen != true) {
      if (plugin.ribbonIconStatus && plugin.ribbonIcon) {
        plugin.ribbonIcon.remove()
        plugin.ribbonIconStatus = false
      }
      plugin.ribbonIcon = plugin.addRibbonIcon("loader-circle",  "BetterSync: " + $("同步全部笔记"), () => {
        SyncFiles(plugin)
      })
    } else {
      if (!plugin.ribbonIconStatus && plugin.ribbonIcon) {
        plugin.ribbonIcon.remove()
        plugin.ribbonIconStatus = true
      }
      plugin.ribbonIcon = plugin.addRibbonIcon("rotate-cw",  "BetterSync: " + $("同步全部笔记"), () => {
        SyncFiles(plugin)
      })
    }
  }, 1000)
}

// export const addCustomStyles = function () {
//   const style = `
//             .better-sync-ribbon-icon {
//                 animation: rotate 2s linear infinite; /* 旋转动画：2秒一圈，线性，无限循环 */
//             }
//             @keyframes rotate {
//                 from {
//                     transform: rotate(0deg);
//                 }
//                 to {
//                     transform: rotate(360deg);
//                 }
//             }
//         `
//   const stylesheet = document.createElement("style")
//   stylesheet.textContent = style
//   document.head.appendChild(stylesheet)
// }

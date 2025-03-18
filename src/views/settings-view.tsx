import { useState, useEffect } from "react"
import { ICON_TYPE, Icon } from "src/icon"
import BetterSync from "src/main"
import { UploadSet } from "src/setting"
import { $ } from "src/lang"

async function getClipboardContent(plugin: BetterSync): Promise<void> {
  const clipboardReadTipSave = async (api: string, apiToken: string, clipboardReadTip: string) => {
    plugin.settings.api = api
    plugin.settings.apiToken = apiToken
    plugin.settings.clipboardReadTip = clipboardReadTip

    await plugin.saveData(plugin.settings)
    plugin.settingTab.display()

    setTimeout(() => {
      plugin.settings.clipboardReadTip = ""
      plugin.saveData(plugin.settings)
    }, 2000)
  }

  //
  const clipboardReadTipTipSave = async (clipboardReadTip: string) => {
    plugin.settings.clipboardReadTip = clipboardReadTip

    await plugin.saveData(plugin.settings)
    plugin.settingTab.display()

    setTimeout(() => {
      plugin.settings.clipboardReadTip = ""
      plugin.saveData(plugin.settings)
    }, 2000)
  }

  try {
    // 检查浏览器是否支持 Clipboard API
    if (!navigator.clipboard) {
      return
    }

    // 获取剪贴板文本内容
    const text = await navigator.clipboard.readText()

    // 检查是否为 JSON 格式
    let parsedData: any
    try {
      parsedData = JSON.parse(text)

      // 检查是否为对象且包含 api 和 apiToken
      if (typeof parsedData === "object" && parsedData !== null) {
        const hasApi = "api" in parsedData
        const hasApiToken = "apiToken" in parsedData

        if (hasApi && hasApiToken) {
          clipboardReadTipSave(parsedData.api, parsedData.apiToken, "接口配置信息已经粘贴到设置中!")
        } else {
          clipboardReadTipTipSave("未检测到配置信息!")
        }
      } else {
        clipboardReadTipTipSave("未检测到配置信息!")
      }
    } catch (jsonErr) {
      clipboardReadTipTipSave("未检测到配置信息!")
      return
    }
    return
  } catch (err) {
    clipboardReadTipTipSave("未检测到配置信息!")
    return
  }
}

export const SettingsView = ({ plugin }: { plugin: BetterSync }) => {
  return (
    <>
      <div className="setting-item">
        <div className="setting-item-info">
          <div className="setting-item-name">网关服务选择</div>
          <div className="setting-item-description">选择一个适合自己的网关服务</div>
        </div>
      </div>
      <div>
        <table className="custom-image-auto-uploader-settings-openapi">
          <thead>
            <tr>
              <th style={{ textAlign: "center" }}>方式</th>
              <th style={{ textAlign: "center" }}></th>
              <th style={{ textAlign: "center" }}>说明</th>
            </tr>
          </thead>
          <tbody>
            <tr>
              <td style={{ textAlign: "center" }}>自行搭建</td>
              <td>
                <a href="https://github.com/haierkeys/image-api-gateway">https://github.com/haierkeys/image-api-gateway</a>
              </td>
              <td style={{ textAlign: "center" }}>速度好, 自由配置, 无隐私风险, 支持云存储和服务端存储</td>
            </tr>
            <tr>
              <td style={{ textAlign: "center" }}>多用户开放网关</td>
              <td>
                <a href="https://img.diybeta.com/">https://img.diybeta.com</a>
              </td>
              <td style={{ textAlign: "center" }}>稳定性好, 仅支持用户的云存储</td>
            </tr>
          </tbody>
        </table>
      </div>
      <div className="clipboard-read">
        <button className="clipboard-read-button" onClick={() => getClipboardContent(plugin)}>
          粘贴多用户开放网关的接口配置
        </button>
        <div className="clipboard-read-description">{plugin.settings.clipboardReadTip}</div>
      </div>
    </>
  )
}

import { useState, useEffect } from "react";

import { ICON_TYPE, Icon } from "src/icon";
import TagsOverviewPlugin from "src/main";
import { UploadSet, ImageSvrProcessMode } from "src/setting";
import { $ } from "src/lang";

export const SettingsView = ({ plugin }: { plugin: TagsOverviewPlugin }) => {
  const frontMatterPropertiesSet = new Set<string>();
  plugin.app.vault.getMarkdownFiles().forEach((file) => {
    const cache = plugin.app.metadataCache.getFileCache(file);
    if (cache?.frontmatter) {
      Object.keys(cache.frontmatter).forEach((key) => frontMatterPropertiesSet.add(key));
    }
  });

  // Convert to array and sort
  const frontMatterProperties: string[] = Array.from(frontMatterPropertiesSet);
  frontMatterProperties.sort((a, b) => a.localeCompare(b));

  return (
    <>
      <div className="setting-item">
        <div className="setting-item-info">
          <div className="setting-item-name">{$("笔记正文图片")}</div>
          <div className="setting-item-description">{$("设置图片压缩模式, 0不限制, 最大值不会超过服务端相关设置")}</div>
        </div>
      </div>
      <ContentSet plugin={plugin} />
      <div className="setting-item">
        <div className="setting-item-info">
          <div className="setting-item-name">{$("笔记属性图片")}</div>
          <div className="setting-item-description">{$("设置图片压缩模式, 0不限制, 最大值不会超过服务端相关设置")}</div>
        </div>
      </div>
      <PropertyNeedSet plugin={plugin} frontMatterProperties={frontMatterProperties} />
    </>
  );
};

export const ContentSet = ({ plugin }: { plugin: TagsOverviewPlugin }) => {
  const [contentSet, setContentSet] = useState<UploadSet>(plugin.settings.contentSet);

  useEffect(() => {
    save();
  }, [contentSet]);

  const setWidth = (value: string) => {
     setContentSet({ key: "", type: contentSet.type, width: value, height: contentSet.height });
  };

  const setHeight = (value: string) => {
    setContentSet({ key: "", type: contentSet.type, width: contentSet.width, height: value });

  };

  const setType = (value: string) => {
    setContentSet({ key: "", type: value, width: contentSet.width, height: contentSet.height });
  };

  const save = async () => {
    plugin.settings.contentSet = contentSet;
    await plugin.saveData(plugin.settings);
  };

  const ImageSvrProcessModeEntries = Object.entries(ImageSvrProcessMode);

  const TableRows = (
    <tr>
      <td style={{ textAlign: "center", width: "20%" }}>{$("正文图片")}</td>
      <td style={{ textAlign: "center", width: "20%" }}>
        <input type="text" style={{ width: "60px" }} value={contentSet.width} onChange={(e) => setWidth(e.target.value)} />
      </td>
      <td style={{ textAlign: "center", width: "20%" }}>
        <input type="text" style={{ width: "60px" }} value={contentSet.height} onChange={(e) => setHeight(e.target.value)} />
      </td>
      <td style={{ textAlign: "center", width: "20%" }}>
        <select value={contentSet.type} onChange={(e) => setType(e.target.value)}>
          {ImageSvrProcessModeEntries.map((item) => (
            <option key={item[1].value} value={item[1].value}>
              {item[1].label}
            </option>
          ))}
        </select>
      </td>
      <td></td>
    </tr>
  );

  return (
    <div>
      <table className="tags-overview-settings-table" style={{ width: "100%", marginBottom: "5px" }}>
        <thead>
          <tr>
            <th style={{ textAlign: "center" }}></th>
            <th style={{ textAlign: "center" }}>{$("宽度")}</th>
            <th style={{ textAlign: "center" }}>{$("高度")}</th>
            <th style={{ textAlign: "center" }}>{$("调整压缩")}</th>
            <th></th>
          </tr>
        </thead>
        <tbody>{TableRows}</tbody>
      </table>
    </div>
  )
};

export const PropertyNeedSet = ({ plugin, frontMatterProperties }: { plugin: TagsOverviewPlugin; frontMatterProperties: string[] }) => {
  const [propertyNeedSets, setPropertyNeedSets] = useState<UploadSet[]>(plugin.settings.propertyNeedSets);

  useEffect(() => {
    save();
  }, [propertyNeedSets]);

  const selectedTypes: string[] = propertyNeedSets.map((propertyNeedSet: UploadSet) => propertyNeedSet.key);

  const add = (property: string) => {
    if (!propertyNeedSets.find((selectedProperty) => selectedProperty.property === property)) {
      setPropertyNeedSets([...propertyNeedSets, { key: property, type: ImageSvrProcessMode.none.value, width: "0", height: "0" }]);
    }
  };

  const setWidth = (propertyNeedSet: UploadSet, value: string) => {
    const index = propertyNeedSets.indexOf(propertyNeedSet);
    const tempPropertyNeeds = [...propertyNeedSets];
    tempPropertyNeeds[index].width = value;
    setPropertyNeedSets([...tempPropertyNeeds]);
  };

  const setHeight = (propertyNeedSet: UploadSet, value: string) => {
    const index = propertyNeedSets.indexOf(propertyNeedSet);
    const tempPropertyNeeds = [...propertyNeedSets];
    tempPropertyNeeds[index].height = value;
    setPropertyNeedSets([...tempPropertyNeeds]);
  };

  const setType = (propertyNeedSet: UploadSet, value: string) => {
    const index = propertyNeedSets.indexOf(propertyNeedSet);
    const tempPropertyNeeds = [...propertyNeedSets];
    tempPropertyNeeds[index].type = value;
    setPropertyNeedSets([...tempPropertyNeeds]);
  };

  const remove = (index: number) => {
    const tempPropertyNeeds = [...propertyNeedSets];
    tempPropertyNeeds.splice(index, 1);
    setPropertyNeedSets([...tempPropertyNeeds]);
  };

  const save = async () => {
    plugin.settings.propertyNeedSets = propertyNeedSets;
    await plugin.saveData(plugin.settings);
  };

  const ImageSvrProcessModeEntries = Object.entries(ImageSvrProcessMode);

  const TableRows =
    propertyNeedSets.length === 0 ? (
      <tr>
        <td colSpan={3} className="no-columns-added">
          <i>No extra filters added</i>
          <p>The default ones will be displayed</p>
        </td>
      </tr>
    ) : (
      propertyNeedSets.map((propertySet: UploadSet, index: number) => {
        return (
          <tr key={`${propertySet.key}-${index}`}>
            <td style={{ textAlign: "center", width: "20%" }}>{propertySet.key}</td>
            <td style={{ textAlign: "center", width: "20%" }}>
              <input type="text" style={{ width: "60px" }} value={propertySet.width} onChange={(e) => setWidth(propertySet, e.target.value)} />
            </td>
            <td style={{ textAlign: "center", width: "20%" }}>
              <input type="text" style={{ width: "60px" }} value={propertySet.height} onChange={(e) => setHeight(propertySet, e.target.value)} />
            </td>
            <td style={{ textAlign: "center", width: "20%" }}>
              <select value={propertySet.type} onChange={(e) => setType(propertySet, e.target.value)}>
                {ImageSvrProcessModeEntries.map((item) => (
                  <option key={item[1].value} value={item[1].value}>
                    {item[1].label}
                  </option>
                ))}
              </select>
            </td>
            <td style={{ textAlign: "right" }}>
              <Icon
                className="move-up-icon"
                iconType={ICON_TYPE.trash}
                onClick={() => {
                  remove(index);
                }}
              />
            </td>
          </tr>
        );
      })
    );

  return (
    <div>
      <table className="tags-overview-settings-table" style={{ width: "100%", marginBottom: "5px" }}>
        <thead>
          <tr>
            <th style={{ textAlign: "center" }}>{$("属性")}</th>
            <th style={{ textAlign: "center" }}>{$("宽度")}</th>
            <th style={{ textAlign: "center" }}>{$("高度")}</th>
            <th style={{ textAlign: "center" }}>{$("调整压缩")}</th>
            <th></th>
          </tr>
        </thead>
        <tbody>{TableRows}</tbody>
        <tfoot>
          <tr>
            <td colSpan={3}>
              <span style={{ display: "inline-block", marginRight: "15px" }}>{$("添加属性图片上传")}</span>
              <select className="dropdown" onChange={(e) => add(e.target.value)}>
                <option value="">{$("选择属性")}</option>
                {frontMatterProperties
                  .filter((property) => !selectedTypes.includes(property))
                  .map((property) => (
                    <option key={property} value={property}>
                      {property}
                    </option>
                  ))}
              </select>
            </td>
          </tr>
        </tfoot>
      </table>
    </div>
  )
};

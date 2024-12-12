import { moment } from "obsidian";

import ar from "src/lang/locale/ar";
import be from "src/lang/locale/be";
import ca from "src/lang/locale/ca";
import da from "src/lang/locale/da";
import de from "src/lang/locale/de";
import en from "src/lang/locale/en";
import enGB from "src/lang/locale/en-gb";
import es from "src/lang/locale/es";
//import fa from "src/lang/locale/fa";
import fr from "src/lang/locale/fr";
import he from "src/lang/locale/he";
import hu from "src/lang/locale/hu";
import id from "src/lang/locale/id";
import it from "src/lang/locale/it";
import ja from "src/lang/locale/ja";
import ko from "src/lang/locale/ko";
import ms from "src/lang/locale/ms";
import ne from "src/lang/locale/ne";
import nl from "src/lang/locale/nl";
import nb from "src/lang/locale/nb";
import pl from "src/lang/locale/pl";
import pt from "src/lang/locale/pt";
import ptBR from "src/lang/locale/pt-br";
import ro from "src/lang/locale/ro";
import ru from "src/lang/locale/ru";
import sq from "src/lang/locale/sq";
import th from "src/lang/locale/th";
import tr from "src/lang/locale/tr";
import uk from "src/lang/locale/uk";
import vi from "src/lang/locale/vi";
import zhCN from "src/lang/locale/zh-cn";
import zhTW from "src/lang/locale/zh-tw";


export interface lang {
    [propName: string]: any;
}

export const localeMap: { [k: string]: Partial<typeof en> } = {
    ar,
    be,
    ca,
    da,
    de,
    en,
    "en-gb": enGB,
    es,
    // fa,
    fr,
    he,
    hu,
    id,
    it,
    ja,
    ko,
    ms,
    ne,
    nl,
    nb,
    pl,
    pt,
    "pt-br": ptBR,
    ro,
    ru,
    sq,
    th,
    tr,
    uk,
    vi,
    "zh-cn": zhCN,
    "zh-tw": zhTW,
};

const locale = localeMap[moment.locale()];

// https://stackoverflow.com/a/41015840/
function interpolate(str: string, params: Record<string, unknown>): string {
    const names: string[] = Object.keys(params);
    const vals: unknown[] = Object.values(params);
    return new Function(...names, `return \`${str}\`;`)(...vals);
}

export function $(str: keyof typeof en, params?: Record<string, unknown>): string {

    const result = (locale && locale[str]) || en[str];

    if (params) {
        return interpolate(result, params);
    }

    return result;
}


//   // CARD_TYPES_SUMMARY: "总卡片数: ${totalCardsCount}",
//   t("CARD_TYPES_SUMMARY", { totalCardsCount }),
/**

通过AI 进行多语言翻译

我提供一段typescript的代码，键的部分保持简体中文,你帮我把值的部分翻译成英文。


键的部分保持简体中文,再帮我把值的部分翻译成繁体中文


键的部分保持简体中文,再帮我把值的部分翻译成阿拉伯语 ar
键的部分保持简体中文,再帮我把值的部分翻译成白俄罗斯语 be
键的部分保持简体中文,再帮我把值的部分翻译成加泰罗尼亚语 ca
键的部分保持简体中文,再帮我把值的部分翻译成丹麦语 da
键的部分保持简体中文,再帮我把值的部分翻译成德语 de
键的部分保持简体中文,再帮我把值的部分翻译成西班牙语   es
键的部分保持简体中文,再帮我把值的部分翻译成法语   fr
键的部分保持简体中文,再帮我把值的部分翻译成希伯来语 he
键的部分保持简体中文,再帮我把值的部分翻译成匈牙利语 hu
键的部分保持简体中文,再帮我把值的部分翻译成印度尼西亚语 id
键的部分保持简体中文,再帮我把值的部分翻译成意大利语   it
键的部分保持简体中文,再帮我把值的部分翻译成日语   ja
键的部分保持简体中文,再帮我把值的部分翻译成韩语   ko
键的部分保持简体中文,再帮我把值的部分翻译成马来语 ms
键的部分保持简体中文,再帮我把值的部分翻译成挪威语 nb
键的部分保持简体中文,再帮我把值的部分翻译成尼泊尔语 ne
键的部分保持简体中文,再帮我把值的部分翻译成荷兰语 nl
键的部分保持简体中文,再帮我把值的部分翻译成波兰语   pl
键的部分保持简体中文,再帮我把值的部分翻译成葡萄牙语  pt-br
键的部分保持简体中文,再帮我把值的部分翻译成葡萄牙语 pt
键的部分保持简体中文,再帮我把值的部分翻译成罗马尼亚语 ro
键的部分保持简体中文,再帮我把值的部分翻译成俄语 ru
键的部分保持简体中文,再帮我把值的部分翻译成阿尔巴尼亚语 sq
键的部分保持简体中文,再帮我把值的部分翻译成泰语 th
键的部分保持简体中文,再帮我把值的部分翻译成土耳其语 tr
键的部分保持简体中文,再帮我把值的部分翻译成乌克兰语 uk
键的部分保持简体中文,再帮我把值的部分翻译成越南语 vi

语言对照表
am አማርኛ
ar اَلْعَرَبِيَّةُ
be беларуская мова
ca català
cs čeština
da Dansk
de Deutsch
en English
en-GB English (GB)
es Español
fa فارسی
fr Français
he עברית
hu Magyar
id Bahasa Indonesia
it Italiano
ja 日本語
kh ខ្មែរ
ko 한국어
ms Bahasa Melayu
ne नेपाली
nl Nederlands
no Norsk
pl Polski
pt Português
pt-BR Português do Brasil
ro Română
ru Pусский
sq Shqip
th ไทย
tr Türkçe
uk Українська
vi Tiếng Việt
zh 简体中文
zh-TW 繁體中文

*/
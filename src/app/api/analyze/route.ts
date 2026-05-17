import { NextResponse } from "next/server";
import { Lunar, Solar } from "lunar-javascript/lunar";

type ElementName = "木" | "火" | "土" | "金" | "水";

type AnalyzeRequest = {
  calendarType?: string;
  birthDate?: string;
  birthTime?: string;
  gender?: string;
};

type WallpaperPreview = {
  title: string;
  basis: string;
  visual: string;
  cls: string;
  prompt: string;
  imageUrl?: string;
};

const elementByChar: Record<string, ElementName> = {
  甲: "木", 乙: "木", 寅: "木", 卯: "木",
  丙: "火", 丁: "火", 巳: "火", 午: "火",
  戊: "土", 己: "土", 辰: "土", 戌: "土", 丑: "土", 未: "土",
  庚: "金", 辛: "金", 申: "金", 酉: "金",
  壬: "水", 癸: "水", 子: "水", 亥: "水",
};

const previewImages: Record<string, string> = {
  nature: "https://webstatic.aiproxy.vip/output/20260517/128382/8a9f44cd-1f41-48a1-85e5-9cf457aa94f0/983b7c26-26b1-49a4-b340-03771c5e94c2.png",
  abstract: "https://webstatic.aiproxy.vip/output/20260517/128382/951e75fa-de2c-49d0-b127-2a96591e4fb6/a42f6e9e-2d5f-4180-aa23-50286abf13d3.png",
  cute: "https://webstatic.aiproxy.vip/output/20260517/128382/33e9be24-99f3-41c4-b03d-c56bac6397ee/bb7b10c9-95b1-40be-b8b2-2285136182e0.png",
  minimal: "https://webstatic.aiproxy.vip/output/20260517/128382/27a29b93-f048-4e00-bebe-2e26029f4547/3cec5c25-7ac7-41e5-b7b2-1c75602bcbc6.png",
  ink: "https://webstatic.aiproxy.vip/output/20260517/128382/3ff4f7d7-8e93-4207-b315-ce79b62e1478/0e178bf1-dee1-423c-bfab-5d878be63f02.png",
};

const balanceMap: Record<ElementName, ElementName[]> = {
  木: ["金", "土"],
  火: ["水", "金"],
  土: ["木", "水"],
  金: ["火", "木"],
  水: ["土", "火"],
};

function parseDateParts(birthDate: string, birthTime: string) {
  const [year = "1996", month = "8", day = "18"] = birthDate.split("-");
  const [hour = "8", minute = "30"] = birthTime.split(":");
  return { year: Number(year), month: Number(month), day: Number(day), hour: Number(hour), minute: Number(minute) };
}

function getEightChar(calendarType: string, birthDate: string, birthTime: string) {
  const date = parseDateParts(birthDate, birthTime || "12:00");
  const lunar = calendarType === "农历"
    ? Lunar.fromYmdHms(date.year, date.month, date.day, date.hour, date.minute, 0)
    : Solar.fromYmdHms(date.year, date.month, date.day, date.hour, date.minute, 0).getLunar();
  const eightChar = lunar.getEightChar();
  return { year: eightChar.getYear(), month: eightChar.getMonth(), day: eightChar.getDay(), time: eightChar.getTime() };
}

function countElements(parts: string[]) {
  const counts: Record<ElementName, number> = { 木: 0, 火: 0, 土: 0, 金: 0, 水: 0 };
  parts.join("").split("").forEach((char) => {
    const element = elementByChar[char];
    if (element) counts[element] += 1;
  });
  return counts;
}

function pickElementSummary(counts: Record<ElementName, number>) {
  const sorted = (Object.entries(counts) as Array<[ElementName, number]>).sort((a, b) => b[1] - a[1]);
  const strong = sorted[0][0];
  const weak = sorted[sorted.length - 1][0];
  return { strong, weak, text: `五行倾向：${strong}偏旺，${weak}相对不足` };
}

function getCurrentMonthPillar() {
  return Solar.fromDate(new Date()).getLunar().getEightChar().getMonth();
}

function buildTheme(strong: ElementName, weak: ElementName, currentMonth: string) {
  const balance = balanceMap[strong] ?? [weak];
  const balanceText = balance.join("、");
  return {
    title: `${strong}旺，宜用${balanceText}调和`,
    copy: `当前月份为 ${currentMonth}，结合你的五行状态，今天更适合用${balanceText}相关的颜色、材质和意象，让手机壁纸更稳定耐看。`,
    relation: `当前月柱：${currentMonth}。如果当月气势加重${strong}，推荐用${balanceText}做视觉平衡。`,
    balance,
  };
}

function previewPool(strong: ElementName, weak: ElementName, balance: ElementName[]): WallpaperPreview[] {
  const colorByElement: Record<ElementName, string> = {
    木: "青绿、浅绿、植物色",
    火: "暖橙、柔红、日光色",
    土: "米黄、麦色、暖棕",
    金: "银白、灰金、金属色",
    水: "蓝色、黑蓝、透明水色",
  };

  const pool: Record<ElementName, WallpaperPreview[]> = {
    水: [
      { title: "自然风景", basis: `${strong}偏旺，适合用水意象做平衡`, visual: "湖海、雨雾、远山、开阔留白", cls: "nature", prompt: "vertical phone wallpaper in natural landscape style, calm water, mist, open composition, refined modern aesthetic" },
      { title: "抽象能量", basis: `用${colorByElement.水}做主色，让画面更安静`, visual: "流动渐变、水波纹、透明光感", cls: "abstract", prompt: "vertical phone wallpaper in abstract energy style, flowing blue gradients, water ripple texture, translucent light" },
    ],
    金: [
      { title: "极简留白", basis: "金象征秩序和边界，适合干净克制的视觉", visual: "线条、留白、银灰、低饱和", cls: "minimal", prompt: "vertical phone wallpaper in minimal clean style, silver gray lines, negative space, premium calm composition" },
      { title: "未来金属", basis: `用${colorByElement.金}强化清晰感和质感`, visual: "金属、玻璃、冷光、科技材质", cls: "metal", prompt: "vertical phone wallpaper in futuristic metallic style, chrome texture, glass light, elegant mobile wallpaper" },
    ],
    木: [
      { title: "治愈插画", basis: "木代表生发和舒展，适合温柔有生命力的风格", visual: "植物、动物、柔和卡通、轻故事感", cls: "cute", prompt: "vertical phone wallpaper in healing illustration style, soft plants, gentle cute character, fresh green palette" },
      { title: "自然风景", basis: `用${colorByElement.木}增加呼吸感`, visual: "森林、草地、新芽、晨光", cls: "nature", prompt: "vertical phone wallpaper in natural scenery style, forest, fresh green light, breathable composition" },
    ],
    火: [
      { title: "大色块情绪", basis: `用${colorByElement.火}提亮行动力，但保持高级低饱和`, visual: "大面积暖色、日落、光晕、渐变", cls: "vibrant", prompt: "vertical phone wallpaper in bold color mood style, warm orange glow, soft gradients, trendy visual design" },
      { title: "抽象能量", basis: "火意象适合做成光感和动势，不一定要画具体太阳", visual: "光轨、暖色流线、能量波纹", cls: "abstract", prompt: "vertical phone wallpaper in abstract energy style, warm light trails, orange glow, dynamic but elegant" },
    ],
    土: [
      { title: "国风水墨", basis: "土有承托感，适合山形、留白和稳定构图", visual: "山石、云气、水墨、东方留白", cls: "ink", prompt: "vertical phone wallpaper in modern chinese ink style, mountains, clouds, elegant blank space, premium mobile wallpaper" },
      { title: "自然风景", basis: `用${colorByElement.土}做稳定、温和的底色`, visual: "旷野、麦田、低山、暖色胶片", cls: "nature", prompt: "vertical phone wallpaper in natural landscape style, open field, low hills, warm earthy palette, cinematic calm" },
    ],
  };

  const neutral: WallpaperPreview[] = [
    { title: "梦幻星空", basis: "适合作为备选方向，用深色和光点增强沉浸感", visual: "星空、极光、微光粒子、深色氛围", cls: "aurora", prompt: "vertical phone wallpaper in dreamy starry style, aurora lights, tiny particles, deep elegant atmosphere" },
    { title: "治愈插画", basis: "如果想要更轻松，可以把五行意象转成可爱插画", visual: "软萌角色、植物、轻故事、干净背景", cls: "cute", prompt: "vertical phone wallpaper in healing cute illustration style, soft character, plants, clean background" },
  ];

  const selected = [...balance.flatMap((item) => pool[item]), ...pool[weak], ...pool[strong], ...neutral];
  const unique = new Map(selected.map((item) => [item.title, item]));
  return [...unique.values()].slice(0, 5).map((item) => ({ ...item, imageUrl: previewImages[item.cls] }));
}

export async function POST(request: Request) {
  const body = (await request.json()) as AnalyzeRequest;
  const birthDate = body.birthDate || "1996-08-18";
  const birthTime = body.birthTime || "08:30";
  const eightChar = getEightChar(body.calendarType || "阳历", birthDate, birthTime);
  const parts = [eightChar.year, eightChar.month, eightChar.day, eightChar.time];
  const counts = countElements(parts);
  const element = pickElementSummary(counts);
  const currentMonth = getCurrentMonthPillar();
  const theme = buildTheme(element.strong, element.weak, currentMonth);

  return NextResponse.json({
    bazi: `${eightChar.year}年 ${eightChar.month}月 ${eightChar.day}日 ${eightChar.time}时`,
    baziDetail: { year: eightChar.year, month: eightChar.month, day: eightChar.day, time: eightChar.time },
    elementCounts: counts,
    elementSummary: element.text,
    monthRelation: theme.relation,
    themeTitle: theme.title,
    themeCopy: theme.copy,
    reasoning: `系统根据出生时间排出四柱：${parts.join(" ")}，统计五行数量为木${counts.木}、火${counts.火}、土${counts.土}、金${counts.金}、水${counts.水}。再结合当前月柱 ${currentMonth} 判断当月气势，先判断适合的颜色、材质和象征物，再把它们归纳成 3-5 个可选择的大风格方向。`,
    previews: previewPool(element.strong, element.weak, theme.balance),
  });
}



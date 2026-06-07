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

type DirectionTemplate = {
  title: string;
  status: string;
  cls: string;
  dark?: boolean;
  elements: ElementName[];
  moods: string[];
  visuals: string[];
  palette: string;
  material: string;
  promptStyle: string;
  promptScene: string;
};

const elementByChar: Record<string, ElementName> = {
  甲: "木", 乙: "木", 寅: "木", 卯: "木",
  丙: "火", 丁: "火", 巳: "火", 午: "火",
  戊: "土", 己: "土", 辰: "土", 戌: "土", 丑: "土", 未: "土",
  庚: "金", 辛: "金", 申: "金", 酉: "金",
  壬: "水", 癸: "水", 子: "水", 亥: "水",
};

const dayMasterTemperament: Record<ElementName, string> = {
  木: "重生长感和行动感，适合有路径、有延展的画面",
  火: "重热情和显性表达，适合光感、日出、暖色秩序",
  土: "重稳定和承载感，适合大地、山谷、建筑和厚重材质",
  金: "重边界和审美秩序，适合干净、清爽、有结构的画面",
  水: "重流动和感受力，适合雾气、夜色、湖面和柔和过渡",
};

const producingElement: Record<ElementName, ElementName> = { 木: "水", 火: "木", 土: "火", 金: "土", 水: "金" };
const producedElement: Record<ElementName, ElementName> = { 木: "火", 火: "土", 土: "金", 金: "水", 水: "木" };
const controllingElement: Record<ElementName, ElementName> = { 木: "金", 火: "水", 土: "木", 金: "火", 水: "土" };
const elementKey: Record<ElementName, string> = { 木: "wood", 火: "fire", 土: "earth", 金: "metal", 水: "water" };
const allElements: ElementName[] = ["木", "火", "土", "金", "水"];

const directionTemplates: DirectionTemplate[] = [
  { title: "雾蓝降躁", status: "清醒回血", cls: "tone-water-calm", elements: ["水", "金"], moods: ["火旺需要降温", "想让脑子清一点", "适合忙乱后恢复"], visuals: ["雾蓝湖面", "远山水气", "玻璃般的浅蓝光"], palette: "雾蓝、银白、浅灰", material: "水雾、玻璃、湖面反光", promptStyle: "photorealistic misty lake wallpaper, airy blue and silver palette", promptScene: "misty blue lake, distant mountains, translucent water vapor, soft silver light, very clean and calming" },
  { title: "麦金稳住", status: "踏实一点", cls: "tone-earth-gold", elements: ["土", "金"], moods: ["适合补稳定感", "适合把心落下来", "偏向收束和安全感"], visuals: ["金色麦田", "低坡沙丘", "夕阳落在大地纹理上"], palette: "麦金、奶油、陶土", material: "麦穗、沙丘、暖光颗粒", promptStyle: "cinematic golden wheat field wallpaper, warm grounded atmosphere", promptScene: "vast golden wheat field and gentle rolling hills at sunset, rich warm light, premium mobile wallpaper" },
  { title: "松林生发", status: "向上生长", cls: "tone-wood-fresh", elements: ["木", "水"], moods: ["适合补行动力", "适合舒展和开启", "偏向新开始"], visuals: ["晨雾松林", "新芽和斜阳", "山谷里向上的绿意"], palette: "松绿、晨白、浅金", material: "树影、晨雾、叶面光", promptStyle: "fresh forest morning wallpaper, refined botanical landscape", promptScene: "morning pine forest with soft mist, fresh green growth, warm first sunlight, elegant and not childish" },
  { title: "日光启动", status: "提气开工", cls: "tone-fire-sun", elements: ["火", "木"], moods: ["适合需要启动感", "适合低电量时提气", "偏向明亮和行动"], visuals: ["橙金云层", "日出光带", "温暖但不刺眼的天空"], palette: "橙金、珊瑚、奶白", material: "云、霞光、柔焦颗粒", promptStyle: "golden sunrise sky wallpaper, uplifting cinematic light", promptScene: "glowing orange sunrise clouds, soft golden rays, hopeful atmosphere, clean full bleed vertical wallpaper" },
  { title: "银白秩序", status: "专注收束", cls: "tone-metal-clear", elements: ["金", "土"], moods: ["适合减少杂念", "适合建立边界", "偏向干净和高级"], visuals: ["银白山脊", "磨砂金属光", "清爽留白结构"], palette: "银白、香槟金、浅岩灰", material: "岩石、金属、细线留白", promptStyle: "minimal premium silver mountain wallpaper, clean structured composition", promptScene: "silver white mountain ridges, champagne light, crisp air, minimalist luxury phone wallpaper" },
  { title: "奶油松弛", status: "轻松一点", cls: "tone-cream-soft", elements: ["土", "木", "火"], moods: ["适合温柔回血", "适合不想太玄", "偏向软和与亲近感"], visuals: ["奶油纸感", "软色植物", "午后窗光"], palette: "奶油、蜜桃、浅绿", material: "纸张、布纹、柔软阴影", promptStyle: "soft editorial illustration wallpaper, cozy youthful paper texture", promptScene: "cream paper collage with soft plants and afternoon sunlight, warm gentle tactile texture, modern young aesthetic" },
  { title: "星河清透", status: "打开想象", cls: "tone-star-glass", dark: true, elements: ["水", "金"], moods: ["适合灵感和观察", "适合夜间也耐看", "偏向清透冷感"], visuals: ["玻璃星河", "蓝黑夜色", "细碎银光"], palette: "深蓝、银白、透明青", material: "星光、玻璃、夜雾", promptStyle: "premium glassy starfield wallpaper, elegant dark blue cyan palette", promptScene: "deep blue starfield reflected in translucent glass waves, tiny silver lights, calm premium vertical wallpaper" },
  { title: "东方留白", status: "稳中有远", cls: "tone-oriental-ink", elements: ["水", "木", "土", "金"], moods: ["适合要一点靠山感", "适合克制不花", "偏向安静但有气势"], visuals: ["远山留白", "淡墨水气", "一线山脊"], palette: "米白、墨青、岩灰", material: "宣纸、雾、山石", promptStyle: "modern oriental landscape wallpaper, refined negative space", promptScene: "minimal misty oriental mountains, warm ivory paper texture, ink green rocks, elegant negative space" },
  { title: "能量色块", status: "换个心情", cls: "tone-pop-energy", elements: ["火", "土", "水"], moods: ["适合想要一点新鲜感", "适合换状态", "偏向大胆但不乱"], visuals: ["大色块渐变", "柔软流线", "明亮情绪场"], palette: "珊瑚、青蓝、暖黄", material: "渐变、光晕、丝滑曲面", promptStyle: "bold premium abstract gradient wallpaper, smooth emotional color fields", promptScene: "large smooth gradient color fields, coral cyan warm yellow, silky curves, young premium aesthetic, no chaos" },
  { title: "复古好运", status: "有点好玩", cls: "tone-retro-luck", elements: ["火", "金", "土"], moods: ["适合轻快一点", "适合想要好彩头", "偏向俏皮但不幼稚"], visuals: ["复古日历色块", "暖色几何", "小小好运感"], palette: "番茄红、奶油黄、墨黑", material: "海报纸、颗粒、几何拼贴", promptStyle: "retro poster inspired wallpaper, tasteful graphic shapes, no text", promptScene: "retro geometric poster style without any text, tomato red cream yellow black accents, tasteful lucky mood, full bleed wallpaper" },
];

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

function getCurrentMonthPillar() {
  return Solar.fromDate(new Date()).getLunar().getEightChar().getMonth();
}

function getDayMaster(dayPillar: string): ElementName {
  return elementByChar[dayPillar.charAt(0)] ?? "土";
}

function getUsefulElements(dayMaster: ElementName, counts: Record<ElementName, number>) {
  const supportScore = counts[dayMaster] + counts[producingElement[dayMaster]];
  const pressureScore = counts[controllingElement[dayMaster]] + counts[producedElement[dayMaster]];
  const isWeak = supportScore <= pressureScore;
  const useful = isWeak
    ? [dayMaster, producingElement[dayMaster], producedElement[producingElement[dayMaster]]]
    : [producedElement[dayMaster], controllingElement[dayMaster], producedElement[producedElement[dayMaster]]];
  const avoid = isWeak
    ? [controllingElement[dayMaster], producedElement[dayMaster]]
    : [dayMaster, producingElement[dayMaster]];
  return { useful: Array.from(new Set(useful)), avoid: Array.from(new Set(avoid)), isWeak, supportScore, pressureScore };
}

function hashText(value: string) {
  let hash = 2166136261;
  for (const char of value) {
    hash ^= char.charCodeAt(0);
    hash = Math.imul(hash, 16777619);
  }
  return Math.abs(hash >>> 0);
}

function elementFromPillar(pillar: string): ElementName | null {
  for (const char of pillar) {
    const element = elementByChar[char];
    if (element) return element;
  }
  return null;
}

function getLowElements(counts: Record<ElementName, number>) {
  const min = Math.min(...allElements.map((element) => counts[element]));
  return allElements.filter((element) => counts[element] === min);
}

function scoreTemplate(
  template: DirectionTemplate,
  params: {
    useful: ElementName[];
    avoid: ElementName[];
    lowElements: ElementName[];
    dayMaster: ElementName;
    currentMonthElement: ElementName | null;
    timeElement: ElementName | null;
    isWeak: boolean;
    seed: number;
    index: number;
  },
) {
  const uniqueElements = new Set(template.elements);
  const usefulScore = template.elements.reduce((sum, element) => sum + (params.useful.includes(element) ? 9 : 0), 0);
  const lowElementScore = template.elements.reduce((sum, element) => sum + (params.lowElements.includes(element) ? 5 : 0), 0);
  const monthScore = params.currentMonthElement && uniqueElements.has(params.currentMonthElement) ? 3 : 0;
  const timeScore = params.timeElement && uniqueElements.has(params.timeElement) ? 2 : 0;
  const dayMasterScore = params.isWeak && uniqueElements.has(params.dayMaster) ? 3 : 0;
  const avoidPenalty = template.elements.reduce((sum, element) => sum + (params.avoid.includes(element) ? 5 : 0), 0);
  const broadPenalty = Math.max(0, template.elements.length - 2) * 3.5;
  const variety = ((params.seed >> (params.index % 14)) & 15) * 0.8;
  return usefulScore + lowElementScore + monthScore + timeScore + dayMasterScore + variety - avoidPenalty - broadPenalty;
}

function buildTheme(params: { dayMaster: ElementName; useful: ElementName[]; avoid: ElementName[]; isWeak: boolean; currentMonth: string }) {
  const usefulText = params.useful.join("、");
  const avoidText = params.avoid.join("、");
  return {
    title: `今天适合多用${usefulText}来调和`,
    copy: `当前月份为 ${params.currentMonth}。我会把你的五行状态转成几种壁纸方向，你选一个喜欢的，再生成高清图。`,
    relation: `当前月柱：${params.currentMonth}。你的日主为${params.dayMaster}，${dayMasterTemperament[params.dayMaster]}。今天更建议用${usefulText}相关的颜色、材质和意象，少用${avoidText}过重的画面。`,
    usefulText,
    avoidText,
  };
}

function buildPrompt(params: {
  template: DirectionTemplate;
  parts: string[];
  dayMaster: ElementName;
  usefulText: string;
  avoidText: string;
  currentMonth: string;
}) {
  return [
    params.template.promptScene,
    `visual style: ${params.template.promptStyle}`,
    `palette: ${params.template.palette}`,
    `materials: ${params.template.material}`,
    `personalized by Chinese Bazi chart ${params.parts.join(" ")}, day master ${params.dayMaster}, current month pillar ${params.currentMonth}`,
    `recommended elements: ${params.usefulText}; avoid overusing ${params.avoidText}`,
    "single 9:16 vertical smartphone wallpaper, gpt-image-2, ultra high definition, sharp clean details, premium mobile wallpaper aesthetic",
    "no text, no typography, no logo, no watermark, no UI, no phone frame, no people",
  ].join(". ");
}

const personalizedTitleMap: Record<string, string[]> = {
  雾蓝降躁: ["雾湖清醒", "蓝雾回血", "水光缓冲", "清泉降噪", "冷月静心"],
  麦金稳住: ["麦浪稳场", "金坡落定", "土金守心", "暖丘安住", "谷光聚气"],
  松林生发: ["松风生长", "青林开枝", "晨木舒展", "山谷发芽", "新枝向上"],
  日光启动: ["晨光启程", "日轮提气", "暖阳开局", "云隙生火", "朝光上扬"],
  银白秩序: ["银岭收束", "白岩定神", "金线清场", "霜光立序", "山脊专注"],
  奶油松弛: ["奶油回温", "柔光松弛", "桃雾缓和", "纸感小憩", "午后回血"],
  星河清透: ["星河开阔", "夜水通明", "玻璃灵感", "银蓝醒神", "星雾流光"],
  东方留白: ["远山留白", "墨青靠山", "云山定气", "山色有远", "纸上远行"],
  能量色块: ["流光换场", "色块转运", "青橙开关", "软光新局", "明彩醒场"],
  复古好运: ["红金好运", "复古开运", "暖格好彩", "番茄提气", "旧日新运"],
};

const personalTagMap: Record<ElementName, string[]> = {
  木: ["生发", "舒展", "向上", "新枝"],
  火: ["提气", "启动", "明亮", "暖场"],
  土: ["稳住", "落地", "安定", "承托"],
  金: ["清场", "收束", "秩序", "锋利"],
  水: ["回血", "流动", "清醒", "降躁"],
};

function pickVariant(items: string[], seed: number, offset: number) {
  return items[(seed + offset) % items.length];
}

function buildPersonalPreviews(params: {
  dayMaster: ElementName;
  useful: ElementName[];
  avoid: ElementName[];
  usefulText: string;
  avoidText: string;
  counts: Record<ElementName, number>;
  parts: string[];
  birthDate: string;
  birthTime: string;
  gender?: string;
  currentMonth: string;
  isWeak: boolean;
}): WallpaperPreview[] {
  const seed = hashText(`${params.parts.join("")}|${params.birthDate}|${params.birthTime}|${params.gender ?? ""}|${params.currentMonth}`);
  const lowElements = getLowElements(params.counts);
  const currentMonthElement = elementFromPillar(params.currentMonth);
  const timeElement = elementFromPillar(params.parts[3] ?? "");
  const sorted = directionTemplates
    .map((template, index) => ({
      template,
      score: scoreTemplate(template, {
        useful: params.useful,
        avoid: params.avoid,
        lowElements,
        dayMaster: params.dayMaster,
        currentMonthElement,
        timeElement,
        isWeak: params.isWeak,
        seed,
        index,
      }),
    }))
    .sort((a, b) => b.score - a.score);

  const picked: DirectionTemplate[] = [];
  const usedElements = new Set<ElementName>();
  for (const item of sorted) {
    if (picked.length >= 3) break;
    const sameTone = picked.some((chosen) => chosen.status === item.template.status || chosen.cls === item.template.cls);
    const overlapsTooMuch = item.template.elements.every((element) => usedElements.has(element)) && picked.length > 0;
    if (sameTone || overlapsTooMuch) continue;
    picked.push(item.template);
    item.template.elements.forEach((element) => usedElements.add(element));
  }
  for (const item of sorted) {
    if (picked.length >= 3) break;
    if (!picked.includes(item.template)) picked.push(item.template);
  }

  return picked.map((template, index) => {
    const title = pickVariant(personalizedTitleMap[template.title] || [template.title], seed, index * 7);
    const mood = template.moods[(seed + index) % template.moods.length];
    const visual = template.visuals[(seed + index * 3) % template.visuals.length];
    const mainElement = template.elements.find((element) => params.useful.includes(element)) || template.elements[0];
    const personalTag = pickVariant(personalTagMap[mainElement], seed, index * 5);
    const countHint = template.elements.map((element) => `${element}${params.counts[element]}`).join("、");
    return {
      title,
      basis: `推荐原因：你的四柱是 ${params.parts.join(" ")}，日主为${params.dayMaster}，这次更适合用${params.usefulText}来调和。此方向命中${countHint}，所以用「${personalTag}」作为主状态，并避开${params.avoidText}过重造成画面压迫。`,
      visual: `${personalTag}｜${visual}｜${template.palette}`,
      cls: `${template.cls}${template.dark ? " is-dark" : ""}`,
      prompt: buildPrompt({ template, parts: params.parts, dayMaster: params.dayMaster, usefulText: params.usefulText, avoidText: params.avoidText, currentMonth: params.currentMonth }),
      imageUrl: `/covers/${elementKey[template.elements[0]]}-abstract-01.svg`,
    };
  });
}

export async function POST(request: Request) {
  const body = (await request.json()) as AnalyzeRequest;
  const birthDate = body.birthDate || "1996-08-18";
  const birthTime = body.birthTime || "08:30";
  const eightChar = getEightChar(body.calendarType || "阳历", birthDate, birthTime);
  const parts = [eightChar.year, eightChar.month, eightChar.day, eightChar.time];
  const counts = countElements(parts);
  const sorted = (Object.entries(counts) as Array<[ElementName, number]>).sort((a, b) => b[1] - a[1]);
  const dayMaster = getDayMaster(eightChar.day);
  const currentMonth = getCurrentMonthPillar();
  const useful = getUsefulElements(dayMaster, counts);
  const theme = buildTheme({ dayMaster, useful: useful.useful, avoid: useful.avoid, isWeak: useful.isWeak, currentMonth });

  return NextResponse.json({
    bazi: `${eightChar.year}年 ${eightChar.month}月 ${eightChar.day}日 ${eightChar.time}时`,
    baziDetail: { year: eightChar.year, month: eightChar.month, day: eightChar.day, time: eightChar.time },
    elementCounts: counts,
    elementSummary: `五行分布：${sorted.map(([name, value]) => `${name}${value}`).join("、")}`,
    monthRelation: theme.relation,
    themeTitle: theme.title,
    themeCopy: theme.copy,
    reasoning: `简单说：系统先把你的出生信息换算成四柱八字（年、月、日、时），再看五行分布。你这次木${counts.木}、火${counts.火}、土${counts.土}、金${counts.金}、水${counts.水}；日主偏${useful.isWeak ? "需要补足和扶一扶" : "需要疏导和平衡"}。所以我不是固定给所有人同一批风格，而是优先选择${theme.usefulText}相关的颜色、材质和意象，再从${directionTemplates.length}组状态模板里按命中分、缺失分、月份分和出生时辰分重新排序，挑出今天更适合你的 3 种壁纸方向。`,
    previews: buildPersonalPreviews({
      dayMaster,
      useful: useful.useful,
      avoid: useful.avoid,
      usefulText: theme.usefulText,
      avoidText: theme.avoidText,
      counts,
      parts,
      birthDate,
      birthTime,
      gender: body.gender,
      currentMonth,
      isWeak: useful.isWeak,
    }),
  });
}

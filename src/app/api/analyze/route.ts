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

type StyleCategory = {
  title: string;
  cls: string;
  imageUrl: string;
  affinities: ElementName[];
  tone: string;
  promptStyle: string;
};

type SceneOption = {
  visual: string;
  prompt: string;
  imageUrl: string;
  cls: string;
};

const elementByChar: Record<string, ElementName> = {
  甲: "木", 乙: "木", 寅: "木", 卯: "木",
  丙: "火", 丁: "火", 巳: "火", 午: "火",
  戊: "土", 己: "土", 辰: "土", 戌: "土", 丑: "土", 未: "土",
  庚: "金", 辛: "金", 申: "金", 酉: "金",
  壬: "水", 癸: "水", 子: "水", 亥: "水",
};

const elementLabel: Record<ElementName, string> = {
  木: "生长、舒展、植物、清晨感",
  火: "日光、霞色、热烈、生命力",
  土: "稳定、山地、沙丘、麦田、暖黄米色",
  金: "秩序、清爽、金属、岩石、银白",
  水: "流动、雾气、湖面、清透、蓝白",
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
const categoryKey: Record<string, string> = {
  自然风景: "nature",
  抽象艺术: "abstract",
  治愈插画: "healing",
  极简质感: "minimal",
  东方山水: "oriental",
  能量光感: "energy",
};

function coverUrl(element: ElementName, categoryTitle: string) {
  return `/covers/${elementKey[element]}-${categoryKey[categoryTitle] ?? "nature"}-01.svg`;
}
const categories: StyleCategory[] = [
  { title: "自然风景", cls: "mist", imageUrl: "/previews/mist-lake.svg", affinities: ["木", "水", "土", "火"], tone: "真实、有空气感、适合做锁屏", promptStyle: "photorealistic cinematic landscape photography" },
  { title: "抽象艺术", cls: "sand", imageUrl: "/previews/sand-waves.svg", affinities: ["火", "土", "金", "水"], tone: "不直接画物体，但保留情绪和色彩能量", promptStyle: "modern abstract wallpaper, elegant shapes, premium color composition" },
  { title: "治愈插画", cls: "golden", imageUrl: "/previews/golden-wheat.svg", affinities: ["木", "火", "土"], tone: "柔和、年轻、轻故事感", promptStyle: "soft editorial illustration, refined youthful wallpaper style" },
  { title: "极简质感", cls: "metal", imageUrl: "/previews/sand-waves.svg", affinities: ["金", "土", "水"], tone: "干净、克制、适合不想太花的人", promptStyle: "minimal premium texture wallpaper, restrained composition" },
  { title: "东方山水", cls: "rock", imageUrl: "/previews/danxia-rock.svg", affinities: ["土", "金", "水", "木"], tone: "国风但不老气，留白和山势更强", promptStyle: "modern oriental landscape, cinematic negative space, premium Asian aesthetic" },
  { title: "能量光感", cls: "fiery", imageUrl: "/previews/fiery-clouds.svg", affinities: ["火", "金", "水"], tone: "更有冲劲，适合需要启动感的人", promptStyle: "luminous energy wallpaper, polished light, dramatic but clean" },
];

const sceneBank: Record<ElementName, Record<string, SceneOption[]>> = {
  木: {
    自然风景: [{ visual: "清晨山谷、新芽、薄雾和向上生长的枝叶", prompt: "early morning valley with fresh sprouts and slender branches, soft mist, gentle sunlight, fresh green kept elegant and not oversaturated", imageUrl: "/previews/mist-lake.svg", cls: "mist" }],
    抽象艺术: [{ visual: "柔和向上曲线、浅青绿和奶白色，像植物生长轨迹", prompt: "abstract upward flowing botanical curves, pale sage green and warm ivory, calm growth rhythm, no messy lines", imageUrl: "/previews/sand-waves.svg", cls: "sand" }],
    治愈插画: [{ visual: "小植物、晨光窗台、软萌但不幼稚", prompt: "healing illustration of small plants on a sunlit windowsill, soft morning light, warm youthful design, no characters", imageUrl: "/previews/golden-wheat.svg", cls: "golden" }],
    极简质感: [{ visual: "米白纸面上一条舒展的浅绿枝影", prompt: "minimal warm ivory paper background with one elegant pale green branch shadow, premium calm wallpaper", imageUrl: "/previews/sand-waves.svg", cls: "sand" }],
    东方山水: [{ visual: "松风远山、云影和留白", prompt: "pine trees and distant mountains, flowing clouds, refined modern Chinese landscape, generous negative space", imageUrl: "/previews/mist-lake.svg", cls: "mist" }],
    能量光感: [{ visual: "浅绿到金色的生长光带", prompt: "soft luminous ribbons from pale green to warm gold, feeling of growth and renewal, clean premium energy wallpaper", imageUrl: "/previews/fiery-clouds.svg", cls: "fiery" }],
  },
  火: {
    自然风景: [{ visual: "日出云海、暖橙霞光、没有刺眼太阳", prompt: "sunrise over clouds, warm peach and orange glow, no harsh sun disk, soft atmospheric landscape", imageUrl: "/previews/fiery-clouds.svg", cls: "fiery" }],
    抽象艺术: [{ visual: "橙红到奶油色渐变，像夕阳落在空气里", prompt: "abstract sunset gradient from warm orange red to cream, atmospheric glow, smooth modern composition", imageUrl: "/previews/sand-waves.svg", cls: "sand" }],
    治愈插画: [{ visual: "暖光房间、橘色小太阳、温柔生活感", prompt: "soft illustration of a warm sunlit room, orange glow, cozy and optimistic, no people, no text", imageUrl: "/previews/golden-wheat.svg", cls: "golden" }],
    极简质感: [{ visual: "暖橙光影落在米色墙面", prompt: "minimal beige wall with soft warm orange sunlight shadows, calm elegant texture, no objects", imageUrl: "/previews/sand-waves.svg", cls: "sand" }],
    东方山水: [{ visual: "晚霞照亮山脊，暖金色留白", prompt: "mountain ridges lit by golden sunset, warm mist, modern oriental landscape with spacious negative space", imageUrl: "/previews/danxia-rock.svg", cls: "rock" }],
    能量光感: [{ visual: "火烧云、金橙光层、启动感强", prompt: "intense golden orange sunset clouds filling the frame, dramatic warm sky, clean full-bleed wallpaper", imageUrl: "/previews/fiery-clouds.svg", cls: "fiery" }],
  },
  土: {
    自然风景: [{ visual: "沙丘、麦田、山谷，画面稳定开阔", prompt: "warm desert dunes and distant hills at golden hour, stable open landscape, no water, no people", imageUrl: "/previews/golden-wheat.svg", cls: "golden" }],
    抽象艺术: [{ visual: "沙色、陶土色、奶油色的柔和块面", prompt: "abstract soft sand waves in clay, cream and ochre tones, premium modern art wallpaper", imageUrl: "/previews/sand-waves.svg", cls: "sand" }],
    治愈插画: [{ visual: "麦田、陶罐、日光，温暖踏实", prompt: "warm editorial illustration of golden wheat and handmade clay pots under sunlight, comforting and grounded", imageUrl: "/previews/golden-wheat.svg", cls: "golden" }],
    极简质感: [{ visual: "微水泥、陶土、暖沙质感", prompt: "warm beige micro-cement and clay texture, matte finish, subtle natural shadows, minimalist premium wallpaper", imageUrl: "/previews/sand-waves.svg", cls: "sand" }],
    东方山水: [{ visual: "丹霞岩层、黄土山势、厚重稳定", prompt: "warm Danxia layered sandstone landform, ochre and terracotta, powerful grounded landscape, no people", imageUrl: "/previews/danxia-rock.svg", cls: "rock" }],
    能量光感: [{ visual: "暖黄光落在大地纹理上", prompt: "warm golden light spreading over earth textures, calm energy, elegant full-screen wallpaper", imageUrl: "/previews/fiery-clouds.svg", cls: "fiery" }],
  },
  金: {
    自然风景: [{ visual: "雪白山峰、岩石、清爽天空，秩序感强", prompt: "clean silver-white mountain peaks and structured rocks, crisp light, elegant landscape, no clutter", imageUrl: "/previews/mist-lake.svg", cls: "mist" }],
    抽象艺术: [{ visual: "银白线条、香槟金块面、干净结构", prompt: "abstract composition with silver-white lines and champagne gold planes, clean order, premium modern wallpaper", imageUrl: "/previews/sand-waves.svg", cls: "sand" }],
    治愈插画: [{ visual: "小月亮、银白星点、柔和守护感", prompt: "soft illustration of a silver moon and tiny warm stars, gentle protective feeling, clean youthful wallpaper", imageUrl: "/previews/mist-lake.svg", cls: "mist" }],
    极简质感: [{ visual: "银白、磨砂金属、细线留白", prompt: "minimal matte silver and champagne metal texture, fine micro-lines, luxurious but understated", imageUrl: "/previews/sand-waves.svg", cls: "sand" }],
    东方山水: [{ visual: "白石山、月色、清冷留白", prompt: "white stone mountains under moonlight, modern oriental composition, silver palette, calm negative space", imageUrl: "/previews/mist-lake.svg", cls: "mist" }],
    能量光感: [{ visual: "金白光轨、清爽、有边界", prompt: "gold and white luminous light trails, structured and clean, no neon mess, premium energy wallpaper", imageUrl: "/previews/fiery-clouds.svg", cls: "fiery" }],
  },
  水: {
    自然风景: [{ visual: "湖面、雾气、远山，清透流动", prompt: "misty lake with distant mountains, pale blue white palette, soft fog, quiet full-bleed vertical wallpaper", imageUrl: "/previews/mist-lake.svg", cls: "mist" }],
    抽象艺术: [{ visual: "蓝白透明流线、柔和波纹", prompt: "abstract translucent blue-white flowing waves, soft gradients, calm and clean modern wallpaper", imageUrl: "/previews/mist-lake.svg", cls: "mist" }],
    治愈插画: [{ visual: "雨后窗光、小水滴、安静治愈", prompt: "soft illustration of quiet raindrops on a bright window, healing and clean, no dark mood", imageUrl: "/previews/mist-lake.svg", cls: "mist" }],
    极简质感: [{ visual: "玻璃、水雾、浅蓝灰留白", prompt: "minimal frosted glass texture with pale blue-grey mist, clean premium phone wallpaper", imageUrl: "/previews/mist-lake.svg", cls: "mist" }],
    东方山水: [{ visual: "烟雨远山、淡墨水气", prompt: "misty ink mountains with water vapor, modern Chinese landscape, pale blue grey and white, elegant negative space", imageUrl: "/previews/mist-lake.svg", cls: "mist" }],
    能量光感: [{ visual: "蓝白光流，安静流动", prompt: "blue-white luminous flow, calm water-like energy, polished clean wallpaper, not dark", imageUrl: "/previews/mist-lake.svg", cls: "mist" }],
  },
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
    ? [dayMaster, producingElement[dayMaster]]
    : [producedElement[dayMaster], controllingElement[dayMaster]];
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

function pickPrimaryElement(category: StyleCategory, useful: ElementName[], seed: number): ElementName {
  const bestFit = useful.find((element) => category.affinities.includes(element));
  return bestFit ?? useful[(seed + category.title.length) % useful.length];
}

function pickScene(category: StyleCategory, primary: ElementName, seed: number): SceneOption {
  const scenes = sceneBank[primary][category.title] ?? sceneBank[primary].自然风景;
  return scenes[seed % scenes.length];
}

function buildTheme(params: { dayMaster: ElementName; useful: ElementName[]; avoid: ElementName[]; isWeak: boolean; currentMonth: string }) {
  const usefulText = params.useful.join("、");
  const avoidText = params.avoid.join("、");
  return {
    title: `${params.dayMaster}日主${params.isWeak ? "偏弱" : "偏旺"}，先看${usefulText}`,
    copy: `当前月份为 ${params.currentMonth}。系统会先排八字和五行，再把${usefulText}转成不同壁纸大风格，你选方向，AI再生成具体画面。`,
    relation: `当前月柱：${params.currentMonth}。日主为${params.dayMaster}，${dayMasterTemperament[params.dayMaster]}。本次建议少用${avoidText}过重的画面。`,
    usefulText,
    avoidText,
  };
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
}): WallpaperPreview[] {
  const seed = hashText(`${params.parts.join("")}|${params.birthDate}|${params.birthTime}|${params.gender ?? ""}|${params.currentMonth}`);
  const scored = categories.map((category, index) => {
    const affinityScore = category.affinities.reduce((score, element) => score + (params.useful.includes(element) ? 9 : 0), 0);
    const avoidPenalty = category.affinities.reduce((score, element) => score + (params.avoid.includes(element) ? 3 : 0), 0);
    const variety = ((seed >> (index % 10)) & 7) * 0.4;
    return { category, score: affinityScore + variety - avoidPenalty };
  }).sort((a, b) => b.score - a.score);

  return scored.slice(0, 5).map(({ category }, index) => {
    const primary = pickPrimaryElement(category, params.useful, seed + index * 17);
    const scene = pickScene(category, primary, seed + index * 17);
    const prompt = `${scene.prompt}. Style direction: ${category.promptStyle}. Personalized by Chinese Bazi chart ${params.parts.join(" ")}; day master ${params.dayMaster}; recommended elements ${params.usefulText}; avoid overusing ${params.avoidText}. No text, no typography, no logo, no watermark, no UI, no phone frame, no people, full bleed vertical smartphone wallpaper, beautiful premium aesthetic, 1080x1920.`;
    return {
      title: category.title,
      basis: `你的日主为${params.dayMaster}，这次更适合用${params.usefulText}来平衡；「${category.title}」会被细化成：${scene.visual}。`,
      visual: `${category.tone}｜${scene.visual}`,
      cls: category.cls,
      prompt,
      imageUrl: coverUrl(primary, category.title),
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
    reasoning: `系统先根据出生时间排出四柱：${parts.join(" ")}；再统计五行为木${counts.木}、火${counts.火}、土${counts.土}、金${counts.金}、水${counts.水}。随后取日柱天干判断日主为${dayMaster}，结合生扶分${useful.supportScore}、消耗制约分${useful.pressureScore}，判断为${useful.isWeak ? "偏弱" : "偏旺"}。因此不是固定推荐某几张图，而是把${theme.usefulText}翻译成自然风景、抽象艺术、治愈插画、极简质感等不同大方向，再为每个方向生成不同提示词。`,
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
    }),
  });
}



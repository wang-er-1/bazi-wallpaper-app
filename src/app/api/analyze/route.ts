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
  { title: "雨后竹影", status: "清润生长", cls: "tone-wood-fresh", elements: ["木", "水"], moods: ["适合重新找节奏", "适合柔和恢复行动力", "偏向清润和生发"], visuals: ["雨后竹影", "浅绿水痕", "细雨后的空气"], palette: "竹青、雨白、浅灰绿", material: "竹叶、水痕、湿润纸感", promptStyle: "fresh bamboo rain wallpaper, refined green water atmosphere", promptScene: "bamboo leaves after rain, pale green mist, wet paper texture, quiet vertical mobile wallpaper" },
  { title: "青藤上行", status: "慢慢打开", cls: "tone-wood-fresh", elements: ["木"], moods: ["适合从低能量里往上走", "适合补一点生长感", "偏向轻盈向上"], visuals: ["青藤曲线", "向上的枝叶", "柔和天光"], palette: "藤绿、晨白、浅青", material: "枝叶、藤蔓、柔光", promptStyle: "minimal botanical wallpaper, upward green rhythm", promptScene: "elegant green vines rising softly, clean morning light, spacious phone wallpaper" },
  { title: "晨露新枝", status: "新鲜开局", cls: "tone-wood-fresh", elements: ["木", "水"], moods: ["适合新开始", "适合恢复弹性", "偏向清新但不幼稚"], visuals: ["露珠新枝", "嫩叶光斑", "浅色空气"], palette: "嫩绿、露白、淡金", material: "露珠、叶面、光斑", promptStyle: "fresh dewdrop leaves wallpaper, premium soft botanical aesthetic", promptScene: "new leaves with dewdrops, pale golden morning light, elegant minimal lock screen wallpaper" },
  { title: "橙云开场", status: "提亮状态", cls: "tone-fire-sun", elements: ["火"], moods: ["适合提气", "适合给今天一个开关", "偏向明亮但不躁"], visuals: ["橙色云带", "柔和日轮", "天空渐亮"], palette: "橙金、杏色、奶白", material: "云层、霞光、空气颗粒", promptStyle: "soft orange sunrise wallpaper, warm premium sky", promptScene: "soft orange cloud bands around a gentle sun, warm clean sky, vertical lock screen wallpaper" },
  { title: "珊瑚暖流", status: "温柔加热", cls: "tone-fire-sun", elements: ["火", "水"], moods: ["适合低电量回血", "适合暖一下情绪", "偏向温和流动"], visuals: ["珊瑚色流光", "暖色水纹", "柔软渐变"], palette: "珊瑚、蜜桃、浅金", material: "流光、水纹、柔焦", promptStyle: "coral warm flow abstract wallpaper, elegant smooth gradients", promptScene: "coral and peach warm flowing light, subtle water ripples, premium abstract mobile wallpaper" },
  { title: "灯火安神", status: "慢慢回暖", cls: "tone-fire-sun", elements: ["火", "土"], moods: ["适合夜里也舒服", "适合温暖稳定", "偏向安定和被照亮"], visuals: ["远处灯火", "暖色雾气", "柔和暗部"], palette: "暖金、栗色、奶油黑", material: "灯光、雾气、暖暗影", promptStyle: "warm distant lights wallpaper, cinematic cozy calm", promptScene: "distant warm lights in soft mist, dark cream shadows, peaceful premium vertical wallpaper" },
  { title: "陶土归心", status: "落地稳定", cls: "tone-earth-gold", elements: ["土"], moods: ["适合心乱时稳住", "适合把事情落下来", "偏向厚实和安定"], visuals: ["陶土坡面", "暖色地纹", "低矮山丘"], palette: "陶土、米杏、暖棕", material: "陶土、地纹、砂砾", promptStyle: "warm clay earth wallpaper, grounded tactile texture", promptScene: "minimal warm clay hills, tactile earth texture, calm grounded mobile wallpaper" },
  { title: "山谷承托", status: "有底气", cls: "tone-earth-gold", elements: ["土", "木"], moods: ["适合需要靠得住", "适合补承托感", "偏向厚而不闷"], visuals: ["山谷层次", "低饱和绿褐", "厚云透光"], palette: "岩褐、松绿、米白", material: "山岩、土坡、厚云", promptStyle: "grounded valley wallpaper, soft earth and pine palette", promptScene: "quiet valley with layered earth slopes and soft cloud light, stable premium wallpaper" },
  { title: "米岩静场", status: "安静收心", cls: "tone-earth-gold", elements: ["土", "金"], moods: ["适合降低浮躁", "适合让画面更静", "偏向秩序和安定"], visuals: ["米色岩面", "细碎矿物光", "平静结构"], palette: "米岩、香槟、浅灰", material: "岩石、矿物、细砂", promptStyle: "minimal beige stone wallpaper, refined mineral texture", promptScene: "minimal ivory stone surface with champagne mineral light, elegant calm phone wallpaper" },
  { title: "霜银清界", status: "清出边界", cls: "tone-metal-clear", elements: ["金"], moods: ["适合整理思路", "适合专注", "偏向冷静清爽"], visuals: ["霜银边缘", "浅色棱面", "干净空气"], palette: "霜白、银灰、淡蓝", material: "霜、金属、玻璃棱面", promptStyle: "frosted silver minimal wallpaper, clean premium structure", promptScene: "frosted silver planes and pale blue air, crisp minimal vertical lock screen wallpaper" },
  { title: "白石留光", status: "专注留白", cls: "tone-metal-clear", elements: ["金", "土"], moods: ["适合减少杂念", "适合克制高级", "偏向干净和明亮"], visuals: ["白石光面", "一点香槟光", "大面积留白"], palette: "白石、香槟、雾灰", material: "白石、细光、磨砂面", promptStyle: "white stone luxury wallpaper, clean champagne light", promptScene: "white stone surface with a thin champagne glow, generous negative space, premium phone wallpaper" },
  { title: "月白金线", status: "轻收束", cls: "tone-metal-clear", elements: ["金", "水"], moods: ["适合夜间清醒", "适合温柔专注", "偏向冷静和灵感"], visuals: ["月白底色", "细金线", "浅蓝暗部"], palette: "月白、细金、夜蓝", material: "金线、月光、薄雾", promptStyle: "moon white gold line wallpaper, elegant minimal night palette", promptScene: "moon white background with subtle gold lines and deep blue mist, elegant lock screen wallpaper" },
  { title: "深湖入静", status: "沉下来", cls: "tone-water-calm", elements: ["水"], moods: ["适合降噪", "适合睡前也耐看", "偏向深静和稳定"], visuals: ["深湖暗蓝", "水面微光", "远处雾线"], palette: "深湖蓝、青黑、银白", material: "湖面、水光、夜雾", promptStyle: "deep lake calm wallpaper, dark teal blue premium mood", promptScene: "deep quiet lake with tiny silver reflections and distant mist line, calm vertical wallpaper" },
  { title: "潮汐缓冲", status: "柔和过渡", cls: "tone-water-calm", elements: ["水", "土"], moods: ["适合过渡期", "适合把压力放缓", "偏向柔和和承接"], visuals: ["浅色潮线", "湿沙反光", "低云水气"], palette: "浅蓝、湿沙、雾白", material: "潮线、湿沙、水汽", promptStyle: "soft tidal shore wallpaper, pale blue sand reflective light", promptScene: "soft tide lines on wet sand, pale blue mist, gentle reflective light, clean phone wallpaper" },
  { title: "夜雨清明", status: "清醒一点", cls: "tone-star-glass", dark: true, elements: ["水", "金"], moods: ["适合脑子过热时", "适合安静观察", "偏向冷静和通透"], visuals: ["夜雨玻璃", "蓝黑反光", "细碎雨点"], palette: "蓝黑、透明灰、银点", material: "雨滴、玻璃、夜色", promptStyle: "night rain glass wallpaper, premium blue black reflective mood", promptScene: "night rain on glass with deep blue reflections and tiny silver droplets, calm vertical wallpaper" },
  { title: "杏粉柔场", status: "放松亲近", cls: "tone-cream-soft", elements: ["土", "火"], moods: ["适合不要太玄", "适合柔软情绪", "偏向亲近和轻松"], visuals: ["杏粉渐变", "纸面阴影", "软植物轮廓"], palette: "杏粉、奶油、浅褐", material: "纸面、布纹、柔影", promptStyle: "apricot cream soft wallpaper, tactile paper editorial aesthetic", promptScene: "apricot cream paper texture with soft plant silhouettes and gentle shadows, cozy premium wallpaper" },
  { title: "浅草午后", status: "轻松回血", cls: "tone-cream-soft", elements: ["木", "土"], moods: ["适合温柔恢复", "适合轻松但不幼稚", "偏向自然亲和"], visuals: ["浅草色块", "午后窗影", "奶油光"], palette: "浅草绿、奶油、蜂蜜", material: "草叶、窗光、纸感", promptStyle: "soft meadow afternoon wallpaper, gentle cream green palette", promptScene: "soft meadow green shapes with afternoon window light, cream paper texture, elegant mobile wallpaper" },
  { title: "青橙转场", status: "换个频道", cls: "tone-pop-energy", elements: ["木", "火", "水"], moods: ["适合换状态", "适合一点新鲜感", "偏向年轻但不乱"], visuals: ["青橙渐变", "流线转场", "透明光带"], palette: "青绿、橙金、奶白", material: "渐变、透明光、流线", promptStyle: "cyan orange premium abstract wallpaper, smooth transition color fields", promptScene: "cyan green and orange smooth color fields with transparent light ribbons, premium mobile wallpaper" },
  { title: "靛紫星雾", status: "打开灵感", cls: "tone-star-glass", dark: true, elements: ["水", "火"], moods: ["适合想象力", "适合夜间灵感", "偏向神秘但不花"], visuals: ["靛紫夜雾", "微弱星点", "暖色边光"], palette: "靛紫、夜蓝、微橙", material: "星雾、夜光、玻璃", promptStyle: "indigo violet star mist wallpaper, subtle warm rim light", promptScene: "indigo violet mist with tiny stars and subtle warm rim light, elegant dark phone wallpaper" },
  { title: "红茶好运", status: "轻快好彩", cls: "tone-retro-luck", elements: ["火", "土"], moods: ["适合一点仪式感", "适合轻快开局", "偏向复古但克制"], visuals: ["红茶色块", "奶油几何", "暖色颗粒"], palette: "红茶、奶油、焦糖", material: "纸张、颗粒、几何", promptStyle: "retro tea brown lucky wallpaper, tasteful geometric no text", promptScene: "tea brown and cream geometric shapes, subtle grain, tasteful retro lucky mood, no text wallpaper" },
  { title: "墨绿靠岸", status: "稳住方向", cls: "tone-oriental-ink", elements: ["木", "土", "水"], moods: ["适合想稳一点", "适合需要方向感", "偏向安静有力量"], visuals: ["墨绿坡岸", "淡雾水线", "纸感暗部"], palette: "墨绿、米白、湿土", material: "坡岸、水线、宣纸", promptStyle: "modern ink green shore wallpaper, quiet grounded oriental mood", promptScene: "ink green shoreline with pale mist and warm ivory paper texture, quiet vertical phone wallpaper" },
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
  const broadPenalty = Math.max(0, template.elements.length - 2) * 6;
  const genericPenalty = template.elements.length >= 4 ? 8 : 0;
  const variety = ((params.seed >> (params.index % 14)) & 15) * 1.15;
  return usefulScore + lowElementScore + monthScore + timeScore + dayMasterScore + variety - avoidPenalty - broadPenalty - genericPenalty;
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
  雾蓝降躁: ["雾湖清醒", "蓝雾回血", "水光缓冲", "清泉降噪", "冷月静心", "湖气回落", "银蓝安神", "浅雾洗心"],
  麦金稳住: ["麦浪稳场", "金坡落定", "土金守心", "暖丘安住", "谷光聚气", "麦色归心", "金田慢落", "暖土定盘"],
  松林生发: ["松风生长", "青林开枝", "晨木舒展", "山谷发芽", "新枝向上", "松影开局", "绿意回升", "林间醒气"],
  日光启动: ["晨光启程", "日轮提气", "暖阳开局", "云隙生火", "朝光上扬", "橙云点亮", "日色回温", "金光起势"],
  银白秩序: ["银岭收束", "白岩定神", "金线清场", "霜光立序", "山脊专注", "月白清界", "银面定心", "白石留神"],
  奶油松弛: ["奶油回温", "柔光松弛", "桃雾缓和", "纸感小憩", "午后回血", "杏粉慢放", "浅草午休", "柔影回甜"],
  星河清透: ["星河开阔", "夜水通明", "玻璃灵感", "银蓝醒神", "星雾流光", "夜雨清明", "蓝黑开阔", "微光入梦"],
  东方留白: ["远山留白", "墨青靠山", "云山定气", "纸上远行"],
  能量色块: ["流光换场", "色块转运", "青橙开关", "软光新局", "明彩醒场", "彩场切换", "流线开关", "青橙醒气"],
  复古好运: ["红金好运", "复古开运", "暖格好彩", "番茄提气", "旧日新运", "红茶好运", "焦糖起势", "奶油好彩"],
  雨后竹影: ["竹雨清生", "雨竹回青", "竹影醒气", "青雨舒展", "湿绿生长", "竹色开枝"],
  青藤上行: ["青藤上行", "藤线生发", "绿线向上", "青枝开路", "藤影舒展", "向上新藤"],
  晨露新枝: ["晨露新枝", "露白生机", "新叶清醒", "嫩枝回升", "露光开局", "早枝醒来"],
  橙云开场: ["橙云开场", "杏橙提气", "云光启动", "橙色上扬", "暖云开局", "日云醒场"],
  珊瑚暖流: ["珊瑚暖流", "暖流回升", "桃橙缓冲", "珊瑚开关", "柔火入场", "暖色回血"],
  灯火安神: ["灯火安神", "暖灯回心", "夜灯松弛", "灯雾归静", "金灯慢暖", "远灯定气"],
  陶土归心: ["陶土归心", "暖陶落地", "土色稳场", "陶坡安住", "地纹定心", "陶光承托"],
  山谷承托: ["山谷承托", "谷地有靠", "山谷定盘", "厚谷稳住", "谷光落定", "岩谷守心"],
  米岩静场: ["米岩静场", "米色安住", "岩面收心", "浅岩定神", "矿光静气", "米白稳场"],
  霜银清界: ["霜银清界", "银霜专注", "白霜立序", "霜线收束", "银面清醒", "冷白定神"],
  白石留光: ["白石留光", "石光清场", "白岩静序", "香槟白石", "留光定心", "白面收束"],
  月白金线: ["月白金线", "金线醒神", "月色收束", "白月清界", "细金定气", "月线通明"],
  深湖入静: ["深湖入静", "湖蓝沉心", "夜湖降噪", "深水缓冲", "湖面清醒", "青黑回血"],
  潮汐缓冲: ["潮汐缓冲", "浅潮回落", "湿沙安神", "潮线慢放", "蓝沙过渡", "水岸回血"],
  夜雨清明: ["夜雨清明", "雨夜清醒", "蓝黑洗心", "玻璃夜雨", "雨点降噪", "夜雨通明"],
  杏粉柔场: ["杏粉柔场", "杏色回温", "粉雾松弛", "柔场回血", "杏光慢放", "软粉安神"],
  浅草午后: ["浅草午后", "草色回升", "午后松弛", "浅绿回血", "草光放松", "绿午安住"],
  青橙转场: ["青橙转场", "青橙切换", "流光新局", "橙青醒场", "青线开关", "彩光换场"],
  靛紫星雾: ["靛紫星雾", "紫雾灵感", "靛夜开阔", "星雾通明", "紫蓝醒神", "夜色想象"],
  红茶好运: ["红茶好运", "茶色好彩", "红茶开运", "焦糖提气", "暖茶上扬", "茶金起势"],
  墨绿靠岸: ["墨绿靠岸", "绿岸定气", "墨岸稳住", "青岸有靠", "绿水归心", "靠岸回稳"],
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
    reasoning: `简单说：系统先把你的出生信息换算成四柱八字（年、月、日、时），再看五行分布。你这次木${counts.木}、火${counts.火}、土${counts.土}、金${counts.金}、水${counts.水}；日主偏${useful.isWeak ? "需要补足和扶一扶" : "需要疏导和平衡"}。所以我不是固定给所有人同一批风格，而是优先选择${theme.usefulText}相关的颜色、材质和意象，再从${directionTemplates.length}组状态模板里按命中分、缺失分、月份分和出生时辰分重新排序，挑出今天更适合你的 3 种壁纸方向。标题和画面词也会随出生信息组合变化。`,
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

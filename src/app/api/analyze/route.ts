import { NextResponse } from "next/server";
import { Lunar, Solar } from "lunar-javascript/lunar";

type ElementName = "\u6728" | "\u706b" | "\u571f" | "\u91d1" | "\u6c34";

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

type StyleCandidate = {
  title: string;
  visual: string;
  cls: string;
  prompt: string;
  elements: ElementName[];
  imageKey: string;
};

const elementByChar: Record<string, ElementName> = {
  "\u7532": "\u6728", "\u4e59": "\u6728", "\u5bc5": "\u6728", "\u536f": "\u6728",
  "\u4e19": "\u706b", "\u4e01": "\u706b", "\u5df3": "\u706b", "\u5348": "\u706b",
  "\u620a": "\u571f", "\u5df1": "\u571f", "\u8fb0": "\u571f", "\u620c": "\u571f", "\u4e11": "\u571f", "\u672a": "\u571f",
  "\u5e9a": "\u91d1", "\u8f9b": "\u91d1", "\u7533": "\u91d1", "\u9149": "\u91d1",
  "\u58ec": "\u6c34", "\u7678": "\u6c34", "\u5b50": "\u6c34", "\u4ea5": "\u6c34",
};

const previewImages: Record<string, string> = {
  nature: "https://webstatic.aiproxy.vip/output/20260517/128382/8a9f44cd-1f41-48a1-85e5-9cf457aa94f0/983b7c26-26b1-49a4-b340-03771c5e94c2.png",
  abstract: "https://webstatic.aiproxy.vip/output/20260517/128382/951e75fa-de2c-49d0-b127-2a96591e4fb6/a42f6e9e-2d5f-4180-aa23-50286abf13d3.png",
  cute: "https://webstatic.aiproxy.vip/output/20260517/128382/33e9be24-99f3-41c4-b03d-c56bac6397ee/bb7b10c9-95b1-40be-b8b2-2285136182e0.png",
  minimal: "https://webstatic.aiproxy.vip/output/20260517/128382/27a29b93-f048-4e00-bebe-2e26029f4547/3cec5c25-7ac7-41e5-b7b2-1c75602bcbc6.png",
  ink: "https://webstatic.aiproxy.vip/output/20260517/128382/3ff4f7d7-8e93-4207-b315-ce79b62e1478/0e178bf1-dee1-423c-bfab-5d878be63f02.png",
};

const balanceMap: Record<ElementName, ElementName[]> = {
  "\u6728": ["\u91d1", "\u571f"],
  "\u706b": ["\u6c34", "\u91d1"],
  "\u571f": ["\u6728", "\u6c34"],
  "\u91d1": ["\u706b", "\u6728"],
  "\u6c34": ["\u571f", "\u706b"],
};

const colorByElement: Record<ElementName, string> = {
  "\u6728": "\u9752\u7eff\u3001\u6d45\u7eff\u3001\u690d\u7269\u8272",
  "\u706b": "\u6696\u6a59\u3001\u67d4\u7ea2\u3001\u65e5\u5149\u8272",
  "\u571f": "\u7c73\u9ec4\u3001\u9ea6\u8272\u3001\u6696\u68d5",
  "\u91d1": "\u94f6\u767d\u3001\u7070\u91d1\u3001\u91d1\u5c5e\u8272",
  "\u6c34": "\u84dd\u8272\u3001\u9ed1\u84dd\u3001\u900f\u660e\u6c34\u8272",
};

const styleLibrary: StyleCandidate[] = [
  { title: "\u6e05\u900f\u5c71\u6c34", visual: "\u6e56\u9762\u3001\u96fe\u6c14\u3001\u8fdc\u5c71\u3001\u5f00\u9614\u7559\u767d", cls: "nature", imageKey: "nature", elements: ["\u6c34", "\u6728"], prompt: "vertical phone wallpaper, elegant mountain lake landscape, mist, layered distant mountains, refined 9:16 composition" },
  { title: "\u4e1c\u65b9\u7559\u767d", visual: "\u6de1\u58a8\u5c71\u5f62\u3001\u4e91\u6c14\u3001\u4f4e\u5bf9\u6bd4\u7eb8\u611f", cls: "ink", imageKey: "ink", elements: ["\u571f", "\u6c34", "\u91d1"], prompt: "vertical phone wallpaper, modern Chinese ink landscape, soft mountains, premium negative space, calm paper texture" },
  { title: "\u690d\u7269\u751f\u53d1", visual: "\u65b0\u82bd\u3001\u690d\u7269\u3001\u6e05\u6668\u5149\u3001\u8f7b\u6545\u4e8b\u611f", cls: "cute", imageKey: "cute", elements: ["\u6728", "\u6c34"], prompt: "vertical phone wallpaper, healing botanical illustration, fresh sprouts, soft morning light, delicate and premium" },
  { title: "\u94f6\u767d\u79e9\u5e8f", visual: "\u7ec6\u7ebf\u3001\u7559\u767d\u3001\u94f6\u7070\u3001\u5e72\u51c0\u5c42\u6b21", cls: "minimal", imageKey: "minimal", elements: ["\u91d1", "\u6c34"], prompt: "vertical phone wallpaper, silver white minimal landscape, thin elegant lines, low saturation, clean premium composition" },
  { title: "\u6696\u5149\u5c71\u8c37", visual: "\u65e5\u51fa\u3001\u5c71\u8c37\u3001\u67d4\u6696\u5149\u3001\u81ea\u7136\u7a7a\u6c14\u611f", cls: "nature", imageKey: "nature", elements: ["\u706b", "\u571f"], prompt: "vertical phone wallpaper, warm sunrise valley, soft golden light, realistic natural scenery, elegant mobile background" },
  { title: "\u5b89\u9759\u6708\u8272", visual: "\u6708\u4eae\u3001\u6de1\u84dd\u5c71\u5c42\u3001\u51b7\u9759\u7559\u767d", cls: "minimal", imageKey: "minimal", elements: ["\u91d1", "\u6c34"], prompt: "vertical phone wallpaper, quiet moonlit mountains, pale blue silver palette, spacious negative space, elegant lock screen" },
  { title: "\u677e\u98ce\u8fdc\u5c71", visual: "\u677e\u6797\u3001\u8fdc\u5c71\u3001\u4e91\u5f71\u3001\u6c89\u7a33\u6784\u56fe", cls: "ink", imageKey: "ink", elements: ["\u6728", "\u571f"], prompt: "vertical phone wallpaper, pine forest and distant mountains, subtle clouds, grounded calm composition, premium Asian aesthetic" },
  { title: "\u67d4\u5149\u82b1\u5ead", visual: "\u82b1\u679d\u3001\u67d4\u5149\u3001\u6d45\u8272\u80cc\u666f\u3001\u6e05\u900f\u5c42\u6b21", cls: "cute", imageKey: "cute", elements: ["\u6728", "\u706b"], prompt: "vertical phone wallpaper, delicate garden plants, soft warm light, gentle refined illustration, fresh phone lock screen" },
  { title: "\u5149\u6d41\u80fd\u91cf", visual: "\u5149\u8f68\u3001\u6696\u8272\u6d41\u7ebf\u3001\u80fd\u91cf\u6ce2\u7eb9", cls: "abstract", imageKey: "abstract", elements: ["\u706b", "\u6c34"], prompt: "vertical phone wallpaper, luminous flowing light trails, warm and cool energy waves, polished high-end abstract background" },
];

function parseDateParts(birthDate: string, birthTime: string) {
  const [year = "1996", month = "8", day = "18"] = birthDate.split("-");
  const [hour = "8", minute = "30"] = birthTime.split(":");
  return { year: Number(year), month: Number(month), day: Number(day), hour: Number(hour), minute: Number(minute) };
}

function getEightChar(calendarType: string, birthDate: string, birthTime: string) {
  const date = parseDateParts(birthDate, birthTime || "12:00");
  const lunar = calendarType === "\u519c\u5386"
    ? Lunar.fromYmdHms(date.year, date.month, date.day, date.hour, date.minute, 0)
    : Solar.fromYmdHms(date.year, date.month, date.day, date.hour, date.minute, 0).getLunar();
  const eightChar = lunar.getEightChar();
  return { year: eightChar.getYear(), month: eightChar.getMonth(), day: eightChar.getDay(), time: eightChar.getTime() };
}

function countElements(parts: string[]) {
  const counts: Record<ElementName, number> = { "\u6728": 0, "\u706b": 0, "\u571f": 0, "\u91d1": 0, "\u6c34": 0 };
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
  return { strong, weak, text: `\u4e94\u884c\u503e\u5411\uff1a${strong}\u504f\u65fa\uff0c${weak}\u76f8\u5bf9\u4e0d\u8db3` };
}

function getCurrentMonthPillar() {
  return Solar.fromDate(new Date()).getLunar().getEightChar().getMonth();
}

function buildTheme(strong: ElementName, weak: ElementName, currentMonth: string) {
  const balance = balanceMap[strong] ?? [weak];
  const balanceText = balance.join("\u3001");
  return {
    title: `${strong}\u65fa\uff0c\u5b9c\u7528${balanceText}\u8c03\u548c`,
    copy: `\u5f53\u524d\u6708\u4efd\u4e3a ${currentMonth}\uff0c\u7ed3\u5408\u4f60\u7684\u4e94\u884c\u72b6\u6001\uff0c\u4eca\u5929\u66f4\u9002\u5408\u7528${balanceText}\u76f8\u5173\u7684\u989c\u8272\u3001\u6750\u8d28\u548c\u610f\u8c61\uff0c\u8ba9\u624b\u673a\u58c1\u7eb8\u66f4\u7a33\u5b9a\u8010\u770b\u3002`,
    relation: `\u5f53\u524d\u6708\u67f1\uff1a${currentMonth}\u3002\u5982\u679c\u5f53\u6708\u6c14\u52bf\u52a0\u91cd${strong}\uff0c\u63a8\u8350\u7528${balanceText}\u505a\u89c6\u89c9\u5e73\u8861\u3002`,
    balance,
    balanceText,
  };
}

function hashText(value: string) {
  let hash = 2166136261;
  for (const char of value) {
    hash ^= char.charCodeAt(0);
    hash = Math.imul(hash, 16777619);
  }
  return Math.abs(hash >>> 0);
}

function buildPersonalPreviews(params: {
  strong: ElementName;
  weak: ElementName;
  balance: ElementName[];
  balanceText: string;
  counts: Record<ElementName, number>;
  parts: string[];
  birthDate: string;
  birthTime: string;
  gender?: string;
  currentMonth: string;
}): WallpaperPreview[] {
  const seed = hashText(`${params.parts.join("")}|${params.birthDate}|${params.birthTime}|${params.gender ?? ""}|${params.currentMonth}`);
  const scored = styleLibrary.map((style, index) => {
    const balanceScore = style.elements.reduce((score, element) => score + (params.balance.includes(element) ? 7 : 0), 0);
    const weakScore = style.elements.includes(params.weak) ? 5 : 0;
    const strongPenalty = style.elements.includes(params.strong) ? 2 : 0;
    const countFit = style.elements.reduce((score, element) => score + Math.max(0, 4 - params.counts[element]) * 0.6, 0);
    const personalJitter = ((seed >> (index % 12)) & 7) * 0.23;
    return { style, score: balanceScore + weakScore + countFit + personalJitter - strongPenalty };
  }).sort((a, b) => b.score - a.score);

  return scored.slice(0, 5).map(({ style }, index) => {
    const colorText = style.elements.map((element) => colorByElement[element]).join("\u3001");
    const prompt = `${style.prompt}. Personalized by birth chart ${params.parts.join(" ")}; strong element ${params.strong}, weak element ${params.weak}; use ${params.balanceText} for balance; palette: ${colorText}; avoid clutter, no text, no logos, premium wallpaper quality.`;
    return {
      title: index === 0 ? style.title : style.title,
      basis: `${params.strong}\u504f\u65fa\uff0c${params.weak}\u76f8\u5bf9\u4e0d\u8db3\uff0c\u7528${params.balanceText}\u6765\u8c03\u548c\u753b\u9762\u6c14\u8d28`,
      visual: style.visual,
      cls: style.cls,
      prompt,
      imageUrl: previewImages[style.imageKey],
    };
  });
}

export async function POST(request: Request) {
  const body = (await request.json()) as AnalyzeRequest;
  const birthDate = body.birthDate || "1996-08-18";
  const birthTime = body.birthTime || "08:30";
  const eightChar = getEightChar(body.calendarType || "\u9633\u5386", birthDate, birthTime);
  const parts = [eightChar.year, eightChar.month, eightChar.day, eightChar.time];
  const counts = countElements(parts);
  const element = pickElementSummary(counts);
  const currentMonth = getCurrentMonthPillar();
  const theme = buildTheme(element.strong, element.weak, currentMonth);

  return NextResponse.json({
    bazi: `${eightChar.year}\u5e74 ${eightChar.month}\u6708 ${eightChar.day}\u65e5 ${eightChar.time}\u65f6`,
    baziDetail: { year: eightChar.year, month: eightChar.month, day: eightChar.day, time: eightChar.time },
    elementCounts: counts,
    elementSummary: element.text,
    monthRelation: theme.relation,
    themeTitle: theme.title,
    themeCopy: theme.copy,
    reasoning: `\u7cfb\u7edf\u6839\u636e\u51fa\u751f\u65f6\u95f4\u6392\u51fa\u56db\u67f1\uff1a${parts.join(" ")}\uff0c\u7edf\u8ba1\u4e94\u884c\u6570\u91cf\u4e3a\u6728${counts["\u6728"]}\u3001\u706b${counts["\u706b"]}\u3001\u571f${counts["\u571f"]}\u3001\u91d1${counts["\u91d1"]}\u3001\u6c34${counts["\u6c34"]}\u3002\u518d\u7ed3\u5408\u5f53\u524d\u6708\u67f1 ${currentMonth}\u3001\u51fa\u751f\u65e5\u671f\u548c\u65f6\u95f4\u505a\u4e2a\u6027\u5316\u6392\u5e8f\uff0c\u5c06\u989c\u8272\u3001\u6750\u8d28\u548c\u610f\u8c61\u7ec4\u5408\u6210\u4e0d\u540c\u7684\u58c1\u7eb8\u63d0\u793a\u8bcd\u3002`,
    previews: buildPersonalPreviews({
      strong: element.strong,
      weak: element.weak,
      balance: theme.balance,
      balanceText: theme.balanceText,
      counts,
      parts,
      birthDate,
      birthTime,
      gender: body.gender,
      currentMonth,
    }),
  });
}

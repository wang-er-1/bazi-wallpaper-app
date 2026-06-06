import { randomUUID } from "crypto";
import { mkdir, writeFile } from "fs/promises";
import path from "path";

export type GenerateRequest = {
  title?: string;
  prompt?: string;
  visual?: string;
  imageUrl?: string;
  userId?: string;
};

type ImageApiResponse = {
  data?: Array<{ url?: string; b64_json?: string }>;
  url?: string;
  b64_json?: string;
};

const defaultTitle = "五行壁纸";
const defaultImageSize = "1024x1792";
const generatedDir = path.join(process.cwd(), "public", "generated");

async function saveBase64Image(base64: string) {
  const fileName = `${Date.now()}-${randomUUID()}.png`;
  await mkdir(generatedDir, { recursive: true });
  await writeFile(path.join(generatedDir, fileName), Buffer.from(base64, "base64"));
  return `/generated/${fileName}`;
}

export function buildImagePrompt(input: GenerateRequest) {
  const theme = input.prompt || "calm elegant oriental mobile wallpaper";
  const visualDirection = input.visual ? `Recommended visual direction: ${input.visual}.` : "";

  return [
    "Create one vertical mobile phone wallpaper for a lock screen.",
    "Composition: strict portrait 9:16 ratio, full-screen wallpaper, no border, no poster layout.",
    "Keep the upper 25 percent clean and quiet for phone clock and widgets.",
    "Place the main visual interest in the lower two-thirds with calm negative space.",
    "Style: premium mobile wallpaper design, refined oriental aesthetic, soft natural light, atmospheric depth, delicate texture, harmonious color palette.",
    `Theme: ${theme}.`,
    visualDirection,
    "Avoid literal astrology charts, symbols, UI panels, screenshots, typography, decorative text, logos, watermarks, people, faces, hands, and clutter.",
    "The image should feel usable as a real phone wallpaper: elegant, calm, polished, not busy, not cartoonish, not like a marketing poster.",
  ].filter(Boolean).join(" ");
}

export function normalizeImageSize(size: string) {
  const normalized = size.replace(/[×＊*]/g, "x").replace(/\s+/g, "").toLowerCase();
  return /^\d+x\d+$/.test(normalized) ? normalized : defaultImageSize;
}

export function mockImage(title: string) {
  const safeTitle = title || defaultTitle;
  const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="1080" height="1920" viewBox="0 0 1080 1920"><defs><linearGradient id="g" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="#17384c"/><stop offset="0.58" stop-color="#238ea6"/><stop offset="1" stop-color="#e9f6f4"/></linearGradient></defs><rect width="1080" height="1920" fill="url(#g)"/><circle cx="800" cy="270" r="116" fill="white" fill-opacity="0.72"/><path d="M0 1210 C242 1080 380 1290 612 1158 C802 1040 940 1092 1080 996 L1080 1920 L0 1920 Z" fill="#0f4d64" fill-opacity="0.72"/><text x="76" y="1748" fill="white" font-size="76" font-family="Arial, sans-serif">${safeTitle}</text></svg>`;
  return `data:image/svg+xml;charset=utf-8,${encodeURIComponent(svg)}`;
}

export async function generateWallpaperImage(input: GenerateRequest) {
  const baseUrl = process.env.IMAGE_API_BASE_URL;
  const apiKey = process.env.IMAGE_API_KEY;
  const model = process.env.IMAGE_MODEL || "gpt-image-2";
  const size = normalizeImageSize(process.env.IMAGE_SIZE || defaultImageSize);
  const prompt = buildImagePrompt(input);

  if (!baseUrl || !apiKey || apiKey.includes("填你的")) {
    return {
      mode: "mock",
      imageUrl: input.imageUrl || mockImage(input.title || defaultTitle),
      prompt,
      size,
      message: "未配置 IMAGE_API_KEY，当前返回本地预览图。",
    };
  }

  const endpoint = `${baseUrl.replace(/\/$/, "")}/images/generations`;
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), 180000);

  try {
    const response = await fetch(endpoint, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${apiKey}`,
      },
      body: JSON.stringify({ model, prompt, size, n: 1 }),
      signal: controller.signal,
    });

    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(`图片生成服务返回错误：${errorText}`);
    }

    const data = (await response.json()) as ImageApiResponse;
    const first = data.data?.[0] ?? data;
    const imageUrl = first.url || (first.b64_json ? await saveBase64Image(first.b64_json) : "");

    if (!imageUrl) throw new Error(`图片接口没有返回图片：${JSON.stringify(data)}`);

    return { mode: "real", imageUrl, prompt, size };
  } catch (error) {
    if (error instanceof Error && error.name === "AbortError") {
      throw new Error("图片生成超时，请稍后再试。");
    }
    throw error instanceof Error ? error : new Error(String(error));
  } finally {
    clearTimeout(timeout);
  }
}

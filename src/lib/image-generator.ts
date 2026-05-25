export type GenerateRequest = {
  title?: string;
  prompt?: string;
  visual?: string;
  imageUrl?: string;
};

type ImageApiResponse = {
  data?: Array<{ url?: string; b64_json?: string }>;
  url?: string;
  b64_json?: string;
};

const defaultTitle = "五行壁纸";

export function buildImagePrompt(input: GenerateRequest) {
  return [
    input.prompt || "vertical phone wallpaper, calm elegant composition",
    input.visual ? `visual direction: ${input.visual}` : "",
    "single 9:16 vertical phone wallpaper",
    "no text, no watermark, no UI mockup",
    "ultra high definition, sharp focus, rich but clean details, polished premium mobile wallpaper aesthetic",
  ].filter(Boolean).join(", ");
}

export function normalizeImageSize(size: string) {
  const normalized = size.replace(/[×＊*]/g, "x").replace(/\s+/g, "").toLowerCase();
  return /^\d+x\d+$/.test(normalized) ? normalized : "1080x1920";
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
  const size = normalizeImageSize(process.env.IMAGE_SIZE || "1080x1920");
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
    const imageUrl = first.url || (first.b64_json ? `data:image/png;base64,${first.b64_json}` : "");

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


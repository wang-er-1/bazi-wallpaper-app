import { NextResponse } from "next/server";

type GenerateRequest = {
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

const defaultTitle = "\u4e94\u884c\u58c1\u7eb8";

function buildPrompt(input: GenerateRequest) {
  return [
    input.prompt || "vertical phone wallpaper, calm elegant composition",
    input.visual ? `visual direction: ${input.visual}` : "",
    "single 9:16 vertical phone wallpaper",
    "no text, no watermark, no UI mockup",
    "high detail, polished mobile wallpaper aesthetic",
  ].filter(Boolean).join(", ");
}

function normalizeSize(size: string) {
  const normalized = size.replace(/[\u00d7\uff0a*]/g, "x").replace(/\s+/g, "").toLowerCase();
  return /^\d+x\d+$/.test(normalized) ? normalized : "1024x1792";
}

function mockImage(title: string) {
  const safeTitle = title || defaultTitle;
  const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="1024" height="1792" viewBox="0 0 1024 1792"><defs><linearGradient id="g" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="#17384c"/><stop offset="0.58" stop-color="#238ea6"/><stop offset="1" stop-color="#e9f6f4"/></linearGradient></defs><rect width="1024" height="1792" fill="url(#g)"/><circle cx="760" cy="260" r="110" fill="white" fill-opacity="0.72"/><path d="M0 1130 C230 1010 360 1210 580 1080 C760 970 890 1020 1024 930 L1024 1792 L0 1792 Z" fill="#0f4d64" fill-opacity="0.72"/><text x="72" y="1620" fill="white" font-size="72" font-family="Arial, sans-serif">${safeTitle}</text></svg>`;
  return `data:image/svg+xml;charset=utf-8,${encodeURIComponent(svg)}`;
}

function mockResponse(input: GenerateRequest, prompt: string) {
  return NextResponse.json({
    mode: "mock",
    imageUrl: input.imageUrl || mockImage(input.title || defaultTitle),
    prompt,
    message: "未配置 IMAGE_API_KEY，当前返回本地预览图。",
  });
}

function errorResponse(message: string, detail?: string, meta?: { endpoint?: string; model?: string; size?: string }) {
  return NextResponse.json(
    {
      mode: "error",
      message,
      detail,
      ...meta,
    },
    { status: 502 },
  );
}

export async function POST(request: Request) {
  const body = (await request.json()) as GenerateRequest;
  const baseUrl = process.env.IMAGE_API_BASE_URL;
  const apiKey = process.env.IMAGE_API_KEY;
  const model = process.env.IMAGE_MODEL || "gpt-image-2";
  const size = normalizeSize(process.env.IMAGE_SIZE || "1024x1792");
  const prompt = buildPrompt(body);

  if (!baseUrl || !apiKey || apiKey.includes("\u586b\u4f60\u7684")) {
    return mockResponse(body, prompt);
  }

  const endpoint = `${baseUrl.replace(/\/$/, "")}/images/generations`;
  let response: Response;
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), 180000);

  try {
    response = await fetch(endpoint, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${apiKey}`,
      },
      body: JSON.stringify({ model, prompt, size, n: 1 }),
      signal: controller.signal,
    });
  } catch (error) {
    clearTimeout(timeout);
    return errorResponse(
      error instanceof Error && error.name === "AbortError" ? "图片生成超时，请稍后再试。" : "图片服务暂时不可用，请稍后再试。",
      error instanceof Error && error.name === "AbortError" ? "image request timed out" : error instanceof Error ? error.message : String(error),
      { endpoint, model, size },
    );
  }

  clearTimeout(timeout);

  if (!response.ok) {
    const errorText = await response.text();
    return errorResponse(
      "图片生成服务返回错误，请稍后再试。",
      errorText,
      { endpoint, model, size },
    );
  }

  const data = (await response.json()) as ImageApiResponse;
  const first = data.data?.[0] ?? data;
  const imageUrl = first.url || (first.b64_json ? `data:image/png;base64,${first.b64_json}` : "");

  if (!imageUrl) {
    return errorResponse(
      "图片接口没有返回图片，请稍后再试。",
      JSON.stringify(data),
      { endpoint, model, size },
    );
  }

  return NextResponse.json({ mode: "real", imageUrl, prompt, size });
}


import { NextResponse } from "next/server";

type GenerateRequest = {
  title?: string;
  prompt?: string;
  visual?: string;
};

type ImageApiResponse = {
  data?: Array<{ url?: string; b64_json?: string }>;
  url?: string;
  b64_json?: string;
};

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
  const normalized = size.replace(/[×＊*]/g, "x").replace(/\s+/g, "").toLowerCase();
  return /^\d+x\d+$/.test(normalized) ? normalized : "1024x1792";
}

function mockImage(title: string) {
  const safeTitle = title || "五行壁纸";
  const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="1024" height="1792" viewBox="0 0 1024 1792"><defs><linearGradient id="g" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="#17384c"/><stop offset="0.58" stop-color="#238ea6"/><stop offset="1" stop-color="#e9f6f4"/></linearGradient></defs><rect width="1024" height="1792" fill="url(#g)"/><circle cx="760" cy="260" r="110" fill="white" fill-opacity="0.72"/><path d="M0 1130 C230 1010 360 1210 580 1080 C760 970 890 1020 1024 930 L1024 1792 L0 1792 Z" fill="#0f4d64" fill-opacity="0.72"/><text x="72" y="1620" fill="white" font-size="72" font-family="Arial, sans-serif">${safeTitle}</text></svg>`;
  return `data:image/svg+xml;charset=utf-8,${encodeURIComponent(svg)}`;
}

export async function POST(request: Request) {
  const body = (await request.json()) as GenerateRequest;
  const baseUrl = process.env.IMAGE_API_BASE_URL;
  const apiKey = process.env.IMAGE_API_KEY;
  const model = process.env.IMAGE_MODEL || "gpt-image-2";
  const size = normalizeSize(process.env.IMAGE_SIZE || "1024x1792");
  const prompt = buildPrompt(body);

  if (!baseUrl || !apiKey || apiKey.includes("填你的")) {
    return NextResponse.json({
      mode: "mock",
      imageUrl: mockImage(body.title || "五行壁纸"),
      prompt,
      message: "未配置 IMAGE_API_KEY，当前返回模拟壁纸。",
    });
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
    return NextResponse.json({
      error: "图片接口连接失败",
      detail: error instanceof Error && error.name === "AbortError" ? "图片接口超过 180 秒未返回，请稍后重试。" : error instanceof Error ? error.message : String(error),
      endpoint,
      model,
      size,
    }, { status: 502 });
  }

  clearTimeout(timeout);

  if (!response.ok) {
    const errorText = await response.text();
    return NextResponse.json({ error: "图片生成失败", detail: errorText, endpoint, model, size }, { status: 502 });
  }

  const data = (await response.json()) as ImageApiResponse;
  const first = data.data?.[0] ?? data;
  const imageUrl = first.url || (first.b64_json ? `data:image/png;base64,${first.b64_json}` : "");

  if (!imageUrl) {
    return NextResponse.json({ error: "图片接口没有返回图片", detail: JSON.stringify(data), endpoint, model, size }, { status: 502 });
  }

  return NextResponse.json({ mode: "real", imageUrl, prompt, size });
}



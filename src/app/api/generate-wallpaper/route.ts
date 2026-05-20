import { NextResponse } from "next/server";
import { generateWallpaperImage, type GenerateRequest } from "@/lib/image-generator";

function errorResponse(message: string, detail?: string) {
  return NextResponse.json(
    {
      mode: "error",
      message,
      detail,
    },
    { status: 502 },
  );
}

export async function POST(request: Request) {
  try {
    const body = (await request.json()) as GenerateRequest;
    const result = await generateWallpaperImage(body);
    return NextResponse.json(result);
  } catch (error) {
    return errorResponse(
      error instanceof Error ? error.message : "图片服务暂时不可用，请稍后再试。",
      error instanceof Error ? error.message : String(error),
    );
  }
}

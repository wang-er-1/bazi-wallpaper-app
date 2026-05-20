import { NextResponse } from "next/server";
import { createGenerationJob } from "@/lib/generation-jobs";
import type { GenerateRequest } from "@/lib/image-generator";

export const runtime = "nodejs";

export async function POST(request: Request) {
  try {
    const body = (await request.json()) as GenerateRequest;
    const job = createGenerationJob(body);
    return NextResponse.json({ jobId: job.id, status: job.status });
  } catch (error) {
    return NextResponse.json(
      {
        message: error instanceof Error ? error.message : "创建生成任务失败，请稍后再试。",
      },
      { status: 400 },
    );
  }
}

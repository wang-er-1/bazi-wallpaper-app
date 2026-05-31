import { NextResponse } from "next/server";
import { createGenerationJob } from "@/lib/generation-jobs";
import type { GenerateRequest } from "@/lib/image-generator";
import { canUserGenerate, ensureAnonymousUser } from "@/lib/user-store";

export const runtime = "nodejs";

export async function POST(request: Request) {
  try {
    const body = (await request.json()) as GenerateRequest;
    if (body.userId) {
      await ensureAnonymousUser(body.userId);
      const canGenerate = await canUserGenerate(body.userId);
      if (!canGenerate) {
        return NextResponse.json({ message: "灵感值不足，兑换邀请码后可以继续生成。" }, { status: 402 });
      }
    }

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

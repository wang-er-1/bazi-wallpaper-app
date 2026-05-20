import { NextResponse } from "next/server";
import { getGenerationJob } from "@/lib/generation-jobs";

export const runtime = "nodejs";

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const id = searchParams.get("id");

  if (!id) {
    return NextResponse.json({ message: "缺少任务 ID。" }, { status: 400 });
  }

  const job = getGenerationJob(id);
  if (!job) {
    return NextResponse.json({ message: "生成任务已过期，请重新生成。" }, { status: 404 });
  }

  return NextResponse.json({
    jobId: job.id,
    status: job.status,
    result: job.result,
    error: job.error,
    updatedAt: job.updatedAt,
  });
}

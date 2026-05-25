import { NextResponse } from "next/server";
import { ensureAnonymousUser, type UserRecord } from "@/lib/user-store";

export const runtime = "nodejs";

export async function POST(request: Request) {
  const body = (await request.json().catch(() => null)) as { userId?: string; records?: UserRecord[] } | null;
  const userId = body?.userId?.trim();

  if (!userId) {
    return NextResponse.json({ message: "缺少用户 ID。" }, { status: 400 });
  }

  const user = await ensureAnonymousUser(userId, body?.records);
  return NextResponse.json({ userId: user.id, quota: user.quota, records: user.records });
}

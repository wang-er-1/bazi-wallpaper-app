import { NextResponse } from "next/server";
import { redeemInviteCode } from "@/lib/invite-store";
import { addUserQuota, ensureAnonymousUser } from "@/lib/user-store";

export async function POST(request: Request) {
  const body = (await request.json().catch(() => null)) as { code?: string; userId?: string } | null;
  const code = body?.code?.trim();
  const userId = body?.userId?.trim();

  if (!code) {
    return NextResponse.json({ ok: false, message: "请输入邀请码。" }, { status: 400 });
  }

  if (!userId) {
    return NextResponse.json({ ok: false, message: "用户信息还没准备好，请刷新后再试。" }, { status: 400 });
  }

  await ensureAnonymousUser(userId);
  const result = await redeemInviteCode(code);
  if (!result.ok) return NextResponse.json(result, { status: 400 });

  const quotaResult = await addUserQuota(userId, result.bonus, code.trim().toUpperCase());
  if (quotaResult && !quotaResult.ok) {
    return NextResponse.json({ ok: false, message: quotaResult.message }, { status: 400 });
  }

  return NextResponse.json({ ...result, quota: quotaResult?.user.quota });
}

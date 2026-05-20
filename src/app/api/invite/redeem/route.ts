import { NextResponse } from "next/server";
import { redeemInviteCode } from "@/lib/invite-store";

export async function POST(request: Request) {
  const body = (await request.json().catch(() => null)) as { code?: string } | null;
  const code = body?.code?.trim();

  if (!code) {
    return NextResponse.json({ ok: false, message: "请输入邀请码。" }, { status: 400 });
  }

  const result = await redeemInviteCode(code);
  return NextResponse.json(result, { status: result.ok ? 200 : 400 });
}

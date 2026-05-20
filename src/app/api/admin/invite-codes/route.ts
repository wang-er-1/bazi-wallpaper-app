import { NextResponse } from "next/server";
import { createInviteCodes } from "@/lib/invite-store";

function getBearerSecret(request: Request) {
  const authorization = request.headers.get("authorization") ?? "";
  return authorization.startsWith("Bearer ") ? authorization.slice(7).trim() : "";
}

export async function POST(request: Request) {
  const adminSecret = process.env.ADMIN_INVITE_SECRET;
  const requestSecret = getBearerSecret(request);

  if (!adminSecret || requestSecret !== adminSecret) {
    return NextResponse.json({ message: "没有权限。" }, { status: 401 });
  }

  const body = (await request.json().catch(() => ({}))) as {
    count?: number;
    bonus?: number;
    maxRedemptions?: number;
    expiresDays?: number;
  };

  const count = Math.min(Math.max(Number(body.count) || 100, 1), 500);
  const bonus = Math.min(Math.max(Number(body.bonus) || 5, 1), 100);
  const maxRedemptions = Math.min(Math.max(Number(body.maxRedemptions) || 1, 1), 100);
  const expiresDays = body.expiresDays ? Math.min(Math.max(Number(body.expiresDays), 1), 365) : 60;

  const codes = await createInviteCodes({ count, bonus, maxRedemptions, expiresDays });
  return NextResponse.json({ count: codes.length, codes: codes.map((item) => item.code) });
}

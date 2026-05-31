import { mkdir, readFile, writeFile } from "fs/promises";
import path from "path";
import { randomBytes } from "crypto";

export type InviteCode = {
  code: string;
  bonus: number;
  maxRedemptions: number;
  redeemedCount: number;
  createdAt: string;
  expiresAt?: string;
  redeemedAt?: string[];
};

type InviteStore = {
  codes: InviteCode[];
};

const dataDir = path.join(process.cwd(), "data");
const storePath = path.join(dataDir, "invite-codes.json");
const alphabet = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";

async function readStore(): Promise<InviteStore> {
  try {
    const raw = await readFile(storePath, "utf8");
    const data = JSON.parse(raw) as InviteStore;
    return { codes: Array.isArray(data.codes) ? data.codes : [] };
  } catch {
    return { codes: [] };
  }
}

async function writeStore(store: InviteStore) {
  await mkdir(dataDir, { recursive: true });
  await writeFile(storePath, JSON.stringify(store, null, 2), "utf8");
}

function randomCode() {
  const bytes = randomBytes(8);
  let body = "";
  for (let index = 0; index < 8; index += 1) {
    body += alphabet[bytes[index] % alphabet.length];
  }
  return `BZ-${body.slice(0, 4)}-${body.slice(4)}`;
}

export async function createInviteCodes(options: { count: number; bonus: number; maxRedemptions: number; expiresDays?: number }) {
  const store = await readStore();
  const existing = new Set(store.codes.map((item) => item.code));
  const now = new Date();
  const expiresAt = options.expiresDays
    ? new Date(now.getTime() + options.expiresDays * 24 * 60 * 60 * 1000).toISOString()
    : undefined;
  const codes: InviteCode[] = [];

  while (codes.length < options.count) {
    const code = randomCode();
    if (existing.has(code)) continue;
    existing.add(code);
    codes.push({
      code,
      bonus: options.bonus,
      maxRedemptions: options.maxRedemptions,
      redeemedCount: 0,
      createdAt: now.toISOString(),
      expiresAt,
      redeemedAt: [],
    });
  }

  store.codes = [...codes, ...store.codes];
  await writeStore(store);
  return codes;
}

export async function redeemInviteCode(rawCode: string) {
  const code = rawCode.trim().toUpperCase();
  const store = await readStore();
  const target = store.codes.find((item) => item.code === code);

  if (!target) return { ok: false as const, message: "邀请码不存在，请检查后再试。" };
  if (target.expiresAt && new Date(target.expiresAt).getTime() < Date.now()) {
    return { ok: false as const, message: "邀请码已过期。" };
  }
  if (target.redeemedCount >= target.maxRedemptions) {
    return { ok: false as const, message: "邀请码已被使用。" };
  }

  target.redeemedCount += 1;
  target.redeemedAt = [...(target.redeemedAt ?? []), new Date().toISOString()];
  await writeStore(store);

  return { ok: true as const, bonus: target.bonus, message: `兑换成功，已增加 ${target.bonus} 灵感值。` };
}

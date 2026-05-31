import { mkdir, readFile, writeFile } from "fs/promises";
import path from "path";

export type UserRecord = {
  id: string;
  title: string;
  imageUrl: string;
  createdAt: string;
  visual: string;
};

export type AnonymousUser = {
  id: string;
  quota: number;
  records: UserRecord[];
  redeemedCodes: string[];
  createdAt: string;
  updatedAt: string;
};

type UserStore = {
  users: AnonymousUser[];
};

const initialFreeQuota = 10;
const generationCost = 10;
const dataDir = path.join(process.cwd(), "data");
const storePath = path.join(dataDir, "users.json");

async function readStore(): Promise<UserStore> {
  try {
    const raw = await readFile(storePath, "utf8");
    const data = JSON.parse(raw) as UserStore;
    return { users: Array.isArray(data.users) ? data.users : [] };
  } catch {
    return { users: [] };
  }
}

function migrateLegacyQuota(user: AnonymousUser) {
  if (user.quota > 0 && user.quota < generationCost) {
    user.quota *= generationCost;
    user.updatedAt = new Date().toISOString();
    return true;
  }
  return false;
}
async function writeStore(store: UserStore) {
  await mkdir(dataDir, { recursive: true });
  await writeFile(storePath, JSON.stringify(store, null, 2), "utf8");
}

function normalizeRecords(records?: UserRecord[]) {
  if (!Array.isArray(records)) return [];
  return records
    .filter((item) => item && item.id && item.imageUrl)
    .slice(0, 20)
    .map((item) => ({
      id: String(item.id),
      title: String(item.title || "今日壁纸"),
      imageUrl: String(item.imageUrl),
      createdAt: String(item.createdAt || new Date().toLocaleString("zh-CN")),
      visual: String(item.visual || ""),
    }));
}

export async function ensureAnonymousUser(id: string, localRecords?: UserRecord[]) {
  const userId = id.trim();
  const store = await readStore();
  const existing = store.users.find((user) => user.id === userId);

  if (existing) {
    if (migrateLegacyQuota(existing)) await writeStore(store);
    return existing;
  }

  const records = normalizeRecords(localRecords);
  const now = new Date().toISOString();
  const user: AnonymousUser = {
    id: userId,
    quota: Math.max(0, initialFreeQuota - records.length * generationCost),
    records,
    redeemedCodes: [],
    createdAt: now,
    updatedAt: now,
  };

  store.users.unshift(user);
  await writeStore(store);
  return user;
}

export async function getAnonymousUser(id: string) {
  const store = await readStore();
  const user = store.users.find((item) => item.id === id.trim()) ?? null;
  if (user && migrateLegacyQuota(user)) await writeStore(store);
  return user;
}

export async function canUserGenerate(id: string) {
  const user = await getAnonymousUser(id);
  return Boolean(user && user.quota >= generationCost);
}

export async function addUserQuota(id: string, bonus: number, code?: string) {
  const store = await readStore();
  const user = store.users.find((item) => item.id === id.trim());
  if (!user) return null;

  if (code && user.redeemedCodes.includes(code)) {
    return { ok: false as const, user, message: "这个邀请码已经在当前设备兑换过。" };
  }

  user.quota += Math.max(0, bonus);
  if (code) user.redeemedCodes = [...user.redeemedCodes, code];
  user.updatedAt = new Date().toISOString();
  await writeStore(store);
  return { ok: true as const, user };
}

export async function addGeneratedRecord(id: string, record: UserRecord) {
  const store = await readStore();
  const user = store.users.find((item) => item.id === id.trim());
  if (!user) return null;

  user.quota = Math.max(0, user.quota - generationCost);
  user.records = [record, ...user.records.filter((item) => item.id !== record.id)].slice(0, 20);
  user.updatedAt = new Date().toISOString();
  await writeStore(store);
  return user;
}

import "server-only";
import { mkdir, readFile, writeFile } from "node:fs/promises";
import path from "node:path";

export type SwipeAction = "like" | "pass";
export type SwipeRecord = { user_id: string; profile_id: string; action: SwipeAction; created_at: string };
export type MatchRecord = { user_id: string; profile_id: string; created_at: string };
type LocalState = { swipes: SwipeRecord[]; matches: MatchRecord[] };
const localPath = process.env.COY_LOCAL_STORE_PATH
  ? path.resolve(process.env.COY_LOCAL_STORE_PATH)
  : path.join(process.cwd(), "data", "swipes.json");
// Upstash's direct integration uses UPSTASH_*; Vercel KV-compatible integrations may expose KV_*.
const redisUrl = process.env.UPSTASH_REDIS_REST_URL || process.env.KV_REST_API_URL;
const redisToken = process.env.UPSTASH_REDIS_REST_TOKEN || process.env.KV_REST_API_TOKEN;
const redisConfigured = Boolean(redisUrl && redisToken);
export function isDurableStoreConfigured() {
  return redisConfigured;
}
let localQueue: Promise<void> = Promise.resolve();

async function redisCommand<T>(command: (string | number)[]): Promise<T> {
  if (!redisUrl || !redisToken) throw new Error("UPSTASH_REDIS_NOT_CONFIGURED");
  const response = await fetch(redisUrl, {
    method: "POST",
    headers: { Authorization: `Bearer ${redisToken}`, "Content-Type": "application/json" },
    body: JSON.stringify(command),
    cache: "no-store",
  });
  const payload = await response.json() as { result?: T; error?: string };
  if (!response.ok || payload.error) throw new Error(payload.error || "Upstash Redis request failed");
  return payload.result as T;
}

function redisUserKey(kind: "swipes" | "matches", userId: string) {
  return `coy:${kind}:${encodeURIComponent(userId)}`;
}

async function withLocalLock<T>(operation: () => Promise<T>): Promise<T> {
  const previous = localQueue;
  let release!: () => void;
  localQueue = new Promise<void>((resolve) => { release = resolve; });
  await previous;
  try { return await operation(); }
  finally { release(); }
}

async function readLocal(): Promise<LocalState> {
  try { return JSON.parse(await readFile(localPath, "utf8")) as LocalState; }
  catch { return { swipes: [], matches: [] }; }
}

async function writeLocal(state: LocalState) {
  await mkdir(path.dirname(localPath), { recursive: true });
  await writeFile(localPath, JSON.stringify(state, null, 2), "utf8");
}

export async function listSwipedProfileIds(userId: string): Promise<Set<string>> {
  if (redisConfigured) {
    const profileIds = await redisCommand<string[]>(["HKEYS", redisUserKey("swipes", userId)]);
    return new Set(profileIds ?? []);
  }
  if (process.env.VERCEL) throw new Error("PERSISTENCE_NOT_CONFIGURED");
  return new Set((await readLocal()).swipes.filter((s) => s.user_id === userId).map((s) => s.profile_id));
}

export async function saveSwipe(userId: string, profileId: string, action: SwipeAction) {
  const createdAt = new Date().toISOString();
  if (redisConfigured) {
    const { incomingLikes } = await import("./profiles");
    const script = `
      local already_swiped = redis.call('HEXISTS', KEYS[1], ARGV[1])
      if already_swiped == 1 then return {1, 0} end
      redis.call('HSET', KEYS[1], ARGV[1], ARGV[2])
      local is_mutual = 0
      if ARGV[2] == 'like' then
        for index = 3, #ARGV do
          if ARGV[index] == ARGV[1] then
            redis.call('SADD', KEYS[2], ARGV[1])
            is_mutual = 1
            break
          end
        end
      end
      return {0, is_mutual}
    `;
    const result = await redisCommand<[number, number]>([
      "EVAL", script, 2,
      redisUserKey("swipes", userId), redisUserKey("matches", userId),
      profileId, action, ...incomingLikes,
    ]);
    if (!Array.isArray(result) || result.length < 2) throw new Error("Upstash Redis returned an invalid swipe response");
    return { duplicate: Number(result[0]) === 1, matched: Number(result[1]) === 1 };
  }
  // Vercel's function filesystem is ephemeral/read-only. Never report success for a swipe that won't persist.
  if (process.env.VERCEL) throw new Error("PERSISTENCE_NOT_CONFIGURED");
  return withLocalLock(async () => {
    const state = await readLocal();
    if (state.swipes.some((s) => s.user_id === userId && s.profile_id === profileId)) return { duplicate: true, matched: false };
    state.swipes.push({ user_id: userId, profile_id: profileId, action, created_at: createdAt });
    const matched = action === "like" && (await import("./profiles")).incomingLikes.has(profileId);
    if (matched && !state.matches.some((m) => m.user_id === userId && m.profile_id === profileId)) state.matches.push({ user_id: userId, profile_id: profileId, created_at: createdAt });
    await writeLocal(state);
    return { duplicate: false, matched };
  });
}

export async function listMatchIds(userId: string): Promise<string[]> {
  if (redisConfigured) return await redisCommand<string[]>(["SMEMBERS", redisUserKey("matches", userId)]) ?? [];
  if (process.env.VERCEL) throw new Error("PERSISTENCE_NOT_CONFIGURED");
  return (await readLocal()).matches.filter((m) => m.user_id === userId).map((m) => m.profile_id);
}

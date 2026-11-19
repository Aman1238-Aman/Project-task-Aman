import "server-only";
import { mkdir, readFile, writeFile } from "node:fs/promises";
import path from "node:path";
import { createClient } from "@supabase/supabase-js";

export type SwipeAction = "like" | "pass";
export type SwipeRecord = { user_id: string; profile_id: string; action: SwipeAction; created_at: string };
export type MatchRecord = { user_id: string; profile_id: string; created_at: string };
type LocalState = { swipes: SwipeRecord[]; matches: MatchRecord[] };
const localPath = process.env.COY_LOCAL_STORE_PATH
  ? path.resolve(process.env.COY_LOCAL_STORE_PATH)
  : path.join(process.cwd(), "data", "swipes.json");
const supabaseUrl = process.env.SUPABASE_URL || process.env.NEXT_PUBLIC_SUPABASE_URL;
const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
const supabase = supabaseUrl && serviceKey ? createClient(supabaseUrl, serviceKey, { auth: { persistSession: false } }) : null;
let localQueue: Promise<void> = Promise.resolve();

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
  if (!supabase) return new Set((await readLocal()).swipes.filter((s) => s.user_id === userId).map((s) => s.profile_id));
  const { data, error } = await supabase.from("swipes").select("profile_id").eq("user_id", userId);
  if (error) throw new Error("Could not load swipe history");
  return new Set((data ?? []).map((row) => row.profile_id as string));
}

export async function saveSwipe(userId: string, profileId: string, action: SwipeAction) {
  const createdAt = new Date().toISOString();
  if (!supabase) {
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

  const { data, error } = await supabase.rpc("record_demo_swipe", {
    p_user_id: userId,
    p_profile_id: profileId,
    p_action: action,
  });
  if (error) throw new Error("Could not save swipe");
  const result = data as { duplicate?: boolean; matched?: boolean } | null;
  if (!result || typeof result.duplicate !== "boolean" || typeof result.matched !== "boolean") {
    throw new Error("Swipe storage returned an invalid response");
  }
  return { duplicate: result.duplicate, matched: result.matched };
}

export async function listMatchIds(userId: string): Promise<string[]> {
  if (!supabase) return (await readLocal()).matches.filter((m) => m.user_id === userId).map((m) => m.profile_id);
  const { data, error } = await supabase.from("matches").select("profile_id").eq("user_id", userId);
  if (error) throw new Error("Could not load matches");
  return (data ?? []).map((row) => row.profile_id as string);
}


import "server-only";

import { mkdir, readFile, writeFile } from "node:fs/promises";
import path from "node:path";

export type SwipeAction = "like" | "pass";

export type SwipeRecord = {
  user_id: string;
  profile_id: string;
  action: SwipeAction;
  created_at: string;
};

export type MatchRecord = {
  user_id: string;
  profile_id: string;
  created_at: string;
};

type LocalState = {
  swipes: SwipeRecord[];
  matches: MatchRecord[];
};

const redisUrl = (
  process.env.UPSTASH_REDIS_REST_URL ||
  process.env.KV_REST_API_URL ||
  ""
).trim().replace(/\/+$/, "");

const redisToken = (
  process.env.UPSTASH_REDIS_REST_TOKEN ||
  process.env.KV_REST_API_TOKEN ||
  ""
).trim();

const redisConfigured = Boolean(redisUrl && redisToken);

const localPath = process.env.COY_LOCAL_STORE_PATH
  ? path.resolve(process.env.COY_LOCAL_STORE_PATH)
  : path.join(process.cwd(), "data", "swipes.json");

export function isDurableStoreConfigured(): boolean {
  return redisConfigured;
}

let localQueue: Promise<void> = Promise.resolve();

async function redisCommand<T>(
  command: (string | number)[]
): Promise<T> {
  if (!redisConfigured) {
    throw new Error("UPSTASH_REDIS_NOT_CONFIGURED");
  }

  let response: Response;

  try {
    response = await fetch(redisUrl, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${redisToken}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify(command),
      cache: "no-store",
    });
  } catch (error) {
    console.error("REDIS NETWORK ERROR:", error);
    throw new Error("REDIS_NETWORK_ERROR");
  }

  const responseText = await response.text();

  let payload: {
    result?: T;
    error?: string;
  };

  try {
    payload = JSON.parse(responseText);
  } catch {
    console.error(
      "REDIS INVALID RESPONSE:",
      response.status,
      responseText.slice(0, 300)
    );

    throw new Error("REDIS_INVALID_RESPONSE");
  }

  if (!response.ok || payload.error) {
    console.error("REDIS COMMAND ERROR:", {
      status: response.status,
      error: payload.error,
    });

    throw new Error(
      payload.error || `REDIS_HTTP_ERROR_${response.status}`
    );
  }

  return payload.result as T;
}

function redisUserKey(
  kind: "swipes" | "matches",
  userId: string
): string {
  return `coy:${kind}:${encodeURIComponent(userId)}`;
}

async function withLocalLock<T>(
  operation: () => Promise<T>
): Promise<T> {
  const previous = localQueue;

  let release!: () => void;

  localQueue = new Promise<void>((resolve) => {
    release = resolve;
  });

  await previous;

  try {
    return await operation();
  } finally {
    release();
  }
}

async function readLocal(): Promise<LocalState> {
  try {
    const content = await readFile(localPath, "utf8");
    return JSON.parse(content) as LocalState;
  } catch (error) {
    if (
      error instanceof Error &&
      "code" in error &&
      error.code === "ENOENT"
    ) {
      return { swipes: [], matches: [] };
    }

    throw error;
  }
}

async function writeLocal(state: LocalState): Promise<void> {
  await mkdir(path.dirname(localPath), {
    recursive: true,
  });

  await writeFile(
    localPath,
    JSON.stringify(state, null, 2),
    "utf8"
  );
}

function requireLocalStorage(): void {
  if (process.env.VERCEL) {
    throw new Error("PERSISTENCE_NOT_CONFIGURED");
  }
}

export async function listSwipedProfileIds(
  userId: string
): Promise<Set<string>> {
  if (!userId) {
    throw new Error("USER_ID_REQUIRED");
  }

  if (redisConfigured) {
    const ids = await redisCommand<string[] | null>([
      "HKEYS",
      redisUserKey("swipes", userId),
    ]);

    return new Set(ids ?? []);
  }

  requireLocalStorage();

  const state = await readLocal();

  return new Set(
    state.swipes
      .filter((swipe) => swipe.user_id === userId)
      .map((swipe) => swipe.profile_id)
  );
}

export async function saveSwipe(
  userId: string,
  profileId: string,
  action: SwipeAction
): Promise<{ duplicate: boolean; matched: boolean }> {
  if (!userId || !profileId) {
    throw new Error("USER_AND_PROFILE_ID_REQUIRED");
  }

  if (action !== "like" && action !== "pass") {
    throw new Error("INVALID_SWIPE_ACTION");
  }

  const createdAt = new Date().toISOString();

  if (redisConfigured) {
    const { incomingLikes } = await import("./profiles");

    const script = `
      local already_swiped = redis.call('HEXISTS', KEYS[1], ARGV[1])

      if already_swiped == 1 then
        return {1, 0}
      end

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

    const result = await redisCommand<number[]>([
      "EVAL",
      script,
      2,
      redisUserKey("swipes", userId),
      redisUserKey("matches", userId),
      profileId,
      action,
      ...incomingLikes,
    ]);

    if (!Array.isArray(result) || result.length < 2) {
      throw new Error("INVALID_REDIS_SWIPE_RESPONSE");
    }

    return {
      duplicate: Number(result[0]) === 1,
      matched: Number(result[1]) === 1,
    };
  }

  requireLocalStorage();

  return withLocalLock(async () => {
    const state = await readLocal();

    const existing = state.swipes.some(
      (swipe) =>
        swipe.user_id === userId &&
        swipe.profile_id === profileId
    );

    if (existing) {
      return { duplicate: true, matched: false };
    }

    state.swipes.push({
      user_id: userId,
      profile_id: profileId,
      action,
      created_at: createdAt,
    });

    const { incomingLikes } = await import("./profiles");

    const matched =
      action === "like" && incomingLikes.has(profileId);

    if (
      matched &&
      !state.matches.some(
        (match) =>
          match.user_id === userId &&
          match.profile_id === profileId
      )
    ) {
      state.matches.push({
        user_id: userId,
        profile_id: profileId,
        created_at: createdAt,
      });
    }

    await writeLocal(state);

    return {
      duplicate: false,
      matched,
    };
  });
}

export async function listMatchIds(
  userId: string
): Promise<string[]> {
  if (!userId) {
    throw new Error("USER_ID_REQUIRED");
  }

  if (redisConfigured) {
    const ids = await redisCommand<string[] | null>([
      "SMEMBERS",
      redisUserKey("matches", userId),
    ]);

    return ids ?? [];
  }

  requireLocalStorage();

  const state = await readLocal();

  return state.matches
    .filter((match) => match.user_id === userId)
    .map((match) => match.profile_id);
}

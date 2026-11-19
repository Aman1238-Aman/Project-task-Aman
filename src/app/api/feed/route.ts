
import { NextResponse } from "next/server";
import { profiles } from "@/lib/profiles";
import {
  isDurableStoreConfigured,
  listSwipedProfileIds,
} from "@/lib/store";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";
export const revalidate = 0;

export async function GET() {
  try {
    // Check Redis configuration on Vercel
    if (
      process.env.VERCEL &&
      !isDurableStoreConfigured()
    ) {
      console.error(
        "PROFILES API: Redis environment variables are missing."
      );

      return NextResponse.json(
        {
          error:
            "Persistent storage is not connected. Check your Upstash Redis configuration.",
        },
        { status: 503 }
      );
    }

    // Load swipe history from Redis
    const userId = "demo-user";

    const swipedProfileIds =
      await listSwipedProfileIds(userId);

    // Filter profiles already swiped
    const availableProfiles = profiles.filter(
      (profile) => !swipedProfileIds.has(profile.id)
    );

    // Return available profiles
    return NextResponse.json(
      {
        profiles: availableProfiles,
        count: availableProfiles.length,
      },
      {
        status: 200,
        headers: {
          "Cache-Control": "no-store, no-cache, must-revalidate",
        },
      }
    );
  } catch (error) {
    // Log actual error in Vercel Runtime Logs
    console.error(
      "PROFILES API ERROR:",
      error instanceof Error ? error.message : "Unknown error"
    );

    return NextResponse.json(
      {
        error:
          "Persistent storage could not load swipe history. Check your Upstash Redis connection.",
      },
      { status: 503 }
    );
  }
}

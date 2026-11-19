
import { NextResponse } from "next/server";
import { profiles } from "@/lib/profiles";
import {
  isDurableStoreConfigured,
  listMatchIds,
} from "@/lib/store";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";
export const revalidate = 0;

export async function GET() {
  try {
    // Check Redis configuration
    if (
      process.env.VERCEL &&
      !isDurableStoreConfigured()
    ) {
      console.error(
        "MATCHES API: Redis environment variables are missing."
      );

      return NextResponse.json(
        {
          error:
            "Persistent storage is not connected. Check your Upstash Redis configuration.",
        },
        { status: 503 }
      );
    }

    // Load match IDs from Redis
    const userId = "demo-user";

    const matchIds = await listMatchIds(userId);

    // Convert IDs into a Set for faster lookup
    const matchedIds = new Set(matchIds);

    // Find matching profiles
    const matchedProfiles = profiles.filter(
      (profile) => matchedIds.has(profile.id)
    );

    // Return matches
    return NextResponse.json(
      {
        matches: matchedProfiles,
        count: matchedProfiles.length,
      },
      {
        status: 200,
        headers: {
          "Cache-Control": "no-store, no-cache, must-revalidate",
        },
      }
    );
  } catch (error) {
    console.error(
      "MATCHES API ERROR:",
      error instanceof Error ? error.message : "Unknown error"
    );

    return NextResponse.json(
      {
        error:
          "Persistent storage could not load matches. Check your Upstash Redis connection.",
      },
      { status: 503 }
    );
  }
}

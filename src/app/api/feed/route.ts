import { NextResponse } from "next/server";
import { profiles } from "@/lib/profiles";
import { isDurableStoreConfigured, listSwipedProfileIds } from "@/lib/store";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";
export async function GET() {
  try {
    if (process.env.VERCEL && !isDurableStoreConfigured()) return NextResponse.json({ error: "Persistent storage is not connected. Add UPSTASH_REDIS_REST_URL and UPSTASH_REDIS_REST_TOKEN in Vercel, then redeploy." }, { status: 503 });
    const swiped = await listSwipedProfileIds("demo-user");
    return NextResponse.json({ profiles: profiles.filter((profile) => !swiped.has(profile.id)) });
  } catch {
    return NextResponse.json({ error: "Persistent storage could not load swipe history. Check your Upstash Redis connection." }, { status: 503 });
  }
}

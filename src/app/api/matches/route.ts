import { NextResponse } from "next/server";
import { profiles } from "@/lib/profiles";
import { isDurableStoreConfigured, listMatchIds } from "@/lib/store";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";
export async function GET() {
  try {
    if (process.env.VERCEL && !isDurableStoreConfigured()) return NextResponse.json({ error: "Persistent storage is not connected. Connect Upstash Redis in Vercel or add its REST URL and token environment variables, then redeploy." }, { status: 503 });
    const ids = new Set(await listMatchIds("demo-user"));
    return NextResponse.json({ matches: profiles.filter((profile) => ids.has(profile.id)) });
  } catch {
    return NextResponse.json({ error: "Persistent storage could not load matches. Check your Upstash Redis connection." }, { status: 503 });
  }
}

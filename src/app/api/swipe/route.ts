import { NextRequest, NextResponse } from "next/server";
import { profiles } from "@/lib/profiles";
import { saveSwipe } from "@/lib/store";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";
export async function POST(request: NextRequest) {
  let body: unknown;
  try { body = await request.json(); }
  catch { return NextResponse.json({ error: "Request body must be valid JSON." }, { status: 400 }); }
  if (!body || typeof body !== "object") return NextResponse.json({ error: "A profile ID and action are required." }, { status: 400 });
  const { profileId, action } = body as Record<string, unknown>;
  if (typeof profileId !== "string" || !profiles.some((profile) => profile.id === profileId)) return NextResponse.json({ error: "Profile not found." }, { status: 400 });
  if (action !== "like" && action !== "pass") return NextResponse.json({ error: "Action must be 'like' or 'pass'." }, { status: 400 });
  try {
    const result = await saveSwipe("demo-user", profileId, action);
    if (result.duplicate) return NextResponse.json({ error: "This profile has already been swiped on." }, { status: 409 });
    return NextResponse.json({ ok: true, matched: result.matched, ...(result.matched ? { profile: profiles.find((profile) => profile.id === profileId) } : {}) });
  } catch (error) {
    if (error instanceof Error && error.message === "PERSISTENCE_NOT_CONFIGURED") {
      return NextResponse.json({ error: "Swipe history is not configured for this Vercel deployment. Connect an Upstash Redis database in Vercel or set UPSTASH_REDIS_REST_URL and UPSTASH_REDIS_REST_TOKEN, then redeploy." }, { status: 503 });
    }
    return NextResponse.json({ error: "Unable to save that swipe right now. Check the connected Upstash Redis database and its environment variables." }, { status: 500 });
  }
}

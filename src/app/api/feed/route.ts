import { NextResponse } from "next/server";
import { profiles } from "@/lib/profiles";
import { listSwipedProfileIds } from "@/lib/store";
import { resolveRequestIdentity } from "@/lib/auth";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";
export async function GET(request: Request) {
  try {
    const identity = await resolveRequestIdentity(request);
    if (!identity.userId) return NextResponse.json({ error: identity.unavailable ? "Phone sign-in is not fully configured on the server." : "Please sign in to continue." }, { status: identity.unavailable ? 503 : 401 });
    const swiped = await listSwipedProfileIds(identity.userId);
    return NextResponse.json({ profiles: profiles.filter((profile) => !swiped.has(profile.id)) });
  } catch {
    return NextResponse.json({ error: "Unable to load profiles right now." }, { status: 500 });
  }
}

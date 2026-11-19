import "server-only";
import { createClient } from "@supabase/supabase-js";

const supabaseUrl = process.env.SUPABASE_URL || process.env.NEXT_PUBLIC_SUPABASE_URL;
const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
const phoneAuthEnabled = Boolean(process.env.NEXT_PUBLIC_SUPABASE_URL && process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY);
const admin = supabaseUrl && serviceRoleKey
  ? createClient(supabaseUrl, serviceRoleKey, { auth: { persistSession: false } })
  : null;

export type RequestIdentity = {
  userId: string | null;
  required: boolean;
  unavailable: boolean;
};

export async function resolveRequestIdentity(request: Request): Promise<RequestIdentity> {
  if (!phoneAuthEnabled) return { userId: "demo-user", required: false, unavailable: false };
  if (!admin) return { userId: null, required: true, unavailable: true };

  const authorization = request.headers.get("authorization") ?? "";
  const token = /^Bearer\s+(.+)$/i.exec(authorization)?.[1];
  if (!token) return { userId: null, required: true, unavailable: false };

  try {
    const { data, error } = await admin.auth.getUser(token);
    if (error || !data.user) return { userId: null, required: true, unavailable: false };
    return { userId: data.user.id, required: true, unavailable: false };
  } catch {
    return { userId: null, required: true, unavailable: true };
  }
}

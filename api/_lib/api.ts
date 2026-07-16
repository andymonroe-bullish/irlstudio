import { createClient, SupabaseClient } from "@supabase/supabase-js";
import { createHash } from "node:crypto";

export type Ctx = { db: SupabaseClient; userId: string };

export function getAdminClient(): SupabaseClient {
  return createClient(
    process.env.SUPABASE_URL as string,
    process.env.SUPABASE_SERVICE_ROLE_KEY as string,
    { auth: { persistSession: false, autoRefreshToken: false } }
  );
}

export function hashKey(key: string): string {
  return createHash("sha256").update(key).digest("hex");
}

// Validates the Bearer API key and resolves it to a user. On failure, writes
// the 401 response and returns null — callers just return.
export async function authenticate(req: any, res: any): Promise<Ctx | null> {
  const match = String(req.headers.authorization || "").match(/^Bearer\s+(.+)$/i);
  if (!match) {
    res.status(401).json({ error: "Missing API key. Send it as: Authorization: Bearer <key>" });
    return null;
  }
  const db = getAdminClient();
  const { data: key, error } = await db
    .from("api_keys")
    .select("id, user_id, revoked")
    .eq("key_hash", hashKey(match[1].trim()))
    .maybeSingle();
  if (error || !key || key.revoked) {
    res.status(401).json({ error: "Invalid or revoked API key" });
    return null;
  }
  await db.from("api_keys").update({ last_used_at: new Date().toISOString() }).eq("id", key.id);
  return { db, userId: key.user_id };
}

// Events the key's user owns or collaborates on.
export async function collaboratorEventIds(ctx: Ctx): Promise<string[]> {
  const { data } = await ctx.db
    .from("event_collaborators")
    .select("event_id")
    .eq("user_id", ctx.userId);
  return (data ?? []).map((c: any) => c.event_id);
}

export async function canAccessEvent(ctx: Ctx, eventId: string): Promise<boolean> {
  const { data: event } = await ctx.db
    .from("events")
    .select("id, created_by")
    .eq("id", eventId)
    .maybeSingle();
  if (!event) return false;
  if (event.created_by === ctx.userId) return true;
  const { data: collab } = await ctx.db
    .from("event_collaborators")
    .select("id")
    .eq("event_id", eventId)
    .eq("user_id", ctx.userId)
    .maybeSingle();
  return !!collab;
}

// Look up an event-scoped child row (task, budget item, note) and verify the
// key's user can access its parent event. Writes the 404 response on failure.
export async function getAccessibleChild(
  ctx: Ctx,
  res: any,
  table: string,
  id: string
): Promise<any | null> {
  const { data: row } = await ctx.db.from(table).select("*").eq("id", id).maybeSingle();
  if (!row || !(await canAccessEvent(ctx, row.event_id))) {
    res.status(404).json({ error: "Not found" });
    return null;
  }
  return row;
}

export function pick(body: any, allowed: string[]): Record<string, any> {
  const out: Record<string, any> = {};
  for (const field of allowed) {
    if (body && body[field] !== undefined) out[field] = body[field];
  }
  return out;
}

export function methodNotAllowed(res: any, allowed: string[]) {
  res.setHeader("Allow", allowed.join(", "));
  res.status(405).json({ error: `Method not allowed. Use: ${allowed.join(", ")}` });
}

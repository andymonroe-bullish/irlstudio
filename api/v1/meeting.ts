import { authenticate, methodNotAllowed, pick } from "../_lib/api.js";

// Single meeting: full detail including notes and transcript. PATCH is meant
// for agents to mark a meeting handled ({ "processed": true }) after they
// have sifted it and created tasks in the relevant events.
export default async function handler(req: any, res: any) {
  const ctx = await authenticate(req, res);
  if (!ctx) return;

  const id = req.query.id as string;
  const { data: meeting } = await ctx.db.from("meetings").select("*").eq("id", id).maybeSingle();
  if (!meeting) return res.status(404).json({ error: "Not found" });

  if (req.method === "GET") {
    return res.status(200).json({ meeting });
  }

  if (req.method === "PATCH") {
    const updates = pick(req.body ?? {}, ["processed", "title", "summary", "action_items", "notes"]);
    if (updates.processed === true && !meeting.processed_at) {
      updates.processed_at = new Date().toISOString();
    }
    if (updates.processed === false) {
      updates.processed_at = null;
    }
    const { data, error } = await ctx.db
      .from("meetings")
      .update(updates)
      .eq("id", id)
      .select()
      .single();
    if (error) return res.status(400).json({ error: error.message });
    return res.status(200).json({ meeting: data });
  }

  if (req.method === "DELETE") {
    const { error } = await ctx.db.from("meetings").delete().eq("id", id);
    if (error) return res.status(400).json({ error: error.message });
    return res.status(200).json({ deleted: true });
  }

  methodNotAllowed(res, ["GET", "PATCH", "DELETE"]);
}

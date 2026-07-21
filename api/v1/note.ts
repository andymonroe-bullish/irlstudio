import { authenticate, getAccessibleChild, methodNotAllowed, pick } from "../_lib/api.js";

const WRITABLE = ["title", "content", "folder_id", "sort_order"];

export default async function handler(req: any, res: any) {
  const ctx = await authenticate(req, res);
  if (!ctx) return;
  const note = await getAccessibleChild(ctx, res, "notes", req.query.id as string);
  if (!note) return;

  if (req.method === "GET") {
    return res.status(200).json({ note });
  }

  if (req.method === "PATCH") {
    const updates = pick(req.body ?? {}, WRITABLE);
    if (!Object.keys(updates).length) {
      return res.status(400).json({ error: `No updatable fields provided. Updatable: ${WRITABLE.join(", ")}` });
    }
    const { data, error } = await ctx.db
      .from("notes")
      .update({ ...updates, updated_at: new Date().toISOString() })
      .eq("id", note.id)
      .select()
      .single();
    if (error) return res.status(400).json({ error: error.message });
    return res.status(200).json({ note: data });
  }

  if (req.method === "DELETE") {
    const { error } = await ctx.db.from("notes").delete().eq("id", note.id);
    if (error) return res.status(400).json({ error: error.message });
    return res.status(200).json({ deleted: true });
  }

  methodNotAllowed(res, ["GET", "PATCH", "DELETE"]);
}

import { authenticate, getAccessibleChild, methodNotAllowed, pick } from "../../_lib/api.js";

const WRITABLE = [
  "title", "description", "status", "priority", "due_date", "category",
  "phase_id", "sort_order", "assignee",
];

export default async function handler(req: any, res: any) {
  const ctx = await authenticate(req, res);
  if (!ctx) return;
  const task = await getAccessibleChild(ctx, res, "tasks", req.query.id as string);
  if (!task) return;

  if (req.method === "GET") {
    return res.status(200).json({ task });
  }

  if (req.method === "PATCH") {
    const updates = pick(req.body ?? {}, WRITABLE);
    if (!Object.keys(updates).length) {
      return res.status(400).json({ error: `No updatable fields provided. Updatable: ${WRITABLE.join(", ")}` });
    }
    const { data, error } = await ctx.db
      .from("tasks")
      .update({ ...updates, updated_at: new Date().toISOString() })
      .eq("id", task.id)
      .select()
      .single();
    if (error) return res.status(400).json({ error: error.message });
    return res.status(200).json({ task: data });
  }

  if (req.method === "DELETE") {
    const { error } = await ctx.db.from("tasks").delete().eq("id", task.id);
    if (error) return res.status(400).json({ error: error.message });
    return res.status(200).json({ deleted: true });
  }

  methodNotAllowed(res, ["GET", "PATCH", "DELETE"]);
}

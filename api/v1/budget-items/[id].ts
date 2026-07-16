import { authenticate, getAccessibleChild, methodNotAllowed, pick } from "../../_lib/api.js";

const WRITABLE = [
  "name", "category", "description", "estimated_cost", "actual_cost",
  "status", "due_date", "paid", "vendor_id", "notes", "sort_order",
];

export default async function handler(req: any, res: any) {
  const ctx = await authenticate(req, res);
  if (!ctx) return;
  const item = await getAccessibleChild(ctx, res, "budget_items", req.query.id as string);
  if (!item) return;

  if (req.method === "GET") {
    return res.status(200).json({ budget_item: item });
  }

  if (req.method === "PATCH") {
    const updates = pick(req.body ?? {}, WRITABLE);
    if (!Object.keys(updates).length) {
      return res.status(400).json({ error: `No updatable fields provided. Updatable: ${WRITABLE.join(", ")}` });
    }
    const { data, error } = await ctx.db
      .from("budget_items")
      .update({ ...updates, updated_at: new Date().toISOString() })
      .eq("id", item.id)
      .select()
      .single();
    if (error) return res.status(400).json({ error: error.message });
    return res.status(200).json({ budget_item: data });
  }

  if (req.method === "DELETE") {
    const { error } = await ctx.db.from("budget_items").delete().eq("id", item.id);
    if (error) return res.status(400).json({ error: error.message });
    return res.status(200).json({ deleted: true });
  }

  methodNotAllowed(res, ["GET", "PATCH", "DELETE"]);
}

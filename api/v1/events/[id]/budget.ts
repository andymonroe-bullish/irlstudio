import { authenticate, canAccessEvent, methodNotAllowed, pick } from "../../../_lib/api.js";

const WRITABLE = [
  "name", "category", "description", "estimated_cost", "actual_cost",
  "status", "due_date", "paid", "vendor_id", "notes", "sort_order",
];

export default async function handler(req: any, res: any) {
  const ctx = await authenticate(req, res);
  if (!ctx) return;
  const eventId = req.query.id as string;

  if (!(await canAccessEvent(ctx, eventId))) {
    return res.status(404).json({ error: "Event not found" });
  }

  if (req.method === "GET") {
    const { data, error } = await ctx.db
      .from("budget_items")
      .select("*")
      .eq("event_id", eventId)
      .order("sort_order");
    if (error) return res.status(500).json({ error: error.message });
    return res.status(200).json({ budget_items: data });
  }

  if (req.method === "POST") {
    const body = req.body ?? {};
    if (!body.name) return res.status(400).json({ error: "name is required" });
    const insert = {
      category: "General",
      ...pick(body, WRITABLE),
      event_id: eventId,
      created_by: ctx.userId,
    };
    const { data, error } = await ctx.db.from("budget_items").insert(insert).select().single();
    if (error) return res.status(400).json({ error: error.message });
    return res.status(201).json({ budget_item: data });
  }

  methodNotAllowed(res, ["GET", "POST"]);
}

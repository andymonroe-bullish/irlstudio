import { authenticate, canAccessEvent, methodNotAllowed, pick } from "../../_lib/api.js";

const WRITABLE = [
  "name", "description", "event_date", "event_end_date", "venue", "venue_address",
  "expected_guests", "actual_guests", "status", "type", "total_budget",
  "actual_spend", "notes", "cover_image_url", "phase_due_dates", "slug",
];

const INCLUDABLE: Record<string, { table: string; order: string }> = {
  tasks: { table: "tasks", order: "sort_order" },
  budget: { table: "budget_items", order: "sort_order" },
  notes: { table: "notes", order: "sort_order" },
  itinerary: { table: "itinerary_sessions", order: "sort_order" },
  run_of_show: { table: "run_of_show", order: "order_index" },
  revenue: { table: "revenue_items", order: "sort_order" },
};

export default async function handler(req: any, res: any) {
  const ctx = await authenticate(req, res);
  if (!ctx) return;
  const eventId = req.query.id as string;

  if (!(await canAccessEvent(ctx, eventId))) {
    return res.status(404).json({ error: "Event not found" });
  }

  if (req.method === "GET") {
    const { data: event, error } = await ctx.db.from("events").select("*").eq("id", eventId).single();
    if (error) return res.status(500).json({ error: error.message });
    const result: Record<string, any> = { event };
    const includes = String(req.query.include || "")
      .split(",")
      .map((s: string) => s.trim())
      .filter((s: string) => INCLUDABLE[s]);
    await Promise.all(
      includes.map(async (name: string) => {
        const { table, order } = INCLUDABLE[name];
        const { data } = await ctx.db.from(table).select("*").eq("event_id", eventId).order(order);
        result[name] = data ?? [];
      })
    );
    return res.status(200).json(result);
  }

  if (req.method === "PATCH") {
    const updates = pick(req.body ?? {}, WRITABLE);
    if (!Object.keys(updates).length) {
      return res.status(400).json({ error: `No updatable fields provided. Updatable: ${WRITABLE.join(", ")}` });
    }
    const { data, error } = await ctx.db
      .from("events")
      .update({ ...updates, updated_at: new Date().toISOString() })
      .eq("id", eventId)
      .select()
      .single();
    if (error) return res.status(400).json({ error: error.message });
    return res.status(200).json({ event: data });
  }

  if (req.method === "DELETE") {
    const { error } = await ctx.db.from("events").delete().eq("id", eventId);
    if (error) return res.status(400).json({ error: error.message });
    return res.status(200).json({ deleted: true });
  }

  methodNotAllowed(res, ["GET", "PATCH", "DELETE"]);
}

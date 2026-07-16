import { authenticate, collaboratorEventIds, methodNotAllowed, pick } from "../../_lib/api";

const WRITABLE = [
  "name", "description", "event_date", "event_end_date", "venue", "venue_address",
  "expected_guests", "actual_guests", "status", "type", "total_budget",
  "actual_spend", "notes", "cover_image_url", "phase_due_dates", "slug",
];

export default async function handler(req: any, res: any) {
  const ctx = await authenticate(req, res);
  if (!ctx) return;

  if (req.method === "GET") {
    const collabIds = await collaboratorEventIds(ctx);
    let query = ctx.db.from("events").select("*");
    query = collabIds.length
      ? query.or(`created_by.eq.${ctx.userId},id.in.(${collabIds.join(",")})`)
      : query.eq("created_by", ctx.userId);
    if (req.query.status) query = query.eq("status", req.query.status);
    const { data, error } = await query.order("event_date", { ascending: true, nullsFirst: false });
    if (error) return res.status(500).json({ error: error.message });
    return res.status(200).json({ events: data });
  }

  if (req.method === "POST") {
    const body = req.body ?? {};
    if (!body.name) return res.status(400).json({ error: "name is required" });
    const { data, error } = await ctx.db
      .from("events")
      .insert({ ...pick(body, WRITABLE), created_by: ctx.userId })
      .select()
      .single();
    if (error) return res.status(400).json({ error: error.message });
    return res.status(201).json({ event: data });
  }

  methodNotAllowed(res, ["GET", "POST"]);
}

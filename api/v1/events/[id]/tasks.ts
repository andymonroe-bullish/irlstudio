import { authenticate, canAccessEvent, methodNotAllowed, pick } from "../../../_lib/api.js";

const WRITABLE = [
  "title", "description", "status", "priority", "due_date", "category",
  "phase_id", "sort_order", "assignee",
];

export default async function handler(req: any, res: any) {
  const ctx = await authenticate(req, res);
  if (!ctx) return;
  const eventId = req.query.id as string;

  if (!(await canAccessEvent(ctx, eventId))) {
    return res.status(404).json({ error: "Event not found" });
  }

  if (req.method === "GET") {
    let query = ctx.db.from("tasks").select("*").eq("event_id", eventId);
    if (req.query.status) query = query.eq("status", req.query.status);
    if (req.query.phase_id) query = query.eq("phase_id", req.query.phase_id);
    const { data, error } = await query.order("phase_id").order("sort_order");
    if (error) return res.status(500).json({ error: error.message });
    return res.status(200).json({ tasks: data });
  }

  if (req.method === "POST") {
    const body = req.body ?? {};
    if (!body.title) return res.status(400).json({ error: "title is required" });
    const insert = {
      status: "not_started",
      phase_id: "design",
      ...pick(body, WRITABLE),
      event_id: eventId,
      created_by: ctx.userId,
    };
    if (insert.sort_order === undefined) {
      const { data: last } = await ctx.db
        .from("tasks")
        .select("sort_order")
        .eq("event_id", eventId)
        .eq("phase_id", insert.phase_id)
        .order("sort_order", { ascending: false })
        .limit(1)
        .maybeSingle();
      insert.sort_order = (last?.sort_order ?? -1) + 1;
    }
    const { data, error } = await ctx.db.from("tasks").insert(insert).select().single();
    if (error) return res.status(400).json({ error: error.message });
    return res.status(201).json({ task: data });
  }

  methodNotAllowed(res, ["GET", "POST"]);
}

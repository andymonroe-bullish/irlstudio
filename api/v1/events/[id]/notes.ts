import { authenticate, canAccessEvent, methodNotAllowed, pick } from "../../../_lib/api.js";

const WRITABLE = ["title", "content", "folder_id", "sort_order"];

export default async function handler(req: any, res: any) {
  const ctx = await authenticate(req, res);
  if (!ctx) return;
  const eventId = req.query.id as string;

  if (!(await canAccessEvent(ctx, eventId))) {
    return res.status(404).json({ error: "Event not found" });
  }

  if (req.method === "GET") {
    const { data, error } = await ctx.db
      .from("notes")
      .select("*")
      .eq("event_id", eventId)
      .order("sort_order");
    if (error) return res.status(500).json({ error: error.message });
    return res.status(200).json({ notes: data });
  }

  if (req.method === "POST") {
    const body = req.body ?? {};
    if (!body.title && !body.content) {
      return res.status(400).json({ error: "title or content is required" });
    }
    const { data, error } = await ctx.db
      .from("notes")
      .insert({ ...pick(body, WRITABLE), event_id: eventId })
      .select()
      .single();
    if (error) return res.status(400).json({ error: error.message });
    return res.status(201).json({ note: data });
  }

  methodNotAllowed(res, ["GET", "POST"]);
}

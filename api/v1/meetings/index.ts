import { authenticate, methodNotAllowed } from "../../_lib/api.js";

// List meetings ingested from Circleback. Meetings are org-wide (not scoped
// to a single event), so any valid API key can read them. The transcript is
// omitted from the list for size — fetch a single meeting to get it.
export default async function handler(req: any, res: any) {
  const ctx = await authenticate(req, res);
  if (!ctx) return;

  if (req.method === "GET") {
    let query = ctx.db
      .from("meetings")
      .select("id, source, external_id, title, meeting_date, attendees, summary, action_items, processed, processed_at, created_at");
    if (req.query.processed === "true") query = query.eq("processed", true);
    if (req.query.processed === "false") query = query.eq("processed", false);
    if (req.query.since) query = query.gte("created_at", req.query.since);
    const { data, error } = await query.order("created_at", { ascending: false });
    if (error) return res.status(500).json({ error: error.message });
    return res.status(200).json({ meetings: data });
  }

  methodNotAllowed(res, ["GET"]);
}

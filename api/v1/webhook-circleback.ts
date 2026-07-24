import { getAdminClient } from "../_lib/api.js";

// Inbound webhook for Circleback (circleback.ai) meeting data. Circleback's
// payload shape varies by configuration, so extraction is deliberately
// tolerant: known field aliases are tried in order and the full body is
// always kept in raw_payload so nothing is ever lost.
//
// Auth: the shared secret must be sent as ?secret=, an X-Webhook-Secret
// header, or an Authorization: Bearer header.

const first = (obj: any, keys: string[]): any => {
  for (const key of keys) {
    const val = key.split(".").reduce((o, part) => (o == null ? o : o[part]), obj);
    if (val !== undefined && val !== null && val !== "") return val;
  }
  return null;
};

const asText = (val: any): string | null => {
  if (val == null) return null;
  if (typeof val === "string") return val;
  if (Array.isArray(val)) {
    // e.g. transcript segments [{ speaker, text }] or plain strings
    return val
      .map((seg: any) =>
        typeof seg === "string"
          ? seg
          : [seg?.speaker || seg?.speakerName, seg?.text || seg?.content]
              .filter(Boolean)
              .join(": ")
      )
      .filter(Boolean)
      .join("\n");
  }
  if (typeof val === "object") return JSON.stringify(val);
  return String(val);
};

export default async function handler(req: any, res: any) {
  if (req.method !== "POST") {
    res.setHeader("Allow", "POST");
    return res.status(405).json({ error: "Method not allowed. Use: POST" });
  }

  const secret = process.env.CIRCLEBACK_WEBHOOK_SECRET;
  const provided =
    req.query?.secret ||
    req.headers["x-webhook-secret"] ||
    String(req.headers.authorization || "").replace(/^Bearer\s+/i, "");
  if (!secret || provided !== secret) {
    return res.status(401).json({ error: "Invalid webhook secret" });
  }

  const body = typeof req.body === "string" ? JSON.parse(req.body || "{}") : (req.body ?? {});
  const meeting = body.meeting && typeof body.meeting === "object" ? { ...body, ...body.meeting } : body;

  const externalId = first(meeting, ["id", "meetingId", "meeting_id", "eventId", "uuid"]);
  const row = {
    source: "circleback",
    external_id: externalId != null ? String(externalId) : null,
    title:
      asText(first(meeting, ["name", "title", "meetingName", "meeting_title", "subject"])) ||
      "Untitled meeting",
    meeting_date: first(meeting, [
      "date", "startTime", "start_time", "startedAt", "started_at", "createdAt", "created_at", "timestamp",
    ]),
    attendees: first(meeting, ["attendees", "participants", "members", "invitees"]),
    summary: asText(first(meeting, ["summary", "overview", "aiSummary", "description", "recap"])),
    notes: first(meeting, ["notes", "sections", "outline", "keyPoints", "key_points"]),
    action_items: first(meeting, ["actionItems", "action_items", "tasks", "todos", "followUps", "follow_ups"]),
    transcript: asText(first(meeting, ["transcript", "transcription", "transcript_text", "transcriptText", "transcriptSegments", "utterances"])),
    raw_payload: body,
  };

  const db = getAdminClient();
  const query = row.external_id
    ? db.from("meetings").upsert(row, { onConflict: "source,external_id" })
    : db.from("meetings").insert(row);
  const { data, error } = await query.select("id").single();

  if (error) return res.status(500).json({ error: error.message });
  return res.status(200).json({ id: data.id, status: "stored" });
}

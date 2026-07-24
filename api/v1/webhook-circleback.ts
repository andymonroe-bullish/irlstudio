import { createHmac, timingSafeEqual } from "node:crypto";
import { getAdminClient } from "../_lib/api.js";

// Inbound webhook for Circleback (circleback.ai) meeting data. Circleback's
// payload shape varies by configuration, so extraction is deliberately
// tolerant: known field aliases are tried in order and the full body is
// always kept in raw_payload so nothing is ever lost.
//
// Auth, either of:
// - Circleback's whsec_ signing secret (CIRCLEBACK_SIGNING_SECRET): requests
//   are verified via Standard Webhooks HMAC signatures over the raw body
//   (webhook-id/webhook-timestamp/webhook-signature or svix-* headers).
// - Shared secret (CIRCLEBACK_WEBHOOK_SECRET) sent as ?secret=, an
//   X-Webhook-Secret header, or an Authorization: Bearer header — kept for
//   manual testing and non-signing senders.

// Signatures are computed over the exact raw bytes, so body parsing is off.
export const config = { api: { bodyParser: false } };

async function readRawBody(req: any): Promise<string> {
  let raw = "";
  try {
    for await (const chunk of req) raw += chunk;
  } catch {
    // stream already consumed by a body parser
  }
  if (!raw && req.body !== undefined) {
    return typeof req.body === "string" ? req.body : JSON.stringify(req.body);
  }
  return raw;
}

function safeEqual(a: string, b: string): boolean {
  const bufA = Buffer.from(a);
  const bufB = Buffer.from(b);
  return bufA.length === bufB.length && timingSafeEqual(bufA, bufB);
}

// Standard Webhooks (Svix-style) verification: HMAC-SHA256 of
// "<id>.<timestamp>.<raw body>" keyed by the base64-decoded part of whsec_.
function hasValidSignature(req: any, rawBody: string, signingSecret: string): boolean {
  const id = req.headers["webhook-id"] || req.headers["svix-id"];
  const timestamp = req.headers["webhook-timestamp"] || req.headers["svix-timestamp"];
  const sigHeader = req.headers["webhook-signature"] || req.headers["svix-signature"];
  if (!id || !timestamp || !sigHeader) return false;

  const signedContent = `${id}.${timestamp}.${rawBody}`;
  const stripped = signingSecret.replace(/^whsec_/, "");
  // The spec says the secret portion is base64, but tolerate senders that
  // key the HMAC with hex-decoded bytes or the raw string instead.
  const candidateKeys = [
    Buffer.from(stripped, "base64"),
    Buffer.from(stripped, "utf8"),
    Buffer.from(signingSecret, "utf8"),
  ];
  if (/^[0-9a-f]+$/i.test(stripped) && stripped.length % 2 === 0) {
    candidateKeys.push(Buffer.from(stripped, "hex"));
  }
  const provided = String(sigHeader)
    .split(" ")
    .map((part) => part.split(",").pop() || "")
    .filter(Boolean);

  return candidateKeys.some((key) => {
    const expected = createHmac("sha256", key).update(signedContent).digest("base64");
    return provided.some((sig) => safeEqual(sig, expected));
  });
}

// Circleback's actual scheme (observed live): an x-signature header carrying
// a hex HMAC-SHA256 of the raw body alone. Key encoding unspecified, so try
// the plausible decodings of the whsec_ secret; accept hex or base64 digests.
function hasValidBodySignature(req: any, rawBody: string, signingSecret: string): boolean {
  const header =
    req.headers["x-signature"] ||
    req.headers["x-circleback-signature"] ||
    req.headers["x-hub-signature-256"];
  if (!header) return false;
  const provided = String(header).replace(/^sha256=/i, "").trim();

  const stripped = signingSecret.replace(/^whsec_/, "");
  const candidateKeys = [
    Buffer.from(signingSecret, "utf8"),
    Buffer.from(stripped, "utf8"),
    Buffer.from(stripped, "base64"),
  ];
  if (/^[0-9a-f]+$/i.test(stripped) && stripped.length % 2 === 0) {
    candidateKeys.push(Buffer.from(stripped, "hex"));
  }

  return candidateKeys.some((key) => {
    const hmac = createHmac("sha256", key).update(rawBody);
    const digestHex = hmac.digest("hex");
    const digestB64 = createHmac("sha256", key).update(rawBody).digest("base64");
    return safeEqual(provided.toLowerCase(), digestHex) || safeEqual(provided, digestB64);
  });
}

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
  // Some senders validate the URL with a GET/HEAD probe before saving it
  if (req.method === "GET" || req.method === "HEAD") {
    return res.status(200).json({ status: "ok", accepts: "POST" });
  }
  if (req.method !== "POST") {
    res.setHeader("Allow", "POST, GET");
    return res.status(405).json({ error: "Method not allowed. Use: POST" });
  }

  const rawBody = await readRawBody(req);

  const sharedSecret = process.env.CIRCLEBACK_WEBHOOK_SECRET;
  const signingSecret = process.env.CIRCLEBACK_SIGNING_SECRET;
  const providedShared = String(
    req.query?.secret ||
      req.headers["x-webhook-secret"] ||
      String(req.headers.authorization || "").replace(/^Bearer\s+/i, "")
  );

  // Accept either configured secret as a plain shared secret, or a valid
  // Standard Webhooks signature.
  const sharedOk =
    !!providedShared &&
    ((!!sharedSecret && safeEqual(providedShared, sharedSecret)) ||
      (!!signingSecret && safeEqual(providedShared, signingSecret)));
  const signatureOk =
    !!signingSecret &&
    (hasValidSignature(req, rawBody, signingSecret) ||
      hasValidBodySignature(req, rawBody, signingSecret));
  if (!sharedOk && !signatureOk) {
    // Diagnostic for Vercel runtime logs: which auth headers were present on
    // the rejected request (signature values are per-message, not secrets).
    const headerInfo: Record<string, string> = {};
    for (const [name, value] of Object.entries(req.headers)) {
      headerInfo[name] = /sig|svix|webhook|circle|auth/i.test(name) ? String(value) : "";
    }
    console.log(
      "circleback webhook rejected:",
      JSON.stringify({ headers: headerInfo, bodyLength: rawBody.length, bodyPreview: rawBody.slice(0, 300) })
    );
    return res.status(401).json({ error: "Invalid webhook secret or signature" });
  }

  let body: any;
  try {
    body = rawBody ? JSON.parse(rawBody) : {};
  } catch {
    return res.status(400).json({ error: "Body must be valid JSON" });
  }
  const meeting = body.meeting && typeof body.meeting === "object" ? { ...body, ...body.meeting } : body;

  const externalId = first(meeting, ["id", "meetingId", "meeting_id", "eventId", "uuid"]);
  const row = {
    source: "circleback",
    external_id: externalId != null ? String(externalId) : null,
    // Null when absent so a sparse redelivery can't clobber a real title;
    // the insert path fills in the fallback below.
    title: asText(first(meeting, ["name", "title", "meetingName", "meeting_title", "subject"])),
    meeting_date: first(meeting, [
      "date", "startTime", "start_time", "startedAt", "started_at", "createdAt", "created_at", "timestamp",
    ]),
    attendees: first(meeting, ["attendees", "participants", "members", "invitees"]),
    summary: asText(first(meeting, ["summary", "overview", "aiSummary", "description", "recap"])),
    notes: first(meeting, ["notes", "sections", "outline", "keyPoints", "key_points"]) as any,
    action_items: first(meeting, ["actionItems", "action_items", "tasks", "todos", "followUps", "follow_ups"]),
    transcript: asText(first(meeting, ["transcript", "transcription", "transcript_text", "transcriptText", "transcriptSegments", "utterances"])),
    raw_payload: body,
  };

  // Circleback sends its meeting summary as a markdown string under "notes"
  // with no separate summary field — promote it so list views aren't empty.
  if (!row.summary && typeof row.notes === "string") {
    row.summary = row.notes;
    row.notes = null;
  }

  const db = getAdminClient();

  // Circleback can deliver the same meeting more than once (e.g. notes first,
  // transcript later). Merge into the existing row, never overwriting data
  // with nulls from a sparser delivery.
  if (row.external_id) {
    const { data: existing } = await db
      .from("meetings")
      .select("id")
      .eq("source", row.source)
      .eq("external_id", row.external_id)
      .maybeSingle();
    if (existing) {
      const updates = Object.fromEntries(
        Object.entries(row).filter(([, val]) => val !== null)
      );
      const { error } = await db.from("meetings").update(updates).eq("id", existing.id);
      if (error) return res.status(500).json({ error: error.message });
      return res.status(200).json({ id: existing.id, status: "updated" });
    }
  }

  const { data, error } = await db
    .from("meetings")
    .insert({ ...row, title: row.title || "Untitled meeting" })
    .select("id")
    .single();
  if (error) return res.status(500).json({ error: error.message });
  return res.status(200).json({ id: data.id, status: "stored" });
}

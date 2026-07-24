// Admin portal allowlist. Must be kept in sync with the RLS policies on the
// meetings table (supabase/migrations/20260724000002_meetings.sql) — this
// constant controls UI visibility, the policies control data access.
export const ADMIN_EMAILS = ["andy@bullishevents.com", "ethan@bullishevents.com"];

export const isAdminEmail = (email?: string | null): boolean =>
  !!email && ADMIN_EMAILS.includes(email.toLowerCase());

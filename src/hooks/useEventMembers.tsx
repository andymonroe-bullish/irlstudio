import { useState, useEffect, useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";

export interface EventMember {
  userId: string;
  fullName: string | null;
  email: string | null;
  role: string; // 'owner' | 'admin' | 'editor' | 'viewer'
  isOwner: boolean;
}

/** Display label for a member: name first, then email, then a safe fallback. */
export const memberLabel = (m: Pick<EventMember, "fullName" | "email">): string =>
  m.fullName?.trim() || m.email?.trim() || "Unnamed member";

/** Initials for an avatar chip. */
export const memberInitials = (m: Pick<EventMember, "fullName" | "email">): string => {
  const label = memberLabel(m);
  const parts = label.split(/\s+/).filter(Boolean);
  if (parts.length >= 2) return (parts[0][0] + parts[1][0]).toUpperCase();
  return label.slice(0, 1).toUpperCase();
};

/**
 * Everyone who can be assigned to a task on this event:
 * the owner (events.created_by) plus all collaborators, resolved to profiles.
 */
export const useEventMembers = (eventId: string) => {
  const [members, setMembers] = useState<EventMember[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchMembers = useCallback(async () => {
    if (!eventId) return;
    try {
      setLoading(true);

      const [eventRes, collabRes] = await Promise.all([
        supabase.from("events").select("created_by").eq("id", eventId).single(),
        supabase.from("event_collaborators").select("user_id, role").eq("event_id", eventId),
      ]);

      const ownerId: string | undefined = (eventRes.data as { created_by?: string } | null)?.created_by;
      const collaborators = (collabRes.data || []) as { user_id: string; role: string }[];

      // Unique list of user ids (owner first), de-duped against collaborators
      const collabIds = collaborators.map((c) => c.user_id);
      const allIds = Array.from(new Set([ownerId, ...collabIds].filter(Boolean))) as string[];

      // Resolve names/emails from profiles
      const profileMap = new Map<string, { full_name: string | null; email: string | null }>();
      if (allIds.length > 0) {
        const { data: profiles } = await supabase
          .from("profiles")
          .select("user_id, full_name, email")
          .in("user_id", allIds);
        for (const p of (profiles || []) as { user_id: string; full_name: string | null; email: string | null }[]) {
          profileMap.set(p.user_id, { full_name: p.full_name, email: p.email });
        }
      }

      const result: EventMember[] = [];

      if (ownerId) {
        const prof = profileMap.get(ownerId);
        result.push({
          userId: ownerId,
          fullName: prof?.full_name ?? null,
          email: prof?.email ?? null,
          role: "owner",
          isOwner: true,
        });
      }

      for (const c of collaborators) {
        if (c.user_id === ownerId) continue; // owner already added
        const prof = profileMap.get(c.user_id);
        result.push({
          userId: c.user_id,
          fullName: prof?.full_name ?? null,
          email: prof?.email ?? null,
          role: c.role,
          isOwner: false,
        });
      }

      setMembers(result);
    } catch {
      setMembers([]);
    } finally {
      setLoading(false);
    }
  }, [eventId]);

  useEffect(() => {
    fetchMembers();
  }, [fetchMembers]);

  return { members, loading, refetch: fetchMembers };
};

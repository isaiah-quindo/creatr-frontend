import type { PublicCreator } from "@/lib/api";

/** Server-safe helpers for the public profile (no "use client"). */
export function displayName(c: PublicCreator): string {
  const full = `${c.first_name} ${c.last_name}`.trim();
  return full || `@${c.username}`;
}

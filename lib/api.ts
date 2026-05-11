/**
 * Tiny wrapper around fetch for talking to the Django backend.
 *
 * - Sends cookies (`credentials: "include"`) so the session cookie sticks.
 * - Reads the `csrftoken` cookie set by GET /api/auth/csrf/ and sends it back
 *   as `X-CSRFToken` on unsafe requests.
 * - Throws ApiError on non-2xx responses with the parsed body attached.
 */

/**
 * Browser calls go through the Next.js rewrite at `/api/*` → Django, so the
 * fetch is same-origin and cookies are first-party (works on mobile Safari,
 * works over LAN, no CORS). Server-side fetches (RSC) bypass the rewrite —
 * they need an absolute URL pointing at Django directly.
 *
 *   Browser  → "" → /api/foo (same-origin) → Next rewrite → BACKEND_URL/api/foo/
 *   Server   → BACKEND_URL → BACKEND_URL/api/foo/
 *
 * BACKEND_URL is a *server-only* env var (no NEXT_PUBLIC_ prefix) so it never
 * leaks to the browser; that's what keeps the browser pinned to same-origin.
 */
export const API_BASE =
  typeof window === "undefined"
    ? (process.env.BACKEND_URL ?? "http://127.0.0.1:8000")
    : "";

export class ApiError extends Error {
  constructor(public status: number, public data: unknown, message: string) {
    super(message);
  }
}

/**
 * Pull a 400 DRF-style validation error into per-field messages. Returns null when
 * the error is not a field-validation 400 (network failure, 500, etc.) so callers
 * know to fall back to a toast. `stray` collects messages whose key isn't one of
 * `knownFields` (e.g. `non_field_errors`) so they can still be surfaced — typically
 * via toast when no field-level error is also present.
 */
export function parseFieldErrors<K extends string>(
  err: unknown,
  knownFields: readonly K[],
): { fields: Partial<Record<K, string>>; stray: string | null } | null {
  if (!(err instanceof ApiError) || err.status !== 400) return null;
  if (typeof err.data !== "object" || err.data === null) return null;
  const data = err.data as Record<string, unknown>;
  const fields: Partial<Record<K, string>> = {};
  const stray: string[] = [];
  const known = new Set<string>(knownFields);
  for (const [k, v] of Object.entries(data)) {
    const msg = flattenMessage(v);
    if (!msg) continue;
    if (known.has(k)) {
      fields[k as K] = msg;
    } else {
      stray.push(msg);
    }
  }
  return { fields, stray: stray.length ? stray.join(" ") : null };
}

function flattenMessage(v: unknown): string {
  if (Array.isArray(v)) return v.map((x) => flattenMessage(x)).filter(Boolean).join(" ");
  if (v == null) return "";
  return String(v);
}

function getCookie(name: string): string | undefined {
  if (typeof document === "undefined") return undefined;
  const match = document.cookie.match(
    new RegExp("(?:^|; )" + name.replace(/[.*+?^${}()|[\]\\]/g, "\\$&") + "=([^;]*)"),
  );
  return match ? decodeURIComponent(match[1]) : undefined;
}

type ApiInit = Omit<RequestInit, "body"> & { body?: unknown };

export async function api<T = unknown>(path: string, init: ApiInit = {}): Promise<T> {
  const method = (init.method ?? "GET").toUpperCase();
  const headers = new Headers(init.headers);
  headers.set("Accept", "application/json");

  let body: BodyInit | null | undefined;
  if (init.body !== undefined) {
    if (init.body instanceof FormData) {
      body = init.body;
    } else {
      headers.set("Content-Type", "application/json");
      body = JSON.stringify(init.body);
    }
  }

  if (!["GET", "HEAD", "OPTIONS"].includes(method)) {
    const csrf = getCookie("csrftoken");
    if (csrf) headers.set("X-CSRFToken", csrf);
  }

  const res = await fetch(`${API_BASE}${path}`, {
    ...init,
    method,
    headers,
    body,
    credentials: "include",
  });

  const text = await res.text();
  const data = text ? safeJsonParse(text) : null;
  if (!res.ok) {
    throw new ApiError(res.status, data, `${method} ${path} -> ${res.status}`);
  }
  return data as T;
}

function safeJsonParse(text: string): unknown {
  try {
    return JSON.parse(text);
  } catch {
    return text;
  }
}

/** Call once on app load to seed the csrftoken cookie. */
export const fetchCsrf = () => api<{ csrfToken: string }>("/api/auth/csrf/");

// ----- typed endpoints -----

export type User = {
  id: number;
  username: string | null;
  email: string;
  first_name: string;
  last_name: string;
  avatar_url: string;
  bio: string;
  location: string;
  is_creator: boolean;
  email_verified: boolean;
};

export type RegisterResult = {
  email: string;
  email_verified: false;
  detail: string;
};

export type CreatorProfile = {
  niches: string[];
  theme: "clean" | "bold" | "warm" | "midnight" | "cover" | "indigo" | "honey" | "azure";
  is_public: boolean;
  rate_card: Record<string, unknown>;
  created_at: string;
  updated_at: string;
};

export type CustomLink = {
  id: number;
  title: string;
  url: string;
  icon: string;
  sort_order: number;
  created_at: string;
};

export type CustomLinkInput = {
  title: string;
  url: string;
  icon?: string;
  sort_order?: number;
};

export const auth = {
  register: (input: { email: string; password: string }) =>
    api<RegisterResult>("/api/auth/register/", { method: "POST", body: input }),
  login: (input: { email: string; password: string }) =>
    api<User>("/api/auth/login/", { method: "POST", body: input }),
  google: (credential: string) =>
    api<User>("/api/auth/google/", { method: "POST", body: { credential } }),
  logout: () => api<null>("/api/auth/logout/", { method: "POST" }),
  verifyEmail: (token: string) =>
    api<User>("/api/auth/verify-email/", { method: "POST", body: { token } }),
  resendVerification: (email: string) =>
    api<{ detail: string }>("/api/auth/resend-verification/", {
      method: "POST",
      body: { email },
    }),
  me: () => api<User>("/api/me/"),
  updateMe: (patch: Partial<Pick<User, "username" | "first_name" | "last_name" | "bio" | "location" | "avatar_url">>) =>
    api<User>("/api/me/", { method: "PUT", body: patch }),
  uploadAvatar: (file: File) => {
    const form = new FormData();
    form.append("file", file);
    return api<User>("/api/me/avatar/", { method: "POST", body: form });
  },
};

export const profile = {
  get: () => api<CreatorProfile>("/api/me/profile/"),
  update: (patch: Partial<CreatorProfile>) =>
    api<CreatorProfile>("/api/me/profile/", { method: "PUT", body: patch }),
  setTheme: (theme: CreatorProfile["theme"]) =>
    api<{ theme: CreatorProfile["theme"] }>("/api/me/theme/", {
      method: "PUT",
      body: { theme },
    }),
};

export const niches = {
  popular: () => api<{ niches: string[] }>("/api/niches/"),
};

export const links = {
  list: () => api<CustomLink[]>("/api/me/links/"),
  create: (input: CustomLinkInput) =>
    api<CustomLink>("/api/me/links/", { method: "POST", body: input }),
  update: (id: number, patch: Partial<CustomLinkInput>) =>
    api<CustomLink>(`/api/me/links/${id}/`, { method: "PUT", body: patch }),
  remove: (id: number) =>
    api<null>(`/api/me/links/${id}/`, { method: "DELETE" }),
  reorder: (ids: number[]) =>
    api<CustomLink[]>("/api/me/links/reorder/", { method: "PUT", body: { ids } }),
};

// ----- socials -----

export type SocialPlatform = "tiktok" | "instagram" | "youtube" | "facebook";

export type SocialAccount = {
  id: number;
  platform: SocialPlatform;
  handle: string;
  profile_url: string;
  followers: number;
  avg_views: number;
  engagement_rate: string;
};

export type SocialAccountInput = {
  platform: SocialPlatform;
  handle: string;
  profile_url: string;
  followers?: number;
  avg_views?: number;
  engagement_rate?: string;
};

export const socials = {
  list: () => api<SocialAccount[]>("/api/me/socials/"),
  create: (input: SocialAccountInput) =>
    api<SocialAccount>("/api/me/socials/", { method: "POST", body: input }),
  update: (id: number, patch: Partial<SocialAccountInput>) =>
    api<SocialAccount>(`/api/me/socials/${id}/`, { method: "PUT", body: patch }),
  remove: (id: number) =>
    api<null>(`/api/me/socials/${id}/`, { method: "DELETE" }),
  reorder: (ids: number[]) =>
    api<SocialAccount[]>("/api/me/socials/reorder/", { method: "PUT", body: { ids } }),
};

// ----- portfolio -----

export type MediaType = "video_embed" | "video_upload" | "image";

export type PortfolioItem = {
  id: number;
  title: string;
  description: string;
  media_type: MediaType;
  original_url: string;
  media_url: string;
  platform_source: SocialPlatform | "";
  embed_html: string;
  thumbnail_url: string;
  video_title: string;
  sort_order: number;
  created_at: string;
};

export type PortfolioItemInput = {
  title: string;
  description?: string;
  media_type: MediaType;
  original_url?: string;
  media_url?: string;
  sort_order?: number;
};

export const portfolio = {
  list: () => api<PortfolioItem[]>("/api/me/portfolio/"),
  create: (input: PortfolioItemInput) =>
    api<PortfolioItem>("/api/me/portfolio/", { method: "POST", body: input }),
  update: (id: number, patch: Partial<PortfolioItemInput>) =>
    api<PortfolioItem>(`/api/me/portfolio/${id}/`, { method: "PUT", body: patch }),
  remove: (id: number) =>
    api<null>(`/api/me/portfolio/${id}/`, { method: "DELETE" }),
  reorder: (ids: number[]) =>
    api<PortfolioItem[]>("/api/me/portfolio/reorder/", { method: "PUT", body: { ids } }),
};

// ----- embed preview (used by portfolio editor before saving) -----

export type EmbedPreview = {
  platform: SocialPlatform | null;
  original_url: string;
  thumbnail_url: string;
  video_title: string;
  embed_html: string;
};

export const embed = {
  preview: (url: string) =>
    api<EmbedPreview>("/api/embed/preview/", { method: "POST", body: { url } }),
};

// ----- public profile (no auth) -----

export type PublicSocialAccount = SocialAccount;
export type PublicPortfolioItem = PortfolioItem;

export type PublicCreator = {
  username: string;
  first_name: string;
  last_name: string;
  avatar_url: string;
  bio: string;
  location: string;
  niches: string[];
  theme: "clean" | "bold" | "warm" | "midnight" | "cover" | "indigo" | "honey" | "azure";
  rate_card: { deliverables?: Array<{ type: string; rate: string | number; notes?: string }> };
  custom_links: CustomLink[];
  socials: PublicSocialAccount[];
  portfolio: PublicPortfolioItem[];
};

/** Server-side fetcher for the public /@username page. */
export async function getPublicCreator(username: string): Promise<PublicCreator | null> {
  // Some Next.js versions hand us the raw, percent-encoded segment (e.g. `%40foo`),
  // others hand us the decoded value (`@foo`). Tolerate both, then drop the `@`.
  let slug = username;
  try {
    slug = decodeURIComponent(slug);
  } catch {
    // leave as-is if the value is not valid percent-encoding
  }
  slug = slug.replace(/^@/, "");
  const res = await fetch(`${API_BASE}/api/creators/${encodeURIComponent(slug)}/`, {
    cache: "no-store", // creators expect edits to appear immediately
    headers: { Accept: "application/json" },
  });
  if (res.status === 404) return null;
  if (!res.ok) throw new Error(`Failed to load creator: ${res.status}`);
  return res.json();
}

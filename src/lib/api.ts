
const API_BASE_URL = "https://calmcampus-5hry.onrender.com/api";
const INSTITUTION_KEY = "calmcampus_selected_institution_id";


type ApiOptions = Omit<RequestInit, "body"> & {
  body?: BodyInit | Record<string, unknown> | null;
};

let tokenExpiryCallback: (() => void) | null = null;

export function onTokenExpired(cb: () => void) {
  tokenExpiryCallback = cb;
}

export function clearTokenExpiredCallback() {
  tokenExpiryCallback = null;
}

export function getAccessTokenExpiry(): number | null {
  if (typeof window === "undefined") return null;
  const token = document.cookie
    .split("; ")
    .find((row) => row.startsWith("accessToken="))
    ?.split("=")[1];
  if (!token) return null;
  try {
    const payload = JSON.parse(atob(token.split(".")[1]));
    return payload.exp * 1000;
  } catch {
    return null;
  }
}

export function scheduleTokenWarning() {
  if (typeof window === "undefined") return;
  const expiry = getAccessTokenExpiry();
  if (!expiry) return;
  const warningTime = expiry - TOKEN_WARNING_MINUTES * 60 * 1000;
  const now = Date.now();
  if (warningTime <= now) {
    tokenExpiryCallback?.();
    return;
  }
  setTimeout(() => {
    tokenExpiryCallback?.();
  }, warningTime - now);
}

export async function apiRequest<T>(path: string, options: ApiOptions = {}): Promise<T> {
  const headers = new Headers(options.headers);
  const body =
    options.body && typeof options.body === "object" && !(options.body instanceof FormData)
      ? JSON.stringify(options.body)
      : options.body;

  if (body && typeof body === "string") {
    headers.set("Content-Type", "application/json");
  }

  const response = await fetch(`${API_BASE_URL}${path}`, {
    ...options,
    body,
    headers,
    credentials: "include",
  });

  if (response.status === 401 || response.status === 403) {
    tokenExpiryCallback?.();
    const text = await response.text();
    const data = text ? safeJsonParse(text) : null;
    const message =
      (typeof data?.message === "string" && data.message) ||
      (typeof data?.detail === "string" && data.detail) ||
      "Session expired";
    throw new Error(message);
  }

  const text = await response.text();
  const data = (text ? safeJsonParse(text) : null) as Record<string, unknown> | null;

  if (!response.ok) {
    const message =
      (typeof data?.message === "string" && data.message) ||
      (typeof data?.detail === "string" && data.detail) ||
      `Request failed with ${response.status}`;
    throw new Error(message);
  }

  return data as T;
}

function normalizeBaseUrl(baseUrl: string): string {
  return baseUrl.replace(/\/+$/, "");
}

function safeJsonParse(text: string): Record<string, unknown> | null {
  try {
    return JSON.parse(text) as Record<string, unknown>;
  } catch {
    return { message: text };
  }
}

export type UserSummary = {
  id: number;
  email: string;
  role: "student" | "counsellor" | "admin";
  institution?: number | null;
  institution_name?: string | null;
  institution_slug?: string | null;
  is_active?: boolean;
};

/** The shape returned by GET /api/authentication/ */
export type AuthUser = {
  email: string;
  role: "student" | "counsellor" | "admin";
  institution: { id: number; name: string; slug: string } | null;
};

export type Notification = {
  id: number;
  actor: UserSummary;
  verb: string;
  description: string;
  read: boolean;
  created_at: string;
};

export type Appointment = {
  id: number;
  student: UserSummary;
  counsellor: UserSummary;
  requested_by: UserSummary;
  requested_for: string;
  status: "requested" | "approved" | "rescheduled" | "cancelled";
  reason: string;
  counsellor_note: string;
};

export type Resource = {
  id: number;
  title: string;
  category: string;
  content: string;
  created_at: string;
};

export type CrisisAlert = {
  id: number;
  user: UserSummary;
  counsellor: UserSummary | null;
  trigger: string;
  source: string;
  status: string;
  notes: string;
  created_at: string;
  updated_at: string;
};

export type MoodEntry = {
  id: number;
  mood: string;
  intensity: number;
  description: string;
  created_at: string;
};

export type JournalEntry = {
  id: number | string;
  title: string;
  content: string;
  created_at: string;
  updated_at: string;
};

export type Institution = {
  id: number;
  name: string;
  slug: string;
  is_active: boolean;
};

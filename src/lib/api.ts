const API_BASE_URL = "https://calmcampus-5hry.onrender.com/api";
const INSTITUTION_KEY = "calmcampus_selected_institution_id";

type ApiOptions = Omit<RequestInit, "body"> & {
  body?: BodyInit | Record<string, unknown> | null;
};

export async function apiRequest<T>(path: string, options: ApiOptions = {}): Promise<T> {
  const headers = new Headers(options.headers);
  const selectedInstitutionId = getSelectedInstitutionId();
  const body =
    options.body && typeof options.body === "object" && !(options.body instanceof FormData)
      ? JSON.stringify(options.body)
      : options.body;

  if (selectedInstitutionId && !headers.has("X-Institution-ID")) {
    headers.set("X-Institution-ID", selectedInstitutionId);
  }

  if (body && typeof body === "string") {
    headers.set("Content-Type", "application/json");
  }

  const response = await fetch(`${API_BASE_URL}${path}`, {
    ...options,
    body,
    headers,
    credentials: "include",
  });

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

function safeJsonParse(text: string) {
  try {
    return JSON.parse(text) as unknown;
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

export function getSelectedInstitutionId() {
  if (typeof window === "undefined") {
    return null;
  }
  return window.localStorage.getItem(INSTITUTION_KEY);
}

export function setSelectedInstitutionId(institutionId: string | null) {
  if (typeof window === "undefined") {
    return;
  }
  if (institutionId) {
    window.localStorage.setItem(INSTITUTION_KEY, institutionId);
  } else {
    window.localStorage.removeItem(INSTITUTION_KEY);
  }
}

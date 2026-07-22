/**
 * lib/api.ts
 * ==========
 * Production-ready API client for the AI Career Co-Pilot frontend.
 *
 * Responsibilities:
 *  - Attaches the Supabase JWT to every request as `Authorization: Bearer <token>`
 *  - Handles 401 / network errors gracefully
 *  - Provides typed helpers for every FastAPI endpoint
 *  - Supports optional AbortController for cancellable fetches
 */

import { supabase } from "@/lib/supabase";

// ─── Base URL ────────────────────────────────────────────────────────────────
const API_BASE =
  process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000/api";

// ─── Types mirroring FastAPI Pydantic models ─────────────────────────────────

export interface JobMatch {
  id: string;
  title: string;
  company: string;
  location: string;
  description: string;
  skills: string[];
  salary_range: string | null;
  similarity_score: number;
}

export interface DiffItem {
  original: string;
  tailored: string;
  reason: string;
}

export interface DossierData {
  job_id: string;
  job_title: string;
  job_company: string;
  ats_score: number;
  warning: string;
  tailored_diff: DiffItem[];
  interview_questions: string[];
  can_qualify: boolean;
  missing_skills: string[];
  qualification_feedback: string;
  study_resources: string[];
}

export interface TrendSkill {
  skill_name: string;
  frequency: number;
}

export interface PeerInsight {
  friend_name: string;
  company: string;
  job_title: string;
  job_id: string;
  message: string;
}

export interface DashboardInsights {
  status: string;
  trending_skills: TrendSkill[];
  peer_insights: PeerInsight[];
}

export interface UserProfileUpdate {
  ultimate_goal?: string;
  education?: string;
  location?: string;
  skills?: string[];
  permission_to_generate_resume?: boolean;
}

// ─── Core fetch helper ───────────────────────────────────────────────────────

async function getAuthToken(): Promise<string | null> {
  try {
    const {
      data: { session },
    } = await supabase.auth.getSession();
    return session?.access_token ?? null;
  } catch {
    return null;
  }
}

async function apiFetch<T>(
  path: string,
  options: RequestInit & { signal?: AbortSignal } = {}
): Promise<T> {
  const token = await getAuthToken();

  const headers: Record<string, string> = {
    ...(options.headers as Record<string, string>),
  };

  // Only set Content-Type for JSON bodies (skip for FormData)
  if (!(options.body instanceof FormData)) {
    headers["Content-Type"] = "application/json";
  }

  if (token) {
    headers["Authorization"] = `Bearer ${token}`;
  }

  const response = await fetch(`${API_BASE}${path}`, {
    ...options,
    headers,
  });

  if (response.status === 401) {
    // Token expired – sign the user out gracefully
    await supabase.auth.signOut();
    window.location.href = "/";
    throw new Error("Session expired. Please sign in again.");
  }

  if (!response.ok) {
    const errorBody = await response.text();
    throw new Error(
      `API error ${response.status} on ${path}: ${errorBody}`
    );
  }

  return response.json() as Promise<T>;
}

// ─── Endpoint helpers ─────────────────────────────────────────────────────────

/**
 * POST /api/jobs/search
 * Semantic vector search. Requires auth JWT.
 */
export async function searchJobs(
  query: string,
  topK = 10,
  matchThreshold = 0.3,
  signal?: AbortSignal
): Promise<{ status: string; source: string; results: JobMatch[] }> {
  return apiFetch("/jobs/search", {
    method: "POST",
    body: JSON.stringify({ query, top_k: topK, match_threshold: matchThreshold }),
    signal,
  });
}

/**
 * GET /api/jobs/{job_id}/dossier
 * Full AI dossier for a specific job. Cached on the server side.
 */
export async function getJobDossier(
  jobId: string,
  signal?: AbortSignal
): Promise<{ status: string; source: string; data: DossierData }> {
  return apiFetch(`/jobs/${jobId}/dossier`, { signal });
}

/**
 * GET /api/dashboard/insights
 * Trending skills + peer network insights.
 */
export async function getDashboardInsights(
  signal?: AbortSignal
): Promise<DashboardInsights> {
  return apiFetch("/dashboard/insights", { signal });
}

/**
 * POST /api/resume/upload-resume (via /api/user/upload-resume)
 * Multipart PDF upload. Never manually set Content-Type for FormData.
 */
export async function uploadResume(
  file: File,
  signal?: AbortSignal
): Promise<{ status: string; user_id: string; message: string }> {
  const form = new FormData();
  form.append("file", file);
  return apiFetch("/user/upload-resume", {
    method: "POST",
    body: form,
    signal,
  });
}

/**
 * POST /api/user/update-goal
 * Update user profile (goal, education, skills, etc.).
 */
export async function updateUserProfile(
  data: UserProfileUpdate,
  signal?: AbortSignal
): Promise<{ status: string; user_id: string; updated_profile: UserProfileUpdate }> {
  return apiFetch("/user/update-goal", {
    method: "POST",
    body: JSON.stringify(data),
    signal,
  });
}

/**
 * POST /api/resume/generate-pdf
 * Generate a downloadable ATS PDF from tailored bullet points.
 */
export async function generatePdf(
  bullets: string[],
  userName: string,
  ultimateGoal?: string,
  skills?: string[],
  signal?: AbortSignal
): Promise<{ status: string; pdf_url: string; size_bytes: number }> {
  return apiFetch("/resume/generate-pdf", {
    method: "POST",
    body: JSON.stringify({
      bullets,
      user_name: userName,
      ultimate_goal: ultimateGoal,
      skills,
    }),
    signal,
  });
}

/**
 * POST /api/admin/midnight-refresh
 * Trigger the nightly scraper + trend refresh (admin only).
 */
export async function triggerMidnightRefresh(
  signal?: AbortSignal
): Promise<{ status: string; jobs_cleared: number; scraped_count: number }> {
  return apiFetch("/admin/midnight-refresh", { method: "POST", signal });
}

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
export type TrendSkillItem = TrendSkill;

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
  name?: string;
  phone_number?: string;
}

// ─── Core fetch helper ───────────────────────────────────────────────────────

async function getAuthToken(): Promise<string | null> {
  try {
    if (typeof window !== "undefined") {
      const storedToken = localStorage.getItem("vtp_access_token");
      if (storedToken) return storedToken;
    }
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
): Promise<{ status: string; user_id: string; pdf_url: string; message: string }> {
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

// ─── Resume Intelligence Endpoints ───────────────────────────────────────────

export interface ParsedEducation {
  degree: string;
  institution: string;
  year: string;
  gpa: string;
}

export interface ParsedExperience {
  title: string;
  company: string;
  duration: string;
  bullets: string[];
}

export interface ParsedProject {
  name: string;
  tech: string[];
  description: string;
}

export interface ResumeDetails {
  name?: string;
  email?: string;
  phone?: string;
  summary?: string;
  skills?: string[];
  education?: ParsedEducation[];
  experience?: ParsedExperience[];
  projects?: ParsedProject[];
  certifications?: string[];
  location?: string;
}

export interface AnalyzeResumeResponse {
  status: string;
  user_id: string;
  resume_details: ResumeDetails;
  original_pdf_url: string;
  ats_pdf_url: string;
  raw_text_preview: string;
  embedding_dimensions: number;
  message: string;
}

export interface ResumeDetailsResponse {
  status: string;
  user_id: string;
  name: string | null;
  phone_number: string | null;
  resume_details: ResumeDetails;
  raw_resume_text: string;
  resume_pdf_url: string | null;
  ats_pdf_url: string | null;
  skills: string[];
  ultimate_goal: string | null;
  location: string | null;
  education: string | null;
}

export interface ScrapedJob {
  id: string;
  title: string;
  company: string;
  location: string;
  description: string;
  skills: string[];
  salary_range: string | null;
  similarity_score: number;
  toxic_score: number;
  is_scam: boolean;
  source: string;
}

/**
 * POST /api/user/analyze-resume
 * Full resume intelligence pipeline: parse → LLM extract → embed → store → ATS PDF.
 * Called immediately after the user's upload scan animation completes.
 */
export async function analyzeResume(
  file: File,
  signal?: AbortSignal
): Promise<AnalyzeResumeResponse> {
  const form = new FormData();
  form.append("file", file);
  return apiFetch("/user/analyze-resume", {
    method: "POST",
    body: form,
    signal,
  });
}

/**
 * GET /api/user/resume-details
 * Returns stored structured resume details for the resume detail page.
 */
export async function getResumeDetails(
  signal?: AbortSignal
): Promise<ResumeDetailsResponse> {
  return apiFetch("/user/resume-details", { signal });
}

/**
 * GET /api/jobs/my-jobs
 * Returns scraped jobs personalised to the current user via resume embedding similarity.
 */
export async function getMyJobs(
  limit = 20,
  signal?: AbortSignal
): Promise<{ status: string; user_id: string; count: number; jobs: ScrapedJob[] }> {
  return apiFetch(`/jobs/my-jobs?limit=${limit}`, { signal });
}

export interface RoadmapRequiredSkill {
  name: string;
  progress: number;
}

export interface RoadmapLearningItem {
  title: string;
  desc: string;
  duration: string;
  completed: boolean;
}

export interface RoadmapWeeklyPlanItem {
  week: string;
  tasks: string[];
}

export interface SkillRoadmapData {
  estimatedTime: string;
  requiredSkills: RoadmapRequiredSkill[];
  learningRoadmap: RoadmapLearningItem[];
  weeklyPlan: RoadmapWeeklyPlanItem[];
}

export interface SkillRoadmapResponse {
  status: string;
  agent: string;
  data: SkillRoadmapData;
}

/**
 * POST /api/agents/trajectory/roadmap
 * Generates a career roadmap / skill mastery plan for a target technology.
 */
export async function getSkillRoadmap(
  targetSkill: string,
  userSkills: string[],
  signal?: AbortSignal
): Promise<SkillRoadmapResponse> {
  return apiFetch("/agents/trajectory/roadmap", {
    method: "POST",
    body: JSON.stringify({
      target_skill: targetSkill,
      user_skills: userSkills,
    }),
    signal,
  });
}

/**
 * POST /api/agents/scrape
 * Triggers parallel job scraping and LLM enrichment.
 */
export async function triggerJobScrape(
  signal?: AbortSignal
): Promise<{ status: string; agent: string; scraped_count?: number; message?: string }> {
  return apiFetch("/agents/scrape", {
    method: "POST",
    signal,
  });
}




/**
 * GET /api/jobs/anti-jobs
 * Returns anti-matching jobs (role mismatch, low fit scores).
 */
export async function getAntiJobs(
  limit = 3,
  signal?: AbortSignal
): Promise<{ status: string; jobs: any[] }> {
  return apiFetch(`/jobs/anti-jobs?limit=${limit}`, { signal });
}


// ─── Default Export for Axios-like backwards compatibility ──────────────────
const api = {
  get: async <T = any>(path: string, config?: { signal?: AbortSignal; params?: any }): Promise<{ data: T }> => {
    // Append query params if present
    let finalPath = path;
    if (config?.params) {
      const urlParams = new URLSearchParams(config.params);
      finalPath = `${path}?${urlParams.toString()}`;
    }
    const res = await apiFetch<T>(finalPath, { method: "GET", signal: config?.signal });
    return { data: res };
  },
  post: async <T = any>(path: string, body?: any, config?: { signal?: AbortSignal; params?: any; headers?: any }): Promise<{ data: T }> => {
    // Append query params if present
    let finalPath = path;
    if (config?.params) {
      const urlParams = new URLSearchParams(config.params);
      finalPath = `${path}?${urlParams.toString()}`;
    }
    const res = await apiFetch<T>(finalPath, {
      method: "POST",
      body: body instanceof FormData ? body : JSON.stringify(body),
      headers: config?.headers,
      signal: config?.signal,
    });
    return { data: res };
  },
};

export default api;

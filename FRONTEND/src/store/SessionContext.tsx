"use client";

/**
 * store/SessionContext.tsx
 * ========================
 * Global session store.
 *
 * - Profile data comes from Supabase Auth + /api/user/update-goal
 * - Jobs come from /api/jobs/search (SearchBar → dashboard)
 * - Dashboard insights come from /api/dashboard/insights
 * - Preserves legacy structures (antiJobs, goalData, analyzeGoal) for backwards compatibility
 */

import React, { createContext, useContext, useState, useEffect, useCallback } from "react";
import { supabase } from "@/lib/supabase";
import {
  getDashboardInsights,
  getResumeDetails,
  getMyJobs,
  getSkillRoadmap,
  triggerJobScrape,
  type JobMatch,
  type TrendSkillItem,
  type PeerInsight,
  type ScrapedJob
} from "@/lib/api";
import { toast } from "sonner";


// ─── Types ────────────────────────────────────────────────────────────────────

export interface Profile {
  id: string;
  fullName: string;
  email: string;
  phone: string;
  college: string;
  department: string;
  degree: string;
  graduationYear: string;
  cgpa: string;
  currentEducation: string;
  skills: string[];
  githubUrl: string;
  linkedinUrl: string;
  portfolioUrl: string;
  preferredDomain: string;
  preferredJobLocation: string;
  profilePic: string;
  ultimateGoal: string;
  education: string;
  location: string;
  hasResume: boolean;
  parsedResume?: any;
}

export interface Notification {
  id: string;
  title: string;
  description: string;
  time: string;
  unread: boolean;
}

// ─── Legacy Interfaces for Backwards Compatibility ──────────────────────────
export interface Job {
  id: string;
  companyName: string;
  companyLogo: string;
  role: string;
  salary: string;
  experience: string;
  location: string;
  postedTime: string;
  matchScore: number;
  matchingSkills: string[];
  missingSkills: string[];
  description: string;
  source?: string;
}


export interface AntiJob {
  id: string;
  companyName: string;
  role: string;
  matchScore: number;
  reason: string;
  missingSkills: string[];
  suggestions: string[];
}

export interface TrendingSkill {
  name: string;
  popularity: number;
  growth: number;
  isUp: boolean;
  category: "AI" | "Backend" | "Frontend" | "Cloud" | "Data";
}

export interface GoalPlannerData {
  targetSkill: string;
  analyzed: boolean;
  estimatedTime: string;
  requiredSkills: { name: string; progress: number }[];
  learningRoadmap: { title: string; desc: string; duration: string; completed: boolean }[];
  weeklyPlan: { week: string; tasks: string[] }[];
}

interface SessionContextType {
  // Auth
  userId: string | null;
  isAuthenticated: boolean;
  login: (token: string, userId: string) => void;
  logout: () => void;

  // Profile
  profile: Profile;
  updateProfile: (updates: Partial<Profile>) => void;
  addSkill: (skill: string) => void;
  removeSkill: (skill: string) => void;

  // Resume upload state
  uploadedFile: { name: string; size: string } | null;
  setUploadedFile: (file: { name: string; size: string } | null) => void;
  uploadProgress: number;
  setUploadProgress: (p: number) => void;
  resumeScore: number;
  setResumeScore: (s: number) => void;

  // App flow
  status: "landing" | "login" | "onboarding" | "upload" | "scanning" | "analysis" | "dashboard";
  setStatus: (s: SessionContextType["status"]) => void;

  // UI
  theme: "light" | "dark";
  toggleTheme: () => void;
  sidebarCollapsed: boolean;
  setSidebarCollapsed: (c: boolean) => void;
  activeTab: string;
  setActiveTab: (t: string) => void;

  // Notifications
  notifications: Notification[];
  markNotificationRead: (id: string) => void;
  clearNotifications: () => void;

  // Live data from API
  jobs: Job[];
  setJobs: (jobs: Job[]) => void;
  trendingSkills: TrendingSkill[];
  peerInsights: PeerInsight[];
  insightsLoading: boolean;
  refreshInsights: () => Promise<void>;

  // Legacy variables needed by legacy pages (like dashboard/page.tsx)
  antiJobs: AntiJob[];
  goalData: GoalPlannerData | null;
  analyzeGoal: (targetSkill: string) => void;
}

// ─── Defaults ─────────────────────────────────────────────────────────────────

const emptyProfile: Profile = {
  id: "",
  fullName: "Lalith Kumar",
  email: "lalith.kumar@nit.edu",
  phone: "+91 98765 43210",
  college: "National Institute of Technology (NIT)",
  department: "Computer Science & Engineering",
  degree: "B.Tech",
  graduationYear: "2026",
  cgpa: "9.1",
  currentEducation: "Final Year (B.Tech)",
  skills: ["React", "Next.js", "TypeScript", "Node.js", "Python", "FastAPI", "Git"],
  githubUrl: "https://github.com/lalithkumar",
  linkedinUrl: "https://linkedin.com/in/lalithkumar",
  portfolioUrl: "https://lalithkumar.dev",
  preferredDomain: "Full Stack Development",
  preferredJobLocation: "Bangalore, India",
  profilePic: "https://images.unsplash.com/photo-1534528741775-53994a69daeb?q=80&w=256&h=256&fit=crop",
  ultimateGoal: "Senior Full Stack Engineer",
  education: "B.Tech",
  location: "Bangalore, India",
  hasResume: false,
  parsedResume: {},
};

const initialAntiJobs: AntiJob[] = [
  {
    id: "anti-1",
    companyName: "Avanse Tech",
    role: "DevOps & Platform Engineer",
    matchScore: 42,
    reason: "Severe skill mismatch in infrastructure management, orchestration engines, and public cloud deployment services.",
    missingSkills: ["Docker", "Kubernetes", "AWS", "Terraform", "CI/CD Pipeline"],
    suggestions: ["Learn Docker basics and create simple containerized apps.", "Take an AWS practitioner certification course.", "Build a automated Github Actions CI/CD deployment script."]
  },
  {
    id: "anti-2",
    companyName: "Turing Analytics",
    role: "Senior Data Scientist (Deep Learning)",
    matchScore: 35,
    reason: "Requires deep neural networks research, mathematical modelling, and extensive production PyTorch training experience.",
    missingSkills: ["PyTorch", "TensorFlow", "Pandas", "Scikit-Learn", "Machine Learning"],
    suggestions: ["Complete a comprehensive Python for Data Analysis course.", "Study Linear Algebra and Statistics fundamentals.", "Train basic ML models on Kaggle notebooks."]
  }
];

// ─── Context ──────────────────────────────────────────────────────────────────

const SessionContext = createContext<SessionContextType | undefined>(undefined);

export const SessionProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  // Auth
  const [userId, setUserId] = useState<string | null>(null);
  const [isAuthenticated, setIsAuthenticated] = useState(false);

  // Profile
  const [profile, setProfile] = useState<Profile>(emptyProfile);

  // Resume
  const [uploadedFile,   setUploadedFileState] = useState<{ name: string; size: string } | null>(null);
  const [uploadProgress, setUploadProgress]    = useState(0);
  const [resumeScore,    setResumeScore]        = useState(0);

  // Flow
  const [status, setStatus] = useState<SessionContextType["status"]>("landing");

  // UI
  const [theme,            setTheme]            = useState<"light" | "dark">("dark");
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const [activeTab,        setActiveTab]        = useState("dashboard");

  // Notifications
  const [notifications, setNotifications] = useState<Notification[]>([]);

  // Live API data
  const [jobs,            setJobs]            = useState<Job[]>([]);
  const [trendingSkills,  setTrendingSkills]   = useState<TrendingSkill[]>([]);
  const [peerInsights,    setPeerInsights]     = useState<PeerInsight[]>([]);
  const [insightsLoading, setInsightsLoading]  = useState(false);

  // Legacy State variables
  const [antiJobs,        setAntiJobs]        = useState<AntiJob[]>(initialAntiJobs);
  const [goalData,        setGoalData]        = useState<GoalPlannerData | null>(null);

  // ── Sync theme with <html> class ──────────────────────────────────────────
  useEffect(() => {
    if (typeof window === "undefined") return;
    document.documentElement.classList.toggle("dark", theme === "dark");
  }, [theme]);

  // ── Supabase auth listener ─────────────────────────────────────────────────
  useEffect(() => {
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      (_event, session) => {
        if (session?.user) {
          setUserId(session.user.id);
          setIsAuthenticated(true);
          setProfile((prev) => ({
            ...prev,
            id:    session.user.id,
            email: session.user.email || "",
          }));
        } else {
          setUserId(null);
          setIsAuthenticated(false);
          setProfile(emptyProfile);
        }
      }
    );
    return () => subscription.unsubscribe();
  }, []);

  // ── Dashboard insights ─────────────────────────────────────────────────────
  const refreshInsights = useCallback(async () => {
    if (!isAuthenticated) return;
    setInsightsLoading(true);
    try {
      // 1. Trigger background job scraping immediately (non-blocking call to agents route)
      triggerJobScrape().catch(err => console.warn("Background job scrape trigger failed:", err));

      // 2. Fetch profile details, trends, and matched jobs concurrently to reduce roundtrips
      const [detailsRes, insightsRes, jobsRes] = await Promise.all([
        getResumeDetails().catch(err => { console.warn("Profile fetch failed:", err); return null; }),
        getDashboardInsights().catch(err => { console.warn("Insights fetch failed:", err); return null; }),
        getMyJobs().catch(err => { console.warn("Personalised jobs fetch failed:", err); return null; })
      ]);

      let userSkills: string[] = [];

      // 1. Process Profile & Resume details
      if (detailsRes) {
        const details = detailsRes.resume_details || {};
        userSkills = detailsRes.skills || [];
        const eduEntry = (details.education && details.education.length > 0) ? details.education[0] : {};
        
        setProfile((prev) => ({
          ...prev,
          fullName: details.name || prev.fullName,
          email: detailsRes.email || details.email || prev.email,
          phone: details.phone || prev.phone,
          skills: userSkills.length ? userSkills : prev.skills,
          ultimateGoal: detailsRes.ultimate_goal || prev.ultimateGoal,
          location: detailsRes.location || prev.location,
          education: detailsRes.education || prev.education,
          hasResume: !!detailsRes.resume_pdf_url,
          college: eduEntry.institution || prev.college,
          degree: eduEntry.degree || prev.degree,
          cgpa: eduEntry.gpa || prev.cgpa,
          parsedResume: details,
        }));
        if (detailsRes.resume_pdf_url) {
          setResumeScore(84);
        }
      }

      // 2. Process Trend insights & Peer matching
      if (insightsRes) {
        const mappedTrends = (insightsRes.trending_skills || []).map(skill => {
          const name = skill.skill_name;
          const lowerName = name.toLowerCase();
          const category = lowerName.includes("react") || lowerName.includes("next") || lowerName.includes("typescript") || lowerName.includes("frontend") || lowerName.includes("tailwind") ? "Frontend"
                         : lowerName.includes("python") || lowerName.includes("fastapi") || lowerName.includes("node") || lowerName.includes("backend") ? "Backend"
                         : lowerName.includes("aws") || lowerName.includes("docker") || lowerName.includes("kubernetes") || lowerName.includes("cloud") ? "Cloud"
                         : lowerName.includes("ai") || lowerName.includes("langgraph") || lowerName.includes("crewai") || lowerName.includes("mcp") || lowerName.includes("learning") ? "AI"
                         : "Data";
          return {
            name,
            popularity: skill.frequency,
            growth: 15 + (skill.frequency % 10) * 8,
            isUp: true,
            category
          } as TrendingSkill;
        });
        setTrendingSkills(mappedTrends);
        setPeerInsights(insightsRes.peer_insights || []);
      }

      // 3. Process matched jobs
      // NOTE: use userSkills from this invocation's detailsRes — NOT profile.skills
      // (reading profile.skills here would create a stale-closure / dep-loop issue)
      if (jobsRes) {
        const skillsPool = userSkills;
        const mappedJobs = (jobsRes.jobs || []).map((match) => {
          const userSkillsSet = new Set(skillsPool.map((s) => s.toLowerCase().trim()));
          const matchingSkills: string[] = [];
          const missingSkills: string[] = [];

          match.skills.forEach((skill) => {
            const trimmed = skill.trim();
            if (userSkillsSet.has(trimmed.toLowerCase())) {
              matchingSkills.push(trimmed);
            } else {
              missingSkills.push(trimmed);
            }
          });

          const matchScore = match.similarity_score >= 1
            ? Math.round(match.similarity_score)
            : Math.round(match.similarity_score * 100);

          return {
            id: match.id,
            companyName: match.company,
            companyLogo: match.company.toLowerCase().includes("stripe") ? "💳"
                         : match.company.toLowerCase().includes("vercel") ? "▲"
                         : match.company.toLowerCase().includes("linear") ? "📐"
                         : match.company.toLowerCase().includes("perplexity") ? "🌐"
                         : match.company.toLowerCase().includes("razorpay") ? "💳"
                         : "💼",
            role: match.title,
            salary: match.salary_range || "₹12,00,000 - ₹18,00,000",
            experience: "0 - 2 years",
            location: match.location || "Remote",
            postedTime: "1 day ago",
            matchScore: matchScore || 75,
            matchingSkills,
            missingSkills,
            description: match.description,
            source: match.source,
          } as Job;
        });
        setJobs(mappedJobs);
      }


      // 4. Silent delayed refresh: Query jobs again after 5 seconds to load newly scraped jobs
      setTimeout(async () => {
        try {
          const freshJobsRes = await getMyJobs();
          if (freshJobsRes && freshJobsRes.jobs) {
            const skillsPool = userSkills.length ? userSkills : profile.skills;
            const mappedJobs = (freshJobsRes.jobs || []).map((match) => {
              const userSkillsSet = new Set(skillsPool.map((s) => s.toLowerCase().trim()));
              const matchingSkills: string[] = [];
              const missingSkills: string[] = [];
              match.skills.forEach((skill) => {
                const trimmed = skill.trim();
                if (userSkillsSet.has(trimmed.toLowerCase())) {
                  matchingSkills.push(trimmed);
                } else {
                  missingSkills.push(trimmed);
                }
              });
              const matchScore = match.similarity_score >= 1
                ? Math.round(match.similarity_score)
                : Math.round(match.similarity_score * 100);
              return {
                id: match.id,
                companyName: match.company,
                companyLogo: match.company.toLowerCase().includes("stripe") ? "💳"
                             : match.company.toLowerCase().includes("vercel") ? "▲"
                             : match.company.toLowerCase().includes("linear") ? "📐"
                             : match.company.toLowerCase().includes("perplexity") ? "🌐"
                             : match.company.toLowerCase().includes("razorpay") ? "💳"
                             : "💼",
                role: match.title,
                salary: match.salary_range || "₹12,00,000 - ₹18,00,000",
                experience: "0 - 2 years",
                location: match.location || "Remote",
                postedTime: "Just now",
                matchScore: matchScore || 75,
                matchingSkills,
                missingSkills,
                description: match.description,
                source: match.source,
              } as Job;
            });
            setJobs(mappedJobs);
            console.log("🔄 Silent refresh: Updated job list with fresh scraped jobs.");
          }
        } catch (pollErr) {
          console.warn("Silent job refresh failed:", pollErr);
        }
      }, 5000);

    } catch (err) {
      console.warn("Dashboard insights fetch failed:", err);
    } finally {
      setInsightsLoading(false);
    }
  // ✅ ONLY depend on isAuthenticated — NOT profile.skills.
  // profile.skills is set inside this callback via setProfile(), so including it
  // here would create an infinite loop: fetch → setProfile → new skills ref →
  // new refreshInsights → useEffect fires → fetch again → repeat.
  }, [isAuthenticated]);


  // Guard: only run once per auth session, not on every render
  const hasFetchedRef = React.useRef(false);
  useEffect(() => {
    if (isAuthenticated && !hasFetchedRef.current) {
      hasFetchedRef.current = true;
      refreshInsights();
    }
    if (!isAuthenticated) {
      hasFetchedRef.current = false;
    }
  }, [isAuthenticated, refreshInsights]);


  // ── Profile helpers ────────────────────────────────────────────────────────
  const updateProfile = (updates: Partial<Profile>) =>
    setProfile((prev) => ({ ...prev, ...updates }));

  const addSkill = (skill: string) => {
    if (!profile.skills.includes(skill)) {
      updateProfile({ skills: [...profile.skills, skill] });
    }
  };

  const removeSkill = (skill: string) =>
    updateProfile({ skills: profile.skills.filter((s) => s !== skill) });

  const setUploadedFile = (file: { name: string; size: string } | null) => {
    setUploadedFileState(file);
    if (file) setResumeScore(84);
  };

  // ── Theme helper ───────────────────────────────────────────────────────────
  const toggleTheme = () =>
    setTheme((prev) => (prev === "light" ? "dark" : "light"));

  // ── Notification helpers ───────────────────────────────────────────────────
  const markNotificationRead = (id: string) =>
    setNotifications((prev) =>
      prev.map((n) => (n.id === id ? { ...n, unread: false } : n))
    );
  const clearNotifications = () => setNotifications([]);

  // ── Legacy Goal Planner analyzeGoal implementation ───────────────────────
  // ── Standalone Skill Mastery Roadmap / Goal Planner ────────────────────────
  const analyzeGoal = async (targetSkill: string) => {
    if (!targetSkill || !targetSkill.trim()) return;
    
    const toastId = toast.loading(`Analyzing roadmap for "${targetSkill}" using trajectory agent...`);
    try {
      const response = await getSkillRoadmap(targetSkill.trim(), profile.skills || []);
      if (response && response.status === "success" && response.data) {
        setGoalData({
          targetSkill,
          analyzed: true,
          estimatedTime: response.data.estimatedTime,
          requiredSkills: response.data.requiredSkills,
          learningRoadmap: response.data.learningRoadmap,
          weeklyPlan: response.data.weeklyPlan,
        });
        toast.success(`Roadmap compiled for ${targetSkill}!`, { id: toastId });
      } else {
        throw new Error("Invalid response from trajectory agent");
      }
    } catch (err: any) {
      console.error("Roadmap generation failed:", err);
      toast.error(`Roadmap generation failed: ${err.message || err}`, { id: toastId });
    }
  };


  // Hydrate auth state from localStorage on mount
  useEffect(() => {
    if (typeof window !== "undefined") {
      const storedToken = localStorage.getItem("vtp_access_token");
      const storedUserId = localStorage.getItem("vtp_user_id");
      if (storedToken && storedUserId) {
        setUserId(storedUserId);
        setIsAuthenticated(true);
        updateProfile({ id: storedUserId });
      }
    }
  }, []);

  const login = (token: string, uId: string) => {
    setUserId(uId);
    setIsAuthenticated(true);
    if (typeof window !== "undefined") {
      localStorage.setItem("vtp_access_token", token);
      localStorage.setItem("vtp_user_id", uId);
    }
    updateProfile({ id: uId });
  };

  const logout = () => {
    setUserId(null);
    setIsAuthenticated(false);
    if (typeof window !== "undefined") {
      localStorage.removeItem("vtp_access_token");
      localStorage.removeItem("vtp_user_id");
    }
    supabase.auth.signOut();
  };

  return (
    <SessionContext.Provider
      value={{
        userId,
        isAuthenticated,
        login,
        logout,

        profile,
        updateProfile,
        addSkill,
        removeSkill,

        uploadedFile,
        setUploadedFile,
        uploadProgress,
        setUploadProgress,
        resumeScore,
        setResumeScore,

        status,
        setStatus,

        theme,
        toggleTheme,
        sidebarCollapsed,
        setSidebarCollapsed,
        activeTab,
        setActiveTab,

        notifications,
        markNotificationRead,
        clearNotifications,

        jobs,
        setJobs,
        trendingSkills,
        peerInsights,
        insightsLoading,
        refreshInsights,

        // Legacy members passed down
        antiJobs,
        goalData,
        analyzeGoal
      }}
    >
      {children}
    </SessionContext.Provider>
  );
};

export const useSession = (): SessionContextType => {
  const ctx = useContext(SessionContext);
  if (!ctx) throw new Error("useSession must be used within a <SessionProvider>");
  return ctx;
};

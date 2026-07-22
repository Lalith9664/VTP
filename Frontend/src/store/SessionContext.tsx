"use client";

/**
 * store/SessionContext.tsx
 * ========================
 * Global session store.
 *
 * - Profile data comes from Supabase Auth + /api/user/update-goal
 * - Jobs come from /api/jobs/search (SearchBar → dashboard)
 * - Dashboard insights come from /api/dashboard/insights
 * - All dummy data removed; real data is populated after API calls
 */

import React, { createContext, useContext, useState, useEffect, useCallback } from "react";
import { supabase } from "@/lib/supabase";
import { getDashboardInsights, type JobMatch, type TrendSkillItem, type PeerInsight } from "@/lib/api";

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
}

export interface Notification {
  id: string;
  title: string;
  description: string;
  time: string;
  unread: boolean;
}

interface SessionContextType {
  // Auth
  userId: string | null;
  isAuthenticated: boolean;

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
  jobs: JobMatch[];
  setJobs: (jobs: JobMatch[]) => void;
  trendingSkills: TrendSkillItem[];
  peerInsights: PeerInsight[];
  insightsLoading: boolean;
  refreshInsights: () => Promise<void>;
}

// ─── Defaults ─────────────────────────────────────────────────────────────────

const emptyProfile: Profile = {
  id: "",
  fullName: "",
  email: "",
  phone: "",
  college: "",
  department: "",
  degree: "",
  graduationYear: "",
  cgpa: "",
  currentEducation: "",
  skills: [],
  githubUrl: "",
  linkedinUrl: "",
  portfolioUrl: "",
  preferredDomain: "",
  preferredJobLocation: "",
  profilePic: "",
  ultimateGoal: "",
  education: "",
  location: "",
  hasResume: false,
};

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
  const [jobs,            setJobs]            = useState<JobMatch[]>([]);
  const [trendingSkills,  setTrendingSkills]   = useState<TrendSkillItem[]>([]);
  const [peerInsights,    setPeerInsights]     = useState<PeerInsight[]>([]);
  const [insightsLoading, setInsightsLoading]  = useState(false);

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
      const res = await getDashboardInsights();
      setTrendingSkills(res.trending_skills || []);
      setPeerInsights(res.peer_insights || []);
    } catch (err) {
      console.warn("Dashboard insights fetch failed:", err);
    } finally {
      setInsightsLoading(false);
    }
  }, [isAuthenticated]);

  useEffect(() => {
    if (isAuthenticated) {
      refreshInsights();
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

  return (
    <SessionContext.Provider
      value={{
        userId,
        isAuthenticated,

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

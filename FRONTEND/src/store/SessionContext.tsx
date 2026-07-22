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
      const res = await getDashboardInsights();
      const mappedTrends = (res.trending_skills || []).map(skill => {
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

  // ── Legacy Goal Planner analyzeGoal implementation ───────────────────────
  const analyzeGoal = (targetSkill: string) => {
    const isMl = targetSkill.toLowerCase().includes("machine") || targetSkill.toLowerCase().includes("ml") || targetSkill.toLowerCase().includes("ai") || targetSkill.toLowerCase().includes("python") || targetSkill.toLowerCase().includes("data");
    const isDevOps = targetSkill.toLowerCase().includes("docker") || targetSkill.toLowerCase().includes("devops") || targetSkill.toLowerCase().includes("kubernetes") || targetSkill.toLowerCase().includes("aws") || targetSkill.toLowerCase().includes("cloud");
    
    let requiredSkills = [
      { name: "HTML5 & CSS Layouts", progress: 95 },
      { name: "JavaScript / TypeScript ES6", progress: 90 },
      { name: "React State & Props", progress: 65 },
      { name: "Next.js Framework Concepts", progress: 40 },
      { name: "Tailwind UI & Styling", progress: 50 }
    ];

    let learningRoadmap = [
      { title: "Master Modern React Fundamentals", desc: "Understand hooks life cycles, custom state management, performance optimization, and context patterns.", duration: "2 weeks", completed: false },
      { title: "Deep Dive into Next.js App Router", desc: "Learn file-based routing, Server Components, layout nesting, Suspense loading boundaries, and fetching architectures.", duration: "2 weeks", completed: false },
      { title: "State Control & API Integrations", desc: "Configure Axios hooks, integrate API context management, and build robust error triggers.", duration: "2 weeks", completed: false },
      { title: "Interactive Deployments", desc: "Compile production bundles, configure Vercel hostings, and complete responsive UI components.", duration: "2 weeks", completed: false }
    ];

    let weeklyPlan = [
      { week: "Week 1: Advanced React Life Cycles", tasks: ["Build a reusable context state controller", "Create custom state validation hooks", "Refactor standard inputs to use optimized debounce handlers"] },
      { week: "Week 2: Next.js Architecture", tasks: ["Set up Next.js app with responsive route patterns", "Configure nested layouts with loading and error boundaries", "Verify Static vs Server-side fetching configurations"] },
      { week: "Week 3: State & REST Data Pipelines", tasks: ["Integrate context state with Axios interceptors", "Handle API load spinners and warning toasts", "Design custom layout filters matching query search parameters"] },
      { week: "Week 4: Styling & Hosting Platforms", tasks: ["Migrate interface design grids to custom CSS variables", "Run production compilation and clear TypeScript alerts", "Deploy project to Vercel/Netlify with live domain access"] }
    ];

    let estimatedTime = "4 Weeks (Approx. 40 Hours)";

    if (isMl) {
      requiredSkills = [
        { name: "Python / Numerical Computing", progress: 90 },
        { name: "Machine Learning Foundations", progress: 70 },
        { name: "Deep Learning (PyTorch)", progress: 40 },
        { name: "SQL & Vector Databases", progress: 50 },
        { name: "MLOps (MLflow, Docker)", progress: 20 }
      ];
      
      learningRoadmap = [
        { title: "Deep Learning Fundamentals", desc: "Study Neural Networks, backpropagation, SGD, and loss function landscapes.", duration: "3 weeks", completed: false },
        { title: "Master PyTorch & Model Optimization", desc: "Train models, inspect gradients, save checkpoints, and run quantization.", duration: "2 weeks", completed: false },
        { title: "Vector DBs & Prompt Engineering", desc: "Integrate FAISS, Pinecone, or pgvector for retrieval augmented generation (RAG).", duration: "1 week", completed: false },
        { title: "Production Model Deployments", desc: "Serve models using FastAPI, containerize with Docker, and push model registries.", duration: "2 weeks", completed: false }
      ];

      weeklyPlan = [
        { week: "Week 1: Foundations of NN", tasks: ["Derive backpropagation equations by hand", "Build a neural network with numpy from scratch", "Train on MNIST dataset and achieve > 95% test accuracy"] },
        { week: "Week 2: Transitioning to PyTorch", tasks: ["Build PyTorch Dataset and DataLoader generators", "Train a CNN model on FashionMNIST with validation monitoring", "Implement learning rate schedulers and early stopping callbacks"] },
        { week: "Week 3: Retrieval Pipelines (RAG)", tasks: ["Generate embeddings using OpenAI or HuggingFace transformers", "Upsert chunks into ChromaDB/Pinecone local databases", "Build search query reranker nodes and check performance"] },
        { week: "Week 4: MLOps & API Server", tasks: ["Write FastAPI routes to load model and run real-time inference", "Measure request latency and optimize payload batching", "Write Docker build pipeline and verify container memory limits"] }
      ];

      estimatedTime = "10 Weeks (Approx. 150 Hours)";
    } else if (isDevOps) {
      requiredSkills = [
        { name: "Linux Administration & Bash", progress: 80 },
        { name: "Docker Containerization", progress: 60 },
        { name: "CI/CD Pipeline Configurations", progress: 40 },
        { name: "Kubernetes Orchestration", progress: 30 },
        { name: "AWS Cloud Infrastructure", progress: 50 }
      ];

      learningRoadmap = [
        { title: "Master Container Ecosystems", desc: "Learn Dockerfiles, volume mount points, networks, and compose environments.", duration: "2 weeks", completed: false },
        { title: "Kubernetes Orchestration", desc: "Understand pods, deployments, services, namespaces, and configMaps.", duration: "2 weeks", completed: false },
        { title: "CI/CD Pipeline Automations", desc: "Configure GitHub Actions, build runner tasks, and publish container images.", duration: "2 weeks", completed: false },
        { title: "Infrastructure as Code & Cloud", desc: "Manage AWS services, deploy container tasks, and monitor CPU alarms.", duration: "2 weeks", completed: false }
      ];

      weeklyPlan = [
        { week: "Week 1: Multi-stage Containers", tasks: ["Write optimized Dockerfiles with multi-stage builds", "Configure local network bridge mappings", "Compose Redis + Node API stacks with volume persistence"] },
        { week: "Week 2: Kubernetes Cluster Setup", tasks: ["Set up local Minikube cluster instance", "Write deployment.yaml and service.yaml configs", "Configure rolling updates and environment secret variables"] },
        { week: "Week 3: GitHub CI/CD Actions", tasks: ["Create workflows to build and lint codebase on push", "Configure repository secrets for DockerHub access", "Automate image builds and tags upon pull-request merges"] },
        { week: "Week 4: Cloud Engine Deployment", tasks: ["Deploy container tasks using AWS ECS ECS-CLI", "Configure target group health-check routes", "Set up AWS CloudWatch CPU usage threshold alerts"] }
      ];

      estimatedTime = "8 Weeks (Approx. 120 Hours)";
    }

    setGoalData({
      targetSkill,
      analyzed: true,
      estimatedTime,
      requiredSkills,
      learningRoadmap,
      weeklyPlan
    });
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

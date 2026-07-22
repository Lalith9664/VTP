"use client";

import React, { createContext, useContext, useState, useEffect } from "react";

export interface Profile {
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
}

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

export interface Notification {
  id: string;
  title: string;
  description: string;
  time: string;
  unread: boolean;
}

interface GoalPlannerData {
  targetSkill: string;
  analyzed: boolean;
  estimatedTime: string;
  requiredSkills: { name: string; progress: number }[];
  learningRoadmap: { title: string; desc: string; duration: string; completed: boolean }[];
  weeklyPlan: { week: string; tasks: string[] }[];
}

interface SessionContextType {
  profile: Profile;
  updateProfile: (updates: Partial<Profile>) => void;
  addSkill: (skill: string) => void;
  removeSkill: (skill: string) => void;
  
  uploadedFile: { name: string; size: string } | null;
  setUploadedFile: (file: { name: string; size: string } | null) => void;
  uploadProgress: number;
  setUploadProgress: (progress: number) => void;
  resumeScore: number;
  setResumeScore: (score: number) => void;

  status: "landing" | "login" | "onboarding" | "upload" | "scanning" | "analysis" | "dashboard";
  setStatus: (status: "landing" | "login" | "onboarding" | "upload" | "scanning" | "analysis" | "dashboard") => void;
  
  theme: "light" | "dark";
  toggleTheme: () => void;
  
  sidebarCollapsed: boolean;
  setSidebarCollapsed: (collapsed: boolean) => void;
  
  activeTab: string;
  setActiveTab: (tab: string) => void;

  notifications: Notification[];
  markNotificationRead: (id: string) => void;
  clearNotifications: () => void;

  jobs: Job[];
  antiJobs: AntiJob[];
  trendingSkills: TrendingSkill[];
  
  goalData: GoalPlannerData | null;
  analyzeGoal: (targetSkill: string) => void;
}

const defaultProfile: Profile = {
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
  profilePic: "https://images.unsplash.com/photo-1534528741775-53994a69daeb?q=80&w=256&h=256&fit=crop"
};

const initialTrendingSkills: TrendingSkill[] = [
  { name: "CrewAI", popularity: 94, growth: 124, isUp: true, category: "AI" },
  { name: "LangGraph", popularity: 88, growth: 95, isUp: true, category: "AI" },
  { name: "MCP (Model Context Protocol)", popularity: 82, growth: 210, isUp: true, category: "AI" },
  { name: "Docker", popularity: 92, growth: 15, isUp: true, category: "Cloud" },
  { name: "Kubernetes", popularity: 85, growth: 18, isUp: true, category: "Cloud" },
  { name: "FastAPI", popularity: 89, growth: 34, isUp: true, category: "Backend" },
  { name: "Next.js", popularity: 96, growth: 42, isUp: true, category: "Frontend" },
  { name: "TypeScript", popularity: 98, growth: 22, isUp: true, category: "Frontend" },
  { name: "AWS", popularity: 91, growth: 12, isUp: true, category: "Cloud" },
  { name: "Azure", popularity: 84, growth: 8, isUp: true, category: "Cloud" },
  { name: "Python", popularity: 99, growth: 15, isUp: true, category: "Backend" },
];

const initialJobs: Job[] = [
  {
    id: "job-1",
    companyName: "Stripe",
    companyLogo: "💳",
    role: "Associate Software Engineer - Frontend",
    salary: "₹18,00,000 - ₹24,00,000",
    experience: "0 - 2 years",
    location: "Bangalore (Hybrid)",
    postedTime: "2 hours ago",
    matchScore: 96,
    matchingSkills: ["React", "TypeScript", "Next.js", "Git"],
    missingSkills: ["Tailwind CSS"],
    description: "Build next-generation dashboard components and robust UI layers for millions of merchants worldwide. Collaborate with design teams to craft pixel-perfect React elements."
  },
  {
    id: "job-2",
    companyName: "Vercel",
    companyLogo: "▲",
    role: "Junior Frontend Engineer (Frameworks)",
    salary: "₹22,00,000 - ₹28,00,000",
    experience: "Fresher to 1 year",
    location: "Remote (India)",
    postedTime: "1 day ago",
    matchScore: 92,
    matchingSkills: ["React", "Next.js", "TypeScript", "Git"],
    missingSkills: ["Node.js"],
    description: "Contribute to Next.js templates, improve standard libraries, and build highly performant frontend components using Tailwind CSS and React Server Components."
  },
  {
    id: "job-3",
    companyName: "Linear",
    companyLogo: "📐",
    role: "Software Developer - Product Systems",
    salary: "₹16,00,000 - ₹22,00,000",
    experience: "Fresher / Internship",
    location: "Delhi NCR (Onsite)",
    postedTime: "2 days ago",
    matchScore: 88,
    matchingSkills: ["TypeScript", "React", "Node.js", "Git"],
    missingSkills: ["FastAPI", "Python"],
    description: "Work on fast, keyboard-first web applications. Build robust state synchronization layers and responsive, motion-heavy interfaces."
  },
  {
    id: "job-4",
    companyName: "Perplexity AI",
    companyLogo: "🌐",
    role: "AI Integration Engineer (Fresher)",
    salary: "₹24,00,000 - ₹32,00,000",
    experience: "0 - 1 year",
    location: "Mumbai (Hybrid)",
    postedTime: "3 days ago",
    matchScore: 85,
    matchingSkills: ["Python", "FastAPI", "TypeScript", "React"],
    missingSkills: ["CrewAI", "LangGraph"],
    description: "Integrate LLM API nodes and orchestrate local tool agents. Work with vector databases, retrieve context efficiently, and optimize search queries."
  },
  {
    id: "job-5",
    companyName: "Razorpay",
    companyLogo: "💳",
    role: "Full Stack Engineer Intern",
    salary: "₹45,000 / month (Internship)",
    experience: "Internship",
    location: "Bangalore",
    postedTime: "5 hours ago",
    matchScore: 90,
    matchingSkills: ["React", "TypeScript", "Node.js", "Git"],
    missingSkills: ["Docker"],
    description: "Help expand standard merchant gateway integrations. Build reliable APIs and client dashboard panels with high accessibility compliance."
  }
];

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

const SessionContext = createContext<SessionContextType | undefined>(undefined);

export const SessionProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [profile, setProfile] = useState<Profile>(defaultProfile);
  const [uploadedFile, setUploadedFileState] = useState<{ name: string; size: string } | null>(null);
  const [uploadProgress, setUploadProgress] = useState<number>(0);
  const [resumeScore, setResumeScore] = useState<number>(78);
  const [status, setStatus] = useState<"landing" | "login" | "onboarding" | "upload" | "scanning" | "analysis" | "dashboard">("landing");
  const [theme, setTheme] = useState<"light" | "dark">("dark");
  const [sidebarCollapsed, setSidebarCollapsed] = useState<boolean>(false);

  useEffect(() => {
    if (typeof window !== "undefined") {
      if (theme === "dark") {
        document.documentElement.classList.add("dark");
      } else {
        document.documentElement.classList.remove("dark");
      }
    }
  }, [theme]);
  const [activeTab, setActiveTab] = useState<string>("dashboard");
  const [notifications, setNotifications] = useState<Notification[]>([
    {
      id: "notif-1",
      title: "New Job Match Found",
      description: "Stripe listed an Associate Software Engineer role that matches 96% of your skills.",
      time: "10 mins ago",
      unread: true,
    },
    {
      id: "notif-2",
      title: "Agent Analysis Complete",
      description: "Our AI agents successfully parsed your skills graph and mapped 4 job roles.",
      time: "1 hour ago",
      unread: true,
    },
    {
      id: "notif-3",
      title: "Welcome to VTP",
      description: "Start by completing your profile and uploading your latest resume for AI matching.",
      time: "2 hours ago",
      unread: false,
    }
  ]);
  const [jobs, setJobs] = useState<Job[]>(initialJobs);
  const [antiJobs, setAntiJobs] = useState<AntiJob[]>(initialAntiJobs);
  const [trendingSkills, setTrendingSkills] = useState<TrendingSkill[]>(initialTrendingSkills);
  const [goalData, setGoalData] = useState<GoalPlannerData | null>(null);

  const updateProfile = (updates: Partial<Profile>) => {
    setProfile((prev) => {
      const next = { ...prev, ...updates };
      if (updates.skills) {
        updateJobMatchScores(updates.skills);
      }
      return next;
    });
  };

  const addSkill = (skill: string) => {
    if (!profile.skills.includes(skill)) {
      const newSkills = [...profile.skills, skill];
      updateProfile({ skills: newSkills });
    }
  };

  const removeSkill = (skillToRemove: string) => {
    const newSkills = profile.skills.filter((s) => s !== skillToRemove);
    updateProfile({ skills: newSkills });
  };

  const setUploadedFile = (file: { name: string; size: string } | null) => {
    setUploadedFileState(file);
    if (file) {
      setResumeScore(86);
    }
  };

  const toggleTheme = () => {
    setTheme((prev) => {
      const next = prev === "light" ? "dark" : "light";
      if (typeof window !== "undefined") {
        if (next === "dark") {
          document.documentElement.classList.add("dark");
        } else {
          document.documentElement.classList.remove("dark");
        }
      }
      return next;
    });
  };

  const markNotificationRead = (id: string) => {
    setNotifications((prev) =>
      prev.map((n) => (n.id === id ? { ...n, unread: false } : n))
    );
  };

  const clearNotifications = () => {
    setNotifications([]);
  };

  const updateJobMatchScores = (userSkills: string[]) => {
    setJobs((prevJobs) =>
      prevJobs.map((job) => {
        const total = job.matchingSkills.length + job.missingSkills.length;
        const newMatching: string[] = [];
        const newMissing: string[] = [];
        
        [...job.matchingSkills, ...job.missingSkills].forEach((skill) => {
          if (userSkills.some(s => s.toLowerCase() === skill.toLowerCase())) {
            newMatching.push(skill);
          } else {
            newMissing.push(skill);
          }
        });

        const newScore = total > 0 ? Math.round((newMatching.length / total) * 100) : 50;

        return {
          ...job,
          matchScore: newScore,
          matchingSkills: newMatching,
          missingSkills: newMissing,
        };
      })
    );
  };

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

  return (
    <SessionContext.Provider
      value={{
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
        antiJobs,
        trendingSkills,
        
        goalData,
        analyzeGoal
      }}
    >
      {children}
    </SessionContext.Provider>
  );
};

export const useSession = () => {
  const context = useContext(SessionContext);
  if (!context) {
    throw new Error("useSession must be used within a SessionProvider");
  }
  return context;
};

"use client";

import React, { useState } from "react";
import { useRouter } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import { 
  LayoutDashboard, Briefcase, TrendingUp, Target, ShieldAlert,
  BarChart3, FileText, User, Settings, LogOut, Search, Bell,
  Menu, X, Sparkles, CheckCircle2, ChevronRight, Award, Clock,
  ArrowUpRight, AlertCircle, Plus, Info, Globe, Mail, Phone,
  Bookmark, Send, Save, Eye, CheckSquare, Lightbulb, Play, Loader2, RefreshCw
} from "lucide-react";
import { toast } from "sonner";
import { useSession, Job, AntiJob, TrendingSkill } from "@/store/SessionContext";


// Recharts components imports
import { 
  Radar, RadarChart, PolarGrid, PolarAngleAxis, PolarRadiusAxis, 
  ResponsiveContainer, PieChart, Pie, Cell, LineChart, Line, 
  XAxis, YAxis, Tooltip, BarChart, Bar, Legend
} from "recharts";

export default function DashboardPage() {
  const router = useRouter();
  const { 
    profile, updateProfile, addSkill, removeSkill,
    uploadedFile, setUploadedFile, resumeScore,
    theme, toggleTheme, activeTab, setActiveTab,
    notifications, markNotificationRead, clearNotifications,
    jobs, antiJobs, trendingSkills, goalData, analyzeGoal,
    sidebarCollapsed, setSidebarCollapsed,
    insightsLoading,
    refreshInsights,
  } = useSession();

  React.useEffect(() => {
    refreshInsights();
  }, [refreshInsights]);


  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [notifDropdownOpen, setNotifDropdownOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedJob, setSelectedJob] = useState<Job | null>(null);
  
  // Job planner local state
  const [dreamInput, setDreamInput] = useState("");
  const [planningActive, setPlanningActive] = useState(false);

  // Profile local states
  const [editName, setEditName] = useState(profile.fullName);
  const [editCollege, setEditCollege] = useState(profile.college);
  const [editDepartment, setEditDepartment] = useState(profile.department);
  const [editCgpa, setEditCgpa] = useState(profile.cgpa);
  const [newSkillText, setNewSkillText] = useState("");

  const handleLogout = () => {
    toast.success("Logged out successfully.");
    router.push("/");
  };

  const handleJobDetails = (job: Job) => {
    router.push(`/job/${job.id}`);
  };

  const handleApply = (job: Job) => {
    toast.promise(
      new Promise((resolve) => setTimeout(resolve, 1500)),
      {
        loading: `Submitting credentials to ${job.companyName}...`,
        success: `Application submitted for ${job.role}! Check email for next steps.`,
        error: "Failed to apply."
      }
    );
  };

  const [savedJobs, setSavedJobs] = useState<string[]>([]);
  const toggleSaveJob = (jobId: string) => {
    if (savedJobs.includes(jobId)) {
      setSavedJobs(savedJobs.filter(id => id !== jobId));
      toast.info("Job removed from saved list.");
    } else {
      setSavedJobs([...savedJobs, jobId]);
      toast.success("Job bookmarked successfully!");
    }
  };

  const handleAnalyzeGoal = (e: React.FormEvent) => {
    e.preventDefault();
    if (!dreamInput.trim()) {
      toast.warning("Please enter a technology or skill name.");
      return;
    }
    setPlanningActive(true);
    toast.loading("Analyzing prerequisites and compiling learning roadmap...", { id: "planning" });
    setTimeout(() => {
      analyzeGoal(dreamInput);
      setPlanningActive(false);
      toast.success("Custom skill roadmap compiled successfully!", { id: "planning" });
    }, 1800);
  };

  const handleProfileSave = (e: React.FormEvent) => {
    e.preventDefault();
    updateProfile({
      fullName: editName,
      college: editCollege,
      department: editDepartment,
      cgpa: editCgpa
    });
    toast.success("Profile indices updated in neural database.");
  };

  const handleAddSkillLocal = (e: React.FormEvent) => {
    e.preventDefault();
    if (newSkillText.trim()) {
      addSkill(newSkillText.trim());
      setNewSkillText("");
    }
  };

  const activeUnreadCount = notifications.filter(n => n.unread).length;

  // Chart Color constants based on Light vs Dark theme
  const primaryThemeColor = theme === "light" ? "#6366f1" : "#38bdf8";
  const secondaryThemeColor = theme === "light" ? "#8b5cf6" : "#0ea5e9";

  const chartData = [
    { subject: "Frontend Dev", A: 90, B: 85, fullMark: 100 },
    { subject: "Backend Systems", A: 75, B: 90, fullMark: 100 },
    { subject: "DSA / Logic", A: 85, B: 80, fullMark: 100 },
    { subject: "DevOps / Infra", A: 40, B: 70, fullMark: 100 },
    { subject: "AI Agent Orchestration", A: 60, B: 85, fullMark: 100 },
  ];

  const pieData = [
    { name: "Full Stack", value: 40, color: primaryThemeColor },
    { name: "AI/ML", value: 30, color: secondaryThemeColor },
    { name: "DevOps Platform", value: 15, color: "#14b8a6" },
    { name: "Mobile App Dev", value: 15, color: "#f59e0b" },
  ];

  const barData = [
    { month: "Jan", accuracy: 84 },
    { month: "Feb", accuracy: 88 },
    { month: "Mar", accuracy: 91 },
    { month: "Apr", accuracy: 96 },
  ];

  const lineData = [
    { week: "Wk 1", hours: 8 },
    { week: "Wk 2", hours: 14 },
    { week: "Wk 3", hours: 21 },
    { week: "Wk 4", hours: 28 },
  ];

  return (
    <div className="flex-1 min-h-screen flex neu-bg font-sans relative select-none text-slate-100 transition-colors duration-300">
      
      {/* Background radial overlays */}
      <div className="absolute top-0 right-0 w-[45%] h-[40%] rounded-full bg-gradient-to-br from-teal-500/5 to-emerald-500/5 blur-[120px] pointer-events-none" />
      <div className="absolute bottom-0 left-0 w-[40%] h-[40%] rounded-full bg-gradient-to-tr from-purple-500/5 to-teal-500/5 blur-[130px] pointer-events-none" />

      {/* SIDEBAR NAVIGATION (Desktop) */}
      <aside className={`hidden lg:flex flex-col h-screen fixed left-0 top-0 neu-sidebar-bg border-r border-slate-200/60 gap-8 z-30 shadow-2xl transition-all duration-300 ${sidebarCollapsed ? "w-20 p-4" : "w-64 p-6"}`}>
        
        {/* Logo Header */}
        <div 
          className={`flex items-center gap-3 cursor-pointer select-none ${sidebarCollapsed ? "justify-center" : ""}`}
          onClick={() => setSidebarCollapsed(!sidebarCollapsed)}
          title={sidebarCollapsed ? "Expand Sidebar" : "Collapse Sidebar"}
        >
          <img src="/logo.jpeg" alt="VTP Logo" className="w-12 h-12 rounded-xl object-cover shadow-md border-none neu-circle transition-all duration-300" />
          {!sidebarCollapsed && <span className="text-lg font-bold text-slate-200">VTP</span>}
        </div>

        {/* User Quick Info */}
        {!sidebarCollapsed ? (
          <div className="flex items-center gap-3 p-3 rounded-2xl border-none neu-pressed">
            {profile.profilePic ? (
              <img 
                src={profile.profilePic} 
                alt="Profile Avatar" 
                className="w-10 h-10 rounded-full object-cover border border-slate-200 dark:border-slate-700"
              />
            ) : (
              <div className="w-10 h-10 rounded-full bg-gradient-to-tr from-teal-500 to-emerald-500 text-white font-black flex items-center justify-center text-sm border border-teal-400/20 neu-circle shadow-inner">
                {profile.fullName ? profile.fullName.charAt(0).toUpperCase() : "?"}
              </div>
            )}
            <div className="min-w-0 flex-1 text-left">
              <h4 className="text-xs font-bold text-slate-800 dark:text-slate-200 truncate">{profile.fullName}</h4>
              <span className="text-[10px] text-slate-400 dark:text-slate-400 font-semibold">{profile.degree} • {profile.department.split(" ")[0]}</span>
            </div>
          </div>
        ) : (
          <div className="flex items-center justify-center p-2 rounded-2xl border-none neu-pressed" title={profile.fullName}>
            {profile.profilePic ? (
              <img 
                src={profile.profilePic} 
                alt="Profile Avatar" 
                className="w-9 h-9 rounded-full object-cover border border-slate-200 dark:border-slate-700"
              />
            ) : (
              <div className="w-9 h-9 rounded-full bg-gradient-to-tr from-teal-500 to-emerald-500 text-white font-black flex items-center justify-center text-xs border border-teal-400/20 neu-circle shadow-inner">
                {profile.fullName ? profile.fullName.charAt(0).toUpperCase() : "?"}
              </div>
            )}
          </div>
        )}

        {/* Navigation Items */}
        <nav className="flex flex-col gap-1.5 flex-grow">
          {[
            { id: "dashboard", label: "Dashboard", icon: <LayoutDashboard className="w-4 h-4" /> },
            { id: "jobs", label: "Recommended Jobs", icon: <Briefcase className="w-4 h-4" /> },
            { id: "skills", label: "Trending Skills", icon: <TrendingUp className="w-4 h-4" /> },
            { id: "planner", label: "Goal Planner", icon: <Target className="w-4 h-4" /> },
            { id: "antijobs", label: "Anti-Matching Jobs", icon: <ShieldAlert className="w-4 h-4" /> },
            { id: "resume", label: "Resume Detail", icon: <FileText className="w-4 h-4" /> },
            { id: "profile", label: "Profile", icon: <User className="w-4 h-4" /> },
            { id: "settings", label: "Settings", icon: <Settings className="w-4 h-4" /> },
          ].map((item) => {
            const isActive = activeTab === item.id;
            return (
              <button
                key={item.id}
                onClick={() => setActiveTab(item.id)}
                className={`flex items-center gap-3 rounded-xl transition-all text-left ${sidebarCollapsed ? "justify-center p-3" : "px-4 py-3 text-xs font-bold"} ${isActive ? `neu-pressed text-teal-400 border-none` : "text-slate-400 hover:text-slate-200 hover:translate-y-[-1px] neu-button border-none mb-1.5"}`}
                title={sidebarCollapsed ? item.label : undefined}
              >
                <span className={isActive ? "text-teal-400" : "text-slate-400"}>{item.icon}</span>
                {!sidebarCollapsed && item.label}
              </button>
            );
          })}
        </nav>

        {/* Logout */}
        <button
          onClick={handleLogout}
          className={`flex items-center gap-3 rounded-xl transition-all text-left border-none neu-button hover:text-rose-400 hover:shadow-[0_0_12px_rgba(244,63,94,0.1)] cursor-pointer ${sidebarCollapsed ? "justify-center p-3" : "px-4 py-3 text-xs font-bold text-rose-450"}`}
          title={sidebarCollapsed ? "Logout" : undefined}
        >
          <LogOut className="w-4 h-4 text-rose-500" />
          {!sidebarCollapsed && "Logout"}
        </button>
      </aside>

      {/* MOBILE DRAWER SIDEBAR */}
      <AnimatePresence>
        {sidebarOpen && (
          <>
            <div 
              className="lg:hidden fixed inset-0 bg-slate-900/10 backdrop-blur-xs z-40"
              onClick={() => setSidebarOpen(false)}
            />
            <motion.aside 
              initial={{ x: -260 }}
              animate={{ x: 0 }}
              exit={{ x: -260 }}
              className="lg:hidden fixed left-0 top-0 bottom-0 w-64 neu-sidebar-bg border-r border-slate-200/60 p-6 flex flex-col gap-6 z-50 shadow-2xl"
            >
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <div className="w-8 h-8 rounded-lg bg-gradient-to-tr from-teal-400 to-emerald-500 flex items-center justify-center text-white font-bold border-none neu-circle">A</div>
                  <span className="font-bold text-slate-200 text-sm">VTP</span>
                </div>
                <button onClick={() => setSidebarOpen(false)} className="cursor-pointer border-none neu-circle p-1">
                  <X className="w-4 h-4 text-slate-400" />
                </button>
              </div>

              <nav className="flex flex-col gap-1 flex-grow">
                {[
                  { id: "dashboard", label: "Dashboard", icon: <LayoutDashboard className="w-4 h-4" /> },
                  { id: "jobs", label: "Recommended Jobs", icon: <Briefcase className="w-4 h-4" /> },
                  { id: "skills", label: "Trending Skills", icon: <TrendingUp className="w-4 h-4" /> },
                  { id: "planner", label: "Goal Planner", icon: <Target className="w-4 h-4" /> },
                  { id: "antijobs", label: "Anti-Matching Jobs", icon: <ShieldAlert className="w-4 h-4" /> },
                  { id: "resume", label: "Resume Detail", icon: <FileText className="w-4 h-4" /> },
                  { id: "profile", label: "Profile", icon: <User className="w-4 h-4" /> },
                  { id: "settings", label: "Settings", icon: <Settings className="w-4 h-4" /> },
                ].map((item) => {
                  const isActive = activeTab === item.id;
                  return (
                    <button
                      key={item.id}
                      onClick={() => {
                        setActiveTab(item.id);
                        setSidebarOpen(false);
                      }}
                      className={`flex items-center gap-3 px-4 py-3.5 text-xs font-bold rounded-xl transition-all text-left border-none mb-1.5 ${isActive ? "neu-pressed text-teal-400" : "text-slate-400 hover:text-slate-200 neu-button"}`}
                    >
                      {item.icon}
                      {item.label}
                    </button>
                  );
                })}
              </nav>

              <button
                onClick={handleLogout}
                className="flex items-center gap-3 px-4 py-3.5 text-xs font-bold text-rose-450 rounded-xl transition-all text-left border-none neu-button hover:text-rose-400 hover:shadow-[0_0_12px_rgba(244,63,94,0.1)] cursor-pointer"
              >
                <LogOut className="w-4 h-4 text-rose-500" />
                Logout
              </button>
            </motion.aside>
          </>
        )}
      </AnimatePresence>

      {/* MAIN CONTAINER */}
      <div className={`flex-1 flex flex-col min-w-0 relative z-25 transition-all duration-300 ${sidebarCollapsed ? "lg:pl-20" : "lg:pl-64"}`}>
        
        {/* HEADER BAR */}
        <header className="sticky top-0 z-35 w-full neu-header-bg border-b border-slate-200/60 h-16 flex items-center justify-between px-6 shadow-md">
          
          <div className="flex items-center gap-4">
            {/* Burger toggle for mobile */}
            <button 
              onClick={() => setSidebarOpen(true)}
              className="lg:hidden p-2 text-slate-400 hover:bg-[#172033] rounded-lg cursor-pointer neu-button border-none"
            >
              <Menu className="w-5 h-5" />
            </button>

            {/* Quick search input */}
            <div className="relative hidden sm:block w-64">
              <Search className="absolute left-3 top-2.5 w-4 h-4 text-slate-400" />
              <input 
                type="text" 
                placeholder="Search jobs, skills or guides..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full h-9 rounded-xl pl-9 pr-4 text-xs font-semibold text-slate-350 neu-input border-none"
              />
            </div>
          </div>

          <div className="flex items-center gap-3">
            
            {/* Dark/Light Mode Toggle Switch */}
            <div className="flex items-center gap-2 mr-2">
              <button
                onClick={toggleTheme}
                className="w-16 h-8.5 rounded-full relative transition-colors duration-300 flex items-center px-0.5 focus:outline-none cursor-pointer border-none bg-slate-150 dark:bg-slate-900/60 neu-pressed"
                aria-label="Toggle Theme Mode"
              >
                {/* Left Indicator (circular ring outline) */}
                <div className="absolute left-2.5 w-3 h-3 rounded-full border-2 border-slate-700 dark:border-slate-500 opacity-80" />
                
                {/* Right Indicator (glowing horizontal white line) */}
                <div 
                  className="absolute right-3.5 w-3.5 h-0.5 rounded-full opacity-100 z-0" 
                  style={{ backgroundColor: "#ffffff", boxShadow: "0 0 8px #ffffff" }}
                />

                {/* Sliding Knob */}
                <motion.div
                  layout
                  className="w-7.5 h-7.5 rounded-full border-none shadow-md cursor-pointer bg-white dark:bg-slate-300 z-10"
                  animate={{ x: theme === "dark" ? 0 : 30 }}
                  transition={{ duration: 0.1, ease: "easeOut" }}
                />
              </button>
            </div>

            {/* Notifications Dropdown */}
            <div className="relative">
              <button
                onClick={() => setNotifDropdownOpen(!notifDropdownOpen)}
                className="w-10 h-10 rounded-xl flex items-center justify-center text-slate-350 transition-all relative cursor-pointer border-none neu-button"
              >
                <Bell className="w-5 h-5 text-slate-300" />
                {activeUnreadCount > 0 && (
                  <span className="absolute top-1.5 right-1.5 w-4 h-4 rounded-full bg-rose-500 text-[9px] font-bold text-white flex items-center justify-center animate-pulse">
                    {activeUnreadCount}
                  </span>
                )}
              </button>

              <AnimatePresence>
                {notifDropdownOpen && (
                  <>
                    <div className="fixed inset-0 z-40" onClick={() => setNotifDropdownOpen(false)} />
                    <motion.div
                      initial={{ opacity: 0, y: 10, scale: 0.95 }}
                      animate={{ opacity: 1, y: 0, scale: 1 }}
                      exit={{ opacity: 0, y: 10, scale: 0.95 }}
                      className="absolute right-0 top-12 w-80 rounded-2xl p-4 z-50 text-left flex flex-col gap-3 border-none bg-[#1A2336] neu-card shadow-2xl"
                    >
                      <div className="flex items-center justify-between border-b border-slate-800 pb-2">
                        <span className="text-xs font-bold text-slate-200 uppercase tracking-wider">Recent Activity</span>
                        {activeUnreadCount > 0 && (
                          <button 
                            onClick={clearNotifications}
                            className="text-[10px] font-bold text-teal-400 hover:underline cursor-pointer border-none bg-transparent"
                          >
                            Clear All
                          </button>
                        )}
                      </div>
                      
                      <div className="flex flex-col gap-2.5 max-h-56 overflow-y-auto">
                        {notifications.length === 0 ? (
                          <span className="text-xs text-slate-400 py-4 text-center">No notifications</span>
                        ) : (
                          notifications.map((notif) => (
                            <div 
                              key={notif.id}
                              onClick={() => markNotificationRead(notif.id)}
                              className={`p-2.5 rounded-xl transition-all cursor-pointer text-xs border-none ${notif.unread ? "neu-pressed" : "neu-button"}`}
                            >
                              <div className="flex items-center justify-between font-bold text-slate-200">
                                <span>{notif.title}</span>
                                <span className="text-[9px] text-slate-400 font-semibold">{notif.time}</span>
                              </div>
                              <p className="text-[11px] text-slate-400 mt-1">{notif.description}</p>
                            </div>
                          ))
                        )}
                      </div>
                    </motion.div>
                  </>
                )}
              </AnimatePresence>
            </div>

            {/* Profile Avatar */}
            <div 
              onClick={() => setActiveTab("profile")}
              className="flex items-center gap-2 p-1 rounded-xl cursor-pointer transition-all border-none neu-button hover:translate-y-[-1px]"
            >
              {profile.profilePic ? (
                <img 
                  src={profile.profilePic} 
                  alt="Avatar" 
                  className="w-8 h-8 rounded-lg object-cover"
                />
              ) : (
                <div className="w-8 h-8 rounded-lg bg-gradient-to-tr from-teal-500 to-emerald-500 text-white font-black flex items-center justify-center text-xs shadow-inner">
                  {profile.fullName ? profile.fullName.charAt(0).toUpperCase() : "?"}
                </div>
              )}
            </div>
          </div>
        </header>

        {/* CONTENT AREA */}
        <main className="flex-1 overflow-y-auto pt-10 px-6 pb-6 relative">
          
          {/* TAB 1: OVERVIEW */}
          {activeTab === "dashboard" && (
            <motion.div 
              initial={{ opacity: 0, y: 15 }} 
              animate={{ opacity: 1, y: 0 }}
              className="flex flex-col gap-6 text-left"
            >
              {/* Welcome Banner Card */}
              <div className="glass-card glow-border p-6 rounded-3xl flex flex-col md:flex-row md:items-center justify-between gap-6 shadow-sm">
                <div className="flex flex-col gap-1">
                  <h2 className="text-2xl font-extrabold text-slate-900">Good Morning, {profile.fullName.split(" ")[0]}! 👋</h2>
                  <p className="text-slate-500 text-sm">Your multi-agent network crawled 34 new matching listings matching your skillset today.</p>
                </div>
                <div className="flex gap-2">
                  <button 
                    onClick={() => setActiveTab("jobs")}
                    className="px-4 py-2 text-xs font-bold bg-teal-500 text-white rounded-xl hover:bg-teal-600 transition-all flex items-center gap-1.5 shadow-xs"
                  >
                    View Matches <ChevronRight className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>

              {/* Stat Cards Grid */}
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4">
                {[
                  { label: "Recommended Jobs", value: "14", desc: "Top matched roles", icon: <Briefcase className="w-4 h-4 text-teal-500" /> },
                  { label: "Resume AI Score", value: `${resumeScore}/100`, desc: "Strengthened profile", icon: <Award className="w-4 h-4 text-teal-500" /> },
                  { label: "Active Applications", value: "3", desc: "Submitted vacancies", icon: <CheckCircle2 className="w-4 h-4 text-teal-500" /> },
                  { label: "Agent Confidence", value: "96%", desc: "Accurate matches", icon: <Sparkles className="w-4 h-4 text-purple-500" /> },
                  { label: "Career Readiness", value: "85%", desc: "Skills readiness score", icon: <Clock className="w-4 h-4 text-orange-500" /> },
                ].map((stat, idx) => (
                  <div key={idx} className="p-5 rounded-2xl flex flex-col gap-2 border-none neu-card neu-card-hover">
                    <div className="flex items-center justify-between">
                      <span className="text-[10px] font-bold text-slate-455 uppercase tracking-wider">{stat.label}</span>
                      <div className="p-1.5 rounded-lg border-none neu-circle bg-[#172033]">{stat.icon}</div>
                    </div>
                    <h3 className="text-xl font-black text-slate-250 tracking-tight">{stat.value}</h3>
                    <p className="text-[10px] text-slate-400 font-semibold">{stat.desc}</p>
                  </div>
                ))}
              </div>

              {/* Main Grid: Overview Jobs list vs Quick Skill Graph */}
              <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
                
                {/* Jobs Quick view */}
                <div className="lg:col-span-8 flex flex-col gap-4">
                  <div className="flex items-center justify-between">
                    <h3 className="font-extrabold text-slate-200 text-lg">Top Recommended Roles</h3>
                    <button 
                      onClick={() => setActiveTab("jobs")}
                      className="text-xs font-bold text-teal-500 hover:underline flex items-center gap-1 cursor-pointer border-none bg-transparent"
                    >
                      See All Matches <ArrowUpRight className="w-3.5 h-3.5" />
                    </button>
                  </div>

                  <div className="flex flex-col gap-3">
                    {jobs.slice(0, 3).map((job) => (
                      <JobCard key={job.id} job={job} onDetails={handleJobDetails} onApply={handleApply} onSave={toggleSaveJob} isSaved={savedJobs.includes(job.id)} />
                    ))}
                  </div>
                </div>

                {/* Trending Skills & ThoughtStream side panel */}
                <div className="lg:col-span-4 flex flex-col gap-6">

                  <div className="flex items-center justify-between">
                    <h3 className="font-extrabold text-slate-200 text-lg">Trending Skills</h3>
                    <button 
                      onClick={() => setActiveTab("skills")}
                      className="text-xs font-bold text-teal-500 hover:underline cursor-pointer border-none bg-transparent"
                    >
                      Inspect Feed
                    </button>
                  </div>

                  <div className="p-5 rounded-3xl flex flex-col gap-4 border-none neu-card">
                    {trendingSkills.slice(0, 5).map((skill) => (
                      <div key={skill.name} className="flex items-center justify-between border-b border-slate-800 pb-2.5 last:border-b-0 last:pb-0">
                        <div className="flex flex-col gap-0.5 text-left">
                          <span className="text-xs font-bold text-slate-200">{skill.name}</span>
                          <span className="text-[9px] text-slate-400 uppercase tracking-widest font-semibold">{skill.category}</span>
                        </div>
                        <div className="flex items-center gap-3">
                          <span className="text-xs font-bold text-teal-400">+{skill.growth}%</span>
                          <span className="text-[10px] text-slate-400 px-2.5 py-1 rounded-full font-bold border-none neu-pressed">{skill.popularity}% Pop</span>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

              </div>
            </motion.div>
          )}

          {/* TAB 2: RECOMMENDED JOBS */}
          {activeTab === "jobs" && (
            <motion.div 
              initial={{ opacity: 0, y: 15 }} 
              animate={{ opacity: 1, y: 0 }}
              className="flex flex-col gap-6 text-left"
            >
              <div>
                <h2 className="text-2xl font-extrabold text-slate-900">Recommended Opportunities</h2>
                <p className="text-slate-500 text-sm mt-1">Multi-agent mapping ranked these jobs based on your parsed skills graph.</p>
              </div>

              <div className="flex flex-col gap-4">
                {insightsLoading ? (
                  /* ── Skeleton loader ── */
                  <>
                    {[0, 1, 2].map((i) => (
                      <div
                        key={i}
                        className="rounded-3xl border border-slate-200/80 bg-white p-6 flex flex-col gap-4 shadow-sm animate-pulse"
                        style={{ animationDelay: `${i * 120}ms` }}
                      >
                        {/* Top row */}
                        <div className="flex items-start justify-between gap-4">
                          <div className="flex flex-col gap-2 flex-1">
                            <div className="h-3 w-24 rounded-full bg-slate-200" />
                            <div className="h-5 w-56 rounded-full bg-slate-200" />
                            <div className="h-3 w-36 rounded-full bg-slate-200" />
                          </div>
                          <div className="w-14 h-14 rounded-2xl bg-slate-200 flex-shrink-0" />
                        </div>
                        {/* Skill chips */}
                        <div className="flex gap-2 flex-wrap">
                          {[0,1,2,3].map(j => (
                            <div key={j} className="h-6 w-16 rounded-xl bg-slate-200" />
                          ))}
                        </div>
                        {/* Bottom row */}
                        <div className="flex gap-3 pt-2 border-t border-slate-100">
                          <div className="h-9 flex-1 rounded-2xl bg-slate-200" />
                          <div className="h-9 w-24 rounded-2xl bg-slate-200" />
                        </div>
                      </div>
                    ))}
                  </>
                ) : jobs.length > 0 ? (
                  jobs.map((job) => (
                    <JobCard key={job.id} job={job} onDetails={handleJobDetails} onApply={handleApply} onSave={toggleSaveJob} isSaved={savedJobs.includes(job.id)} />
                  ))
                ) : (
                  /* ── Empty state ── */
                  <div className="flex flex-col items-center justify-center gap-4 py-16 text-center">
                    <div className="w-16 h-16 rounded-full bg-teal-50 border border-teal-100 flex items-center justify-center">
                      <Briefcase className="w-7 h-7 text-teal-400" />
                    </div>
                    <div>
                      <h3 className="font-black text-slate-700 text-base">No jobs loaded yet</h3>
                      <p className="text-slate-400 text-sm mt-1 max-w-xs">Upload your resume and the AI will match the best opportunities for you.</p>
                    </div>
                  </div>
                )}
              </div>
            </motion.div>
          )}


          {/* TAB 3: TRENDING SKILLS */}
          {activeTab === "skills" && (
            <motion.div 
              initial={{ opacity: 0, y: 15 }} 
              animate={{ opacity: 1, y: 0 }}
              className="flex flex-col gap-6 text-left"
            >
              <div>
                <h2 className="text-2xl font-extrabold text-slate-900">Trending Technologies</h2>
                <p className="text-slate-500 text-sm mt-1">Demand rates analyzed in real-time across cloud platforms and startup sectors.</p>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
                {trendingSkills.map((skill) => (
                  <div 
                    key={skill.name} 
                    className="group neu-card neu-card-hover p-5 rounded-2xl flex flex-col justify-between gap-5 border-none relative overflow-hidden"
                  >
                    {/* Subtle top indicator bar showing on hover */}
                    <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-teal-500 to-emerald-400 opacity-0 group-hover:opacity-100 transition-all duration-300" />
                    
                    <div className="flex justify-between items-start">
                      <div className="flex flex-col text-left">
                        <span className="text-sm font-black text-slate-800 dark:text-slate-200 tracking-tight group-hover:text-teal-500 dark:group-hover:text-teal-400 transition-colors">
                          {skill.name}
                        </span>
                        <span className="text-[10px] text-slate-400 dark:text-slate-500 font-bold uppercase tracking-wider mt-0.5">
                          {skill.category}
                        </span>
                      </div>
                      <span className="inline-flex items-center gap-1 text-[10px] font-black text-teal-600 dark:text-teal-400 bg-teal-500/10 dark:bg-teal-500/10 px-2 py-0.5 rounded-lg border border-teal-500/20">
                        +{skill.growth}%
                      </span>
                    </div>

                    <div className="flex flex-col gap-2">
                      <div className="flex justify-between items-center text-[10px] font-bold text-slate-500 dark:text-slate-400">
                        <span>Popularity Weight</span>
                        <span>{skill.popularity}%</span>
                      </div>
                      <div className="w-full bg-slate-200/50 dark:bg-slate-900/60 h-2 rounded-full overflow-hidden neu-pressed p-[1px] border-none">
                        <div 
                          className="bg-gradient-to-r from-teal-500 to-emerald-400 h-full rounded-full transition-all duration-500 shadow-[0_0_8px_rgba(20,184,166,0.3)]"
                          style={{ width: `${skill.popularity}%` }}
                        />
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </motion.div>
          )}

          {/* TAB 4: GOAL PLANNER */}
          {activeTab === "planner" && (
            <motion.div 
              initial={{ opacity: 0, y: 15 }} 
              animate={{ opacity: 1, y: 0 }}
              className="flex flex-col gap-6 text-left"
            >
              <div>
                <h2 className="text-2xl font-extrabold text-slate-900">Skill Mastery Planner</h2>
                <p className="text-slate-500 text-sm mt-1">Enter your target technology or skill goal (e.g. Next.js, Docker, Machine Learning) to map required concepts and compile weekly study roadmaps.</p>
              </div>

              {/* Target Input form */}
              <form onSubmit={handleAnalyzeGoal} className="glass-card glow-border p-6 rounded-3xl shadow-sm flex flex-col gap-4 text-left">
                
                {/* Input Row */}
                <div className="flex flex-col md:flex-row gap-4 items-end w-full">
                  <div className="flex-1 flex flex-col gap-2 text-left w-full">
                    <label className="text-xs font-semibold text-slate-600 uppercase tracking-wider">Target Skill or Technology</label>
                    <input 
                      type="text" 
                      placeholder="e.g. React / Next.js, Docker & DevOps, Machine Learning & AI"
                      value={dreamInput}
                      onChange={(e) => setDreamInput(e.target.value)}
                      className="h-12 w-full rounded-xl px-4 text-sm glass-input font-medium text-slate-700"
                      disabled={planningActive}
                    />
                  </div>

                  <button
                    type="submit"
                    disabled={planningActive}
                    className="h-12 w-full md:w-40 rounded-2xl bg-gradient-to-r from-teal-500 via-teal-600 to-emerald-600 text-white font-semibold flex items-center justify-center gap-2 shadow-md shadow-teal-500/10 hover:shadow-lg hover:shadow-teal-500/20 transition-all cursor-pointer flex-shrink-0"
                  >
                    {planningActive ? (
                      <>
                        <Loader2 className="w-4 h-4 animate-spin" /> Analyzing
                      </>
                    ) : (
                      <>
                        <Play className="w-4 h-4 fill-white" /> Compile Plan
                      </>
                    )}
                  </button>
                </div>

                {/* Suggestions Row */}
                <div className="flex gap-2.5 flex-wrap">
                  {["React / Next.js", "Docker & DevOps", "Machine Learning & AI"].map((tag) => (
                    <button
                      key={tag}
                      type="button"
                      onClick={() => setDreamInput(tag)}
                      className="text-[10px] font-bold text-teal-600 bg-teal-50 hover:bg-teal-100/70 border border-teal-100 px-3 py-1 rounded-full cursor-pointer"
                    >
                      + {tag}
                    </button>
                  ))}
                </div>
              </form>

              {/* Analyzed Result Panel */}
              <AnimatePresence>
                {goalData && (
                  <motion.div
                    initial={{ opacity: 0, y: 15 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="grid grid-cols-1 lg:grid-cols-12 gap-6 mt-2"
                  >
                    {/* Left Column: Metrics & Skill progress */}
                    <div className="lg:col-span-5 flex flex-col gap-6">
                      
                      {/* Target Skill Header */}
                      <div className="bg-white border border-slate-200/60 p-6 rounded-3xl flex flex-col gap-1 text-left">
                        <span className="text-[9px] text-teal-500 font-black uppercase tracking-widest">Active Study Goal</span>
                        <h3 className="text-2xl font-black text-slate-800 dark:text-slate-100 tracking-tight">{goalData.targetSkill}</h3>
                      </div>

                      {/* Estimated Readiness Card */}
                      <div className="bg-white border border-slate-200/60 p-6 rounded-3xl flex flex-col gap-3 text-left">
                        <div className="flex items-center gap-2 text-teal-600">
                          <Clock className="w-5 h-5" />
                          <span className="text-xs font-bold uppercase tracking-wider">Estimated Timeframe</span>
                        </div>
                        <h3 className="text-xl font-extrabold text-slate-800">{goalData.estimatedTime}</h3>
                        <p className="text-xs text-slate-400 leading-relaxed">Generated weekly learning allocations based on matching {profile.skills.length} of your current core skills.</p>
                      </div>

                      {/* Required Skills Checklist */}
                      <div className="bg-white border border-slate-200/60 p-6 rounded-3xl flex flex-col gap-4 text-left">
                        <h4 className="font-extrabold text-slate-800 text-base">Required Core Skill Set</h4>
                        <div className="flex flex-col gap-3">
                          {goalData.requiredSkills.map((sk) => (
                            <div key={sk.name} className="flex flex-col gap-1.5">
                              <div className="flex justify-between items-center text-xs">
                                <span className="font-bold text-slate-700">{sk.name}</span>
                                <span className="text-[10px] font-bold text-teal-600">{sk.progress}% Ready</span>
                              </div>
                              <div className="w-full bg-slate-100 h-1.5 rounded-full overflow-hidden">
                                <div 
                                  className="bg-teal-500 h-full rounded-full"
                                  style={{ width: `${sk.progress}%` }}
                                />
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>

                    </div>

                    {/* Right Column: Weekly Roadmap checklist */}
                    <div className="lg:col-span-7 flex flex-col gap-6">
                      <div className="bg-white border border-slate-200/60 p-6 rounded-3xl flex flex-col gap-4 text-left">
                        <h4 className="font-extrabold text-slate-800 text-base flex items-center gap-2">
                          <CheckSquare className="w-5 h-5 text-teal-500" />
                          Weekly Roadmap & Tasks
                        </h4>

                        <div className="flex flex-col gap-4">
                          {goalData.weeklyPlan.map((week, idx) => (
                            <div key={idx} className="border-l-2 border-teal-100 pl-4 py-1 flex flex-col gap-2">
                              <span className="text-xs font-black text-teal-600 uppercase tracking-widest">{week.week}</span>
                              <div className="flex flex-col gap-1.5">
                                {week.tasks.map((task, tIdx) => (
                                  <label key={tIdx} className="flex items-start gap-2.5 text-xs text-slate-600 font-medium cursor-pointer">
                                    <input type="checkbox" className="mt-0.5 rounded border-slate-300 text-teal-600 focus:ring-teal-500" />
                                    <span>{task}</span>
                                  </label>
                                ))}
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>
                    </div>

                  </motion.div>
                )}
              </AnimatePresence>
            </motion.div>
          )}

          {/* TAB 5: ANTI-MATCHING JOBS */}
          {activeTab === "antijobs" && (
            <motion.div 
              initial={{ opacity: 0, y: 15 }} 
              animate={{ opacity: 1, y: 0 }}
              className="flex flex-col gap-6 text-left"
            >
              <div>
                <h2 className="text-2xl font-extrabold text-slate-900">Anti-Matching Recommendations</h2>
                <p className="text-slate-500 text-sm mt-1">These positions represent low matching scores because of missing prerequisite stacks. Use suggested actions to close the loop.</p>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {antiJobs.map((job) => (
                  <div key={job.id} className="glass-card glow-border p-6 rounded-3xl flex flex-col gap-5 text-left border-rose-100 shadow-md">
                    
                    {/* Header */}
                    <div className="flex justify-between items-start">
                      <div className="flex flex-col gap-1">
                        <span className="text-[10px] font-black text-rose-500 uppercase tracking-widest bg-rose-50 px-2 py-0.5 rounded-full self-start">Critical Skill Gap</span>
                        <h3 className="font-extrabold text-slate-800 text-lg">{job.role}</h3>
                        <span className="text-xs text-slate-400 font-semibold">{job.companyName}</span>
                      </div>
                      
                      {/* Red Match Circle */}
                      <div className="w-12 h-12 rounded-full border-2 border-rose-200 flex flex-col items-center justify-center bg-rose-50">
                        <span className="text-sm font-black text-rose-600">{job.matchScore}%</span>
                      </div>
                    </div>

                    {/* Mismatch reason */}
                    <div className="p-3 bg-slate-50 border border-slate-100 rounded-xl flex items-start gap-2 text-xs">
                      <Info className="w-4 h-4 text-slate-400 shrink-0 mt-0.5" />
                      <p className="text-slate-600 font-medium">{job.reason}</p>
                    </div>

                    {/* Missing Skills chips */}
                    <div className="flex flex-col gap-2">
                      <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Missing Tech Stacks</span>
                      <div className="flex flex-wrap gap-1">
                        {job.missingSkills.map((sk) => (
                          <span key={sk} className="text-xs font-bold text-rose-600 bg-rose-50 border border-rose-100 px-2.5 py-0.5 rounded-md">
                            ✖ {sk}
                          </span>
                        ))}
                      </div>
                    </div>

                    {/* Roadmap suggestions */}
                    <div className="flex flex-col gap-2 border-t border-slate-100 pt-4 mt-1">
                      <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider flex items-center gap-1">
                        <Lightbulb className="w-3.5 h-3.5 text-orange-400" /> Suggestions to Improve
                      </span>
                      <ul className="flex flex-col gap-1.5 text-xs text-slate-600 font-medium">
                        {job.suggestions.map((sug, sIdx) => (
                          <li key={sIdx} className="flex items-start gap-1.5">
                            <span className="text-orange-400 mt-0.5 font-bold">•</span>
                            <span>{sug}</span>
                          </li>
                        ))}
                      </ul>
                    </div>

                  </div>
                ))}
              </div>
            </motion.div>
          )}



          {/* TAB 7: RESUME */}
          {activeTab === "resume" && (
            <motion.div 
              initial={{ opacity: 0, y: 15 }} 
              animate={{ opacity: 1, y: 0 }}
              className="flex flex-col gap-6 text-left"
            >
              <div>
                <h2 className="text-2xl font-extrabold text-slate-900">Resume Detail & Parser Index</h2>
                <p className="text-slate-500 text-sm mt-1">Verify parsed telemetry nodes extracted from your latest document.</p>
              </div>

              <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
                
                {/* Resume summary */}
                <div className="lg:col-span-5 flex flex-col gap-6">
                  
                  {/* File card */}
                  <div className="bg-white border border-slate-200/60 p-6 rounded-3xl text-left flex flex-col gap-4">
                    <div className="flex items-center gap-3">
                      <div className="w-11 h-11 rounded-xl bg-teal-50 border border-teal-100 flex items-center justify-center text-teal-600">
                        <FileText className="w-5.5 h-5.5" />
                      </div>
                      <div className="min-w-0 flex-1">
                        <h4 className="text-sm font-bold text-slate-800 truncate">{uploadedFile?.name || "Lalith_Kumar_Resume.pdf"}</h4>
                        <span className="text-[10px] text-slate-400 font-semibold">{uploadedFile?.size || "45.2 KB"} • Parsed successfully</span>
                      </div>
                    </div>

                    <button 
                      onClick={() => router.push("/upload")}
                      className="w-full py-2.5 rounded-xl border border-slate-200 hover:bg-slate-50 text-slate-700 text-xs font-bold transition-all flex items-center justify-center gap-2 cursor-pointer"
                    >
                      <RefreshCw className="w-3.5 h-3.5 text-teal-500" /> Replace Resume Document
                    </button>
                  </div>

                  {/* Resume score breakdown */}
                  <div className="bg-white border border-slate-200/60 p-6 rounded-3xl text-left flex flex-col gap-4">
                    <h3 className="font-extrabold text-slate-800 text-base">Resume Telemetry Score</h3>
                    <div className="flex items-center gap-4 border-b border-slate-50 pb-4">
                      <div className="w-16 h-16 rounded-full border-4 border-teal-500 flex flex-col items-center justify-center shadow-md">
                        <span className="text-lg font-black text-teal-600">{resumeScore}</span>
                      </div>
                      <div className="flex flex-col text-left gap-0.5">
                        <span className="text-xs font-bold text-slate-800">Excellent Matching Readiness</span>
                        <p className="text-[10px] text-slate-400 max-w-[200px]">Add cloud deployments and testing details to hit score targets (90+).</p>
                      </div>
                    </div>

                    <div className="flex flex-col gap-3">
                      {[
                        { factor: "Skills Index Match", score: 92 },
                        { factor: "Project Complexity Value", score: 85 },
                        { factor: "Academic Weight Coefficient", score: 91 },
                        { factor: "GitHub/Social Validation", score: 80 }
                      ].map((item, idx) => (
                        <div key={idx} className="flex justify-between items-center text-xs font-semibold text-slate-700">
                          <span>{item.factor}</span>
                          <span className="text-teal-600">{item.score}%</span>
                        </div>
                      ))}
                    </div>
                  </div>

                </div>

                {/* Extracted Details */}
                <div className="lg:col-span-7 flex flex-col gap-6">
                  <div className="bg-white border border-slate-200/60 p-6 rounded-3xl text-left flex flex-col gap-5">
                    
                    <div>
                      <h4 className="font-extrabold text-slate-800 text-base">Parsed Data Nodes</h4>
                      <p className="text-slate-400 text-xs mt-0.5">Raw nodes indexed by Agent 3 parser compiler.</p>
                    </div>

                    <div className="flex flex-col gap-4 text-xs">
                      
                      <div className="flex flex-col gap-2">
                        <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Identified Skills</span>
                        <div className="flex flex-wrap gap-1.5">
                          {profile.skills.map((sk) => (
                            <span key={sk} className="text-xs font-semibold text-slate-700 bg-slate-50 border border-slate-200/70 px-2.5 py-1 rounded-lg">
                              {sk}
                            </span>
                          ))}
                        </div>
                      </div>

                      <div className="flex flex-col gap-2 border-t border-slate-50 pt-4">
                        <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Indexed Project Entities</span>
                        {profile.parsedResume?.projects && profile.parsedResume.projects.length > 0 ? (
                          <ul className="flex flex-col gap-2 text-slate-650 dark:text-slate-400 font-semibold list-disc pl-4">
                            {profile.parsedResume.projects.map((proj: any, idx: number) => (
                              <li key={idx}>
                                <span className="text-slate-800 dark:text-slate-200 font-bold">{proj.name}:</span> {proj.description}
                              </li>
                            ))}
                          </ul>
                        ) : (
                          <p className="text-xs text-slate-500">No project entities extracted from document.</p>
                        )}
                      </div>

                      <div className="flex flex-col gap-2 border-t border-slate-50 pt-4">
                        <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Academics Parsed</span>
                        {profile.parsedResume?.education && profile.parsedResume.education.length > 0 ? (
                          <div className="flex flex-col gap-3">
                            {profile.parsedResume.education.map((edu: any, idx: number) => (
                              <div key={idx} className="grid grid-cols-2 gap-3 text-slate-650 dark:text-slate-400 font-semibold bg-slate-50 dark:bg-slate-850 p-3.5 rounded-xl border border-slate-100 dark:border-slate-800/50">
                                <div className="truncate">University: <span className="text-slate-800 dark:text-slate-250 font-bold">{edu.institution || "N/A"}</span></div>
                                <div className="truncate">Degree: <span className="text-slate-800 dark:text-slate-250 font-bold">{edu.degree || "N/A"}</span></div>
                                <div className="truncate">Graduation: <span className="text-slate-800 dark:text-slate-250 font-bold">{edu.year || "N/A"}</span></div>
                                <div className="truncate">CGPA: <span className="text-slate-800 dark:text-slate-250 font-bold">{edu.gpa || "N/A"}</span></div>
                              </div>
                            ))}
                          </div>
                        ) : (
                          <div className="grid grid-cols-2 gap-3 text-slate-650 dark:text-slate-400 font-semibold bg-slate-50 dark:bg-slate-850 p-3.5 rounded-xl border border-slate-100 dark:border-slate-800/50">
                            <div className="truncate">University: <span className="text-slate-800 dark:text-slate-250 font-bold">{profile.college}</span></div>
                            <div className="truncate">Degree: <span className="text-slate-800 dark:text-slate-250 font-bold">{profile.degree}</span></div>
                            <div className="truncate">Department: <span className="text-slate-800 dark:text-slate-250 font-bold">{profile.department}</span></div>
                            <div className="truncate">CGPA: <span className="text-slate-800 dark:text-slate-250 font-bold">{profile.cgpa}/10.0</span></div>
                          </div>
                        )}
                      </div>

                    </div>

                  </div>
                </div>

              </div>
            </motion.div>
          )}

          {/* TAB 8: PROFILE */}
          {activeTab === "profile" && (
            <motion.div 
              initial={{ opacity: 0, y: 15 }} 
              animate={{ opacity: 1, y: 0 }}
              className="flex flex-col gap-6 text-left"
            >
              <div>
                <h2 className="text-2xl font-extrabold text-slate-900">Manage Profile Indices</h2>
                <p className="text-slate-500 text-sm mt-1">Changes made here automatically recalibrate recommended match scores.</p>
              </div>

              <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
                
                {/* Form fields */}
                <div className="lg:col-span-8">
                  <form onSubmit={handleProfileSave} className="bg-white border border-slate-200/60 p-6 md:p-8 rounded-3xl flex flex-col gap-6">
                    
                    <h3 className="font-extrabold text-slate-800 text-base">Academic & Contact Identifiers</h3>
                    
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      
                      <div className="flex flex-col gap-1.5">
                        <label className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">Full Name</label>
                        <input 
                          type="text" 
                          value={editName}
                          onChange={(e) => setEditName(e.target.value)}
                          className="h-11 rounded-xl px-4 text-xs font-semibold text-slate-700 glass-input"
                        />
                      </div>

                      <div className="flex flex-col gap-1.5">
                        <label className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">College Name</label>
                        <input 
                          type="text" 
                          value={editCollege}
                          onChange={(e) => setEditCollege(e.target.value)}
                          className="h-11 rounded-xl px-4 text-xs font-semibold text-slate-700 glass-input"
                        />
                      </div>

                      <div className="flex flex-col gap-1.5">
                        <label className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">Department</label>
                        <input 
                          type="text" 
                          value={editDepartment}
                          onChange={(e) => setEditDepartment(e.target.value)}
                          className="h-11 rounded-xl px-4 text-xs font-semibold text-slate-700 glass-input"
                        />
                      </div>

                      <div className="flex flex-col gap-1.5">
                        <label className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">CGPA Score</label>
                        <input 
                          type="text" 
                          value={editCgpa}
                          onChange={(e) => setEditCgpa(e.target.value)}
                          className="h-11 rounded-xl px-4 text-xs font-semibold text-slate-700 glass-input"
                        />
                      </div>

                    </div>

                    <div className="flex gap-3 justify-end border-t border-slate-100 pt-5">
                      <button
                        type="submit"
                        className="px-5 py-2.5 rounded-xl bg-teal-500 text-white text-xs font-bold hover:bg-teal-600 transition-all flex items-center gap-1.5 shadow-sm shadow-teal-100 cursor-pointer"
                      >
                        <Save className="w-3.5 h-3.5" /> Save Changes
                      </button>
                    </div>

                  </form>
                </div>

                {/* Skills configuration */}
                <div className="lg:col-span-4 flex flex-col gap-6">
                  
                  {/* Skills Editor card */}
                  <div className="bg-white border border-slate-200/60 p-6 rounded-3xl flex flex-col gap-4 text-left">
                    <div>
                      <h4 className="font-extrabold text-slate-800 text-base">Skills Ledger</h4>
                      <p className="text-[10px] text-slate-400 mt-0.5">Remove or append skills items to dynamic weights.</p>
                    </div>

                    {/* Skill chips */}
                    <div className="flex flex-wrap gap-1.5 min-h-[80px] p-3 rounded-2xl bg-slate-50 border border-slate-100">
                      {profile.skills.map((sk) => (
                        <span 
                          key={sk}
                          className="inline-flex items-center gap-1 text-[10px] font-bold text-teal-600 bg-teal-50/70 border border-teal-100 px-2 py-0.5 rounded-md"
                        >
                          {sk}
                          <button 
                            type="button" 
                            onClick={() => removeSkill(sk)}
                            className="p-0.5 rounded-full hover:bg-indigo-100"
                          >
                            <X className="w-3 h-3 text-teal-400" />
                          </button>
                        </span>
                      ))}
                    </div>

                    {/* Quick Add */}
                    <form onSubmit={handleAddSkillLocal} className="flex gap-2">
                      <input 
                        type="text" 
                        placeholder="Append new skill..."
                        value={newSkillText}
                        onChange={(e) => setNewSkillText(e.target.value)}
                        className="h-10 rounded-xl px-3 text-xs font-semibold text-slate-700 glass-input flex-1"
                      />
                      <button
                        type="submit"
                        className="w-10 h-10 rounded-xl bg-teal-50 border border-teal-100 text-teal-600 flex items-center justify-center hover:bg-indigo-100 transition-all cursor-pointer"
                      >
                        <Plus className="w-4 h-4" />
                      </button>
                    </form>
                  </div>

                </div>

              </div>
            </motion.div>
          )}

          {/* TAB 9: SETTINGS */}
          {activeTab === "settings" && (
            <motion.div 
              initial={{ opacity: 0, y: 15 }} 
              animate={{ opacity: 1, y: 0 }}
              className="flex flex-col gap-6 text-left"
            >
              <div>
                <h2 className="text-2xl font-extrabold text-slate-900">System Preferences</h2>
                <p className="text-slate-500 text-sm mt-1">Configure background scheduler frequencies and API authorization tokens.</p>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                
                {/* Notifications card */}
                <div className="bg-white border border-slate-200/60 p-6 rounded-3xl flex flex-col gap-4 text-left">
                  <h4 className="font-extrabold text-slate-800 text-sm border-b border-slate-50 pb-2">Scheduler & Alerts</h4>
                  
                  <div className="flex flex-col gap-4 text-xs font-semibold text-slate-600">
                    <label className="flex items-center justify-between cursor-pointer">
                      <span>Enable Hourly Crawling</span>
                      <input type="checkbox" defaultChecked className="w-4 h-4 rounded text-teal-600 border-slate-350" />
                    </label>
                    
                    <label className="flex items-center justify-between cursor-pointer">
                      <span>Email Recommendations Digest</span>
                      <input type="checkbox" defaultChecked className="w-4 h-4 rounded text-teal-600 border-slate-350" />
                    </label>

                    <label className="flex items-center justify-between cursor-pointer">
                      <span>Missing Skill Alerts (Telemetry)</span>
                      <input type="checkbox" defaultChecked className="w-4 h-4 rounded text-teal-600 border-slate-350" />
                    </label>
                  </div>
                </div>

                {/* API Keys */}
                <div className="bg-white border border-slate-200/60 p-6 rounded-3xl flex flex-col gap-4 text-left">
                  <h4 className="font-extrabold text-slate-800 text-sm border-b border-slate-50 pb-2">Model Access & Webhooks</h4>
                  
                  <div className="flex flex-col gap-3 text-xs">
                    <div className="flex flex-col gap-1.5">
                      <span className="font-bold text-slate-500">API Sandbox Endpoint</span>
                      <input type="text" readOnly value="https://api.vtp.com/v1/sandbox/telemetry" className="h-10 px-3 bg-slate-50 border border-slate-100 rounded-xl text-slate-500 font-semibold select-all" />
                    </div>

                    <div className="flex flex-col gap-1.5">
                      <span className="font-bold text-slate-500">Webhook Target Key</span>
                      <input type="password" readOnly value="sk_test_51Pq34a2e5d12r" className="h-10 px-3 bg-slate-50 border border-slate-100 rounded-xl text-slate-500 font-semibold select-all" />
                    </div>
                  </div>
                </div>

              </div>
            </motion.div>
          )}

        </main>
      </div>

      {/* JOB DETAIL POPUP MODAL */}
      <AnimatePresence>
        {selectedJob && (
          <>
            <div 
              className="fixed inset-0 bg-slate-900/10 backdrop-blur-xs z-50 cursor-pointer"
              onClick={() => setSelectedJob(null)}
            />
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 20 }}
              className="fixed inset-x-6 bottom-6 md:inset-auto md:left-1/2 md:top-1/2 md:-translate-x-1/2 md:-translate-y-1/2 md:w-[600px] bg-white border border-slate-250 shadow-2xl rounded-3xl p-6 z-55 text-left flex flex-col gap-5"
            >
              {/* Header */}
              <div className="flex justify-between items-start">
                <div className="flex items-center gap-3">
                  <div className="w-12 h-12 rounded-xl bg-slate-50 border border-slate-100 flex items-center justify-center text-xl shadow-xs">
                    {selectedJob.companyLogo}
                  </div>
                  <div className="min-w-0">
                    <h3 className="font-black text-slate-800 text-lg leading-snug">{selectedJob.role}</h3>
                    <span className="text-xs text-slate-500 font-bold">{selectedJob.companyName} • {selectedJob.location}</span>
                  </div>
                </div>
                
                <button 
                  onClick={() => setSelectedJob(null)}
                  className="p-1 rounded-lg hover:bg-slate-50 border border-transparent hover:border-slate-100"
                >
                  <X className="w-5 h-5 text-slate-500" />
                </button>
              </div>

              {/* Match Score Indicator */}
              <div className="p-3.5 bg-teal-50/50 border border-teal-100 rounded-2xl flex items-center justify-between text-xs">
                <div className="flex items-center gap-2">
                  <Sparkles className="w-4 h-4 text-teal-500 animate-pulse" />
                  <span className="font-bold text-slate-800">Agent Recommendation Fit</span>
                </div>
                <span className="font-black text-teal-600 bg-white border border-teal-100 px-3 py-1 rounded-full">{selectedJob.matchScore}% Match</span>
              </div>

              {/* Description */}
              <div className="flex flex-col gap-2 text-xs">
                <span className="font-bold text-slate-400 uppercase tracking-wider">Role Overview</span>
                <p className="text-slate-600 leading-relaxed font-medium">{selectedJob.description}</p>
              </div>

              {/* Skills breakdown */}
              <div className="grid grid-cols-2 gap-4 text-xs pt-2 border-t border-slate-50">
                <div className="flex flex-col gap-2 text-left">
                  <span className="font-bold text-slate-400 uppercase tracking-wider">Matching Skills</span>
                  <div className="flex flex-wrap gap-1">
                    {selectedJob.matchingSkills.map((sk) => (
                      <span key={sk} className="font-bold text-teal-600 bg-teal-50 border border-teal-100 px-2 py-0.5 rounded-md">
                        {sk}
                      </span>
                    ))}
                  </div>
                </div>
                
                <div className="flex flex-col gap-2 text-left">
                  <span className="font-bold text-slate-400 uppercase tracking-wider">Missing Tech</span>
                  <div className="flex flex-wrap gap-1">
                    {selectedJob.missingSkills.length === 0 ? (
                      <span className="text-[10px] text-teal-600 font-bold bg-teal-50 px-2.5 py-0.5 rounded-md">None! Perfect Fit</span>
                    ) : (
                      selectedJob.missingSkills.map((sk) => (
                        <span key={sk} className="font-bold text-rose-600 bg-rose-50 border border-rose-100 px-2 py-0.5 rounded-md">
                          {sk}
                        </span>
                      ))
                    )}
                  </div>
                </div>
              </div>

              {/* Details table */}
              <div className="grid grid-cols-2 gap-3 text-xs bg-slate-50 p-4 rounded-2xl border border-slate-100">
                <div>Salary Bracket: <span className="text-slate-800 font-bold">{selectedJob.salary}</span></div>
                <div>Experience Target: <span className="text-slate-800 font-bold">{selectedJob.experience}</span></div>
                <div>Job Location: <span className="text-slate-800 font-bold">{selectedJob.location}</span></div>
                <div>Listing Age: <span className="text-slate-800 font-bold">{selectedJob.postedTime}</span></div>
              </div>

              {/* Bottom buttons */}
              <div className="flex items-center gap-3.5 border-t border-slate-100 pt-4 mt-1.5">
                <button
                  onClick={() => {
                    toggleSaveJob(selectedJob.id);
                  }}
                  className={`w-12 h-11 border rounded-xl flex items-center justify-center transition-all cursor-pointer ${savedJobs.includes(selectedJob.id) ? "bg-teal-50 border-teal-200 text-teal-500" : "bg-white border-slate-200 hover:bg-slate-50 text-slate-500"}`}
                >
                  <Bookmark className="w-5 h-5" />
                </button>
                
                <button
                  onClick={() => {
                    handleApply(selectedJob);
                    setSelectedJob(null);
                  }}
                  className="flex-1 h-11 bg-gradient-to-r from-teal-500 via-indigo-500 to-emerald-600 hover:shadow-md text-white text-xs font-bold rounded-xl flex items-center justify-center gap-2 cursor-pointer"
                >
                  <Send className="w-4 h-4" /> Apply for Vacancy
                </button>
              </div>

            </motion.div>
          </>
        )}
      </AnimatePresence>

    </div>
  );
}

interface JobCardProps {
  job: Job;
  onDetails: (job: Job) => void;
  onApply: (job: Job) => void;
  onSave: (jobId: string) => void;
  isSaved: boolean;
}

function JobCard({ job, onDetails, onApply, onSave, isSaved }: JobCardProps) {
  return (
    <div className="bg-white border border-slate-200/60 p-5 rounded-3xl flex flex-col md:flex-row md:items-center justify-between gap-6 shadow-xs hover:border-slate-350 transition-all text-left relative">
      
      {/* Left section: company logo & details */}
      <div className="flex items-center gap-4 flex-1">
        <div className="w-12 h-12 rounded-xl bg-slate-50 border border-slate-100 flex items-center justify-center text-xl shadow-xs shrink-0">
          {job.companyLogo}
        </div>
        <div className="min-w-0 flex-1">
          <h4 className="font-extrabold text-slate-800 text-sm leading-snug">{job.role}</h4>
          <p className="text-xs text-slate-500 font-semibold mt-0.5">{job.companyName} • {job.location}</p>
          
          {/* Matching skills indicators */}
          <div className="flex flex-wrap gap-1.5 mt-2.5">
            {job.matchingSkills.map((sk) => (
              <span key={sk} className="text-[10px] font-bold text-teal-600 bg-teal-50/70 border border-teal-100 px-2 py-0.5 rounded">
                {sk}
              </span>
            ))}
            {job.missingSkills.map((sk) => (
              <span key={sk} className="text-[10px] font-semibold text-rose-500 bg-rose-50/40 border border-rose-100/50 px-2 py-0.5 rounded">
                {sk}
              </span>
            ))}
          </div>
        </div>
      </div>

      {/* Right section: Match score & Actions */}
      <div className="flex items-center gap-6 self-end md:self-center">
        
        {/* Match Circle */}
        <div className="flex flex-col gap-0.5 text-center shrink-0">
          <span className="text-[9px] font-bold text-slate-400 uppercase tracking-wider">Agent Fit</span>
          <div className="w-11 h-11 rounded-full border-2 border-teal-400 flex items-center justify-center bg-teal-50/30">
            <span className="text-xs font-black text-teal-600">{job.matchScore}%</span>
          </div>
        </div>

        {/* Buttons */}
        <div className="flex items-center gap-2">
          <button
            onClick={() => onSave(job.id)}
            className={`w-9 h-9 border rounded-xl flex items-center justify-center cursor-pointer transition-all ${isSaved ? "bg-teal-50 border-teal-200 text-teal-500" : "bg-white border-slate-200 hover:bg-slate-50 text-slate-500"}`}
          >
            <Bookmark className="w-4.5 h-4.5" />
          </button>
          
          <button
            onClick={() => onDetails(job)}
            className="px-3.5 h-9 border border-slate-200 hover:bg-slate-50 text-xs font-bold text-slate-700 rounded-xl transition-all flex items-center gap-1 cursor-pointer"
          >
            <Eye className="w-3.5 h-3.5 text-teal-500" /> Details
          </button>
          
          <button
            onClick={() => onApply(job)}
            className="px-3.5 h-9 bg-teal-500 text-white text-xs font-bold rounded-xl hover:bg-teal-600 transition-all flex items-center gap-1 cursor-pointer"
          >
            <Send className="w-3 h-3" /> Apply
          </button>
        </div>

      </div>

    </div>
  );
}

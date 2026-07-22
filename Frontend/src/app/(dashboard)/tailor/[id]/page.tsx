"use client";

import React from "react";
import { useParams, useRouter } from "next/navigation";
import { useSession } from "@/store/SessionContext";
import { DiffViewer } from "@/components/DiffViewer";
import { 
  ArrowLeft, Sparkles, Briefcase, Zap, 
  LayoutDashboard, LogOut
} from "lucide-react";
import { toast } from "sonner";

export default function TailorPage() {
  const params = useParams();
  const router = useRouter();
  const { jobs, profile, theme } = useSession();
  
  const jobId = params.id as string;
  const job = jobs.find(j => j.id === jobId) || jobs[0];

  // Tailored Bullet points diff simulation based on the job
  const diffData = [
    {
      original: "Developed web application interfaces in React and HTML5 for various client tasks.",
      tailored: `Engineered highly responsive frontend application modules using React, Next.js, and TypeScript, aligning with the ${job.companyName} target stack and boosting UI performance metrics by 22%.`,
      reason: `Explicitly emphasizes Next.js and TypeScript frameworks mentioned in ${job.companyName} requirements and adds quantitative success metrics.`
    },
    {
      original: "Managed backend databases, queries, and server scripts to store data.",
      tailored: "Architected microservices, REST APIs, and database triggers utilizing Node.js and Express, reducing database query latencies by 14%.",
      reason: "Changes passive language to active voice and defines concrete tools used."
    },
    {
      original: "Collaborated with design teams to structure user flows and check alignments.",
      tailored: "Refactored user-experience routes using Framer Motion animations and CSS variables, increasing consumer click-through rates by 9.5%.",
      reason: "Highlights design implementation assets and interactive UI styling skills."
    }
  ];

  const handleLogout = () => {
    toast.success("Logged out successfully.");
    router.push("/");
  };

  const handleDownload = () => {
    toast.success("Preparing PDF Download...", {
      description: `Injecting tailored bullets optimized for ${job.companyName} into document template...`
    });
  };

  return (
    <div className="flex-1 min-h-screen flex neu-bg font-sans relative select-none text-slate-100 transition-colors duration-300">
      
      {/* Background radial overlays */}
      <div className="absolute top-0 right-0 w-[45%] h-[40%] rounded-full bg-gradient-to-br from-sky-500/5 to-indigo-500/5 blur-[120px] pointer-events-none" />
      <div className="absolute bottom-0 left-0 w-[40%] h-[40%] rounded-full bg-gradient-to-tr from-purple-500/5 to-teal-500/5 blur-[130px] pointer-events-none" />

      {/* SIDEBAR NAVIGATION (Desktop) */}
      <aside className="hidden lg:flex flex-col w-64 h-screen fixed left-0 top-0 neu-sidebar-bg border-r border-slate-200/60 p-6 gap-8 z-30 shadow-2xl">
        <div className="flex items-center gap-3">
          <div className={`w-9 h-9 rounded-xl flex items-center justify-center text-white font-bold bg-gradient-to-tr ${theme === "light" ? "from-sky-500 to-indigo-500" : "from-indigo-600 to-purple-600"} shadow-md border-none neu-circle`}>
            A
          </div>
          <span className="text-lg font-bold text-slate-200">AuraJobs</span>
        </div>

        {/* User Quick Info */}
        <div className="flex items-center gap-3 p-3 rounded-2xl border-none neu-pressed">
          <div className="w-9 h-9 rounded-full bg-gradient-to-tr from-sky-400 to-indigo-500 text-white font-black flex items-center justify-center text-xs neu-circle border-none">
            {profile.fullName.substring(0, 2).toUpperCase()}
          </div>
          <div className="min-w-0 flex-1 text-left">
            <h4 className="text-xs font-black text-slate-250 truncate leading-tight">{profile.fullName}</h4>
            <span className="text-[9px] text-slate-400 uppercase tracking-widest font-black truncate block mt-0.5">{profile.department}</span>
          </div>
        </div>

        {/* Menu Items */}
        <nav className="flex-1 flex flex-col gap-1.5">
          <button 
            onClick={() => router.push("/dashboard")}
            className="flex items-center gap-3 px-4 py-3 text-xs font-bold rounded-xl transition-all text-left text-slate-400 hover:text-slate-200 neu-button border-none mb-1.5"
          >
            <LayoutDashboard className="w-4 h-4 text-sky-400" />
            <span>Dashboard Home</span>
          </button>

          <button 
            onClick={() => router.push(`/job/${jobId}`)}
            className="flex items-center gap-3 px-4 py-3 text-xs font-bold rounded-xl transition-all text-left text-slate-400 hover:text-slate-200 neu-button border-none"
          >
            <Briefcase className="w-4 h-4" />
            <span>Job Dossier</span>
          </button>
        </nav>

        {/* Bottom Actions */}
        <div className="flex flex-col gap-2 border-t border-slate-800/40 pt-4">
          <button 
            onClick={handleLogout}
            className="flex items-center gap-3 px-4 py-3 text-xs font-bold text-slate-400 hover:text-rose-400 rounded-xl transition-all text-left neu-button border-none"
          >
            <LogOut className="w-4 h-4" />
            <span>Logout</span>
          </button>
        </div>
      </aside>

      {/* MAIN CONTENT AREA */}
      <div className="flex-1 flex flex-col min-w-0 relative z-25 lg:pl-64">
        
        {/* HEADER BAR */}
        <header className="sticky top-0 z-35 w-full neu-header-bg border-b border-slate-200/60 h-16 flex items-center justify-between px-6 shadow-md">
          <button 
            onClick={() => router.push(`/job/${jobId}`)}
            className="flex items-center gap-1 text-xs font-bold text-slate-300 hover:text-slate-100 cursor-pointer border-none bg-transparent"
          >
            <ArrowLeft className="w-4 h-4" /> Back to Dossier
          </button>
          
          <div className="flex items-center gap-3">
            <span className="text-[10px] uppercase font-black tracking-widest text-slate-400">Tailoring ID: {jobId}</span>
          </div>
        </header>

        {/* SCROLLABLE BODY */}
        <main className="flex-1 overflow-y-auto p-6 md:p-8 flex flex-col gap-6 max-w-5xl mx-auto w-full">
          
          {/* Header Description */}
          <div className="flex flex-col gap-2 text-left">
            <div className="flex items-center gap-2">
              <Zap className="w-5 h-5 text-sky-400" />
              <h1 className="text-xl md:text-2xl font-black text-slate-150 tracking-tight">AI Resume Tailoring Panel</h1>
            </div>
            <p className="text-slate-400 text-xs font-semibold max-w-2xl leading-relaxed">
              We parsed your CV against the required stack at <span className="text-slate-200">{job.companyName}</span> ({job.role}). Accept or revert specific bullet points to customize your output.
            </p>
          </div>

          {/* Split screen DiffViewer */}
          <div className="p-6 md:p-8 rounded-3xl border-none neu-card flex flex-col gap-6">
            <div className="flex items-center gap-2 text-left border-b border-slate-800/40 pb-4">
              <Sparkles className="w-5 h-5 text-indigo-400" />
              <div>
                <h3 className="font-extrabold text-slate-200 text-xs uppercase tracking-wider">Split-Screen Bullet point Optimizer</h3>
                <p className="text-slate-400 text-xs mt-0.5">Toggle accept to save the optimized copy or click download to print.</p>
              </div>
            </div>

            <DiffViewer diffData={diffData} onDownload={handleDownload} />
          </div>

        </main>
      </div>

    </div>
  );
}

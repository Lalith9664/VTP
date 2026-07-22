"use client";

import React, { useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { useSession } from "@/store/SessionContext";
import { MatchHeatmap } from "@/components/MatchHeatmap";
import { 
  ArrowLeft, Sparkles, Award, Briefcase, Zap, 
  MapPin, DollarSign, Calendar, LayoutDashboard,
  LogOut, ChevronRight
} from "lucide-react";
import { toast } from "sonner";

export default function JobDetailPage() {
  const params = useParams();
  const router = useRouter();
  const { jobs, profile, theme } = useSession();
  
  const jobId = params.id as string;
  const job = jobs.find(j => j.id === jobId) || jobs[0];

  // ATS alignment calculation from matching scores
  const atsScore = job.matchScore || 75;

  const handleTailor = () => {
    router.push(`/tailor/${jobId}`);
  };

  const handleLogout = () => {
    toast.success("Logged out successfully.");
    router.push("/");
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
            onClick={() => router.push("/dashboard")}
            className="flex items-center gap-3 px-4 py-3 text-xs font-bold rounded-xl transition-all text-left text-sky-400 neu-pressed border-none"
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
            onClick={() => router.push("/dashboard")}
            className="flex items-center gap-1 text-xs font-bold text-slate-300 hover:text-slate-100 cursor-pointer border-none bg-transparent"
          >
            <ArrowLeft className="w-4 h-4" /> Back to Dashboard
          </button>
          
          <div className="flex items-center gap-3">
            <span className="text-[10px] uppercase font-black tracking-widest text-slate-400">Dossier ID: {jobId}</span>
          </div>
        </header>

        {/* SCROLLABLE BODY */}
        <main className="flex-1 overflow-y-auto p-6 md:p-8 flex flex-col gap-8 max-w-6xl mx-auto w-full">
          
          {/* Hero Job Banner - Neumorphic Card */}
          <div className="p-6 md:p-8 rounded-3xl border-none neu-card flex flex-col md:flex-row justify-between items-start md:items-center gap-6">
            <div className="flex items-center gap-5 text-left">
              <div className="w-16 h-16 rounded-2xl bg-white border border-slate-100 flex items-center justify-center text-3xl shadow-md shrink-0">
                {job.companyLogo}
              </div>
              <div>
                <span className="text-[10px] font-black tracking-widest text-teal-400 uppercase bg-teal-500/10 px-3 py-1 rounded-full border border-teal-500/20">
                  {job.experience} Role
                </span>
                <h1 className="text-xl md:text-2xl font-black text-slate-200 tracking-tight mt-2.5 leading-snug">{job.role}</h1>
                <p className="text-slate-400 text-xs font-bold mt-1">{job.companyName} • {job.location}</p>
              </div>
            </div>

            <button 
              onClick={handleTailor}
              className="px-6 py-3 rounded-xl bg-gradient-to-r from-sky-400 to-indigo-500 hover:from-sky-500 hover:to-indigo-650 text-white font-black text-xs flex items-center gap-2 shadow-md hover:shadow-sky-500/20 border-none cursor-pointer group active:scale-[0.99] shrink-0"
            >
              <Zap className="w-4 h-4 group-hover:scale-110 transition-transform" />
              Tailor My Resume <ChevronRight className="w-4 h-4" />
            </button>
          </div>

          {/* Double Grid: ATS Score Gauge & Overview details */}
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
            
            {/* ATS Score Gauge (circular progress) */}
            <div className="lg:col-span-4 p-6 rounded-3xl border-none neu-card flex flex-col items-center justify-center gap-4 text-center">
              <h3 className="font-extrabold text-slate-200 text-xs uppercase tracking-wider">ATS Alignment Score</h3>
              
              <div className="relative w-40 h-40 flex items-center justify-center my-2">
                {/* SVG Progress Circle */}
                <svg className="w-full h-full transform -rotate-90" viewBox="0 0 100 100">
                  <circle 
                    cx="50" 
                    cy="50" 
                    r="40" 
                    stroke="currentColor" 
                    strokeWidth="8" 
                    className="text-slate-800/40" 
                    fill="transparent" 
                  />
                  <circle 
                    cx="50" 
                    cy="50" 
                    r="40" 
                    stroke="currentColor" 
                    strokeWidth="8" 
                    className="text-teal-400" 
                    strokeDasharray="251.2"
                    strokeDashoffset={251.2 - (251.2 * atsScore) / 100}
                    strokeLinecap="round"
                    fill="transparent" 
                  />
                </svg>
                <div className="absolute flex flex-col items-center justify-center">
                  <span className="text-3xl font-black text-slate-100 tracking-tighter">{atsScore}%</span>
                  <span className="text-[9px] uppercase font-bold text-slate-400 tracking-wider">Matched</span>
                </div>
              </div>

              <div className="flex items-center gap-1.5 text-xs text-slate-455 font-semibold leading-snug px-3 py-1.5 rounded-full neu-pressed border-none">
                <Award className="w-4 h-4 text-teal-400 shrink-0" />
                <span>Strong credentials matching found</span>
              </div>
            </div>

            {/* Quick Details */}
            <div className="lg:col-span-8 p-6 rounded-3xl border-none neu-card flex flex-col gap-5 text-left">
              <h3 className="font-extrabold text-slate-200 text-xs uppercase tracking-wider border-b border-slate-800/40 pb-2">Intelligence Dossier</h3>
              
              <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                <div className="p-4 rounded-2xl border-none neu-pressed flex flex-col gap-1">
                  <span className="text-[9px] font-bold text-slate-500 uppercase tracking-widest">Base Salary</span>
                  <span className="text-xs font-black text-slate-250 flex items-center gap-1 mt-1">
                    <DollarSign className="w-3.5 h-3.5 text-sky-400" /> {job.salary}
                  </span>
                </div>
                <div className="p-4 rounded-2xl border-none neu-pressed flex flex-col gap-1">
                  <span className="text-[9px] font-bold text-slate-500 uppercase tracking-widest">Job Category</span>
                  <span className="text-xs font-black text-slate-250 flex items-center gap-1 mt-1">
                    <Briefcase className="w-3.5 h-3.5 text-indigo-400" /> {job.experience}
                  </span>
                </div>
                <div className="p-4 rounded-2xl border-none neu-pressed flex flex-col gap-1">
                  <span className="text-[9px] font-bold text-slate-500 uppercase tracking-widest">Scraped Date</span>
                  <span className="text-xs font-black text-slate-250 flex items-center gap-1 mt-1">
                    <Calendar className="w-3.5 h-3.5 text-teal-400" /> 1 day ago
                  </span>
                </div>
              </div>

              <div className="flex flex-col gap-2">
                <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Required Profile</span>
                <p className="text-xs text-slate-350 leading-relaxed">
                  We scanned the company database. Candidates should have robust core algorithms, API pipelines, clean architectures, and modern web frameworks knowledge.
                </p>
              </div>
            </div>

          </div>

          {/* Skill Heatmap section */}
          <div className="p-6 md:p-8 rounded-3xl border-none neu-card flex flex-col gap-6">
            <div className="flex items-center gap-2 text-left border-b border-slate-800/40 pb-4">
              <Sparkles className="w-5 h-5 text-indigo-400" />
              <div>
                <h3 className="font-extrabold text-slate-200 text-sm uppercase tracking-wider">Agent Comparative Heatmap</h3>
                <p className="text-slate-400 text-xs mt-0.5">Required job stack matched with parsed assets in your uploaded CV.</p>
              </div>
            </div>

            <MatchHeatmap 
              jobSkills={[...(job.matchingSkills || []), ...(job.missingSkills || [])]}
              userSkills={profile.skills || ["React", "TypeScript", "HTML5", "CSS3", "JavaScript"]}
            />
          </div>

        </main>
      </div>

    </div>
  );
}

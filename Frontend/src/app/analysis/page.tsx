"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import { 
  Network, Cpu, Database, Search, ArrowRight, ShieldCheck, CheckCircle2,
  ArrowLeft
} from "lucide-react";
import { useSession } from "@/store/SessionContext";
import { FloatingLines } from "@/components/FloatingLines";

interface AgentStep {
  id: number;
  name: string;
  role: string;
  status: "idle" | "running" | "completed";
  progress: number;
  log: string;
  icon: React.ReactNode;
}

export default function AnalysisPage() {
  const router = useRouter();
  const { theme, toggleTheme } = useSession();
  
  const [agents, setAgents] = useState<AgentStep[]>([
    { 
      id: 1, 
      name: "[Collector]", 
      role: "Job Vacancy Collector", 
      status: "idle", 
      progress: 0,
      log: "Connecting to jobs database...",
      icon: <Database className="w-5 h-5" /> 
    },
    { 
      id: 2, 
      name: "[Semantic Parser]", 
      role: "Skill Matrix Transformer", 
      status: "idle", 
      progress: 0, 
      log: "Waiting for collection completion...",
      icon: <Cpu className="w-5 h-5" /> 
    },
    { 
      id: 3, 
      name: "[Skill Analyst]", 
      role: "Resume Vector Analyzer", 
      status: "idle", 
      progress: 0, 
      log: "Waiting for skill matrix extraction...",
      icon: <Search className="w-5 h-5" /> 
    },
    { 
      id: 4, 
      name: "[Matcher Engine]", 
      role: "Optimal Fit Recommender", 
      status: "idle", 
      progress: 0, 
      log: "Waiting for profile match score mapping...",
      icon: <Network className="w-5 h-5" /> 
    }
  ]);

  const [activeAgentIndex, setActiveAgentIndex] = useState(0);
  const [totalProgress, setTotalProgress] = useState(0);

  useEffect(() => {
    if (activeAgentIndex < agents.length) {
      // Set current agent to running
      setAgents((prev) => 
        prev.map((agent, idx) => 
          idx === activeAgentIndex ? { ...agent, status: "running", log: getActiveLog(agent.id) } : agent
        )
      );

      // Simulate progress counting
      let progressVal = 0;
      const interval = setInterval(() => {
        progressVal += 20;
        setAgents((prev) => 
          prev.map((agent, idx) => 
            idx === activeAgentIndex 
              ? { 
                  ...agent, 
                  progress: progressVal, 
                  log: getProgressLog(agent.id, progressVal) 
                } 
              : agent
          )
        );

        if (progressVal >= 100) {
          clearInterval(interval);
          setAgents((prev) => 
            prev.map((agent, idx) => 
              idx === activeAgentIndex ? { ...agent, status: "completed", progress: 100, log: "Task completed successfully." } : agent
            )
          );
          setActiveAgentIndex((prev) => prev + 1);
        }
      }, 500);

      return () => clearInterval(interval);
    }
  }, [activeAgentIndex]);

  // Update total progress
  useEffect(() => {
    const sum = agents.reduce((acc, curr) => acc + curr.progress, 0);
    setTotalProgress(Math.floor(sum / agents.length));
  }, [agents]);

  // Handle proceed
  const handleProceed = () => {
    if (totalProgress < 100) return;
    router.push("/dashboard");
  };

  const getActiveLog = (id: number) => {
    switch (id) {
      case 1: return "Parsing API endpoints for fresher roles...";
      case 2: return "Extracting skill matrices and job requirements...";
      case 3: return "Comparing candidate skill vectors against job nodes...";
      case 4: return "Drafting study roadmaps and saving matching positions...";
      default: return "Initializing agent...";
    }
  };

  const getProgressLog = (id: number, val: number) => {
    if (val < 40) {
      return id === 1 ? "Establishing connection to database..." :
             id === 2 ? "Compiling token lists..." :
             id === 3 ? "Loading candidate vector indices..." :
             "Indexing missing skills...";
    } else if (val < 80) {
      return id === 1 ? "Filtering entries based on degree requirements..." :
             id === 2 ? "Normalizing terminology definitions..." :
             id === 3 ? "Calculating cosine similarity values..." :
             "Comparing domain tags...";
    } else {
      return id === 1 ? "Saving 34 matchable listings..." :
             id === 2 ? "Finalizing skill catalog..." :
             id === 3 ? "Completing matching scores matrix..." :
             "Preparing personalized study guide...";
    }
  };

  return (
    <div className="flex-1 min-h-screen neu-bg flex flex-col items-center justify-center p-6 relative overflow-hidden select-none text-slate-100">
      
      {/* Background Particles Network */}
      <FloatingLines />

      {/* Back to Upload Button */}
      <Link 
        href="/upload"
        className="absolute top-8 left-6 z-30 flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold neu-button transition-all text-slate-400 hover:text-teal-400 border-none cursor-pointer"
      >
        <ArrowLeft className="w-4 h-4" />
        Back
      </Link>

      {/* Theme Toggle Switch */}
      <button
        onClick={toggleTheme}
        className="absolute top-8 right-10 lg:right-16 z-30 w-16 h-8.5 rounded-full transition-colors duration-300 flex items-center px-0.5 focus:outline-none cursor-pointer border-none bg-slate-150 dark:bg-slate-900/60 neu-pressed"
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

      {/* Background blurs */}
      <div className="absolute top-[10%] left-[-10%] w-[400px] h-[400px] rounded-full bg-teal-500/5 blur-[120px] pointer-events-none" />
      <div className="absolute bottom-[10%] right-[-10%] w-[400px] h-[400px] rounded-full bg-purple-500/5 blur-[120px] pointer-events-none" />
      
      <div className="w-full max-w-4xl flex flex-col gap-8 relative z-10">
        
        {/* Title Header */}
        <div className="flex flex-col items-center text-center gap-2">
          <img src="/logo.jpeg" alt="VTP Logo" className="w-12 h-12 rounded-xl object-cover shadow-md border-none neu-circle mb-2" />
          <h2 className="text-2xl font-black text-slate-900 dark:text-slate-100 tracking-tight">AI Agent Pipeline</h2>
          <p className="text-slate-500 dark:text-slate-400 text-xs font-semibold max-w-md">Our multi-agent autonomous system is matching your resume with crawled software job vacancies.</p>
        </div>

        {/* Global Progress Bar - Neumorphic Panel */}
        <div className="w-full bg-slate-50 dark:bg-[#111827]/75 backdrop-blur-md border border-slate-200/80 dark:border-slate-800/80 p-6 rounded-3xl flex flex-col gap-3.5 shadow-xl">
          <div className="flex items-center justify-between text-xs font-bold text-slate-700 dark:text-slate-300">
            <span>Overall Analysis Status</span>
            <span className="text-teal-600 dark:text-teal-400 font-black">{totalProgress}%</span>
          </div>
          <div className="w-full bg-slate-200 dark:bg-[#111827] h-2.5 rounded-full overflow-hidden neu-pressed">
            <div 
              className="bg-gradient-to-r from-teal-500 via-indigo-500 to-teal-500 dark:from-teal-400 dark:via-indigo-500 dark:to-teal-400 h-full rounded-full transition-all duration-300 progress-glow"
              style={{ width: `${totalProgress}%` }}
            />
          </div>
        </div>

        {/* Agent Cards Connected Layout */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 relative">
          {agents.map((agent, index) => {
            const isCompleted = agent.status === "completed";
            const isRunning = agent.status === "running";
            
            return (
              <div key={agent.id} className="relative flex flex-col items-center">
                {/* Individual Agent Card - Neumorphic Raised Box */}
                <div 
                  className={`w-full bg-slate-50 dark:bg-[#111827]/75 backdrop-blur-md border border-slate-200/80 dark:border-slate-800/80 p-5 rounded-3xl flex flex-col items-center gap-4 text-center h-full relative shadow-lg ${isRunning ? "ring-1 ring-sky-400/20 shadow-sky-500/5" : ""}`}
                >
                  {/* Status Indicator circle */}
                  <div 
                    className={`w-11 h-11 rounded-full flex items-center justify-center border transition-all ${isCompleted ? "text-teal-500 bg-teal-50 dark:bg-teal-950/20 border-teal-300 dark:border-teal-800/30" : isRunning ? "text-teal-600 bg-sky-50 dark:bg-sky-950/20 border-sky-300 dark:border-sky-800/30 shadow-inner" : "text-slate-400 bg-slate-100 dark:bg-[#172033] border-slate-200 dark:border-slate-850 shadow-inner"}`}
                  >
                    {isCompleted ? (
                      <CheckCircle2 className="w-5 h-5" />
                    ) : (
                      agent.icon
                    )}
                  </div>

                  <div className="flex flex-col items-center gap-1.5 flex-1">
                    <span className={`text-[10px] font-black uppercase tracking-wider ${isCompleted ? "text-teal-600 dark:text-teal-400" : isRunning ? "text-teal-650 dark:text-teal-400" : "text-slate-400 dark:text-slate-500"}`}>
                      {agent.name}
                    </span>
                    <h4 className="text-xs font-bold text-slate-850 dark:text-slate-200">{agent.role}</h4>
                    <p className="text-[10px] text-slate-500 dark:text-slate-400 leading-relaxed min-h-[40px] px-1">{agent.log}</p>
                  </div>

                  {/* Micro Progress Bar inside each agent card */}
                  {isRunning && (
                    <div className="w-full bg-slate-200 dark:bg-[#111827] h-1 rounded-full mt-3 overflow-hidden neu-pressed">
                      <div 
                        className="bg-teal-550 dark:bg-teal-400 h-full rounded-full transition-all duration-300"
                        style={{ width: `${agent.progress}%` }}
                      />
                    </div>
                  )}

                  {/* Pulse active glow rings */}
                  {isRunning && (
                    <span className="absolute top-3 right-3 w-2.5 h-2.5 rounded-full bg-teal-500 dark:bg-teal-400 animate-ping" />
                  )}
                </div>

                {/* Connected Glowing Lines */}
                {index < 3 && (
                  <div className="hidden md:block absolute top-1/2 right-[-20px] w-8 h-0.5 bg-gradient-to-r from-teal-550 to-emerald-550 dark:from-teal-500 dark:to-emerald-500 opacity-20 z-0 pointer-events-none" />
                )}
              </div>
            );
          })}
        </div>

        {/* Control Button Actions */}
        <div className="flex justify-center mt-4">
          <button
            onClick={handleProceed}
            disabled={totalProgress < 100}
            className={`px-8 py-4 rounded-2xl font-bold flex items-center justify-center gap-2 shadow-md transition-all cursor-pointer border ${totalProgress < 100 ? "bg-slate-100 dark:bg-[#172033]/85 text-slate-400 dark:text-slate-600 border-slate-200 dark:border-slate-800/80 cursor-not-allowed shadow-none" : "bg-gradient-to-r from-teal-500 to-emerald-500 hover:from-teal-400 hover:to-emerald-400 text-white shadow-teal-500/10 hover:-translate-y-0.5 border border-teal-400/20"}`}
          >
            Launch Automation Dashboard
            <ArrowRight className="w-4 h-4" />
          </button>
        </div>
      </div>

    </div>
  );
}

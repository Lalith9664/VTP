"use client";

import React, { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import { 
  Network, Cpu, Database, Search, ArrowRight, ShieldCheck, CheckCircle2
} from "lucide-react";
import { useSession } from "@/store/SessionContext";

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
  
  const [agents, setAgents] = useState<AgentStep[]>([
    { 
      id: 1, 
      name: "Agent 1 [Collector]", 
      role: "Job Vacancy Collector", 
      status: "idle", 
      progress: 0, 
      log: "Connecting to jobs database...",
      icon: <Database className="w-5 h-5" /> 
    },
    { 
      id: 2, 
      name: "Agent 2 [Semantic Parser]", 
      role: "Skill Matrix Transformer", 
      status: "idle", 
      progress: 0, 
      log: "Waiting for collection completion...",
      icon: <Cpu className="w-5 h-5" /> 
    },
    { 
      id: 3, 
      name: "Agent 3 [Skill Analyst]", 
      role: "Resume Vector Analyzer", 
      status: "idle", 
      progress: 0, 
      log: "Waiting for skill matrix extraction...",
      icon: <Search className="w-5 h-5" /> 
    },
    { 
      id: 4, 
      name: "Agent 4 [Matcher Engine]", 
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
      
      {/* Background blurs */}
      <div className="absolute top-[10%] left-[-10%] w-[400px] h-[400px] rounded-full bg-sky-500/5 blur-[120px] pointer-events-none" />
      <div className="absolute bottom-[10%] right-[-10%] w-[400px] h-[400px] rounded-full bg-purple-500/5 blur-[120px] pointer-events-none" />
      <div className="absolute inset-0 grid-pattern pointer-events-none opacity-30" />

      <div className="w-full max-w-4xl flex flex-col gap-8 relative z-10">
        
        {/* Title Header */}
        <div className="flex flex-col items-center text-center gap-2">
          <div className="w-9 h-9 rounded-xl bg-gradient-to-tr from-sky-400 to-indigo-500 flex items-center justify-center text-white font-bold mb-2 shadow-md shadow-sky-500/10 neu-circle border-none">
            A
          </div>
          <h2 className="text-2xl font-black text-slate-100 tracking-tight">AI Agent Pipeline</h2>
          <p className="text-slate-400 text-xs font-semibold max-w-md">Our multi-agent autonomous system is matching your resume with crawled software job vacancies.</p>
        </div>

        {/* Global Progress Bar - Neumorphic Panel */}
        <div className="w-full neu-card p-6 rounded-3xl flex flex-col gap-3.5 border-none">
          <div className="flex items-center justify-between text-xs font-bold text-slate-300">
            <span>Overall Analysis Status</span>
            <span className="text-sky-400 font-black">{totalProgress}%</span>
          </div>
          <div className="w-full bg-[#111827] h-2.5 rounded-full overflow-hidden neu-pressed">
            <div 
              className="bg-gradient-to-r from-sky-400 via-indigo-500 to-teal-400 h-full rounded-full transition-all duration-300 progress-glow"
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
                  className={`w-full neu-card p-5 rounded-3xl flex flex-col items-center gap-4 border-none text-center h-full relative ${isRunning ? "ring-1 ring-sky-400/20 shadow-sky-500/5" : ""}`}
                >
                  {/* Status Indicator circle */}
                  <div 
                    className={`w-11 h-11 rounded-full flex items-center justify-center neu-circle border-none ${isCompleted ? "text-teal-400 bg-teal-950/20" : isRunning ? "text-sky-400 bg-sky-950/20" : "text-slate-600 bg-[#172033]"}`}
                  >
                    {isCompleted ? (
                      <CheckCircle2 className="w-5 h-5" />
                    ) : (
                      agent.icon
                    )}
                  </div>

                  <div className="flex flex-col items-center gap-1.5 flex-1">
                    <span className={`text-[10px] font-black uppercase tracking-wider ${isCompleted ? "text-teal-400" : isRunning ? "text-sky-400" : "text-slate-500"}`}>
                      {agent.name.split(" ")[0]} {agent.name.split(" ")[1]}
                    </span>
                    <h4 className="text-xs font-bold text-slate-200">{agent.role}</h4>
                    <p className="text-[10px] text-slate-400 leading-relaxed min-h-[40px] px-1">{agent.log}</p>
                  </div>

                  {/* Micro Progress Bar inside each agent card */}
                  {isRunning && (
                    <div className="w-full bg-[#111827] h-1 rounded-full mt-3 overflow-hidden neu-pressed">
                      <div 
                        className="bg-sky-400 h-full rounded-full transition-all duration-300"
                        style={{ width: `${agent.progress}%` }}
                      />
                    </div>
                  )}

                  {/* Pulse active glow rings */}
                  {isRunning && (
                    <span className="absolute top-3 right-3 w-2.5 h-2.5 rounded-full bg-sky-400 animate-ping" />
                  )}
                </div>

                {/* Connected Glowing Lines */}
                {index < 3 && (
                  <div className="hidden md:block absolute top-1/2 right-[-20px] w-8 h-0.5 bg-gradient-to-r from-sky-500 to-indigo-500 opacity-20 z-0 pointer-events-none" />
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
            className={`px-8 py-4 rounded-2xl font-bold flex items-center justify-center gap-2 shadow-md transition-all cursor-pointer border-none ${totalProgress < 100 ? "bg-[#172033] text-slate-600 cursor-not-allowed shadow-none" : "bg-gradient-to-r from-sky-500 to-indigo-500 hover:from-sky-400 hover:to-indigo-400 text-white shadow-sky-500/10 hover:-translate-y-0.5 border border-sky-400/20"}`}
          >
            Launch Automation Dashboard
            <ArrowRight className="w-4 h-4" />
          </button>
        </div>
      </div>

    </div>
  );
}

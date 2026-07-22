"use client";

import React, { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import { 
  FileText, Sparkles, Code, GraduationCap, 
  Layers, UserCheck, CheckCircle2
} from "lucide-react";
import { useSession } from "@/store/SessionContext";

interface ScanLog {
  id: number;
  text: string;
  category: "skills" | "projects" | "education" | "experience" | "github" | "graph";
  done: boolean;
  values?: string[];
}

export default function ResumeScanPage() {
  const router = useRouter();
  const { uploadedFile } = useSession();
  
  const [logs, setLogs] = useState<ScanLog[]>([
    { id: 1, text: "Reading Skills...", category: "skills", done: false, values: ["React", "Next.js", "TypeScript", "Node.js", "Python", "FastAPI"] },
    { id: 2, text: "Extracting Project details...", category: "projects", done: false, values: ["AI Agent Portal", "E-commerce Engine", "Portfolio Site"] },
    { id: 3, text: "Parsing Academic History...", category: "education", done: false, values: ["NIT", "Computer Science", "CGPA 9.1"] },
    { id: 4, text: "Evaluating Experience blocks...", category: "experience", done: false, values: ["Software Engineer Intern"] },
    { id: 5, text: "Fetching GitHub profile data...", category: "github", done: false, values: ["github.com/lalithkumar"] },
    { id: 6, text: "Building AI Skill Graph...", category: "graph", done: false }
  ]);

  const [activeLogIndex, setActiveLogIndex] = useState(0);
  const [completed, setCompleted] = useState(false);

  useEffect(() => {
    if (activeLogIndex < logs.length) {
      const timer = setTimeout(() => {
        setLogs((prev) => 
          prev.map((log, idx) => 
            idx === activeLogIndex ? { ...log, done: true } : log
          )
        );
        setActiveLogIndex((prev) => prev + 1);
      }, 1000);
      return () => clearTimeout(timer);
    } else {
      const finishTimer = setTimeout(() => {
        setCompleted(true);
      }, 500);

      const redirectTimer = setTimeout(() => {
        router.push("/analysis");
      }, 3000);

      return () => {
        clearTimeout(finishTimer);
        clearTimeout(redirectTimer);
      };
    }
  }, [activeLogIndex, logs.length, router]);

  return (
    <div className="flex-1 min-h-screen neu-bg flex flex-col items-center justify-center p-6 relative overflow-hidden select-none text-slate-100">
      
      {/* Background blurs */}
      <div className="absolute top-[10%] left-[-10%] w-[400px] h-[400px] rounded-full bg-sky-500/5 blur-[130px] pointer-events-none" />
      <div className="absolute bottom-[10%] right-[-10%] w-[400px] h-[400px] rounded-full bg-purple-500/5 blur-[130px] pointer-events-none" />
      <div className="absolute inset-0 grid-pattern pointer-events-none opacity-30" />

      <div className="w-full max-w-4xl grid grid-cols-1 md:grid-cols-12 gap-8 items-center relative z-10">
        
        {/* Left column: Resume document scanning simulation */}
        <div className="md:col-span-6 flex flex-col items-center">
          <div className="relative w-full max-w-[320px] aspect-[1/1.4] bg-[#1A2336] rounded-3xl border-none shadow-2xl overflow-hidden p-6 flex flex-col gap-4 neu-card">
            
            {/* The Scanning Laser Line */}
            <div className="absolute left-0 right-0 h-1 bg-gradient-to-r from-transparent via-sky-400 to-transparent laser-beam z-20 shadow-[0_0_15px_rgba(56,189,248,0.8)]" />

            {/* Document Mock Elements */}
            <div className="flex items-center gap-3 border-b border-slate-800 pb-4">
              <div className="w-10 h-10 rounded-full bg-[#172033] flex items-center justify-center text-slate-400 font-bold neu-circle border-none">L</div>
              <div className="flex-1 flex flex-col gap-1.5">
                <div className="h-3 w-24 bg-[#172033] rounded-full" />
                <div className="h-2 w-36 bg-[#172033]/55 rounded-full" />
              </div>
            </div>

            <div className="flex flex-col gap-1.5">
              <div className="h-2 w-16 bg-[#172033] rounded-full" />
              <div className="flex flex-wrap gap-1 mt-1">
                <div className="h-4 w-12 bg-[#172033]/50 rounded-lg" />
                <div className="h-4 w-16 bg-[#172033]/50 rounded-lg" />
                <div className="h-4 w-10 bg-[#172033]/50 rounded-lg" />
                <div className="h-4 w-14 bg-sky-950/20 text-[10px] text-sky-400 border border-sky-850/50 rounded-lg flex items-center justify-center font-bold px-2">React</div>
              </div>
            </div>

            <div className="flex flex-col gap-2 mt-2">
              <div className="h-2 w-20 bg-[#172033] rounded-full" />
              <div className="p-3 bg-[#172033]/40 rounded-xl border border-slate-800/30 flex flex-col gap-1.5">
                <div className="h-2 w-28 bg-[#172033]/50 rounded-full" />
                <div className="h-1.5 w-full bg-[#172033]/30 rounded-full" />
                <div className="h-1.5 w-5/6 bg-[#172033]/30 rounded-full" />
              </div>
            </div>

            <div className="flex flex-col gap-2 mt-2">
              <div className="h-2 w-24 bg-[#172033] rounded-full" />
              <div className="p-3 bg-[#172033]/40 rounded-xl border border-slate-800/30 flex flex-col gap-1.5">
                <div className="h-2 w-20 bg-[#172033]/50 rounded-full" />
                <div className="h-1.5 w-full bg-[#172033]/30 rounded-full" />
              </div>
            </div>

            <div className="absolute inset-0 bg-[var(--background)]/5 pointer-events-none" />
          </div>
        </div>

        {/* Right column: Live extraction logs */}
        <div className="md:col-span-6 flex flex-col items-start gap-6 text-left">
          
          <div className="flex flex-col gap-1">
            <div className="flex items-center gap-2">
              <Sparkles className="w-5 h-5 text-sky-400 animate-pulse" />
              <span className="text-[10px] font-bold text-sky-400 uppercase tracking-widest">Aura Parser</span>
            </div>
            <h2 className="text-2xl font-black text-slate-100 tracking-tight">AuraJobs Extractor</h2>
            <p className="text-slate-400 text-xs mt-1 font-semibold">Reading data structure from uploaded file: <span className="font-semibold text-slate-200">{uploadedFile?.name || "resume.pdf"}</span></p>
          </div>

          {/* Logs Card - Neumorphic Card */}
          <div className="w-full neu-card p-6 rounded-3xl flex flex-col gap-3 min-h-[300px] justify-between relative border-none">
            <AnimatePresence>
              {!completed ? (
                <motion.div 
                  key="logs-view"
                  className="flex flex-col gap-3.5"
                  initial={{ opacity: 1 }}
                  exit={{ opacity: 0, y: -10 }}
                >
                  {logs.map((log, idx) => {
                    const isActive = idx === activeLogIndex;
                    const isDone = log.done;
                    
                    return (
                      <div 
                        key={log.id} 
                        className={`flex items-start gap-3 transition-opacity duration-300 ${(!isDone && !isActive) ? "opacity-20" : "opacity-100"}`}
                      >
                        <div className="mt-0.5">
                          {isDone ? (
                            <CheckCircle2 className="w-4 h-4 text-teal-400 flex-shrink-0" />
                          ) : isActive ? (
                            <span className="w-4 h-4 rounded-full border-2 border-sky-400 border-t-transparent animate-spin block flex-shrink-0" />
                          ) : (
                            <div className="w-4 h-4 rounded-full border border-slate-700 flex-shrink-0" />
                          )}
                        </div>
                        <div className="flex-1 min-w-0">
                          <span className={`text-xs font-bold ${isDone ? "text-slate-200" : isActive ? "text-sky-400 font-black" : "text-slate-500"}`}>
                            {log.text}
                          </span>
                          
                          {/* Extracted Values animation - Neumorphic small chips */}
                          {isDone && log.values && (
                            <motion.div 
                              initial={{ opacity: 0, height: 0 }}
                              animate={{ opacity: 1, height: "auto" }}
                              className="flex flex-wrap gap-1.5 mt-1.5"
                            >
                              {log.values.map((val) => (
                                <span 
                                  key={val}
                                  className="text-[10px] font-bold text-teal-450 bg-[#172033] px-2.5 py-1 rounded-lg shadow-sm border border-slate-800/40"
                                >
                                  ✔ {val}
                                </span>
                              ))}
                            </motion.div>
                          )}
                        </div>
                      </div>
                    );
                  })}
                </motion.div>
              ) : (
                // Success State
                <motion.div 
                  key="success-view"
                  initial={{ opacity: 0, scale: 0.95 }}
                  animate={{ opacity: 1, scale: 1 }}
                  className="flex-1 flex flex-col items-center justify-center text-center py-10 gap-4"
                >
                  <motion.div
                    initial={{ scale: 0 }}
                    animate={{ scale: [0, 1.2, 1] }}
                    transition={{ duration: 0.5 }}
                    className="w-16 h-16 rounded-full bg-teal-950/20 border border-teal-800 flex items-center justify-center text-teal-400 neu-circle"
                  >
                    <CheckCircle2 className="w-10 h-10" />
                  </motion.div>
                  <div className="flex flex-col gap-1">
                    <h3 className="text-lg font-black text-slate-100">Resume Successfully Processed</h3>
                    <p className="text-slate-400 text-xs mt-1 font-semibold">Starting AI multi-agent recommendation engine...</p>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        </div>

      </div>

    </div>
  );
}

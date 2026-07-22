"use client";

import React, { useState, useCallback, useEffect, useRef } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useDropzone } from "react-dropzone";
import { motion, AnimatePresence } from "framer-motion";
import { 
  UploadCloud, FileText, Trash2, RefreshCw, ArrowRight,
  ShieldCheck, CheckCircle2, Sparkles, ArrowLeft
} from "lucide-react";
import { toast } from "sonner";
import { useSession } from "@/store/SessionContext";
import { FloatingLines } from "@/components/FloatingLines";
import { analyzeResume } from "@/lib/api";

interface ScanLog {
  id: number;
  text: string;
  category: "skills" | "projects" | "education" | "experience" | "github" | "graph";
  done: boolean;
  values?: string[];
}

export default function ResumeUploadPage() {
  const router = useRouter();
  const { setUploadedFile, theme, toggleTheme } = useSession();
  
  const [file, setFile] = useState<{ name: string; size: number; raw: File } | null>(null);
  const [uploading, setUploading] = useState(false);
  const [progress, setProgress] = useState(0);

  // Scanning simulation states
  const [isScanning, setIsScanning] = useState(false);
  const [logs, setLogs] = useState<ScanLog[]>([
    { id: 1, text: "Parsing PDF text layers...", category: "skills", done: false },
    { id: 2, text: "Extracting Skills & Technologies...", category: "skills", done: false },
    { id: 3, text: "Parsing Education & Projects...", category: "education", done: false },
    { id: 4, text: "Evaluating Experience sections...", category: "experience", done: false },
    { id: 5, text: "Generating ATS resume embedding...", category: "github", done: false },
    { id: 6, text: "Uploading to secure storage & building AI profile...", category: "graph", done: false }
  ]);
  const [activeLogIndex, setActiveLogIndex] = useState(0);
  const [completed, setCompleted] = useState(false);
  const [apiError, setApiError] = useState<string | null>(null);
  const apiResultRef = useRef<any>(null);
  const apiCallStarted = useRef(false);

  // Start real API call as soon as scanning begins
  useEffect(() => {
    if (!isScanning || apiCallStarted.current || !file?.raw) return;
    apiCallStarted.current = true;
    
    analyzeResume(file.raw)
      .then((result) => {
        apiResultRef.current = result;
        // Inject real extracted values into log chips
        const skills = result.resume_details?.skills || [];
        const projects = (result.resume_details?.projects || []).map((p: any) => p.name);
        const edu = (result.resume_details?.education || []).map((e: any) => e.institution || e.degree);
        const exp = (result.resume_details?.experience || []).map((e: any) => e.title);
        
        setLogs((prev) => prev.map((log) => {
          if (log.id === 2 && skills.length) return { ...log, values: skills.slice(0, 6) };
          if (log.id === 3 && (projects.length || edu.length)) return { ...log, values: [...edu.slice(0,2), ...projects.slice(0,2)] };
          if (log.id === 4 && exp.length) return { ...log, values: exp.slice(0, 2) };
          return log;
        }));
      })
      .catch((err) => {
        console.error("Resume analysis failed:", err);
        setApiError(err.message || "Analysis failed");
      });
  }, [isScanning, file]);

  // Sequential scanning animation trigger
  useEffect(() => {
    if (!isScanning) return;
    if (activeLogIndex < logs.length) {
      const timer = setTimeout(() => {
        setLogs((prev) => 
          prev.map((log, idx) => 
            idx === activeLogIndex ? { ...log, done: true } : log
          )
        );
        setActiveLogIndex((prev) => prev + 1);
      }, 1200);
      return () => clearTimeout(timer);
    } else {
      // Wait for API to finish before redirecting
      const finishTimer = setTimeout(() => {
        setCompleted(true);
      }, 500);

      const redirectTimer = setTimeout(() => {
        if (apiResultRef.current) {
          router.push("/resume-detail");
        } else if (apiError) {
          toast.error("Resume analysis failed — redirecting to analysis page.");
          router.push("/analysis");
        } else {
          // API still in flight — wait a bit more
          const waitMore = setTimeout(() => router.push("/resume-detail"), 3000);
          return () => clearTimeout(waitMore);
        }
      }, 2500);

      return () => {
        clearTimeout(finishTimer);
        clearTimeout(redirectTimer);
      };
    }
  }, [isScanning, activeLogIndex, logs.length, router, apiError]);

  const onDrop = useCallback((acceptedFiles: File[]) => {
    if (acceptedFiles.length === 0) return;
    
    const selectedFile = acceptedFiles[0];
    if (selectedFile.size > 10 * 1024 * 1024) {
      toast.error("File exceeds maximum size limit of 10 MB.");
      return;
    }

    setFile({ name: selectedFile.name, size: selectedFile.size, raw: selectedFile });
    setUploading(true);
    setProgress(0);

    // Simulate progress upload
    const interval = setInterval(() => {
      setProgress((prev) => {
        if (prev >= 100) {
          clearInterval(interval);
          setUploading(false);
          toast.success("File ready — click Analyze to start AI processing!");
          return 100;
        }
        return prev + 10;
      });
    }, 150);
  }, []);

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: {
      "application/pdf": [".pdf"],
      "application/vnd.openxmlformats-officedocument.wordprocessingml.document": [".docx"]
    },
    maxFiles: 1,
    multiple: false
  });

  const handleRemove = () => {
    setFile(null);
    setProgress(0);
    setUploading(false);
    apiCallStarted.current = false;
    apiResultRef.current = null;
    toast.info("File removed.");
  };

  const handleProcess = () => {
    if (!file) {
      toast.warning("Please upload a resume first.");
      return;
    }
    
    // Save to context
    const kbSize = (file.size / 1024).toFixed(1);
    setUploadedFile({ name: file.name, size: `${kbSize} KB` });
    
    toast.loading("Starting AI resume intelligence pipeline...", { id: "analyze" });
    setTimeout(() => toast.dismiss("analyze"), 2000);

    // Start scanning animation + real API call simultaneously
    setIsScanning(true);
  };

  return (
    <div className="flex-1 min-h-screen neu-bg flex flex-col items-center justify-center p-6 relative overflow-hidden select-none text-slate-100">
      
      {/* Background Particles Network */}
      <FloatingLines />

      {/* Back to Onboarding Button */}
      <Link 
        href="/onboarding"
        className="absolute top-8 left-6 z-30 flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold neu-button transition-all text-slate-400 hover:text-teal-400 border-none cursor-pointer"
      >
        <ArrowLeft className="w-4 h-4" />
        Back to Onboarding
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
      <div className="absolute top-[20%] left-[-10%] w-[350px] h-[350px] rounded-full bg-teal-500/5 blur-[120px] pointer-events-none" />
      <div className="absolute bottom-[20%] right-[-10%] w-[350px] h-[350px] rounded-full bg-purple-500/5 blur-[120px] pointer-events-none" />
      
      <AnimatePresence mode="wait">
        {!isScanning ? (
          <motion.div 
            key="upload-section"
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            className="w-full max-w-[540px] flex flex-col gap-6 relative z-10"
          >
            {/* Header */}
            <div className="flex flex-col items-center text-center gap-2">
              <img src="/logo.jpeg" alt="VTP Logo" className="w-12 h-12 rounded-xl object-cover shadow-md border-none neu-circle mb-2" />
              <h2 className="text-2xl font-black text-slate-100 tracking-tight">Upload Your Resume</h2>
              <p className="text-slate-400 text-xs font-semibold max-w-sm">Our AI will read your history, extract qualifications, and begin the matching process.</p>
            </div>

            {/* Upload Container - Neumorphic Card */}
            <div className="w-full bg-slate-50 dark:bg-[#111827]/75 backdrop-blur-md border border-slate-200/80 dark:border-slate-800/80 p-8 rounded-3xl flex flex-col gap-6 shadow-xl relative z-10">
              
              <AnimatePresence mode="wait">
                {!file ? (
                  // Drag Area - Neumorphic Pressed Panel
                  <motion.div
                    key="dropzone"
                    initial={{ opacity: 0, scale: 0.95 }}
                    animate={{ opacity: 1, scale: 1 }}
                    exit={{ opacity: 0, scale: 0.95 }}
                    className="w-full"
                  >
                    <div
                      {...getRootProps()}
                      className={`rounded-2xl p-10 flex flex-col items-center justify-center gap-4 text-center cursor-pointer transition-all border border-dashed border-slate-300 dark:border-slate-800/80 bg-slate-100 dark:bg-[#172033]/40 hover:border-teal-500/50 dark:hover:border-teal-400/50 hover:bg-slate-200/40 dark:hover:bg-[#172033]/60 hover:shadow-[0_0_15px_rgba(20,184,166,0.1)]`}
                    >
                      <input {...getInputProps()} />
                      <div className="w-14 h-14 rounded-2xl bg-slate-200 dark:bg-[#1A2336] border border-slate-300 dark:border-slate-800/80 flex items-center justify-center text-teal-500 dark:text-teal-400 shadow-sm neu-circle">
                        <UploadCloud className="w-6 h-6" />
                      </div>
                      <div className="flex flex-col gap-1">
                        <span className="text-xs font-bold text-slate-650 dark:text-slate-300">Drag & drop your resume here, or <span className="text-teal-600 dark:text-teal-400 hover:underline">browse</span></span>
                        <span className="text-[10px] text-slate-400 dark:text-slate-500 font-semibold">Supports PDF, DOCX formats up to 10 MB</span>
                      </div>
                    </div>
                  </motion.div>
                ) : (
                  // File Detail Card - Neumorphic Elevated Box
                  <motion.div
                    key="file-info"
                    initial={{ opacity: 0, scale: 0.98 }}
                    animate={{ opacity: 1, scale: 1 }}
                    exit={{ opacity: 0, scale: 0.98 }}
                    className="p-5 rounded-2xl bg-slate-100 dark:bg-[#172033] border border-slate-200/80 dark:border-slate-800 flex flex-col gap-4 text-left shadow-sm"
                  >
                    <div className="flex items-center gap-3.5">
                      <div className="w-12 h-12 rounded-xl bg-slate-200 dark:bg-[#1A2336] border border-slate-300 dark:border-slate-800/80 flex items-center justify-center text-teal-650 dark:text-teal-400 shadow-sm neu-circle">
                        <FileText className="w-5 h-5" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <h4 className="text-xs font-bold text-slate-805 dark:text-slate-200 truncate">{file.name}</h4>
                        <p className="text-[10px] text-slate-450 dark:text-slate-500 font-semibold mt-0.5">{(file.size / 1024).toFixed(1)} KB • Completed</p>
                      </div>
                      {progress === 100 && (
                        <CheckCircle2 className="w-4 h-4 text-teal-500 dark:text-teal-400 flex-shrink-0" />
                      )}
                    </div>

                    {/* Progress bar */}
                    {uploading && (
                      <div className="flex flex-col gap-1.5 mt-2">
                        <div className="flex items-center justify-between text-[10px] font-bold text-slate-500 dark:text-slate-400">
                          <span>Uploading Resume...</span>
                          <span>{progress}%</span>
                        </div>
                        <div className="w-full bg-slate-200 dark:bg-[#111827] h-1.5 rounded-full overflow-hidden neu-pressed">
                          <div 
                            className="bg-teal-500 dark:bg-teal-400 h-full rounded-full transition-all duration-150 progress-glow"
                            style={{ width: `${progress}%` }}
                          />
                        </div>
                      </div>
                    )}

                    {/* File Controls */}
                    {!uploading && (
                      <div className="flex items-center gap-3 mt-2 pt-3 border-t border-slate-200 dark:border-slate-800/40">
                        <button
                          onClick={handleRemove}
                          className="px-4 py-2 rounded-xl text-[10px] font-bold transition-all flex items-center gap-1.5 cursor-pointer border-none neu-button hover:text-rose-500 dark:hover:text-rose-450 text-slate-650 dark:text-slate-300"
                        >
                          <Trash2 className="w-3.5 h-3.5 text-rose-550 dark:text-rose-500" /> Remove
                        </button>
                        
                        <div {...getRootProps()} className="inline-block">
                          <input {...getInputProps()} />
                          <button
                            className="px-4 py-2 rounded-xl text-[10px] font-bold transition-all flex items-center gap-1.5 cursor-pointer border-none neu-button text-slate-650 dark:text-slate-300"
                          >
                            <RefreshCw className="w-3.5 h-3.5 text-teal-600 dark:text-teal-400" /> Replace
                          </button>
                        </div>
                      </div>
                    )}
                  </motion.div>
                )}
              </AnimatePresence>

              {/* Action buttons */}
              <div className="flex flex-col gap-3.5 border-t border-slate-200 dark:border-slate-800/40 pt-5 mt-2">
                <button
                  onClick={handleProcess}
                  disabled={!file || uploading}
                  className={`w-full h-12 rounded-2xl font-bold flex items-center justify-center gap-2 shadow-md transition-all cursor-pointer border ${(!file || uploading) ? "bg-slate-100 dark:bg-[#172033]/85 text-slate-400 dark:text-slate-600 border-slate-200 dark:border-slate-800/80 cursor-not-allowed shadow-none" : "bg-gradient-to-r from-teal-500 to-emerald-500 hover:from-teal-400 hover:to-emerald-400 text-white shadow-teal-500/10 hover:-translate-y-0.5 border border-teal-400/20"}`}
                >
                  Analyze Resume with VTP
                  <ArrowRight className="w-4 h-4" />
                </button>
              </div>
            </div>

            {/* Security badge */}
            <div className="flex items-center justify-center gap-2 text-[10px] text-slate-500 font-semibold">
              <ShieldCheck className="w-3.5 h-3.5 text-teal-400" />
              <span>Encrypted storage. Data is used solely for agent mapping.</span>
            </div>
          </motion.div>
        ) : (
          <motion.div 
            key="scan-section"
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.95 }}
            className="w-full max-w-4xl grid grid-cols-1 md:grid-cols-12 gap-8 items-center relative z-10"
          >
            {/* Left column: Resume document scanning simulation */}
            <div className="md:col-span-6 flex flex-col items-center">
              <div className="relative w-full max-w-[320px] aspect-[1/1.4] bg-slate-50 dark:bg-[#1A2336] rounded-3xl border border-slate-200 dark:border-slate-800 shadow-2xl overflow-hidden p-6 flex flex-col gap-4">
                
                {/* The Scanning Laser Line */}
                <div className="absolute left-0 right-0 h-1 bg-gradient-to-r from-transparent via-sky-400 to-transparent laser-beam z-20 shadow-[0_0_15px_rgba(56,189,248,0.8)]" />

                {/* Document Mock Elements */}
                <div className="flex items-center gap-3 border-b border-slate-200 dark:border-slate-800 pb-4">
                  <div className="w-10 h-10 rounded-full bg-slate-200 dark:bg-[#172033] flex items-center justify-center text-slate-500 dark:text-slate-400 font-bold neu-circle border border-slate-300 dark:border-slate-800/80">L</div>
                  <div className="flex-1 flex flex-col gap-1.5">
                    <div className="h-3 w-24 bg-slate-200 dark:bg-[#172033] rounded-full" />
                    <div className="h-2 w-36 bg-slate-200/60 dark:bg-[#172033]/55 rounded-full" />
                  </div>
                </div>

                <div className="flex flex-col gap-1.5">
                  <div className="h-2 w-16 bg-slate-200 dark:bg-[#172033] rounded-full" />
                  <div className="flex flex-wrap gap-1 mt-1">
                    <div className="h-4 w-12 bg-slate-200/50 dark:bg-[#172033]/50 rounded-lg border border-slate-200 dark:border-slate-800/60" />
                    <div className="h-4 w-16 bg-slate-200/50 dark:bg-[#172033]/50 rounded-lg border border-slate-200 dark:border-slate-800/60" />
                    <div className="h-4 w-10 bg-slate-200/50 dark:bg-[#172033]/50 rounded-lg border border-slate-200 dark:border-slate-800/60" />
                    <div className="h-4 w-14 bg-sky-950/20 text-[10px] text-teal-500 dark:text-teal-400 border border-sky-850/50 rounded-lg flex items-center justify-center font-bold px-2">React</div>
                  </div>
                </div>

                <div className="flex flex-col gap-2 mt-2">
                  <div className="h-2 w-20 bg-slate-200 dark:bg-[#172033] rounded-full" />
                  <div className="p-3 bg-slate-100/60 dark:bg-[#172033]/40 rounded-xl border border-slate-200 dark:border-slate-800/30 flex flex-col gap-1.5">
                    <div className="h-2 w-28 bg-slate-200/50 dark:bg-[#172033]/50 rounded-full" />
                    <div className="h-1.5 w-full bg-slate-200/30 dark:bg-[#172033]/30 rounded-full" />
                    <div className="h-1.5 w-5/6 bg-slate-200/30 dark:bg-[#172033]/30 rounded-full" />
                  </div>
                </div>

                <div className="flex flex-col gap-2 mt-2">
                  <div className="h-2 w-24 bg-slate-200 dark:bg-[#172033] rounded-full" />
                  <div className="p-3 bg-slate-100/60 dark:bg-[#172033]/40 rounded-xl border border-slate-200 dark:border-slate-800/30 flex flex-col gap-1.5">
                    <div className="h-2 w-20 bg-slate-200/50 dark:bg-[#172033]/50 rounded-full" />
                    <div className="h-1.5 w-full bg-slate-200/30 dark:bg-[#172033]/30 rounded-full" />
                  </div>
                </div>
              </div>
            </div>

            {/* Right column: Live extraction logs */}
            <div className="md:col-span-6 flex flex-col items-start gap-6 text-left">
              
              <div className="flex flex-col gap-1">
                <div className="flex items-center gap-2">
                  <Sparkles className="w-5 h-5 text-teal-550 dark:text-teal-400 animate-pulse" />
                  <span className="text-[10px] font-bold text-teal-600 dark:text-teal-400 uppercase tracking-widest">Aura Parser</span>
                </div>
                <h2 className="text-2xl font-black text-slate-900 dark:text-slate-100 tracking-tight">VTP Extractor</h2>
                <p className="text-slate-500 dark:text-slate-400 text-xs mt-1 font-semibold">Reading data structure from uploaded file: <span className="font-semibold text-slate-800 dark:text-slate-200">{file?.name || "resume.pdf"}</span></p>
              </div>

              {/* Logs Card - Neumorphic Card */}
              <div className="w-full bg-slate-50 dark:bg-[#111827]/75 backdrop-blur-md border border-slate-200/80 dark:border-slate-800/80 p-6 rounded-3xl flex flex-col gap-3 min-h-[300px] justify-between relative shadow-xl">
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
                                <CheckCircle2 className="w-4 h-4 text-teal-500 dark:text-teal-400 flex-shrink-0" />
                              ) : isActive ? (
                                <span className="w-4 h-4 rounded-full border-2 border-teal-500 dark:border-sky-400 border-t-transparent animate-spin block flex-shrink-0" />
                              ) : (
                                <div className="w-4 h-4 rounded-full border border-slate-300 dark:border-slate-700 flex-shrink-0" />
                              )}
                            </div>
                            <div className="flex-1 min-w-0">
                              <span className={`text-xs font-bold ${isDone ? "text-slate-800 dark:text-slate-200" : isActive ? "text-teal-600 dark:text-teal-400 font-black" : "text-slate-400 dark:text-slate-500"}`}>
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
                                      className="text-[10px] font-bold text-teal-600 dark:text-teal-400 bg-slate-200 dark:bg-[#172033] px-2.5 py-1 rounded-lg shadow-sm border border-slate-300 dark:border-slate-800/40"
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
                        className="w-16 h-16 rounded-full bg-teal-50 dark:bg-teal-950/20 border border-teal-600 dark:border-teal-850 flex items-center justify-center text-teal-500 dark:text-teal-400 neu-circle shadow-md"
                      >
                        <CheckCircle2 className="w-10 h-10" />
                      </motion.div>
                      <div className="flex flex-col gap-1">
                        <h3 className="text-lg font-black text-slate-800 dark:text-slate-100">Resume Successfully Processed</h3>
                        <p className="text-slate-500 dark:text-slate-400 text-xs mt-1 font-semibold">Starting AI multi-agent recommendation engine...</p>
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

    </div>
  );
}

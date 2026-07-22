"use client";

import React, { useState, useCallback } from "react";
import { useRouter } from "next/navigation";
import { useDropzone } from "react-dropzone";
import { motion, AnimatePresence } from "framer-motion";
import { 
  UploadCloud, FileText, Trash2, RefreshCw, ArrowRight,
  ShieldCheck, CheckCircle2
} from "lucide-react";
import { toast } from "sonner";
import { useSession } from "@/store/SessionContext";

export default function ResumeUploadPage() {
  const router = useRouter();
  const { setUploadedFile } = useSession();
  
  const [file, setFile] = useState<{ name: string; size: number } | null>(null);
  const [uploading, setUploading] = useState(false);
  const [progress, setProgress] = useState(0);

  const onDrop = useCallback((acceptedFiles: File[]) => {
    if (acceptedFiles.length === 0) return;
    
    const selectedFile = acceptedFiles[0];
    if (selectedFile.size > 10 * 1024 * 1024) {
      toast.error("File exceeds maximum size limit of 10 MB.");
      return;
    }

    setFile({ name: selectedFile.name, size: selectedFile.size });
    setUploading(true);
    setProgress(0);

    // Simulate progress upload
    const interval = setInterval(() => {
      setProgress((prev) => {
        if (prev >= 100) {
          clearInterval(interval);
          setUploading(false);
          toast.success("File uploaded successfully to sandbox server!");
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
    
    // Redirect to scanning animation
    router.push("/resume-scan");
  };

  return (
    <div className="flex-1 min-h-screen neu-bg flex flex-col items-center justify-center p-6 relative overflow-hidden select-none text-slate-100">
      
      {/* Background blurs */}
      <div className="absolute top-[20%] left-[-10%] w-[350px] h-[350px] rounded-full bg-sky-500/5 blur-[120px] pointer-events-none" />
      <div className="absolute bottom-[20%] right-[-10%] w-[350px] h-[350px] rounded-full bg-purple-500/5 blur-[120px] pointer-events-none" />
      
      <div className="w-full max-w-[540px] flex flex-col gap-6 relative z-10">
        
        {/* Header */}
        <div className="flex flex-col items-center text-center gap-2">
          <div className="w-9 h-9 rounded-xl bg-gradient-to-tr from-sky-400 to-indigo-500 flex items-center justify-center text-white font-bold mb-2 shadow-md shadow-sky-500/10 neu-circle border-none">
            A
          </div>
          <h2 className="text-2xl font-black text-slate-100 tracking-tight">Upload Your Resume</h2>
          <p className="text-slate-400 text-xs font-semibold max-w-sm">Our AI will read your history, extract qualifications, and begin the matching process.</p>
        </div>

        {/* Upload Container - Neumorphic Card */}
        <div className="w-full neu-card p-8 rounded-3xl flex flex-col gap-6 border-none">
          
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
                  className={`rounded-2xl p-10 flex flex-col items-center justify-center gap-4 text-center cursor-pointer transition-all border-none neu-pressed ${isDragActive ? "bg-indigo-950/15" : "hover:bg-slate-800/10"}`}
                >
                  <input {...getInputProps()} />
                  <div className="w-14 h-14 rounded-2xl bg-[#1A2336] border border-slate-800 flex items-center justify-center text-sky-400 neu-circle shadow-sm">
                    <UploadCloud className="w-6 h-6" />
                  </div>
                  <div className="flex flex-col gap-1">
                    <span className="text-xs font-bold text-slate-300">Drag & drop your resume here, or <span className="text-sky-400 hover:underline">browse</span></span>
                    <span className="text-[10px] text-slate-500 font-semibold">Supports PDF, DOCX formats up to 10 MB</span>
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
                className="p-5 rounded-2xl bg-[#172033] border border-slate-800 flex flex-col gap-4 text-left shadow-sm"
              >
                <div className="flex items-center gap-3.5">
                  <div className="w-12 h-12 rounded-xl bg-[#1A2336] border border-slate-800 flex items-center justify-center text-sky-400 neu-circle">
                    <FileText className="w-5 h-5" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <h4 className="text-xs font-bold text-slate-200 truncate">{file.name}</h4>
                    <p className="text-[10px] text-slate-500 font-semibold mt-0.5">{(file.size / 1024).toFixed(1)} KB • Completed</p>
                  </div>
                  {progress === 100 && (
                    <CheckCircle2 className="w-4 h-4 text-teal-400 flex-shrink-0" />
                  )}
                </div>

                {/* Progress bar */}
                {uploading && (
                  <div className="flex flex-col gap-1.5 mt-2">
                    <div className="flex items-center justify-between text-[10px] font-bold text-slate-400">
                      <span>Uploading Resume...</span>
                      <span>{progress}%</span>
                    </div>
                    <div className="w-full bg-[#111827] h-1.5 rounded-full overflow-hidden neu-pressed">
                      <div 
                        className="bg-sky-400 h-full rounded-full transition-all duration-150 progress-glow"
                        style={{ width: `${progress}%` }}
                      />
                    </div>
                  </div>
                )}

                {/* File Controls */}
                {!uploading && (
                  <div className="flex items-center gap-3 mt-2 pt-3 border-t border-slate-800/40">
                    <button
                      onClick={handleRemove}
                      className="px-4 py-2 rounded-xl text-[10px] font-bold transition-all flex items-center gap-1.5 cursor-pointer border-none neu-button hover:text-rose-400"
                    >
                      <Trash2 className="w-3.5 h-3.5 text-rose-500" /> Remove
                    </button>
                    
                    <div {...getRootProps()} className="inline-block">
                      <input {...getInputProps()} />
                      <button
                        className="px-4 py-2 rounded-xl text-[10px] font-bold transition-all flex items-center gap-1.5 cursor-pointer border-none neu-button"
                      >
                        <RefreshCw className="w-3.5 h-3.5 text-sky-400" /> Replace
                      </button>
                    </div>
                  </div>
                )}
              </motion.div>
            )}
          </AnimatePresence>

          {/* Action buttons */}
          <div className="flex flex-col gap-3.5 border-t border-slate-800/40 pt-5 mt-2">
            <button
              onClick={handleProcess}
              disabled={!file || uploading}
              className={`w-full h-12 rounded-2xl font-bold flex items-center justify-center gap-2 shadow-md transition-all cursor-pointer border-none ${(!file || uploading) ? "bg-[#172033] text-slate-600 cursor-not-allowed shadow-none" : "bg-gradient-to-r from-sky-500 to-indigo-500 hover:from-sky-400 hover:to-indigo-400 text-white shadow-sky-500/10 hover:-translate-y-0.5 border border-sky-400/20"}`}
            >
              Analyze Resume with Aura AI
              <ArrowRight className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Security badge */}
        <div className="flex items-center justify-center gap-2 text-[10px] text-slate-500 font-semibold">
          <ShieldCheck className="w-3.5 h-3.5 text-teal-400" />
          <span>Encrypted storage. Data is used solely for agent mapping.</span>
        </div>
      </div>

    </div>
  );
}

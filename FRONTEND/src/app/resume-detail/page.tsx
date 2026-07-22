"use client";

import React, { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { motion } from "framer-motion";
import {
  FileText, Download, User, Briefcase, GraduationCap, Code2,
  Award, MapPin, Mail, Phone, Sparkles, ArrowLeft, ExternalLink,
  ChevronRight, Loader2, AlertCircle
} from "lucide-react";
import { toast } from "sonner";
import { getResumeDetails, type ResumeDetailsResponse } from "@/lib/api";
import { useSession } from "@/store/SessionContext";
import Link from "next/link";

export default function ResumeDetailPage() {
  const router = useRouter();
  const { theme, toggleTheme } = useSession();
  
  const [data, setData] = useState<ResumeDetailsResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const controller = new AbortController();
    getResumeDetails(controller.signal)
      .then((res) => {
        setData(res);
        setLoading(false);
      })
      .catch((err) => {
        if (err.name !== "AbortError") {
          setError(err.message || "Could not load resume details.");
          setLoading(false);
        }
      });
    return () => controller.abort();
  }, []);

  const details = data?.resume_details || {};

  const handleDownloadOriginal = () => {
    if (data?.resume_pdf_url) {
      window.open(data.resume_pdf_url, "_blank");
    } else {
      toast.error("Original PDF not available. Please re-upload your resume.");
    }
  };

  const handleDownloadATS = () => {
    if (data?.ats_pdf_url) {
      window.open(data.ats_pdf_url, "_blank");
    } else {
      toast.error("ATS PDF not ready. Please analyze your resume first.");
    }
  };

  // ── Loading state ──────────────────────────────────────────────────────────
  if (loading) {
    return (
      <div className="min-h-screen neu-bg flex items-center justify-center">
        <div className="flex flex-col items-center gap-4 text-slate-400">
          <Loader2 className="w-10 h-10 animate-spin text-teal-400" />
          <p className="text-sm font-semibold">Loading your resume intelligence...</p>
        </div>
      </div>
    );
  }

  // ── Error state ────────────────────────────────────────────────────────────
  if (error) {
    return (
      <div className="min-h-screen neu-bg flex items-center justify-center p-6">
        <div className="max-w-md w-full bg-slate-900/80 border border-rose-500/30 rounded-3xl p-8 flex flex-col items-center gap-4 text-center">
          <AlertCircle className="w-12 h-12 text-rose-400" />
          <h2 className="text-lg font-black text-slate-100">Resume Not Found</h2>
          <p className="text-sm text-slate-400">{error}</p>
          <Link
            href="/upload"
            className="mt-2 px-6 py-3 rounded-2xl bg-gradient-to-r from-teal-500 to-emerald-500 text-white font-bold text-sm flex items-center gap-2"
          >
            <FileText className="w-4 h-4" /> Upload Your Resume
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen neu-bg text-slate-800 dark:text-slate-100 p-6 md:p-10 relative">
      
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

      {/* Back button */}
      <Link
        href="/dashboard"
        className="inline-flex items-center gap-2 text-xs font-bold text-slate-400 hover:text-teal-400 transition-colors mb-8"
      >
        <ArrowLeft className="w-4 h-4" /> Back to Dashboard
      </Link>

      {/* Header */}
      <div className="max-w-5xl mx-auto">
        <motion.div
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 mb-8 text-left"
        >
          <div className="flex flex-col gap-1">
            <div className="flex items-center gap-2">
              <Sparkles className="w-5 h-5 text-teal-550 dark:text-teal-400 animate-pulse" />
              <span className="text-[10px] font-bold text-teal-650 dark:text-teal-400 uppercase tracking-widest">AI Parsed Resume</span>
            </div>
            <h1 className="text-3xl font-black text-slate-900 dark:text-slate-100 tracking-tight">
              {details.name || "Your Resume"}
            </h1>
            <div className="flex flex-wrap items-center gap-3 mt-1 text-xs text-slate-500 dark:text-slate-400 font-semibold">
              {details.email && (
                <span className="flex items-center gap-1"><Mail className="w-3.5 h-3.5 text-teal-500" /> {details.email}</span>
              )}
              {details.phone && (
                <span className="flex items-center gap-1"><Phone className="w-3.5 h-3.5 text-teal-500" /> {details.phone}</span>
              )}
              {details.location && (
                <span className="flex items-center gap-1"><MapPin className="w-3.5 h-3.5 text-teal-500" /> {details.location}</span>
              )}
            </div>
          </div>

          {/* Download buttons */}
          <div className="flex gap-3">
            <button
              onClick={handleDownloadATS}
              className="flex items-center gap-2 px-5 py-2.5 rounded-2xl bg-gradient-to-r from-teal-500 to-emerald-500 text-white font-bold text-xs shadow-md hover:-translate-y-0.5 transition-all border border-teal-400/20 cursor-pointer"
            >
              <Download className="w-4 h-4" /> ATS Optimised PDF
            </button>
            <button
              onClick={handleDownloadOriginal}
              className="flex items-center gap-2 px-5 py-2.5 rounded-2xl border border-slate-300 dark:border-slate-700 text-slate-700 dark:text-slate-300 font-bold text-xs hover:border-teal-500/50 hover:text-teal-400 transition-all cursor-pointer"
            >
              <FileText className="w-4 h-4" /> Original PDF
            </button>
          </div>
        </motion.div>

        {/* Professional Summary */}
        {details.summary && (
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.05 }}
            className="mb-6 bg-white dark:bg-slate-900/60 border border-slate-200/80 dark:border-slate-800/80 rounded-3xl p-6 shadow-sm text-left"
          >
            <h2 className="flex items-center gap-2 text-xs font-black uppercase tracking-widest text-teal-600 dark:text-teal-400 mb-3">
              <User className="w-4 h-4" /> Professional Summary
            </h2>
            <p className="text-sm text-slate-650 dark:text-slate-300 leading-relaxed">{details.summary}</p>
          </motion.div>
        )}

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">

          {/* ── LEFT COLUMN ────────────────────────────────────────────────── */}
          <div className="flex flex-col gap-6">

            {/* Skills */}
            <motion.div
              initial={{ opacity: 0, x: -10 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.1 }}
              className="bg-white dark:bg-slate-900/60 border border-slate-200/80 dark:border-slate-800/80 rounded-3xl p-6 shadow-sm text-left"
            >
              <h2 className="flex items-center gap-2 text-xs font-black uppercase tracking-widest text-teal-600 dark:text-teal-400 mb-4">
                <Code2 className="w-4 h-4" /> Skills
              </h2>
              {(details.skills || data?.skills || []).length > 0 ? (
                <div className="flex flex-wrap gap-2">
                  {(details.skills || data?.skills || []).map((skill, i) => (
                    <span
                      key={i}
                      className="text-[11px] font-bold px-3 py-1.5 rounded-xl bg-slate-100 dark:bg-teal-950/40 text-slate-800 dark:text-teal-300 border border-slate-200/60 dark:border-teal-800/50"
                    >
                      {skill}
                    </span>
                  ))}
                </div>
              ) : (
                <p className="text-xs text-slate-500">No skills extracted. Try re-analyzing.</p>
              )}
            </motion.div>

            {/* Certifications */}
            {(details.certifications || []).length > 0 && (
              <motion.div
                initial={{ opacity: 0, x: -10 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: 0.15 }}
                className="bg-white dark:bg-slate-900/60 border border-slate-200/80 dark:border-slate-800/80 rounded-3xl p-6 shadow-sm text-left"
              >
                <h2 className="flex items-center gap-2 text-xs font-black uppercase tracking-widest text-amber-600 dark:text-amber-400 mb-4">
                  <Award className="w-4 h-4" /> Certifications
                </h2>
                <ul className="flex flex-col gap-2">
                  {(details.certifications || []).map((cert, i) => (
                    <li key={i} className="flex items-start gap-2 text-xs text-slate-650 dark:text-slate-300">
                      <ChevronRight className="w-3.5 h-3.5 mt-0.5 text-amber-500 flex-shrink-0" />
                      {cert}
                    </li>
                  ))}
                </ul>
              </motion.div>
            )}

            {/* Education */}
            {(details.education || []).length > 0 && (
              <motion.div
                initial={{ opacity: 0, x: -10 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: 0.2 }}
                className="bg-white dark:bg-slate-900/60 border border-slate-200/80 dark:border-slate-800/80 rounded-3xl p-6 shadow-sm text-left"
              >
                <h2 className="flex items-center gap-2 text-xs font-black uppercase tracking-widest text-purple-600 dark:text-purple-400 mb-4">
                  <GraduationCap className="w-4 h-4" /> Education
                </h2>
                <div className="flex flex-col gap-4">
                  {(details.education || []).map((edu, i) => (
                    <div key={i} className="flex flex-col gap-1">
                      <span className="text-sm font-bold text-slate-800 dark:text-slate-200">{edu.degree}</span>
                      <span className="text-xs text-slate-500 dark:text-slate-400">{edu.institution}</span>
                      <div className="flex gap-3 text-[11px] text-slate-400 dark:text-slate-500 font-semibold">
                        {edu.year && <span>{edu.year}</span>}
                        {edu.gpa && <span>GPA: {edu.gpa}</span>}
                      </div>
                    </div>
                  ))}
                </div>
              </motion.div>
            )}
          </div>

          {/* ── RIGHT COLUMN (spans 2 cols) ───────────────────────────────── */}
          <div className="lg:col-span-2 flex flex-col gap-6">

            {/* Experience */}
            {(details.experience || []).length > 0 && (
              <motion.div
                initial={{ opacity: 0, x: 10 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: 0.1 }}
                className="bg-white dark:bg-slate-900/60 border border-slate-200/80 dark:border-slate-800/80 rounded-3xl p-6 shadow-sm text-left"
              >
                <h2 className="flex items-center gap-2 text-xs font-black uppercase tracking-widest text-sky-600 dark:text-sky-400 mb-5">
                  <Briefcase className="w-4 h-4" /> Work Experience
                </h2>
                <div className="flex flex-col gap-6">
                  {(details.experience || []).map((exp, i) => (
                    <div key={i} className="relative pl-4 border-l border-slate-300 dark:border-slate-700">
                      <div className="absolute -left-1.5 top-1 w-3 h-3 rounded-full bg-sky-500/60 border border-sky-450 dark:border-sky-400" />
                      <div className="flex flex-col gap-1 mb-2">
                        <span className="text-sm font-black text-slate-800 dark:text-slate-100">{exp.title}</span>
                        <span className="text-xs font-bold text-sky-600 dark:text-sky-400">{exp.company}</span>
                        {exp.duration && (
                          <span className="text-[11px] text-slate-400 dark:text-slate-500 font-semibold">{exp.duration}</span>
                        )}
                      </div>
                      {(exp.bullets || []).length > 0 && (
                        <ul className="flex flex-col gap-1.5 mt-2">
                          {(exp.bullets || []).map((b, j) => (
                            <li key={j} className="flex items-start gap-2 text-xs text-slate-600 dark:text-slate-400 leading-relaxed">
                              <ChevronRight className="w-3.5 h-3.5 mt-0.5 text-sky-500 dark:text-sky-400/65 flex-shrink-0" />
                              {b}
                            </li>
                          ))}
                        </ul>
                      )}
                    </div>
                  ))}
                </div>
              </motion.div>
            )}

            {/* Projects */}
            {(details.projects || []).length > 0 && (
              <motion.div
                initial={{ opacity: 0, x: 10 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: 0.15 }}
                className="bg-white dark:bg-slate-900/60 border border-slate-200/80 dark:border-slate-800/80 rounded-3xl p-6 shadow-sm text-left"
              >
                <h2 className="flex items-center gap-2 text-xs font-black uppercase tracking-widest text-emerald-600 dark:text-emerald-400 mb-5">
                  <Code2 className="w-4 h-4" /> Projects
                </h2>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {(details.projects || []).map((proj, i) => (
                    <div
                      key={i}
                      className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-800/50 border border-slate-200/60 dark:border-slate-700/50 flex flex-col gap-2"
                    >
                      <span className="text-sm font-black text-slate-800 dark:text-slate-100">{proj.name}</span>
                      {(proj.tech || []).length > 0 && (
                        <div className="flex flex-wrap gap-1.5">
                          {(proj.tech || []).map((t, j) => (
                            <span
                              key={j}
                              className="text-[10px] font-bold px-2 py-0.5 rounded-lg bg-emerald-100 dark:bg-emerald-950/40 text-emerald-800 dark:text-emerald-300 border border-emerald-200/60 dark:border-emerald-800/50"
                            >
                              {t}
                            </span>
                          ))}
                        </div>
                      )}
                      {proj.description && (
                        <p className="text-xs text-slate-500 dark:text-slate-400 leading-relaxed">{proj.description}</p>
                      )}
                    </div>
                  ))}
                </div>
              </motion.div>
            )}

            {/* CTA — Go to Dashboard */}
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.25 }}
              className="p-6 rounded-3xl border border-teal-500/20 bg-gradient-to-br from-teal-50 dark:from-teal-950/30 to-slate-100 dark:to-slate-900/60 flex flex-col md:flex-row items-center justify-between gap-4 text-left"
            >
              <div>
                <h3 className="font-black text-slate-800 dark:text-slate-100 text-sm">Ready to find your matched jobs?</h3>
                <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">Your resume is processed — the AI is searching for your best matches right now.</p>
              </div>
              <button
                onClick={() => router.push("/dashboard")}
                className="flex items-center gap-2 px-6 py-3 rounded-2xl bg-gradient-to-r from-teal-500 to-emerald-500 text-white font-bold text-xs shadow-md hover:-translate-y-0.5 transition-all border border-teal-400/20 cursor-pointer whitespace-nowrap"
              >
                View My Job Matches <ExternalLink className="w-4 h-4" />
              </button>
            </motion.div>
          </div>
        </div>
      </div>
    </div>
  );
}

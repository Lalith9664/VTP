"use client";

import React, { useEffect, useState, useCallback } from "react";
import { useParams, useRouter } from "next/navigation";
import { useSession } from "@/store/SessionContext";
import { DiffViewer } from "@/components/DiffViewer";
import { QualificationGauge } from "@/components/QualificationGauge";
import { motion, AnimatePresence } from "framer-motion";
import {
  ArrowLeft, Sparkles, Briefcase, Zap,
  LayoutDashboard, LogOut, Loader2, AlertCircle,
  BookOpen, ChevronRight, RefreshCw,
} from "lucide-react";
import { toast } from "sonner";
import {
  getJobDossier,
  generatePdf,
  type DossierData,
  type DiffItem,
} from "@/lib/api";

// ─── Types ────────────────────────────────────────────────────────────────────

type LoadingState = "idle" | "loading" | "success" | "error";

// ─── Component ────────────────────────────────────────────────────────────────

export default function TailorPage() {
  const params  = useParams();
  const router  = useRouter();
  const { profile, theme, toggleTheme, sidebarCollapsed, setSidebarCollapsed } = useSession();

  const jobId = params.id as string;

  const [loadState, setLoadState]   = useState<LoadingState>("idle");
  const [dossier,   setDossier]     = useState<DossierData | null>(null);
  const [error,     setError]       = useState<string | null>(null);
  const [pdfLoading, setPdfLoading] = useState(false);

  // ── Fetch dossier from FastAPI ─────────────────────────────────────────────
  const fetchDossier = useCallback(async () => {
    if (!jobId) return;
    setLoadState("loading");
    setError(null);

    try {
      const res = await getJobDossier(jobId);
      setDossier(res.data);
      setLoadState("success");
      toast.success(
        res.source === "cache"
          ? "Loaded from cache ⚡"
          : "AI Dossier generated ✨",
        { description: `For: ${res.data.job_title} @ ${res.data.job_company}` }
      );
    } catch (err: any) {
      const msg = err.message || "Failed to load dossier.";
      setError(msg);
      setLoadState("error");
      toast.error("Dossier generation failed.", { description: msg });
    }
  }, [jobId]);

  useEffect(() => {
    fetchDossier();
  }, [fetchDossier]);

  // ── PDF download ───────────────────────────────────────────────────────────
  const handleDownload = async () => {
    if (!dossier) return;
    setPdfLoading(true);

    try {
      const acceptedBullets = dossier.tailored_diff.map((d: DiffItem) => d.tailored);
      const res = await generatePdf(
        acceptedBullets,
        profile.fullName || "Candidate",
        dossier.job_title,
        profile.skills
      );
      toast.success("PDF ready!", {
        description: `Download URL: ${res.pdf_url}`,
        action: {
          label: "Open",
          onClick: () => window.open(res.pdf_url, "_blank"),
        },
      });
    } catch (err: any) {
      toast.error("PDF generation failed.", { description: err.message });
    } finally {
      setPdfLoading(false);
    }
  };

  const handleLogout = () => {
    toast.success("Logged out successfully.");
    router.push("/");
  };

  // ─── Render ────────────────────────────────────────────────────────────────
  return (
    <div className="flex-1 min-h-screen flex neu-bg font-sans relative select-none text-slate-100 transition-colors duration-300">

      {/* Background radial overlays */}
      <div className="absolute top-0 right-0 w-[45%] h-[40%] rounded-full bg-gradient-to-br from-teal-500/5 to-emerald-500/5 blur-[120px] pointer-events-none" />
      <div className="absolute bottom-0 left-0 w-[40%] h-[40%] rounded-full bg-gradient-to-tr from-purple-500/5 to-teal-500/5 blur-[130px] pointer-events-none" />

      {/* ── SIDEBAR ─────────────────────────────────────────────────────────── */}
      <aside
        className={`hidden lg:flex flex-col h-screen fixed left-0 top-0 neu-sidebar-bg border-r border-slate-200/60 gap-8 z-30 shadow-2xl transition-all duration-300 ${
          sidebarCollapsed ? "w-20 p-4" : "w-64 p-6"
        }`}
      >
        {/* Logo */}
        <div
          className={`flex items-center gap-3 cursor-pointer ${sidebarCollapsed ? "justify-center" : ""}`}
          onClick={() => setSidebarCollapsed(!sidebarCollapsed)}
          title={sidebarCollapsed ? "Expand Sidebar" : "Collapse Sidebar"}
        >
          <img
            src="/logo.jpeg"
            alt="VTP Logo"
            className="w-12 h-12 rounded-xl object-cover shadow-md border-none neu-circle transition-all duration-300"
          />
          {!sidebarCollapsed && <span className="text-lg font-bold text-slate-200">VTP</span>}
        </div>

        {/* User info */}
        {!sidebarCollapsed ? (
          <div className="flex items-center gap-3 p-3 rounded-2xl border-none neu-pressed">
            <div className="w-9 h-9 rounded-full bg-gradient-to-tr from-teal-400 to-emerald-500 text-white font-black flex items-center justify-center text-xs neu-circle border-none">
              {profile.fullName.substring(0, 2).toUpperCase()}
            </div>
            <div className="min-w-0 flex-1 text-left">
              <h4 className="text-xs font-black text-slate-250 truncate leading-tight">{profile.fullName}</h4>
              <span className="text-[9px] text-slate-400 uppercase tracking-widest font-black truncate block mt-0.5">
                {profile.department}
              </span>
            </div>
          </div>
        ) : (
          <div className="flex items-center justify-center p-2 rounded-2xl border-none neu-pressed" title={profile.fullName}>
            <div className="w-9 h-9 rounded-full bg-gradient-to-tr from-teal-400 to-emerald-500 text-white font-black flex items-center justify-center text-xs neu-circle border-none">
              {profile.fullName.substring(0, 2).toUpperCase()}
            </div>
          </div>
        )}

        {/* Nav */}
        <nav className="flex-grow flex flex-col gap-1.5">
          {[
            { icon: <LayoutDashboard className="w-4 h-4 text-teal-400" />, label: "Dashboard Home", href: "/dashboard" },
            { icon: <Briefcase className="w-4 h-4" />, label: "Job Dossier", href: `/job/${jobId}` },
          ].map((item) => (
            <button
              key={item.href}
              onClick={() => router.push(item.href)}
              className={`flex items-center gap-3 rounded-xl transition-all text-left text-slate-400 hover:text-slate-200 neu-button border-none mb-1.5 ${
                sidebarCollapsed ? "justify-center p-3" : "px-4 py-3 text-xs font-bold"
              }`}
              title={sidebarCollapsed ? item.label : undefined}
            >
              {item.icon}
              {!sidebarCollapsed && <span>{item.label}</span>}
            </button>
          ))}
        </nav>

        {/* Logout */}
        <div className="flex flex-col gap-2 border-t border-slate-800/40 pt-4">
          <button
            onClick={handleLogout}
            className={`flex items-center gap-3 rounded-xl transition-all text-left neu-button border-none ${
              sidebarCollapsed
                ? "justify-center p-3 text-slate-400 hover:text-rose-400"
                : "px-4 py-3 text-xs font-bold text-slate-400 hover:text-rose-400"
            }`}
            title={sidebarCollapsed ? "Logout" : undefined}
          >
            <LogOut className="w-4 h-4" />
            {!sidebarCollapsed && <span>Logout</span>}
          </button>
        </div>
      </aside>

      {/* ── MAIN CONTENT ─────────────────────────────────────────────────────── */}
      <div
        className={`flex-1 flex flex-col min-w-0 relative z-25 transition-all duration-300 ${
          sidebarCollapsed ? "lg:pl-20" : "lg:pl-64"
        }`}
      >
        {/* Header */}
        <header className="sticky top-0 z-35 w-full neu-header-bg border-b border-slate-200/60 h-16 flex items-center justify-between px-6 shadow-md">
          <button
            onClick={() => router.push(`/job/${jobId}`)}
            className="flex items-center gap-1 text-xs font-bold text-slate-300 hover:text-slate-100 cursor-pointer border-none bg-transparent"
          >
            <ArrowLeft className="w-4 h-4" /> Back to Dossier
          </button>

          <div className="flex items-center gap-4">
            {/* Theme toggle */}
            <button
              onClick={toggleTheme}
              className="w-16 h-8 rounded-full relative transition-colors duration-300 flex items-center px-0.5 focus:outline-none cursor-pointer border-none bg-slate-150 dark:bg-slate-900/60 neu-pressed"
              aria-label="Toggle Theme Mode"
            >
              <div className="absolute left-2.5 w-3 h-3 rounded-full border-2 border-slate-700 dark:border-slate-500 opacity-80" />
              <div
                className="absolute right-3.5 w-3.5 h-0.5 rounded-full opacity-100 z-0"
                style={{ backgroundColor: "#ffffff", boxShadow: "0 0 8px #ffffff" }}
              />
              <motion.div
                layout
                className="w-7 h-7 rounded-full border-none shadow-md cursor-pointer bg-white dark:bg-slate-300 z-10"
                animate={{ x: theme === "dark" ? 0 : 30 }}
                transition={{ duration: 0.1, ease: "easeOut" }}
              />
            </button>
            <span className="text-[10px] uppercase font-black tracking-widest text-slate-400">
              Tailoring: {jobId.slice(0, 8)}
            </span>
          </div>
        </header>

        {/* Body */}
        <main className="flex-1 overflow-y-auto p-6 md:p-8 flex flex-col gap-6 max-w-5xl mx-auto w-full">

          {/* Page title */}
          <div className="flex flex-col gap-2 text-left">
            <div className="flex items-center gap-2">
              <Zap className="w-5 h-5 text-teal-400" />
              <h1 className="text-xl md:text-2xl font-black text-slate-150 tracking-tight">
                AI Resume Tailoring Panel
              </h1>
            </div>
            <p className="text-slate-400 text-xs font-semibold max-w-2xl leading-relaxed">
              {dossier
                ? <>We parsed your CV against the required stack at{" "}
                    <span className="text-slate-200">{dossier.job_company}</span> ({dossier.job_title}).
                    Accept or revert specific bullet points to customise your output.</>
                : "Loading your personalised intelligence dossier..."}
            </p>
          </div>

          {/* ── Loading state ─────────────────────────────────────────────── */}
          <AnimatePresence mode="wait">
            {loadState === "loading" && (
              <motion.div
                key="loading"
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0 }}
                className="flex flex-col items-center justify-center gap-4 py-24 rounded-3xl neu-card"
              >
                <Loader2 className="w-10 h-10 text-teal-400 animate-spin" />
                <p className="text-xs font-semibold text-slate-400">
                  Running Agent 7 (Tailor) + Agent 9 (Interview) in parallel...
                </p>
                <p className="text-[10px] text-slate-500 font-medium">
                  This may take 5-10 seconds on first load.
                </p>
              </motion.div>
            )}

            {/* ── Error state ───────────────────────────────────────────────── */}
            {loadState === "error" && (
              <motion.div
                key="error"
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0 }}
                className="flex flex-col items-center gap-4 py-16 rounded-3xl neu-card text-center"
              >
                <AlertCircle className="w-10 h-10 text-rose-400" />
                <p className="text-sm font-bold text-slate-200">Dossier Generation Failed</p>
                <p className="text-xs text-slate-400 max-w-md">{error}</p>
                <button
                  onClick={fetchDossier}
                  className="flex items-center gap-2 px-6 py-2.5 rounded-xl text-xs font-bold text-white bg-gradient-to-r from-teal-500 to-emerald-600 hover:from-teal-600 hover:to-emerald-700 transition-all border-none cursor-pointer"
                >
                  <RefreshCw className="w-3.5 h-3.5" /> Retry
                </button>
              </motion.div>
            )}

            {/* ── Success state ─────────────────────────────────────────────── */}
            {loadState === "success" && dossier && (
              <motion.div
                key="content"
                initial={{ opacity: 0, y: 12 }}
                animate={{ opacity: 1, y: 0 }}
                className="flex flex-col gap-6"
              >
                {/* Top row: ATS gauge + missing skills */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <QualificationGauge
                    atsScore={dossier.ats_score}
                    canQualify={dossier.can_qualify}
                  />

                  {/* Warning / qualification feedback */}
                  <div className="md:col-span-2 p-5 rounded-3xl neu-card flex flex-col gap-3">
                    <p className="text-[10px] uppercase font-black text-slate-400 tracking-wider">
                      AI Feedback
                    </p>
                    <p className="text-xs font-semibold text-slate-300 leading-relaxed">
                      {dossier.qualification_feedback || dossier.warning}
                    </p>
                    {dossier.missing_skills.length > 0 && (
                      <div className="flex flex-wrap gap-1.5 mt-1">
                        {dossier.missing_skills.map((s) => (
                          <span
                            key={s}
                            className="px-2.5 py-1 rounded-full text-[10px] font-bold bg-rose-500/10 text-rose-400 border border-rose-500/20"
                          >
                            ✗ {s}
                          </span>
                        ))}
                      </div>
                    )}
                  </div>
                </div>

                {/* Diff Viewer */}
                <div className="p-6 md:p-8 rounded-3xl border-none neu-card flex flex-col gap-6">
                  <div className="flex items-center gap-2 text-left border-b border-slate-800/40 pb-4">
                    <Sparkles className="w-5 h-5 text-teal-400" />
                    <div>
                      <h3 className="font-extrabold text-slate-200 text-xs uppercase tracking-wider">
                        Split-Screen Bullet Point Optimiser
                      </h3>
                      <p className="text-slate-400 text-xs mt-0.5">
                        Toggle to accept the AI-optimised copy, then download your tailored PDF.
                      </p>
                    </div>
                  </div>
                  <DiffViewer
                    diffData={dossier.tailored_diff}
                    onDownload={handleDownload}
                    pdfLoading={pdfLoading}
                  />
                </div>

                {/* Interview Questions */}
                {dossier.interview_questions.length > 0 && (
                  <div className="p-6 rounded-3xl neu-card flex flex-col gap-4">
                    <div className="flex items-center gap-2 border-b border-slate-800/40 pb-3">
                      <BookOpen className="w-4 h-4 text-teal-400" />
                      <h3 className="font-extrabold text-slate-200 text-xs uppercase tracking-wider">
                        Probable Interview Questions
                      </h3>
                    </div>
                    <div className="flex flex-col gap-2">
                      {dossier.interview_questions.map((q, i) => (
                        <div
                          key={i}
                          className="flex items-start gap-3 p-3 rounded-xl neu-pressed"
                        >
                          <ChevronRight className="w-3.5 h-3.5 text-teal-400 mt-0.5 flex-shrink-0" />
                          <p className="text-xs text-slate-300 leading-relaxed">{q}</p>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* Study Resources */}
                {dossier.study_resources.length > 0 && (
                  <div className="p-6 rounded-3xl neu-card flex flex-col gap-4">
                    <h3 className="font-extrabold text-slate-200 text-xs uppercase tracking-wider">
                      📚 Recommended Study Resources
                    </h3>
                    <div className="flex flex-col gap-2">
                      {dossier.study_resources.map((r, i) => (
                        <p key={i} className="text-xs text-slate-400 flex items-start gap-2">
                          <span className="text-teal-400 mt-0.5">→</span> {r}
                        </p>
                      ))}
                    </div>
                  </div>
                )}
              </motion.div>
            )}
          </AnimatePresence>
        </main>
      </div>
    </div>
  );
}

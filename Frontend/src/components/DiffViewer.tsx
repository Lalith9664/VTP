"use client";

import React, { useState } from "react";
import { Download, Loader2 } from "lucide-react";
import { toast } from "sonner";

// ─── Types matching FastAPI DossierData.tailored_diff ─────────────────────────
export interface DiffItem {
  original: string;
  tailored: string;
  reason: string;
}

export interface DiffViewerProps {
  /** Array of bullet-point diffs returned by the tailor agent */
  diffData: DiffItem[];
  /** Called when the user clicks "Download PDF" */
  onDownload?: () => void | Promise<void>;
  /** Shows a spinner on the download button while PDF is being generated */
  pdfLoading?: boolean;
}

export function DiffViewer({ diffData, onDownload, pdfLoading = false }: DiffViewerProps) {
  const [accepted, setAccepted] = useState<boolean[]>(diffData.map(() => true));

  const toggleAccept = (index: number) => {
    setAccepted((prev) => {
      const next = [...prev];
      next[index] = !next[index];
      return next;
    });
  };

  const handleDownload = async () => {
    if (onDownload) {
      await onDownload();
    } else {
      toast.success("Preparing PDF Download...", {
        description: "Executing tailored export pipeline on FastAPI...",
      });
    }
  };

  if (!diffData || diffData.length === 0) {
    return (
      <div className="py-10 text-center text-slate-400 text-xs font-semibold neu-pressed rounded-2xl">
        No tailored bullet points available. Try regenerating the dossier.
      </div>
    );
  }

  return (
    <div className="space-y-6 w-full text-left">
      {diffData.map((item, idx) => (
        <div key={idx} className="border-none rounded-3xl p-5 neu-card flex flex-col gap-4">
          {/* Header row */}
          <div className="flex justify-between items-center pb-2 border-b border-slate-800/20">
            <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">
              Bullet Point {idx + 1}
            </span>
            <button
              onClick={() => toggleAccept(idx)}
              className={`flex items-center gap-2 px-3 py-1 rounded-full text-[10px] font-bold transition-all border-none cursor-pointer ${
                accepted[idx]
                  ? "bg-emerald-500/10 text-emerald-400"
                  : "bg-slate-700/30 text-slate-500"
              }`}
            >
              {accepted[idx] ? "✅ Accepted" : "❌ Reverted"}
            </button>
          </div>

          {/* Split-screen columns */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
            {/* Original */}
            <div className="p-4 rounded-2xl border-none neu-pressed text-xs text-slate-400 leading-relaxed">
              <p className="text-[9px] uppercase font-bold text-slate-500 tracking-wider mb-2">
                Original
              </p>
              <p>{item.original}</p>
            </div>

            {/* Tailored */}
            <div
              className={`p-4 rounded-2xl border-none transition-all duration-300 text-xs leading-relaxed ${
                accepted[idx]
                  ? "bg-emerald-500/5 border-l-4 border-l-emerald-500 text-slate-200"
                  : "neu-pressed text-slate-400 opacity-60"
              }`}
            >
              <p
                className={`text-[9px] uppercase font-bold tracking-wider mb-2 ${
                  accepted[idx] ? "text-emerald-400" : "text-slate-500"
                }`}
              >
                {accepted[idx] ? "AI Tailored" : "Reverted"}
              </p>
              <p>{accepted[idx] ? item.tailored : item.original}</p>
              {accepted[idx] && item.reason && (
                <p className="text-[10px] text-teal-400/80 font-semibold mt-3 flex items-start gap-1 leading-snug">
                  <span>💡</span>
                  <span>{item.reason}</span>
                </p>
              )}
            </div>
          </div>
        </div>
      ))}

      {/* Download button */}
      <button
        onClick={handleDownload}
        disabled={pdfLoading}
        className="w-full h-12 rounded-xl text-xs font-bold text-white bg-gradient-to-r from-teal-500 to-emerald-600 hover:from-sky-600 hover:to-emerald-700 transition-all flex items-center justify-center gap-2 shadow-md hover:shadow-teal-500/10 border-none cursor-pointer active:scale-[0.99] mt-2 disabled:opacity-60 disabled:cursor-not-allowed"
      >
        {pdfLoading ? (
          <>
            <Loader2 className="w-4 h-4 animate-spin" />
            <span>Generating PDF...</span>
          </>
        ) : (
          <>
            <Download className="w-4 h-4" />
            <span>📄 Download Tailored Resume (PDF)</span>
          </>
        )}
      </button>
    </div>
  );
}

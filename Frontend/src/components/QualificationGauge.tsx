"use client";

import React from "react";
import { CheckCircle2, XCircle } from "lucide-react";

export interface QualificationGaugeProps {
  /** ATS alignment score 0-100 from the tailor agent */
  atsScore: number;
  /** Whether the user clears the ≥60% skill threshold */
  canQualify: boolean;
  /** Optional short warning from the agent */
  warning?: string;
}

export function QualificationGauge({
  atsScore,
  canQualify,
  warning,
}: QualificationGaugeProps) {
  // Clamp score to [0, 100]
  const score = Math.max(0, Math.min(100, Math.round(atsScore)));

  // Colour reflects score tier
  const strokeColor =
    score >= 70 ? "#2dd4bf"   // teal   – good
    : score >= 40 ? "#fbbf24" // amber  – mediocre
    : "#f43f5e";              // rose   – poor

  // SVG circle math: r=56, circumference = 2πr ≈ 351.86
  const CIRCUMFERENCE = 2 * Math.PI * 56;
  const dashOffset = CIRCUMFERENCE - (CIRCUMFERENCE * score) / 100;

  return (
    <div className="flex flex-col items-center justify-center p-6 rounded-3xl border-none neu-card text-center gap-4 w-full">
      <h3 className="font-extrabold text-slate-200 text-xs uppercase tracking-wider">
        ATS Alignment Score
      </h3>

      {/* SVG arc gauge */}
      <div className="relative w-36 h-36 flex items-center justify-center">
        <svg
          className="w-full h-full transform -rotate-90"
          viewBox="0 0 128 128"
        >
          {/* Track */}
          <circle
            cx="64" cy="64" r="56"
            stroke="currentColor"
            strokeWidth="10"
            className="text-slate-800/40"
            fill="transparent"
          />
          {/* Progress */}
          <circle
            cx="64" cy="64" r="56"
            stroke={strokeColor}
            strokeWidth="10"
            strokeDasharray={CIRCUMFERENCE}
            strokeDashoffset={dashOffset}
            strokeLinecap="round"
            fill="transparent"
            style={{ transition: "stroke-dashoffset 0.6s ease" }}
          />
        </svg>

        {/* Centre label */}
        <div className="absolute flex flex-col items-center justify-center">
          <span className="text-3xl font-black text-slate-100 tracking-tighter">
            {score}%
          </span>
          <span className="text-[9px] uppercase font-bold text-slate-400 tracking-wider">
            Alignment
          </span>
        </div>
      </div>

      {/* Qualification badge */}
      <div className="flex flex-col gap-1 items-center mt-1">
        <p className="text-[10px] uppercase font-bold text-slate-400 tracking-wider">
          Qualification Status
        </p>
        <div
          className={`mt-1.5 px-4 py-1.5 rounded-full text-xs font-bold border-none flex items-center gap-1.5 neu-pressed ${
            canQualify
              ? "text-teal-400 bg-teal-500/5"
              : "text-rose-400 bg-rose-500/5"
          }`}
        >
          {canQualify ? (
            <>
              <CheckCircle2 className="w-3.5 h-3.5 text-teal-400" />
              <span>You Qualify!</span>
            </>
          ) : (
            <>
              <XCircle className="w-3.5 h-3.5 text-rose-400" />
              <span>Skill Gap Detected</span>
            </>
          )}
        </div>

        {/* Optional warning text */}
        {warning && (
          <p className="text-[10px] text-slate-500 mt-1.5 max-w-[160px] text-center leading-snug font-medium">
            {warning}
          </p>
        )}
      </div>
    </div>
  );
}

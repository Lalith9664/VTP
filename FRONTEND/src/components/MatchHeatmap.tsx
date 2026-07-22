"use client";

import React from "react";
import { CheckCircle2, AlertCircle } from "lucide-react";

export interface MatchHeatmapProps {
  jobSkills: string[];
  userSkills: string[];
}

export function MatchHeatmap({ jobSkills, userSkills }: MatchHeatmapProps) {
  // Normalize skills for case-insensitive matching
  const userSkillsSet = new Set(userSkills.map((s) => s.toLowerCase().trim()));

  const matchedSkills: string[] = [];
  const missingSkills: string[] = [];

  jobSkills.forEach((skill) => {
    const trimmed = skill.trim();
    if (userSkillsSet.has(trimmed.toLowerCase())) {
      matchedSkills.push(trimmed);
    } else {
      missingSkills.push(trimmed);
    }
  });

  const totalSkillsCount = jobSkills.length;
  const matchRate = totalSkillsCount > 0 
    ? Math.round((matchedSkills.length / totalSkillsCount) * 100)
    : 100;

  return (
    <div className="flex flex-col gap-6 text-left">
      {/* Overview stats */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="p-4 rounded-2xl border-none neu-pressed flex flex-col gap-1">
          <span className="text-[9px] font-bold text-slate-500 uppercase tracking-widest">
            Skills Matched
          </span>
          <span className="text-sm font-black text-slate-200 mt-1">
            {matchedSkills.length} of {totalSkillsCount}
          </span>
        </div>
        <div className="p-4 rounded-2xl border-none neu-pressed flex flex-col gap-1">
          <span className="text-[9px] font-bold text-slate-500 uppercase tracking-widest">
            Skills Missing
          </span>
          <span className="text-sm font-black text-rose-400 mt-1">
            {missingSkills.length}
          </span>
        </div>
        <div className="p-4 rounded-2xl border-none neu-pressed flex flex-col gap-1">
          <span className="text-[9px] font-bold text-slate-500 uppercase tracking-widest">
            Match Rate
          </span>
          <span className={`text-sm font-black mt-1 ${
            matchRate >= 70 ? "text-teal-400" : matchRate >= 40 ? "text-amber-400" : "text-rose-455"
          }`}>
            {matchRate}%
          </span>
        </div>
      </div>

      {/* Comparison Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mt-2">
        {/* Matching Skills */}
        <div className="p-5 rounded-2xl bg-teal-500/5 border border-teal-500/10 flex flex-col gap-4">
          <h4 className="text-xs font-extrabold text-teal-400 uppercase tracking-wider flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4 text-teal-400" />
            Matching Skills ({matchedSkills.length})
          </h4>
          {matchedSkills.length > 0 ? (
            <div className="flex flex-wrap gap-2">
              {matchedSkills.map((skill, index) => (
                <span
                  key={index}
                  className="px-3 py-1.5 rounded-full text-[10px] font-bold bg-teal-500/10 text-teal-300 border border-teal-500/20"
                >
                  {skill}
                </span>
              ))}
            </div>
          ) : (
            <p className="text-xs text-slate-500 italic">No matching skills detected.</p>
          )}
        </div>

        {/* Missing Skills */}
        <div className="p-5 rounded-2xl bg-rose-500/5 border border-rose-500/10 flex flex-col gap-4">
          <h4 className="text-xs font-extrabold text-rose-400 uppercase tracking-wider flex items-center gap-2">
            <AlertCircle className="w-4 h-4 text-rose-400" />
            Missing Stack Requirements ({missingSkills.length})
          </h4>
          {missingSkills.length > 0 ? (
            <div className="flex flex-wrap gap-2">
              {missingSkills.map((skill, index) => (
                <span
                  key={index}
                  className="px-3 py-1.5 rounded-full text-[10px] font-bold bg-rose-500/10 text-rose-300 border border-rose-500/20"
                >
                  {skill}
                </span>
              ))}
            </div>
          ) : (
            <p className="text-xs text-slate-500 italic">Excellent! No missing requirements.</p>
          )}
        </div>
      </div>
    </div>
  );
}

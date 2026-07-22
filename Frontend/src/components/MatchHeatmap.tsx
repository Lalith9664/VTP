"use client";

import React from 'react';
import { CheckCircle2, XCircle } from 'lucide-react';

interface MatchHeatmapProps {
  jobSkills: string[];
  userSkills: string[];
}

export function MatchHeatmap({ jobSkills, userSkills }: MatchHeatmapProps) {
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-6 w-full text-left">
      {/* Left: Job Requirements */}
      <div className="flex flex-col gap-3">
        <h3 className="font-extrabold text-slate-200 text-xs uppercase tracking-wider pl-1">Job Requirements</h3>
        <div className="flex flex-col gap-2">
          {jobSkills.map((skill) => {
            const matched = userSkills.some(us => us.toLowerCase() === skill.toLowerCase());
            return (
              <div 
                key={skill} 
                className={`p-3 rounded-2xl flex items-center justify-between border-none neu-card ${
                  matched 
                    ? 'border-l-4 border-l-teal-500' 
                    : 'border-l-4 border-l-rose-500'
                }`}
              >
                <span className="text-xs font-bold text-slate-300">{skill}</span>
                <span className="flex items-center">
                  {matched ? (
                    <CheckCircle2 className="w-4 h-4 text-teal-400" />
                  ) : (
                    <XCircle className="w-4 h-4 text-rose-400" />
                  )}
                </span>
              </div>
            );
          })}
        </div>
      </div>
      
      {/* Right: User Has */}
      <div className="flex flex-col gap-3">
        <h3 className="font-extrabold text-slate-200 text-xs uppercase tracking-wider pl-1">Your Resume</h3>
        <div className="flex flex-col gap-2">
          {userSkills.map((skill) => (
            <div 
              key={skill} 
              className="p-3 rounded-2xl border-none neu-card text-xs font-bold text-slate-350 flex items-center gap-2.5"
            >
              <div className="w-1.5 h-1.5 rounded-full bg-[var(--accent)]" />
              <span>{skill}</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

"use client";

import React from 'react';
import { CheckCircle2, XCircle } from 'lucide-react';

interface QualificationGaugeProps {
  atsScore: number;
  canQualify: boolean;
}

export function QualificationGauge({ atsScore, canQualify }: QualificationGaugeProps) {
  const isGood = atsScore >= 70;
  const strokeColor = isGood ? '#2dd4bf' : atsScore >= 40 ? '#fbbf24' : '#f43f5e';
  
  return (
    <div className="flex flex-col items-center justify-center p-6 rounded-3xl border-none neu-card text-center gap-4 w-full">
      <h3 className="font-extrabold text-slate-200 text-xs uppercase tracking-wider">ATS Alignment Score</h3>
      
      <div className="relative w-36 h-36 flex items-center justify-center">
        {/* SVG Progress Circle */}
        <svg className="w-full h-full transform -rotate-90" viewBox="0 0 128 128">
          <circle 
            cx="64" 
            cy="64" 
            r="56" 
            stroke="currentColor" 
            strokeWidth="10" 
            className="text-slate-800/40" 
            fill="transparent" 
          />
          <circle 
            cx="64" 
            cy="64" 
            r="56" 
            stroke={strokeColor} 
            strokeWidth="10" 
            strokeDasharray="351.86"
            strokeDashoffset={351.86 - (351.86 * atsScore) / 100}
            strokeLinecap="round"
            fill="transparent" 
          />
        </svg>
        <div className="absolute flex flex-col items-center justify-center">
          <span className="text-3xl font-black text-slate-100 tracking-tighter">{atsScore}%</span>
          <span className="text-[9px] uppercase font-bold text-slate-400 tracking-wider">Alignment</span>
        </div>
      </div>

      <div className="flex flex-col gap-1 items-center mt-1">
        <p className="text-[10px] uppercase font-bold text-slate-400 tracking-wider">Qualification Status</p>
        <div className={`mt-1.5 px-4 py-1.5 rounded-full text-xs font-bold border-none flex items-center gap-1.5 neu-pressed ${
          canQualify 
            ? 'text-teal-400 bg-teal-500/5' 
            : 'text-rose-400 bg-rose-500/5'
        }`}>
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
      </div>
    </div>
  );
}

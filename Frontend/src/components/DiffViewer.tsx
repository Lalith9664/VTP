"use client";

import React, { useState } from 'react';
import { Switch } from './ui/switch';
import { Download } from 'lucide-react';
import { toast } from 'sonner';

interface DiffItem {
  original: string;
  tailored: string;
  reason: string;
}

interface DiffViewerProps {
  diffData: DiffItem[];
  onDownload?: () => void;
}

export function DiffViewer({ diffData, onDownload }: DiffViewerProps) {
  const [accepted, setAccepted] = useState<boolean[]>(diffData.map(() => true));

  const toggleAccept = (index: number) => {
    const newState = [...accepted];
    newState[index] = !newState[index];
    setAccepted(newState);
  };

  const handleDownload = () => {
    if (onDownload) {
      onDownload();
    } else {
      toast.success("Preparing PDF Download...", {
        description: "Executing tailormade export pipeline on FastAPI..."
      });
    }
  };

  return (
    <div className="space-y-6 w-full text-left">
      {diffData.map((item, idx) => (
        <div key={idx} className="border-none rounded-3xl p-5 neu-card flex flex-col gap-4">
          <div className="flex justify-between items-center pb-2 border-b border-slate-800/20">
            <div className="flex items-center gap-2">
              <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Bullet Point {idx + 1}</span>
            </div>
            <div className="flex items-center gap-3">
              <span className="text-xs font-semibold text-slate-400">
                {accepted[idx] ? '✅ Accepted' : '❌ Reverted'}
              </span>
              <Switch checked={accepted[idx]} onCheckedChange={() => toggleAccept(idx)} />
            </div>
          </div>
          
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
            {/* Original (Left) */}
            <div className="p-4 rounded-2xl border-none neu-pressed text-xs text-slate-400 leading-relaxed">
              <p className="text-[9px] uppercase font-bold text-slate-500 tracking-wider mb-2">Original</p>
              <p>{item.original}</p>
            </div>
            
            {/* Tailored (Right) */}
            <div className={`p-4 rounded-2xl border-none transition-all duration-300 text-xs leading-relaxed ${
              accepted[idx] 
                ? 'bg-emerald-500/5 border-l-4 border-l-emerald-500 text-slate-200' 
                : 'neu-pressed text-slate-400 opacity-60'
            }`}>
              <p className={`text-[9px] uppercase font-bold tracking-wider mb-2 ${
                accepted[idx] ? 'text-emerald-400' : 'text-slate-500'
              }`}>
                {accepted[idx] ? 'AI Tailored' : 'Reverted Bullet'}
              </p>
              <p>{accepted[idx] ? item.tailored : item.original}</p>
              {accepted[idx] && (
                <p className="text-[10px] text-teal-400/80 font-semibold mt-3 flex items-start gap-1 leading-snug">
                  <span>💡</span> <span>{item.reason}</span>
                </p>
              )}
            </div>
          </div>
        </div>
      ))}
      
      <button 
        onClick={handleDownload}
        className="w-full h-12 rounded-xl text-xs font-bold text-white bg-gradient-to-r from-teal-500 to-emerald-600 hover:from-sky-600 hover:to-emerald-700 transition-all flex items-center justify-center gap-2 shadow-md hover:shadow-teal-500/10 border-none cursor-pointer active:scale-[0.99] mt-2"
      >
        <Download className="w-4 h-4" /> 📄 Download Tailored Resume (PDF)
      </button>
    </div>
  );
}

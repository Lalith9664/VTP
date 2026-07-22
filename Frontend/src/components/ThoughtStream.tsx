"use client";

import React, { useEffect, useState, useRef } from 'react';
import { Terminal } from 'lucide-react';

const initialLogs = [
  '🕵️‍♂️ Agent 1: Scraping 50 fresher jobs from JSearch...',
  '🧠 Agent 1: Enriching job descriptions with LLM...',
  '✅ Agent 1: 30 jobs saved to database.',
  '🤖 Waiting for user to upload resume...'
];

const phrases = [
  "⏳ Agent 2: Parsing uploaded PDF resume segments...",
  "🧠 Agent 3: Running skill extraction modeling...",
  "🎯 Agent 1: Aligning resume content with job requirements...",
  "✅ Agent 2: Calculated ATS alignment vector (Confidence: 96%).",
  "🕵️‍♂️ Agent 3: Scanning LinkedIn API matches...",
  "⏳ Agent 1: Extracting key technology tags...",
  "🧠 Agent 2: Analyzing anti-matching triggers in candidates profile...",
  "✅ Agent 3: Successfully generated matching score matrices."
];

export function ThoughtStream() {
  const [logs, setLogs] = useState(initialLogs);
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const interval = setInterval(() => {
      const randomPhrase = phrases[Math.floor(Math.random() * phrases.length)];
      setLogs(prev => [...prev, randomPhrase]);
    }, 4500);
    return () => clearInterval(interval);
  }, []);

  useEffect(() => {
    if (containerRef.current) {
      containerRef.current.scrollTop = containerRef.current.scrollHeight;
    }
  }, [logs]);

  return (
    <div className="flex flex-col gap-2 w-full text-left">
      <div className="flex items-center gap-2 px-1">
        <Terminal className="w-4 h-4 text-emerald-500" />
        <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Agent Thought Stream (Live Logs)</span>
      </div>
      
      <div 
        ref={containerRef}
        className="bg-slate-900/90 dark:bg-black/80 text-emerald-400 font-mono p-4 rounded-2xl h-44 overflow-y-auto text-xs flex flex-col gap-1.5 border-none neu-pressed shadow-inner"
      >
        {logs.map((log, i) => (
          <div key={i} className="flex items-start gap-1.5 leading-relaxed">
            <span className="text-emerald-600 font-bold select-none">&gt;</span>
            <span>{log}</span>
          </div>
        ))}
      </div>
    </div>
  );
}

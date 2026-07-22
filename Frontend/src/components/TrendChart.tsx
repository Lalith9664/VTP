"use client";

import React from 'react';
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer } from 'recharts';

interface TrendItem {
  skill_name: string;
  frequency: number;
}

interface TrendChartProps {
  data: TrendItem[];
}

export function TrendChart({ data }: TrendChartProps) {
  return (
    <div className="h-64 w-full p-4 rounded-3xl border-none neu-card flex flex-col gap-3 text-left">
      <h3 className="font-extrabold text-slate-200 text-xs uppercase tracking-wider pl-1">📊 Trending Skills Today</h3>
      <ResponsiveContainer width="100%" height="85%">
        <BarChart data={data} margin={{ top: 10, right: 10, left: -25, bottom: 0 }}>
          <XAxis 
            dataKey="skill_name" 
            stroke="#94a3b8" 
            fontSize={9} 
            tickLine={false} 
            axisLine={false}
          />
          <YAxis 
            stroke="#94a3b8" 
            fontSize={9} 
            tickLine={false} 
            axisLine={false}
          />
          <Tooltip 
            contentStyle={{ 
              backgroundColor: 'var(--surface)', 
              borderColor: 'rgba(255,255,255,0.05)',
              borderRadius: '12px',
              fontSize: '10px',
              color: 'var(--foreground)'
            }} 
          />
          <Bar dataKey="frequency" fill="var(--accent)" radius={[4, 4, 0, 0]} />
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
}

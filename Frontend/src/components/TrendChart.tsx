"use client";

import React from "react";
import {
  BarChart, Bar, XAxis, YAxis, Tooltip,
  ResponsiveContainer, Cell,
} from "recharts";

// ─── Type matching FastAPI trending_skills array item ─────────────────────────
export interface TrendSkillItem {
  skill_name: string;
  frequency: number;
}

export interface TrendChartProps {
  /** Array from GET /api/dashboard/insights → trending_skills */
  data: TrendSkillItem[];
  /** Optional title override */
  title?: string;
}

// Gradient colour ramp for bars (teal → emerald → sky)
const BAR_COLORS = [
  "#2dd4bf", "#34d399", "#38bdf8", "#818cf8", "#a78bfa",
  "#2dd4bf", "#34d399", "#38bdf8", "#818cf8", "#a78bfa",
];

const CustomTooltip = ({ active, payload }: any) => {
  if (!active || !payload?.length) return null;
  const { skill_name, frequency } = payload[0].payload as TrendSkillItem;
  return (
    <div
      style={{
        background: "var(--surface, #1e293b)",
        border: "1px solid rgba(255,255,255,0.06)",
        borderRadius: 10,
        padding: "8px 12px",
        fontSize: 11,
        color: "var(--foreground, #e2e8f0)",
      }}
    >
      <p className="font-bold">{skill_name}</p>
      <p className="text-teal-400 font-semibold">{frequency} job postings</p>
    </div>
  );
};

export function TrendChart({ data, title = "📊 Trending Skills Today" }: TrendChartProps) {
  if (!data || data.length === 0) {
    return (
      <div className="h-64 w-full p-4 rounded-3xl border-none neu-card flex items-center justify-center">
        <p className="text-xs text-slate-400 font-semibold">No trend data available yet.</p>
      </div>
    );
  }

  return (
    <div className="h-64 w-full p-4 rounded-3xl border-none neu-card flex flex-col gap-3 text-left">
      <h3 className="font-extrabold text-slate-200 text-xs uppercase tracking-wider pl-1">
        {title}
      </h3>
      <ResponsiveContainer width="100%" height="85%">
        <BarChart
          data={data}
          margin={{ top: 10, right: 10, left: -25, bottom: 0 }}
        >
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
          <Tooltip content={<CustomTooltip />} cursor={{ fill: "rgba(255,255,255,0.03)" }} />
          <Bar dataKey="frequency" radius={[4, 4, 0, 0]}>
            {data.map((_, index) => (
              <Cell key={index} fill={BAR_COLORS[index % BAR_COLORS.length]} />
            ))}
          </Bar>
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
}

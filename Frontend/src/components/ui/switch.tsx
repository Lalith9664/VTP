"use client";

import React from "react";
import { motion } from "framer-motion";

interface SwitchProps {
  checked: boolean;
  onCheckedChange: (checked: boolean) => void;
  className?: string;
}

export function Switch({ checked, onCheckedChange, className = "" }: SwitchProps) {
  return (
    <button
      type="button"
      onClick={() => onCheckedChange(!checked)}
      className={`relative w-12 h-6 rounded-full p-0.5 transition-all duration-300 border-none outline-none cursor-pointer flex items-center ${
        checked 
          ? "bg-[var(--accent)] shadow-inner" 
          : "bg-slate-700/30 dark:bg-slate-900/60 shadow-inner"
      } ${className}`}
    >
      <motion.div
        layout
        transition={{ type: "spring", stiffness: 500, damping: 30 }}
        className="w-5 h-5 rounded-full bg-white shadow-md flex-shrink-0"
        style={{ 
          marginLeft: checked ? "auto" : "0px",
          marginRight: checked ? "0px" : "auto"
        }}
      />
    </button>
  );
}

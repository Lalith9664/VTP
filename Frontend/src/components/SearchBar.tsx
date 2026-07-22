"use client";

import React, { useState } from "react";
import { Search, Loader2 } from "lucide-react";
import { toast } from "sonner";
import { searchJobs, type JobMatch } from "@/lib/api";

export interface SearchBarProps {
  /** Receives the matched jobs from the backend */
  onSearchResults: (matches: JobMatch[]) => void;
}

export function SearchBar({ onSearchResults }: SearchBarProps) {
  const [query,   setQuery]   = useState("");
  const [loading, setLoading] = useState(false);

  const handleSearch = async () => {
    const trimmed = query.trim();
    if (!trimmed) {
      toast.warning("Please enter a search query.");
      return;
    }

    setLoading(true);
    try {
      const res = await searchJobs(trimmed, 10, 0.3);
      onSearchResults(res.results || []);

      if (res.results.length === 0) {
        toast.info(`No matches found for "${trimmed}". Try a different query.`);
      } else {
        toast.success(`Found ${res.results.length} matches for "${trimmed}" ✨`);
      }
    } catch (err: any) {
      toast.error("Search failed.", {
        description: err.message || "Check your connection and try again.",
      });
      onSearchResults([]);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex gap-3 w-full max-w-3xl items-center text-left">
      <div className="relative flex-1">
        <Search className="absolute left-4 top-3.5 w-4 h-4 text-slate-400" />
        <input
          id="job-search-input"
          type="text"
          placeholder="Describe your dream job (e.g., 'React developer at a fintech startup')..."
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          onKeyDown={(e) => e.key === "Enter" && !loading && handleSearch()}
          disabled={loading}
          className="w-full h-11 rounded-xl pl-11 pr-4 text-xs font-semibold text-slate-350 neu-input border-none disabled:opacity-60"
        />
      </div>
      <button
        id="job-search-btn"
        onClick={handleSearch}
        disabled={loading}
        className="h-11 bg-gradient-to-r from-teal-400 to-emerald-500 hover:from-teal-500 hover:to-emerald-600 text-white px-6 rounded-xl font-bold text-xs flex items-center justify-center gap-2 shadow-md hover:shadow-teal-500/10 border-none cursor-pointer disabled:opacity-50 transition-all active:scale-[0.98]"
      >
        {loading ? (
          <>
            <Loader2 className="w-3.5 h-3.5 animate-spin" />
            <span>Searching...</span>
          </>
        ) : (
          <span>Find Jobs</span>
        )}
      </button>
    </div>
  );
}

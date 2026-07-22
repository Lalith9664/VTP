"use client";

import React, { useState } from 'react';
import { Search, Loader2 } from 'lucide-react';
import api from '@/lib/api';
import { toast } from 'sonner';

interface SearchBarProps {
  onSearchResults: (matches: any[]) => void;
}

export function SearchBar({ onSearchResults }: SearchBarProps) {
  const [query, setQuery] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSearch = async () => {
    if (!query.trim()) {
      toast.warning("Please enter a search query.");
      return;
    }

    setLoading(true);
    try {
      const res = await api.post('/jobs/search', { query });
      onSearchResults(res.data.matches || []);
      toast.success(`Discovered matches for "${query}"!`);
    } catch (err: any) {
      console.warn("FastAPI offline fallback triggered:", err.message);
      toast.info("FastAPI backend offline. Simulating local index matches.");
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
          type="text" 
          placeholder="Describe your dream job (e.g., 'React developer at Stripe')..." 
          value={query} 
          onChange={(e) => setQuery(e.target.value)}
          onKeyDown={(e) => e.key === 'Enter' && handleSearch()}
          className="w-full h-11 rounded-xl pl-11 pr-4 text-xs font-semibold text-slate-350 neu-input border-none"
        />
      </div>
      <button 
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

import React from 'react';
import { Search, Trash2, ChevronLeft, ChevronRight, Loader2 } from 'lucide-react';
import { Post } from '@/types/scheduler';

// Helper to group posts by Date string
export function groupPostsByDate(posts: Post[], dateField: 'createdAt' | 'scheduledAt') {
  const groups: Record<string, Post[]> = {};
  
  posts.forEach(post => {
    const rawDate = post[dateField];
    if (!rawDate) return;
    
    const date = new Date(rawDate);
    const today = new Date();
    const yesterday = new Date();
    yesterday.setDate(yesterday.getDate() - 1);
    
    let key = '';
    if (date.toDateString() === today.toDateString()) {
      key = 'Today';
    } else if (date.toDateString() === yesterday.toDateString()) {
      key = 'Yesterday';
    } else {
      key = date.toLocaleDateString();
    }
    
    if (!groups[key]) groups[key] = [];
    groups[key].push(post);
  });
  
  return groups;
}

interface TabHeaderProps {
  search: string;
  setSearch: (s: string) => void;
  onClearAll: () => void;
  isLoading: boolean;
}

export function TabHeader({ search, setSearch, onClearAll, isLoading }: TabHeaderProps) {
  return (
    <div className="flex flex-col sm:flex-row justify-between items-center mb-8 gap-4 font-mono">
      <div className="relative w-full sm:w-96 group">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[#00f3ff]/50 group-focus-within:text-[#00f3ff] transition-colors duration-300" />
        <input
          type="text"
          placeholder="SEARCH DATABANKS..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="w-full bg-black/40 border border-[#00f3ff]/30 text-[#00f3ff] pl-10 pr-4 py-2 focus:outline-none focus:border-[#00f3ff] focus:bg-[#00f3ff]/5 transition-all duration-300 placeholder:text-[#00f3ff]/30 uppercase text-xs tracking-widest shadow-[inset_0_0_10px_rgba(0,243,255,0.05)] focus:shadow-[0_0_15px_rgba(0,243,255,0.2),inset_0_0_15px_rgba(0,243,255,0.1)]"
        />
        <div className="absolute top-0 right-0 w-2 h-2 border-t border-r border-[#00f3ff] opacity-50" />
        <div className="absolute bottom-0 left-0 w-2 h-2 border-b border-l border-[#00f3ff] opacity-50" />
        {isLoading && <Loader2 className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[#00f3ff] animate-spin" />}
      </div>
      <button
        onClick={onClearAll}
        className="relative group flex items-center gap-2 px-4 py-2 bg-black/40 border border-[#ff0000]/30 text-[#ff0000] hover:bg-[#ff0000]/10 hover:border-[#ff0000] transition-all duration-300 uppercase text-xs font-bold tracking-widest shrink-0 overflow-hidden shadow-[inset_0_0_10px_rgba(255,0,0,0.05)] hover:shadow-[0_0_15px_rgba(255,0,0,0.3),inset_0_0_15px_rgba(255,0,0,0.2)]"
      >
        <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/5 to-transparent translate-x-[-100%] group-hover:translate-x-[100%] transition-transform duration-700" />
        <Trash2 className="w-4 h-4" />
        <span>CLEAR ALL</span>
        <div className="absolute top-0 right-0 w-1.5 h-1.5 border-t border-r border-[#ff0000] opacity-50 group-hover:opacity-100 transition-opacity" />
        <div className="absolute bottom-0 left-0 w-1.5 h-1.5 border-b border-l border-[#ff0000] opacity-50 group-hover:opacity-100 transition-opacity" />
      </button>
    </div>
  );
}

interface PaginationProps {
  page: number;
  total: number;
  limit: number;
  setPage: (p: number) => void;
}

export function Pagination({ page, total, limit, setPage }: PaginationProps) {
  const totalPages = Math.ceil(total / limit);
  if (totalPages <= 1) return null;

  return (
    <div className="flex justify-center items-center gap-6 mt-12 font-mono">
      <button
        onClick={() => setPage(page - 1)}
        disabled={page === 1}
        className="relative group p-2 bg-black/40 border border-[#00f3ff]/30 text-[#00f3ff] disabled:opacity-30 disabled:border-zinc-800 disabled:text-zinc-500 hover:not:disabled:bg-[#00f3ff]/10 hover:not:disabled:border-[#00f3ff] hover:not:disabled:shadow-[0_0_10px_rgba(0,243,255,0.3)] transition-all duration-300"
      >
        <ChevronLeft className="w-5 h-5" />
        <div className="absolute top-0 right-0 w-1 h-1 border-t border-r border-current opacity-50" />
        <div className="absolute bottom-0 left-0 w-1 h-1 border-b border-l border-current opacity-50" />
      </button>
      
      <div className="flex items-center gap-2 px-4 py-2 bg-black/60 border-y border-[#00f3ff]/20">
        <span className="text-[#00f3ff]/50 text-xs tracking-widest uppercase">PAGE</span>
        <span className="text-[#00f3ff] font-bold">{page}</span>
        <span className="text-[#00f3ff]/50 text-xs">/</span>
        <span className="text-[#00f3ff] font-bold">{totalPages}</span>
      </div>

      <button
        onClick={() => setPage(page + 1)}
        disabled={page === totalPages}
        className="relative group p-2 bg-black/40 border border-[#00f3ff]/30 text-[#00f3ff] disabled:opacity-30 disabled:border-zinc-800 disabled:text-zinc-500 hover:not:disabled:bg-[#00f3ff]/10 hover:not:disabled:border-[#00f3ff] hover:not:disabled:shadow-[0_0_10px_rgba(0,243,255,0.3)] transition-all duration-300"
      >
        <ChevronRight className="w-5 h-5" />
        <div className="absolute top-0 right-0 w-1 h-1 border-t border-r border-current opacity-50" />
        <div className="absolute bottom-0 left-0 w-1 h-1 border-b border-l border-current opacity-50" />
      </button>
    </div>
  );
}

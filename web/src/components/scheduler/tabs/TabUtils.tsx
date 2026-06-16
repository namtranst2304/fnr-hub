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
    <div className="flex flex-col sm:flex-row justify-between items-center mb-6 gap-4">
      <div className="relative w-full sm:w-96">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-400" />
        <input
          type="text"
          placeholder="Search posts..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="w-full bg-zinc-900 border border-zinc-800 text-white pl-10 pr-4 py-2 rounded-xl focus:outline-none focus:border-[#00f3ff] transition-colors"
        />
        {isLoading && <Loader2 className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[#00f3ff] animate-spin" />}
      </div>
      <button
        onClick={onClearAll}
        className="flex items-center gap-2 px-4 py-2 bg-red-500/10 text-red-400 border border-red-500/20 rounded-xl hover:bg-red-500/20 hover:text-red-300 transition-colors shrink-0"
      >
        <Trash2 className="w-4 h-4" />
        Clear All
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
    <div className="flex justify-center items-center gap-4 mt-8">
      <button
        onClick={() => setPage(page - 1)}
        disabled={page === 1}
        className="p-2 rounded-lg bg-zinc-900 border border-zinc-800 disabled:opacity-50 disabled:cursor-not-allowed hover:bg-zinc-800 transition-colors"
      >
        <ChevronLeft className="w-5 h-5 text-white" />
      </button>
      <span className="text-zinc-400 font-mono">
        Page {page} of {totalPages}
      </span>
      <button
        onClick={() => setPage(page + 1)}
        disabled={page === totalPages}
        className="p-2 rounded-lg bg-zinc-900 border border-zinc-800 disabled:opacity-50 disabled:cursor-not-allowed hover:bg-zinc-800 transition-colors"
      >
        <ChevronRight className="w-5 h-5 text-white" />
      </button>
    </div>
  );
}

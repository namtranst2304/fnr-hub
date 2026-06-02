'use client';

import { Plus, MessageSquare, Settings, Database } from 'lucide-react';

export function ChatSidebar() {
  return (
    <aside className="w-[260px] flex flex-col bg-zinc-50 border-r border-zinc-200 shrink-0">
      {/* Branding */}
      <div className="flex items-center gap-3 h-16 px-4 border-b border-zinc-200 shrink-0">
        <div className="w-8 h-8 bg-blue-600 rounded flex items-center justify-center text-white">
          <Database className="w-4 h-4" />
        </div>
        <div>
          <div className="font-semibold text-sm">FNR Hub</div>
          <div className="text-[10px] text-zinc-500 font-medium">WORKSPACE</div>
        </div>
      </div>

      {/* New Chat */}
      <div className="p-3 shrink-0">
        <button className="flex items-center gap-2 w-full p-2 bg-white border border-zinc-200 hover:bg-zinc-100 rounded text-sm text-zinc-700 transition-colors">
          <Plus className="w-4 h-4" />
          New Chat
        </button>
      </div>

      {/* History */}
      <nav className="flex-1 min-h-0 overflow-y-auto px-3 py-1 space-y-1">
        <div className="px-2 py-1 text-xs font-semibold text-zinc-500">Recent</div>
        <button className="flex items-center gap-2 w-full p-2 text-sm text-zinc-600 hover:text-zinc-900 hover:bg-zinc-200 rounded text-left transition-colors">
          <MessageSquare className="w-4 h-4 shrink-0" />
          <span className="truncate">Dịch bài viết React 19</span>
        </button>
        <button className="flex items-center gap-2 w-full p-2 text-sm text-zinc-600 hover:text-zinc-900 hover:bg-zinc-200 rounded text-left transition-colors">
          <MessageSquare className="w-4 h-4 shrink-0" />
          <span className="truncate">Chia chương sách AI</span>
        </button>
      </nav>

      {/* Settings */}
      <div className="p-4 border-t border-zinc-200 shrink-0">
        <button className="flex items-center gap-2 text-sm text-zinc-600 hover:text-zinc-900 transition-colors">
          <Settings className="w-4 h-4" />
          Settings
        </button>
      </div>
    </aside>
  );
}

import { FileText, Terminal, Zap } from 'lucide-react';
import { Post } from '@/types/scheduler';
import { formatDate } from '@/lib/utils';

interface PendingTabProps {
  posts: Post[];
  scrapeUrl: string;
  setScrapeUrl: (val: string) => void;
  isScraping: boolean;
  handleScrape: () => void;
  openModal: (post: Post) => void;
}

export function PendingTab({
  posts,
  scrapeUrl,
  setScrapeUrl,
  isScraping,
  handleScrape,
  openModal
}: PendingTabProps) {
  return (
    <div className="max-w-5xl mx-auto space-y-4">
      {/* Scraper Input */}
      <div className="flex bg-black/80 border border-[#ff00ff]/50 shadow-[0_0_10px_rgba(255,0,255,0.1)] focus-within:shadow-[0_0_15px_rgba(255,0,255,0.4)] transition-all duration-300 ease-out mb-8">
        <input
          type="text"
          placeholder="INPUT DATA_SOURCE_URL TO SCRAPE..."
          value={scrapeUrl}
          onChange={(e) => setScrapeUrl(e.target.value)}
          className="px-6 py-3 bg-transparent text-sm font-medium outline-none text-[#ff00ff] placeholder:text-[#ff00ff]/30 w-full"
        />
        <button
          onClick={handleScrape}
          disabled={isScraping}
          className="bg-[#ff00ff]/20 hover:bg-[#ff00ff] text-[#ff00ff] hover:text-black border-l border-[#ff00ff]/50 px-8 py-3 text-sm font-bold transition-all duration-300 ease-out disabled:opacity-50 flex items-center justify-center gap-2 uppercase tracking-wider shrink-0"
        >
          {isScraping ? <div className="w-4 h-4 border-2 border-black/30 border-t-black rounded-none animate-spin" /> : "EXECUTE"}
        </button>
      </div>

      {posts.length === 0 ? (
        <div className="text-center py-20 text-zinc-500 border border-zinc-800 bg-black/40">
          <Terminal className="w-16 h-16 mx-auto mb-4 text-zinc-700" />
          <p className="text-lg font-medium tracking-widest uppercase">SYS.QUEUE_EMPTY</p>
          <div className="mt-2 w-32 h-1 bg-zinc-800 mx-auto" />
        </div>
      ) : (
        posts.map((post) => (
          <div
            key={post.id}
            onClick={() => openModal(post)}
            className="bg-black/60 p-5 border border-zinc-700 hover:border-[#00f3ff] hover:shadow-[0_0_15px_rgba(0,243,255,0.2)] flex items-start gap-4 cursor-pointer transition-all duration-300 ease-out group relative overflow-hidden"
          >
            <div className="absolute top-0 left-0 w-1 h-full bg-zinc-700 group-hover:bg-[#00f3ff]" />
            <div className="w-10 h-10 bg-zinc-900 flex items-center justify-center shrink-0 border border-zinc-700 group-hover:border-[#00f3ff]/50 group-hover:bg-[#00f3ff]/10 transition-colors duration-300 ease-out">
              <FileText className="w-5 h-5 text-zinc-400 group-hover:text-[#00f3ff]" />
            </div>
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-3 mb-2">
                <span className="px-2 py-0.5 bg-[#fce205]/10 text-[#fce205] border border-[#fce205]/30 text-[10px] font-bold tracking-widest">
                  [{post.status}]
                </span>
                <span className="text-[10px] text-zinc-500 tracking-wider">SRC_ID: {post.sourcePostId}</span>
                <span className="text-[10px] text-zinc-500 tracking-wider">TS: {formatDate(post.createdAt)}</span>
              </div>
              <h3 className="text-zinc-300 font-medium text-sm leading-relaxed group-hover:text-white">
                {post.originalText.substring(0, 150)}...
              </h3>
            </div>
            <div className="shrink-0 pl-4 text-[#00f3ff] font-bold text-xs uppercase tracking-widest opacity-0 group-hover:opacity-100 transition-opacity duration-300 ease-out flex items-center gap-1">
              <Zap className="w-3 h-3" /> ANALYZE
            </div>
          </div>
        ))
      )}
    </div>
  );
}

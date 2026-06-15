import { FileText, Terminal, ArrowRight, Check } from 'lucide-react';
import { Post } from '@/types/scheduler';
import { formatDate } from '@/lib/utils';

interface RawTabProps {
  posts: Post[];
  scrapeUrl: string;
  setScrapeUrl: (val: string) => void;
  isScraping: boolean;
  handleScrape: () => void;
  handleSendToAI: (post: Post) => void;
  handlePushToSchedule: (post: Post) => void;
}

export function RawTab({
  posts,
  scrapeUrl,
  setScrapeUrl,
  isScraping,
  handleScrape,
  handleSendToAI,
  handlePushToSchedule
}: RawTabProps) {
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
          <p className="text-lg font-medium tracking-widest uppercase">RAW_QUEUE_EMPTY</p>
          <div className="mt-2 w-32 h-1 bg-zinc-800 mx-auto" />
        </div>
      ) : (
        posts.map((post) => (
          <div
            key={post.id}
            className="bg-black/60 p-5 border border-zinc-700 flex flex-col items-start gap-4 transition-all duration-300 ease-out group relative overflow-hidden"
          >
            <div className="absolute top-0 left-0 w-1 h-full bg-zinc-700 group-hover:bg-[#ff00ff]" />
            <div className="flex w-full items-start gap-4">
              <div className="w-10 h-10 bg-zinc-900 flex items-center justify-center shrink-0 border border-zinc-700 group-hover:border-[#ff00ff]/50 group-hover:bg-[#ff00ff]/10 transition-colors duration-300 ease-out">
                <FileText className="w-5 h-5 text-zinc-400 group-hover:text-[#ff00ff]" />
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-3 mb-2">
                  <span className="px-2 py-0.5 bg-[#ff00ff]/10 text-[#ff00ff] border border-[#ff00ff]/30 text-[10px] font-bold tracking-widest">
                    [{post.status}]
                  </span>
                  <span className="text-[10px] text-zinc-500 tracking-wider">SRC_ID: {post.sourcePostId}</span>
                  <span className="text-[10px] text-zinc-500 tracking-wider">TS: {formatDate(post.createdAt)}</span>
                </div>
                <div className="flex gap-4">
                  {post.imageUrl && (
                    <div className="w-16 h-16 shrink-0 border border-[#ff00ff]/30 overflow-hidden relative">
                      <div className="absolute inset-0 bg-[linear-gradient(to_bottom,rgba(255,0,255,0.03)_50%,rgba(0,0,0,0.25)_50%)] bg-[size:100%_4px] pointer-events-none z-10" />
                      <img src={post.imageUrl} alt="thumbnail" className="w-full h-full object-cover" />
                    </div>
                  )}
                  <h3 className="text-zinc-300 font-medium text-sm leading-relaxed flex-1">
                    {post.originalText.substring(0, 200)}...
                  </h3>
                </div>
              </div>
            </div>

            {/* Action Buttons */}
            <div className="flex items-center gap-4 w-full mt-2 justify-end border-t border-zinc-800 pt-4">
              <button
                onClick={() => handleSendToAI(post)}
                className="flex items-center gap-2 px-4 py-2 bg-black border border-[#00f3ff]/50 text-[#00f3ff] hover:bg-[#00f3ff]/20 hover:border-[#00f3ff] text-xs font-bold uppercase tracking-widest transition-all duration-300"
              >
                SEND TO AI <ArrowRight className="w-4 h-4" />
              </button>
              <button
                onClick={() => handlePushToSchedule(post)}
                className="flex items-center gap-2 px-4 py-2 bg-black border border-[#fce205]/50 text-[#fce205] hover:bg-[#fce205]/20 hover:border-[#fce205] text-xs font-bold uppercase tracking-widest transition-all duration-300"
              >
                PUSH TO SCHEDULE <Check className="w-4 h-4" />
              </button>
            </div>
          </div>
        ))
      )}
    </div>
  );
}

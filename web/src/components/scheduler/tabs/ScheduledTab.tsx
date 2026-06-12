import { Clock, CheckCircle2 } from 'lucide-react';
import { Post } from '@/types/scheduler';
import { formatDate } from '@/lib/utils';

interface ScheduledTabProps {
  scheduledPosts: Post[];
}

export function ScheduledTab({ scheduledPosts }: ScheduledTabProps) {
  const pendingExecPosts = scheduledPosts.filter(p => p.status === 'SCHEDULED');
  const postedPosts = scheduledPosts.filter(p => p.status === 'POSTED');
  const failedPosts = scheduledPosts.filter(p => p.status === 'FAILED');

  return (
    <div className="max-w-6xl mx-auto grid grid-cols-1 lg:grid-cols-2 gap-8">
      {/* Pending Execution */}
      <div className="space-y-4 relative">
        <div className="absolute top-0 -left-4 w-1 h-full bg-[#fce205]/20 hidden lg:block" />
        <h2 className="font-bold text-[#fce205] text-lg uppercase tracking-widest flex items-center gap-2 mb-6">
          <Clock className="w-5 h-5" /> MEMORY.SCHEDULED
        </h2>
        {pendingExecPosts.length === 0 && (
          <p className="text-zinc-600 text-sm italic">NO_PROCESSES_FOUND</p>
        )}
        {pendingExecPosts.map(post => (
          <div key={post.id} className="bg-black/60 p-5 border border-[#fce205]/30 shadow-[0_0_10px_rgba(252,226,5,0.05)] relative overflow-hidden group">
            <div className="absolute top-0 left-0 w-full h-0.5 bg-[#fce205]" />
            <div className="flex justify-between items-start mb-3">
              <span className="px-2 py-0.5 bg-[#fce205]/20 text-[#fce205] text-[10px] font-bold tracking-widest border border-[#fce205]/40">PENDING_EXEC</span>
              <span className="text-xs text-[#00f3ff] bg-[#00f3ff]/10 px-2 py-1 border border-[#00f3ff]/20">
                T-{post.scheduledAt ? formatDate(post.scheduledAt, 'en-GB') : 'UNKNOWN'}
              </span>
            </div>
            <p className="text-sm text-zinc-300 line-clamp-3 mb-3">{post.rewrittenText}</p>
            <p className="text-[10px] text-zinc-600">TRG_ID: {post.fbPostId || 'AWAITING_ALLOCATION'}</p>
          </div>
        ))}
      </div>

      {/* Posted & Failed */}
      <div className="space-y-4 relative">
        <div className="absolute top-0 -left-4 w-1 h-full bg-[#00f3ff]/20 hidden lg:block" />
        <h2 className="font-bold text-[#00f3ff] text-lg uppercase tracking-widest flex items-center gap-2 mb-6">
          <CheckCircle2 className="w-5 h-5" /> MEMORY.POSTED
        </h2>
        {postedPosts.length === 0 && failedPosts.length === 0 && (
          <p className="text-zinc-600 text-sm italic">NO_LOGS_FOUND</p>
        )}
        
        {postedPosts.map(post => (
          <div key={post.id} className="bg-black/40 p-4 border border-[#00f3ff]/20 opacity-70">
            <span className="text-[10px] text-[#00f3ff] mb-2 block tracking-widest">SUCCESS_OK</span>
            <p className="text-xs text-zinc-400 line-clamp-2">{post.rewrittenText}</p>
          </div>
        ))}

        {failedPosts.map(post => (
          <div key={post.id} className="bg-[#ff0000]/10 p-4 border border-[#ff0000]/40 shadow-[0_0_10px_rgba(255,0,0,0.1)]">
            <span className="text-[10px] text-[#ff0000] font-bold mb-2 block tracking-widest animate-pulse">ERR_FATAL</span>
            <p className="text-xs text-[#ff0000]/80 line-clamp-2">{post.rewrittenText}</p>
          </div>
        ))}
      </div>
    </div>
  );
}

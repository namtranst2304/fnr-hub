import { useState } from 'react';
import { Clock, CheckCircle2, X, Save, ArrowLeft } from 'lucide-react';
import { Post } from '@/types/scheduler';
import { formatDate } from '@/lib/utils';
import { motion, AnimatePresence } from 'framer-motion';

interface ScheduledTabProps {
  scheduledPosts: Post[];
  onUpdateScheduledPost?: (post: Post, newText: string, newImageUrl?: string) => Promise<void>;
  onCancelSchedule?: (post: Post) => Promise<void>;
}

export function ScheduledTab({ scheduledPosts, onUpdateScheduledPost, onCancelSchedule }: ScheduledTabProps) {
  const [selectedPost, setSelectedPost] = useState<Post | null>(null);
  const [editedText, setEditedText] = useState('');
  const [editedImageUrl, setEditedImageUrl] = useState('');

  const pendingExecPosts = scheduledPosts.filter(p => p.status === 'SCHEDULED');
  const postedPosts = scheduledPosts.filter(p => p.status === 'POSTED');
  const failedPosts = scheduledPosts.filter(p => p.status === 'FAILED');

  const handleOpenModal = (post: Post) => {
    setSelectedPost(post);
    setEditedText(post.rewrittenText || post.originalText || '');
    setEditedImageUrl(post.imageUrl || '');
  };

  const handleSave = async () => {
    if (selectedPost && onUpdateScheduledPost) {
      await onUpdateScheduledPost(selectedPost, editedText, editedImageUrl);
      setSelectedPost(null);
    }
  };

  const handleCancel = async () => {
    if (selectedPost && onCancelSchedule) {
      await onCancelSchedule(selectedPost);
      setSelectedPost(null);
    }
  };

  return (
    <>
      <div className="max-w-6xl mx-auto grid grid-cols-1 lg:grid-cols-2 gap-8 relative">
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
            <div 
              key={post.id} 
              onClick={() => handleOpenModal(post)}
              className="bg-black/60 p-5 border border-[#fce205]/30 shadow-[0_0_10px_rgba(252,226,5,0.05)] relative overflow-hidden group cursor-pointer hover:border-[#fce205]/80 hover:bg-black/80 transition-all duration-300 ease-out"
            >
              <div className="absolute top-0 left-0 w-full h-0.5 bg-[#fce205] group-hover:shadow-[0_0_8px_#fce205]" />
              <div className="flex justify-between items-start mb-3">
                <span className="px-2 py-0.5 bg-[#fce205]/20 text-[#fce205] text-[10px] font-bold tracking-widest border border-[#fce205]/40">PENDING_EXEC</span>
                <span className="text-xs text-[#00f3ff] bg-[#00f3ff]/10 px-2 py-1 border border-[#00f3ff]/20">
                  T-{post.scheduledAt ? formatDate(post.scheduledAt, 'en-GB') : 'UNKNOWN'}
                </span>
              </div>
              <div className="flex gap-4 mb-3">
                {post.imageUrl && (
                  <div className="w-16 h-16 shrink-0 border border-[#fce205]/30 overflow-hidden relative">
                    <div className="absolute inset-0 bg-[linear-gradient(to_bottom,rgba(252,226,5,0.03)_50%,rgba(0,0,0,0.25)_50%)] bg-[size:100%_4px] pointer-events-none z-10" />
                    <img src={post.imageUrl} alt="thumbnail" className="w-full h-full object-cover" />
                  </div>
                )}
                <p className="text-sm text-zinc-300 line-clamp-3">{post.rewrittenText}</p>
              </div>
              <div className="flex justify-between items-end">
                <p className="text-[10px] text-zinc-600">TRG_ID: {post.fbPostId || 'AWAITING_ALLOCATION'}</p>
                <span className="text-[10px] text-[#fce205] opacity-0 group-hover:opacity-100 transition-opacity font-bold flex items-center gap-1">
                  EDIT <ArrowLeft className="w-3 h-3 rotate-180" />
                </span>
              </div>
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
              <div className="flex gap-4">
                {post.imageUrl && (
                  <div className="w-12 h-12 shrink-0 border border-[#00f3ff]/30 overflow-hidden relative">
                    <img src={post.imageUrl} alt="thumbnail" className="w-full h-full object-cover grayscale opacity-80" />
                  </div>
                )}
                <p className="text-xs text-zinc-400 line-clamp-2 flex-1">{post.rewrittenText}</p>
              </div>
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

      {/* ─── MODAL EDIT ─── */}
      <AnimatePresence>
        {selectedPost && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm"
          >
            <motion.div
              initial={{ scale: 0.95, y: 20 }}
              animate={{ scale: 1, y: 0 }}
              exit={{ scale: 0.95, y: 20 }}
              className="bg-black border-2 border-[#fce205]/40 shadow-[0_0_30px_rgba(252,226,5,0.15)] w-full max-w-3xl flex flex-col max-h-[90vh]"
            >
              <div className="flex items-center justify-between px-6 py-3 border-b border-zinc-800 bg-[#fce205]/5">
                <div className="flex items-center gap-3">
                  <div className="w-2 h-2 bg-[#fce205] animate-pulse" />
                  <h2 className="font-bold text-sm tracking-widest uppercase text-[#fce205]">EDIT_SCHEDULE [0x{selectedPost.id.toString(16).toUpperCase()}]</h2>
                </div>
                <button onClick={() => setSelectedPost(null)} className="text-zinc-500 hover:text-[#fce205] transition-colors">
                  <X className="w-5 h-5" />
                </button>
              </div>
              
              <div className="p-6 flex-1 overflow-y-auto flex flex-col gap-4">
                <div className="bg-zinc-900/50 p-4 border border-zinc-800 text-xs font-mono text-zinc-400">
                  <p><span className="text-[#00f3ff]">SCHEDULED_FOR:</span> {selectedPost.scheduledAt ? formatDate(selectedPost.scheduledAt, 'en-GB') : 'UNKNOWN'}</p>
                  <p><span className="text-[#00f3ff]">TARGET_ID:</span> {selectedPost.fbPostId || 'AWAITING_ALLOCATION'}</p>
                </div>
                
                <div className="flex-1 flex flex-col min-h-[250px]">
                  <textarea
                    value={editedText}
                    onChange={e => setEditedText(e.target.value)}
                    className="w-full flex-1 p-4 bg-zinc-950 border border-zinc-800 text-sm text-zinc-200 outline-none resize-none leading-relaxed focus:border-[#fce205] focus:bg-[#fce205]/5 transition-colors duration-300 ease-out min-h-[200px]"
                    placeholder="Input modified text data..."
                  />
                </div>

                <div className="flex flex-col gap-2">
                  <label className="text-[10px] uppercase tracking-widest text-[#fce205]">IMAGE_URL_OVERRIDE</label>
                  <input
                    type="text"
                    value={editedImageUrl}
                    onChange={(e) => setEditedImageUrl(e.target.value)}
                    placeholder="Enter explicit image URL or generate one..."
                    className="w-full bg-zinc-900/80 border border-zinc-800 p-2 text-xs text-zinc-300 outline-none focus:border-[#fce205] transition-colors"
                  />
                </div>
              </div>

              <div className="p-4 border-t border-zinc-800 bg-zinc-900/50 flex flex-col sm:flex-row items-center justify-between gap-4">
                <button
                  onClick={handleCancel}
                  className="bg-transparent border border-[#ff00ff]/50 hover:bg-[#ff00ff]/20 text-[#ff00ff] px-4 py-2 text-xs font-bold uppercase tracking-widest transition-colors duration-300 ease-out w-full sm:w-auto"
                >
                  CANCEL_SCHEDULE
                </button>
                <div className="flex gap-4 w-full sm:w-auto">
                  <button
                    onClick={() => setSelectedPost(null)}
                    className="bg-transparent text-zinc-400 hover:text-zinc-200 px-4 py-2 text-xs font-bold uppercase tracking-widest transition-colors duration-300 ease-out w-full sm:w-auto"
                  >
                    DISCARD
                  </button>
                  <button
                    onClick={handleSave}
                    className="bg-[#fce205]/20 border border-[#fce205] hover:bg-[#fce205] text-[#fce205] hover:text-black px-6 py-2 text-xs font-bold uppercase tracking-widest transition-all duration-300 ease-out shadow-[0_0_10px_rgba(252,226,5,0.2)] w-full sm:w-auto flex items-center gap-2 justify-center"
                  >
                    <Save className="w-4 h-4" /> COMMIT_UPDATE
                  </button>
                </div>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}

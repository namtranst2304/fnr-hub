import { useState } from 'react';
import { Clock, CheckCircle2, X, Save, ArrowLeft, Trash2, CalendarClock } from 'lucide-react';
import { Post } from '@/types/scheduler';
import { formatDate } from '@/lib/utils';
import { motion, AnimatePresence } from 'framer-motion';
import { usePaginatedPosts } from '@/hooks/usePaginatedPosts';
import { groupPostsByDate, TabHeader, Pagination } from './TabUtils';
import { schedulerApi } from '@/app/api/schedulerApi';
import toast from 'react-hot-toast';

interface ScheduledTabProps {
  refreshKey: number;
  triggerRefresh: () => void;
  onUpdateScheduledPost?: (post: Post, newText: string, newImageUrl?: string) => Promise<void>;
  onCancelSchedule?: (post: Post) => Promise<void>;
}

export function ScheduledTab({ refreshKey, triggerRefresh, onUpdateScheduledPost, onCancelSchedule }: ScheduledTabProps) {
  const [selectedPost, setSelectedPost] = useState<Post | null>(null);
  const [editedText, setEditedText] = useState('');
  const [editedImageUrl, setEditedImageUrl] = useState('');

  const { posts, total, page, setPage, search, setSearch, isLoading, limit } = usePaginatedPosts('SCHEDULED,POSTED,FAILED', refreshKey);

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

  const handleDelete = async (post: Post) => {
    if (!confirm("Are you sure you want to delete this post permanently?")) return;
    try {
      const data = await schedulerApi.deletePost(post.id);
      if (data.success) {
        toast.success("Post deleted!");
        triggerRefresh();
      }
    } catch (err: unknown) {
      toast.error("Failed to delete post");
    }
  };

  const handleClearAll = async () => {
    if (!confirm("Are you sure you want to delete ALL Scheduled/Posted/Failed posts?")) return;
    try {
      const data = await schedulerApi.clearPostsByStatus('SCHEDULED,POSTED,FAILED');
      if (data.success) {
        toast.success(`Deleted ${data.deletedCount} posts!`);
        triggerRefresh();
      }
    } catch (err: unknown) {
      toast.error('Failed to clear posts');
    }
  };

  const groupedPosts = groupPostsByDate(posts, 'scheduledAt');

  return (
    <>
      <div className="max-w-6xl mx-auto">
        <TabHeader search={search} setSearch={setSearch} onClearAll={handleClearAll} isLoading={isLoading} />

        {posts.length === 0 ? (
          <div className="text-center py-20 text-zinc-500 border border-zinc-800 bg-black/40">
            <CalendarClock className="w-16 h-16 mx-auto mb-4 text-zinc-700" />
            <p className="text-lg font-medium tracking-widest uppercase">SCHEDULE_QUEUE_EMPTY</p>
            <div className="mt-2 w-32 h-1 bg-zinc-800 mx-auto" />
          </div>
        ) : (
          <div>
            {Object.entries(groupedPosts).map(([date, datePosts]) => (
              <div key={date} className="mb-8">
                <h3 className="text-[#fce205] font-bold uppercase tracking-widest border-b border-[#fce205]/20 pb-2 mb-4">
                  {date}
                </h3>
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                  {datePosts.map((post) => {
                    const isPending = post.status === 'SCHEDULED';
                    const isSuccess = post.status === 'POSTED';
                    const isFail = post.status === 'FAILED';
                    
                    const borderColor = isPending ? 'border-[#fce205]/30' : isSuccess ? 'border-[#00f3ff]/30' : 'border-[#ff0000]/40';
                    const hoverBorderColor = isPending ? 'hover:border-[#fce205]/80' : isSuccess ? 'hover:border-[#00f3ff]/80' : 'hover:border-[#ff0000]/80';
                    const bgClass = isPending ? 'bg-black/60' : isSuccess ? 'bg-black/40 opacity-80' : 'bg-[#ff0000]/10';

                    return (
                      <div 
                        key={post.id} 
                        className={`${bgClass} p-5 border ${borderColor} shadow-lg relative overflow-hidden group ${hoverBorderColor} transition-all duration-300 ease-out`}
                      >
                        <div className="flex justify-between items-start mb-3">
                          <span className={`px-2 py-0.5 text-[10px] font-bold tracking-widest border ${
                            isPending ? 'bg-[#fce205]/20 text-[#fce205] border-[#fce205]/40' :
                            isSuccess ? 'bg-[#00f3ff]/20 text-[#00f3ff] border-[#00f3ff]/40' :
                            'bg-[#ff0000]/20 text-[#ff0000] border-[#ff0000]/40 animate-pulse'
                          }`}>
                            {post.status}
                          </span>
                          <span className="text-xs text-zinc-400 bg-zinc-900 px-2 py-1 border border-zinc-800">
                            {post.scheduledAt ? formatDate(post.scheduledAt, 'en-GB') : 'UNKNOWN'}
                          </span>
                        </div>
                        
                        <div className="flex gap-4 mb-3">
                          {post.imageUrl && (
                            <div className={`w-16 h-16 shrink-0 border ${borderColor} overflow-hidden relative`}>
                              <img src={post.imageUrl} alt="thumbnail" className={`w-full h-full object-cover ${!isPending ? 'grayscale' : ''}`} />
                            </div>
                          )}
                          <p className="text-sm text-zinc-300 line-clamp-3 flex-1">{post.rewrittenText}</p>
                        </div>
                        
                        <div className="flex justify-between items-end mt-4 pt-4 border-t border-zinc-800/50">
                          <p className="text-[10px] text-zinc-600">TRG_ID: {post.fbPostId || 'N/A'}</p>
                          
                          <div className="flex gap-2">
                            {isPending && (
                              <>
                                <button
                                  onClick={() => handleOpenModal(post)}
                                  className="text-[10px] text-[#fce205] hover:bg-[#fce205]/20 px-2 py-1 font-bold flex items-center gap-1 transition-colors"
                                >
                                  EDIT <ArrowLeft className="w-3 h-3 rotate-180" />
                                </button>
                                <button
                                  onClick={() => { setSelectedPost(post); handleCancel(); }}
                                  className="text-[10px] text-orange-400 hover:bg-orange-400/20 px-2 py-1 font-bold flex items-center gap-1 transition-colors"
                                >
                                  CANCEL/BACK TO AI
                                </button>
                              </>
                            )}
                            <button
                              onClick={() => handleDelete(post)}
                              className="text-[10px] text-red-500 hover:bg-red-500/20 px-2 py-1 font-bold flex items-center gap-1 transition-colors"
                            >
                              <Trash2 className="w-3 h-3" /> DELETE
                            </button>
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            ))}
            <Pagination page={page} setPage={setPage} total={total} limit={limit} />
          </div>
        )}
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

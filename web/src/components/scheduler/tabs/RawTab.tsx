import { useState } from 'react';
import { FileText, Terminal, ArrowRight, Check, X, Save, Edit3 } from 'lucide-react';
import { Post } from '@/types/scheduler';
import { formatDate } from '@/lib/utils';
import { motion, AnimatePresence } from 'framer-motion';
import { usePaginatedPosts } from '@/hooks/usePaginatedPosts';
import { groupPostsByDate, TabHeader, Pagination } from './TabUtils';
import { schedulerApi } from '@/app/api/schedulerApi';
import toast from 'react-hot-toast';

interface RawTabProps {
  refreshKey: number;
  triggerRefresh: () => void;
  scrapeUrl: string;
  setScrapeUrl: (val: string) => void;
  isScraping: boolean;
  handleScrape: () => void;
  handleSendToAI: (post: Post) => void;
  handlePushToSchedule: (post: Post) => void;
  handleUpdateRawPost?: (post: Post, newOriginalText: string, newImageUrl?: string) => Promise<void>;
}

export function RawTab({
  refreshKey,
  triggerRefresh,
  scrapeUrl,
  setScrapeUrl,
  isScraping,
  handleScrape,
  handleSendToAI,
  handlePushToSchedule,
  handleUpdateRawPost
}: RawTabProps) {
  const [selectedPost, setSelectedPost] = useState<Post | null>(null);
  const [editedText, setEditedText] = useState('');
  const [editedImageUrl, setEditedImageUrl] = useState('');

  const { posts, total, page, setPage, search, setSearch, isLoading, limit } = usePaginatedPosts('SCRAPED', refreshKey);

  const handleOpenModal = (post: Post) => {
    setSelectedPost(post);
    setEditedText(post.originalText || '');
    setEditedImageUrl(post.imageUrl || '');
  };

  const handleSave = async () => {
    if (selectedPost && handleUpdateRawPost) {
      await handleUpdateRawPost(selectedPost, editedText, editedImageUrl);
      setSelectedPost(null);
    }
  };

  const handleClearAll = async () => {
    if (!confirm("Are you sure you want to delete ALL scraped posts?")) return;
    try {
      const data = await schedulerApi.clearPostsByStatus('SCRAPED');
      if (data.success) {
        toast.success(`Deleted ${data.deletedCount} posts!`);
        triggerRefresh();
      }
    } catch (err: unknown) {
      toast.error('Failed to clear posts');
    }
  };

  const groupedPosts = groupPostsByDate(posts, 'createdAt');

  return (
    <>
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

        <TabHeader search={search} setSearch={setSearch} onClearAll={handleClearAll} isLoading={isLoading} />

        {posts.length === 0 ? (
          <div className="text-center py-20 text-zinc-500 border border-zinc-800 bg-black/40">
            <Terminal className="w-16 h-16 mx-auto mb-4 text-zinc-700" />
            <p className="text-lg font-medium tracking-widest uppercase">RAW_QUEUE_EMPTY</p>
            <div className="mt-2 w-32 h-1 bg-zinc-800 mx-auto" />
          </div>
        ) : (
          <div>
            {Object.entries(groupedPosts).map(([date, datePosts]) => (
              <div key={date} className="mb-8">
                <h2 className="text-[#ff00ff] font-bold uppercase tracking-widest border-b border-[#ff00ff]/20 pb-2 mb-4">
                  {date}
                </h2>
                <div className="space-y-4">
                  {datePosts.map((post) => (
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
                      <div className="flex w-full sm:w-auto items-center gap-2 mt-2 self-end">
                        <button
                          onClick={() => handleOpenModal(post)}
                          className="flex items-center gap-2 px-3 py-1.5 text-xs text-zinc-400 border border-zinc-700 hover:bg-zinc-800 hover:text-white transition-colors"
                        >
                          <Edit3 className="w-3 h-3" />
                          EDIT RAW
                        </button>
                        <button
                          onClick={() => handlePushToSchedule(post)}
                          className="flex items-center gap-2 px-3 py-1.5 text-xs text-blue-400 border border-blue-900/50 hover:bg-blue-900/20 transition-colors"
                        >
                          DIRECT POST
                        </button>
                        <button
                          onClick={() => handleSendToAI(post)}
                          className="flex items-center gap-2 px-3 py-1.5 bg-[#ff00ff]/10 text-[#ff00ff] border border-[#ff00ff]/30 hover:bg-[#ff00ff] hover:text-black font-medium transition-all duration-300 ease-out text-xs tracking-wider"
                        >
                          MOVE TO AI
                          <ArrowRight className="w-3 h-3" />
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            ))}
            <Pagination page={page} setPage={setPage} total={total} limit={limit} />
          </div>
        )}
      </div>

      {/* ─── MODAL EDIT RAW ─── */}
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
              className="bg-black border-2 border-[#ff00ff]/40 shadow-[0_0_30px_rgba(255,0,255,0.15)] w-full max-w-3xl flex flex-col max-h-[90vh]"
            >
              <div className="flex items-center justify-between px-6 py-3 border-b border-zinc-800 bg-[#ff00ff]/5">
                <div className="flex items-center gap-3">
                  <div className="w-2 h-2 bg-[#ff00ff] animate-pulse" />
                  <h2 className="font-bold text-sm tracking-widest uppercase text-[#ff00ff]">EDIT_RAW [SRC: {selectedPost.sourcePostId}]</h2>
                </div>
                <button onClick={() => setSelectedPost(null)} className="text-zinc-500 hover:text-[#ff00ff] transition-colors">
                  <X className="w-5 h-5" />
                </button>
              </div>
              
              <div className="p-6 flex-1 overflow-y-auto flex flex-col gap-4">
                <div className="bg-zinc-900/50 p-4 border border-zinc-800 text-xs font-mono text-zinc-400 flex items-center justify-between">
                  <div>
                    <p><span className="text-[#ff00ff]">CREATED_AT:</span> {formatDate(selectedPost.createdAt)}</p>
                    <p><span className="text-[#ff00ff]">STATUS:</span> {selectedPost.status}</p>
                  </div>
                  {selectedPost.imageUrl && (
                    <img src={selectedPost.imageUrl} alt="thumb" className="w-16 h-16 object-cover border border-[#ff00ff]/30 opacity-80" />
                  )}
                </div>
                
                <div className="flex-1 flex flex-col min-h-[300px]">
                  <textarea
                    value={editedText}
                    onChange={e => setEditedText(e.target.value)}
                    className="w-full flex-1 p-4 bg-zinc-950 border border-zinc-800 text-sm text-zinc-200 outline-none resize-none leading-relaxed focus:border-[#ff00ff] focus:bg-[#ff00ff]/5 transition-colors duration-300 ease-out"
                    placeholder="Input modified raw text data..."
                  />
                </div>

                <div className="flex flex-col gap-2">
                  <label className="text-[10px] uppercase tracking-widest text-[#ff00ff]">IMAGE_URL_OVERRIDE</label>
                  <input
                    type="text"
                    value={editedImageUrl}
                    onChange={(e) => setEditedImageUrl(e.target.value)}
                    placeholder="Enter explicit image URL or generate one..."
                    className="w-full bg-zinc-900/80 border border-zinc-800 p-2 text-xs text-zinc-300 outline-none focus:border-[#ff00ff] transition-colors"
                  />
                </div>
              </div>

              <div className="p-4 border-t border-zinc-800 bg-zinc-900/50 flex flex-col sm:flex-row items-center justify-end gap-4">
                <button
                  onClick={() => setSelectedPost(null)}
                  className="bg-transparent text-zinc-400 hover:text-zinc-200 px-4 py-2 text-xs font-bold uppercase tracking-widest transition-colors duration-300 ease-out w-full sm:w-auto"
                >
                  DISCARD
                </button>
                <button
                  onClick={handleSave}
                  className="bg-[#ff00ff]/20 border border-[#ff00ff] hover:bg-[#ff00ff] text-[#ff00ff] hover:text-black px-6 py-2 text-xs font-bold uppercase tracking-widest transition-all duration-300 ease-out shadow-[0_0_10px_rgba(255,0,255,0.2)] w-full sm:w-auto flex items-center gap-2 justify-center"
                >
                  <Save className="w-4 h-4" /> COMMIT_UPDATE
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}

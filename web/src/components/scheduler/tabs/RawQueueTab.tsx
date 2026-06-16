import { useState } from 'react';
import { Terminal, ArrowRight, X, Save, Edit3, Clock } from 'lucide-react';
import { Post } from '@/types/scheduler';
import { formatDate } from '@/lib/utils';
import { motion, AnimatePresence } from 'framer-motion';
import { usePaginatedPosts } from '@/hooks/usePaginatedPosts';
import { groupPostsByDate, TabHeader, Pagination } from './TabUtils';
import { PostCard } from './PostCard';
import { useConfirm } from '@/components/ui/ConfirmModal';
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

export function RawQueueTab({
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
  const [isClearing, setIsClearing] = useState(false);
  const confirm = useConfirm();
  const [editedImageUrl, setEditedImageUrl] = useState('');
  const [scheduleTime, setScheduleTime] = useState('');
  const [isScheduling, setIsScheduling] = useState(false);

  const { posts, total, page, setPage, search, setSearch, isLoading, limit } = usePaginatedPosts('SCRAPED', refreshKey);

  const handleOpenModal = (post: Post) => {
    setSelectedPost(post);
    setEditedText(post.originalText || '');
    setEditedImageUrl(post.imageUrl || '');
    setScheduleTime('');
  };

  const handleSave = async () => {
    if (selectedPost && handleUpdateRawPost) {
      await handleUpdateRawPost(selectedPost, editedText, editedImageUrl);
      setSelectedPost(null);
    }
  };

  const handleCustomSchedule = async () => {
    if (!selectedPost) return;
    if (!scheduleTime) {
      toast.error("Please select a date and time!");
      return;
    }
    setIsScheduling(true);
    try {
      const data = await schedulerApi.scheduleFbPost(selectedPost.id, new Date(scheduleTime).toISOString(), editedText, editedImageUrl);
      if (data.success) {
        toast.success(`Scheduled successfully! ID: ${data.fbPostId}`);
        triggerRefresh();
        setSelectedPost(null);
      } else {
        toast.error(`Error: ${data.error}`);
      }
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : String(err);
      toast.error(`Server Error: ${message}`);
    } finally {
      setIsScheduling(false);
    }
  };

  const handleModalAutoQueue = async () => {
    if (!selectedPost) return;
    setIsScheduling(true);
    try {
      const data = await schedulerApi.autoQueuePost(selectedPost.id, editedText, editedImageUrl);
      if (data.success) {
        toast.success('Pushed to Schedule Queue!');
        triggerRefresh();
        setSelectedPost(null);
      } else {
        toast.error(`Error: ${data.error}`);
      }
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : String(err);
      toast.error(`Server Error: ${message}`);
    } finally {
      setIsScheduling(false);
    }
  };

  const handleClearAll = async () => {
    confirm({
      title: 'SYS.CLEAR_RAW',
      message: 'Are you sure you want to delete ALL scraped posts? This action cannot be undone.',
      danger: true,
      onConfirm: async () => {
        setIsClearing(true);
        try {
          const res = await schedulerApi.clearPostsByStatus("SCRAPED");
          if (res.success) {
            toast.success(`Cleared ${res.deletedCount} posts!`);
            triggerRefresh();
          }
        } catch (err: unknown) {
          toast.error("Failed to clear posts: " + (err instanceof Error ? err.message : String(err)));
        } finally {
          setIsClearing(false);
        }
      }
    });
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

        <TabHeader search={search} setSearch={setSearch} onClearAll={handleClearAll} isLoading={isLoading || isClearing} />

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
                    <PostCard
                      key={post.id}
                      post={post}
                      theme="pink"
                      dateLabel={formatDate(post.createdAt)}
                      actions={
                        <>
                          <button
                            onClick={(e) => { e.stopPropagation(); handleOpenModal(post); }}
                            className="flex items-center gap-2 px-3 py-1.5 text-xs text-zinc-400 border border-zinc-700 hover:bg-zinc-800 hover:text-white transition-colors relative z-20 cursor-pointer"
                          >
                            <Edit3 className="w-3 h-3" />
                            EDIT & SCHEDULE
                          </button>
                          <button
                            onClick={(e) => { e.stopPropagation(); handlePushToSchedule(post); }}
                            className="flex items-center gap-2 px-3 py-1.5 text-xs text-[#00f3ff] border border-[#00f3ff]/50 hover:bg-[#00f3ff]/20 transition-colors relative z-20 cursor-pointer"
                          >
                            AUTO QUEUE
                          </button>
                          <button
                            onClick={(e) => { e.stopPropagation(); handleSendToAI(post); }}
                            className="flex items-center gap-2 px-3 py-1.5 bg-[#ff00ff]/10 text-[#ff00ff] border border-[#ff00ff]/30 hover:bg-[#ff00ff] hover:text-black font-medium transition-all duration-300 ease-out text-xs tracking-wider relative z-20 cursor-pointer"
                          >
                            MOVE TO AI
                            <ArrowRight className="w-3 h-3" />
                          </button>
                        </>
                      }
                    />
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

                <div className="flex flex-col gap-2 mt-2 pt-4 border-t border-zinc-800/50">
                  <label className="text-[10px] uppercase tracking-widest text-[#00f3ff] flex items-center gap-2">
                    <Clock className="w-3 h-3" /> SCHEDULE_TIME (OPTIONAL)
                  </label>
                  <div className="flex items-center bg-black border border-zinc-700 focus-within:border-[#00f3ff] focus-within:shadow-[0_0_10px_rgba(0,243,255,0.2)] px-3 py-2 transition-all duration-300 ease-out">
                    <input
                      type="datetime-local"
                      value={scheduleTime}
                      onChange={(e) => setScheduleTime(e.target.value)}
                      className="bg-transparent text-sm font-mono font-bold tracking-widest text-[#00f3ff] outline-none [color-scheme:dark] cursor-pointer w-full"
                    />
                  </div>
                </div>
              </div>

              <div className="p-4 border-t border-zinc-800 bg-zinc-900/50 flex flex-col sm:flex-row items-center justify-between gap-4">
                <button
                  onClick={() => setSelectedPost(null)}
                  className="bg-transparent text-zinc-400 hover:text-zinc-200 px-4 py-2 text-xs font-bold uppercase tracking-widest transition-colors duration-300 ease-out shrink-0"
                >
                  DISCARD
                </button>
                <div className="flex items-center gap-3 flex-wrap justify-end">
                  <button
                    onClick={handleSave}
                    disabled={isScheduling}
                    className="bg-zinc-800/50 border border-zinc-700 hover:bg-zinc-800 text-zinc-300 px-4 py-2 text-xs font-bold uppercase tracking-widest transition-all duration-300 ease-out flex items-center gap-2"
                  >
                    <Save className="w-4 h-4" /> SAVE DRAFT
                  </button>
                  <button
                    onClick={handleModalAutoQueue}
                    disabled={isScheduling}
                    className="bg-[#00f3ff]/10 border border-[#00f3ff]/50 hover:bg-[#00f3ff]/30 text-[#00f3ff] px-4 py-2 text-xs font-bold uppercase tracking-widest transition-all duration-300 ease-out flex items-center gap-2 disabled:opacity-50"
                  >
                    AUTO QUEUE
                  </button>
                  <button
                    onClick={handleCustomSchedule}
                    disabled={isScheduling}
                    className="bg-[#00f3ff]/20 border border-[#00f3ff] hover:bg-[#00f3ff] text-[#00f3ff] hover:text-black px-6 py-2 text-xs font-bold uppercase tracking-widest transition-all duration-300 ease-out shadow-[0_0_10px_rgba(0,243,255,0.2)] flex items-center gap-2 disabled:opacity-50"
                  >
                    {isScheduling ? "SCHEDULING..." : "SCHEDULE NOW"}
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

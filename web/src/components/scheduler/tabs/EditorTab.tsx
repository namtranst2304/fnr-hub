import React, { useState } from 'react';
import { Save, Trash2, Clock, Bot, ImageIcon, Loader2, ArrowLeft, Terminal, Check } from 'lucide-react';
import { Post } from '@/types/scheduler';
import { schedulerApi } from '@/app/api/schedulerApi';
import { getCyberImageForText } from './generator/imageHelper';
import { CyberTerminalLogs } from './generator/CyberTerminalLogs';
import { CyberImageTerminalLogs } from './generator/CyberImageTerminalLogs';
import { motion, AnimatePresence } from 'framer-motion';
import { usePaginatedPosts } from '@/hooks/usePaginatedPosts';
import { groupPostsByDate, TabHeader, Pagination } from './TabUtils';
import toast from 'react-hot-toast';

interface EditorTabProps {
  refreshKey: number;
  triggerRefresh: () => void;
  selectedPost: Post | null;
  setSelectedPost: (post: Post | null) => void;
  handleCreateCustomPost: (originalText: string) => Promise<void>;
  editedText: string;
  setEditedText: (val: string) => void;
  editedImageUrl: string;
  setEditedImageUrl: (val: string) => void;
  scheduleTime: string;
  setScheduleTime: (val: string) => void;
  isLoading: boolean;
  handleSaveDraft: () => void;
  handleDelete: () => void;
  handleSchedulePost: () => void;
}

export function EditorTab({
  posts,
  selectedPost,
  setSelectedPost,
  handleCreateCustomPost,
  editedText,
  setEditedText,
  editedImageUrl,
  setEditedImageUrl,
  scheduleTime,
  setScheduleTime,
  isLoading,
  handleSaveDraft,
  handleDelete,
  handleSchedulePost,
}: EditorTabProps) {
  const [isGeneratingText, setIsGeneratingText] = useState(false);
  const [isGeneratingImage, setIsGeneratingImage] = useState(false);
  const [customIdea, setCustomIdea] = useState('');
  const [isCreating, setIsCreating] = useState(false);

  const { posts, total, page, setPage, search, setSearch, isLoading: isFetching, limit } = usePaginatedPosts('DRAFT', refreshKey);

  React.useEffect(() => {
    if (selectedPost) {
      setEditedImageUrl(selectedPost.imageUrl || '');
    }
  }, [selectedPost, setEditedImageUrl]);

  const handleAIGenerateText = async () => {
    if (!selectedPost) return;
    setIsGeneratingText(true);
    try {
      const prompt = `Rewrite and enhance this content for a social media post:\n\n${selectedPost.originalText}`;
      const res = await schedulerApi.generateCustomPost(prompt);
      if (res.success && res.content) {
        setEditedText(res.content);
      } else {
        alert(res.error || 'Failed to generate content');
      }
    } catch (err) {
      console.error(err);
      alert('Error connecting to AI');
    } finally {
      setIsGeneratingText(false);
    }
  };

  const handleAIGenerateImage = () => {
    if (!selectedPost) return;
    setIsGeneratingImage(true);
    const textToAnalyze = editedText.trim() ? editedText : selectedPost.originalText;
    
    setTimeout(() => {
      try {
        const img = getCyberImageForText(textToAnalyze);
        setEditedImageUrl(img);
      } catch (err) {
        console.error(err);
        alert('Image generation failed');
      } finally {
        setIsGeneratingImage(false);
      }
    }, 3000);
  };

  const handleCreateNew = async () => {
    if (!customIdea.trim()) return;
    setIsCreating(true);
    await handleCreateCustomPost(customIdea);
    setCustomIdea('');
    setIsCreating(false);
  };

  const handleClearAll = async () => {
    if (!confirm("Are you sure you want to delete ALL drafts?")) return;
    try {
      const data = await schedulerApi.clearPostsByStatus('DRAFT');
      if (data.success) {
        toast.success(`Deleted ${data.deletedCount} drafts!`);
        triggerRefresh();
      }
    } catch {
      toast.error('Failed to clear drafts');
    }
  };

  const groupedPosts = groupPostsByDate(posts, 'createdAt');

  // View: List of Drafts
  if (!selectedPost) {
    return (
      <div className="max-w-5xl mx-auto space-y-8">
        {/* Custom Post Creator */}
        <div className="bg-black/60 border border-[#00f3ff]/30 p-6 relative overflow-hidden group">
          <div className="absolute top-0 left-0 w-1 h-full bg-[#00f3ff]/50" />
          <h2 className="text-[#00f3ff] font-bold text-sm tracking-widest uppercase mb-4 flex items-center gap-2">
            <Bot className="w-4 h-4" /> INJECT_CUSTOM_DATA
          </h2>
          <div className="flex gap-4">
            <textarea
              value={customIdea}
              onChange={(e) => setCustomIdea(e.target.value)}
              placeholder="Enter your rough idea or content here..."
              className="flex-1 bg-zinc-900/50 border border-zinc-700 p-3 text-sm text-zinc-300 outline-none focus:border-[#00f3ff] resize-none h-24 transition-colors"
            />
            <button
              onClick={handleCreateNew}
              disabled={isCreating || !customIdea.trim()}
              className="bg-[#00f3ff]/20 hover:bg-[#00f3ff] text-[#00f3ff] hover:text-black border border-[#00f3ff] px-6 font-bold uppercase tracking-widest transition-all disabled:opacity-50"
            >
              {isCreating ? <Loader2 className="w-5 h-5 animate-spin" /> : "CREATE"}
            </button>
          </div>
        </div>

        {/* Draft List */}
        <div>
          <h2 className="text-[#00f3ff] font-bold tracking-widest uppercase mb-4 flex items-center gap-2">
            <Terminal className="w-5 h-5" /> AI WORKSPACE - PENDING DRAFTS
          </h2>
          <TabHeader search={search} setSearch={setSearch} onClearAll={handleClearAll} isLoading={isFetching} />

        {posts.length === 0 ? (
          <div className="text-center py-20 text-zinc-500 border border-zinc-800 bg-black/40">
            <Terminal className="w-16 h-16 mx-auto mb-4 text-zinc-700" />
            <p className="text-lg font-medium tracking-widest uppercase">NO_DRAFTS_FOUND</p>
            <div className="mt-2 w-32 h-1 bg-zinc-800 mx-auto" />
          </div>
        ) : (
          <div>
            {Object.entries(groupedPosts).map(([date, datePosts]) => (
              <div key={date} className="mb-8">
                <h3 className="text-[#00f3ff] font-bold uppercase tracking-widest border-b border-[#00f3ff]/20 pb-2 mb-4">
                  {date}
                </h3>
                <div className="space-y-4">
                  {datePosts.map((post) => (
                    <div
                      key={post.id}
                      onClick={() => setSelectedPost(post)}
                      className="bg-black/60 p-5 border border-zinc-700 hover:border-[#00f3ff] hover:shadow-[0_0_15px_rgba(0,243,255,0.2)] flex items-start gap-4 cursor-pointer transition-all duration-300 ease-out group relative overflow-hidden"
                    >
                      <div className="absolute top-0 left-0 w-1 h-full bg-zinc-700 group-hover:bg-[#00f3ff]" />
                      <div className="flex-1 min-w-0">
                        <h3 className="text-zinc-300 font-medium text-sm leading-relaxed group-hover:text-white">
                          {post.rewrittenText ? post.rewrittenText.substring(0, 150) : post.originalText.substring(0, 150)}...
                        </h3>
                      </div>
                      <div className="shrink-0 pl-4 text-[#00f3ff] font-bold text-xs uppercase tracking-widest opacity-0 group-hover:opacity-100 transition-opacity duration-300 flex items-center gap-1">
                        EDIT <ArrowLeft className="w-3 h-3 rotate-180" />
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
      </div>
    );
  }

  // View: Active Editor
  return (
    <div className="max-w-6xl mx-auto bg-black border-2 border-[#00f3ff]/40 shadow-[0_0_30px_rgba(0,243,255,0.1)] flex flex-col relative h-[80vh]">
      
      {/* Header */}
      <div className="flex items-center justify-between px-6 py-3 border-b border-zinc-800 bg-[#00f3ff]/5">
        <div className="flex items-center gap-3">
          <button onClick={() => setSelectedPost(null)} className="text-zinc-400 hover:text-[#00f3ff] mr-2">
            <ArrowLeft className="w-5 h-5" />
          </button>
          <div className="w-2 h-2 bg-[#00f3ff] animate-pulse" />
          <h2 className="font-bold text-sm tracking-widest uppercase text-[#00f3ff]">AI_EDITOR [0x{selectedPost.id.toString(16).toUpperCase()}]</h2>
        </div>
      </div>

      <div className="flex-1 overflow-hidden flex flex-col md:flex-row">
        {/* Left: Original */}
        <div className="w-full md:w-5/12 flex flex-col border-b md:border-b-0 md:border-r border-zinc-800 bg-black/50">
          <div className="px-4 py-2 bg-zinc-900 border-b border-zinc-800 text-[10px] uppercase tracking-widest text-zinc-500 flex justify-between">
            <span>RAW_PAYLOAD</span>
            <a href={`https://facebook.com/${selectedPost.sourcePostId}`} target="_blank" rel="noreferrer" className="text-[#00f3ff] hover:underline">EXT_LINK ↗</a>
          </div>
          <div className="flex-1 overflow-y-auto p-4 text-xs text-zinc-400 whitespace-pre-wrap leading-relaxed">
            {selectedPost.originalText}
          </div>
        </div>

        {/* Right: AI Rewritten */}
        <div className="w-full md:w-7/12 flex flex-col bg-zinc-950">
          <div className="px-4 py-2 bg-[#ff00ff]/10 border-b border-[#ff00ff]/30 text-[10px] uppercase tracking-widest text-[#ff00ff] flex justify-between items-center">
            <span>PROCESSED_PAYLOAD (EDITABLE)</span>
            <div className="flex items-center gap-2">
              <button 
                onClick={handleAIGenerateText}
                disabled={isGeneratingText || isGeneratingImage || isLoading}
                className="flex items-center gap-1 bg-[#ff00ff]/20 hover:bg-[#ff00ff]/40 text-[#ff00ff] px-2 py-0.5 border border-[#ff00ff]/50 rounded-sm transition-all disabled:opacity-50"
              >
                {isGeneratingText ? <Loader2 className="w-3 h-3 animate-spin" /> : <Bot className="w-3 h-3" />}
                {isGeneratingText ? 'PROCESSING...' : 'AI GEN TEXT'}
              </button>
              <button 
                onClick={handleAIGenerateImage}
                disabled={isGeneratingText || isGeneratingImage || isLoading}
                className="flex items-center gap-1 bg-[#fce205]/20 hover:bg-[#fce205]/40 text-[#fce205] px-2 py-0.5 border border-[#fce205]/50 rounded-sm transition-all disabled:opacity-50"
              >
                {isGeneratingImage ? <Loader2 className="w-3 h-3 animate-spin" /> : <ImageIcon className="w-3 h-3" />}
                {isGeneratingImage ? 'PROCESSING...' : 'AI GEN IMAGE'}
              </button>
            </div>
          </div>
          <div className="flex-1 relative flex flex-col p-4 gap-4 overflow-y-auto overflow-x-hidden">
            <AnimatePresence>
              {isGeneratingText && (
                <motion.div
                  initial={{ opacity: 0, height: 0 }}
                  animate={{ opacity: 1, height: 'auto' }}
                  exit={{ opacity: 0, height: 0 }}
                  className="overflow-hidden"
                >
                  <CyberTerminalLogs />
                </motion.div>
              )}
              {isGeneratingImage && (
                <motion.div
                  initial={{ opacity: 0, height: 0 }}
                  animate={{ opacity: 1, height: 'auto' }}
                  exit={{ opacity: 0, height: 0 }}
                  className="overflow-hidden"
                >
                  <CyberImageTerminalLogs />
                </motion.div>
              )}
            </AnimatePresence>

            {!isGeneratingText && !isGeneratingImage && (
              <>
                <textarea
                  value={editedText}
                  onChange={e => setEditedText(e.target.value)}
                  className="w-full min-h-[200px] flex-1 p-4 bg-transparent border border-zinc-800 text-sm text-zinc-200 outline-none resize-none leading-relaxed focus:border-[#ff00ff] focus:bg-[#ff00ff]/5 transition-colors duration-300 ease-out"
                  placeholder="Input modified text data..."
                />

                <div className="mt-4 border-t border-zinc-800 pt-4 flex flex-col gap-2">
                  <label className="text-[10px] uppercase tracking-widest text-[#fce205]">IMAGE_URL_OVERRIDE</label>
                  <input
                    type="text"
                    value={editedImageUrl}
                    onChange={(e) => setEditedImageUrl(e.target.value)}
                    placeholder="Enter explicit image URL or generate one..."
                    className="w-full bg-zinc-900/80 border border-zinc-800 p-2 text-xs text-zinc-300 outline-none focus:border-[#fce205] transition-colors"
                  />
                </div>

                {editedImageUrl && (
                  <div className="border border-[#fce205]/30 p-2 bg-black/40 relative group shrink-0 mt-4">
                     <div className="absolute inset-0 bg-[linear-gradient(to_bottom,rgba(252,226,5,0.03)_50%,rgba(0,0,0,0.25)_50%)] bg-[size:100%_4px] pointer-events-none z-10" />
                     <img src={editedImageUrl} alt="Generated" className="w-full max-h-48 object-cover border border-zinc-900" />
                     <div className="mt-2 text-[10px] text-zinc-500 font-mono flex items-center justify-between">
                       <span className="flex items-center gap-1 text-[#fce205]/80 uppercase"><ImageIcon className="w-3 h-3"/> IMAGE_ATTACHED.png</span>
                       <button onClick={() => setEditedImageUrl('')} className="hover:text-red-400 uppercase">REMOVE</button>
                     </div>
                  </div>
                )}
              </>
            )}
          </div>
        </div>
      </div>

      {/* Actions */}
      <div className="p-4 border-t border-zinc-800 bg-zinc-900/50 flex flex-col sm:flex-row items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <button
            onClick={handleSaveDraft}
            disabled={isLoading}
            className="bg-transparent border border-zinc-600 hover:border-zinc-400 text-zinc-300 px-4 py-2 text-xs font-bold uppercase tracking-widest transition-colors duration-300 ease-out flex items-center gap-2"
          >
            <Save className="w-4 h-4" /> COMMIT_SAVE
          </button>
          <button
            onClick={handleDelete}
            disabled={isLoading}
            className="bg-transparent border border-[#ff0000]/50 hover:bg-[#ff0000]/20 text-[#ff0000] px-4 py-2 text-xs font-bold uppercase tracking-widest transition-colors duration-300 ease-out flex items-center gap-2"
          >
            <Trash2 className="w-4 h-4" /> PURGE
          </button>
        </div>

        <div className="flex items-center gap-3">
          <div className="flex items-center bg-black border border-zinc-700 focus-within:border-[#00f3ff] px-3 py-1.5 transition-colors duration-300 ease-out">
            <Clock className="w-4 h-4 text-zinc-500 mr-2" />
            <input
              type="datetime-local"
              value={scheduleTime}
              onChange={(e) => setScheduleTime(e.target.value)}
              className="bg-transparent text-xs text-zinc-300 outline-none [color-scheme:dark] cursor-pointer"
            />
          </div>
          
          <button
            onClick={handleSchedulePost}
            disabled={isLoading}
            className="bg-[#00f3ff]/20 border border-[#00f3ff] hover:bg-[#00f3ff] text-[#00f3ff] hover:text-black px-4 py-2 text-xs font-bold uppercase tracking-widest transition-all duration-300 ease-out shadow-[0_0_10px_rgba(0,243,255,0.2)] disabled:opacity-50 flex items-center gap-2"
          >
            <Check className="w-4 h-4" /> PUSH TO SCHEDULE
          </button>
        </div>
      </div>

      {isLoading && (
        <div className="absolute inset-0 bg-black/80 backdrop-blur-sm flex flex-col items-center justify-center z-10 text-[#00f3ff]">
          <div className="w-12 h-12 border-4 border-transparent border-t-[#00f3ff] border-b-[#ff00ff] rounded-full animate-spin mb-4" />
          <span className="text-xs font-bold tracking-widest uppercase">EXECUTING_ROUTINE...</span>
        </div>
      )}
    </div>
  );
}

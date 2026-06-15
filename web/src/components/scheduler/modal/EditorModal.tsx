import React, { useState } from 'react';
import { X, Save, Trash2, Clock, Bot, ImageIcon, Loader2 } from 'lucide-react';
import { Post } from '@/types/scheduler';
import { schedulerApi } from '@/app/api/schedulerApi';
import { getCyberImageForText } from '../tabs/generator/imageHelper';
import { CyberTerminalLogs } from '../tabs/generator/CyberTerminalLogs';
import { CyberImageTerminalLogs } from '../tabs/generator/CyberImageTerminalLogs';
import { motion, AnimatePresence } from 'framer-motion';

interface EditorModalProps {
  selectedPost: Post | null;
  editedText: string;
  setEditedText: (val: string) => void;
  scheduleTime: string;
  setScheduleTime: (val: string) => void;
  isLoading: boolean;
  closeModal: () => void;
  handleSaveDraft: () => void;
  handleDelete: () => void;
  handleSchedulePost: () => void;
  handleAutoQueue: () => void;
  config: { autoPostOn: boolean };
}

export function EditorModal({
  selectedPost,
  editedText,
  setEditedText,
  scheduleTime,
  setScheduleTime,
  isLoading,
  closeModal,
  handleSaveDraft,
  handleDelete,
  handleSchedulePost,
  handleAutoQueue,
  config
}: EditorModalProps) {
  const [isGeneratingText, setIsGeneratingText] = useState(false);
  const [isGeneratingImage, setIsGeneratingImage] = useState(false);
  const [generatedImage, setGeneratedImage] = useState<string | null>(null);

  React.useEffect(() => {
    if (selectedPost) {
      setGeneratedImage(selectedPost.imageUrl || null);
    }
  }, [selectedPost]);

  if (!selectedPost) return null;

  const handleAIGenerateText = async () => {
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
    setIsGeneratingImage(true);
    const textToAnalyze = editedText.trim() ? editedText : selectedPost.originalText;
    
    setTimeout(() => {
      try {
        const img = getCyberImageForText(textToAnalyze);
        setGeneratedImage(img);
      } catch (err) {
        console.error(err);
        alert('Image generation failed');
      } finally {
        setIsGeneratingImage(false);
      }
    }, 3000);
  };

  return (
    <div className="absolute inset-0 z-50 bg-black/90 backdrop-blur-sm flex items-center justify-center p-4 animate-in fade-in duration-300">
      <div className="bg-black w-full max-w-5xl h-[85vh] border-2 border-[#00f3ff]/60 shadow-[0_0_30px_rgba(0,243,255,0.15)] flex flex-col relative animate-in zoom-in-95 duration-300 ease-out">
        
        {/* Modal Decorators */}
        <div className="absolute top-0 left-0 w-4 h-4 border-t-4 border-l-4 border-[#00f3ff]" />
        <div className="absolute bottom-0 right-0 w-4 h-4 border-b-4 border-r-4 border-[#00f3ff]" />
        
        {/* Modal Header */}
        <div className="flex items-center justify-between px-6 py-3 border-b border-zinc-800 bg-[#00f3ff]/5">
          <div className="flex items-center gap-3">
            <div className="w-2 h-2 bg-[#00f3ff] animate-pulse" />
            <h2 className="font-bold text-sm tracking-widest uppercase text-[#00f3ff]">DATA.INSPECTION [0x{selectedPost.id.toString(16).toUpperCase()}]</h2>
          </div>
          <button onClick={closeModal} className="text-zinc-500 hover:text-white transition-colors duration-300 ease-out">
            <X className="w-5 h-5" />
          </button>
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

                  {generatedImage && (
                    <div className="border border-[#fce205]/30 p-2 bg-black/40 relative group shrink-0">
                       <div className="absolute inset-0 bg-[linear-gradient(to_bottom,rgba(252,226,5,0.03)_50%,rgba(0,0,0,0.25)_50%)] bg-[size:100%_4px] pointer-events-none z-10" />
                       <img src={generatedImage} alt="Generated" className="w-full max-h-48 object-cover border border-zinc-900" />
                       <div className="mt-2 text-[10px] text-zinc-500 font-mono flex items-center justify-between">
                         <span className="flex items-center gap-1 text-[#fce205]/80 uppercase"><ImageIcon className="w-3 h-3"/> IMAGE_ATTACHED.png</span>
                         <button onClick={() => setGeneratedImage(null)} className="hover:text-red-400 uppercase">REMOVE</button>
                       </div>
                    </div>
                  )}
                </>
              )}
            </div>
          </div>
        </div>

        {/* Modal Actions */}
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
                className="bg-transparent text-xs text-zinc-300 outline-none"
              />
            </div>
            
            <button
              onClick={handleSchedulePost}
              disabled={isLoading}
              className="bg-[#00f3ff]/20 border border-[#00f3ff] hover:bg-[#00f3ff] text-[#00f3ff] hover:text-black px-4 py-2 text-xs font-bold uppercase tracking-widest transition-all duration-300 ease-out shadow-[0_0_10px_rgba(0,243,255,0.2)] disabled:opacity-50"
            >
              FORCE_SYNC
            </button>
            
            <button
              onClick={handleAutoQueue}
              disabled={isLoading || !config.autoPostOn}
              title={!config.autoPostOn ? 'Enable Auto Post in Settings first' : 'Automatically calculate next schedule time'}
              className="bg-[#ff00ff]/20 border border-[#ff00ff] hover:bg-[#ff00ff] text-[#ff00ff] hover:text-black px-4 py-2 text-xs font-bold uppercase tracking-widest transition-all duration-300 ease-out shadow-[0_0_10px_rgba(255,0,255,0.2)] disabled:opacity-50 disabled:grayscale"
            >
              AUTO_ENQUEUE
            </button>
          </div>
        </div>

        {/* Loading Overlay */}
        {isLoading && (
          <div className="absolute inset-0 bg-black/80 backdrop-blur-sm flex flex-col items-center justify-center z-10 text-[#00f3ff]">
            <div className="w-12 h-12 border-4 border-transparent border-t-[#00f3ff] border-b-[#ff00ff] rounded-full animate-spin mb-4" />
            <span className="text-xs font-bold tracking-widest uppercase">EXECUTING_ROUTINE...</span>
          </div>
        )}
      </div>
    </div>
  );
}

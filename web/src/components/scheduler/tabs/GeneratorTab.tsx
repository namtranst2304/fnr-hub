import React, { useState, useRef } from 'react';
import { Bot, Image as ImageIcon, Send, Loader2, Sparkles, X, RefreshCw } from 'lucide-react';
import { schedulerApi } from '@/app/api/schedulerApi';
import { CyberButton, CyberCard, CyberTextArea } from '@/components/ui/CyberComponents';
import { motion, AnimatePresence } from 'framer-motion';

import { CyberScanner } from './generator/CyberScanner';
import { CyberTerminalLogs } from './generator/CyberTerminalLogs';
import { CyberImageTerminalLogs } from './generator/CyberImageTerminalLogs';
import { getCyberImageForText } from './generator/imageHelper';

interface GeneratorTabProps {
  onSaveToPending: (originalText: string, rewrittenText: string) => void;
}

export function GeneratorTab({ onSaveToPending }: GeneratorTabProps) {
  const [prompt, setPrompt] = useState('');
  const [imageBase64, setImageBase64] = useState<string | undefined>(undefined);
  const [imageName, setImageName] = useState<string>('');
  const [generatedText, setGeneratedText] = useState('');
  const [modelUsed, setModelUsed] = useState<string>('');
  const [isGenerating, setIsGenerating] = useState(false);
  const [isGeneratingImage, setIsGeneratingImage] = useState(false);
  const [error, setError] = useState('');
  
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (file.size > 5 * 1024 * 1024) {
      setError('Image too large. Please select an image < 5MB.');
      return;
    }

    setImageName(file.name);
    setError('');

    const reader = new FileReader();
    reader.onloadend = () => {
      setImageBase64(reader.result as string);
    };
    reader.readAsDataURL(file);
  };

  const removeImage = () => {
    setImageBase64(undefined);
    setImageName('');
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const handleGenerate = async () => {
    if (!prompt.trim()) {
      setError('Please enter a prompt.');
      return;
    }

    setIsGenerating(true);
    setGeneratedText('');
    setModelUsed('');
    setError('');
    removeImage(); // Clear any previous image when starting a new text generation
    
    try {
      const res = await schedulerApi.generateCustomPost(prompt);
      if (res.success && res.content) {
        setGeneratedText(res.content);
        setModelUsed(res.model_used || '');
      } else {
        setError(res.error || 'Unknown error occurred while generating.');
      }
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : String(err);
      setError(message || 'Failed to connect to AI server.');
    } finally {
      setIsGenerating(false);
    }
  };

  const handleGenerateAIImage = () => {
    setIsGeneratingImage(true);
    setError('');
    
    setTimeout(() => {
      try {
        const imageUrl = getCyberImageForText(generatedText);
        setImageBase64(imageUrl);
        setImageName('AI_GENERATED_GRAPHIC.png');
      } catch (err: unknown) {
        const message = err instanceof Error ? err.message : String(err);
        setError('Image generation failed: ' + message);
      } finally {
        setIsGeneratingImage(false);
      }
    }, 4000);
  };

  const handleSave = () => {
    if (!generatedText.trim()) return;
    onSaveToPending(prompt, generatedText);
  };

  return (
    <div className="space-y-6">
      <CyberCard variant="cyan" withCorners>
        <h2 className="text-xl font-bold text-slate-100 flex items-center gap-2 mb-4 uppercase tracking-widest text-glow-cyan">
          <Sparkles className="text-neon-cyan" size={24} />
          AI Post Generator
        </h2>
        <p className="text-zinc-400 text-xs font-mono uppercase mb-6 tracking-wide leading-relaxed">
          Enter a prompt to let AI generate new content automatically without scraping.
        </p>

        {error && (
          <div className="mb-4 p-3 bg-red-500/10 border border-red-500/30 rounded-lg text-red-400 text-sm font-mono uppercase">
            {error}
          </div>
        )}

        <div className="space-y-4">
          <div>
            <label className="block text-xs font-bold font-mono text-zinc-300 uppercase tracking-wider mb-2">
              Prompt <span className="text-neon-red">*</span>
            </label>
            <div className="relative overflow-hidden">
              {isGenerating && <CyberScanner />}
              <CyberTextArea
                variant="cyan"
                rows={4}
                placeholder="e.g.: Write a funny review about the newly released AirPods 4..."
                value={prompt}
                onChange={(e) => setPrompt(e.target.value)}
                disabled={isGenerating}
              />
            </div>
          </div>

          <CyberButton
            variant="cyan"
            size="lg"
            fullWidth
            onClick={handleGenerate}
            disabled={isGenerating}
          >
            {isGenerating ? (
              <>
                <Loader2 size={16} className="animate-spin" />
                GENERATING CONTENT...
              </>
            ) : (
              <>
                <Bot size={16} />
                GENERATE NOW
              </>
            )}
          </CyberButton>

          <AnimatePresence>
            {isGenerating && (
              <motion.div
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: 'auto' }}
                exit={{ opacity: 0, height: 0 }}
                transition={{ duration: 0.3 }}
                className="overflow-hidden"
              >
                <CyberTerminalLogs />
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </CyberCard>

      {generatedText && (
        <CyberCard variant="yellow" withCorners className="animate-in fade-in slide-in-from-bottom-4 space-y-6">
          <div>
            <h3 className="text-lg font-bold text-slate-100 flex items-center gap-2 mb-4 uppercase tracking-widest text-glow-yellow">
              <Sparkles className="text-neon-yellow" size={20} />
              Generated Result
            </h3>
            <div className="bg-black/60 rounded-none p-4 text-zinc-300 whitespace-pre-wrap font-mono text-sm border border-zinc-800">
              {generatedText}
            </div>
          </div>

          {/* ─── POST-GENERATED IMAGE ATTACHMENT SECTION ─── */}
          <div className="border-t border-zinc-800/60 pt-6 space-y-4">
            <h4 className="text-xs font-bold font-mono text-zinc-300 uppercase tracking-widest flex items-center gap-2">
              <ImageIcon size={14} className="text-neon-yellow" />
              Attached Media Link (Optional)
            </h4>

            <input
              type="file"
              accept="image/*"
              className="hidden"
              ref={fileInputRef}
              onChange={handleImageUpload}
              disabled={isGeneratingImage}
            />

            <AnimatePresence mode="wait">
              {isGeneratingImage ? (
                <motion.div
                  key="generating-image-logs"
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -10 }}
                  className="rounded-none overflow-hidden"
                >
                  <CyberImageTerminalLogs />
                </motion.div>
              ) : imageBase64 ? (
                <motion.div
                  key="image-preview"
                  initial={{ opacity: 0, scale: 0.98 }}
                  animate={{ opacity: 1, scale: 1 }}
                  exit={{ opacity: 0, scale: 0.98 }}
                  className="relative group border border-neon-yellow/30 p-2 bg-black/40 overflow-hidden"
                >
                  {/* Cyber Scanline Overlay inside Preview */}
                  <div className="absolute inset-0 bg-[linear-gradient(to_bottom,rgba(252,226,5,0.03)_50%,rgba(0,0,0,0.25)_50%)] bg-[size:100%_4px] pointer-events-none z-10" />
                  
                  <img
                    src={imageBase64}
                    alt="AI Post Attachment Preview"
                    className="max-h-64 object-cover w-full border border-zinc-900 group-hover:opacity-90 transition-opacity"
                  />
                  
                  <div className="mt-3 flex items-center justify-between gap-3 text-[10px] font-mono text-zinc-400">
                    <span className="truncate max-w-[250px] text-neon-yellow/80 select-all">
                      LINKED_ASSET: {imageName}
                    </span>
                    <div className="flex items-center gap-2">
                      <button
                        onClick={handleGenerateAIImage}
                        className="text-zinc-400 hover:text-neon-yellow flex items-center gap-1 transition-colors cursor-pointer border border-zinc-800 bg-black/40 px-2 py-1 uppercase"
                        title="Regenerate dynamic image"
                      >
                        <RefreshCw size={10} />
                        Re-Gen
                      </button>
                      <button
                        onClick={removeImage}
                        className="text-zinc-400 hover:text-neon-red flex items-center gap-1 transition-colors cursor-pointer border border-zinc-800 bg-black/40 px-2 py-1 uppercase"
                      >
                        <X size={10} />
                        Remove
                      </button>
                    </div>
                  </div>
                </motion.div>
              ) : (
                <motion.div
                  key="empty-media-slot"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                  className="border border-dashed border-zinc-800 p-6 flex flex-col items-center justify-center text-center bg-black/20"
                >
                  <span className="text-[10px] text-zinc-600 font-mono tracking-widest uppercase mb-4">
                    [SECURE_MEDIA_SLOT: EMPTY]
                  </span>
                  
                  <div className="flex flex-col sm:flex-row gap-3">
                    <CyberButton
                      variant="zinc"
                      size="sm"
                      onClick={() => fileInputRef.current?.click()}
                    >
                      <ImageIcon size={12} />
                      Attach Local File
                    </CyberButton>

                    <CyberButton
                      variant="yellow"
                      size="sm"
                      onClick={handleGenerateAIImage}
                    >
                      <Bot size={12} />
                      AI Generate Graphic
                    </CyberButton>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
            
            <p className="text-[9px] text-zinc-600 font-mono uppercase leading-relaxed">
              *Note: Local database stores text elements only. Media attachments are used for layout visualization and mock Facebook API templates.
            </p>
          </div>

          <div className="mt-6 flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-t border-zinc-950 pt-4">
            <span className="text-[10px] text-zinc-500 font-mono uppercase tracking-wider select-none">
              ENGINES_LOG: MODEL_IN_USE = <span className="text-neon-yellow text-glow-yellow">{modelUsed || 'UNKNOWN'}</span>
            </span>
            <CyberButton
              variant="yellow"
              onClick={handleSave}
              disabled={isGeneratingImage}
            >
              <Send size={14} />
              Save to Pending Queue
            </CyberButton>
          </div>
        </CyberCard>
      )}
    </div>
  );
}


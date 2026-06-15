import React, { useState, useRef, useEffect } from 'react';
import { Bot, Image as ImageIcon, Send, Loader2, Sparkles, X } from 'lucide-react';
import { schedulerApi } from '@/app/api/schedulerApi';
import { CyberButton, CyberCard, CyberTextArea } from '@/components/ui/CyberComponents';
import { motion, AnimatePresence } from 'framer-motion';

// ─── CYBER SCANLINE ANIMATION ──────────────────────────────────────────────────
function CyberScanner() {
  return (
    <motion.div
      initial={{ top: "0%" }}
      animate={{ top: ["0%", "100%", "0%"] }}
      transition={{ duration: 2.5, repeat: Infinity, ease: "easeInOut" }}
      className="absolute left-0 w-full h-[2px] bg-neon-cyan shadow-[0_0_8px_#00f3ff,0_0_12px_#00f3ff] pointer-events-none z-10"
    />
  );
}

// ─── CYBER LOGS DECRYPTION LOG SCREEN ──────────────────────────────────────────
const MOCK_LOGS = [
  'INITIALIZING QUANTUM ENGINES...',
  'ESTABLISHING SECURE LINK TO GEMINI CORE...',
  'TRANSMITTING INPUT PAYLOAD PROTOCOLS...',
  'SCANNING PROMPT COMPLEXITY PARAMETERS...',
  'DECRYPTING AI NODE RESPONSES...',
  'SYNTHESIZING NEW SYNTACTIC CODES...',
  'RESOLVING LLM NEURAL MATRIX STATES...',
  'COMPILING MARKDOWN ABSTRACT TREE...',
  'FINALIZING DATA STREAM VERIFICATION...'
];

function CyberTerminalLogs() {
  const [currentLogs, setCurrentLogs] = useState<string[]>([]);

  useEffect(() => {
    let idx = 0;
    setCurrentLogs([`[SYS_LOG]: ${MOCK_LOGS[0]}`]);
    
    const interval = setInterval(() => {
      idx++;
      if (idx < MOCK_LOGS.length) {
        setCurrentLogs(prev => [...prev, `[SYS_LOG]: ${MOCK_LOGS[idx]}`]);
      } else {
        const randomNoise = `[SYS_LOG]: RUNNING_TICK_${Math.floor(Math.random() * 1000)}: DECODING_STREAM_DATA...`;
        setCurrentLogs(prev => [...prev.slice(1), randomNoise]);
      }
    }, 600);

    return () => clearInterval(interval);
  }, []);

  return (
    <div className="bg-black/90 border border-neon-cyan/30 p-4 font-mono text-[10px] text-neon-cyan/80 space-y-1 relative overflow-hidden select-none h-40 flex flex-col justify-end">
      {/* Grid pattern overlay */}
      <div className="absolute inset-0 bg-[linear-gradient(to_right,#00f3ff08_1px,transparent_1px),linear-gradient(to_bottom,#00f3ff08_1px,transparent_1px)] bg-[size:16px_16px] pointer-events-none" />
      
      {/* Scanner line inside log box */}
      <CyberScanner />
      
      <div className="absolute top-2 right-4 flex items-center gap-1.5 animate-pulse">
        <span className="w-1.5 h-1.5 bg-neon-cyan" />
        <span className="tracking-widest text-[8px] uppercase">DECRYPTING...</span>
      </div>
      
      <div className="z-10 overflow-y-auto space-y-1 scrollbar-hide max-h-full">
        {currentLogs.map((log, index) => (
          <div key={index} className="flex items-center gap-2">
            <span className="text-neon-cyan/40">✓</span>
            <span className="whitespace-nowrap truncate">{log}</span>
          </div>
        ))}
        <div className="flex items-center gap-1">
          <span className="text-neon-cyan animate-pulse">▋</span>
          <span className="text-neon-cyan/40 uppercase">PROCESS_AWAIT</span>
        </div>
      </div>
    </div>
  );
}

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
    setError('');
    
    try {
      const res = await schedulerApi.generateCustomPost(prompt, imageBase64);
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
          Enter a prompt or upload an image to let AI generate new content automatically without scraping.
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

          <div>
            <label className="block text-xs font-bold font-mono text-zinc-300 uppercase tracking-wider mb-2">
              Attached Image (Optional)
            </label>
            <div className="flex items-center gap-4">
              <input
                type="file"
                accept="image/*"
                className="hidden"
                ref={fileInputRef}
                onChange={handleImageUpload}
              />
              <CyberButton
                variant="zinc"
                size="sm"
                type="button"
                onClick={() => fileInputRef.current?.click()}
                disabled={isGenerating}
              >
                <ImageIcon size={14} />
                Select Image
              </CyberButton>
              
              {imageName && (
                <div className="flex items-center gap-2 bg-neon-cyan/10 text-neon-cyan px-3 py-1.5 border border-neon-cyan/20 text-xs font-mono">
                  <span className="truncate max-w-[200px]">{imageName}</span>
                  <button onClick={removeImage} className="hover:text-neon-red transition-colors cursor-pointer" disabled={isGenerating}>
                    <X size={14} />
                  </button>
                </div>
              )}
            </div>
            {imageBase64 && (
              <div className="mt-4">
                <img src={imageBase64} alt="Preview" className="max-h-48 border border-zinc-800 shadow-[0_0_10px_rgba(255,255,255,0.02)]" />
              </div>
            )}
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
        <CyberCard variant="yellow" withCorners className="animate-in fade-in slide-in-from-bottom-4">
          <h3 className="text-lg font-bold text-slate-100 flex items-center gap-2 mb-4 uppercase tracking-widest text-glow-yellow">
            <Sparkles className="text-neon-yellow" size={20} />
            Generated Result
          </h3>
          <div className="bg-black/60 rounded-none p-4 text-zinc-300 whitespace-pre-wrap font-mono text-sm border border-zinc-800">
            {generatedText}
          </div>
          <div className="mt-6 flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-t border-zinc-950 pt-4">
            <span className="text-[10px] text-zinc-500 font-mono uppercase tracking-wider select-none">
              ENGINES_LOG: MODEL_IN_USE = <span className="text-neon-yellow text-glow-yellow">{modelUsed || 'UNKNOWN'}</span>
            </span>
            <CyberButton
              variant="yellow"
              onClick={handleSave}
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

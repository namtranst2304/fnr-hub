import React, { useState, useRef } from 'react';
import { Bot, Image as ImageIcon, Send, Loader2, Sparkles, X } from 'lucide-react';
import { schedulerApi } from '@/app/api/schedulerApi';
import { CyberButton, CyberCard, CyberTextArea } from '@/components/ui/CyberComponents';

interface GeneratorTabProps {
  onSaveToPending: (originalText: string, rewrittenText: string) => void;
}

export function GeneratorTab({ onSaveToPending }: GeneratorTabProps) {
  const [prompt, setPrompt] = useState('');
  const [imageBase64, setImageBase64] = useState<string | undefined>(undefined);
  const [imageName, setImageName] = useState<string>('');
  const [generatedText, setGeneratedText] = useState('');
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
            <CyberTextArea
              variant="cyan"
              rows={4}
              placeholder="e.g.: Write a funny review about the newly released AirPods 4..."
              value={prompt}
              onChange={(e) => setPrompt(e.target.value)}
            />
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
              >
                <ImageIcon size={14} />
                Select Image
              </CyberButton>
              
              {imageName && (
                <div className="flex items-center gap-2 bg-neon-cyan/10 text-neon-cyan px-3 py-1.5 border border-neon-cyan/20 text-xs font-mono">
                  <span className="truncate max-w-[200px]">{imageName}</span>
                  <button onClick={removeImage} className="hover:text-neon-red transition-colors cursor-pointer">
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
          <div className="mt-6 flex justify-end">
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

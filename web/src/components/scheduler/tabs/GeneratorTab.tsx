import React, { useState, useRef } from 'react';
import { Bot, Image as ImageIcon, Send, Loader2, Sparkles, X } from 'lucide-react';
import { schedulerApi } from '@/app/api/schedulerApi';

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
      setError('Ảnh quá lớn. Vui lòng chọn ảnh < 5MB.');
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
      setError('Vui lòng nhập nội dung cần tạo (Prompt).');
      return;
    }

    setIsGenerating(true);
    setError('');
    
    try {
      const res = await schedulerApi.generateCustomPost(prompt, imageBase64);
      if (res.success && res.content) {
        setGeneratedText(res.content);
      } else {
        setError(res.error || 'Lỗi không xác định khi tạo nội dung.');
      }
    } catch (err: any) {
      setError(err.message || 'Không thể kết nối đến máy chủ AI.');
    } finally {
      setIsGenerating(false);
    }
  };

  const handleSave = () => {
    if (!generatedText.trim()) return;
    onSaveToPending(prompt, generatedText);
    // Reset state after saving?
    // setPrompt('');
    // removeImage();
    // setGeneratedText('');
  };

  return (
    <div className="space-y-6">
      <div className="bg-white/5 backdrop-blur-sm p-6 rounded-xl border border-blue-500/20 shadow-lg shadow-blue-500/5">
        <h2 className="text-xl font-bold text-slate-100 flex items-center gap-2 mb-4">
          <Sparkles className="text-blue-400" size={24} />
          AI Post Generator
        </h2>
        <p className="text-slate-400 text-sm mb-6">
          Nhập prompt hoặc tải ảnh lên để AI tự động sáng tạo nội dung mà không cần cào bài từ nguồn khác.
        </p>

        {error && (
          <div className="mb-4 p-3 bg-red-500/10 border border-red-500/30 rounded-lg text-red-400 text-sm">
            {error}
          </div>
        )}

        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-slate-300 mb-2">
              Chỉ thị (Prompt) <span className="text-red-400">*</span>
            </label>
            <textarea
              className="w-full bg-slate-900/50 border border-slate-700 rounded-lg p-3 text-slate-200 placeholder-slate-500 focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500 transition-all resize-none"
              rows={4}
              placeholder="VD: Viết một bài review hài hước về chiếc tai nghe Airpods 4 mới ra mắt..."
              value={prompt}
              onChange={(e) => setPrompt(e.target.value)}
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-slate-300 mb-2">
              Hình ảnh đính kèm (Tùy chọn)
            </label>
            <div className="flex items-center gap-4">
              <input
                type="file"
                accept="image/*"
                className="hidden"
                ref={fileInputRef}
                onChange={handleImageUpload}
              />
              <button
                onClick={() => fileInputRef.current?.click()}
                className="flex items-center gap-2 px-4 py-2 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-lg border border-slate-600 transition-colors text-sm"
              >
                <ImageIcon size={16} />
                Chọn Ảnh
              </button>
              
              {imageName && (
                <div className="flex items-center gap-2 bg-blue-500/10 text-blue-300 px-3 py-1.5 rounded-lg border border-blue-500/20 text-sm">
                  <span className="truncate max-w-[200px]">{imageName}</span>
                  <button onClick={removeImage} className="hover:text-red-400 transition-colors">
                    <X size={16} />
                  </button>
                </div>
              )}
            </div>
            {imageBase64 && (
              <div className="mt-4">
                <img src={imageBase64} alt="Preview" className="max-h-48 rounded-lg border border-slate-700" />
              </div>
            )}
          </div>

          <button
            onClick={handleGenerate}
            disabled={isGenerating}
            className="w-full mt-4 flex items-center justify-center gap-2 border border-[#00f3ff] text-[#00f3ff] hover:bg-[#00f3ff]/20 py-3 font-bold uppercase tracking-widest transition-all disabled:opacity-50 disabled:cursor-not-allowed shadow-[0_0_10px_rgba(0,243,255,0.2)] hover:shadow-[0_0_15px_rgba(0,243,255,0.4)] bg-transparent"
          >
            {isGenerating ? (
              <>
                <Loader2 size={20} className="animate-spin" />
                Đang vận công sáng tác...
              </>
            ) : (
              <>
                <Bot size={20} />
                Tạo Nội Dung Ngay
              </>
            )}
          </button>
        </div>
      </div>

      {generatedText && (
        <div className="bg-slate-900/50 backdrop-blur-sm p-6 rounded-xl border border-green-500/20 shadow-lg shadow-green-500/5 animate-in fade-in slide-in-from-bottom-4">
          <h3 className="text-lg font-bold text-slate-100 flex items-center gap-2 mb-4">
            <Sparkles className="text-green-400" size={20} />
            Kết Quả Sáng Tác
          </h3>
          <div className="bg-slate-950 rounded-lg p-4 text-slate-300 whitespace-pre-wrap font-mono text-sm border border-slate-800">
            {generatedText}
          </div>
          <div className="mt-6 flex justify-end">
            <button
              onClick={handleSave}
              className="flex items-center gap-2 border border-[#fce205] text-[#fce205] hover:bg-[#fce205]/20 px-6 py-2.5 font-bold uppercase tracking-wider transition-all shadow-[0_0_10px_rgba(252,226,5,0.2)] hover:shadow-[0_0_15px_rgba(252,226,5,0.4)] bg-transparent"
            >
              <Send size={18} />
              Lưu vào Hàng Đợi (Pending)
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

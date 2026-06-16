import React from 'react';
import { FileText } from 'lucide-react';
import { Post } from '@/types/scheduler';

export type PostCardTheme = 'pink' | 'cyan' | 'yellow' | 'red';

interface PostCardProps {
  post: Post;
  theme: PostCardTheme;
  dateLabel?: string;
  badgeLabel?: string;
  onClick?: () => void;
  actions?: React.ReactNode;
}

const themeConfig: Record<PostCardTheme, {
  border: string;
  hoverBorder: string;
  bg: string;
  hoverBg: string;
  text: string;
  gradient: string;
  badgeBg: string;
  iconBg: string;
}> = {
  pink: {
    border: 'border-zinc-700 hover:border-[#ff00ff]/50',
    hoverBorder: 'group-hover:bg-[#ff00ff]',
    bg: 'bg-black/60',
    hoverBg: 'group-hover:bg-black/80',
    text: 'text-[#ff00ff]',
    gradient: 'from-[rgba(255,0,255,0.03)]',
    badgeBg: 'bg-[#ff00ff]/10',
    iconBg: 'group-hover:bg-[#ff00ff]/10',
  },
  cyan: {
    border: 'border-zinc-700 hover:border-[#00f3ff]',
    hoverBorder: 'group-hover:bg-[#00f3ff]',
    bg: 'bg-black/60',
    hoverBg: 'group-hover:bg-black/80',
    text: 'text-[#00f3ff]',
    gradient: 'from-[rgba(0,243,255,0.03)]',
    badgeBg: 'bg-[#00f3ff]/10',
    iconBg: 'group-hover:bg-[#00f3ff]/10',
  },
  yellow: {
    border: 'border-[#fce205]/30 hover:border-[#fce205]/80',
    hoverBorder: 'group-hover:bg-[#fce205] bg-[#fce205]',
    bg: 'bg-black/60',
    hoverBg: 'hover:bg-black/80',
    text: 'text-[#fce205]',
    gradient: 'from-[rgba(252,226,5,0.03)]',
    badgeBg: 'bg-[#fce205]/20',
    iconBg: 'group-hover:bg-[#fce205]/10',
  },
  red: {
    border: 'border-[#ff0000]/40 hover:border-[#ff0000]/80',
    hoverBorder: 'group-hover:bg-[#ff0000] bg-[#ff0000]',
    bg: 'bg-[#ff0000]/10',
    hoverBg: 'hover:bg-[#ff0000]/20',
    text: 'text-[#ff0000]',
    gradient: 'from-[rgba(255,0,0,0.03)]',
    badgeBg: 'bg-[#ff0000]/20',
    iconBg: 'group-hover:bg-[#ff0000]/10',
  }
};

export function PostCard({
  post,
  theme,
  dateLabel,
  badgeLabel,
  onClick,
  actions
}: PostCardProps) {
  const config = themeConfig[theme];
  const isFail = theme === 'red';
  const isPosted = post.status === 'POSTED';
  
  // Specific style overrides based on context
  const cardBorder = theme === 'pink' || theme === 'cyan' ? 'border-zinc-700' : config.border;
  const cardBg = isPosted ? 'bg-black/40 opacity-80' : config.bg;
  const shadow = theme === 'yellow' ? 'shadow-[0_0_10px_rgba(252,226,5,0.05)]' : '';

  return (
    <div
      onClick={onClick}
      className={`${cardBg} p-5 border ${cardBorder} ${shadow} flex flex-col items-start gap-4 transition-all duration-300 ease-out group relative overflow-hidden ${onClick ? 'cursor-pointer hover:shadow-[0_0_15px_rgba(0,243,255,0.2)]' : ''} ${config.hoverBg}`}
    >
      <div className={`absolute top-0 left-0 ${theme === 'yellow' || theme === 'red' ? 'w-full h-0.5' : 'w-1 h-full bg-zinc-700'} ${config.hoverBorder}`} />
      
      <div className="flex w-full items-start gap-4">
        {/* Only show icon box for pink/cyan themes */}
        {(theme === 'pink' || theme === 'cyan') && (
          <div className={`w-10 h-10 bg-zinc-900 flex items-center justify-center shrink-0 border border-zinc-700 group-hover:border-[${config.text.split('-')[1]}]/50 ${config.iconBg} transition-colors duration-300 ease-out`}>
            <FileText className="w-5 h-5 text-zinc-400 group-hover:text-current" style={{ color: 'inherit' }} />
          </div>
        )}
        
        <div className="flex-1 min-w-0">
          <div className={`flex items-center justify-between mb-2 ${(theme === 'pink' || theme === 'cyan') ? 'justify-start gap-3' : ''}`}>
            <span className={`px-2 py-0.5 ${config.badgeBg} ${config.text} border border-[${config.text.split('-')[1]}]/30 text-[10px] font-bold tracking-widest ${isFail ? 'animate-pulse' : ''}`}>
              {badgeLabel || `[${post.status}]`}
            </span>
            
            {(theme === 'pink' || theme === 'cyan') ? (
              <>
                <span className="text-[10px] text-zinc-500 tracking-wider">SRC_ID: {post.sourcePostId}</span>
                <span className="text-[10px] text-zinc-500 tracking-wider">TS: {dateLabel}</span>
              </>
            ) : (
              <span className="text-xs text-zinc-400 bg-zinc-900 px-2 py-1 border border-zinc-800">
                {dateLabel || 'UNKNOWN'}
              </span>
            )}
          </div>
          
          <div className="flex gap-4">
            {post.imageUrl && (
              <div className={`w-16 h-16 shrink-0 border border-[${config.text.split('-')[1]}]/30 overflow-hidden relative`}>
                <div className={`absolute inset-0 bg-gradient-to-b ${config.gradient} to-[rgba(0,0,0,0.25)] bg-[size:100%_4px] pointer-events-none z-10`} />
                <img src={post.imageUrl} alt="thumbnail" className={`w-full h-full object-cover ${isPosted ? 'grayscale' : ''}`} />
              </div>
            )}
            <h3 className="text-zinc-300 font-medium text-sm leading-relaxed flex-1">
              {post.rewrittenText ? post.rewrittenText.substring(0, 200) : post.originalText.substring(0, 200)}...
            </h3>
          </div>
        </div>
      </div>
      
      {(actions || post.fbPostId) && (
        <div className={`flex w-full items-center justify-between mt-2 pt-2 ${(theme === 'yellow' || theme === 'red') ? 'border-t border-zinc-800/50 pt-4' : ''}`}>
          <p className="text-[10px] text-zinc-600">TRG_ID: {post.fbPostId || 'N/A'}</p>
          {actions && <div className="flex gap-2 items-center flex-wrap justify-end flex-1">{actions}</div>}
        </div>
      )}
    </div>
  );
}

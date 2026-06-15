import Link from 'next/link';
import { Terminal, Home } from 'lucide-react';
import { CyberButton, CyberCard } from '@/components/ui/CyberComponents';

export default function NotFound() {
  return (
    <div className="flex-1 flex items-center justify-center min-h-[70vh] p-6 font-mono bg-transparent">
      <CyberCard variant="magenta" withCorners className="max-w-md w-full text-center space-y-6">
        <div className="w-16 h-16 mx-auto bg-neon-magenta/10 flex items-center justify-center border border-neon-magenta animate-pulse shadow-neon-magenta">
          <Terminal className="w-8 h-8 text-neon-magenta" />
        </div>
        <div className="space-y-2">
          <h2 className="text-xl font-bold text-slate-100 tracking-widest uppercase text-glow-magenta">
            ERR_404: PAGE_NOT_FOUND
          </h2>
          <div className="w-32 h-[2px] bg-neon-magenta mx-auto shadow-[0_0_8px_#ff00ff]" />
          <p className="text-xs text-zinc-400 leading-relaxed uppercase">
            The requested resource is outside the authenticated scheduler boundaries.
          </p>
        </div>
        <div>
          <Link href="/" passHref legacyBehavior>
            <CyberButton variant="magenta" className="w-full flex items-center justify-center gap-2">
              <Home size={14} />
              RETURN_TO_DASHBOARD
            </CyberButton>
          </Link>
        </div>
      </CyberCard>
    </div>
  );
}

'use client';

import { useEffect } from 'react';
import { AlertOctagon, RotateCcw } from 'lucide-react';
import { CyberButton, CyberCard } from '@/components/ui/CyberComponents';

export default function ErrorPage({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    // Log to console/external monitors
    console.error('SYSTEM_ERROR_LOG:', error);
  }, [error]);

  return (
    <div className="flex-1 flex items-center justify-center min-h-[70vh] p-6 font-mono bg-transparent">
      <CyberCard variant="red" withCorners className="max-w-lg w-full text-center space-y-6">
        <div className="w-16 h-16 mx-auto bg-neon-red/10 flex items-center justify-center border border-neon-red animate-bounce shadow-neon-red">
          <AlertOctagon className="w-8 h-8 text-neon-red" />
        </div>
        <div className="space-y-2">
          <h2 className="text-xl font-bold text-slate-100 tracking-widest uppercase text-glow-red">
            CRITICAL_SYS_FAILURE (500)
          </h2>
          <div className="w-32 h-[2px] bg-neon-red mx-auto shadow-[0_0_8px_#ff0000]" />
          <div className="bg-black/60 p-4 border border-zinc-800 text-left rounded-none overflow-x-auto text-[10px] text-zinc-400">
            <span className="text-neon-red font-bold block mb-1 font-mono">ERR_MSG:</span>
            {error.message || 'UNKNOWN_CORE_EXCEPTION'}
            {error.digest && (
              <div className="mt-2 text-zinc-500 font-mono">
                <span className="font-bold">DIGEST:</span> {error.digest}
              </div>
            )}
          </div>
        </div>
        <div>
          <CyberButton
            variant="red"
            className="w-full flex items-center justify-center gap-2"
            onClick={() => reset()}
          >
            <RotateCcw size={14} />
            REBOOT_SYS_ROUTINES (RETRY)
          </CyberButton>
        </div>
      </CyberCard>
    </div>
  );
}

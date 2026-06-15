import { Loader2 } from 'lucide-react';

export default function Loading() {
  return (
    <div className="flex-1 flex flex-col items-center justify-center min-h-[50vh] text-neon-cyan font-mono p-6">
      <Loader2 className="w-12 h-12 animate-spin mb-4 text-neon-cyan" />
      <span className="text-xs font-bold tracking-widest uppercase text-glow-cyan animate-pulse">
        CONNECTING_TO_SYS_CORE...
      </span>
    </div>
  );
}

import { Loader2 } from 'lucide-react';

export default function ChatLoading() {
  return (
    <div className="flex w-full h-screen bg-zinc-50 items-center justify-center flex-col gap-4 text-zinc-900">
      <Loader2 className="w-8 h-8 animate-spin text-zinc-400" />
      <div className="text-sm font-medium tracking-wide animate-pulse text-zinc-500">
        Initializing Workspace...
      </div>
    </div>
  );
}

import { SchedulerArea } from '@/components/scheduler/SchedulerArea';

export default function SchedulerPage() {
  return (
    <div className="flex w-full h-screen overflow-hidden bg-slate-50 text-zinc-900 font-sans">
      <div className="w-full h-full max-w-7xl mx-auto flex">
        <SchedulerArea />
      </div>
    </div>
  );
}

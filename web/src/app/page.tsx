import { SchedulerArea } from '@/components/scheduler/SchedulerArea';
import { Post } from '@/types/scheduler';

export default async function SchedulerPage() {
  let posts: Post[] = [];
  let dbError = false;

  const apiUrl = process.env.API_URL || process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000';

  try {
    const res = await fetch(`${apiUrl}/api/v1/posts`, { cache: 'no-store' });
    if (!res.ok) throw new Error('Failed to fetch posts');
    const data = await res.json();
    posts = data.posts || [];
  } catch {
    dbError = true;
  }

  return (
    <div className="flex w-full h-screen overflow-hidden bg-black font-sans">
      <div className="w-full h-full flex flex-col">
        {dbError && (
          <div className="bg-[#ff0000]/10 text-[#ff0000] px-6 py-2 text-xs font-bold uppercase tracking-widest border-b border-[#ff0000]/30 shadow-sm z-50 animate-pulse">
            SYS.WARNING: DB_CONNECTION_LOST. CHECK .ENV CONFIGURATION
          </div>
        )}
        <SchedulerArea />
      </div>
    </div>
  );
}

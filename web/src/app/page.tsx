import { SchedulerArea } from '@/components/scheduler/SchedulerArea';
import prisma from '@/lib/prisma';

export default async function SchedulerPage() {
  let posts: any[] = [];
  let dbError = false;

  try {
    posts = await prisma.post.findMany({
      orderBy: { createdAt: 'desc' }
    });
  } catch (error) {
    // Not using console.error here because Next.js Dev Overlay will catch it and show a red screen.
    // DB login error is due to user not configuring .env properly, automatically fallback to Mock Data.
    dbError = true;
    
    // Provide a mock post so the UI can still be viewed and tested even if DB is down
    posts = [
      {
        id: 999,
        sourcePostId: "mock-123",
        originalText: "This is a placeholder original text.",
        rewrittenText: "Hello folks! This post was automatically rewritten by AI, ready to be scheduled! 😎🔥",
        status: "REWRITTEN"
      }
    ];
  }

  return (
    <div className="flex w-full h-screen overflow-hidden bg-black font-sans">
      <div className="w-full h-full flex flex-col">
        {dbError && (
          <div className="bg-[#ff0000]/10 text-[#ff0000] px-6 py-2 text-xs font-bold uppercase tracking-widest border-b border-[#ff0000]/30 shadow-sm z-50 animate-pulse">
            SYS.WARNING: DB_CONNECTION_LOST. USING_MOCK_DATA. CHECK .ENV CONFIGURATION
          </div>
        )}
        <SchedulerArea initialPosts={posts} />
      </div>
    </div>
  );
}

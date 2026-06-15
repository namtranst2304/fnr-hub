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
    
    // Add mock data if empty for UI testing
    if (posts.length === 0) {
      posts = [
        {
          id: 999,
          sourcePostId: "mock-123",
          originalText: "Just had the most amazing coffee at the new downtown cafe! ☕ The latte art was insane and the ambiance is totally cyberpunk. Highly recommend checking it out if you're in the area! #coffee #cyberpunk #morningvibes",
          rewrittenText: "This is a placeholder rewritten text.",
          status: "SCRAPED",
          scheduledAt: null,
          fbPostId: null,
          sourcePageId: null,
          createdAt: new Date().toISOString(),
          imageUrl: null
        },
        {
          id: 1000,
          sourcePostId: "mock-456",
          originalText: "Tesla's new self-driving update is wild! It basically drove me from SF to San Jose with zero interventions. The future is literally now. What do you guys think about AI driving?",
          rewrittenText: "This is a placeholder rewritten text.",
          status: "DRAFT",
          scheduledAt: null,
          fbPostId: null,
          sourcePageId: null,
          createdAt: new Date().toISOString(),
          imageUrl: null
        }
      ];
    }
  } catch {
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
        status: "SCRAPED",
        scheduledAt: null,
        fbPostId: null,
        sourcePageId: null,
        createdAt: new Date().toISOString(),
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

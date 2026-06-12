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
    // Không dùng console.error ở đây vì Next.js Dev Overlay sẽ bắt được và hiện bảng đỏ che màn hình.
    // Lỗi đăng nhập DB là do người dùng chưa cấu hình đúng `.env`, ta sẽ tự động fallback sang Mock Data.
    dbError = true;
    
    // Provide a mock post so the UI can still be viewed and tested even if DB is down
    posts = [
      {
        id: 999,
        sourcePostId: "mock-123",
        originalText: "This is a placeholder original text.",
        rewrittenText: "Hé lô anh em! Bài viết này được AI xào tự động, sẵn sàng để lên lịch! 😎🔥",
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

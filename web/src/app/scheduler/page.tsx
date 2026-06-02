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
    <div className="flex w-full h-screen overflow-hidden bg-gradient-to-br from-blue-700 via-blue-500 to-cyan-400 text-zinc-900 font-sans">
      <div className="w-full h-full max-w-7xl mx-auto flex flex-col p-4 md:p-6">
        {dbError && (
          <div className="bg-orange-100/90 backdrop-blur-md text-orange-800 px-6 py-3 text-sm font-medium border border-orange-200 rounded-xl mb-4 shadow-sm">
            Lưu ý: Không thể kết nối tới Database. Đang hiển thị dữ liệu mẫu để bạn xem trước UI. Hãy kiểm tra file .env
          </div>
        )}
        <SchedulerArea initialPosts={posts} />
      </div>
    </div>
  );
}

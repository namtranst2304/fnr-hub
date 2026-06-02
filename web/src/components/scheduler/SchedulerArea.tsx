'use client';

import { useState } from 'react';
import { Calendar, Clock, Send, CheckCircle2, AlertCircle, FileText } from 'lucide-react';

interface Post {
  id: number;
  originalText: string;
  rewrittenText: string | null;
  status: string;
}

export function SchedulerArea({ initialPosts }: { initialPosts: Post[] }) {
  const [posts, setPosts] = useState<Post[]>(initialPosts);
  const [schedules, setSchedules] = useState<Record<number, string>>({});
  const [loadingIds, setLoadingIds] = useState<Record<number, boolean>>({});

  const handleSchedulePost = async (postId: number) => {
    const selectedDate = schedules[postId];
    if (!selectedDate) {
      alert("Vui lòng chọn ngày giờ trước khi hẹn!");
      return;
    }

    setLoadingIds(prev => ({ ...prev, [postId]: true }));

    try {
      const res = await fetch('/api/schedule-fb', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          postId: postId,
          scheduledTime: new Date(selectedDate).toISOString(),
        })
      });

      const data = await res.json();
      
      if (data.success) {
        alert(`Đã ném lên Facebook! Chờ đến giờ là nổ. ID: ${data.fbPostId}`);
        // Remove the post from the list since it's scheduled
        setPosts(posts.filter(p => p.id !== postId));
      } else {
        alert(`Lỗi rùi: ${data.error}`);
      }
    } catch (err: any) {
      alert(`Lỗi Server: ${err.message}`);
    } finally {
      setLoadingIds(prev => ({ ...prev, [postId]: false }));
    }
  };

  return (
    <main className="flex-1 flex flex-col min-w-0 bg-white shadow-xl mx-4 my-6 rounded-2xl overflow-hidden border border-zinc-200">
      {/* Header */}
      <header className="flex items-center justify-between h-16 px-6 border-b border-zinc-200 shrink-0 bg-white">
        <div className="flex items-center">
          <Calendar className="w-5 h-5 mr-3 text-blue-600" />
          <span className="font-bold text-lg">Facebook Post Scheduler</span>
        </div>
        <a href="/" className="text-sm font-medium text-zinc-500 hover:text-zinc-900 transition-colors">
          &larr; Back to Homepage
        </a>
      </header>
      
      {/* Scrollable Content Area */}
      <div className="flex-1 min-h-0 overflow-y-auto p-6 lg:p-10 bg-zinc-50/50">
        <div className="max-w-4xl mx-auto">
          <div className="mb-8">
            <h1 className="text-2xl font-bold text-zinc-900 mb-2">Bài viết chờ duyệt</h1>
            <p className="text-zinc-500 text-sm">Danh sách các bài viết đã được AI xử lý (Status: REWRITTEN). Đặt giờ để đẩy thẳng lên Facebook.</p>
          </div>

          <div className="space-y-6">
            {posts.length === 0 ? (
              <div className="text-center py-20 text-zinc-500">
                <CheckCircle2 className="w-12 h-12 mx-auto mb-4 text-zinc-300" />
                <p>Không có bài viết nào đang chờ duyệt.</p>
              </div>
            ) : (
              posts.map((post) => (
                <div key={post.id} className="bg-white p-6 rounded-xl border border-zinc-200 shadow-sm flex flex-col gap-4">
                  
                  {/* Post Content */}
                  <div className="flex gap-4 items-start">
                    <div className="w-10 h-10 rounded-full bg-blue-50 flex items-center justify-center shrink-0">
                      <FileText className="w-5 h-5 text-blue-600" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between mb-2">
                        <h3 className="font-semibold text-zinc-900">Post #{post.id}</h3>
                        <span className="px-2.5 py-1 bg-yellow-100 text-yellow-800 text-xs font-medium rounded-full">
                          {post.status}
                        </span>
                      </div>
                      <div className="bg-zinc-50 p-4 rounded-lg border border-zinc-100 text-sm text-zinc-700 whitespace-pre-wrap">
                        {post.rewrittenText}
                      </div>
                    </div>
                  </div>

                  {/* Actions */}
                  <div className="flex flex-col sm:flex-row items-center gap-4 pt-4 mt-2 border-t border-zinc-100 pl-14">
                    <div className="flex items-center gap-2 flex-1 w-full">
                      <Clock className="w-4 h-4 text-zinc-400" />
                      <input
                        type="datetime-local"
                        value={schedules[post.id] || ''}
                        onChange={(e) => setSchedules({ ...schedules, [post.id]: e.target.value })}
                        className="flex-1 px-4 py-2 border border-zinc-300 rounded-lg outline-none focus:ring-2 focus:ring-blue-500 text-sm transition-all"
                        disabled={loadingIds[post.id]}
                      />
                    </div>
                    <button
                      onClick={() => handleSchedulePost(post.id)}
                      disabled={loadingIds[post.id] || !schedules[post.id]}
                      className="w-full sm:w-auto flex items-center justify-center gap-2 px-6 py-2 bg-blue-600 hover:bg-blue-700 text-white font-medium rounded-lg disabled:opacity-50 transition-colors"
                    >
                      {loadingIds[post.id] ? (
                        <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                      ) : (
                        <Send className="w-4 h-4" />
                      )}
                      Phê duyệt & Hẹn giờ
                    </button>
                  </div>

                </div>
              ))
            )}
          </div>

        </div>
      </div>
    </main>
  );
}

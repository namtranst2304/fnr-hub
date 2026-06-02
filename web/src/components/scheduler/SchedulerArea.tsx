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
    <main className="flex-1 flex flex-col min-w-0 bg-white/30 backdrop-blur-2xl shadow-[0_8px_32px_rgba(0,0,0,0.1)] rounded-3xl overflow-hidden border border-white/50">
      {/* Header */}
      <header className="flex items-center justify-between h-16 px-6 border-b border-white/40 shrink-0 bg-white/40 backdrop-blur-md">
        <div className="flex items-center">
          <Calendar className="w-5 h-5 mr-3 text-blue-700" />
          <span className="font-bold text-lg text-blue-950">Facebook Post Scheduler</span>
        </div>
        <a href="/" className="text-sm font-medium text-blue-900/70 hover:text-blue-900 transition-colors">
          &larr; Back to Homepage
        </a>
      </header>
      
      {/* Scrollable Content Area */}
      <div className="flex-1 min-h-0 overflow-y-auto p-6 lg:p-10 bg-transparent scrollbar-thin scrollbar-thumb-white/30">
        <div className="max-w-4xl mx-auto">
          <div className="mb-8">
            <h1 className="text-3xl font-bold text-white drop-shadow-sm mb-2">Bài viết chờ duyệt</h1>
            <p className="text-white/80 text-sm font-medium">Danh sách các bài viết đã được AI xử lý (Status: REWRITTEN). Đặt giờ để đẩy thẳng lên Facebook.</p>
          </div>

          <div className="space-y-6">
            {posts.length === 0 ? (
              <div className="text-center py-20 text-white">
                <CheckCircle2 className="w-16 h-16 mx-auto mb-4 text-white/50" />
                <p className="text-lg font-medium drop-shadow-sm">Không có bài viết nào đang chờ duyệt.</p>
              </div>
            ) : (
              posts.map((post) => (
                <div key={post.id} className="bg-white/40 backdrop-blur-xl p-6 rounded-2xl border border-white/60 shadow-[0_4px_16px_rgba(0,0,0,0.05)] flex flex-col gap-4">
                  
                  {/* Post Content */}
                  <div className="flex gap-4 items-start">
                    <div className="w-10 h-10 rounded-full bg-white/60 flex items-center justify-center shrink-0 shadow-sm border border-white/50">
                      <FileText className="w-5 h-5 text-blue-700" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between mb-2">
                        <h3 className="font-semibold text-blue-950">Post #{post.id}</h3>
                        <span className="px-3 py-1 bg-white/70 text-blue-800 text-xs font-bold rounded-full border border-white/50 shadow-sm">
                          {post.status}
                        </span>
                      </div>
                      <div className="bg-white/50 p-4 rounded-xl border border-white/60 text-sm text-zinc-800 whitespace-pre-wrap shadow-inner font-medium">
                        {post.rewrittenText}
                      </div>
                    </div>
                  </div>

                  {/* Actions */}
                  <div className="flex flex-col sm:flex-row items-center gap-4 pt-4 mt-2 border-t border-white/30 pl-14">
                    <div className="flex items-center gap-2 flex-1 w-full">
                      <Clock className="w-5 h-5 text-blue-900/60" />
                      <input
                        type="datetime-local"
                        value={schedules[post.id] || ''}
                        onChange={(e) => setSchedules({ ...schedules, [post.id]: e.target.value })}
                        className="flex-1 px-4 py-2.5 bg-white/50 border border-white/60 rounded-xl outline-none focus:ring-2 focus:ring-blue-400 text-sm font-medium transition-all shadow-sm"
                        disabled={loadingIds[post.id]}
                      />
                    </div>
                    <button
                      onClick={() => handleSchedulePost(post.id)}
                      disabled={loadingIds[post.id] || !schedules[post.id]}
                      className="w-full sm:w-auto flex items-center justify-center gap-2 px-8 py-2.5 bg-blue-600/90 hover:bg-blue-700 backdrop-blur-md text-white font-bold rounded-xl shadow-lg border border-blue-400/30 disabled:opacity-50 transition-all hover:scale-105 active:scale-95"
                    >
                      {loadingIds[post.id] ? (
                        <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                      ) : (
                        <Send className="w-4 h-4" />
                      )}
                      Hẹn giờ FB
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

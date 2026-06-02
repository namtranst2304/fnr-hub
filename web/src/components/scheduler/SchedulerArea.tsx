'use client';

import { useState } from 'react';
import { Calendar, Clock, Send, FileText, CheckCircle2, LayoutGrid, List, X, Trash2, Save, XCircle } from 'lucide-react';

interface Post {
  id: number;
  sourcePostId: string;
  originalText: string;
  rewrittenText: string | null;
  status: string;
  scheduledAt: string | null;
  fbPostId: string | null;
  createdAt: string;
}

export function SchedulerArea({ initialPosts }: { initialPosts: Post[] }) {
  const [posts, setPosts] = useState<Post[]>(initialPosts);
  const [activeTab, setActiveTab] = useState<'pending' | 'scheduled'>('pending');
  
  // Modal State
  const [selectedPost, setSelectedPost] = useState<Post | null>(null);
  const [editedText, setEditedText] = useState('');
  const [scheduleTime, setScheduleTime] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  // Scraper State
  const [scrapeUrl, setScrapeUrl] = useState('');
  const [isScraping, setIsScraping] = useState(false);

  // Derived data
  const pendingPosts = posts.filter(p => p.status === 'DRAFT' || p.status === 'REWRITTEN');
  const scheduledPosts = posts.filter(p => p.status === 'SCHEDULED' || p.status === 'POSTED' || p.status === 'FAILED');

  const openModal = (post: Post) => {
    setSelectedPost(post);
    setEditedText(post.rewrittenText || post.originalText || '');
    // If it has a scheduled time, format it for datetime-local (YYYY-MM-DDThh:mm)
    if (post.scheduledAt) {
      const date = new Date(post.scheduledAt);
      const iso = new Date(date.getTime() - (date.getTimezoneOffset() * 60000)).toISOString().slice(0, 16);
      setScheduleTime(iso);
    } else {
      setScheduleTime('');
    }
  };

  const closeModal = () => {
    setSelectedPost(null);
    setEditedText('');
    setScheduleTime('');
  };

  const handleScrape = async () => {
    if (!scrapeUrl) {
      alert("Vui lòng nhập URL Facebook!");
      return;
    }
    setIsScraping(true);
    try {
      // Gọi sang FastAPI Backend (chạy port 8000)
      const res = await fetch('http://localhost:8000/api/trigger-scraper', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ url: scrapeUrl })
      });
      const data = await res.json();
      if (res.ok) {
        alert("Cào thành công! Vui lòng Refresh (F5) trang để xem bài viết mới trong Hàng đợi.");
        setScrapeUrl('');
      } else {
        alert("Lỗi cào dữ liệu: " + (data.detail || data.error));
      }
    } catch (err: any) {
      alert("Không thể kết nối tới Python Backend (localhost:8000). Hãy chắc chắn bạn đã chạy FastAPI: " + err.message);
    } finally {
      setIsScraping(false);
    }
  };

  const handleSaveDraft = async () => {
    if (!selectedPost) return;
    setIsLoading(true);
    try {
      const res = await fetch(`/api/posts/${selectedPost.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ rewrittenText: editedText })
      });
      const data = await res.json();
      if (data.success) {
        setPosts(posts.map(p => p.id === selectedPost.id ? { ...p, rewrittenText: editedText } : p));
        closeModal();
      } else {
        alert("Lỗi: " + data.error);
      }
    } catch (err: any) {
      alert("Lỗi Server: " + err.message);
    } finally {
      setIsLoading(false);
    }
  };

  const handleDelete = async () => {
    if (!selectedPost) return;
    if (!confirm("Bạn có chắc chắn muốn xóa bài viết này không?")) return;
    
    setIsLoading(true);
    try {
      const res = await fetch(`/api/posts/${selectedPost.id}`, { method: 'DELETE' });
      const data = await res.json();
      if (data.success) {
        setPosts(posts.filter(p => p.id !== selectedPost.id));
        closeModal();
      } else {
        alert("Lỗi: " + data.error);
      }
    } catch (err: any) {
      alert("Lỗi Server: " + err.message);
    } finally {
      setIsLoading(false);
    }
  };

  const handleSchedulePost = async () => {
    if (!selectedPost) return;
    if (!scheduleTime) {
      alert("Vui lòng chọn ngày giờ hẹn!");
      return;
    }

    setIsLoading(true);
    try {
      const res = await fetch('/api/schedule-fb', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          postId: selectedPost.id,
          scheduledTime: new Date(scheduleTime).toISOString(),
          rewrittenText: editedText // Send the latest edit
        })
      });

      const data = await res.json();
      
      if (data.success) {
        alert(`Đã ném lên Facebook! Chờ đến giờ là nổ. ID: ${data.fbPostId}`);
        setPosts(posts.map(p => p.id === selectedPost.id ? { 
          ...p, 
          status: 'SCHEDULED', 
          scheduledAt: new Date(scheduleTime).toISOString(),
          rewrittenText: editedText,
          fbPostId: data.fbPostId 
        } : p));
        closeModal();
      } else {
        alert(`Lỗi rùi: ${data.error}`);
      }
    } catch (err: any) {
      alert(`Lỗi Server: ${err.message}`);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <main className="flex-1 flex flex-col min-w-0 bg-white/30 backdrop-blur-2xl shadow-[0_8px_32px_rgba(0,0,0,0.1)] rounded-3xl overflow-hidden border border-white/50 relative">
      {/* Header & Tabs */}
      <header className="flex flex-col xl:flex-row xl:items-center justify-between px-6 py-4 border-b border-white/40 shrink-0 bg-white/40 backdrop-blur-md gap-4">
        <div className="flex items-center">
          <Calendar className="w-5 h-5 mr-3 text-blue-700" />
          <span className="font-bold text-lg text-blue-950">CMS Content Scheduler</span>
        </div>
        
        <div className="flex flex-col sm:flex-row gap-4 items-center flex-1 justify-center">
          {/* Tabs */}
          <div className="flex bg-white/50 p-1 rounded-xl shadow-sm border border-white/60">
            <button 
              onClick={() => setActiveTab('pending')}
              className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-bold transition-all ${activeTab === 'pending' ? 'bg-white text-blue-700 shadow-sm' : 'text-blue-900/60 hover:text-blue-800'}`}
            >
              <List className="w-4 h-4" />
              Hàng đợi duyệt ({pendingPosts.length})
            </button>
            <button 
              onClick={() => setActiveTab('scheduled')}
              className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-bold transition-all ${activeTab === 'scheduled' ? 'bg-white text-blue-700 shadow-sm' : 'text-blue-900/60 hover:text-blue-800'}`}
            >
              <LayoutGrid className="w-4 h-4" />
              Lịch phát sóng ({scheduledPosts.length})
            </button>
          </div>

          {/* Scraper Input */}
          <div className="flex bg-white/50 p-1 rounded-xl shadow-sm border border-white/60">
            <input 
              type="text" 
              placeholder="Nhập URL Facebook (Post/Page)..."
              value={scrapeUrl}
              onChange={(e) => setScrapeUrl(e.target.value)}
              className="px-4 py-2 bg-transparent text-sm font-medium outline-none text-blue-900 placeholder:text-blue-900/40 w-full sm:w-64"
            />
            <button 
              onClick={handleScrape}
              disabled={isScraping}
              className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg text-sm font-bold shadow-sm transition-all disabled:opacity-50 flex items-center gap-2"
            >
              {isScraping ? <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" /> : "Cào & Xào"}
            </button>
          </div>
        </div>

        <a href="/" className="text-sm font-medium text-blue-900/70 hover:text-blue-900 transition-colors hidden xl:block">
          &larr; Exit
        </a>
      </header>
      
      {/* Scrollable Content Area */}
      <div className="flex-1 min-h-0 overflow-y-auto p-6 bg-transparent scrollbar-thin scrollbar-thumb-white/30">
        
        {/* TAB 1: PENDING */}
        {activeTab === 'pending' && (
          <div className="max-w-5xl mx-auto space-y-4">
            {pendingPosts.length === 0 ? (
              <div className="text-center py-20 text-white">
                <CheckCircle2 className="w-16 h-16 mx-auto mb-4 text-white/50" />
                <p className="text-lg font-medium drop-shadow-sm">Không có bài viết nào đang chờ duyệt.</p>
              </div>
            ) : (
              pendingPosts.map((post) => (
                <div 
                  key={post.id} 
                  onClick={() => openModal(post)}
                  className="bg-white/40 backdrop-blur-xl p-5 rounded-2xl border border-white/60 shadow-[0_4px_16px_rgba(0,0,0,0.05)] flex items-center gap-4 cursor-pointer hover:bg-white/60 hover:scale-[1.01] transition-all group"
                >
                  <div className="w-10 h-10 rounded-full bg-white/60 flex items-center justify-center shrink-0 shadow-sm border border-white/50 group-hover:bg-blue-100 transition-colors">
                    <FileText className="w-5 h-5 text-blue-700" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-3 mb-1">
                      <span className="px-2.5 py-0.5 bg-white/70 text-blue-800 text-xs font-bold rounded-md border border-white/50">
                        {post.status}
                      </span>
                      <span className="text-xs font-medium text-blue-900/60">Source: {post.sourcePostId}</span>
                      <span className="text-xs font-medium text-blue-900/60">Scraped: {new Date(post.createdAt).toLocaleDateString()}</span>
                    </div>
                    <h3 className="font-semibold text-blue-950 truncate text-sm">
                      {post.originalText.substring(0, 100)}...
                    </h3>
                  </div>
                  <div className="shrink-0 pl-4 text-blue-700 font-medium text-sm group-hover:underline">
                    Duyệt bài &rarr;
                  </div>
                </div>
              ))
            )}
          </div>
        )}

        {/* TAB 2: SCHEDULED/POSTED (KANBAN-like List) */}
        {activeTab === 'scheduled' && (
          <div className="max-w-5xl mx-auto grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="space-y-4">
              <h2 className="font-bold text-white text-xl drop-shadow-sm flex items-center gap-2">
                <Clock className="w-5 h-5" /> Đã Lên Lịch (Scheduled)
              </h2>
              {scheduledPosts.filter(p => p.status === 'SCHEDULED').map(post => (
                <div key={post.id} className="bg-white/60 backdrop-blur-xl p-5 rounded-2xl border border-white/80 shadow-sm">
                  <div className="flex justify-between items-start mb-2">
                    <span className="px-2.5 py-0.5 bg-yellow-100 text-yellow-800 text-xs font-bold rounded-md">SCHEDULED</span>
                    <span className="text-xs font-bold text-blue-900">{post.scheduledAt ? new Date(post.scheduledAt).toLocaleString() : ''}</span>
                  </div>
                  <p className="text-sm text-zinc-800 font-medium line-clamp-3 mb-3">{post.rewrittenText}</p>
                  <p className="text-xs text-blue-900/60 font-mono">FB ID: {post.fbPostId}</p>
                </div>
              ))}
            </div>
            
            <div className="space-y-4">
              <h2 className="font-bold text-white text-xl drop-shadow-sm flex items-center gap-2">
                <CheckCircle2 className="w-5 h-5" /> Đã Đăng (Posted)
              </h2>
              {scheduledPosts.filter(p => p.status === 'POSTED').map(post => (
                <div key={post.id} className="bg-white/40 backdrop-blur-xl p-5 rounded-2xl border border-white/40 shadow-sm opacity-80">
                  <div className="flex justify-between items-start mb-2">
                    <span className="px-2.5 py-0.5 bg-green-100 text-green-800 text-xs font-bold rounded-md">POSTED</span>
                  </div>
                  <p className="text-sm text-zinc-800 font-medium line-clamp-3">{post.rewrittenText}</p>
                </div>
              ))}
              {scheduledPosts.filter(p => p.status === 'FAILED').map(post => (
                <div key={post.id} className="bg-red-50/80 backdrop-blur-xl p-5 rounded-2xl border border-red-200 shadow-sm">
                  <span className="px-2.5 py-0.5 bg-red-100 text-red-800 text-xs font-bold rounded-md mb-2 inline-block">FAILED</span>
                  <p className="text-sm text-red-900 font-medium line-clamp-3">{post.rewrittenText}</p>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* EDITOR MODAL OVERLAY */}
      {selectedPost && (
        <div className="absolute inset-0 z-50 bg-blue-950/40 backdrop-blur-sm flex items-center justify-center p-4 md:p-8">
          <div className="bg-white/90 backdrop-blur-2xl w-full max-w-6xl h-full max-h-[800px] rounded-3xl shadow-2xl border border-white flex flex-col overflow-hidden animate-in fade-in zoom-in-95 duration-200">
            
            <div className="flex items-center justify-between px-6 py-4 border-b border-zinc-200 bg-white/50">
              <h2 className="font-bold text-xl text-blue-950">Kiểm duyệt & Chỉnh sửa (Post #{selectedPost.id})</h2>
              <button onClick={closeModal} className="p-2 hover:bg-zinc-200 rounded-full transition-colors">
                <X className="w-5 h-5 text-zinc-500" />
              </button>
            </div>

            <div className="flex-1 flex flex-col md:flex-row overflow-hidden bg-zinc-50/50">
              {/* Cột trái: Original Text */}
              <div className="w-full md:w-1/2 flex flex-col border-r border-zinc-200">
                <div className="px-6 py-3 bg-zinc-100/80 border-b border-zinc-200 text-xs font-bold text-zinc-500 uppercase tracking-wider">
                  Nội dung gốc (English)
                </div>
                <div className="flex-1 p-6 overflow-y-auto text-sm text-zinc-700 whitespace-pre-wrap font-medium leading-relaxed">
                  {selectedPost.originalText}
                </div>
              </div>

              {/* Cột phải: Rewritten Text */}
              <div className="w-full md:w-1/2 flex flex-col bg-white">
                <div className="px-6 py-3 bg-blue-50/80 border-b border-blue-100 text-xs font-bold text-blue-600 uppercase tracking-wider">
                  Bản dịch AI (Vietnamese - Editable)
                </div>
                <textarea
                  value={editedText}
                  onChange={(e) => setEditedText(e.target.value)}
                  className="flex-1 p-6 w-full resize-none outline-none text-sm text-zinc-900 whitespace-pre-wrap font-medium leading-relaxed focus:ring-inset focus:ring-2 focus:ring-blue-500/20"
                  placeholder="Nội dung trống..."
                />
              </div>
            </div>

            {/* CONTROLS (Dưới cùng) */}
            <div className="bg-white border-t border-zinc-200 p-6 flex flex-col sm:flex-row items-center justify-between gap-4">
              
              <div className="flex items-center gap-3">
                <div className="flex items-center gap-2 bg-zinc-50 border border-zinc-200 px-4 py-2.5 rounded-xl">
                  <Clock className="w-5 h-5 text-blue-600" />
                  <input
                    type="datetime-local"
                    value={scheduleTime}
                    onChange={(e) => setScheduleTime(e.target.value)}
                    className="bg-transparent border-none outline-none text-sm font-semibold text-zinc-800"
                    disabled={isLoading}
                  />
                </div>
                <p className="text-xs text-zinc-400 font-medium hidden lg:block max-w-[200px]">
                  Bỏ trống giờ nếu muốn đăng ngay. Phải cách hiện tại ít nhất 10 phút.
                </p>
              </div>

              <div className="flex items-center gap-3 w-full sm:w-auto">
                <button
                  onClick={handleDelete}
                  disabled={isLoading}
                  className="flex items-center justify-center gap-2 px-5 py-2.5 bg-red-50 hover:bg-red-100 text-red-600 font-bold rounded-xl transition-colors"
                  title="Xóa bỏ bài viết này vĩnh viễn"
                >
                  <Trash2 className="w-4 h-4" />
                  <span className="hidden sm:inline">Xóa bỏ</span>
                </button>
                
                <button
                  onClick={handleSaveDraft}
                  disabled={isLoading}
                  className="flex items-center justify-center gap-2 px-5 py-2.5 bg-zinc-100 hover:bg-zinc-200 text-zinc-700 font-bold rounded-xl transition-colors"
                >
                  <Save className="w-4 h-4" />
                  <span className="hidden sm:inline">Lưu nháp</span>
                </button>

                <button
                  onClick={handleSchedulePost}
                  disabled={isLoading || !scheduleTime}
                  className="flex items-center justify-center gap-2 px-8 py-2.5 bg-blue-600 hover:bg-blue-700 text-white font-bold rounded-xl shadow-lg shadow-blue-600/20 transition-transform active:scale-95 disabled:opacity-50"
                >
                  {isLoading ? (
                    <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                  ) : (
                    <Send className="w-4 h-4" />
                  )}
                  Duyệt & Hẹn giờ
                </button>
              </div>

            </div>
          </div>
        </div>
      )}
    </main>
  );
}

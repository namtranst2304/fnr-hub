'use client';

import { useState, useEffect, useCallback } from 'react';
import {
  Calendar, Clock, Send, FileText, CheckCircle2, LayoutGrid, List, X,
  Trash2, Save, XCircle, Globe, Settings, Plus, ToggleLeft, ToggleRight,
  Zap, Loader2, RefreshCw, Power, ExternalLink, Timer
} from 'lucide-react';

// ─── Type Definitions ─────────────────────────────────────────

interface Post {
  id: number;
  sourcePostId: string;
  originalText: string;
  rewrittenText: string | null;
  status: string;
  scheduledAt: string | null;
  fbPostId: string | null;
  sourcePageId: number | null;
  createdAt: string;
}

interface SourcePage {
  id: number;
  url: string;
  name: string;
  isActive: boolean;
  interval: number;
  lastScraped: string | null;
  createdAt: string;
}

interface AutoConfig {
  autoScrapeOn: boolean;
  autoPostOn: boolean;
  postIntervalMin: number;
  scrapeIntervalMin: number;
}

type TabKey = 'pending' | 'scheduled' | 'sources' | 'settings';

// ─── Component ────────────────────────────────────────────────

export function SchedulerArea({ initialPosts }: { initialPosts: Post[] }) {
  const [posts, setPosts] = useState<Post[]>(initialPosts);
  const [activeTab, setActiveTab] = useState<TabKey>('pending');

  // Modal State
  const [selectedPost, setSelectedPost] = useState<Post | null>(null);
  const [editedText, setEditedText] = useState('');
  const [scheduleTime, setScheduleTime] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  // Scraper State
  const [scrapeUrl, setScrapeUrl] = useState('');
  const [isScraping, setIsScraping] = useState(false);

  // Sources State
  const [sources, setSources] = useState<SourcePage[]>([]);
  const [isSourcesLoading, setIsSourcesLoading] = useState(false);
  const [newSourceUrl, setNewSourceUrl] = useState('');
  const [newSourceName, setNewSourceName] = useState('');
  const [newSourceInterval, setNewSourceInterval] = useState(30);

  // Config State
  const [config, setConfig] = useState<AutoConfig>({
    autoScrapeOn: false,
    autoPostOn: false,
    postIntervalMin: 120,
    scrapeIntervalMin: 30,
  });
  const [isConfigLoading, setIsConfigLoading] = useState(false);
  const [schedulerRunning, setSchedulerRunning] = useState(false);

  // Derived data
  const pendingPosts = posts.filter(p => p.status === 'DRAFT' || p.status === 'REWRITTEN');
  const scheduledPosts = posts.filter(p => p.status === 'SCHEDULED' || p.status === 'POSTED' || p.status === 'FAILED');

  // ─── Data Fetching ────────────────────────────────────────

  const fetchSources = useCallback(async () => {
    setIsSourcesLoading(true);
    try {
      const res = await fetch('/api/sources');
      const data = await res.json();
      if (data.success) {
        setSources(data.sources || []);
      }
    } catch (err) {
      console.error('Failed to fetch sources:', err);
    } finally {
      setIsSourcesLoading(false);
    }
  }, []);

  const fetchConfig = useCallback(async () => {
    setIsConfigLoading(true);
    try {
      const res = await fetch('/api/auto-config');
      const data = await res.json();
      if (data.success) {
        setConfig(data.config);
        setSchedulerRunning(data.scheduler?.running ?? false);
      }
    } catch (err) {
      console.error('Failed to fetch config:', err);
    } finally {
      setIsConfigLoading(false);
    }
  }, []);

  useEffect(() => {
    if (activeTab === 'sources') fetchSources();
    if (activeTab === 'settings') fetchConfig();
  }, [activeTab, fetchSources, fetchConfig]);

  // ─── Modal Handlers ───────────────────────────────────────

  const openModal = (post: Post) => {
    setSelectedPost(post);
    setEditedText(post.rewrittenText || post.originalText || '');
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

  // ─── Post Actions ─────────────────────────────────────────

  const handleScrape = async () => {
    if (!scrapeUrl) {
      alert("Vui lòng nhập URL Facebook!");
      return;
    }
    setIsScraping(true);
    try {
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
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : String(err);
      alert("Không thể kết nối tới Python Backend (localhost:8000): " + message);
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
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : String(err);
      alert("Lỗi Server: " + message);
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
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : String(err);
      alert("Lỗi Server: " + message);
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
          rewrittenText: editedText
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
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : String(err);
      alert(`Lỗi Server: ${message}`);
    } finally {
      setIsLoading(false);
    }
  };

  const handleAutoQueue = async () => {
    if (!selectedPost) return;

    setIsLoading(true);
    try {
      const res = await fetch('/api/auto-queue', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          postId: selectedPost.id,
          rewrittenText: editedText
        })
      });

      const data = await res.json();

      if (data.success) {
        const scheduledAt = data.scheduledAt;
        const formattedTime = new Date(scheduledAt).toLocaleString('vi-VN');
        alert(`Đã xếp vào hàng chờ! Sẽ đăng lúc: ${formattedTime}`);
        setPosts(posts.map(p => p.id === selectedPost.id ? {
          ...p,
          status: 'SCHEDULED',
          scheduledAt: scheduledAt,
          rewrittenText: editedText,
        } : p));
        closeModal();
      } else {
        alert(`Lỗi: ${data.error || data.detail}`);
      }
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : String(err);
      alert(`Lỗi Server: ${message}`);
    } finally {
      setIsLoading(false);
    }
  };

  // ─── Source Actions ────────────────────────────────────────

  const handleAddSource = async () => {
    if (!newSourceUrl || !newSourceName) {
      alert("Vui lòng nhập URL và tên nguồn!");
      return;
    }
    setIsSourcesLoading(true);
    try {
      const res = await fetch('/api/sources', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          url: newSourceUrl,
          name: newSourceName,
          interval: newSourceInterval,
        })
      });
      const data = await res.json();
      if (data.success) {
        setSources([data.source, ...sources]);
        setNewSourceUrl('');
        setNewSourceName('');
        setNewSourceInterval(30);
      } else {
        alert("Lỗi: " + (data.detail || data.error));
      }
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : String(err);
      alert("Lỗi: " + message);
    } finally {
      setIsSourcesLoading(false);
    }
  };

  const handleToggleSource = async (source: SourcePage) => {
    try {
      const res = await fetch(`/api/sources/${source.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ isActive: !source.isActive })
      });
      const data = await res.json();
      if (data.success) {
        setSources(sources.map(s => s.id === source.id ? { ...s, isActive: !s.isActive } : s));
      }
    } catch (err) {
      console.error('Toggle source failed:', err);
    }
  };

  const handleDeleteSource = async (sourceId: number) => {
    if (!confirm("Xóa nguồn này?")) return;
    try {
      const res = await fetch(`/api/sources/${sourceId}`, { method: 'DELETE' });
      const data = await res.json();
      if (data.success) {
        setSources(sources.filter(s => s.id !== sourceId));
      }
    } catch (err) {
      console.error('Delete source failed:', err);
    }
  };

  // ─── Config Actions ────────────────────────────────────────

  const handleToggleConfig = async (key: keyof AutoConfig) => {
    const newValue = !config[key];
    setConfig({ ...config, [key]: newValue });
    try {
      const res = await fetch('/api/auto-config', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ [key]: newValue })
      });
      const data = await res.json();
      if (data.success) {
        setConfig(data.config);
        setSchedulerRunning(data.scheduler?.running ?? false);
      }
    } catch (err) {
      console.error('Toggle config failed:', err);
      setConfig({ ...config, [key]: !newValue }); // Revert
    }
  };

  const handleUpdateInterval = async (key: 'postIntervalMin' | 'scrapeIntervalMin', value: number) => {
    setConfig({ ...config, [key]: value });
    try {
      await fetch('/api/auto-config', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ [key]: value })
      });
    } catch (err) {
      console.error('Update interval failed:', err);
    }
  };

  // ─── Tab Config ─────────────────────────────────────────────

  const tabs: { key: TabKey; label: string; icon: React.ReactNode; count?: number }[] = [
    { key: 'pending', label: 'Hàng đợi', icon: <List className="w-4 h-4" />, count: pendingPosts.length },
    { key: 'scheduled', label: 'Lịch phát', icon: <LayoutGrid className="w-4 h-4" />, count: scheduledPosts.length },
    { key: 'sources', label: 'Nguồn', icon: <Globe className="w-4 h-4" />, count: sources.length },
    { key: 'settings', label: 'Cài đặt', icon: <Settings className="w-4 h-4" /> },
  ];

  // ─── RENDER ────────────────────────────────────────────────

  return (
    <main className="flex-1 flex flex-col min-w-0 bg-white/30 backdrop-blur-2xl shadow-[0_8px_32px_rgba(0,0,0,0.1)] rounded-3xl overflow-hidden border border-white/50 relative">
      {/* Header & Tabs */}
      <header className="flex flex-col xl:flex-row xl:items-center justify-between px-6 py-4 border-b border-white/40 shrink-0 bg-white/40 backdrop-blur-md gap-4">
        <div className="flex items-center">
          <Calendar className="w-5 h-5 mr-3 text-blue-700" />
          <span className="font-bold text-lg text-blue-950">CMS Content Scheduler</span>
          {/* Auto-post status indicator */}
          <div className={`ml-3 flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-bold ${
            config.autoPostOn
              ? 'bg-emerald-100 text-emerald-700 border border-emerald-200'
              : 'bg-zinc-100 text-zinc-500 border border-zinc-200'
          }`}>
            <div className={`w-2 h-2 rounded-full ${config.autoPostOn ? 'bg-emerald-500 animate-pulse' : 'bg-zinc-400'}`} />
            {config.autoPostOn ? 'Auto ON' : 'Auto OFF'}
          </div>
        </div>

        <div className="flex flex-col sm:flex-row gap-4 items-center flex-1 justify-center">
          {/* Tabs */}
          <div className="flex bg-white/50 p-1 rounded-xl shadow-sm border border-white/60">
            {tabs.map(tab => (
              <button
                key={tab.key}
                onClick={() => setActiveTab(tab.key)}
                className={`flex items-center gap-1.5 px-3 py-2 rounded-lg text-sm font-bold transition-all ${
                  activeTab === tab.key
                    ? 'bg-white text-blue-700 shadow-sm'
                    : 'text-blue-900/60 hover:text-blue-800'
                }`}
              >
                {tab.icon}
                <span className="hidden sm:inline">{tab.label}</span>
                {tab.count !== undefined && (
                  <span className={`ml-1 px-1.5 py-0.5 text-xs rounded-md ${
                    activeTab === tab.key ? 'bg-blue-100 text-blue-700' : 'bg-white/50 text-blue-900/40'
                  }`}>
                    {tab.count}
                  </span>
                )}
              </button>
            ))}
          </div>

          {/* Scraper Input — only show on pending tab */}
          {activeTab === 'pending' && (
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
          )}
        </div>

        <a href="/" className="text-sm font-medium text-blue-900/70 hover:text-blue-900 transition-colors hidden xl:block">
          &larr; Exit
        </a>
      </header>

      {/* Scrollable Content Area */}
      <div className="flex-1 min-h-0 overflow-y-auto p-6 bg-transparent scrollbar-thin scrollbar-thumb-white/30">

        {/* ──── TAB: PENDING ──── */}
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

        {/* ──── TAB: SCHEDULED ──── */}
        {activeTab === 'scheduled' && (
          <div className="max-w-5xl mx-auto grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="space-y-4">
              <h2 className="font-bold text-white text-xl drop-shadow-sm flex items-center gap-2">
                <Clock className="w-5 h-5" /> Đã Lên Lịch (Scheduled)
              </h2>
              {scheduledPosts.filter(p => p.status === 'SCHEDULED').length === 0 && (
                <p className="text-white/60 text-sm">Chưa có bài nào được lên lịch.</p>
              )}
              {scheduledPosts.filter(p => p.status === 'SCHEDULED').map(post => (
                <div key={post.id} className="bg-white/60 backdrop-blur-xl p-5 rounded-2xl border border-white/80 shadow-sm">
                  <div className="flex justify-between items-start mb-2">
                    <span className="px-2.5 py-0.5 bg-yellow-100 text-yellow-800 text-xs font-bold rounded-md">SCHEDULED</span>
                    <span className="text-xs font-bold text-blue-900">{post.scheduledAt ? new Date(post.scheduledAt).toLocaleString() : ''}</span>
                  </div>
                  <p className="text-sm text-zinc-800 font-medium line-clamp-3 mb-3">{post.rewrittenText}</p>
                  <p className="text-xs text-blue-900/60 font-mono">FB ID: {post.fbPostId || 'auto-queue'}</p>
                </div>
              ))}
            </div>

            <div className="space-y-4">
              <h2 className="font-bold text-white text-xl drop-shadow-sm flex items-center gap-2">
                <CheckCircle2 className="w-5 h-5" /> Đã Đăng (Posted)
              </h2>
              {scheduledPosts.filter(p => p.status === 'POSTED').length === 0 && scheduledPosts.filter(p => p.status === 'FAILED').length === 0 && (
                <p className="text-white/60 text-sm">Chưa có bài nào được đăng.</p>
              )}
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

        {/* ──── TAB: SOURCES ──── */}
        {activeTab === 'sources' && (
          <div className="max-w-4xl mx-auto space-y-6">
            {/* Add New Source */}
            <div className="bg-white/60 backdrop-blur-xl p-6 rounded-2xl border border-white/80 shadow-sm">
              <h2 className="font-bold text-blue-950 text-lg mb-4 flex items-center gap-2">
                <Plus className="w-5 h-5 text-blue-600" /> Thêm nguồn mới
              </h2>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
                <input
                  type="text"
                  placeholder="URL Facebook..."
                  value={newSourceUrl}
                  onChange={(e) => setNewSourceUrl(e.target.value)}
                  className="px-4 py-2.5 bg-white/70 border border-white/50 rounded-xl text-sm font-medium outline-none focus:ring-2 focus:ring-blue-500/30 text-blue-900 placeholder:text-blue-900/40"
                />
                <input
                  type="text"
                  placeholder="Tên hiển thị..."
                  value={newSourceName}
                  onChange={(e) => setNewSourceName(e.target.value)}
                  className="px-4 py-2.5 bg-white/70 border border-white/50 rounded-xl text-sm font-medium outline-none focus:ring-2 focus:ring-blue-500/30 text-blue-900 placeholder:text-blue-900/40"
                />
                <div className="flex items-center gap-2">
                  <input
                    type="number"
                    placeholder="Interval (phút)"
                    value={newSourceInterval}
                    onChange={(e) => setNewSourceInterval(parseInt(e.target.value) || 30)}
                    min={5}
                    className="px-4 py-2.5 bg-white/70 border border-white/50 rounded-xl text-sm font-medium outline-none focus:ring-2 focus:ring-blue-500/30 text-blue-900 w-full"
                  />
                  <span className="text-xs text-blue-900/60 font-medium whitespace-nowrap">phút</span>
                </div>
                <button
                  onClick={handleAddSource}
                  disabled={isSourcesLoading}
                  className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-2.5 rounded-xl text-sm font-bold shadow-sm transition-all disabled:opacity-50 flex items-center justify-center gap-2"
                >
                  {isSourcesLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Plus className="w-4 h-4" />}
                  Thêm
                </button>
              </div>
            </div>

            {/* Sources List */}
            <div className="space-y-3">
              {sources.length === 0 ? (
                <div className="text-center py-16 text-white">
                  <Globe className="w-14 h-14 mx-auto mb-3 text-white/40" />
                  <p className="text-lg font-medium drop-shadow-sm">Chưa có nguồn nào.</p>
                  <p className="text-sm text-white/60 mt-1">Thêm URL Facebook để bắt đầu auto-scrape.</p>
                </div>
              ) : (
                sources.map((source) => (
                  <div
                    key={source.id}
                    className={`backdrop-blur-xl p-5 rounded-2xl border shadow-sm flex items-center gap-4 transition-all ${
                      source.isActive
                        ? 'bg-white/60 border-white/80'
                        : 'bg-white/20 border-white/30 opacity-60'
                    }`}
                  >
                    <div className={`w-10 h-10 rounded-full flex items-center justify-center shrink-0 shadow-sm border ${
                      source.isActive
                        ? 'bg-emerald-100 border-emerald-200'
                        : 'bg-zinc-100 border-zinc-200'
                    }`}>
                      <Globe className={`w-5 h-5 ${source.isActive ? 'text-emerald-600' : 'text-zinc-400'}`} />
                    </div>

                    <div className="flex-1 min-w-0">
                      <h3 className="font-bold text-blue-950 text-sm">{source.name}</h3>
                      <p className="text-xs text-blue-900/60 truncate font-mono">{source.url}</p>
                      <div className="flex items-center gap-3 mt-1">
                        <span className="text-xs text-blue-900/50">
                          <Timer className="w-3 h-3 inline mr-1" />
                          Mỗi {source.interval} phút
                        </span>
                        {source.lastScraped && (
                          <span className="text-xs text-blue-900/50">
                            Lần cuối: {new Date(source.lastScraped).toLocaleString('vi-VN')}
                          </span>
                        )}
                      </div>
                    </div>

                    <div className="flex items-center gap-2 shrink-0">
                      <button
                        onClick={() => handleToggleSource(source)}
                        className="p-2 rounded-lg hover:bg-white/50 transition-colors"
                        title={source.isActive ? 'Tắt nguồn' : 'Bật nguồn'}
                      >
                        {source.isActive
                          ? <ToggleRight className="w-6 h-6 text-emerald-600" />
                          : <ToggleLeft className="w-6 h-6 text-zinc-400" />
                        }
                      </button>
                      <button
                        onClick={() => handleDeleteSource(source.id)}
                        className="p-2 rounded-lg hover:bg-red-50 transition-colors"
                        title="Xóa nguồn"
                      >
                        <Trash2 className="w-4 h-4 text-red-500" />
                      </button>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
        )}

        {/* ──── TAB: SETTINGS ──── */}
        {activeTab === 'settings' && (
          <div className="max-w-3xl mx-auto space-y-6">
            {/* Scheduler Status */}
            <div className="bg-white/60 backdrop-blur-xl p-6 rounded-2xl border border-white/80 shadow-sm">
              <div className="flex items-center justify-between mb-4">
                <h2 className="font-bold text-blue-950 text-lg flex items-center gap-2">
                  <Power className="w-5 h-5 text-blue-600" /> Trạng thái Scheduler
                </h2>
                <button
                  onClick={fetchConfig}
                  disabled={isConfigLoading}
                  className="p-2 rounded-lg hover:bg-white/50 transition-colors"
                  title="Refresh"
                >
                  <RefreshCw className={`w-4 h-4 text-blue-600 ${isConfigLoading ? 'animate-spin' : ''}`} />
                </button>
              </div>
              <div className={`inline-flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-bold ${
                schedulerRunning
                  ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                  : 'bg-red-50 text-red-600 border border-red-200'
              }`}>
                <div className={`w-2.5 h-2.5 rounded-full ${schedulerRunning ? 'bg-emerald-500 animate-pulse' : 'bg-red-400'}`} />
                {schedulerRunning ? 'Scheduler đang chạy' : 'Scheduler chưa chạy (Start FastAPI backend)'}
              </div>
            </div>

            {/* Auto Scrape */}
            <div className="bg-white/60 backdrop-blur-xl p-6 rounded-2xl border border-white/80 shadow-sm">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="font-bold text-blue-950 text-base flex items-center gap-2">
                    <Zap className="w-5 h-5 text-amber-500" /> Auto Scrape
                  </h3>
                  <p className="text-sm text-blue-900/60 mt-1">Tự động cào bài từ các nguồn đã cấu hình, AI viết lại và đưa vào hàng đợi duyệt.</p>
                </div>
                <button
                  onClick={() => handleToggleConfig('autoScrapeOn')}
                  className="shrink-0"
                >
                  {config.autoScrapeOn
                    ? <ToggleRight className="w-10 h-10 text-emerald-600" />
                    : <ToggleLeft className="w-10 h-10 text-zinc-400" />
                  }
                </button>
              </div>
              {config.autoScrapeOn && (
                <div className="mt-4 pt-4 border-t border-white/40">
                  <label className="text-xs font-bold text-blue-900/60 uppercase tracking-wider">Kiểm tra nguồn mới mỗi</label>
                  <div className="flex items-center gap-3 mt-2">
                    <input
                      type="number"
                      value={config.scrapeIntervalMin}
                      onChange={(e) => handleUpdateInterval('scrapeIntervalMin', parseInt(e.target.value) || 30)}
                      min={5}
                      className="w-24 px-4 py-2.5 bg-white/70 border border-white/50 rounded-xl text-sm font-bold text-blue-900 outline-none focus:ring-2 focus:ring-blue-500/30"
                    />
                    <span className="text-sm text-blue-900/60 font-medium">phút</span>
                  </div>
                </div>
              )}
            </div>

            {/* Auto Post */}
            <div className="bg-white/60 backdrop-blur-xl p-6 rounded-2xl border border-white/80 shadow-sm">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="font-bold text-blue-950 text-base flex items-center gap-2">
                    <Send className="w-5 h-5 text-blue-600" /> Auto Post
                  </h3>
                  <p className="text-sm text-blue-900/60 mt-1">Tự động đăng bài đã duyệt lên Facebook khi đến giờ (status SCHEDULED + scheduledAt &le; now).</p>
                </div>
                <button
                  onClick={() => handleToggleConfig('autoPostOn')}
                  className="shrink-0"
                >
                  {config.autoPostOn
                    ? <ToggleRight className="w-10 h-10 text-emerald-600" />
                    : <ToggleLeft className="w-10 h-10 text-zinc-400" />
                  }
                </button>
              </div>
              {config.autoPostOn && (
                <div className="mt-4 pt-4 border-t border-white/40">
                  <label className="text-xs font-bold text-blue-900/60 uppercase tracking-wider">Khoảng cách giữa các bài auto-queue</label>
                  <div className="flex items-center gap-3 mt-2">
                    <input
                      type="number"
                      value={config.postIntervalMin}
                      onChange={(e) => handleUpdateInterval('postIntervalMin', parseInt(e.target.value) || 120)}
                      min={10}
                      className="w-24 px-4 py-2.5 bg-white/70 border border-white/50 rounded-xl text-sm font-bold text-blue-900 outline-none focus:ring-2 focus:ring-blue-500/30"
                    />
                    <span className="text-sm text-blue-900/60 font-medium">phút (giữa mỗi bài)</span>
                  </div>
                </div>
              )}
            </div>

            {/* Info */}
            <div className="bg-blue-50/80 backdrop-blur-xl p-5 rounded-2xl border border-blue-200/60">
              <h4 className="font-bold text-blue-800 text-sm mb-2">💡 Cách hoạt động</h4>
              <ul className="text-sm text-blue-700 space-y-1.5 font-medium">
                <li>1. <strong>Thêm nguồn</strong> ở tab "Nguồn" — là các trang Facebook bạn muốn cào.</li>
                <li>2. <strong>Bật Auto Scrape</strong> — hệ thống tự cào bài, AI viết lại, đưa vào hàng đợi.</li>
                <li>3. <strong>Duyệt bài</strong> ở tab "Hàng đợi" — sửa nội dung nếu cần.</li>
                <li>4. Bấm <strong>"Auto Queue"</strong> để tự xếp lịch, hoặc chọn giờ thủ công.</li>
                <li>5. <strong>Bật Auto Post</strong> — hệ thống tự đăng khi đến giờ.</li>
              </ul>
            </div>
          </div>
        )}
      </div>

      {/* ──── EDITOR MODAL OVERLAY ──── */}
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
                  Bỏ trống giờ nếu muốn dùng Auto Queue.
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

                {/* NEW: Auto Queue Button */}
                <button
                  onClick={handleAutoQueue}
                  disabled={isLoading}
                  className="flex items-center justify-center gap-2 px-5 py-2.5 bg-amber-50 hover:bg-amber-100 text-amber-700 font-bold rounded-xl transition-colors border border-amber-200"
                  title="Tự động xếp vào slot tiếp theo"
                >
                  {isLoading ? (
                    <Loader2 className="w-4 h-4 animate-spin" />
                  ) : (
                    <Zap className="w-4 h-4" />
                  )}
                  <span className="hidden sm:inline">Auto Queue</span>
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

'use client';

import { useState, useEffect, useCallback } from 'react';
import {
  Calendar, Clock, Send, FileText, CheckCircle2, LayoutGrid, List, X,
  Trash2, Save, Globe, Settings, Plus, ToggleLeft, ToggleRight,
  Zap, Loader2, RefreshCw, Power, Timer, Cpu, Terminal
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

const formatDate = (dateStr: string | null | undefined, locale = 'vi-VN') => {
  if (!dateStr) return 'UNKNOWN';
  const d = new Date(dateStr);
  return isNaN(d.getTime()) ? 'INVALID_DATE' : d.toLocaleString(locale);
};

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
        const formattedTime = formatDate(scheduledAt);
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
    { key: 'pending', label: 'SYS.QUEUE', icon: <List className="w-4 h-4" />, count: pendingPosts.length },
    { key: 'scheduled', label: 'CRON.JOBS', icon: <Terminal className="w-4 h-4" />, count: scheduledPosts.length },
    { key: 'sources', label: 'DATA.LINKS', icon: <Globe className="w-4 h-4" />, count: sources.length },
    { key: 'settings', label: 'CFG.CORE', icon: <Cpu className="w-4 h-4" /> },
  ];

  // ─── RENDER ────────────────────────────────────────────────

  return (
    <main className="flex-1 flex flex-col min-w-0 bg-zinc-950 bg-[linear-gradient(to_right,#00f3ff10_1px,transparent_1px),linear-gradient(to_bottom,#00f3ff10_1px,transparent_1px)] bg-[size:32px_32px] overflow-hidden border border-[#00f3ff]/30 relative rounded-3xl font-mono text-zinc-300">
      
      {/* ─── CYBERPUNK DECORATIONS ─── */}
      <div className="absolute top-0 left-0 w-32 h-1 bg-[#00f3ff] shadow-[0_0_10px_#00f3ff]" />
      <div className="absolute bottom-0 right-0 w-32 h-1 bg-[#ff00ff] shadow-[0_0_10px_#ff00ff]" />
      <div className="absolute top-0 right-0 w-1 h-32 bg-[#fce205] shadow-[0_0_10px_#fce205]" />

      {/* Header & Tabs */}
      <header className="flex flex-col xl:flex-row xl:items-center justify-between px-6 py-4 border-b border-[#00f3ff]/40 shrink-0 bg-black/60 backdrop-blur-xl gap-4 relative z-10">
        <div className="flex items-center">
          <Terminal className="w-6 h-6 mr-3 text-[#00f3ff]" />
          <span className="font-bold text-lg text-[#00f3ff] tracking-widest uppercase text-shadow-[0_0_5px_#00f3ff]">NET_SCHEDULER v2.0</span>
          {/* Auto-post status indicator */}
          <div className={`ml-4 flex items-center gap-2 px-3 py-1 text-xs font-bold uppercase tracking-wider border-l-[3px] ${
            config.autoPostOn
              ? 'bg-[#00f3ff]/10 text-[#00f3ff] border-[#00f3ff]'
              : 'bg-zinc-900/50 text-zinc-500 border-zinc-700'
          }`}>
            <div className={`w-2 h-2 rounded-none ${config.autoPostOn ? 'bg-[#00f3ff] animate-pulse shadow-[0_0_8px_#00f3ff]' : 'bg-zinc-600'}`} />
            AUTO:{config.autoPostOn ? 'ONLINE' : 'OFFLINE'}
          </div>
        </div>

        <div className="flex flex-col sm:flex-row gap-4 items-center flex-1 justify-center">
          {/* Tabs */}
          <div className="flex bg-black border border-zinc-800 p-1">
            {tabs.map(tab => (
              <button
                key={tab.key}
                onClick={() => setActiveTab(tab.key)}
                className={`flex items-center gap-2 px-4 py-2 text-sm font-bold uppercase transition-all border-b-2 ${
                  activeTab === tab.key
                    ? 'bg-[#00f3ff]/10 text-[#00f3ff] border-[#00f3ff] shadow-[inset_0_-4px_10px_rgba(0,243,255,0.2)]'
                    : 'text-zinc-500 border-transparent hover:text-zinc-300'
                }`}
              >
                {tab.icon}
                <span className="hidden sm:inline tracking-wider">{tab.label}</span>
                {tab.count !== undefined && (
                  <span className={`ml-1 px-1.5 py-0.5 text-[10px] ${
                    activeTab === tab.key ? 'bg-[#00f3ff] text-black' : 'bg-zinc-800 text-zinc-400'
                  }`}>
                    {tab.count.toString().padStart(2, '0')}
                  </span>
                )}
              </button>
            ))}
          </div>

          {/* Scraper Input — only show on pending tab */}
          {activeTab === 'pending' && (
            <div className="flex bg-black/80 border border-[#ff00ff]/50 shadow-[0_0_10px_rgba(255,0,255,0.1)] focus-within:shadow-[0_0_15px_rgba(255,0,255,0.4)] transition-all">
              <input
                type="text"
                placeholder="INPUT DATA_SOURCE_URL..."
                value={scrapeUrl}
                onChange={(e) => setScrapeUrl(e.target.value)}
                className="px-4 py-2 bg-transparent text-sm font-medium outline-none text-[#ff00ff] placeholder:text-[#ff00ff]/30 w-full sm:w-64"
              />
              <button
                onClick={handleScrape}
                disabled={isScraping}
                className="bg-[#ff00ff]/20 hover:bg-[#ff00ff] text-[#ff00ff] hover:text-black border-l border-[#ff00ff]/50 px-4 py-2 text-sm font-bold transition-all disabled:opacity-50 flex items-center gap-2 uppercase tracking-wider"
              >
                {isScraping ? <div className="w-4 h-4 border-2 border-black/30 border-t-black rounded-none animate-spin" /> : "EXECUTE"}
              </button>
            </div>
          )}
        </div>

        <a href="/" className="text-sm font-bold text-zinc-500 hover:text-[#fce205] transition-colors hidden xl:flex items-center gap-1 uppercase tracking-wider">
          <Power className="w-4 h-4" /> Exit_Sys
        </a>
      </header>

      {/* Scrollable Content Area */}
      <div className="flex-1 min-h-0 overflow-y-auto p-6 bg-transparent scrollbar-thin scrollbar-thumb-[#00f3ff]/30 scrollbar-track-transparent">

        {/* ──── TAB: PENDING ──── */}
        {activeTab === 'pending' && (
          <div className="max-w-5xl mx-auto space-y-4">
            {pendingPosts.length === 0 ? (
              <div className="text-center py-20 text-zinc-500 border border-zinc-800 bg-black/40">
                <Terminal className="w-16 h-16 mx-auto mb-4 text-zinc-700" />
                <p className="text-lg font-medium tracking-widest uppercase">SYS.QUEUE_EMPTY</p>
                <div className="mt-2 w-32 h-1 bg-zinc-800 mx-auto" />
              </div>
            ) : (
              pendingPosts.map((post) => (
                <div
                  key={post.id}
                  onClick={() => openModal(post)}
                  className="bg-black/60 p-5 border border-zinc-700 hover:border-[#00f3ff] hover:shadow-[0_0_15px_rgba(0,243,255,0.2)] flex items-start gap-4 cursor-pointer transition-all group relative overflow-hidden"
                >
                  <div className="absolute top-0 left-0 w-1 h-full bg-zinc-700 group-hover:bg-[#00f3ff]" />
                  <div className="w-10 h-10 bg-zinc-900 flex items-center justify-center shrink-0 border border-zinc-700 group-hover:border-[#00f3ff]/50 group-hover:bg-[#00f3ff]/10 transition-colors">
                    <FileText className="w-5 h-5 text-zinc-400 group-hover:text-[#00f3ff]" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-3 mb-2">
                      <span className="px-2 py-0.5 bg-[#fce205]/10 text-[#fce205] border border-[#fce205]/30 text-[10px] font-bold tracking-widest">
                        [{post.status}]
                      </span>
                      <span className="text-[10px] text-zinc-500 tracking-wider">SRC_ID: {post.sourcePostId}</span>
                      <span className="text-[10px] text-zinc-500 tracking-wider">TS: {formatDate(post.createdAt)}</span>
                    </div>
                    <h3 className="text-zinc-300 font-medium text-sm leading-relaxed group-hover:text-white">
                      {post.originalText.substring(0, 150)}...
                    </h3>
                  </div>
                  <div className="shrink-0 pl-4 text-[#00f3ff] font-bold text-xs uppercase tracking-widest opacity-0 group-hover:opacity-100 transition-opacity flex items-center gap-1">
                    <Zap className="w-3 h-3" /> ANALYZE
                  </div>
                </div>
              ))
            )}
          </div>
        )}

        {/* ──── TAB: SCHEDULED ──── */}
        {activeTab === 'scheduled' && (
          <div className="max-w-6xl mx-auto grid grid-cols-1 lg:grid-cols-2 gap-8">
            <div className="space-y-4 relative">
              <div className="absolute top-0 -left-4 w-1 h-full bg-[#fce205]/20 hidden lg:block" />
              <h2 className="font-bold text-[#fce205] text-lg uppercase tracking-widest flex items-center gap-2 mb-6">
                <Clock className="w-5 h-5" /> MEMORY.SCHEDULED
              </h2>
              {scheduledPosts.filter(p => p.status === 'SCHEDULED').length === 0 && (
                <p className="text-zinc-600 text-sm italic">NO_PROCESSES_FOUND</p>
              )}
              {scheduledPosts.filter(p => p.status === 'SCHEDULED').map(post => (
                <div key={post.id} className="bg-black/60 p-5 border border-[#fce205]/30 shadow-[0_0_10px_rgba(252,226,5,0.05)] relative overflow-hidden group">
                  <div className="absolute top-0 left-0 w-full h-0.5 bg-[#fce205]" />
                  <div className="flex justify-between items-start mb-3">
                    <span className="px-2 py-0.5 bg-[#fce205]/20 text-[#fce205] text-[10px] font-bold tracking-widest border border-[#fce205]/40">PENDING_EXEC</span>
                    <span className="text-xs text-[#00f3ff] bg-[#00f3ff]/10 px-2 py-1 border border-[#00f3ff]/20">
                      T-{post.scheduledAt ? formatDate(post.scheduledAt, 'en-GB') : 'UNKNOWN'}
                    </span>
                  </div>
                  <p className="text-sm text-zinc-300 line-clamp-3 mb-3">{post.rewrittenText}</p>
                  <p className="text-[10px] text-zinc-600">TRG_ID: {post.fbPostId || 'AWAITING_ALLOCATION'}</p>
                </div>
              ))}
            </div>

            <div className="space-y-4 relative">
              <div className="absolute top-0 -left-4 w-1 h-full bg-[#00f3ff]/20 hidden lg:block" />
              <h2 className="font-bold text-[#00f3ff] text-lg uppercase tracking-widest flex items-center gap-2 mb-6">
                <CheckCircle2 className="w-5 h-5" /> MEMORY.POSTED
              </h2>
              {scheduledPosts.filter(p => p.status === 'POSTED').length === 0 && scheduledPosts.filter(p => p.status === 'FAILED').length === 0 && (
                <p className="text-zinc-600 text-sm italic">NO_LOGS_FOUND</p>
              )}
              {scheduledPosts.filter(p => p.status === 'POSTED').map(post => (
                <div key={post.id} className="bg-black/40 p-4 border border-[#00f3ff]/20 opacity-70">
                  <span className="text-[10px] text-[#00f3ff] mb-2 block tracking-widest">SUCCESS_OK</span>
                  <p className="text-xs text-zinc-400 line-clamp-2">{post.rewrittenText}</p>
                </div>
              ))}
              {scheduledPosts.filter(p => p.status === 'FAILED').map(post => (
                <div key={post.id} className="bg-[#ff0000]/10 p-4 border border-[#ff0000]/40 shadow-[0_0_10px_rgba(255,0,0,0.1)]">
                  <span className="text-[10px] text-[#ff0000] font-bold mb-2 block tracking-widest animate-pulse">ERR_FATAL</span>
                  <p className="text-xs text-[#ff0000]/80 line-clamp-2">{post.rewrittenText}</p>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* ──── TAB: SOURCES ──── */}
        {activeTab === 'sources' && (
          <div className="max-w-4xl mx-auto space-y-8">
            {/* Add New Source */}
            <div className="bg-black/80 p-6 border border-[#ff00ff]/40 shadow-[0_0_15px_rgba(255,0,255,0.05)] relative">
              <div className="absolute top-0 left-0 w-3 h-3 border-t-2 border-l-2 border-[#ff00ff]" />
              <div className="absolute bottom-0 right-0 w-3 h-3 border-b-2 border-r-2 border-[#ff00ff]" />
              
              <h2 className="font-bold text-[#ff00ff] text-sm uppercase tracking-widest mb-5 flex items-center gap-2">
                <Plus className="w-4 h-4" /> INIT_NEW_DATA_NODE
              </h2>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                <input
                  type="text"
                  placeholder="URL..."
                  value={newSourceUrl}
                  onChange={(e) => setNewSourceUrl(e.target.value)}
                  className="px-4 py-2 bg-black border border-zinc-700 focus:border-[#ff00ff] text-sm text-zinc-200 outline-none transition-colors placeholder:text-zinc-700"
                />
                <input
                  type="text"
                  placeholder="IDENTIFIER..."
                  value={newSourceName}
                  onChange={(e) => setNewSourceName(e.target.value)}
                  className="px-4 py-2 bg-black border border-zinc-700 focus:border-[#ff00ff] text-sm text-zinc-200 outline-none transition-colors placeholder:text-zinc-700"
                />
                <div className="flex items-center gap-2 bg-black border border-zinc-700 focus-within:border-[#ff00ff] px-4 py-2 transition-colors">
                  <input
                    type="number"
                    value={newSourceInterval}
                    onChange={(e) => setNewSourceInterval(parseInt(e.target.value) || 30)}
                    min={5}
                    className="bg-transparent text-sm outline-none text-zinc-200 w-full"
                  />
                  <span className="text-[10px] text-[#ff00ff] uppercase">MINS</span>
                </div>
                <button
                  onClick={handleAddSource}
                  disabled={isSourcesLoading}
                  className="bg-[#ff00ff]/20 hover:bg-[#ff00ff] text-[#ff00ff] hover:text-black border border-[#ff00ff] px-4 py-2 text-sm font-bold transition-all disabled:opacity-50 uppercase tracking-wider flex items-center justify-center gap-2"
                >
                  {isSourcesLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : "MOUNT_NODE"}
                </button>
              </div>
            </div>

            {/* Sources List */}
            <div className="space-y-4">
              <h3 className="text-zinc-500 text-xs uppercase tracking-widest mb-2">ACTIVE_NODES</h3>
              {sources.length === 0 ? (
                <div className="text-center py-16 border border-zinc-800 bg-black/40 text-zinc-600 uppercase tracking-widest text-sm">
                  NO_NODES_MOUNTED
                </div>
              ) : (
                sources.map((source) => (
                  <div
                    key={source.id}
                    className={`p-4 flex items-center gap-4 transition-all border-l-4 ${
                      source.isActive
                        ? 'bg-black/80 border-t border-r border-b border-zinc-800 border-l-[#00f3ff] shadow-[inset_4px_0_10px_rgba(0,243,255,0.1)]'
                        : 'bg-black/40 border border-zinc-800 border-l-zinc-700 opacity-50'
                    }`}
                  >
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-3 mb-1">
                        <h3 className={`font-bold text-sm tracking-wider uppercase ${source.isActive ? 'text-[#00f3ff]' : 'text-zinc-500'}`}>
                          {source.name}
                        </h3>
                        <span className="text-[10px] text-zinc-600 bg-zinc-900 px-1.5 py-0.5 border border-zinc-800">
                          ID:0x{source.id.toString(16).padStart(4, '0').toUpperCase()}
                        </span>
                      </div>
                      <p className="text-[10px] text-zinc-500 truncate mb-2">{source.url}</p>
                      <div className="flex items-center gap-4">
                        <span className="text-[10px] text-zinc-400 bg-black border border-zinc-800 px-2 py-0.5">
                          FREQ: {source.interval}M
                        </span>
                        {source.lastScraped && (
                          <span className="text-[10px] text-[#fce205]/70">
                            LST_SYNC: {formatDate(source.lastScraped)}
                          </span>
                        )}
                      </div>
                    </div>

                    <div className="flex items-center gap-3 shrink-0">
                      <button
                        onClick={() => handleToggleSource(source)}
                        className={`text-xs uppercase font-bold tracking-widest px-3 py-1.5 border ${
                          source.isActive 
                            ? 'text-black bg-[#00f3ff] border-[#00f3ff]' 
                            : 'text-zinc-500 border-zinc-700 hover:text-white'
                        }`}
                      >
                        {source.isActive ? 'ONLINE' : 'OFFLINE'}
                      </button>
                      <button
                        onClick={() => handleDeleteSource(source.id)}
                        className="p-1.5 border border-zinc-800 hover:border-[#ff0000] hover:bg-[#ff0000]/10 text-zinc-600 hover:text-[#ff0000] transition-colors"
                        title="UNMOUNT"
                      >
                        <Trash2 className="w-4 h-4" />
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
          <div className="max-w-4xl mx-auto space-y-8">
            {/* Scheduler Status */}
            <div className="bg-black/80 p-6 border border-zinc-800 relative">
              <div className="flex items-center justify-between mb-4">
                <h2 className="font-bold text-zinc-300 text-sm uppercase tracking-widest flex items-center gap-2">
                  <Cpu className="w-4 h-4 text-zinc-500" /> SYS.DAEMON_STATUS
                </h2>
                <button onClick={fetchConfig} disabled={isConfigLoading} className="text-zinc-500 hover:text-[#00f3ff] transition-colors">
                  <RefreshCw className={`w-4 h-4 ${isConfigLoading ? 'animate-spin' : ''}`} />
                </button>
              </div>
              <div className={`inline-flex items-center gap-3 px-4 py-2 border text-xs font-bold uppercase tracking-widest ${
                schedulerRunning
                  ? 'bg-[#00f3ff]/10 text-[#00f3ff] border-[#00f3ff] shadow-[0_0_15px_rgba(0,243,255,0.2)]'
                  : 'bg-[#ff0000]/10 text-[#ff0000] border-[#ff0000]'
              }`}>
                <div className={`w-2 h-2 rounded-none ${schedulerRunning ? 'bg-[#00f3ff] animate-pulse' : 'bg-[#ff0000]'}`} />
                {schedulerRunning ? 'CORE_ACTIVE' : 'CORE_OFFLINE (AWAIT_UVICORN)'}
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
              {/* Auto Scrape */}
              <div className="bg-black/80 p-6 border border-zinc-800 relative group hover:border-[#fce205]/50 transition-colors">
                <div className="absolute top-0 right-0 w-2 h-2 border-t border-r border-[#fce205] opacity-0 group-hover:opacity-100" />
                <div className="flex items-start justify-between mb-4">
                  <div>
                    <h3 className="font-bold text-[#fce205] text-sm uppercase tracking-widest mb-1">AUTO.SCRAPE_PROTOCOL</h3>
                    <p className="text-[10px] text-zinc-500 leading-relaxed">Init cyclic data harvesting from mounted nodes. Triggers AI rewrite pipeline.</p>
                  </div>
                  <button onClick={() => handleToggleConfig('autoScrapeOn')} className="shrink-0 ml-4">
                    {config.autoScrapeOn
                      ? <ToggleRight className="w-10 h-10 text-[#fce205] drop-shadow-[0_0_8px_#fce205]" />
                      : <ToggleLeft className="w-10 h-10 text-zinc-700" />
                    }
                  </button>
                </div>
                {config.autoScrapeOn && (
                  <div className="mt-6 pt-4 border-t border-zinc-800/50">
                    <label className="text-[10px] text-zinc-500 uppercase tracking-widest mb-2 block">CYCLES_DELAY_MINS</label>
                    <input
                      type="number"
                      value={config.scrapeIntervalMin}
                      onChange={(e) => handleUpdateInterval('scrapeIntervalMin', parseInt(e.target.value) || 30)}
                      className="w-full bg-black border border-zinc-700 focus:border-[#fce205] text-[#fce205] px-4 py-2 outline-none text-sm"
                    />
                  </div>
                )}
              </div>

              {/* Auto Post */}
              <div className="bg-black/80 p-6 border border-zinc-800 relative group hover:border-[#ff00ff]/50 transition-colors">
                <div className="absolute top-0 left-0 w-2 h-2 border-t border-l border-[#ff00ff] opacity-0 group-hover:opacity-100" />
                <div className="flex items-start justify-between mb-4">
                  <div>
                    <h3 className="font-bold text-[#ff00ff] text-sm uppercase tracking-widest mb-1">AUTO.PUBLISH_PROTOCOL</h3>
                    <p className="text-[10px] text-zinc-500 leading-relaxed">Auto-commit authorized payloads to external FB_GRAPH API at scheduled ticks.</p>
                  </div>
                  <button onClick={() => handleToggleConfig('autoPostOn')} className="shrink-0 ml-4">
                    {config.autoPostOn
                      ? <ToggleRight className="w-10 h-10 text-[#ff00ff] drop-shadow-[0_0_8px_#ff00ff]" />
                      : <ToggleLeft className="w-10 h-10 text-zinc-700" />
                    }
                  </button>
                </div>
                {config.autoPostOn && (
                  <div className="mt-6 pt-4 border-t border-zinc-800/50">
                    <label className="text-[10px] text-zinc-500 uppercase tracking-widest mb-2 block">QUEUE_THROTTLE_MINS</label>
                    <input
                      type="number"
                      value={config.postIntervalMin}
                      onChange={(e) => handleUpdateInterval('postIntervalMin', parseInt(e.target.value) || 120)}
                      className="w-full bg-black border border-zinc-700 focus:border-[#ff00ff] text-[#ff00ff] px-4 py-2 outline-none text-sm"
                    />
                  </div>
                )}
              </div>
            </div>
          </div>
        )}
      </div>

      {/* ──── EDITOR MODAL OVERLAY ──── */}
      {selectedPost && (
        <div className="absolute inset-0 z-50 bg-black/90 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-black w-full max-w-5xl h-[85vh] border-2 border-[#00f3ff]/60 shadow-[0_0_30px_rgba(0,243,255,0.15)] flex flex-col relative">
            
            {/* Modal Decorators */}
            <div className="absolute top-0 left-0 w-4 h-4 border-t-4 border-l-4 border-[#00f3ff]" />
            <div className="absolute bottom-0 right-0 w-4 h-4 border-b-4 border-r-4 border-[#00f3ff]" />
            
            {/* Modal Header */}
            <div className="flex items-center justify-between px-6 py-3 border-b border-zinc-800 bg-[#00f3ff]/5">
              <div className="flex items-center gap-3">
                <div className="w-2 h-2 bg-[#00f3ff] animate-pulse" />
                <h2 className="font-bold text-sm tracking-widest uppercase text-[#00f3ff]">DATA.INSPECTION [0x{selectedPost.id.toString(16).toUpperCase()}]</h2>
              </div>
              <button onClick={closeModal} className="text-zinc-500 hover:text-white transition-colors">
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="flex-1 overflow-hidden flex flex-col md:flex-row">
              {/* Left: Original */}
              <div className="w-full md:w-5/12 flex flex-col border-b md:border-b-0 md:border-r border-zinc-800 bg-black/50">
                <div className="px-4 py-2 bg-zinc-900 border-b border-zinc-800 text-[10px] uppercase tracking-widest text-zinc-500 flex justify-between">
                  <span>RAW_PAYLOAD</span>
                  <a href={`https://facebook.com/${selectedPost.sourcePostId}`} target="_blank" rel="noreferrer" className="text-[#00f3ff] hover:underline">EXT_LINK ↗</a>
                </div>
                <div className="flex-1 overflow-y-auto p-4 text-xs text-zinc-400 whitespace-pre-wrap leading-relaxed">
                  {selectedPost.originalText}
                </div>
              </div>

              {/* Right: AI Rewritten */}
              <div className="w-full md:w-7/12 flex flex-col bg-zinc-950">
                <div className="px-4 py-2 bg-[#ff00ff]/10 border-b border-[#ff00ff]/30 text-[10px] uppercase tracking-widest text-[#ff00ff]">
                  PROCESSED_PAYLOAD (EDITABLE)
                </div>
                <div className="flex-1 relative">
                  <textarea
                    value={editedText}
                    onChange={e => setEditedText(e.target.value)}
                    className="absolute inset-0 w-full h-full p-6 bg-transparent text-sm text-zinc-200 outline-none resize-none leading-relaxed focus:bg-[#ff00ff]/5 transition-colors"
                    placeholder="Input modified text data..."
                  />
                </div>
              </div>
            </div>

            {/* Modal Actions */}
            <div className="p-4 border-t border-zinc-800 bg-zinc-900/50 flex flex-col sm:flex-row items-center justify-between gap-4">
              <div className="flex items-center gap-3">
                <button
                  onClick={handleSaveDraft}
                  disabled={isLoading}
                  className="bg-transparent border border-zinc-600 hover:border-zinc-400 text-zinc-300 px-4 py-2 text-xs font-bold uppercase tracking-widest transition-colors flex items-center gap-2"
                >
                  <Save className="w-4 h-4" /> COMMIT_SAVE
                </button>
                <button
                  onClick={handleDelete}
                  disabled={isLoading}
                  className="bg-transparent border border-[#ff0000]/50 hover:bg-[#ff0000]/20 text-[#ff0000] px-4 py-2 text-xs font-bold uppercase tracking-widest transition-colors flex items-center gap-2"
                >
                  <Trash2 className="w-4 h-4" /> PURGE
                </button>
              </div>

              <div className="flex items-center gap-3">
                <div className="flex items-center bg-black border border-zinc-700 focus-within:border-[#00f3ff] px-3 py-1.5 transition-colors">
                  <Clock className="w-4 h-4 text-zinc-500 mr-2" />
                  <input
                    type="datetime-local"
                    value={scheduleTime}
                    onChange={(e) => setScheduleTime(e.target.value)}
                    className="bg-transparent text-xs text-zinc-300 outline-none"
                  />
                </div>
                
                <button
                  onClick={handleSchedulePost}
                  disabled={isLoading}
                  className="bg-[#00f3ff]/20 border border-[#00f3ff] hover:bg-[#00f3ff] text-[#00f3ff] hover:text-black px-4 py-2 text-xs font-bold uppercase tracking-widest transition-all shadow-[0_0_10px_rgba(0,243,255,0.2)] disabled:opacity-50"
                >
                  FORCE_SYNC
                </button>
                
                <button
                  onClick={handleAutoQueue}
                  disabled={isLoading || !config.autoPostOn}
                  title={!config.autoPostOn ? 'Bật Auto Post trong Cài đặt trước' : 'Tự động tính toán giờ đăng tiếp theo'}
                  className="bg-[#ff00ff]/20 border border-[#ff00ff] hover:bg-[#ff00ff] text-[#ff00ff] hover:text-black px-4 py-2 text-xs font-bold uppercase tracking-widest transition-all shadow-[0_0_10px_rgba(255,0,255,0.2)] disabled:opacity-50 disabled:grayscale"
                >
                  AUTO_ENQUEUE
                </button>
              </div>
            </div>

            {/* Loading Overlay */}
            {isLoading && (
              <div className="absolute inset-0 bg-black/80 backdrop-blur-sm flex flex-col items-center justify-center z-10 text-[#00f3ff]">
                <div className="w-12 h-12 border-4 border-transparent border-t-[#00f3ff] border-b-[#ff00ff] rounded-full animate-spin mb-4" />
                <span className="text-xs font-bold tracking-widest uppercase">EXECUTING_ROUTINE...</span>
              </div>
            )}
          </div>
        </div>
      )}
    </main>
  );
}

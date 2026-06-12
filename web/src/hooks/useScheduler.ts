import { useState, useEffect, useCallback } from 'react';
import { Post, SourcePage, AutoConfig, TabKey } from '../types/scheduler';
import { schedulerApi } from '@/app/api/schedulerApi';

export function useScheduler(initialPosts: Post[]) {
  const [activeTab, setActiveTab] = useState<TabKey>('pending');
  const [direction, setDirection] = useState(0);
  const [posts, setPosts] = useState<Post[]>(initialPosts);

  const tabKeys: TabKey[] = ['pending', 'scheduled', 'sources', 'settings'];
  const changeTab = (newTab: TabKey) => {
    const oldIndex = tabKeys.indexOf(activeTab);
    const newIndex = tabKeys.indexOf(newTab);
    setDirection(newIndex > oldIndex ? 1 : -1);
    setActiveTab(newTab);
  };

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
      const data = await schedulerApi.fetchSources();
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
      const data = await schedulerApi.fetchConfig();
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
      await schedulerApi.triggerScraper(scrapeUrl);
      alert("Cào thành công! Vui lòng Refresh (F5) trang để xem bài viết mới trong Hàng đợi.");
      setScrapeUrl('');
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : String(err);
      alert("Không thể kết nối tới Python Backend: " + message);
    } finally {
      setIsScraping(false);
    }
  };

  const handleSaveDraft = async () => {
    if (!selectedPost) return;
    setIsLoading(true);
    try {
      const data = await schedulerApi.updatePost(selectedPost.id, editedText);
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
      const data = await schedulerApi.deletePost(selectedPost.id);
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
      const data = await schedulerApi.scheduleFbPost(selectedPost.id, new Date(scheduleTime).toISOString(), editedText);

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
      const data = await schedulerApi.autoQueuePost(selectedPost.id, editedText);

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
      const data = await schedulerApi.addSource(newSourceUrl, newSourceName, newSourceInterval);
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
      const data = await schedulerApi.toggleSource(source.id, !source.isActive);
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
      const data = await schedulerApi.deleteSource(sourceId);
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
      const data = await schedulerApi.updateConfig({ [key]: newValue });
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
      await schedulerApi.updateConfig({ [key]: value });
    } catch (err) {
      console.error('Update interval failed:', err);
    }
  };

  return {
    activeTab,
    direction,
    changeTab,
    
    selectedPost,
    editedText,
    setEditedText,
    scheduleTime,
    setScheduleTime,
    isLoading,
    openModal,
    closeModal,

    scrapeUrl,
    setScrapeUrl,
    isScraping,
    handleScrape,
    
    sources,
    isSourcesLoading,
    newSourceUrl,
    setNewSourceUrl,
    newSourceName,
    setNewSourceName,
    newSourceInterval,
    setNewSourceInterval,
    handleAddSource,
    handleToggleSource,
    handleDeleteSource,
    
    config,
    isConfigLoading,
    schedulerRunning,
    fetchConfig,
    handleToggleConfig,
    handleUpdateInterval,

    pendingPosts,
    scheduledPosts,
    
    handleSaveDraft,
    handleDelete,
    handleSchedulePost,
    handleAutoQueue
  };
}

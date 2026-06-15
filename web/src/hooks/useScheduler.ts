import { useState, useEffect, useCallback } from 'react';
import toast from 'react-hot-toast';
import { Post, SourcePage, AutoConfig, TabKey } from '../types/scheduler';
import { schedulerApi } from '@/app/api/schedulerApi';

export function useScheduler(initialPosts: Post[]) {
  const [activeTab, setActiveTab] = useState<TabKey>('raw');
  const [direction, setDirection] = useState(0);
  const [posts, setPosts] = useState<Post[]>(initialPosts);

  const tabKeys: TabKey[] = ['raw', 'editor', 'scheduled', 'sources', 'settings'];
  const changeTab = (newTab: TabKey) => {
    const oldIndex = tabKeys.indexOf(activeTab);
    const newIndex = tabKeys.indexOf(newTab);
    setDirection(newIndex > oldIndex ? 1 : -1);
    setActiveTab(newTab);
  };

  // Modal State
  const [selectedPost, setSelectedPost] = useState<Post | null>(null);
  const [editedText, setEditedText] = useState('');
  const [editedImageUrl, setEditedImageUrl] = useState('');
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
  const rawPosts = posts.filter(p => p.status === 'SCRAPED');
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
    // eslint-disable-next-line
    if (activeTab === 'sources') fetchSources();
    // eslint-disable-next-line
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
    setEditedImageUrl('');
    setScheduleTime('');
  };

  // ─── Post Actions ─────────────────────────────────────────

  const handleScrape = async () => {
    if (!scrapeUrl) {
      toast.error("Please enter a Facebook URL!");
      return;
    }
    setIsScraping(true);
    try {
      await schedulerApi.triggerScraper(scrapeUrl);
      toast.success("Scrape successful! Please refresh (F5) to view new posts in the Queue.");
      setScrapeUrl('');
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : String(err);
      toast.error("Failed to connect to Backend: " + message);
    } finally {
      setIsScraping(false);
    }
  };

  const handleSaveDraft = async () => {
    if (!selectedPost) return;
    setIsLoading(true);
    try {
      const data = await schedulerApi.updatePost(selectedPost.id, { rewrittenText: editedText, ...(editedImageUrl && { imageUrl: editedImageUrl }) });
      if (data.success) {
        setPosts(posts.map(p => p.id === selectedPost.id ? { ...p, rewrittenText: editedText, ...(editedImageUrl && { imageUrl: editedImageUrl }) } : p));
        toast.success("Draft saved successfully!");
        closeModal();
      } else {
        toast.error("Error: " + data.error);
      }
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : String(err);
      toast.error("Server Error: " + message);
    } finally {
      setIsLoading(false);
    }
  };

  const handleDelete = async () => {
    if (!selectedPost) return;
    if (!confirm("Are you sure you want to delete this post?")) return;

    setIsLoading(true);
    try {
      const data = await schedulerApi.deletePost(selectedPost.id);
      if (data.success) {
        setPosts(posts.filter(p => p.id !== selectedPost.id));
        toast.success("Post removed from queue!");
        closeModal();
      } else {
        toast.error("Error: " + data.error);
      }
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : String(err);
      toast.error("Server Error: " + message);
    } finally {
      setIsLoading(false);
    }
  };

  const handleSchedulePost = async () => {
    if (!selectedPost) return;
    if (!scheduleTime) {
      toast.error("Please select a date and time!");
      return;
    }

    setIsLoading(true);
    try {
      const data = await schedulerApi.scheduleFbPost(selectedPost.id, new Date(scheduleTime).toISOString(), editedText);

      if (data.success) {
        toast.success(`Published to Facebook! Scheduled to post. ID: ${data.fbPostId}`);
        setPosts(posts.map(p => p.id === selectedPost.id ? {
          ...p,
          status: 'SCHEDULED',
          scheduledAt: new Date(scheduleTime).toISOString(),
          rewrittenText: editedText,
          fbPostId: data.fbPostId
        } : p));
        closeModal();
      } else {
        toast.error(`Error: ${data.error}`);
      }
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : String(err);
      toast.error(`Server Error: ${message}`);
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
        const formattedTime = new Date(scheduledAt).toLocaleString();
        toast.success(`Added to queue! Will post at: ${formattedTime}`);
        setPosts(posts.map(p => p.id === selectedPost.id ? {
          ...p,
          status: 'SCHEDULED',
          scheduledAt: scheduledAt,
          rewrittenText: editedText,
        } : p));
        closeModal();
      } else {
        toast.error(`Error: ${data.error || data.detail}`);
      }
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : String(err);
      toast.error(`Server Error: ${message}`);
    } finally {
      setIsLoading(false);
    }
  };

  const handleSendToAI = async (post: Post) => {
    setIsLoading(true);
    try {
      const data = await schedulerApi.updatePostStatus(post.id, 'DRAFT');
      if (data.success) {
        setPosts(posts.map(p => p.id === post.id ? { ...p, status: 'DRAFT' } : p));
        changeTab('editor');
        setSelectedPost(post);
        setEditedText(post.rewrittenText || post.originalText || '');
        setEditedImageUrl(post.imageUrl || '');
        toast.success('Moved to AI Workspace!');
      }
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : String(err);
      toast.error('Failed to move to AI: ' + message);
    } finally {
      setIsLoading(false);
    }
  };

  const handleUpdateScheduledPost = async (post: Post, newText: string, newImageUrl?: string) => {
    setIsLoading(true);
    try {
      const data = await schedulerApi.updatePost(post.id, { rewrittenText: newText, ...(newImageUrl && { imageUrl: newImageUrl }) });
      if (data.success) {
        setPosts(posts.map(p => p.id === post.id ? { ...p, rewrittenText: newText, ...(newImageUrl && { imageUrl: newImageUrl }) } : p));
        toast.success("Schedule content updated successfully!");
      } else {
        toast.error("Error: " + data.error);
      }
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : String(err);
      toast.error("Server Error: " + message);
    } finally {
      setIsLoading(false);
    }
  };

  const handleUpdateRawPost = async (post: Post, newOriginalText: string, newImageUrl?: string) => {
    setIsLoading(true);
    try {
      const data = await schedulerApi.updatePost(post.id, { originalText: newOriginalText, ...(newImageUrl && { imageUrl: newImageUrl }) });
      if (data.success) {
        setPosts(posts.map(p => p.id === post.id ? { ...p, originalText: newOriginalText, ...(newImageUrl && { imageUrl: newImageUrl }) } : p));
        toast.success("Raw content updated successfully!");
      } else {
        toast.error("Error: " + data.error);
      }
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : String(err);
      toast.error("Server Error: " + message);
    } finally {
      setIsLoading(false);
    }
  };

  const handlePushToScheduleDirect = async (post: Post) => {
    setIsLoading(true);
    try {
      const data = await schedulerApi.autoQueuePost(post.id, post.rewrittenText || post.originalText);
      if (data.success) {
        setPosts(posts.map(p => p.id === post.id ? {
          ...p,
          status: 'SCHEDULED',
          scheduledAt: data.scheduledAt,
        } : p));
        changeTab('scheduled');
        toast.success('Pushed to Schedule Queue!');
      }
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : String(err);
      toast.error('Failed to schedule: ' + message);
    } finally {
      setIsLoading(false);
    }
  };


  // ─── Source Actions ────────────────────────────────────────

  const handleAddSource = async () => {
    if (!newSourceUrl || !newSourceName) {
      toast.error("Please enter both URL and Source Name!");
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
        toast.success("New source added successfully!");
      } else {
        toast.error("Error: " + (data.detail || data.error));
      }
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : String(err);
      toast.error("Error: " + message);
    } finally {
      setIsSourcesLoading(false);
    }
  };

  const handleToggleSource = async (source: SourcePage) => {
    try {
      const data = await schedulerApi.toggleSource(source.id, !source.isActive);
      if (data.success) {
        setSources(sources.map(s => s.id === source.id ? { ...s, isActive: !s.isActive } : s));
        toast.success(`Source ${source.name} is now ${!source.isActive ? 'ON' : 'OFF'}`);
      }
    } catch (err) {
      console.error('Toggle source failed:', err);
      toast.error('Failed to toggle source');
    }
  };

  const handleCreateCustomPost = async (originalText: string) => {
    try {
      const data = await schedulerApi.createPost(originalText, "");
      if (data.success && data.post) {
        setPosts(prev => [data.post, ...prev]);
        setSelectedPost(data.post);
        setEditedText("");
        toast.success('Custom Post Draft Created!');
      }
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : String(err);
      toast.error('Failed to create custom post: ' + message);
    }
  };

  const handleDeleteSource = async (sourceId: number) => {
    if (!confirm("Delete this source?")) return;
    try {
      const data = await schedulerApi.deleteSource(sourceId);
      if (data.success) {
        setSources(sources.filter(s => s.id !== sourceId));
        toast.success("Source deleted!");
      }
    } catch (err) {
      console.error('Delete source failed:', err);
      toast.error("Failed to delete source");
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
        toast.success(`Updated configuration: ${key}`);
      }
    } catch (err) {
      console.error('Toggle config failed:', err);
      toast.error('Failed to update configuration');
      setConfig({ ...config, [key]: !newValue }); // Revert
    }
  };

  const handleUpdateInterval = async (key: 'postIntervalMin' | 'scrapeIntervalMin' | 'aiPromptRules', value: number | string) => {
    setConfig({ ...config, [key]: value });
    try {
      await schedulerApi.updateConfig({ [key]: value });
      toast.success(`Updated ${key}`);
    } catch (err) {
      console.error('Update interval failed:', err);
      toast.error(`Failed to update ${key}`);
    }
  };

  return {
    activeTab,
    direction,
    changeTab,
    
    selectedPost,
    editedText,
    setEditedText,
    editedImageUrl,
    setEditedImageUrl,
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

    posts,
    rawPosts,
    scheduledPosts,
    
    handleSaveDraft,
    handleCreateCustomPost,
    handleDelete,
    handleSchedulePost,
    handleAutoQueue,
    handleSendToAI,
    handleUpdateScheduledPost,
    handleUpdateRawPost,
    handlePushToScheduleDirect
  };
}

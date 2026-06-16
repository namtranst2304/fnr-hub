import { useState, useCallback } from 'react';
import toast from 'react-hot-toast';
import { TabKey } from '../types/scheduler';
import { schedulerApi } from '@/app/api/schedulerApi';

export function useScheduler() {
  const [activeTab, setActiveTab] = useState<TabKey>('raw');
  const [direction, setDirection] = useState(0);
  const [refreshKey, setRefreshKey] = useState(0);
  
  const triggerRefresh = useCallback(() => {
    setRefreshKey(k => k + 1);
  }, []);

  const tabKeys: TabKey[] = ['raw', 'editor', 'scheduled', 'sources', 'settings'];
  const changeTab = (newTab: TabKey) => {
    const oldIndex = tabKeys.indexOf(activeTab);
    const newIndex = tabKeys.indexOf(newTab);
    setDirection(newIndex > oldIndex ? 1 : -1);
    setActiveTab(newTab);
  };

  // Scraper State
  const [scrapeUrl, setScrapeUrl] = useState('');
  const [isScraping, setIsScraping] = useState(false);

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

  return {
    activeTab,
    direction,
    changeTab,
    refreshKey,
    triggerRefresh,
    scrapeUrl,
    setScrapeUrl,
    isScraping,
    handleScrape,
  };
}

import { useState, useCallback } from 'react';
import toast from 'react-hot-toast';
import { AutoConfig } from '@/types/scheduler';
import { schedulerApi } from '@/app/api/schedulerApi';

export function useAutoSettings() {
  const [config, setConfig] = useState<AutoConfig>({
    autoScrapeOn: false,
    autoPostOn: false,
    postIntervalMin: 120,
    scrapeIntervalMin: 30,
  });
  const [isConfigLoading, setIsConfigLoading] = useState(false);
  const [schedulerRunning, setSchedulerRunning] = useState(false);

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

  const handleToggleConfig = async (key: keyof AutoConfig) => {
    const newValue = !config[key];
    setConfig(prev => ({ ...prev, [key]: newValue }));
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
      setConfig(prev => ({ ...prev, [key]: !newValue })); // Revert
    }
  };

  const handleUpdateInterval = async (key: 'postIntervalMin' | 'scrapeIntervalMin' | 'aiPromptRules', value: number | string) => {
    setConfig(prev => ({ ...prev, [key]: value }));
    try {
      await schedulerApi.updateConfig({ [key]: value });
      toast.success(`Updated ${key}`);
    } catch (err) {
      console.error('Update interval failed:', err);
      toast.error(`Failed to update ${key}`);
    }
  };

  return {
    config,
    isConfigLoading,
    schedulerRunning,
    fetchConfig,
    handleToggleConfig,
    handleUpdateInterval,
  };
}

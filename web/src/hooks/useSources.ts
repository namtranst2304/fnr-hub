import { useState, useCallback } from 'react';
import toast from 'react-hot-toast';
import { SourcePage } from '@/types/scheduler';
import { schedulerApi } from '@/app/api/schedulerApi';
import { useConfirm } from '@/components/ui/ConfirmModal';

export function useSources() {
  const [sources, setSources] = useState<SourcePage[]>([]);
  const [isSourcesLoading, setIsSourcesLoading] = useState(false);
  const [newSourceUrl, setNewSourceUrl] = useState('');
  const [newSourceName, setNewSourceName] = useState('');
  const [newSourceInterval, setNewSourceInterval] = useState(30);
  const confirm = useConfirm();

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

  const handleAddSource = async () => {
    if (!newSourceUrl || !newSourceName) {
      toast.error("Please fill in source URL and name");
      return;
    }
    setIsSourcesLoading(true);
    try {
      const data = await schedulerApi.addSource(newSourceUrl, newSourceName, newSourceInterval);
      if (data.success) {
        setSources(prev => [data.source, ...prev]);
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
        setSources(prev => prev.map(s => s.id === source.id ? { ...s, isActive: !s.isActive } : s));
        toast.success(`Source ${source.name} is now ${!source.isActive ? 'ON' : 'OFF'}`);
      }
    } catch (err) {
      console.error('Toggle source failed:', err);
      toast.error('Failed to toggle source');
    }
  };

  const handleDeleteSource = async (sourceId: number) => {
    confirm({
      title: 'SYS.PURGE_SOURCE',
      message: 'Are you sure you want to delete this source? This action cannot be undone.',
      danger: true,
      onConfirm: async () => {
        try {
          const data = await schedulerApi.deleteSource(sourceId);
          if (data.success) {
            setSources(prev => prev.filter(s => s.id !== sourceId));
            toast.success("Source deleted!");
          }
        } catch (err) {
          console.error('Delete source failed:', err);
          toast.error("Failed to delete source");
        }
      }
    });
  };

  return {
    sources,
    isSourcesLoading,
    newSourceUrl,
    setNewSourceUrl,
    newSourceName,
    setNewSourceName,
    newSourceInterval,
    setNewSourceInterval,
    fetchSources,
    handleAddSource,
    handleToggleSource,
    handleDeleteSource,
  };
}

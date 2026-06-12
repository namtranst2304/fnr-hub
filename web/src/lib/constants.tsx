import { List, Terminal, Globe, Cpu } from 'lucide-react';
import { TabKey } from '../types/scheduler';

export const API_ROUTES = {
  SOURCES: '/api/sources',
  AUTO_CONFIG: '/api/auto-config',
  TRIGGER_SCRAPER: 'http://localhost:8000/api/trigger-scraper',
  POSTS: '/api/posts',
  SCHEDULE_FB: '/api/schedule-fb',
  AUTO_QUEUE: '/api/auto-queue',
};

export const TABS: { key: TabKey; label: string; icon: React.ReactNode }[] = [
  { key: 'pending', label: 'SYS.QUEUE', icon: <List className="w-4 h-4" /> },
  { key: 'scheduled', label: 'CRON.JOBS', icon: <Terminal className="w-4 h-4" /> },
  { key: 'sources', label: 'DATA.LINKS', icon: <Globe className="w-4 h-4" /> },
  { key: 'settings', label: 'CFG.CORE', icon: <Cpu className="w-4 h-4" /> },
];

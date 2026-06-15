import { List, Terminal, Globe, Cpu, Sparkles } from 'lucide-react';
import { TabKey } from '../types/scheduler';

export const API_ROUTES = {
  BASE_URL: 'http://localhost:8000',
  SOURCES: 'http://localhost:8000/api/sources',
  AUTO_CONFIG: 'http://localhost:8000/api/auto-config',
  TRIGGER_SCRAPER: 'http://localhost:8000/api/trigger-scraper',
  POSTS: 'http://localhost:8000/api/v1/posts',
  SCHEDULE_FB: 'http://localhost:8000/api/v1/facebook/schedule',
  AUTO_QUEUE: 'http://localhost:8000/api/auto-queue',
};

export const TABS: { key: TabKey; label: string; icon: React.ReactNode }[] = [
  { key: 'pending', label: 'SYS.QUEUE', icon: <List className="w-4 h-4" /> },
  { key: 'scheduled', label: 'CRON.JOBS', icon: <Terminal className="w-4 h-4" /> },
  { key: 'sources', label: 'DATA.LINKS', icon: <Globe className="w-4 h-4" /> },
  { key: 'generator', label: 'AI.GEN', icon: <Sparkles className="w-4 h-4" /> },
  { key: 'settings', label: 'CFG.CORE', icon: <Cpu className="w-4 h-4" /> },
];

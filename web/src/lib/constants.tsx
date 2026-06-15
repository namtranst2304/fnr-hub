import { List, Terminal, Globe, Cpu, Sparkles } from 'lucide-react';
import { TabKey } from '../types/scheduler';

const BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000';

export const API_ROUTES = {
  BASE_URL,
  SOURCES: `${BASE_URL}/api/sources`,
  AUTO_CONFIG: `${BASE_URL}/api/auto-config`,
  TRIGGER_SCRAPER: `${BASE_URL}/api/trigger-scraper`,
  POSTS: `${BASE_URL}/api/v1/posts`,
  SCHEDULE_FB: `${BASE_URL}/api/v1/facebook/schedule`,
  AUTO_QUEUE: `${BASE_URL}/api/auto-queue`,
};

export const TABS: { key: TabKey; label: string; icon: React.ReactNode }[] = [
  { key: 'pending', label: 'SYS.QUEUE', icon: <List className="w-4 h-4" /> },
  { key: 'scheduled', label: 'CRON.JOBS', icon: <Terminal className="w-4 h-4" /> },
  { key: 'sources', label: 'DATA.LINKS', icon: <Globe className="w-4 h-4" /> },
  { key: 'generator', label: 'AI.GEN', icon: <Sparkles className="w-4 h-4" /> },
  { key: 'settings', label: 'CFG.CORE', icon: <Cpu className="w-4 h-4" /> },
];

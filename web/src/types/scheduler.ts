export interface Post {
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

export interface SourcePage {
  id: number;
  url: string;
  name: string;
  isActive: boolean;
  interval: number;
  lastScraped: string | null;
  createdAt: string;
}

export interface AutoConfig {
  autoScrapeOn: boolean;
  autoPostOn: boolean;
  postIntervalMin: number;
  scrapeIntervalMin: number;
  aiPromptRules?: string;
}

export type TabKey = 'pending' | 'scheduled' | 'sources' | 'settings' | 'generator';

export const formatDate = (dateStr: string | null | undefined, locale = 'vi-VN') => {
  if (!dateStr) return 'UNKNOWN';
  const d = new Date(dateStr);
  return isNaN(d.getTime()) ? 'INVALID_DATE' : d.toLocaleString(locale);
};

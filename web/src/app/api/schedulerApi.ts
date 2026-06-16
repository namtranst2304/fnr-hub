import { API_ROUTES } from '@/lib/constants';
import { AutoConfig } from '@/types/scheduler';

export const schedulerApi = {
  fetchPosts: async (status: string = "", page: number = 1, limit: number = 50, search: string = "") => {
    const params = new URLSearchParams({
      status,
      page: page.toString(),
      limit: limit.toString(),
      search
    });
    const res = await fetch(`${API_ROUTES.POSTS}?${params.toString()}`, { cache: 'no-store' });
    return res.json();
  },
  fetchSources: async () => {
    const res = await fetch(API_ROUTES.SOURCES);
    return res.json();
  },
  addSource: async (url: string, name: string, interval: number) => {
    const res = await fetch(API_ROUTES.SOURCES, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ url, name, interval }),
    });
    return res.json();
  },
  toggleSource: async (id: number, isActive: boolean) => {
    const res = await fetch(`${API_ROUTES.SOURCES}/${id}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ isActive }),
    });
    return res.json();
  },
  deleteSource: async (id: number) => {
    const res = await fetch(`${API_ROUTES.SOURCES}/${id}`, { method: 'DELETE' });
    return res.json();
  },

  fetchConfig: async () => {
    const res = await fetch(API_ROUTES.AUTO_CONFIG);
    return res.json();
  },
  updateConfig: async (payload: Partial<AutoConfig>) => {
    const res = await fetch(API_ROUTES.AUTO_CONFIG, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    });
    return res.json();
  },

  generateCustomPost: async (prompt: string, imageBase64?: string): Promise<{ success: boolean; content?: string; error?: string; model_used?: string }> => {
    const res = await fetch(`${API_ROUTES.BASE_URL}/api/generate`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ prompt, image_base64: imageBase64 }),
    });
    if (!res.ok) {
      const errorData = await res.json().catch(() => ({}));
      throw new Error(errorData.detail || 'Failed to generate post');
    }
    return res.json();
  },

  triggerScraper: async (url: string) => {
    const res = await fetch(API_ROUTES.TRIGGER_SCRAPER, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ url }),
    });
    if (!res.ok) {
      const data = await res.json().catch(() => ({}));
      throw new Error(data.detail || data.error || 'Scraper server error');
    }
    return res.json();
  },

  createPost: async (originalText: string, rewrittenText: string) => {
    const res = await fetch(API_ROUTES.POSTS, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ originalText, rewrittenText }),
    });
    if (!res.ok) {
      throw new Error('Failed to create post');
    }
    return res.json();
  },

  updatePost: async (id: number, updates: { rewrittenText?: string, originalText?: string, imageUrl?: string }) => {
    const res = await fetch(`${API_ROUTES.POSTS}/${id}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(updates),
    });
    return res.json();
  },
  updatePostStatus: async (id: number, status: string) => {
    const res = await fetch(`${API_ROUTES.POSTS}/${id}/status`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ status }),
    });
    return res.json();
  },
  deletePost: async (id: number) => {
    const res = await fetch(`${API_ROUTES.POSTS}/${id}`, { method: 'DELETE' });
    return res.json();
  },
  scheduleFbPost: async (postId: number, scheduledTime: string, rewrittenText: string, imageUrl?: string) => {
    const res = await fetch(API_ROUTES.SCHEDULE_FB, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ postId, scheduledTime, rewrittenText, imageUrl }),
    });
    return res.json();
  },
  autoQueuePost: async (postId: number, rewrittenText: string, imageUrl?: string) => {
    const res = await fetch(API_ROUTES.AUTO_QUEUE, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ postId, rewrittenText, imageUrl }),
    });
    return res.json();
  },
  clearPostsByStatus: async (statuses: string) => {
    const params = new URLSearchParams({ statuses });
    const res = await fetch(`${API_ROUTES.POSTS}/bulk/status?${params.toString()}`, {
      method: 'DELETE'
    });
    return res.json();
  },
};

import { useState, useEffect } from 'react';
import { Post } from '@/types/scheduler';
import { schedulerApi } from '@/app/api/schedulerApi';

export function usePaginatedPosts(status: string, refreshKey: number) {
  const [posts, setPosts] = useState<Post[]>([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const limit = 50;

  useEffect(() => {
    let mounted = true;
    const fetchPosts = async () => {
      setIsLoading(true);
      try {
        const data = await schedulerApi.fetchPosts(status, page, limit, search);
        if (mounted && data.success) {
          setPosts(data.posts);
          setTotal(data.total);
        }
      } catch (err) {
        console.error(err);
      } finally {
        if (mounted) setIsLoading(false);
      }
    };
    
    const timer = setTimeout(() => {
      fetchPosts();
    }, 300);
    
    return () => {
      mounted = false;
      clearTimeout(timer);
    };
  }, [status, page, search, refreshKey]);

  return { posts, total, page, setPage, search, setSearch, isLoading, limit };
}

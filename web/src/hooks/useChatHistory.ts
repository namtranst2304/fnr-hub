import { useState, useEffect } from 'react';
import { Conversation } from '@/types/chat';

export function useChatHistory() {
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [isLoading, setIsLoading] = useState(false);

  // In the future, this will fetch from /api/v1/history
  const fetchHistory = async () => {
    setIsLoading(true);
    try {
      // const res = await fetch('/api/v1/history');
      // const data = await res.json();
      // setConversations(data);
      setConversations([]);
    } catch (error) {
      console.error('Failed to load chat history:', error);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchHistory();
  }, []);

  return {
    conversations,
    isLoading,
    refreshHistory: fetchHistory
  };
}

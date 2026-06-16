import { useState } from 'react';
import toast from 'react-hot-toast';
import { Post, TabKey } from '@/types/scheduler';
import { schedulerApi } from '@/app/api/schedulerApi';
import { useConfirm } from '@/components/ui/ConfirmModal';

export function usePostActions(
  triggerRefresh: () => void,
  changeTab: (tab: TabKey) => void
) {
  // Modal State
  const [selectedPost, setSelectedPost] = useState<Post | null>(null);
  const [editedText, setEditedText] = useState('');
  const [editedImageUrl, setEditedImageUrl] = useState('');
  const [scheduleTime, setScheduleTime] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const confirm = useConfirm();

  const openModal = (post: Post) => {
    setSelectedPost(post);
    setEditedText(post.rewrittenText || post.originalText || '');
    if (post.scheduledAt) {
      const date = new Date(post.scheduledAt);
      const iso = new Date(date.getTime() - (date.getTimezoneOffset() * 60000)).toISOString().slice(0, 16);
      setScheduleTime(iso);
    } else {
      setScheduleTime('');
    }
  };

  const closeModal = () => {
    setSelectedPost(null);
    setEditedText('');
    setEditedImageUrl('');
    setScheduleTime('');
  };

  const handleSaveDraft = async () => {
    if (!selectedPost) return;
    setIsLoading(true);
    try {
      const data = await schedulerApi.updatePost(selectedPost.id, { rewrittenText: editedText, imageUrl: editedImageUrl });
      if (data.success) {
        triggerRefresh();
        toast.success("Draft saved successfully!");
        closeModal();
      } else {
        toast.error("Error: " + data.error);
      }
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : String(err);
      toast.error("Server Error: " + message);
    } finally {
      setIsLoading(false);
    }
  };

  const handleDelete = async (postOverride?: Post) => {
    const postToDelete = postOverride || selectedPost;
    if (!postToDelete) return;
    
    confirm({
      title: 'SYS.PURGE_POST',
      message: 'Are you sure you want to delete this post? This action cannot be undone.',
      danger: true,
      onConfirm: async () => {
        setIsLoading(true);
        try {
          const data = await schedulerApi.deletePost(postToDelete.id);
          if (data.success) {
            triggerRefresh();
            toast.success("Post removed from queue!");
            if (selectedPost && selectedPost.id === postToDelete.id) closeModal();
          } else {
            toast.error("Error: " + data.error);
          }
        } catch (err: unknown) {
          const message = err instanceof Error ? err.message : String(err);
          toast.error("Server Error: " + message);
        } finally {
          setIsLoading(false);
        }
      }
    });
  };

  const handleSchedulePost = async () => {
    if (!selectedPost) return;
    if (!scheduleTime) {
      toast.error("Please select a date and time!");
      return;
    }

    setIsLoading(true);
    try {
      const data = await schedulerApi.scheduleFbPost(selectedPost.id, new Date(scheduleTime).toISOString(), editedText, editedImageUrl);

      if (data.success) {
        toast.success(`Published to Facebook! Scheduled to post. ID: ${data.fbPostId}`);
        triggerRefresh();
        closeModal();
      } else {
        toast.error(`Error: ${data.error}`);
      }
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : String(err);
      toast.error(`Server Error: ${message}`);
    } finally {
      setIsLoading(false);
    }
  };

  const handleAutoQueue = async () => {
    if (!selectedPost) return;

    setIsLoading(true);
    try {
      const data = await schedulerApi.autoQueuePost(selectedPost.id, editedText, editedImageUrl);

      if (data.success) {
        const scheduledAt = data.scheduledAt;
        const formattedTime = new Date(scheduledAt).toLocaleString();
        toast.success(`Added to queue! Will post at: ${formattedTime}`);
        triggerRefresh();
        closeModal();
      } else {
        toast.error(`Error: ${data.error || data.detail}`);
      }
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : String(err);
      toast.error(`Server Error: ${message}`);
    } finally {
      setIsLoading(false);
    }
  };

  const handleSendToAI = async (post: Post) => {
    setIsLoading(true);
    try {
      const data = await schedulerApi.updatePostStatus(post.id, 'DRAFT');
      if (data.success) {
        triggerRefresh();
        toast.success('Moved to AI Workspace (Drafts)!');
      }
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : String(err);
      toast.error('Failed to move to AI: ' + message);
    } finally {
      setIsLoading(false);
    }
  };

  const handleUpdateScheduledPost = async (post: Post, newText: string, newImageUrl?: string) => {
    setIsLoading(true);
    try {
      const data = await schedulerApi.updatePost(post.id, { rewrittenText: newText, ...(newImageUrl && { imageUrl: newImageUrl }) });
      if (data.success) {
        triggerRefresh();
        toast.success("Schedule content updated successfully!");
      } else {
        toast.error("Error: " + data.error);
      }
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : String(err);
      toast.error("Server Error: " + message);
    } finally {
      setIsLoading(false);
    }
  };

  const handleUpdateRawPost = async (post: Post, newOriginalText: string, newImageUrl?: string) => {
    setIsLoading(true);
    try {
      const data = await schedulerApi.updatePost(post.id, { originalText: newOriginalText, ...(newImageUrl && { imageUrl: newImageUrl }) });
      if (data.success) {
        triggerRefresh();
        toast.success("Raw content updated successfully!");
      } else {
        toast.error("Error: " + data.error);
      }
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : String(err);
      toast.error("Server Error: " + message);
    } finally {
      setIsLoading(false);
    }
  };

  const handlePushToScheduleDirect = async (post: Post) => {
    const toastId = toast.loading("Processing...");
    setIsLoading(true);
    try {
      const data = await schedulerApi.autoQueuePost(post.id, post.rewrittenText || post.originalText);
      if (data.success) {
        triggerRefresh();
        changeTab('scheduled');
        toast.success('Pushed to Schedule Queue!', { id: toastId });
      } else {
        toast.error('Error: ' + data.error, { id: toastId });
      }
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : String(err);
      toast.error('Failed to schedule: ' + message, { id: toastId });
    } finally {
      setIsLoading(false);
    }
  };

  const handleCreateCustomPost = async (originalText: string) => {
    try {
      const data = await schedulerApi.createPost(originalText, "");
      if (data.success && data.post) {
        triggerRefresh();
        setSelectedPost(data.post);
        setEditedText("");
        toast.success('Custom Post Draft Created!');
      }
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : String(err);
      toast.error('Failed to create custom post: ' + message);
    }
  };

  return {
    selectedPost,
    setSelectedPost,
    editedText,
    setEditedText,
    editedImageUrl,
    setEditedImageUrl,
    scheduleTime,
    setScheduleTime,
    isLoading,
    openModal,
    closeModal,
    handleSaveDraft,
    handleDelete,
    handleSchedulePost,
    handleAutoQueue,
    handleSendToAI,
    handleUpdateScheduledPost,
    handleUpdateRawPost,
    handlePushToScheduleDirect,
    handleCreateCustomPost
  };
}

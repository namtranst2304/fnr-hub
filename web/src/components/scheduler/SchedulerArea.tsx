'use client';

import { useState } from 'react';
import { Calendar, Clock, Send, CheckCircle2, AlertCircle } from 'lucide-react';

export function SchedulerArea() {
  const [content, setContent] = useState('');
  const [scheduleTime, setScheduleTime] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [status, setStatus] = useState<{type: 'success' | 'error', message: string} | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!content.trim()) return;

    setIsLoading(true);
    setStatus(null);

    try {
      const res = await fetch('/api/v1/posts/schedule', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          content,
          scheduledAt: scheduleTime || null,
        }),
      });

      const data = await res.json();
      
      if (!res.ok) {
        throw new Error(data.error || 'Failed to schedule post');
      }

      setStatus({
        type: 'success',
        message: scheduleTime 
          ? `Successfully scheduled for ${new Date(scheduleTime).toLocaleString()}` 
          : 'Successfully posted immediately!',
      });
      setContent('');
      setScheduleTime('');
    } catch (err: any) {
      setStatus({ type: 'error', message: err.message });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <main className="flex-1 flex flex-col min-w-0 bg-white">
      {/* Header */}
      <header className="flex items-center justify-between h-16 px-6 border-b border-zinc-200 shrink-0 bg-white">
        <div className="flex items-center">
          <Calendar className="w-5 h-5 mr-3 text-blue-600" />
          <span className="font-bold text-lg">Facebook Post Scheduler</span>
        </div>
        <a href="/chat" className="text-sm font-medium text-zinc-500 hover:text-zinc-900 transition-colors">
          &larr; Back to Workspace
        </a>
      </header>
      
      {/* Scrollable Content Area */}
      <div className="flex-1 min-h-0 overflow-y-auto p-6 lg:p-10 bg-zinc-50/50">
        <div className="max-w-3xl mx-auto">
          <div className="mb-8">
            <h1 className="text-2xl font-bold text-zinc-900 mb-2">Create New Post</h1>
            <p className="text-zinc-500 text-sm">Draft your content and schedule it to automatically publish to your Facebook Page.</p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-6 bg-white p-6 rounded-xl border border-zinc-200 shadow-sm">
            {/* Content Input */}
            <div className="space-y-2">
              <label className="text-sm font-semibold text-zinc-700">Post Content</label>
              <textarea
                value={content}
                onChange={(e) => setContent(e.target.value)}
                placeholder="What's on your mind? You can paste AI-rewritten content here..."
                className="w-full h-40 px-4 py-3 border border-zinc-300 rounded-lg outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm resize-none transition-all"
                disabled={isLoading}
              />
            </div>

            {/* Schedule Input */}
            <div className="space-y-2">
              <label className="text-sm font-semibold text-zinc-700 flex items-center gap-2">
                <Clock className="w-4 h-4" />
                Schedule Time (Optional)
              </label>
              <input
                type="datetime-local"
                value={scheduleTime}
                onChange={(e) => setScheduleTime(e.target.value)}
                className="w-full max-w-md px-4 py-3 border border-zinc-300 rounded-lg outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm transition-all"
                disabled={isLoading}
              />
              <p className="text-xs text-zinc-500 mt-1">Leave blank to publish immediately. Must be at least 10 minutes in the future.</p>
            </div>

            {/* Status Messages */}
            {status && (
              <div className={`p-4 rounded-lg flex items-start gap-3 ${status.type === 'success' ? 'bg-green-50 text-green-800 border border-green-200' : 'bg-red-50 text-red-800 border border-red-200'}`}>
                {status.type === 'success' ? <CheckCircle2 className="w-5 h-5 shrink-0" /> : <AlertCircle className="w-5 h-5 shrink-0" />}
                <p className="text-sm font-medium pt-0.5">{status.message}</p>
              </div>
            )}

            {/* Actions */}
            <div className="pt-4 flex justify-end">
              <button
                type="submit"
                disabled={isLoading || !content.trim()}
                className="flex items-center gap-2 px-6 py-2.5 bg-blue-600 hover:bg-blue-700 text-white font-medium rounded-lg disabled:opacity-50 transition-colors"
              >
                {isLoading ? (
                  <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                ) : (
                  <Send className="w-4 h-4" />
                )}
                {scheduleTime ? 'Schedule Post' : 'Publish Now'}
              </button>
            </div>
          </form>
        </div>
      </div>
    </main>
  );
}

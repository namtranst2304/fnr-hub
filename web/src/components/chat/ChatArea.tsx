'use client';

import { useChat } from '@ai-sdk/react';
import { useRef, useEffect } from 'react';
import { Send, Bot, User, Sparkles } from 'lucide-react';

export function ChatArea() {
  const { messages, input, handleInputChange, handleSubmit, isLoading } = useChat({
    api: '/api/v1/chat',
  });
  const messagesEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (messagesEndRef.current) {
      messagesEndRef.current.scrollIntoView({ behavior: 'smooth' });
    }
  }, [messages]);

  return (
    <main className="flex-1 flex flex-col min-w-0 bg-white">
      {/* Header */}
      <header className="flex items-center h-16 px-6 border-b border-zinc-200 shrink-0">
        <Sparkles className="w-4 h-4 mr-2 text-blue-600" />
        <span className="font-semibold text-sm">Ollama Engine</span>
        <span className="ml-2 px-2 py-0.5 rounded bg-zinc-100 border border-zinc-200 text-zinc-600 text-xs font-medium">
          Llama 3
        </span>
      </header>
      
      {/* Scrollable Messages */}
      <div className="flex-1 min-h-0 overflow-y-auto p-6 space-y-6">
        {messages.length === 0 && (
          <div className="py-20 text-center max-w-md mx-auto">
            <div className="w-12 h-12 bg-zinc-100 border border-zinc-200 rounded-lg flex items-center justify-center mx-auto mb-4">
              <Bot className="w-6 h-6 text-zinc-500" />
            </div>
            <h2 className="text-xl font-semibold mb-2">How can I help you?</h2>
            <p className="text-sm text-zinc-500">
              Translate articles, divide chapters, or fetch data. Start typing below.
            </p>
          </div>
        )}

        <div className="max-w-3xl mx-auto space-y-6">
          {messages.map((m) => (
            <div key={m.id} className="flex gap-4">
              <div className="w-8 h-8 rounded border border-zinc-200 bg-zinc-50 flex items-center justify-center shrink-0">
                {m.role === 'user' ? <User className="w-4 h-4 text-zinc-600" /> : <Bot className="w-4 h-4 text-blue-600" />}
              </div>
              <div className="flex-1">
                <div className="font-medium text-sm text-zinc-500 mb-1">
                  {m.role === 'user' ? 'You' : 'Assistant'}
                </div>
                <div className="text-sm text-zinc-800 leading-relaxed whitespace-pre-wrap">
                  {m.content}
                </div>
              </div>
            </div>
          ))}

          {isLoading && (
            <div className="flex gap-4">
              <div className="w-8 h-8 rounded border border-zinc-200 bg-zinc-50 flex items-center justify-center shrink-0">
                <Bot className="w-4 h-4 text-blue-600" />
              </div>
              <div className="flex-1 pt-2 flex gap-1">
                <div className="w-1.5 h-1.5 bg-zinc-400 rounded-full animate-pulse"></div>
                <div className="w-1.5 h-1.5 bg-zinc-400 rounded-full animate-pulse" style={{ animationDelay: '0.2s' }}></div>
                <div className="w-1.5 h-1.5 bg-zinc-400 rounded-full animate-pulse" style={{ animationDelay: '0.4s' }}></div>
              </div>
            </div>
          )}
          <div ref={messagesEndRef} />
        </div>
      </div>

      {/* Footer Form */}
      <div className="p-4 border-t border-zinc-200 shrink-0 bg-white">
        <form onSubmit={handleSubmit} className="flex gap-2 max-w-3xl mx-auto border border-zinc-300 rounded overflow-hidden p-1 focus-within:border-blue-500 focus-within:ring-1 focus-within:ring-blue-500">
          <input
            className="flex-1 px-3 py-2 outline-none text-sm"
            value={input}
            placeholder="Message local AI..."
            onChange={handleInputChange}
            disabled={isLoading}
          />
          <button
            type="submit"
            disabled={isLoading || !input?.trim()}
            className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded disabled:opacity-50 transition-colors"
          >
            <Send className="w-4 h-4" />
          </button>
        </form>
        <div className="text-center mt-2 text-xs text-zinc-500">
          AI generated content may be inaccurate. Review carefully.
        </div>
      </div>
    </main>
  );
}

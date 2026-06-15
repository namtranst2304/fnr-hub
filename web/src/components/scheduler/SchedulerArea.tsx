'use client';

import { Terminal } from 'lucide-react';
import { Post } from '@/types/scheduler';
import { useScheduler } from '@/hooks/useScheduler';
import { TABS } from '@/lib/constants';
import { motion, AnimatePresence } from 'framer-motion';

import { RawTab } from './tabs/RawTab';
import { ScheduledTab } from './tabs/ScheduledTab';
import { SourcesTab } from './tabs/SourcesTab';
import { SettingsTab } from './tabs/SettingsTab';
import { EditorTab } from './tabs/EditorTab';

// ─── Component ────────────────────────────────────────────────

export function SchedulerArea({ initialPosts }: { initialPosts: Post[] }) {
  const {
    activeTab,
    direction,
    changeTab,
    
    selectedPost,
    editedText,
    setEditedText,
    scheduleTime,
    setScheduleTime,
    isLoading,
    openModal,
    closeModal,

    scrapeUrl,
    setScrapeUrl,
    isScraping,
    handleScrape,
    
    sources,
    isSourcesLoading,
    newSourceUrl,
    setNewSourceUrl,
    newSourceName,
    setNewSourceName,
    newSourceInterval,
    setNewSourceInterval,
    handleAddSource,
    handleToggleSource,
    handleDeleteSource,
    
    config,
    isConfigLoading,
    schedulerRunning,
    fetchConfig,
    handleToggleConfig,
    handleUpdateInterval,

    posts,
    rawPosts,
    scheduledPosts,
    
    handleSaveDraft,
    handleDelete,
    handleSchedulePost,
    handleAutoQueue,
    handleSendToAI,
    handlePushToScheduleDirect,
    handleCreateCustomPost
  } = useScheduler(initialPosts);





  // ─── RENDER ────────────────────────────────────────────────

  return (
    <main className="flex-1 flex flex-col min-w-0 bg-zinc-950 bg-[linear-gradient(to_right,#00f3ff10_1px,transparent_1px),linear-gradient(to_bottom,#00f3ff10_1px,transparent_1px)] bg-[size:32px_32px] overflow-hidden relative font-mono text-zinc-300">
      
      {/* ─── CYBERPUNK DECORATIONS ─── */}
      <div className="absolute top-0 left-0 w-32 h-1 bg-[#00f3ff] shadow-[0_0_10px_#00f3ff]" />
      <div className="absolute bottom-0 right-0 w-32 h-1 bg-[#ff00ff] shadow-[0_0_10px_#ff00ff]" />
      <div className="absolute top-0 right-0 w-1 h-32 bg-[#fce205] shadow-[0_0_10px_#fce205]" />

      {/* Header & Tabs */}
      <header className="flex flex-col xl:flex-row xl:items-center justify-between px-6 py-4 border-b border-[#00f3ff]/40 shrink-0 bg-black/60 backdrop-blur-xl gap-4 relative z-10">
        <div className="flex items-center">
          <Terminal className="w-6 h-6 mr-3 text-[#00f3ff]" />
          <span className="font-bold text-lg text-[#00f3ff] tracking-widest uppercase text-shadow-[0_0_5px_#00f3ff]">NET_SCHEDULER v2.0</span>
          {/* Auto-post status indicator */}
          <div className={`ml-4 flex items-center gap-2 px-3 py-1 text-xs font-bold uppercase tracking-wider border-l-[3px] ${
            config.autoPostOn
              ? 'bg-[#00f3ff]/10 text-[#00f3ff] border-[#00f3ff]'
              : 'bg-zinc-900/50 text-zinc-500 border-zinc-700'
          }`}>
            <div className={`w-2 h-2 rounded-none ${config.autoPostOn ? 'bg-[#00f3ff] animate-pulse shadow-[0_0_8px_#00f3ff]' : 'bg-zinc-600'}`} />
            AUTO:{config.autoPostOn ? 'ONLINE' : 'OFFLINE'}
          </div>
        </div>

        <div className="flex flex-col sm:flex-row gap-4 items-center flex-1 justify-center">
          {/* Tabs */}
          <div className="flex bg-black border border-zinc-800 p-1">
            {TABS.map(tab => {
              const count = tab.key === 'raw' ? rawPosts.length : 
                            tab.key === 'editor' ? posts.filter(p => p.status === 'DRAFT').length :
                            tab.key === 'scheduled' ? scheduledPosts.length : 
                            tab.key === 'sources' ? sources.length : undefined;
              return (
              <button
                key={tab.key}
                onClick={() => changeTab(tab.key)}
                className={`flex items-center gap-2 px-4 py-2 text-sm font-bold uppercase transition-all duration-300 ease-out border-b-2 ${
                  activeTab === tab.key
                    ? 'bg-[#00f3ff]/10 text-[#00f3ff] border-[#00f3ff] shadow-[inset_0_-4px_10px_rgba(0,243,255,0.2)]'
                    : 'text-zinc-500 border-transparent hover:text-zinc-300'
                }`}
              >
                {tab.icon}
                <span className="hidden sm:inline tracking-wider">{tab.label}</span>
                {count !== undefined && (
                  <span className={`ml-1 px-1.5 py-0.5 text-[10px] ${
                    activeTab === tab.key ? 'bg-[#00f3ff] text-black' : 'bg-zinc-800 text-zinc-400'
                  }`}>
                    {count.toString().padStart(2, '0')}
                  </span>
                )}
              </button>
            )})}
          </div>

        </div>
      </header>

      {/* Scrollable Content Area */}
      <div className="flex-1 min-h-0 overflow-hidden relative bg-transparent">
        <AnimatePresence mode="wait" custom={direction}>
          <motion.div
            key={activeTab}
            custom={direction}
            initial={{ x: direction > 0 ? 50 : -50, opacity: 0 }}
            animate={{ x: 0, opacity: 1 }}
            exit={{ x: direction > 0 ? -50 : 50, opacity: 0 }}
            transition={{ duration: 0.2, ease: "easeOut" }}
            className="absolute inset-0 overflow-y-auto p-6 scrollbar-thin scrollbar-thumb-[#00f3ff]/30 scrollbar-track-transparent"
          >

            {activeTab === 'raw' && (
              <RawTab
                posts={rawPosts}
                scrapeUrl={scrapeUrl}
                setScrapeUrl={setScrapeUrl}
                isScraping={isScraping}
                handleScrape={handleScrape}
                handleSendToAI={handleSendToAI}
                handlePushToSchedule={handlePushToScheduleDirect}
              />
            )}

            {/* ──── TAB: EDITOR ──── */}
            {activeTab === 'editor' && (
              <EditorTab
                posts={posts}
                selectedPost={selectedPost}
                setSelectedPost={(post) => {
                  if (post) {
                    openModal(post);
                  } else {
                    closeModal();
                  }
                }}
                handleCreateCustomPost={handleCreateCustomPost}
                editedText={editedText}
                setEditedText={setEditedText}
                scheduleTime={scheduleTime}
                setScheduleTime={setScheduleTime}
                isLoading={isLoading}
                handleSaveDraft={handleSaveDraft}
                handleDelete={handleDelete}
                handleSchedulePost={handleSchedulePost}
                handleAutoQueue={handleAutoQueue}
                config={config}
              />
            )}

            {/* ──── TAB: SCHEDULED ──── */}
            {activeTab === 'scheduled' && (
              <ScheduledTab scheduledPosts={scheduledPosts} />
            )}

            {/* ──── TAB: SOURCES ──── */}
            {activeTab === 'sources' && (
              <SourcesTab
                sources={sources}
                newSourceUrl={newSourceUrl}
                setNewSourceUrl={setNewSourceUrl}
                newSourceName={newSourceName}
                setNewSourceName={setNewSourceName}
                newSourceInterval={newSourceInterval}
                setNewSourceInterval={setNewSourceInterval}
                isSourcesLoading={isSourcesLoading}
                handleAddSource={handleAddSource}
                handleToggleSource={handleToggleSource}
                handleDeleteSource={handleDeleteSource}
              />
            )}

            {/* ──── TAB: SETTINGS ──── */}
            {activeTab === 'settings' && (
              <SettingsTab
                config={config}
                schedulerRunning={schedulerRunning}
                isConfigLoading={isConfigLoading}
                fetchConfig={fetchConfig}
                handleToggleConfig={handleToggleConfig}
                handleUpdateInterval={handleUpdateInterval}
              />
            )}
          </motion.div>
        </AnimatePresence>
      </div>

    </main>
  );
}

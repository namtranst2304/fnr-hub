import { Plus, Loader2, Trash2 } from 'lucide-react';
import { SourcePage } from '@/types/scheduler';
import { formatDate } from '@/lib/utils';

interface SourcesTabProps {
  sources: SourcePage[];
  newSourceUrl: string;
  setNewSourceUrl: (val: string) => void;
  newSourceName: string;
  setNewSourceName: (val: string) => void;
  newSourceInterval: number;
  setNewSourceInterval: (val: number) => void;
  isSourcesLoading: boolean;
  handleAddSource: () => void;
  handleToggleSource: (source: SourcePage) => void;
  handleDeleteSource: (sourceId: number) => void;
}

export function SourcesTab({
  sources,
  newSourceUrl,
  setNewSourceUrl,
  newSourceName,
  setNewSourceName,
  newSourceInterval,
  setNewSourceInterval,
  isSourcesLoading,
  handleAddSource,
  handleToggleSource,
  handleDeleteSource
}: SourcesTabProps) {
  return (
    <div className="max-w-4xl mx-auto space-y-8">
      {/* Add New Source */}
      <div className="bg-black/80 p-6 border border-[#ff00ff]/40 shadow-[0_0_15px_rgba(255,0,255,0.05)] relative">
        <div className="absolute top-0 left-0 w-3 h-3 border-t-2 border-l-2 border-[#ff00ff]" />
        <div className="absolute bottom-0 right-0 w-3 h-3 border-b-2 border-r-2 border-[#ff00ff]" />
        
        <h2 className="font-bold text-[#ff00ff] text-sm uppercase tracking-widest mb-5 flex items-center gap-2">
          <Plus className="w-4 h-4" /> INIT_NEW_DATA_NODE
        </h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <input
            type="text"
            placeholder="URL..."
            value={newSourceUrl}
            onChange={(e) => setNewSourceUrl(e.target.value)}
            className="px-4 py-2 bg-black border border-zinc-700 focus:border-[#ff00ff] text-sm text-zinc-200 outline-none transition-colors duration-300 ease-out placeholder:text-zinc-700"
          />
          <input
            type="text"
            placeholder="IDENTIFIER..."
            value={newSourceName}
            onChange={(e) => setNewSourceName(e.target.value)}
            className="px-4 py-2 bg-black border border-zinc-700 focus:border-[#ff00ff] text-sm text-zinc-200 outline-none transition-colors duration-300 ease-out placeholder:text-zinc-700"
          />
          <div className="flex items-center gap-2 bg-black border border-zinc-700 focus-within:border-[#ff00ff] px-4 py-2 transition-colors duration-300 ease-out">
            <input
              type="number"
              value={newSourceInterval}
              onChange={(e) => setNewSourceInterval(parseInt(e.target.value) || 30)}
              min={5}
              className="bg-transparent text-sm outline-none text-zinc-200 w-full"
            />
            <span className="text-[10px] text-[#ff00ff] uppercase">MINS</span>
          </div>
          <button
            onClick={handleAddSource}
            disabled={isSourcesLoading}
            className="bg-[#ff00ff]/20 hover:bg-[#ff00ff] text-[#ff00ff] hover:text-black border border-[#ff00ff] px-4 py-2 text-sm font-bold transition-all duration-300 ease-out disabled:opacity-50 uppercase tracking-wider flex items-center justify-center gap-2"
          >
            {isSourcesLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : "MOUNT_NODE"}
          </button>
        </div>
      </div>

      {/* Sources List */}
      <div className="space-y-4">
        <h3 className="text-zinc-500 text-xs uppercase tracking-widest mb-2">ACTIVE_NODES</h3>
        {sources.length === 0 ? (
          <div className="text-center py-16 border border-zinc-800 bg-black/40 text-zinc-600 uppercase tracking-widest text-sm">
            NO_NODES_MOUNTED
          </div>
        ) : (
          sources.map((source) => (
            <div
              key={source.id}
              className={`p-4 flex items-center gap-4 transition-all duration-300 ease-out border-l-4 ${
                source.isActive
                  ? 'bg-black/80 border-t border-r border-b border-zinc-800 border-l-[#00f3ff] shadow-[inset_4px_0_10px_rgba(0,243,255,0.1)]'
                  : 'bg-black/40 border border-zinc-800 border-l-zinc-700 opacity-50'
              }`}
            >
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-3 mb-1">
                  <h3 className={`font-bold text-sm tracking-wider uppercase ${source.isActive ? 'text-[#00f3ff]' : 'text-zinc-500'}`}>
                    {source.name}
                  </h3>
                  <span className="text-[10px] text-zinc-600 bg-zinc-900 px-1.5 py-0.5 border border-zinc-800">
                    ID:0x{source.id.toString(16).padStart(4, '0').toUpperCase()}
                  </span>
                </div>
                <p className="text-[10px] text-zinc-500 truncate mb-2">{source.url}</p>
                <div className="flex items-center gap-4">
                  <span className="text-[10px] text-zinc-400 bg-black border border-zinc-800 px-2 py-0.5">
                    FREQ: {source.interval}M
                  </span>
                  {source.lastScraped && (
                    <span className="text-[10px] text-[#fce205]/70">
                      LST_SYNC: {formatDate(source.lastScraped)}
                    </span>
                  )}
                </div>
              </div>

              <div className="flex items-center gap-3 shrink-0">
                <button
                  onClick={() => handleToggleSource(source)}
                  className={`text-xs uppercase font-bold tracking-widest px-3 py-1.5 border ${
                    source.isActive 
                      ? 'text-black bg-[#00f3ff] border-[#00f3ff]' 
                      : 'text-zinc-500 border-zinc-700 hover:text-white'
                  }`}
                >
                  {source.isActive ? 'ONLINE' : 'OFFLINE'}
                </button>
                <button
                  onClick={() => handleDeleteSource(source.id)}
                  className="p-1.5 border border-zinc-800 hover:border-[#ff0000] hover:bg-[#ff0000]/10 text-zinc-600 hover:text-[#ff0000] transition-colors duration-300 ease-out"
                  title="UNMOUNT"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
}

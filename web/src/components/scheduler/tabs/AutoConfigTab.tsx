import { useState, useEffect } from 'react';
import { Cpu, RefreshCw, ToggleRight, ToggleLeft, Save } from 'lucide-react';
import toast from 'react-hot-toast';
import { AutoConfig } from '@/types/scheduler';

interface SettingsTabProps {
  config: AutoConfig;
  schedulerRunning: boolean;
  isConfigLoading: boolean;
  fetchConfig: () => void;
  handleToggleConfig: (key: keyof AutoConfig) => void;
  handleUpdateInterval: (key: 'postIntervalMin' | 'scrapeIntervalMin' | 'aiPromptRules', value: number | string) => void;
}

interface ConfigCardProps {
  title: string;
  desc: string;
  borderColorClass: string;
  textClass: string;
  shadowClass: string;
  borderIndicatorClass: string;
  isOn: boolean;
  toggleKey: keyof AutoConfig;
  intervalValue: number;
  intervalKey: 'postIntervalMin' | 'scrapeIntervalMin';
  intervalLabel: string;
  handleToggleConfig: (key: keyof AutoConfig) => void;
  handleUpdateInterval: (key: 'postIntervalMin' | 'scrapeIntervalMin' | 'aiPromptRules', value: number | string) => void;
}

const ConfigCard = ({
  title,
  desc,
  borderColorClass,
  textClass,
  shadowClass,
  borderIndicatorClass,
  isOn,
  toggleKey,
  intervalValue,
  intervalKey,
  intervalLabel,
  handleToggleConfig,
  handleUpdateInterval
}: ConfigCardProps) => (
  <div className={`bg-black/80 p-6 border border-zinc-800 relative group ${borderColorClass} transition-colors duration-300 ease-out`}>
    <div className={`absolute top-0 ${toggleKey === 'autoScrapeOn' ? 'right-0 border-r' : 'left-0 border-l'} w-2 h-2 border-t ${borderIndicatorClass} opacity-0 group-hover:opacity-100`} />
    <div className="flex items-start justify-between mb-4">
      <div>
        <h3 className={`font-bold ${textClass} text-sm uppercase tracking-widest mb-1`}>{title}</h3>
        <p className="text-[10px] text-zinc-500 leading-relaxed">{desc}</p>
      </div>
      <button onClick={() => handleToggleConfig(toggleKey)} className="shrink-0 ml-4">
        {isOn
          ? <ToggleRight className={`w-10 h-10 ${textClass} ${shadowClass}`} />
          : <ToggleLeft className="w-10 h-10 text-zinc-700" />
        }
      </button>
    </div>
    {isOn && (
      <div className="mt-6 pt-4 border-t border-zinc-800/50">
        <label className="text-[10px] text-zinc-500 uppercase tracking-widest mb-2 block">{intervalLabel}</label>
        <input
          type="number"
          value={intervalValue}
          onChange={(e) => handleUpdateInterval(intervalKey, parseInt(e.target.value) || 30)}
          className={`w-full bg-black border border-zinc-700 focus:${borderColorClass.replace('hover:', '')} ${textClass} px-4 py-2 outline-none text-sm`}
        />
      </div>
    )}
  </div>
);

export function AutoConfigTab({
  config,
  schedulerRunning,
  isConfigLoading,
  fetchConfig,
  handleToggleConfig,
  handleUpdateInterval
}: SettingsTabProps) {

  const [localPrompt, setLocalPrompt] = useState(config.aiPromptRules || '');
  const [isSavingPrompt, setIsSavingPrompt] = useState(false);

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setLocalPrompt(config.aiPromptRules || '');
  }, [config.aiPromptRules]);

  const handleSavePrompt = async () => {
    setIsSavingPrompt(true);
    await handleUpdateInterval('aiPromptRules', localPrompt);
    setIsSavingPrompt(false);
    toast.success('AI Rules saved!');
  };

  return (
    <div className="max-w-4xl mx-auto space-y-8">
      {/* Scheduler Status */}
      <div className="bg-black/80 p-6 border border-zinc-800 relative">
        <div className="flex items-center justify-between mb-4">
          <h2 className="font-bold text-zinc-300 text-sm uppercase tracking-widest flex items-center gap-2">
            <Cpu className="w-4 h-4 text-zinc-500" /> SYS.DAEMON_STATUS
          </h2>
          <button onClick={fetchConfig} disabled={isConfigLoading} className="text-zinc-500 hover:text-[#00f3ff] transition-colors duration-300 ease-out">
            <RefreshCw className={`w-4 h-4 ${isConfigLoading ? 'animate-spin' : ''}`} />
          </button>
        </div>
        <div className={`inline-flex items-center gap-3 px-4 py-2 border text-xs font-bold uppercase tracking-widest ${
          schedulerRunning
            ? 'bg-[#00f3ff]/10 text-[#00f3ff] border-[#00f3ff] shadow-[0_0_15px_rgba(0,243,255,0.2)]'
            : 'bg-[#ff0000]/10 text-[#ff0000] border-[#ff0000]'
        }`}>
          <div className={`w-2 h-2 rounded-none ${schedulerRunning ? 'bg-[#00f3ff] animate-pulse' : 'bg-[#ff0000]'}`} />
          {schedulerRunning ? 'CORE_ACTIVE' : 'CORE_OFFLINE (AWAIT_UVICORN)'}
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
        <ConfigCard
          title="AUTO.SCRAPE_PROTOCOL"
          desc="Init cyclic data harvesting from mounted nodes. Triggers AI rewrite pipeline."
          borderColorClass="hover:border-[#fce205]/50 focus:border-[#fce205]/50"
          textClass="text-[#fce205]"
          shadowClass="drop-shadow-[0_0_8px_#fce205]"
          borderIndicatorClass="border-[#fce205]"
          isOn={config.autoScrapeOn}
          toggleKey="autoScrapeOn"
          intervalValue={config.scrapeIntervalMin}
          intervalKey="scrapeIntervalMin"
          intervalLabel="CYCLES_DELAY_MINS"
          handleToggleConfig={handleToggleConfig}
          handleUpdateInterval={handleUpdateInterval}
        />

        <ConfigCard
          title="AUTO.PUBLISH_PROTOCOL"
          desc="Auto-commit authorized payloads to external FB_GRAPH API at scheduled ticks."
          borderColorClass="hover:border-[#ff00ff]/50 focus:border-[#ff00ff]/50"
          textClass="text-[#ff00ff]"
          shadowClass="drop-shadow-[0_0_8px_#ff00ff]"
          borderIndicatorClass="border-[#ff00ff]"
          isOn={config.autoPostOn}
          toggleKey="autoPostOn"
          intervalValue={config.postIntervalMin}
          intervalKey="postIntervalMin"
          intervalLabel="QUEUE_THROTTLE_MINS"
          handleToggleConfig={handleToggleConfig}
          handleUpdateInterval={handleUpdateInterval}
        />
      </div>

      {/* AI Prompt Rules Builder */}
      <div className="bg-black/80 p-6 border border-[#00f3ff]/30 shadow-[0_0_10px_rgba(0,243,255,0.1)] relative">
        <h3 className="font-bold text-[#00f3ff] text-sm uppercase tracking-widest mb-2 flex items-center gap-2">
          <Cpu className="w-4 h-4" /> AI INSTRUCTION
        </h3>
        <p className="text-[10px] text-zinc-400 leading-relaxed mb-4">
          Set up &quot;System Instruction&quot; for AI when rewriting or generating new posts. You can define the tone, add mandatory hashtags, or specify emojis here.
        </p>
        <textarea
          value={localPrompt}
          onChange={(e) => setLocalPrompt(e.target.value)}
          placeholder="e.g.: Translate and rewrite the following text in English using a Gen Z humor style..."
          className="w-full bg-black border border-[#00f3ff]/50 focus:border-[#00f3ff] text-[#00f3ff] p-4 outline-none text-sm font-mono min-h-[120px] transition-colors shadow-[inset_0_0_10px_rgba(0,243,255,0.05)]"
        />
        <div className="flex justify-between items-center mt-4">
          <span className="text-[10px] text-[#00f3ff]/70 italic">* Please click SAVE after editing</span>
          <button
            onClick={handleSavePrompt}
            disabled={isSavingPrompt || localPrompt === config.aiPromptRules}
            className="flex items-center gap-2 px-6 py-2 bg-[#00f3ff]/20 text-[#00f3ff] border border-[#00f3ff] hover:bg-[#00f3ff]/40 hover:shadow-[0_0_15px_rgba(0,243,255,0.4)] transition-all font-bold text-xs uppercase tracking-widest disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {isSavingPrompt ? <RefreshCw className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
            {isSavingPrompt ? 'SAVING...' : 'SAVE RULES'}
          </button>
        </div>
      </div>
    </div>
  );
}

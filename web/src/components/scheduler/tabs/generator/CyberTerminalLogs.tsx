import React, { useState, useEffect } from 'react';
import { CyberScanner } from './CyberScanner';

const MOCK_LOGS = [
  'INITIALIZING QUANTUM ENGINES...',
  'ESTABLISHING SECURE LINK TO GEMINI CORE...',
  'TRANSMITTING INPUT PAYLOAD PROTOCOLS...',
  'SCANNING PROMPT COMPLEXITY PARAMETERS...',
  'DECRYPTING AI NODE RESPONSES...',
  'SYNTHESIZING NEW SYNTACTIC CODES...',
  'RESOLVING LLM NEURAL MATRIX STATES...',
  'COMPILING MARKDOWN ABSTRACT TREE...',
  'FINALIZING DATA STREAM VERIFICATION...'
];

export function CyberTerminalLogs() {
  const [currentLogs, setCurrentLogs] = useState<string[]>([`[SYS_LOG]: ${MOCK_LOGS[0]}`]);

  useEffect(() => {
    let idx = 0;
    
    const interval = setInterval(() => {
      idx++;
      if (idx < MOCK_LOGS.length) {
        setCurrentLogs(prev => [...prev, `[SYS_LOG]: ${MOCK_LOGS[idx]}`]);
      } else {
        const randomNoise = `[SYS_LOG]: RUNNING_TICK_${Math.floor(Math.random() * 1000)}: DECODING_STREAM_DATA...`;
        setCurrentLogs(prev => [...prev.slice(1), randomNoise]);
      }
    }, 600);

    return () => clearInterval(interval);
  }, []);

  return (
    <div className="bg-black/90 border border-neon-cyan/30 p-4 font-mono text-[10px] text-neon-cyan/80 space-y-1 relative overflow-hidden select-none h-40 flex flex-col justify-end">
      {/* Grid pattern overlay */}
      <div className="absolute inset-0 bg-[linear-gradient(to_right,#00f3ff08_1px,transparent_1px),linear-gradient(to_bottom,#00f3ff08_1px,transparent_1px)] bg-[size:16px_16px] pointer-events-none" />
      
      {/* Scanner line inside log box */}
      <CyberScanner />
      
      <div className="absolute top-2 right-4 flex items-center gap-1.5 animate-pulse">
        <span className="w-1.5 h-1.5 bg-neon-cyan" />
        <span className="tracking-widest text-[8px] uppercase">DECRYPTING...</span>
      </div>
      
      <div className="z-10 overflow-y-auto space-y-1 scrollbar-hide max-h-full">
        {currentLogs.map((log, index) => (
          <div key={index} className="flex items-center gap-2">
            <span className="text-neon-cyan/40">✓</span>
            <span className="whitespace-nowrap truncate">{log}</span>
          </div>
        ))}
        <div className="flex items-center gap-1">
          <span className="text-neon-cyan animate-pulse">▋</span>
          <span className="text-neon-cyan/40 uppercase">PROCESS_AWAIT</span>
        </div>
      </div>
    </div>
  );
}

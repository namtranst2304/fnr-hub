import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';

const MOCK_IMAGE_LOGS = [
  'CONNECTING TO IMAGE_GEN CORE...',
  'ANALYZING GENERATED TEXT CONTEXT...',
  'EXTRACTING VISUAL IDENTIFIERS AND MOOD...',
  'DRAFTING VISUAL STRUCTURE FIELDS...',
  'SYNTHESIZING NEON CHANNELS (CYAN/MAGENTA/YELLOW)...',
  'APPLYING CHROMATIC ABERRATION MATRICES...',
  'COMPILING DIGITALLY SIGNED PNG MATRIX...',
  'DOWNLOADING RENDERED GRAPHICAL BLOCK...'
];

export function CyberImageTerminalLogs() {
  const [currentLogs, setCurrentLogs] = useState<string[]>([`[IMG_SYS]: ${MOCK_IMAGE_LOGS[0]}`]);

  useEffect(() => {
    let idx = 0;
    
    const interval = setInterval(() => {
      idx++;
      if (idx < MOCK_IMAGE_LOGS.length) {
        setCurrentLogs(prev => [...prev, `[IMG_SYS]: ${MOCK_IMAGE_LOGS[idx]}`]);
      } else {
        const randomNoise = `[IMG_SYS]: COMPILING_PIXELS_BLOCK_${Math.floor(Math.random() * 100)}...`;
        setCurrentLogs(prev => [...prev.slice(1), randomNoise]);
      }
    }, 500);

    return () => clearInterval(interval);
  }, []);

  return (
    <div className="bg-black/95 border border-neon-yellow/30 p-3 font-mono text-[9px] text-neon-yellow/80 space-y-1 relative overflow-hidden select-none h-32 flex flex-col justify-end">
      <div className="absolute inset-0 bg-[linear-gradient(to_right,#fce20505_1px,transparent_1px),linear-gradient(to_bottom,#fce20505_1px,transparent_1px)] bg-[size:12px_12px] pointer-events-none" />
      
      {/* Yellow scanner line inside log box */}
      <motion.div
        initial={{ top: "0%" }}
        animate={{ top: ["0%", "100%", "0%"] }}
        transition={{ duration: 2, repeat: Infinity, ease: "easeInOut" }}
        className="absolute left-0 w-full h-[1px] bg-neon-yellow shadow-[0_0_6px_#fce205] pointer-events-none z-10"
      />
      
      <div className="absolute top-2 right-4 flex items-center gap-1.5 animate-pulse">
        <span className="w-1.5 h-1.5 bg-neon-yellow" />
        <span className="tracking-widest text-[8px] uppercase">SYNTHESIZING...</span>
      </div>
      
      <div className="z-10 overflow-y-auto space-y-0.5 scrollbar-hide max-h-full">
        {currentLogs.map((log, index) => (
          <div key={index} className="flex items-center gap-1.5">
            <span className="text-neon-yellow/40">⚡</span>
            <span className="whitespace-nowrap truncate">{log}</span>
          </div>
        ))}
      </div>
    </div>
  );
}

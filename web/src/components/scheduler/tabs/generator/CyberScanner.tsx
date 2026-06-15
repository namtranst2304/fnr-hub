import React from 'react';
import { motion } from 'framer-motion';

export function CyberScanner() {
  return (
    <motion.div
      initial={{ top: "0%" }}
      animate={{ top: ["0%", "100%", "0%"] }}
      transition={{ duration: 2.5, repeat: Infinity, ease: "easeInOut" }}
      className="absolute left-0 w-full h-[2px] bg-neon-cyan shadow-[0_0_8px_#00f3ff,0_0_12px_#00f3ff] pointer-events-none z-10"
    />
  );
}

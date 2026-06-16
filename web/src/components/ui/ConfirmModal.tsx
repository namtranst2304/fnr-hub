'use client';

import React, { createContext, useContext, useState, ReactNode } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { AlertTriangle, X, Check } from 'lucide-react';

interface ConfirmOptions {
  title?: string;
  message: string;
  confirmText?: string;
  cancelText?: string;
  onConfirm: () => void;
  onCancel?: () => void;
  danger?: boolean;
}

interface ConfirmContextType {
  confirm: (options: ConfirmOptions) => void;
}

const ConfirmContext = createContext<ConfirmContextType | undefined>(undefined);

export const useConfirm = () => {
  const context = useContext(ConfirmContext);
  if (!context) {
    throw new Error('useConfirm must be used within a ConfirmProvider');
  }
  return context.confirm;
};

export const ConfirmProvider = ({ children }: { children: ReactNode }) => {
  const [isOpen, setIsOpen] = useState(false);
  const [options, setOptions] = useState<ConfirmOptions | null>(null);

  const confirm = (opts: ConfirmOptions) => {
    setOptions(opts);
    setIsOpen(true);
  };

  const handleConfirm = () => {
    setIsOpen(false);
    if (options?.onConfirm) {
      options.onConfirm();
    }
  };

  const handleCancel = () => {
    setIsOpen(false);
    if (options?.onCancel) {
      options.onCancel();
    }
  };

  return (
    <ConfirmContext.Provider value={{ confirm }}>
      {children}
      
      <AnimatePresence>
        {isOpen && options && (
          <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={handleCancel}
              className="absolute inset-0 bg-black/80 backdrop-blur-sm"
            />
            
            <motion.div
              initial={{ scale: 0.9, opacity: 0, y: 20 }}
              animate={{ scale: 1, opacity: 1, y: 0 }}
              exit={{ scale: 0.9, opacity: 0, y: 20 }}
              className={`relative w-full max-w-md bg-zinc-950 border-2 ${
                options.danger ? 'border-[#ff0000] shadow-[0_0_20px_rgba(255,0,0,0.3)]' : 'border-[#fce205] shadow-[0_0_20px_rgba(252,226,5,0.3)]'
              } p-6 overflow-hidden flex flex-col font-mono text-zinc-300`}
            >
              {/* Scanline decoration */}
              <div className="absolute top-0 left-0 w-full h-[2px] bg-white/20 animate-scanline pointer-events-none" />

              <div className="flex items-start gap-4 mb-6">
                <div className={`p-3 rounded-none ${options.danger ? 'bg-[#ff0000]/10 text-[#ff0000]' : 'bg-[#fce205]/10 text-[#fce205]'}`}>
                  <AlertTriangle className="w-6 h-6" />
                </div>
                <div className="flex-1">
                  <h3 className={`text-lg font-bold uppercase tracking-wider mb-2 ${options.danger ? 'text-[#ff0000]' : 'text-[#fce205]'}`}>
                    {options.title || 'SYS.CONFIRM_ACTION'}
                  </h3>
                  <p className="text-sm text-zinc-400">
                    {options.message}
                  </p>
                </div>
              </div>

              <div className="flex items-center justify-end gap-3 mt-auto">
                <button
                  onClick={handleCancel}
                  className="px-4 py-2 border border-zinc-700 hover:border-zinc-500 hover:bg-zinc-800 text-zinc-300 text-xs font-bold tracking-widest uppercase transition-colors duration-300 flex items-center gap-2"
                >
                  <X className="w-4 h-4" /> {options.cancelText || 'CANCEL'}
                </button>
                <button
                  onClick={handleConfirm}
                  className={`px-4 py-2 border text-xs font-bold tracking-widest uppercase transition-all duration-300 flex items-center gap-2 ${
                    options.danger 
                      ? 'border-[#ff0000] text-[#ff0000] hover:bg-[#ff0000] hover:text-black shadow-[0_0_10px_rgba(255,0,0,0.2)]'
                      : 'border-[#fce205] text-[#fce205] hover:bg-[#fce205] hover:text-black shadow-[0_0_10px_rgba(252,226,5,0.2)]'
                  }`}
                >
                  <Check className="w-4 h-4" /> {options.confirmText || 'CONFIRM_EXEC'}
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </ConfirmContext.Provider>
  );
};

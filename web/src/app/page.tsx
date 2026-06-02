import Link from 'next/link';
import { ArrowRight, Bot, Zap, Settings2 } from 'lucide-react';

export default function HomePage() {
  return (
    <div className="min-h-screen bg-slate-50 text-slate-900 flex flex-col font-sans relative overflow-hidden">
      
      {/* Light Mesh Gradient Background */}
      <div className="absolute top-[-10%] left-[-10%] w-[50%] h-[50%] bg-blue-400/20 blur-[120px] rounded-full pointer-events-none" />
      <div className="absolute bottom-[-10%] right-[-10%] w-[50%] h-[50%] bg-purple-400/20 blur-[120px] rounded-full pointer-events-none" />
      <div className="absolute top-[40%] left-[30%] w-[40%] h-[40%] bg-pink-400/10 blur-[100px] rounded-full pointer-events-none" />

      {/* Navbar Minimalist */}
      <header className="relative z-10 flex items-center justify-between px-8 py-6 max-w-7xl mx-auto w-full">
        <div className="font-bold text-lg tracking-tight flex items-center gap-2">
          <div className="w-8 h-8 bg-white/60 backdrop-blur-md rounded-lg flex items-center justify-center text-blue-600 font-bold text-sm border border-white/50 shadow-sm">F</div>
          FNR Hub
        </div>
        <div className="flex gap-4">
          <Link 
            href="/chat" 
            className="text-sm font-semibold text-slate-600 hover:text-blue-600 transition-colors"
          >
            Launch Workspace
          </Link>
        </div>
      </header>

      {/* Hero Minimalist */}
      <main className="relative z-10 flex-1 flex flex-col items-center justify-center text-center px-4">
        
        <div className="flex flex-col items-center max-w-3xl mx-auto animate-in fade-in zoom-in-95 duration-1000 ease-out">
          <div className="px-4 py-1.5 mb-8 text-xs font-semibold border border-white/60 bg-white/40 backdrop-blur-md rounded-full text-blue-600 shadow-sm">
            FNR Auto-Repost System v2.0
          </div>
          
          <h1 className="text-5xl md:text-7xl font-bold tracking-tight text-slate-900 mb-6 drop-shadow-sm">
            Intelligent Automation.
            <br />
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-blue-500 to-purple-500">Zero Friction.</span>
          </h1>
          
          <p className="text-lg text-slate-600 max-w-xl mb-10 leading-relaxed font-medium">
            The all-in-one local AI workspace for content fetching, translating, and scheduling across social platforms.
          </p>

          <Link 
            href="/chat" 
            className="group flex items-center justify-center gap-2 bg-white/70 backdrop-blur-xl text-blue-700 px-8 py-4 rounded-full font-bold transition-all hover:bg-white hover:scale-105 active:scale-95 shadow-[0_8px_32px_rgba(59,130,246,0.15)] border border-white"
          >
            Open Chatbot
            <ArrowRight className="w-4 h-4 text-blue-500 group-hover:text-blue-700 transition-colors" />
          </Link>
        </div>

      </main>
    </div>
  );
}

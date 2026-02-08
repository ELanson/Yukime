import React from 'react';
import { Plus, Zap, Settings, Command, ShieldCheck, Globe, AlertTriangle, ShieldAlert } from 'lucide-react';

interface EmptyStateProps {
  onCreateChat: () => void;
  isConnected: boolean;
  onOpenSettings: () => void;
}

const EmptyState: React.FC<EmptyStateProps> = ({ onCreateChat, isConnected, onOpenSettings }) => {
  const isHttps = window.location.protocol === 'https:';

  return (
    <div className="flex-1 flex flex-col items-center justify-center p-8 text-center animate-in fade-in zoom-in duration-1000 relative overflow-hidden">
      {/* Background Glow */}
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] bg-indigo-500/10 blur-[120px] rounded-full -z-10" />

      <div className="relative group mb-10">
        <div className="absolute -inset-8 bg-gradient-to-tr from-indigo-500 to-teal-400 rounded-full blur-3xl opacity-20 group-hover:opacity-40 transition-opacity duration-700" />
        <div className="w-24 h-24 rounded-[2rem] glass-strong flex items-center justify-center relative ring-1 ring-white/10 group-hover:scale-110 transition-transform duration-500">
          <Zap size={48} className="text-indigo-400 fill-current floating" />
        </div>
      </div>
      
      <div className="space-y-4 mb-16">
        <h1 className="text-5xl md:text-6xl font-bold text-white tracking-tighter transition-colors duration-300">
          Intelligence, <span className="bg-gradient-to-r from-indigo-400 to-teal-400 bg-clip-text text-transparent">Unchained.</span>
        </h1>
        <p className="max-w-xl mx-auto text-zinc-400 text-lg md:text-xl font-medium leading-relaxed transition-colors duration-300">
          Yukime is your private window into local large language models. No accounts, no data leaks, no limits.
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 w-full max-w-2xl">
        <button 
          onClick={onCreateChat}
          className="flex flex-col items-start p-6 rounded-[2rem] glass hover:bg-white/[0.04] border-white/5 hover:border-indigo-500/30 transition-all group text-left"
        >
          <div className="p-3 rounded-2xl bg-indigo-500/10 text-indigo-400 mb-4 group-hover:scale-110 transition-transform shadow-lg shadow-indigo-500/5">
            <Plus size={24} />
          </div>
          <h3 className="text-white text-lg font-bold mb-1">New Session</h3>
          <p className="text-xs text-zinc-500 font-medium leading-relaxed">Spawn a new conversation thread with your currently active local model.</p>
        </button>

        <button 
          onClick={onOpenSettings}
          className="flex flex-col items-start p-6 rounded-[2rem] glass hover:bg-white/[0.04] border-white/5 hover:border-teal-500/30 transition-all group text-left"
        >
          <div className="p-3 rounded-2xl bg-teal-500/10 text-teal-400 mb-4 group-hover:scale-110 transition-transform shadow-lg shadow-teal-500/5">
            <Settings size={24} />
          </div>
          <h3 className="text-white text-lg font-bold mb-1">Engine Control</h3>
          <p className="text-xs text-zinc-500 font-medium leading-relaxed">Configure LM Studio endpoints, port settings, and swap loaded model weights.</p>
        </button>
      </div>

      <div className="mt-20 flex flex-wrap items-center justify-center gap-8 opacity-40 grayscale hover:grayscale-0 transition-all duration-500">
        <div className="flex items-center gap-2 text-xs font-bold text-zinc-400 tracking-widest uppercase">
          <ShieldCheck size={14} /> 100% Private
        </div>
        <div className="flex items-center gap-2 text-xs font-bold text-zinc-400 tracking-widest uppercase">
          <Globe size={14} /> Local Host
        </div>
        <div className="flex items-center gap-2 text-xs font-bold text-zinc-400 tracking-widest uppercase">
          <Command size={14} /> Open Source
        </div>
      </div>

      {!isConnected && (
        <div className="absolute top-8 px-6 py-2.5 rounded-full glass-strong border-rose-500/30 text-rose-400 text-[10px] font-bold tracking-[0.2em] animate-pulse flex flex-col gap-2 items-center">
          <div className="flex items-center gap-3">
            <div className="w-2 h-2 rounded-full bg-rose-500 shadow-[0_0_10px_rgba(244,63,94,0.6)]" />
            SYSTEM OFFLINE: START LM STUDIO
          </div>
          {isHttps && (
            <div className="text-[9px] text-zinc-500 normal-case tracking-normal max-w-xs text-center mt-1 border-t border-rose-500/10 pt-2">
              <span className="text-rose-400 font-bold uppercase block mb-1">HTTPS Connection Blocked</span>
              Since you're on Vercel, you must click the "shield" or "settings" icon in your URL bar and click <strong>"Allow Insecure Content"</strong> to talk to localhost.
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default EmptyState;
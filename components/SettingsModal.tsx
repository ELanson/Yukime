import React, { useState } from 'react';
import { X, Globe, Cpu, Check, AlertCircle, Server, RefreshCw, Info, ExternalLink, ShieldAlert } from 'lucide-react';
import { AppSettings, LMStudioModel } from '../types';

interface SettingsModalProps {
  settings: AppSettings;
  onSave: (settings: AppSettings) => void;
  onClose: () => void;
  models: LMStudioModel[];
  isConnected: boolean;
  onTestConnection: (url: string) => Promise<LMStudioModel[] | null>;
  error?: string | null;
}

const SettingsModal: React.FC<SettingsModalProps> = ({
  settings,
  onSave,
  onClose,
  models,
  isConnected,
  onTestConnection,
  error
}) => {
  const [localSettings, setLocalSettings] = useState<AppSettings>(settings);
  const [isTesting, setIsTesting] = useState(false);
  const isHttps = window.location.protocol === 'https:';

  const handleConnect = async () => {
    setIsTesting(true);
    const fetchedModels = await onTestConnection(localSettings.serverUrl);
    
    if (fetchedModels && fetchedModels.length > 0) {
      const modelIds = fetchedModels.map(m => m.id);
      if (!modelIds.includes(localSettings.currentModel)) {
        setLocalSettings(prev => ({ ...prev, currentModel: fetchedModels[0].id }));
      }
    }
    
    setIsTesting(false);
  };

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
      <div 
        className="absolute inset-0 bg-black/70 backdrop-blur-xl"
        onClick={onClose}
      />
      
      <div className="relative w-full max-w-lg glass-strong border-white/10 rounded-[2.5rem] overflow-hidden shadow-2xl animate-in fade-in zoom-in slide-in-from-bottom-4 duration-300">
        <div className="px-8 py-6 border-b border-white/[0.05] flex items-center justify-between">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 rounded-2xl bg-indigo-500/10 text-indigo-400 flex items-center justify-center">
              <Server size={24} />
            </div>
            <div>
              <h2 className="text-xl font-bold text-white tracking-tight">System Engine</h2>
              <p className="text-[10px] text-zinc-500 font-bold uppercase tracking-widest">Global Configuration</p>
            </div>
          </div>
          <button onClick={onClose} className="p-2.5 hover:bg-white/5 rounded-full text-zinc-500 hover:text-white transition-all">
            <X size={22} />
          </button>
        </div>

        <div className="p-8 space-y-8">
          {isHttps && !isConnected && (
            <div className="p-4 rounded-2xl bg-amber-500/5 border border-amber-500/20 text-amber-200/80 text-[11px] leading-relaxed flex gap-3">
              <ShieldAlert className="text-amber-500 shrink-0" size={18} />
              <div>
                <span className="font-bold text-amber-500 uppercase block mb-1">Vercel Deployment Note</span>
                Chrome blocks "Mixed Content" (HTTPS site calling HTTP localhost). 
                To fix: Click the <strong className="text-white">lock icon</strong> next to the URL &rarr; <strong className="text-white">Site Settings</strong> &rarr; Set <strong className="text-white">Insecure Content</strong> to <strong className="text-white">Allow</strong>.
              </div>
            </div>
          )}

          {/* Server URL Input */}
          <div className="space-y-3">
            <div className="flex items-center justify-between mb-1">
               <label className="flex items-center gap-2 text-xs font-bold text-zinc-400 uppercase tracking-wider">
                <Globe size={14} className="text-indigo-400" />
                Local API Endpoint
              </label>
              {isConnected ? (
                <span className="flex items-center gap-1.5 text-emerald-400 text-[10px] font-bold uppercase">
                  <Check size={12} /> Live
                </span>
              ) : (
                <span className="flex items-center gap-1.5 text-rose-400 text-[10px] font-bold uppercase">
                  <AlertCircle size={12} /> Offline
                </span>
              )}
            </div>
            
            <div className="flex gap-2">
              <input 
                type="text"
                value={localSettings.serverUrl}
                onChange={(e) => setLocalSettings(prev => ({ ...prev, serverUrl: e.target.value }))}
                className="flex-1 bg-white/[0.03] border border-white/5 rounded-2xl px-5 py-4 text-sm focus:ring-2 focus:ring-indigo-500/40 outline-none transition-all placeholder:text-zinc-700 text-zinc-200"
                placeholder="http://localhost:1234"
              />
              <button 
                onClick={handleConnect}
                disabled={isTesting}
                className="px-6 py-4 bg-indigo-600/10 hover:bg-indigo-600/20 text-indigo-400 border border-indigo-500/20 rounded-2xl text-xs font-bold transition-all flex items-center gap-2 active:scale-95 disabled:opacity-50"
              >
                {isTesting ? <RefreshCw size={14} className="animate-spin" /> : <RefreshCw size={14} />}
                Test
              </button>
            </div>

            {error && (
              <div className="p-4 rounded-2xl bg-rose-500/5 border border-rose-500/10 text-rose-400 text-xs flex items-start gap-3">
                <AlertCircle size={16} className="mt-0.5 flex-shrink-0" />
                <p className="leading-relaxed">{error}</p>
              </div>
            )}
          </div>

          {/* Model Selection */}
          <div className="space-y-3">
            <label className="flex items-center gap-2 text-xs font-bold text-zinc-400 uppercase tracking-wider">
              <Cpu size={14} className="text-teal-400" />
              Active LLM Model
            </label>
            <div className="relative group">
              <select 
                value={localSettings.currentModel}
                onChange={(e) => setLocalSettings(prev => ({ ...prev, currentModel: e.target.value }))}
                className={`
                  w-full bg-white/[0.03] border border-white/5 rounded-2xl px-5 py-4 text-sm focus:ring-2 focus:ring-indigo-500/40 outline-none transition-all appearance-none cursor-pointer text-zinc-200
                `}
              >
                {models.length === 0 ? (
                  <option value="" className="bg-zinc-950">No models detected</option>
                ) : (
                  models.map(m => (
                    <option key={m.id} value={m.id} className="bg-zinc-950">{m.id}</option>
                  ))
                )}
              </select>
              <div className="absolute right-5 top-1/2 -translate-y-1/2 pointer-events-none text-zinc-600 group-hover:text-zinc-400 transition-colors">
                <ChevronDown size={18} />
              </div>
            </div>
          </div>

          {/* Info Card */}
          <div className="p-5 rounded-3xl bg-white/[0.02] border border-white/5 space-y-3">
            <h4 className="flex items-center gap-2 text-[10px] font-bold uppercase tracking-[0.2em] text-zinc-500">
              <Info size={14} />
              Quick Setup Guide
            </h4>
            <div className="space-y-2">
              <p className="text-xs text-zinc-400 leading-relaxed">
                Ensure <strong>LM Studio</strong> is running with the <strong>Local Server</strong> enabled. 
              </p>
              <div className="flex items-center gap-4 pt-2">
                <a href="https://lmstudio.ai" target="_blank" className="text-[10px] font-bold text-indigo-400 flex items-center gap-1.5 hover:text-indigo-300 transition-colors">
                  LM Studio Docs <ExternalLink size={10} />
                </a>
              </div>
            </div>
          </div>
        </div>

        <div className="px-8 py-6 bg-white/[0.02] border-t border-white/[0.05] flex justify-end gap-3">
          <button 
            onClick={onClose}
            className="px-6 py-2.5 rounded-2xl text-xs font-bold text-zinc-500 hover:text-white transition-colors"
          >
            DISCARD
          </button>
          <button 
            onClick={() => onSave(localSettings)}
            className="px-8 py-2.5 rounded-2xl text-xs font-black bg-white text-black hover:bg-zinc-200 active:scale-95 transition-all shadow-xl shadow-white/10"
          >
            APPLY CONFIG
          </button>
        </div>
      </div>
    </div>
  );
};

const ChevronDown = ({ size }: { size: number }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="m6 9 6 6 6-6"/></svg>
);

export default SettingsModal;
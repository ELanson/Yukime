import React, { useState } from 'react';
import { Plus, MessageSquare, Trash2, Settings, Zap, Cpu, Search, X, History, ChevronLeft, PanelLeftClose } from 'lucide-react';
import { Chat } from '../types';

interface SidebarProps {
  isOpen: boolean;
  chats: Chat[];
  activeChatId: string | null;
  onSelectChat: (id: string) => void;
  onNewChat: () => void;
  onDeleteChat: (id: string) => void;
  onOpenSettings: () => void;
  isConnected: boolean;
  onToggle: () => void;
}

const Sidebar: React.FC<SidebarProps> = ({
  isOpen,
  chats,
  activeChatId,
  onSelectChat,
  onNewChat,
  onDeleteChat,
  onOpenSettings,
  isConnected,
  onToggle
}) => {
  const [searchQuery, setSearchQuery] = useState('');

  const filteredChats = chats.filter(chat => 
    chat.name.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <aside className={`
      fixed md:relative z-50 h-full border-r flex flex-col
      transition-all duration-300 ease-in-out
      ${isOpen ? 'w-[280px] translate-x-0' : 'w-0 -translate-x-full md:translate-x-0 opacity-0 overflow-hidden'}
    `} style={{ backgroundColor: 'var(--bg-sidebar)', borderColor: 'var(--border-primary)' }}>
      {/* Brand Header */}
      <div className="p-6 flex items-center justify-between min-w-[280px]">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-indigo-500 via-indigo-600 to-indigo-700 flex items-center justify-center shadow-lg shadow-indigo-500/20 ring-1 ring-white/10">
            <Zap size={20} className="text-white fill-current" />
          </div>
          <div>
            <h1 className="font-bold text-base tracking-tight leading-none" style={{ color: 'var(--text-primary)' }}>Yukime</h1>
            <p className="text-[10px] font-medium tracking-wide mt-1" style={{ color: 'var(--text-secondary)' }}>LOCAL INTELLIGENCE</p>
          </div>
        </div>
        <button 
          onClick={onToggle}
          className="p-1.5 hover:bg-black/5 dark:hover:bg-white/5 rounded-lg transition-colors"
          style={{ color: 'var(--text-secondary)' }}
          title="Collapse Sidebar"
        >
          <PanelLeftClose size={18} />
        </button>
      </div>

      {/* New Chat Button */}
      <div className="px-4 mb-2 min-w-[280px]">
        <button 
          onClick={onNewChat}
          className="w-full flex items-center justify-between py-2.5 px-4 bg-black/[0.03] dark:bg-white/[0.03] hover:bg-black/[0.06] dark:hover:bg-white/[0.06] border rounded-xl transition-all group active:scale-[0.98]"
          style={{ borderColor: 'var(--border-primary)' }}
        >
          <div className="flex items-center gap-2.5 text-sm font-semibold" style={{ color: 'var(--text-primary)' }}>
            <Plus size={16} className="text-indigo-400" />
            New Thread
          </div>
          <span className="text-[10px] bg-black/5 dark:bg-white/5 px-1.5 py-0.5 rounded border text-zinc-500 font-mono" style={{ borderColor: 'var(--border-primary)' }}>⌘N</span>
        </button>
      </div>

      {/* Navigation / History */}
      <div className="flex-1 flex flex-col min-h-0 pt-4 min-w-[280px]">
        <div className="px-6 flex items-center justify-between mb-3 text-[11px] font-bold uppercase tracking-widest" style={{ color: 'var(--text-secondary)' }}>
          <div className="flex items-center gap-2">
            <History size={12} />
            History
          </div>
        </div>

        {/* Search */}
        <div className="px-4 mb-4">
          <div className="relative group">
            <div className="absolute inset-y-0 left-3 flex items-center pointer-events-none text-zinc-600 group-focus-within:text-indigo-400 transition-colors">
              <Search size={14} />
            </div>
            <input 
              type="text"
              placeholder="Search conversations..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full bg-transparent border rounded-lg pl-9 pr-8 py-2 text-xs focus:ring-1 focus:ring-indigo-500/10 outline-none transition-all"
              style={{ borderColor: 'var(--border-primary)', color: 'var(--text-primary)' }}
            />
            {searchQuery && (
              <button 
                onClick={() => setSearchQuery('')}
                className="absolute inset-y-0 right-2 flex items-center text-zinc-600 hover:text-white"
              >
                <X size={12} />
              </button>
            )}
          </div>
        </div>

        {/* Scrollable List */}
        <div className="flex-1 overflow-y-auto custom-scrollbar px-2 space-y-0.5 pb-4">
          {chats.length === 0 ? (
            <div className="p-8 text-center">
              <div className="w-10 h-10 rounded-full bg-black/[0.02] dark:bg-white/[0.02] flex items-center justify-center mx-auto mb-3">
                <MessageSquare size={16} className="text-zinc-400" />
              </div>
              <p className="text-xs" style={{ color: 'var(--text-secondary)' }}>No active threads</p>
            </div>
          ) : (
            filteredChats.map((chat) => (
              <div 
                key={chat.id}
                onClick={() => onSelectChat(chat.id)}
                className={`
                  group relative flex items-center gap-3 px-4 py-2.5 rounded-lg cursor-pointer transition-all duration-200
                  ${activeChatId === chat.id ? 'bg-black/[0.05] dark:bg-white/[0.05] text-white' : 'hover:bg-black/[0.02] dark:hover:bg-white/[0.02]'}
                `}
                style={{ color: activeChatId === chat.id ? 'var(--text-primary)' : 'var(--text-secondary)' }}
              >
                <MessageSquare size={14} className={activeChatId === chat.id ? 'text-indigo-400' : 'text-zinc-400 group-hover:text-zinc-500'} />
                <span className="flex-1 text-xs truncate font-medium pr-4">{chat.name}</span>
                <button 
                  onClick={(e) => {
                    e.stopPropagation();
                    onDeleteChat(chat.id);
                  }}
                  className="opacity-0 group-hover:opacity-100 p-1.5 hover:bg-rose-500/10 hover:text-rose-400 rounded-md transition-all"
                >
                  <Trash2 size={12} />
                </button>
              </div>
            ))
          )}
        </div>
      </div>

      {/* Footer / System Info */}
      <div className="p-4 border-t space-y-1 min-w-[280px]" style={{ borderColor: 'var(--border-primary)' }}>
        <div className="p-3 rounded-xl bg-black/[0.02] dark:bg-white/[0.02] border flex items-center justify-between text-[11px]" style={{ borderColor: 'var(--border-primary)' }}>
          <div className="flex items-center gap-2.5 font-medium" style={{ color: 'var(--text-secondary)' }}>
            <Cpu size={14} className="text-indigo-500" />
            LM Studio Engine
          </div>
          <div className={`w-1.5 h-1.5 rounded-full ${isConnected ? 'bg-emerald-500 shadow-[0_0_8px_rgba(16,185,129,0.4)]' : 'bg-rose-500 shadow-[0_0_8px_rgba(244,63,94,0.4)]'}`} />
        </div>
        
        <button 
          onClick={onOpenSettings}
          className="w-full flex items-center gap-3 p-3 rounded-xl hover:bg-black/[0.04] dark:hover:bg-white/[0.04] transition-all text-sm group"
          style={{ color: 'var(--text-secondary)' }}
        >
          <Settings size={18} className="group-hover:rotate-45 transition-transform duration-500" />
          <span className="font-medium">Settings</span>
        </button>
      </div>
    </aside>
  );
};

export default Sidebar;
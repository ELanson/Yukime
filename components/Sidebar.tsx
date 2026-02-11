import React, { useState, useRef, useEffect } from 'react';
import { Plus, MessageSquare, Trash2, Settings, Zap, Cpu, Search, X, History, MoreVertical, Edit2, Pin, PinOff, Download, FileJson, FileText, ChevronRight, AlertCircle } from 'lucide-react';
import { Chat, Message } from '../types';

interface SidebarProps {
  isOpen: boolean;
  chats: Chat[];
  activeChatId: string | null;
  onSelectChat: (id: string) => void;
  onNewChat: () => void;
  onDeleteChat: (id: string) => void;
  onRenameChat: (id: string, name: string) => void;
  onTogglePin: (id: string) => void;
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
  onRenameChat,
  onTogglePin,
  onOpenSettings,
  isConnected,
  onToggle
}) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [menuOpenId, setMenuOpenId] = useState<string | null>(null);
  const [renamingId, setRenamingId] = useState<string | null>(null);
  const [renameValue, setRenameValue] = useState('');
  const [deleteConfirmId, setDeleteConfirmId] = useState<string | null>(null);
  const [exportMenuId, setExportMenuId] = useState<string | null>(null);

  const menuRef = useRef<HTMLDivElement>(null);
  const renameInputRef = useRef<HTMLInputElement>(null);

  // Close menus when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
        setMenuOpenId(null);
        setExportMenuId(null);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Focus rename input
  useEffect(() => {
    if (renamingId && renameInputRef.current) {
      renameInputRef.current.focus();
      renameInputRef.current.select();
    }
  }, [renamingId]);

  const sortedChats = [...chats].sort((a, b) => {
    if (a.isPinned && !b.isPinned) return -1;
    if (!a.isPinned && b.isPinned) return 1;
    return b.createdAt - a.createdAt;
  });

  const filteredChats = sortedChats.filter(chat => 
    chat.name.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const handleStartRename = (chat: Chat) => {
    setRenamingId(chat.id);
    setRenameValue(chat.name);
    setMenuOpenId(null);
  };

  const handleSaveRename = () => {
    if (renamingId && renameValue.trim()) {
      onRenameChat(renamingId, renameValue.trim());
    }
    setRenamingId(null);
  };

  const formatTimestamp = (ts?: number) => {
    if (!ts) return 'Unknown Time';
    const d = new Date(ts);
    return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')} ${String(d.getHours()).padStart(2, '0')}:${String(d.getMinutes()).padStart(2, '0')}:${String(d.getSeconds()).padStart(2, '0')}`;
  };

  const handleExport = (chat: Chat, format: 'json' | 'md' | 'txt') => {
    const dateStr = new Date().toISOString().split('T')[0].replace(/-/g, '');
    const filename = `yukime-${chat.name.toLowerCase().replace(/\s+/g, '-')}-${dateStr}`;
    let blob: Blob;

    if (format === 'json') {
      const data = {
        threadId: chat.id,
        threadTitle: chat.name,
        createdAt: formatTimestamp(chat.createdAt),
        messages: chat.messages.map(m => ({
          role: m.role,
          content: m.content,
          timestamp: formatTimestamp(m.timestamp)
        }))
      };
      blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
    } else if (format === 'md') {
      let md = `# ${chat.name}\n\n`;
      chat.messages.forEach(m => {
        const content = typeof m.content === 'string' ? m.content : m.content.map(p => p.text).join('\n');
        md += `### ${m.role === 'user' ? 'User' : 'Assistant'}\n`;
        md += `*[${formatTimestamp(m.timestamp)}]*\n\n`;
        md += `${content}\n\n---\n\n`;
      });
      blob = new Blob([md], { type: 'text/markdown' });
    } else {
      let txt = `Thread: ${chat.name}\n`;
      txt += `Created: ${formatTimestamp(chat.createdAt)}\n`;
      txt += `==========================================\n\n`;
      chat.messages.forEach(m => {
        const content = typeof m.content === 'string' ? m.content : m.content.map(p => p.text).join('\n');
        txt += `[${formatTimestamp(m.timestamp)}] ${m.role.toUpperCase()}:\n`;
        txt += `${content}\n\n`;
      });
      blob = new Blob([txt], { type: 'text/plain' });
    }

    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${filename}.${format}`;
    a.click();
    URL.revokeObjectURL(url);
    setExportMenuId(null);
    setMenuOpenId(null);
  };

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
            <h1 className="font-bold text-base tracking-tight leading-none text-white">Yukime</h1>
            <p className="text-[10px] font-medium tracking-wide mt-1 text-zinc-500 uppercase">Local Intelligence</p>
          </div>
        </div>
        <button onClick={onToggle} className="p-1.5 hover:bg-white/5 rounded-lg transition-colors text-zinc-500 hover:text-white">
          <X size={18} className="md:hidden" />
          <MoreVertical size={18} className="hidden md:block opacity-40" />
        </button>
      </div>

      {/* New Chat Button */}
      <div className="px-4 mb-2 min-w-[280px]">
        <button 
          onClick={onNewChat}
          className="w-full flex items-center justify-between py-2.5 px-4 bg-white/[0.03] hover:bg-white/[0.06] border border-white/5 rounded-xl transition-all group active:scale-[0.98]"
        >
          <div className="flex items-center gap-2.5 text-sm font-semibold text-white">
            <Plus size={16} className="text-indigo-400" />
            New Thread
          </div>
          <span className="text-[10px] bg-white/5 px-1.5 py-0.5 rounded border border-white/5 text-zinc-500 font-mono">⌘N</span>
        </button>
      </div>

      {/* History */}
      <div className="flex-1 flex flex-col min-h-0 pt-4 min-w-[280px]">
        <div className="px-6 flex items-center justify-between mb-3 text-[11px] font-bold uppercase tracking-widest text-zinc-500">
          <div className="flex items-center gap-2">
            <History size={12} /> History
          </div>
        </div>

        {/* Search */}
        <div className="px-4 mb-4">
          <div className="relative group">
            <div className="absolute inset-y-0 left-3 flex items-center text-zinc-600 group-focus-within:text-indigo-400">
              <Search size={14} />
            </div>
            <input 
              type="text"
              placeholder="Search conversations..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full bg-transparent border border-white/5 rounded-lg pl-9 pr-8 py-2 text-xs focus:ring-1 focus:ring-indigo-500/20 outline-none transition-all text-white"
            />
          </div>
        </div>

        {/* List */}
        <div className="flex-1 overflow-y-auto custom-scrollbar px-2 space-y-0.5 pb-4">
          {filteredChats.map((chat) => (
            <div 
              key={chat.id}
              onClick={() => renamingId !== chat.id && onSelectChat(chat.id)}
              className={`
                group relative flex items-center gap-2 px-3 py-2.5 rounded-lg cursor-pointer transition-all duration-200
                ${activeChatId === chat.id ? 'bg-white/[0.07] text-white' : 'hover:bg-white/[0.03] text-zinc-400'}
              `}
            >
              <div className="shrink-0 flex items-center">
                {chat.isPinned ? (
                  <Pin size={12} className="text-teal-400 fill-teal-400/20" />
                ) : (
                  <MessageSquare size={14} className={activeChatId === chat.id ? 'text-indigo-400' : 'text-zinc-600 group-hover:text-zinc-400'} />
                )}
              </div>

              {renamingId === chat.id ? (
                <input 
                  ref={renameInputRef}
                  value={renameValue}
                  onChange={(e) => setRenameValue(e.target.value)}
                  onBlur={handleSaveRename}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') handleSaveRename();
                    if (e.key === 'Escape') setRenamingId(null);
                  }}
                  className="flex-1 bg-white/10 outline-none text-xs px-1 rounded border border-indigo-500/50 text-white"
                  onClick={e => e.stopPropagation()}
                />
              ) : (
                <span className="flex-1 text-xs truncate font-medium">{chat.name}</span>
              )}

              {/* Thread Menu Trigger */}
              <div className="flex items-center">
                <button 
                  onClick={(e) => {
                    e.stopPropagation();
                    setMenuOpenId(menuOpenId === chat.id ? null : chat.id);
                    setExportMenuId(null);
                  }}
                  className={`p-1 hover:bg-white/10 rounded transition-all transition-opacity duration-200 ${menuOpenId === chat.id ? 'opacity-100' : 'md:opacity-0 group-hover:opacity-100'}`}
                >
                  <MoreVertical size={14} />
                </button>
              </div>

              {/* Context Menu */}
              {menuOpenId === chat.id && (
                <div 
                  ref={menuRef}
                  className="absolute right-2 top-10 w-48 glass-strong border border-white/10 rounded-xl shadow-2xl z-[60] overflow-hidden py-1 animate-in fade-in slide-in-from-top-2 duration-200"
                  onClick={e => e.stopPropagation()}
                >
                  <button onClick={() => onTogglePin(chat.id)} className="w-full flex items-center gap-3 px-4 py-2.5 text-xs hover:bg-white/5 text-zinc-300 transition-colors">
                    {chat.isPinned ? <PinOff size={14} className="text-zinc-500" /> : <Pin size={14} className="text-teal-400" />}
                    {chat.isPinned ? 'Unpin' : 'Pin Thread'}
                  </button>
                  <button onClick={() => handleStartRename(chat)} className="w-full flex items-center gap-3 px-4 py-2.5 text-xs hover:bg-white/5 text-zinc-300 transition-colors">
                    <Edit2 size={14} className="text-indigo-400" />
                    Rename
                  </button>
                  
                  {/* Export Submenu */}
                  <div className="relative group/export">
                    <button 
                      onClick={() => setExportMenuId(exportMenuId === chat.id ? null : chat.id)}
                      className="w-full flex items-center justify-between px-4 py-2.5 text-xs hover:bg-white/5 text-zinc-300 transition-colors"
                    >
                      <div className="flex items-center gap-3">
                        <Download size={14} className="text-emerald-400" />
                        Export
                      </div>
                      <ChevronRight size={12} className={`transition-transform ${exportMenuId === chat.id ? 'rotate-90' : ''}`} />
                    </button>
                    {exportMenuId === chat.id && (
                      <div className="bg-white/5 border-y border-white/5 py-1">
                        <button onClick={() => handleExport(chat, 'json')} className="w-full flex items-center gap-3 pl-11 pr-4 py-2 text-[10px] hover:bg-white/5 text-zinc-400 font-bold uppercase tracking-wider">
                          <FileJson size={12} /> JSON
                        </button>
                        <button onClick={() => handleExport(chat, 'md')} className="w-full flex items-center gap-3 pl-11 pr-4 py-2 text-[10px] hover:bg-white/5 text-zinc-400 font-bold uppercase tracking-wider">
                          <MessageSquare size={12} /> Markdown
                        </button>
                        <button onClick={() => handleExport(chat, 'txt')} className="w-full flex items-center gap-3 pl-11 pr-4 py-2 text-[10px] hover:bg-white/5 text-zinc-400 font-bold uppercase tracking-wider">
                          <FileText size={12} /> Text
                        </button>
                      </div>
                    )}
                  </div>

                  <div className="h-px bg-white/5 my-1" />
                  <button onClick={() => { setDeleteConfirmId(chat.id); setMenuOpenId(null); }} className="w-full flex items-center gap-3 px-4 py-2.5 text-xs hover:bg-rose-500/10 text-rose-400 transition-colors">
                    <Trash2 size={14} />
                    Delete
                  </button>
                </div>
              )}
            </div>
          ))}
        </div>
      </div>

      {/* Footer */}
      <div className="p-4 border-t border-white/5 space-y-1 min-w-[280px]">
        <div className="p-3 rounded-xl bg-white/[0.02] border border-white/5 flex items-center justify-between text-[11px]">
          <div className="flex items-center gap-2.5 font-medium text-zinc-500">
            <Cpu size={14} className="text-indigo-500" />
            Engine Active
          </div>
          <div className={`w-1.5 h-1.5 rounded-full ${isConnected ? 'bg-emerald-500 shadow-[0_0_8px_rgba(16,185,129,0.4)]' : 'bg-rose-500'}`} />
        </div>
        <button onClick={onOpenSettings} className="w-full flex items-center gap-3 p-3 rounded-xl hover:bg-white/5 transition-all text-sm group text-zinc-400 hover:text-white">
          <Settings size={18} className="group-hover:rotate-45 transition-transform duration-500" />
          <span className="font-medium">Settings</span>
        </button>
      </div>

      {/* Delete Confirmation Modal */}
      {deleteConfirmId && (
        <div className="fixed inset-0 z-[200] flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="w-full max-w-xs glass-strong border border-white/10 rounded-3xl p-6 shadow-2xl animate-in zoom-in duration-300">
            <div className="flex flex-col items-center text-center space-y-4">
              <div className="w-12 h-12 rounded-2xl bg-rose-500/10 text-rose-400 flex items-center justify-center">
                <AlertCircle size={24} />
              </div>
              <div>
                <h3 className="text-lg font-bold text-white">Delete Thread?</h3>
                <p className="text-xs text-zinc-500 mt-1">This action cannot be undone. All message history for this session will be lost.</p>
              </div>
              <div className="flex gap-3 w-full pt-2">
                <button onClick={() => setDeleteConfirmId(null)} className="flex-1 py-2.5 rounded-xl text-xs font-bold text-zinc-500 hover:text-white hover:bg-white/5 transition-all">Cancel</button>
                <button onClick={() => { onDeleteChat(deleteConfirmId); setDeleteConfirmId(null); }} className="flex-1 py-2.5 bg-rose-600 hover:bg-rose-500 text-white rounded-xl text-xs font-bold transition-all shadow-lg shadow-rose-600/20">Delete</button>
              </div>
            </div>
          </div>
        </div>
      )}
    </aside>
  );
};

export default Sidebar;
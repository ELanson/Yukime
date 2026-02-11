import React, { useState, useEffect, useCallback } from 'react';
import { 
  Menu, 
  X,
  PanelLeftClose,
  PanelLeftOpen
} from 'lucide-react';
import { Chat, Message, LMStudioModel, AppSettings } from './types';
import Sidebar from './components/Sidebar';
import ChatArea from './components/ChatArea';
import SettingsModal from './components/SettingsModal';
import EmptyState from './components/EmptyState';

const STORAGE_KEY_CHATS = 'yukime_chats';
const STORAGE_KEY_SETTINGS = 'yukime_settings';

const DEFAULT_SETTINGS: AppSettings = {
  serverUrl: 'http://localhost:1234',
  currentModel: '',
};

const App: React.FC = () => {
  const [chats, setChats] = useState<Chat[]>([]);
  const [activeChatId, setActiveChatId] = useState<string | null>(null);
  // Default to closed on mobile, open on desktop
  const [isSidebarOpen, setIsSidebarOpen] = useState(window.innerWidth >= 768);
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);
  const [settings, setSettings] = useState<AppSettings>(DEFAULT_SETTINGS);
  const [models, setModels] = useState<LMStudioModel[]>([]);
  const [isConnected, setIsConnected] = useState(false);
  const [isStreaming, setIsStreaming] = useState(false);
  const [connectionError, setConnectionError] = useState<string | null>(null);

  useEffect(() => {
    const savedChats = localStorage.getItem(STORAGE_KEY_CHATS);
    if (savedChats) {
      const parsed = JSON.parse(savedChats);
      setChats(parsed);
    }

    const savedSettings = localStorage.getItem(STORAGE_KEY_SETTINGS);
    if (savedSettings) {
      setSettings(JSON.parse(savedSettings));
    }

    const handleResize = () => {
      if (window.innerWidth < 768 && isSidebarOpen) {
        // Optional logic for responsive behavior
      }
    };
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  useEffect(() => {
    localStorage.setItem(STORAGE_KEY_CHATS, JSON.stringify(chats));
  }, [chats]);

  useEffect(() => {
    localStorage.setItem(STORAGE_KEY_SETTINGS, JSON.stringify(settings));
  }, [settings]);

  const checkConnection = useCallback(async (url: string): Promise<LMStudioModel[] | null> => {
    setConnectionError(null);
    let rawUrl = url.trim();
    if (!rawUrl) {
      setIsConnected(false);
      return null;
    }
    
    if (!rawUrl.startsWith('http://') && !rawUrl.startsWith('https://')) {
      rawUrl = `http://${rawUrl}`;
    }

    const trimmedUrl = rawUrl.replace(/\/+$/, '');
    
    try {
      const rootUrl = trimmedUrl.replace(/\/v1$/, '');
      const testUrl = `${rootUrl}/v1/models`;

      if (window.location.protocol === 'https:' && rootUrl.startsWith('http:')) {
        throw new Error('Mixed Content Error: HTTPS sites cannot connect to HTTP local servers directly.');
      }

      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 3000);

      const response = await fetch(testUrl, {
        method: 'GET',
        signal: controller.signal,
        mode: 'cors',
        headers: { 'Accept': 'application/json' }
      });
      
      clearTimeout(timeoutId);

      if (!response.ok) throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      
      const data = await response.json();
      if (data && data.data) {
        setModels(data.data);
        setIsConnected(true);
        if (!settings.currentModel && data.data.length > 0) {
          setSettings(prev => ({ ...prev, currentModel: data.data[0].id }));
        }
        return data.data;
      }
      throw new Error('No models found on server.');

    } catch (err: any) {
      const errorMessage = err.name === 'AbortError' ? 'Connection timed out.' : err.message || 'Connection failed';
      setConnectionError(errorMessage);
      setIsConnected(false);
      setModels([]);
      return null;
    }
  }, [settings.currentModel]);

  useEffect(() => {
    if (settings.serverUrl) checkConnection(settings.serverUrl);
  }, [checkConnection, settings.serverUrl]);

  const createNewChat = () => {
    const newChat: Chat = {
      id: Date.now().toString(),
      name: 'New Thread',
      messages: [],
      createdAt: Date.now(),
      isPinned: false
    };
    setChats(prev => [newChat, ...prev]);
    setActiveChatId(newChat.id);
    if (window.innerWidth < 768) setIsSidebarOpen(false);
  };

  const deleteChat = (id: string) => {
    setChats(prev => prev.filter(c => c.id !== id));
    if (activeChatId === id) setActiveChatId(null);
  };

  const updateChatMessages = (chatId: string, messages: Message[]) => {
    setChats(prev => prev.map(chat => chat.id === chatId ? { ...chat, messages } : chat));
  };

  const renameChat = (chatId: string, newName: string) => {
    setChats(prev => prev.map(chat => chat.id === chatId ? { ...chat, name: newName } : chat));
  };

  const togglePin = (chatId: string) => {
    setChats(prev => prev.map(chat => chat.id === chatId ? { ...chat, isPinned: !chat.isPinned } : chat));
  };

  const toggleSidebar = () => setIsSidebarOpen(!isSidebarOpen);

  const activeChat = chats.find(c => c.id === activeChatId) || null;

  return (
    <div className="flex h-[100dvh] w-full bg-[#050505] transition-colors duration-300 overflow-hidden font-sans" style={{ backgroundColor: 'var(--bg-main)', color: 'var(--text-primary)' }}>
      {/* Mobile Backdrop */}
      {isSidebarOpen && (
        <div className="fixed inset-0 bg-black/60 z-40 md:hidden backdrop-blur-sm" onClick={() => setIsSidebarOpen(false)} />
      )}

      <Sidebar 
        isOpen={isSidebarOpen}
        chats={chats}
        activeChatId={activeChatId}
        onSelectChat={(id) => { setActiveChatId(id); if(window.innerWidth < 768) setIsSidebarOpen(false); }}
        onNewChat={createNewChat}
        onDeleteChat={deleteChat}
        onRenameChat={renameChat}
        onTogglePin={togglePin}
        onOpenSettings={() => setIsSettingsOpen(true)}
        isConnected={isConnected}
        onToggle={toggleSidebar}
      />

      <main className="flex-1 flex flex-col relative overflow-hidden h-full">
        {activeChat ? (
          <ChatArea 
            chat={activeChat}
            settings={settings}
            onUpdateMessages={(msgs) => updateChatMessages(activeChat.id, msgs)}
            onRenameChat={(name) => renameChat(activeChat.id, name)}
            isStreaming={isStreaming}
            setIsStreaming={setIsStreaming}
            isConnected={isConnected}
            isSidebarOpen={isSidebarOpen}
            onToggleSidebar={toggleSidebar}
          />
        ) : (
          <div className="flex-1 flex flex-col h-full overflow-y-auto custom-scrollbar relative">
            {!isSidebarOpen && (
              <div className="absolute top-4 left-4 z-50">
                <button 
                  onClick={toggleSidebar}
                  className="p-2.5 glass-strong border-white/10 rounded-xl hover:bg-white/5 text-zinc-400 hover:text-white transition-all shadow-xl active:scale-95"
                >
                  <PanelLeftOpen size={20} />
                </button>
              </div>
            )}
            <EmptyState 
              onCreateChat={createNewChat}
              isConnected={isConnected}
              onOpenSettings={() => setIsSettingsOpen(true)}
            />
          </div>
        )}
      </main>

      {isSettingsOpen && (
        <SettingsModal 
          settings={settings}
          onSave={(newSettings) => {
            setSettings(newSettings);
            checkConnection(newSettings.serverUrl);
            setIsSettingsOpen(false);
          }}
          onClose={() => setIsSettingsOpen(false)}
          onTestConnection={checkConnection}
          models={models}
          isConnected={isConnected}
          error={connectionError}
        />
      )}
    </div>
  );
};

export default App;
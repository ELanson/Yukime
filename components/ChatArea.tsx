import React, { useState, useRef, useEffect, useCallback } from 'react';
/* Added Pencil and Check/X icons for editing */
import { Send, Sparkles, Paperclip, Terminal, User, Square, X, FileText, Image as ImageIcon, ChevronDown, Zap, PanelLeftOpen, Pencil, Check, ChevronDown as ArrowDown } from 'lucide-react';
import { Chat, Message, AppSettings, Attachment, MessageContentPart } from '../types';

declare const marked: any;
declare const hljs: any;

interface ChatAreaProps {
  chat: Chat;
  settings: AppSettings;
  onUpdateMessages: (messages: Message[]) => void;
  onRenameChat: (name: string) => void;
  isStreaming: boolean;
  setIsStreaming: (is: boolean) => void;
  isConnected: boolean;
  isSidebarOpen: boolean;
  onToggleSidebar: () => void;
}

const ChatArea: React.FC<ChatAreaProps> = ({
  chat,
  settings,
  onUpdateMessages,
  onRenameChat,
  isStreaming,
  setIsStreaming,
  isConnected,
  isSidebarOpen,
  onToggleSidebar
}) => {
  const [inputValue, setInputValue] = useState('');
  const [attachments, setAttachments] = useState<Attachment[]>([]);
  const [editingIndex, setEditingIndex] = useState<number | null>(null);
  const [editValue, setEditValue] = useState('');
  const [isAtBottom, setIsAtBottom] = useState(true);
  
  const scrollRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLTextAreaElement>(null);
  const editInputRef = useRef<HTMLTextAreaElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const abortControllerRef = useRef<AbortController | null>(null);
  const isStoppedRef = useRef(false);

  // Monitor scroll position
  const handleScroll = useCallback(() => {
    if (scrollRef.current) {
      const { scrollTop, scrollHeight, clientHeight } = scrollRef.current;
      // Tight threshold for better mobile feel
      const isNearBottom = scrollHeight - scrollTop - clientHeight < 60;
      if (isAtBottom !== isNearBottom) {
        setIsAtBottom(isNearBottom);
      }
    }
  }, [isAtBottom]);

  const scrollToBottom = useCallback((behavior: ScrollBehavior = 'smooth') => {
    if (scrollRef.current) {
      const scrollHeight = scrollRef.current.scrollHeight;
      scrollRef.current.scrollTo({
        top: scrollHeight,
        behavior
      });
    }
  }, []);

  // Focus input on load
  useEffect(() => {
    if (!isStreaming && isConnected && editingIndex === null) {
      const timer = setTimeout(() => inputRef.current?.focus(), 100);
      return () => clearTimeout(timer);
    }
  }, [isStreaming, isConnected, chat.id, editingIndex]);

  // Handle auto-scrolling during message updates
  useEffect(() => {
    if (isAtBottom) {
      // Use 'auto' during streaming to prevent momentum scroll conflicts on mobile
      scrollToBottom(isStreaming ? 'auto' : 'smooth');
    }
  }, [chat.messages, isStreaming, isAtBottom, scrollToBottom]);

  // Reset scroll when switching chats
  useEffect(() => {
    setIsAtBottom(true);
    scrollToBottom('auto');
  }, [chat.id, scrollToBottom]);

  // Configure marked for Markdown
  useEffect(() => {
    if (typeof marked !== 'undefined') {
      marked.setOptions({
        breaks: true,
        gfm: true,
        headerIds: false,
        mangle: false
      });
    }
  }, []);

  // Code copy functionality
  useEffect(() => {
    const handleCopyClick = (e: MouseEvent) => {
      const target = e.target as HTMLElement;
      const btn = target.closest('.copy-code-btn');
      if (!btn) return;

      const encodedCode = btn.getAttribute('data-code');
      if (encodedCode) {
        try {
          const code = decodeURIComponent(escape(atob(encodedCode)));
          navigator.clipboard.writeText(code);
          const originalHTML = btn.innerHTML;
          btn.innerHTML = '<svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#10b981" stroke-width="3" stroke-linecap="round" stroke-linejoin="round" class="lucide lucide-check"><polyline points="20 6 9 17 4 12"/></svg>';
          btn.classList.add('bg-emerald-500/10', 'border-emerald-500/20');
          setTimeout(() => {
            btn.innerHTML = originalHTML;
            btn.classList.remove('bg-emerald-500/10', 'border-emerald-500/20');
          }, 2000);
        } catch (err) {
          console.error('Failed to copy code:', err);
        }
      }
    };
    document.addEventListener('click', handleCopyClick);
    return () => document.removeEventListener('click', handleCopyClick);
  }, []);

  const processFiles = async (files: File[]) => {
    const newAttachments: Attachment[] = [];
    for (const file of files) {
      const isImage = file.type.startsWith('image/');
      const attachment: Attachment = {
        id: Math.random().toString(36).substr(2, 9),
        file,
        type: isImage ? 'image' : 'file',
      };
      if (isImage) {
        attachment.previewUrl = URL.createObjectURL(file);
      } else {
        try {
          const text = await file.text();
          attachment.content = text;
        } catch (err) {
          attachment.content = `[Binary file: ${file.name}]`;
        }
      }
      newAttachments.push(attachment);
    }
    return newAttachments;
  };

  const handleFileSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files) return;
    const newAttachments = await processFiles(Array.from(files) as File[]);
    setAttachments(prev => [...prev, ...newAttachments]);
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  const handlePaste = async (e: React.ClipboardEvent) => {
    const items = e.clipboardData.items;
    const files: File[] = [];
    for (let i = 0; i < items.length; i++) {
      if (items[i].type.startsWith('image/')) {
        const file = items[i].getAsFile();
        if (file) files.push(file);
      }
    }
    if (files.length > 0) {
      const newAttachments = await processFiles(files);
      setAttachments(prev => [...prev, ...newAttachments]);
    }
  };

  const removeAttachment = (id: string) => {
    setAttachments(prev => {
      const removed = prev.find(a => a.id === id);
      if (removed?.previewUrl) URL.revokeObjectURL(removed.previewUrl);
      return prev.filter(a => a.id !== id);
    });
  };

  const fileToBase64 = (file: File): Promise<string> => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.readAsDataURL(file);
      reader.onload = () => resolve(reader.result as string);
      reader.onerror = error => reject(error);
    });
  };

  const formatTime = (timestamp?: number) => {
    if (!timestamp) return '';
    return new Intl.DateTimeFormat('en-US', {
      hour: '2-digit',
      minute: '2-digit',
      hour12: false
    }).format(new Date(timestamp));
  };

  const generateTitle = async (messages: Message[]) => {
    if (!settings.serverUrl || !settings.currentModel) return;
    try {
      const rootUrl = settings.serverUrl.trim().replace(/\/+$/, '').replace(/\/v1$/, '');
      const firstMsg = messages[0];
      const textContent = typeof firstMsg.content === 'string' 
        ? firstMsg.content 
        : firstMsg.content.find(p => p.type === 'text')?.text || 'New Thread';
      const response = await fetch(`${rootUrl}/v1/chat/completions`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          model: settings.currentModel,
          messages: [{ role: 'user', content: `Summarize this request in 3-5 words: ${textContent.slice(0, 100)}` }],
          stream: false
        })
      });
      if (response.ok) {
        const data = await response.json();
        const title = data.choices[0]?.message?.content?.replace(/[".]/g, '').trim();
        if (title) onRenameChat(title);
      }
    } catch (e) {}
  };

  const handleStopStreaming = useCallback(() => {
    isStoppedRef.current = true;
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
    }
    setIsStreaming(false);
  }, [setIsStreaming]);

  const fetchStreamResponse = async (history: Message[]) => {
    isStoppedRef.current = false;
    abortControllerRef.current = new AbortController();
    setIsStreaming(true);
    const assistantStartTime = Date.now();
    try {
      const rootUrl = settings.serverUrl.trim().replace(/\/+$/, '').replace(/\/v1$/, '');
      const response = await fetch(`${rootUrl}/v1/chat/completions`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        signal: abortControllerRef.current.signal,
        body: JSON.stringify({
          model: settings.currentModel,
          messages: history,
          stream: true
        })
      });
      if (!response.ok) throw new Error(`HTTP Error ${response.status}`);
      if (!response.body) throw new Error('Empty response');
      const reader = response.body.getReader();
      const decoder = new TextDecoder();
      let assistantContent = '';
      while (true) {
        if (isStoppedRef.current) break;
        const { done, value } = await reader.read();
        if (done) break;
        const chunk = decoder.decode(value);
        const lines = chunk.split('\n');
        for (const line of lines) {
          if (line.startsWith('data: ')) {
            const dataStr = line.slice(6).trim();
            if (dataStr === '[DONE]') break;
            try {
              const parsed = JSON.parse(dataStr);
              assistantContent += parsed.choices[0]?.delta?.content || '';
              onUpdateMessages([...history, { role: 'assistant', content: assistantContent, timestamp: assistantStartTime } as Message]);
            } catch {}
          }
        }
      }
      if (chat.messages.length === 0 && assistantContent) generateTitle([...history, { role: 'assistant', content: assistantContent, timestamp: assistantStartTime }]);
    } catch (err: any) {
      if (err.name !== 'AbortError') {
        onUpdateMessages([...history, { role: 'assistant', content: `⚠️ Error: ${err.message}`, timestamp: Date.now() }]);
      }
    } finally {
      setIsStreaming(false);
    }
  };

  const handleSendMessage = useCallback(async () => {
    if ((!inputValue.trim() && attachments.length === 0) || isStreaming || !isConnected || !settings.currentModel) return;
    let finalContent: MessageContentPart[] = [];
    let combinedText = inputValue;
    for (const att of attachments) {
      if (att.type === 'file' && att.content) {
        combinedText = `File Context [${att.file.name}]:\n\`\`\`\n${att.content}\n\`\`\`\n\n${combinedText}`;
      }
    }
    if (combinedText.trim()) {
      finalContent.push({ type: 'text', text: combinedText });
    }
    for (const att of attachments) {
      if (att.type === 'image') {
        const b64 = await fileToBase64(att.file);
        finalContent.push({ type: 'image_url', image_url: { url: b64 } });
      }
    }
    const userMsg: Message = { 
      role: 'user', 
      content: finalContent.length === 1 && finalContent[0].type === 'text' ? finalContent[0].text! : finalContent,
      timestamp: Date.now()
    };
    const newMessages = [...chat.messages, userMsg];
    onUpdateMessages(newMessages);
    setInputValue('');
    setAttachments([]);
    // Immediately stick to bottom when sending
    setIsAtBottom(true);
    scrollToBottom('smooth');
    await fetchStreamResponse(newMessages);
  }, [inputValue, attachments, isStreaming, isConnected, chat.messages, onUpdateMessages, settings, scrollToBottom]);

  const handleStartEdit = (index: number) => {
    const msg = chat.messages[index];
    let text = '';
    if (typeof msg.content === 'string') {
      text = msg.content;
    } else {
      const textPart = msg.content.find(p => p.type === 'text');
      text = textPart?.text || '';
    }
    setEditingIndex(index);
    setEditValue(text);
    setTimeout(() => {
      if (editInputRef.current) {
        editInputRef.current.style.height = 'auto';
        editInputRef.current.style.height = editInputRef.current.scrollHeight + 'px';
        editInputRef.current.focus();
      }
    }, 10);
  };

  const handleCancelEdit = () => {
    setEditingIndex(null);
    setEditValue('');
  };

  const handleSaveEdit = async () => {
    if (editingIndex === null || !editValue.trim() || isStreaming) return;
    const originalMsg = chat.messages[editingIndex];
    let newContent: string | MessageContentPart[] = editValue;
    if (Array.isArray(originalMsg.content)) {
      const parts: MessageContentPart[] = [{ type: 'text', text: editValue }];
      originalMsg.content.forEach(p => { if (p.type === 'image_url') parts.push(p); });
      newContent = parts;
    }
    const updatedMessages = [...chat.messages.slice(0, editingIndex)];
    updatedMessages.push({ ...originalMsg, content: newContent, timestamp: Date.now() });
    setEditingIndex(null);
    setEditValue('');
    onUpdateMessages(updatedMessages);
    setIsAtBottom(true);
    await fetchStreamResponse(updatedMessages);
  };

  const renderMessageContent = (msg: Message, isEditing: boolean) => {
    if (isEditing) {
      return (
        <div className="flex flex-col gap-3 w-full">
          <textarea
            ref={editInputRef}
            value={editValue}
            onChange={(e) => {
              setEditValue(e.target.value);
              e.target.style.height = 'auto';
              e.target.style.height = e.target.scrollHeight + 'px';
            }}
            className="w-full bg-black/20 border border-white/10 rounded-xl p-3 outline-none text-[15px] custom-scrollbar focus:ring-1 focus:ring-indigo-500/50 resize-none min-h-[80px]"
            onKeyDown={(e) => {
              if (e.key === 'Enter' && !e.shiftKey) {
                e.preventDefault();
                handleSaveEdit();
              }
              if (e.key === 'Escape') handleCancelEdit();
            }}
          />
          <div className="flex justify-end gap-2">
            <button onClick={handleCancelEdit} className="px-3 py-1.5 rounded-lg text-xs font-bold text-zinc-400 hover:text-white hover:bg-white/5 transition-all">CANCEL</button>
            <button onClick={handleSaveEdit} className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-indigo-600 text-white text-xs font-bold hover:bg-indigo-500 transition-all shadow-lg shadow-indigo-600/20">
              <Check size={14} /> SAVE & SUBMIT
            </button>
          </div>
        </div>
      );
    }
    if (typeof msg.content === 'string') {
      return <div className="prose prose-invert max-w-none" dangerouslySetInnerHTML={renderMarkdown(msg.content)} />;
    }
    return (
      <div className="space-y-4">
        {msg.content.map((part, i) => {
          if (part.type === 'text') return <div key={i} className="prose prose-invert max-w-none" dangerouslySetInnerHTML={renderMarkdown(part.text || '')} />;
          if (part.type === 'image_url') return <img key={i} src={part.image_url?.url} alt="User Upload" className="max-w-full max-h-[320px] rounded-xl border border-white/10 shadow-xl object-contain" />;
          return null;
        })}
      </div>
    );
  };

  const renderMarkdown = (content: string) => {
    if (!content) return { __html: '' };
    const renderer = new marked.Renderer();
    renderer.code = (code: string, language: string) => {
      const validLang = language && hljs.getLanguage(language) ? language : 'plaintext';
      let highlighted = code;
      try { highlighted = hljs.highlight(code, { language: validLang }).value; } catch (e) { highlighted = code; }
      const encodedCode = btoa(unescape(encodeURIComponent(code)));
      return `
        <div class="code-block-wrapper relative group my-6">
          <div class="absolute top-0 right-0 flex items-center gap-2 p-3 opacity-0 group-hover:opacity-100 transition-all z-20">
             <span class="text-[10px] font-mono font-bold text-zinc-500 uppercase tracking-widest bg-zinc-900/50 px-2 py-1 rounded-md border border-white/5 backdrop-blur-md">${validLang}</span>
             <button class="copy-code-btn p-2 rounded-xl bg-zinc-900/80 hover:bg-zinc-800 text-zinc-500 hover:text-white transition-all border border-white/5 shadow-lg backdrop-blur-md" data-code="${encodedCode}" title="Copy code">
              <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round" class="lucide lucide-copy"><rect width="14" height="14" x="8" y="8" rx="2" ry="2"/><path d="M4 16c-1.1 0-2-.9-2-2V4c0-1.1.9-2 2-2h10c1.1 0 2 .9 2 2"/></svg>
            </button>
          </div>
          <pre class="hljs language-${validLang} !m-0 !rounded-2xl border border-white/5 shadow-xl"><code>${highlighted}</code></pre>
        </div>
      `;
    };
    try { return { __html: marked.parse(content, { renderer }) }; } catch (e) { return { __html: content }; }
  };

  return (
    <div className="flex-1 flex flex-col min-w-0 h-[100dvh] relative overflow-hidden bg-[#050505]">
      {/* Header Info */}
      <div className="h-16 glass-strong z-20 flex items-center justify-between px-6 border-b border-white/[0.05] shrink-0">
        <div className="flex items-center gap-3">
          {!isSidebarOpen && (
            <button onClick={onToggleSidebar} className="p-2 -ml-2 text-zinc-500 hover:text-white transition-colors" title="Expand Sidebar">
              <PanelLeftOpen size={20} />
            </button>
          )}
          <div className="p-2 rounded-lg bg-indigo-500/10 text-indigo-400">
            <Sparkles size={16} />
          </div>
          <div className="min-w-0">
            <h2 className="text-sm font-semibold truncate max-w-[150px] md:max-w-md" style={{ color: 'var(--text-primary)' }}>{chat.name}</h2>
            <p className="text-[10px] text-zinc-500 font-mono uppercase tracking-tighter truncate max-w-[150px]">{settings.currentModel || 'No Model Loaded'}</p>
          </div>
        </div>
        <div className="flex items-center gap-2">
           <button className="p-2 text-zinc-500 hover:text-white transition-colors"><ChevronDown size={18} /></button>
        </div>
      </div>

      {/* Message List - Now constrained by the fixed bottom area */}
      <div className="flex-1 relative overflow-hidden flex flex-col">
        <div 
          ref={scrollRef} 
          onScroll={handleScroll}
          className="flex-1 overflow-y-auto custom-scrollbar pt-6 pb-4 relative touch-pan-y"
        >
          <div className="max-w-3xl mx-auto px-4 md:px-8 space-y-12 pb-10">
            {chat.messages.length === 0 && !isStreaming && (
              <div className="flex flex-col items-center justify-center py-20 text-center space-y-4">
                 <div className="w-16 h-16 rounded-full glass flex items-center justify-center text-zinc-700"><Terminal size={32} /></div>
                 <div>
                   <h3 className="font-medium" style={{ color: 'var(--text-primary)' }}>Empty Thread</h3>
                   <p className="text-sm text-zinc-500">Ask your local intelligence anything.</p>
                 </div>
              </div>
            )}
            
            {chat.messages.map((msg, idx) => (
              <div key={idx} className={`flex gap-3 md:gap-5 group animate-in fade-in slide-in-from-bottom-2 duration-500 ${msg.role === 'user' ? 'flex-row-reverse' : ''}`}>
                <div className={`flex-shrink-0 w-8 h-8 rounded-xl flex items-center justify-center shadow-sm mt-1 transition-transform group-hover:scale-110 ${msg.role === 'user' ? 'bg-indigo-600 text-white ring-1 ring-white/20' : 'bg-white/[0.03] text-indigo-400 border border-white/10'}`}>
                  {msg.role === 'user' ? <User size={16} /> : <Zap size={16} />}
                </div>
                <div className={`flex-1 min-w-0 ${msg.role === 'user' ? 'text-right' : 'text-left'}`}>
                  <div className="relative inline-block max-w-full md:max-w-[92%]">
                    <div className={`px-4 py-3 md:px-5 md:py-4 rounded-2xl text-[14px] md:text-[15px] transition-all w-full text-left ${msg.role === 'user' ? 'bg-zinc-100 dark:bg-zinc-900/40 text-zinc-900 dark:text-zinc-100 border-r-2 border-indigo-500 shadow-sm' : 'bg-zinc-50 dark:bg-white/[0.02] text-zinc-800 dark:text-zinc-200 border border-black/5 dark:border-white/5'}`}>
                      {renderMessageContent(msg, editingIndex === idx)}
                    </div>
                    <div className={`mt-1.5 flex items-center gap-3 transition-opacity duration-300 opacity-20 group-hover:opacity-100 ${msg.role === 'user' ? 'flex-row-reverse' : 'flex-row'}`}>
                      {msg.timestamp && <span className="text-[10px] font-mono text-zinc-500 tabular-nums">{formatTime(msg.timestamp)}</span>}
                      {msg.role === 'user' && editingIndex === null && !isStreaming && (
                        <button onClick={() => handleStartEdit(idx)} className="p-1 text-zinc-500 hover:text-white hover:bg-white/5 rounded transition-all hidden md:block" title="Edit message"><Pencil size={12} /></button>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            ))}
            {isStreaming && (
              <div className="flex gap-5 animate-in fade-in">
                <div className="flex-shrink-0 w-8 h-8 rounded-xl bg-white/[0.03] text-indigo-400 border border-white/10 flex items-center justify-center mt-1"><Zap size={16} className="animate-pulse" /></div>
                <div className="bg-zinc-50 dark:bg-white/[0.02] border border-black/5 dark:border-white/5 rounded-2xl px-5 py-4 flex gap-1.5 items-center">
                  <div className="typing-dot" style={{animationDelay: '0s'}}></div>
                  <div className="typing-dot" style={{animationDelay: '0.2s'}}></div>
                  <div className="typing-dot" style={{animationDelay: '0.4s'}}></div>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Floating Scroll Down Button - Now anchored within history container */}
        {!isAtBottom && (
          <div className="absolute bottom-6 right-6 md:right-12 z-40 animate-in fade-in slide-in-from-bottom-2 duration-300">
            <button 
              onClick={() => {
                setIsAtBottom(true);
                scrollToBottom('smooth');
              }}
              className="p-3 glass-strong rounded-full border-white/10 text-zinc-400 hover:text-white hover:bg-indigo-500/10 transition-all shadow-xl flex items-center justify-center active:scale-90"
            >
              <ArrowDown size={20} className={isStreaming ? "animate-bounce" : ""} />
            </button>
          </div>
        )}
      </div>

      {/* Solid Bottom Area: Controls + Disclaimer */}
      <div className={`w-full bg-[#050505] border-t border-white/[0.05] p-4 md:p-6 transition-all ${editingIndex !== null ? 'opacity-30 blur-[2px]' : ''}`}>
        <div className="max-w-3xl mx-auto space-y-4">
          {/* Attachments Preview */}
          {attachments.length > 0 && (
            <div className="flex flex-wrap gap-2 mb-2 animate-in slide-in-from-bottom-4 duration-300">
              {attachments.map(att => (
                <div key={att.id} className="relative group p-1.5 glass rounded-2xl border-white/10 flex items-center gap-2.5 pr-8 bg-zinc-900/80">
                  {att.type === 'image' ? <img src={att.previewUrl} className="w-9 h-9 object-cover rounded-lg border border-white/10" alt="Preview" /> : <div className="w-9 h-9 rounded-lg bg-indigo-500/10 text-indigo-400 flex items-center justify-center"><FileText size={16} /></div>}
                  <div className="flex flex-col pr-2">
                    <span className="text-[10px] text-zinc-200 font-semibold truncate max-w-[120px]">{att.file.name}</span>
                    <span className="text-[8px] text-zinc-500 font-mono uppercase tracking-tighter">{(att.file.size / 1024).toFixed(1)} KB</span>
                  </div>
                  <button onClick={() => removeAttachment(att.id)} className="absolute right-1.5 p-1.5 text-zinc-500 hover:text-rose-400 bg-white/5 rounded-full transition-colors"><X size={12} /></button>
                </div>
              ))}
            </div>
          )}

          {/* Input Pill */}
          <div className={`glass relative flex flex-col border-white/10 rounded-3xl overflow-hidden shadow-2xl transition-all duration-300 ${isStreaming ? 'ring-1 ring-white/10 opacity-90' : 'bg-zinc-50/90 dark:bg-[#0a0a0a]/80 focus-within:ring-2 focus-within:ring-indigo-500/40 ring-1 ring-black/5 dark:ring-white/5'}`}>
            <textarea
              ref={inputRef}
              rows={1}
              value={inputValue}
              onChange={(e) => setInputValue(e.target.value)}
              onPaste={handlePaste}
              onKeyDown={(e) => e.key === 'Enter' && !e.shiftKey && (e.preventDefault(), handleSendMessage())}
              disabled={isStreaming || !isConnected || editingIndex !== null}
              placeholder={isConnected ? (isStreaming ? "Synthesizing response..." : (editingIndex !== null ? "Complete your edit above..." : "Ask your local model...")) : "Engine offline - Check system config"}
              className="w-full bg-transparent px-5 md:px-6 py-4 md:py-5 outline-none resize-none min-h-[56px] md:min-h-[64px] max-h-[150px] md:max-h-[200px] text-[14px] md:text-[15px] custom-scrollbar"
              style={{ color: 'var(--text-primary)' }}
              onInput={(e) => { (e.target as any).style.height = 'auto'; (e.target as any).style.height = (e.target as any).scrollHeight + 'px'; }}
            />
            <div className="flex items-center justify-between px-3 md:px-4 pb-3 md:pb-4 pt-1">
              <div className="flex items-center gap-1">
                <input type="file" ref={fileInputRef} className="hidden" onChange={handleFileSelect} multiple accept="image/*,.txt,.md,.js,.ts,.json,.html,.css,.py,.rs,.go" />
                <button onClick={() => fileInputRef.current?.click()} disabled={isStreaming || !isConnected || editingIndex !== null} title="Upload Image/File" className="p-2 md:p-2.5 text-zinc-500 hover:text-indigo-500 dark:hover:text-white transition-all hover:bg-black/5 dark:hover:bg-white/5 rounded-xl active:scale-90"><Paperclip size={18} /></button>
                <button onClick={() => fileInputRef.current?.click()} disabled={isStreaming || !isConnected || editingIndex !== null} className="p-2 md:p-2.5 text-zinc-500 hover:text-indigo-500 dark:hover:text-white transition-all hover:bg-black/5 dark:hover:bg-white/5 rounded-xl active:scale-90"><ImageIcon size={18} /></button>
              </div>
              <div className="flex items-center gap-2 md:gap-3">
                {isStreaming ? (
                  <button onClick={handleStopStreaming} className="flex items-center gap-2 px-3 md:px-4 py-1.5 md:py-2 rounded-xl bg-rose-500/10 text-rose-400 hover:bg-rose-500/20 transition-all border border-rose-500/20 active:scale-95 text-[10px] md:text-xs font-bold"><Square size={12} fill="currentColor" />STOP</button>
                ) : (
                  <button onClick={handleSendMessage} disabled={(!inputValue.trim() && attachments.length === 0) || !isConnected || editingIndex !== null} className={`w-9 h-9 md:w-10 md:h-10 flex items-center justify-center rounded-2xl transition-all duration-300 ${(inputValue.trim() || attachments.length > 0) && isConnected && editingIndex === null ? 'bg-indigo-600 text-white shadow-lg shadow-indigo-600/30 hover:scale-105 active:scale-90' : 'bg-zinc-200 dark:bg-zinc-800 text-zinc-400 dark:text-zinc-600 opacity-50'}`}><Send size={16} /></button>
                )}
              </div>
            </div>
          </div>

          {/* New Disclaimer Footer */}
          <p className="text-[10px] md:text-[11px] text-zinc-600 text-center font-medium">
            Yukime 1.5-alpha.4 by <a href="https://www.rickelindustries.co.ke" target="_blank" rel="noopener noreferrer" className="text-blue-500 hover:text-blue-400 hover:underline transition-all">Rickel Industries</a>. 
            Yukime can make mistakes. Verify important info.
          </p>
        </div>
      </div>
    </div>
  );
};

export default ChatArea;
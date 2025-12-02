import React, { useState, useEffect, useRef } from 'react';
import { 
  Send, Bot, User, Plus, PanelLeftClose, PanelLeftOpen, 
  MoreHorizontal, Sparkles, BookOpen, BrainCircuit, Copy, Check
} from 'lucide-react';
import { createClient } from '@supabase/supabase-js';

// --- Supabase Setup ---
const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!, 
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
);

// --- Types ---
interface Message {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  created_at: string;
  status?: 'sending' | 'sent' | 'error';
}

interface Session {
  id: string;
  title: string;
  updated_at: string;
}

export default function AIAgentInterfaceNew() {
  // --- State ---
  const [sessions, setSessions] = useState<Session[]>([]);
  const [currentSessionId, setCurrentSessionId] = useState<string | null>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState('');
  const [isSidebarOpen, setSidebarOpen] = useState(true);
  const [isTyping, setIsTyping] = useState(false);
  
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  // --- Effects ---
  useEffect(() => { fetchSessions(); }, []);

  useEffect(() => {
    if (currentSessionId) fetchMessages(currentSessionId);
    else setMessages([]);
  }, [currentSessionId]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, isTyping]);

  // Auto-resize textarea
  useEffect(() => {
    if (textareaRef.current) {
      textareaRef.current.style.height = 'auto';
      textareaRef.current.style.height = `${Math.min(textareaRef.current.scrollHeight, 200)}px`;
    }
  }, [input]);

  // --- Data Logic ---
  const fetchSessions = async () => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;
    const { data } = await supabase
      .from('tutor_sessions')
      .select('id, topic, created_at')
      .eq('user_id', user.id)
      .order('created_at', { ascending: false });
    
    if (data) {
      setSessions(data.map(s => ({ id: s.id, title: s.topic, updated_at: s.created_at })));
      if (data.length > 0 && !currentSessionId) setCurrentSessionId(data[0].id);
    }
  };

  const fetchMessages = async (sessionId: string) => {
    const { data } = await supabase
      .from('ai_tutor_interactions')
      .select('*')
      .eq('session_id', sessionId)
      .order('created_at', { ascending: true });

    if (data) {
      setMessages(data.flatMap(item => [
        { id: `${item.id}-req`, role: 'user', content: item.student_input, created_at: item.created_at },
        { id: `${item.id}-res`, role: 'assistant', content: item.ai_response, created_at: item.created_at }
      ]));
    }
  };

  const handleSend = async (overrideText?: string) => {
    const text = overrideText || input;
    if (!text.trim() || !currentSessionId) return;

    const tempId = crypto.randomUUID();
    const newMsg: Message = { id: tempId, role: 'user', content: text, created_at: new Date().toISOString(), status: 'sending' };
    
    setMessages(prev => [...prev, newMsg]);
    setInput('');
    setIsTyping(true);
    if (textareaRef.current) textareaRef.current.style.height = 'auto'; // Reset height

    try {
      const { data, error } = await supabase.functions.invoke('gemini-chat', {
        body: { prompt: text, sessionId: currentSessionId }
      });
      if (error) throw error;

      setMessages(prev => prev.map(m => m.id === tempId ? { ...m, status: 'sent' } : m).concat({
        id: crypto.randomUUID(), role: 'assistant', content: data.response, created_at: new Date().toISOString()
      }));
    } catch (e) {
      setMessages(prev => prev.map(m => m.id === tempId ? { ...m, status: 'error' } : m));
    } finally {
      setIsTyping(false);
    }
  };

  const createNewChat = async () => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;
    const { data } = await supabase.from('tutor_sessions').insert({ user_id: user.id, topic: 'New Chat', status: 'active' }).select().single();
    if (data) {
      setSessions(prev => [{ id: data.id, title: 'New Chat', updated_at: data.created_at }, ...prev]);
      setCurrentSessionId(data.id);
    }
  };

  return (
    <div className="flex h-screen bg-white text-zinc-900 font-sans overflow-hidden">
      
      {/* --- Minimal Sidebar --- */}
      <aside className={`${isSidebarOpen ? 'w-[260px] translate-x-0' : 'w-0 -translate-x-full opacity-0'} bg-zinc-50 border-r border-zinc-200 transition-all duration-300 ease-in-out flex flex-col z-20`}>
        <div className="p-3">
          <button onClick={createNewChat} className="flex items-center gap-3 w-full px-3 py-3 bg-white hover:bg-zinc-100 border border-zinc-200 rounded-lg text-sm text-zinc-700 transition-colors shadow-sm text-left">
             <Plus className="w-4 h-4 text-zinc-500" />
             <span className="font-medium">New chat</span>
          </button>
        </div>

        <div className="flex-1 overflow-y-auto px-3 py-2 space-y-1">
          <p className="px-3 text-xs font-medium text-zinc-400 mb-2">Recent</p>
          {sessions.map(s => (
            <button 
              key={s.id}
              onClick={() => setCurrentSessionId(s.id)}
              className={`w-full text-left px-3 py-2 rounded-lg text-sm truncate transition-colors ${
                currentSessionId === s.id ? 'bg-zinc-200/60 text-zinc-900' : 'text-zinc-600 hover:bg-zinc-100'
              }`}
            >
              {s.title}
            </button>
          ))}
        </div>
        
        <div className="p-4 border-t border-zinc-200">
           <div className="flex items-center gap-3 px-2">
             <div className="w-8 h-8 rounded-full bg-zinc-300 flex items-center justify-center text-zinc-600 text-xs font-bold">JD</div>
             <div className="text-sm font-medium text-zinc-700">John Doe</div>
           </div>
        </div>
      </aside>

      {/* --- Main Stage --- */}
      <main className="flex-1 flex flex-col relative w-full h-full bg-white">
        
        {/* Sticky Header (Minimal) */}
        <header className="h-14 flex items-center justify-between px-4 sticky top-0 bg-white/90 backdrop-blur-sm z-10">
          <div className="flex items-center gap-2">
            <button onClick={() => setSidebarOpen(!isSidebarOpen)} className="p-2 text-zinc-400 hover:text-zinc-600 hover:bg-zinc-100 rounded-lg">
              {isSidebarOpen ? <PanelLeftClose className="w-5 h-5" /> : <PanelLeftOpen className="w-5 h-5" />}
            </button>
            <span className="text-sm font-semibold text-zinc-500">AdaptiveEd <span className="text-zinc-300">3.5</span></span>
          </div>
        </header>

        {/* Conversation Stream */}
        <div className="flex-1 overflow-y-auto px-4 pb-32 pt-4 scroll-smooth">
          <div className="max-w-3xl mx-auto space-y-6"> {/* Central Column */}
            
            {/* Empty State */}
            {messages.length === 0 && (
              <div className="flex flex-col items-center justify-center h-[50vh] text-center space-y-6">
                <div className="w-12 h-12 bg-white border border-zinc-200 rounded-full flex items-center justify-center shadow-sm">
                  <Sparkles className="w-6 h-6 text-zinc-400" />
                </div>
                <h2 className="text-2xl font-semibold text-zinc-800">How can I help you today?</h2>
                <div className="grid grid-cols-2 gap-3 w-full max-w-lg">
                   {['Explain Quantum Physics', 'Quiz me on Calculus', 'Summarize my notes', 'Study plan for finals'].map((txt) => (
                     <button key={txt} onClick={() => handleSend(txt)} className="p-3 text-sm text-zinc-600 border border-zinc-200 rounded-xl hover:bg-zinc-50 text-left transition-colors">
                       {txt}
                     </button>
                   ))}
                </div>
              </div>
            )}

            {/* Messages */}
            {messages.map((msg) => (
              <div key={msg.id} className={`flex gap-4 ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
                
                {/* AI Avatar */}
                {msg.role === 'assistant' && (
                  <div className="w-8 h-8 rounded-full border border-zinc-200 flex items-center justify-center flex-shrink-0 bg-white mt-1">
                    <Bot className="w-5 h-5 text-zinc-600" />
                  </div>
                )}

                {/* Content Bubble */}
                <div className={`relative max-w-[85%] ${
                  msg.role === 'user' 
                    ? 'bg-zinc-100 text-zinc-800 px-5 py-3 rounded-3xl rounded-tr-sm' 
                    : 'text-zinc-800 px-0 py-2 w-full' // "Invisible" look for AI
                }`}>
                  <div className="prose prose-zinc prose-sm max-w-none leading-relaxed whitespace-pre-wrap">
                    {msg.content}
                  </div>
                  
                  {/* Subtle AI Actions */}
                  {msg.role === 'assistant' && (
                    <div className="flex gap-2 mt-2 opacity-0 group-hover:opacity-100 transition-opacity">
                      <Copy className="w-3 h-3 text-zinc-400 cursor-pointer hover:text-zinc-600" />
                    </div>
                  )}
                </div>
              </div>
            ))}

            {/* Loading Indicator */}
            {isTyping && (
              <div className="flex gap-4">
                 <div className="w-8 h-8 rounded-full border border-zinc-200 flex items-center justify-center flex-shrink-0 bg-white">
                    <Bot className="w-5 h-5 text-zinc-600" />
                 </div>
                 <div className="flex items-center gap-1 mt-3">
                   <span className="w-2 h-2 bg-zinc-300 rounded-full animate-bounce" />
                   <span className="w-2 h-2 bg-zinc-300 rounded-full animate-bounce delay-75" />
                   <span className="w-2 h-2 bg-zinc-300 rounded-full animate-bounce delay-150" />
                 </div>
              </div>
            )}
            <div ref={messagesEndRef} />
          </div>
        </div>

        {/* Input Island (Floating) */}
        <div className="absolute bottom-0 left-0 w-full bg-gradient-to-t from-white via-white to-transparent pt-10 pb-6 px-4">
          <div className="max-w-3xl mx-auto relative">
            <div className="relative flex items-end bg-white border border-zinc-300 rounded-3xl shadow-lg shadow-zinc-200/50 overflow-hidden ring-offset-2 focus-within:ring-2 ring-zinc-200/50 transition-all">
              <textarea
                ref={textareaRef}
                value={input}
                onChange={(e) => setInput(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && !e.shiftKey && (e.preventDefault(), handleSend())}
                placeholder="Message AdaptiveEd..."
                className="w-full max-h-[200px] py-3.5 pl-4 pr-12 bg-transparent border-none focus:ring-0 resize-none text-zinc-800 placeholder:text-zinc-400 leading-relaxed"
                rows={1}
                disabled={isTyping}
              />
              <button 
                onClick={() => handleSend()}
                disabled={!input.trim() || isTyping}
                className={`absolute right-2 bottom-2 p-2 rounded-full transition-all ${
                  input.trim() 
                    ? 'bg-zinc-900 text-white hover:bg-zinc-700' 
                    : 'bg-zinc-100 text-zinc-300 cursor-not-allowed'
                }`}
              >
                <Send className="w-4 h-4" />
              </button>
            </div>
            <p className="text-center text-[11px] text-zinc-400 mt-2">
              AdaptiveEd can make mistakes. Consider checking important information.
            </p>
          </div>
        </div>

      </main>
    </div>
  );
}
export default AIAgentInterfaceNew;
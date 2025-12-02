import React, { useState, useEffect, useRef } from 'react';
import { 
  Send, Bot, User, Plus, MessageSquare, 
  PanelLeftClose, PanelLeftOpen, MoreHorizontal, 
  ThumbsUp, ThumbsDown, Sparkles, BookOpen, BrainCircuit 
} from 'lucide-react';
import { createClient } from '@supabase/supabase-js';

// --- Configuration & Types ---
// Ideally, move these to a shared types file
interface Message {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  created_at: string;
  status?: 'sending' | 'sent' | 'error';
  feedback?: 'positive' | 'negative' | null;
}

interface Session {
  id: string;
  title: string;
  updated_at: string;
}

// Initialize Supabase (Replace with your hook/context)
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;
const supabase = createClient(supabaseUrl, supabaseKey);

export default function AIAgentInterfaceNew() {
  // --- State ---
  const [sessions, setSessions] = useState<Session[]>([]);
  const [currentSessionId, setCurrentSessionId] = useState<string | null>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState('');
  const [isSidebarOpen, setSidebarOpen] = useState(true);
  const [isTyping, setIsTyping] = useState(false);
  
  const messagesEndRef = useRef<HTMLDivElement>(null);

  // --- Effects ---

  // 1. Load Sessions on Mount
  useEffect(() => {
    fetchSessions();
  }, []);

  // 2. Load Messages when Session Changes
  useEffect(() => {
    if (currentSessionId) {
      fetchMessages(currentSessionId);
    } else {
      setMessages([]);
    }
  }, [currentSessionId]);

  // 3. Auto-scroll
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, isTyping]);

  // --- Actions ---

  const fetchSessions = async () => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;

    const { data } = await supabase
      .from('tutor_sessions')
      .select('id, topic, created_at')
      .eq('user_id', user.id)
      .order('created_at', { ascending: false });

    if (data) {
      const formatted: Session[] = data.map(s => ({
        id: s.id,
        title: s.topic || 'New Chat',
        updated_at: s.created_at
      }));
      setSessions(formatted);
      if (formatted.length > 0 && !currentSessionId) {
        setCurrentSessionId(formatted[0].id);
      }
    }
  };

  const fetchMessages = async (sessionId: string) => {
    const { data } = await supabase
      .from('ai_tutor_interactions')
      .select('*')
      .eq('session_id', sessionId)
      .order('created_at', { ascending: true });

    if (data) {
      const formatted: Message[] = data.flatMap(item => [
        { 
          id: item.id + '-req', 
          role: 'user', 
          content: item.student_input, 
          created_at: item.created_at 
        },
        { 
          id: item.id + '-res', 
          role: 'assistant', 
          content: item.ai_response, 
          created_at: item.created_at 
        }
      ]);
      setMessages(formatted);
    }
  };

  const createNewChat = async () => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;

    // Create a generic session
    const { data, error } = await supabase
      .from('tutor_sessions')
      .insert({ user_id: user.id, topic: 'New Conversation', status: 'active' })
      .select()
      .single();

    if (data) {
      const newSession: Session = { id: data.id, title: 'New Conversation', updated_at: data.created_at };
      setSessions([newSession, ...sessions]);
      setCurrentSessionId(data.id);
      setMessages([]); // Clear chat view
    }
  };

  const sendMessage = async (textOverride?: string) => {
    const textToSend = textOverride || input;
    if (!textToSend.trim() || !currentSessionId) return;

    // 1. Optimistic UI
    const optimisticId = crypto.randomUUID();
    const newUserMsg: Message = {
      id: optimisticId,
      role: 'user',
      content: textToSend,
      created_at: new Date().toISOString(),
      status: 'sending'
    };

    setMessages(prev => [...prev, newUserMsg]);
    setInput('');
    setIsTyping(true);

    try {
      // 2. Call Edge Function
      const { data, error } = await supabase.functions.invoke('gemini-chat', {
        body: { prompt: textToSend, sessionId: currentSessionId }
      });

      if (error) throw error;

      // 3. Update UI with Response
      const newAiMsg: Message = {
        id: crypto.randomUUID(),
        role: 'assistant',
        content: data.response,
        created_at: new Date().toISOString(),
      };

      setMessages(prev => 
        prev.map(m => m.id === optimisticId ? { ...m, status: 'sent' } : m)
            .concat(newAiMsg)
      );

      // (Optional) Rename session if it's the first message
      if (messages.length === 0) {
        updateSessionTitle(currentSessionId, textToSend);
      }

    } catch (err) {
      console.error(err);
      setMessages(prev => prev.map(m => m.id === optimisticId ? { ...m, status: 'error' } : m));
    } finally {
      setIsTyping(false);
    }
  };

  const updateSessionTitle = async (sessionId: string, firstMessage: string) => {
    // Simple heuristic: Take first 5 words
    const newTitle = firstMessage.split(' ').slice(0, 5).join(' ') + '...';
    await supabase.from('tutor_sessions').update({ topic: newTitle }).eq('id', sessionId);
    setSessions(prev => prev.map(s => s.id === sessionId ? { ...s, title: newTitle } : s));
  };

  // --- Render Helpers ---

  const QuickAction = ({ icon: Icon, label, prompt }: { icon: any, label: string, prompt: string }) => (
    <button 
      onClick={() => sendMessage(prompt)}
      className="flex items-center gap-2 px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-200 rounded-full hover:bg-gray-50 hover:border-indigo-200 transition-all shadow-sm"
    >
      <Icon className="w-4 h-4 text-indigo-500" />
      {label}
    </button>
  );

  return (
    <div className="flex h-screen bg-gray-50 text-gray-900 font-sans overflow-hidden">
      
      {/* --- Sidebar --- */}
      <aside 
        className={`
          flex flex-col bg-white border-r border-gray-200 transition-all duration-300 ease-in-out
          ${isSidebarOpen ? 'w-64 translate-x-0' : 'w-0 -translate-x-full opacity-0 overflow-hidden'}
        `}
      >
        <div className="p-4 border-b border-gray-100 flex items-center justify-between">
          <h2 className="font-bold text-lg text-gray-800 flex items-center gap-2">
            <Sparkles className="w-5 h-5 text-indigo-600" />
            AdaptiveEd
          </h2>
          <button onClick={createNewChat} className="p-2 hover:bg-gray-100 rounded-lg" title="New Chat">
            <Plus className="w-5 h-5 text-gray-600" />
          </button>
        </div>

        <div className="flex-1 overflow-y-auto p-3 space-y-1">
          <p className="text-xs font-semibold text-gray-400 uppercase px-3 mb-2 tracking-wider">Recent</p>
          {sessions.map(session => (
            <button
              key={session.id}
              onClick={() => setCurrentSessionId(session.id)}
              className={`w-full text-left px-3 py-2.5 rounded-lg text-sm truncate flex items-center gap-3 transition-colors ${
                currentSessionId === session.id 
                  ? 'bg-indigo-50 text-indigo-700 font-medium' 
                  : 'text-gray-600 hover:bg-gray-100'
              }`}
            >
              <MessageSquare className="w-4 h-4 flex-shrink-0 opacity-70" />
              <span className="truncate">{session.title}</span>
            </button>
          ))}
        </div>

        <div className="p-4 border-t border-gray-100">
           {/* User Profile Snippet could go here */}
           <div className="flex items-center gap-3 text-sm text-gray-600">
              <div className="w-8 h-8 rounded-full bg-indigo-100 flex items-center justify-center">
                <User className="w-4 h-4 text-indigo-600" />
              </div>
              <div className="flex-1">
                <p className="font-medium">Student Account</p>
              </div>
           </div>
        </div>
      </aside>


      {/* --- Main Chat Area --- */}
      <main className="flex-1 flex flex-col relative w-full h-full">
        
        {/* Top Navigation */}
        <header className="h-16 border-b border-gray-200 bg-white/80 backdrop-blur-md flex items-center justify-between px-4 z-10 sticky top-0">
          <div className="flex items-center gap-3">
            <button 
              onClick={() => setSidebarOpen(!isSidebarOpen)}
              className="p-2 hover:bg-gray-100 rounded-lg text-gray-600"
            >
              {isSidebarOpen ? <PanelLeftClose className="w-5 h-5" /> : <PanelLeftOpen className="w-5 h-5" />}
            </button>
            <div className="flex flex-col">
              <h3 className="font-semibold text-gray-800 leading-tight">
                {sessions.find(s => s.id === currentSessionId)?.title || 'New Chat'}
              </h3>
              <span className="text-xs text-green-600 flex items-center gap-1">
                <span className="w-1.5 h-1.5 rounded-full bg-green-500"></span>
                AI Agent Active
              </span>
            </div>
          </div>
          <button className="p-2 hover:bg-gray-100 rounded-lg text-gray-500">
            <MoreHorizontal className="w-5 h-5" />
          </button>
        </header>


        {/* Chat Feed */}
        <div className="flex-1 overflow-y-auto p-4 md:p-8 space-y-6 scroll-smooth bg-white">
          
          {/* Empty State / Welcome Screen */}
          {messages.length === 0 && (
            <div className="h-full flex flex-col items-center justify-center text-center opacity-0 animate-in fade-in slide-in-from-bottom-4 duration-700">
              <div className="w-16 h-16 bg-gradient-to-br from-indigo-100 to-purple-100 rounded-2xl flex items-center justify-center mb-6 shadow-sm">
                <Sparkles className="w-8 h-8 text-indigo-600" />
              </div>
              <h2 className="text-2xl font-bold text-gray-900 mb-2">How can I help you learn today?</h2>
              <p className="text-gray-500 max-w-md mb-8">I can explain complex topics, quiz you on your knowledge, or help you brainstorm ideas.</p>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3 w-full max-w-lg">
                <button onClick={() => sendMessage("Explain Quantum Physics like I'm 5")} className="p-4 bg-gray-50 hover:bg-gray-100 border border-gray-200 rounded-xl text-left transition-all hover:shadow-md group">
                  <div className="flex justify-between items-center mb-1">
                    <BookOpen className="w-5 h-5 text-indigo-500 group-hover:scale-110 transition-transform" />
                  </div>
                  <span className="text-sm font-medium text-gray-700">Explain a complex topic</span>
                </button>
                <button onClick={() => sendMessage("Quiz me on American History")} className="p-4 bg-gray-50 hover:bg-gray-100 border border-gray-200 rounded-xl text-left transition-all hover:shadow-md group">
                  <div className="flex justify-between items-center mb-1">
                    <BrainCircuit className="w-5 h-5 text-purple-500 group-hover:scale-110 transition-transform" />
                  </div>
                  <span className="text-sm font-medium text-gray-700">Quiz my knowledge</span>
                </button>
              </div>
            </div>
          )}

          {/* Messages */}
          {messages.map((msg, idx) => (
            <div 
              key={msg.id} 
              className={`flex gap-4 max-w-3xl mx-auto ${msg.role === 'user' ? 'justify-end' : ''}`}
            >
              {msg.role === 'assistant' && (
                <div className="w-8 h-8 rounded-full bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center flex-shrink-0 shadow-sm mt-1">
                  <Bot className="w-4 h-4 text-white" />
                </div>
              )}

              <div className={`space-y-1 ${msg.role === 'user' ? 'items-end flex flex-col' : ''}`}>
                <div 
                  className={`
                    p-4 rounded-2xl shadow-sm text-sm leading-relaxed whitespace-pre-wrap
                    ${msg.role === 'user' 
                      ? 'bg-indigo-600 text-white rounded-tr-sm' 
                      : 'bg-white border border-gray-100 text-gray-800 rounded-tl-sm'}
                    ${msg.status === 'error' ? 'border-red-500 bg-red-50 text-red-700' : ''}
                  `}
                >
                  {msg.content}
                </div>
                
                {/* Feedback Actions (Only for AI) */}
                {msg.role === 'assistant' && (
                  <div className="flex gap-2 pl-1 opacity-0 group-hover:opacity-100 transition-opacity">
                    <button className="p-1 text-gray-400 hover:text-green-500 hover:bg-green-50 rounded"><ThumbsUp className="w-3 h-3" /></button>
                    <button className="p-1 text-gray-400 hover:text-red-500 hover:bg-red-50 rounded"><ThumbsDown className="w-3 h-3" /></button>
                  </div>
                )}
              </div>

              {msg.role === 'user' && (
                <div className="w-8 h-8 rounded-full bg-gray-200 flex items-center justify-center flex-shrink-0 mt-1">
                  <User className="w-4 h-4 text-gray-600" />
                </div>
              )}
            </div>
          ))}

          {/* Typing Indicator */}
          {isTyping && (
             <div className="flex gap-4 max-w-3xl mx-auto">
                <div className="w-8 h-8 rounded-full bg-indigo-100 flex items-center justify-center flex-shrink-0">
                  <Bot className="w-4 h-4 text-indigo-600" />
                </div>
                <div className="px-4 py-3 bg-white border border-gray-100 rounded-2xl rounded-tl-sm shadow-sm flex items-center gap-1">
                  <span className="w-1.5 h-1.5 bg-gray-400 rounded-full animate-bounce"></span>
                  <span className="w-1.5 h-1.5 bg-gray-400 rounded-full animate-bounce delay-100"></span>
                  <span className="w-1.5 h-1.5 bg-gray-400 rounded-full animate-bounce delay-200"></span>
                </div>
             </div>
          )}

          <div ref={messagesEndRef} />
        </div>


        {/* Input Area */}
        <div className="p-4 bg-white border-t border-gray-100">
          <div className="max-w-3xl mx-auto space-y-3">
            
            {/* Quick Actions (Contextual) */}
            {messages.length > 0 && !isTyping && (
              <div className="flex gap-2 overflow-x-auto pb-1 scrollbar-hide">
                 <QuickAction icon={BookOpen} label="Explain deeper" prompt="Can you explain that in more detail?" />
                 <QuickAction icon={BrainCircuit} label="Give me a quiz" prompt="Quiz me on this topic." />
                 <QuickAction icon={Sparkles} label="Summarize" prompt="Summarize our conversation so far." />
              </div>
            )}

            {/* Main Input */}
            <div className="relative flex items-end gap-2 bg-gray-50 border border-gray-200 rounded-2xl p-2 focus-within:ring-2 focus-within:ring-indigo-100 focus-within:border-indigo-300 transition-all shadow-sm">
              <textarea
                value={input}
                onChange={(e) => setInput(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter' && !e.shiftKey) {
                    e.preventDefault();
                    sendMessage();
                  }
                }}
                placeholder="Message AdaptiveEd..."
                className="w-full bg-transparent border-none focus:ring-0 resize-none max-h-40 min-h-[44px] py-2.5 px-3 text-sm text-gray-800 placeholder:text-gray-400"
                rows={1}
                disabled={isTyping}
              />
              <button 
                onClick={() => sendMessage()}
                disabled={!input.trim() || isTyping}
                className={`
                  p-2.5 rounded-xl mb-0.5 transition-all duration-200 flex-shrink-0
                  ${!input.trim() || isTyping 
                    ? 'bg-gray-200 text-gray-400 cursor-not-allowed' 
                    : 'bg-indigo-600 text-white hover:bg-indigo-700 shadow-md hover:shadow-lg'}
                `}
              >
                <Send className="w-4 h-4" />
              </button>
            </div>
            
            <p className="text-center text-[10px] text-gray-400">
              AI can make mistakes. Please verify important information.
            </p>
          </div>
        </div>

      </main>
    </div>
  );
}
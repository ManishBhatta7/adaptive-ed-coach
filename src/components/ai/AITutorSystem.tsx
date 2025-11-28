import React, { useState, useRef, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Avatar } from '@/components/ui/avatar';
import { supabase } from '@/lib/supabase';
import { Send, Sparkles, User, Bot, Eraser, Brain, GraduationCap, Zap, Baby } from 'lucide-react';
import ReactMarkdown from 'react-markdown';
import { motion, AnimatePresence } from 'framer-motion';
import { useTranslation } from 'react-i18next';
import { useLocation } from 'react-router-dom';

interface Message {
  id: string;
  role: 'user' | 'model';
  content: string;
  timestamp: Date;
}

interface AITutorProps {
  studentProfile: any;
}

const AITutorSystem = ({ studentProfile }: AITutorProps) => {
  const { i18n } = useTranslation();
  const location = useLocation();
  
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [mode, setMode] = useState<'tutor' | 'coach' | 'socratic' | 'eli5'>('tutor');
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages, isLoading]);

  // === AUTO-MODE & CONTEXT HANDLER ===
  useEffect(() => {
    // 1. Hand-off from OCR or other tools
    if (location.state?.initialPrompt && messages.length === 0) {
      const { initialPrompt, contextData, mode: targetMode } = location.state;
      if (targetMode) setMode(targetMode);
      handleSend(initialPrompt, contextData);
      // Clear state to prevent loop
      window.history.replaceState({}, document.title);
    }
    // 2. Performance-based auto-mode
    else if (studentProfile?.performances?.length > 0 && messages.length === 0) {
      const lastScore = studentProfile.performances[0].score || 0;
      if (lastScore < 60) {
        setMode('coach');
        setMessages([{
          id: 'intro', role: 'model', timestamp: new Date(),
          content: `I saw your last score was ${lastScore}%. Don't worry! I'm here to help you bounce back. What topic was tricky?`
        }]);
      } else if (lastScore > 90) {
        setMode('socratic');
        setMessages([{
          id: 'intro', role: 'model', timestamp: new Date(),
          content: `Excellent work on your last assignment (${lastScore}%)! I've switched to Socratic mode to challenge you further.`
        }]);
      }
    }
  }, [studentProfile, location.state]);

  const handleSend = async (manualInput?: string, hiddenContext?: string) => {
    const textToSend = manualInput || input;
    if (!textToSend.trim()) return;

    const userMsg: Message = {
      id: Date.now().toString(),
      role: 'user',
      content: textToSend,
      timestamp: new Date()
    };

    setMessages(prev => [...prev, userMsg]);
    setInput('');
    setIsLoading(true);

    try {
      const history = messages.slice(-10).map(m => ({
        role: m.role,
        content: m.content
      }));

      // Inject hidden context if provided (from OCR)
      const fullContent = hiddenContext 
        ? `[CONTEXT: ${hiddenContext}] \n\n ${textToSend}` 
        : textToSend;

      const { data, error } = await supabase.functions.invoke('gemini-agent', {
        body: {
          messages: [...history, { role: 'user', content: fullContent }],
          mode,
          studentProfile,
          language: i18n.language || 'en'
        }
      });

      if (error) throw error;

      const aiMsg: Message = {
        id: (Date.now() + 1).toString(),
        role: 'model',
        content: data.reply,
        timestamp: new Date()
      };

      setMessages(prev => [...prev, aiMsg]);
    } catch (error) {
      console.error('Chat Error:', error);
      const errorMsg: Message = {
        id: Date.now().toString(),
        role: 'model',
        content: "Connection error. Please try again.",
        timestamp: new Date()
      };
      setMessages(prev => [...prev, errorMsg]);
    } finally {
      setIsLoading(false);
    }
  };

  const clearChat = () => setMessages([]);

  const modes = [
    { id: 'tutor', label: 'Tutor', icon: GraduationCap, color: 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-300' },
    { id: 'socratic', label: 'Socratic', icon: Brain, color: 'bg-purple-100 text-purple-700 dark:bg-purple-900/30 dark:text-purple-300' },
    { id: 'coach', label: 'Coach', icon: Zap, color: 'bg-orange-100 text-orange-700 dark:bg-orange-900/30 dark:text-orange-300' },
    { id: 'eli5', label: 'Simple', icon: Baby, color: 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-300' },
  ];

  return (
    <div className="flex flex-col h-[600px] bg-card border rounded-2xl shadow-sm overflow-hidden">
      {/* Header */}
      <div className="p-4 border-b bg-background/50 backdrop-blur-sm flex items-center justify-between sticky top-0 z-10">
        <div className="flex items-center gap-2">
          <div className={`p-2 rounded-lg ${modes.find(m => m.id === mode)?.color}`}>
            <Bot className="w-5 h-5" />
          </div>
          <div>
            <h3 className="font-semibold text-foreground">AI Assistant</h3>
            <p className="text-xs text-muted-foreground flex items-center gap-1">
              {i18n.language.toUpperCase()} Mode <Sparkles className="w-3 h-3 text-yellow-500" />
            </p>
          </div>
        </div>
        <Button variant="ghost" size="icon" onClick={clearChat}>
          <Eraser className="w-4 h-4" />
        </Button>
      </div>

      {/* Mode Selector */}
      <div className="px-4 py-3 bg-muted/20 border-b flex gap-2 overflow-x-auto no-scrollbar">
        {modes.map((m) => (
          <button
            key={m.id}
            onClick={() => setMode(m.id as any)}
            className={`flex items-center gap-2 px-3 py-1.5 rounded-full text-xs font-medium transition-all whitespace-nowrap ${
              mode === m.id 
                ? 'bg-background shadow-sm border border-border text-foreground ring-1 ring-primary' 
                : 'text-muted-foreground hover:bg-muted'
            }`}
          >
            <m.icon className="w-3.5 h-3.5" />
            {m.label}
          </button>
        ))}
      </div>

      {/* Chat Area */}
      <ScrollArea className="flex-1 p-4 bg-muted/10" ref={scrollRef}>
        <div className="space-y-6 max-w-3xl mx-auto">
          {messages.length === 0 && (
            <div className="text-center py-12">
              <div className="w-16 h-16 bg-primary/10 rounded-full flex items-center justify-center mx-auto mb-4">
                <Sparkles className="w-8 h-8 text-primary" />
              </div>
              <h3 className="text-lg font-medium text-foreground">How can I help you learn?</h3>
              <p className="text-muted-foreground text-sm mb-8">I speak {i18n.language === 'en' ? 'English' : i18n.language === 'es' ? 'Spanish' : 'your language'}!</p>
            </div>
          )}

          <AnimatePresence>
            {messages.map((msg) => (
              <motion.div
                key={msg.id}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                className={`flex gap-3 ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}
              >
                {msg.role === 'model' && (
                  <Avatar className="w-8 h-8 border bg-background">
                    <Bot className="w-5 h-5 text-primary m-auto" />
                  </Avatar>
                )}
                
                <div className={`rounded-2xl px-4 py-3 max-w-[85%] text-sm shadow-sm ${
                    msg.role === 'user'
                      ? 'bg-primary text-primary-foreground rounded-br-none'
                      : 'bg-card border text-foreground rounded-bl-none'
                  }`}
                >
                  <div className="prose prose-sm max-w-none dark:prose-invert text-inherit">
                    <ReactMarkdown>{msg.content}</ReactMarkdown>
                  </div>
                </div>
              </motion.div>
            ))}
          </AnimatePresence>

          {isLoading && (
            <div className="flex items-center gap-2 text-muted-foreground text-sm ml-12">
              <div className="w-2 h-2 bg-primary rounded-full animate-bounce" />
              <div className="w-2 h-2 bg-primary rounded-full animate-bounce [animation-delay:0.2s]" />
              <div className="w-2 h-2 bg-primary rounded-full animate-bounce [animation-delay:0.4s]" />
            </div>
          )}
        </div>
      </ScrollArea>

      {/* Input */}
      <div className="p-4 bg-background border-t">
        <div className="flex gap-2 max-w-3xl mx-auto relative">
          <Input
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && !e.shiftKey && handleSend()}
            placeholder="Ask anything..."
            className="pr-12 rounded-full bg-muted/50 border-muted-foreground/20 focus:bg-background transition-all"
          />
          <Button 
            size="icon" 
            onClick={() => handleSend()} 
            disabled={isLoading || !input.trim()}
            className="absolute right-1 top-1 h-8 w-8 rounded-full"
          >
            <Send className="w-4 h-4" />
          </Button>
        </div>
      </div>
    </div>
  );
};

export default AITutorSystem;
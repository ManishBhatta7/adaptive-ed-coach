import React, { useState, useRef, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Avatar } from '@/components/ui/avatar';
import { supabase } from '@/lib/supabase';
import { 
  Send, Sparkles, Bot, Eraser, Brain, 
  GraduationCap, Zap, Baby, ScanText, FileBarChart, 
  Loader2, FileQuestion 
} from 'lucide-react';
import ReactMarkdown from 'react-markdown';
import { motion, AnimatePresence } from 'framer-motion';
import { useTranslation } from 'react-i18next';
import { useLocation } from 'react-router-dom';
import { toast } from 'sonner';
import { v4 as uuidv4 } from 'uuid';

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
  const [isUploading, setIsUploading] = useState(false);
  const [mode, setMode] = useState<'tutor' | 'coach' | 'socratic' | 'eli5'>('tutor');
  
  const scrollRef = useRef<HTMLDivElement>(null);
  const ocrInputRef = useRef<HTMLInputElement>(null);
  const reportInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages, isLoading]);

  // === AUTO-MODE & CONTEXT HANDLER ===
  useEffect(() => {
    if (location.state?.initialPrompt && messages.length === 0) {
      const { initialPrompt, contextData, mode: targetMode } = location.state;
      if (targetMode) setMode(targetMode);
      handleSend(initialPrompt, contextData);
      window.history.replaceState({}, document.title);
    }
  }, [location.state]);

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
    if (!manualInput) setInput('');
    setIsLoading(true);

    try {
      const history = messages.slice(-10).map(m => ({
        role: m.role,
        content: m.content
      }));

      const fullContent = hiddenContext 
        ? `[SYSTEM_CONTEXT: ${hiddenContext}] \n\n ${textToSend}` 
        : textToSend;

      const { data, error } = await supabase.functions.invoke('gemini-agent', {
        body: {
          messages: [...history, { role: 'user', content: fullContent }],
          mode,
          studentProfile,
          language: i18n.language || 'en'
        }
      });

      if (error) {
        // Try to parse detailed error from backend
        let detailedMsg = error.message;
        try {
          // If the backend sent a JSON error response, invoke() might wrap it
          if (error.context && typeof error.context.json === 'function') {
            const body = await error.context.json();
            if (body.error) detailedMsg = body.error;
          }
        } catch (e) { /* ignore parse error */ }
        throw new Error(detailedMsg);
      }

      if (!data || !data.reply) {
        throw new Error("No response received from AI Agent.");
      }

      const aiMsg: Message = {
        id: (Date.now() + 1).toString(),
        role: 'model',
        content: data.reply,
        timestamp: new Date()
      };

      setMessages(prev => [...prev, aiMsg]);
    } catch (error: any) {
      console.error('Chat Error:', error);
      const errorMsg: Message = {
        id: Date.now().toString(),
        role: 'model',
        content: `⚠️ Error: ${error.message || "Connection failed. Please check your internet or API key."}`,
        timestamp: new Date()
      };
      setMessages(prev => [...prev, errorMsg]);
    } finally {
      setIsLoading(false);
    }
  };

  // === FEATURE: SMART SCAN (OCR) ===
  const handleSmartScan = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setIsUploading(true);
    toast.info("Scanning document...");

    try {
      const fileExt = file.name.split('.').pop();
      const fileName = `chat-ocr/${uuidv4()}.${fileExt}`;
      const { error: uploadError } = await supabase.storage
        .from('submissions')
        .upload(fileName, file);

      if (uploadError) throw new Error(uploadError.message);
      
      const { data: urlData } = supabase.storage.from('submissions').getPublicUrl(fileName);

      const { data, error } = await supabase.functions.invoke('smart-ocr', {
        body: { fileUrl: urlData.publicUrl }
      });

      if (error) throw new Error("OCR Service Unavailable");

      const items = data.items || [];
      const contextText = items.map((i: any) => `Q${i.q_number}: ${i.question}\nAnswer: ${i.solution}`).join('\n\n');
      
      await handleSend(
        "I just scanned this document. Help me understand it.",
        `OCR_DATA_EXTRACTED:\n${contextText}`
      );
      toast.success("Document scanned!");

    } catch (error: any) {
      toast.error("Scan failed", { description: error.message });
    } finally {
      setIsUploading(false);
      if (ocrInputRef.current) ocrInputRef.current.value = '';
    }
  };

  // === FEATURE: REPORT UPLOAD ===
  const handleReportUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setIsUploading(true);
    toast.info("Analyzing report card...");

    try {
      const formData = new FormData();
      formData.append('file', file);
      // Ensure we have a valid userId, fallback to 'anon' if testing
      const userId = studentProfile?.id || (await supabase.auth.getUser()).data.user?.id;
      if (!userId) throw new Error("You must be logged in to upload reports");
      
      formData.append('userId', userId);

      // Using raw fetch for FormData support
      const { data: { session } } = await supabase.auth.getSession();
      const response = await fetch(`${import.meta.env.VITE_SUPABASE_URL}/functions/v1/analyze-report`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${session?.access_token}`
        },
        body: formData
      });

      if (!response.ok) {
        const err = await response.json();
        throw new Error(err.error || "Analysis failed");
      }
      
      const analysis = await response.json();
      const summary = `
        Student: ${analysis.studentName}
        Weakest Subject: ${analysis.subjects ? Object.keys(analysis.subjects).find(sub => analysis.subjects[sub].score < 70) : 'None'}
        Insights: ${analysis.actionableInsights?.join('; ')}
      `;

      await handleSend(
        "I just uploaded my report card. How can I improve?",
        `REPORT_CARD_ANALYSIS:\n${summary}`
      );
      toast.success("Report analysis complete!");

    } catch (error: any) {
      console.error(error);
      toast.error("Analysis failed", { description: error.message });
    } finally {
      setIsUploading(false);
      if (reportInputRef.current) reportInputRef.current.value = '';
    }
  };

  // === FEATURE: QUIZ GENERATION ===
  const handleGenerateQuiz = () => {
    if (messages.length === 0) {
      toast.error("Start a conversation first!");
      return;
    }
    handleSend(
      "Generate a short interactive quiz based on our conversation.",
      "SYSTEM: Create a 3-question multiple choice quiz."
    );
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
      {/* Hidden Inputs */}
      <input type="file" ref={ocrInputRef} className="hidden" accept="image/*,.pdf" onChange={handleSmartScan} />
      <input type="file" ref={reportInputRef} className="hidden" accept="image/*" onChange={handleReportUpload} />

      {/* Header */}
      <div className="p-4 border-b bg-background/50 backdrop-blur-sm flex items-center justify-between sticky top-0 z-10">
        <div className="flex items-center gap-2">
          <div className={`p-2 rounded-lg ${modes.find(m => m.id === mode)?.color}`}>
            <Bot className="w-5 h-5" />
          </div>
          <div>
            <h3 className="font-semibold text-foreground">RetainLearn AI</h3>
            <p className="text-xs text-muted-foreground flex items-center gap-1">
              {i18n.language.toUpperCase()} Mode <Sparkles className="w-3 h-3 text-yellow-500" />
            </p>
          </div>
        </div>
        
        <div className="flex items-center gap-1">
          <Button variant="ghost" size="icon" onClick={() => ocrInputRef.current?.click()} disabled={isUploading || isLoading} title="Smart Scan">
            {isUploading ? <Loader2 className="w-4 h-4 animate-spin"/> : <ScanText className="w-4 h-4 text-blue-500" />}
          </Button>
          <Button variant="ghost" size="icon" onClick={() => reportInputRef.current?.click()} disabled={isUploading || isLoading} title="Report Upload">
            <FileBarChart className="w-4 h-4 text-green-500" />
          </Button>
          <Button variant="ghost" size="icon" onClick={handleGenerateQuiz} disabled={isUploading || isLoading} title="Quiz Me">
            <FileQuestion className="w-4 h-4 text-purple-500" />
          </Button>
          <div className="w-px h-4 bg-border mx-1" />
          <Button variant="ghost" size="icon" onClick={clearChat} title="Clear Chat">
            <Eraser className="w-4 h-4" />
          </Button>
        </div>
      </div>

      {/* Mode Selector */}
      <div className="px-4 py-3 bg-muted/20 border-b flex gap-2 overflow-x-auto no-scrollbar">
        {modes.map((m) => (
          <button
            key={m.id}
            onClick={() => setMode(m.id as any)}
            className={`flex items-center gap-2 px-3 py-1.5 rounded-full text-xs font-medium transition-all whitespace-nowrap ${
              mode === m.id ? 'bg-background shadow-sm border border-border text-foreground ring-1 ring-primary' : 'text-muted-foreground hover:bg-muted'
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
              <h3 className="text-lg font-medium text-foreground">Hello! I'm your RetainLearn Coach.</h3>
              <p className="text-muted-foreground text-sm mb-4">I can help you study, analyze reports, or solve doubts.</p>
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
            placeholder="Ask a question..."
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
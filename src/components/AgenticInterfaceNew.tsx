import { useState, useEffect, useRef } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Textarea } from '@/components/ui/textarea';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import { supabase } from '@/lib/supabase';
import { useAppContext } from '@/context/AppContext';
import { Bot, Image as ImageIcon, Database, BookOpen, Brain, Sparkles, Download, FileText, Copy, RefreshCw, Mic, Volume2, Trash2, Save, Share2, User, Zap, TrendingUp, MessageCircle, Send, StopCircle, Lightbulb, Target, Calculator, Globe, Code } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import jsPDF from 'jspdf';
import { MarkdownRenderer } from '@/components/ui/markdown-renderer';

interface Message {
  id: string;
  type: 'user' | 'assistant' | 'system';
  content: string;
  timestamp: Date;
  imageUrl?: string;
  action?: string;
}

interface PromptTemplate {
  title: string;
  description: string;
  prompt: string;
  icon: any;
  color: string;
}

const AgenticInterfaceNew = () => {
  const { state } = useAppContext();
  const { toast } = useToast();
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  
  // State management
  const [messages, setMessages] = useState<Message[]>([
    {
      id: '1',
      type: 'system',
      content: '👋 **Welcome to Your AI Learning Assistant!**\n\nI\'m here to help you with:\n- 📊 Analyzing your academic progress\n- 📚 Creating personalized study plans\n- 🧠 Explaining complex concepts\n- 🎨 Generating educational diagrams\n- ✍️ Creating practice quizzes\n- 💡 Answering your doubts\n\nHow can I assist you today?',
      timestamp: new Date()
    }
  ]);
  const [userInput, setUserInput] = useState('');
  const [isProcessing, setIsProcessing] = useState(false);
  const [isRecording, setIsRecording] = useState(false);
  const [isSpeaking, setIsSpeaking] = useState(false);
  const [showTemplates, setShowTemplates] = useState(true);
  
  // Prompt templates
  const promptTemplates: PromptTemplate[] = [
    {
      title: 'Analyze My Progress',
      description: 'Get insights into your learning journey',
      prompt: 'Analyze my recent academic performance and provide detailed insights on my strengths, weaknesses, and areas for improvement. Include specific recommendations for each subject.',
      icon: TrendingUp,
      color: 'from-green-500 to-emerald-600'
    },
    {
      title: 'Create Study Plan',
      description: 'Personalized study schedule',
      prompt: 'Create a comprehensive study plan for me based on my recent performance. Include daily goals, time management tips, and prioritized topics to focus on.',
      icon: Target,
      color: 'from-blue-500 to-cyan-600'
    },
    {
      title: 'Explain Concept',
      description: 'Simple explanations for difficult topics',
      prompt: 'Explain [topic] in simple terms with examples and analogies. Break it down step-by-step and include practice questions.',
      icon: Lightbulb,
      color: 'from-yellow-500 to-orange-600'
    },
    {
      title: 'Generate Quiz',
      description: 'Practice questions on any topic',
      prompt: 'Create a comprehensive quiz with 10 questions on [subject/topic]. Include multiple choice, true/false, and short answer questions with varying difficulty levels.',
      icon: Brain,
      color: 'from-purple-500 to-pink-600'
    },
    {
      title: 'Solve Math Problem',
      description: 'Step-by-step solutions',
      prompt: 'Solve this math problem step-by-step: [problem]. Explain each step clearly and show all work. Then provide similar practice problems.',
      icon: Calculator,
      color: 'from-indigo-500 to-blue-600'
    },
    {
      title: 'Create Visual Diagram',
      description: 'Educational illustrations',
      prompt: 'Create a detailed educational diagram showing [concept]. Make it colorful, clear, and include labels for all important parts.',
      icon: ImageIcon,
      color: 'from-pink-500 to-rose-600'
    },
    {
      title: 'Summarize Topic',
      description: 'Quick topic summaries',
      prompt: 'Provide a comprehensive summary of [topic] covering all key points, important facts, and common misconceptions. Format it for easy revision.',
      icon: FileText,
      color: 'from-teal-500 to-green-600'
    },
    {
      title: 'Research Help',
      description: 'Research guidance and sources',
      prompt: 'Help me research [topic]. Provide key points to explore, important questions to answer, and suggest reliable sources. Include a research outline.',
      icon: Globe,
      color: 'from-cyan-500 to-blue-600'
    }
  ];

  // Auto-scroll to bottom when messages change
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  // Text-to-speech
  const speakMessage = (text: string) => {
    if ('speechSynthesis' in window) {
      const utterance = new SpeechSynthesisUtterance(text);
      utterance.onstart = () => setIsSpeaking(true);
      utterance.onend = () => setIsSpeaking(false);
      window.speechSynthesis.speak(utterance);
    } else {
      toast({
        title: 'Not Supported',
        description: 'Text-to-speech is not supported in your browser',
        variant: 'destructive'
      });
    }
  };

  const stopSpeaking = () => {
    if ('speechSynthesis' in window) {
      window.speechSynthesis.cancel();
      setIsSpeaking(false);
    }
  };

  // Voice recognition
  const startVoiceRecording = () => {
    if ('webkitSpeechRecognition' in window || 'SpeechRecognition' in window) {
      const SpeechRecognition = (window as any).webkitSpeechRecognition || (window as any).SpeechRecognition;
      const recognition = new SpeechRecognition();
      
      recognition.continuous = false;
      recognition.interimResults = false;
      
      recognition.onstart = () => {
        setIsRecording(true);
        toast({
          title: '🎤 Listening...',
          description: 'Speak your question now'
        });
      };
      
      recognition.onresult = (event: any) => {
        const transcript = event.results[0][0].transcript;
        setUserInput(transcript);
        setIsRecording(false);
      };
      
      recognition.onerror = () => {
        setIsRecording(false);
        toast({
          title: 'Error',
          description: 'Could not recognize speech. Please try again.',
          variant: 'destructive'
        });
      };
      
      recognition.onend = () => {
        setIsRecording(false);
      };
      
      recognition.start();
    } else {
      toast({
        title: 'Not Supported',
        description: 'Voice recognition is not supported in your browser',
        variant: 'destructive'
      });
    }
  };

  // Send message to AI
  const sendMessage = async (messageContent?: string) => {
    const content = messageContent || userInput.trim();
    
    if (!content) {
      toast({
        title: 'Empty Message',
        description: 'Please enter a message or use a template',
        variant: 'destructive'
      });
      return;
    }

    // Add user message
    const userMessage: Message = {
      id: Date.now().toString(),
      type: 'user',
      content,
      timestamp: new Date()
    };
    
    setMessages(prev => [...prev, userMessage]);
    setUserInput('');
    setIsProcessing(true);
    setShowTemplates(false);

    try {
      // Get user context for better AI responses
      const userContext = {
        performances: state.currentUser?.performances || [],
        recentActivity: state.currentUser?.performances?.slice(-5) || [],
        learningStyle: state.currentUser?.primaryLearningStyle,
        name: state.currentUser?.name
      };

      const { data, error } = await supabase.functions.invoke('gemini-agent', {
        body: {
          action: 'process_user_message',
          context: {
            userMessage: content,
            currentPage: window.location.pathname,
            userRole: state.currentUser?.role || 'student',
            data: userContext
          }
        }
      });

      if (error) throw error;

      if (data.success) {
        const assistantMessage: Message = {
          id: (Date.now() + 1).toString(),
          type: 'assistant',
          content: data.agent_response?.content || data.rendered_content || 'No response generated',
          timestamp: new Date(),
          action: data.agent_response?.action_type
        };
        
        setMessages(prev => [...prev, assistantMessage]);

        toast({
          title: '✓ Response Generated',
          description: 'AI has processed your request'
        });
      } else {
        throw new Error(data.error || 'Failed to get AI response');
      }

    } catch (error: any) {
      console.error('Error sending message:', error);
      
      const errorMessage: Message = {
        id: (Date.now() + 1).toString(),
        type: 'system',
        content: `❌ **Error:** ${error.message || 'Failed to process your request'}`,
        timestamp: new Date()
      };
      
      setMessages(prev => [...prev, errorMessage]);

      toast({
        title: 'Error',
        description: error.message || 'Failed to communicate with AI',
        variant: 'destructive'
      });
    } finally {
      setIsProcessing(false);
    }
  };

  // Generate image
  const generateImage = async (prompt: string) => {
    const userMessage: Message = {
      id: Date.now().toString(),
      type: 'user',
      content: `🎨 Generate diagram: ${prompt}`,
      timestamp: new Date()
    };
    
    setMessages(prev => [...prev, userMessage]);
    setIsProcessing(true);

    try {
      const { data, error } = await supabase.functions.invoke('gemini-image-generator', {
        body: {
          prompt,
          format: 'png',
          size: '1024x1024',
          style: 'educational',
          quality: 'high'
        }
      });

      if (error) throw error;

      if (data.success && data.image_url) {
        const imageMessage: Message = {
          id: (Date.now() + 1).toString(),
          type: 'assistant',
          content: `Here's your educational diagram for: **${prompt}**`,
          timestamp: new Date(),
          imageUrl: data.image_url
        };
        
        setMessages(prev => [...prev, imageMessage]);

        toast({
          title: '✓ Image Generated',
          description: 'Your educational diagram is ready'
        });
      }
    } catch (error: any) {
      toast({
        title: 'Image Generation Failed',
        description: error.message || 'Failed to generate image',
        variant: 'destructive'
      });
    } finally {
      setIsProcessing(false);
    }
  };

  // Use prompt template
  const useTemplate = (template: PromptTemplate) => {
    setUserInput(template.prompt);
    setShowTemplates(false);
    textareaRef.current?.focus();
  };

  // Copy message content
  const copyMessage = (content: string) => {
    navigator.clipboard.writeText(content);
    toast({
      title: '✓ Copied',
      description: 'Message copied to clipboard'
    });
  };

  // Clear conversation
  const clearConversation = () => {
    if (window.confirm('Are you sure you want to clear this conversation?')) {
      setMessages([{
        id: '1',
        type: 'system',
        content: '🔄 **Conversation Cleared**\n\nStarting fresh! How can I help you?',
        timestamp: new Date()
      }]);
      setShowTemplates(true);
      toast({
        title: 'Conversation Cleared',
        description: 'Starting a new conversation'
      });
    }
  };

  // Export conversation
  const exportConversation = () => {
    try {
      const doc = new jsPDF();
      
      // Header
      doc.setFillColor(139, 92, 246);
      doc.rect(0, 0, 210, 30, 'F');
      doc.setTextColor(255, 255, 255);
      doc.setFontSize(20);
      doc.setFont('helvetica', 'bold');
      doc.text('AI Learning Assistant', 105, 15, { align: 'center' });
      doc.setFontSize(10);
      doc.text(`Conversation Export - ${new Date().toLocaleDateString()}`, 105, 23, { align: 'center' });
      
      // Content
      let yPosition = 40;
      doc.setTextColor(0, 0, 0);
      
      messages.forEach((message, index) => {
        if (yPosition > 270) {
          doc.addPage();
          yPosition = 20;
        }
        
        // Message header
        doc.setFont('helvetica', 'bold');
        doc.setFontSize(11);
        const senderLabel = message.type === 'user' ? 'You' : message.type === 'assistant' ? 'AI Assistant' : 'System';
        doc.text(`${senderLabel} (${message.timestamp.toLocaleTimeString()}):`, 14, yPosition);
        yPosition += 7;
        
        // Message content
        doc.setFont('helvetica', 'normal');
        doc.setFontSize(10);
        const cleanContent = message.content.replace(/<[^>]*>/g, '').replace(/[*#_`]/g, '').trim();
        const lines = doc.splitTextToSize(cleanContent, 180);
        
        lines.forEach((line: string) => {
          if (yPosition > 280) {
            doc.addPage();
            yPosition = 20;
          }
          doc.text(line, 14, yPosition);
          yPosition += 5;
        });
        
        yPosition += 5; // Space between messages
      });
      
      doc.save(`ai-conversation-${new Date().toISOString().split('T')[0]}.pdf`);
      
      toast({
        title: '✓ Exported',
        description: 'Conversation saved as PDF'
      });
    } catch (error) {
      toast({
        title: 'Export Failed',
        description: 'Could not export conversation',
        variant: 'destructive'
      });
    }
  };

  return (
    <div className="flex flex-col h-[calc(100vh-200px)] max-h-[900px]">
      {/* Header */}
      <Card className="mb-4 border-2 border-purple-200 bg-gradient-to-r from-purple-50 to-pink-50">
        <CardHeader className="pb-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="h-12 w-12 rounded-full bg-gradient-to-br from-purple-500 to-pink-600 flex items-center justify-center">
                <Bot className="h-7 w-7 text-white" />
              </div>
              <div>
                <CardTitle className="text-xl bg-gradient-to-r from-purple-600 to-pink-600 bg-clip-text text-transparent">
                  AI Learning Assistant
                </CardTitle>
                <p className="text-sm text-gray-600 flex items-center gap-2">
                  <Sparkles className="h-3 w-3" />
                  Powered by Lovable AI (Free Gemini)
                </p>
              </div>
            </div>
            
            <div className="flex gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => setShowTemplates(!showTemplates)}
                className="border-purple-200"
              >
                <Lightbulb className="h-4 w-4 mr-2" />
                Templates
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={exportConversation}
                disabled={messages.length <= 1}
                className="border-blue-200"
              >
                <Download className="h-4 w-4 mr-2" />
                Export
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={clearConversation}
                disabled={messages.length <= 1}
                className="border-red-200 text-red-600 hover:bg-red-50"
              >
                <Trash2 className="h-4 w-4 mr-2" />
                Clear
              </Button>
            </div>
          </div>
        </CardHeader>
      </Card>

      {/* Templates Section */}
      {showTemplates && (
        <Card className="mb-4 border-purple-200">
          <CardHeader>
            <CardTitle className="text-lg flex items-center gap-2">
              <Zap className="h-5 w-5 text-yellow-600" />
              Quick Start Templates
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-3">
              {promptTemplates.map((template, index) => {
                const Icon = template.icon;
                return (
                  <button
                    key={index}
                    onClick={() => useTemplate(template)}
                    className="text-left p-4 rounded-lg border-2 border-gray-200 hover:border-purple-300 hover:shadow-md transition-all bg-white group"
                  >
                    <div className={`h-10 w-10 rounded-lg bg-gradient-to-br ${template.color} flex items-center justify-center mb-3 group-hover:scale-110 transition-transform`}>
                      <Icon className="h-5 w-5 text-white" />
                    </div>
                    <h3 className="font-semibold text-gray-900 mb-1">{template.title}</h3>
                    <p className="text-xs text-gray-600">{template.description}</p>
                  </button>
                );
              })}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Messages Area */}
      <Card className="flex-1 flex flex-col border-2 border-purple-200 overflow-hidden">
        <ScrollArea className="flex-1 p-6">
          <div className="space-y-4">
            {messages.map((message) => (
              <div
                key={message.id}
                className={`flex gap-3 ${message.type === 'user' ? 'flex-row-reverse' : 'flex-row'}`}
              >
                {/* Avatar */}
                <div className={`flex-shrink-0 h-10 w-10 rounded-full flex items-center justify-center ${
                  message.type === 'user' 
                    ? 'bg-gradient-to-br from-blue-500 to-cyan-600' 
                    : message.type === 'assistant'
                    ? 'bg-gradient-to-br from-purple-500 to-pink-600'
                    : 'bg-gradient-to-br from-gray-400 to-gray-600'
                }`}>
                  {message.type === 'user' ? (
                    <User className="h-5 w-5 text-white" />
                  ) : message.type === 'assistant' ? (
                    <Bot className="h-5 w-5 text-white" />
                  ) : (
                    <Sparkles className="h-5 w-5 text-white" />
                  )}
                </div>

                {/* Message Content */}
                <div className={`flex-1 max-w-[80%] ${message.type === 'user' ? 'text-right' : 'text-left'}`}>
                  <div className={`inline-block rounded-2xl px-4 py-3 ${
                    message.type === 'user'
                      ? 'bg-gradient-to-br from-blue-500 to-cyan-600 text-white'
                      : message.type === 'assistant'
                      ? 'bg-white border-2 border-purple-200'
                      : 'bg-gray-100 border-2 border-gray-300'
                  }`}>
                    <MarkdownRenderer 
                      content={message.content}
                      className={message.type === 'user' ? 'text-white' : 'text-gray-800'}
                    />
                    
                    {/* Image Display */}
                    {message.imageUrl && (
                      <div className="mt-3 rounded-lg overflow-hidden border-2 border-purple-200">
                        <img 
                          src={message.imageUrl} 
                          alt="Generated diagram"
                          className="w-full h-auto"
                        />
                        <div className="p-2 bg-white flex gap-2">
                          <Button 
                            size="sm" 
                            variant="outline"
                            onClick={() => {
                              const link = document.createElement('a');
                              link.href = message.imageUrl!;
                              link.download = 'ai-diagram.png';
                              link.click();
                            }}
                          >
                            <Download className="h-3 w-3 mr-1" />
                            Download
                          </Button>
                        </div>
                      </div>
                    )}
                  </div>
                  
                  <div className="flex items-center gap-2 mt-1 text-xs text-gray-500">
                    <span>{message.timestamp.toLocaleTimeString()}</span>
                    {message.type === 'assistant' && (
                      <>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => copyMessage(message.content)}
                          className="h-6 px-2"
                        >
                          <Copy className="h-3 w-3" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => isSpeaking ? stopSpeaking() : speakMessage(message.content)}
                          className="h-6 px-2"
                        >
                          {isSpeaking ? <StopCircle className="h-3 w-3" /> : <Volume2 className="h-3 w-3" />}
                        </Button>
                      </>
                    )}
                  </div>
                </div>
              </div>
            ))}
            
            {/* Processing Indicator */}
            {isProcessing && (
              <div className="flex gap-3">
                <div className="flex-shrink-0 h-10 w-10 rounded-full bg-gradient-to-br from-purple-500 to-pink-600 flex items-center justify-center">
                  <Bot className="h-5 w-5 text-white" />
                </div>
                <div className="bg-white border-2 border-purple-200 rounded-2xl px-4 py-3">
                  <div className="flex items-center gap-2">
                    <div className="flex gap-1">
                      <div className="h-2 w-2 bg-purple-500 rounded-full animate-bounce" style={{ animationDelay: '0ms' }}></div>
                      <div className="h-2 w-2 bg-purple-500 rounded-full animate-bounce" style={{ animationDelay: '150ms' }}></div>
                      <div className="h-2 w-2 bg-purple-500 rounded-full animate-bounce" style={{ animationDelay: '300ms' }}></div>
                    </div>
                    <span className="text-sm text-gray-600">AI is thinking...</span>
                  </div>
                </div>
              </div>
            )}
            
            <div ref={messagesEndRef} />
          </div>
        </ScrollArea>

        {/* Input Area */}
        <div className="border-t-2 border-purple-200 p-4 bg-gradient-to-r from-purple-50 to-pink-50">
          <div className="flex gap-2">
            <div className="flex-1 relative">
              <Textarea
                ref={textareaRef}
                placeholder="Ask me anything... (Shift + Enter for new line, Enter to send)"
                value={userInput}
                onChange={(e) => setUserInput(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter' && !e.shiftKey) {
                    e.preventDefault();
                    if (userInput.trim() && !isProcessing) {
                      sendMessage();
                    }
                  }
                }}
                rows={3}
                className="resize-none border-2 border-purple-200 focus:border-purple-400 rounded-xl pr-12"
                disabled={isProcessing}
              />
              <Button
                variant="ghost"
                size="sm"
                onClick={startVoiceRecording}
                disabled={isProcessing || isRecording}
                className="absolute right-2 bottom-2"
              >
                <Mic className={`h-5 w-5 ${isRecording ? 'text-red-600 animate-pulse' : 'text-purple-600'}`} />
              </Button>
            </div>
            
            <div className="flex flex-col gap-2">
              <Button
                onClick={() => sendMessage()}
                disabled={isProcessing || !userInput.trim()}
                className="bg-gradient-to-r from-purple-500 to-pink-600 hover:from-purple-600 hover:to-pink-700 h-full"
              >
                {isProcessing ? (
                  <RefreshCw className="h-5 w-5 animate-spin" />
                ) : (
                  <>
                    <Send className="h-5 w-5 mr-2" />
                    Send
                  </>
                )}
              </Button>
            </div>
          </div>
          
          <div className="flex items-center justify-between mt-2 text-xs text-gray-600">
            <span>💡 Tip: Use templates above for quick starts</span>
            <span className="flex items-center gap-1">
              <MessageCircle className="h-3 w-3" />
              {messages.filter(m => m.type !== 'system').length} messages
            </span>
          </div>
        </div>
      </Card>
    </div>
  );
};

export default AgenticInterfaceNew;

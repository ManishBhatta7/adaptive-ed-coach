import React, { useState, useEffect, useRef, useCallback } from 'react';
import { useAppContext } from '@/context/AppContext';
import PageLayout from '@/components/layout/PageLayout';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import AITutorService from '@/services/AITutorService';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { ScrollArea } from '@/components/ui/scroll-area';
import {
  Plus,
  Send,
  Bot,
  MessageCircle,
  Settings,
  Trash2,
  Share2,
  Copy,
  Download,
  ThumbsUp,
  ThumbsDown,
  Volume2,
  Code,
  BookOpen,
  Lightbulb,
  BarChart3,
  Brain,
  Clock,
  ChevronDown,
  Menu,
  X,
  Edit2,
  MoreVertical,
  ChevronRight,
  Sparkles,
  Zap,
  Target,
  Award,
} from 'lucide-react';
import { cn } from '@/lib/utils';

interface Message {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  timestamp: Date;
  type?: 'text' | 'code' | 'math' | 'question';
  feedback?: 'liked' | 'disliked' | null;
  metadata?: {
    tokens?: number;
    confidence?: number;
    sources?: string[];
  };
}

interface ConversationHistory {
  id: string;
  title: string;
  createdAt: Date;
  updatedAt: Date;
  messageCount: number;
  topic?: string;
}

const AITutorPage = () => {
  const { state } = useAppContext();
  const { toast } = useToast();
  const [messages, setMessages] = useState<Message[]>([]);
  const [inputValue, setInputValue] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [conversations, setConversations] = useState<ConversationHistory[]>([]);
  const [currentConversationId, setCurrentConversationId] = useState<string | null>(null);
  const [showNewChatDialog, setShowNewChatDialog] = useState(false);
  const [selectedModel, setSelectedModel] = useState<'gpt' | 'gemini'>('gemini');
  const [temperature, setTemperature] = useState(0.7);
  const [selectedTopic, setSelectedTopic] = useState('General Learning');
  const [sessionGoal, setSessionGoal] = useState('Learn and improve');
  const [difficultyLevel, setDifficultyLevel] = useState('Intermediate');
  const [tutorPersonality, setTutorPersonality] = useState('Encouraging');
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  // Auto-scroll to bottom
  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  // Load conversations on mount
  useEffect(() => {
    if (state.currentUser) {
      loadConversations();
    }
  }, [state.currentUser]);

  const loadConversations = async () => {
    try {
      // Mock conversations for now - replace with actual DB queries
      const mockConversations: ConversationHistory[] = [
        {
          id: '1',
          title: 'Understanding Quadratic Equations',
          createdAt: new Date(Date.now() - 86400000),
          updatedAt: new Date(Date.now() - 86400000),
          messageCount: 12,
          topic: 'Mathematics',
        },
        {
          id: '2',
          title: 'Python Basics Tutorial',
          createdAt: new Date(Date.now() - 172800000),
          updatedAt: new Date(Date.now() - 172800000),
          messageCount: 18,
          topic: 'Programming',
        },
        {
          id: '3',
          title: 'Essay Writing Tips',
          createdAt: new Date(Date.now() - 259200000),
          updatedAt: new Date(Date.now() - 259200000),
          messageCount: 8,
          topic: 'English',
        },
      ];
      setConversations(mockConversations);
    } catch (error) {
      console.error('Error loading conversations:', error);
    }
  };

  const startNewChat = async (topic?: string) => {
    if (!state.currentUser?.id) {
      toast({
        title: 'Error',
        description: 'Please log in to start a chat',
        variant: 'destructive',
      });
      return;
    }

    // Create a new session
    const sessionId = await AITutorService.createSession(
      state.currentUser.id,
      selectedTopic || topic || 'General Learning',
      sessionGoal || 'Learn and improve',
      difficultyLevel,
      tutorPersonality
    );

    if (!sessionId) {
      toast({
        title: 'Error',
        description: 'Failed to create a new chat session',
        variant: 'destructive',
      });
      return;
    }

    setCurrentConversationId(sessionId);
    setMessages([]);
    setInputValue('');
    setShowNewChatDialog(false);
    
    if (topic) {
      setInputValue(`I want to learn about ${topic}. `);
      inputRef.current?.focus();
    }

    toast({
      title: 'New Chat Started',
      description: `Chat session created for ${selectedTopic || 'General Learning'}`,
      duration: 2000,
    });
  };

  const sendMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!inputValue.trim() || isLoading) return;

    const userMessage: Message = {
      id: Date.now().toString(),
      role: 'user',
      content: inputValue,
      timestamp: new Date(),
      type: 'text',
    };

    setMessages(prev => [...prev, userMessage]);
    setInputValue('');
    setIsLoading(true);

    try {
      // Simulate streaming response
      const assistantMessageId = (Date.now() + 1).toString();
      const assistantMessage: Message = {
        id: assistantMessageId,
        role: 'assistant',
        content: '',
        timestamp: new Date(),
        type: 'text',
        metadata: {
          confidence: 0.95,
        },
      };

      setMessages(prev => [...prev, assistantMessage]);

      // Call AI API
      const response = await callAIAPI(userMessage.content);
      
      // Simulate streaming by updating message
      if (response) {
        setMessages(prev => 
          prev.map(msg => 
            msg.id === assistantMessageId 
              ? { ...msg, content: response }
              : msg
          )
        );
      }
    } catch (error) {
      console.error('Error sending message:', error);
      toast({
        title: 'Error',
        description: 'Failed to get response from AI tutor',
        variant: 'destructive',
      });
      // Remove the assistant message on error
      setMessages(prev => prev.slice(0, -1));
    } finally {
      setIsLoading(false);
    }
  };

  const callAIAPI = async (userInput: string): Promise<string> => {
    try {
      if (!currentConversationId) {
        console.error('No conversation ID');
        return 'Please start a new chat first.';
      }

      // Generate system context
      const systemContext = AITutorService.generateTutorContext(
        selectedTopic,
        state.currentUser?.primaryLearningStyle || 'Visual',
        difficultyLevel,
        tutorPersonality
      );

      // Call the selected AI model
      const response = await AITutorService.callAI(
        userInput,
        selectedModel,
        currentConversationId,
        systemContext,
        temperature
      );

      if (response.error) {
        toast({
          title: 'AI Error',
          description: response.error,
          variant: 'destructive',
        });
        return response.response;
      }

      // Save interaction to database
      if (state.currentUser?.id) {
        await AITutorService.saveInteraction(
          currentConversationId,
          state.currentUser.id,
          userInput,
          response.response,
          selectedModel,
          0.95,
          response.tokens
        );
      }

      return response.response;
    } catch (error) {
      console.error('Error calling AI API:', error);
      return 'Failed to get response from AI tutor. Please try again.';
    }
  };

  const handleMessageFeedback = (messageId: string, feedback: 'liked' | 'disliked') => {
    setMessages(prev =>
      prev.map(msg =>
        msg.id === messageId
          ? { ...msg, feedback: msg.feedback === feedback ? null : feedback }
          : msg
      )
    );

    toast({
      title: feedback === 'liked' ? 'Helpful!' : 'Got it',
      description: feedback === 'liked' ? 'Thanks for the feedback' : 'We\'ll improve',
      duration: 2000,
    });
  };

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
    toast({
      title: 'Copied',
      description: 'Message copied to clipboard',
      duration: 2000,
    });
  };

  const deleteConversation = (id: string) => {
    setConversations(prev => prev.filter(conv => conv.id !== id));
    if (currentConversationId === id) {
      startNewChat();
    }
    toast({
      title: 'Deleted',
      description: 'Conversation removed',
      duration: 2000,
    });
  };

  const formatTime = (date: Date) => {
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMs / 3600000);
    const diffDays = Math.floor(diffMs / 86400000);

    if (diffMins < 1) return 'just now';
    if (diffMins < 60) return `${diffMins}m ago`;
    if (diffHours < 24) return `${diffHours}h ago`;
    return `${diffDays}d ago`;
  };

  if (!state.currentUser) {
    return (
      <PageLayout title="AI Tutor" subtitle="Your personal learning companion">
        <div className="flex items-center justify-center min-h-screen">
          <Card className="w-full max-w-md">
            <CardContent className="p-8 text-center">
              <Bot className="w-16 h-16 text-gray-400 mx-auto mb-4" />
              <h3 className="text-lg font-semibold mb-2">Authentication Required</h3>
              <p className="text-gray-600">Please log in to access your personal AI Tutor</p>
            </CardContent>
          </Card>
        </div>
      </PageLayout>
    );
  }

  return (
    <PageLayout title="AI Tutor" subtitle="Your personal learning companion">
      <div className="flex h-screen bg-gradient-to-b from-white to-blue-50 overflow-hidden">
        {/* Sidebar */}
        <div
          className={cn(
            'fixed inset-y-0 left-0 z-50 w-64 bg-gradient-to-b from-gray-50 to-blue-50 border-r border-gray-200 transition-transform duration-300 transform',
            sidebarOpen ? 'translate-x-0' : '-translate-x-full',
            'md:relative md:translate-x-0'
          )}
        >
          <div className="flex flex-col h-full">
            {/* Sidebar Header */}
            <div className="p-4 border-b border-gray-200 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-lg bg-gradient-to-r from-purple-500 to-pink-500 flex items-center justify-center">
                  <Bot className="w-5 h-5 text-white" />
                </div>
                <span className="font-semibold text-gray-900">RetainLearn AI</span>
              </div>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setSidebarOpen(false)}
                className="md:hidden text-gray-600 hover:bg-gray-200"
              >
                <X className="w-5 h-5" />
              </Button>
            </div>

            {/* New Chat Button */}
            <div className="p-4 border-b border-gray-200">
              <Button
                onClick={() => startNewChat()}
                className="w-full rounded-full bg-gradient-to-r from-purple-500 to-pink-500 hover:from-purple-600 hover:to-pink-600 text-white shadow-lg hover:shadow-purple-200 transition-all"
              >
                <Plus className="w-4 h-4 mr-2" />
                New Chat
              </Button>
            </div>

            {/* Chat History */}
            <div className="flex-1 overflow-y-auto p-4 space-y-2">
              <h3 className="text-xs font-semibold text-gray-600 uppercase mb-3">Recent Chats</h3>
              {conversations.length === 0 ? (
                <p className="text-sm text-gray-500">No conversations yet</p>
              ) : (
                conversations.map(conv => (
                  <div
                    key={conv.id}
                    onClick={() => setCurrentConversationId(conv.id)}
                    className={cn(
                      'p-3 rounded-lg cursor-pointer transition-all group',
                      currentConversationId === conv.id
                        ? 'bg-purple-100 border border-purple-200'
                        : 'hover:bg-gray-100 border border-transparent'
                    )}
                  >
                    <div className="flex items-start gap-2 mb-1">
                      <MessageCircle className={cn(
                        'w-4 h-4 flex-shrink-0 mt-0.5',
                        currentConversationId === conv.id ? 'text-purple-600' : 'text-gray-400'
                      )} />
                      <div className="flex-1 min-w-0">
                        <p className={cn(
                          'text-sm font-medium truncate',
                          currentConversationId === conv.id ? 'text-purple-900' : 'text-gray-700'
                        )}>
                          {conv.title}
                        </p>
                        <p className="text-xs text-gray-500">{formatTime(conv.updatedAt)}</p>
                      </div>
                    </div>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={(e) => {
                        e.stopPropagation();
                        deleteConversation(conv.id);
                      }}
                      className="w-full justify-start text-xs text-gray-500 hover:text-red-500 opacity-0 group-hover:opacity-100 transition-opacity"
                    >
                      <Trash2 className="w-3 h-3 mr-2" />
                      Delete
                    </Button>
                  </div>
                ))
              )}
            </div>

            {/* Quick Topics */}
            <div className="p-4 border-t border-gray-200">
              <h3 className="text-xs font-semibold text-gray-600 uppercase mb-3">Quick Topics</h3>
              <div className="space-y-2">
                {[
                  { icon: BookOpen, label: 'Study Concepts' },
                  { icon: Code, label: 'Code Help' },
                  { icon: Lightbulb, label: 'Ideas' },
                  { icon: Brain, label: 'Metacognition' },
                ].map(item => (
                  <Button
                    key={item.label}
                    onClick={() => startNewChat(item.label)}
                    variant="ghost"
                    size="sm"
                    className="w-full justify-start text-gray-600 hover:text-purple-600 hover:bg-purple-50 transition-colors"
                  >
                    <item.icon className="w-4 h-4 mr-2" />
                    {item.label}
                  </Button>
                ))}
              </div>
            </div>
          </div>
        </div>

        {/* Main Chat Area */}
        <div className="flex-1 flex flex-col overflow-hidden">
          {/* Header */}
          <div className="bg-white border-b border-gray-200 px-6 py-4 flex items-center justify-between shadow-sm">
            <div className="flex items-center gap-3">
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setSidebarOpen(!sidebarOpen)}
                className="md:hidden text-gray-600"
              >
                <Menu className="w-5 h-5" />
              </Button>
              <div>
                <h1 className="text-lg font-semibold text-gray-900">
                  {currentConversationId ? 'Continuing Conversation' : 'New Conversation'}
                </h1>
                <p className="text-sm text-gray-600">
                  {selectedModel === 'gemini' ? 'Powered by Gemini' : 'Powered by GPT'}
                </p>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <Dialog>
                <DialogTrigger asChild>
                  <Button variant="outline" size="sm" className="border-gray-300 hover:bg-gray-100">
                    <Settings className="w-4 h-4" />
                  </Button>
                </DialogTrigger>
                <DialogContent className="bg-white">
                  <DialogHeader>
                    <DialogTitle className="text-gray-900">AI Tutor Settings</DialogTitle>
                  </DialogHeader>
                  <div className="space-y-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">Model</label>
                      <select
                        value={selectedModel}
                        onChange={(e) => setSelectedModel(e.target.value as 'gpt' | 'gemini')}
                        className="w-full p-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                      >
                        <option value="gemini">Gemini (Recommended)</option>
                        <option value="gpt">GPT-4</option>
                      </select>
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Creativity: {(temperature * 100).toFixed(0)}%
                      </label>
                      <input
                        type="range"
                        min="0"
                        max="1"
                        step="0.1"
                        value={temperature}
                        onChange={(e) => setTemperature(parseFloat(e.target.value))}
                        className="w-full accent-purple-500"
                      />
                      <p className="text-xs text-gray-600 mt-1">
                        Lower = More precise, Higher = More creative
                      </p>
                    </div>
                  </div>
                </DialogContent>
              </Dialog>
            </div>
          </div>

          {/* Messages Area */}
          <ScrollArea className="flex-1 bg-gradient-to-b from-white via-blue-50 to-white">
            <div className="p-6 space-y-6 max-w-4xl mx-auto">
              {messages.length === 0 ? (
                <div className="flex flex-col items-center justify-center h-full py-12">
                  <div className="w-16 h-16 rounded-full bg-gradient-to-r from-purple-500 to-pink-500 flex items-center justify-center mb-4 shadow-lg">
                    <Bot className="w-8 h-8 text-white" />
                  </div>
                  <h2 className="text-2xl font-bold text-gray-900 mb-2">Welcome to AI Tutor</h2>
                  <p className="text-gray-600 text-center max-w-md mb-8">
                    Ask me anything about your studies, homework, or any topic you want to learn about. I'm here to help you succeed!
                  </p>
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                    {[
                      { icon: BookOpen, text: 'Explain a concept' },
                      { icon: Lightbulb, text: 'Problem solving' },
                      { icon: Code, text: 'Programming help' },
                      { icon: Brain, text: 'Critical thinking' },
                    ].map(item => (
                      <Card
                        key={item.text}
                        className="p-3 cursor-pointer hover:shadow-md hover:border-purple-200 transition-all border border-gray-200 bg-white"
                        onClick={() => setInputValue(item.text)}
                      >
                        <item.icon className="w-5 h-5 text-purple-600 mb-2" />
                        <p className="text-xs font-medium text-gray-700">{item.text}</p>
                      </Card>
                    ))}
                  </div>
                </div>
              ) : (
                messages.map((message, index) => (
                  <div
                    key={message.id}
                    className={cn('flex gap-4 animate-in fade-in slide-in-from-bottom-2', {
                      'justify-end': message.role === 'user',
                    })}
                  >
                    {message.role === 'assistant' && (
                      <Avatar className="w-8 h-8 flex-shrink-0 mt-1">
                        <AvatarFallback className="bg-gradient-to-r from-purple-500 to-pink-500 text-white">
                          <Bot className="w-4 h-4" />
                        </AvatarFallback>
                      </Avatar>
                    )}

                    <div
                      className={cn(
                        'max-w-2xl rounded-lg px-4 py-3 shadow-sm',
                        message.role === 'user'
                          ? 'bg-gradient-to-r from-purple-500 to-pink-500 text-white rounded-2xl'
                          : 'bg-white text-gray-900 border border-gray-200'
                      )}
                    >
                      <div className="text-sm whitespace-pre-wrap break-words">
                        {message.content}
                      </div>

                      {message.role === 'assistant' && (
                        <div className="flex items-center gap-2 mt-3 pt-3 border-t border-gray-200">
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => handleMessageFeedback(message.id, 'liked')}
                            className={cn(
                              'h-6 px-2 text-gray-500 hover:text-green-600 hover:bg-green-50',
                              message.feedback === 'liked' && 'text-green-600 bg-green-50'
                            )}
                          >
                            <ThumbsUp className="w-4 h-4" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => handleMessageFeedback(message.id, 'disliked')}
                            className={cn(
                              'h-6 px-2 text-gray-500 hover:text-red-600 hover:bg-red-50',
                              message.feedback === 'disliked' && 'text-red-600 bg-red-50'
                            )}
                          >
                            <ThumbsDown className="w-4 h-4" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => copyToClipboard(message.content)}
                            className="h-6 px-2 text-gray-500 hover:text-purple-600 hover:bg-purple-50"
                          >
                            <Copy className="w-4 h-4" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="sm"
                            className="h-6 px-2 text-gray-500 hover:text-blue-600 hover:bg-blue-50"
                          >
                            <Volume2 className="w-4 h-4" />
                          </Button>
                          {message.metadata?.tokens && (
                            <span className="text-xs text-gray-500 ml-auto">
                              {message.metadata.tokens} tokens
                            </span>
                          )}
                        </div>
                      )}
                    </div>

                    {message.role === 'user' && (
                      <Avatar className="w-8 h-8 flex-shrink-0 mt-1">
                        <AvatarFallback className="bg-blue-100 text-blue-600">
                          {state.currentUser?.name?.[0] || 'U'}
                        </AvatarFallback>
                      </Avatar>
                    )}
                  </div>
                ))
              )}

              {isLoading && (
                <div className="flex gap-4">
                  <Avatar className="w-8 h-8 flex-shrink-0 mt-1">
                    <AvatarFallback className="bg-gradient-to-r from-purple-500 to-pink-500 text-white">
                      <Bot className="w-4 h-4" />
                    </AvatarFallback>
                  </Avatar>
                  <div className="bg-white border border-gray-200 rounded-lg px-4 py-3 shadow-sm">
                    <div className="flex gap-1">
                      <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" />
                      <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '0.1s' }} />
                      <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '0.2s' }} />
                    </div>
                  </div>
                </div>
              )}

              <div ref={messagesEndRef} />
            </div>
          </ScrollArea>

          {/* Input Area */}
          <div className="border-t border-gray-200 bg-white p-4 shadow-lg">
            <form onSubmit={sendMessage} className="max-w-4xl mx-auto">
              <div className="flex gap-3">
                <Input
                  ref={inputRef}
                  value={inputValue}
                  onChange={(e) => setInputValue(e.target.value)}
                  placeholder="Ask me anything... or type @ to see suggestions"
                  className="flex-1 rounded-full border-gray-300 focus:border-purple-500 focus:ring-purple-500"
                  disabled={isLoading}
                />
                <Button
                  type="submit"
                  disabled={!inputValue.trim() || isLoading}
                  className="rounded-full bg-gradient-to-r from-purple-500 to-pink-500 hover:from-purple-600 hover:to-pink-600 text-white px-6 shadow-lg hover:shadow-purple-200 transition-all"
                >
                  {isLoading ? (
                    <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                  ) : (
                    <Send className="w-4 h-4" />
                  )}
                </Button>
              </div>
              <p className="text-xs text-gray-500 mt-2 text-center">
                RetainLearn AI can make mistakes. Always verify important information.
              </p>
            </form>
          </div>
        </div>
      </div>
    </PageLayout>
  );
};

export default AITutorPage;

import React, { useState, useEffect, useRef } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { supabase } from '@/lib/supabase';
import { useAppContext } from '@/context/AppContext';
import { 
  Users, 
  MessageSquare, 
  Video, 
  Share2, 
  Lightbulb,
  Timer,
  CheckCircle2,
  UserPlus,
  Settings,
  Mic,
  MicOff,
  Camera,
  CameraOff,
  Screen,
  Send,
  ThumbsUp,
  ThumbsDown,
  Star,
  Clock,
  Target,
  Brain,
  Zap,
  TrendingUp
} from 'lucide-react';

interface CollaborationSession {
  id: string;
  title: string;
  description: string;
  session_type: 'problem_solving' | 'peer_review' | 'discussion' | 'study_group';
  host_id: string;
  host_name: string;
  max_participants: number;
  current_participants: number;
  status: 'waiting' | 'active' | 'completed';
  created_at: string;
  started_at?: string;
  ended_at?: string;
  problem_content?: string;
  target_strategies?: string[];
  difficulty_level: number;
}

interface SessionParticipant {
  user_id: string;
  user_name: string;
  user_avatar?: string;
  role: 'host' | 'participant';
  joined_at: string;
  is_active: boolean;
  contribution_count: number;
  metacog_score_before?: number;
  metacog_score_after?: number;
}

interface SessionMessage {
  id: string;
  session_id: string;
  user_id: string;
  user_name: string;
  user_avatar?: string;
  message_type: 'text' | 'strategy_share' | 'reflection' | 'question' | 'insight';
  content: string;
  metadata?: any;
  created_at: string;
  reactions: { [key: string]: string[] };
}

interface StrategyShare {
  id: string;
  strategy_name: string;
  description: string;
  effectiveness_rating: number;
  shared_by: string;
  shared_by_name: string;
  created_at: string;
  upvotes: number;
  downvotes: number;
  user_vote?: 'up' | 'down';
}

export const RealTimeCollaboration: React.FC = () => {
  const { state } = useAppContext();
  const [activeTab, setActiveTab] = useState('sessions');
  const [sessions, setSessions] = useState<CollaborationSession[]>([]);
  const [currentSession, setCurrentSession] = useState<CollaborationSession | null>(null);
  const [participants, setParticipants] = useState<SessionParticipant[]>([]);
  const [messages, setMessages] = useState<SessionMessage[]>([]);
  const [strategies, setStrategies] = useState<StrategyShare[]>([]);
  const [newMessage, setNewMessage] = useState('');
  const [showCreateDialog, setShowCreateDialog] = useState(false);
  const [newSessionData, setNewSessionData] = useState({
    title: '',
    description: '',
    session_type: 'problem_solving' as const,
    max_participants: 4,
    problem_content: '',
    target_strategies: [] as string[],
    difficulty_level: 1
  });
  
  const [isConnected, setIsConnected] = useState(false);
  const [isHost, setIsHost] = useState(false);
  const [micEnabled, setMicEnabled] = useState(false);
  const [cameraEnabled, setCameraEnabled] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const wsRef = useRef<WebSocket | null>(null);

  useEffect(() => {
    loadAvailableSessions();
    return () => {
      if (wsRef.current) {
        wsRef.current.close();
      }
    };
  }, []);

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  const loadAvailableSessions = async () => {
    try {
      const { data, error } = await supabase
        .from('collaboration_sessions')
        .select(`
          *,
          profiles:host_id (
            name
          ),
          session_participants (
            count
          )
        `)
        .in('status', ['waiting', 'active'])
        .order('created_at', { ascending: false });

      if (error) {
        console.error('Error loading sessions:', error);
        return;
      }

      const sessionList: CollaborationSession[] = (data || []).map((session: any) => ({
        id: session.id,
        title: session.title,
        description: session.description,
        session_type: session.session_type,
        host_id: session.host_id,
        host_name: session.profiles?.name || 'Unknown Host',
        max_participants: session.max_participants,
        current_participants: session.session_participants?.length || 0,
        status: session.status,
        created_at: session.created_at,
        started_at: session.started_at,
        ended_at: session.ended_at,
        problem_content: session.problem_content,
        target_strategies: session.target_strategies || [],
        difficulty_level: session.difficulty_level
      }));

      setSessions(sessionList);

    } catch (error) {
      console.error('Error loading sessions:', error);
    }
  };

  const createSession = async () => {
    if (!state.currentUser || !newSessionData.title.trim()) return;

    try {
      const { data, error } = await supabase
        .from('collaboration_sessions')
        .insert({
          title: newSessionData.title,
          description: newSessionData.description,
          session_type: newSessionData.session_type,
          host_id: state.currentUser.id,
          max_participants: newSessionData.max_participants,
          status: 'waiting',
          problem_content: newSessionData.problem_content,
          target_strategies: newSessionData.target_strategies,
          difficulty_level: newSessionData.difficulty_level
        })
        .select()
        .single();

      if (error) {
        console.error('Error creating session:', error);
        return;
      }

      setShowCreateDialog(false);
      setNewSessionData({
        title: '',
        description: '',
        session_type: 'problem_solving',
        max_participants: 4,
        problem_content: '',
        target_strategies: [],
        difficulty_level: 1
      });

      await loadAvailableSessions();
      joinSession(data.id);

    } catch (error) {
      console.error('Error creating session:', error);
    }
  };

  const joinSession = async (sessionId: string) => {
    if (!state.currentUser) return;

    try {
      // Join session in database
      const { error } = await supabase
        .from('session_participants')
        .insert({
          session_id: sessionId,
          user_id: state.currentUser.id,
          role: currentSession?.host_id === state.currentUser.id ? 'host' : 'participant'
        });

      if (error) {
        console.error('Error joining session:', error);
        return;
      }

      // Set current session
      const session = sessions.find(s => s.id === sessionId);
      if (session) {
        setCurrentSession(session);
        setIsHost(session.host_id === state.currentUser.id);
        
        // Initialize WebSocket connection
        initializeWebSocket(sessionId);
        
        // Load session data
        loadSessionData(sessionId);
      }

    } catch (error) {
      console.error('Error joining session:', error);
    }
  };

  const initializeWebSocket = (sessionId: string) => {
    // Note: In a real implementation, you would use your WebSocket server URL
    // For now, we'll simulate real-time updates using Supabase real-time subscriptions
    
    const messagesSubscription = supabase
      .channel(`session-${sessionId}`)
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'session_messages',
          filter: `session_id=eq.${sessionId}`
        },
        (payload) => {
          const newMessage = payload.new as any;
          setMessages(prev => [...prev, {
            id: newMessage.id,
            session_id: newMessage.session_id,
            user_id: newMessage.user_id,
            user_name: newMessage.user_name,
            user_avatar: newMessage.user_avatar,
            message_type: newMessage.message_type,
            content: newMessage.content,
            metadata: newMessage.metadata,
            created_at: newMessage.created_at,
            reactions: newMessage.reactions || {}
          }]);
        }
      )
      .subscribe();

    const participantsSubscription = supabase
      .channel(`participants-${sessionId}`)
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'session_participants',
          filter: `session_id=eq.${sessionId}`
        },
        () => {
          loadSessionData(sessionId);
        }
      )
      .subscribe();

    setIsConnected(true);
  };

  const loadSessionData = async (sessionId: string) => {
    try {
      // Load participants
      const { data: participantsData, error: participantsError } = await supabase
        .from('session_participants')
        .select(`
          *,
          profiles:user_id (
            name,
            avatar_url
          )
        `)
        .eq('session_id', sessionId);

      if (!participantsError && participantsData) {
        const participantList: SessionParticipant[] = participantsData.map((p: any) => ({
          user_id: p.user_id,
          user_name: p.profiles?.name || 'Unknown',
          user_avatar: p.profiles?.avatar_url,
          role: p.role,
          joined_at: p.joined_at,
          is_active: p.is_active,
          contribution_count: p.contribution_count || 0,
          metacog_score_before: p.metacog_score_before,
          metacog_score_after: p.metacog_score_after
        }));
        setParticipants(participantList);
      }

      // Load messages
      const { data: messagesData, error: messagesError } = await supabase
        .from('session_messages')
        .select('*')
        .eq('session_id', sessionId)
        .order('created_at', { ascending: true });

      if (!messagesError && messagesData) {
        const messageList: SessionMessage[] = messagesData.map((m: any) => ({
          id: m.id,
          session_id: m.session_id,
          user_id: m.user_id,
          user_name: m.user_name,
          user_avatar: m.user_avatar,
          message_type: m.message_type,
          content: m.content,
          metadata: m.metadata,
          created_at: m.created_at,
          reactions: m.reactions || {}
        }));
        setMessages(messageList);
      }

      // Load shared strategies
      const { data: strategiesData, error: strategiesError } = await supabase
        .from('shared_strategies')
        .select('*')
        .eq('session_id', sessionId)
        .order('created_at', { ascending: false });

      if (!strategiesError && strategiesData) {
        const strategyList: StrategyShare[] = strategiesData.map((s: any) => ({
          id: s.id,
          strategy_name: s.strategy_name,
          description: s.description,
          effectiveness_rating: s.effectiveness_rating,
          shared_by: s.shared_by,
          shared_by_name: s.shared_by_name,
          created_at: s.created_at,
          upvotes: s.upvotes || 0,
          downvotes: s.downvotes || 0,
          user_vote: s.user_vote
        }));
        setStrategies(strategyList);
      }

    } catch (error) {
      console.error('Error loading session data:', error);
    }
  };

  const sendMessage = async () => {
    if (!currentSession || !state.currentUser || !newMessage.trim()) return;

    try {
      const { error } = await supabase
        .from('session_messages')
        .insert({
          session_id: currentSession.id,
          user_id: state.currentUser.id,
          user_name: state.currentUser.name || 'Unknown',
          user_avatar: state.currentUser.avatar_url,
          message_type: 'text',
          content: newMessage,
          metadata: {}
        });

      if (error) {
        console.error('Error sending message:', error);
        return;
      }

      setNewMessage('');

    } catch (error) {
      console.error('Error sending message:', error);
    }
  };

  const shareStrategy = async (strategyData: any) => {
    if (!currentSession || !state.currentUser) return;

    try {
      const { error } = await supabase
        .from('shared_strategies')
        .insert({
          session_id: currentSession.id,
          strategy_name: strategyData.name,
          description: strategyData.description,
          effectiveness_rating: strategyData.rating,
          shared_by: state.currentUser.id,
          shared_by_name: state.currentUser.name || 'Unknown'
        });

      if (error) {
        console.error('Error sharing strategy:', error);
        return;
      }

      // Also send as message
      await supabase
        .from('session_messages')
        .insert({
          session_id: currentSession.id,
          user_id: state.currentUser.id,
          user_name: state.currentUser.name || 'Unknown',
          user_avatar: state.currentUser.avatar_url,
          message_type: 'strategy_share',
          content: `Shared strategy: ${strategyData.name}`,
          metadata: strategyData
        });

    } catch (error) {
      console.error('Error sharing strategy:', error);
    }
  };

  const leaveSession = async () => {
    if (!currentSession || !state.currentUser) return;

    try {
      await supabase
        .from('session_participants')
        .delete()
        .eq('session_id', currentSession.id)
        .eq('user_id', state.currentUser.id);

      setCurrentSession(null);
      setParticipants([]);
      setMessages([]);
      setStrategies([]);
      setIsConnected(false);
      setIsHost(false);

      await loadAvailableSessions();

    } catch (error) {
      console.error('Error leaving session:', error);
    }
  };

  const getSessionTypeIcon = (type: string) => {
    switch (type) {
      case 'problem_solving': return <Target className="w-5 h-5" />;
      case 'peer_review': return <Users className="w-5 h-5" />;
      case 'discussion': return <MessageSquare className="w-5 h-5" />;
      case 'study_group': return <Brain className="w-5 h-5" />;
      default: return <Users className="w-5 h-5" />;
    }
  };

  const getMessageTypeIcon = (type: string) => {
    switch (type) {
      case 'strategy_share': return <Lightbulb className="w-4 h-4 text-yellow-500" />;
      case 'reflection': return <Brain className="w-4 h-4 text-purple-500" />;
      case 'question': return <MessageSquare className="w-4 h-4 text-blue-500" />;
      case 'insight': return <Zap className="w-4 h-4 text-green-500" />;
      default: return null;
    }
  };

  const formatTimeAgo = (dateString: string) => {
    const now = new Date();
    const past = new Date(dateString);
    const diffInMinutes = Math.floor((now.getTime() - past.getTime()) / (1000 * 60));
    
    if (diffInMinutes < 1) return 'Just now';
    if (diffInMinutes < 60) return `${diffInMinutes}m ago`;
    if (diffInMinutes < 1440) return `${Math.floor(diffInMinutes / 60)}h ago`;
    return `${Math.floor(diffInMinutes / 1440)}d ago`;
  };

  // Session Browser Tab
  const SessionBrowserTab = () => (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h3 className="text-xl font-semibold">Live Collaboration Sessions</h3>
          <p className="text-gray-600">Join peer learning sessions and collaborative problem solving</p>
        </div>
        <Button onClick={() => setShowCreateDialog(true)} className="flex items-center gap-2">
          <UserPlus className="w-4 h-4" />
          Create Session
        </Button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {sessions.map((session) => (
          <Card key={session.id} className="hover:shadow-lg transition-shadow">
            <CardHeader className="pb-3">
              <div className="flex items-start justify-between">
                <div className="flex items-center gap-2">
                  {getSessionTypeIcon(session.session_type)}
                  <div>
                    <CardTitle className="text-lg">{session.title}</CardTitle>
                    <Badge variant={session.status === 'active' ? 'default' : 'secondary'}>
                      {session.status === 'active' ? 'Live' : 'Waiting'}
                    </Badge>
                  </div>
                </div>
                <Badge variant="outline">
                  Level {session.difficulty_level}
                </Badge>
              </div>
            </CardHeader>
            <CardContent className="space-y-4">
              <p className="text-sm text-gray-600 line-clamp-2">
                {session.description}
              </p>

              <div className="flex items-center justify-between text-sm">
                <div className="flex items-center gap-2 text-gray-600">
                  <Users className="w-4 h-4" />
                  {session.current_participants}/{session.max_participants}
                </div>
                <div className="flex items-center gap-2 text-gray-600">
                  <Clock className="w-4 h-4" />
                  {formatTimeAgo(session.created_at)}
                </div>
              </div>

              <div className="space-y-2">
                <div className="text-xs text-gray-500">
                  Host: {session.host_name}
                </div>
                
                {session.target_strategies.length > 0 && (
                  <div className="flex flex-wrap gap-1">
                    {session.target_strategies.map((strategy, index) => (
                      <Badge key={index} variant="outline" className="text-xs">
                        {strategy}
                      </Badge>
                    ))}
                  </div>
                )}
              </div>

              <Button 
                onClick={() => joinSession(session.id)}
                disabled={session.current_participants >= session.max_participants}
                className="w-full"
              >
                {session.current_participants >= session.max_participants ? 'Full' : 'Join Session'}
              </Button>
            </CardContent>
          </Card>
        ))}
      </div>

      {sessions.length === 0 && (
        <Card>
          <CardContent className="p-8 text-center">
            <Users className="w-16 h-16 text-gray-400 mx-auto mb-4" />
            <h3 className="text-lg font-semibold mb-2">No Active Sessions</h3>
            <p className="text-gray-600 mb-4">Be the first to create a collaborative learning session!</p>
            <Button onClick={() => setShowCreateDialog(true)}>Create Session</Button>
          </CardContent>
        </Card>
      )}
    </div>
  );

  // Active Session Tab
  const ActiveSessionTab = () => {
    if (!currentSession) {
      return (
        <Card>
          <CardContent className="p-8 text-center">
            <MessageSquare className="w-16 h-16 text-gray-400 mx-auto mb-4" />
            <h3 className="text-lg font-semibold mb-2">No Active Session</h3>
            <p className="text-gray-600">Join a session to start collaborating with peers.</p>
          </CardContent>
        </Card>
      );
    }

    return (
      <div className="space-y-6">
        {/* Session Header */}
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <div>
                <CardTitle className="flex items-center gap-2">
                  {getSessionTypeIcon(currentSession.session_type)}
                  {currentSession.title}
                </CardTitle>
                <p className="text-gray-600 mt-1">{currentSession.description}</p>
              </div>
              <div className="flex items-center gap-2">
                <Badge variant={isConnected ? 'default' : 'destructive'}>
                  {isConnected ? 'Connected' : 'Disconnected'}
                </Badge>
                <Button onClick={leaveSession} variant="outline" size="sm">
                  Leave
                </Button>
              </div>
            </div>
          </CardHeader>
        </Card>

        <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
          {/* Participants Panel */}
          <Card className="lg:col-span-1">
            <CardHeader>
              <CardTitle className="text-lg flex items-center gap-2">
                <Users className="w-5 h-5" />
                Participants ({participants.length})
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              {participants.map((participant) => (
                <div key={participant.user_id} className="flex items-center gap-3">
                  <Avatar className="w-8 h-8">
                    <AvatarImage src={participant.user_avatar} />
                    <AvatarFallback>{participant.user_name[0]}</AvatarFallback>
                  </Avatar>
                  <div className="flex-1">
                    <div className="flex items-center gap-2">
                      <span className="text-sm font-medium">{participant.user_name}</span>
                      {participant.role === 'host' && (
                        <Badge variant="secondary" className="text-xs">Host</Badge>
                      )}
                    </div>
                    <div className="text-xs text-gray-500">
                      {participant.contribution_count} contributions
                    </div>
                  </div>
                  <div className={`w-2 h-2 rounded-full ${participant.is_active ? 'bg-green-500' : 'bg-gray-300'}`} />
                </div>
              ))}
            </CardContent>
          </Card>

          {/* Chat Panel */}
          <Card className="lg:col-span-2">
            <CardHeader>
              <CardTitle className="text-lg flex items-center gap-2">
                <MessageSquare className="w-5 h-5" />
                Collaboration Chat
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="h-96 border rounded-lg p-4 overflow-y-auto space-y-3">
                {messages.map((message) => (
                  <div key={message.id} className="flex gap-3">
                    <Avatar className="w-8 h-8">
                      <AvatarImage src={message.user_avatar} />
                      <AvatarFallback>{message.user_name[0]}</AvatarFallback>
                    </Avatar>
                    <div className="flex-1">
                      <div className="flex items-center gap-2">
                        <span className="text-sm font-medium">{message.user_name}</span>
                        {getMessageTypeIcon(message.message_type)}
                        <span className="text-xs text-gray-500">
                          {formatTimeAgo(message.created_at)}
                        </span>
                      </div>
                      <p className="text-sm mt-1 whitespace-pre-wrap">{message.content}</p>
                      
                      {/* Message reactions */}
                      <div className="flex items-center gap-2 mt-2">
                        <Button variant="ghost" size="sm" className="h-6 px-2">
                          <ThumbsUp className="w-3 h-3" />
                          <span className="ml-1 text-xs">
                            {message.reactions['thumbs_up']?.length || 0}
                          </span>
                        </Button>
                        <Button variant="ghost" size="sm" className="h-6 px-2">
                          <Star className="w-3 h-3" />
                          <span className="ml-1 text-xs">
                            {message.reactions['star']?.length || 0}
                          </span>
                        </Button>
                      </div>
                    </div>
                  </div>
                ))}
                <div ref={messagesEndRef} />
              </div>

              <div className="flex gap-2">
                <Input
                  value={newMessage}
                  onChange={(e) => setNewMessage(e.target.value)}
                  placeholder="Share your thoughts, ask questions, or suggest strategies..."
                  onKeyPress={(e) => e.key === 'Enter' && sendMessage()}
                />
                <Button onClick={sendMessage} disabled={!newMessage.trim()}>
                  <Send className="w-4 h-4" />
                </Button>
              </div>
            </CardContent>
          </Card>

          {/* Shared Strategies Panel */}
          <Card className="lg:col-span-1">
            <CardHeader>
              <CardTitle className="text-lg flex items-center gap-2">
                <Lightbulb className="w-5 h-5" />
                Strategies
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              {strategies.map((strategy) => (
                <div key={strategy.id} className="p-3 border rounded-lg">
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <h4 className="font-medium text-sm">{strategy.strategy_name}</h4>
                      <p className="text-xs text-gray-600 mt-1">{strategy.description}</p>
                      <div className="flex items-center gap-2 mt-2">
                        <div className="flex items-center text-xs text-gray-500">
                          <Star className="w-3 h-3 mr-1" />
                          {strategy.effectiveness_rating}/5
                        </div>
                        <div className="text-xs text-gray-500">
                          by {strategy.shared_by_name}
                        </div>
                      </div>
                    </div>
                  </div>
                  <div className="flex items-center justify-between mt-2">
                    <div className="flex items-center gap-2">
                      <Button variant="ghost" size="sm" className="h-6 px-2">
                        <ThumbsUp className="w-3 h-3" />
                        <span className="ml-1 text-xs">{strategy.upvotes}</span>
                      </Button>
                      <Button variant="ghost" size="sm" className="h-6 px-2">
                        <ThumbsDown className="w-3 h-3" />
                        <span className="ml-1 text-xs">{strategy.downvotes}</span>
                      </Button>
                    </div>
                  </div>
                </div>
              ))}

              <Button variant="outline" className="w-full" size="sm">
                <Lightbulb className="w-4 h-4 mr-2" />
                Share Strategy
              </Button>
            </CardContent>
          </Card>
        </div>

        {/* Control Panel */}
        {isHost && (
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Session Controls</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex items-center gap-4">
                <Button variant="outline" size="sm">
                  <Timer className="w-4 h-4 mr-2" />
                  Set Timer
                </Button>
                <Button variant="outline" size="sm">
                  <Screen className="w-4 h-4 mr-2" />
                  Share Screen
                </Button>
                <Button variant="outline" size="sm">
                  <Settings className="w-4 h-4 mr-2" />
                  Settings
                </Button>
                <div className="flex-1" />
                <Button variant="destructive" size="sm">
                  End Session
                </Button>
              </div>
            </CardContent>
          </Card>
        )}
      </div>
    );
  };

  if (!state.currentUser) {
    return (
      <Card>
        <CardContent className="p-8 text-center">
          <Users className="w-16 h-16 text-gray-400 mx-auto mb-4" />
          <h3 className="text-lg font-semibold mb-2">Authentication Required</h3>
          <p className="text-gray-600">Please log in to access collaboration features.</p>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="max-w-7xl mx-auto p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Real-Time Collaboration</h1>
          <p className="text-gray-600 mt-2">
            Connect with peers for live problem-solving and strategy sharing
          </p>
        </div>
        {isConnected && (
          <Badge variant="default" className="flex items-center gap-2">
            <div className="w-2 h-2 bg-green-400 rounded-full animate-pulse" />
            Live Session Active
          </Badge>
        )}
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="grid w-full grid-cols-2">
          <TabsTrigger value="sessions" className="flex items-center gap-2">
            <Users className="w-4 h-4" />
            Browse Sessions
          </TabsTrigger>
          <TabsTrigger value="active" className="flex items-center gap-2">
            <MessageSquare className="w-4 h-4" />
            Active Session
            {isConnected && <Badge variant="secondary" className="ml-2">Live</Badge>}
          </TabsTrigger>
        </TabsList>

        <TabsContent value="sessions" className="mt-6">
          <SessionBrowserTab />
        </TabsContent>

        <TabsContent value="active" className="mt-6">
          <ActiveSessionTab />
        </TabsContent>
      </Tabs>

      {/* Create Session Dialog */}
      <Dialog open={showCreateDialog} onOpenChange={setShowCreateDialog}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Create Collaboration Session</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium mb-2">Session Title</label>
              <Input
                value={newSessionData.title}
                onChange={(e) => setNewSessionData(prev => ({ ...prev, title: e.target.value }))}
                placeholder="Enter session title..."
              />
            </div>

            <div>
              <label className="block text-sm font-medium mb-2">Description</label>
              <Textarea
                value={newSessionData.description}
                onChange={(e) => setNewSessionData(prev => ({ ...prev, description: e.target.value }))}
                placeholder="Describe what you'll be working on..."
                className="min-h-[80px]"
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium mb-2">Session Type</label>
                <select
                  value={newSessionData.session_type}
                  onChange={(e) => setNewSessionData(prev => ({ ...prev, session_type: e.target.value as any }))}
                  className="w-full p-3 border rounded-md"
                >
                  <option value="problem_solving">Problem Solving</option>
                  <option value="peer_review">Peer Review</option>
                  <option value="discussion">Discussion</option>
                  <option value="study_group">Study Group</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium mb-2">Max Participants</label>
                <select
                  value={newSessionData.max_participants}
                  onChange={(e) => setNewSessionData(prev => ({ ...prev, max_participants: parseInt(e.target.value) }))}
                  className="w-full p-3 border rounded-md"
                >
                  <option value={2}>2 participants</option>
                  <option value={4}>4 participants</option>
                  <option value={6}>6 participants</option>
                  <option value={8}>8 participants</option>
                </select>
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium mb-2">Problem/Content (Optional)</label>
              <Textarea
                value={newSessionData.problem_content}
                onChange={(e) => setNewSessionData(prev => ({ ...prev, problem_content: e.target.value }))}
                placeholder="Share the problem or content you want to collaborate on..."
                className="min-h-[100px]"
              />
            </div>

            <div className="flex justify-between">
              <Button onClick={() => setShowCreateDialog(false)} variant="outline">
                Cancel
              </Button>
              <Button onClick={createSession} disabled={!newSessionData.title.trim()}>
                Create Session
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
};
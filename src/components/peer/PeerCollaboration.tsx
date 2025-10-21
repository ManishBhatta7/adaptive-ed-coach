import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Textarea } from '@/components/ui/textarea';
import { supabase } from '@/lib/supabase';
import { useAppContext } from '@/context/AppContext';
import { 
  Users, 
  MessageCircle, 
  Share2, 
  Heart,
  ThumbsUp,
  MessageSquare,
  Clock,
  Star,
  Target,
  Lightbulb,
  Award,
  Play,
  UserPlus
} from 'lucide-react';

interface PeerGroup {
  id: string;
  name: string;
  description: string;
  member_count: number;
  user_role: string;
  last_activity: string;
  members?: GroupMember[];
}

interface GroupMember {
  id: string;
  name: string;
  role: string;
  avatar_url?: string;
  joined_at: string;
  metacog_score?: number;
}

interface SharedReflection {
  id: string;
  reflection_id: string;
  shared_by: string;
  shared_by_name: string;
  shared_by_avatar?: string;
  content: string;
  strategies: string[];
  quality_score: number;
  shared_at: string;
  tags: string[];
  comment_count: number;
  likes: number;
  user_has_liked: boolean;
}

interface PeerComment {
  id: string;
  commenter_name: string;
  commenter_avatar?: string;
  content: string;
  comment_type: string;
  created_at: string;
}

interface CollaborationSession {
  id: string;
  title: string;
  description: string;
  session_type: string;
  status: string;
  participant_count: number;
  started_at?: string;
  scheduled_for?: string;
}

export const PeerCollaboration: React.FC = () => {
  const { state } = useAppContext();
  const [activeTab, setActiveTab] = useState<string>('groups');
  const [userGroups, setUserGroups] = useState<PeerGroup[]>([]);
  const [selectedGroup, setSelectedGroup] = useState<PeerGroup | null>(null);
  const [sharedReflections, setSharedReflections] = useState<SharedReflection[]>([]);
  const [sessions, setSessions] = useState<CollaborationSession[]>([]);
  const [selectedReflection, setSelectedReflection] = useState<SharedReflection | null>(null);
  const [comments, setComments] = useState<PeerComment[]>([]);
  const [newComment, setNewComment] = useState('');
  const [commentType, setCommentType] = useState<string>('feedback');
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    if (state.currentUser) {
      loadUserGroups();
    }
  }, [state.currentUser]);

  useEffect(() => {
    if (selectedGroup) {
      loadGroupData();
    }
  }, [selectedGroup]);

  const loadUserGroups = async () => {
    if (!state.currentUser) return;

    try {
      const { data, error } = await supabase
        .rpc('get_user_peer_groups', { user_uuid: state.currentUser.id });

      if (error) {
        console.error('Error loading user groups:', error);
        return;
      }

      const groups: PeerGroup[] = (data || []).map((group: any) => ({
        id: group.group_id,
        name: group.group_name,
        description: group.group_description,
        member_count: parseInt(group.member_count),
        user_role: group.user_role,
        last_activity: group.last_activity
      }));

      setUserGroups(groups);

      // Auto-select first group if available
      if (groups.length > 0 && !selectedGroup) {
        setSelectedGroup(groups[0]);
      }
    } catch (error) {
      console.error('Error loading user groups:', error);
    }
  };

  const loadGroupData = async () => {
    if (!selectedGroup) return;

    setIsLoading(true);
    try {
      // Load group members
      const { data: membersData, error: membersError } = await supabase
        .from('peer_group_members')
        .select(`
          user_id,
          role,
          joined_at,
          profiles:user_id (
            name,
            avatar_url,
            metacog_score
          )
        `)
        .eq('group_id', selectedGroup.id);

      if (membersError) {
        console.error('Error loading group members:', membersError);
      } else {
        const members: GroupMember[] = (membersData || []).map((member: any) => ({
          id: member.user_id,
          name: member.profiles?.name || 'Unknown',
          role: member.role,
          avatar_url: member.profiles?.avatar_url,
          joined_at: member.joined_at,
          metacog_score: member.profiles?.metacog_score || 0
        }));

        setSelectedGroup(prev => prev ? { ...prev, members } : null);
      }

      // Load shared reflections
      await loadSharedReflections();

      // Load collaboration sessions
      await loadCollaborationSessions();

    } catch (error) {
      console.error('Error loading group data:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const loadSharedReflections = async () => {
    if (!selectedGroup) return;

    try {
      const { data, error } = await supabase
        .from('shared_reflections')
        .select(`
          *,
          profiles:shared_by (
            name,
            avatar_url
          ),
          peer_comments (count)
        `)
        .eq('group_id', selectedGroup.id)
        .order('shared_at', { ascending: false });

      if (error) {
        console.error('Error loading shared reflections:', error);
        return;
      }

      // Get reflection content from metacog_events
      const reflections: SharedReflection[] = [];
      
      for (const reflection of data || []) {
        const { data: eventData, error: eventError } = await supabase
          .from('metacog_events')
          .select('payload')
          .eq('id', reflection.reflection_id)
          .single();

        if (!eventError && eventData) {
          reflections.push({
            id: reflection.id,
            reflection_id: reflection.reflection_id,
            shared_by: reflection.shared_by,
            shared_by_name: reflection.profiles?.name || 'Anonymous',
            shared_by_avatar: reflection.profiles?.avatar_url,
            content: eventData.payload.reflection_text || 'No content available',
            strategies: eventData.payload.strategies_used || [],
            quality_score: eventData.payload.quality_score || 0,
            shared_at: reflection.shared_at,
            tags: reflection.tags || [],
            comment_count: reflection.peer_comments?.[0]?.count || 0,
            likes: 0, // TODO: Implement likes
            user_has_liked: false
          });
        }
      }

      setSharedReflections(reflections);

    } catch (error) {
      console.error('Error processing shared reflections:', error);
    }
  };

  const loadCollaborationSessions = async () => {
    if (!selectedGroup) return;

    try {
      const { data, error } = await supabase
        .from('collaboration_sessions')
        .select(`
          *,
          session_participants (count)
        `)
        .eq('group_id', selectedGroup.id)
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
        status: session.status,
        participant_count: session.session_participants?.[0]?.count || 0,
        started_at: session.started_at,
        scheduled_for: session.created_at
      }));

      setSessions(sessionList);

    } catch (error) {
      console.error('Error loading collaboration sessions:', error);
    }
  };

  const shareReflection = async (reflectionId: string) => {
    if (!selectedGroup || !state.currentUser) return;

    try {
      const { error } = await supabase
        .from('shared_reflections')
        .insert({
          reflection_id: reflectionId,
          shared_by: state.currentUser.id,
          group_id: selectedGroup.id,
          visibility: 'group',
          allow_comments: true
        });

      if (error) {
        console.error('Error sharing reflection:', error);
        return;
      }

      // Reload shared reflections
      await loadSharedReflections();

      // Log the sharing event
      await supabase.rpc('log_metacog_event', {
        p_event_type: 'reflection_shared',
        p_user_id: state.currentUser.id,
        p_payload: {
          reflection_id: reflectionId,
          group_id: selectedGroup.id
        }
      });

    } catch (error) {
      console.error('Error sharing reflection:', error);
    }
  };

  const loadReflectionComments = async (reflectionId: string) => {
    try {
      const { data, error } = await supabase
        .from('peer_comments')
        .select(`
          *,
          profiles:commenter_id (
            name,
            avatar_url
          )
        `)
        .eq('shared_reflection_id', reflectionId)
        .order('created_at', { ascending: true });

      if (error) {
        console.error('Error loading comments:', error);
        return;
      }

      const commentList: PeerComment[] = (data || []).map((comment: any) => ({
        id: comment.id,
        commenter_name: comment.profiles?.name || 'Anonymous',
        commenter_avatar: comment.profiles?.avatar_url,
        content: comment.content,
        comment_type: comment.comment_type,
        created_at: comment.created_at
      }));

      setComments(commentList);

    } catch (error) {
      console.error('Error loading comments:', error);
    }
  };

  const addComment = async () => {
    if (!selectedReflection || !newComment.trim() || !state.currentUser) return;

    try {
      const { error } = await supabase
        .from('peer_comments')
        .insert({
          shared_reflection_id: selectedReflection.id,
          commenter_id: state.currentUser.id,
          content: newComment.trim(),
          comment_type: commentType
        });

      if (error) {
        console.error('Error adding comment:', error);
        return;
      }

      setNewComment('');
      await loadReflectionComments(selectedReflection.id);

      // Log the comment event
      await supabase.rpc('log_metacog_event', {
        p_event_type: 'peer_comment_added',
        p_user_id: state.currentUser.id,
        p_payload: {
          reflection_id: selectedReflection.reflection_id,
          comment_type: commentType
        }
      });

    } catch (error) {
      console.error('Error adding comment:', error);
    }
  };

  const joinSession = async (sessionId: string) => {
    if (!state.currentUser) return;

    try {
      const { error } = await supabase
        .from('session_participants')
        .insert({
          session_id: sessionId,
          user_id: state.currentUser.id,
          participation_role: 'participant'
        });

      if (error) {
        console.error('Error joining session:', error);
        return;
      }

      await loadCollaborationSessions();

    } catch (error) {
      console.error('Error joining session:', error);
    }
  };

  const formatTimeAgo = (dateString: string) => {
    const now = new Date();
    const past = new Date(dateString);
    const diffInHours = Math.floor((now.getTime() - past.getTime()) / (1000 * 60 * 60));
    
    if (diffInHours < 1) return 'Just now';
    if (diffInHours < 24) return `${diffInHours}h ago`;
    return `${Math.floor(diffInHours / 24)}d ago`;
  };

  // Groups Tab Component
  const GroupsTab = () => (
    <div className="space-y-6">
      {userGroups.length === 0 ? (
        <Card>
          <CardContent className="p-6 text-center">
            <Users className="w-16 h-16 text-gray-400 mx-auto mb-4" />
            <h3 className="text-lg font-semibold mb-2">No Peer Groups Yet</h3>
            <p className="text-gray-600 mb-4">
              Join or create peer groups to collaborate with classmates on metacognitive learning.
            </p>
            <Button className="flex items-center gap-2">
              <UserPlus className="w-4 h-4" />
              Find Groups
            </Button>
          </CardContent>
        </Card>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {userGroups.map((group) => (
            <Card 
              key={group.id} 
              className={`cursor-pointer transition-all ${
                selectedGroup?.id === group.id ? 'ring-2 ring-blue-500' : 'hover:shadow-lg'
              }`}
              onClick={() => setSelectedGroup(group)}
            >
              <CardHeader className="pb-3">
                <div className="flex items-center justify-between">
                  <CardTitle className="text-lg">{group.name}</CardTitle>
                  <Badge variant={group.user_role === 'leader' ? 'default' : 'secondary'}>
                    {group.user_role}
                  </Badge>
                </div>
                <p className="text-sm text-gray-600 line-clamp-2">{group.description}</p>
              </CardHeader>
              <CardContent>
                <div className="flex items-center justify-between text-sm">
                  <div className="flex items-center gap-2">
                    <Users className="w-4 h-4" />
                    {group.member_count} members
                  </div>
                  <div className="flex items-center gap-2 text-gray-500">
                    <Clock className="w-4 h-4" />
                    {formatTimeAgo(group.last_activity)}
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {selectedGroup && selectedGroup.members && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Users className="w-5 h-5" />
              {selectedGroup.name} Members
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {selectedGroup.members.map((member) => (
                <div key={member.id} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                  <div className="flex items-center gap-3">
                    <Avatar className="w-8 h-8">
                      <AvatarImage src={member.avatar_url} />
                      <AvatarFallback>{member.name[0]}</AvatarFallback>
                    </Avatar>
                    <div>
                      <div className="font-medium">{member.name}</div>
                      <div className="text-sm text-gray-600">{member.role}</div>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <Badge variant="outline">
                      Score: {member.metacog_score?.toFixed(1) || 'N/A'}
                    </Badge>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );

  // Shared Reflections Tab Component
  const ReflectionsTab = () => (
    <div className="space-y-6">
      {sharedReflections.length === 0 ? (
        <Card>
          <CardContent className="p-6 text-center">
            <Share2 className="w-16 h-16 text-gray-400 mx-auto mb-4" />
            <h3 className="text-lg font-semibold mb-2">No Shared Reflections</h3>
            <p className="text-gray-600 mb-4">
              Start sharing your reflections with the group to get peer feedback.
            </p>
            <Button className="flex items-center gap-2">
              <Share2 className="w-4 h-4" />
              Share a Reflection
            </Button>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-4">
          {sharedReflections.map((reflection) => (
            <Card key={reflection.id}>
              <CardHeader className="pb-3">
                <div className="flex items-start justify-between">
                  <div className="flex items-center gap-3">
                    <Avatar className="w-8 h-8">
                      <AvatarImage src={reflection.shared_by_avatar} />
                      <AvatarFallback>{reflection.shared_by_name[0]}</AvatarFallback>
                    </Avatar>
                    <div>
                      <div className="font-medium">{reflection.shared_by_name}</div>
                      <div className="text-sm text-gray-600">{formatTimeAgo(reflection.shared_at)}</div>
                    </div>
                  </div>
                  <Badge variant="outline">
                    Quality: {(reflection.quality_score * 100).toFixed(0)}%
                  </Badge>
                </div>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="prose prose-sm max-w-none">
                  <p>{reflection.content}</p>
                </div>

                {reflection.strategies.length > 0 && (
                  <div className="flex gap-2">
                    <strong className="text-sm">Strategies:</strong>
                    <div className="flex gap-1">
                      {reflection.strategies.map((strategy, index) => (
                        <Badge key={index} variant="secondary" className="text-xs">
                          {strategy}
                        </Badge>
                      ))}
                    </div>
                  </div>
                )}

                <div className="flex items-center justify-between pt-2 border-t">
                  <div className="flex items-center gap-4">
                    <Button variant="ghost" size="sm" className="flex items-center gap-2">
                      <ThumbsUp className="w-4 h-4" />
                      {reflection.likes}
                    </Button>
                    <Button 
                      variant="ghost" 
                      size="sm" 
                      className="flex items-center gap-2"
                      onClick={() => {
                        setSelectedReflection(reflection);
                        loadReflectionComments(reflection.id);
                      }}
                    >
                      <MessageSquare className="w-4 h-4" />
                      {reflection.comment_count} comments
                    </Button>
                  </div>
                  <div className="flex gap-1">
                    {reflection.tags.map((tag, index) => (
                      <Badge key={index} variant="outline" className="text-xs">
                        #{tag}
                      </Badge>
                    ))}
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {/* Comment Modal/Drawer (simplified) */}
      {selectedReflection && (
        <Card className="mt-6">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <MessageCircle className="w-5 h-5" />
              Comments on {selectedReflection.shared_by_name}'s reflection
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {/* Existing Comments */}
            <div className="space-y-3 max-h-64 overflow-y-auto">
              {comments.map((comment) => (
                <div key={comment.id} className="flex gap-3 p-3 bg-gray-50 rounded-lg">
                  <Avatar className="w-6 h-6">
                    <AvatarImage src={comment.commenter_avatar} />
                    <AvatarFallback>{comment.commenter_name[0]}</AvatarFallback>
                  </Avatar>
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-1">
                      <span className="font-medium text-sm">{comment.commenter_name}</span>
                      <Badge variant="outline" className="text-xs">{comment.comment_type}</Badge>
                      <span className="text-xs text-gray-500">{formatTimeAgo(comment.created_at)}</span>
                    </div>
                    <p className="text-sm">{comment.content}</p>
                  </div>
                </div>
              ))}
            </div>

            {/* Add Comment */}
            <div className="space-y-3 pt-3 border-t">
              <div className="flex gap-2">
                {['feedback', 'question', 'encouragement', 'suggestion'].map((type) => (
                  <Button
                    key={type}
                    variant={commentType === type ? 'default' : 'outline'}
                    size="sm"
                    onClick={() => setCommentType(type)}
                  >
                    {type}
                  </Button>
                ))}
              </div>
              <Textarea
                value={newComment}
                onChange={(e) => setNewComment(e.target.value)}
                placeholder={`Add your ${commentType}...`}
                className="min-h-[80px]"
              />
              <div className="flex justify-between">
                <Button variant="outline" onClick={() => setSelectedReflection(null)}>
                  Close
                </Button>
                <Button onClick={addComment} disabled={!newComment.trim()}>
                  Post Comment
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );

  // Sessions Tab Component
  const SessionsTab = () => (
    <div className="space-y-6">
      {sessions.length === 0 ? (
        <Card>
          <CardContent className="p-6 text-center">
            <Target className="w-16 h-16 text-gray-400 mx-auto mb-4" />
            <h3 className="text-lg font-semibold mb-2">No Collaboration Sessions</h3>
            <p className="text-gray-600 mb-4">
              Join or start collaborative problem-solving sessions with your group.
            </p>
            <Button className="flex items-center gap-2">
              <Play className="w-4 h-4" />
              Start Session
            </Button>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-4">
          {sessions.map((session) => (
            <Card key={session.id}>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <CardTitle className="text-lg">{session.title}</CardTitle>
                  <div className="flex items-center gap-2">
                    <Badge 
                      variant={
                        session.status === 'active' ? 'default' :
                        session.status === 'completed' ? 'secondary' : 'outline'
                      }
                    >
                      {session.status}
                    </Badge>
                    <Badge variant="outline">{session.session_type.replace('_', ' ')}</Badge>
                  </div>
                </div>
                <p className="text-gray-600">{session.description}</p>
              </CardHeader>
              <CardContent>
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-4 text-sm">
                    <div className="flex items-center gap-2">
                      <Users className="w-4 h-4" />
                      {session.participant_count} participants
                    </div>
                    <div className="flex items-center gap-2">
                      <Clock className="w-4 h-4" />
                      {session.started_at ? 
                        `Started ${formatTimeAgo(session.started_at)}` : 
                        `Scheduled ${formatTimeAgo(session.scheduled_for || '')}`
                      }
                    </div>
                  </div>
                  <div className="flex gap-2">
                    {session.status === 'planned' && (
                      <Button 
                        onClick={() => joinSession(session.id)}
                        className="flex items-center gap-2"
                      >
                        <UserPlus className="w-4 h-4" />
                        Join
                      </Button>
                    )}
                    {session.status === 'active' && (
                      <Button className="flex items-center gap-2">
                        <Play className="w-4 h-4" />
                        Enter Session
                      </Button>
                    )}
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );

  if (!state.currentUser) {
    return (
      <Alert>
        <AlertDescription>
          Please log in to access peer collaboration features.
        </AlertDescription>
      </Alert>
    );
  }

  return (
    <div className="max-w-6xl mx-auto p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Peer Collaboration</h1>
          <p className="text-gray-600 mt-2">
            Learn together through shared reflections and group problem-solving
          </p>
        </div>
        {selectedGroup && (
          <Badge variant="outline" className="text-lg px-3 py-1">
            {selectedGroup.name}
          </Badge>
        )}
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="groups" className="flex items-center gap-2">
            <Users className="w-4 h-4" />
            Groups
          </TabsTrigger>
          <TabsTrigger value="reflections" className="flex items-center gap-2">
            <Share2 className="w-4 h-4" />
            Shared Reflections
          </TabsTrigger>
          <TabsTrigger value="sessions" className="flex items-center gap-2">
            <Target className="w-4 h-4" />
            Sessions
          </TabsTrigger>
        </TabsList>

        <TabsContent value="groups" className="mt-6">
          <GroupsTab />
        </TabsContent>

        <TabsContent value="reflections" className="mt-6">
          <ReflectionsTab />
        </TabsContent>

        <TabsContent value="sessions" className="mt-6">
          <SessionsTab />
        </TabsContent>
      </Tabs>

      {isLoading && (
        <div className="text-center py-8">
          <div className="animate-spin w-8 h-8 border-2 border-blue-600 border-t-transparent rounded-full mx-auto"></div>
          <p className="text-gray-600 mt-2">Loading...</p>
        </div>
      )}
    </div>
  );
};
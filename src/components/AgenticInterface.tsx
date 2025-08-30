import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Textarea } from '@/components/ui/textarea';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Badge } from '@/components/ui/badge';
import { supabase } from '@/lib/supabase';
import { useAppContext } from '@/context/AppContext';
import AIImageLoader from '@/components/ui/ai-image-loader';
import { Bot, Image, Database, BookOpen, Brain, Sparkles } from 'lucide-react';

interface AgentAction {
  action: string;
  context: {
    userMessage?: string;
    currentPage?: string;
    userRole?: string;
    data?: any;
  };
}

const AgenticInterface = () => {
  const { state } = useAppContext();
  const [isProcessing, setIsProcessing] = useState(false);
  const [userInput, setUserInput] = useState('');
  const [agentResponse, setAgentResponse] = useState<any>(null);
  const [conversationHistory, setConversationHistory] = useState<any[]>([]);

  const sendToAgent = async (actionData: AgentAction) => {
    setIsProcessing(true);
    try {
      // First, get the initial JSON response from the agent
      const { data, error } = await supabase.functions.invoke('gemini-agent', {
        body: {
          ...actionData,
          context: {
            ...actionData.context,
            currentPage: window.location.pathname,
            userRole: state.currentUser?.role || 'student'
          }
        }
      });

      if (error) throw error;
      
      // If we got structured data, send it back to the LLM to render as HTML content
      if (data.success && data.agent_response) {
        try {
          const renderResponse = await supabase.functions.invoke('gemini-agent', {
            body: {
              action: 'render_structured_data',
              context: {
                userMessage: `Please convert this structured data into beautifully formatted HTML content that can be rendered in a browser. Make it visually appealing with proper styling classes. Here is the data: ${JSON.stringify(data.agent_response)}`,
                structuredData: data.agent_response,
                renderMode: true
              }
            }
          });

          if (renderResponse.data?.success) {
            // Use the rendered HTML content
            setAgentResponse({
              ...data,
              rendered_content: renderResponse.data.agent_response?.content || renderResponse.data.raw_response,
              original_json: data.agent_response
            });
          } else {
            // Fallback to original response
            setAgentResponse(data);
          }
        } catch (renderError) {
          console.warn('Could not render structured data, using original:', renderError);
          setAgentResponse(data);
        }
      } else {
        setAgentResponse(data);
      }
      
      setConversationHistory(prev => [...prev, {
        type: 'user_action',
        action: actionData.action,
        message: actionData.context.userMessage,
        timestamp: new Date()
      }, {
        type: 'agent_response',
        response: data,
        timestamp: new Date()
      }]);
      
    } catch (error) {
      console.error('Error communicating with agent:', error);
      setAgentResponse({
        success: false,
        error: error.message
      });
    } finally {
      setIsProcessing(false);
    }
  };

  const handleQuickAction = (action: string, message?: string) => {
    sendToAgent({
      action: action,
      context: {
        userMessage: message || `Perform action: ${action}`
      }
    });
  };

  const handleCustomMessage = () => {
    if (!userInput.trim()) return;
    
    sendToAgent({
      action: 'process_user_message',
      context: {
        userMessage: userInput
      }
    });
    
    setUserInput('');
  };

  const renderActionResult = (result: any) => {
    if (!result) return null;

    return (
      <div className="space-y-4">
        {result.success ? (
          <div className="space-y-3">
            {/* Only show the final rendered content in an editable format */}
            {result.rendered_content && (
              <Card>
                <CardContent className="p-6">
                  <div 
                    className="prose prose-lg max-w-none min-h-[400px] p-4 border border-border rounded-lg bg-background focus-within:ring-2 focus-within:ring-ring"
                    contentEditable
                    suppressContentEditableWarning={true}
                    dangerouslySetInnerHTML={{ __html: result.rendered_content }}
                    style={{
                      outline: 'none',
                      lineHeight: '1.6',
                      fontSize: '16px'
                    }}
                  />
                </CardContent>
              </Card>
            )}

            {/* Show generated images without technical details */}
            {result.agent_response?.function_results?.map((funcResult: any, index: number) => (
              funcResult.result?.image_url && (
                <Card key={index}>
                  <CardContent className="p-4">
                    <div className="space-y-3">
                      <div className="relative">
                        <img 
                          src={funcResult.result.image_url} 
                          alt="AI Generated content"
                          className="max-w-full h-auto rounded-lg border shadow-sm"
                        />
                      </div>
                      
                      <div className="flex flex-wrap gap-2">
                        <Button 
                          size="sm" 
                          variant="outline"
                          onClick={() => {
                            const link = document.createElement('a');
                            link.href = funcResult.result.image_url;
                            link.download = `ai-generated-image.${funcResult.result.format || 'png'}`;
                            link.click();
                          }}
                        >
                          Download {(funcResult.result.format || 'PNG').toUpperCase()}
                        </Button>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              )
            ))}

            {/* Fallback to original content if no rendered content */}
            {!result.rendered_content && result.agent_response?.content && (
              <Card>
                <CardContent className="p-6">
                  <div 
                    className="min-h-[400px] p-4 border border-border rounded-lg bg-background focus-within:ring-2 focus-within:ring-ring whitespace-pre-wrap"
                    contentEditable
                    suppressContentEditableWarning={true}
                    style={{
                      outline: 'none',
                      lineHeight: '1.6',
                      fontSize: '16px'
                    }}
                  >
                    {result.agent_response.content}
                  </div>
                </CardContent>
              </Card>
            )}
          </div>
        ) : (
          <Alert variant="destructive">
            <AlertDescription>
              Error: {result.error}
            </AlertDescription>
          </Alert>
        )}
      </div>
    );
  };

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Bot className="h-5 w-5" />
            AI Agent Interface
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
            <Button
              variant="outline"
              onClick={() => handleQuickAction('generate_study_image', 'Create a visual study aid as a high-quality PNG image')}
              disabled={isProcessing}
              className="flex items-center gap-2"
            >
              <Image className="h-4 w-4" />
              Generate PNG
            </Button>
            
            <Button
              variant="outline"
              onClick={() => handleQuickAction('generate_study_image', 'Create a visual study aid as a JPG image with transparent background')}
              disabled={isProcessing}
              className="flex items-center gap-2"
            >
              <Image className="h-4 w-4" />
              Generate JPG
            </Button>
            
            <Button
              variant="outline"
              onClick={() => handleQuickAction('analyze_my_progress', 'Analyze my learning progress')}
              disabled={isProcessing}
              className="flex items-center gap-2"
            >
              <Database className="h-4 w-4" />
              Analyze Progress
            </Button>
            
            <Button
              variant="outline"
              onClick={() => handleQuickAction('create_quiz', 'Create a practice quiz for me')}
              disabled={isProcessing}
              className="flex items-center gap-2"
            >
              <BookOpen className="h-4 w-4" />
              Create Quiz
            </Button>
            
            <Button
              variant="outline"
              onClick={() => handleQuickAction('help_with_doubts', 'Help me understand my doubts better')}
              disabled={isProcessing}
              className="flex items-center gap-2"
            >
              <Brain className="h-4 w-4" />
              Process Doubts
            </Button>
          </div>

          <div className="space-y-2">
            <Textarea
              placeholder="Tell the AI agent what you'd like to do... (e.g., 'Create a diagram explaining photosynthesis', 'Generate a math quiz about algebra', 'Analyze my weak subjects')"
              value={userInput}
              onChange={(e) => setUserInput(e.target.value)}
              rows={3}
            />
            <Button 
              onClick={handleCustomMessage}
              disabled={isProcessing || !userInput.trim()}
              className="w-full"
            >
              {isProcessing ? 'Processing...' : 'Send to AI Agent'}
            </Button>
          </div>
        </CardContent>
      </Card>

      {agentResponse && renderActionResult(agentResponse)}
    </div>
  );
};

export default AgenticInterface;
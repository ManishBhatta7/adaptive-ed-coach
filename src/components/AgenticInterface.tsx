import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Textarea } from '@/components/ui/textarea';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Badge } from '@/components/ui/badge';
import { supabase } from '@/lib/supabase';
import { useAppContext } from '@/context/AppContext';
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
            <Alert>
              <Bot className="h-4 w-4" />
              <AlertDescription>
                Agent processed your request successfully
              </AlertDescription>
            </Alert>

            {/* Render the LLM-processed HTML content */}
            {result.rendered_content && (
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Brain className="h-4 w-4" />
                    AI Agent Response
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div 
                    className="prose prose-sm max-w-none [&>*]:mb-4 [&>h1]:text-2xl [&>h2]:text-xl [&>h3]:text-lg [&>p]:text-base [&>ul]:list-disc [&>ol]:list-decimal [&>li]:ml-4"
                    dangerouslySetInnerHTML={{ __html: result.rendered_content }}
                  />
                </CardContent>
              </Card>
            )}

            {/* Fallback to original structured response if no rendered content */}
            {!result.rendered_content && result.agent_response?.content && (
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Brain className="h-4 w-4" />
                    Agent Response
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="whitespace-pre-wrap">
                    {result.agent_response.content}
                  </div>
                </CardContent>
              </Card>
            )}

            {result.agent_response?.function_results && (
              <div className="space-y-2">
                <h3 className="font-semibold flex items-center gap-2">
                  <Sparkles className="h-4 w-4" />
                  Generated Content:
                </h3>
                {result.agent_response.function_results.map((funcResult: any, index: number) => (
                  <Card key={index}>
                    <CardContent className="p-4">
                      <div className="flex items-center justify-between mb-3">
                        <Badge variant="outline" className="flex items-center gap-1">
                          {funcResult.function === 'generate_image' && <Image className="h-3 w-3" />}
                          {funcResult.function}
                        </Badge>
                        {funcResult.result?.format && (
                          <Badge variant="secondary" className="text-xs">
                            {funcResult.result.format.toUpperCase()} • {funcResult.result.size}
                          </Badge>
                        )}
                      </div>
                      
                      {funcResult.result?.image_url && (
                        <div className="space-y-3">
                          <div className="relative">
                            <img 
                              src={funcResult.result.image_url} 
                              alt="AI Generated content"
                              className="max-w-full h-auto rounded-lg border shadow-sm"
                            />
                          </div>
                          
                          {/* Download options for different formats */}
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
                            
                            {funcResult.result.generator && (
                              <Badge variant="outline" className="text-xs">
                                Generated by {funcResult.result.generator}
                              </Badge>
                            )}
                          </div>
                          
                          {funcResult.result.prompt && (
                            <details className="text-xs text-muted-foreground">
                              <summary className="cursor-pointer hover:text-foreground">
                                View generation prompt
                              </summary>
                              <p className="mt-1 p-2 bg-muted rounded text-xs">
                                {funcResult.result.prompt}
                              </p>
                            </details>
                          )}
                        </div>
                      )}
                      
                      {funcResult.result && typeof funcResult.result === 'string' && (
                        <div className="text-sm text-muted-foreground">
                          {funcResult.result}
                        </div>
                      )}
                      
                      {funcResult.result && typeof funcResult.result === 'object' && !funcResult.result.image_url && (
                        <div className="text-sm">
                          <pre className="bg-muted p-2 rounded text-xs overflow-auto">
                            {JSON.stringify(funcResult.result, null, 2)}
                          </pre>
                        </div>
                      )}
                    </CardContent>
                  </Card>
                ))}
              </div>
            )}

            {/* Show original JSON data in collapsible section for debugging */}
            {result.original_json && (
              <details className="mt-4">
                <summary className="cursor-pointer text-sm text-muted-foreground hover:text-foreground">
                  View Original Structured Data
                </summary>
                <Card className="mt-2">
                  <CardContent className="p-3">
                    <pre className="text-xs overflow-auto bg-muted p-2 rounded">
                      {JSON.stringify(result.original_json, null, 2)}
                    </pre>
                  </CardContent>
                </Card>
              </details>
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

      {conversationHistory.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>Conversation History</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3 max-h-96 overflow-y-auto">
              {conversationHistory.map((item, index) => (
                <div key={index} className={`p-3 rounded-lg ${
                  item.type === 'user_action' 
                    ? 'bg-primary/10 ml-4' 
                    : 'bg-muted mr-4'
                }`}>
                  <div className="text-xs text-muted-foreground mb-1">
                    {item.timestamp.toLocaleTimeString()} - {item.type.replace('_', ' ')}
                  </div>
                  <div className="text-sm">
                    {item.type === 'user_action' ? (
                      <span><strong>Action:</strong> {item.action} - {item.message}</span>
                    ) : (
                      <span>{item.response?.agent_response?.content || 'Processing...'}</span>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
};

export default AgenticInterface;
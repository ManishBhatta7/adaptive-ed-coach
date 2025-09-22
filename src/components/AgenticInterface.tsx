import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Textarea } from '@/components/ui/textarea';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { supabase } from '@/lib/supabase';
import { useAppContext } from '@/context/AppContext';
import { Bot, Image, Database, BookOpen, Brain, Sparkles, Download, FileText, Copy, RefreshCw } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import jsPDF from 'jspdf';

interface AgentAction {
  action: string;
  context: {
    userMessage?: string;
    currentPage?: string;
    userRole?: string;
    data?: any;
  };
}

interface AgentResponse {
  success: boolean;
  agent_response?: {
    content?: string;
    function_results?: Array<{
      function: string;
      result: {
        image_url?: string;
        format?: string;
        data?: any;
      };
    }>;
  };
  rendered_content?: string;
  original_json?: any;
  error?: string;
  raw_response?: string;
}

const AgenticInterface = () => {
  const { state } = useAppContext();
  const { toast } = useToast();
  const [isProcessing, setIsProcessing] = useState(false);
  const [userInput, setUserInput] = useState('');
  const [imagePrompt, setImagePrompt] = useState('Create a beautiful educational diagram with vibrant colors and clear visual elements');
  const [isGeneratingImage, setIsGeneratingImage] = useState(false);
  const [agentResponse, setAgentResponse] = useState<AgentResponse | null>(null);
  const [conversationHistory, setConversationHistory] = useState<any[]>([]);

  const sendToAgent = async (actionData: AgentAction) => {
    setIsProcessing(true);
    setAgentResponse(null);
    
    try {
      // Call the gemini-agent function
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

      if (error) {
        console.error('Agent error:', error);
        throw new Error(error.message || 'Failed to communicate with AI agent');
      }
      
      console.log('Agent response:', data);
      
      if (data.success) {
        setAgentResponse(data);
        
        // Add to conversation history
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
        
        toast({
          title: "AI Response Generated",
          description: "The AI agent has processed your request successfully",
        });
      } else {
        throw new Error(data.error || 'AI agent returned unsuccessful response');
      }
      
    } catch (error: any) {
      console.error('Error communicating with agent:', error);
      setAgentResponse({
        success: false,
        error: error.message || 'Failed to communicate with AI agent'
      });
      
      toast({
        title: "AI Agent Error",
        description: error.message || 'Failed to process your request',
        variant: "destructive"
      });
    } finally {
      setIsProcessing(false);
    }
  };

  const handleImageGeneration = async (format: 'png' | 'jpg') => {
    if (!imagePrompt.trim()) {
      toast({
        title: "Prompt Required",
        description: "Please enter a description for the image you want to generate",
        variant: "destructive"
      });
      return;
    }
    
    setIsGeneratingImage(true);
    
    try {
      const { data, error } = await supabase.functions.invoke('gemini-image-generator', {
        body: {
          prompt: imagePrompt,
          format: format,
          size: '1024x1024',
          style: 'educational',
          quality: 'high'
        }
      });

      if (error) {
        console.error('Image generation error:', error);
        throw new Error(error.message || 'Failed to generate image');
      }

      console.log('Image generation response:', data);

      if (data.success && data.image_url) {
        // Create a mock agent response for the image
        setAgentResponse({
          success: true,
          agent_response: {
            content: `Generated educational image: ${imagePrompt}`,
            function_results: [{
              function: 'generate_image',
              result: {
                image_url: data.image_url,
                format: data.format || format,
                data: data
              }
            }]
          }
        });
        
        toast({
          title: "Image Generated",
          description: "Your educational diagram has been created successfully",
        });
      } else {
        throw new Error('No image URL in response');
      }
    } catch (error: any) {
      console.error('Error generating image:', error);
      toast({
        title: "Image Generation Failed",
        description: error.message || 'Failed to generate image',
        variant: "destructive"
      });
    } finally {
      setIsGeneratingImage(false);
    }
  };

  const handleQuickAction = (action: string, message?: string) => {
    const actionMessage = message || `Perform action: ${action}`;
    
    sendToAgent({
      action: action,
      context: {
        userMessage: actionMessage
      }
    });
  };

  const handleCustomMessage = () => {
    if (!userInput.trim()) {
      toast({
        title: "Message Required",
        description: "Please enter a message to send to the AI agent",
        variant: "destructive"
      });
      return;
    }
    
    sendToAgent({
      action: 'process_user_message',
      context: {
        userMessage: userInput
      }
    });
    
    setUserInput('');
  };

  const copyToClipboard = async (text: string) => {
    try {
      await navigator.clipboard.writeText(text);
      toast({
        title: "Copied to Clipboard",
        description: "Content has been copied to your clipboard",
      });
    } catch (error) {
      toast({
        title: "Copy Failed",
        description: "Failed to copy content to clipboard",
        variant: "destructive"
      });
    }
  };

  const exportToPDF = async () => {
    if (!agentResponse?.agent_response?.content && !agentResponse?.rendered_content) {
      toast({
        title: "No Content to Export",
        description: "Generate some AI content first before exporting",
        variant: "destructive"
      });
      return;
    }

    try {
      const doc = new jsPDF();
      
      // Add header
      doc.setFillColor(155, 135, 245);
      doc.rect(14, 10, 182, 15, 'F');
      doc.setTextColor(255, 255, 255);
      doc.setFont('helvetica', 'bold');
      doc.setFontSize(14);
      doc.text('AI Agent Response', 105, 20, { align: 'center' });
      
      // Reset text color
      doc.setTextColor(0, 0, 0);
      doc.setFont('helvetica', 'normal');
      doc.setFontSize(10);
      
      // Add timestamp
      doc.text(`Generated: ${new Date().toLocaleString()}`, 14, 35);
      doc.text(`User: ${state.currentUser?.name || 'Unknown'}`, 14, 42);
      
      // Add content
      let yPosition = 55;
      const content = agentResponse.rendered_content || agentResponse.agent_response?.content || 'No content available';
      
      // Remove HTML tags for PDF
      const cleanContent = content.replace(/<[^>]*>/g, '').replace(/&nbsp;/g, ' ');
      
      // Split content into lines that fit the page width
      const lines = doc.splitTextToSize(cleanContent, 180);
      
      lines.forEach((line: string) => {
        if (yPosition > 280) {
          doc.addPage();
          yPosition = 20;
        }
        doc.text(line, 14, yPosition);
        yPosition += 5;
      });
      
      // Save the PDF
      const fileName = `ai-agent-response-${new Date().toISOString().split('T')[0]}.pdf`;
      doc.save(fileName);
      
      toast({
        title: "PDF Exported",
        description: `Response exported as ${fileName}`,
      });
    } catch (error) {
      console.error('PDF export error:', error);
      toast({
        title: "Export Failed",
        description: "Failed to export PDF. Please try again.",
        variant: "destructive"
      });
    }
  };

  const renderActionResult = (result: AgentResponse) => {
    if (!result) return null;

    return (
      <div className="space-y-4">
        {result.success ? (
          <div className="space-y-3">
            {/* Main Content Display */}
            {(result.rendered_content || result.agent_response?.content) && (
              <Card>
                <CardHeader>
                  <div className="flex items-center justify-between">
                    <CardTitle className="flex items-center gap-2">
                      <Bot className="h-5 w-5 text-purple-600" />
                      AI Agent Response
                    </CardTitle>
                    <div className="flex gap-2">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => copyToClipboard(result.rendered_content || result.agent_response?.content || '')}
                      >
                        <Copy className="h-4 w-4 mr-2" />
                        Copy
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={exportToPDF}
                      >
                        <FileText className="h-4 w-4 mr-2" />
                        Export PDF
                      </Button>
                    </div>
                  </div>
                </CardHeader>
                <CardContent className="p-6">
                  <div className="bg-gradient-to-r from-purple-50 to-pink-50 border border-purple-200 rounded-lg p-6">
                    {result.rendered_content ? (
                      <div 
                        className="prose prose-lg max-w-none"
                        dangerouslySetInnerHTML={{ __html: result.rendered_content }}
                      />
                    ) : (
                      <div className="whitespace-pre-wrap text-gray-800 leading-relaxed">
                        {result.agent_response?.content}
                      </div>
                    )}
                  </div>
                </CardContent>
              </Card>
            )}

            {/* Generated Images */}
            {result.agent_response?.function_results?.map((funcResult, index) => (
              funcResult.result?.image_url && (
                <Card key={index}>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <Image className="h-5 w-5 text-blue-600" />
                      Generated Educational Image
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="p-4">
                    <div className="space-y-3">
                      <div className="relative group">
                        <img 
                          src={funcResult.result.image_url} 
                          alt="AI Generated Educational Content"
                          className="w-full h-auto rounded-lg border shadow-sm max-w-2xl mx-auto"
                        />
                        <div className="absolute inset-0 bg-black/0 group-hover:bg-black/5 transition-colors rounded-lg"></div>
                      </div>
                      
                      <div className="flex flex-wrap gap-2 justify-center">
                        <Button 
                          size="sm" 
                          variant="outline"
                          onClick={() => {
                            const link = document.createElement('a');
                            link.href = funcResult.result.image_url!;
                            link.download = `ai-generated-image.${funcResult.result.format || 'png'}`;
                            link.click();
                          }}
                        >
                          <Download className="h-4 w-4 mr-2" />
                          Download {(funcResult.result.format || 'PNG').toUpperCase()}
                        </Button>
                        <Button 
                          size="sm" 
                          variant="outline"
                          onClick={() => copyToClipboard(funcResult.result.image_url!)}
                        >
                          <Copy className="h-4 w-4 mr-2" />
                          Copy URL
                        </Button>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              )
            ))}

            {/* Raw Response for Debugging */}
            {result.raw_response && result.raw_response !== result.agent_response?.content && (
              <Card className="border-gray-200">
                <CardHeader>
                  <CardTitle className="text-sm text-gray-600">Raw AI Response</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="bg-gray-50 p-4 rounded-lg text-sm font-mono whitespace-pre-wrap max-h-40 overflow-y-auto">
                    {result.raw_response}
                  </div>
                </CardContent>
              </Card>
            )}
          </div>
        ) : (
          <Alert variant="destructive">
            <AlertDescription>
              <strong>Error:</strong> {result.error || 'Unknown error occurred'}
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
            <Bot className="h-5 w-5 text-purple-600" />
            AI Agent Interface
            <Badge variant="outline" className="ml-auto">
              Powered by Gemini & GPT-5
            </Badge>
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* Image Generation Section */}
          <div className="space-y-4 p-4 bg-gradient-to-r from-purple-50 to-blue-50 rounded-lg border border-purple-200">
            <h3 className="text-lg font-semibold text-purple-900 flex items-center gap-2">
              <Image className="h-5 w-5" />
              AI Visual Learning Assistant
            </h3>
            
            <div className="space-y-3">
              <Textarea
                placeholder="Describe the educational diagram you want to create... (e.g., 'Create a diagram showing the water cycle with clear labels and vibrant colors')"
                value={imagePrompt}
                onChange={(e) => setImagePrompt(e.target.value)}
                rows={2}
                className="resize-none border-purple-200 focus:border-purple-500"
              />
              
              <div className="flex gap-2">
                <Button
                  variant="outline"
                  onClick={() => handleImageGeneration('png')}
                  disabled={isGeneratingImage || !imagePrompt.trim()}
                  className="flex items-center gap-2 border-purple-200 text-purple-600 hover:bg-purple-50"
                >
                  <Image className="h-4 w-4" />
                  {isGeneratingImage ? 'Generating...' : 'Generate PNG'}
                </Button>
                
                <Button
                  variant="outline"
                  onClick={() => handleImageGeneration('jpg')}
                  disabled={isGeneratingImage || !imagePrompt.trim()}
                  className="flex items-center gap-2 border-blue-200 text-blue-600 hover:bg-blue-50"
                >
                  <Image className="h-4 w-4" />
                  {isGeneratingImage ? 'Generating...' : 'Generate JPG'}
                </Button>
              </div>
            </div>

            {isGeneratingImage && (
              <div className="flex items-center justify-center p-8 bg-white/50 rounded-lg">
                <div className="text-center space-y-3">
                  <div className="animate-spin h-8 w-8 border-2 border-purple-500 border-t-transparent rounded-full mx-auto"></div>
                  <p className="text-sm text-purple-700">Creating your educational diagram...</p>
                </div>
              </div>
            )}
          </div>

          {/* Quick Actions */}
          <div className="grid grid-cols-2 md:grid-cols-3 gap-2">
            <Button
              variant="outline"
              onClick={() => handleQuickAction('analyze_my_progress', 'Analyze my learning progress and provide insights')}
              disabled={isProcessing}
              className="flex items-center gap-2 border-green-200 text-green-600 hover:bg-green-50"
            >
              <Database className="h-4 w-4" />
              Analyze Progress
            </Button>
            
            <Button
              variant="outline"
              onClick={() => handleQuickAction('create_quiz', 'Create a practice quiz based on my recent performance')}
              disabled={isProcessing}
              className="flex items-center gap-2 border-blue-200 text-blue-600 hover:bg-blue-50"
            >
              <BookOpen className="h-4 w-4" />
              Create Quiz
            </Button>
            
            <Button
              variant="outline"
              onClick={() => handleQuickAction('help_with_doubts', 'Help me understand my learning challenges and provide solutions')}
              disabled={isProcessing}
              className="flex items-center gap-2 border-orange-200 text-orange-600 hover:bg-orange-50"
            >
              <Brain className="h-4 w-4" />
              Process Doubts
            </Button>
            
            <Button
              variant="outline"
              onClick={() => handleQuickAction('create_study_plan', 'Create a personalized study plan for me')}
              disabled={isProcessing}
              className="flex items-center gap-2 border-pink-200 text-pink-600 hover:bg-pink-50"
            >
              <Sparkles className="h-4 w-4" />
              Study Plan
            </Button>
            
            <Button
              variant="outline"
              onClick={() => handleQuickAction('explain_concept', 'Explain a difficult concept in simple terms')}
              disabled={isProcessing}
              className="flex items-center gap-2 border-indigo-200 text-indigo-600 hover:bg-indigo-50"
            >
              <Brain className="h-4 w-4" />
              Explain Concept
            </Button>
            
            <Button
              variant="outline"
              onClick={() => handleQuickAction('generate_summary', 'Generate a summary of my recent learning activities')}
              disabled={isProcessing}
              className="flex items-center gap-2 border-teal-200 text-teal-600 hover:bg-teal-50"
            >
              <FileText className="h-4 w-4" />
              Generate Summary
            </Button>
          </div>

          {/* Custom Message Input */}
          <div className="space-y-2">
            <Textarea
              placeholder="Tell the AI agent what you'd like to do... (e.g., 'Create a study guide for algebra', 'Explain photosynthesis in simple terms', 'Generate practice questions for history')"
              value={userInput}
              onChange={(e) => setUserInput(e.target.value)}
              rows={3}
              className="border-purple-200 focus:border-purple-500"
            />
            <div className="flex gap-2">
              <Button 
                onClick={handleCustomMessage}
                disabled={isProcessing || !userInput.trim()}
                className="flex-1 bg-gradient-to-r from-purple-500 to-pink-600 hover:from-purple-600 hover:to-pink-700"
              >
                {isProcessing ? (
                  <>
                    <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
                    Processing...
                  </>
                ) : (
                  <>
                    <Bot className="h-4 w-4 mr-2" />
                    Send to AI Agent
                  </>
                )}
              </Button>
              <Button
                variant="outline"
                onClick={() => setUserInput('')}
                disabled={isProcessing}
                className="border-gray-200"
              >
                Clear
              </Button>
            </div>
          </div>

          {/* Processing Indicator */}
          {isProcessing && (
            <Card className="border-blue-200 bg-blue-50">
              <CardContent className="p-4">
                <div className="flex items-center gap-3">
                  <div className="animate-spin h-5 w-5 border-2 border-blue-500 border-t-transparent rounded-full"></div>
                  <div className="flex-1">
                    <p className="text-sm font-medium text-blue-900">AI Agent is thinking...</p>
                    <p className="text-xs text-blue-700">Processing your request with advanced AI models</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          )}
        </CardContent>
      </Card>

      {/* Response Display */}
      {agentResponse && renderActionResult(agentResponse)}

      {/* Conversation History */}
      {conversationHistory.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Brain className="h-5 w-5 text-gray-600" />
              Conversation History
              <Badge variant="secondary">{conversationHistory.length / 2} interactions</Badge>
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3 max-h-60 overflow-y-auto">
              {conversationHistory.slice(-6).map((item, index) => (
                <div key={index} className={`p-3 rounded-lg ${
                  item.type === 'user_action' 
                    ? 'bg-blue-50 border-l-4 border-blue-400' 
                    : 'bg-green-50 border-l-4 border-green-400'
                }`}>
                  <div className="flex items-center justify-between mb-1">
                    <span className="text-sm font-medium">
                      {item.type === 'user_action' ? 'You' : 'AI Agent'}
                    </span>
                    <span className="text-xs text-gray-500">
                      {new Date(item.timestamp).toLocaleTimeString()}
                    </span>
                  </div>
                  <p className="text-sm text-gray-700">
                    {item.type === 'user_action' 
                      ? item.message || item.action
                      : (item.response?.agent_response?.content?.substring(0, 100) + '...' || 'Response generated')
                    }
                  </p>
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
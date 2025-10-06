import "https://deno.land/x/xhr@0.1.0/mod.ts";
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { 
      prompt, 
      style = 'educational', 
      size = '1024x1024',
      format = 'png',
      quality = 'high',
      background = 'auto'
    } = await req.json();

    if (!prompt) {
      throw new Error('Prompt is required');
    }

    const lovableApiKey = Deno.env.get('LOVABLE_API_KEY');
    
    if (!lovableApiKey) {
      throw new Error('LOVABLE_API_KEY not configured');
    }

    console.log('Using Lovable AI Nano banana for image generation');
    
    const enhancedPrompt = `Educational illustration: ${prompt}. Style: ${style}, clean, informative, visually appealing, professional, high-quality`;

    const response = await fetch('https://ai.gateway.lovable.dev/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${lovableApiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'google/gemini-2.5-flash-image-preview',
        messages: [
          {
            role: 'user',
            content: enhancedPrompt
          }
        ],
        modalities: ['image', 'text']
      }),
    });

    if (!response.ok) {
      const error = await response.json();
      console.error('Lovable AI error:', error);
      throw new Error(`Lovable AI error: ${error.error?.message || 'Unknown error'}`);
    }

    const data = await response.json();
    const imageUrl = data.choices?.[0]?.message?.images?.[0]?.image_url?.url;
    
    if (!imageUrl) {
      throw new Error('No image URL returned from Lovable AI');
    }

    console.log('Lovable AI image generated successfully');
    
    return new Response(JSON.stringify({ 
      success: true,
      image_url: imageUrl,
      prompt: enhancedPrompt,
      format: format,
      size: size,
      generator: 'lovable-ai-nano-banana'
    }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    });

  } catch (error) {
    console.error('Error in gemini-image-generator function:', error);
    return new Response(JSON.stringify({
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error'
    }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    });
  }
});

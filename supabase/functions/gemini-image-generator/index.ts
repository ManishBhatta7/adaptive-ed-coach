import "https://deno.land/x/xhr@0.1.0/mod.ts";
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { HfInference } from 'https://esm.sh/@huggingface/inference@2.3.2';

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

    // Try OpenAI first for better quality and format support
    const openaiApiKey = Deno.env.get('OPENAI_API_KEY');
    
    if (openaiApiKey) {
      try {
        console.log('Using OpenAI for image generation');
        
        const enhancedPrompt = `Educational illustration: ${prompt}. Style: ${style}, clean, informative, visually appealing, professional, high-quality`;

        const response = await fetch('https://api.openai.com/v1/images/generations', {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${openaiApiKey}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            model: 'gpt-image-1',
            prompt: enhancedPrompt,
            size: size,
            quality: quality,
            output_format: format === 'jpg' ? 'jpeg' : format,
            background: background,
            n: 1
          }),
        });

        if (response.ok) {
          const data = await response.json();
          const imageUrl = data.data[0].url || data.data[0].b64_json ? `data:image/${format};base64,${data.data[0].b64_json}` : null;
          
          console.log('OpenAI image generated successfully');
          
          return new Response(JSON.stringify({ 
            success: true,
            image_url: imageUrl,
            prompt: enhancedPrompt,
            format: format,
            size: size,
            generator: 'openai'
          }), {
            headers: { ...corsHeaders, 'Content-Type': 'application/json' }
          });
        }
      } catch (openaiError) {
        console.log('OpenAI failed, falling back to HuggingFace:', openaiError instanceof Error ? openaiError.message : 'Unknown error');
      }
    }

    // Fallback to HuggingFace
    const hf = new HfInference(Deno.env.get('HUGGING_FACE_ACCESS_TOKEN'));
    const enhancedPrompt = `Educational illustration: ${prompt}. Style: ${style}, clean, informative, visually appealing`;

    console.log('Generating image with HuggingFace, prompt:', enhancedPrompt);

    const image = await hf.textToImage({
      inputs: enhancedPrompt,
      model: 'black-forest-labs/FLUX.1-schnell',
      parameters: {
        width: parseInt(size.split('x')[0]),
        height: parseInt(size.split('x')[1]),
      }
    });

    // Convert the blob to a base64 string
    const arrayBuffer = await image.arrayBuffer();
    const base64 = btoa(String.fromCharCode(...new Uint8Array(arrayBuffer)));
    
    const imageUrl = `data:image/png;base64,${base64}`;

    console.log('HuggingFace image generated successfully');

    return new Response(JSON.stringify({ 
      success: true,
      image_url: imageUrl,
      prompt: enhancedPrompt,
      format: 'png', // HuggingFace returns PNG
      size: size,
      generator: 'huggingface'
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
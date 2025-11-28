import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

const MODEL_NAME = 'gemini-2.0-flash-lite';
const API_VERSION = 'v1beta';

// === HELPER: STREAMING UPLOAD ===
async function uploadToGemini(fileUrl: string, apiKey: string) {
  console.log(`[Stream] Downloading: ${fileUrl}`);
  
  const fileRes = await fetch(fileUrl);
  if (!fileRes.ok) throw new Error(`Failed to fetch file: ${fileRes.statusText}`);
  
  const contentLength = fileRes.headers.get('content-length');
  let mimeType = fileRes.headers.get('content-type') || 'application/octet-stream';
  
  // Correct MIME types based on extension
  if (fileUrl.match(/\.pdf$/i)) mimeType = 'application/pdf';
  else if (fileUrl.match(/\.png$/i)) mimeType = 'image/png';
  else if (fileUrl.match(/\.jpe?g$/i)) mimeType = 'image/jpeg';

  console.log(`[Stream] Uploading ${contentLength} bytes (${mimeType})...`);

  const uploadUrl = `https://generativelanguage.googleapis.com/upload/v1beta/files?key=${apiKey}`;
  
  const googleRes = await fetch(uploadUrl, {
    method: 'POST',
    headers: {
      'X-Goog-Upload-Protocol': 'raw',
      'X-Goog-Upload-Command': 'start, upload, finalize',
      'X-Goog-Upload-Header-Content-Length': contentLength || '',
      'X-Goog-Upload-Header-Content-Type': mimeType,
      'Content-Type': mimeType, 
    },
    body: fileRes.body
  });

  if (!googleRes.ok) {
    const errText = await googleRes.text();
    throw new Error(`Gemini File API Error: ${errText}`);
  }

  const json = await googleRes.json();
  return { file_data: { mime_type: mimeType, file_uri: json.file.uri } };
}

serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response(null, { headers: corsHeaders });

  try {
    const { fileUrl } = await req.json();
    const geminiApiKey = Deno.env.get('GEMINI_API_KEY');

    if (!fileUrl) throw new Error("No file provided.");

    const filePart = await uploadToGemini(fileUrl, geminiApiKey);

    // === 1. ROBUST TEXT-BASED PROMPT ===
    const prompt = `
      You are an expert OCR engine for Physics & Math.
      
      TASK:
      1. Extract EVERY question from the document.
      2. **MATH RULES:** Use standard LaTeX for formulas (e.g. $F=ma$, $\\frac{1}{2}$). Do NOT escape backslashes. Write naturally.
      3. **SOLVE:** Provide a step-by-step solution for each question.
      
      CRITICAL OUTPUT FORMAT:
      Do not use JSON. Use these exact delimiters for every question found:
      
      ### QUESTION [Number] ###
      [Question Text Here]
      ### SOLUTION [Number] ###
      [Solution Text Here]
      
      Example:
      ### QUESTION 1 ###
      Calculate the force if $m=10kg$.
      ### SOLUTION 1 ###
      Using $F=ma$, we get...
    `;

    console.log("Sending to Gemini...");
    const response = await fetch(`https://generativelanguage.googleapis.com/${API_VERSION}/models/${MODEL_NAME}:generateContent?key=${geminiApiKey}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        contents: [{ parts: [{ text: prompt }, filePart] }],
        // Disable Safety Filters so Physics/Crash questions aren't blocked
        safetySettings: [
          { category: "HARM_CATEGORY_HARASSMENT", threshold: "BLOCK_NONE" },
          { category: "HARM_CATEGORY_HATE_SPEECH", threshold: "BLOCK_NONE" },
          { category: "HARM_CATEGORY_SEXUALLY_EXPLICIT", threshold: "BLOCK_NONE" },
          { category: "HARM_CATEGORY_DANGEROUS_CONTENT", threshold: "BLOCK_NONE" }
        ],
        generationConfig: {
          temperature: 0.0, // Zero for max accuracy
          maxOutputTokens: 8192
        }
      })
    });

    if (!response.ok) {
      const err = await response.text();
      throw new Error(`AI Error: ${err}`);
    }

    const data = await response.json();
    const rawText = data.candidates?.[0]?.content?.parts?.[0]?.text;
    
    if (!rawText) throw new Error("AI returned empty response.");

    // === 2. ROBUST DELIMITER PARSER ===
    // Splits the text by the "### QUESTION" marker instead of parsing JSON
    const items = [];
    const blocks = rawText.split('### QUESTION');

    for (const block of blocks) {
      if (!block.trim()) continue; // Skip empty start
      
      // Format: " 1 ### \n Question... \n ### SOLUTION 1 ### \n Solution..."
      // Regex to capture the Number and the rest of the text
      const qNumMatch = block.match(/^\s*(\S+?)\s*###/);
      
      if (qNumMatch) {
        const qNum = qNumMatch[1]; // e.g. "1" or "2(a)"
        
        // Remove the header to get the body
        const restOfBlock = block.replace(/^\s*\S+?\s*###/, '');
        
        // Split by the Solution delimiter
        // We use a loose regex for the solution tag in case AI messed up the number in the solution tag
        const parts = restOfBlock.split(/### SOLUTION.*?###/);
        
        let questionText = parts[0]?.trim() || "No text";
        let solutionText = parts[1]?.trim() || "";

        // Fallback: If split failed, check if "### SOLUTION" exists at all
        if (parts.length < 2 && restOfBlock.includes("### SOLUTION")) {
           const genericSplit = restOfBlock.split("### SOLUTION");
           questionText = genericSplit[0].trim();
           // Clean up any trailing hashtags if present
           solutionText = genericSplit[1]?.replace(/^\s*\S*?###/, '').trim() || "";
        }

        items.push({
          q_number: qNum,
          question: questionText,
          solution: solutionText || "Solution not generated."
        });
      }
    }

    // === 3. FALLBACK ===
    // If the parser found nothing (AI failed to follow format), return raw text
    if (items.length === 0) {
       console.warn("Parser failed to find delimiters. Dumping raw text.");
       items.push({
         q_number: "Raw",
         question: "Could not auto-format. Here is the raw output:",
         solution: rawText
       });
    }

    return new Response(JSON.stringify({ items }), { headers: { ...corsHeaders, 'Content-Type': 'application/json' } });

  } catch (error: any) {
    return new Response(JSON.stringify({ error: error.message }), { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
  }
});
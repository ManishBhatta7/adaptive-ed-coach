# AI Configuration Guide

This project now uses **DeepSeek** as the primary AI provider for the doubt-solving system. DeepSeek is an affordable, high-quality AI service.

## DeepSeek Setup (Recommended)

### 1. Get DeepSeek API Key

1. Visit [https://platform.deepseek.com/](https://platform.deepseek.com/)
2. Create an account
3. Navigate to API Keys section
4. Create a new API key
5. Copy your API key

### 2. Configure Environment Variable

Add this to your Supabase Edge Function secrets:

```bash
DEEPSEEK_API_KEY=your_deepseek_api_key_here
```

To set it in Supabase:
- Go to your Supabase Dashboard
- Navigate to Edge Functions
- Add the secret: `DEEPSEEK_API_KEY`

### 3. Pricing

DeepSeek is very affordable:
- **DeepSeek-Chat**: ~$0.14 per million input tokens, ~$0.28 per million output tokens
- Much cheaper than OpenAI GPT-4
- Free tier available for testing

---

## Alternative: Ollama (Self-Hosted, Free)

If you want a completely free, self-hosted solution, you can use Ollama with models like Meta's Llama.

### Prerequisites

1. A server or local machine to run Ollama
2. At least 8GB RAM (16GB recommended)
3. Good internet connection for initial model download

### Setup Steps

#### 1. Install Ollama

On your server:

```bash
# Linux/Mac
curl -fsSL https://ollama.com/install.sh | sh

# Or download from https://ollama.com/download
```

#### 2. Pull a Model

```bash
# Meta Llama 3.1 (8B - good balance)
ollama pull llama3.1

# Or DeepSeek Coder for technical questions
ollama pull deepseek-coder

# Or Mistral for general knowledge
ollama pull mistral
```

#### 3. Run Ollama Server

```bash
# Start Ollama server (runs on port 11434 by default)
ollama serve

# Or run as background service
systemctl start ollama
```

#### 4. Make it Accessible

If running on a remote server, expose it:

```bash
# Option 1: Use ngrok for testing
ngrok http 11434

# Option 2: Configure firewall for production
sudo ufw allow 11434
```

#### 5. Update Edge Function

Modify `supabase/functions/solve-doubt/index.ts`:

```typescript
// Replace DeepSeek API call with Ollama
const ollamaUrl = Deno.env.get('OLLAMA_URL') || 'http://localhost:11434';

const ollamaResponse = await fetch(`${ollamaUrl}/api/generate`, {
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
  },
  body: JSON.stringify({
    model: 'llama3.1',
    prompt: prompt,
    stream: false,
    options: {
      temperature: 0.7,
      num_predict: 1000
    }
  }),
});

const aiData = await ollamaResponse.json();
const aiResponseText = aiData.response || 'No response generated';
```

#### 6. Configure Environment

Set in Supabase Edge Function secrets:

```bash
OLLAMA_URL=https://your-ollama-server.com
```

---

## Comparison

| Feature | DeepSeek | Ollama + Llama |
|---------|----------|----------------|
| **Cost** | Very low (~$0.14/1M tokens) | Free (self-hosting costs) |
| **Setup** | Easy (API key only) | Moderate (server setup) |
| **Performance** | High quality | Good (model dependent) |
| **Latency** | Low (hosted) | Variable (depends on hardware) |
| **Scalability** | Excellent | Limited by hardware |
| **Privacy** | Data sent to DeepSeek | Completely private |

---

## Recommended Models by Use Case

### For Educational Doubts (Current Use)
- **DeepSeek-Chat**: Best balance of cost and quality
- **Llama 3.1 8B**: Good free alternative via Ollama
- **Mistral 7B**: Fast and efficient via Ollama

### For Code-Related Questions
- **DeepSeek-Coder**: Specialized for programming
- **CodeLlama**: Via Ollama, free

### For Multi-language Support
- **Llama 3.1 70B**: Best quality (requires more resources)
- **Mixtral 8x7B**: Good multilingual support

---

## Testing Your Setup

After configuration, test the doubt solver:

1. Log in as a student
2. Submit a doubt via the doubts page
3. Click "Generate AI Solution"
4. Check the response quality

Monitor logs in Supabase Edge Functions dashboard for any errors.

---

## Troubleshooting

### DeepSeek Issues

**Error: API key not configured**
- Verify `DEEPSEEK_API_KEY` is set in Supabase secrets
- Restart edge functions after adding secrets

**Error: Rate limit exceeded**
- DeepSeek has generous rate limits
- Check your usage in DeepSeek dashboard
- Consider caching responses

### Ollama Issues

**Error: Connection refused**
- Verify Ollama server is running: `ollama list`
- Check firewall rules
- Ensure OLLAMA_URL is correct

**Slow responses**
- Check server resources (CPU/RAM/GPU)
- Consider using smaller models (7B instead of 13B)
- Use GPU acceleration if available

**Model not found**
- Run `ollama list` to see available models
- Pull required model: `ollama pull llama3.1`

---

## Next Steps

1. Set up DeepSeek API key in Supabase
2. Test the doubt-solving functionality
3. Optionally set up Ollama for a self-hosted solution
4. Monitor usage and costs
5. Fine-tune prompts for better educational responses

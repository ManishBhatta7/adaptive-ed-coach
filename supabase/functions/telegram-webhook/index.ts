import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.7.1';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface TelegramMessage {
  message_id: number;
  chat: { id: number; type: string };
  from?: { id: number; username?: string; first_name?: string };
  text?: string;
  photo?: Array<{ file_id: string }>;
}

interface TelegramUpdate {
  update_id: number;
  message?: TelegramMessage;
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const update: TelegramUpdate = await req.json();
    console.log('Telegram update received:', JSON.stringify(update));

    const message = update.message;
    if (!message || !message.text) {
      return new Response(JSON.stringify({ ok: true }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      });
    }

    const chatId = message.chat.id;
    const text = message.text.trim();
    const username = message.from?.username;

    // Initialize Supabase
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    // Handle commands
    if (text.startsWith('/start')) {
      await handleStartCommand(supabase, chatId, username);
    } else if (text.startsWith('/ask ')) {
      await handleAskCommand(supabase, chatId, text.substring(5), message.message_id);
    } else if (text.startsWith('/mystatus')) {
      await handleStatusCommand(supabase, chatId);
    } else if (text.startsWith('/help')) {
      await handleHelpCommand(chatId);
    } else {
      // If not a command and user is linked, treat as a doubt submission
      const { data: user } = await supabase
        .from('profiles')
        .select('id')
        .eq('telegram_chat_id', chatId)
        .single();

      if (user) {
        // Create doubt from message
        await handleAskCommand(supabase, chatId, text, message.message_id);
      } else {
        await sendMessage(chatId, `Please use /start to link your account first, then use /ask to submit doubts.\n\nType /help for more info.`);
      }
    }

    return new Response(JSON.stringify({ ok: true }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    });

  } catch (error) {
    console.error('Error in telegram-webhook:', error);
    return new Response(JSON.stringify({ 
      ok: false, 
      error: error instanceof Error ? error.message : 'Unknown error' 
    }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    });
  }
});

async function handleStartCommand(supabase: any, chatId: number, username?: string) {
  // Check if already linked
  const { data: existingUser } = await supabase
    .from('profiles')
    .select('id, name, email')
    .eq('telegram_chat_id', chatId)
    .single();

  if (existingUser) {
    await sendMessage(
      chatId,
      `✅ *Welcome back, ${existingUser.name}!*\n\nYour account is already linked.\n\n📚 Use /ask <your question> to submit a doubt\n📊 Use /mystatus to check your doubts\n❓ Use /help for more commands`,
      'Markdown'
    );
    return;
  }

  await sendMessage(
    chatId,
    `👋 *Welcome to AdaptiveEdCoach!*\n\nTo link your Telegram account, please reply with your registered email address.\n\nExample: student@school.com`,
    'Markdown'
  );

  // Store pending registration state (in a real app, you'd use a proper state management)
  // For now, we'll handle email linking in the next message
}

async function handleAskCommand(supabase: any, chatId: number, question: string, messageId: number) {
  if (!question || question.trim().length < 10) {
    await sendMessage(chatId, '❌ Please provide a detailed question (at least 10 characters).\n\nExample: /ask How do I solve quadratic equations?');
    return;
  }

  // Get user profile
  const { data: user, error: userError } = await supabase
    .from('profiles')
    .select('id, name')
    .eq('telegram_chat_id', chatId)
    .single();

  if (userError || !user) {
    await sendMessage(chatId, '❌ Please use /start to link your account first.');
    return;
  }

  // Extract title (first 100 chars) and full description
  const title = question.length > 100 ? question.substring(0, 97) + '...' : question;
  
  // Auto-detect subject from keywords
  const subjectKeywords: { [key: string]: string[] } = {
    'Mathematics': ['math', 'algebra', 'geometry', 'calculus', 'equation', 'solve', 'number', 'fraction'],
    'Science': ['science', 'physics', 'chemistry', 'biology', 'experiment', 'molecule', 'cell', 'energy'],
    'English': ['grammar', 'essay', 'writing', 'literature', 'sentence', 'paragraph'],
    'History': ['history', 'war', 'date', 'ancient', 'civilization', 'independence'],
  };

  let detectedSubject = 'General';
  const lowerQuestion = question.toLowerCase();
  
  for (const [subject, keywords] of Object.entries(subjectKeywords)) {
    if (keywords.some(keyword => lowerQuestion.includes(keyword))) {
      detectedSubject = subject;
      break;
    }
  }

  // Create doubt in database
  const { data: doubt, error: doubtError } = await supabase
    .from('doubts')
    .insert({
      student_id: user.id,
      title: title,
      description: question,
      subject_area: detectedSubject,
      difficulty_level: 'medium',
      status: 'open',
      telegram_chat_id: chatId,
      telegram_message_id: messageId
    })
    .select()
    .single();

  if (doubtError) {
    console.error('Error creating doubt:', doubtError);
    await sendMessage(chatId, '❌ Failed to save your doubt. Please try again later.');
    return;
  }

  await sendMessage(
    chatId,
    `✅ *Doubt submitted successfully!*\n\n📝 *Question:* ${title}\n🎯 *Subject:* ${detectedSubject}\n\n🤖 Our AI is analyzing your question... You'll receive a response shortly!`,
    'Markdown'
  );

  // Trigger AI resolution
  try {
    await supabase.functions.invoke('solve-doubt', {
      body: { doubtId: doubt.id }
    });
  } catch (solveError) {
    console.error('Error invoking solve-doubt:', solveError);
    // Don't notify user of internal error, they'll get resolved doubt notification later
  }
}

async function handleStatusCommand(supabase: any, chatId: number) {
  const { data: user } = await supabase
    .from('profiles')
    .select('id')
    .eq('telegram_chat_id', chatId)
    .single();

  if (!user) {
    await sendMessage(chatId, '❌ Please use /start to link your account first.');
    return;
  }

  const { data: doubts } = await supabase
    .from('doubts')
    .select('id, title, status, created_at, subject_area')
    .eq('student_id', user.id)
    .order('created_at', { ascending: false })
    .limit(10);

  if (!doubts || doubts.length === 0) {
    await sendMessage(chatId, '📭 You have no doubts yet.\n\nUse /ask to submit your first question!');
    return;
  }

  const statusEmojis: { [key: string]: string } = {
    'open': '🟡',
    'in_progress': '🔵',
    'resolved': '✅',
  };

  let message = `📊 *Your Recent Doubts:*\n\n`;
  
  doubts.forEach((doubt: any, index: number) => {
    const emoji = statusEmojis[doubt.status] || '⚪';
    const subject = doubt.subject_area ? `[${doubt.subject_area}]` : '';
    message += `${index + 1}. ${emoji} ${subject} ${doubt.title}\n   Status: ${doubt.status}\n\n`;
  });

  message += `\nUse /ask to submit a new doubt!`;

  await sendMessage(chatId, message, 'Markdown');
}

async function handleHelpCommand(chatId: number) {
  const helpText = `
📚 *AdaptiveEdCoach Bot Commands*

/start - Link your Telegram account
/ask <question> - Submit a new doubt
/mystatus - View your recent doubts
/help - Show this help message

*How to submit a doubt:*
1. Use /ask followed by your question
2. Example: /ask How does photosynthesis work?
3. Or simply type your question (if account is linked)

*Features:*
• Instant AI-powered answers
• Teacher review for complex questions  
• Track all your doubts in one place
• Get notifications when doubts are resolved

Need help? Contact your teacher!
  `;

  await sendMessage(chatId, helpText, 'Markdown');
}

async function sendMessage(chatId: number, text: string, parseMode: string = 'Markdown') {
  const botToken = Deno.env.get('TELEGRAM_BOT_TOKEN');
  if (!botToken) {
    console.error('TELEGRAM_BOT_TOKEN not configured');
    return;
  }

  try {
    const response = await fetch(`https://api.telegram.org/bot${botToken}/sendMessage`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        chat_id: chatId,
        text: text,
        parse_mode: parseMode
      })
    });

    if (!response.ok) {
      const error = await response.json();
      console.error('Telegram API error:', error);
    }
  } catch (error) {
    console.error('Failed to send message:', error);
  }
}

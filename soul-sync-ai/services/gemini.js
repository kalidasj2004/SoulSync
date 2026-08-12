import AsyncStorage from '@react-native-async-storage/async-storage';

const DEFAULT_GROQ_KEY = process.env.EXPO_PUBLIC_GROQ_API_KEY || '';
const GROQ_API_URL = 'https://api.groq.com/openai/v1/chat/completions';
const CHAT_MODEL = 'llama-3.3-70b-versatile';   // Current active flagship model
const FAST_MODEL = 'llama-3.1-8b-instant';       // Fast model for sentiment / short tasks

let currentSource = 'System';

// Load Groq API Key (supports custom key override from Settings)
export const getGeminiKey = async () => {
  try {
    const customKey = await AsyncStorage.getItem('SOULSYNC_GEMINI_KEY');
    // Only accept valid Groq keys (start with gsk_)
    if (customKey && customKey.trim().startsWith('gsk_')) {
      currentSource = 'Custom Settings';
      return customKey.trim();
    }
    // Clear any stale/invalid cached key
    if (customKey) {
      await AsyncStorage.removeItem('SOULSYNC_GEMINI_KEY');
    }
    currentSource = 'System';
    return DEFAULT_GROQ_KEY.trim();
  } catch (error) {
    console.error('Error reading Groq Key:', error);
    return DEFAULT_GROQ_KEY.trim();
  }
};

export const saveGeminiKey = async (key) => {
  if (key) {
    await AsyncStorage.setItem('SOULSYNC_GEMINI_KEY', key.trim());
  } else {
    await AsyncStorage.removeItem('SOULSYNC_GEMINI_KEY');
  }
};

export const getGeminiConfigInfo = async () => {
  const key = await getGeminiKey();
  return {
    source: currentSource,
    hasKey: !!key,
  };
};

// System personality for SoulSync companion
const SYSTEM_PROMPT = `You are SoulSync, a warm, empathetic, and emotionally intelligent AI companion. 
Your role is to provide emotional support, mindfulness guidance, and gentle mental wellness coaching.

Guidelines:
- Be warm, caring, and non-judgmental
- Keep responses concise (2–4 sentences) unless guiding an exercise
- Reflect the user's emotions back to them with compassion
- Gently suggest wellness activities (breathing, grounding, journaling) when appropriate
- Never diagnose or replace professional help — always encourage seeking support when needed
- Use calming, positive language`;

// 1. Generate Chat Response
export const generateChatResponse = async (userMessage, history = []) => {
  const apiKey = await getGeminiKey();
  if (!apiKey) {
    throw new Error('Groq API key is missing. Please configure it in Settings.');
  }

  // Build message history in OpenAI format
  const messages = [
    { role: 'system', content: SYSTEM_PROMPT },
  ];

  // Add past history
  history.forEach(msg => {
    messages.push({
      role: msg.sender === 'user' ? 'user' : 'assistant',
      content: msg.message,
    });
  });

  // Add current user message
  messages.push({ role: 'user', content: userMessage });

  const requestBody = {
    model: CHAT_MODEL,
    messages,
    temperature: 0.75,
    max_tokens: 400,
    top_p: 0.9,
  };

  try {
    const response = await fetch(GROQ_API_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${apiKey}`,
      },
      body: JSON.stringify(requestBody),
    });

    const data = await response.json();

    if (!response.ok) {
      throw new Error(data.error?.message || `Groq API error: ${response.status}`);
    }

    const text = data.choices?.[0]?.message?.content;
    if (!text) throw new Error('Empty response from Groq API');
    return text.trim();
  } catch (error) {
    console.error('Groq Chat Error:', error);
    throw error;
  }
};

// 2. Sentiment Analysis via Groq
export const getSentimentFromGemini = async (text) => {
  const apiKey = await getGeminiKey();
  if (!apiKey) return 'neutral';

  const messages = [
    {
      role: 'system',
      content: 'You are a sentiment classifier. Classify text into exactly one of: happy, neutral, sad, stressed, angry. Reply with ONLY the single word, no punctuation or explanation.'
    },
    {
      role: 'user',
      content: `Classify the sentiment: "${text}"`
    }
  ];

  try {
    const response = await fetch(GROQ_API_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${apiKey}`,
      },
      body: JSON.stringify({
        model: FAST_MODEL,
        messages,
        temperature: 0.1,
        max_tokens: 5,
      }),
    });

    const data = await response.json();
    if (!response.ok) return 'neutral';

    const result = data.choices?.[0]?.message?.content?.toLowerCase()?.trim();
    const validMoods = ['happy', 'neutral', 'sad', 'stressed', 'angry'];

    if (result && validMoods.includes(result)) return result;
    for (const mood of validMoods) {
      if (result?.includes(mood)) return mood;
    }
    return 'neutral';
  } catch (error) {
    console.error('Groq Sentiment Error:', error);
    return 'neutral';
  }
};

// 3. Transcribe Audio (Groq Whisper)
export const transcribeAudioWithGemini = async (base64AudioData, mimeType) => {
  const apiKey = await getGeminiKey();
  if (!apiKey) {
    throw new Error('Groq API key is required for voice transcription.');
  }

  try {
    // Convert base64 to blob
    const byteCharacters = atob(base64AudioData);
    const byteNumbers = new Array(byteCharacters.length);
    for (let i = 0; i < byteCharacters.length; i++) {
      byteNumbers[i] = byteCharacters.charCodeAt(i);
    }
    const byteArray = new Uint8Array(byteNumbers);
    const audioBlob = new Blob([byteArray], { type: mimeType });

    const formData = new FormData();
    formData.append('file', audioBlob, 'audio.m4a');
    formData.append('model', 'whisper-large-v3');
    formData.append('response_format', 'text');

    const response = await fetch('https://api.groq.com/openai/v1/audio/transcriptions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${apiKey}`,
      },
      body: formData,
    });

    if (!response.ok) {
      const err = await response.json();
      throw new Error(err.error?.message || 'Failed to transcribe audio');
    }

    const transcription = await response.text();
    return transcription.trim();
  } catch (error) {
    console.error('Groq Whisper Error:', error);
    throw error;
  }
};

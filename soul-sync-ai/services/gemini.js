import AsyncStorage from '@react-native-async-storage/async-storage';
import { Platform } from 'react-native';

// Fallback keys loaded from environment
const SYSTEM_KEY = process.env.EXPO_PUBLIC_GROQ_API_KEY || process.env.EXPO_PUBLIC_GEMINI_API_KEY || '';

let currentSource = 'System';

// Load active API Key (supports settings override)
export const getGeminiKey = async () => {
  try {
    const customKey = await AsyncStorage.getItem('SOULSYNC_GEMINI_KEY');
    if (customKey && customKey.trim()) {
      const trimmed = customKey.trim();
      if (trimmed.startsWith('gsk_') || trimmed.startsWith('AIza') || trimmed.startsWith('AQ.')) {
        currentSource = 'Custom Settings';
        return trimmed;
      }
    }
    // Fall back to system key
    currentSource = 'System';
    return SYSTEM_KEY.trim();
  } catch (error) {
    console.error('Error reading API Key:', error);
    return SYSTEM_KEY.trim();
  }
};

export const saveGeminiKey = async (key) => {
  if (key && key.trim()) {
    await AsyncStorage.setItem('SOULSYNC_GEMINI_KEY', key.trim());
  } else {
    await AsyncStorage.removeItem('SOULSYNC_GEMINI_KEY');
  }
};

const checkIsGemini = (key) => key.startsWith('AIza') || key.startsWith('AQ.');

export const getGeminiConfigInfo = async () => {
  const key = await getGeminiKey();
  const provider = checkIsGemini(key) ? 'Google Gemini' : key.startsWith('gsk_') ? 'Groq Llama' : 'None';
  return {
    source: `${currentSource} (${provider})`,
    hasKey: !!key,
  };
};

/* ─── API FETCH WITH RETRY HELPER (Handles 503 Overloads & 429 Rate Limits) ─── */
const fetchWithRetry = async (url, options, retries = 3, delay = 1000) => {
  try {
    const response = await fetch(url, options);
    
    // If rate limit (429), temporary service overload (503), or gateway timeout (504), retry!
    if ((response.status === 429 || response.status === 503 || response.status === 504) && retries > 0) {
      console.warn(`[API Retry] Received status ${response.status}. Retrying in ${delay}ms... (${retries} retries left)`);
      await new Promise(resolve => setTimeout(resolve, delay));
      return fetchWithRetry(url, options, retries - 1, delay * 1.5);
    }
    return response;
  } catch (error) {
    if (retries > 0) {
      console.warn(`[API Retry] Connection error: ${error.message}. Retrying in ${delay}ms... (${retries} retries left)`);
      await new Promise(resolve => setTimeout(resolve, delay));
      return fetchWithRetry(url, options, retries - 1, delay * 1.5);
    }
    throw error;
  }
};

const SYSTEM_PROMPT = `You are SoulSync, a warm, down-to-earth, and friendly wellness companion. Talk to the user like a close, supportive friend who is always there for them.

Guidelines:
- Keep it casual, warm, and friendly. Use friendly contractions (like "I'm", "you're", "that's") and emojis naturally.
- Avoid sounding clinical, formal, or like a therapist. Speak in a relaxed, open conversational tone.
- Keep responses short and engaging (1-3 sentences) so the chat flows easily.
- Show genuine interest and ask friendly, open-ended questions.
- **CRITICAL**: Always respond in the same language and script the user uses to talk to you. If the user writes or speaks in Malayalam, reply in warm, casual, and friendly Malayalam. If they use Manglish (Malayalam written in English script), reply in natural, conversational Manglish or casual Malayalam.
- If they are stressed, suggest breathing or other activities in a friendly way (e.g., "Hey, do you want to try a quick breathing cycle with me?").`;

/* ─── 1. DYNAMIC CHAT GENERATION (Gemini or Groq) ─── */
export const generateChatResponse = async (userMessage, history = []) => {
  const apiKey = await getGeminiKey();
  if (!apiKey) {
    throw new Error('API key is missing. Please configure it in Settings.');
  }

  const isGemini = checkIsGemini(apiKey);
  console.log(`[AI Engine] Routing request to: ${isGemini ? 'Google Gemini' : 'Groq'}`);

  if (isGemini) {
    // ─── GOOGLE GEMINI API ───
    const url = `https://generativelanguage.googleapis.com/v1beta/models/gemini-flash-latest:generateContent?key=${apiKey}`;
    
    // Format history for Gemini contents array
    const contents = [
      {
        role: 'user',
        parts: [{ text: `System Instructions: ${SYSTEM_PROMPT}` }]
      }
    ];

    history.forEach(msg => {
      contents.push({
        role: msg.sender === 'user' ? 'user' : 'model',
        parts: [{ text: msg.message }]
      });
    });

    contents.push({
      role: 'user',
      parts: [{ text: userMessage }]
    });

    try {
      const response = await fetchWithRetry(url, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ contents }),
      });

      const data = await response.json();
      if (!response.ok) {
        throw new Error(data.error?.message || `Gemini Error: ${response.status}`);
      }

      const text = data.candidates?.[0]?.content?.parts?.[0]?.text;
      if (!text) throw new Error('Empty response from Gemini API');
      return text.trim();
    } catch (e) {
      console.error('Gemini API Error:', e);
      throw e;
    }

  } else {
    // ─── GROQ API (OpenAI format) ───
    const url = 'https://api.groq.com/openai/v1/chat/completions';
    const messages = [
      { role: 'system', content: SYSTEM_PROMPT }
    ];

    history.forEach(msg => {
      messages.push({
        role: msg.sender === 'user' ? 'user' : 'assistant',
        content: msg.message
      });
    });

    messages.push({ role: 'user', content: userMessage });

    try {
      const response = await fetchWithRetry(url, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${apiKey}`,
        },
        body: JSON.stringify({
          model: 'llama-3.3-70b-versatile',
          messages,
          temperature: 0.75,
          max_tokens: 400,
        }),
      });

      const data = await response.json();
      if (!response.ok) {
        throw new Error(data.error?.message || `Groq Error: ${response.status}`);
      }

      const text = data.choices?.[0]?.message?.content;
      if (!text) throw new Error('Empty response from Groq');
      return text.trim();
    } catch (e) {
      console.error('Groq API Error:', e);
      throw e;
    }
  }
};

/* ─── 2. SENTIMENT CLASSIFICATION ─── */
export const getSentimentFromGemini = async (text) => {
  const apiKey = await getGeminiKey();
  if (!apiKey) return 'neutral';

  const isGemini = checkIsGemini(apiKey);
  const validMoods = ['happy', 'neutral', 'sad', 'stressed', 'angry'];

  if (isGemini) {
    const url = `https://generativelanguage.googleapis.com/v1beta/models/gemini-flash-latest:generateContent?key=${apiKey}`;
    const prompt = `Analyze the emotional sentiment of this text: "${text}". Classify it strictly as one of the following words in lowercase: happy, neutral, sad, stressed, angry. Output ONLY the single word itself.`;
    
    try {
      const response = await fetchWithRetry(url, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          contents: [{ parts: [{ text: prompt }] }],
          generationConfig: { temperature: 0.1, maxOutputTokens: 5 }
        }),
      });
      const data = await response.json();
      const result = data.candidates?.[0]?.content?.parts?.[0]?.text?.toLowerCase()?.trim();
      if (result && validMoods.includes(result)) return result;
      return 'neutral';
    } catch (_) { return 'neutral'; }

  } else {
    // Groq sentiment
    const url = 'https://api.groq.com/openai/v1/chat/completions';
    try {
      const response = await fetchWithRetry(url, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${apiKey}`,
        },
        body: JSON.stringify({
          model: 'llama-3.1-8b-instant',
          messages: [
            { role: 'system', content: 'Reply with ONLY the single lowercase word: happy, neutral, sad, stressed, angry.' },
            { role: 'user', content: text }
          ],
          temperature: 0.1,
          max_tokens: 5,
        }),
      });
      const data = await response.json();
      const result = data.choices?.[0]?.message?.content?.toLowerCase()?.trim();
      if (result && validMoods.includes(result)) return result;
      return 'neutral';
    } catch (_) { return 'neutral'; }
  }
};

/* ─── 3. AUDIO TRANSCRIPTION ─── */
export const transcribeAudioWithGemini = async (audioUri, mimeType) => {
  const apiKey = await getGeminiKey();
  if (!apiKey) throw new Error('API key is required for voice transcription.');

  const isGemini = checkIsGemini(apiKey);
  
  if (isGemini) {
    // ─── GOOGLE GEMINI AUDIO TRANSCRIPTION ───
    const url = `https://generativelanguage.googleapis.com/v1beta/models/gemini-flash-latest:generateContent?key=${apiKey}`;
    
    try {
      let base64Data = '';
      if (Platform.OS === 'web') {
        const res = await fetch(audioUri);
        const blob = await res.blob();
        base64Data = await new Promise((resolve) => {
          const reader = new FileReader();
          reader.onloadend = () => resolve(reader.result.split(',')[1]);
          reader.readAsDataURL(blob);
        });
      } else {
        const FileSystem = require('expo-file-system');
        base64Data = await FileSystem.readAsStringAsync(audioUri, { encoding: FileSystem.EncodingType.Base64 });
      }

      const prompt = "Transcribe this audio recording exactly. Translate what is spoken into text. Output only the transcription, nothing else.";
      const response = await fetchWithRetry(url, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          contents: [
            {
              parts: [
                { inlineData: { mimeType, data: base64Data } },
                { text: prompt }
              ]
            }
          ]
        })
      });

      const data = await response.json();
      if (!response.ok) throw new Error(data.error?.message || 'Failed Gemini audio transcription');
      const text = data.candidates?.[0]?.content?.parts?.[0]?.text;
      return text ? text.trim() : '';
    } catch (e) {
      console.error('Gemini Audio Transcription Error:', e);
      throw e;
    }

  } else {
    // ─── GROQ WHISPER TRANSCRIPTION ───
    try {
      const formData = new FormData();
      if (Platform.OS === 'web') {
        const blobResponse = await fetch(audioUri);
        const audioBlob = await blobResponse.blob();
        formData.append('file', audioBlob, 'audio.m4a');
      } else {
        formData.append('file', { uri: audioUri, name: 'audio.m4a', type: mimeType });
      }
      formData.append('model', 'whisper-large-v3');
      formData.append('response_format', 'text');

      const response = await fetchWithRetry('https://api.groq.com/openai/v1/audio/transcriptions', {
        method: 'POST',
        headers: { 'Authorization': `Bearer ${apiKey}` },
        body: formData,
      });

      if (!response.ok) {
        const err = await response.json();
        throw new Error(err.error?.message || 'Failed to transcribe audio via Groq');
      }
      const text = await response.text();
      return text.trim();
    } catch (e) {
      console.error('Groq Whisper Transcription Error:', e);
      throw e;
    }
  }
};

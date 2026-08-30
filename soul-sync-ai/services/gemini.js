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

const CONCERNING_PROMPT = `You are SoulSync, a warm and caring wellness companion. The user is expressing feelings of deep sadness, hopelessness, or emotional pain. 

Your role RIGHT NOW:
- Respond with genuine warmth and empathy. Acknowledge their pain without minimizing it.
- Do NOT give advice or solutions immediately.
- Gently encourage them to open up more.
- Softly suggest that talking to someone they trust can help.
- Ask ONE simple caring follow-up question to keep them talking.
- Keep your response to 2-3 short sentences maximum.
- Do NOT claim to be a therapist, doctor, or professional.
- Do NOT use guilt or phrases like "think about your family".
- Respond in the same language the user used.`;

// Import emergency-level prompts from the dedicated safety module
import { EMERGENCY_AI_PROMPT, CONCERNING_AI_PROMPT } from '../utils/safety';

// Keep old HIGH_RISK_PROMPT alias for backward compat with generateSafetyAwareResponse
const HIGH_RISK_PROMPT = EMERGENCY_AI_PROMPT;

/* ─── 1. DYNAMIC CHAT GENERATION (Gemini or Groq) ─── */
export const generateChatResponse = async (userMessage, history = []) => {
  const apiKey = await getGeminiKey();
  if (!apiKey) {
    throw new Error('API key is missing. Please configure it in Settings.');
  }

  const isGemini = checkIsGemini(apiKey);
  console.log(`[AI Engine] Routing request to: ${isGemini ? 'Google Gemini' : 'Groq'}`);

  if (isGemini) {
    // ─── GOOGLE GEMINI API (Optimized for Sub-Second Speedy Replies) ───
    const modelsToTry = ['gemini-3.5-flash-lite', 'gemini-3.5-flash', 'gemini-3.6-flash'];
    
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

    let lastError = null;
    for (const modelName of modelsToTry) {
      const url = `https://generativelanguage.googleapis.com/v1beta/models/${modelName}:generateContent?key=${apiKey}`;
      try {
        const response = await fetchWithRetry(url, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ 
            contents,
            generationConfig: {
              maxOutputTokens: 150,
              temperature: 0.7,
            }
          }),
        }, 1, 300);

        if (!response.ok) {
          const errData = await response.json().catch(() => ({}));
          throw new Error(errData.error?.message || `HTTP ${response.status}`);
        }

        const data = await response.json();
        const text = data.candidates?.[0]?.content?.parts?.[0]?.text;
        if (text) return text.trim();
      } catch (e) {
        lastError = e;
        console.warn(`[Gemini Model Fallback] ${modelName} failed (${e.message}), trying next model...`);
      }
    }
    throw lastError || new Error('All Gemini models failed');

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

/* ─── 2. SAFETY-AWARE RESPONSE GENERATION ─── */
// Generates a Gemini response using the correct safety prompt level.
// riskLevel: 'normal' | 'concerning' | 'high_risk'
export const generateSafetyAwareResponse = async (userMessage, history = [], riskLevel = 'normal') => {
  const apiKey = await getGeminiKey();
  if (!apiKey) throw new Error('API key is missing.');

  const isGemini = checkIsGemini(apiKey);

  // Pick the right system prompt based on risk level
  const promptMap = {
    normal: SYSTEM_PROMPT,
    concerning: CONCERNING_PROMPT,
    high_risk: HIGH_RISK_PROMPT,
  };
  const chosenPrompt = promptMap[riskLevel] || SYSTEM_PROMPT;

  // Limit history to last 6 messages for context (keep it focused)
  const recentHistory = history.slice(-6);

  if (isGemini) {
    const modelsToTry = ['gemini-3.5-flash-lite', 'gemini-3.5-flash', 'gemini-3.6-flash'];
    const contents = [
      { role: 'user', parts: [{ text: `System Instructions: ${chosenPrompt}` }] }
    ];

    recentHistory.forEach(msg => {
      contents.push({
        role: msg.sender === 'user' ? 'user' : 'model',
        parts: [{ text: msg.message }]
      });
    });

    contents.push({ role: 'user', parts: [{ text: userMessage }] });

    let lastError = null;
    for (const modelName of modelsToTry) {
      const url = `https://generativelanguage.googleapis.com/v1beta/models/${modelName}:generateContent?key=${apiKey}`;
      try {
        const response = await fetchWithRetry(url, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            contents,
            generationConfig: {
              maxOutputTokens: riskLevel === 'normal' ? 150 : 200,
              temperature: riskLevel === 'normal' ? 0.7 : 0.5,
            }
          }),
        }, 1, 300);

        if (!response.ok) {
          const errData = await response.json().catch(() => ({}));
          throw new Error(errData.error?.message || `HTTP ${response.status}`);
        }
        const data = await response.json();
        const text = data.candidates?.[0]?.content?.parts?.[0]?.text;
        if (text) return text.trim();
      } catch (e) {
        lastError = e;
        console.warn(`[Safety Response Fallback] ${modelName} failed, trying next...`);
      }
    }
    throw lastError || new Error('All Gemini models failed');
  } else {
    // Groq fallback
    const url = 'https://api.groq.com/openai/v1/chat/completions';
    const messages = [{ role: 'system', content: chosenPrompt }];
    recentHistory.forEach(msg => {
      messages.push({ role: msg.sender === 'user' ? 'user' : 'assistant', content: msg.message });
    });
    messages.push({ role: 'user', content: userMessage });
    const response = await fetchWithRetry(url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${apiKey}` },
      body: JSON.stringify({ model: 'llama-3.3-70b-versatile', messages, temperature: 0.5, max_tokens: 200 }),
    });
    const data = await response.json();
    const text = data.choices?.[0]?.message?.content;
    if (!text) throw new Error('Empty response from Groq');
    return text.trim();
  }
};

/* ─── 3. EMERGENCY RESPONSE GENERATION ─── */
// Called ONLY when detectEmergency() returns 'emergency'.
// Uses EMERGENCY_AI_PROMPT to generate a short, compassionate, non-judgmental response.
// The EmergencySupportCard handles calling services — this just gives the companion's voice.
export const generateEmergencyResponse = async (userMessage) => {
  const apiKey = await getGeminiKey();
  if (!apiKey) {
    // Fallback if no API key — return a hardcoded safe message
    return "I'm really sorry you're going through something this painful. Please stay with me right now — you don't have to face this alone. ❤️";
  }

  const isGemini = checkIsGemini(apiKey);
  const contents = [
    { role: 'user', parts: [{ text: `System Instructions: ${EMERGENCY_AI_PROMPT}` }] },
    { role: 'user', parts: [{ text: userMessage }] },
  ];

  if (isGemini) {
    const modelsToTry = ['gemini-3.5-flash-lite', 'gemini-3.5-flash', 'gemini-3.6-flash'];
    for (const modelName of modelsToTry) {
      try {
        const url = `https://generativelanguage.googleapis.com/v1beta/models/${modelName}:generateContent?key=${apiKey}`;
        const response = await fetchWithRetry(url, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            contents,
            generationConfig: { maxOutputTokens: 120, temperature: 0.4 },
          }),
        }, 1, 300);
        if (!response.ok) throw new Error(`HTTP ${response.status}`);
        const data = await response.json();
        const text = data.candidates?.[0]?.content?.parts?.[0]?.text;
        if (text) return text.trim();
      } catch (e) {
        console.warn(`[Emergency Response] ${modelName} failed, trying next...`);
      }
    }
  } else {
    // Groq fallback
    try {
      const url = 'https://api.groq.com/openai/v1/chat/completions';
      const response = await fetchWithRetry(url, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${apiKey}` },
        body: JSON.stringify({
          model: 'llama-3.3-70b-versatile',
          messages: [
            { role: 'system', content: EMERGENCY_AI_PROMPT },
            { role: 'user', content: userMessage },
          ],
          temperature: 0.4,
          max_tokens: 120,
        }),
      });
      const data = await response.json();
      const text = data.choices?.[0]?.message?.content;
      if (text) return text.trim();
    } catch (e) {
      console.warn('[Emergency Response] Groq failed:', e.message);
    }
  }

  // Final hardcoded fallback — always safe to show
  return "I'm really sorry you're going through something this painful. Please stay with me right now — you don't have to face this alone. ❤️";
};

/* ─── 4. SENTIMENT CLASSIFICATION ─── */
export const getSentimentFromGemini = async (text) => {
  const apiKey = await getGeminiKey();
  if (!apiKey) return 'neutral';

  const isGemini = checkIsGemini(apiKey);
  const validMoods = ['happy', 'neutral', 'sad', 'stressed', 'angry'];

  if (isGemini) {
    const url = `https://generativelanguage.googleapis.com/v1beta/models/gemini-3.5-flash-lite:generateContent?key=${apiKey}`;
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
    // ─── GOOGLE GEMINI AUDIO TRANSCRIPTION (Multimodal Audio Model) ───
    const url = `https://generativelanguage.googleapis.com/v1beta/models/gemini-3.5-flash:generateContent?key=${apiKey}`;
    
    try {
      let base64Data = '';
      let cleanMime = 'audio/webm';

      if (Platform.OS === 'web') {
        const res = await fetch(audioUri);
        const blob = await res.blob();
        if (!blob || blob.size === 0) {
          console.warn('[Audio Transcription] Empty audio recording blob');
          return '';
        }
        if (blob.type) {
          cleanMime = blob.type.split(';')[0].trim();
        }
        base64Data = await new Promise((resolve) => {
          const reader = new FileReader();
          reader.onloadend = () => resolve(reader.result.split(',')[1]);
          reader.readAsDataURL(blob);
        });
      } else {
        cleanMime = mimeType ? mimeType.split(';')[0].trim() : 'audio/mp4';
        if (cleanMime.includes('x-m4a')) cleanMime = 'audio/mp4';
        const FileSystem = require('expo-file-system');
        base64Data = await FileSystem.readAsStringAsync(audioUri, { encoding: FileSystem.EncodingType.Base64 });
      }

      if (!base64Data || base64Data.length < 50) {
        console.warn('[Audio Transcription] Audio data too small or empty');
        return '';
      }

      const prompt = "Transcribe this audio recording exactly. Output only the spoken text in plain text.";
      const response = await fetchWithRetry(url, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          contents: [
            {
              parts: [
                { inlineData: { mimeType: cleanMime, data: base64Data } },
                { text: prompt }
              ]
            }
          ],
          generationConfig: {
            maxOutputTokens: 60,
            temperature: 0.1,
          }
        })
      }, 1, 200);

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

import AsyncStorage from '@react-native-async-storage/async-storage';

const DEFAULT_GEMINI_KEY = process.env.EXPO_PUBLIC_GEMINI_API_KEY || '';
const GEMINI_API_URL = 'https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent';

let currentSource = 'System';

// Load Gemini API Key
export const getGeminiKey = async () => {
  try {
    const customKey = await AsyncStorage.getItem('SOULSYNC_GEMINI_KEY');
    if (customKey) {
      currentSource = 'Custom Settings';
      return customKey.trim();
    }
    currentSource = 'System';
    return DEFAULT_GEMINI_KEY.trim();
  } catch (error) {
    console.error('Error reading Gemini Key:', error);
    return DEFAULT_GEMINI_KEY.trim();
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

// 1. Generate Chat Response with System Instructions & History
export const generateChatResponse = async (userMessage, history = []) => {
  const apiKey = await getGeminiKey();
  if (!apiKey) {
    throw new Error('Gemini API key is missing. Please configure it in Settings.');
  }

  // Format history from database (user/assistant) to Gemini style (user/model)
  const contents = [];
  
  // Format past history entries
  history.forEach(msg => {
    contents.push({
      role: msg.sender === 'user' ? 'user' : 'model',
      parts: [{ text: msg.message }]
    });
  });

  // Append new user message
  contents.push({
    role: 'user',
    parts: [{ text: userMessage }]
  });

  const requestBody = {
    systemInstruction: {
      parts: [
        {
          text: "You are SoulSync AI, an empathetic, supportive, comforting, and encouraging emotional wellness companion. Your goal is to listen to the user, validate their emotions, provide gentle therapeutic support, and recommend positive stress-management techniques. Keep responses warm, concise (usually 2-3 sentences), and deeply compassionate. Avoid clinical or cold language. You can respond in English, Hindi, or Malayalam depending on what language the user has typed in."
        }
      ]
    },
    contents,
    generationConfig: {
      temperature: 0.7,
      maxOutputTokens: 250,
    }
  };

  try {
    const response = await fetch(`${GEMINI_API_URL}?key=${apiKey}`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(requestBody),
    });

    const data = await response.json();
    if (!response.ok) {
      throw new Error(data.error?.message || 'Failed to generate content from Gemini API');
    }

    const reply = data.candidates?.[0]?.content?.parts?.[0]?.text;
    if (!reply) {
      throw new Error('Received an empty response from Gemini API');
    }

    return reply.trim();
  } catch (error) {
    console.error('Gemini Chat Error:', error);
    throw error;
  }
};

// 2. Perform Sentiment Analysis
export const getSentimentFromGemini = async (text) => {
  const apiKey = await getGeminiKey();
  if (!apiKey) return 'neutral'; // Fallback to neutral if no key

  const prompt = `Analyze the emotional sentiment of the text below. Classify it strictly as one of the following words in lowercase: happy, neutral, sad, stressed, angry. Output ONLY the single word itself. No punctuation, no explanation.

Text: "${text}"`;

  const requestBody = {
    contents: [
      {
        parts: [{ text: prompt }]
      }
    ],
    generationConfig: {
      temperature: 0.1,
      maxOutputTokens: 5,
    }
  };

  try {
    const response = await fetch(`${GEMINI_API_URL}?key=${apiKey}`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(requestBody),
    });

    const data = await response.json();
    if (!response.ok) {
      return 'neutral';
    }

    const result = data.candidates?.[0]?.content?.parts?.[0]?.text?.toLowerCase()?.trim();
    const validMoods = ['happy', 'neutral', 'sad', 'stressed', 'angry'];
    if (result && validMoods.includes(result)) {
      return result;
    }
    
    // Check if result contains any of the keywords
    for (const mood of validMoods) {
      if (result?.includes(mood)) return mood;
    }

    return 'neutral';
  } catch (error) {
    console.error('Gemini Sentiment Error:', error);
    return 'neutral';
  }
};

// 3. Transcribe Audio Base64 using Gemini Multimodal Audio Input
export const transcribeAudioWithGemini = async (base64AudioData, mimeType) => {
  const apiKey = await getGeminiKey();
  if (!apiKey) {
    throw new Error('Gemini API key is required for voice transcription.');
  }

  const prompt = "Transcribe this audio recording exactly. Translate what is spoken into text. Output only the transcription, nothing else. If the audio is silent or contains only static/noise, output a blank space.";

  const requestBody = {
    contents: [
      {
        parts: [
          {
            inlineData: {
              mimeType,
              data: base64AudioData,
            }
          },
          {
            text: prompt
          }
        ]
      }
    ],
    generationConfig: {
      temperature: 0.2,
    }
  };

  try {
    const response = await fetch(`${GEMINI_API_URL}?key=${apiKey}`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(requestBody),
    });

    const data = await response.json();
    if (!response.ok) {
      throw new Error(data.error?.message || 'Failed to transcribe audio via Gemini API');
    }

    const transcription = data.candidates?.[0]?.content?.parts?.[0]?.text;
    return transcription ? transcription.trim() : '';
  } catch (error) {
    console.error('Gemini Speech-to-Text Error:', error);
    throw error;
  }
};

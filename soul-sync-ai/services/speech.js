import * as Speech from 'expo-speech';
import { Platform } from 'react-native';

const LOCALE_MAP = {
  en: 'en-US',
  ml: 'ml-IN',
  hi: 'hi-IN',
};

// Unlock browser audio context
let audioUnlocked = false;
const unlockAudio = async () => {
  if (audioUnlocked) return;
  try {
    const AudioContext = window.AudioContext || window.webkitAudioContext;
    if (!AudioContext) return;
    const ctx = new AudioContext();
    await ctx.resume();
    const buf = ctx.createBuffer(1, 1, 22050);
    const src = ctx.createBufferSource();
    src.buffer = buf;
    src.connect(ctx.destination);
    src.start(0);
    audioUnlocked = true;
    console.log('[Speech] Audio context unlocked ✅');
  } catch (e) {
    console.warn('[Speech] Audio unlock error:', e);
  }
};

// Queue state for Web Speech API chunking
let speechQueue = [];
let currentQueueIndex = 0;
let userCancelled = false;
let activeUtterance = null;
let isSpeaking = false;

// Splits text by punctuation (. ! ?) while preserving the punctuation
const splitIntoSentences = (text) => {
  if (!text) return [];
  // Match sentences ending with ., !, or ? and filter empty strings
  const sentences = text.match(/[^.!?]+[.!?]*/g) || [text];
  return sentences
    .map(s => s.trim())
    .filter(s => s.length > 0);
};

// Automatically detect the script/language of the response text
const detectLanguage = (text, requestedLang) => {
  // Malayalam script Unicode block: 0D00 to 0D7F
  if (/[\u0D00-\u0D7F]/.test(text)) {
    return 'ml';
  }
  // Hindi/Devanagari script Unicode block: 0900 to 097F
  if (/[\u0900-\u097F]/.test(text)) {
    return 'hi';
  }
  // If the text contains only Latin (English) characters, read it as English
  // even if Malayalam was requested (preventing reading English with a Malayalam accent).
  if (/^[A-Za-z0-9\s.,!?'"()#@*&%-]+$/.test(text.replace(/[\u0000-\u007F]/g, ''))) {
    return 'en';
  }
  return requestedLang;
};

export const speakText = async (text, languageCode = 'en', onStart, onDone) => {
  if (!text?.trim()) { if (onDone) onDone(); return; }

  const detectedLang = detectLanguage(text, languageCode);
  const locale = LOCALE_MAP[detectedLang] || 'en-US';
  console.log(`[Speech] Speak request. Target lang: ${languageCode} | Detected: ${detectedLang} | Locale: ${locale}`);

  if (Platform.OS === 'web') {
    const synth = window?.speechSynthesis;
    if (!synth) { if (onDone) onDone(); return; }

    // Cancel current play state
    userCancelled = true;
    synth.cancel();
    isSpeaking = false;
    await new Promise(r => setTimeout(r, 200));

    // Unlock audio (safari/chrome/edge autoplay)
    await unlockAudio();

    // Prepare sentence chunks
    const chunks = splitIntoSentences(text);
    console.log(`[Speech] Split text into ${chunks.length} sentence chunks.`);

    speechQueue = chunks;
    currentQueueIndex = 0;
    userCancelled = false;

    // Pick best matching voice
    const voices = synth.getVoices();
    const voiceMatch =
      voices.find(v => v.lang === locale && v.localService) ||
      voices.find(v => v.lang === locale) ||
      voices.find(v => v.lang.startsWith('en'));

    // Recursive player
    const playNextChunk = () => {
      if (userCancelled || currentQueueIndex >= speechQueue.length) {
        console.log('[Speech] Playback queue completed or stopped');
        isSpeaking = false;
        activeUtterance = null;
        if (onDone) onDone();
        return;
      }

      const chunkText = speechQueue[currentQueueIndex];
      console.log(`[Speech] Speaking chunk ${currentQueueIndex + 1}/${speechQueue.length}:`, chunkText.slice(0, 30));

      activeUtterance = new SpeechSynthesisUtterance(chunkText);
      activeUtterance.lang = locale;
      activeUtterance.rate = 0.88;
      activeUtterance.pitch = 1.05;
      activeUtterance.volume = 1.0;

      if (voiceMatch) activeUtterance.voice = voiceMatch;

      activeUtterance.onstart = () => {
        isSpeaking = true;
        // Trigger onStart callback only on the very first sentence chunk
        if (currentQueueIndex === 0 && onStart) {
          onStart();
        }
      };

      activeUtterance.onend = () => {
        currentQueueIndex++;
        playNextChunk();
      };

      activeUtterance.onerror = (e) => {
        console.warn('[Speech] Chunk playback error:', e.error);
        currentQueueIndex++;
        playNextChunk();
      };

      synth.speak(activeUtterance);
    };

    // Start playing the first chunk
    playNextChunk();

  } else {
    // Native iOS / Android
    try {
      await Speech.stop();
      Speech.speak(text, {
        language: locale,
        pitch: 1.0,
        rate: 0.92,
        onStart,
        onDone,
        onStopped: onDone,
        onError: onDone
      });
    } catch (e) {
      console.error('[Speech] Native error:', e);
      if (onDone) onDone();
    }
  }
};

export const stopSpeech = async () => {
  try {
    isSpeaking = false;
    userCancelled = true;
    speechQueue = [];
    activeUtterance = null;
    if (Platform.OS === 'web' && typeof window !== 'undefined' && window.speechSynthesis) {
      window.speechSynthesis.cancel();
    } else {
      await Speech.stop();
    }
  } catch (e) {
    console.error('[Speech] Stop error:', e);
  }
};

export const preloadVoices = () => {
  if (typeof window !== 'undefined' && window.speechSynthesis) {
    window.speechSynthesis.getVoices();
    window.speechSynthesis.onvoiceschanged = () => window.speechSynthesis.getVoices();
  }
};

export const testSpeech = () => {
  if (typeof window !== 'undefined' && window.speechSynthesis) {
    unlockAudio().then(() => {
      window.speechSynthesis.cancel();
      setTimeout(() => {
        activeUtterance = new SpeechSynthesisUtterance('Hello, I am SoulSync.');
        activeUtterance.volume = 1.0;
        activeUtterance.rate = 0.9;
        window.speechSynthesis.speak(activeUtterance);
      }, 250);
    });
    return true;
  }
  return false;
};

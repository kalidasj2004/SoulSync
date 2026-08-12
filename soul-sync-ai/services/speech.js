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

let activeUtterance = null;
let isSpeaking = false;

export const speakText = async (text, languageCode = 'en', onStart, onDone) => {
  if (!text?.trim()) { if (onDone) onDone(); return; }

  const locale = LOCALE_MAP[languageCode] || 'en-US';
  console.log('[Speech] Speak request:', text.slice(0, 40));

  if (Platform.OS === 'web') {
    const synth = window?.speechSynthesis;
    if (!synth) { if (onDone) onDone(); return; }

    // Unlock audio context
    await unlockAudio();

    // Cancel previous speech
    synth.cancel();
    
    // DELAY: Wait 250ms after cancel before creating new utterance to prevent browser cancellation races!
    await new Promise(r => setTimeout(r, 250));

    activeUtterance = new SpeechSynthesisUtterance(text);
    activeUtterance.lang = locale;
    activeUtterance.rate = 0.88;
    activeUtterance.pitch = 1.05;
    activeUtterance.volume = 1.0;

    // Pick best matching voice
    const voices = synth.getVoices();
    const match =
      voices.find(v => v.lang === locale && v.localService) ||
      voices.find(v => v.lang === locale) ||
      voices.find(v => v.lang.startsWith('en'));
    if (match) activeUtterance.voice = match;

    let finished = false;
    const finish = () => {
      if (finished) return;
      finished = true;
      isSpeaking = false;
      activeUtterance = null;
      if (onDone) onDone();
    };

    activeUtterance.onstart = () => {
      isSpeaking = true;
      console.log('[Speech] ▶ Active');
      if (onStart) onStart();
    };

    activeUtterance.onend = () => {
      console.log('[Speech] ✅ Finished');
      finish();
    };

    activeUtterance.onerror = (e) => {
      console.warn('[Speech] ⚠ Error:', e.error);
      finish();
    };

    // Chrome/Edge bug: pauses after ~15 sec — keep alive
    const keepAlive = setInterval(() => {
      if (!synth.speaking) { clearInterval(keepAlive); return; }
      synth.pause();
      window.requestAnimationFrame(() => synth.resume());
    }, 12000);

    // Override handlers to clean up keepAlive
    const origFinish = finish;
    activeUtterance.onend = () => { clearInterval(keepAlive); console.log('[Speech] ✅ Finished'); origFinish(); };
    activeUtterance.onerror = (e) => { clearInterval(keepAlive); console.warn('[Speech] ⚠ Error:', e.error); origFinish(); };

    synth.speak(activeUtterance);
  } else {
    try {
      await Speech.stop();
      Speech.speak(text, { language: locale, pitch: 1.0, rate: 0.92, onStart, onDone, onStopped: onDone, onerror: onDone });
    } catch (e) {
      if (onDone) onDone();
    }
  }
};

export const stopSpeech = async () => {
  try {
    isSpeaking = false;
    activeUtterance = null;
    if (Platform.OS === 'web' && typeof window !== 'undefined' && window.speechSynthesis) {
      window.speechSynthesis.cancel();
    } else {
      await Speech.stop();
    }
  } catch (e) {}
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

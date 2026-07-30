import * as Speech from 'expo-speech';

// Map application languages to Speech locale codes
const LOCALE_MAP = {
  en: 'en-US',
  ml: 'ml-IN', // Malayalam (India)
  hi: 'hi-IN'  // Hindi (India)
};

export const speakText = async (text, languageCode = 'en', onStart, onDone) => {
  try {
    // Stop any ongoing speech first
    await Speech.stop();

    const locale = LOCALE_MAP[languageCode] || 'en-US';
    
    // Check if speaking is supported/available
    Speech.speak(text, {
      language: locale,
      pitch: 1.0,
      rate: 0.95, // Slightly slower for better emotional support tone
      onStart: onStart,
      onDone: onDone,
      onStopped: onDone,
      onError: onDone,
    });
  } catch (error) {
    console.error('Text-to-Speech Error:', error);
    if (onDone) onDone();
  }
};

export const stopSpeech = async () => {
  try {
    await Speech.stop();
  } catch (error) {
    console.error('Error stopping speech:', error);
  }
};

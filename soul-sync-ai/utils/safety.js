/**
 * utils/safety.js
 * SoulSync Safety Detection Engine
 *
 * Classifies user messages into three risk levels:
 *   "normal"      - everyday messages, no concern
 *   "concerning"  - emotional distress, hopelessness
 *   "emergency"   - direct suicidal intent, self-harm, life-threatening
 *
 * Runs entirely on-device. Never logs raw messages. Never auto-contacts anyone.
 */

const EMERGENCY_PHRASES = [
  'i want to die',
  'i want to kill myself',
  'i am going to kill myself',
  "i'm going to kill myself",
  'i will kill myself',
  'going to end my life',
  'i am going to end my life',
  "i'm going to end my life",
  'end my life',
  'end it all',
  'take my own life',
  'take my life',
  'commit suicide',
  'planning to suicide',
  'i will suicide',
  'i am suicidal',
  "i'm suicidal",
  'i want to hurt myself',
  'i am going to hurt myself',
  "i'm going to hurt myself",
  'i will hurt myself',
  'going to cut myself',
  'want to cut myself',
  'i am going to harm myself',
  "i'm going to harm myself",
  'i will harm myself',
  'going to overdose',
  'want to overdose',
  'going to take pills',
  'no reason to live',
  "don't want to be alive",
  'dont want to be alive',
  'i wish i was dead',
  'i wish i were dead',
  'better off dead',
  'better off without me',
  "don't want to exist",
  'dont want to exist',
  'tired of living',
  'i cannot live anymore',
  "i can't live anymore",
  'i cant live anymore',
  'life is not worth living',
  "life isn't worth living",
  'i will hang myself',
  'going to hang myself',
  'chathukku pokanam',
  'jeevitham mathiayilla',
  'ende jeevitham theerkanam',
  'venam ennu',
  'marichu pokanam',
];

const CONCERNING_PHRASES = [
  "can't go on", 'cannot go on',
  "can't continue", 'cannot continue',
  "can't take it anymore", 'cannot take it anymore',
  'i give up',
  'no point anymore',
  'nothing to live for',
  'feel empty inside',
  'completely hopeless',
  'lost all hope',
  'nobody cares',
  'nobody would miss me',
  'no one would care',
  'disappear forever',
  'run away forever',
  'feels like the end',
  "don't see a way out",
  'dont see a way out',
  "don't know how much longer",
  "can't keep going",
  'cant keep going',
  'too much pain to handle',
  'feel like giving up',
  'so much pain inside',
  'unbearable pain',
  'everything is pointless',
  'no way forward',
];

export const detectEmergency = (text) => {
  if (!text || text.trim().length === 0) return 'normal';
  const t = text.toLowerCase().trim();
  for (const phrase of EMERGENCY_PHRASES) {
    if (t.includes(phrase)) return 'emergency';
  }
  for (const phrase of CONCERNING_PHRASES) {
    if (t.includes(phrase)) return 'concerning';
  }
  return 'normal';
};

export const EMERGENCY_AI_PROMPT = `You are SoulSync, a caring companion. The user just expressed serious thoughts of ending their life or harming themselves.

Your ONLY job right now:
- Respond with 1-2 short warm sentences. No lists, no lectures.
- Acknowledge their pain with deep compassion. Never dismiss it.
- Make them feel heard and NOT alone.
- Do NOT say "everything will be fine."
- Do NOT mention "family" or "think about others."
- Do NOT claim to be a doctor, therapist, or emergency service.
- Do NOT ask multiple questions. Ask only ONE gentle question if at all.
- Respond in the same language the user used.`;

export const CONCERNING_AI_PROMPT = `You are SoulSync, a warm wellness companion. The user is expressing deep emotional pain or hopelessness.

Your role:
- Respond with 2 short warm sentences.
- Acknowledge their pain without minimizing it. Do not offer solutions yet.
- Gently encourage them to keep talking.
- Ask ONE soft caring follow-up question.
- Do NOT claim to be a therapist or doctor.
- Do NOT use guilt. Respond in the user language.`;

export const CRISIS_RESOURCES = [
  { name: 'iCall', number: '9152987821', note: 'Free counselling · Mon-Sat 8am-10pm', emoji: '??', dialable: '9152987821' },
  { name: 'Tele-MANAS (Govt.)', number: '14416', note: 'Free · 24/7 · Government of India', emoji: '??', dialable: '14416' },
  { name: 'KIRAN Helpline', number: '1800-599-0019', note: 'Free · 24/7 · Multilingual', emoji: '??', dialable: '18005990019' },
  { name: 'Vandrevala Foundation', number: '9999 666 555', note: '24/7 crisis counselling', emoji: '??', dialable: '9999666555' },
  { name: 'Emergency Services', number: '112', note: 'Police · Ambulance · Fire', emoji: '??', dialable: '112' },
];

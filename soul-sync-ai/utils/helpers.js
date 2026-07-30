// Helper functions and configurations for SoulSync AI

// 1. Mood configurations
export const MOODS = {
  happy: {
    label: 'happy',
    emoji: '😊',
    color: '#10B981', // green
    bgGradient: ['#10B981', '#059669'],
    lottieUrl: 'https://assets10.lottiefiles.com/packages/lf20_myejio2g.json', // happy face
  },
  neutral: {
    label: 'neutral',
    emoji: '😐',
    color: '#06B6D4', // cyan
    bgGradient: ['#06B6D4', '#0891B2'],
    lottieUrl: 'https://assets10.lottiefiles.com/packages/lf20_t9gk1v40.json', // neutral
  },
  sad: {
    label: 'sad',
    emoji: '😢',
    color: '#3B82F6', // blue
    bgGradient: ['#3B82F6', '#2563EB'],
    lottieUrl: 'https://assets10.lottiefiles.com/packages/lf20_b31y5qsk.json', // sad
  },
  stressed: {
    label: 'stressed',
    emoji: '🤯',
    color: '#8B5CF6', // violet
    bgGradient: ['#8B5CF6', '#7C3AED'],
    lottieUrl: 'https://assets10.lottiefiles.com/packages/lf20_snx01k1f.json', // stressed
  },
  angry: {
    label: 'angry',
    emoji: '😠',
    color: '#EF4444', // red
    bgGradient: ['#EF4444', '#DC2626'],
    lottieUrl: 'https://assets10.lottiefiles.com/packages/lf20_f1zw8e1w.json', // angry
  }
};

// 2. Simple local sentiment analysis fallback
export const analyzeSentiment = (text) => {
  if (!text) return 'neutral';
  const cleanText = text.toLowerCase();
  
  const happyWords = ['happy', 'glad', 'joy', 'wonderful', 'great', 'awesome', 'good', 'excel', 'love', 'smile', 'bless', 'excit'];
  const sadWords = ['sad', 'cry', 'hurt', 'pain', 'lonely', 'depress', 'blue', 'tears', 'grief', 'sorrow', 'down', 'hopeless'];
  const stressedWords = ['stress', 'anxious', 'worry', 'panic', 'overwhelm', 'tired', 'exhaust', 'pressure', 'scared', 'fear', 'tension'];
  const angryWords = ['angry', 'mad', 'furious', 'hate', 'annoy', 'piss', 'rage', 'irritat', 'frustrat', 'bitter'];

  let happyScore = 0;
  let sadScore = 0;
  let stressedScore = 0;
  let angryScore = 0;

  happyWords.forEach(word => { if (cleanText.includes(word)) happyScore += 1; });
  sadWords.forEach(word => { if (cleanText.includes(word)) sadScore += 1; });
  stressedWords.forEach(word => { if (cleanText.includes(word)) stressedScore += 1; });
  angryWords.forEach(word => { if (cleanText.includes(word)) angryScore += 1; });

  const max = Math.max(happyScore, sadScore, stressedScore, angryScore);

  if (max === 0) return 'neutral';
  if (max === happyScore) return 'happy';
  if (max === sadScore) return 'sad';
  if (max === stressedScore) return 'stressed';
  if (max === angryScore) return 'angry';

  return 'neutral';
};

// 3. Date formatters
export const formatDate = (dateString, locale = 'en') => {
  try {
    const d = new Date(dateString);
    if (isNaN(d.getTime())) return dateString;
    return d.toLocaleDateString(locale === 'ml' ? 'ml-IN' : locale === 'hi' ? 'hi-IN' : 'en-US', {
      weekday: 'short',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  } catch (e) {
    return dateString;
  }
};

// 4. Custom wellness database based on mood
export const WELLNESS_RECOMMENDATIONS = {
  happy: {
    breathing: {
      title: 'Savoring Breath',
      instructions: 'Inhale for 4 seconds, hold for 4 seconds, exhale and release a gentle smile for 6 seconds. Focus on the feeling of warmth in your chest.',
      duration: '3 mins'
    },
    activities: [
      { title: 'Gratitude Audit', desc: 'Write down 3 tiny things that made you smile today and share one with a friend.' },
      { title: 'Creative Spark', desc: 'Spend 10 minutes doodling, writing a short poem, or taking a photo of something beautiful.' }
    ],
    quotes: [
      "Keep your face always toward the sunshine, and shadows will fall behind you. — Walt Whitman",
      "Happiness is not something ready-made. It comes from your own actions. — Dalai Lama"
    ],
    tips: [
      "Capture the moment: Journal about this happy state to anchor it in memory.",
      "Pay it forward: A kind word or text to someone else can amplify your own positive energy."
    ]
  },
  neutral: {
    breathing: {
      title: 'Box Breathing',
      instructions: 'Inhale for 4 seconds, hold for 4 seconds, exhale for 4 seconds, hold empty for 4 seconds. Repeat to establish balance.',
      duration: '4 mins'
    },
    activities: [
      { title: 'Digital Detox Walk', desc: 'Walk outside for 10 minutes without looking at your phone. Just notice the textures around you.' },
      { title: 'Mindful Savoring', desc: 'Drink a cup of tea or water slowly, focusing on the temperature, the taste, and the feel.' }
    ],
    quotes: [
      "Within you, there is a stillness and a sanctuary to which you can retreat at any time. — Hermann Hesse",
      "Quiet the mind and the soul will speak. — Ma Jaya Sati Bhagavati"
    ],
    tips: [
      "Check in with your body: Do a quick mental scan. Are your shoulders tense? Relax them.",
      "Set a simple intention for the next hour to anchor your productivity."
    ]
  },
  sad: {
    breathing: {
      title: 'Self-Compassion Breath',
      instructions: 'Place your hand over your heart. Inhale comfort for 5 seconds, exhale sadness and heavy energy for 7 seconds. Speak a kind word to yourself.',
      duration: '5 mins'
    },
    activities: [
      { title: 'Cozy Solitude', desc: 'Wrap yourself in a warm blanket, play soft ambient sounds, and allow yourself to just rest.' },
      { title: 'Comfort Cleanse', desc: 'Wash your face with warm water or take a warm shower. Imagine washing away the heavy emotions.' }
    ],
    quotes: [
      "Tears are words that need to be written. — Paulo Coelho",
      "No matter how dark the night, the sun will rise again. — Unknown"
    ],
    tips: [
      "Be gentle: You do not need to 'fix' this sadness immediately. It is okay to feel down.",
      "Reach out: Send a simple emoji or message to someone you trust, letting them know you're feeling low."
    ]
  },
  stressed: {
    breathing: {
      title: '4-7-8 Stress Reliever',
      instructions: 'Inhale through your nose for 4 seconds, hold your breath for 7 seconds, exhale completely through your mouth with a whoosh for 8 seconds.',
      duration: '5 mins'
    },
    activities: [
      { title: 'Brain Dump', desc: 'Take a piece of paper and write down everything overwhelming you. Then organize it into 1 small step.' },
      { title: 'Progressive Muscle Relaxation', desc: 'Tense your toes for 5 seconds, then relax. Move up to calves, thighs, hands, shoulders, and jaw.' }
    ],
    quotes: [
      "You don't have to control your thoughts. You just have to stop letting them control you. — Dan Millman",
      "Rule number one is, don't sweat the small stuff. Rule number two is, it's all small stuff. — Robert Eliot"
    ],
    tips: [
      "De-clutter: Turn off unnecessary notifications and alarms for the next 2 hours.",
      "Hydrate: Drink a cold glass of water. Dehydration can increase cortisol (stress hormone) levels."
    ]
  },
  angry: {
    breathing: {
      title: 'Cooling Breath (Sitali)',
      instructions: 'Curl the sides of your tongue (or purse your lips). Inhale deeply through your mouth, feeling the cold air. Exhale slowly through your nose.',
      duration: '3 mins'
    },
    activities: [
      { title: 'Physical Release', desc: 'Do 15 jumping jacks, pushups, or squeeze a stress ball. Channel the adrenaline out of your body.' },
      { title: 'Rage Scribbling', desc: 'Scribble heavily on a piece of paper, then tear it up and throw it away as a symbol of release.' }
    ],
    quotes: [
      "For every minute you remain angry, you lose sixty seconds of peace of mind. — Ralph Waldo Emerson",
      "The best fighter is never angry. — Lao Tzu"
    ],
    tips: [
      "The 5-Second Rule: Pause before reacting. Count to five backwards and take a cooling breath.",
      "Change your environment: Walk into a different room or step outside to break the immediate anger trigger."
    ]
  }
};

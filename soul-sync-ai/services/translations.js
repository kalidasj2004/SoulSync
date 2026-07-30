// Translations dictionary for SoulSync AI (English, Malayalam)

export const LANGUAGES = {
  en: 'English',
  ml: 'മലയാളം (Malayalam)'
};

export const TRANSLATIONS = {
  en: {
    // Auth
    login: 'Log In',
    register: 'Register',
    email: 'Email Address',
    password: 'Password',
    displayName: 'Display Name',
    noAccount: "Don't have an account? Register",
    haveAccount: 'Already have an account? Login',
    signingIn: 'Signing in...',
    registering: 'Creating account...',
    logout: 'Log Out',
    
    // Screens
    home: 'Home',
    moodTracker: 'Mood Tracker',
    journal: 'Journal',
    aiChat: 'AI Companion',
    wellness: 'Wellness',
    analytics: 'Analytics',
    profile: 'Profile',
    settings: 'Settings',

    // Dashboard
    welcome: 'Welcome, {{name}}!',
    howAreYou: 'How are you feeling today?',
    currentMood: 'Current Mood',
    quickAccess: 'Quick Access',
    moodTrackerDesc: 'Log your feelings',
    journalDesc: 'Write your thoughts',
    aiChatDesc: 'Talk to your companion',
    wellnessDesc: 'Calming activities',
    profileDesc: 'View statistics',

    // Moods
    happy: 'Happy',
    neutral: 'Neutral',
    sad: 'Sad',
    stressed: 'Stressed',
    angry: 'Angry',
    moodSaved: 'Mood logged successfully!',
    moodPlaceholder: 'Add a note about why you feel this way...',
    logMoodBtn: 'Save Mood Entry',
    moodHistory: 'Mood History',
    moodStats: 'Mood Distribution',
    noMoods: 'No moods logged yet.',

    // Journal
    journalTitle: 'Title',
    journalContent: 'Write your heart out here...',
    journalMoodTag: 'Mood Tag (Optional)',
    saveJournal: 'Save Journal Entry',
    editJournal: 'Edit Entry',
    deleteJournal: 'Delete Entry',
    deleteConfirm: 'Are you sure you want to delete this journal entry?',
    noJournals: 'No journal entries yet. Start writing!',
    journalAdded: 'Journal entry created!',
    journalUpdated: 'Journal entry updated!',
    journalDeleted: 'Journal entry deleted!',
    chronological: 'Chronological Entries',

    // AI Chat
    aiGreeting: 'Hello! I am your SoulSync companion. Speak or type your feelings, and I will support you.',
    voiceInput: 'Voice Input',
    listening: 'Listening to your voice...',
    processingVoice: 'Transcribing your audio...',
    speechError: 'Could not transcribe audio. Please try typing.',
    typeMessage: 'Type your message...',
    sentimentDetected: 'Detected Mood: {{sentiment}}',
    ttsToggle: 'Read Aloud Responses',

    // Wellness
    personalizedRecommendations: 'Personalized for you',
    breathingExercise: 'Breathing Exercise',
    startBreathing: 'Start Exercise',
    relaxationActivities: 'Relaxation Activities',
    motivationalQuotes: 'Daily Motivation',
    stressTips: 'Wellness Tips',

    // Analytics
    weeklyChart: 'Weekly Mood Log',
    monthlyChart: 'Monthly Mood Log',
    emotionTrend: 'Emotion Trends',
    progressTracking: 'Your Progress Summary',
    trendHappy: 'Looking good! You are mostly happy.',
    trendVarying: 'Your emotions are fluctuating. Remember to breathe.',
    trendLow: 'You seem to be experiencing low moods. Try chatting with SoulSync AI.',

    // Profile & Settings
    totalLogs: 'Total Mood Logs',
    totalJournals: 'Journal Entries',
    memberSince: 'Member Since',
    languageSetting: 'Preferred Language',
    devSettings: 'API Configuration',
    geminiKey: 'Gemini API Key',
    supabaseUrl: 'Supabase URL',
    supabaseKey: 'Supabase Anon Key',
    saveKeys: 'Save Credentials',
    keysSaved: 'API configurations saved locally!',
    useEnvKeys: 'Reset to System Defaults',
    activeKeys: 'Active Config: {{source}}',
    appInfo: 'SoulSync AI v1.0.0'
  },
  ml: {
    // Auth
    login: 'ലോഗിൻ ചെയ്യുക',
    register: 'രജിസ്റ്റർ ചെയ്യുക',
    email: 'ഇമെയിൽ വിലാസം',
    password: 'പാസ്‌വേഡ്',
    displayName: 'പേര്',
    noAccount: "അക്കൗണ്ട് ഇല്ലേ? രജിസ്റ്റർ ചെയ്യൂ",
    haveAccount: 'അക്കൗണ്ട് ഉണ്ടോ? ലോഗിൻ ചെയ്യൂ',
    signingIn: 'ലോഗിൻ ചെയ്യുന്നു...',
    registering: 'അക്കൗണ്ട് നിർമ്മിക്കുന്നു...',
    logout: 'ലോഗ് ഔട്ട്',
    
    // Screens
    home: 'ഹോം',
    moodTracker: 'മൂഡ് ട്രാക്കർ',
    journal: 'ഡയറി',
    aiChat: 'AI കംപാനിയൻ',
    wellness: 'ആരോഗ്യം',
    analytics: 'വിശകലനം',
    profile: 'പ്രൊഫൈൽ',
    settings: 'ക്രമീകരണങ്ങൾ',

    // Dashboard
    welcome: 'സ്വാഗതം, {{name}}!',
    howAreYou: 'ഇന്ന് നിങ്ങളുടെ മൂഡ് എങ്ങനെയുണ്ട്?',
    currentMood: 'ഇപ്പോഴത്തെ മൂഡ്',
    quickAccess: 'വേഗത്തിലുള്ള ലിങ്കുകൾ',
    moodTrackerDesc: 'നിങ്ങളുടെ വികാരങ്ങൾ കുറിക്കുക',
    journalDesc: 'ചിന്തകൾ എഴുതുക',
    aiChatDesc: 'AI-യോട് സംസാരിക്കുക',
    wellnessDesc: 'ആശ്വാസകരമായ പ്രവർത്തനങ്ങൾ',
    profileDesc: 'സ്ഥിതിവിവരങ്ങൾ കാണുക',

    // Moods
    happy: 'സന്തോഷം',
    neutral: 'സാധാരണം',
    sad: 'വിഷമം',
    stressed: 'സമ്മർദ്ദം',
    angry: 'ദേഷ്യം',
    moodSaved: 'മൂഡ് രേഖപ്പെടുത്തിയിരിക്കുന്നു!',
    moodPlaceholder: 'നിങ്ങൾക്ക് ഇങ്ങനെ തോന്നാനുള്ള കാരണം കുറിക്കുക...',
    logMoodBtn: 'മൂഡ് സേവ് ചെയ്യുക',
    moodHistory: 'കഴിഞ്ഞ ദിവസങ്ങളിലെ മൂഡ്',
    moodStats: 'മൂഡ് സ്ഥിതിവിവരങ്ങൾ',
    noMoods: 'മൂഡുകൾ ഒന്നും രേഖപ്പെടുത്തിയിട്ടില്ല.',

    // Journal
    journalTitle: 'തലക്കെട്ട്',
    journalContent: 'നിങ്ങളുടെ ചിന്തകൾ ഇവിടെ എഴുതുക...',
    journalMoodTag: 'മൂഡ് ടാഗ് (ഓപ്ഷണൽ)',
    saveJournal: 'ഡയറി സേവ് ചെയ്യുക',
    editJournal: 'തിരുത്തുക',
    deleteJournal: 'ഡിലീറ്റ് ചെയ്യുക',
    deleteConfirm: 'ഈ ഡയറി ഡിലീറ്റ് ചെയ്യണമെന്ന് ഉറപ്പാണോ?',
    noJournals: 'ഡയറിയിൽ ഒന്നും എഴുതിയിട്ടില്ല. തുടങ്ങൂ!',
    journalAdded: 'ഡയറിയിൽ എഴുതിക്കഴിഞ്ഞു!',
    journalUpdated: 'ഡയറി തിരുത്തിയിരിക്കുന്നു!',
    journalDeleted: 'ഡയറി ഡിലീറ്റ് ചെയ്തിരിക്കുന്നു!',
    chronological: 'എഴുതിയവ ക്രമത്തിൽ',

    // AI Chat
    aiGreeting: 'ഹലോ! ഞാൻ നിങ്ങളുടെ സോൾസിങ്ക് കൂട്ടുകാരനാണ്. നിങ്ങളുടെ വികാരങ്ങൾ എഴുതുകയോ സംസാരിക്കുകയോ ചെയ്യാം.',
    voiceInput: 'സംസാരിക്കുക',
    listening: 'ശ്രദ്ധിക്കുന്നു...',
    processingVoice: 'ശബ്ദം അക്ഷരങ്ങളാക്കുന്നു...',
    speechError: 'ശബ്ദം തിരിച്ചറിയാൻ കഴിഞ്ഞില്ല. ദയവായി ടൈപ്പ് ചെയ്യുക.',
    typeMessage: 'സന്ദേശം എഴുതുക...',
    sentimentDetected: 'കണ്ടെത്തിയ മൂഡ്: {{sentiment}}',
    ttsToggle: 'മറുപടികൾ ഉറക്കെ വായിക്കുക',

    // Wellness
    personalizedRecommendations: 'നിങ്ങൾക്കായി നിർദ്ദേശിക്കുന്നത്',
    breathingExercise: 'ശ്വാസക്രിയ വ്യായാമം',
    startBreathing: 'വ്യായാമം തുടങ്ങുക',
    relaxationActivities: 'ആശ്വാസ പ്രവർത്തനങ്ങൾ',
    motivationalQuotes: 'പ്രേരണാത്മക വചനങ്ങൾ',
    stressTips: 'ആരോഗ്യ നുറുങ്ങുകൾ',

    // Analytics
    weeklyChart: 'പ്രതിവാര മൂഡ് ഗ്രാഫ്',
    monthlyChart: 'പ്രതിമാസ മൂഡ് ഗ്രാഫ്',
    emotionTrend: 'വൈകാരിക പ്രവണത',
    progressTracking: 'നിങ്ങളുടെ പുരോഗതിയുടെ ചുരുക്കം',
    trendHappy: 'കൊള്ളാം! നിങ്ങൾ മിക്കപ്പോഴും സന്തുഷ്ടനാണ്.',
    trendVarying: 'നിങ്ങളുടെ വികാരങ്ങളിൽ മാറ്റങ്ങളുണ്ട്. ദയവായി ശ്വാസമെടുക്കൂ.',
    trendLow: 'നിങ്ങൾക്ക് വിഷമമുള്ളതായി കാണുന്നു. സോൾസിങ്ക് AI യോട് സംസാരിക്കുക.',

    // Profile & Settings
    totalLogs: 'ആകെ മൂഡ് ലോഗുകൾ',
    totalJournals: 'ആകെ ഡയറി എഴുത്തുകൾ',
    memberSince: 'അംഗത്വം എടുത്തത്',
    languageSetting: 'ഭാഷ തിരഞ്ഞെടുക്കുക',
    devSettings: 'API ക്രമീകരണങ്ങൾ',
    geminiKey: 'Gemini API കീ',
    supabaseUrl: 'Supabase URL',
    supabaseKey: 'Supabase Anon കീ',
    saveKeys: 'വിവരങ്ങൾ സേവ് ചെയ്യുക',
    keysSaved: 'API വിവരങ്ങൾ ഫോണിൽ സൂക്ഷിച്ചു!',
    useEnvKeys: 'പഴയ പടിയാക്കുക',
    activeKeys: 'നിലവിലെ ക്രമീകരണം: {{source}}',
    appInfo: 'സോൾസിങ്ക് AI v1.0.0'
  }
};

export const translate = (key, language = 'en', variables = {}) => {
  const dictionary = TRANSLATIONS[language] || TRANSLATIONS.en;
  let translatedText = dictionary[key] || TRANSLATIONS.en[key] || key;

  // Substitute variables like {{name}}
  Object.keys(variables).forEach(varName => {
    translatedText = translatedText.replace(`{{${varName}}}`, variables[varName]);
  });

  return translatedText;
};

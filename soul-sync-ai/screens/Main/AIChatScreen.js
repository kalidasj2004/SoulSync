import React, { useState, useEffect, useRef, useContext } from 'react';
import {
  StyleSheet,
  Text,
  View,
  ScrollView,
  TouchableOpacity,
  TextInput,
  ActivityIndicator,
  Alert,
  Animated,
  Easing,
  Platform,
  KeyboardAvoidingView
} from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { Audio } from 'expo-av';
import * as FileSystem from 'expo-file-system';
import { getSupabase } from '../../services/supabase';
import { AppContext } from '../../AppContext';
import { THEME } from '../../utils/theme';
import { ROUTES } from '../../navigation/RouteNames';
import { translate } from '../../services/translations';
import { generateChatResponse, getSentimentFromGemini, transcribeAudioWithGemini } from '../../services/gemini';
import { speakText, stopSpeech } from '../../services/speech';
import { analyzeSentiment } from '../../utils/helpers';

// Components
import Header from '../../components/Header';
import Card from '../../components/Card';
import AnimatedCompanion from '../../components/AnimatedCompanion';

export default function AIChatScreen() {
  const navigation = useNavigation();
  const { language } = useContext(AppContext);
  const supabase = getSupabase();

  // State Variables
  const [inputText, setInputText] = useState('');
  const [loading, setLoading] = useState(false);
  const [isAiSpeaking, setIsAiSpeaking] = useState(false);
  const [companionMood, setCompanionMood] = useState('idle'); // 'idle' | 'happy' | 'sad' | 'surprised' | 'thinking' | 'listening'
  const [companionGesture, setCompanionGesture] = useState('idle'); // 'idle' | 'wave' | 'chest' | 'point'
  
  // Voice Recording states
  const [recording, setRecording] = useState(null);
  const [isRecording, setIsRecording] = useState(false);
  const [statusText, setStatusText] = useState('Ready');

  // Conversation history
  const [chatHistory, setChatHistory] = useState([]);

  // Breathing Exercise state
  const [breathingActive, setBreathingActive] = useState(false);
  const [breathingText, setBreathingText] = useState('');
  const breathingScale = useRef(new Animated.Value(1)).current;
  const breathingLoopRef = useRef(null);

  // References
  const scrollViewRef = useRef(null);

  // Load chat context on mount
  useEffect(() => {
    loadChatContext();
    
    // Welcome Wave on entry!
    setCompanionGesture('wave');
    const timer = setTimeout(() => {
      setCompanionGesture('idle');
    }, 2800);

    return () => {
      clearTimeout(timer);
      stopSpeech();
      if (breathingLoopRef.current) {
        breathingLoopRef.current.stop();
      }
    };
  }, []);

  // Auto-scroll chat to bottom
  useEffect(() => {
    if (scrollViewRef.current) {
      setTimeout(() => {
        scrollViewRef.current.scrollToEnd({ animated: true });
      }, 100);
    }
  }, [chatHistory, breathingActive]);

  // Load chat log from database
  const loadChatContext = async () => {
    if (!supabase) return;
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const { data } = await supabase
        .from('chat_messages')
        .select('*')
        .eq('user_id', user.id)
        .order('created_at', { ascending: true })
        .limit(15);

      if (data && data.length > 0) {
        setChatHistory(data);
        const lastMsg = data[data.length - 1];
        if (lastMsg.sender === 'assistant' && lastMsg.sentiment) {
          setCompanionMood(lastMsg.sentiment);
        }
      } else {
        // Initial setup if empty
        const welcomeMessage = {
          id: 'welcome',
          sender: 'assistant',
          message: "Hi, I'm here with you today. How are you feeling right now?",
          created_at: new Date().toISOString(),
          sentiment: 'supportive'
        };
        setChatHistory([welcomeMessage]);
        setCompanionMood('listening');
      }
    } catch (e) {
      console.log('Error prefetching chat history:', e.message);
    }
  };

  // Get greeting based on time of day
  const getGreeting = () => {
    const hour = new Date().getHours();
    if (hour < 12) return 'Good morning';
    if (hour < 17) return 'Good afternoon';
    return 'Good evening';
  };

  // Handle message sending (Text input)
  const handleSendText = async () => {
    if (!inputText.trim() || loading) return;
    const text = inputText.trim();
    setInputText('');
    await stopSpeech();
    setIsAiSpeaking(false);
    await processUserMessage(text);
  };

  // Process a message turn (user text -> database -> Gemini -> database -> speak reply)
  const processUserMessage = async (userText) => {
    if (!supabase) return;
    setLoading(true);
    setCompanionMood('listening');
    setCompanionGesture('idle');

    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      // 1. Analyze user sentiment
      let sentiment = analyzeSentiment(userText);
      try {
        const geminiSentiment = await getSentimentFromGemini(userText);
        if (geminiSentiment) sentiment = geminiSentiment;
      } catch (e) {
        console.log('Gemini sentiment analysis failed, fallback used.');
      }

      // 2. Save User Message
      const userMessageObj = {
        user_id: user.id,
        sender: 'user',
        message: userText,
        sentiment,
      };

      const { data: savedUserMsg } = await supabase
        .from('chat_messages')
        .insert(userMessageObj)
        .select()
        .single();

      if (savedUserMsg) {
        setChatHistory(prev => [...prev, savedUserMsg]);
      } else {
        setChatHistory(prev => [...prev, { ...userMessageObj, id: Date.now().toString(), created_at: new Date().toISOString() }]);
      }

      setCompanionMood('thinking');

      // 3. Generate Gemini response
      const aiReply = await generateChatResponse(userText, chatHistory);

      // 4. Save AI Message
      const assistantMessageObj = {
        user_id: user.id,
        sender: 'assistant',
        message: aiReply,
        sentiment: sentiment,
      };

      const { data: savedAssistantMsg } = await supabase
        .from('chat_messages')
        .insert(assistantMessageObj)
        .select()
        .single();

      if (savedAssistantMsg) {
        setChatHistory(prev => [...prev, savedAssistantMsg]);
      } else {
        setChatHistory(prev => [...prev, { ...assistantMessageObj, id: (Date.now() + 1).toString(), created_at: new Date().toISOString() }]);
      }

      // Determine matching voice companion emotion & active gesture
      let speakerMood = 'listening';
      let speakerGesture = 'idle';

      if (sentiment === 'happy') {
        speakerMood = 'happy';
        speakerGesture = 'wave'; // Wave excited
      }
      if (sentiment === 'sad' || sentiment === 'stressed') {
        speakerMood = 'listening';
        speakerGesture = 'chest'; // Hand on heart to show compassion
      }
      if (sentiment === 'angry') {
        speakerMood = 'thinking';
        speakerGesture = 'idle';
      }

      // Trigger gesture keywords check
      const lowerReply = aiReply.toLowerCase();
      if (
        lowerReply.includes('exercise') || 
        lowerReply.includes('breathing') || 
        lowerReply.includes('quick actions') || 
        lowerReply.includes('below') ||
        lowerReply.includes('choose')
      ) {
        speakerGesture = 'point'; // Point to action chips
      } else if (
        lowerReply.includes('welcome') || 
        lowerReply.includes('hello') || 
        lowerReply.includes('hi ')
      ) {
        speakerGesture = 'wave'; // Wave hello
      }

      setCompanionMood(speakerMood);
      setCompanionGesture(speakerGesture);

      // 5. Speak reply out loud with synchronized mouth
      setIsAiSpeaking(true);
      await speakText(
        aiReply,
        language,
        () => {
          setIsAiSpeaking(true);
        },
        () => {
          setIsAiSpeaking(false);
          setCompanionMood(speakerMood);
          setCompanionGesture('idle'); // Revert back to idle
        }
      );

    } catch (e) {
      Alert.alert('Connection Error', 'Failed to chat with companion: ' + e.message);
      setCompanionMood('idle');
      setCompanionGesture('idle');
    } finally {
      setLoading(false);
    }
  };

  // Replay the last speech
  const handleReplaySpeech = async () => {
    const assistantMsgs = chatHistory.filter(m => m.sender === 'assistant');
    if (assistantMsgs.length === 0) return;
    
    const lastAiMsg = assistantMsgs[assistantMsgs.length - 1].message;
    await stopSpeech();
    
    // Choose gesture based on text
    let gestureToUse = 'idle';
    if (lastAiMsg.toLowerCase().includes('breathe') || lastAiMsg.toLowerCase().includes('exercise')) {
      gestureToUse = 'point';
    } else if (lastAiMsg.toLowerCase().includes('sorry') || lastAiMsg.toLowerCase().includes('feel')) {
      gestureToUse = 'chest';
    }
    
    setCompanionGesture(gestureToUse);
    setIsAiSpeaking(true);
    await speakText(
      lastAiMsg,
      language,
      () => setIsAiSpeaking(true),
      () => {
        setIsAiSpeaking(false);
        setCompanionGesture('idle');
      }
    );
  };

  // Guided Breathing Exercise (brings hand to chest)
  const triggerBreathingExercise = () => {
    if (breathingActive) return;
    
    stopSpeech();
    setIsAiSpeaking(false);
    setBreathingActive(true);
    setCompanionMood('thinking');
    setCompanionGesture('chest'); // Place hand on chest

    let cycle = 0;
    const runBreathingCycle = () => {
      if (cycle >= 3) {
        // Complete exercise
        setBreathingActive(false);
        setCompanionMood('happy');
        setCompanionGesture('idle');
        const followUpText = "I hope that helped you feel a bit more relaxed. How are you feeling now?";
        
        saveLocalAiMessage(followUpText);
        
        setIsAiSpeaking(true);
        speakText(
          followUpText, 
          language, 
          () => setIsAiSpeaking(true), 
          () => {
            setIsAiSpeaking(false);
            setCompanionMood('happy');
            setCompanionGesture('idle');
          }
        );
        return;
      }

      cycle++;
      setBreathingText('Breathe In...');
      
      Animated.timing(breathingScale, {
        toValue: 1.25,
        duration: 4000,
        easing: Easing.inOut(Easing.sin),
        useNativeDriver: true,
      }).start(() => {
        setBreathingText('Hold...');
        
        Animated.delay(4000).start(() => {
          setBreathingText('Breathe Out...');
          
          Animated.timing(breathingScale, {
            toValue: 0.95,
            duration: 4000,
            easing: Easing.inOut(Easing.sin),
            useNativeDriver: true,
          }).start(() => {
            runBreathingCycle();
          });
        });
      });
    };

    runBreathingCycle();
  };

  const saveLocalAiMessage = async (msgText) => {
    if (!supabase) return;
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const aiMsg = {
        user_id: user.id,
        sender: 'assistant',
        message: msgText,
        sentiment: 'supportive',
      };

      const { data } = await supabase.from('chat_messages').insert(aiMsg).select().single();
      if (data) {
        setChatHistory(prev => [...prev, data]);
      } else {
        setChatHistory(prev => [...prev, { ...aiMsg, id: Date.now().toString(), created_at: new Date().toISOString() }]);
      }
    } catch (e) {
      console.log('Error saving breathing completion message:', e.message);
    }
  };

  // Audio voice input handlers (STT)
  const handleToggleVoiceInput = async () => {
    if (isRecording) {
      await stopVoiceRecording();
    } else {
      await startVoiceRecording();
    }
  };

  const startVoiceRecording = async () => {
    try {
      await stopSpeech();
      setIsAiSpeaking(false);
      
      const permission = await Audio.requestPermissionsAsync();
      if (permission.status !== 'granted') {
        Alert.alert('Microphone Access Required', 'Enable microphone permissions to speak.');
        return;
      }

      await Audio.setAudioModeAsync({
        allowsRecordingIOS: true,
        playsInSilentModeIOS: true,
      });

      const { recording: newRecording } = await Audio.Recording.createAsync(
        Audio.RecordingOptionsPresets.HIGH_QUALITY
      );

      setRecording(newRecording);
      setIsRecording(true);
      setCompanionMood('listening');
      setCompanionGesture('idle');
      setStatusText('Listening...');
    } catch (err) {
      Alert.alert('Recording Failed', 'Could not access mic: ' + err.message);
    }
  };

  const stopVoiceRecording = async () => {
    if (!recording) return;

    setIsRecording(false);
    setRecording(null);
    setCompanionMood('thinking');
    setStatusText('Processing audio...');

    try {
      await recording.stopAndUnloadAsync();
      const uri = recording.getURI();
      if (!uri) throw new Error('Audio file empty');

      const base64Audio = await FileSystem.readAsStringAsync(uri, {
        encoding: FileSystem.EncodingType.Base64,
      });

      const ext = uri.split('.').pop() || 'm4a';
      const mimeType = `audio/${ext === 'm4a' ? 'x-m4a' : ext}`;

      const transcript = await transcribeAudioWithGemini(base64Audio, mimeType);
      
      if (!transcript || !transcript.trim()) {
        Alert.alert('No speech detected', 'Please try speaking again.');
        setCompanionMood('idle');
        return;
      }

      await processUserMessage(transcript.trim());

    } catch (err) {
      Alert.alert('Speech Transcription Error', err.message);
      setCompanionMood('idle');
    } finally {
      setStatusText('Ready');
    }
  };

  // Quick Action Taps
  const handleQuickAction = (action) => {
    if (loading || breathingActive) return;
    
    if (action === 'breath') {
      triggerBreathingExercise();
    } else if (action === 'feelings') {
      setInputText("I'd like to talk about my feelings today.");
    } else if (action === 'mood') {
      navigation.navigate(ROUTES.MOOD_TRACKER);
    } else if (action === 'journal') {
      navigation.navigate(ROUTES.JOURNAL);
    }
  };

  return (
    <KeyboardAvoidingView
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      style={styles.container}
      keyboardVerticalOffset={Platform.OS === 'ios' ? 0 : 20}
    >
      <Header 
        title="SoulSync AI" 
        showBackButton={true} 
        rightComponent={
          <TouchableOpacity onPress={() => navigation.navigate(ROUTES.SETTINGS)} activeOpacity={0.7}>
            <Text style={{ fontSize: 22 }}>⚙️</Text>
          </TouchableOpacity>
        }
        style={styles.header}
        titleStyle={styles.headerTitle}
      />

      <ScrollView 
        ref={scrollViewRef}
        contentContainerStyle={styles.scrollContainer}
        keyboardShouldPersistTaps="handled"
      >
        {/* Mood Greeting Section */}
        <View style={styles.moodSection}>
          <Text style={styles.greetingText}>{getGreeting()}, wellness traveler 🧘‍♀️</Text>
          <View style={styles.moodBadge}>
            <View style={styles.moodDot} />
            <Text style={styles.moodBadgeText}>Companion Mood: {companionMood.toUpperCase()}</Text>
          </View>
        </View>

        {/* Companion Card */}
        <Card style={styles.companionCard} gradientColors={['#EEF2FF', '#E0E7FF']}>
          {/* Replay speech button */}
          <TouchableOpacity 
            style={styles.replayButton} 
            onPress={handleReplaySpeech}
            activeOpacity={0.7}
            disabled={breathingActive}
          >
            <Text style={styles.replayIcon}>🔊</Text>
          </TouchableOpacity>

          {/* Render Animated Companion */}
          <Animated.View style={[styles.avatarBox, { transform: [{ scale: breathingActive ? breathingScale : 1 }] }]}>
            <AnimatedCompanion 
              mood={companionMood} 
              gesture={companionGesture}
              size={280} 
              speaking={isAiSpeaking} 
            />
          </Animated.View>

          {/* Breathing exercise instruction overlays */}
          {breathingActive && (
            <View style={styles.breathingOverlay}>
              <Text style={styles.breathingText}>{breathingText}</Text>
            </View>
          )}
        </Card>

        {/* Chat History Messages */}
        <View style={styles.chatLog}>
          {chatHistory.map((item) => {
            const isUser = item.sender === 'user';
            return (
              <View 
                key={item.id} 
                style={[
                  styles.messageRow, 
                  isUser ? styles.messageRowUser : styles.messageRowCompanion
                ]}
              >
                <View 
                  style={[
                    styles.chatBubble, 
                    isUser ? styles.chatBubbleUser : styles.chatBubbleCompanion
                  ]}
                >
                  <Text style={[styles.chatText, isUser ? styles.chatTextUser : styles.chatTextCompanion]}>
                    {item.message}
                  </Text>
                </View>
              </View>
            );
          })}
          {loading && (
            <View style={styles.loadingBubbleRow}>
              <View style={styles.loadingBubble}>
                <ActivityIndicator size="small" color={THEME.colors.primary} />
              </View>
            </View>
          )}
        </View>
      </ScrollView>

      {/* Quick Actions Scroll Bar */}
      <View style={styles.quickActionsContainer}>
        <ScrollView horizontal={true} showsHorizontalScrollIndicator={false} contentContainerStyle={styles.quickActionsScroll}>
          <TouchableOpacity style={styles.actionChip} onPress={() => handleQuickAction('feelings')}>
            <Text style={styles.actionChipText}>💬 Talk About My Feelings</Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.actionChip} onPress={() => handleQuickAction('breath')}>
            <Text style={styles.actionChipText}>🌬️ Breathing Exercise</Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.actionChip} onPress={() => handleQuickAction('mood')}>
            <Text style={styles.actionChipText}>📊 Mood Check-In</Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.actionChip} onPress={() => handleQuickAction('journal')}>
            <Text style={styles.actionChipText}>✍️ Journal My Thoughts</Text>
          </TouchableOpacity>
        </ScrollView>
      </View>

      {/* Bottom Input Area */}
      <SafeAreaViewStyleWrapper>
        <View style={styles.inputArea}>
          {/* Voice Input Button */}
          <TouchableOpacity 
            style={[styles.voiceBtn, isRecording && styles.voiceBtnActive]} 
            onPress={handleToggleVoiceInput}
            activeOpacity={0.7}
          >
            <Text style={styles.micIcon}>{isRecording ? '⏸' : '🎙️'}</Text>
          </TouchableOpacity>

          {/* Text Input Field */}
          <TextInput
            style={styles.textField}
            placeholder={isRecording ? "Listening to your voice..." : "Share what's on your mind..."}
            placeholderTextColor="#9CA3AF"
            value={inputText}
            onChangeText={setInputText}
            editable={!loading && !isRecording && !breathingActive}
            onSubmitEditing={handleSendText}
          />

          {/* Send Button */}
          <TouchableOpacity 
            style={[styles.sendBtn, (!inputText.trim() || loading) && styles.sendBtnDisabled]} 
            onPress={handleSendText}
            disabled={!inputText.trim() || loading}
            activeOpacity={0.7}
          >
            <Text style={styles.sendIcon}>➔</Text>
          </TouchableOpacity>
        </View>
      </SafeAreaViewStyleWrapper>
    </KeyboardAvoidingView>
  );
}

// Visual Safe Area wrapper for keyboard avoiding inputs on Web/Mobile
function SafeAreaViewStyleWrapper({ children }) {
  return (
    <View style={styles.safeInputWrapper}>
      {children}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F8FAFC',
  },
  header: {
    backgroundColor: '#F8FAFC',
    borderBottomWidth: 1,
    borderBottomColor: '#E2E8F0',
  },
  headerTitle: {
    color: '#1E293B',
  },
  scrollContainer: {
    paddingHorizontal: THEME.sizes.md,
    paddingTop: THEME.sizes.md,
    paddingBottom: 20,
    flexGrow: 1,
  },
  moodSection: {
    marginBottom: THEME.sizes.md,
    alignItems: 'flex-start',
  },
  greetingText: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#1E293B',
    fontFamily: THEME.fonts.bold,
  },
  moodBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#EEF2FF',
    paddingVertical: 4,
    paddingHorizontal: 10,
    borderRadius: 12,
    marginTop: 6,
  },
  moodDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: '#818CF8',
    marginRight: 6,
  },
  moodBadgeText: {
    fontSize: 11,
    fontWeight: 'bold',
    color: '#4F46E5',
  },
  companionCard: {
    height: 320,
    borderRadius: THEME.sizes.radiusLg,
    justifyContent: 'center',
    alignItems: 'center',
    position: 'relative',
    shadowColor: '#6366F1',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.08,
    shadowRadius: 16,
    elevation: 4,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    overflow: 'hidden',
  },
  replayButton: {
    position: 'absolute',
    top: THEME.sizes.sm,
    right: THEME.sizes.sm,
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: '#FFFFFF',
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
    zIndex: 5,
  },
  replayIcon: {
    fontSize: 16,
    color: '#4B5563',
  },
  avatarBox: {
    height: 285,
    width: '100%',
    justifyContent: 'center',
    alignItems: 'center',
  },
  breathingOverlay: {
    position: 'absolute',
    bottom: THEME.sizes.sm,
    backgroundColor: 'rgba(255, 255, 255, 0.9)',
    paddingVertical: 4,
    paddingHorizontal: 16,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    zIndex: 4,
  },
  breathingText: {
    fontSize: 13,
    fontWeight: 'bold',
    color: '#4F46E5',
    textAlign: 'center',
  },
  chatLog: {
    marginTop: THEME.sizes.md,
    width: '100%',
  },
  messageRow: {
    flexDirection: 'row',
    width: '100%',
    marginVertical: THEME.sizes.xs,
  },
  messageRowCompanion: {
    justifyContent: 'flex-start',
  },
  messageRowUser: {
    justifyContent: 'flex-end',
  },
  chatBubble: {
    maxWidth: '78%',
    paddingVertical: 10,
    paddingHorizontal: 14,
    borderRadius: THEME.sizes.radiusMd,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.04,
    shadowRadius: 6,
    elevation: 1,
  },
  chatBubbleCompanion: {
    backgroundColor: '#F1F5F9',
    borderBottomLeftRadius: 4,
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  chatBubbleUser: {
    backgroundColor: '#E0E7FF',
    borderBottomRightRadius: 4,
  },
  chatText: {
    fontSize: 15,
    lineHeight: 20,
  },
  chatTextCompanion: {
    color: '#334155',
  },
  chatTextUser: {
    color: '#1E1B4B',
  },
  loadingBubbleRow: {
    flexDirection: 'row',
    marginVertical: THEME.sizes.xs,
  },
  loadingBubble: {
    backgroundColor: '#F1F5F9',
    paddingVertical: 10,
    paddingHorizontal: 18,
    borderRadius: THEME.sizes.radiusMd,
    borderBottomLeftRadius: 4,
  },
  quickActionsContainer: {
    borderTopWidth: 1,
    borderTopColor: '#F1F5F9',
    backgroundColor: '#FFFFFF',
    paddingVertical: 10,
  },
  quickActionsScroll: {
    paddingHorizontal: THEME.sizes.md,
  },
  actionChip: {
    backgroundColor: '#EEF2FF',
    borderWidth: 1.5,
    borderColor: '#C7D2FE',
    borderRadius: 20,
    paddingVertical: 8,
    paddingHorizontal: 14,
    marginRight: 10,
    shadowColor: '#6366F1',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.03,
    shadowRadius: 3,
    elevation: 1,
  },
  actionChipText: {
    fontSize: 13,
    fontWeight: 'bold',
    color: '#4F46E5',
  },
  safeInputWrapper: {
    borderTopWidth: 1,
    borderTopColor: '#E2E8F0',
    backgroundColor: '#FFFFFF',
    paddingBottom: Platform.OS === 'ios' ? 24 : 12,
    paddingTop: 12,
  },
  inputArea: {
    flexDirection: 'row',
    alignItems: 'center',
    marginHorizontal: THEME.sizes.md,
    backgroundColor: '#F1F5F9',
    borderRadius: 26,
    paddingHorizontal: THEME.sizes.xs,
    height: 52,
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  voiceBtn: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: '#818CF8',
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#6366F1',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 6,
    elevation: 3,
  },
  voiceBtnActive: {
    backgroundColor: '#EF4444',
    shadowColor: '#EF4444',
  },
  micIcon: {
    fontSize: 18,
    color: '#FFFFFF',
  },
  textField: {
    flex: 1,
    height: '100%',
    paddingHorizontal: THEME.sizes.sm,
    fontSize: 15,
    color: '#1E293B',
    outlineStyle: 'none',
  },
  sendBtn: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: '#4F46E5',
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#4F46E5',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 6,
    elevation: 3,
  },
  sendBtnDisabled: {
    backgroundColor: '#CBD5E1',
    shadowColor: 'transparent',
    elevation: 0,
  },
  sendIcon: {
    color: '#FFFFFF',
    fontSize: 18,
    fontWeight: 'bold',
  },
});

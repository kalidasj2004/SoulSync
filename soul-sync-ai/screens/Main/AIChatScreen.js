import React, { useState, useEffect, useRef, useContext } from 'react';
import {
  StyleSheet, Text, View, ScrollView, TouchableOpacity,
  TextInput, Animated, Easing, Alert, Platform,
  KeyboardAvoidingView, Dimensions
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { useNavigation } from '@react-navigation/native';
import { Audio } from 'expo-av';
import * as FileSystem from 'expo-file-system';
import { getSupabase } from '../../services/supabase';
import { AppContext } from '../../AppContext';
import { THEME } from '../../utils/theme';
import { ROUTES } from '../../navigation/RouteNames';
import { generateChatResponse, getSentimentFromGemini, transcribeAudioWithGemini } from '../../services/gemini';
import { speakText, stopSpeech, preloadVoices, testSpeech } from '../../services/speech';
import { analyzeSentiment, MINI_ACTIVITIES } from '../../utils/helpers';
import Header from '../../components/Header';
import AnimatedCompanion from '../../components/AnimatedCompanion';

const { width: SW, height: SH } = Dimensions.get('window');

// Companion size — hero of the screen
const COMP_SIZE = Math.min(SW * 0.78, 340);
const COMP_W = COMP_SIZE * (386 / 278);

/* ─────────────────────────────────────────
   Mini UI Components
───────────────────────────────────────── */

// Soft floating background blobs
function BgBlob({ style }) { return <View pointerEvents="none" style={[{ position: 'absolute', borderRadius: 200 }, style]} />; }

function ChatBackground() {
  return (
    <View pointerEvents="none" style={StyleSheet.absoluteFillObject}>
      <BgBlob style={{ top: -60, left: -80, width: 240, height: 240, backgroundColor: 'rgba(167,139,250,0.08)' }} />
      <BgBlob style={{ top: 100, right: -80, width: 260, height: 260, backgroundColor: 'rgba(99,102,241,0.05)' }} />
      <BgBlob style={{ top: SH * 0.45, left: -50, width: 200, height: 200, backgroundColor: 'rgba(196,181,253,0.07)' }} />
      <BgBlob style={{ bottom: 80, right: -40, width: 220, height: 220, backgroundColor: 'rgba(147,197,253,0.06)' }} />
    </View>
  );
}

// Pulsing glow ring around companion
function CompanionGlow({ size, isActive, color = '#7C3AED' }) {
  const glow = useRef(new Animated.Value(0.3)).current;
  const loop = useRef(null);
  useEffect(() => {
    if (loop.current) loop.current.stop();
    if (isActive) {
      loop.current = Animated.loop(Animated.sequence([
        Animated.timing(glow, { toValue: 0.9, duration: 1000, useNativeDriver: true }),
        Animated.timing(glow, { toValue: 0.3, duration: 1000, useNativeDriver: true }),
      ]));
      loop.current.start();
    } else {
      Animated.timing(glow, { toValue: 0.3, duration: 400, useNativeDriver: true }).start();
    }
    return () => loop.current && loop.current.stop();
  }, [isActive]);

  const gs = size * 1.28;
  return (
    <Animated.View pointerEvents="none" style={{
      position: 'absolute', width: gs, height: gs, borderRadius: gs / 2,
      backgroundColor: `${color}18`,
      shadowColor: color, shadowOffset: { width: 0, height: 0 }, shadowOpacity: 0.5, shadowRadius: 35,
      opacity: glow,
    }} />
  );
}

// Speaking equalizer wave
function SpeakingWave({ isActive }) {
  const b = [
    useRef(new Animated.Value(0.25)).current,
    useRef(new Animated.Value(0.65)).current,
    useRef(new Animated.Value(1)).current,
    useRef(new Animated.Value(0.65)).current,
    useRef(new Animated.Value(0.25)).current,
  ];
  const anims = useRef([]);
  useEffect(() => {
    anims.current.forEach(a => a && a.stop());
    anims.current = [];
    if (!isActive) {
      b.forEach((bar, i) => Animated.timing(bar, { toValue: 0.25, duration: 200, useNativeDriver: true }).start());
      return;
    }
    b.forEach((bar, i) => {
      const a = Animated.loop(Animated.sequence([
        Animated.timing(bar, { toValue: 0.1 + Math.random(), duration: 170 + i * 35, useNativeDriver: true }),
        Animated.timing(bar, { toValue: 0.15, duration: 170 + i * 35, useNativeDriver: true }),
      ]));
      a.start(); anims.current.push(a);
    });
    return () => anims.current.forEach(a => a && a.stop());
  }, [isActive]);
  return (
    <View style={{ flexDirection: 'row', alignItems: 'flex-end', height: 22, gap: 3 }}>
      {b.map((bar, i) => (
        <Animated.View key={i} style={{ width: 4, height: 18, borderRadius: 3, backgroundColor: '#7C3AED', transform: [{ scaleY: bar }] }} />
      ))}
    </View>
  );
}

// Three bouncing dots — thinking state
function ThinkingDots() {
  const d1 = useRef(new Animated.Value(0)).current;
  const d2 = useRef(new Animated.Value(0)).current;
  const d3 = useRef(new Animated.Value(0)).current;
  useEffect(() => {
    [[d1, 0], [d2, 130], [d3, 260]].forEach(([d, delay]) => {
      Animated.loop(Animated.sequence([
        Animated.delay(delay),
        Animated.timing(d, { toValue: -8, duration: 220, useNativeDriver: true }),
        Animated.timing(d, { toValue: 0, duration: 220, useNativeDriver: true }),
        Animated.delay(Math.max(0, 440 - delay)),
      ])).start();
    });
  }, []);
  return (
    <View style={{ flexDirection: 'row', gap: 6, alignItems: 'center', paddingVertical: 2 }}>
      {[d1, d2, d3].map((d, i) => (
        <Animated.View key={i} style={{ width: 10, height: 10, borderRadius: 5, backgroundColor: '#9B7FE8', transform: [{ translateY: d }] }} />
      ))}
    </View>
  );
}

// Listening pulse ring
function ListeningPulse() {
  const pulse = useRef(new Animated.Value(1)).current;
  const fade = useRef(new Animated.Value(0.8)).current;
  useEffect(() => {
    Animated.loop(Animated.parallel([
      Animated.sequence([
        Animated.timing(pulse, { toValue: 1.4, duration: 700, useNativeDriver: true }),
        Animated.timing(pulse, { toValue: 1, duration: 700, useNativeDriver: true }),
      ]),
      Animated.sequence([
        Animated.timing(fade, { toValue: 0.1, duration: 700, useNativeDriver: true }),
        Animated.timing(fade, { toValue: 0.8, duration: 700, useNativeDriver: true }),
      ]),
    ])).start();
  }, []);
  return (
    <Animated.View style={{
      position: 'absolute', width: 68, height: 68, borderRadius: 34,
      borderWidth: 3, borderColor: '#EF4444',
      transform: [{ scale: pulse }], opacity: fade,
    }} />
  );
}

/* ─────────────────────────────────────────
   Main Screen
───────────────────────────────────────── */
export default function AIChatScreen() {
  const navigation = useNavigation();
  const { language } = useContext(AppContext);
  const supabase = getSupabase();

  // Core state
  const [inputText, setInputText] = useState('');
  const [loading, setLoading] = useState(false);
  const [isAiSpeaking, setIsAiSpeaking] = useState(false);
  const [showTypingIndicator, setShowTypingIndicator] = useState(false);
  const [companionMood, setCompanionMood] = useState('idle');
  const [companionGesture, setCompanionGesture] = useState('wave');
  const [chatHistory, setChatHistory] = useState([]);
  const [latestAiMessage, setLatestAiMessage] = useState('');

  // Voice
  const [recording, setRecording] = useState(null);
  const [isRecording, setIsRecording] = useState(false);

  // Breathing
  const [breathingActive, setBreathingActive] = useState(false);
  const [breathingText, setBreathingText] = useState('');
  const breathingScale = useRef(new Animated.Value(1)).current;

  // UI toggles
  const [showTextInput, setShowTextInput] = useState(false);
  const [historyOpen, setHistoryOpen] = useState(false);

  // Animations
  const scrollViewRef = useRef(null);
  const historyHeight = useRef(new Animated.Value(0)).current;
  const floatY = useRef(new Animated.Value(0)).current; // idle floating
  const bubbleOpacity = useRef(new Animated.Value(0)).current;
  const bubbleTranslate = useRef(new Animated.Value(16)).current;
  const micPulse = useRef(new Animated.Value(1)).current;
  const inputSlide = useRef(new Animated.Value(0)).current;

  // Derived conversation state
  const convState = isRecording ? 'listening' : (showTypingIndicator || loading) ? 'thinking' : isAiSpeaking ? 'speaking' : 'idle';

  /* ── Lifecycle ── */
  useEffect(() => {
    // Hide parent tab navigation bar for a clean full-screen interactive mode
    const parent = navigation.getParent();
    if (parent) {
      parent.setOptions({
        tabBarStyle: { display: 'none' }
      });
    }

    loadChatContext();
    preloadVoices();

    // Idle float loop
    const floatLoop = Animated.loop(Animated.sequence([
      Animated.timing(floatY, { toValue: -8, duration: 2200, easing: Easing.inOut(Easing.sin), useNativeDriver: true }),
      Animated.timing(floatY, { toValue: 0, duration: 2200, easing: Easing.inOut(Easing.sin), useNativeDriver: true }),
    ]));
    floatLoop.start();
    setTimeout(() => setCompanionGesture('idle'), 2800);

    return () => {
      floatLoop.stop();
      stopSpeech();
      // Restore tab navigation bar when leaving this screen
      if (parent) {
        parent.setOptions({
          tabBarStyle: {
            backgroundColor: THEME.colors.cardBackgroundSolid,
            borderTopWidth: 1,
            borderTopColor: THEME.colors.border,
            height: 60,
            paddingBottom: 8,
            paddingTop: 8,
          }
        });
      }
    };
  }, []);

  useEffect(() => {
    if (isRecording) {
      const loop = Animated.loop(Animated.sequence([
        Animated.timing(micPulse, { toValue: 1.15, duration: 500, useNativeDriver: true }),
        Animated.timing(micPulse, { toValue: 1, duration: 500, useNativeDriver: true }),
      ]));
      loop.start();
      return () => loop.stop();
    } else {
      micPulse.setValue(1);
    }
  }, [isRecording]);

  // Animate speech bubble in when latest message changes
  useEffect(() => {
    if (latestAiMessage) {
      bubbleOpacity.setValue(0);
      bubbleTranslate.setValue(16);
      Animated.parallel([
        Animated.timing(bubbleOpacity, { toValue: 1, duration: 420, useNativeDriver: true }),
        Animated.spring(bubbleTranslate, { toValue: 0, useNativeDriver: true, tension: 80, friction: 9 }),
      ]).start();
    }
  }, [latestAiMessage]);

  // Scroll history to bottom when open
  useEffect(() => {
    if (historyOpen && scrollViewRef.current) {
      setTimeout(() => scrollViewRef.current?.scrollToEnd({ animated: true }), 200);
    }
  }, [chatHistory, historyOpen]);

  /* ── Text input slide toggle ── */
  const toggleTextInput = () => {
    const next = !showTextInput;
    setShowTextInput(next);
    Animated.spring(inputSlide, { toValue: next ? 1 : 0, useNativeDriver: false, tension: 80, friction: 9 }).start();
  };

  /* ── History drawer toggle ── */
  const toggleHistory = () => {
    const next = !historyOpen;
    const target = next ? Math.min(SH * 0.3, 220) : 0;
    Animated.spring(historyHeight, { toValue: target, useNativeDriver: false, tension: 70, friction: 10 }).start();
    setHistoryOpen(next);
  };

  /* ── Load chat history ── */
  const loadChatContext = async () => {
    if (!supabase) return;
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;
      const { data } = await supabase.from('chat_messages').select('*').eq('user_id', user.id).order('created_at', { ascending: true }).limit(20);
      if (data && data.length > 0) {
        setChatHistory(data);
        const lastAi = [...data].reverse().find(m => m.sender === 'assistant');
        if (lastAi) { setLatestAiMessage(lastAi.message); setCompanionMood(lastAi.sentiment || 'idle'); }
      } else {
        const welcome = { id: 'welcome', sender: 'assistant', message: "Hey there 💜 I'm so glad you're here. How are you feeling today?", created_at: new Date().toISOString(), sentiment: 'supportive' };
        setChatHistory([welcome]);
        setLatestAiMessage(welcome.message);
        setCompanionMood('listening');
      }
    } catch (e) { console.log('loadChatContext error:', e.message); }
  };

  /* ── Process user message ── */
  const processUserMessage = async (userText) => {
    if (!supabase || !userText.trim()) return;
    setLoading(true);
    setCompanionMood('listening');
    setCompanionGesture('idle');
    setShowTextInput(false);

    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const sentiment = analyzeSentiment(userText);
      const userMsg = { user_id: user.id, sender: 'user', message: userText, sentiment };
      const { data: saved } = await supabase.from('chat_messages').insert(userMsg).select().single();
      setChatHistory(prev => [...prev, saved || { ...userMsg, id: Date.now().toString(), created_at: new Date().toISOString() }]);

      // Thinking state
      setCompanionMood('thinking');
      setShowTypingIndicator(true);

      const aiReply = await generateChatResponse(userText, chatHistory);
      await new Promise(r => setTimeout(r, 550));
      setShowTypingIndicator(false);

      const aiMsg = { user_id: user.id, sender: 'assistant', message: aiReply, sentiment };
      const { data: savedAi } = await supabase.from('chat_messages').insert(aiMsg).select().single();
      const finalAiMsg = savedAi || { ...aiMsg, id: (Date.now() + 1).toString(), created_at: new Date().toISOString() };
      setChatHistory(prev => [...prev, finalAiMsg]);
      setLatestAiMessage(aiReply);

      // Set companion emotion
      let mood = 'listening', gesture = 'idle';
      if (sentiment === 'happy') { mood = 'happy'; gesture = 'wave'; }
      else if (sentiment === 'sad' || sentiment === 'stressed') { mood = 'listening'; gesture = 'chest'; }
      else if (sentiment === 'angry') { mood = 'thinking'; }
      const lr = aiReply.toLowerCase();
      if (lr.includes('breathe') || lr.includes('exercise') || lr.includes('below')) gesture = 'point';
      else if (lr.includes('hello') || lr.includes('hi ')) gesture = 'wave';

      setCompanionMood(mood);
      setCompanionGesture(gesture);
      setIsAiSpeaking(true);
      await speakText(aiReply, language, () => setIsAiSpeaking(true), () => { setIsAiSpeaking(false); setCompanionMood(mood); setCompanionGesture('idle'); });

    } catch (e) {
      setShowTypingIndicator(false);
      Alert.alert('Connection Error', e.message);
      setCompanionMood('idle');
    } finally {
      setLoading(false);
    }
  };

  const handleSendText = async () => {
    if (!inputText.trim() || loading) return;
    const text = inputText.trim();
    setInputText('');
    await stopSpeech();
    setIsAiSpeaking(false);
    await processUserMessage(text);
  };

  const handleReplaySpeech = async () => {
    if (!latestAiMessage) return;
    await stopSpeech();
    setIsAiSpeaking(true);
    await speakText(latestAiMessage, language, () => setIsAiSpeaking(true), () => { setIsAiSpeaking(false); });
  };

  /* ── Voice recording ── */
  const handleToggleMic = async () => { isRecording ? await stopVoiceRecording() : await startVoiceRecording(); };

  const startVoiceRecording = async () => {
    try {
      await stopSpeech(); setIsAiSpeaking(false);
      const perm = await Audio.requestPermissionsAsync();
      if (perm.status !== 'granted') { Alert.alert('Mic required', 'Enable microphone to speak.'); return; }
      await Audio.setAudioModeAsync({ allowsRecordingIOS: true, playsInSilentModeIOS: true });
      const { recording: r } = await Audio.Recording.createAsync(Audio.RecordingOptionsPresets.HIGH_QUALITY);
      setRecording(r); setIsRecording(true);
      setCompanionMood('listening'); setCompanionGesture('idle');
    } catch (err) { Alert.alert('Recording Failed', err.message); }
  };

  const stopVoiceRecording = async () => {
    if (!recording) return;
    setIsRecording(false); setRecording(null);
    setCompanionMood('thinking');
    try {
      await recording.stopAndUnloadAsync();
      const uri = recording.getURI();
      if (!uri) throw new Error('Audio empty');
      const ext = uri.split('.').pop() || 'm4a';
      const mime = `audio/${ext === 'm4a' ? 'x-m4a' : ext}`;
      const transcript = await transcribeAudioWithGemini(uri, mime);
      if (!transcript?.trim()) { Alert.alert('No speech detected', 'Try again.'); setCompanionMood('idle'); return; }
      await processUserMessage(transcript.trim());
    } catch (err) { Alert.alert('Transcription Error', err.message); setCompanionMood('idle'); }
  };

  /* ── Breathing exercise ── */
  const triggerBreathingExercise = () => {
    if (breathingActive) return;
    stopSpeech(); setIsAiSpeaking(false);
    setBreathingActive(true); setCompanionMood('thinking'); setCompanionGesture('chest');
    let cycle = 0;
    const runCycle = () => {
      if (cycle >= 3) {
        setBreathingActive(false); setCompanionMood('happy'); setCompanionGesture('idle');
        const msg = "Beautiful! How do you feel now? 🌿";
        setLatestAiMessage(msg);
        saveLocalAiMessage(msg);
        setIsAiSpeaking(true);
        speakText(msg, language, () => setIsAiSpeaking(true), () => { setIsAiSpeaking(false); setCompanionGesture('idle'); });
        return;
      }
      cycle++;
      setBreathingText('Breathe In...');
      Animated.timing(breathingScale, { toValue: 1.2, duration: 4000, easing: Easing.inOut(Easing.sin), useNativeDriver: true }).start(() => {
        setBreathingText('Hold...');
        Animated.delay(4000).start(() => {
          setBreathingText('Breathe Out...');
          Animated.timing(breathingScale, { toValue: 0.95, duration: 4000, easing: Easing.inOut(Easing.sin), useNativeDriver: true }).start(() => runCycle());
        });
      });
    };
    runCycle();
  };

  const saveLocalAiMessage = async (msgText) => {
    if (!supabase) return;
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;
      const m = { user_id: user.id, sender: 'assistant', message: msgText, sentiment: 'supportive' };
      const { data } = await supabase.from('chat_messages').insert(m).select().single();
      setChatHistory(prev => [...prev, data || { ...m, id: Date.now().toString(), created_at: new Date().toISOString() }]);
    } catch (e) { }
  };

  const handleQuickAction = (action) => {
    if (loading || breathingActive) return;
    if (action === 'breathing' || action === 'breath') triggerBreathingExercise();
    else if (action === 'feelings') { setInputText("I'd like to talk about my feelings."); setShowTextInput(true); }
    else if (action === 'mood') navigation.navigate(ROUTES.MOOD_TRACKER);
    else if (action === 'journal') navigation.navigate(ROUTES.JOURNAL);
    else if (action === 'grounding') { setInputText("Guide me through 5-4-3-2-1 grounding."); setShowTextInput(true); }
    else if (action === 'body_scan') { setInputText("Guide me through a body scan."); setShowTextInput(true); }
    else if (action === 'loving_kindness') { setInputText("Guide me through loving kindness meditation."); setShowTextInput(true); }
    else if (action === 'nature_sounds') { setInputText("Tell me about nature sound breaks."); setShowTextInput(true); }
    else if (action === 'cold_water') { setInputText("Tell me about cold water reset."); setShowTextInput(true); }
  };

  /* ─── Render State Label ─── */
  const renderStateUI = () => {
    if (convState === 'listening') return (
      <View style={styles.stateRow}>
        <View style={styles.stateDotRed} />
        <Text style={[styles.stateText, { color: '#EF4444' }]}>Listening to you...</Text>
      </View>
    );
    if (convState === 'thinking') return (
      <View style={styles.stateRow}>
        <ThinkingDots />
        <Text style={[styles.stateText, { marginLeft: 8 }]}>Thinking...</Text>
      </View>
    );
    if (convState === 'speaking') return (
      <View style={styles.stateRow}>
        <SpeakingWave isActive={true} />
        <Text style={[styles.stateText, { marginLeft: 8, color: '#6D28D9' }]}>Speaking...</Text>
      </View>
    );
    if (breathingActive) return (
      <Text style={styles.breathingLabel}>{breathingText}</Text>
    );
    return null;
  };

  /* ─── JSX ─── */
  return (
    <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : 'height'} style={styles.container}>
      {/* Background */}
      <LinearGradient colors={['#F3F0FF', '#EEF2FF', '#E8F4FF', '#F5F3FF']} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }} style={StyleSheet.absoluteFillObject} />
      <ChatBackground />

      {/* Header */}
      <Header
        title="SoulSync AI"
        showBackButton
        rightComponent={
          <TouchableOpacity onPress={handleReplaySpeech} activeOpacity={0.7} style={styles.headerBtn}>
            <Text style={{ fontSize: 18 }}>🔊</Text>
          </TouchableOpacity>
        }
        style={styles.header}
        titleStyle={styles.headerTitle}
      />

      {/* ── COMPANION STAGE ── */}
      <View style={styles.companionStage}>
        <CompanionGlow
          size={COMP_SIZE}
          isActive={isAiSpeaking || breathingActive || isRecording}
          color={isRecording ? '#EF4444' : '#7C3AED'}
        />

        {/* Companion — floats gently */}
        <Animated.View style={[
          styles.companionWrapper,
          {
            transform: [
              { translateY: floatY },
              { scale: breathingActive ? breathingScale : 1 }
            ]
          }
        ]}>
          <AnimatedCompanion
            mood={companionMood}
            gesture={companionGesture}
            size={COMP_SIZE}
            speaking={isAiSpeaking}
          />
        </Animated.View>
      </View>

      {/* ── STATE INDICATOR ── */}
      <View style={styles.stateIndicator}>
        {renderStateUI()}
      </View>

      {/* ── SPEECH BUBBLE (current AI message) ── */}
      {!!latestAiMessage && (
        <Animated.View style={[styles.speechBubbleWrap, { opacity: bubbleOpacity, transform: [{ translateY: bubbleTranslate }] }]}>
          {/* Bubble tail pointing up */}
          <View style={styles.bubbleTailUp} />
          <LinearGradient colors={['#EDE9FE', '#EEF2FF']} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }} style={styles.speechBubble}>
            <Text style={styles.speechText}>{latestAiMessage}</Text>
            {isAiSpeaking && (
              <View style={styles.waveRow}>
                <SpeakingWave isActive={true} />
              </View>
            )}
          </LinearGradient>
        </Animated.View>
      )}

      {/* ── HISTORY TOGGLE ── */}
      {chatHistory.length > 1 && (
        <TouchableOpacity style={styles.historyToggle} onPress={toggleHistory} activeOpacity={0.75}>
          <Text style={styles.historyToggleText}>
            {historyOpen ? '▼' : '▲'} {chatHistory.length} messages · {historyOpen ? 'Hide' : 'View history'}
          </Text>
        </TouchableOpacity>
      )}

      {/* ── COLLAPSIBLE HISTORY DRAWER ── */}
      <Animated.View style={[styles.historyDrawer, { height: historyHeight }]}>
        <ScrollView ref={scrollViewRef} contentContainerStyle={styles.historyContent} showsVerticalScrollIndicator={false}>
          {chatHistory.map((item) => (
            <View key={item.id} style={[styles.historyBubble, item.sender === 'user' ? styles.historyUser : styles.historyAi]}>
              <Text style={[styles.historyText, item.sender === 'user' ? styles.historyTextUser : styles.historyTextAi]}>
                {item.sender === 'user' ? '🧑 ' : '💜 '}{item.message}
              </Text>
            </View>
          ))}
        </ScrollView>
      </Animated.View>

      {/* ── QUICK ACTIONS ── */}
      <View style={styles.quickActionsBar}>
        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ paddingHorizontal: 16, gap: 8 }}>
          {MINI_ACTIVITIES.map((a) => (
            <TouchableOpacity key={a.id} style={styles.chip} onPress={() => handleQuickAction(a.prompt)} activeOpacity={0.75}>
              <Text style={styles.chipText}>{a.emoji} {a.label}</Text>
            </TouchableOpacity>
          ))}
        </ScrollView>
      </View>

      {/* ── TEXT INPUT (slides in when toggled) ── */}
      {showTextInput && (
        <View style={styles.textInputRow}>
          <TextInput
            style={styles.textField}
            placeholder="Share what's on your mind..."
            placeholderTextColor="#9CA3AF"
            value={inputText}
            onChangeText={setInputText}
            editable={!loading && !isRecording}
            onSubmitEditing={handleSendText}
            returnKeyType="send"
            autoFocus
          />
          <TouchableOpacity style={[styles.sendBtn, !inputText.trim() && styles.sendBtnOff]} onPress={handleSendText} disabled={!inputText.trim() || loading}>
            <Text style={styles.sendIcon}>➔</Text>
          </TouchableOpacity>
        </View>
      )}

      {/* ── BOTTOM: MIC + KEYBOARD TOGGLE ── */}
      <View style={styles.bottomBar}>
        {/* Keyboard toggle */}
        <TouchableOpacity style={styles.iconBtn} onPress={toggleTextInput} activeOpacity={0.7}>
          <Text style={styles.iconBtnText}>{showTextInput ? '✕' : '⌨️'}</Text>
        </TouchableOpacity>

        {/* Big centered mic button */}
        <View style={styles.micArea}>
          {isRecording && <ListeningPulse />}
          <Animated.View style={{ transform: [{ scale: micPulse }] }}>
            <TouchableOpacity
              style={[styles.micBtn, isRecording && styles.micBtnActive]}
              onPress={handleToggleMic}
              activeOpacity={0.8}
              disabled={loading}
            >
              <Text style={styles.micIcon}>{isRecording ? '⏹' : '🎤'}</Text>
            </TouchableOpacity>
          </Animated.View>
          <Text style={styles.micLabel}>{isRecording ? 'Tap to stop' : convState === 'speaking' ? 'Speaking...' : 'Tap to speak'}</Text>
        </View>

        {/* Settings */}
        <TouchableOpacity style={styles.iconBtn} onPress={() => navigation.navigate(ROUTES.SETTINGS)} activeOpacity={0.7}>
          <Text style={styles.iconBtnText}>⚙️</Text>
        </TouchableOpacity>
      </View>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#F3F0FF' },
  header: { backgroundColor: 'transparent', borderBottomColor: 'rgba(196,181,253,0.20)', borderBottomWidth: 1 },
  headerTitle: { color: '#1E293B', fontSize: 18, fontWeight: '700' },
  headerBtn: { padding: 6 },

  /* ── Companion Stage ── */
  companionStage: {
    alignItems: 'center',
    justifyContent: 'center',
    flex: 1,
    maxHeight: SH * 0.44,
    minHeight: 180,
    paddingTop: 32, // Push companion down from the header
  },
  companionWrapper: { alignItems: 'center', justifyContent: 'center' },

  /* ── State Indicator ── */
  stateIndicator: { alignItems: 'center', minHeight: 36, justifyContent: 'center', marginBottom: 2 },
  stateRow: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  stateText: { fontSize: 13, fontWeight: '600', color: '#6B7280' },
  stateDotRed: { width: 8, height: 8, borderRadius: 4, backgroundColor: '#EF4444' },
  breathingLabel: { fontSize: 20, fontWeight: 'bold', color: '#6D28D9', textAlign: 'center', letterSpacing: 0.3 },

  /* ── Speech Bubble ── */
  speechBubbleWrap: { marginHorizontal: 20, marginBottom: 4, alignItems: 'center' },
  bubbleTailUp: {
    width: 0, height: 0,
    borderLeftWidth: 10, borderRightWidth: 10, borderBottomWidth: 14,
    borderLeftColor: 'transparent', borderRightColor: 'transparent', borderBottomColor: '#EDE9FE',
    alignSelf: 'center', marginBottom: -1, zIndex: 1,
  },
  speechBubble: {
    borderRadius: 20,
    paddingVertical: 14,
    paddingHorizontal: 18,
    borderWidth: 1.5,
    borderColor: 'rgba(167,139,250,0.35)',
    shadowColor: '#7C3AED',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.10,
    shadowRadius: 12,
    elevation: 4,
    width: '100%',
  },
  speechText: { fontSize: 15, color: '#1E1B4B', lineHeight: 23, fontWeight: '500' },
  waveRow: { flexDirection: 'row', justifyContent: 'flex-end', marginTop: 8 },

  /* ── History ── */
  historyToggle: {
    alignSelf: 'center',
    backgroundColor: 'rgba(238,242,255,0.95)',
    borderRadius: 20,
    paddingVertical: 5,
    paddingHorizontal: 14,
    borderWidth: 1,
    borderColor: 'rgba(196,181,253,0.4)',
    marginBottom: 4,
  },
  historyToggleText: { fontSize: 11, color: '#6D28D9', fontWeight: '700' },
  historyDrawer: { overflow: 'hidden', marginHorizontal: 16 },
  historyContent: { paddingVertical: 8, gap: 6 },
  historyBubble: { borderRadius: 14, paddingVertical: 8, paddingHorizontal: 12, maxWidth: '88%' },
  historyAi: { backgroundColor: '#F0EEFF', alignSelf: 'flex-start' },
  historyUser: { backgroundColor: '#E0E7FF', alignSelf: 'flex-end' },
  historyText: { fontSize: 12, lineHeight: 18 },
  historyTextAi: { color: '#2D1B69' },
  historyTextUser: { color: '#1E1B4B' },

  /* ── Quick Actions ── */
  quickActionsBar: { paddingVertical: 8, borderTopWidth: 1, borderTopColor: 'rgba(196,181,253,0.18)', backgroundColor: 'rgba(248,250,255,0.95)' },
  chip: { backgroundColor: '#EEF2FF', borderWidth: 1.5, borderColor: '#C7D2FE', borderRadius: 18, paddingVertical: 7, paddingHorizontal: 13 },
  chipText: { fontSize: 12, fontWeight: '700', color: '#4F46E5' },

  /* ── Text Input ── */
  textInputRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginHorizontal: 16,
    marginBottom: 8,
    backgroundColor: '#F1F5F9',
    borderRadius: 24,
    paddingHorizontal: 6,
    height: 50,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    shadowColor: '#6366F1',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.06,
    shadowRadius: 6,
    elevation: 2,
  },
  textField: { flex: 1, paddingHorizontal: 12, fontSize: 15, color: '#1E293B', outlineStyle: 'none' },
  sendBtn: { width: 40, height: 40, borderRadius: 20, backgroundColor: '#4F46E5', justifyContent: 'center', alignItems: 'center' },
  sendBtnOff: { backgroundColor: '#CBD5E1' },
  sendIcon: { color: '#fff', fontSize: 18, fontWeight: 'bold' },

  /* ── Bottom Bar ── */
  bottomBar: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 28,
    paddingBottom: Platform.OS === 'ios' ? 28 : 18,
    paddingTop: 12,
    backgroundColor: 'rgba(248,250,255,0.97)',
    borderTopWidth: 1,
    borderTopColor: 'rgba(196,181,253,0.20)',
  },
  iconBtn: { width: 48, height: 48, borderRadius: 24, backgroundColor: '#EEF2FF', borderWidth: 1.5, borderColor: '#C7D2FE', justifyContent: 'center', alignItems: 'center' },
  iconBtnText: { fontSize: 20 },

  /* Big mic button */
  micArea: { alignItems: 'center', gap: 6 },
  micBtn: {
    width: 76, height: 76, borderRadius: 38,
    backgroundColor: '#4F46E5',
    justifyContent: 'center', alignItems: 'center',
    shadowColor: '#4F46E5',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.35,
    shadowRadius: 14,
    elevation: 8,
  },
  micBtnActive: {
    backgroundColor: '#EF4444',
    shadowColor: '#EF4444',
  },
  micIcon: { fontSize: 30 },
  micLabel: { fontSize: 11, color: '#6B7280', fontWeight: '600' },
});

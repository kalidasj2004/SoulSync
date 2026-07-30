import React, { useState, useEffect, useContext, useCallback, useRef } from 'react';
import { StyleSheet, Text, View, ScrollView, RefreshControl, Platform, TouchableOpacity, Image, Animated } from 'react-native';
import { useNavigation, useFocusEffect } from '@react-navigation/native';
import { LinearGradient } from 'expo-linear-gradient';
import { getSupabase } from '../../services/supabase';
import { AppContext } from '../../AppContext';
import { THEME } from '../../utils/theme';
import { ROUTES } from '../../navigation/RouteNames';
import { translate } from '../../services/translations';
import { MOODS } from '../../utils/helpers';

// Components
import Header from '../../components/Header';
import Card from '../../components/Card';

/* ─── Floating Bubble Background ─── */
function Bubble({ size, left, delay, duration }) {
  const translateY = useRef(new Animated.Value(0)).current;
  const opacity = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    const animate = () => {
      translateY.setValue(0);
      opacity.setValue(0);
      Animated.sequence([
        Animated.delay(delay),
        Animated.parallel([
          Animated.timing(translateY, {
            toValue: -700,
            duration,
            useNativeDriver: true,
          }),
          Animated.sequence([
            Animated.timing(opacity, { toValue: 0.35, duration: 600, useNativeDriver: true }),
            Animated.timing(opacity, { toValue: 0.35, duration: duration - 1200, useNativeDriver: true }),
            Animated.timing(opacity, { toValue: 0, duration: 600, useNativeDriver: true }),
          ]),
        ]),
      ]).start(() => animate());
    };
    animate();
  }, []);

  return (
    <Animated.View
      style={[
        bubbleStyles.bubble,
        {
          width: size,
          height: size,
          borderRadius: size / 2,
          left: `${left}%`,
          transform: [{ translateY }],
          opacity,
        },
      ]}
    />
  );
}

const BUBBLES = Array.from({ length: 14 }, (_, i) => ({
  id: i,
  size: 10 + Math.random() * 26,
  left: Math.random() * 90,
  delay: Math.random() * 5000,
  duration: 6000 + Math.random() * 7000,
}));

function BubbleBackground() {
  return (
    <View style={bubbleStyles.container} pointerEvents="none">
      {BUBBLES.map(b => <Bubble key={b.id} {...b} />)}
    </View>
  );
}

const bubbleStyles = StyleSheet.create({
  container: {
    position: 'absolute',
    top: 0, left: 0, right: 0, bottom: 0,
    overflow: 'hidden',
    zIndex: 0,
  },
  bubble: {
    position: 'absolute',
    bottom: -30,
    borderWidth: 1.5,
    borderColor: 'rgba(255,138,61,0.35)',
    backgroundColor: 'rgba(255,213,74,0.12)',
  },
});

export default function HomeScreen() {
  const navigation = useNavigation();
  const { profile, language } = useContext(AppContext);
  const supabase = getSupabase();

  const [currentMood, setCurrentMood] = useState(null);
  const [refreshing, setRefreshing] = useState(false);
  const [quote, setQuote] = useState('');

  const displayName = profile?.display_name || 'SoulSync User';

  const fetchLatestMood = async () => {
    if (!supabase) return;
    try {
      const { data, error } = await supabase
        .from('mood_entries')
        .select('mood')
        .order('created_at', { ascending: false })
        .limit(1);

      if (error) throw error;
      if (data && data.length > 0) {
        setCurrentMood(data[0].mood);
      } else {
        setCurrentMood(null);
      }
    } catch (e) {
      console.log('Error fetching latest mood:', e.message);
    }
  };

  const loadRandomQuote = () => {
    const quotes = [
      "The present moment is filled with joy and happiness. If you are attentive, you will see it. — Thich Nhat Hanh",
      "You are stronger than you know, braver than you think. — Unknown",
      "Self-care is how you take your power back. — Lalah Delia",
      "Every day is a fresh beginning. Take a deep breath and start again. — Unknown",
      "Peace comes from within. Do not seek it without. — Buddha",
      "Quiet the mind and the soul will speak. — Ma Jaya Sati Bhagavati",
      "Nourishing yourself in a way that helps you blossom is self-love. — Unknown"
    ];
    const randomIndex = Math.floor(Math.random() * quotes.length);
    setQuote(quotes[randomIndex]);
  };

  useFocusEffect(
    useCallback(() => {
      fetchLatestMood();
      loadRandomQuote();
    }, [])
  );

  const onRefresh = async () => {
    setRefreshing(true);
    await fetchLatestMood();
    loadRandomQuote();
    setRefreshing(false);
  };

  const getCompanionMessage = () => {
    if (!currentMood) return 'I am here to support you. Let me know how you feel!';
    switch (currentMood) {
      case 'happy': return 'It makes me so happy to see you glowing today!';
      case 'sad': return 'It is okay to feel sad. I am right here beside you.';
      case 'stressed': return 'Take a slow, deep breath. We can handle this together.';
      case 'angry': return 'I understand your frustration. Let us breathe and cool down.';
      default: return 'I am sync-ed with your soul. How can I help you today?';
    }
  };

  const activeMoodInfo = currentMood ? MOODS[currentMood] : null;

  return (
    <View style={styles.container}>
      <BubbleBackground />
      <Header 
        title="SoulSync AI" 
        leftComponent={
          <View style={styles.headerProfileContainer}>
            <LinearGradient
              colors={THEME.colors.primaryGradient}
              style={styles.headerProfileGradient}
            >
              <Text style={styles.headerProfileText}>
                {displayName.charAt(0).toUpperCase()}
              </Text>
            </LinearGradient>
          </View>
        }
        rightComponent={
          <View style={styles.headerRightRow}>
            <TouchableOpacity 
              style={styles.headerRightBtn}
              onPress={() => alert('Notifications: You are fully sync-ed today!')}
              activeOpacity={0.7}
            >
              <Text style={{ fontSize: 18 }}>🔔</Text>
              <View style={styles.notificationDot} />
            </TouchableOpacity>
            <TouchableOpacity 
              style={[styles.headerRightBtn, { marginLeft: 12 }]}
              onPress={() => navigation.navigate(ROUTES.SETTINGS)}
              activeOpacity={0.7}
            >
              <Text style={{ fontSize: 18 }}>⚙️</Text>
            </TouchableOpacity>
          </View>
        }
      />
      
      <ScrollView
        contentContainerStyle={styles.scrollContainer}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl 
            refreshing={refreshing} 
            onRefresh={onRefresh} 
            tintColor={THEME.colors.primary} 
            colors={[THEME.colors.primary]}
          />
        }
      >
        {/* Welcome Banner Header */}
        <View style={styles.welcomeSection}>
          <Text style={styles.welcomeSubtitle}>Good day,</Text>
          <Text style={styles.greetings}>
            {displayName} 👋
          </Text>
          <Text style={styles.prompt}>{translate('howAreYou', language)}</Text>
        </View>

        {/* Premium Companion Card */}
        <Card style={styles.companionCard}>
          <View style={styles.companionRow}>
            <View style={styles.avatarGlowContainer}>
              <Image
                source={require('../../assets/companion_portrait.jpg')}
                style={{ width: 95, height: 95, borderRadius: 47.5 }}
              />
              <View style={styles.pulseDot} />
            </View>
            <View style={styles.companionTextContainer}>
              <View style={styles.companionHeaderRow}>
                <Text style={styles.companionTitle}>Soul Companion</Text>
                {activeMoodInfo ? (
                  <View style={[styles.moodBadge, { backgroundColor: activeMoodInfo.color + '15' }]}>
                    <Text style={[styles.moodBadgeText, { color: activeMoodInfo.color }]}>
                      {activeMoodInfo.emoji} {translate(currentMood, language)}
                    </Text>
                  </View>
                ) : (
                  <View style={styles.offlineBadge}>
                    <Text style={styles.offlineBadgeText}>Sync-ed</Text>
                  </View>
                )}
              </View>
              <Text style={styles.companionText}>{getCompanionMessage()}</Text>
            </View>
          </View>
        </Card>

        {/* Quick Access Menu Header */}
        <View style={styles.sectionHeaderRow}>
          <View style={styles.sectionLineAccent} />
          <Text style={styles.sectionHeader}>{translate('quickAccess', language)}</Text>
        </View>
        
        {/* Grid Access Cards */}
        <View style={styles.gridContainer}>
          <Card 
            onPress={() => navigation.navigate(ROUTES.MOOD_TRACKER)}
            style={styles.gridCard}
          >
            <View style={[styles.emojiBadge, { backgroundColor: '#FFEAD2' }]}>
              <Text style={styles.gridEmoji}>📊</Text>
            </View>
            <Text style={styles.gridTitle}>{translate('moodTracker', language)}</Text>
            <Text style={styles.gridDesc}>{translate('moodTrackerDesc', language)}</Text>
          </Card>

          <Card 
            onPress={() => navigation.navigate(ROUTES.JOURNAL)}
            style={styles.gridCard}
          >
            <View style={[styles.emojiBadge, { backgroundColor: '#FFEAD2' }]}>
              <Text style={styles.gridEmoji}>📓</Text>
            </View>
            <Text style={styles.gridTitle}>{translate('journal', language)}</Text>
            <Text style={styles.gridDesc}>{translate('journalDesc', language)}</Text>
          </Card>
        </View>

        <View style={styles.gridContainer}>
          <Card 
            onPress={() => navigation.navigate(ROUTES.AI_CHAT)}
            style={styles.gridCard}
          >
            <View style={[styles.emojiBadge, { backgroundColor: '#FFEAD2' }]}>
              <Text style={styles.gridEmoji}>💬</Text>
            </View>
            <Text style={styles.gridTitle}>{translate('aiChat', language)}</Text>
            <Text style={styles.gridDesc}>{translate('aiChatDesc', language)}</Text>
          </Card>

          <Card 
            onPress={() => navigation.navigate(ROUTES.WELLNESS)}
            style={styles.gridCard}
          >
            <View style={[styles.emojiBadge, { backgroundColor: '#FFEAD2' }]}>
              <Text style={styles.gridEmoji}>🧘‍♀️</Text>
            </View>
            <Text style={styles.gridTitle}>{translate('wellness', language)}</Text>
            <Text style={styles.gridDesc}>{translate('wellnessDesc', language)}</Text>
          </Card>
        </View>

        {/* Daily Motivation Widget */}
        <Card style={styles.quoteCard} gradientColors={THEME.colors.primaryGradient}>
          <View style={styles.quoteCardBackground}>
            <Text style={styles.quoteTitle}>✨ Daily Motivation</Text>
            <Text style={styles.quoteText}>"{quote}"</Text>
            {/* Soft decorative visual quotes overlay */}
            <Text style={styles.decorativeQuoteMark}>“</Text>
          </View>
        </Card>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: THEME.colors.background,
  },
  scrollContainer: {
    padding: THEME.sizes.md,
    paddingBottom: THEME.sizes.xl + 10,
  },
  headerProfileContainer: {
    width: 34,
    height: 34,
    borderRadius: 17,
    overflow: 'hidden',
    borderWidth: 1.5,
    borderColor: '#FFFFFF',
    ...Platform.select({
      ios: {
        shadowColor: '#FF8A3D',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.1,
        shadowRadius: 4,
      },
      android: {
        elevation: 2,
      },
    }),
  },
  headerProfileGradient: {
    width: '100%',
    height: '100%',
    justifyContent: 'center',
    alignItems: 'center',
  },
  headerProfileText: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: '800',
  },
  headerRightRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  headerRightBtn: {
    position: 'relative',
    width: 34,
    height: 34,
    borderRadius: 17,
    backgroundColor: '#FFFFFF',
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: 'rgba(0, 0, 0, 0.05)',
  },
  notificationDot: {
    position: 'absolute',
    top: 3,
    right: 3,
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: '#FF8A3D',
    borderWidth: 1.5,
    borderColor: '#FFFFFF',
  },
  welcomeSection: {
    marginBottom: THEME.sizes.lg,
    paddingHorizontal: 4,
  },
  welcomeSubtitle: {
    fontSize: 14,
    fontWeight: '600',
    color: THEME.colors.textSecondary,
    textTransform: 'uppercase',
    letterSpacing: 1.5,
  },
  greetings: {
    fontSize: 28,
    fontWeight: '800',
    color: THEME.colors.textPrimary,
    marginTop: 2,
  },
  prompt: {
    fontSize: 14,
    color: THEME.colors.textSecondary,
    marginTop: 6,
    fontStyle: 'italic',
  },
  companionCard: {
    marginBottom: THEME.sizes.lg,
    padding: THEME.sizes.md + 4,
    borderRadius: 24,
    borderWidth: 1,
    borderColor: 'rgba(0, 0, 0, 0.06)',
    backgroundColor: 'rgba(255, 255, 255, 0.8)',
    ...Platform.select({
      ios: {
        shadowColor: '#FF8A3D',
        shadowOffset: { width: 0, height: 8 },
        shadowOpacity: 0.06,
        shadowRadius: 16,
      },
      android: {
        elevation: 3,
      },
    }),
  },
  companionRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  avatarGlowContainer: {
    position: 'relative',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 2,
  },
  pulseDot: {
    position: 'absolute',
    bottom: 2,
    right: 4,
    width: 14,
    height: 14,
    borderRadius: 7,
    backgroundColor: '#10B981',
    borderWidth: 2.5,
    borderColor: '#FFFFFF',
  },
  companionTextContainer: {
    flex: 1,
    marginLeft: THEME.sizes.md,
  },
  companionHeaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'between',
    flexWrap: 'wrap',
    gap: 6,
  },
  companionTitle: {
    fontSize: 16,
    fontWeight: '800',
    color: THEME.colors.textPrimary,
  },
  companionText: {
    fontSize: 13,
    color: THEME.colors.textSecondary,
    marginTop: 6,
    lineHeight: 18,
    fontWeight: '500',
  },
  moodBadge: {
    paddingVertical: 3,
    paddingHorizontal: 8,
    borderRadius: 8,
  },
  moodBadgeText: {
    fontSize: 10,
    fontWeight: '800',
  },
  offlineBadge: {
    backgroundColor: 'rgba(255, 138, 61, 0.12)',
    paddingVertical: 3,
    paddingHorizontal: 8,
    borderRadius: 8,
  },
  offlineBadgeText: {
    fontSize: 10,
    fontWeight: '800',
    color: '#FF8A3D',
  },
  sectionHeaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: THEME.sizes.md,
    marginTop: 4,
  },
  sectionLineAccent: {
    width: 4,
    height: 16,
    backgroundColor: '#FF8A3D',
    borderRadius: 2,
    marginRight: 8,
  },
  sectionHeader: {
    fontSize: 14,
    fontWeight: '800',
    color: THEME.colors.textPrimary,
    textTransform: 'uppercase',
    letterSpacing: 1.2,
  },
  gridContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: THEME.sizes.md,
  },
  gridCard: {
    width: '48.5%',
    padding: THEME.sizes.md,
    borderRadius: 22,
    borderWidth: 1,
    borderColor: 'rgba(0, 0, 0, 0.05)',
    backgroundColor: '#FFFFFF',
    ...Platform.select({
      ios: {
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.02,
        shadowRadius: 8,
      },
      android: {
        elevation: 2,
      },
    }),
  },
  emojiBadge: {
    width: 42,
    height: 42,
    borderRadius: 14,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: THEME.sizes.sm,
  },
  gridEmoji: {
    fontSize: 20,
  },
  gridTitle: {
    fontSize: 15,
    fontWeight: '800',
    color: THEME.colors.textPrimary,
  },
  gridDesc: {
    fontSize: 11,
    color: THEME.colors.textSecondary,
    marginTop: 4,
    lineHeight: 14,
    fontWeight: '500',
  },
  quoteCard: {
    marginTop: THEME.sizes.sm,
    padding: THEME.sizes.lg,
    borderRadius: 26,
    overflow: 'hidden',
    borderWidth: 0,
    elevation: 4,
  },
  quoteCardBackground: {
    position: 'relative',
    zIndex: 1,
  },
  quoteTitle: {
    fontSize: 12,
    fontWeight: '800',
    color: '#FFFFFF',
    opacity: 0.85,
    marginBottom: 8,
    textTransform: 'uppercase',
    letterSpacing: 1.2,
  },
  quoteText: {
    fontSize: 15,
    fontStyle: 'italic',
    color: '#FFFFFF',
    lineHeight: 22,
    fontWeight: '600',
    paddingRight: 10,
  },
  decorativeQuoteMark: {
    position: 'absolute',
    bottom: -32,
    right: -10,
    fontSize: 80,
    color: '#FFFFFF',
    opacity: 0.15,
    fontWeight: 'bold',
    fontFamily: 'serif',
  },
});

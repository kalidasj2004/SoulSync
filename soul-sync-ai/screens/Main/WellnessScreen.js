import React, { useState, useEffect, useRef, useContext } from 'react';
import { StyleSheet, Text, View, ScrollView, Animated, Easing, RefreshControl } from 'react-native';
import { getSupabase } from '../../services/supabase';
import { AppContext } from '../../AppContext';
import { THEME } from '../../utils/theme';
import { translate } from '../../services/translations';
import { WELLNESS_RECOMMENDATIONS, MOODS } from '../../utils/helpers';

// Components
import Header from '../../components/Header';
import Card from '../../components/Card';
import Button from '../../components/Button';

export default function WellnessScreen() {
  const { language } = useContext(AppContext);
  const supabase = getSupabase();

  const [activeMood, setActiveMood] = useState('neutral');
  const [refreshing, setRefreshing] = useState(false);
  
  // Breathing animation states
  const [breathingActive, setBreathingActive] = useState(false);
  const [breathPhase, setBreathPhase] = useState('Ready');
  const [timerText, setTimerText] = useState('0');
  
  const scaleAnim = useRef(new Animated.Value(1)).current;
  const opacityAnim = useRef(new Animated.Value(0.7)).current;
  const breatheTimerRef = useRef(null);

  const fetchActiveMood = async () => {
    if (!supabase) return;
    try {
      const { data, error } = await supabase
        .from('mood_entries')
        .select('mood')
        .order('created_at', { ascending: false })
        .limit(1);

      if (error) throw error;
      if (data && data.length > 0) {
        setActiveMood(data[0].mood);
      }
    } catch (e) {
      console.log('Error fetching active mood for wellness:', e.message);
    }
  };

  useEffect(() => {
    fetchActiveMood();
    return () => stopBreathing();
  }, []);

  const onRefresh = async () => {
    setRefreshing(true);
    await fetchActiveMood();
    setRefreshing(false);
  };

  // Breathing Exercise Logic
  const startBreathing = () => {
    setBreathingActive(true);
    runBreathingCycle();
  };

  const stopBreathing = () => {
    setBreathingActive(false);
    setBreathPhase('Ready');
    setTimerText('0');
    scaleAnim.setValue(1);
    opacityAnim.setValue(0.7);
    if (breatheTimerRef.current) {
      clearInterval(breatheTimerRef.current);
    }
  };

  const runBreathingCycle = () => {
    const isStressed = activeMood === 'stressed';
    const isInhaleSecs = 4;
    const isHoldSecs = isStressed ? 7 : 4;
    const isExhaleSecs = isStressed ? 8 : 6;
    const totalCycleTime = (isInhaleSecs + isHoldSecs + isExhaleSecs) * 1000;

    const cycle = () => {
      let count = 0;
      
      // Phase 1: Inhale
      setBreathPhase('Inhale...');
      Animated.parallel([
        Animated.timing(scaleAnim, {
          toValue: 1.8,
          duration: isInhaleSecs * 1000,
          easing: Easing.linear,
          useNativeDriver: true,
        }),
        Animated.timing(opacityAnim, {
          toValue: 1,
          duration: isInhaleSecs * 1000,
          useNativeDriver: true,
        })
      ]).start();

      let interval = setInterval(() => {
        count++;
        if (count <= isInhaleSecs) {
          setTimerText(count.toString());
        } else if (count <= isInhaleSecs + isHoldSecs) {
          if (count === isInhaleSecs + 1) setBreathPhase('Hold...');
          setTimerText((count - isInhaleSecs).toString());
        } else if (count <= isInhaleSecs + isHoldSecs + isExhaleSecs) {
          if (count === isInhaleSecs + isHoldSecs + 1) {
            setBreathPhase('Exhale...');
            Animated.parallel([
              Animated.timing(scaleAnim, {
                toValue: 1.0,
                duration: isExhaleSecs * 1000,
                easing: Easing.linear,
                useNativeDriver: true,
              }),
              Animated.timing(opacityAnim, {
                toValue: 0.5,
                duration: isExhaleSecs * 1000,
                useNativeDriver: true,
              })
            ]).start();
          }
          setTimerText((count - (isInhaleSecs + isHoldSecs)).toString());
        }

        if (count >= (isInhaleSecs + isHoldSecs + isExhaleSecs)) {
          clearInterval(interval);
        }
      }, 1000);
    };

    cycle();
    breatheTimerRef.current = setInterval(cycle, totalCycleTime);
  };

  const recs = WELLNESS_RECOMMENDATIONS[activeMood] || WELLNESS_RECOMMENDATIONS.neutral;
  const moodConfig = MOODS[activeMood] || MOODS.neutral;

  return (
    <View style={styles.container}>
      <Header title={translate('wellness', language)} showBackButton />

      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={styles.scrollContainer}
        showsVerticalScrollIndicator={false}
        nestedScrollEnabled={true}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={THEME.colors.primary} />
        }
      >
        {/* Mood banner */}
        <Card style={styles.moodBanner} gradientColors={moodConfig.bgGradient}>
          <Text style={styles.moodBannerLabel}>
            {translate('personalizedRecommendations', language)} ({translate(activeMood, language)})
          </Text>
          <Text style={styles.moodBannerDesc}>
            These relaxation exercises and tips have been synced specifically for your current state.
          </Text>
        </Card>

        {/* Breathing Exercise Player */}
        <Card style={styles.breathingCard}>
          <Text style={styles.sectionHeader}>🧘‍♀️ {recs.breathing.title}</Text>
          <Text style={styles.breathingInstructions}>{recs.breathing.instructions}</Text>
          
          <View style={styles.breathingStage}>
            {/* Pulsing Breathing Circle */}
            <Animated.View
              style={[
                styles.breathingCircle,
                {
                  borderColor: moodConfig.color,
                  backgroundColor: moodConfig.color + '15',
                  transform: [{ scale: scaleAnim }],
                  opacity: opacityAnim,
                },
              ]}
            >
              <Text style={[styles.breathPhaseText, { color: moodConfig.color }]}>{breathPhase}</Text>
              {breathingActive && <Text style={styles.breathTimerText}>{timerText}</Text>}
            </Animated.View>
          </View>

          <Button
            title={breathingActive ? 'Stop Exercise' : translate('startBreathing', language)}
            onPress={breathingActive ? stopBreathing : startBreathing}
            variant={breathingActive ? 'secondary' : 'primary'}
            style={styles.breathingBtn}
          />
        </Card>

        {/* Relaxation Activities */}
        <Text style={styles.listHeader}>{translate('relaxationActivities', language)}</Text>
        {recs.activities.map((act, index) => (
          <Card key={index} style={styles.recCard}>
            <Text style={styles.recCardTitle}>⚡ {act.title}</Text>
            <Text style={styles.recCardDesc}>{act.desc}</Text>
          </Card>
        ))}

        {/* Motivational Quotes */}
        <Text style={styles.listHeader}>{translate('motivationalQuotes', language)}</Text>
        {recs.quotes.map((quote, index) => (
          <Card key={index} style={styles.quoteCard}>
            <Text style={styles.quoteText}>{quote}</Text>
          </Card>
        ))}

        {/* Stress-management Tips */}
        <Text style={styles.listHeader}>{translate('stressTips', language)}</Text>
        <Card style={styles.tipsCard}>
          {recs.tips.map((tip, index) => (
            <View key={index} style={styles.tipRow}>
              <Text style={styles.tipBullet}>•</Text>
              <Text style={styles.tipText}>{tip}</Text>
            </View>
          ))}
        </Card>

        {/* Bottom padding so last item isn't cut off */}
        <View style={{ height: 40 }} />
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: THEME.colors.background,
    display: 'flex',
    flexDirection: 'column',
  },
  scrollView: {
    flex: 1,
    width: '100%',
  },
  scrollContainer: {
    padding: THEME.sizes.md,
    paddingBottom: 60,
    flexGrow: 1,
  },
  moodBanner: {
    marginBottom: THEME.sizes.md,
    padding: THEME.sizes.md,
  },
  moodBannerLabel: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#FFFFFF',
  },
  moodBannerDesc: {
    fontSize: 12,
    color: '#FFFFFF',
    opacity: 0.85,
    marginTop: 4,
    lineHeight: 16,
  },
  breathingCard: {
    alignItems: 'center',
    marginBottom: THEME.sizes.md,
    padding: THEME.sizes.md,
  },
  sectionHeader: {
    fontSize: 16,
    fontWeight: 'bold',
    color: THEME.colors.textPrimary,
    marginBottom: 6,
  },
  breathingInstructions: {
    fontSize: 13,
    color: THEME.colors.textSecondary,
    textAlign: 'center',
    lineHeight: 18,
    paddingHorizontal: THEME.sizes.sm,
    marginBottom: THEME.sizes.lg,
  },
  breathingStage: {
    height: 200,
    width: '100%',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: THEME.sizes.md,
  },
  breathingCircle: {
    width: 100,
    height: 100,
    borderRadius: 50,
    borderWidth: 3,
    justifyContent: 'center',
    alignItems: 'center',
  },
  breathPhaseText: {
    fontSize: 14,
    fontWeight: 'bold',
  },
  breathTimerText: {
    fontSize: 22,
    fontWeight: 'bold',
    color: THEME.colors.textPrimary,
    marginTop: 4,
  },
  breathingBtn: {
    width: '100%',
    marginTop: THEME.sizes.sm,
  },
  listHeader: {
    fontSize: 14,
    fontWeight: 'bold',
    color: THEME.colors.textPrimary,
    marginTop: THEME.sizes.md,
    marginBottom: THEME.sizes.sm,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  recCard: {
    marginBottom: THEME.sizes.sm,
    padding: THEME.sizes.md,
  },
  recCardTitle: {
    fontSize: 15,
    fontWeight: 'bold',
    color: THEME.colors.textPrimary,
  },
  recCardDesc: {
    fontSize: 13,
    color: THEME.colors.textSecondary,
    marginTop: 4,
    lineHeight: 18,
  },
  quoteCard: {
    marginBottom: THEME.sizes.sm,
    padding: THEME.sizes.md,
    backgroundColor: 'rgba(255, 255, 255, 0.02)',
  },
  quoteText: {
    fontSize: 14,
    fontStyle: 'italic',
    color: THEME.colors.textSecondary,
    lineHeight: 20,
  },
  tipsCard: {
    padding: THEME.sizes.md,
    marginBottom: THEME.sizes.md,
  },
  tipRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginBottom: 8,
  },
  tipBullet: {
    fontSize: 16,
    color: THEME.colors.primary,
    marginRight: 8,
    lineHeight: 18,
  },
  tipText: {
    flex: 1,
    fontSize: 13,
    color: THEME.colors.textSecondary,
    lineHeight: 18,
  },
});

import React, { useState, useEffect, useContext, useCallback } from 'react';
import { StyleSheet, Text, View, ScrollView, Alert, RefreshControl, Platform } from 'react-native';
import { useNavigation, useFocusEffect } from '@react-navigation/native';
import { getSupabase } from '../../services/supabase';
import { AppContext } from '../../AppContext';
import { THEME } from '../../utils/theme';
import { ROUTES } from '../../navigation/RouteNames';
import { translate } from '../../services/translations';
import { MOODS } from '../../utils/helpers';

// Components
import Header from '../../components/Header';
import Card from '../../components/Card';
import Button from '../../components/Button';

export default function ProfileScreen() {
  const navigation = useNavigation();
  const { session, profile, language, handleLogout } = useContext(AppContext);
  const supabase = getSupabase();

  const [moodCount, setMoodCount] = useState(0);
  const [journalCount, setJournalCount] = useState(0);
  const [dominantMood, setDominantMood] = useState(null);
  const [refreshing, setRefreshing] = useState(false);

  const displayName = profile?.display_name || 'SoulSync User';
  const email = session?.user?.email || '';
  const memberDate = session?.user?.created_at 
    ? new Date(session.user.created_at).toLocaleDateString(language, { year: 'numeric', month: 'long' }) 
    : '';

  const fetchProfileStats = async () => {
    if (!supabase) return;
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      // 1. Get mood entries count and details
      const { data: moods, error: moodErr } = await supabase
        .from('mood_entries')
        .select('mood')
        .eq('user_id', user.id);

      if (moodErr) throw moodErr;
      setMoodCount(moods?.length || 0);

      // Calculate dominant mood
      if (moods && moods.length > 0) {
        const counts = {};
        moods.forEach(item => {
          counts[item.mood] = (counts[item.mood] || 0) + 1;
        });
        const bestMood = Object.keys(counts).reduce((a, b) => counts[a] > counts[b] ? a : b);
        setDominantMood(bestMood);
      } else {
        setDominantMood(null);
      }

      // 2. Get journal entries count
      const { count: jCount, error: journalErr } = await supabase
        .from('journal_entries')
        .select('*', { count: 'exact', head: true })
        .eq('user_id', user.id);

      if (journalErr) throw journalErr;
      setJournalCount(jCount || 0);

    } catch (e) {
      console.log('Error loading stats:', e.message);
    }
  };

  useFocusEffect(
    useCallback(() => {
      fetchProfileStats();
    }, [])
  );

  const onRefresh = async () => {
    setRefreshing(true);
    await fetchProfileStats();
    setRefreshing(false);
  };

  const confirmLogout = () => {
    const performLogout = async () => {
      try {
        if (supabase) {
          await supabase.auth.signOut();
        }
      } catch (e) {
        console.log('Signout error:', e.message);
      } finally {
        handleLogout();
      }
    };

    if (Platform.OS === 'web') {
      const confirm = window.confirm('Are you sure you want to sign out of SoulSync AI?');
      if (confirm) {
        performLogout();
      }
    } else {
      Alert.alert(
        translate('logout', language),
        'Are you sure you want to sign out of SoulSync AI?',
        [
          { text: 'Cancel', style: 'cancel' },
          { 
            text: 'Sign Out', 
            style: 'destructive',
            onPress: performLogout,
          }
        ]
      );
    }
  };

  const signatureMoodConfig = dominantMood ? MOODS[dominantMood] : null;

  return (
    <View style={styles.container}>
      <Header title={translate('profile', language)} />
      
      <ScrollView
        contentContainerStyle={styles.scrollContainer}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={THEME.colors.primary} />
        }
      >
        {/* User Card */}
        <Card style={styles.userCard}>
          <View style={styles.avatarPlaceholder}>
            <Text style={styles.avatarText}>{displayName.slice(0, 1).toUpperCase()}</Text>
          </View>
          <Text style={styles.userName}>{displayName}</Text>
          <Text style={styles.userEmail}>{email}</Text>
          <Text style={styles.userJoined}>{translate('memberSince', language)}: {memberDate}</Text>
        </Card>

        {/* Stats Row */}
        <View style={styles.statsRow}>
          <Card style={styles.statCard}>
            <Text style={styles.statNumber}>{moodCount}</Text>
            <Text style={styles.statLabel}>{translate('totalLogs', language)}</Text>
          </Card>

          <Card style={styles.statCard}>
            <Text style={styles.statNumber}>{journalCount}</Text>
            <Text style={styles.statLabel}>{translate('totalJournals', language)}</Text>
          </Card>
        </View>

        {/* Dominant Mood Widget */}
        {signatureMoodConfig && (
          <Card style={styles.signatureCard} gradientColors={THEME.colors.primaryGradient}>
            <Text style={styles.signatureHeader}>🌟 Signature Emotion</Text>
            <View style={styles.signatureRow}>
              <Text style={styles.signatureEmoji}>{signatureMoodConfig.emoji}</Text>
              <View style={styles.signatureTextCol}>
                <Text style={styles.signatureTitle}>
                  Mostly {translate(dominantMood, language)}
                </Text>
                <Text style={styles.signatureDesc}>
                  Based on your tracking history, you mostly log a {dominantMood} mood state.
                </Text>
              </View>
            </View>
          </Card>
        )}

        {/* Action Shortcuts */}
        <Card style={styles.actionsCard}>
          <Button
            title="Detailed Charts & Trends"
            onPress={() => navigation.navigate(ROUTES.ANALYTICS)}
            variant="outline"
            style={styles.actionBtn}
          />
          <Button
            title={translate('settings', language)}
            onPress={() => navigation.navigate(ROUTES.SETTINGS)}
            variant="secondary"
            style={styles.actionBtn}
          />
          <Button
            title={translate('logout', language)}
            onPress={confirmLogout}
            variant="danger"
            style={[styles.actionBtn, { marginBottom: 0 }]}
          />
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
    paddingBottom: THEME.sizes.xl,
  },
  userCard: {
    alignItems: 'center',
    padding: THEME.sizes.lg,
    marginBottom: THEME.sizes.md,
  },
  avatarPlaceholder: {
    width: 72,
    height: 72,
    borderRadius: 36,
    backgroundColor: THEME.colors.primary,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: THEME.sizes.sm,
  },
  avatarText: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#FFFFFF',
  },
  userName: {
    fontSize: 20,
    fontWeight: 'bold',
    color: THEME.colors.textPrimary,
  },
  userEmail: {
    fontSize: 14,
    color: THEME.colors.textSecondary,
    marginTop: 2,
  },
  userJoined: {
    fontSize: 11,
    color: THEME.colors.textMuted,
    marginTop: 6,
  },
  statsRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: THEME.sizes.md,
  },
  statCard: {
    width: '48%',
    alignItems: 'center',
    padding: THEME.sizes.md,
  },
  statNumber: {
    fontSize: 24,
    fontWeight: 'bold',
    color: THEME.colors.primary,
  },
  statLabel: {
    fontSize: 12,
    color: THEME.colors.textSecondary,
    marginTop: 4,
    textAlign: 'center',
  },
  signatureCard: {
    padding: THEME.sizes.md,
    marginBottom: THEME.sizes.md,
  },
  signatureHeader: {
    fontSize: 12,
    fontWeight: 'bold',
    color: '#FFFFFF',
    textTransform: 'uppercase',
    opacity: 0.9,
  },
  signatureRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: THEME.sizes.sm,
  },
  signatureEmoji: {
    fontSize: 40,
    marginRight: THEME.sizes.md,
  },
  signatureTextCol: {
    flex: 1,
  },
  signatureTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#FFFFFF',
  },
  signatureDesc: {
    fontSize: 12,
    color: '#FFFFFF',
    opacity: 0.85,
    marginTop: 2,
    lineHeight: 16,
  },
  actionsCard: {
    padding: THEME.sizes.md,
  },
  actionBtn: {
    marginBottom: THEME.sizes.sm,
  },
});

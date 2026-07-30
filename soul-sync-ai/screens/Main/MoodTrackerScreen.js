import React, { useState, useEffect, useContext } from 'react';
import { StyleSheet, Text, View, ScrollView, FlatList, Alert, RefreshControl, TouchableOpacity } from 'react-native';
import { getSupabase } from '../../services/supabase';
import { AppContext } from '../../AppContext';
import { THEME } from '../../utils/theme';
import { translate } from '../../services/translations';
import { MOODS, formatDate } from '../../utils/helpers';

// Components
import Header from '../../components/Header';
import MoodSelector from '../../components/MoodSelector';
import Input from '../../components/Input';
import Button from '../../components/Button';
import Card from '../../components/Card';

export default function MoodTrackerScreen() {
  const { language } = useContext(AppContext);
  const supabase = getSupabase();

  const [selectedMood, setSelectedMood] = useState('neutral');
  const [note, setNote] = useState('');
  const [history, setHistory] = useState([]);
  const [stats, setStats] = useState({});
  const [loading, setLoading] = useState(false);
  const [refreshing, setRefreshing] = useState(false);

  const fetchMoodData = async () => {
    if (!supabase) return;
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const { data, error } = await supabase
        .from('mood_entries')
        .select('*')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false });

      if (error) throw error;

      setHistory(data || []);
      calculateStats(data || []);
    } catch (e) {
      console.log('Error fetching moods:', e.message);
    }
  };

  const calculateStats = (logs) => {
    const counts = { happy: 0, neutral: 0, sad: 0, stressed: 0, angry: 0 };
    logs.forEach((log) => {
      if (counts[log.mood] !== undefined) {
        counts[log.mood] += 1;
      }
    });

    const total = logs.length;
    const percentages = {};
    Object.keys(counts).forEach((key) => {
      percentages[key] = total > 0 ? Math.round((counts[key] / total) * 100) : 0;
    });

    setStats({ counts, percentages, total });
  };

  useEffect(() => {
    fetchMoodData();
  }, []);

  const handleSaveMood = async () => {
    if (!supabase) {
      Alert.alert('Configuration Required', 'Please configure your Supabase connection first.');
      return;
    }

    setLoading(true);
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('User not found');

      const { error } = await supabase.from('mood_entries').insert({
        user_id: user.id,
        mood: selectedMood,
        note: note.trim() || null,
      });

      if (error) throw error;

      Alert.alert('Success', translate('moodSaved', language));
      setNote('');
      fetchMoodData();
    } catch (e) {
      Alert.alert('Error', 'Failed to save mood: ' + e.message);
    } finally {
      setLoading(false);
    }
  };

  const onRefresh = async () => {
    setRefreshing(true);
    await fetchMoodData();
    setRefreshing(false);
  };

  const renderHistoryItem = ({ item }) => {
    const moodConfig = MOODS[item.mood];
    return (
      <Card style={styles.historyCard}>
        <View style={styles.historyHeader}>
          <View style={styles.historyMood}>
            <Text style={styles.historyEmoji}>{moodConfig?.emoji}</Text>
            <Text style={[styles.historyLabel, { color: moodConfig?.color }]}>
              {translate(item.mood, language)}
            </Text>
          </View>
          <Text style={styles.historyDate}>{formatDate(item.created_at, language)}</Text>
        </View>
        {item.note && <Text style={styles.historyNote}>{item.note}</Text>}
      </Card>
    );
  };

  const renderStats = () => {
    if (!stats.total) return null;

    return (
      <Card style={styles.statsCard}>
        <Text style={styles.statsTitle}>{translate('moodStats', language)}</Text>
        <View style={styles.statsContainer}>
          {Object.keys(MOODS).map((key) => {
            const mood = MOODS[key];
            const percentage = stats.percentages?.[key] || 0;
            const count = stats.counts?.[key] || 0;

            return (
              <View key={key} style={styles.statRow}>
                <View style={styles.statLabelCol}>
                  <Text style={styles.statEmoji}>{mood.emoji}</Text>
                  <Text style={styles.statName}>{translate(key, language)}</Text>
                </View>
                
                {/* Progress bar */}
                <View style={styles.progressBarBg}>
                  <View 
                    style={[
                      styles.progressBarFill, 
                      { width: `${percentage}%`, backgroundColor: mood.color }
                    ]} 
                  />
                </View>

                <Text style={styles.statPercent}>{percentage}% ({count})</Text>
              </View>
            );
          })}
        </View>
      </Card>
    );
  };

  return (
    <View style={styles.container}>
      <Header title={translate('moodTracker', language)} />
      
      <ScrollView
        contentContainerStyle={styles.scrollContainer}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={THEME.colors.primary} />
        }
      >
        {/* Entry card */}
        <Card style={styles.entryCard}>
          <Text style={styles.sectionTitle}>{translate('howAreYou', language)}</Text>
          
          <MoodSelector
            selectedMood={selectedMood}
            onSelectMood={setSelectedMood}
            language={language}
          />

          <Input
            placeholder={translate('moodPlaceholder', language)}
            value={note}
            onChangeText={setNote}
            multiline
            numberOfLines={2}
          />

          <Button
            title={translate('logMoodBtn', language)}
            onPress={handleSaveMood}
            loading={loading}
          />
        </Card>

        {/* Stats view */}
        {renderStats()}

        {/* Chronological log */}
        <Text style={styles.listHeader}>{translate('moodHistory', language)}</Text>
        
        {history.length === 0 ? (
          <Card style={styles.emptyCard}>
            <Text style={styles.emptyText}>{translate('noMoods', language)}</Text>
          </Card>
        ) : (
          history.map(item => (
            <View key={item.id}>
              {renderHistoryItem({ item })}
            </View>
          ))
        )}
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
  entryCard: {
    marginBottom: THEME.sizes.md,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: THEME.colors.textPrimary,
    textAlign: 'center',
    marginBottom: THEME.sizes.sm,
  },
  statsCard: {
    marginBottom: THEME.sizes.md,
  },
  statsTitle: {
    fontSize: 15,
    fontWeight: 'bold',
    color: THEME.colors.textPrimary,
    marginBottom: THEME.sizes.md,
  },
  statsContainer: {
    width: '100%',
  },
  statRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 10,
    justifyContent: 'space-between',
  },
  statLabelCol: {
    flexDirection: 'row',
    alignItems: 'center',
    width: 90,
  },
  statEmoji: {
    fontSize: 16,
    marginRight: 6,
  },
  statName: {
    fontSize: 13,
    color: THEME.colors.textSecondary,
  },
  progressBarBg: {
    flex: 1,
    height: 8,
    backgroundColor: 'rgba(255, 255, 255, 0.05)',
    borderRadius: 4,
    marginHorizontal: 12,
    overflow: 'hidden',
  },
  progressBarFill: {
    height: '100%',
    borderRadius: 4,
  },
  statPercent: {
    fontSize: 12,
    color: THEME.colors.textSecondary,
    width: 60,
    textAlign: 'right',
  },
  listHeader: {
    fontSize: 15,
    fontWeight: 'bold',
    color: THEME.colors.textPrimary,
    marginVertical: THEME.sizes.md,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  historyCard: {
    marginBottom: THEME.sizes.sm,
    padding: THEME.sizes.md,
  },
  historyHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 6,
  },
  historyMood: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  historyEmoji: {
    fontSize: 20,
    marginRight: 6,
  },
  historyLabel: {
    fontSize: 14,
    fontWeight: 'bold',
  },
  historyDate: {
    fontSize: 11,
    color: THEME.colors.textMuted,
  },
  historyNote: {
    fontSize: 13,
    color: THEME.colors.textSecondary,
    lineHeight: 18,
    marginTop: 4,
  },
  emptyCard: {
    padding: THEME.sizes.lg,
    alignItems: 'center',
  },
  emptyText: {
    color: THEME.colors.textSecondary,
    fontSize: 14,
  },
});

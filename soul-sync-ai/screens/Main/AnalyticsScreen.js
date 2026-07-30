import React, { useState, useEffect, useContext, useCallback } from 'react';
import { StyleSheet, Text, View, ScrollView, Dimensions, ActivityIndicator, RefreshControl } from 'react-native';
import { useFocusEffect } from '@react-navigation/native';
import { LineChart, BarChart } from 'react-native-chart-kit';
import { getSupabase } from '../../services/supabase';
import { AppContext } from '../../AppContext';
import { THEME } from '../../utils/theme';
import { translate } from '../../services/translations';
import { MOODS } from '../../utils/helpers';

// Components
import Header from '../../components/Header';
import Card from '../../components/Card';

const screenWidth = Dimensions.get('window').width - 32;

// Map moods to numerical values for LineChart
const MOOD_SCORES = {
  happy: 5,
  neutral: 4,
  stressed: 3,
  sad: 2,
  angry: 1,
};

const SCORE_LABELS = {
  5: '😊',
  4: '😐',
  3: '🤯',
  2: '😢',
  1: '😠',
};

export default function AnalyticsScreen() {
  const { language } = useContext(AppContext);
  const supabase = getSupabase();

  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [chartData, setChartData] = useState({ weekly: null, monthly: null });
  const [trendMessage, setTrendMessage] = useState('');
  const [totalLogs, setTotalLogs] = useState(0);

  const fetchAnalyticsData = async () => {
    if (!supabase) return;
    try {
      setLoading(true);
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const { data, error } = await supabase
        .from('mood_entries')
        .select('*')
        .eq('user_id', user.id)
        .order('created_at', { ascending: true }); // Ascending order is better for charts (left-to-right timeline)

      if (error) throw error;

      setTotalLogs(data?.length || 0);

      if (data && data.length > 0) {
        formatWeeklyData(data);
        formatMonthlyData(data);
        generateTrendMessage(data);
      } else {
        setChartData({ weekly: null, monthly: null });
      }
    } catch (e) {
      console.log('Error fetching analytics:', e.message);
    } finally {
      setLoading(false);
    }
  };

  useFocusEffect(
    useCallback(() => {
      fetchAnalyticsData();
    }, [])
  );

  const onRefresh = async () => {
    setRefreshing(true);
    await fetchAnalyticsData();
    setRefreshing(false);
  };

  // 1. Weekly timeline format (last 7 entries)
  const formatWeeklyData = (logs) => {
    const weeklyLogs = logs.slice(-7); // Last 7 logs
    
    if (weeklyLogs.length === 0) return;

    const labels = weeklyLogs.map(log => {
      const date = new Date(log.created_at);
      return date.toLocaleDateString(language === 'ml' ? 'ml-IN' : language === 'hi' ? 'hi-IN' : 'en-US', { weekday: 'short' });
    });

    const dataPoints = weeklyLogs.map(log => MOOD_SCORES[log.mood] || 3);

    setChartData(prev => ({
      ...prev,
      weekly: {
        labels,
        datasets: [
          {
            data: dataPoints,
            color: (opacity = 1) => `rgba(139, 92, 246, ${opacity})`, // primary color
            strokeWidth: 2,
          }
        ],
      }
    }));
  };

  // 2. Monthly frequency breakdown (last 30 logs)
  const formatMonthlyData = (logs) => {
    const monthlyLogs = logs.slice(-30);
    const counts = { happy: 0, neutral: 0, sad: 0, stressed: 0, angry: 0 };
    
    monthlyLogs.forEach(log => {
      if (counts[log.mood] !== undefined) {
        counts[log.mood] += 1;
      }
    });

    setChartData(prev => ({
      ...prev,
      monthly: {
        labels: [
          MOODS.happy.emoji,
          MOODS.neutral.emoji,
          MOODS.sad.emoji,
          MOODS.stressed.emoji,
          MOODS.angry.emoji,
        ],
        datasets: [
          {
            data: [counts.happy, counts.neutral, counts.sad, counts.stressed, counts.angry]
          }
        ]
      }
    }));
  };

  // 3. Generate Insight Text
  const generateTrendMessage = (logs) => {
    const last10 = logs.slice(-10);
    const counts = { happy: 0, neutral: 0, sad: 0, stressed: 0, angry: 0 };
    last10.forEach(l => counts[l.mood]++);

    const maxMood = Object.keys(counts).reduce((a, b) => counts[a] > counts[b] ? a : b);
    
    if (counts[maxMood] === 0) {
      setTrendMessage(translate('trendVarying', language));
      return;
    }

    if (maxMood === 'happy') {
      setTrendMessage(translate('trendHappy', language));
    } else if (maxMood === 'sad' || maxMood === 'stressed' || maxMood === 'angry') {
      setTrendMessage(translate('trendLow', language));
    } else {
      setTrendMessage(translate('trendVarying', language));
    }
  };

  const chartConfig = {
    backgroundColor: THEME.colors.cardBackgroundSolid,
    backgroundGradientFrom: THEME.colors.cardBackgroundSolid,
    backgroundGradientTo: '#1C153B',
    decimalPlaces: 0,
    color: (opacity = 1) => `rgba(139, 92, 246, ${opacity})`,
    labelColor: (opacity = 1) => `rgba(255, 255, 255, ${opacity})`,
    style: {
      borderRadius: 16,
    },
    propsForDots: {
      r: '5',
      strokeWidth: '1.5',
      stroke: THEME.colors.secondary,
    }
  };

  return (
    <View style={styles.container}>
      <Header title={translate('analytics', language)} showBackButton />
      
      {loading && !refreshing ? (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={THEME.colors.primary} />
        </View>
      ) : (
        <ScrollView
          contentContainerStyle={styles.scrollContainer}
          refreshControl={
            <RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={THEME.colors.primary} />
          }
        >
          {totalLogs === 0 ? (
            <Card style={styles.emptyCard}>
              <Text style={styles.emptyEmoji}>📈</Text>
              <Text style={styles.emptyText}>No Analytics Available</Text>
              <Text style={styles.emptySubText}>
                Log your mood daily on the Mood Tracker screen to build charts here.
              </Text>
            </Card>
          ) : (
            <View>
              {/* Trend summary */}
              <Card style={styles.trendCard} gradientColors={THEME.colors.accentGradient}>
                <Text style={styles.trendHeader}>{translate('progressTracking', language)}</Text>
                <Text style={styles.trendDesc}>{trendMessage}</Text>
                <Text style={styles.trendTotal}>Total Logs Analyzed: {totalLogs}</Text>
              </Card>

              {/* Weekly Line Chart */}
              {chartData.weekly && (
                <Card style={styles.chartCard}>
                  <Text style={styles.chartTitle}>{translate('weeklyChart', language)}</Text>
                  <Text style={styles.chartSubtitle}>Emotional Index (5=😊, 1=😠)</Text>
                  
                  <LineChart
                    data={chartData.weekly}
                    width={screenWidth}
                    height={200}
                    yAxisLabel=""
                    yAxisSuffix=""
                    fromZero={false}
                    segments={4}
                    chartConfig={chartConfig}
                    bezier
                    style={styles.chart}
                  />
                </Card>
              )}

              {/* Monthly Frequency Chart */}
              {chartData.monthly && (
                <Card style={styles.chartCard}>
                  <Text style={styles.chartTitle}>{translate('monthlyChart', language)}</Text>
                  <Text style={styles.chartSubtitle}>Frequency distribution of logged moods</Text>
                  
                  <BarChart
                    data={chartData.monthly}
                    width={screenWidth}
                    height={200}
                    chartConfig={{
                      ...chartConfig,
                      color: (opacity = 1) => `rgba(236, 72, 153, ${opacity})`, // Secondary pink
                    }}
                    style={styles.chart}
                    fromZero
                    showValuesOnTopOfBars
                  />
                </Card>
              )}
            </View>
          )}
        </ScrollView>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: THEME.colors.background,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  scrollContainer: {
    padding: THEME.sizes.md,
    paddingBottom: THEME.sizes.xl,
  },
  emptyCard: {
    padding: THEME.sizes.xl,
    alignItems: 'center',
    marginTop: 40,
  },
  emptyEmoji: {
    fontSize: 44,
    marginBottom: THEME.sizes.sm,
  },
  emptyText: {
    fontSize: 16,
    fontWeight: 'bold',
    color: THEME.colors.textPrimary,
  },
  emptySubText: {
    fontSize: 12,
    color: THEME.colors.textSecondary,
    textAlign: 'center',
    marginTop: 4,
    lineHeight: 16,
  },
  trendCard: {
    padding: THEME.sizes.lg,
    marginBottom: THEME.sizes.md,
  },
  trendHeader: {
    fontSize: 14,
    fontWeight: 'bold',
    color: '#FFFFFF',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  trendDesc: {
    fontSize: 16,
    color: '#FFFFFF',
    fontWeight: 'bold',
    marginTop: 6,
    lineHeight: 22,
  },
  trendTotal: {
    fontSize: 11,
    color: '#FFFFFF',
    opacity: 0.8,
    marginTop: 8,
  },
  chartCard: {
    marginBottom: THEME.sizes.md,
    padding: THEME.sizes.md,
    alignItems: 'center',
  },
  chartTitle: {
    fontSize: 15,
    fontWeight: 'bold',
    color: THEME.colors.textPrimary,
    alignSelf: 'flex-start',
  },
  chartSubtitle: {
    fontSize: 11,
    color: THEME.colors.textSecondary,
    alignSelf: 'flex-start',
    marginBottom: THEME.sizes.md,
  },
  chart: {
    marginVertical: 8,
    borderRadius: 16,
  },
});

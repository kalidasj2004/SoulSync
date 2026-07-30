import React, { useState, useEffect, useContext } from 'react';
import { StyleSheet, Text, View, ScrollView, TouchableOpacity, Platform } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { AppContext } from '../../AppContext';
import { THEME } from '../../utils/theme';
import { LANGUAGES, translate } from '../../services/translations';

// Components
import Header from '../../components/Header';
import Card from '../../components/Card';

export default function SettingsScreen() {
  const { language, setLanguage } = useContext(AppContext);

  // States for Wellness Preferences
  const [moodReminder, setMoodReminder] = useState(true);
  const [journalReminder, setJournalReminder] = useState(false);
  const [voiceFeedback, setVoiceFeedback] = useState(true);
  const [breathCycle, setBreathCycle] = useState('4-4-4'); // '4-4-4' (Calm) | '4-7-8' (Anxiety) | '2-2-4' (Focus)

  // Load preferences on mount
  useEffect(() => {
    const loadPreferences = async () => {
      try {
        const mr = await AsyncStorage.getItem('PREF_MOOD_REMINDER');
        const jr = await AsyncStorage.getItem('PREF_JOURNAL_REMINDER');
        const vf = await AsyncStorage.getItem('PREF_VOICE_FEEDBACK');
        const bc = await AsyncStorage.getItem('PREF_BREATH_CYCLE');

        if (mr !== null) setMoodReminder(mr === 'true');
        if (jr !== null) setJournalReminder(jr === 'true');
        if (vf !== null) setVoiceFeedback(vf === 'true');
        if (bc !== null) setBreathCycle(bc);
      } catch (e) {
        console.error('Failed to load wellness preferences:', e);
      }
    };
    loadPreferences();
  }, []);

  const toggleMoodReminder = async () => {
    const newValue = !moodReminder;
    setMoodReminder(newValue);
    await AsyncStorage.setItem('PREF_MOOD_REMINDER', String(newValue));
  };

  const toggleJournalReminder = async () => {
    const newValue = !journalReminder;
    setJournalReminder(newValue);
    await AsyncStorage.setItem('PREF_JOURNAL_REMINDER', String(newValue));
  };

  const toggleVoiceFeedback = async () => {
    const newValue = !voiceFeedback;
    setVoiceFeedback(newValue);
    await AsyncStorage.setItem('PREF_VOICE_FEEDBACK', String(newValue));
  };

  const selectBreathCycle = async (cycle) => {
    setBreathCycle(cycle);
    await AsyncStorage.setItem('PREF_BREATH_CYCLE', cycle);
  };

  // Local helper for bilingual settings labels
  const t = (key) => {
    const ml = language === 'ml';
    const dict = {
      remindersHeader: ml ? 'പ്രതിദിന ഓർമ്മപ്പെടുത്തലുകൾ' : 'Daily Reminders',
      moodReminderLabel: ml ? 'വികാരങ്ങൾ രേഖപ്പെടുത്താനുള്ള ഓർമ്മപ്പെടുത്തൽ' : 'Daily Mood Tracker Alerts',
      journalReminderLabel: ml ? 'ഡയറി എഴുതാനുള്ള ഓർമ്മപ്പെടുത്തൽ' : 'Daily Journaling Alerts',
      voiceHeader: ml ? 'ശബ്ദ ക്രമീകരണങ്ങൾ' : 'Voice & Sound Guidance',
      voiceFeedbackLabel: ml ? 'AI കൂട്ടുകാരന്റെ ശബ്ദ മറുപടി' : 'AI Companion Voice Feedback',
      breathHeader: ml ? 'ശ്വാസക്രിയ ക്രമീകരണങ്ങൾ' : 'Breathing Session Intervals',
      deepRelax: ml ? 'ആഴത്തിലുള്ള ആശ്വാസം' : 'Deep Calm (4s-4s-4s)',
      anxietyRelief: ml ? 'തടസ്സങ്ങൾ മാറ്റുക' : 'Anxiety Relief (4s-7s-8s)',
      energetic: ml ? 'ഊർജ്ജസ്വലത' : 'Focus Release (2s-2s-4s)',
      appSettings: ml ? 'ആപ്പ് ക്രമീകരണങ്ങൾ' : 'Wellness & App Settings',
    };
    return dict[key] || key;
  };

  return (
    <View style={styles.container}>
      <Header title={translate('settings', language)} showBackButton />

      <ScrollView contentContainerStyle={styles.scrollContainer} showsVerticalScrollIndicator={false}>
        {/* Language Selection Card */}
        <Card style={styles.sectionCard}>
          <Text style={styles.sectionHeader}>🌐 {translate('languageSetting', language)}</Text>
          
          <View style={styles.languagesContainer}>
            {Object.keys(LANGUAGES).map((langCode) => {
              const isActive = language === langCode;
              return (
                <TouchableOpacity
                  key={langCode}
                  onPress={() => setLanguage(langCode)}
                  style={[
                    styles.optionRow,
                    isActive && styles.optionRowActive,
                  ]}
                  activeOpacity={0.7}
                >
                  <Text
                    style={[
                      styles.optionText,
                      isActive && styles.optionTextActive,
                    ]}
                  >
                    {LANGUAGES[langCode]}
                  </Text>
                  {isActive && <Text style={styles.checkmarkActive}>✓</Text>}
                </TouchableOpacity>
              );
            })}
          </View>
        </Card>

        {/* Daily Notification Reminders Card */}
        <Card style={styles.sectionCard}>
          <Text style={styles.sectionHeader}>🔔 {t('remindersHeader')}</Text>
          
          <TouchableOpacity 
            style={styles.optionRow} 
            onPress={toggleMoodReminder}
            activeOpacity={0.7}
          >
            <Text style={styles.optionText}>{t('moodReminderLabel')}</Text>
            <View style={[styles.toggleCheckbox, moodReminder && styles.toggleCheckboxActive]}>
              {moodReminder && <Text style={styles.checkmarkCheck}>✓</Text>}
            </View>
          </TouchableOpacity>

          <TouchableOpacity 
            style={styles.optionRow} 
            onPress={toggleJournalReminder}
            activeOpacity={0.7}
          >
            <Text style={styles.optionText}>{t('journalReminderLabel')}</Text>
            <View style={[styles.toggleCheckbox, journalReminder && styles.toggleCheckboxActive]}>
              {journalReminder && <Text style={styles.checkmarkCheck}>✓</Text>}
            </View>
          </TouchableOpacity>
        </Card>

        {/* Audio & Sound Guidance Settings */}
        <Card style={styles.sectionCard}>
          <Text style={styles.sectionHeader}>🔊 {t('voiceHeader')}</Text>
          
          <TouchableOpacity 
            style={styles.optionRow} 
            onPress={toggleVoiceFeedback}
            activeOpacity={0.7}
          >
            <Text style={styles.optionText}>{t('voiceFeedbackLabel')}</Text>
            <View style={[styles.toggleCheckbox, voiceFeedback && styles.toggleCheckboxActive]}>
              {voiceFeedback && <Text style={styles.checkmarkCheck}>✓</Text>}
            </View>
          </TouchableOpacity>
        </Card>

        {/* Custom Guided Breathing Cycle Configurations */}
        <Card style={styles.sectionCard}>
          <Text style={styles.sectionHeader}>🧘‍♀️ {t('breathHeader')}</Text>
          
          <TouchableOpacity 
            style={[styles.breathCycleRow, breathCycle === '4-4-4' && styles.breathCycleActive]}
            onPress={() => selectBreathCycle('4-4-4')}
            activeOpacity={0.7}
          >
            <View style={styles.breathCycleInfo}>
              <Text style={[styles.breathCycleTitle, breathCycle === '4-4-4' && styles.breathCycleTitleActive]}>
                {t('deepRelax')}
              </Text>
              <Text style={styles.breathCycleDesc}>Inhale 4s • Hold 4s • Exhale 4s</Text>
            </View>
            {breathCycle === '4-4-4' && <Text style={styles.checkmarkActive}>✓</Text>}
          </TouchableOpacity>

          <TouchableOpacity 
            style={[styles.breathCycleRow, breathCycle === '4-7-8' && styles.breathCycleActive]}
            onPress={() => selectBreathCycle('4-7-8')}
            activeOpacity={0.7}
          >
            <View style={styles.breathCycleInfo}>
              <Text style={[styles.breathCycleTitle, breathCycle === '4-7-8' && styles.breathCycleTitleActive]}>
                {t('anxietyRelief')}
              </Text>
              <Text style={styles.breathCycleDesc}>Inhale 4s • Hold 7s • Exhale 8s</Text>
            </View>
            {breathCycle === '4-7-8' && <Text style={styles.checkmarkActive}>✓</Text>}
          </TouchableOpacity>

          <TouchableOpacity 
            style={[styles.breathCycleRow, breathCycle === '2-2-4' && styles.breathCycleActive]}
            onPress={() => selectBreathCycle('2-2-4')}
            activeOpacity={0.7}
          >
            <View style={styles.breathCycleInfo}>
              <Text style={[styles.breathCycleTitle, breathCycle === '2-2-4' && styles.breathCycleTitleActive]}>
                {t('energetic')}
              </Text>
              <Text style={styles.breathCycleDesc}>Inhale 2s • Hold 2s • Exhale 4s</Text>
            </View>
            {breathCycle === '2-2-4' && <Text style={styles.checkmarkActive}>✓</Text>}
          </TouchableOpacity>
        </Card>

        <Text style={styles.appVersion}>{translate('appInfo', language)}</Text>
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
    paddingBottom: THEME.sizes.xl + 20,
  },
  sectionCard: {
    marginBottom: THEME.sizes.md,
    padding: THEME.sizes.md + 4,
    borderRadius: 24,
    borderWidth: 1,
    borderColor: 'rgba(0, 0, 0, 0.05)',
    backgroundColor: THEME.colors.cardBackgroundSolid,
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
  sectionHeader: {
    fontSize: 15,
    fontWeight: '800',
    color: THEME.colors.textPrimary,
    marginBottom: THEME.sizes.md,
    letterSpacing: 0.3,
  },
  languagesContainer: {
    width: '100%',
  },
  optionRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: THEME.sizes.md - 2,
    paddingHorizontal: THEME.sizes.md,
    backgroundColor: 'rgba(0, 0, 0, 0.01)',
    borderWidth: 1,
    borderColor: 'rgba(0, 0, 0, 0.04)',
    borderRadius: 16,
    marginBottom: THEME.sizes.sm,
  },
  optionRowActive: {
    borderColor: '#FF8A3D',
    backgroundColor: 'rgba(255, 138, 61, 0.05)',
  },
  optionText: {
    fontSize: 14,
    color: THEME.colors.textSecondary,
    fontWeight: '600',
  },
  optionTextActive: {
    color: '#FF8A3D',
    fontWeight: '800',
  },
  checkmarkActive: {
    fontSize: 15,
    color: '#FF8A3D',
    fontWeight: '800',
  },
  toggleCheckbox: {
    width: 22,
    height: 22,
    borderRadius: 7,
    borderWidth: 1.5,
    borderColor: 'rgba(0, 0, 0, 0.15)',
    backgroundColor: '#FFFFFF',
    justifyContent: 'center',
    alignItems: 'center',
  },
  toggleCheckboxActive: {
    borderColor: '#FF8A3D',
    backgroundColor: '#FF8A3D',
  },
  checkmarkCheck: {
    fontSize: 12,
    color: '#FFFFFF',
    fontWeight: '900',
  },
  breathCycleRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: THEME.sizes.md - 2,
    paddingHorizontal: THEME.sizes.md,
    backgroundColor: 'rgba(0, 0, 0, 0.01)',
    borderWidth: 1,
    borderColor: 'rgba(0, 0, 0, 0.04)',
    borderRadius: 16,
    marginBottom: THEME.sizes.sm,
  },
  breathCycleActive: {
    borderColor: '#FF8A3D',
    backgroundColor: 'rgba(255, 138, 61, 0.05)',
  },
  breathCycleInfo: {
    flex: 1,
  },
  breathCycleTitle: {
    fontSize: 14,
    fontWeight: '700',
    color: THEME.colors.textPrimary,
  },
  breathCycleTitleActive: {
    color: '#FF8A3D',
    fontWeight: '800',
  },
  breathCycleDesc: {
    fontSize: 11,
    color: THEME.colors.textSecondary,
    marginTop: 2,
    fontWeight: '500',
  },
  appVersion: {
    fontSize: 11,
    color: THEME.colors.textMuted,
    textAlign: 'center',
    marginTop: THEME.sizes.lg,
    fontWeight: '600',
  },
});

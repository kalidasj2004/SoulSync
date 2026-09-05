/**
 * components/DailyJournalModal.js
 *
 * Mandatory daily journal check-in modal.
 * Shown once per day when the user opens the app and has not written
 * the previous day's journal entry.
 *
 * Props:
 *   visible   {boolean}  - Whether to show the modal
 *   dateInfo  {object}   - From getPreviousDay() — dateString, label, etc.
 *   onSubmit  {function} - Called with { title, content, moodTag } when user submits
 *   submitting {boolean} - Shows a loading state on the submit button
 */

import React, { useState } from 'react';
import {
  View, Text, TextInput, TouchableOpacity,
  Modal, StyleSheet, ScrollView, Platform,
  KeyboardAvoidingView, ActivityIndicator,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { THEME } from '../utils/theme';
import { MOODS } from '../utils/helpers';

const MOOD_LIST = ['happy', 'neutral', 'sad', 'stressed', 'angry'];

export default function DailyJournalModal({ visible, dateInfo, onSubmit, submitting = false }) {
  const [title, setTitle] = useState('');
  const [content, setContent] = useState('');
  const [mood, setMood] = useState('neutral');
  const [errors, setErrors] = useState({});

  const validate = () => {
    const e = {};
    if (!title.trim())   e.title   = 'Please write a title.';
    if (!content.trim()) e.content = 'Please share something about yesterday.';
    setErrors(e);
    return Object.keys(e).length === 0;
  };

  const handleSubmit = () => {
    if (!validate()) return;
    onSubmit({ title: title.trim(), content: content.trim(), moodTag: mood });
  };

  return (
    <Modal
      visible={visible}
      animationType="slide"
      presentationStyle="fullScreen"
      statusBarTranslucent
      onRequestClose={() => {}} // user cannot dismiss by back button
    >
      <KeyboardAvoidingView
        style={{ flex: 1 }}
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      >
        <LinearGradient
          colors={['#F3F0FF', '#EEF2FF', '#FFF7ED']}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
          style={styles.screen}
        >
          <ScrollView
            contentContainerStyle={styles.scrollContent}
            keyboardShouldPersistTaps="handled"
            showsVerticalScrollIndicator={false}
          >
            {/* Header illustration */}
            <View style={styles.topSection}>
              <Text style={styles.illustration}>📓</Text>
              <Text style={styles.greeting}>Good to see you!</Text>
              <Text style={styles.heading}>
                Before we continue, take a moment to reflect on yesterday.
              </Text>
              <View style={styles.datePill}>
                <Text style={styles.datePillText}>📅 {dateInfo?.label ?? 'Yesterday'}</Text>
              </View>
              <Text style={styles.subheading}>How was your day?</Text>
            </View>

            {/* Form */}
            <View style={styles.formCard}>
              {/* Title */}
              <Text style={styles.label}>Give it a title</Text>
              <TextInput
                style={[styles.input, errors.title && styles.inputError]}
                placeholder="e.g. A calm evening, A tough Monday..."
                placeholderTextColor="#B0B8C1"
                value={title}
                onChangeText={t => { setTitle(t); setErrors(e => ({ ...e, title: null })); }}
                maxLength={80}
              />
              {errors.title ? <Text style={styles.errorText}>{errors.title}</Text> : null}

              {/* Content */}
              <Text style={styles.label}>Share your thoughts</Text>
              <TextInput
                style={[styles.textArea, errors.content && styles.inputError]}
                placeholder="Write about what happened, how you felt, anything on your mind..."
                placeholderTextColor="#B0B8C1"
                value={content}
                onChangeText={t => { setContent(t); setErrors(e => ({ ...e, content: null })); }}
                multiline
                numberOfLines={6}
                textAlignVertical="top"
              />
              {errors.content ? <Text style={styles.errorText}>{errors.content}</Text> : null}

              {/* Mood picker */}
              <Text style={styles.label}>How were you feeling?</Text>
              <View style={styles.moodRow}>
                {MOOD_LIST.map(key => {
                  const m = MOODS[key];
                  const selected = mood === key;
                  return (
                    <TouchableOpacity
                      key={key}
                      style={[
                        styles.moodBtn,
                        selected && { borderColor: m.color, backgroundColor: m.color + '18' },
                      ]}
                      onPress={() => setMood(key)}
                      activeOpacity={0.75}
                    >
                      <Text style={styles.moodEmoji}>{m.emoji}</Text>
                      <Text style={[styles.moodLabel, selected && { color: m.color, fontWeight: '700' }]}>
                        {key.charAt(0).toUpperCase() + key.slice(1)}
                      </Text>
                    </TouchableOpacity>
                  );
                })}
              </View>

              {/* Submit */}
              <TouchableOpacity
                style={styles.submitBtn}
                onPress={handleSubmit}
                disabled={submitting}
                activeOpacity={0.85}
              >
                <LinearGradient
                  colors={['#FF8A3D', '#FFD54A']}
                  start={{ x: 0, y: 0 }}
                  end={{ x: 1, y: 0 }}
                  style={styles.submitGrad}
                >
                  {submitting ? (
                    <ActivityIndicator color="#fff" size="small" />
                  ) : (
                    <Text style={styles.submitText}>Submit Journal ✓</Text>
                  )}
                </LinearGradient>
              </TouchableOpacity>

              <Text style={styles.footerNote}>
                This is private to you. SoulSync uses this to personalise your wellness experience.
              </Text>
            </View>
          </ScrollView>
        </LinearGradient>
      </KeyboardAvoidingView>
    </Modal>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1 },
  scrollContent: {
    padding: 20,
    paddingBottom: 40,
    flexGrow: 1,
  },
  topSection: {
    alignItems: 'center',
    paddingTop: Platform.OS === 'ios' ? 60 : 48,
    paddingBottom: 24,
  },
  illustration: {
    fontSize: 56,
    marginBottom: 12,
  },
  greeting: {
    fontSize: 15,
    color: THEME.colors.textSecondary,
    fontWeight: '600',
    marginBottom: 6,
  },
  heading: {
    fontSize: 20,
    fontWeight: '800',
    color: THEME.colors.textPrimary,
    textAlign: 'center',
    lineHeight: 28,
    paddingHorizontal: 16,
    marginBottom: 14,
  },
  datePill: {
    backgroundColor: 'rgba(255,138,61,0.12)',
    borderRadius: 20,
    paddingHorizontal: 14,
    paddingVertical: 6,
    borderWidth: 1,
    borderColor: 'rgba(255,138,61,0.25)',
    marginBottom: 10,
  },
  datePillText: {
    color: THEME.colors.primary,
    fontWeight: '700',
    fontSize: 13,
  },
  subheading: {
    fontSize: 15,
    color: THEME.colors.textSecondary,
    textAlign: 'center',
  },

  // Form card
  formCard: {
    backgroundColor: 'rgba(255,255,255,0.88)',
    borderRadius: 24,
    padding: 20,
    borderWidth: 1,
    borderColor: 'rgba(0,0,0,0.06)',
    shadowColor: '#FF8A3D',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.08,
    shadowRadius: 16,
    elevation: 4,
  },
  label: {
    fontSize: 13,
    fontWeight: '700',
    color: THEME.colors.textSecondary,
    marginBottom: 6,
    marginTop: 14,
    textTransform: 'uppercase',
    letterSpacing: 0.4,
  },
  input: {
    borderWidth: 1.5,
    borderColor: '#E5E7EB',
    borderRadius: 12,
    padding: 13,
    fontSize: 15,
    color: THEME.colors.textPrimary,
    backgroundColor: '#F9FAFB',
  },
  textArea: {
    borderWidth: 1.5,
    borderColor: '#E5E7EB',
    borderRadius: 12,
    padding: 13,
    fontSize: 15,
    color: THEME.colors.textPrimary,
    backgroundColor: '#F9FAFB',
    minHeight: 140,
  },
  inputError: {
    borderColor: '#EF4444',
  },
  errorText: {
    color: '#EF4444',
    fontSize: 12,
    marginTop: 4,
    marginLeft: 4,
  },

  // Mood picker
  moodRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    marginTop: 4,
  },
  moodBtn: {
    alignItems: 'center',
    paddingVertical: 8,
    paddingHorizontal: 10,
    borderRadius: 12,
    borderWidth: 1.5,
    borderColor: '#E5E7EB',
    backgroundColor: '#F9FAFB',
    minWidth: 58,
  },
  moodEmoji: { fontSize: 22 },
  moodLabel: {
    fontSize: 10,
    color: THEME.colors.textSecondary,
    marginTop: 3,
    fontWeight: '500',
  },

  // Submit
  submitBtn: {
    borderRadius: 16,
    overflow: 'hidden',
    marginTop: 24,
    marginBottom: 10,
  },
  submitGrad: {
    paddingVertical: 16,
    alignItems: 'center',
    borderRadius: 16,
  },
  submitText: {
    color: '#fff',
    fontWeight: '800',
    fontSize: 16,
    letterSpacing: 0.3,
  },
  footerNote: {
    fontSize: 11,
    color: THEME.colors.textMuted,
    textAlign: 'center',
    lineHeight: 16,
    paddingHorizontal: 8,
  },
});

import React, { useState, useEffect, useContext } from 'react';
import { StyleSheet, Text, View, ScrollView, Alert, RefreshControl, TouchableOpacity, Platform } from 'react-native';
import { getSupabase } from '../../services/supabase';
import { AppContext } from '../../AppContext';
import { THEME } from '../../utils/theme';
import { translate } from '../../services/translations';
import { MOODS, formatDate } from '../../utils/helpers';

// Components
import Header from '../../components/Header';
import Input from '../../components/Input';
import Button from '../../components/Button';
import Card from '../../components/Card';
import MoodSelector from '../../components/MoodSelector';

export default function JournalScreen() {
  const { language, fetchProfile } = useContext(AppContext);
  const supabase = getSupabase();

  const [entries, setEntries] = useState([]);
  const [refreshing, setRefreshing] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [editingId, setEditingId] = useState(null);

  // Form Fields
  const [title, setTitle] = useState('');
  const [content, setContent] = useState('');
  const [moodTag, setMoodTag] = useState('neutral');
  const [saving, setSaving] = useState(false);

  const fetchJournalEntries = async () => {
    if (!supabase) return;
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const { data, error } = await supabase
        .from('journal_entries')
        .select('*')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false });

      if (error) throw error;
      setEntries(data || []);
    } catch (e) {
      console.log('Error fetching journals:', e.message);
    }
  };

  useEffect(() => {
    fetchJournalEntries();
  }, []);

  const handleSaveEntry = async () => {
    if (!supabase) {
      Alert.alert('Configuration Required', 'Please configure your Supabase connection first.');
      return;
    }

    if (!title.trim() || !content.trim()) {
      Alert.alert('Error', 'Please fill in the title and content.');
      return;
    }

    setSaving(true);
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('User not found');

      const entryPayload = {
        user_id: user.id,
        title: title.trim(),
        content: content.trim(),
        mood_tag: moodTag,
        updated_at: new Date().toISOString(),
      };

      if (isEditing && editingId) {
        // Update
        const { error } = await supabase
          .from('journal_entries')
          .update(entryPayload)
          .eq('id', editingId);

        if (error) throw error;
        Alert.alert('Success', translate('journalUpdated', language));
      } else {
        // Create
        const { error } = await supabase
          .from('journal_entries')
          .insert(entryPayload);

        if (error) throw error;
        Alert.alert('Success', translate('journalAdded', language));
      }

      resetForm();
      fetchJournalEntries();
      fetchProfile(); // Updates journal count in global context for Profile Screen
    } catch (e) {
      Alert.alert('Error', 'Failed to save entry: ' + e.message);
    } finally {
      setSaving(false);
    }
  };

  const handleEditInit = (entry) => {
    setTitle(entry.title);
    setContent(entry.content);
    setMoodTag(entry.mood_tag || 'neutral');
    setEditingId(entry.id);
    setIsEditing(true);
  };

  const handleDeleteEntry = async (id) => {
    const executeDelete = async () => {
      try {
        const { error } = await supabase
          .from('journal_entries')
          .delete()
          .eq('id', id);

        if (error) throw error;
        Alert.alert('Deleted', translate('journalDeleted', language));
        fetchJournalEntries();
        fetchProfile(); // Update count
      } catch (e) {
        Alert.alert('Error', 'Failed to delete: ' + e.message);
      }
    };

    Alert.alert(
        translate('deleteJournal', language),
        translate('deleteConfirm', language),
        [
          { text: 'Cancel', style: 'cancel' },
          {
            text: 'Delete',
            style: 'destructive',
            onPress: executeDelete,
          },
        ]
      );
  };

  const resetForm = () => {
    setTitle('');
    setContent('');
    setMoodTag('neutral');
    setEditingId(null);
    setIsEditing(false);
  };

  const onRefresh = async () => {
    setRefreshing(true);
    await fetchJournalEntries();
    setRefreshing(false);
  };

  return (
    <View style={styles.container}>
      <Header 
        title={translate('journal', language)} 
        showBackButton
        rightComponent={
          <TouchableOpacity 
            onPress={() => isEditing ? resetForm() : setIsEditing(true)}
            style={styles.headerActionBtn}
          >
            <Text style={styles.headerActionText}>
              {isEditing ? '✕ Cancel' : '＋ Write'}
            </Text>
          </TouchableOpacity>
        }
      />

      <ScrollView
        contentContainerStyle={styles.scrollContainer}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={THEME.colors.primary} />
        }
      >
        {isEditing ? (
          // Editor Section
          <Card style={styles.editorCard}>
            <Text style={styles.sectionHeader}>
              {editingId ? translate('editJournal', language) : 'Write New Entry'}
            </Text>

            <Input
              label={translate('journalTitle', language)}
              placeholder="Give your entry a title..."
              value={title}
              onChangeText={setTitle}
            />

            <Text style={styles.fieldLabel}>{translate('journalMoodTag', language)}</Text>
            <MoodSelector
              selectedMood={moodTag}
              onSelectMood={setMoodTag}
              language={language}
            />

            <Input
              label="Thoughts"
              placeholder={translate('journalContent', language)}
              value={content}
              onChangeText={setContent}
              multiline
              numberOfLines={8}
            />

            <View style={styles.editorButtonsRow}>
              <Button
                title={translate('saveJournal', language)}
                onPress={handleSaveEntry}
                loading={saving}
                style={styles.saveBtn}
              />
              <Button
                title="Discard"
                onPress={resetForm}
                variant="secondary"
                style={styles.discardBtn}
              />
            </View>
          </Card>
        ) : (
          // List View
          <View>
            <Text style={styles.listHeader}>{translate('chronological', language)}</Text>
            {entries.length === 0 ? (
              <Card style={styles.emptyCard} onPress={() => setIsEditing(true)}>
                <Text style={styles.emptyEmoji}>✍️</Text>
                <Text style={styles.emptyText}>{translate('noJournals', language)}</Text>
                <Text style={styles.emptySubText}>Tap here to pen down your first thought.</Text>
              </Card>
            ) : (
              entries.map((item) => {
                const moodConfig = item.mood_tag ? MOODS[item.mood_tag] : null;

                return (
                  <Card key={item.id} style={styles.entryCard}>
                    <View style={styles.entryHeader}>
                      <View style={styles.entryTitleContainer}>
                        <Text style={styles.entryTitle}>{item.title}</Text>
                        {moodConfig && (
                          <View style={[styles.moodTag, { backgroundColor: moodConfig.color + '20' }]}>
                            <Text style={[styles.moodTagText, { color: moodConfig.color }]}>
                              {moodConfig.emoji} {translate(item.mood_tag, language)}
                            </Text>
                          </View>
                        )}
                      </View>
                      <Text style={styles.entryDate}>{formatDate(item.created_at, language)}</Text>
                    </View>
                    
                    <Text style={styles.entryContent} numberOfLines={4}>
                      {item.content}
                    </Text>

                    <View style={styles.cardActionsRow}>
                      <TouchableOpacity 
                        onPress={() => handleEditInit(item)}
                        style={styles.actionLink}
                      >
                        <Text style={styles.editActionText}>✏️ Edit</Text>
                      </TouchableOpacity>
                      
                      <TouchableOpacity 
                        onPress={() => handleDeleteEntry(item.id)}
                        style={styles.actionLink}
                      >
                        <Text style={styles.deleteActionText}>🗑️ Delete</Text>
                      </TouchableOpacity>
                    </View>
                  </Card>
                );
              })
            )}
          </View>
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
  headerActionBtn: {
    paddingVertical: 6,
    paddingHorizontal: 12,
    borderRadius: 8,
    backgroundColor: 'rgba(139, 92, 246, 0.15)',
    borderWidth: 1,
    borderColor: THEME.colors.primary + '30',
  },
  headerActionText: {
    color: THEME.colors.primary,
    fontSize: 13,
    fontWeight: 'bold',
  },
  editorCard: {
    padding: THEME.sizes.md,
  },
  sectionHeader: {
    fontSize: 18,
    fontWeight: 'bold',
    color: THEME.colors.textPrimary,
    marginBottom: THEME.sizes.md,
    textAlign: 'center',
  },
  fieldLabel: {
    fontSize: 14,
    color: THEME.colors.textSecondary,
    marginBottom: THEME.sizes.xs,
  },
  editorButtonsRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: THEME.sizes.md,
  },
  saveBtn: {
    flex: 2,
    marginRight: THEME.sizes.sm,
  },
  discardBtn: {
    flex: 1,
  },
  listHeader: {
    fontSize: 14,
    fontWeight: 'bold',
    color: THEME.colors.textPrimary,
    marginBottom: THEME.sizes.md,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  entryCard: {
    marginBottom: THEME.sizes.md,
    padding: THEME.sizes.md,
  },
  entryHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: THEME.sizes.sm,
  },
  entryTitleContainer: {
    flex: 1,
    marginRight: THEME.sizes.sm,
  },
  entryTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: THEME.colors.textPrimary,
  },
  moodTag: {
    alignSelf: 'flex-start',
    paddingVertical: 2,
    paddingHorizontal: 6,
    borderRadius: 6,
    marginTop: 4,
  },
  moodTagText: {
    fontSize: 10,
    fontWeight: 'bold',
  },
  entryDate: {
    fontSize: 11,
    color: THEME.colors.textMuted,
  },
  entryContent: {
    fontSize: 14,
    color: THEME.colors.textSecondary,
    lineHeight: 20,
    marginBottom: THEME.sizes.md,
  },
  cardActionsRow: {
    flexDirection: 'row',
    borderTopWidth: 1,
    borderTopColor: THEME.colors.border,
    paddingTop: THEME.sizes.sm,
    justifyContent: 'flex-end',
  },
  actionLink: {
    marginLeft: THEME.sizes.md,
  },
  editActionText: {
    color: THEME.colors.accent,
    fontSize: 13,
  },
  deleteActionText: {
    color: THEME.colors.danger,
    fontSize: 13,
  },
  emptyCard: {
    padding: THEME.sizes.xl,
    alignItems: 'center',
    justifyContent: 'center',
  },
  emptyEmoji: {
    fontSize: 40,
    marginBottom: THEME.sizes.sm,
  },
  emptyText: {
    color: THEME.colors.textPrimary,
    fontSize: 16,
    fontWeight: 'bold',
    marginBottom: 4,
  },
  emptySubText: {
    color: THEME.colors.textSecondary,
    fontSize: 12,
    textAlign: 'center',
  },
});

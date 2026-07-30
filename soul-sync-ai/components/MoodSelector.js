import React from 'react';
import { StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { MOODS } from '../utils/helpers';
import { THEME } from '../utils/theme';
import { translate } from '../services/translations';

export default function MoodSelector({
  selectedMood,
  onSelectMood,
  language = 'en',
  containerStyle,
}) {
  const moodList = Object.keys(MOODS);

  return (
    <View style={[styles.container, containerStyle]}>
      {moodList.map((moodKey) => {
        const moodItem = MOODS[moodKey];
        const isSelected = selectedMood === moodKey;

        return (
          <TouchableOpacity
            key={moodKey}
            onPress={() => onSelectMood(moodKey)}
            style={[
              styles.moodButton,
              isSelected && {
                borderColor: moodItem.color,
                backgroundColor: `${moodItem.color}15`, // Translucent background color
                shadowColor: moodItem.color,
                shadowOpacity: 0.3,
                shadowRadius: 10,
                elevation: 4,
              },
            ]}
            activeOpacity={0.7}
          >
            <Text style={[styles.emoji, isSelected && styles.selectedEmoji]}>
              {moodItem.emoji}
            </Text>
            <Text
              style={[
                styles.label,
                { color: isSelected ? moodItem.color : THEME.colors.textSecondary },
                isSelected && { fontWeight: 'bold' },
              ]}
            >
              {translate(moodKey, language)}
            </Text>
          </TouchableOpacity>
        );
      })}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    width: '100%',
    marginVertical: THEME.sizes.md,
  },
  moodButton: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: THEME.sizes.md,
    marginHorizontal: 4,
    borderRadius: THEME.sizes.radiusMd,
    borderWidth: 1.5,
    borderColor: 'transparent',
    backgroundColor: 'rgba(255, 255, 255, 0.03)',
  },
  emoji: {
    fontSize: 28,
    marginBottom: THEME.sizes.xs,
  },
  selectedEmoji: {
    transform: [{ scale: 1.25 }],
  },
  label: {
    fontSize: 11,
    textAlign: 'center',
  },
});

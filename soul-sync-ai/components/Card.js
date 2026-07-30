import React from 'react';
import { StyleSheet, TouchableOpacity, View } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { THEME } from '../utils/theme';

export default function Card({
  children,
  onPress,
  style,
  gradientColors,
  activeOpacity = 0.8,
  ...props
}) {
  const CardContainer = onPress ? TouchableOpacity : View;
  const containerProps = onPress ? { onPress, activeOpacity, ...props } : props;

  const cardStyle = [THEME.glassStyle, style];

  if (gradientColors) {
    return (
      <CardContainer {...containerProps} style={[styles.wrapper, style]}>
        <LinearGradient
          colors={gradientColors}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
          style={styles.gradient}
        >
          <View style={styles.inner}>{children}</View>
        </LinearGradient>
      </CardContainer>
    );
  }

  return (
    <CardContainer {...containerProps} style={cardStyle}>
      <View style={styles.inner}>{children}</View>
    </CardContainer>
  );
}

const styles = StyleSheet.create({
  wrapper: {
    borderRadius: THEME.sizes.radiusMd,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.08)',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.3,
    shadowRadius: 16,
    elevation: 8,
  },
  gradient: {
    width: '100%',
  },
  inner: {
    padding: THEME.sizes.md,
  },
});

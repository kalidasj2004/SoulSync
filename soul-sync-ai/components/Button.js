import React from 'react';
import { StyleSheet, Text, TouchableOpacity, ActivityIndicator, View } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { THEME } from '../utils/theme';

export default function Button({
  title,
  onPress,
  variant = 'primary', // 'primary', 'secondary', 'accent', 'outline', 'danger', 'ghost'
  size = 'medium', // 'small', 'medium', 'large'
  loading = false,
  disabled = false,
  style,
  textStyle,
  icon,
}) {
  const isOutline = variant === 'outline';
  const isGhost = variant === 'ghost';
  const isDisabled = disabled || loading;

  // Determine colors and gradients
  let colors = THEME.colors.primaryGradient;
  let borderStyle = {};
  let textCol = THEME.colors.textOnPrimary;

  if (variant === 'secondary') {
    colors = [THEME.colors.cardBackgroundSolid, THEME.colors.cardBackgroundSolid];
    borderStyle = { borderWidth: 1, borderColor: THEME.colors.border };
    textCol = THEME.colors.textPrimary;
  } else if (variant === 'accent') {
    colors = THEME.colors.accentGradient;
  } else if (variant === 'outline') {
    colors = ['transparent', 'transparent'];
    borderStyle = { borderWidth: 1.5, borderColor: THEME.colors.primary };
    textCol = THEME.colors.primary;
  } else if (variant === 'danger') {
    colors = [THEME.colors.danger, '#C53030'];
  } else if (variant === 'ghost') {
    colors = ['transparent', 'transparent'];
    textCol = THEME.colors.textSecondary;
  }

  // Padding based on size
  let paddingVertical = 12;
  let paddingHorizontal = 24;
  let fontSize = 16;
  let borderRadius = THEME.sizes.radiusMd;

  if (size === 'small') {
    paddingVertical = 8;
    paddingHorizontal = 16;
    fontSize = 14;
    borderRadius = THEME.sizes.radiusSm;
  } else if (size === 'large') {
    paddingVertical = 16;
    paddingHorizontal = 32;
    fontSize = 18;
  }

  const buttonContent = (
    <View style={[styles.innerContainer, { paddingVertical, paddingHorizontal }]}>
      {loading ? (
        <ActivityIndicator size="small" color={textCol} />
      ) : (
        <View style={styles.row}>
          {icon && <View style={styles.iconContainer}>{icon}</View>}
          <Text style={[styles.text, { color: textCol, fontSize, fontFamily: THEME.fonts.bold }, textStyle]}>
            {title}
          </Text>
        </View>
      )}
    </View>
  );

  return (
    <TouchableOpacity
      onPress={onPress}
      disabled={isDisabled}
      activeOpacity={0.8}
      style={[
        styles.button,
        borderStyle,
        isDisabled && styles.disabled,
        { borderRadius },
        style,
      ]}
    >
      {isOutline || isGhost ? (
        buttonContent
      ) : (
        <LinearGradient
          colors={colors}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 0 }}
          style={[styles.gradient, { borderRadius: borderRadius - 1 }]}
        >
          {buttonContent}
        </LinearGradient>
      )}
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  button: {
    overflow: 'hidden',
    justifyContent: 'center',
    alignItems: 'center',
  },
  gradient: {
    width: '100%',
    height: '100%',
  },
  innerContainer: {
    width: '100%',
    justifyContent: 'center',
    alignItems: 'center',
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
  },
  iconContainer: {
    marginRight: 8,
  },
  text: {
    textAlign: 'center',
  },
  disabled: {
    opacity: 0.5,
  },
});

import React, { useState } from 'react';
import { StyleSheet, Text, TextInput, View, TouchableOpacity } from 'react-native';
import { THEME } from '../utils/theme';

export default function Input({
  label,
  value,
  onChangeText,
  placeholder,
  secureTextEntry = false,
  error,
  keyboardType = 'default',
  autoCapitalize = 'none',
  style,
  inputStyle,
  multiline = false,
  numberOfLines = 1,
  rightIcon,
  onRightIconPress,
  ...props
}) {
  const [isFocused, setIsFocused] = useState(false);

  return (
    <View style={[styles.container, style]}>
      {label && <Text style={styles.label}>{label}</Text>}
      
      <View
        style={[
          styles.inputContainer,
          isFocused && styles.inputContainerFocused,
          error && styles.inputContainerError,
          multiline && { height: 40 * numberOfLines, alignItems: 'flex-start', paddingTop: 10 }
        ]}
      >
        <TextInput
          value={value}
          onChangeText={onChangeText}
          placeholder={placeholder}
          placeholderTextColor={THEME.colors.textMuted}
          secureTextEntry={secureTextEntry}
          keyboardType={keyboardType}
          autoCapitalize={autoCapitalize}
          multiline={multiline}
          numberOfLines={numberOfLines}
          onFocus={() => setIsFocused(true)}
          onBlur={() => setIsFocused(false)}
          style={[
            styles.input,
            { color: THEME.colors.textPrimary },
            multiline && { textAlignVertical: 'top' },
            inputStyle
          ]}
          {...props}
        />
        
        {rightIcon && (
          <TouchableOpacity onPress={onRightIconPress} style={styles.iconContainer} activeOpacity={0.7}>
            <Text style={styles.iconText}>{rightIcon}</Text>
          </TouchableOpacity>
        )}
      </View>

      {error && <Text style={styles.errorText}>{error}</Text>}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    width: '100%',
    marginBottom: THEME.sizes.md,
  },
  label: {
    fontSize: 14,
    color: THEME.colors.textSecondary,
    marginBottom: THEME.sizes.sm,
    fontFamily: THEME.fonts.medium,
  },
  inputContainer: {
    width: '100%',
    height: 52,
    backgroundColor: 'rgba(255, 255, 255, 0.04)',
    borderWidth: 1.5,
    borderColor: THEME.colors.border,
    borderRadius: THEME.sizes.radiusMd,
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: THEME.sizes.md,
  },
  inputContainerFocused: {
    borderColor: THEME.colors.primary,
    backgroundColor: 'rgba(139, 92, 246, 0.05)',
  },
  inputContainerError: {
    borderColor: THEME.colors.danger,
    backgroundColor: 'rgba(239, 68, 68, 0.05)',
  },
  input: {
    flex: 1,
    height: '100%',
    fontSize: 16,
    padding: 0,
    outlineStyle: 'none',
  },
  iconContainer: {
    paddingLeft: THEME.sizes.sm,
    justifyContent: 'center',
    alignItems: 'center',
  },
  iconText: {
    fontSize: 18,
    color: THEME.colors.textSecondary,
  },
  errorText: {
    fontSize: 12,
    color: THEME.colors.danger,
    marginTop: THEME.sizes.xs,
  },
});

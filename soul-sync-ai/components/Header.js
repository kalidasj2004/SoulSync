import React from 'react';
import { StyleSheet, Text, View, TouchableOpacity, SafeAreaView, Platform } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { THEME } from '../utils/theme';

export default function Header({
  title,
  showBackButton = false,
  leftComponent,
  rightComponent,
  style,
  titleStyle,
}) {
  const navigation = useNavigation();

  return (
    <SafeAreaView style={[styles.safeArea, style]}>
      <View style={styles.container}>
        {showBackButton ? (
          <TouchableOpacity
            style={styles.backButton}
            onPress={() => navigation.goBack()}
            activeOpacity={0.7}
          >
            <Text style={styles.backText}>←</Text>
          </TouchableOpacity>
        ) : leftComponent ? (
          <View style={styles.leftAction}>{leftComponent}</View>
        ) : (
          <View style={styles.placeholder} />
        )}

        <Text 
          style={[
            styles.title, 
            title === 'SoulSync AI' && styles.brandTitle, 
            titleStyle
          ]} 
          numberOfLines={1}
        >
          {title}
        </Text>

        {rightComponent ? (
          <View style={styles.rightAction}>{rightComponent}</View>
        ) : (
          <View style={styles.placeholder} />
        )}
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    backgroundColor: THEME.colors.background,
    borderBottomWidth: 1,
    borderBottomColor: THEME.colors.border,
    paddingTop: Platform.OS === 'android' ? 30 : 0,
  },
  container: {
    height: 56,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: THEME.sizes.md,
  },
  backButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: 'rgba(255, 255, 255, 0.05)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  backText: {
    color: THEME.colors.textPrimary,
    fontSize: 22,
    fontWeight: 'bold',
    lineHeight: 22,
  },
  title: {
    fontSize: 18,
    fontWeight: 'bold',
    color: THEME.colors.textPrimary,
    textAlign: 'center',
    flex: 1,
    marginHorizontal: THEME.sizes.sm,
  },
  brandTitle: {
    fontFamily: Platform.OS === 'web' ? 'Satisfy, cursive' : 'System',
    fontSize: Platform.OS === 'web' ? 28 : 22,
    fontWeight: 'normal',
    color: '#1E293B',
    transform: [{ scaleY: 1.05 }], // Slight stretch to mimic calligraphy
  },
  leftAction: {
    minWidth: 40,
    alignItems: 'flex-start',
    justifyContent: 'center',
  },
  rightAction: {
    minWidth: 40,
    alignItems: 'flex-end',
    justifyContent: 'center',
  },
  placeholder: {
    width: 40,
  },
});

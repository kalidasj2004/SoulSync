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

  const isBrand = title === 'SoulSync AI' || title === 'SoulSync';

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

        {isBrand ? (
          <View style={styles.brandContainer}>
            <View style={styles.brandTitleRow}>
              <Text style={styles.brandSoulText}>SOUL</Text>
              <Text style={styles.brandSyncText}>SYNC</Text>
              <View style={styles.aiBadge}>
                <Text style={styles.aiBadgeText}>AI</Text>
              </View>
            </View>
            <View style={styles.subPillContainer}>
              <View style={styles.subPillDot} />
              <Text style={styles.subPillText}>WELLNESS COMPANION</Text>
            </View>
          </View>
        ) : (
          <Text style={[styles.title, titleStyle]} numberOfLines={1}>
            {title}
          </Text>
        )}

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
    borderBottomColor: 'rgba(226, 232, 240, 0.6)',
    paddingTop: Platform.OS === 'android' ? 30 : 0,
  },
  container: {
    height: 64,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: THEME.sizes.md,
  },
  backButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: 'rgba(255, 255, 255, 0.6)',
    borderWidth: 1,
    borderColor: 'rgba(226, 232, 240, 0.8)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  backText: {
    color: '#334155',
    fontSize: 20,
    fontWeight: 'bold',
    lineHeight: 20,
  },
  title: {
    fontSize: 18,
    fontWeight: '700',
    color: '#1E293B',
    textAlign: 'center',
    flex: 1,
    marginHorizontal: THEME.sizes.sm,
  },
  brandContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  brandTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  brandSoulText: {
    fontSize: 20,
    fontWeight: '900',
    letterSpacing: 2.5,
    color: '#1E293B',
    fontFamily: Platform.OS === 'web' ? "'Plus Jakarta Sans', 'Inter', system-ui, sans-serif" : 'System',
  },
  brandSyncText: {
    fontSize: 20,
    fontWeight: '900',
    letterSpacing: 2.5,
    color: '#FF6B4A',
    fontFamily: Platform.OS === 'web' ? "'Plus Jakarta Sans', 'Inter', system-ui, sans-serif" : 'System',
  },
  aiBadge: {
    backgroundColor: 'rgba(255, 107, 74, 0.12)',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 6,
    marginLeft: 6,
    borderWidth: 1,
    borderColor: 'rgba(255, 107, 74, 0.25)',
  },
  aiBadgeText: {
    fontSize: 10,
    fontWeight: '800',
    color: '#FF6B4A',
    letterSpacing: 1,
  },
  subPillContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 2,
    backgroundColor: 'rgba(255, 255, 255, 0.7)',
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: 'rgba(226, 232, 240, 0.7)',
  },
  subPillDot: {
    width: 5,
    height: 5,
    borderRadius: 2.5,
    backgroundColor: '#10B981',
    marginRight: 4,
  },
  subPillText: {
    fontSize: 8.5,
    fontWeight: '700',
    letterSpacing: 1.2,
    color: '#64748B',
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

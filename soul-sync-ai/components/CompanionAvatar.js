import React, { useEffect, useRef } from 'react';
import { StyleSheet, View, Animated, Easing, Platform } from 'react-native';
import LottieView from 'lottie-react-native';
import companionJson from '../assets/companion.json';

export default function CompanionAvatar({ mood = 'neutral', size = 120, isListening = false }) {
  const floatAnim = useRef(new Animated.Value(0)).current;
  const lottieRef = useRef(null);

  useEffect(() => {
    Animated.loop(
      Animated.sequence([
        Animated.timing(floatAnim, {
          toValue: -7,
          duration: 1800,
          easing: Easing.inOut(Easing.quad),
          useNativeDriver: true,
        }),
        Animated.timing(floatAnim, {
          toValue: 0,
          duration: 1800,
          easing: Easing.inOut(Easing.quad),
          useNativeDriver: true,
        }),
      ])
    ).start();
  }, []);

  return (
    <View style={[styles.container, { width: size, height: size }]}>
      <Animated.View
        style={[
          styles.floatContainer,
          {
            width: size,
            height: size,
            transform: [{ translateY: floatAnim }],
          },
        ]}
      >
        {/* Yellow Glow Backdrop */}
        <View
          style={[
            styles.glowAura,
            {
              width: size * 0.9,
              height: size * 0.9,
              borderRadius: (size * 0.9) / 2,
            },
          ]}
        />

        {/* Cat Lottie Character */}
        <View style={{ width: size, height: size, justifyContent: 'center', alignItems: 'center' }}>
          <LottieView
            ref={lottieRef}
            source={companionJson}
            autoPlay
            loop
            style={{ width: '100%', height: '100%' }}
          />
        </View>
      </Animated.View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    justifyContent: 'center',
    alignItems: 'center',
  },
  floatContainer: {
    justifyContent: 'center',
    alignItems: 'center',
    position: 'relative',
  },
  glowAura: {
    position: 'absolute',
    backgroundColor: 'rgba(255, 237, 160, 0.55)',
    shadowColor: '#FFD54A',
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.6,
    shadowRadius: 18,
    elevation: 4,
  },
});

import React, { useRef, useEffect } from 'react';
import { StyleSheet, View } from 'react-native';
import LottieView from 'lottie-react-native';

export default function AnimatedCompanion({ 
  mood = 'idle',      // 'idle' | 'happy' | 'sad' | 'surprised' | 'thinking' | 'listening'
  gesture = 'idle',   // 'idle' | 'wave' | 'chest' | 'point'
  size = 180,         // Acts as the target height
  speaking = false 
}) {
  const lottieRef = useRef(null);

  useEffect(() => {
    if (lottieRef.current) {
      if (speaking) {
        lottieRef.current.play();
      } else {
        lottieRef.current.pause();
      }
    }
  }, [speaking]);

  // Adjust width based on the native Lottie canvas aspect ratio (386 / 278 ≈ 1.39)
  const lottieHeight = size;
  const lottieWidth = size * (386 / 278);

  return (
    <View style={[styles.container, { width: lottieWidth, height: lottieHeight }]}>
      <LottieView
        ref={lottieRef}
        source={require('../assets/mascot.json')}
        style={styles.lottie}
        autoPlay={speaking}
        loop
        speed={1.0}
        resizeMode="contain"
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    justifyContent: 'center',
    alignItems: 'center',
    overflow: 'hidden',
  },
  lottie: {
    width: '100%',
    height: '100%',
  },
});

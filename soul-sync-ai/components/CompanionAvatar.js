import React, { useEffect, useRef } from 'react';
import { StyleSheet, View, Animated, Easing, Text } from 'react-native';
import { MOODS } from '../utils/helpers';
import { THEME } from '../utils/theme';

export default function CompanionAvatar({ mood = 'neutral', size = 200, isListening = false }) {
  // Animation refs
  const floatAnim = useRef(new Animated.Value(0)).current;
  const pulseAnim = useRef(new Animated.Value(1)).current;
  const eyeBlinkAnim = useRef(new Animated.Value(1)).current;
  const lipSyncAnim = useRef(new Animated.Value(0)).current;

  // Active loop animation refs
  const lipSyncLoopRef = useRef(null);

  useEffect(() => {
    // 1. Idle float bobbing loop
    Animated.loop(
      Animated.sequence([
        Animated.timing(floatAnim, {
          toValue: -8,
          duration: 2000,
          easing: Easing.inOut(Easing.quad),
          useNativeDriver: true,
        }),
        Animated.timing(floatAnim, {
          toValue: 0,
          duration: 2000,
          easing: Easing.inOut(Easing.quad),
          useNativeDriver: true,
        }),
      ])
    ).start();

    // 2. Listening pulse aura
    if (isListening) {
      Animated.loop(
        Animated.sequence([
          Animated.timing(pulseAnim, {
            toValue: 1.2,
            duration: 700,
            useNativeDriver: true,
          }),
          Animated.timing(pulseAnim, {
            toValue: 1.0,
            duration: 700,
            useNativeDriver: true,
          }),
        ])
      ).start();
    } else {
      pulseAnim.setValue(1);
    }
  }, [isListening]);

  // 3. Periodic eye blink loop
  useEffect(() => {
    const blinkInterval = setInterval(() => {
      Animated.sequence([
        Animated.timing(eyeBlinkAnim, {
          toValue: 0.1,
          duration: 80,
          useNativeDriver: true,
        }),
        Animated.timing(eyeBlinkAnim, {
          toValue: 1,
          duration: 80,
          useNativeDriver: true,
        }),
      ]).start();
    }, 3500);

    return () => clearInterval(blinkInterval);
  }, []);

  // 4. Lip-sync mouth animation loop when speaking
  useEffect(() => {
    if (mood === 'speaking') {
      lipSyncLoopRef.current = Animated.loop(
        Animated.sequence([
          Animated.timing(lipSyncAnim, {
            toValue: 1.0,
            duration: 120,
            easing: Easing.inOut(Easing.sin),
            useNativeDriver: true,
          }),
          Animated.timing(lipSyncAnim, {
            toValue: 0.15,
            duration: 120,
            easing: Easing.inOut(Easing.sin),
            useNativeDriver: true,
          }),
        ])
      );
      lipSyncLoopRef.current.start();
    } else {
      if (lipSyncLoopRef.current) {
        lipSyncLoopRef.current.stop();
        lipSyncLoopRef.current = null;
      }
      Animated.timing(lipSyncAnim, {
        toValue: 0,
        duration: 150,
        useNativeDriver: true,
      }).start();
    }

    return () => {
      if (lipSyncLoopRef.current) {
        lipSyncLoopRef.current.stop();
      }
    };
  }, [mood]);

  const isSpeaking = mood === 'speaking';
  const activeColor = isSpeaking ? '#F59E0B' : (MOODS[mood]?.color || THEME.colors.primary);
  
  // Interpolations for lip-sync mouth scaling
  const mouthScaleY = lipSyncAnim.interpolate({
    inputRange: [0, 1],
    outputRange: [0.3, 2.3],
  });

  const mouthScaleX = lipSyncAnim.interpolate({
    inputRange: [0, 1],
    outputRange: [1, 1.2],
  });

  // Eyebrows angles
  let leftBrowRotate = '0deg';
  let rightBrowRotate = '0deg';
  let browTranslateY = 0;

  if (mood === 'sad') {
    leftBrowRotate = '-20deg';
    rightBrowRotate = '20deg';
    browTranslateY = -2;
  } else if (mood === 'angry') {
    leftBrowRotate = '25deg';
    rightBrowRotate = '-25deg';
    browTranslateY = 3;
  } else if (mood === 'stressed') {
    leftBrowRotate = '12deg';
    rightBrowRotate = '-12deg';
  } else if (mood === 'happy') {
    leftBrowRotate = '-5deg';
    rightBrowRotate = '5deg';
    browTranslateY = -2;
  }

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
        {/* Glow Backlight Aura */}
        <Animated.View
          style={[
            styles.glowAura,
            {
              backgroundColor: activeColor,
              width: size,
              height: size,
              borderRadius: size / 2,
              transform: [{ scale: pulseAnim }],
            },
          ]}
        />

        {/* Circular Face Container */}
        <View
          style={[
            styles.faceBody,
            {
              width: size * 0.9,
              height: size * 0.9,
              borderRadius: (size * 0.9) / 2,
              backgroundColor: activeColor,
              shadowColor: activeColor,
            },
          ]}
        >
          {/* Cyber Lines */}
          <View style={styles.cyberLineLeft} />
          <View style={styles.cyberLineRight} />
          
          {/* Eyebrows */}
          <View style={[styles.eyebrowsRow, { transform: [{ translateY: browTranslateY }] }]}>
            <View style={[styles.eyebrow, { transform: [{ rotate: leftBrowRotate }] }]} />
            <View style={[styles.eyebrow, { transform: [{ rotate: rightBrowRotate }] }]} />
          </View>

          {/* Eyes (Blinking) */}
          <View style={styles.eyesRow}>
            {mood === 'sad' ? (
              <Text style={styles.eyeEmoji}>ಥ</Text>
            ) : mood === 'happy' ? (
              <Text style={[styles.eyeEmoji, { fontSize: 24 }]}>^</Text>
            ) : (
              <Animated.View style={[styles.eyeCircle, { transform: [{ scaleY: eyeBlinkAnim }] }]}>
                <View style={styles.eyePupil} />
              </Animated.View>
            )}

            {mood === 'sad' ? (
              <Text style={styles.eyeEmoji}>ಥ</Text>
            ) : mood === 'happy' ? (
              <Text style={[styles.eyeEmoji, { fontSize: 24 }]}>^</Text>
            ) : (
              <Animated.View style={[styles.eyeCircle, { transform: [{ scaleY: eyeBlinkAnim }] }]}>
                <View style={styles.eyePupil} />
              </Animated.View>
            )}
          </View>

          {/* Nose */}
          <View style={styles.nose} />

          {/* Mouth (Lip syncs when speaking) */}
          <View style={styles.mouthContainer}>
            {isSpeaking ? (
              <Animated.View
                style={[
                  styles.mouthSpeaking,
                  {
                    borderColor: '#0B0816',
                    transform: [{ scaleY: mouthScaleY }, { scaleX: mouthScaleX }],
                  },
                ]}
              />
            ) : mood === 'happy' ? (
              <View style={styles.mouthSmile} />
            ) : mood === 'sad' ? (
              <View style={styles.mouthFrown} />
            ) : mood === 'stressed' ? (
              <View style={styles.mouthStressed} />
            ) : (
              <View style={styles.mouthNeutral} />
            )}
          </View>

          {/* Blushing Cheeks */}
          {(mood === 'happy' || isSpeaking) && (
            <View style={styles.cheeksRow}>
              <View style={styles.cheek} />
              <View style={styles.cheek} />
            </View>
          )}

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
    opacity: 0.22,
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.8,
    shadowRadius: 24,
  },
  faceBody: {
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 3,
    borderColor: 'rgba(255, 255, 255, 0.25)',
    overflow: 'hidden',
    position: 'relative',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 10,
    elevation: 6,
  },
  cyberLineLeft: {
    position: 'absolute',
    left: '18%',
    top: '30%',
    width: 1,
    height: '40%',
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
  },
  cyberLineRight: {
    position: 'absolute',
    right: '18%',
    top: '30%',
    width: 1,
    height: '40%',
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
  },
  eyebrowsRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    width: '54%',
    marginBottom: 4,
    zIndex: 2,
  },
  eyebrow: {
    width: 22,
    height: 3,
    backgroundColor: '#0B0816',
    borderRadius: 1.5,
  },
  eyesRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    width: '50%',
    alignItems: 'center',
    height: 18,
    marginBottom: 6,
    zIndex: 2,
  },
  eyeCircle: {
    width: 14,
    height: 14,
    borderRadius: 7,
    backgroundColor: '#0B0816',
    justifyContent: 'center',
    alignItems: 'center',
  },
  eyePupil: {
    width: 4,
    height: 4,
    borderRadius: 2,
    backgroundColor: '#FFFFFF',
  },
  eyeEmoji: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#0B0816',
    textAlign: 'center',
    width: 18,
  },
  nose: {
    width: 5,
    height: 12,
    borderRadius: 2.5,
    backgroundColor: 'rgba(11, 8, 22, 0.2)',
    marginVertical: 4,
  },
  mouthContainer: {
    height: 18,
    justifyContent: 'center',
    alignItems: 'center',
    width: '50%',
    marginTop: 2,
  },
  mouthNeutral: {
    width: 20,
    height: 3,
    backgroundColor: '#0B0816',
    borderRadius: 1.5,
  },
  mouthSmile: {
    width: 26,
    height: 13,
    borderBottomWidth: 3.5,
    borderBottomColor: '#0B0816',
    borderBottomLeftRadius: 13,
    borderBottomRightRadius: 13,
    backgroundColor: 'transparent',
    marginTop: -4,
  },
  mouthFrown: {
    width: 20,
    height: 10,
    borderTopWidth: 3.5,
    borderTopColor: '#0B0816',
    borderTopLeftRadius: 10,
    borderTopRightRadius: 10,
    backgroundColor: 'transparent',
    marginTop: 6,
  },
  mouthStressed: {
    width: 10,
    height: 10,
    borderRadius: 5,
    borderWidth: 2.5,
    borderColor: '#0B0816',
    backgroundColor: 'transparent',
  },
  mouthSpeaking: {
    width: 12,
    height: 6,
    borderRadius: 6,
    borderWidth: 2.5,
    backgroundColor: '#0B0816',
  },
  cheeksRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    width: '74%',
    position: 'absolute',
    top: '55%',
    zIndex: 1,
  },
  cheek: {
    width: 14,
    height: 8,
    borderRadius: 4,
    backgroundColor: 'rgba(236, 72, 153, 0.35)',
  },
});

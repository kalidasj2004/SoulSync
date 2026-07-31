import React, { useState, useContext, useRef, useEffect } from 'react';
import {
  StyleSheet,
  Text,
  View,
  ScrollView,
  KeyboardAvoidingView,
  Platform,
  TouchableOpacity,
  TextInput,
  ActivityIndicator,
  Animated,
  Dimensions,
} from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { LinearGradient } from 'expo-linear-gradient';
import { getSupabase } from '../../services/supabase';
import { AppContext } from '../../AppContext';
import { THEME } from '../../utils/theme';
import { ROUTES } from '../../navigation/RouteNames';
import { translate } from '../../services/translations';

// Components
import CompanionAvatar from '../../components/CompanionAvatar';

const { width } = Dimensions.get('window');

/* ─── Floating Glossy Bubbles ─── */
function Bubble({ size, left, delay, duration }) {
  const translateY = useRef(new Animated.Value(0)).current;
  const translateX = useRef(new Animated.Value(0)).current;
  const opacity = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    const animate = () => {
      translateY.setValue(0);
      translateX.setValue(0);
      opacity.setValue(0);

      Animated.sequence([
        Animated.delay(delay),
        Animated.parallel([
          Animated.timing(translateY, {
            toValue: -750,
            duration,
            useNativeDriver: true,
          }),
          Animated.sequence([
            Animated.timing(translateX, { toValue: 12, duration: duration / 2, useNativeDriver: true }),
            Animated.timing(translateX, { toValue: -12, duration: duration / 2, useNativeDriver: true }),
          ]),
          Animated.sequence([
            Animated.timing(opacity, { toValue: 0.55, duration: 800, useNativeDriver: true }),
            Animated.timing(opacity, { toValue: 0.55, duration: duration - 1600, useNativeDriver: true }),
            Animated.timing(opacity, { toValue: 0, duration: 800, useNativeDriver: true }),
          ]),
        ]),
      ]).start(() => animate());
    };
    animate();
  }, []);

  const highlightSize = Math.max(3, size * 0.25);

  return (
    <Animated.View
      style={[
        bubbleStyles.bubble,
        {
          width: size,
          height: size,
          borderRadius: size / 2,
          left: `${left}%`,
          transform: [{ translateY }, { translateX }],
          opacity,
        },
      ]}
    >
      <View
        style={[
          bubbleStyles.bubbleHighlight,
          {
            width: highlightSize,
            height: highlightSize,
            borderRadius: highlightSize / 2,
          },
        ]}
      />
    </Animated.View>
  );
}

const BUBBLES = Array.from({ length: 16 }, (_, i) => ({
  id: i,
  size: 12 + Math.random() * 26,
  left: Math.random() * 88,
  delay: Math.random() * 4000,
  duration: 5500 + Math.random() * 6500,
}));

function BubbleBackground() {
  return (
    <View style={bubbleStyles.container} pointerEvents="none">
      {BUBBLES.map(b => <Bubble key={b.id} {...b} />)}
    </View>
  );
}

const bubbleStyles = StyleSheet.create({
  container: {
    position: 'absolute',
    top: 0, left: 0, right: 0, bottom: 0,
    overflow: 'hidden',
    zIndex: 0,
  },
  bubble: {
    position: 'absolute',
    bottom: -40,
    borderWidth: 2,
    borderColor: 'rgba(245, 158, 11, 0.5)',
    backgroundColor: 'rgba(254, 240, 138, 0.35)',
    shadowColor: '#F59E0B',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 6,
    elevation: 3,
  },
  bubbleHighlight: {
    position: 'absolute',
    top: '18%',
    left: '22%',
    backgroundColor: 'rgba(255, 255, 255, 0.85)',
  },
});

/* ─── Custom Input Component ─── */
function NativeInput({ label, icon, placeholder, value, onChangeText, secureTextEntry, rightIcon, onRightIconPress, error, keyboardType = 'default' }) {
  const [focused, setFocused] = useState(false);

  return (
    <View style={styles.inputGroup}>
      {label ? <Text style={styles.inputLabel}>{label}</Text> : null}
      <View style={[styles.inputContainer, focused && styles.inputFocused, error && styles.inputError]}>
        {icon ? <Text style={styles.inputIcon}>{icon}</Text> : null}
        <TextInput
          style={styles.textInput}
          placeholder={placeholder}
          placeholderTextColor="#A1A1AA"
          value={value}
          onChangeText={onChangeText}
          secureTextEntry={secureTextEntry}
          keyboardType={keyboardType}
          autoCapitalize="none"
          onFocus={() => setFocused(true)}
          onBlur={() => setFocused(false)}
        />
        {rightIcon ? (
          <TouchableOpacity onPress={onRightIconPress} style={styles.rightIconBtn}>
            <Text style={{ fontSize: 16 }}>{rightIcon}</Text>
          </TouchableOpacity>
        ) : null}
      </View>
      {error ? <Text style={styles.errorText}>⚠ {error}</Text> : null}
    </View>
  );
}

/* ─── Main Screen Component ─── */
export default function LoginScreen() {
  const navigation = useNavigation();
  const { language } = useContext(AppContext);
  const supabase = getSupabase();

  const [mode, setMode] = useState('login'); // 'login' | 'signup'

  // Form States
  const [fullName, setFullName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [rememberMe, setRememberMe] = useState(false);
  const [agreeTerms, setAgreeTerms] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);

  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState({});

  const clearErrors = () => setErrors({});

  const handleLogin = async () => {
    clearErrors();
    const errs = {};
    if (!email.trim()) errs.email = 'Email is required.';
    else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim())) errs.email = 'Invalid email format.';
    if (!password) errs.password = 'Password is required.';
    setErrors(errs);
    if (Object.keys(errs).length > 0) return;

    setLoading(true);
    try {
      const { error } = await supabase.auth.signInWithPassword({
        email: email.trim(),
        password,
      });
      if (error) {
        setErrors({ general: 'Invalid username or password.' });
      }
    } catch {
      setErrors({ general: 'Something went wrong. Please try again.' });
    } finally {
      setLoading(false);
    }
  };

  const handleSignUp = async () => {
    clearErrors();
    const errs = {};
    if (!fullName.trim()) errs.fullName = 'Full name is required.';
    if (!email.trim()) errs.email = 'Email is required.';
    else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim())) errs.email = 'Invalid email format.';
    if (!password) errs.password = 'Password is required.';
    else if (password.length < 6) errs.password = 'At least 6 characters.';
    if (password !== confirmPassword) errs.confirm = 'Passwords do not match.';
    if (!agreeTerms) errs.agreeTerms = 'Please agree to Terms & Privacy Policy.';
    setErrors(errs);
    if (Object.keys(errs).length > 0) return;

    setLoading(true);
    try {
      const { data, error } = await supabase.auth.signUp({
        email: email.trim(),
        password,
        options: { data: { display_name: fullName.trim() } },
      });
      if (error) {
        setErrors({ general: error.message });
      } else if (!data.session) {
        setErrors({ general: 'Account created! Please check your email to confirm.' });
      }
    } catch {
      setErrors({ general: 'Registration failed. Please try again.' });
    } finally {
      setLoading(false);
    }
  };

  const handleGoogleAuth = async () => {
    try {
      if (supabase) {
        await supabase.auth.signInWithOAuth({ provider: 'google' });
      }
    } catch (e) {
      setErrors({ general: 'Google sign in error: ' + e.message });
    }
  };

  return (
    <LinearGradient colors={['#FFFDF0', '#FEF3C7', '#FDE68A']} style={styles.container}>
      <BubbleBackground />
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={{ flex: 1 }}
      >
        <ScrollView
          contentContainerStyle={styles.scrollContainer}
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}
        >
          {/* Header & Avatar */}
          <View style={styles.headerContainer}>
            <CompanionAvatar mood="happy" size={110} />
            <Text style={styles.appTitle}>SoulSync AI</Text>
            <Text style={styles.appSubtitle}>
              {mode === 'login' ? 'Welcome Back 👋' : 'Create Account ✨'}
            </Text>
            <Text style={styles.appDesc}>
              {mode === 'login' ? 'Continue your wellness journey' : 'Start your wellness journey today'}
            </Text>
          </View>

          {/* Main Glassmorphic Card */}
          <View style={styles.card}>
            <LinearGradient
              colors={['#FF8A3D', '#FFD54A']}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 0 }}
              style={styles.topAccentBar}
            />

            {/* Tab Switcher */}
            <View style={styles.tabContainer}>
              <TouchableOpacity
                style={[styles.tabBtn, mode === 'login' && styles.activeTabBtn]}
                onPress={() => { setMode('login'); clearErrors(); }}
                activeOpacity={0.8}
              >
                {mode === 'login' ? (
                  <LinearGradient colors={['#FF8A3D', '#FFD54A']} style={styles.tabGradient}>
                    <Text style={styles.activeTabText}>Sign In</Text>
                  </LinearGradient>
                ) : (
                  <Text style={styles.inactiveTabText}>Sign In</Text>
                )}
              </TouchableOpacity>

              <TouchableOpacity
                style={[styles.tabBtn, mode === 'signup' && styles.activeTabBtn]}
                onPress={() => { setMode('signup'); clearErrors(); }}
                activeOpacity={0.8}
              >
                {mode === 'signup' ? (
                  <LinearGradient colors={['#FF8A3D', '#FFD54A']} style={styles.tabGradient}>
                    <Text style={styles.activeTabText}>Sign Up</Text>
                  </LinearGradient>
                ) : (
                  <Text style={styles.inactiveTabText}>Sign Up</Text>
                )}
              </TouchableOpacity>
            </View>

            {/* Error Banner */}
            {errors.general ? (
              <View style={styles.errorBanner}>
                <Text style={styles.errorBannerText}>{errors.general}</Text>
              </View>
            ) : null}

            {/* FORM FIELDS */}
            {mode === 'login' ? (
              <>
                <NativeInput
                  label="Email Address"
                  icon="📧"
                  placeholder="name@email.com"
                  value={email}
                  onChangeText={(txt) => { setEmail(txt); clearErrors(); }}
                  keyboardType="email-address"
                  error={errors.email}
                />
                <NativeInput
                  label="Password"
                  icon="🔒"
                  placeholder="••••••••"
                  value={password}
                  onChangeText={(txt) => { setPassword(txt); clearErrors(); }}
                  secureTextEntry={!showPassword}
                  rightIcon={showPassword ? '👁️' : '🙈'}
                  onRightIconPress={() => setShowPassword(!showPassword)}
                  error={errors.password}
                />

                {/* Remember Me + Forgot Password */}
                <View style={styles.optionsRow}>
                  <TouchableOpacity
                    style={styles.checkboxRow}
                    onPress={() => setRememberMe(!rememberMe)}
                    activeOpacity={0.7}
                  >
                    <View style={[styles.checkbox, rememberMe && styles.checkboxChecked]}>
                      {rememberMe ? <Text style={styles.checkmark}>✓</Text> : null}
                    </View>
                    <Text style={styles.checkboxLabel}>Remember Me</Text>
                  </TouchableOpacity>

                  <TouchableOpacity activeOpacity={0.7}>
                    <Text style={styles.forgotText}>Forgot Password?</Text>
                  </TouchableOpacity>
                </View>

                {/* Submit Button */}
                <TouchableOpacity
                  onPress={handleLogin}
                  disabled={loading}
                  activeOpacity={0.85}
                  style={{ marginTop: 8 }}
                >
                  <LinearGradient colors={['#FF8A3D', '#FFD54A']} style={styles.submitBtnGradient}>
                    {loading ? (
                      <ActivityIndicator color="#FFFFFF" size="small" />
                    ) : (
                      <Text style={styles.submitBtnText}>Sign In →</Text>
                    )}
                  </LinearGradient>
                </TouchableOpacity>
              </>
            ) : (
              <>
                <NativeInput
                  label="Full Name"
                  icon="👤"
                  placeholder="Your full name"
                  value={fullName}
                  onChangeText={(txt) => { setFullName(txt); clearErrors(); }}
                  error={errors.fullName}
                />
                <NativeInput
                  label="Email Address"
                  icon="📧"
                  placeholder="name@email.com"
                  value={email}
                  onChangeText={(txt) => { setEmail(txt); clearErrors(); }}
                  keyboardType="email-address"
                  error={errors.email}
                />
                <NativeInput
                  label="Password"
                  icon="🔒"
                  placeholder="Min. 6 characters"
                  value={password}
                  onChangeText={(txt) => { setPassword(txt); clearErrors(); }}
                  secureTextEntry={!showPassword}
                  rightIcon={showPassword ? '👁️' : '🙈'}
                  onRightIconPress={() => setShowPassword(!showPassword)}
                  error={errors.password}
                />
                <NativeInput
                  label="Confirm Password"
                  icon="🔐"
                  placeholder="Repeat password"
                  value={confirmPassword}
                  onChangeText={(txt) => { setConfirmPassword(txt); clearErrors(); }}
                  secureTextEntry={!showConfirm}
                  rightIcon={showConfirm ? '👁️' : '🙈'}
                  onRightIconPress={() => setShowConfirm(!showConfirm)}
                  error={errors.confirm}
                />

                {/* Terms Checkbox */}
                <TouchableOpacity
                  style={[styles.checkboxRow, { marginBottom: 16 }]}
                  onPress={() => setAgreeTerms(!agreeTerms)}
                  activeOpacity={0.7}
                >
                  <View style={[styles.checkbox, agreeTerms && styles.checkboxChecked]}>
                    {agreeTerms ? <Text style={styles.checkmark}>✓</Text> : null}
                  </View>
                  <Text style={styles.checkboxLabel}>
                    I agree to <Text style={styles.termsLink}>Terms & Privacy Policy</Text>
                  </Text>
                </TouchableOpacity>
                {errors.agreeTerms ? <Text style={[styles.errorText, { marginBottom: 8 }]}>⚠ {errors.agreeTerms}</Text> : null}

                {/* Submit Button */}
                <TouchableOpacity
                  onPress={handleSignUp}
                  disabled={loading}
                  activeOpacity={0.85}
                >
                  <LinearGradient colors={['#FF8A3D', '#FFD54A']} style={styles.submitBtnGradient}>
                    {loading ? (
                      <ActivityIndicator color="#FFFFFF" size="small" />
                    ) : (
                      <Text style={styles.submitBtnText}>Create Account →</Text>
                    )}
                  </LinearGradient>
                </TouchableOpacity>
              </>
            )}

            {/* Social Divider */}
            <View style={styles.dividerRow}>
              <View style={styles.dividerLine} />
              <Text style={styles.dividerText}>or {mode === 'login' ? 'continue' : 'sign up'} with</Text>
              <View style={styles.dividerLine} />
            </View>

            {/* Social Buttons */}
            <View style={styles.socialRow}>
              <TouchableOpacity
                style={styles.socialBtn}
                onPress={handleGoogleAuth}
                activeOpacity={0.75}
              >
                <Text style={styles.socialIcon}>🔍</Text>
                <Text style={styles.socialBtnText}>Google</Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={styles.socialBtn}
                onPress={() => setErrors({ general: 'Apple Sign-In is supported on iOS devices.' })}
                activeOpacity={0.75}
              >
                <Text style={styles.socialIcon}>🍎</Text>
                <Text style={styles.socialBtnText}>Apple</Text>
              </TouchableOpacity>
            </View>

            {/* Bottom Switch Link */}
            <View style={styles.switchRow}>
              <Text style={styles.switchText}>
                {mode === 'login' ? "Don't have an account? " : 'Already have an account? '}
              </Text>
              <TouchableOpacity onPress={() => { setMode(mode === 'login' ? 'signup' : 'login'); clearErrors(); }}>
                <Text style={styles.switchLink}>{mode === 'login' ? 'Sign Up' : 'Sign In'}</Text>
              </TouchableOpacity>
            </View>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </LinearGradient>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  scrollContainer: {
    paddingHorizontal: 20,
    paddingVertical: 40,
    alignItems: 'center',
    justifyContent: 'center',
    minHeight: '100%',
  },
  headerContainer: {
    alignItems: 'center',
    marginBottom: 20,
  },
  appTitle: {
    fontSize: 26,
    fontWeight: '900',
    color: '#374151',
    marginTop: 8,
  },
  appSubtitle: {
    fontSize: 20,
    fontWeight: '800',
    color: '#1F2937',
    marginTop: 4,
  },
  appDesc: {
    fontSize: 13,
    color: '#6B7280',
    marginTop: 2,
    fontWeight: '500',
  },
  card: {
    width: '100%',
    maxWidth: 420,
    backgroundColor: 'rgba(255, 255, 255, 0.94)',
    borderRadius: 28,
    padding: 24,
    shadowColor: '#FF8A3D',
    shadowOffset: { width: 0, height: 12 },
    shadowOpacity: 0.15,
    shadowRadius: 24,
    elevation: 8,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.8)',
    position: 'relative',
    overflow: 'hidden',
  },
  topAccentBar: {
    position: 'absolute',
    top: 0, left: 0, right: 0,
    height: 5,
  },
  tabContainer: {
    flexDirection: 'row',
    backgroundColor: '#F3F4F6',
    borderRadius: 16,
    padding: 4,
    marginBottom: 20,
    marginTop: 6,
  },
  tabBtn: {
    flex: 1,
    borderRadius: 12,
    overflow: 'hidden',
    alignItems: 'center',
    justifyContent: 'center',
    height: 38,
  },
  activeTabBtn: {
    elevation: 2,
  },
  tabGradient: {
    width: '100%',
    height: '100%',
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 12,
  },
  activeTabText: {
    color: '#FFFFFF',
    fontWeight: '800',
    fontSize: 13,
  },
  inactiveTabText: {
    color: '#6B7280',
    fontWeight: '700',
    fontSize: 13,
  },
  inputGroup: {
    marginBottom: 14,
  },
  inputLabel: {
    fontSize: 13,
    fontWeight: '700',
    color: '#374151',
    marginBottom: 6,
  },
  inputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F9FAFB',
    borderWidth: 1.5,
    borderColor: '#E5E7EB',
    borderRadius: 16,
    paddingHorizontal: 14,
    height: 48,
  },
  inputFocused: {
    borderColor: '#FF8A3D',
    backgroundColor: '#FFFFFF',
  },
  inputError: {
    borderColor: '#EF4444',
  },
  inputIcon: {
    fontSize: 16,
    marginRight: 10,
  },
  textInput: {
    flex: 1,
    fontSize: 14,
    color: '#1F2937',
    fontWeight: '500',
  },
  rightIconBtn: {
    padding: 4,
  },
  errorText: {
    color: '#EF4444',
    fontSize: 11,
    fontWeight: '600',
    marginTop: 4,
    marginLeft: 2,
  },
  errorBanner: {
    backgroundColor: 'rgba(239, 68, 68, 0.1)',
    borderWidth: 1,
    borderColor: 'rgba(239, 68, 68, 0.3)',
    borderRadius: 14,
    paddingVertical: 10,
    paddingHorizontal: 14,
    marginBottom: 14,
    alignItems: 'center',
  },
  errorBannerText: {
    color: '#DC2626',
    fontSize: 13,
    fontWeight: '600',
    textAlign: 'center',
  },
  optionsRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
    marginTop: 2,
  },
  checkboxRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  checkbox: {
    width: 18,
    height: 18,
    borderRadius: 5,
    borderWidth: 1.5,
    borderColor: '#D1D5DB',
    marginRight: 8,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#FFFFFF',
  },
  checkboxChecked: {
    backgroundColor: '#FF8A3D',
    borderColor: '#FF8A3D',
  },
  checkmark: {
    color: '#FFFFFF',
    fontSize: 11,
    fontWeight: 'bold',
  },
  checkboxLabel: {
    fontSize: 12,
    color: '#4B5563',
    fontWeight: '500',
  },
  termsLink: {
    color: '#FF8A3D',
    fontWeight: '700',
  },
  forgotText: {
    fontSize: 12,
    color: '#FF8A3D',
    fontWeight: '700',
  },
  submitBtnGradient: {
    height: 50,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#FF8A3D',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.3,
    shadowRadius: 12,
    elevation: 4,
  },
  submitBtnText: {
    color: '#FFFFFF',
    fontSize: 15,
    fontWeight: '800',
  },
  dividerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginVertical: 18,
  },
  dividerLine: {
    flex: 1,
    height: 1,
    backgroundColor: '#E5E7EB',
  },
  dividerText: {
    fontSize: 11,
    color: '#9CA3AF',
    fontWeight: '600',
    marginHorizontal: 10,
  },
  socialRow: {
    flexDirection: 'row',
    gap: 12,
    marginBottom: 18,
  },
  socialBtn: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    height: 46,
    borderRadius: 16,
    borderWidth: 1.5,
    borderColor: '#E5E7EB',
    backgroundColor: '#FFFFFF',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.03,
    shadowRadius: 4,
    elevation: 1,
  },
  socialIcon: {
    fontSize: 16,
    marginRight: 8,
  },
  socialBtnText: {
    fontSize: 13,
    fontWeight: '700',
    color: '#374151',
  },
  switchRow: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: 4,
  },
  switchText: {
    fontSize: 13,
    color: '#6B7280',
  },
  switchLink: {
    fontSize: 13,
    color: '#FF8A3D',
    fontWeight: '800',
  },
});

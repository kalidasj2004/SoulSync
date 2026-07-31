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
import { ROUTES } from '../../navigation/RouteNames';

// Components
import CompanionAvatar from '../../components/CompanionAvatar';

const { width } = Dimensions.get('window');

export default function LoginScreen() {
  const navigation = useNavigation();
  const { language } = useContext(AppContext);
  const supabase = getSupabase();

  const [mode, setMode] = useState('login'); // 'login' | 'signup'
  const [darkMode, setDarkMode] = useState(false);

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
      const { data, error } = await supabase.auth.signInWithPassword({
        email: email.trim(),
        password,
      });
      if (error) {
        setErrors({ general: error.message || 'Invalid email or password.' });
      }
    } catch (e) {
      setErrors({ general: e.message || 'Something went wrong. Please try again.' });
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
        setErrors({ general: 'Account created! Check your email to confirm.' });
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

  const isDark = darkMode;

  return (
    <View style={[styles.screenContainer, { backgroundColor: isDark ? '#090D16' : '#FFFDF3' }]}>
      {/* Background Radial Blobs */}
      <View style={styles.blobTopLeft} pointerEvents="none" />
      <View style={styles.blobBottomRight} pointerEvents="none" />

      {/* Dark Mode Moon Switch Button (Top Right) */}
      <TouchableOpacity
        style={[styles.darkModeBtn, isDark && styles.darkModeBtnDark]}
        onPress={() => setDarkMode(!darkMode)}
        activeOpacity={0.8}
      >
        <Text style={{ fontSize: 16 }}>{isDark ? '☀️' : '🌙'}</Text>
      </TouchableOpacity>

      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={{ flex: 1, width: '100%' }}
      >
        <ScrollView
          contentContainerStyle={styles.scrollContent}
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}
        >
          {/* Main Auth Card */}
          <View style={[styles.card, isDark && styles.cardDark]}>
            {/* Top Orange Accent Line */}
            <LinearGradient
              colors={['#FF8A3D', '#FFD54A', '#FF8A3D']}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 0 }}
              style={styles.topBarAccent}
            />

            {/* Pill Tab Switcher */}
            <View style={[styles.pillTabContainer, isDark && styles.pillTabContainerDark]}>
              <TouchableOpacity
                style={styles.tabBtnHalf}
                onPress={() => { setMode('login'); clearErrors(); }}
                activeOpacity={0.85}
              >
                {mode === 'login' ? (
                  <LinearGradient colors={['#FF8A3D', '#FFD54A']} style={styles.tabPillGradient}>
                    <Text style={styles.tabTextActive}>Sign In</Text>
                  </LinearGradient>
                ) : (
                  <View style={styles.tabPillInactive}>
                    <Text style={[styles.tabTextInactive, isDark && { color: '#9CA3AF' }]}>Sign In</Text>
                  </View>
                )}
              </TouchableOpacity>

              <TouchableOpacity
                style={styles.tabBtnHalf}
                onPress={() => { setMode('signup'); clearErrors(); }}
                activeOpacity={0.85}
              >
                {mode === 'signup' ? (
                  <LinearGradient colors={['#FF8A3D', '#FFD54A']} style={styles.tabPillGradient}>
                    <Text style={styles.tabTextActive}>Sign Up</Text>
                  </LinearGradient>
                ) : (
                  <View style={styles.tabPillInactive}>
                    <Text style={[styles.tabTextInactive, isDark && { color: '#9CA3AF' }]}>Sign Up</Text>
                  </View>
                )}
              </TouchableOpacity>
            </View>

            {/* Cat Companion Avatar Header */}
            <View style={styles.companionHeader}>
              <View style={styles.avatarGlowCircle}>
                <CompanionAvatar mood="happy" size={95} />
              </View>

              <Text style={[styles.headerTitle, isDark && { color: '#FFFFFF' }]}>
                {mode === 'login' ? 'Welcome Back 👋' : 'Create Account ✨'}
              </Text>
              <Text style={[styles.headerSubtitle, isDark && { color: '#9CA3AF' }]}>
                {mode === 'login' ? 'Continue your wellness journey' : 'Start your wellness journey today'}
              </Text>
            </View>

            {/* Error Message Banner */}
            {errors.general ? (
              <View style={styles.errorBanner}>
                <Text style={styles.errorBannerText}>{errors.general}</Text>
              </View>
            ) : null}

            {/* FORM INPUTS */}
            {mode === 'login' ? (
              <>
                <View style={styles.fieldGroup}>
                  <Text style={[styles.fieldLabel, isDark && { color: '#D1D5DB' }]}>Email Address</Text>
                  <View style={[styles.inputBox, isDark && styles.inputBoxDark]}>
                    <Text style={styles.inputLeftIcon}>📧</Text>
                    <TextInput
                      style={[styles.inputControl, isDark && { color: '#FFFFFF' }]}
                      placeholder="name@email.com"
                      placeholderTextColor={isDark ? '#6B7280' : '#A1A1AA'}
                      value={email}
                      onChangeText={(txt) => { setEmail(txt); clearErrors(); }}
                      keyboardType="email-address"
                      autoCapitalize="none"
                      selectionColor="#FF8A3D"
                      underlineColorAndroid="transparent"
                    />
                  </View>
                  {errors.email ? <Text style={styles.errorLine}>⚠ {errors.email}</Text> : null}
                </View>

                <View style={styles.fieldGroup}>
                  <Text style={[styles.fieldLabel, isDark && { color: '#D1D5DB' }]}>Password</Text>
                  <View style={[styles.inputBox, isDark && styles.inputBoxDark]}>
                    <Text style={styles.inputLeftIcon}>🔒</Text>
                    <TextInput
                      style={[styles.inputControl, isDark && { color: '#FFFFFF' }]}
                      placeholder="••••••••"
                      placeholderTextColor={isDark ? '#6B7280' : '#A1A1AA'}
                      value={password}
                      onChangeText={(txt) => { setPassword(txt); clearErrors(); }}
                      secureTextEntry={!showPassword}
                      autoCapitalize="none"
                      selectionColor="#FF8A3D"
                      underlineColorAndroid="transparent"
                    />
                    <TouchableOpacity onPress={() => setShowPassword(!showPassword)} style={{ padding: 4 }}>
                      <Text style={{ fontSize: 16 }}>{showPassword ? '👁️' : '🙈'}</Text>
                    </TouchableOpacity>
                  </View>
                  {errors.password ? <Text style={styles.errorLine}>⚠ {errors.password}</Text> : null}
                </View>

                {/* Options Row */}
                <View style={styles.optionsRow}>
                  <TouchableOpacity
                    style={styles.checkboxTouch}
                    onPress={() => setRememberMe(!rememberMe)}
                    activeOpacity={0.7}
                  >
                    <View style={[styles.checkboxBox, rememberMe && styles.checkboxBoxChecked]}>
                      {rememberMe ? <Text style={styles.checkMarkSymbol}>✓</Text> : null}
                    </View>
                    <Text style={[styles.checkboxText, isDark && { color: '#D1D5DB' }]}>Remember Me</Text>
                  </TouchableOpacity>

                  <TouchableOpacity activeOpacity={0.7}>
                    <Text style={styles.forgotPassLink}>Forgot Password?</Text>
                  </TouchableOpacity>
                </View>

                {/* Action Submit Button */}
                <TouchableOpacity
                  onPress={handleLogin}
                  disabled={loading}
                  activeOpacity={0.88}
                  style={styles.submitBtnContainer}
                >
                  <LinearGradient
                    colors={['#FF8A3D', '#FFD54A']}
                    start={{ x: 0, y: 0 }}
                    end={{ x: 1, y: 0 }}
                    style={styles.submitGradientPill}
                  >
                    {loading ? (
                      <ActivityIndicator color="#FFFFFF" size="small" />
                    ) : (
                      <Text style={styles.submitBtnLabel}>Sign In →</Text>
                    )}
                  </LinearGradient>
                </TouchableOpacity>
              </>
            ) : (
              <>
                <View style={styles.fieldGroup}>
                  <Text style={[styles.fieldLabel, isDark && { color: '#D1D5DB' }]}>Full Name</Text>
                  <View style={[styles.inputBox, isDark && styles.inputBoxDark]}>
                    <Text style={styles.inputLeftIcon}>👤</Text>
                    <TextInput
                      style={[styles.inputControl, isDark && { color: '#FFFFFF' }]}
                      placeholder="Your full name"
                      placeholderTextColor={isDark ? '#6B7280' : '#A1A1AA'}
                      value={fullName}
                      onChangeText={(txt) => { setFullName(txt); clearErrors(); }}
                    />
                  </View>
                  {errors.fullName ? <Text style={styles.errorLine}>⚠ {errors.fullName}</Text> : null}
                </View>

                <View style={styles.fieldGroup}>
                  <Text style={[styles.fieldLabel, isDark && { color: '#D1D5DB' }]}>Email Address</Text>
                  <View style={[styles.inputBox, isDark && styles.inputBoxDark]}>
                    <Text style={styles.inputLeftIcon}>📧</Text>
                    <TextInput
                      style={[styles.inputControl, isDark && { color: '#FFFFFF' }]}
                      placeholder="name@email.com"
                      placeholderTextColor={isDark ? '#6B7280' : '#A1A1AA'}
                      value={email}
                      onChangeText={(txt) => { setEmail(txt); clearErrors(); }}
                      keyboardType="email-address"
                      autoCapitalize="none"
                    />
                  </View>
                  {errors.email ? <Text style={styles.errorLine}>⚠ {errors.email}</Text> : null}
                </View>

                <View style={styles.fieldGroup}>
                  <Text style={[styles.fieldLabel, isDark && { color: '#D1D5DB' }]}>Password</Text>
                  <View style={[styles.inputBox, isDark && styles.inputBoxDark]}>
                    <Text style={styles.inputLeftIcon}>🔒</Text>
                    <TextInput
                      style={[styles.inputControl, isDark && { color: '#FFFFFF' }]}
                      placeholder="Min. 6 characters"
                      placeholderTextColor={isDark ? '#6B7280' : '#A1A1AA'}
                      value={password}
                      onChangeText={(txt) => { setPassword(txt); clearErrors(); }}
                      secureTextEntry={!showPassword}
                    />
                    <TouchableOpacity onPress={() => setShowPassword(!showPassword)}>
                      <Text style={{ fontSize: 16 }}>{showPassword ? '👁️' : '🙈'}</Text>
                    </TouchableOpacity>
                  </View>
                  {errors.password ? <Text style={styles.errorLine}>⚠ {errors.password}</Text> : null}
                </View>

                <View style={styles.fieldGroup}>
                  <Text style={[styles.fieldLabel, isDark && { color: '#D1D5DB' }]}>Confirm Password</Text>
                  <View style={[styles.inputBox, isDark && styles.inputBoxDark]}>
                    <Text style={styles.inputLeftIcon}>🔐</Text>
                    <TextInput
                      style={[styles.inputControl, isDark && { color: '#FFFFFF' }]}
                      placeholder="Repeat password"
                      placeholderTextColor={isDark ? '#6B7280' : '#A1A1AA'}
                      value={confirmPassword}
                      onChangeText={(txt) => { setConfirmPassword(txt); clearErrors(); }}
                      secureTextEntry={!showConfirm}
                    />
                    <TouchableOpacity onPress={() => setShowConfirm(!showConfirm)}>
                      <Text style={{ fontSize: 16 }}>{showConfirm ? '👁️' : '🙈'}</Text>
                    </TouchableOpacity>
                  </View>
                  {errors.confirm ? <Text style={styles.errorLine}>⚠ {errors.confirm}</Text> : null}
                </View>

                {/* Terms Checkbox */}
                <TouchableOpacity
                  style={[styles.checkboxTouch, { marginBottom: 16 }]}
                  onPress={() => setAgreeTerms(!agreeTerms)}
                  activeOpacity={0.7}
                >
                  <View style={[styles.checkboxBox, agreeTerms && styles.checkboxBoxChecked]}>
                    {agreeTerms ? <Text style={styles.checkMarkSymbol}>✓</Text> : null}
                  </View>
                  <Text style={[styles.checkboxText, isDark && { color: '#D1D5DB' }]}>
                    I agree to <Text style={{ color: '#FF8A3D', fontWeight: '700' }}>Terms & Privacy Policy</Text>
                  </Text>
                </TouchableOpacity>
                {errors.agreeTerms ? <Text style={[styles.errorLine, { marginBottom: 8 }]}>⚠ {errors.agreeTerms}</Text> : null}

                {/* Action Submit Button */}
                <TouchableOpacity
                  onPress={handleSignUp}
                  disabled={loading}
                  activeOpacity={0.88}
                  style={styles.submitBtnContainer}
                >
                  <LinearGradient
                    colors={['#FF8A3D', '#FFD54A']}
                    start={{ x: 0, y: 0 }}
                    end={{ x: 1, y: 0 }}
                    style={styles.submitGradientPill}
                  >
                    {loading ? (
                      <ActivityIndicator color="#FFFFFF" size="small" />
                    ) : (
                      <Text style={styles.submitBtnLabel}>Create Account →</Text>
                    )}
                  </LinearGradient>
                </TouchableOpacity>
              </>
            )}

            {/* Social Divider */}
            <View style={styles.dividerContainer}>
              <View style={[styles.lineDivider, isDark && { backgroundColor: '#374151' }]} />
              <Text style={[styles.dividerLabelText, isDark && { color: '#9CA3AF' }]}>
                or {mode === 'login' ? 'continue' : 'sign up'} with
              </Text>
              <View style={[styles.lineDivider, isDark && { backgroundColor: '#374151' }]} />
            </View>

            {/* Social Authentication Pills */}
            <View style={styles.socialButtonsRow}>
              <TouchableOpacity
                style={[styles.socialPillBtn, isDark && styles.socialPillBtnDark]}
                onPress={handleGoogleAuth}
                activeOpacity={0.8}
              >
                <Text style={{ fontSize: 16, marginRight: 8 }}>🔍</Text>
                <Text style={[styles.socialPillLabel, isDark && { color: '#E5E7EB' }]}>Google</Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={[styles.socialPillBtn, isDark && styles.socialPillBtnDark]}
                onPress={() => setErrors({ general: 'Apple Sign-In is supported on Apple devices.' })}
                activeOpacity={0.8}
              >
                <Text style={{ fontSize: 16, marginRight: 8 }}>🍎</Text>
                <Text style={[styles.socialPillLabel, isDark && { color: '#E5E7EB' }]}>Apple</Text>
              </TouchableOpacity>
            </View>

            {/* Bottom Footer Switcher */}
            <View style={styles.bottomSwitchRow}>
              <Text style={[styles.bottomSwitchPrompt, isDark && { color: '#9CA3AF' }]}>
                {mode === 'login' ? "Don't have an account? " : 'Already have an account? '}
              </Text>
              <TouchableOpacity onPress={() => { setMode(mode === 'login' ? 'signup' : 'login'); clearErrors(); }}>
                <Text style={styles.bottomSwitchLink}>{mode === 'login' ? 'Sign Up' : 'Sign In'}</Text>
              </TouchableOpacity>
            </View>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </View>
  );
}

const styles = StyleSheet.create({
  screenContainer: {
    flex: 1,
    position: 'relative',
  },
  blobTopLeft: {
    position: 'absolute',
    top: -60,
    left: -80,
    width: 260,
    height: 260,
    borderRadius: 130,
    backgroundColor: 'rgba(255, 213, 74, 0.45)',
  },
  blobBottomRight: {
    position: 'absolute',
    bottom: -80,
    right: -80,
    width: 280,
    height: 280,
    borderRadius: 140,
    backgroundColor: 'rgba(255, 138, 61, 0.35)',
  },
  darkModeBtn: {
    position: 'absolute',
    top: 48,
    right: 20,
    zIndex: 99,
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: 'rgba(255, 255, 255, 0.85)',
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 4,
  },
  darkModeBtnDark: {
    backgroundColor: 'rgba(31, 41, 55, 0.85)',
  },
  scrollContent: {
    paddingHorizontal: 16,
    paddingVertical: 50,
    alignItems: 'center',
    justifyContent: 'center',
    minHeight: '100%',
  },
  card: {
    width: '100%',
    maxWidth: 400,
    backgroundColor: '#FFFFFF',
    borderRadius: 28,
    paddingHorizontal: 22,
    paddingVertical: 24,
    shadowColor: '#FF8A3D',
    shadowOffset: { width: 0, height: 16 },
    shadowOpacity: 0.14,
    shadowRadius: 28,
    elevation: 8,
    position: 'relative',
    overflow: 'hidden',
  },
  cardDark: {
    backgroundColor: '#111827',
    shadowColor: '#000000',
    shadowOpacity: 0.4,
  },
  topBarAccent: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    height: 4,
  },
  pillTabContainer: {
    flexDirection: 'row',
    backgroundColor: '#F3F4F6',
    borderRadius: 18,
    padding: 4,
    marginBottom: 20,
    marginTop: 4,
  },
  pillTabContainerDark: {
    backgroundColor: '#1F2937',
  },
  tabBtnHalf: {
    flex: 1,
    height: 40,
    borderRadius: 14,
    overflow: 'hidden',
  },
  tabPillGradient: {
    width: '100%',
    height: '100%',
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 14,
  },
  tabPillInactive: {
    width: '100%',
    height: '100%',
    alignItems: 'center',
    justifyContent: 'center',
  },
  tabTextActive: {
    color: '#FFFFFF',
    fontWeight: '800',
    fontSize: 14,
  },
  tabTextInactive: {
    color: '#6B7280',
    fontWeight: '700',
    fontSize: 14,
  },
  companionHeader: {
    alignItems: 'center',
    marginBottom: 20,
  },
  avatarGlowCircle: {
    width: 105,
    height: 105,
    borderRadius: 52.5,
    backgroundColor: 'rgba(255, 237, 160, 0.45)',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 10,
  },
  headerTitle: {
    fontSize: 22,
    fontWeight: '900',
    color: '#111827',
    textAlign: 'center',
  },
  headerSubtitle: {
    fontSize: 13,
    fontWeight: '500',
    color: '#6B7280',
    marginTop: 3,
    textAlign: 'center',
  },
  errorBanner: {
    backgroundColor: 'rgba(239, 68, 68, 0.1)',
    borderWidth: 1,
    borderColor: 'rgba(239, 68, 68, 0.3)',
    borderRadius: 12,
    paddingVertical: 8,
    paddingHorizontal: 12,
    marginBottom: 14,
    alignItems: 'center',
  },
  errorBannerText: {
    color: '#DC2626',
    fontSize: 12,
    fontWeight: '600',
    textAlign: 'center',
  },
  fieldGroup: {
    marginBottom: 14,
  },
  fieldLabel: {
    fontSize: 13,
    fontWeight: '700',
    color: '#374151',
    marginBottom: 6,
  },
  inputBox: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#EEF2FF',
    borderRadius: 14,
    paddingHorizontal: 14,
    height: 48,
  },
  inputBoxDark: {
    backgroundColor: '#1F2937',
  },
  inputLeftIcon: {
    fontSize: 16,
    marginRight: 10,
  },
  inputControl: {
    flex: 1,
    fontSize: 14,
    color: '#111827',
    fontWeight: '600',
    paddingVertical: 8,
    ...Platform.select({
      web: {
        outlineStyle: 'none',
      },
    }),
  },
  errorLine: {
    color: '#EF4444',
    fontSize: 11,
    fontWeight: '600',
    marginTop: 4,
  },
  optionsRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
    marginTop: 2,
  },
  checkboxTouch: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  checkboxBox: {
    width: 18,
    height: 18,
    borderRadius: 4,
    borderWidth: 1.5,
    borderColor: '#D1D5DB',
    marginRight: 8,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#FFFFFF',
  },
  checkboxBoxChecked: {
    backgroundColor: '#FF8A3D',
    borderColor: '#FF8A3D',
  },
  checkMarkSymbol: {
    color: '#FFFFFF',
    fontSize: 11,
    fontWeight: 'bold',
  },
  checkboxText: {
    fontSize: 12,
    color: '#4B5563',
    fontWeight: '600',
  },
  forgotPassLink: {
    fontSize: 12,
    color: '#FF8A3D',
    fontWeight: '700',
  },
  submitBtnContainer: {
    borderRadius: 16,
    overflow: 'hidden',
    marginTop: 4,
    shadowColor: '#FF8A3D',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.3,
    shadowRadius: 12,
    elevation: 4,
  },
  submitGradientPill: {
    height: 48,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 16,
  },
  submitBtnLabel: {
    color: '#FFFFFF',
    fontSize: 15,
    fontWeight: '800',
  },
  dividerContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginVertical: 18,
  },
  lineDivider: {
    flex: 1,
    height: 1,
    backgroundColor: '#E5E7EB',
  },
  dividerLabelText: {
    fontSize: 11,
    color: '#9CA3AF',
    fontWeight: '600',
    marginHorizontal: 10,
  },
  socialButtonsRow: {
    flexDirection: 'row',
    gap: 12,
    marginBottom: 16,
  },
  socialPillBtn: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    height: 46,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: '#E5E7EB',
    backgroundColor: '#FFFFFF',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.03,
    shadowRadius: 4,
    elevation: 1,
  },
  socialPillBtnDark: {
    backgroundColor: '#1F2937',
    borderColor: '#374151',
  },
  socialPillLabel: {
    fontSize: 13,
    fontWeight: '700',
    color: '#374151',
  },
  bottomSwitchRow: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: 4,
  },
  bottomSwitchPrompt: {
    fontSize: 13,
    color: '#6B7280',
  },
  bottomSwitchLink: {
    fontSize: 13,
    color: '#FF8A3D',
    fontWeight: '800',
  },
});

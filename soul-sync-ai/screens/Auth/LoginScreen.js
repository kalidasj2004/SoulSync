import React, { useState, useContext, useEffect } from 'react';
import { StyleSheet, Text, View, ScrollView, Alert, KeyboardAvoidingView, Platform, ActivityIndicator } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { getSupabase, saveSupabaseCredentials, getSupabaseConfigInfo } from '../../services/supabase';
import { AppContext } from '../../AppContext';
import { THEME } from '../../utils/theme';
import { ROUTES } from '../../navigation/RouteNames';
import { translate } from '../../services/translations';

// Components
import Input from '../../components/Input';
import Button from '../../components/Button';
import Card from '../../components/Card';
import CompanionAvatar from '../../components/CompanionAvatar';

export default function LoginScreen() {
  const navigation = useNavigation();
  const { language, refreshAppKeys, appKeysSource } = useContext(AppContext);
  const supabase = getSupabase();

  // Intercept web logins and redirect to the new Web Auth Portal
  useEffect(() => {
    if (Platform.OS === 'web') {
      window.location.href = 'http://localhost:5173/';
    }
  }, []);

  if (Platform.OS === 'web') {
    return (
      <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: THEME.colors.background }}>
        <ActivityIndicator size="large" color={THEME.colors.primary} />
        <Text style={{ color: THEME.colors.textSecondary, marginTop: 12 }}>Redirecting to secure login portal...</Text>
      </View>
    );
  }

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);

  // Validation and Authentication Error States
  const [emailError, setEmailError] = useState('');
  const [passwordError, setPasswordError] = useState('');
  const [generalError, setGeneralError] = useState('');

  // Supabase developer credentials setup state (if missing)
  const [dbUrl, setDbUrl] = useState('');
  const [dbKey, setDbKey] = useState('');
  const [showConfig, setShowConfig] = useState(!supabase);

  const handleLogin = async () => {
    // Clear previous errors
    setEmailError('');
    setPasswordError('');
    setGeneralError('');

    if (!supabase) {
      setGeneralError('Configuration Required: Please configure your Supabase URL and Anon Key first.');
      return;
    }

    let hasError = false;

    // Validate email field
    if (!email) {
      setEmailError('Email is required.');
      hasError = true;
    } else {
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      if (!emailRegex.test(email.trim())) {
        setEmailError('Invalid email format.');
        hasError = true;
      }
    }

    // Validate password field
    if (!password) {
      setPasswordError('Password is required.');
      hasError = true;
    }

    if (hasError) {
      return;
    }

    setLoading(true);
    try {
      const { data, error } = await supabase.auth.signInWithPassword({
        email: email.trim(),
        password,
      });

      if (error) throw error;
    } catch (error) {
      console.log('Login failed error object:', error);
      const msg = error.message || '';
      const status = error.status || 0;
      
      // Map all credential validation failures to generic secure text
      if (
        status === 400 || 
        msg.toLowerCase().includes('invalid login credentials') || 
        msg.toLowerCase().includes('invalid_grant') ||
        msg.toLowerCase().includes('invalid_credentials') ||
        msg.toLowerCase().includes('user not found') ||
        msg.toLowerCase().includes('password is not valid')
      ) {
        setGeneralError('Invalid username or password.');
      } else {
        setGeneralError('Something went wrong. Please try again.');
      }
    } finally {
      setLoading(false);
    }
  };

  const handleSaveKeys = async () => {
    if (!dbUrl || !dbKey) {
      Alert.alert('Error', 'Please enter both the URL and Anon Key.');
      return;
    }

    try {
      await saveSupabaseCredentials(dbUrl, dbKey);
      await refreshAppKeys();
      Alert.alert('Success', 'Supabase credentials saved successfully!');
      setShowConfig(false);
    } catch (e) {
      Alert.alert('Error', 'Failed to configure keys: ' + e.message);
    }
  };

  return (
    <KeyboardAvoidingView
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      style={styles.container}
    >
      <ScrollView contentContainerStyle={styles.scrollContainer} keyboardShouldPersistTaps="handled">
        {/* Animated Companion Header */}
        <View style={styles.avatarContainer}>
          <CompanionAvatar mood="happy" size={120} />
          <Text style={styles.title}>SoulSync AI</Text>
          <Text style={styles.subtitle}>Empathetic Emotional Support & Wellness Companion</Text>
        </View>

        {/* Credentials Form */}
        <Card style={styles.formCard}>
          <Text style={styles.formTitle}>{translate('login', language)}</Text>
          
          <Input
            label={translate('email', language)}
            placeholder="name@email.com"
            value={email}
            onChangeText={(text) => {
              setEmail(text);
              setEmailError('');
              setGeneralError('');
            }}
            keyboardType="email-address"
            error={emailError}
          />

          <Input
            label={translate('password', language)}
            placeholder="••••••••"
            value={password}
            onChangeText={(text) => {
              setPassword(text);
              setPasswordError('');
              setGeneralError('');
            }}
            secureTextEntry={!showPassword}
            rightIcon={showPassword ? '👁️' : '🙈'}
            onRightIconPress={() => setShowPassword(!showPassword)}
            error={passwordError}
          />

          {generalError ? (
            <View style={styles.errorBanner}>
              <Text style={styles.errorBannerText}>{generalError}</Text>
            </View>
          ) : null}

          <Button
            title={translate('login', language)}
            onPress={handleLogin}
            loading={loading}
            style={styles.loginBtn}
          />

          <Button
            title={translate('noAccount', language)}
            onPress={() => navigation.navigate(ROUTES.REGISTER)}
            variant="ghost"
            style={styles.switchBtn}
          />
        </Card>

        {/* Developer Keys Configuration Dropdown */}
        {showConfig ? (
          <Card style={styles.configCard}>
            <Text style={styles.configTitle}>🔧 Connect Your Supabase Backend</Text>
            <Text style={styles.configText}>
              Enter your credentials to wire up Auth, Mood Logs, and Journals.
            </Text>

            <Input
              label="Supabase URL"
              placeholder="https://your-project-id.supabase.co"
              value={dbUrl}
              onChangeText={setDbUrl}
            />

            <Input
              label="Supabase Anon Key"
              placeholder="eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
              value={dbKey}
              onChangeText={setDbKey}
            />

            <Button
              title="Save & Connect"
              onPress={handleSaveKeys}
              variant="accent"
              size="small"
            />
          </Card>
        ) : (
          !supabase && (
            <Button
              title="Configure Supabase Database"
              onPress={() => setShowConfig(true)}
              variant="outline"
              size="small"
              style={styles.configToggleBtn}
            />
          )
        )}

        <Text style={styles.debugText}>
          DB Source: {getSupabaseConfigInfo().source} | URL: {getSupabaseConfigInfo().url ? 'Loaded' : 'None'} | Key Prefix: {getSupabaseConfigInfo().keyPrefix} | Connection: {getSupabaseConfigInfo().testResult}
        </Text>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: THEME.colors.background,
  },
  scrollContainer: {
    flexGrow: 1,
    padding: THEME.sizes.md,
    justifyContent: 'center',
  },
  avatarContainer: {
    alignItems: 'center',
    marginBottom: THEME.sizes.lg,
  },
  title: {
    fontSize: 28,
    fontWeight: 'bold',
    color: THEME.colors.textPrimary,
    marginTop: THEME.sizes.sm,
    fontFamily: THEME.fonts.bold,
  },
  subtitle: {
    fontSize: 14,
    color: THEME.colors.textSecondary,
    textAlign: 'center',
    marginTop: 4,
    paddingHorizontal: THEME.sizes.md,
  },
  formCard: {
    padding: THEME.sizes.lg,
    marginBottom: THEME.sizes.md,
  },
  formTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: THEME.colors.textPrimary,
    marginBottom: THEME.sizes.md,
    textAlign: 'center',
  },
  loginBtn: {
    marginTop: THEME.sizes.sm,
  },
  switchBtn: {
    marginTop: THEME.sizes.xs,
  },
  configCard: {
    padding: THEME.sizes.md,
    borderWidth: 1,
    borderColor: THEME.colors.warning + '50',
    backgroundColor: 'rgba(245, 158, 11, 0.05)',
  },
  configTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: THEME.colors.warning,
    marginBottom: THEME.sizes.xs,
  },
  configText: {
    fontSize: 12,
    color: THEME.colors.textSecondary,
    marginBottom: THEME.sizes.md,
  },
  configToggleBtn: {
    marginVertical: THEME.sizes.md,
    borderColor: THEME.colors.warning,
  },
  debugText: {
    color: '#8B5CF6',
    fontSize: 10,
    textAlign: 'center',
    marginTop: 20,
    opacity: 0.65,
  },
  errorBanner: {
    backgroundColor: 'rgba(239, 68, 68, 0.08)',
    borderColor: THEME.colors.danger + '35',
    borderWidth: 1.5,
    borderRadius: THEME.sizes.radiusSm,
    padding: THEME.sizes.sm + 4,
    marginBottom: THEME.sizes.md,
    width: '100%',
    alignItems: 'center',
  },
  errorBannerText: {
    color: THEME.colors.danger,
    fontSize: 14,
    textAlign: 'center',
    fontFamily: THEME.fonts.medium,
  },
});

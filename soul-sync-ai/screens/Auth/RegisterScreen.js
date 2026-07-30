import React, { useState, useContext, useEffect } from 'react';
import { StyleSheet, Text, View, ScrollView, Alert, KeyboardAvoidingView, Platform, ActivityIndicator } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { getSupabase } from '../../services/supabase';
import { AppContext } from '../../AppContext';
import { THEME } from '../../utils/theme';
import { ROUTES } from '../../navigation/RouteNames';
import { translate } from '../../services/translations';

// Components
import Input from '../../components/Input';
import Button from '../../components/Button';
import Card from '../../components/Card';
import CompanionAvatar from '../../components/CompanionAvatar';

export default function RegisterScreen() {
  const navigation = useNavigation();
  const { language } = useContext(AppContext);
  const supabase = getSupabase();

  // Intercept web registrations and redirect to the new Web Auth Portal
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

  const [displayName, setDisplayName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);

  const handleRegister = async () => {
    if (!supabase) {
      Alert.alert('Configuration Required', 'Please configure your Supabase connection first.');
      return;
    }

    if (!displayName || !email || !password) {
      Alert.alert('Error', 'Please fill in all fields.');
      return;
    }

    setLoading(true);
    try {
      // 1. Sign up user
      const { data, error } = await supabase.auth.signUp({
        email: email.trim(),
        password,
        options: {
          data: {
            display_name: displayName,
          },
        },
      });

      if (error) throw error;

      // 2. Client-side profile fallback
      if (data?.user) {
        try {
          await supabase.from('profiles').upsert({
            id: data.user.id,
            display_name: displayName,
            preferred_language: language,
          });
        } catch (profileErr) {
          console.log('Manual profile fallback notice:', profileErr.message);
        }
      }

      // Check if email confirmation is enabled (data.session will be null if unconfirmed)
      const isEmailConfirmationRequired = !data?.session;

      if (isEmailConfirmationRequired) {
        const msg = 'Account created successfully! A confirmation link has been sent to your email. Please check your inbox and confirm your email before logging in.';
        if (Platform.OS === 'web') {
          alert(msg);
          navigation.navigate(ROUTES.LOGIN);
        } else {
          Alert.alert(
            'Success',
            msg,
            [{ text: 'OK', onPress: () => navigation.navigate(ROUTES.LOGIN) }]
          );
        }
      } else {
        const msg = `Account created successfully! Welcome to SoulSync AI, ${displayName}.`;
        if (Platform.OS === 'web') {
          alert(msg);
          // App.js auth listener will automatically handle home transition, but we trigger standard stack redirect as fallback
          navigation.navigate(ROUTES.HOME || 'Main');
        } else {
          Alert.alert(
            'Success',
            msg,
            [{ text: 'Get Started', onPress: () => navigation.navigate(ROUTES.HOME || 'Main') }]
          );
        }
      }
    } catch (error) {
      Alert.alert('Registration Failed', error.message || 'An error occurred.');
    } finally {
      setLoading(false);
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
          <CompanionAvatar mood="happy" size={110} />
          <Text style={styles.title}>SoulSync AI</Text>
          <Text style={styles.subtitle}>Begin your emotional wellness journey</Text>
        </View>

        {/* Registration Card */}
        <Card style={styles.formCard}>
          <Text style={styles.formTitle}>{translate('register', language)}</Text>
          
          <Input
            label={translate('displayName', language)}
            placeholder="Jane Doe"
            value={displayName}
            onChangeText={setDisplayName}
          />

          <Input
            label={translate('email', language)}
            placeholder="jane@email.com"
            value={email}
            onChangeText={setEmail}
            keyboardType="email-address"
          />

          <Input
            label={translate('password', language)}
            placeholder="••••••••"
            value={password}
            onChangeText={setPassword}
            secureTextEntry={!showPassword}
            rightIcon={showPassword ? '👁️' : '🙈'}
            onRightIconPress={() => setShowPassword(!showPassword)}
          />

          <Button
            title={translate('register', language)}
            onPress={handleRegister}
            loading={loading}
            style={styles.registerBtn}
          />

          <Button
            title={translate('haveAccount', language)}
            onPress={() => navigation.navigate(ROUTES.LOGIN)}
            variant="ghost"
            style={styles.switchBtn}
          />
        </Card>
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
    marginBottom: THEME.sizes.md,
  },
  title: {
    fontSize: 26,
    fontWeight: 'bold',
    color: THEME.colors.textPrimary,
    marginTop: THEME.sizes.sm,
  },
  subtitle: {
    fontSize: 14,
    color: THEME.colors.textSecondary,
    textAlign: 'center',
    marginTop: 4,
  },
  formCard: {
    padding: THEME.sizes.lg,
  },
  formTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: THEME.colors.textPrimary,
    marginBottom: THEME.sizes.md,
    textAlign: 'center',
  },
  registerBtn: {
    marginTop: THEME.sizes.sm,
  },
  switchBtn: {
    marginTop: THEME.sizes.xs,
  },
});

import 'react-native-gesture-handler';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import React, { useState, useEffect, useRef } from 'react';
import { StyleSheet, View, Text, StatusBar, ActivityIndicator } from 'react-native';
import { NavigationContainer } from '@react-navigation/native';
import AsyncStorage from '@react-native-async-storage/async-storage';



import { initSupabase, getSupabase, getSupabaseConfigInfo } from './services/supabase';
import { getGeminiConfigInfo } from './services/gemini';
import AppNavigator from './navigation/AppNavigator';
import { THEME } from './utils/theme';

import { AppContext } from './AppContext';

export default function App() {
  const [appReady, setAppReady] = useState(false);
  const [session, setSession] = useState(null);
  const [profile, setProfile] = useState(null);
  const [language, setLanguageState] = useState('en');
  const [appKeysSource, setAppKeysSource] = useState('System');

  // 1. Core initialization (loads credentials and sets up listeners)
  const initializeApp = async () => {
    try {
      // Initialize Supabase Client (custom or env keys)
      const supabase = await initSupabase();
      
      const supInfo = getSupabaseConfigInfo();
      const gemInfo = await getGeminiConfigInfo();
      setAppKeysSource(supInfo.source === 'Custom Settings' || gemInfo.source === 'Custom Settings' ? 'Custom Settings' : 'System');

      if (supabase) {


        // Get initial auth session
        const { data: { session: initialSession } } = await supabase.auth.getSession();
        setSession(initialSession);

        if (initialSession?.user) {
          await fetchProfile(initialSession.user.id, supabase);
        }

        // Set up subscription for auth changes
        const { data: { subscription } } = supabase.auth.onAuthStateChange(async (_event, newSession) => {
          setSession(newSession);
          if (newSession?.user) {
            await fetchProfile(newSession.user.id, supabase);
          } else {
            setProfile(null);
          }
        });

        // Cache the subscription cleanup in global if needed, but since it is App.js, it stays active.
      } else {
        setSession(null);
        setProfile(null);
      }
    } catch (e) {
      console.error('App initialization error:', e);
    } finally {
      setAppReady(true);
    }
  };

  // 2. Fetch profile from database
  const fetchProfile = async (userId, customClient = null) => {
    const supabase = customClient || getSupabase();
    if (!supabase || !userId) return;

    try {
      const { data, error } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', userId)
        .maybeSingle();

      console.log('DEBUG [fetchProfile] UserID:', userId, 'Profile Data:', data, 'Error:', error);

      if (error) {
        console.log('Profile fetch error, might be new user:', error.message);
        return;
      }

      if (data) {
        setProfile(data);
        if (data.preferred_language) {
          setLanguageState(data.preferred_language);
        }
      } else {
        // Self-healing: create the missing profile row from auth user metadata
        console.log('DEBUG [fetchProfile] Profile missing. Creating self-healing profile row...');
        const newProfile = {
          id: userId,
          display_name: 'SoulSync User',
          preferred_language: language,
        };

        const { data: { user } } = await supabase.auth.getUser();
        if (user && user.user_metadata) {
          if (user.user_metadata.display_name) {
            newProfile.display_name = user.user_metadata.display_name;
          } else if (user.user_metadata.displayName) {
            newProfile.display_name = user.user_metadata.displayName;
          }
        }

        const { data: insertedData, error: insertErr } = await supabase
          .from('profiles')
          .insert(newProfile)
          .select()
          .maybeSingle();

        if (insertedData) {
          console.log('DEBUG [fetchProfile] Self-healing profile created:', insertedData);
          setProfile(insertedData);
        } else if (insertErr) {
          // If the profile already exists (e.g. created concurrently by database trigger), we fetch it instead of throwing
          if (insertErr.code === '23505') {
            const { data: retryData } = await supabase
              .from('profiles')
              .select('*')
              .eq('id', userId)
              .maybeSingle();
            if (retryData) {
              setProfile(retryData);
              return;
            }
          }
          console.log('DEBUG [fetchProfile] Self-healing profile creation failed:', insertErr.message);
        }
      }
    } catch (e) {
      console.log('Error fetching user profile:', e.message);
    }
  };

  // 3. Update application language preference
  const setLanguage = async (newLang) => {
    setLanguageState(newLang);
    const supabase = getSupabase();
    
    // Save locally
    await AsyncStorage.setItem('SOULSYNC_LANGUAGE', newLang);

    // Save to profiles database if authenticated
    if (supabase && session?.user) {
      try {
        await supabase
          .from('profiles')
          .update({ preferred_language: newLang })
          .eq('id', session.user.id);
        
        // Refresh local profile state
        setProfile(prev => prev ? { ...prev, preferred_language: newLang } : null);
      } catch (e) {
        console.log('Failed to save language to user profile:', e.message);
      }
    }
  };

  const handleLogout = async () => {
    try {
      const supabase = getSupabase();
      if (supabase) {
        await supabase.auth.signOut();
      }
    } catch (e) {
      console.log('Logout error:', e.message);
    } finally {
      setSession(null);
      setProfile(null);
    }
  };



  // 4. Reload key configurations on-the-fly
  const refreshAppKeys = async () => {
    setAppReady(false);
    await initializeApp();
  };

  useEffect(() => {
    // Load local language cache first
    const loadCachedLanguage = async () => {
      const cachedLang = await AsyncStorage.getItem('SOULSYNC_LANGUAGE');
      if (cachedLang) setLanguageState(cachedLang);
    };
    loadCachedLanguage();
    initializeApp();
  }, []);

  if (!appReady) {
    return (
      <View style={styles.loadingScreen}>
        <StatusBar barStyle="light-content" backgroundColor={THEME.colors.background} />
        <ActivityIndicator size="large" color={THEME.colors.primary} />
        <Text style={styles.loadingText}>Initializing SoulSync AI...</Text>
      </View>
    );
  }

  return (
    <AppContext.Provider
      value={{
        session,
        profile,
        language,
        setLanguage,
        fetchProfile: () => fetchProfile(session?.user?.id),
        handleLogout,
        refreshAppKeys,
        appKeysSource,
      }}
    >
      <GestureHandlerRootView style={styles.rootContainer}>
        <StatusBar barStyle="light-content" backgroundColor={THEME.colors.background} />
        <NavigationContainer>
          <AppNavigator session={session} />
        </NavigationContainer>
      </GestureHandlerRootView>
    </AppContext.Provider>
  );
}

const styles = StyleSheet.create({
  rootContainer: {
    flex: 1,
    backgroundColor: THEME.colors.background,
  },
  loadingScreen: {
    flex: 1,
    backgroundColor: THEME.colors.background,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    color: THEME.colors.textSecondary,
    marginTop: THEME.sizes.md,
    fontSize: 14,
  },
});

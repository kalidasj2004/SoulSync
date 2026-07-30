import { createClient } from '@supabase/supabase-js';
import AsyncStorage from '@react-native-async-storage/async-storage';

// In Expo, process.env is populated by expo-constants or babel-plugin-inline-dotenv
// We define our fallback default credentials here.
const DEFAULT_SUPABASE_URL = process.env.EXPO_PUBLIC_SUPABASE_URL || '';
const DEFAULT_SUPABASE_ANON_KEY = process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY || '';

let supabaseInstance = null;
let currentSource = 'System';

let lastTestResult = 'Pending...';

// Load stored custom credentials or fall back to system env
export const initSupabase = async () => {
  try {
    let customUrl = await AsyncStorage.getItem('SOULSYNC_SUPABASE_URL');
    let customKey = await AsyncStorage.getItem('SOULSYNC_SUPABASE_KEY');

    // Automatically clean up old invalid publishable keys from local storage
    if (customKey && (customKey.startsWith('sb_publishable_') || customKey === 'undefined' || customKey === 'null')) {
      await AsyncStorage.removeItem('SOULSYNC_SUPABASE_URL');
      await AsyncStorage.removeItem('SOULSYNC_SUPABASE_KEY');
      customUrl = null;
      customKey = null;
    }

    let url = DEFAULT_SUPABASE_URL;
    let key = DEFAULT_SUPABASE_ANON_KEY;
    currentSource = 'System';

    if (customUrl && customKey) {
      url = customUrl;
      key = customKey;
      currentSource = 'Custom Settings';
    }

    // Clean up and trim whitespace/newlines
    if (url) url = url.trim();
    if (key) key = key.trim();

    if (!url || !key || url === 'undefined' || key === 'undefined' || url === 'null' || key === 'null') {
      supabaseInstance = null;
      lastTestResult = 'Config Missing';
      return null;
    }

    console.log('DEBUG [Supabase Init] - Source:', currentSource, 'URL:', url, 'Key Length:', key ? key.length : 0, 'Key Starts With:', key ? key.substring(0, 15) : 'none');

    // Test fetch to verify if the gateway accepts our key
    lastTestResult = 'Testing...';
    fetch(`${url}/auth/v1/settings`, {
      headers: { 'apikey': key }
    })
      .then(res => {
        res.json().then(data => {
          lastTestResult = `Status: ${res.status} (${res.status === 200 ? 'SUCCESS' : 'FAILED'})`;
          console.log('DEBUG [Supabase Key Test] - Status:', res.status, 'Data:', data);
        }).catch(e => {
          lastTestResult = `Parse Error: ${e.message}`;
        });
      })
      .catch(err => {
        lastTestResult = `Fetch Error: ${err.message}`;
        console.log('DEBUG [Supabase Key Test] - Fetch Error:', err.message);
      });

    supabaseInstance = createClient(url, key, {
      auth: {
        storage: AsyncStorage,
        autoRefreshToken: true,
        persistSession: true,
        detectSessionInUrl: false,
      },
    });

    return supabaseInstance;
  } catch (error) {
    console.error('Supabase Initialization Error:', error);
    return null;
  }
};

// Retrieve current active supabase client
export const getSupabase = () => {
  return supabaseInstance;
};

// Save custom credentials and re-initialize
export const saveSupabaseCredentials = async (url, key) => {
  if (url && key) {
    await AsyncStorage.setItem('SOULSYNC_SUPABASE_URL', url.trim());
    await AsyncStorage.setItem('SOULSYNC_SUPABASE_KEY', key.trim());
  } else {
    await AsyncStorage.removeItem('SOULSYNC_SUPABASE_URL');
    await AsyncStorage.removeItem('SOULSYNC_SUPABASE_KEY');
  }
  return await initSupabase();
};

export const getSupabaseConfigInfo = () => {
  return {
    source: currentSource,
    hasCredentials: !!supabaseInstance,
    url: supabaseInstance ? supabaseInstance.supabaseUrl : '',
    keyPrefix: supabaseInstance && supabaseInstance.supabaseKey ? supabaseInstance.supabaseKey.substring(0, 15) : 'none',
    testResult: lastTestResult,
  };
};

import React from 'react';
import { StyleSheet, View, Text } from 'react-native';
import { createStackNavigator } from '@react-navigation/stack';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';

import { ROUTES } from './RouteNames';
import { THEME } from '../utils/theme';

// Import Screens
import LoginScreen from '../screens/Auth/LoginScreen';
import RegisterScreen from '../screens/Auth/RegisterScreen';
import HomeScreen from '../screens/Main/HomeScreen';
import MoodTrackerScreen from '../screens/Main/MoodTrackerScreen';
import JournalScreen from '../screens/Main/JournalScreen';
import AIChatScreen from '../screens/Main/AIChatScreen';
import WellnessScreen from '../screens/Main/WellnessScreen';
import AnalyticsScreen from '../screens/Main/AnalyticsScreen';
import ProfileScreen from '../screens/Main/ProfileScreen';
import SettingsScreen from '../screens/Main/SettingsScreen';

const Stack = createStackNavigator();
const Tab = createBottomTabNavigator();

// Custom Tab Bar Icon Helper (Using Emojis for simplicity and zero external icon package issues)
const getTabBarIcon = (routeName, focused) => {
  let icon = '🏠';
  if (routeName === ROUTES.HOME) icon = '🏠';
  else if (routeName === ROUTES.AI_CHAT) icon = '🤖';
  else if (routeName === ROUTES.MOOD_TRACKER) icon = '📊';
  else if (routeName === ROUTES.JOURNAL) icon = '📓';
  else if (routeName === ROUTES.PROFILE) icon = '👤';
  
  return (
    <Text style={{ fontSize: focused ? 22 : 18, opacity: focused ? 1 : 0.6 }}>
      {icon}
    </Text>
  );
};

// Main Tab Navigation
function MainTabs() {
  return (
    <Tab.Navigator
      screenOptions={({ route }) => ({
        headerShown: false,
        tabBarIcon: ({ focused }) => getTabBarIcon(route.name, focused),
        tabBarActiveTintColor: THEME.colors.primary,
        tabBarInactiveTintColor: THEME.colors.textSecondary,
        tabBarStyle: {
          backgroundColor: THEME.colors.cardBackgroundSolid,
          borderTopWidth: 1,
          borderTopColor: THEME.colors.border,
          height: 60,
          paddingBottom: 8,
          paddingTop: 8,
        },
        tabBarLabelStyle: {
          fontSize: 11,
          fontFamily: THEME.fonts.medium,
        }
      })}
    >
      <Tab.Screen name={ROUTES.HOME} component={HomeScreen} />
      <Tab.Screen name={ROUTES.AI_CHAT} component={AIChatScreen} />
      <Tab.Screen name={ROUTES.MOOD_TRACKER} component={MoodTrackerScreen} />
      <Tab.Screen name={ROUTES.JOURNAL} component={JournalScreen} />
      <Tab.Screen name={ROUTES.PROFILE} component={ProfileScreen} />
    </Tab.Navigator>
  );
}

// App Root Navigator Setup
export default function AppNavigator({ session }) {
  const isAuthenticated = !!session;

  return (
    <Stack.Navigator
      screenOptions={{
        headerShown: false,
        cardStyle: { backgroundColor: THEME.colors.background },
      }}
    >
      {!isAuthenticated ? (
        // Auth Stack
        <>
          <Stack.Screen name={ROUTES.LOGIN} component={LoginScreen} />
          <Stack.Screen name={ROUTES.REGISTER} component={RegisterScreen} />
        </>
      ) : (
        // App Stack (Main Tabs + Nested Stack Screens)
        <>
          <Stack.Screen name={ROUTES.MAIN_TABS} component={MainTabs} />
          <Stack.Screen name={ROUTES.WELLNESS} component={WellnessScreen} />
          <Stack.Screen name={ROUTES.ANALYTICS} component={AnalyticsScreen} />
          <Stack.Screen name={ROUTES.SETTINGS} component={SettingsScreen} />
        </>
      )}
    </Stack.Navigator>
  );
}

import { palette } from '@/constants/restaurant-theme';
import { DefaultTheme, Stack, ThemeProvider } from 'expo-router';
import * as SplashScreen from 'expo-splash-screen';

import { SessionProvider } from '@/features/auth/session';

import { useEffect } from 'react';

SplashScreen.preventAutoHideAsync();

const restaurantNavigationTheme = { ...DefaultTheme, colors: { ...DefaultTheme.colors, background: palette.cream, card: palette.cream, text: palette.cocoa, border: palette.border, primary: palette.primary } };

export default function RootLayout() {
  useEffect(() => { SplashScreen.hide(); }, []);
  return (
    <ThemeProvider value={restaurantNavigationTheme}>
      <SessionProvider><Stack screenOptions={{ headerShown: false }} /></SessionProvider>
    </ThemeProvider>
  );
}

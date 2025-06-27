import { useEffect } from 'react';
import { Stack } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { useFrameworkReady } from '@/hooks/useFrameworkReady';
import { useAuth } from '@/hooks/useAuth';
import { i18nService } from '@/services/i18n';
import LoadingScreen from '@/components/LoadingScreen';

export default function RootLayout() {
  useFrameworkReady();
  const { loading } = useAuth();

  useEffect(() => {
    i18nService.initialize();
  }, []);

  if (loading) {
    return <LoadingScreen />;
  }

  return (
    <>
      <Stack screenOptions={{ headerShown: false }}>
        <Stack.Screen name="(tabs)" />
        <Stack.Screen name="auth" />
        <Stack.Screen name="add-meal" />
        <Stack.Screen name="+not-found" />
      </Stack>
      <StatusBar style="auto" />
    </>
  );
}
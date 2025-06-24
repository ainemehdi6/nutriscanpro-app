import { Stack } from 'expo-router';

export default function AddMealLayout() {
  return (
    <Stack screenOptions={{ headerShown: false }}>
      <Stack.Screen name="index" />
      <Stack.Screen name="barcode" />
      <Stack.Screen name="camera" />
      <Stack.Screen name="description" />
      <Stack.Screen name="results" />
    </Stack>
  );
}
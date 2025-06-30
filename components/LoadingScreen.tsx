import React from 'react';
import { View, ActivityIndicator, StyleSheet, Text } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';

interface LoadingScreenProps {
  message?: string;
  size?: 'small' | 'large';
  color?: string;
  showGradient?: boolean;
  fullScreen?: boolean;
}

export default function LoadingScreen({
  message,
  size = 'large',
  color = '#22C55E',
  showGradient = false,
  fullScreen = true
}: LoadingScreenProps) {
  const content = (
    <View style={styles.content}>
      <ActivityIndicator size={size} color={color} />
      {message && (
        <Text style={[styles.message, { color: showGradient ? 'white' : '#6B7280' }]}>
          {message}
        </Text>
      )}
    </View>
  );

  if (showGradient) {
    return (
      <LinearGradient
        colors={['#22C55E', '#16A34A'] as const}
        style={styles.container}
      >
        {content}
      </LinearGradient>
    );
  }

  return (
    <View style={[styles.container, fullScreen && styles.fullScreen]}>
      {content}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#F8FAFC',
  },
  fullScreen: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    zIndex: 1000,
  },
  content: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  message: {
    marginTop: 16,
    fontSize: 16,
    fontWeight: '500',
    textAlign: 'center',
  },
});
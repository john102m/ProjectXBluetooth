import React from 'react';
import { View, Text, StyleSheet } from 'react-native';

type Props = {
  isConnected: boolean;
  isSubscribed: boolean;
  threshold: number;
  rssi?: number | null;
  voltage?: number | null;
  lightLevel?: number | null;
  latestMessage?: string;
  connectedAt: Date | null;
  isAutoMode: boolean; // 👈 New prop!
};

// 👇 Named utility function
export function formatTimestamp(date?: Date | null): string {
  return date
    ? date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
    : '—';
}

export default function SystemStatus({
  isConnected,
  isSubscribed,
  threshold,
  rssi,
  voltage,
  lightLevel,
  latestMessage,
  connectedAt,
  isAutoMode,
}: Props) {
  return (
    <View style={styles.container}>
      <Text style={styles.heading}>📡 System Status</Text>
      <Text>Status: {isConnected ? '🟢 Connected' : '🔴 Disconnected'}</Text>
      <Text>Notifs: {isSubscribed ? '✅ Subscribed' : ''}</Text>
      <Text>Voltage: {voltage ?? '—'} V</Text>
      <Text>RSSI: {rssi ?? '—'} dBm</Text>
      <Text>Light Level: {lightLevel ?? '—'}%</Text>
      <Text>{isAutoMode ? 'Ambient:' : 'Absolute:'} {threshold}%</Text>
      <Text>Message: {latestMessage || '—'}</Text>
      <Text>Connected At: {formatTimestamp(connectedAt)}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    margin: 10,
    padding: 12,
    backgroundColor: '#f9f9f9',
    borderRadius: 8,
    elevation: 2,
  },
  heading: {
    fontWeight: 'bold',
    fontSize: 16,
    marginBottom: 8,
  },
});

import React from 'react';
import { View, Animated, StyleSheet } from 'react-native';
import CustomButton from './CustomButton';

type Props = {
  isConnected: boolean;
  isSubscribed: boolean;
  isPizzaMode: boolean;
  scaleAnim: Animated.Value;
  onConnect: () => void;
  onSubscribe: () => void;
  onSendData: (cmd: string) => void;
  onSetThreshold: () => void;
  onTogglePizzaMode: () => void;
  onDisconnect: () => void;
};

export default function ControlPanel({
  isPizzaMode,
  scaleAnim,
  onConnect,
  onSubscribe,
  onSendData,
  onSetThreshold,
  onTogglePizzaMode,
  onDisconnect,
}: Props) {
  return (
    <View style={styles.buttonGroup}>
      <View style={styles.buttonRow}>
        <CustomButton
          title="Connect BLE"
          onPress={onConnect}
          color="#FF5733"
        />
        <CustomButton
          title="Subscribe BLE"
          onPress={onSubscribe}
          color="#FF5733"
        />
      </View>

      <View style={styles.buttonRow}>
        <CustomButton
          title="BLE LED ON"
          onPress={() => onSendData('LED_ON')}
          color="#005733"
        />
        <CustomButton
          title="BLE LED OFF"
          onPress={() => onSendData('LED_OFF')}
          color="#005733"
        />
      </View>

      <View style={styles.buttonRow}>
        <CustomButton
          title="⚙️ Set Light Threshold"
          onPress={onSetThreshold}
          color="#FFA500"
        />
      </View>

      <View style={styles.buttonRow}>
        <Animated.View style={{ transform: [{ scale: scaleAnim }] }}>
          <CustomButton
            title={isPizzaMode ? 'Exit Pizza Mode' : '🍕 Pizza Mode'}
            onPress={onTogglePizzaMode}
            color="#FFD700"
          />
        </Animated.View>
        <CustomButton
          title="Disconnect BLE"
          onPress={onDisconnect}
          color="#005733"
        />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  buttonRow: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    marginTop: 0,
    width: '100%',
    backgroundColor: '#FFF',
  },
  buttonGroup: {
    marginTop: 10,
    padding: 15,
  },
});

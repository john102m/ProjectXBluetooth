import React from 'react';
import { View, Animated, StyleSheet } from 'react-native';
import CustomButton from './CustomButton';

type ScreenAction = {
  action: () => void;
  label: string;
};

type Props = {
  isConnected?: boolean;
  isSubscribed?: boolean;
  isPizzaMode?: boolean;
  scaleAnim?: Animated.Value;
  onConnect?: () => void;
  onSubscribe?: () => void;
  onSendData?: (cmd: string) => void;
  onScanBLEDevices?: () => void;
  onStopBLEScan?: ()=> void;
  onSetThreshold?: () => void;
  onTogglePizzaMode?: () => void;
  onDisconnect?: () => void;

  onScreenAction?: ScreenAction;
};

export default function ControlPanel({
  isConnected,
  isPizzaMode,
  isSubscribed,
  scaleAnim,
  onConnect,
  onSubscribe,
  onSendData,
  onScanBLEDevices,
  onStopBLEScan,
  onSetThreshold,
  onTogglePizzaMode,
  onDisconnect,
  onScreenAction,
}: Props) {

  return (
    <View style={styles.buttonGroup}>
      <View style={styles.buttonRow}>
        {onTogglePizzaMode && (
          <Animated.View style={{
            ...(scaleAnim && {
              transform: [{ scale: scaleAnim }],
            }),
          }}>
            <CustomButton
              title={isPizzaMode ? 'Exit Pizza Mode' : '🍕 Pizza Mode'}
              onPress={() => onTogglePizzaMode?.()}
              color="#FFD700"
              disabled={!isConnected}
              // eslint-disable-next-line react-native/no-inline-styles
              style={{ width: '160' }}
            />
          </Animated.View>)}
        {onSetThreshold && (
          <CustomButton
            title="Set Threshold"
            onPress={() => onSetThreshold?.()}
            color="#FFA500"
          />)}
      </View>
      <View style={styles.buttonRow}>
        {onConnect && (
          <CustomButton
            title="Connect"
            onPress={onConnect}
            color="#FF5733"
            disabled={isConnected} />
        )}
        {onDisconnect && (
          <CustomButton
            title="Disconnect"
            onPress={() => onDisconnect?.()}
            color="#005733"
            disabled={!isConnected}
            // eslint-disable-next-line react-native/no-inline-styles
            style={{ width: '160' }}
          />)}

      </View>
      <View style={styles.buttonRow}>
        {onSendData && (
          <CustomButton
            title="LED ON"
            onPress={() => onSendData?.('LED_ON')}
            color="#005733"
            disabled={!isConnected}
          />)}

        {onSendData && (
          <CustomButton
            title="LED OFF"
            onPress={() => onSendData?.('LED_OFF')}
            color="#005733"
            disabled={!isConnected}
          />)}
      </View>
      <View style={styles.buttonRow}>
        {onScreenAction && (
          <CustomButton
            title={onScreenAction.label}
            onPress={() => onScreenAction.action()}
            color="#00aaff"
          />
        )}

        {onSubscribe && (
          <CustomButton
            title="Subscribe"
            onPress={() => onSubscribe?.()}
            color="#FF5733"
            disabled={isSubscribed}
          />)}
      </View>
      <View style={styles.buttonRow}>
        {onScanBLEDevices && (<CustomButton
          title="Start Scan"
          onPress={async () => {
            const deviceInfo = onScanBLEDevices?.();

            console.log('Scan Result:', deviceInfo);
            // Optionally add to a device list state here
          }}
          color="#FFA00F"
        />)}
        {onStopBLEScan && (<CustomButton
          title="Stop Scan"
          onPress={async () => {
            onStopBLEScan?.();
          }}
          color="#FFA00F"
        />)}


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

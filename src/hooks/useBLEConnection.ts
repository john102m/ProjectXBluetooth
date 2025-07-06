// useBLEConnection.ts
import { useState, useCallback } from 'react';
import { PermissionsAndroid } from 'react-native';
import { formatDuration } from './useLiveUptime';

const { BLEModule } = require('react-native').NativeModules;

export default function useBLEConnection(addMessage: (msg: string) => void) {
  const [isConnected, setIsConnected] = useState(false);
  const [connectedAt, setConnectedAt] = useState<Date | null>(null);

  const logConnection = useCallback(() => {
    setConnectedAt(new Date());
    addMessage('Connected');
  }, [addMessage]);

  const logDisconnection = useCallback(() => {
    if (connectedAt) {
      const duration = (Date.now() - connectedAt.getTime()) / 1000;
      const formattedDuration = formatDuration(duration);
      addMessage(`Connected for ${formattedDuration}`);
      setConnectedAt(null);
    } else {
      addMessage('Unable to connect');
    }
  }, [connectedAt, addMessage]);

  const doConnect = useCallback(async () => {
    const granted = await PermissionsAndroid.check(PermissionsAndroid.PERMISSIONS.BLUETOOTH_CONNECT);

    if (!granted) {
      const requested = await PermissionsAndroid.request(
        PermissionsAndroid.PERMISSIONS.BLUETOOTH_CONNECT,
        {
          title: 'Bluetooth Permission',
          message: 'This app needs Bluetooth access to connect to your device.',
          buttonPositive: 'OK',
        },
      );
      if (requested !== PermissionsAndroid.RESULTS.GRANTED) {
        addMessage('❌ Bluetooth permission denied');
        return;
      }
    }

    BLEModule.connectToKnownBLEDevice()
      .then((result: any) => {
        logConnection();
        setIsConnected(true);
        addMessage(`BLE Connect Result: ${result}`);
      })
      .catch((error: any) => addMessage(`${error}`));
  }, [addMessage, logConnection]);

  const disconnectBLE = useCallback(() => {
    if (!isConnected) {
      addMessage('Not connected');
      return;
    }
    addMessage('Disconnecting BLE...');
    BLEModule.disconnectBLE()
      .then((result: any) => {
        addMessage(result);
        setIsConnected(false);
        logDisconnection();
      })
      .catch((error: any) => addMessage(`${error}`));
  }, [isConnected, addMessage, logDisconnection]);

  return {
    isConnected,
    connectedAt,
    doConnect,
    setIsConnected,
    setConnectedAt,
    disconnectBLE,
    logDisconnection,
  };
}

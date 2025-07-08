import { useState, useCallback } from 'react';
import { PermissionsAndroid, NativeModules } from 'react-native';
import { formatDuration } from './useLiveUptime';

const { BLEModule, AudioModule } = NativeModules;

const SERVICE_UUID = '4fafc201-1fb5-459e-8fcc-c5c9c331914b';
const CHARACTERISTIC_UUID = 'beb5483e-36e1-4688-b7f5-ea07361b26a8';

export default function useBLEManager(addMessage: (msg: string) => void) {
  const [isConnected, setIsConnected] = useState(false);
  const [isSubscribed, setIsSubscribed] = useState(false);
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
        }
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
      .catch((error: any) => {
        addMessage(`BLE Connect Error: ${error}`);
        console.error(error);
      });
  }, [addMessage, logConnection]);

  const doUnsubscribe = useCallback(async () => {
    try {
      await BLEModule.unsubscribeFromBLENotifications(SERVICE_UUID, CHARACTERISTIC_UUID);
      setIsSubscribed(false);
    } catch (e) {
      addMessage(`Unsubscribe error: ${e}`);
    }
  }, [addMessage]);

  const disconnectBLE = useCallback(async () => {
    await doUnsubscribe();
    addMessage('Disconnecting BLE...');
    BLEModule.disconnectBLE()
      .then((result: any) => {
        addMessage(result);
        setIsConnected(false);
        setIsSubscribed(false);
        logDisconnection();
      })
      .catch((error: any) => {
        addMessage(`Disconnect error: ${error}`);
      });
  }, [addMessage, doUnsubscribe, logDisconnection]);

  const sendBLEData = useCallback(async (message: string) => {
    try {
      await BLEModule.writeToBLECharacteristic(SERVICE_UUID, CHARACTERISTIC_UUID, message);
      console.log(`Sent via BLE: ${message}`);
    } catch (error) {
      addMessage(`${message}: Send error: ${error}`);
    }
  }, [addMessage]);

  const doSubscribe = useCallback(async () => {
    if(isSubscribed){
      addMessage('Already subscribed');
      return;
    }
    try {
      await BLEModule.subscribeToBLENotifications(SERVICE_UUID, CHARACTERISTIC_UUID);
      AudioModule.playAudio('chime');
      setIsSubscribed(true);
    } catch (e) {
      addMessage(`Subscription error: ${e}`);
    }
  }, [addMessage, isSubscribed]);

  const resetBLE = useCallback(async () => {
    await disconnectBLE();
    await doUnsubscribe();  //?? after disconnecting ??
    setIsConnected(false);
    setIsSubscribed(false);
    setConnectedAt(null);
  }, [disconnectBLE, doUnsubscribe]);

  return {
    isConnected,
    isSubscribed,
    connectedAt,
    doConnect,
    disconnectBLE,
    sendBLEData,
    doSubscribe,
    doUnsubscribe,
    setIsConnected,
    setConnectedAt,
    logDisconnection,
    setIsSubscribed,
    resetBLE,
  };
}

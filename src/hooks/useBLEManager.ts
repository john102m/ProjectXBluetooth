import { useState, useCallback, useEffect, useRef } from 'react';
import { NativeEventEmitter, PermissionsAndroid, NativeModules, Platform } from 'react-native';
import { formatDuration } from './useLiveUptime';
import AsyncStorage from '@react-native-async-storage/async-storage';
const { BLEModule, AudioModule } = NativeModules;
const bleEmitter = new NativeEventEmitter(BLEModule);

const SERVICE_UUID = '4fafc201-1fb5-459e-8fcc-c5c9c331914b';
const CHARACTERISTIC_UUID = 'beb5483e-36e1-4688-b7f5-ea07361b26a8';
const LAST_DEVICE_KEY = 'lastConnectedDeviceAddress';

let isScanning = false;

export default function useBLEManager(addMessage: (msg: string) => void) {
  const [isConnected, setIsConnected] = useState(false);
  const [isSubscribed, setIsSubscribed] = useState(false);
  const [connectedAt, setConnectedAt] = useState<Date | null>(null);

  const [foundDevices, setFoundDevices] = useState<{ name: string; address: string }[]>([]);
  const seenDevicesRef = useRef<Set<string>>(new Set());

  // Clear the found devices list
  const clearFoundDevices = () => {
    setFoundDevices([]);
    seenDevicesRef.current.clear();  // Also clear your 'seenDevices' to allow rediscovery
  };

  useEffect(() => {
    const subscription = bleEmitter.addListener('BLEDeviceFound', (device) => {
      const address = device?.address;
      const name = device?.name || 'Unnamed';
      if (!address || seenDevicesRef.current.has(address)) {
        return;
      }
      seenDevicesRef.current.add(address);
      setFoundDevices(prev => [...prev, { name, address }]);
      addMessage(`📡 ${name} - ${address}`);
    });

    return () => subscription.remove();
  }, [addMessage]);

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

  const doConnect = useCallback(async (address: string) => {
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

    try {
      const result = await BLEModule.connectToBLEDevice(address);
      logConnection();
      setIsConnected(true);
      addMessage(`BLE Connect Result: ${result}`);

      // Persist last connected device on success
      console.log('Saving last device address: ', address);
      await AsyncStorage.setItem(LAST_DEVICE_KEY, address);
    } catch (error) {
      addMessage(`BLE Connect Error: ${error}`);
      console.error(error);
    }
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
    if (isSubscribed) {
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

  async function requestPermissions() {
    if (Platform.OS !== 'android') {
      return true; // iOS handles differently
    }

    // Android 12+ requires BLUETOOTH_SCAN, BLUETOOTH_CONNECT, and ACCESS_FINE_LOCATION
    if (Platform.Version >= 31) {
      const permissionsToRequest = [
        PermissionsAndroid.PERMISSIONS.BLUETOOTH_SCAN,
        PermissionsAndroid.PERMISSIONS.BLUETOOTH_CONNECT,
        PermissionsAndroid.PERMISSIONS.ACCESS_FINE_LOCATION,
      ];

      // Check each permission first
      for (const permission of permissionsToRequest) {
        const hasPermission = await PermissionsAndroid.check(permission);
        if (!hasPermission) {
          const granted = await PermissionsAndroid.request(permission, {
            title: 'Bluetooth Permission',
            message: 'This app needs Bluetooth permissions to scan and connect devices',
            buttonPositive: 'OK',
          });
          if (granted !== PermissionsAndroid.RESULTS.GRANTED) {
            return false; // permission denied
          }
        }
      }
    } else {
      // For Android < 12, only location permission is required for BLE scan
      const hasLocationPermission = await PermissionsAndroid.check(
        PermissionsAndroid.PERMISSIONS.ACCESS_FINE_LOCATION
      );
      if (!hasLocationPermission) {
        const granted = await PermissionsAndroid.request(
          PermissionsAndroid.PERMISSIONS.ACCESS_FINE_LOCATION,
          {
            title: 'Location Permission',
            message: 'This app needs location permission to scan Bluetooth devices',
            buttonPositive: 'OK',
          }
        );
        if (granted !== PermissionsAndroid.RESULTS.GRANTED) {
          return false;
        }
      }
    }

    return true; // all permissions granted
  }
  const stopBLEScan = useCallback(() => {
    try {
      BLEModule.stopBLEScan();
      addMessage('🛑 Stopped BLE scan');
    } catch (error) {
      addMessage(`Stop scan error: ${error}`);
    }
  }, [addMessage]);

  const scanBLEDevices = useCallback(async () => {
    if (isScanning) {
      addMessage('Scan already in progress');
      return;
    }
    isScanning = true;

    const hasPermissions = await requestPermissions();
    if (!hasPermissions) {
      console.warn('Permissions denied. Cannot scan.');
      return;
    }

    try {
      await BLEModule.scanBLEDevices();
      addMessage('🔍 BLE scan started...');

      setTimeout(() => {
        stopBLEScan();
      }, 7000);
    } catch (error) {
      addMessage(`Scan failed: ${error}`);
      return null;
    } finally {
      isScanning = false;
    }
  }, [addMessage, stopBLEScan]);



  const resetBLE = useCallback(async () => {
    await doUnsubscribe();
    await disconnectBLE();

    setIsConnected(false);
    setIsSubscribed(false);
    setConnectedAt(null);
  }, [disconnectBLE, doUnsubscribe]);

  return {
  connection: {
    isConnected,
    setIsConnected,
    connectedAt,
    setConnectedAt,
    doConnect,
    disconnectBLE,
    logDisconnection,
  },
  subscription: {
    isSubscribed,
    setIsSubscribed,
    doSubscribe,
    doUnsubscribe,
    sendBLEData,
  },
  scanning: {
    scanBLEDevices,
    stopBLEScan,
    foundDevices,
    //setFoundDevices,
    clearFoundDevices,
  },
  resetBLE,
  };
}

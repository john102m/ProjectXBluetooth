/* eslint-disable react-native/no-inline-styles */
import React, { useRef, useEffect, useState } from 'react';
import { SafeAreaView, ScrollView, View, Text, PermissionsAndroid, TouchableOpacity } from 'react-native';
import { Platform, StatusBar, NativeModules, StyleSheet, DeviceEventEmitter } from 'react-native';
import CustomButton from './src/CustomButton';
import notifee, { EventType, AndroidImportance } from '@notifee/react-native';

const { AudioModule, BluetoothModule, BLEModule } = NativeModules;

// interface BluetoothDevice {
//   id: string;
//   name: string;
// }

//Add event type discrimination
type BleEvent = {
  origin: 'native' | 'esp32';
  message: string;
  status?: string;
  // other relevant fields
};

async function displayNotification(newMessage: string) {
  const channelId = await notifee.createChannel({
    id: 'default',
    name: 'Default Channel',
    importance: AndroidImportance.HIGH,
  });

  await notifee.displayNotification({
    id: 'low_battery_alert', // Unique ID for tracking
    title: 'ESP32C3',
    body: newMessage,
    android: {
      channelId,
    },
  });
}

// Call this once (e.g., in your App.tsx or root component)
function setupNotificationListeners(resetAlert: () => void) {
  notifee.onForegroundEvent(({ type, detail }) => {
    if (type === EventType.DISMISSED && detail.notification?.id === 'low_battery_alert') {
      console.log('User dismissed notification', detail.notification);
      resetAlert(); // Reset when dismissed
    }
  });

  // For background/quit state (optional)
  notifee.onBackgroundEvent(async ({ type, detail }) => {
    if (type === EventType.DISMISSED && detail.notification?.id === 'low_battery_alert') {
      console.log('User dismissed notification while app was in background');
      resetAlert(); // Reset when dismissed
    }
    return Promise.resolve(); // Required for background events
  });
}

// const requestBluetoothPermissions = async () => {
//   try {
//     const granted = await PermissionsAndroid.requestMultiple([
//       PermissionsAndroid.PERMISSIONS.BLUETOOTH_CONNECT,
//       PermissionsAndroid.PERMISSIONS.BLUETOOTH_SCAN,
//     ]);

//     if (granted['android.permission.BLUETOOTH_CONNECT'] === PermissionsAndroid.RESULTS.GRANTED) {
//       console.log('Bluetooth permissions granted!');
//     } else {
//       console.error('Bluetooth permissions denied!');
//     }
//   } catch (error) {
//     console.error('Error requesting Bluetooth permissions:', error);
//   }
// };

const App = () => {

  const [isSubscribed, setIsSubscribed] = useState(false);
  const [isConnected, setIsConnected] = useState(false);
  //const [enabled, setEnabled] = useState(false);
  const [counter, setCounter] = useState(0);
  //const [devices, setDevices] = useState([]);
  //const [selectedDevice, setSelectedDevice] = useState<BluetoothDevice | null>(null);
  const [messages, setMessages] = useState<string[]>([]);

  const SERVICE_UUID = '4fafc201-1fb5-459e-8fcc-c5c9c331914b';
  const CHARACTERISTIC_UUID = 'beb5483e-36e1-4688-b7f5-ea07361b26a8';
  //const MAX_RECONNECTION_ATTEMPTS = 5;
  const VOLTAGE_WARNING_THRESHOLD = 1.4;
  //const VOLTAGE_RECOVERY_THRESHOLD = 1.45;

  const hasAlerted = useRef(false);
  const scrollRef = useRef<ScrollView>(null);

  // 2. Create reset function
  const resetAlert = () => {
    hasAlerted.current = false;
    console.log('Alert state reset');
  };

  const [log, setLog] = useState<string[]>([]);
  const [connectedAt, setConnectedAt] = useState<Date | null>(null);

  const logEvent = (message: string) => {
    const timestamp = new Date().toLocaleTimeString();
    setLog(prev => [...prev.slice(-19), `${timestamp} - ${message}`]); // keep last 20 logs
  };
  const logConnection = () => {
    setConnectedAt(new Date());
    logEvent('Connected');
  };

  const logDisconnection = () => {
    if (connectedAt) {
      const duration = (Date.now() - connectedAt.getTime()) / 1000;
      logEvent(`Disconnected (session ${duration.toFixed(1)}s)`);
      addMessage(`Disconnected (session ${duration.toFixed(1)}s)`);
      setConnectedAt(null);
    } else {
      logEvent('Disconnected');
    }
  };


  const addMessage = (newMessage: string) => {
    console.log(newMessage);
    setMessages((prev) => [...prev.slice(-19), newMessage]); // Append new message  keep last 20
  };

  const checkBluetooth = async () => {
    try {
      const status = await BluetoothModule.isBluetoothAvailable();
      //setEnabled(status);
      console.log(status);
    } catch (error) {
      console.error('Error checking Bluetooth:', error);
    }
  };

  // const enableBluetooth = async () => {
  //   try {
  //     await BluetoothModule.enableBluetooth();
  //     setEnabled(true);
  //   } catch (error) {
  //     console.error('Error enabling Bluetooth:', error);
  //   }
  // };

  // const scanForDevices = async () => {
  //   try {
  //     await requestBluetoothPermissions();
  //     const foundDevices = await BluetoothModule.scanDevices();
  //     console.log('Scanned Devices:', foundDevices);
  //     setDevices(foundDevices);
  //   } catch (error) {

  //     addMessage(`Error scanning for devices: ${error}`);
  //   }
  // };

  // const sendBluetoothMessage = async (message: string) => {
  //   try {
  //     await BluetoothModule.sendData(message);
  //     console.log('Sent:', message);
  //   } catch (error) {
  //     console.log('Error sending Bluetooth message:', error);
  //   }
  // };
  // const connectToSelectedDevice = async () => {
  //   console.log('Connecting via module..........');
  //   if (!selectedDevice) {
  //     addMessage('No device selected!');
  //     return;
  //   }

  //   try {
  //     await BluetoothModule.connectToDevice(selectedDevice.id);
  //     console.log(`Connected to ${selectedDevice.name}`);
  //     BluetoothModule.startListeningForData();
  //   } catch (error) {
  //     addMessage(`Error connecting to device: ${error}`);
  //   }
  // };
  // const setDevice = (item: any) => {
  //   setSelectedDevice(item);
  //   addMessage(`Selected: ${item.name}`);
  // };

  const doSubscribe = async () => {
    if (isSubscribed) {
      addMessage('Already subscribed');
      return;
    }
    BLEModule.subscribeToBLENotifications(SERVICE_UUID, CHARACTERISTIC_UUID)
      .then(() => {
        addMessage('Subscribed to BLE notifications');
        AudioModule.playAudio('chime'); //.catch((error: any) => addMessage(`${error}`));
        setIsSubscribed(true);
        //displayNotification('Subscribed');
      })
      .catch((error: any) => addMessage(`BLE Subscription Error: ${error}`));
  };

  const doConnect = async () => {
    if (isConnected) {
      addMessage('Already connected');
      return;
    }
    BLEModule.connectToKnownBLEDevice()
      .then((result: any) => {
        logConnection();
        setIsConnected(true);
        addMessage(`BLE Connect Result: ${result}`);
      })
      .catch((error: any) => addMessage(`BLE Error: ${error}`));
  };

  async function requestPermission() {
    if (Platform.OS === 'android' && Number(Platform.Version) >= 33) {
      const granted = await PermissionsAndroid.request(PermissionsAndroid.PERMISSIONS.POST_NOTIFICATIONS);
      if (granted !== PermissionsAndroid.RESULTS.GRANTED) {
        console.warn('Notification permission not granted');
      }
    }
    await notifee.requestPermission();
  }
  const parseBleMessage = (message: string): { voltage: string; rssi: string } => {
    const vMatch = message.match(/V([\d.]+)/);
    const rMatch = message.match(/R(-?\d+)/);

    const voltage = vMatch ? `${vMatch[1]} V` : 'Voltage: Unknown';
    const rssi = rMatch ? `${rMatch[1]} dBm` : 'RSSI: Unknown';

    return { voltage, rssi };
  };

  function handleDisconnection() {
    setDisconnected();
    AudioModule.playAudio('bing_bong');
  }
  function handleCharacteristicFound() {
    addMessage('Characteristic found!');
    doSubscribe();
  }

  function handleFullCharge() {
    //displayNotification('Battery fully charged');
    addMessage('Battery fully charged');
    //logEvent('Battery fully charged');
  }
  //Separate message processing
  function processDeviceMessage(message: string) {
    if (message.includes('Not Charging')) {
      handleFullCharge();
      return;
    }
    const { voltage, rssi } = parseBleMessage(message);
    if (voltage.includes('Unknown') || rssi.includes('Unknown')) {
      addMessage(message.trim() === '' ? 'Awaiting data...' : message); // Fallback for unparseable messages
      return;
    }

    addMessage(`Voltage: ${voltage}, RSSI: ${rssi}`);

    const volts = parseFloat(voltage);
    if (isNaN(volts)) {
      console.error('Invalid voltage reading');
      return;
    }

    // Reset alert if voltage recovers
    // if (volts > VOLTAGE_RECOVERY_THRESHOLD && hasAlerted.current) {
    //   resetAlert();
    // }

    // Trigger low battery warning
    if (volts < VOLTAGE_WARNING_THRESHOLD && !hasAlerted.current) {
      logEvent('Low voltage detected!');
      if (counter < 2) { // need TWO low voltage warnings to trigger alarm
        setCounter(prev => prev + 1);

      } else {
        setCounter(0);
        hasAlerted.current = true;
        AudioModule.playAudio('bing_bong');
        displayNotification('Low Battery!')
          .then(() => console.log('Notification shown'))
          .catch(e => console.error('Notification failed', e));
      }
    }
  }

  useEffect(() => {
    console.log('you are here');
    requestPermission();
    checkBluetooth();
    setupNotificationListeners(resetAlert);
    doConnect();

    let bleSubscription = DeviceEventEmitter.addListener('BluetoothNotification', (event: BleEvent) => {
      console.log(`Received ${event.origin} notification:`, event.message ?? event.status);
      scrollRef.current?.scrollToEnd({ animated: true });

      // Handle disconnections
      if (String(event.status).includes('Disconnected')) {
        handleDisconnection();
        return;
      } else if (String(event.status).includes('Characteristic found!')) {
        handleCharacteristicFound();
        return;
      }

      // Otherwise process the message
      //const strMessage = String(event?.message) || '';
      const strMessage = event?.message != null ? String(event.message) : '';
      processDeviceMessage(strMessage);

    });

    return () => {
      bleSubscription.remove();
      setIsSubscribed(false);
      BLEModule.unsubscribeFromBLENotifications(SERVICE_UUID, CHARACTERISTIC_UUID);
    };// Cleanup on unmount
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const sendBLEData = async (message: string) => {
    try {
      await BLEModule.writeToBLECharacteristic(SERVICE_UUID, CHARACTERISTIC_UUID, message);
      console.log(`Sent via BLE: ${message}`);

    } catch (error) {
      addMessage(`Error sending BLE message: ${error}`);
    }
  };

  const setDisconnected = () => {
    setIsSubscribed(false);
    setIsConnected(false);
    logDisconnection();
  };

  const disconnectBLE = () => {
    if (!isConnected) {
      addMessage('Not connected');
      return;
    }
    addMessage('disconnecting BLE.....');
    BLEModule.disconnectBLE()
      .then((result: any) => {
        addMessage(result);
        setDisconnected();
      })
      .catch((error: any) => addMessage(error));
    //setSelectedDevice(null);
  };

  return (
    <SafeAreaView style={{ flex: 1 }}>
      <StatusBar translucent={true} backgroundColor="transparent" />
      <View style={{ flex: 1, paddingTop: StatusBar.currentHeight }}>
        <Text style={{ paddingLeft: 19, paddingTop: 5 }}>BLE: {isConnected ? 'Connected' : 'Disconnected'}{isSubscribed ? ', subscribed' : ''}</Text>
        <View style={{ margin: 20, padding: 10, backgroundColor: '#eee', height: 150 }}>
          <Text style={{ fontSize: 16, fontWeight: 'bold' }}>Console Messages:</Text>
          <ScrollView style={{ maxHeight: 120 }} ref={scrollRef}>
            {messages.map((msg, index) => (
              <Text key={index}>{msg}</Text>
            ))}
          </ScrollView>
        </View>
        <View style={styles.buttonGroup}>
          <View style={styles.buttonRow}>
            <CustomButton
              title="Connect BLE"
              onPress={doConnect}
              color="#FF5733"
            />
            <CustomButton
              title="Subscribe BLE"
              onPress={doSubscribe}
              color="#FF5733"
            />
          </View>
          <View style={styles.buttonRow}>
            <CustomButton
              title="BLE LED ON"
              onPress={() => sendBLEData('LED_ON')}
              color="#005733"
            />
            <CustomButton
              title="BLE LED OFF"
              onPress={() => sendBLEData('LED_OFF')}
              color="#005733"
            />

          </View>
          <View style={styles.buttonRow}>
            <CustomButton
              title="Disconnect BLE"
              onPress={() => disconnectBLE()}
              color="#005733"
            />
          </View>
        </View>
        <View style={{ flex: 1, justifyContent: 'flex-end', padding: 20, paddingBottom: 50 }}>
          <Text style={{ fontWeight: 'bold' }}>Connection Log:</Text>
          <ScrollView style={{ maxHeight: 150 }}>
            {log.map((entry, index) => (
              <Text key={index} style={{ fontSize: 12 }}>{entry}</Text>
            ))}
          </ScrollView>
        </View>
      </View>
    </SafeAreaView>
  );
};

export default App;

// Add styles
const styles = StyleSheet.create({
  buttonContainer: {
    flexDirection: 'row', // Arrange buttons horizontally
    justifyContent: 'space-evenly', // Evenly distribute buttons
    marginVertical: 10, // Add vertical spacing
  },
  textStyle: {
    padding: 10,
    fontSize: 16,
  },
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

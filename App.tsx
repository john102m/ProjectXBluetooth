/* eslint-disable react-native/no-inline-styles */
import React, { useRef, useEffect, useState } from 'react';
import { SafeAreaView, ScrollView, View, Text, PermissionsAndroid, TouchableOpacity } from 'react-native';
import { Platform, StatusBar, NativeModules, StyleSheet, DeviceEventEmitter } from 'react-native';
import CustomButton from './src/CustomButton';
import notifee, { AndroidImportance } from '@notifee/react-native';

const { AudioModule, BluetoothModule, BLEModule } = NativeModules;

interface BluetoothDevice {
  id: string;
  name: string;
}

async function displayNotification(newMessage: string) {
  const channelId = await notifee.createChannel({
    id: 'default',
    name: 'Default Channel',
    importance: AndroidImportance.HIGH,
  });

  await notifee.displayNotification({
    title: 'ESP32C3',
    body: newMessage,
    android: {
      channelId,
    },
  });
}

const requestBluetoothPermissions = async () => {
  try {
    const granted = await PermissionsAndroid.requestMultiple([
      PermissionsAndroid.PERMISSIONS.BLUETOOTH_CONNECT,
      PermissionsAndroid.PERMISSIONS.BLUETOOTH_SCAN,
    ]);

    if (granted['android.permission.BLUETOOTH_CONNECT'] === PermissionsAndroid.RESULTS.GRANTED) {
      console.log('Bluetooth permissions granted!');
    } else {
      console.error('Bluetooth permissions denied!');
    }
  } catch (error) {
    console.error('Error requesting Bluetooth permissions:', error);
  }
};

const App = () => {

  const [enabled, setEnabled] = useState(false);
  const [devices, setDevices] = useState([]);
  const [selectedDevice, setSelectedDevice] = useState<BluetoothDevice | null>(null);
  const [messages, setMessages] = useState<string[]>([]);
  const scrollRef = useRef<ScrollView>(null);
  const SERVICE_UUID = '4fafc201-1fb5-459e-8fcc-c5c9c331914b';
  const CHARACTERISTIC_UUID = 'beb5483e-36e1-4688-b7f5-ea07361b26a8';
  const MAX_RECONNECTION_ATTEMPTS = 5;

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
    setMessages((prevMessages) => [...prevMessages, newMessage]); // Append new message
  };

  const checkBluetooth = async () => {
    try {
      const status = await BluetoothModule.isBluetoothAvailable();
      setEnabled(status);
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

  const sendBluetoothMessage = async (message: string) => {
    try {
      await BluetoothModule.sendData(message);
      console.log('Sent:', message);
    } catch (error) {
      console.log('Error sending Bluetooth message:', error);
    }
  };
  const connectToSelectedDevice = async () => {
    console.log('Connecting via module..........');
    if (!selectedDevice) {
      addMessage('No device selected!');
      return;
    }

    try {
      await BluetoothModule.connectToDevice(selectedDevice.id);
      console.log(`Connected to ${selectedDevice.name}`);
      BluetoothModule.startListeningForData();
    } catch (error) {
      addMessage(`Error connecting to device: ${error}`);
    }
  };
  const setDevice = (item: any) => {
    setSelectedDevice(item);
    addMessage(`Selected: ${item.name}`);
  };

  const doSubscribe = async () => {
    BLEModule.subscribeToBLENotifications(SERVICE_UUID, CHARACTERISTIC_UUID)
      .then(() => {
        addMessage('Subscribed to BLE notifications');
        AudioModule.playAudio('chime'); //.catch((error: any) => addMessage(`${error}`));
        //displayNotification('Subscribed');
      })
      .catch((error: any) => addMessage(`BLE Subscription Error: ${error}`));
  };

  const doConnect = async () => {
    BLEModule.connectToKnownBLEDevice()
      .then((result: any) => {
        logConnection();
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

  useEffect(() => {
    console.log('you are here');
    requestPermission();
    checkBluetooth();
    doConnect();

    console.log(DeviceEventEmitter);

    let bleSubscription = DeviceEventEmitter.addListener('BluetoothNotification', (message) => {

      //const timestamp = new Date().toLocaleTimeString();
      console.log('Received BLE Notification:', message);
      scrollRef.current?.scrollToEnd({ animated: true });

      if (String(message.status).includes('Disconnected')) {
        logDisconnection();
        AudioModule.playAudio('bing_bong');
        // setTimeout(() => {
        //   addMessage('Attempting to reconnect after 2 seconds');
        //   doConnect();
        // }, 2000); // 2000ms = 2 seconds
      }

      const strMessage = String(message?.message) || '';
      if (strMessage.includes('Characteristic found!')) {
        addMessage('Characteristic found!');
        doSubscribe();
      } else if (strMessage.includes('Not Charging')) {
        //displayNotification('Battery fully charged');
        addMessage('Battery fully charged');
      } else {
        const { voltage, rssi } = parseBleMessage(strMessage);
        addMessage(`Voltage: ${voltage}`); // Voltage: 2.18 V
        addMessage(`RSSI: ${rssi}`);
      }
      // if ('message' in message) {
      //   addMessage(message.message);  // Store the raw notification message in your chat/messages
      // }

    });

    // Listen for Bluetooth Classic messages
    const subscription = DeviceEventEmitter.addListener('BluetoothData', (message) => {
      addMessage(message);
    });
    //BluetoothModule.startListeningForData();

    return () => {
      subscription.remove();
      bleSubscription.remove();
      BLEModule.unsubscribeFromBLENotifications(SERVICE_UUID, CHARACTERISTIC_UUID);
    };// Cleanup on unmount
  }, []);

  const sendBLEData = async (message: string) => {
    try {
      await BLEModule.writeToBLECharacteristic(SERVICE_UUID, CHARACTERISTIC_UUID, message);
      console.log(`Sent via BLE: ${message}`);

    } catch (error) {
      addMessage(`Error sending BLE message: ${error}`);
    }
  };

  const disconnectBLE = () => {
    addMessage('disconnecting BLE.....');
    BLEModule.disconnectBLE()
      .then((result: any) => addMessage(result))
      .catch((error: any) => addMessage(error));

    setSelectedDevice(null);
  };

  return (
    <SafeAreaView style={{ flex: 1 }}>
      <StatusBar translucent={true} backgroundColor="transparent" />
      <View style={{ flex: 1, paddingTop: StatusBar.currentHeight }}>
        <Text style={{ paddingLeft: 19, paddingTop: 5 }}>Bluetooth Status: {enabled ? 'Enabled' : 'Disabled'}</Text>
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
              title="Turn LED ON"
              onPress={() => sendBluetoothMessage('LED_ON')}
              color="#FF5733"
            />
            <CustomButton
              title="Turn LED OFF"
              onPress={() => sendBluetoothMessage('LED_OFF')}
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
        <View style={{ flex: 1, justifyContent: 'flex-end', padding: 10 }}>
          <Text style={{ fontWeight: 'bold' }}>Connection Log:</Text>
          <ScrollView style={{ maxHeight: 150 }}>
            {log.map((entry, index) => (
              <Text key={index} style={{ fontSize: 12 }}>{entry}</Text>
            ))}
          </ScrollView>
        </View>

        {selectedDevice && (
          <CustomButton title="Connect" onPress={connectToSelectedDevice} color="#FF5733" />
        )}
        <ScrollView style={{ maxHeight: 200 }}>
          {devices.map((item: any) => (
            <TouchableOpacity key={item.id} onPress={() => setDevice(item)}>
              <Text style={styles.textStyle}>
                {item.name} ({item.id})
              </Text>
            </TouchableOpacity>
          ))}
        </ScrollView>
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

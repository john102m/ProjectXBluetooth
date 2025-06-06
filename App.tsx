/* eslint-disable react-native/no-inline-styles */
import React, { useRef, useEffect, useState } from 'react';
import { ScrollView, View, Text, PermissionsAndroid, TouchableOpacity } from 'react-native';
import { NativeModules, StyleSheet, DeviceEventEmitter } from 'react-native';
import CustomButton from './src/CustomButton';

interface BluetoothDevice {
  id: string;
  name: string;
}

const { BluetoothModule, BLEModule } = NativeModules;

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

  const enableBluetooth = async () => {
    try {
      await BluetoothModule.enableBluetooth();
      setEnabled(true);
    } catch (error) {
      console.error('Error enabling Bluetooth:', error);
    }
  };

  const scanForDevices = async () => {
    try {
      await requestBluetoothPermissions();
      const foundDevices = await BluetoothModule.scanDevices();
      console.log('Scanned Devices:', foundDevices);
      setDevices(foundDevices);
    } catch (error) {

      addMessage(`Error scanning for devices: ${error}`);
    }
  };

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

  const ConnectSubscribe = async () => {
    BLEModule.connectToKnownBLEDevice()
      .then((result: any) => {
        console.log('BLE Connect Result:', result);
        // ✅ Wait for BLE connection state before subscribing
        setTimeout(() => {
          BLEModule.subscribeToBLENotifications(SERVICE_UUID, CHARACTERISTIC_UUID)
            .then(() => addMessage('Subscribed to BLE notifications'))
            .catch((error: any) => addMessage(`BLE Subscription Error: ${error}`));
        }, 1000);  // Delay to ensure connection is fully established
      })
      .catch((error: any) => addMessage(`BLE Error: ${error}`));
  };


  useEffect(() => {
    console.log('you are here');
    checkBluetooth();
    ConnectSubscribe();

    console.log(DeviceEventEmitter);

    let bleSubscription = DeviceEventEmitter.addListener('BluetoothNotification', (message) => {
      console.log('Received BLE Notification:', message);
      scrollRef.current?.scrollToEnd({ animated: true });
      addMessage(message.message);  // Store the notification in your chat/messages
    });

    // Listen for Bluetooth Classic messages
    const subscription = DeviceEventEmitter.addListener('BluetoothData', (message) => {
      addMessage(message);
    });
    BluetoothModule.startListeningForData();

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
    var message = 'disconnecting BLE.....';
    addMessage(message);
    BLEModule.disconnectBLE()
      .then((result: any) => {
        console.log(result);
      })
      .catch((error: any) => console.log(error));
    setSelectedDevice(null);
  };

  return (
    <View>
      <Text>Bluetooth Status: {enabled ? 'Enabled' : 'Disabled'}</Text>
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
            onPress={ConnectSubscribe}
            color="#FF5733"
          />
          <CustomButton
            title="Scan Devices"
            onPress={scanForDevices}
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

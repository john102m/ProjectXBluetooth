/* eslint-disable react-native/no-inline-styles */
import React, { useState } from 'react';
import { SafeAreaView, FlatList, Text, View } from 'react-native';
import ControlPanel from '../components/ControlPanel';
import { useNavigation } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import type { RootStackParamList } from '../types/navigation'; // adjust path as needed
import StatusBanner from '../components/StatusBanner';
import { useBLE } from '../context/BLEContext';
type ScanNavProp = NativeStackNavigationProp<RootStackParamList, 'ConnectScreen'>;

const ConnectScreen = () => {
  const [selectedDevice, setSelectedDevice] = useState<string | null>(null);
  const navigation = useNavigation<ScanNavProp>();
  const { ble } = useBLE();

  const {
    isConnected,
    isSubscribed,
    isPizzaMode,
    lightThresholdRef,
    chargingStatus,
    doConnect,
    disconnectBLE,
    doSubscribe,
    scanBLEDevices,
    stopBLEScan,
    uptime,
    foundDevices,
    //setFoundDevices,
  } = ble;


  return (
    <SafeAreaView style={{ flex: 1 }}>
      <StatusBanner
        visible={isPizzaMode}
        threshold={lightThresholdRef.current}
        uptime={uptime}
        chargingStatus={chargingStatus}
      />

      <ControlPanel
        isConnected={isConnected}
        isSubscribed={isSubscribed}
        onConnect={doConnect}
        onDisconnect={disconnectBLE}
        onSubscribe={doSubscribe}
        onScanBLEDevices={() => {
          //setFoundDevices([]);
          scanBLEDevices();
        }
        }
        onStopBLEScan={stopBLEScan}
        onScreenAction={{
          action: () => navigation.goBack(),
          label: 'Home',
        }}
      />
      <View style={{ flex: 1, padding: 25 }}>
        {foundDevices.length > 0 && (
          <Text style={{ fontWeight: 'bold', paddingBottom: 14, marginTop: 0, marginLeft: 8 }}>
            🔍 Found Devices: {foundDevices.length}
          </Text>
        )}

        <FlatList
          data={foundDevices}
          keyExtractor={(item) => item.address}
          renderItem={({ item }) => {
            const isSelected = item.address === selectedDevice;

            return (
              <View
                style={{
                  padding: 8,
                  borderBottomWidth: 1,
                  borderBottomColor: '#ccc',
                  backgroundColor: isSelected ? '#cce5ff' : '#fff', // highlight color
                }}
              >
                <Text
                  style={{ fontWeight: isSelected ? 'bold' : 'normal' }}
                  onPress={() => setSelectedDevice(item.address)}
                >
                  {item.name}
                </Text>
                <Text style={{ fontSize: 12, color: '#666' }}>{item.address}</Text>
              </View>
            );
          }}
        />


      </View>
    </SafeAreaView>

  );
};

export default ConnectScreen;

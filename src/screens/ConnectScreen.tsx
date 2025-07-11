/* eslint-disable react-native/no-inline-styles */
import React, { useState } from 'react';
import { SafeAreaView, FlatList, Text, View } from 'react-native';
import ControlPanelGeneric from '../components/ControlPanelGeneric';
import AutoConnectToggle from '../components/AutoConnectToggle';
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
    autoModeRef,
    chargingStatus,
    doConnect,
    disconnectBLE,
    shouldAutoConnect,
    setShouldAutoConnect,
    doSubscribe,
    scanBLEDevices,
    stopBLEScan,
    uptime,
    foundDevices,
    clearFoundDevices,
    //setFoundDevices,
  } = ble;


  // useEffect(() => {
  //   clearFoundDevices();
  //   return () => clearFoundDevices();
  // // eslint-disable-next-line react-hooks/exhaustive-deps
  // }, []);

  return (
    <SafeAreaView style={{ flex: 1 }}>
      <StatusBanner
        visible={isPizzaMode}
        threshold={lightThresholdRef.current}
        autoMode={autoModeRef.current}
        uptime={uptime}
        chargingStatus={chargingStatus}
      />

      <ControlPanelGeneric
        context={{ isConnected, isSubscribed }}
        buttons={[
          {
            label: 'Connect',
            action: () => {
              if (selectedDevice) {
                doConnect(selectedDevice);
              } else {
                console.warn('No device selected.');
              }
            },
            animated: true,
            color: '#FF5733',
            disabled: (ctx) => !!ctx.isConnected || !selectedDevice,
            row: 0,
            col: 0,
          },
          {
            label: 'Disconnect',
            action: () => {
              setShouldAutoConnect(false); // 👈 prevent auto-connect after manual disconnect
              disconnectBLE();
            },
            color: '#005733',
            disabled: !isConnected,
            row: 0,
            col: 1,
          },
          {
            label: 'Start Scan',
            action: () => {
              clearFoundDevices();
              scanBLEDevices();
            },
            animated: true,
            color: '#FFA00F',
            row: 1, col: 0,
          },
          { label: 'Stop Scan', action: stopBLEScan, animated: true, color: '#FFA00F', row: 1, col: 1 },
          { label: 'Back', action: navigation.goBack, color: '#00AAFF', row: 2, col: 0 },
          { label: 'Subscribe', action: doSubscribe, color: '#FFA00F', disabled: ((ctx) => ctx.isSubscribed || !ctx.isConnected), row: 2, col: 1 },
        ]}
      />
      <AutoConnectToggle
        shouldAutoConnect={shouldAutoConnect}
        setShouldAutoConnect={setShouldAutoConnect}
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

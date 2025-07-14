/* eslint-disable react-native/no-inline-styles */
import React, { useState, useEffect, useCallback } from 'react';
import { SafeAreaView, View } from 'react-native';
import SystemStatus from '../components/SystemStatus';
import StatusBanner from '../components/StatusBanner';
import ControlPanelGeneric from '../components/ControlPanelGeneric';
import PizzaAlertModal from '../components/PizzaAlertModal';
import ThresholdModal from '../components/ThresholdModal';
import { useNavigation } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import type { RootStackParamList } from '../../src/types/navigation';
import { useBLE } from '../context/BLEContext';

type HomeNavProp = NativeStackNavigationProp<RootStackParamList, 'Home'>;

// ✅ Place this after imports, before HomeScreen

// good for binding static parameters
export const wrap = <T,>(fn: (val: T) => void, param: T): (() => void) => {
  return () => fn(param);
};
export const wrapAsync = <T,>(fn: (val: T) => Promise<void>, param: T): (() => Promise<void>) => {
  return () => fn(param);
};

// usage:  { label: 'Send PING', action: wrapAsync(sendBLEDataAsync, 'PING'), row: 1, col: 1 }

const HomeScreen = () => {

  const navigation = useNavigation<HomeNavProp>();
  const [inputValue, setInputValue] = useState('');

  const { ble, modals } = useBLE();

  const {
    connection: {
      isConnected,
      connectedAt,
      doConnect,
      voltage,
      rssi,
    },
    subscription: {
      isSubscribed,
      sendBLEData,
      messages,
    },

    deviceStatus: {
      chargingStatus,
      setIsPizzaMode,
      isPizzaMode,
      lightLevel,
      lightThresholdRef,

    },
    context: {
      autoModeRef,
      uptime,
      shouldAutoConnect,
      lastConnectedDevice,
      savedThresholdValue,
      setSavedThresholdValue,
    },


  } = ble;

  const {
    showModal,
    hideModal,
    isModalVisible,
    modalType,
    modalProps,
  } = modals;

  useEffect(() => {
    console.log('🍕 modalType:', modalType);
    console.log('🍕 isModalVisible:', isModalVisible);
  }, [modalType, isModalVisible]);

  useEffect(() => {
    console.log('👀 shouldAutoConnect is now:', shouldAutoConnect);
  }, [shouldAutoConnect]);

  useEffect(() => {
    if (!isConnected && isPizzaMode) {
      setIsPizzaMode(false); // 🔧 auto-reset Pizza Mode
    }
  }, [isConnected, isPizzaMode, setIsPizzaMode]);

  //Use useFocusEffect from @react-navigation/native to kick off BLE actions when a screen becomes active.
  //Persist connection state between screens using either React Context or a global store like Zustand or Redux.
  //Consider conditional rendering if the device isn’t connected — e.g., hide ControlScreen until connected.


  useEffect(() => {
    //const savedAddress = '94:A9:90:48:02:FA'; // 🧠 Could come from storage later
    console.log('Last connected device: ', lastConnectedDevice ?? 'Not found');
    console.log('Last saved threshold: ', savedThresholdValue ?? 'Not found');
    if (!isConnected && lastConnectedDevice && shouldAutoConnect) {
      doConnect(lastConnectedDevice);
    }
  }, [doConnect, isConnected, lastConnectedDevice, savedThresholdValue, shouldAutoConnect]);

  const handleThresholdOpen = useCallback(() => {
    showModal('threshold');
  }, [showModal]);

  const pizzaModeButtonAction = () => {
    const nextMode = !isPizzaMode;
    setIsPizzaMode(nextMode);
    sendBLEData(nextMode ? 'P_MODE_ON' : 'P_MODE_OFF');
  };


  const thresholdSavedAction = () => {
    const parsed = parseFloat(inputValue);
    if (!isNaN(parsed)) {
      lightThresholdRef.current = parsed;
      setSavedThresholdValue(`${inputValue}`);
      if (isConnected) {
        if (autoModeRef.current) {
          // Send as percentage multiplier e.g. "CALC80" = 80%
          sendBLEData(`CALC${inputValue}`);
        } else {
          // Normal manual threshold
          sendBLEData(`LEVEL${inputValue}`);
        }
      }
    }

    setInputValue(lightThresholdRef.current.toString());
    hideModal();

  };

  return (
    <> {/* These show the modals when visible */}
      {modalType === 'threshold' && (
        <ThresholdModal
          visible={isModalVisible}
          inputValue={inputValue}
          savedValue={parseInt(savedThresholdValue ?? '90', 10)}
          onChangeInput={setInputValue}
          onSave={thresholdSavedAction}
          onClose={() => {
            setInputValue('');
            hideModal();
          }}
          isAutoMode={autoModeRef.current}
        />
      )}

      {modalType === 'pizza' && (
        <PizzaAlertModal
          visible={isModalVisible}
          {...modalProps}
        />
      )}
      <SafeAreaView style={{ flex: 1 }}>
        <StatusBanner
          visible={isPizzaMode}
          threshold={lightThresholdRef.current}
          autoMode={autoModeRef.current}
          uptime={uptime}
          chargingStatus={chargingStatus}
        />
        <ControlPanelGeneric
          context={{ isConnected, isSubscribed, isPizzaMode }}
          buttons={[
            {
              label: isPizzaMode ? 'Exit Pizza Mode' : '🍕 Pizza Mode',
              action: pizzaModeButtonAction,
              animated: true,
              color: '#FFD700',
              disabled: (ctx) => !ctx.isConnected,
              row: 0, col: 0,
            },
            { label: 'Set Threshold', action: handleThresholdOpen, color: '#FFA500', disabled: false, row: 0, col: 1 },
            { label: 'LED ON', action: wrap(sendBLEData, 'LED_ON'), color: '#005733', disabled: (ctx) => !ctx.isConnected, row: 1, col: 0 },
            { label: 'LED OFF', action: wrap(sendBLEData, 'LED_OFF'), color: '#005733', disabled: (ctx) => !ctx.isConnected, row: 1, col: 1 },
            { label: 'Scan', action: () => navigation.navigate('ConnectScreen', { deviceId: 'ABC123' }), color: '#00AAFF', row: 2, col: 0 },
            {
              label: !autoModeRef.current ? 'Auto On' : 'Auto Off',
              action: () => {
                sendBLEData(autoModeRef.current ? 'AUTO_MODE0' : 'AUTO_MODE1');
                autoModeRef.current = !autoModeRef.current;
                setIsPizzaMode(false); //if device receives 'AUTO_MODE0' or AUTO_MODE1' it will reset pizza mode.
              },
              animated: true,
              id: 'auto_mode',
              disabled: (ctx) => !ctx.isConnected,
              color: '#FFA500',
              row: 2, col: 1,
            },
          ]}
        />
        <View style={{ marginTop: 5, paddingHorizontal: 20, borderRadius: 55 }}>
          <SystemStatus
            isConnected={isConnected}
            isSubscribed={isSubscribed}
            threshold={lightThresholdRef.current}
            rssi={rssi}
            voltage={voltage}
            lightLevel={lightLevel}
            latestMessage={messages[messages.length - 1]}
            connectedAt={connectedAt}
            isAutoMode={autoModeRef.current}
          />
        </View>

      </SafeAreaView></>
  );
};

export default HomeScreen;



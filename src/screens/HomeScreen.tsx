/* eslint-disable react-native/no-inline-styles */
import React, { useState, useRef, useEffect, useCallback } from 'react';
import { SafeAreaView, View, Animated } from 'react-native';
import SystemStatus from '../components/SystemStatus';
import StatusBanner from '../components/StatusBanner';
import ControlPanel from '../components/ControlPanel';
import PizzaAlertModal from '../components/PizzaAlertModal';
import ThresholdModal from '../components/ThresholdModal';
import { useNavigation } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import type { RootStackParamList } from '../../src/types/navigation';
import { useBLE } from '../context/BLEContext';

type HomeNavProp = NativeStackNavigationProp<RootStackParamList, 'Home'>;

const HomeScreen = () => {

  const navigation = useNavigation<HomeNavProp>();
  const [inputValue, setInputValue] = useState('');

  const { ble, modals } = useBLE();

  const {
    isConnected,
    isSubscribed,
    messages,
    voltage,
    rssi,
    lightLevel,
    isPizzaMode,
    connectedAt,
    chargingStatus,
    lightThresholdRef,
    uptime,
    setIsPizzaMode,
    doConnect,
    sendBLEData,
  } = ble;

  const {
    showModal,
    hideModal,
    isModalVisible,
    modalType,
    modalProps,
  } = modals;

  const pulseAnim = useRef(new Animated.Value(1)).current;
  const scaleAnim = useRef(new Animated.Value(1)).current;
  const triggerAnimation = () => {
    Animated.sequence([
      Animated.timing(scaleAnim, {
        toValue: 1.2,
        duration: 200,
        useNativeDriver: true,
      }),
      Animated.timing(scaleAnim, {
        toValue: 1,
        duration: 200,
        useNativeDriver: true,
      }),
    ]).start();
  };
  useEffect(() => {
    console.log('🍕 modalType:', modalType);
    console.log('🍕 isModalVisible:', isModalVisible);
  }, [modalType, isModalVisible]);


  useEffect(() => {
    if (!isConnected && isPizzaMode) {
      setIsPizzaMode(false); // 🔧 auto-reset Pizza Mode
    }
  }, [isConnected, isPizzaMode, setIsPizzaMode]);

  //Use useFocusEffect from @react-navigation/native to kick off BLE actions when a screen becomes active.
  //Persist connection state between screens using either React Context or a global store like Zustand or Redux.
  //Consider conditional rendering if the device isn’t connected — e.g., hide ControlScreen until connected.

  useEffect(() => {
    if (isPizzaMode) {
      Animated.loop(
        Animated.sequence([
          Animated.timing(pulseAnim, {
            toValue: 0.3,
            duration: 500,
            useNativeDriver: true,
          }),
          Animated.timing(pulseAnim, {
            toValue: 1,
            duration: 500,
            useNativeDriver: true,
          }),
        ])
      ).start();
    } else {
      pulseAnim.setValue(1); // reset
    }
  }, [isPizzaMode, pulseAnim]);

  useEffect(() => {
    console.log('you are here');
    doConnect();
    return () => {
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const handleThresholdOpen = useCallback(() => {
    showModal('threshold');
  }, [showModal]);

  return (
    <> {/* These show the modals when visible */}
      {modalType === 'threshold' && (
        <ThresholdModal
          visible={isModalVisible}
          inputValue={inputValue}
          onChangeInput={setInputValue}
          onSave={() => {
            const parsed = parseFloat(inputValue);
            if (!isNaN(parsed)) {
              lightThresholdRef.current = parsed;
              //addMessage(`⚡️ Updated threshold: ${parsed}%`);
              if (isConnected) {
                sendBLEData(`LEVEL${inputValue}`);
              }
            }

            setInputValue('');
            hideModal();
          }}
          onClose={() => {
            setInputValue('');
            hideModal();
          }}
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
            uptime={uptime}
            chargingStatus={chargingStatus}
          />

          <ControlPanel
            isConnected={isConnected}
            isSubscribed={isSubscribed}
            isPizzaMode={isPizzaMode}
            scaleAnim={scaleAnim}
            onSendData={sendBLEData}
            onSetThreshold={handleThresholdOpen}
            onTogglePizzaMode={() => {
              const nextMode = !isPizzaMode;
              setIsPizzaMode(nextMode);
              sendBLEData(nextMode ? 'P_MODE_ON' : 'P_MODE_OFF');
              triggerAnimation();
            }}

            onScreenAction={{
              action: () => navigation.navigate('ConnectScreen', { deviceId: 'ABC123' }),
              label: 'Scan',
            }}
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
            />
          </View>

      </SafeAreaView></>
  );
};

export default HomeScreen;



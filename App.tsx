/* eslint-disable react-native/no-inline-styles */
import React, { useState, useRef, useEffect, useCallback } from 'react';
import { SafeAreaView, View, Animated } from 'react-native';
import { StatusBar } from 'react-native';
import useBluetooth from './src/hooks/useBluetooth';
import SystemStatus from './src/hooks/SystemStatus';
import StatusBanner from './src/hooks/StatusBanner';
import ControlPanel from './src/hooks/ControlPanel';
import PizzaAlertModal from './src/hooks/PizzaAlertModal';
import ThresholdModal from './src/hooks/ThresholdModal';
import useModals from './src/hooks/UseModals';

const App = () => {
  const [uptime, setUptime] = useState<string>('—');
  const [inputValue, setInputValue] = useState('');
  const lightThresholdRef = useRef(10);
  const handlePizzaAlert = useCallback(() => {
    showModal('pizza', {
      onDismiss: hideModal,
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const {
    showModal,
    hideModal,
    isModalVisible,
    modalType,
    modalProps,
  } = useModals();

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
    setIsPizzaMode,
    disconnectBLE,
    doConnect,
    sendBLEData,
    doSubscribe,
    formatDuration,
  } = useBluetooth(lightThresholdRef, handlePizzaAlert);


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
    let timer: ReturnType<typeof setInterval>;

    if (connectedAt) {
      timer = setInterval(() => {
        const elapsed = Math.floor((Date.now() - connectedAt.getTime()) / 1000);
        setUptime(formatDuration(elapsed));
      }, 1000);
    }

    return () => {
      if (timer) { clearInterval(timer); }
      setUptime('—');
    };
  }, [connectedAt, formatDuration]);

  useEffect(() => {
    if (!isConnected && isPizzaMode) {
      setIsPizzaMode(false); // 🔧 auto-reset Pizza Mode
    }
  }, [isConnected, isPizzaMode, setIsPizzaMode]);

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
        <StatusBar translucent={true} backgroundColor="transparent" />
        <View style={{ flex: 1, paddingTop: StatusBar.currentHeight }}>

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
            onConnect={doConnect}
            onSubscribe={doSubscribe}
            onSendData={sendBLEData}
            onSetThreshold={handleThresholdOpen}
            onTogglePizzaMode={() => {
              const nextMode = !isPizzaMode;
              setIsPizzaMode(nextMode);
              sendBLEData(nextMode ? 'P_MODE_ON' : 'P_MODE_OFF');
              triggerAnimation();
            }}

            onDisconnect={disconnectBLE}
          />

          <View style={{ marginTop: 10, paddingHorizontal: 20 }}>
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
        </View>
      </SafeAreaView></>
  );
};

export default App;



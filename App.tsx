/* eslint-disable react-native/no-inline-styles */
import React, { useState, useRef, useEffect, useCallback } from 'react';
import { SafeAreaView, View, Text, Animated } from 'react-native';
import { StatusBar } from 'react-native';
import useBluetooth from './src/hooks/useBluetooth';
import ConsoleLog from './src/hooks/ConsoleLog';
import ConnectionLog from './src/hooks/ConnectionLog';
import StatusBanner from './src/hooks/StatusBanner';
import ControlPanel from './src/hooks/ControlPanel'; 
import PizzaAlertModal from './src/hooks/PizzaAlertModal';
import ThresholdModal from './src/hooks/ThresholdModal';
import useModals from './src/hooks/UseModals'; 

const App = () => {
  const [inputValue, setInputValue] = useState('');
  const lightThresholdRef = useRef(25);
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
    log,
    scrollRef,
    isPizzaMode,
    setIsPizzaMode,
    disconnectBLE,
    doConnect,
    sendBLEData,
    doSubscribe,
    addMessage,
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
    <> {/* This shows the modal when visible */}
      {modalType === 'threshold' && (
        <ThresholdModal
          visible={isModalVisible}
          inputValue={inputValue}
          onChangeInput={setInputValue}
          onSave={() => {
            const parsed = parseFloat(inputValue);
            if (!isNaN(parsed)) {
              lightThresholdRef.current = parsed;
              addMessage(`⚡️ Updated threshold: ${parsed}%`);
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
          <Text style={{ paddingLeft: 19, paddingTop: 5 }}>BLE: {isConnected ? 'Connected' : 'Disconnected'}{isSubscribed ? ', subscribed' : ''}</Text>
          <StatusBanner
            visible={isPizzaMode}
            threshold={lightThresholdRef.current}
          />
          <ConsoleLog messages={messages} scrollRef={scrollRef} />
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
              setIsPizzaMode(prev => !prev);
              sendBLEData(isPizzaMode ? 'P_MODE_ON' : 'P_MODE_OFF');
              triggerAnimation();
            }}
            onDisconnect={disconnectBLE}
          />
          <ConnectionLog log={log} />
        </View>
      </SafeAreaView></>
  );
};

export default App;



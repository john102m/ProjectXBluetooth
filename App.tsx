/* eslint-disable react-native/no-inline-styles */
import React, { useState, useRef, useEffect } from 'react';
import { SafeAreaView, ScrollView, View, Text, Animated } from 'react-native';
import { StatusBar, StyleSheet, Modal, TextInput } from 'react-native';
import CustomButton from './src/CustomButton';
import useBluetooth from './src/hooks/useBluetooth';

const App = () => {
  const lightThresholdRef = useRef(25);
  // Default value
  const [modalVisible, setModalVisible] = useState(false);
  const [inputValue, setInputValue] = useState('');
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
  } = useBluetooth(lightThresholdRef);

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
    console.log('you are here');
    doConnect();

    return () => {
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const thresholdModal = (
    <Modal
      animationType="slide"
      transparent={true}
      visible={modalVisible}
      onRequestClose={() => setModalVisible(false)}
    >
      <View style={{
        flex: 1,
        justifyContent: 'center',
        backgroundColor: 'rgba(0,0,0,0.5)',
      }}>
        <View style={{
          margin: 20,
          backgroundColor: 'white',
          padding: 20,
          borderRadius: 10,
          elevation: 5,
        }}>
          <Text>Set Light Threshold</Text>
          <TextInput
            style={{ borderBottomWidth: 1, marginBottom: 10 }}
            keyboardType="numeric"
            value={inputValue}
            onChangeText={setInputValue}
            placeholder="Enter value"
          />
          <CustomButton
            title="💾 Save Threshold"
            onPress={() => {
              const value = parseFloat(inputValue);
              if (!isNaN(value)) {
                lightThresholdRef.current = value;
                addMessage(`⚡️ Updated threshold: ${value}`);
              }
              setModalVisible(false);
              setInputValue('');
            }}
            color="#FFA500"
          />
        </View>
      </View>
    </Modal>
  );

  return (
    <> {thresholdModal} {/* This shows the modal when visible */}
      <SafeAreaView style={{ flex: 1 }}>
        <StatusBar translucent={true} backgroundColor="transparent" />
        <View style={{ flex: 1, paddingTop: StatusBar.currentHeight }}>
          <Text style={{ paddingLeft: 19, paddingTop: 5 }}>BLE: {isConnected ? 'Connected' : 'Disconnected'}{isSubscribed ? ', subscribed' : ''}</Text>
          {isPizzaMode && (
            <Text style={{ paddingLeft: 19, paddingTop: 5 }}>
              🍕 Pizza mode; trigger level: {lightThresholdRef.current}%
            </Text>
          )}
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
                onPress={() => {
                  if (!isConnected) {
                    doConnect();
                  } else {
                    addMessage('Already connected');

                  }

                }}
                color="#FF5733"
              />
              <CustomButton
                title="Subscribe BLE"
                onPress={() => {
                  if (!isSubscribed) {
                    doSubscribe();
                  } else {
                    addMessage('Already subscribed');
                  }
                }}
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
                title="⚙️ Set Light Threshold"
                onPress={() => setModalVisible(true)}
                color="#FFA500"
              />
            </View>
            <View style={styles.buttonRow}>
              <Animated.View style={{ transform: [{ scale: scaleAnim }] }}>
                <CustomButton
                  title={isPizzaMode ? 'Exit Pizza Mode' : '🍕 Pizza Mode'}
                  onPress={() => {
                    setIsPizzaMode(prev => !prev);
                    triggerAnimation();
                  }}
                  color="#FFD700"
                />
              </Animated.View>
              <CustomButton
                title="Disconnect BLE"
                onPress={() => disconnectBLE()}
                color="#005733"
              />
            </View>
          </View>
          <View style={{ flex: 1, justifyContent: 'flex-end', padding: 20, paddingBottom: 50 }}>
            <Text style={{ fontWeight: 'bold' }}>Connection Log:</Text>
            <ScrollView style={{ maxHeight: 100 }}>
              {log.map((entry, index) => (
                <Text key={index} style={{ fontSize: 12 }}>{entry}</Text>
              ))}
            </ScrollView>
          </View>
        </View>
      </SafeAreaView></>
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

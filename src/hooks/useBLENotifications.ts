// useBLENotifications.ts
import { useRef, useState, useCallback, useEffect } from 'react';
const VOLTAGE_WARNING_THRESHOLD = 1.4;

export default function useBLENotifications(
  sendAlert: () => void,
  setChargingStatus: (status: boolean | null) => void,
  displayNotification: (msg: string) => void,
  playAlertSound: (sound: string) => void,
  addMessage: (msg: string) => void) {

  const [counter, setCounter] = useState(0);
  const counterRef = useRef(counter);
  const hasAlerted = useRef(false);
  const [voltageLevel, setVoltageLevel] = useState<number | null>(null);
  const [rssiLevel, setRssiLevel] = useState<number | null>(null);
  const [lightLevelValue, setLightLevelValue] = useState<number | null>(null);

  const resetAlert = useCallback(() => {
    hasAlerted.current = false;
    setCounter(0);
    console.log('Alert state reset');
  }, []);

  useEffect(() => {
    counterRef.current = counter;
  }, [counter]);

  const handleChargeStatusMessage = useCallback((message: string) => {
    if (message.includes('Not')) {
      setChargingStatus(false);
    } else {
      setChargingStatus(true);
    }
    addMessage(message);
  }, [addMessage, setChargingStatus]);

  const parseBleMessage = useCallback((message: string): { voltage: number; rssi: number; lightLevel: number, batteryStatus: boolean | null } => {
    const vMatch = message.match(/V([\d.]+)/);
    const rMatch = message.match(/R(-?\d+)/);
    const lMatch = message.match(/L([\d.]+)/);
    const bMatch = message.match(/B(\d)/);
    const voltage = vMatch ? parseFloat(vMatch[1]) : -1;
    const rssi = rMatch ? parseFloat(rMatch[1]) : -999;
    const lightLevel = lMatch ? parseFloat(lMatch[1]) : -1;

    const batteryStatus =
      bMatch && (bMatch[1] === '1' || bMatch[1] === '0')
        ? bMatch[1] === '0'
        : null;
    return { voltage, rssi, lightLevel, batteryStatus };
  }, []);


  //Separate message processing
  const processDeviceMessage = useCallback((message: string) => {

    if (message.includes('LDR!')) {  //the main event really
      sendAlert();
      return;
    }
    if (message.includes('Charging')) {
      handleChargeStatusMessage(message);
      return;
    }
    const { voltage, rssi, lightLevel, batteryStatus } = parseBleMessage(message);

    //this happens if the notification did not contain  sensor data - e.g a general message
    if (voltage === 0 || rssi === -999 || lightLevel === 0) {
      if (message.trim() !== '') {
        addMessage(message.trim());
      }
      return;
    }

    console.log('Battery Status: ', batteryStatus);
    setChargingStatus(!!batteryStatus);
    console.log('RSSI: ', rssi);
    if (rssi > -999) { setRssiLevel(rssi); }
    if (voltage > 0) { setVoltageLevel(voltage); }
    if (lightLevel > 0) { setLightLevelValue(lightLevel); }

    if (voltage < VOLTAGE_WARNING_THRESHOLD && !hasAlerted.current) {
      addMessage('Low voltage detected!');
      if (counterRef.current < 2) {
        setCounter(prev => prev + 1);
      } else {
        setCounter(0);
        hasAlerted.current = true;
        playAlertSound('bing_bong');
        displayNotification('Low Battery!');//catch(console.error);
      }
    }
  }, [addMessage, displayNotification, handleChargeStatusMessage, parseBleMessage, playAlertSound, sendAlert, setChargingStatus]);

  return {
    voltageLevel,
    rssiLevel,
    lightLevelValue,
    processDeviceMessage,
    resetAlert,
  };
}

// useBatteryMonitor.ts
import { useCallback, useEffect, useRef, useState } from 'react';
import { Vibration, AppState } from 'react-native';
import notifee, { AndroidImportance } from '@notifee/react-native';

const VOLTAGE_WARNING_THRESHOLD = 1.4;

async function displayNotification(newMessage: string) {
    const channelId = await notifee.createChannel({
        id: 'default',
        name: 'Default Channel',
        importance: AndroidImportance.HIGH,
    });

    await notifee.displayNotification({
        id: 'esp32c3_alert',
        title: 'PizzaBot',
        body: newMessage,
        android: { channelId },
    });
}

type BatteryMonitorOptions = {
    addMessage: (msg: string) => void;
    playWarningSound: () => void;
};

export default function useBatteryMonitor({ addMessage, playWarningSound }: BatteryMonitorOptions) {
    const [voltageLevel, setVoltageLevel] = useState<number | null>(null);
    const [chargingStatus, setChargingStatus] = useState<boolean | null>(null);
    const [lightLevelValue, setLightLevelValue] = useState<number | null>(null);
    const [rssiLevel, setRssiLevel] = useState<number | null>(null);
    const [counter, setCounter] = useState(0);
    const hasAlerted = useRef(false);
    const counterRef = useRef(counter);
    const appState = useRef(AppState.currentState);

    useEffect(() => {
        counterRef.current = counter;
    }, [counter]);

    const resetAlert = useCallback(() => {
        hasAlerted.current = false;
        setCounter(0);
        console.log('Battery alert state reset');
    }, []);

    const parseBleMessage = useCallback((message: string): {
        voltage: string;
        rssi: string;
        lightLevel: string;
        batteryStatus: boolean | null;
    } => {
        console.log('PARSING: ', message);
        const vMatch = message.match(/V([\d.]+)/);
        const rMatch = message.match(/R(-?[\d]+)/);
        const lMatch = message.match(/L([\d.]+)/);
        const bMatch = message.match(/B(\d)/);


        return {
            voltage: vMatch ? `${vMatch[1]} V` : 'Voltage: Unknown',
            rssi: rMatch ? `${rMatch[1]} dBm` : 'RSSI: Unknown',
            lightLevel: lMatch ? `${lMatch[1]} %` : 'Level: Unknown',
            batteryStatus: bMatch && (bMatch[1] === '1' || bMatch[1] === '0') ? bMatch[1] === '0' : null,
        };
    }, []);

    const processEncodedMessage = useCallback((message: string) => {
        const { voltage, rssi, lightLevel, batteryStatus } = parseBleMessage(message);
        setChargingStatus(batteryStatus);
        const lLevel = parseFloat(lightLevel);
        console.log('light', lLevel);

            const rssiNum = parseFloat(rssi);
            if (!isNaN(rssiNum)) { setRssiLevel(rssiNum); }

        if (isNaN(lLevel)) {
            console.log('Invalid light level reading');
        } else {
            setLightLevelValue(lLevel);
        }

        if (voltage.includes('Unknown')) { return; }
        const volts = parseFloat(voltage);
        if (isNaN(volts)) { return; }
        setVoltageLevel(volts);

        if (volts < VOLTAGE_WARNING_THRESHOLD && !hasAlerted.current) {
            addMessage('Low voltage detected!');
            if (counterRef.current < 2) {
                setCounter(prev => prev + 1);
            } else {
                setCounter(0);
                hasAlerted.current = true;
                playWarningSound();
                displayNotification('Low Battery!').catch(console.error);
            }
        }
    }, [addMessage, parseBleMessage, playWarningSound]);

    return {
        voltageLevel,
        chargingStatus,
        processEncodedMessage,
        resetAlert,
        setChargingStatus,
        lightLevelValue,
        rssiLevel,

    };
}

// useBluetooth.ts (updated)
import { useRef, useEffect, useState, useCallback } from 'react';
import {
    DeviceEventEmitter, Platform, AppState,
    PermissionsAndroid, NativeModules, ScrollView, Vibration,
} from 'react-native';
import notifee, { EventType, AndroidImportance } from '@notifee/react-native';
import { formatDuration } from './useLiveUptime';

const { AudioModule, BLEModule } = NativeModules;

const SERVICE_UUID = '4fafc201-1fb5-459e-8fcc-c5c9c331914b';
const CHARACTERISTIC_UUID = 'beb5483e-36e1-4688-b7f5-ea07361b26a8';
const VOLTAGE_WARNING_THRESHOLD = 1.4;

async function displayNotification(newMessage: string) {
    const channelId = await notifee.createChannel({
        id: 'default',
        name: 'Default Channel',
        importance: AndroidImportance.HIGH,
    });

    await notifee.displayNotification({
        id: 'esp32c3_alert', // Unique ID for tracking
        title: 'Light sensor',
        body: newMessage,
        android: {
            channelId,
        },
    });
}

function setupNotificationListeners(resetAlert: () => void) {
    notifee.onForegroundEvent(({ type, detail }) => {
        if (type === EventType.DISMISSED && detail.notification?.id === 'esp32c3_alert') {
            console.log('User dismissed notification', detail.notification);
            resetAlert(); // Reset when dismissed
        }
    });

    // For background/quit state (optional)
    notifee.onBackgroundEvent(async ({ type, detail }) => {
        if (type === EventType.DISMISSED && detail.notification?.id === 'esp32c3_alert') {
            console.log('User dismissed notification while app was in background');
            resetAlert(); // Reset when dismissed
        }
        return Promise.resolve(); // Required for background events
    });
}


export default function useBluetooth(
    lightThresholdRef: React.RefObject<number>, handlePizzaAlert?: () => void) {
    type BleEvent = {
        origin: 'native' | 'esp32';
        message: string;
        status?: string;
        // other relevant fields
    };
    // State
    const [chargingStatus, setChargingStatus] = useState<boolean>(false);
    const [isPizzaMode, setIsPizzaMode] = useState(false);
    const [isConnected, setIsConnected] = useState(false);
    const [isSubscribed, setIsSubscribed] = useState(false);
    const [voltageLevel, setVoltageLevel] = useState<number | null>(null);
    const [rssiLevel, setRssiLevel] = useState<number | null>(null);
    const [lightLevelValue, setLightLevelValue] = useState<number | null>(null);

    const [messages, setMessages] = useState<string[]>([]);
    const [connectedAt, setConnectedAt] = useState<Date | null>(null);
    //const [log, setLog] = useState<string[]>([]);
    const [counter, setCounter] = useState(0);
    const hasAlerted = useRef(false);
    const scrollRef = useRef<ScrollView>(null);
    const counterRef = useRef(counter);
    const appState = useRef(AppState.currentState);

    useEffect(() => {
        const subscription = AppState.addEventListener('change', nextAppState => {
            appState.current = nextAppState;
        });

        return () => {
            subscription.remove();
        };
    }, []);


    useEffect(() => {
        counterRef.current = counter;
    }, [counter]);
    const pizzaModeRef = useRef(isPizzaMode);

    useEffect(() => {
        pizzaModeRef.current = isPizzaMode;
        if (isPizzaMode) {
            Vibration.vibrate(100); // 🎉 Buzz when entering Pizza Mode
            //Vibration.vibrate([100, 200, 100, 300]);

        }
    }, [isPizzaMode]);

    const addMessage = useCallback((newMessage: string) => {
        console.log(newMessage);
        setMessages(prev => [...prev.slice(-19), newMessage]);
    }, []);

    const logEvent = useCallback((message: string) => {
        const timestamp = new Date().toLocaleTimeString();
        //setLog(prev => [...prev.slice(-19), `${timestamp} - ${message}`]);
    }, []);

    const logConnection = useCallback(() => {
        setConnectedAt(new Date());
        logEvent('Connected');
        addMessage('Connected you are');
    }, [logEvent, addMessage]);

    const logDisconnection = useCallback(() => {
        if (connectedAt) {
            const duration = (Date.now() - connectedAt.getTime()) / 1000;
            const formattedDuration = formatDuration(duration);
            //logEvent(`Connected for ${formattedDuration}`);
            addMessage(`Connected for ${formattedDuration}`);

            setConnectedAt(null);
        } else {
            logEvent('Unable to connect');
            addMessage('Unable to connect');
        }
    }, [connectedAt, logEvent, addMessage]);


    const resetAlert = useCallback(() => {
        hasAlerted.current = false;
        setCounter(0);
        console.log('Alert state reset');
    }, []);

    const setDisconnected = useCallback(() => {
        setIsSubscribed(false);
        setIsConnected(false);
        logDisconnection();
    }, [logDisconnection]);

    const handleDisconnection = useCallback(() => {
        setDisconnected();
        AudioModule.playAudio('bing_bong');
    }, [setDisconnected]);

    const doSubscribe = useCallback(async () => {
        BLEModule.subscribeToBLENotifications(SERVICE_UUID, CHARACTERISTIC_UUID)
            .then(() => {
                //addMessage('Subscribed to BLE notifications');
                AudioModule.playAudio('chime');
                setIsSubscribed(true);
            })
            .catch((error: any) => addMessage(`${error}`));
    }, [addMessage]);


    const handleCharacteristicFound = useCallback(() => {
        addMessage('Characteristic found!');
        doSubscribe();
    }, [addMessage, doSubscribe]);

    const handleChargeStatus = useCallback((message: string) => {
        if (message.includes('Not')) {
            setChargingStatus(false);
        } else {
            setChargingStatus(true);
        }
        addMessage(message);
    }, [addMessage]);


    const parseBleMessage = useCallback((message: string): { voltage: string; rssi: string; lightLevel: string } => {
        const vMatch = message.match(/V([\d.]+)/);
        const rMatch = message.match(/R(-?\d+)/);
        const lMatch = message.match(/L([\d.]+)/);
        const voltage = vMatch ? `${vMatch[1]} V` : 'Voltage: Unknown';
        const rssi = rMatch ? `${rMatch[1]} dBm` : 'RSSI: Unknown';
        const lightLevel = lMatch ? `${lMatch[1]} %` : 'Level: Unknown';
        return { voltage, rssi, lightLevel };
    }, []);

    //Separate message processing
    const processDeviceMessage = useCallback((message: string) => {
        if (message.includes('Charging')) {
            handleChargeStatus(message);
            return;
        }
        const { voltage, rssi, lightLevel } = parseBleMessage(message);
        const rssiNum = parseFloat(rssi);
        if (!isNaN(rssiNum)) { setRssiLevel(rssiNum); }

        //this happens if the notification did not contain and sensor data - e.g a general message
        if (voltage.includes('Unknown') || rssi.includes('Unknown') || lightLevel.includes('Unknown')) {
            if (message.trim() !== '') {
                addMessage(message.trim());
            }
            return;
        }
        const volts = parseFloat(voltage);
        if (isNaN(volts)) {
            console.error('Invalid voltage reading');
            return;
        }
        setVoltageLevel(volts);

        const lLevel = parseFloat(lightLevel);
        if (isNaN(lLevel)) {
            console.error('Invalid light level reading');
        } else {
            setLightLevelValue(lLevel);
        }


        if (lLevel < lightThresholdRef.current && pizzaModeRef.current) {
            setIsPizzaMode(false);
            Vibration.vibrate([100, 200, 100, 300]);
            AudioModule.playAudio('major');
            logEvent('PIZZA ALERT');
            if (appState.current === 'active') {
                if (handlePizzaAlert) {
                    handlePizzaAlert();
                }
                else {
                    AudioModule.showToast('Pizza Alert!', 1);
                }
            } else {
                displayNotification('Pizza Alert!'); // App is in background
            }
        }

        //addMessage(`Voltage: ${voltage}, RSSI: ${rssi}`);
        //addMessage(`Light level: ${lLevel}%`);


        console.log('Counter ', counterRef.current);

        if (volts < VOLTAGE_WARNING_THRESHOLD && !hasAlerted.current) {
            logEvent('Low voltage detected!');
            if (counterRef.current < 2) {
                setCounter(prev => prev + 1);
            } else {
                setCounter(0);
                hasAlerted.current = true;
                AudioModule.playAudio('bing_bong');
                displayNotification('Low Battery!')
                    .then(() => console.log('Notification shown'))
                    .catch(e => console.error('Notification failed', e));
            }
        }
    }, [addMessage, logEvent, handleChargeStatus, parseBleMessage, lightThresholdRef, handlePizzaAlert]);

    const doConnect = useCallback(async () => {
        const granted = await PermissionsAndroid.check(PermissionsAndroid.PERMISSIONS.BLUETOOTH_CONNECT);

        if (!granted) {
            const requested = await PermissionsAndroid.request(PermissionsAndroid.PERMISSIONS.BLUETOOTH_CONNECT, {
                title: 'Bluetooth Permission',
                message: 'This app needs Bluetooth access to connect to your oven module.',
                buttonPositive: 'OK',
            });

            if (requested !== PermissionsAndroid.RESULTS.GRANTED) {
                addMessage('❌ Bluetooth permission denied');
                return;
            }
        }
        BLEModule.connectToKnownBLEDevice()
            .then((result: any) => {
                logConnection();
                setIsConnected(true);
                addMessage(`BLE Connect Result: ${result}`);
            })
            .catch((error: any) => addMessage(`${error}`));
    }, [addMessage, logConnection]);

    const disconnectBLE = useCallback(() => {
        if (!isConnected) {
            addMessage('Not connected');
            return;
        }
        addMessage('disconnecting BLE.....');
        BLEModule.disconnectBLE()
            .then((result: any) => {
                addMessage(result);
                setDisconnected();
            })
            .catch((error: any) => addMessage(error));
    }, [isConnected, addMessage, setDisconnected]);

    const sendBLEData = useCallback(async (message: string) => {
        try {
            await BLEModule.writeToBLECharacteristic(SERVICE_UUID, CHARACTERISTIC_UUID, message);
            console.log(`Sent via BLE: ${message}`);
            //addMessage(`Sent: ${message}`);//no because ESP32C3 will echo commands as notifs
        } catch (error) {
            addMessage(`${error}`);
        }
    }, [addMessage]);


    // Notification permission on mount
    useEffect(() => {
        const setupNotifications = async () => {
            if (Platform.OS === 'android') {
                await PermissionsAndroid.request(PermissionsAndroid.PERMISSIONS.POST_NOTIFICATIONS);
            }
            await notifee.requestPermission();
        };
        setupNotifications();
        setupNotificationListeners(resetAlert);
    }, [resetAlert]);

    // BLE Event listener
    useEffect(() => {
        const sub = DeviceEventEmitter.addListener(
            'BluetoothNotification',
            (event: BleEvent) => {
                scrollRef.current?.scrollToEnd({ animated: true });
                if (String(event.status).includes('Characteristic found!')) {
                    handleCharacteristicFound();
                    setIsConnected(true);
                } else if (String(event.status).includes('Disconnected')) {
                    handleDisconnection();
                }
                const strMessage = event?.message != null ? String(event.message) : '';
                processDeviceMessage(strMessage);
            }
        );

        return () => {
            sub.remove();
            setIsSubscribed(false);
            BLEModule.unsubscribeFromBLENotifications(SERVICE_UUID, CHARACTERISTIC_UUID);
        };
    }, [handleCharacteristicFound, handleDisconnection, processDeviceMessage]);

    return {
        isConnected,
        isSubscribed,
        messages,
        isPizzaMode,
        chargingStatus,
        setIsPizzaMode,
        doConnect,
        doSubscribe,
        disconnectBLE,
        sendBLEData,
        addMessage,
        formatDuration,
        voltage: voltageLevel,
        rssi: rssiLevel,
        lightLevel: lightLevelValue,
        connectedAt,
    };
}

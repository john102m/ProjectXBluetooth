// useBluetooth.ts (updated)
import { useRef, useEffect, useState, useCallback } from 'react';
import { DeviceEventEmitter, Platform, PermissionsAndroid, NativeModules, ScrollView } from 'react-native';
import notifee, { EventType, AndroidImportance } from '@notifee/react-native';

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
        id: 'low_battery_alert', // Unique ID for tracking
        title: 'ESP32C3',
        body: newMessage,
        android: {
            channelId,
        },
    });
}

function setupNotificationListeners(resetAlert: () => void) {
    notifee.onForegroundEvent(({ type, detail }) => {
        if (type === EventType.DISMISSED && detail.notification?.id === 'low_battery_alert') {
            console.log('User dismissed notification', detail.notification);
            resetAlert(); // Reset when dismissed
        }
    });

    // For background/quit state (optional)
    notifee.onBackgroundEvent(async ({ type, detail }) => {
        if (type === EventType.DISMISSED && detail.notification?.id === 'low_battery_alert') {
            console.log('User dismissed notification while app was in background');
            resetAlert(); // Reset when dismissed
        }
        return Promise.resolve(); // Required for background events
    });
}


export default function useBluetooth() {
    type BleEvent = {
        origin: 'native' | 'esp32';
        message: string;
        status?: string;
        // other relevant fields
    };
    // State
    const [isConnected, setIsConnected] = useState(false);
    const [isSubscribed, setIsSubscribed] = useState(false);
    const [messages, setMessages] = useState<string[]>([]);
    const [connectedAt, setConnectedAt] = useState<Date | null>(null);
    const [log, setLog] = useState<string[]>([]);
    const [counter, setCounter] = useState(0);
    const hasAlerted = useRef(false);
    const scrollRef = useRef<ScrollView>(null);
    const counterRef = useRef(counter);

    useEffect(() => {
        counterRef.current = counter;
    }, [counter]);

    const addMessage = useCallback((newMessage: string) => {
        console.log(newMessage);
        setMessages(prev => [...prev.slice(-19), newMessage]);
    }, []);

    const logEvent = useCallback((message: string) => {
        const timestamp = new Date().toLocaleTimeString();
        setLog(prev => [...prev.slice(-19), `${timestamp} - ${message}`]);
    }, []);

    const logConnection = useCallback(() => {
        setConnectedAt(new Date());
        logEvent('Connected');
    }, [logEvent]);

    const logDisconnection = useCallback(() => {
        if (connectedAt) {
            const duration = (Date.now() - connectedAt.getTime()) / 1000;
            logEvent(`Disconnected (session ${duration.toFixed(1)}s)`);
            addMessage(`Disconnected (session ${duration.toFixed(1)}s)`);
            setConnectedAt(null);
        } else {
            logEvent('Disconnected');
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
                addMessage('Subscribed to BLE notifications');
                AudioModule.playAudio('chime');
                setIsSubscribed(true);
            })
            .catch((error: any) => addMessage(`BLE Subscription Error: ${error}`));
    }, [addMessage]);


    const handleCharacteristicFound = useCallback(() => {
        addMessage('Characteristic found!');
        doSubscribe();
    }, [addMessage, doSubscribe]);

    const handleFullCharge = useCallback(() => {
        addMessage('Battery fully charged');
    }, [addMessage]);


    const parseBleMessage = useCallback((message: string): { voltage: string; rssi: string } => {
        const vMatch = message.match(/V([\d.]+)/);
        const rMatch = message.match(/R(-?\d+)/);
        const voltage = vMatch ? `${vMatch[1]} V` : 'Voltage: Unknown';
        const rssi = rMatch ? `${rMatch[1]} dBm` : 'RSSI: Unknown';
        return { voltage, rssi };
    }, []);

    //Separate message processing
    const processDeviceMessage = useCallback((message: string) => {
        if (message.includes('Not Charging')) {
            handleFullCharge();
            return;
        }
        const { voltage, rssi } = parseBleMessage(message);
        if (voltage.includes('Unknown') || rssi.includes('Unknown')) {
            addMessage(message.trim() === '' ? 'Awaiting data...' : message);
            return;
        }

        const volts = parseFloat(voltage);
        if (isNaN(volts)) {
            console.error('Invalid voltage reading');
            return;
        }

        addMessage(`Voltage: ${voltage}, RSSI: ${rssi}`);
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
    }, [addMessage, logEvent, handleFullCharge, parseBleMessage]);

    const doConnect = useCallback(async () => {

        BLEModule.connectToKnownBLEDevice()
            .then((result: any) => {
                logConnection();
                setIsConnected(true);
                addMessage(`BLE Connect Result: ${result}`);
            })
            .catch((error: any) => addMessage(`BLE Error: ${error}`));
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
            addMessage(`Error sending BLE message: ${error}`);
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
        log,
        scrollRef,
        doConnect,
        doSubscribe,
        disconnectBLE,
        sendBLEData,
        addMessage,
    };
}

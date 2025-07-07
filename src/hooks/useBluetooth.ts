// useBluetooth.ts (updated)
import { useRef, useEffect, useState, useCallback } from 'react';
import {
    DeviceEventEmitter, Platform, AppState,
    PermissionsAndroid, NativeModules, ScrollView, Vibration,
} from 'react-native';
import notifee, { EventType, AndroidImportance } from '@notifee/react-native';
import { formatDuration } from './useLiveUptime';
import useBLEConnection from './useBLEConnection';
import useBLESubscription from './useBLESubscription';
import useBatteryMonitor from './useBatteryMonitor';

const { AudioModule, BLEModule } = NativeModules;

const SERVICE_UUID = '4fafc201-1fb5-459e-8fcc-c5c9c331914b';
const CHARACTERISTIC_UUID = 'beb5483e-36e1-4688-b7f5-ea07361b26a8';

async function displayNotification(newMessage: string) {
    const channelId = await notifee.createChannel({
        id: 'default',
        name: 'Default Channel',
        importance: AndroidImportance.HIGH,
    });

    await notifee.displayNotification({
        id: 'esp32c3_alert', // Unique ID for tracking
        title: 'PizzaBot',
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
    const BLE_STATUS = {
        CHAR_FOUND: 'Characteristic found!',
        DISCONNECTED: 'Disconnected',
        CHARGING: 'Charging',
    } as const;

    // State
    const { isSubscribed, doSubscribe, doUnsubscribe, setIsSubscribed } = useBLESubscription();

    const [messages, setMessages] = useState<string[]>([]);
    const addMessage = useCallback((msg: string) => {
        console.log(msg);
        setMessages((prev) => [...prev.slice(-19), msg]);
    }, []);

    const { isConnected, connectedAt, doConnect, setIsConnected, logDisconnection, disconnectBLE } = useBLEConnection(addMessage);
    const {
        voltageLevel,
        chargingStatus,
        processEncodedMessage,
        resetAlert,
        setChargingStatus,
        lightLevelValue,
        rssiLevel,
    } = useBatteryMonitor({
        addMessage,
        playWarningSound: () => {
            AudioModule.playAudio('bing_bong');
            Vibration.vibrate([100, 200, 100, 300]);
        },
    });


    const [isPizzaMode, setIsPizzaMode] = useState(false);
    const scrollRef = useRef<ScrollView>(null);
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
        if (isConnected) {
            setChargingStatus(null); // reset until first update arrives
        } else {
            setChargingStatus(false);
        }
    }, [isConnected, setChargingStatus]);


    const pizzaModeRef = useRef(isPizzaMode);

    useEffect(() => {
        pizzaModeRef.current = isPizzaMode;
        if (isPizzaMode) {
            Vibration.vibrate(100); // 🎉 Buzz when entering Pizza Mode

        }
    }, [isPizzaMode]);

    const setDisconnected = useCallback(() => {
        setIsSubscribed(false);
        setIsConnected(false);
        logDisconnection();
    }, [logDisconnection, setIsConnected, setIsSubscribed]);

    const handleDisconnection = useCallback(() => {
        setDisconnected();
        AudioModule.playAudio('bing_bong');
    }, [setDisconnected]);

    const sendBLEData = useCallback(async (message: string) => {
        try {
            await BLEModule.writeToBLECharacteristic(SERVICE_UUID, CHARACTERISTIC_UUID, message);
            console.log(`Sent via BLE: ${message}`);

        } catch (error) {
            addMessage(`${error}`);
        }
    }, [addMessage]);



    const handleCharacteristicFound = useCallback(() => {
        console.log('Characteristic found, subscribing...');
        doSubscribe();
    }, [doSubscribe]);

    const handleChargeStatus = useCallback((message: string) => {
        if (message.includes('Not')) {
            setChargingStatus(false);
        } else {
            setChargingStatus(true);
        }
        addMessage(message);
    }, [addMessage, setChargingStatus]);


    const sendAlert = useCallback(() => {
        setIsPizzaMode(false);
        sendBLEData('P_MODE_OFF');
        Vibration.vibrate([100, 200, 100, 300]);
        AudioModule.playAudio('major');

        if (appState.current === 'active') {
            if (handlePizzaAlert) {
                handlePizzaAlert();
            } else {
                AudioModule.showToast('Pizza Alert!', 1);
            }
        } else {
            displayNotification('Pizza Alert!');
        }
    }, [handlePizzaAlert, appState, sendBLEData]); // Include any reactive values used


    //Separate message processing
    const processDeviceMessage = useCallback((message: string) => {
        try {
            if (!message.includes('V') && !message.includes('R') && !message.includes('L')) {
                if (message.trim() !== '') {
                    addMessage(`Echo or unparsed: ${message.trim()}`);
                }
            }

            if (message.includes('LDR!')) {  //the main event really
                sendAlert();
                return;
            }
            if (message.includes(BLE_STATUS.CHARGING)) {
                handleChargeStatus(message);
                return;
            }

            console.log('The message: ', message);
            processEncodedMessage(message);


        } catch (err) {
            console.error('processDeviceMessage failed:', err, 'on message:', message);
            addMessage(`!! Error parsing message: ${message}`);
        }

    }, [BLE_STATUS.CHARGING, addMessage, handleChargeStatus, processEncodedMessage, sendAlert]);


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
                console.log('something happened');
                scrollRef.current?.scrollToEnd({ animated: true });

                console.log(event);

                if (String(event.status).includes(BLE_STATUS.CHAR_FOUND)) {
                    handleCharacteristicFound();
                    setIsConnected(true);
                } else if (String(event.status).includes(BLE_STATUS.DISCONNECTED)) {
                    handleDisconnection();
                } else if (String(event.message).includes('Charging')) {
                    console.log('Charge message received');
                    setTimeout(() => {
                        const levelToSync = lightThresholdRef.current;
                        if (levelToSync != null) {
                            sendBLEData(`LEVEL${levelToSync}`);
                        }
                    }, 300); // delay is crucial?
                }
                const strMessage = event?.message != null ? String(event.message) : '';
                processDeviceMessage(strMessage);
            }
        );

        return () => {

            sub.remove();
            //doUnsubscribe().catch(console.error);
        };
        // eslint-disable-next-line react-hooks/exhaustive-deps
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


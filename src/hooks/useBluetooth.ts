// useBluetooth.ts (updated)
import { useRef, useEffect, useState, useCallback } from 'react';
import {
    DeviceEventEmitter, Platform, PermissionsAndroid,
    NativeModules, Vibration, AppState,
} from 'react-native';
import notifee, { EventType, AndroidImportance } from '@notifee/react-native';
import useBLEManager from './useBLEManager';
import useBLENotifications from './useBLENotifications';
const { AudioModule } = NativeModules;

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

function playAlertSound(sound: string) {
    AudioModule.playAudio(sound);
    Vibration.vibrate([100, 200, 100, 300]);
}

export default function useBluetooth(
    lightThresholdRef: React.RefObject<number>, autoModeRef: React.RefObject<boolean>, handlePizzaAlert?: () => void) {
    type BleEvent = {
        origin: 'native' | 'esp32';
        message: string;
        status?: string;
    };
    // State
    const appState = useRef(AppState.currentState);
    const [messages, setMessages] = useState<string[]>([]);
    const addMessage = useCallback((msg: string) => {
        console.log(msg);
        setMessages((prev) => [...prev.slice(-19), msg]);
    }, []);

    const [isPizzaMode, setIsPizzaMode] = useState(false);
    const [chargingStatus, setChargingStatus] = useState<boolean | null>(null);

    const { isConnected,
        connectedAt,
        doConnect,
        setIsConnected,
        logDisconnection,
        disconnectBLE,
        sendBLEData,
        scanBLEDevices,
        stopBLEScan,
        isSubscribed,
        doSubscribe,
        doUnsubscribe,
        setIsSubscribed,
        foundDevices,
        setFoundDevices,
        clearFoundDevices,
    } = useBLEManager(addMessage);

    const sendAlert = useCallback(() => {
        setIsPizzaMode(false);
        sendBLEData('P_MODE_OFF');
        playAlertSound('major');

        if (appState.current === 'active') {
            if (handlePizzaAlert) {
                handlePizzaAlert();
            } else {
                AudioModule.showToast('Pizza Alert!', 1);
            }
        } else {
            displayNotification('Pizza Alert!');
        }
    }, [setIsPizzaMode, sendBLEData, handlePizzaAlert]); // Include any reactive values used 

    const {
        processDeviceMessage,
        resetAlert,
        voltageLevel,
        rssiLevel,
        lightLevelValue,
    } = useBLENotifications(
        sendAlert,
        setChargingStatus,
        displayNotification,
        playAlertSound,
        addMessage);

    useEffect(() => {
        const subscription = AppState.addEventListener('change', nextAppState => {
            appState.current = nextAppState;
        });

        return () => {
            subscription.remove();
        };
    }, []);

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

    useEffect(() => {
        if (isConnected) {
            setChargingStatus(null); // reset until first update arrives
        } else {
            setChargingStatus(false);
        }
    }, [isConnected]);

    const setDisconnected = useCallback(() => {
        setIsSubscribed(false);
        setIsConnected(false);
        logDisconnection();
    }, [logDisconnection, setIsConnected, setIsSubscribed]);

    const handleDisconnection = useCallback(() => {
        setDisconnected();
        playAlertSound('disconnected');
    }, [setDisconnected]);

    const handleCharacteristicFound = useCallback(() => {
        doSubscribe();
    }, [doSubscribe]);
    const generateSyncCommand = (threshold: number, isAuto: boolean) => {
        const tag = isAuto ? 'P' : 'L';
        const mode = isAuto ? 'A1' : 'A0';
        return `SYNC|${tag}${threshold}|${mode}`;
    };


    // BLE Event listener
    useEffect(() => {
        const sub = DeviceEventEmitter.addListener(
            'BluetoothNotification',
            (event: BleEvent) => {
                if (String(event.status).includes('Characteristic found!')) {
                    handleCharacteristicFound();
                    setIsConnected(true);
                } else if (String(event.status).includes('Disconnected')) {
                    handleDisconnection();
                } else if (String(event.message).includes('Charging')) {
                    console.log('Charge message received');
                    setTimeout(() => {

                        const modeToSync = autoModeRef?.current;
                        const levelToSync = lightThresholdRef?.current;
                        if (typeof levelToSync === 'number' && typeof modeToSync === 'boolean') {
                            sendBLEData(generateSyncCommand(levelToSync, modeToSync));
                            console.log('📡 SYNC →', generateSyncCommand(levelToSync, modeToSync));

                        }

                    }, 300);
                }
                const strMessage = event?.message != null ? String(event.message) : '';
                processDeviceMessage(strMessage);
            }
        );

        return () => {
            sub.remove();
            //setIsSubscribed(false);
            //disconnectBLE();
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
        doUnsubscribe,
        disconnectBLE,
        sendBLEData,
        scanBLEDevices,
        stopBLEScan,
        foundDevices,
        setFoundDevices,
        clearFoundDevices,
        addMessage,
        voltage: voltageLevel,
        rssi: rssiLevel,
        lightLevel: lightLevelValue,
        connectedAt,
        lightThresholdRef,
    };
}


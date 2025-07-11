import React, { createContext, useRef, useCallback, useContext, useEffect, useState } from 'react';
import useBluetooth from '../hooks/useBluetooth';
import useModals, { ModalType } from '../components/UseModals';
import { formatDuration } from '../hooks/useLiveUptime';
import AsyncStorage from '@react-native-async-storage/async-storage';

type BLEContextType = {
    ble: ReturnType<typeof useBluetooth> & {
        lightThresholdRef: React.RefObject<number>;
        autoModeRef: React.RefObject<boolean>;
        uptime: string;
        setShouldAutoConnect: (val: boolean) => void;  // <-- Changed here
        shouldAutoConnect: boolean;
        lastConnectedDevice: string | null;

    };
    modals: {
        showModal: (type: ModalType, props?: {}) => void;
        hideModal: () => void;
        isModalVisible: boolean;
        modalType: ModalType;
        modalProps: any;
    };
};

const STORAGE_KEY = 'autoConnectEnabled';
const LAST_DEVICE_KEY = 'lastConnectedDeviceAddress';

const BLEContext = createContext<BLEContextType | null>(null);

export const BLEProvider = ({ children }: { children: React.ReactNode }) => {
    const [uptime, setUptime] = useState('—');
    const lightThresholdRef = useRef(80);
    const autoModeRef = useRef(true);
    const [shouldAutoConnect, _setShouldAutoConnect] = useState(true);
    const [lastConnectedDevice, setLastConnectedDevice] = useState<string | null>(null);

    const {
        showModal,
        hideModal,
        isModalVisible,
        modalType,
        modalProps,
    } = useModals();

    const handlePizzaAlert = useCallback(() => {
        showModal('pizza', { onDismiss: hideModal });
    }, [showModal, hideModal]);

    const ble = useBluetooth(lightThresholdRef, autoModeRef, handlePizzaAlert);
    const { connectedAt } = ble;

    // Load persisted value once on mount
    useEffect(() => {
        (async () => {
            try {
                const savedAutoConnect = await AsyncStorage.getItem(STORAGE_KEY);
                const savedDevice = await AsyncStorage.getItem(LAST_DEVICE_KEY);

                if (savedAutoConnect !== null) {
                    _setShouldAutoConnect(savedAutoConnect === 'true');
                }
                if (savedDevice) {
                    setLastConnectedDevice(savedDevice);
                }
            } catch (e) {
                console.warn('Failed to load persisted settings', e);
            }
        })();
    }, []);


    // Sync setter + persist to AsyncStorage (fire and forget)
    const setShouldAutoConnect = (val: boolean) => {
        _setShouldAutoConnect(val);
        AsyncStorage.setItem(STORAGE_KEY, val.toString()).catch(e =>
            console.warn('Failed to save autoConnect setting', e)
        );
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
    }, [connectedAt]);

    const value: BLEContextType = {
        ble: {
            ...ble,
            lightThresholdRef,
            autoModeRef,
            uptime,
            shouldAutoConnect,
            setShouldAutoConnect,
            lastConnectedDevice,
        },
        modals: {
            showModal,
            hideModal,
            isModalVisible,
            modalType,
            modalProps,
        },
    };

    return <BLEContext.Provider value={value}>{children}</BLEContext.Provider>;
};

export const useBLE = () => {
    const ctx = useContext(BLEContext);
    if (!ctx) { throw new Error('useBLE must be used within BLEProvider'); }
    return ctx;
};

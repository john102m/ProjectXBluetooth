// context/BLEContext.tsx
import React, { createContext, useRef, useCallback, useContext, useEffect, useState } from 'react';
import useBluetooth from '../hooks/useBluetooth';
import useModals, { ModalType } from '../components/UseModals';
import { formatDuration } from '../hooks/useLiveUptime';

type BLEContextType = {
    ble: ReturnType<typeof useBluetooth> & {
        lightThresholdRef: React.RefObject<number>;
        uptime: string;
    };
    modals: {
        showModal: (type: ModalType, props?: {}) => void;
        hideModal: () => void;
        isModalVisible: boolean;
        modalType: ModalType;
        modalProps: any;
    };
};

const BLEContext = createContext<BLEContextType | null>(null);

export const BLEProvider = ({ children }: { children: React.ReactNode }) => {
    const [uptime, setUptime] = useState('—');
    const lightThresholdRef = useRef(10);

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

    const ble = useBluetooth(lightThresholdRef, handlePizzaAlert);
    const { connectedAt } = ble; // ✅ Now we can use it!

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
            uptime, // ✅ Make uptime available to everyone
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

// useBLENotifications.ts
import { useState, useEffect, useCallback } from 'react';
import { DeviceEventEmitter } from 'react-native';

const { BLEModule } = require('react-native').NativeModules;

const SERVICE_UUID = '4fafc201-1fb5-459e-8fcc-c5c9c331914b';
const CHARACTERISTIC_UUID = 'beb5483e-36e1-4688-b7f5-ea07361b26a8';

export default function useBLENotifications(onMessageReceived: (msg: string) => void) {
  const [isSubscribed, setIsSubscribed] = useState(false);

  const doSubscribe = useCallback(() => {
    BLEModule.subscribeToBLENotifications(SERVICE_UUID, CHARACTERISTIC_UUID)
      .then(() => {
        setIsSubscribed(true);
      })
      .catch((error: any) => {
        console.error('Subscribe error:', error);
      });
  }, []);

  useEffect(() => {
    const subscription = DeviceEventEmitter.addListener(
      'BluetoothNotification',
      (event: any) => {
        if (event?.message) {
          onMessageReceived(event.message);
        }
      }
    );

    return () => {
      subscription.remove();
      BLEModule.unsubscribeFromBLENotifications(SERVICE_UUID, CHARACTERISTIC_UUID)
        .catch((error: any) => console.error('Unsubscribe error:', error));
      setIsSubscribed(false);
    };
  }, [onMessageReceived]);

  return { isSubscribed, doSubscribe, setIsSubscribed };
}

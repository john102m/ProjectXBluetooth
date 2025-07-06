import { useState, useCallback } from 'react';
const { BLEModule, AudioModule } = require('react-native').NativeModules;

const SERVICE_UUID = '4fafc201-1fb5-459e-8fcc-c5c9c331914b';
const CHARACTERISTIC_UUID = 'beb5483e-36e1-4688-b7f5-ea07361b26a8';

export default function useBLESubscription() {
  const [isSubscribed, setIsSubscribed] = useState(false);

  const doSubscribe = useCallback(() => {
    return BLEModule.subscribeToBLENotifications(SERVICE_UUID, CHARACTERISTIC_UUID)
      .then(() => {
        AudioModule.playAudio('chime');
        setIsSubscribed(true);
      })
      .catch((e: any) => {
        console.error('Subscribe error:', e);
        throw e;
      });
  }, []);

  const doUnsubscribe = useCallback(() => {
    return BLEModule.unsubscribeFromBLENotifications(SERVICE_UUID, CHARACTERISTIC_UUID)
      .then(() => {
        setIsSubscribed(false);
      })
      .catch((e: any) => {
        console.error('Unsubscribe error:', e);
        throw e;
      });
  }, []);

  return { isSubscribed, doSubscribe, doUnsubscribe, setIsSubscribed };
}

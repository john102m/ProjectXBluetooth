// PizzaAlertModal.tsx
import React, { useEffect, useRef } from 'react';
import { Modal, View, Text, StyleSheet, Animated, NativeModules } from 'react-native';
import CustomButton from './CustomButton';
const { AudioModule } = NativeModules;
type Props = {
  visible: boolean;
  onDismiss?: () => void;
  autoDismissDuration?: number; // in ms
};

export default function PizzaAlertModal({ visible, onDismiss, autoDismissDuration = 5000 }: Props) {

  const scaleAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    if (visible) {
      scaleAnim.setValue(0); // reset
      Animated.spring(scaleAnim, {
        toValue: 1,
        friction: 5,
        useNativeDriver: true,
      }).start();
    }
  }, [visible, scaleAnim]);

  useEffect(() => {
    if (visible && onDismiss) {
      const timer = setTimeout(() => onDismiss(), autoDismissDuration);
      return () => clearTimeout(timer);
    }
  }, [visible, onDismiss, autoDismissDuration]);

  return (
    <Modal transparent={true} animationType="fade" visible={visible} onRequestClose={onDismiss}>
      <View style={styles.overlay}>
        <Animated.View style={[styles.box, { transform: [{ scale: scaleAnim }] }]}>
          <Text style={styles.title}>🔥 OVEN READY! 🔥</Text>
          <Text style={styles.subtitle}>Oven light dropped. Get the pizza in.</Text>
          <CustomButton
            title="Got It!"
            onPress={() => {
              AudioModule.stopAudio();
              onDismiss?.();
            }}
            color="#FFD700"
          />
        </Animated.View>
      </View>
    </Modal>

  );
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.85)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  box: {
    backgroundColor: '#FF4500',
    padding: 30,
    borderRadius: 20,
    alignItems: 'center',
  },
  title: {
    fontSize: 32,
    color: 'white',
    fontWeight: 'bold',
    textAlign: 'center',
  },
  subtitle: {
    fontSize: 20,
    color: '#FFD700',
    marginTop: 10,
    textAlign: 'center',
  },
});

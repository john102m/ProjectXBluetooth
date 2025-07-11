import React from 'react';
import { Modal, View, Text, StyleSheet } from 'react-native';
import Slider from '@react-native-community/slider';
import CustomButton from './CustomButton';

type Props = {
  visible: boolean;
  inputValue: string;
  onChangeInput: (value: string) => void;
  onSave: () => void;
  onClose: () => void;
  isAutoMode: boolean; // 👈 New prop!
};

export default function ThresholdModal({
  visible,
  inputValue,
  onChangeInput,
  onSave,
  onClose,
  isAutoMode,
}: Props) {
  return (
    <Modal
      animationType="slide"
      transparent={true}
      visible={visible}
      onRequestClose={onClose}
    >
      <View style={styles.backdrop}>
        <View style={styles.modalBox}>
          <Text style={styles.label}>Set Light Threshold</Text>

          <Text style={styles.sliderLabel}>
            {isAutoMode
              ? `Ambient: ${inputValue || '50'}%`
              : `Absolute: ${inputValue || '50'}%`}
          </Text>
          <Slider
            // eslint-disable-next-line react-native/no-inline-styles
            style={{ width: '100%', height: 40 }}
            minimumValue={1}
            maximumValue={100}
            step={1}
            value={parseFloat(inputValue) || 50}
            onValueChange={(val) => onChangeInput(val.toString())}
            minimumTrackTintColor="#FFA500"
            thumbTintColor="#FFD700"
          />

          <CustomButton
            title="💾 Save Threshold"
            onPress={onSave}
            color="#FFA500"
          />
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  backdrop: {
    flex: 1,
    justifyContent: 'center',
    backgroundColor: 'rgba(0,0,0,0.5)',
  },
  modalBox: {
    margin: 20,
    backgroundColor: 'white',
    padding: 20,
    borderRadius: 10,
    elevation: 5,
  },
  label: {
    fontSize: 18,
    fontWeight: '600',
    marginBottom: 10,
  },
  sliderLabel: {
    fontSize: 16,
    textAlign: 'center',
    marginBottom: 10,
  },
});

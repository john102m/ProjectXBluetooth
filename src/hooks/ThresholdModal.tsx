import React from 'react';
import { Modal, View, Text, TextInput, StyleSheet } from 'react-native';
import CustomButton from './CustomButton';

type Props = {
  visible: boolean;
  inputValue: string;
  onChangeInput: (value: string) => void;
  onSave: () => void;
  onClose: () => void;
};

export default function ThresholdModal({
  visible,
  inputValue,
  onChangeInput,
  onSave,
  onClose,
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
          <TextInput
            style={styles.input}
            keyboardType="numeric"
            value={inputValue}
            onChangeText={onChangeInput}
            placeholder="Enter value"
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
  input: {
    borderBottomWidth: 1,
    marginBottom: 10,
    fontSize: 16,
    paddingVertical: 5,
  },
});

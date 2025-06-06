import React from 'react';
import { TouchableOpacity, Text, StyleSheet } from 'react-native';

const CustomButton = ({ onPress, title, color }: { onPress: () => void; title: string; color: string }) => (
    <TouchableOpacity onPress={onPress} style={[styles.button, { backgroundColor: color }]}>
        <Text style={styles.buttonText}>{title}</Text>
    </TouchableOpacity>
);

const styles = StyleSheet.create({
    button: {
        margin: 10,
        padding: 15,
        borderRadius: 10,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.3,
        shadowRadius: 5,
        elevation: 8, // Adds depth to buttons on Android
    },
    buttonText: {
        color: '#FFF',
        fontWeight: 'bold',
        textAlign: 'center',
    },
});

export default CustomButton;

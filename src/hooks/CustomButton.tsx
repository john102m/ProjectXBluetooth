import React from 'react';
import { TouchableOpacity, Text, StyleSheet } from 'react-native';

type ButtonProps = {
    onPress: () => void;
    title: string;
    color: string;
    disabled?: boolean; // ✅ optional prop
    style?: any
};

const CustomButton = ({ onPress, title, color, disabled = false, style = { minWidth: 150 } }: ButtonProps) => (
    <TouchableOpacity
        onPress={onPress}
        style={[styles.button, { backgroundColor: color }, style, disabled && styles.disabled]}
        activeOpacity={disabled ? 1 : 0.7}
        disabled={disabled} // ⛔ disables press interaction
    >
        <Text style={[styles.buttonText, disabled && styles.disabledText]}
            numberOfLines={1}
            ellipsizeMode="tail"
            adjustsFontSizeToFit
        >
            {title}
        </Text>
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
        elevation: 8,
    },
    buttonText: {
        color: '#FFF',
        fontWeight: 'bold',
        textAlign: 'center',
    },
    disabled: {
        opacity: 0.5, // 🔒 visually indicate inactive
    },
    disabledText: {
        color: '#DDD',
    },
});

export default CustomButton;

import React, { useRef, useEffect } from 'react';
import { Animated, Text, View, StyleSheet } from 'react-native';

type Props = {
    visible: boolean;
    threshold: number;
};

export default function StatusBanner({ visible, threshold }: Props) {
    const pulseAnim = useRef(new Animated.Value(1)).current;

    useEffect(() => {
        if (visible) {
            Animated.loop(
                Animated.sequence([
                    Animated.timing(pulseAnim, {
                        toValue: 0.3,
                        duration: 500,
                        useNativeDriver: true,
                    }),
                    Animated.timing(pulseAnim, {
                        toValue: 1,
                        duration: 500,
                        useNativeDriver: true,
                    }),
                ])
            ).start();
        } else {
            pulseAnim.setValue(1);
        }
    }, [visible, pulseAnim]); // ← add pulseAnim here


    if (!visible) {
        return null;
    }

    return (
        <View style={styles.container}>
            <Animated.View style={[styles.banner, { opacity: pulseAnim }]}>
                <Text style={styles.text}>🍕 Pizza Mode Primed @ {threshold}%</Text>
            </Animated.View>
        </View>
    );
}

const styles = StyleSheet.create({
    container: {
        alignItems: 'center',
        justifyContent: 'center',
        padding: 10,
    },
    banner: {
        backgroundColor: 'orange',
        padding: 10,
        borderRadius: 8,
        width: '90%',
        alignItems: 'center',
    },
    text: {
        fontWeight: 'bold',
        textAlign: 'center',
    },
});

import React, { useRef, useEffect } from 'react';
import { Animated, Text, View, StyleSheet } from 'react-native';
import { uptimeColor } from './useLiveUptime';
type Props = {
    visible: boolean;
    threshold: number;
    uptime: string;
    chargingStatus: boolean; // e.g. "Charging" or "Not Charging"
};


export default function StatusBanner({ visible, threshold, uptime, chargingStatus }: Props) {
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
    }, [visible, pulseAnim]);

    return (
        <View style={styles.container}>
            {visible ? (
                <Animated.View style={[styles.banner, { opacity: pulseAnim }]}>
                    <Text style={styles.text}>🍕 Pizza Mode Primed @ {threshold}%</Text>
                </Animated.View>
            ) : (
                <View style={styles.headerRow}>
                    <Text
                        numberOfLines={1}
                        style={styles.titleText}
                    >
                        🍕 PizzaBot
                    </Text>

                    <Text
                        numberOfLines={1}
                        // eslint-disable-next-line react-native/no-inline-styles
                        style={{
                            fontSize: 16,
                            color: uptimeColor(uptime),
                        }}
                    >
                        🕒 Uptime: {uptime}
                    </Text>
                    <Text
                        numberOfLines={1}
                        // eslint-disable-next-line react-native/no-inline-styles
                        style={{
                            fontSize: 16,
                            marginLeft: 8,
                            color: chargingStatus ? 'green' : 'black',
                        }}
                    >
                        🔋 {chargingStatus}
                    </Text>
                </View>
            )}
        </View>
    );
}

const styles = StyleSheet.create({
    container: {
        height: 70,
        justifyContent: 'center',
        backgroundColor: '#FFD700',
        paddingHorizontal: 22,
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
        fontSize: 16,
    },
    headerRow: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
    },
    titleText: {
        fontWeight: 'bold',
        fontSize: 18,
        marginRight: 10,
    },
});


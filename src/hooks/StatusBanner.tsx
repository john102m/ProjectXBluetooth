import React, { useRef, useEffect } from 'react';
import { Animated, Text, View, StyleSheet } from 'react-native';
import { uptimeColor } from './useLiveUptime';
type Props = {
    visible: boolean;
    threshold: number;
    uptime: string;
    chargingStatus: boolean | null; // e.g. "Charging" or "Not Charging"
};


export default function StatusBanner({ visible, threshold, uptime, chargingStatus }: Props) {
    const pulseAnim = useRef(new Animated.Value(1)).current;
    const flashAnim = useRef(new Animated.Value(1)).current;

    const emojiWrapperStyle = {
        ...styles.emojiWrapper,
        backgroundColor: chargingStatus ? 'green' : '#FFD700',
    };
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
    useEffect(() => {

        if (chargingStatus && !visible) {
            Animated.loop(
                Animated.sequence([
                    Animated.timing(flashAnim, {
                        toValue: 0.3,
                        duration: 300,
                        useNativeDriver: true,
                    }),
                    Animated.timing(flashAnim, {
                        toValue: 1,
                        duration: 300,
                        useNativeDriver: true,
                    }),
                ]),
            ).start();
        } else {
            flashAnim.setValue(0); // reset
        }
    }, [chargingStatus, flashAnim, visible]);




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

                    <View style={emojiWrapperStyle}>
                        <Animated.Text style={[styles.emojiText, { opacity: flashAnim }]}>
                            ⚡
                        </Animated.Text>
                    </View>

                </View>
            )}
        </View>
    );
}


const styles = StyleSheet.create({
    emojiWrapper: {
        width: 28,
        height: 28,
        borderRadius: 12,
        alignItems: 'center',
        justifyContent: 'center',
        marginLeft: 8,
    },
    emojiText: {
        color: 'white',
        fontSize: 16,
        textShadowColor: 'white',
        textShadowOffset: { width: 1, height: 1 },
        textShadowRadius: 1,
        marginTop: -4,
    },
    container: {
        height: 70,
        alignItems: 'center',
        justifyContent: 'center',
        backgroundColor: '#FFD700',
        paddingHorizontal: 22,
        width: '100%',
        paddingVertical: 10,
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



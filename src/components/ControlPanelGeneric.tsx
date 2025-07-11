import React, { useRef } from 'react';
import { View, Animated, StyleSheet } from 'react-native';
import CustomButton from './CustomButton';

const scaleAnimDuration = 200;

type ButtonConfig = {
    label: string;
    action: () => void;
    color?: string;
    style?: any;
    disabled?: boolean | ((ctx: ControlPanelContext) => boolean);
    animated?: boolean;
    row: number;
    col: number;
    id?: string; // optional unique ID
};


type ControlPanelProps = {
    buttons?: ButtonConfig[];
    context?: ControlPanelContext;
};

type ControlPanelContext = {
    isConnected?: boolean;
    isSubscribed?: boolean;
    isPizzaMode?: boolean;
    scaleAnim?: Animated.Value;
    triggerAnimation?: () => void,
    // scaleAnim and other UI props can go here too
};

export default function ControlPanelGeneric({
    buttons = [],
    context = {},
}: ControlPanelProps) {
    // Group buttons by row number
    const groupedByRow: Record<number, ButtonConfig[]> = {};
    const animsRef = useRef<Record<string, Animated.Value>>({});
    const getScaleAnim = (id: string): Animated.Value => {
        if (!animsRef.current[id]) {
            animsRef.current[id] = new Animated.Value(1);
        }
        return animsRef.current[id];
    };

    const triggerAnimation = (id: string) => {
        const anim = getScaleAnim(id);
        Animated.sequence([
            Animated.timing(anim, {
                toValue: 1.2,
                duration: scaleAnimDuration,
                useNativeDriver: true,
            }),
            Animated.timing(anim, {
                toValue: 1,
                duration: scaleAnimDuration,
                useNativeDriver: true,
            }),
        ]).start();
    };

    buttons.forEach((btn) => {
        if (!groupedByRow[btn.row]) {
            groupedByRow[btn.row] = [];
        }
        groupedByRow[btn.row].push(btn);
    });

    return (
        <View style={styles.buttonGroup}>
            {Object.entries(groupedByRow).map(([rowIndex, btns]) => (
                <View key={rowIndex} style={styles.buttonRow}>
                    {btns
                        .sort((a, b) => a.col - b.col)
                        .map((btn, idx) => {
                            const id = btn.id ?? `${rowIndex}-${idx}`;
                            const isDisabled =
                                typeof btn.disabled === 'function' ? btn.disabled(context) : btn.disabled ?? false;

                            const onPress = () => {
                                btn.action();
                                if (btn.animated) {
                                    triggerAnimation(id);
                                }
                            };

                            const buttonNode = (
                                <CustomButton
                                    key={id}
                                    title={btn.label}
                                    onPress={onPress}
                                    color={btn.color ?? '#999'}
                                    disabled={isDisabled}
                                    style={btn.style}
                                />
                            );

                            return btn.animated ? (
                                <Animated.View
                                    key={`animated-${id}`}
                                    style={{ transform: [{ scale: getScaleAnim(id) }] }}
                                >
                                    {buttonNode}
                                </Animated.View>
                            ) : buttonNode;
                        })
                    }
                </View>
            ))}
        </View>
    );

}

const styles = StyleSheet.create({
    buttonRow: {
        flexDirection: 'row',
        justifyContent: 'space-around',
        marginTop: 0,
        width: '100%',
        backgroundColor: '#FFF',
    },
    buttonGroup: {
        marginTop: 10,
        padding: 15,
    },
});

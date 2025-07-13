import React, { useEffect, useState } from 'react';
import { View, Text, Switch, StyleSheet } from 'react-native';
//import AsyncStorage from '@react-native-async-storage/async-storage';

//const STORAGE_KEY = 'autoConnectEnabled';

type Props = {
    shouldAutoConnect: boolean;
    setShouldAutoConnect: (val: boolean) => void;
};

export default function AutoConnectToggle({ shouldAutoConnect, setShouldAutoConnect }: Props) {
    const [enabled, setEnabled] = useState(shouldAutoConnect);

    // Load from storage on mount
    useEffect(() => {
        setEnabled(shouldAutoConnect);
    }, [shouldAutoConnect]);

    const toggleSwitch = async () => {
        const newVal = !enabled;
        setEnabled(newVal);
        await setShouldAutoConnect(newVal); // delegate saving to context
    };

    //if ycontext value changes externally, toggle updates accordingly:
    useEffect(() => {
        setEnabled(shouldAutoConnect);
    }, [shouldAutoConnect]);


    return (
        <View style={styles.switchView}>
            <Text style={styles.switchText}>Auto Connect</Text>
            <Switch
                value={enabled}
                onValueChange={toggleSwitch}
            />
        </View>
    );
}

const styles = StyleSheet.create({
    switchView: {
        flexDirection: 'row',
        alignItems: 'center',
        padding: 10,
        marginLeft: 20,
    },
    switchText: {
        fontSize: 16,
        marginRight: 8,
    },
});

import React from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { createNativeStackNavigator, NativeStackNavigationOptions  } from '@react-navigation/native-stack';
import HomeScreen from './src/screens/HomeScreen';
import ConnectScreen from './src/screens/ConnectScreen';
import { RootStackParamList } from './src/types/navigation';
import { BLEProvider } from './src/context/BLEContext';
import { TextStyle } from 'react-native';
const Stack = createNativeStackNavigator<RootStackParamList>();

const sharedHeaderOptions: NativeStackNavigationOptions = {
  title: '🍕 PizzaBot',
  headerStyle: { backgroundColor: '#101010' },
  headerTintColor: '#00eaff',
  headerTitleStyle: {
    fontWeight: 'bold' as TextStyle['fontWeight'],
    fontSize: 20,
  },
};

const App = () => {
  return (
    <BLEProvider>
      <NavigationContainer>
        <Stack.Navigator initialRouteName="Home">
          <Stack.Screen
            name="Home"
            component={HomeScreen}
            options={{
              ...sharedHeaderOptions,
              title: '🍕 PizzaBot',
            }}
          />
          <Stack.Screen
            name="ConnectScreen"
            component={ConnectScreen}
            options={{
              ...sharedHeaderOptions,
              title: '🔌 Controls',
            }}
          />
        </Stack.Navigator>
      </NavigationContainer>
    </BLEProvider>
  );
};

export default App;

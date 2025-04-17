import React from 'react';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import HomeScreen from '../screens/HomeScreen/HomeScreen';

const Stack = createNativeStackNavigator();
export default () => (
  <Stack.Navigator>
    <Stack.Screen name="Home" component={HomeScreen} />
    {/* otras pantallas */}
  </Stack.Navigator>
);
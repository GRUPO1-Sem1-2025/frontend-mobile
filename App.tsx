import React, { useEffect } from 'react';
import { StyleSheet } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import * as Linking from 'expo-linking';
import Constants from 'expo-constants';
import { NavigationContainer } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { registerForPushNotificationsAsync } from './src/notifications/registerPush';
import AppStack from './src/navigation/AppStack';
import PaymentSuccessScreen from './src/screens/PaymentScreen/PaymentSuccessScreen';
import PaymentCancelScreen from './src/screens/PaymentScreen/PaymentCancelScreen';

const Stack = createNativeStackNavigator();

export default function App() {
  useEffect(() => {
    AsyncStorage.getItem('userToken').then(userId => {
      if (userId) {
        registerForPushNotificationsAsync(userId);
      }
    });
  }, []);

  const linkingPrefix = Constants.expoConfig?.extra?.linkingPrefix ?? 'https://tecnobus.dev';

  const linking = {
    prefixes: [linkingPrefix, 'tecnobus://'],
    config: {
      screens: {
        PaymentSuccess: 'payment-success',
        PaymentCancel: 'payment-cancel',
        AppDrawer: '*',
      },
    },
  };

  return (
    <NavigationContainer linking={linking}>
      <Stack.Navigator screenOptions={{ headerShown: false }}>
        <Stack.Screen name="AppDrawer" component={AppStack} />
        <Stack.Screen name="PaymentSuccess" component={PaymentSuccessScreen} />
        <Stack.Screen name="PaymentCancel" component={PaymentCancelScreen} />
      </Stack.Navigator>
    </NavigationContainer>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff',
    alignItems: 'center',
    justifyContent: 'center',
  },
});

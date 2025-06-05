import React, { useEffect } from 'react';
import { NavigationContainer, useNavigationContainerRef } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import * as Linking from 'expo-linking';
import Constants from 'expo-constants';
import AsyncStorage from '@react-native-async-storage/async-storage';

import { registerForPushNotificationsAsync } from './src/notifications/registerPush';
import AppStack from './src/navigation/AppStack';
import PaymentSuccessScreen from './src/screens/PaymentScreen/PaymentSuccessScreen';
import PaymentCancelScreen from './src/screens/PaymentScreen/PaymentCancelScreen';

const Stack = createNativeStackNavigator();

export default function App() {
  const navigationRef = useNavigationContainerRef();

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

  useEffect(() => {
    const handleDeepLink = (event: { url: string }) => {
      const { url } = event;
      console.log('🟡 [DEBUG] handleDeepLink -> URL:', url);

      const parsed = Linking.parse(url);
      console.log('🔗 [DEBUG] Link parseado:', parsed);

      if (!navigationRef.isReady()) {
        console.warn('⚠️ [DEBUG] navigationRef aún no está listo.');
        return;
      }

      const currentRoute = navigationRef.getCurrentRoute();
      console.log('📍 [DEBUG] Ruta actual antes de reset:', currentRoute);

      if (parsed.path === 'payment-success') {
        console.log('✅ [DEBUG] Navegando a PaymentSuccessScreen');
        navigationRef.reset({
          index: 0,
          routes: [{ name: 'PaymentSuccess' }],
        });
      }

      if (parsed.path === 'payment-cancel') {
        console.log('✅ [DEBUG] Navegando a PaymentCancelScreen');
        navigationRef.reset({
          index: 0,
          routes: [{ name: 'PaymentCancel' }],
        });
      }
    };

    const subscription = Linking.addEventListener('url', handleDeepLink);

    Linking.getInitialURL().then(url => {
      if (url) {
        console.log('🟢 [DEBUG] getInitialURL:', url);
        handleDeepLink({ url });
      } else {
        console.log('🔵 [DEBUG] No initial URL detectada');
      }
    });

    return () => {
      subscription.remove();
    };
  }, [navigationRef]);

  return (
    <NavigationContainer
      ref={navigationRef}
      linking={linking}
      onReady={() => console.log('🟢 [DEBUG] NavigationContainer listo')}
    >
      <Stack.Navigator screenOptions={{ headerShown: false }}>
        <Stack.Screen name="AppDrawer" component={AppStack} />
        <Stack.Screen name="PaymentSuccess" component={PaymentSuccessScreen} />
        <Stack.Screen name="PaymentCancel" component={PaymentCancelScreen} />
      </Stack.Navigator>
    </NavigationContainer>
  );
}

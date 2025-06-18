import 'react-native-gesture-handler';
import React, { useContext, useEffect } from 'react';
import { NavigationContainer, useNavigationContainerRef } from '@react-navigation/native';
import * as Linking from 'expo-linking';
import Constants from 'expo-constants';

import { AuthProvider, AuthContext } from './context/AuthContext';
import AuthStack from './navigation/AuthStack';
import AppStack from './navigation/AppStack';
import PaymentSuccessScreen from './screens/PaymentScreen/PaymentSuccessScreen';
import PaymentCancelScreen from './screens/PaymentScreen/PaymentCancelScreen';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';

// Definir el stack principal
type RootStackParamList = {
  AppDrawer: undefined;
  PaymentSuccess: undefined;
  PaymentCancel: undefined;
};

const Stack = createNativeStackNavigator<RootStackParamList>();

function RootNavigator() {
  const { token } = useContext(AuthContext);
  const navigationRef = useNavigationContainerRef<RootStackParamList>();

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

      const parsed = Linking.parse(url);

      if (!navigationRef.isReady()) {
        return;
      }

      const currentRoute = navigationRef.getCurrentRoute();

      if (parsed.hostname === 'payment-success') {
        navigationRef.navigate('PaymentSuccess');
      }

      if (parsed.hostname === 'payment-cancel') {
        navigationRef.navigate('PaymentCancel');
      }
    };

    const subscription = Linking.addEventListener('url', handleDeepLink);

    Linking.getInitialURL().then(url => {
      if (url) {
        handleDeepLink({ url });
      } else {
      }
    });

    return () => {
      subscription.remove();
    };
  }, [navigationRef]);

  return (
    <NavigationContainer ref={navigationRef} linking={linking}>
      <Stack.Navigator screenOptions={{ headerShown: false }}>
        {token ? (
          <>
            <Stack.Screen name="AppDrawer" component={AppStack} />
            <Stack.Screen name="PaymentSuccess" component={PaymentSuccessScreen} />
            <Stack.Screen name="PaymentCancel" component={PaymentCancelScreen} />
          </>
        ) : (
          <Stack.Screen name="AppDrawer" component={AuthStack} />
        )}
      </Stack.Navigator>
    </NavigationContainer>
  );
}

export default function App() {
  return (
    <AuthProvider>
      <RootNavigator />
    </AuthProvider>
  );
}

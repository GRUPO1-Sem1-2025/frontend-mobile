import React from 'react';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import LoginScreen      from '../screens/LoginScreen/LoginScreen';
import RegisterScreen   from '../screens/RegisterScreen/RegisterScreen';
import VerifyCodeScreen from '../screens/LoginScreen/VerifyCodeScreen';

export type AuthStackParamList = {
  Login: undefined;
  Register: undefined;
  VerifyCode: { email: string };
};

const Stack = createNativeStackNavigator<AuthStackParamList>();

export default function AuthStack() {
  return (
    <Stack.Navigator initialRouteName="Login">
      <Stack.Screen
        name="Login"
        component={LoginScreen}
        options={{ title: 'Iniciar Sesión' }}
      />
      <Stack.Screen
        name="Register"
        component={RegisterScreen}
        options={{ title: 'Registro' }}
      />
      <Stack.Screen
        name="VerifyCode"
        component={VerifyCodeScreen}
        options={{ title: 'Verificar Código' }}
      />
    </Stack.Navigator>
  );
}

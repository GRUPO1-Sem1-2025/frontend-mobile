import React from 'react';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import AppDrawer from './AppDrawer';
import AvailableTripsScreen from '../screens/AvailableTripScreen/AvailableTripScreen';
import BusSelectionScreen from '../screens/BusSelectionScreen/BusSelectionScreen';
import PaymentScreen from '../screens/PaymentScreen/PaymentScreen';
import PaymentSuccessScreen from '../screens/PaymentScreen/PaymentSuccessScreen';
import PaymentCancelScreen from '../screens/PaymentScreen/PaymentCancelScreen';
import SelectLocationScreen from '../screens/LocationScreen/SelectLocationScreen';
import { Trip } from '../types/trips';

export type AppStackParamList = {
  AppDrawer: undefined;
  AvailableTrips: {
    origin: number;
    destination: number;
    tripType: 'oneway' | 'roundtrip';
    departDate: Date;
    returnDate?: Date;
  };
  BusSelection: {
    busId: number;
  };
  Payment: {
    origin: number;
    destination: number;
    tripType: 'oneway' | 'roundtrip';
    departDate: string;
    returnDate?: string;
    outboundTrip: Trip;
    returnTrip?: Trip;
    outboundSeats: number[];
    returnSeats?: number[];
    idCompraIda?: number;
    idCompraVuelta?: number;
  };
  PaymentSuccess: undefined;
  PaymentCancel: undefined;
  PayPalWebView: { amount: string };
  SelectLocation: {
    localities: { id: number; nombre: string; departamento: string }[];
    setValue: (id: number) => void;
  };
};

const Stack = createNativeStackNavigator<AppStackParamList>();

export default function AppStack() {
  return (
    <Stack.Navigator
      screenOptions={{
        headerTitleAlign: 'center',
        headerBackTitle: 'Volver',
      }}
    >
      <Stack.Screen
        name="AppDrawer"
        component={AppDrawer}
        options={{ headerShown: false }}
      />
      <Stack.Screen
        name="AvailableTrips"
        component={AvailableTripsScreen}
        options={{ title: 'Viajes Disponibles' }}
      />
      <Stack.Screen
        name="BusSelection"
        component={BusSelectionScreen}
        options={{ title: 'Seleccionar Bus' }}
      />
      <Stack.Screen
        name="Payment"
        component={PaymentScreen}
        options={{ title: 'Pago' }}
      />
      <Stack.Screen
        name="PaymentSuccess"
        component={PaymentSuccessScreen}
        options={{ title: 'Pago Exitoso' }}
      />
      <Stack.Screen
        name="PaymentCancel"
        component={PaymentCancelScreen}
        options={{ title: 'Pago Cancelado' }}
      />
      <Stack.Screen
        name="SelectLocation"
        component={SelectLocationScreen}
        options={{ title: 'Selecciona una localidad' }}
      />
    </Stack.Navigator>
  );
}

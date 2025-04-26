import React from 'react';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import AppDrawer from './AppDrawer';
import AvailableTripsScreen from '../screens/AvailableTripScreen/AvailableTripScreen';
import BusSelectionScreen   from '../screens/BusSelectionScreen/BusSelectionScreen';

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
};

const Stack = createNativeStackNavigator<AppStackParamList>();

export default function AppStack() {
  return (
    <Stack.Navigator screenOptions={{ headerTitleAlign: 'center' }}>
      {/* Aquí va tu Drawer como pantalla inicial */}
      <Stack.Screen
        name="AppDrawer"
        component={AppDrawer}
        options={{ headerShown: false }}
      />

      {/* Pantalla de listado de viajes tras pulsar “Buscar” */}
      <Stack.Screen
        name="AvailableTrips"
        component={AvailableTripsScreen}
        options={{ title: 'Viajes Disponibles' }}
      />

      {/* Pantalla de selección de bus */}
      <Stack.Screen
        name="BusSelection"
        component={BusSelectionScreen}
        options={{ title: 'Seleccionar Bus' }}
      />
    </Stack.Navigator>
  );
}
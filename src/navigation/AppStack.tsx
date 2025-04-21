import React from 'react';
import { createDrawerNavigator } from '@react-navigation/drawer';
import HomeScreen      from '../screens/HomeScreen/HomeScreen';
import TravelsScreens  from '../screens/TravelsScreen/TravelsScreen';

const Drawer = createDrawerNavigator();

export default function AppStack() {
  return (
    <Drawer.Navigator
      initialRouteName="Home"
      screenOptions={{ headerTitleAlign: 'center' }}
    >
      {/* Opción de Home */}
      <Drawer.Screen
        name="Home"
        component={HomeScreen}
        options={{ title: 'Inicio' }}
      />
      {/* Tu nueva opción de Travels */}
      <Drawer.Screen
        name="Travels"
        component={TravelsScreens}
        options={{ title: 'Mis Viajes' }}
      />
    </Drawer.Navigator>
  );
}
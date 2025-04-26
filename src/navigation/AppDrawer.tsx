import React from 'react';
import { createDrawerNavigator } from '@react-navigation/drawer';
import HomeScreen      from '../screens/HomeScreen/HomeScreen';
import TravelsScreen   from '../screens/TravelsScreen/TravelsScreen';
import ProfileScreen   from '../screens/Profiles/ProfileScreen';

const Drawer = createDrawerNavigator();

export default function AppDrawer() {
  return (
    <Drawer.Navigator
      initialRouteName="Home"
      screenOptions={{ headerTitleAlign: 'center' }}
    >
      <Drawer.Screen
        name="Home"
        component={HomeScreen}
        options={{ title: 'Inicio' }}
      />
      <Drawer.Screen
        name="Travels"
        component={TravelsScreen}
        options={{ title: 'Mis Viajes' }}
      />
      <Drawer.Screen
        name="Profile"
        component={ProfileScreen}
        options={{ title: 'Mi Perfil' }}
      />
    </Drawer.Navigator>
  );
}

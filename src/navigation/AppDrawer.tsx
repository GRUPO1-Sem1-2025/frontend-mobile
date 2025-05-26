import React, { useContext } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  Alert,
  SafeAreaView,
} from 'react-native';
import {
  createDrawerNavigator,
  DrawerContentScrollView,
  DrawerItemList,
} from '@react-navigation/drawer';
import { Ionicons } from '@expo/vector-icons';

import HomeScreen from '../screens/HomeScreen/HomeScreen';
import TravelsScreen from '../screens/TravelsScreen/TravelsScreen';
import ProfileScreen from '../screens/Profiles/ProfileScreen';
import { AuthContext } from '../context/AuthContext';

const Drawer = createDrawerNavigator();

function CustomDrawerContent(props: any) {
  const { logout } = useContext(AuthContext);

  const confirmLogout = () => {
    Alert.alert(
      'Cerrar sesión',
      '¿Estás seguro de que querés cerrar sesión?',
      [
        { text: 'Cancelar', style: 'cancel' },
        {
          text: 'Sí, cerrar',
          style: 'destructive',
          onPress: async () => {
            await logout();
          },
        },
      ],
      { cancelable: true }
    );
  };

  return (
    <SafeAreaView style={styles.safeArea}>
      <DrawerContentScrollView
        {...props}
        contentContainerStyle={styles.scrollContainer}
      >
        <DrawerItemList {...props} />
      </DrawerContentScrollView>

      <View style={styles.footer}>
        <TouchableOpacity style={styles.logoutButton} onPress={confirmLogout}>
          <View style={styles.logoutRow}>
            <Ionicons name="log-out-outline" size={20} color="#d00" style={{ marginRight: 8 }} />
            <Text style={styles.logoutText}>Cerrar sesión</Text>
          </View>
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
}

export default function AppDrawer() {
  return (
    <Drawer.Navigator
      initialRouteName="Home"
      screenOptions={{ headerTitleAlign: 'center' }}
      drawerContent={props => <CustomDrawerContent {...props} />}
    >
      <Drawer.Screen
        name="Home"
        component={HomeScreen}
        options={{
          title: 'Inicio',
          drawerIcon: ({ color, size }) => (
            <Ionicons name="home-outline" size={size} color={color} />
          ),
        }}
      />
      <Drawer.Screen
        name="Travels"
        component={TravelsScreen}
        options={{
          title: 'Mis Viajes',
          drawerIcon: ({ color, size }) => (
            <Ionicons name="bus-outline" size={size} color={color} />
          ),
        }}
      />
      <Drawer.Screen
        name="Profile"
        component={ProfileScreen}
        options={{
          title: 'Mi Perfil',
          drawerIcon: ({ color, size }) => (
            <Ionicons name="person-outline" size={size} color={color} />
          ),
        }}
      />
    </Drawer.Navigator>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: '#ffffff',
  },
  scrollContainer: {
    flexGrow: 1,
  },
  footer: {
    borderTopWidth: 1,
    borderColor: '#eee',
    padding: 16,
    backgroundColor: '#fafafa',
  },
  logoutButton: {
    paddingVertical: 10,
  },
  logoutRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  logoutText: {
    fontSize: 16,
    color: '#d00',
    fontWeight: '600',
  },
});

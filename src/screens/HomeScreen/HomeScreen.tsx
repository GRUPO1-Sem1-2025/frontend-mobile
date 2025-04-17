import React, { useContext } from 'react';
import { View, Text, Button, StyleSheet } from 'react-native';
import { AuthContext } from '../../context/AuthContext';
import styles from './styles';

export default function HomeScreen() {
  const { logout, token } = useContext(AuthContext);

  return (
    <View style={styles.container}>
      <Text style={styles.title}>¡Bienvenido!</Text>
      <Text style={styles.subtitle}>
        {token ? 'Estás autenticado correctamente.' : 'No hay token válido.'}
      </Text>
      <View style={styles.button}>
        <Button title="Cerrar sesión" onPress={logout} />
      </View>
    </View>
  );
}
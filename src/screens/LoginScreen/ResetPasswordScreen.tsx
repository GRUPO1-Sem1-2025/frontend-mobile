// src/screens/ResetPasswordScreen.tsx

import React, { useState, useContext } from 'react';
import {
  View,
  TextInput,
  StyleSheet,
  Text,
  TouchableOpacity,
  Alert,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  ActivityIndicator,
} from 'react-native';
import { AuthContext } from '../../context/AuthContext';
import { useNavigation, useRoute } from '@react-navigation/native';

type RouteParams = {
  email: string;
  oldPassword: string;
};

export default function ResetPasswordScreen() {
  const { changePassword } = useContext(AuthContext);
  const navigation = useNavigation<any>();
  const route = useRoute();
  const { email, oldPassword } = route.params as RouteParams;

  const [newPass, setNewPass] = useState('');
  const [newPass1, setNewPass1] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleChangePassword = async () => {
    if (!newPass || !newPass1) {
      setError('Debes completar ambos campos de nueva contraseña');
      return;
    }
    if (newPass !== newPass1) {
      setError('Las nuevas contraseñas no coinciden');
      return;
    }

    setLoading(true);
    setError(null);

    try {
      await changePassword(email, oldPassword, newPass, newPass1);
      Alert.alert('Contraseña actualizada', 'Ahora puedes iniciar sesión con la nueva contraseña', [
        { text: 'OK', onPress: () => navigation.navigate('Login') },
      ]);
    } catch (e) {
      setError((e as Error).message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <KeyboardAvoidingView
      style={{ flex: 1 }}
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      keyboardVerticalOffset={Platform.OS === 'ios' ? 64 : 0}
    >
      <ScrollView
        contentContainerStyle={styles.container}
        keyboardShouldPersistTaps="handled"
      >
        <Text style={styles.title}>Restablecer Contraseña</Text>

        <Text style={styles.label}>Nueva Contraseña:</Text>
        <TextInput
          placeholder="Nueva Contraseña"
          style={styles.input}
          secureTextEntry
          value={newPass}
          onChangeText={setNewPass}
        />

        <Text style={styles.label}>Confirmar Nueva Contraseña:</Text>
        <TextInput
          placeholder="Confirmar Nueva Contraseña"
          style={styles.input}
          secureTextEntry
          value={newPass1}
          onChangeText={setNewPass1}
        />

        {error && <Text style={styles.error}>{error}</Text>}

        {loading ? (
          <ActivityIndicator color="#1f2c3a" />
        ) : (
          <TouchableOpacity style={styles.button} onPress={handleChangePassword}>
            <Text style={styles.buttonText}>Cambiar Contraseña</Text>
          </TouchableOpacity>
        )}
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: {
    flexGrow: 1,
    justifyContent: 'center',
    padding: 16,
    backgroundColor: '#c6eefc',
  },
  title: {
    fontSize: 24,
    marginBottom: 24,
    textAlign: 'center',
    color: '#1f2c3a',
  },
  label: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#1f2c3a',
    marginBottom: 4,
  },
  input: {
    borderWidth: 1,
    borderColor: '#91d5f4',
    borderRadius: 8,
    marginBottom: 12,
    padding: 12,
    backgroundColor: '#ffffff',
    color: '#1f2c3a',
    fontSize: 16,
  },
  error: {
    color: 'red',
    marginBottom: 12,
    textAlign: 'center',
  },
  button: {
    backgroundColor: '#f9c94e',
    paddingVertical: 14,
    borderRadius: 8,
    marginTop: 8,
  },
  buttonText: {
    color: '#1f2c3a',
    fontSize: 18,
    textAlign: 'center',
    fontWeight: 'bold',
  },
});

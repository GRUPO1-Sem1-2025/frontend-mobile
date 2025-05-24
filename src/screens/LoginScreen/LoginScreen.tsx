// src/screens/LoginScreen.tsx
import React, { useState, useContext } from 'react';
import {
  View,
  TextInput,
  Button,
  StyleSheet,
  ActivityIndicator,
  Text,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  Alert,
  TouchableOpacity,
} from 'react-native';
import { AuthContext } from '../../context/AuthContext';
import { useNavigation } from '@react-navigation/native';

export default function LoginScreen() {
  const { requestCode } = useContext(AuthContext);
  const navigation = useNavigation<any>();

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleNext = async () => {
    if (!email || !password) {
      setError('Debes completar todos los campos');
      return;
    }

    setLoading(true);
    setError(null);
    try {
      await requestCode(email, password);
      Alert.alert('Login exitoso', 'Te enviamos un código para validar tu cuenta', [
        {
          text: 'OK',
          onPress: () => navigation.navigate('VerifyCode', { email }),
        },
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
        <Text style={styles.title}>Iniciar Sesión</Text>

        <TextInput
          placeholder="Correo electrónico"
          style={styles.input}
          placeholderTextColor="#1f2c3a"
          value={email}
          onChangeText={setEmail}
          autoCapitalize="none"
          keyboardType="email-address"
        />
        <TextInput
          placeholder="Contraseña"
          style={styles.input}
          placeholderTextColor="#1f2c3a"
          secureTextEntry
          value={password}
          onChangeText={setPassword}
        />

        {error && <Text style={styles.error}>{error}</Text>}

        {loading ? (
          <ActivityIndicator color="#1f2c3a" />
        ) : (
          <>
            <TouchableOpacity style={styles.loginButton} onPress={handleNext}>
              <Text style={styles.loginButtonText}>Login</Text>
            </TouchableOpacity>
            <Text style={styles.or}>¿No tienes cuenta?</Text>
            <TouchableOpacity onPress={() => navigation.navigate('Register')}>
              <Text style={styles.link}>Registrarse</Text>
            </TouchableOpacity>
          </>
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
    backgroundColor: '#c6eefc', // fondo suave
  },
  title: {
    fontSize: 24,
    marginBottom: 24,
    textAlign: 'center',
    color: '#1f2c3a',
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
  loginButton: {
    backgroundColor: '#f9c94e',
    paddingVertical: 14,
    borderRadius: 8,
    marginTop: 8,
  },
  loginButtonText: {
    color: '#1f2c3a',
    fontSize: 18,
    textAlign: 'center',
    fontWeight: 'bold',
  },
  or: {
    marginTop: 24,
    textAlign: 'center',
    color: '#1f2c3a',
    fontSize: 16,
  },
  link: {
    textAlign: 'center',
    marginTop: 8,
    color: '#1f2c3a',
    fontWeight: 'bold',
    textDecorationLine: 'underline',
    fontSize: 16,
  },
});

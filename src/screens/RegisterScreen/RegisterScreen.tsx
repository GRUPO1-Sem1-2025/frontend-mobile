import React, { useState, useContext } from 'react';
import {
  View,
  TextInput,
  Button,
  StyleSheet,
  ActivityIndicator,
  Text
} from 'react-native';
import { AuthContext } from '../../context/AuthContext';
import { useNavigation } from '@react-navigation/native';

export default function RegisterScreen() {
  const { register } = useContext(AuthContext);
  const navigation = useNavigation<any>();

  const [nombre, setnombre] = useState('');
  const [apellido,  setapellido]  = useState('');
  const [email,     setEmail]     = useState('');
  const [password,  setPassword]  = useState('');
  const [confirm,   setConfirm]   = useState('');
  const [loading,   setLoading]   = useState(false);
  const [error,     setError]     = useState<string | null>(null);

  const handleRegister = async () => {
    if (!nombre || !apellido) {
      setError('Debes ingresar nombre y apellido');
      return;
    }
    if (password !== confirm) {
      setError('Las contraseñas no coinciden');
      return;
    }
    setLoading(true);
    setError(null);
    try {
      await register(nombre, apellido, email, password);
      navigation.navigate('VerifyCode', { email });
    } catch (e) {
      setError((e as Error).message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Registro</Text>
      <TextInput
        placeholder="Nombre"
        style={styles.input}
        value={nombre}
        onChangeText={setnombre}
      />
      <TextInput
        placeholder="Apellido"
        style={styles.input}
        value={apellido}
        onChangeText={setapellido}
      />
      <TextInput
        placeholder="Correo electrónico"
        style={styles.input}
        value={email}
        onChangeText={setEmail}
        autoCapitalize="none"
        keyboardType="email-address"
      />
      <TextInput
        placeholder="Contraseña"
        style={styles.input}
        secureTextEntry
        value={password}
        onChangeText={setPassword}
      />
      <TextInput
        placeholder="Confirma contraseña"
        style={styles.input}
        secureTextEntry
        value={confirm}
        onChangeText={setConfirm}
      />
      {error && <Text style={styles.error}>{error}</Text>}
      {loading
        ? <ActivityIndicator />
        : <Button title="Registrarme" onPress={handleRegister} />
      }
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex:1, justifyContent:'center', padding:16 },
  title:     { fontSize:24, marginBottom:16, textAlign:'center' },
  input:     { borderWidth:1, borderRadius:4, marginBottom:12, padding:8 },
  error:     { color:'red', marginBottom:12, textAlign:'center' },
});

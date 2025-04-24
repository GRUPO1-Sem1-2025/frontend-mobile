// src/screens/VerifyCodeScreen.tsx
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
} from 'react-native';
import { AuthContext } from '../../context/AuthContext';
import { useRoute } from '@react-navigation/native';

type RouteParams = { email: string };

export default function VerifyCodeScreen() {
  const { verifyCode } = useContext(AuthContext);
  const route = useRoute();
  const { email } = route.params as RouteParams;
  const [code, setCode] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleVerify = async () => {
    setLoading(true);
    setError(null);
    try {
      await verifyCode(email, code);
      // al cambiar token, RootNavigator mostrará AppStack automáticamente
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
        <Text style={styles.title}>Código enviado a {email}</Text>
        <TextInput
          placeholder="Código de 5 dígitos"
          style={styles.input}
          value={code}
          onChangeText={setCode}
          keyboardType="numeric"
          maxLength={5}
        />
        {error && <Text style={styles.error}>{error}</Text>}
        {loading ? (
          <ActivityIndicator />
        ) : (
          <Button title="Verificar código" onPress={handleVerify} />
        )}
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: { flexGrow: 1, justifyContent: 'center', padding: 16 },
  title: { fontSize: 20, marginBottom: 12, textAlign: 'center' },
  input: {
    borderWidth: 1,
    borderRadius: 4,
    marginBottom: 12,
    padding: 8,
    textAlign: 'center',
    backgroundColor: '#fafafa',
  },
  error: { color: 'red', marginBottom: 12, textAlign: 'center' },
});
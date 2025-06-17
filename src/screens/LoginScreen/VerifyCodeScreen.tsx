import React, { useState, useContext, useRef } from 'react';
import {
  View,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  Alert,
  NativeSyntheticEvent,
  TextInputKeyPressEventData,
  Text,
} from 'react-native';
import { AuthContext } from '../../context/AuthContext';
import { useRoute, useNavigation, CommonActions } from '@react-navigation/native';
import * as Animatable from 'react-native-animatable';
import * as Clipboard from 'expo-clipboard';

type RouteParams = { email: string };

export default function VerifyCodeScreen() {
  const { verifyCode, resendCode } = useContext(AuthContext);
  const route = useRoute();
  const navigation = useNavigation();
  const { email } = route.params as RouteParams;

  const [code, setCode] = useState<string[]>(['', '', '', '', '']);
  const [loading, setLoading] = useState(false);
  const [resending, setResending] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const errorRef = useRef<Animatable.View & View>(null);
  const inputs = useRef<Array<TextInput | null>>([]);

  const handleChange = async (text: string, index: number) => {
    // Si se pega más de un carácter (posible pegado)
    if (text.length > 1) {
      const cleaned = text.replace(/\D/g, '');
      if (cleaned.length === 5) {
        const newCode = cleaned.split('');
        setCode(newCode);
        inputs.current[4]?.blur();

        setTimeout(() => {
          handleVerify(cleaned); // pasa directamente el código
        }, 300);
      } else {
        setCode(['', '', '', '', '']);
        setError('Código inválido. Debe contener 5 números.');
        errorRef.current?.shake?.();
        inputs.current[0]?.focus();
      }
      return;
    }

    // Si es un solo dígito válido
    if (/^[0-9]$/.test(text)) {
      const newCode = [...code];
      newCode[index] = text;
      setCode(newCode);
      if (index < 4) inputs.current[index + 1]?.focus();
    }
  };

  const handleKeyPress = (
    e: NativeSyntheticEvent<TextInputKeyPressEventData>,
    index: number
  ) => {
    if (e.nativeEvent.key === 'Backspace' && code[index] === '' && index > 0) {
      const newCode = [...code];
      newCode[index - 1] = '';
      setCode(newCode);
      inputs.current[index - 1]?.focus();
    }
  };

  const handleVerify = async (codigoManual?: string) => {
    const finalCode = codigoManual ?? code.join('');
    if (finalCode.length !== 5 || !/^\d{5}$/.test(finalCode)) {
      setError('El código debe tener 5 dígitos numéricos');
      errorRef.current?.shake?.();
      return;
    }

    setLoading(true);
    setError(null);
    try {
      await verifyCode(email, finalCode);
      Alert.alert('¡Éxito!', 'Código verificado correctamente', [
        {
          text: 'Continuar',
          onPress: () => {
            navigation.dispatch(
              CommonActions.reset({
                index: 0,
                routes: [{ name: 'AppDrawer' }],
              })
            );
          },
        },
      ]);
    } catch (e) {
      setError((e as Error).message);
      errorRef.current?.shake?.();
    } finally {
      setLoading(false);
    }
  };

  const handleResendCode = async () => {
    setResending(true);
    try {
      await resendCode(email);
      Alert.alert('¡Éxito!', 'El código fue reenviado correctamente.');
    } catch (error: any) {
      Alert.alert('Error', error.message || 'No se pudo reenviar el código.');
    } finally {
      setResending(false);
    }
  };

  return (
    <KeyboardAvoidingView
      style={{ flex: 1 }}
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      keyboardVerticalOffset={Platform.OS === 'ios' ? 64 : 0}
    >
      <ScrollView contentContainerStyle={styles.container} keyboardShouldPersistTaps="handled">
        <Text style={styles.title}>Código enviado a {email}</Text>

        <View style={styles.codeContainer}>
          {code.map((digit, index) => (
            <Animatable.View
              key={index}
              animation="fadeInUp"
              duration={400}
              delay={index * 80}
            >
              <TextInput
                ref={(ref) => {
                  inputs.current[index] = ref;
                }}
                style={styles.digitInput}
                value={digit}
                onChangeText={(text) => handleChange(text, index)}
                onKeyPress={(e) => handleKeyPress(e, index)}
                keyboardType="numeric"
                maxLength={5} // detecta pegado
                returnKeyType={index === 4 ? 'done' : 'next'}
                onSubmitEditing={() => {
                  if (index === 4) handleVerify();
                  else inputs.current[index + 1]?.focus();
                }}
              />
            </Animatable.View>
          ))}
        </View>

        {error && (
          <Animatable.View ref={errorRef}>
            <Text style={styles.error}>{error}</Text>
          </Animatable.View>
        )}

        {loading ? (
          <ActivityIndicator color="#1f2c3a" />
        ) : (
          <TouchableOpacity style={styles.verifyButton} onPress={() => handleVerify()}>
            <Text style={styles.verifyButtonText}>Verificar código</Text>
          </TouchableOpacity>
        )}

        <TouchableOpacity
          style={styles.resendButton}
          onPress={handleResendCode}
          disabled={resending}
        >
          {resending ? (
            <ActivityIndicator color="#1f2c3a" />
          ) : (
            <Text style={styles.resendButtonText}>Reenviar código</Text>
          )}
        </TouchableOpacity>
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
    fontSize: 22,
    marginBottom: 24,
    textAlign: 'center',
    color: '#1f2c3a',
  },
  codeContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 16,
    paddingHorizontal: 20,
  },
  digitInput: {
    borderWidth: 1,
    borderRadius: 8,
    width: 50,
    height: 50,
    fontSize: 24,
    textAlign: 'center',
    backgroundColor: '#ffffff',
    borderColor: '#91d5f4',
    color: '#1f2c3a',
  },
  error: {
    color: 'red',
    marginBottom: 12,
    textAlign: 'center',
  },
  verifyButton: {
    backgroundColor: '#f9c94e',
    paddingVertical: 14,
    borderRadius: 8,
    marginTop: 8,
  },
  verifyButtonText: {
    color: '#1f2c3a',
    fontSize: 18,
    textAlign: 'center',
    fontWeight: 'bold',
  },
  resendButton: {
    marginTop: 16,
    alignItems: 'center',
  },
  resendButtonText: {
    color: '#1f2c3a',
    fontSize: 16,
    textDecorationLine: 'underline',
  },
});

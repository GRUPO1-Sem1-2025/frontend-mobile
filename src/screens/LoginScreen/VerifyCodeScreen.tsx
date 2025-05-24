// src/screens/VerifyCodeScreen.tsx
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

type RouteParams = { email: string };

export default function VerifyCodeScreen() {
  const { verifyCode } = useContext(AuthContext);
  const route = useRoute();
  const navigation = useNavigation();
  const { email } = route.params as RouteParams;

  const [code, setCode] = useState<string[]>(['', '', '', '', '']);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const errorRef = useRef<Animatable.View & View>(null);
  const inputs = useRef<Array<TextInput | null>>([]);

  const handleChange = (text: string, index: number) => {
    if (/^[0-9]?$/.test(text)) {
      const newCode = [...code];
      newCode[index] = text;
      setCode(newCode);
      if (text && index < 4) inputs.current[index + 1]?.focus();
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

  const handleVerify = async () => {
    const finalCode = code.join('');
    if (finalCode.length !== 5) {
      setError('El código debe tener 5 dígitos');
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
                maxLength={1}
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
          <TouchableOpacity style={styles.verifyButton} onPress={handleVerify}>
            <Text style={styles.verifyButtonText}>Verificar código</Text>
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
});

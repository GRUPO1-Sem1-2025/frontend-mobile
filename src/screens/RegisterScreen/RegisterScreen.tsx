// src/screens/RegisterScreen.tsx
import React, { useState, useContext } from 'react';
import {
  View,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  ActivityIndicator,
  Text,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  Alert,
  Modal,
} from 'react-native';
import DateTimePicker from '@react-native-community/datetimepicker';
import { AuthContext } from '../../context/AuthContext';
import { useNavigation } from '@react-navigation/native';
import { Ionicons } from '@expo/vector-icons';

export default function RegisterScreen() {
  const { register } = useContext(AuthContext);
  const navigation = useNavigation<any>();

  const [nombre, setNombre] = useState('');
  const [apellido, setApellido] = useState('');
  const [ciRaw, setCiRaw] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirm, setConfirm] = useState('');
  const [fecNac, setFecNac] = useState<Date | null>(null);
  const [matricula, setMatricula] = useState('');
  const [showDate, setShowDate] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [intentado, setIntentado] = useState(false);

  const formatearCI = (value: string) => {
    const digits = value.replace(/\D/g, '').slice(0, 8);
    let formatted = digits;
    if (digits.length > 1) formatted = digits[0] + '.' + digits.slice(1);
    if (digits.length > 4) formatted = formatted.slice(0, 5) + '.' + formatted.slice(5);
    if (digits.length > 7) formatted = formatted.slice(0, 9) + '-' + formatted.slice(9);
    return formatted;
  };

  const handleRegister = async () => {
    setIntentado(true);
    const ci = ciRaw.replace(/\D/g, '');
    const camposObligatorios = [nombre, apellido, email, password, ci];
    const hayCamposVacios = camposObligatorios.some(c => !c.trim());
    if (hayCamposVacios || !fecNac) {
      setError('Debes completar todos los campos obligatorios');
      return;
    }
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      setError('El correo electrónico no es válido');
      return;
    }
    if (password.length < 6) {
      setError('La contraseña debe tener al menos 6 caracteres');
      return;
    }
    if (password !== confirm) {
      setError('Las contraseñas no coinciden');
      return;
    }

    setLoading(true);
    setError(null);
    try {
      const mensaje = await register(
        nombre,
        apellido,
        email,
        password,
        ci,
        fecNac.toISOString().split('T')[0],
        [], // Sin categorías
        undefined // No matricula porque no hay categorías
      );
      Alert.alert('Registro exitoso', mensaje, [
        { text: 'Continuar', onPress: () => navigation.navigate('VerifyCode', { email }) },
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
        style={{ flex: 1 }}
        contentContainerStyle={styles.scrollContent}
        keyboardShouldPersistTaps="handled"
      >
        <View style={styles.container}>
          <Text style={styles.title}>Registro</Text>
          <TextInput
            placeholder="Nombre"
            style={[styles.input, intentado && !nombre && styles.inputError]}
            value={nombre}
            onChangeText={setNombre}
          />
          <TextInput
            placeholder="Apellido"
            style={[styles.input, intentado && !apellido && styles.inputError]}
            value={apellido}
            onChangeText={setApellido}
          />
          <TextInput
            placeholder="Cédula de Identidad"
            style={[styles.input, intentado && !ciRaw && styles.inputError]}
            value={formatearCI(ciRaw)}
            onChangeText={setCiRaw}
            keyboardType="numeric"
          />
          <TextInput
            placeholder="Correo electrónico"
            style={[styles.input, intentado && !email && styles.inputError]}
            value={email}
            onChangeText={setEmail}
            autoCapitalize="none"
            keyboardType="email-address"
          />
          <TouchableOpacity
            style={[styles.dateInput, intentado && !fecNac && styles.inputError]}
            onPress={() => setShowDate(true)}
          >
            <View style={styles.dateRow}>
              <Ionicons name="calendar-outline" size={20} color="#1f2c3a" style={{ marginRight: 8 }} />
              <Text style={{ color: '#1f2c3a' }}>
                {fecNac ? fecNac.toLocaleDateString() : 'Selecciona tu fecha de nacimiento'}
              </Text>
            </View>
          </TouchableOpacity>
          <Modal visible={showDate} transparent animationType="slide">
            <View style={styles.modalContainer}>
              <View style={styles.modalContent}>
                <DateTimePicker
                  value={fecNac || new Date()}
                  mode="date"
                  display={Platform.OS === 'ios' ? 'spinner' : 'default'}
                  onChange={(event, selectedDate) => {
                    setShowDate(false);
                    if (selectedDate) setFecNac(selectedDate);
                  }}
                  maximumDate={new Date()}
                  minimumDate={new Date(1900, 0, 1)} // Opcional: bloquea fechas muy antiguas
                />

              </View>
            </View>
          </Modal>

          <View style={styles.inputContainer}>
            <TextInput
              placeholder="Contraseña"
              style={[styles.inputField, intentado && !password && styles.inputError]}
              secureTextEntry={!showPassword}
              value={password}
              onChangeText={setPassword}
            />
            <TouchableOpacity onPress={() => setShowPassword(v => !v)} style={styles.iconButton}>
              <Ionicons name={showPassword ? 'eye' : 'eye-off'} size={24} color="#1f2c3a" />
            </TouchableOpacity>
          </View>
          <View style={styles.inputContainer}>
            <TextInput
              placeholder="Confirmar contraseña"
              style={styles.inputField}
              secureTextEntry={!showConfirm}
              value={confirm}
              onChangeText={setConfirm}
            />
            <TouchableOpacity onPress={() => setShowConfirm(v => !v)} style={styles.iconButton}>
              <Ionicons name={showConfirm ? 'eye' : 'eye-off'} size={24} color="#1f2c3a" />
            </TouchableOpacity>
          </View>
          {error && <Text style={styles.error}>{error}</Text>}
          {loading ? (
            <ActivityIndicator color="#1f2c3a" />
          ) : (
            <TouchableOpacity style={styles.registerButton} onPress={handleRegister}>
              <Text style={styles.registerButtonText}>Registrarme</Text>
            </TouchableOpacity>
          )}
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  scrollContent: {
    flexGrow: 1,
    justifyContent: 'center',
    paddingBottom: 40,
  },
  container: {
    padding: 16,
    backgroundColor: '#c6eefc',
  },
  title: {
    fontSize: 24,
    marginBottom: 16,
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
  inputError: {
    borderColor: 'red',
  },
  dateInput: {
    padding: 12,
    borderWidth: 1,
    borderColor: '#91d5f4',
    borderRadius: 8,
    marginBottom: 12,
    backgroundColor: '#ffffff',
  },
  dateRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  modalContainer: {
    flex: 1,
    justifyContent: 'flex-end',
    backgroundColor: 'rgba(0,0,0,0.3)'
  },
  modalContent: {
    backgroundColor: '#fff',
    padding: 16,
    borderTopLeftRadius: 16,
    borderTopRightRadius: 16,
  },
  inputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#91d5f4',
    borderRadius: 8,
    marginBottom: 12,
    backgroundColor: '#ffffff',
  },
  inputField: {
    flex: 1,
    padding: 12,
    color: '#1f2c3a',
  },
  iconButton: {
    padding: 8,
  },
  error: {
    color: 'red',
    marginBottom: 12,
    textAlign: 'center',
  },
  registerButton: {
    backgroundColor: '#f9c94e',
    paddingVertical: 14,
    borderRadius: 8,
    marginTop: 8,
  },
  registerButtonText: {
    color: '#1f2c3a',
    fontSize: 18,
    textAlign: 'center',
    fontWeight: 'bold',
  },
});

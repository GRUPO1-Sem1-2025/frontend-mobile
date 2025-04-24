// src/screens/RegisterScreen.tsx
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
  TouchableOpacity
} from 'react-native';
import DateTimePicker, { DateTimePickerEvent } from '@react-native-community/datetimepicker';
import { AuthContext } from '../../context/AuthContext';
import { useNavigation } from '@react-navigation/native';
import { Ionicons } from '@expo/vector-icons';

export default function RegisterScreen() {
  const { register } = useContext(AuthContext);
  const navigation = useNavigation<any>();

  const [nombre, setNombre] = useState('');
  const [apellido, setApellido] = useState('');
  const [ci, setCi] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirm, setConfirm] = useState('');
  const [fecNac, setFecNac] = useState(new Date());
  const [showDate, setShowDate] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleDateChange = (_: DateTimePickerEvent, date?: Date) => {
    setShowDate(false);
    if (date) setFecNac(date);
  };

  const handleRegister = async () => {
    if (!nombre || !apellido) {
      setError('Debes ingresar nombre y apellido');
      return;
    }
    if (!ci) {
      setError('Debes ingresar tu cédula de identidad');
      return;
    }
    if (password !== confirm) {
      setError('Las contraseñas no coinciden');
      return;
    }
    setLoading(true);
    setError(null);
    try {
      // se asume que AuthContext.register acepta (nombre, apellido, email, password, ci, fecNac)
      await register(nombre, apellido, email, password, ci, fecNac.toISOString());
      navigation.navigate('VerifyCode', { email });
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
        <Text style={styles.title}>Registro</Text>
        <TextInput
          placeholder="Nombre"
          style={styles.input}
          value={nombre}
          onChangeText={setNombre}
        />
        <TextInput
          placeholder="Apellido"
          style={styles.input}
          value={apellido}
          onChangeText={setApellido}
        />
        <TextInput
          placeholder="Cédula de Identidad"
          style={styles.input}
          value={ci}
          onChangeText={setCi}
          keyboardType="numeric"
        />
        <TextInput
          placeholder="Correo electrónico"
          style={styles.input}
          value={email}
          onChangeText={setEmail}
          autoCapitalize="none"
          keyboardType="email-address"
        />

        <TouchableOpacity
          style={styles.dateInput}
          onPress={() => setShowDate(true)}
        >
          <Text>
            Fecha de Nacimiento: {fecNac.toLocaleDateString()}
          </Text>
        </TouchableOpacity>
        {showDate && (
          <DateTimePicker
            value={fecNac}
            mode="date"
            display="default"
            onChange={handleDateChange}
            maximumDate={new Date()}
          />
        )}

        <View style={styles.inputContainer}>
          <TextInput
            placeholder="Contraseña"
            style={styles.inputField}
            secureTextEntry={!showPassword}
            value={password}
            onChangeText={setPassword}
          />
          <TouchableOpacity
            onPress={() => setShowPassword(v => !v)}
            style={styles.iconButton}
          >
            <Ionicons name={showPassword ? 'eye' : 'eye-off'} size={24} />
          </TouchableOpacity>
        </View>

        <View style={styles.inputContainer}>
          <TextInput
            placeholder="Confirma contraseña"
            style={styles.inputField}
            secureTextEntry={!showConfirm}
            value={confirm}
            onChangeText={setConfirm}
          />
          <TouchableOpacity
            onPress={() => setShowConfirm(v => !v)}
            style={styles.iconButton}
          >
            <Ionicons name={showConfirm ? 'eye' : 'eye-off'} size={24} />
          </TouchableOpacity>
        </View>

        {error && <Text style={styles.error}>{error}</Text>}

        {loading
          ? <ActivityIndicator />
          : <Button title="Registrarme" onPress={handleRegister} />
        }
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: {
    flexGrow: 1,
    justifyContent: 'center',
    padding: 16,
    backgroundColor: '#fff',
  },
  title:         { fontSize: 24, marginBottom: 16, textAlign: 'center' },
  input:         { borderWidth: 1, borderRadius: 4, marginBottom: 12, padding: 8, backgroundColor: '#fafafa' },
  dateInput:     { padding: 12, borderWidth: 1, borderColor: '#ccc', borderRadius: 4, marginBottom: 12, backgroundColor: '#fafafa' },
  inputContainer:{ flexDirection: 'row', alignItems: 'center', borderWidth:1, borderColor:'#ccc', borderRadius:4, marginBottom:12, paddingRight:8, backgroundColor:'#fafafa' },
  inputField:    { flex: 1, padding: 8 },
  iconButton:    { padding: 4 },
  error:         { color: 'red', marginBottom: 12, textAlign: 'center' },
});

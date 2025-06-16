import React, { useState, useContext, useEffect } from 'react';
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
  const [showDate, setShowDate] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [erroresCampos, setErroresCampos] = useState<{
    nombre?: string;
    apellido?: string;
    email?: string;
    password?: string;
    confirm?: string;
    ci?: string;
    fecNac?: string;
  }>({});

  const soloLetras = /^[a-zA-ZáéíóúÁÉÍÓÚñÑ\s]+$/;
  const emailValido = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  const passwordRegex = /^(?=.*[A-Za-z])(?=.*\d).{6,}$/;

  const formatearCI = (value: string) => {
    const digits = value.replace(/\D/g, '').slice(0, 8);
    let formatted = digits;
    if (digits.length > 1) formatted = digits[0] + '.' + digits.slice(1);
    if (digits.length > 4) formatted = formatted.slice(0, 5) + '.' + formatted.slice(5);
    if (digits.length > 7) formatted = formatted.slice(0, 9) + '-' + formatted.slice(9);
    return formatted;
  };

  const validarCampos = () => {
    const ci = ciRaw.replace(/\D/g, '');
    const errores: typeof erroresCampos = {};

    if (!nombre.trim()) errores.nombre = 'Campo obligatorio';
    else if (nombre.trim().length < 3) errores.nombre = 'Mínimo 3 letras';
    else if (!soloLetras.test(nombre)) errores.nombre = 'Solo letras';

    if (!apellido.trim()) errores.apellido = 'Campo obligatorio';
    else if (apellido.trim().length < 3) errores.apellido = 'Mínimo 3 letras';
    else if (!soloLetras.test(apellido)) errores.apellido = 'Solo letras';

    if (!email.trim()) errores.email = 'Campo obligatorio';
    else if (!emailValido.test(email)) errores.email = 'Email no válido';

    if (!password) errores.password = 'Campo obligatorio';
    else if (!passwordRegex.test(password)) errores.password = 'Debe tener letras y números, mínimo 6 caracteres';

    if (!confirm) errores.confirm = 'Campo obligatorio';
    else if (password !== confirm) errores.confirm = 'No coincide con la contraseña';

    if (!ci) errores.ci = 'Campo obligatorio';
    else if (ci.length !== 8) errores.ci = 'Debe tener 8 dígitos';

    if (!fecNac) errores.fecNac = 'Selecciona una fecha';
    else {
      const hoy = new Date();
      const fechaNacimiento = new Date(fecNac);
      const edad = hoy.getFullYear() - fechaNacimiento.getFullYear() - (hoy < new Date(fechaNacimiento.setFullYear(hoy.getFullYear())) ? 1 : 0);
      if (edad < 10) errores.fecNac = 'Debes tener al menos 10 años';
    }

    setErroresCampos(errores);
    return errores;
  };

  useEffect(() => {
    validarCampos();
  }, [nombre, apellido, email, password, confirm, ciRaw, fecNac]);

  const esFormularioValido = () => {
    return (
      nombre &&
      apellido &&
      email &&
      password &&
      confirm &&
      ciRaw &&
      fecNac &&
      Object.keys(erroresCampos).length === 0
    );
  };

  const handleRegister = async () => {
    const errores = validarCampos();
    if (Object.keys(errores).length > 0 || !fecNac) return;

    const fechaISO = fecNac.toISOString().split('T')[0];
    const ci = ciRaw.replace(/\D/g, '');

    setLoading(true);
    setError(null);
    try {
      const mensaje = await register(nombre, apellido, email, password, ci, fechaISO, [], undefined);
      Alert.alert('Registro exitoso', mensaje, [
        { text: 'Continuar', onPress: () => navigation.navigate('VerifyCode', { email }) },
      ]);
    } catch (e) {
      setError((e as Error).message);
    } finally {
      setLoading(false);
    }
  };

  const handleDateChange = (_: any, selectedDate?: Date) => {
    setShowDate(false);
    if (selectedDate) setFecNac(selectedDate);
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
            style={[styles.input, erroresCampos.nombre && styles.inputError]}
            value={nombre}
            onChangeText={setNombre}
          />
          {erroresCampos.nombre && <Text style={styles.error}>{erroresCampos.nombre}</Text>}

          <TextInput
            placeholder="Apellido"
            style={[styles.input, erroresCampos.apellido && styles.inputError]}
            value={apellido}
            onChangeText={setApellido}
          />
          {erroresCampos.apellido && <Text style={styles.error}>{erroresCampos.apellido}</Text>}

          <TextInput
            placeholder="Cédula de Identidad"
            style={[styles.input, erroresCampos.ci && styles.inputError]}
            value={formatearCI(ciRaw)}
            onChangeText={setCiRaw}
            keyboardType="numeric"
          />
          {erroresCampos.ci && <Text style={styles.error}>{erroresCampos.ci}</Text>}

          <TextInput
            placeholder="Correo electrónico"
            style={[styles.input, erroresCampos.email && styles.inputError]}
            value={email}
            onChangeText={setEmail}
            autoCapitalize="none"
            keyboardType="email-address"
          />
          {erroresCampos.email && <Text style={styles.error}>{erroresCampos.email}</Text>}

          <TouchableOpacity
            style={[styles.dateInput, erroresCampos.fecNac && styles.inputError]}
            onPress={() => setShowDate(true)}
          >
            <View style={styles.dateRow}>
              <Ionicons name="calendar-outline" size={20} color="#1f2c3a" style={{ marginRight: 8 }} />
              <Text style={{ color: '#1f2c3a' }}>
                {fecNac ? fecNac.toLocaleDateString() : 'Selecciona tu fecha de nacimiento'}
              </Text>
            </View>
          </TouchableOpacity>
          {erroresCampos.fecNac && <Text style={styles.error}>{erroresCampos.fecNac}</Text>}

          {showDate && (
            Platform.OS === 'ios' ? (
              <Modal visible transparent animationType="slide">
                <View style={styles.modalContainer}>
                  <View style={styles.modalContent}>
                    <DateTimePicker
                      value={fecNac || new Date()}
                      mode="date"
                      display="spinner"
                      onChange={handleDateChange}
                      maximumDate={new Date()}
                      minimumDate={new Date(1900, 0, 1)}
                      themeVariant="light"
                    />
                  </View>
                </View>
              </Modal>
            ) : (
              <DateTimePicker
                value={fecNac || new Date()}
                mode="date"
                display="default"
                onChange={handleDateChange}
                maximumDate={new Date()}
                minimumDate={new Date(1900, 0, 1)}
              />
            )
          )}

          <View style={styles.inputContainer}>
            <TextInput
              placeholder="Contraseña"
              style={[styles.inputField, erroresCampos.password && styles.inputError]}
              secureTextEntry={!showPassword}
              value={password}
              onChangeText={setPassword}
            />
            <TouchableOpacity onPress={() => setShowPassword(v => !v)} style={styles.iconButton}>
              <Ionicons name={showPassword ? 'eye' : 'eye-off'} size={24} color="#1f2c3a" />
            </TouchableOpacity>
          </View>
          {erroresCampos.password && <Text style={styles.error}>{erroresCampos.password}</Text>}

          <View style={styles.inputContainer}>
            <TextInput
              placeholder="Confirmar contraseña"
              style={[styles.inputField, erroresCampos.confirm && styles.inputError]}
              secureTextEntry={!showConfirm}
              value={confirm}
              onChangeText={setConfirm}
            />
            <TouchableOpacity onPress={() => setShowConfirm(v => !v)} style={styles.iconButton}>
              <Ionicons name={showConfirm ? 'eye' : 'eye-off'} size={24} color="#1f2c3a" />
            </TouchableOpacity>
          </View>
          {erroresCampos.confirm && <Text style={styles.error}>{erroresCampos.confirm}</Text>}

          {error && <Text style={styles.error}>{error}</Text>}

          {loading ? (
            <ActivityIndicator color="#1f2c3a" />
          ) : (
            <TouchableOpacity
              style={[styles.registerButton, !esFormularioValido() && styles.buttonDisabled]}
              onPress={handleRegister}
              disabled={!esFormularioValido()}
            >
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
    marginBottom: 8,
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
    marginBottom: 8,
    backgroundColor: '#ffffff',
  },
  dateRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  modalContainer: {
    flex: 1,
    justifyContent: 'flex-end',
    backgroundColor: 'rgba(0,0,0,0.3)',
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
    marginBottom: 8,
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
    marginBottom: 8,
    fontSize: 14,
  },
  registerButton: {
    backgroundColor: '#f9c94e',
    paddingVertical: 14,
    borderRadius: 8,
    marginTop: 12,
  },
  buttonDisabled: {
    opacity: 0.5,
  },
  registerButtonText: {
    color: '#1f2c3a',
    fontSize: 18,
    textAlign: 'center',
    fontWeight: 'bold',
  },
});


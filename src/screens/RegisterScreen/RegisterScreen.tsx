import React, { useState, useContext, useEffect, useRef } from 'react';
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

  const [erroresCampos, setErroresCampos] = useState<Record<string, string>>({});
  const [tocado, setTocado] = useState<Record<string, boolean>>({});

  const didMountRef = useRef(false);

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
    const errores: Record<string, string> = {};

    if (!nombre.trim()) errores.nombre = 'Por favor ingresá tu nombre';
    else if (nombre.trim().length < 3) errores.nombre = 'El nombre debe tener al menos 3 letras';
    else if (!soloLetras.test(nombre)) errores.nombre = 'El nombre solo puede contener letras';

    if (!apellido.trim()) errores.apellido = 'Por favor ingresá tu apellido';
    else if (apellido.trim().length < 3) errores.apellido = 'El apellido debe tener al menos 3 letras';
    else if (!soloLetras.test(apellido)) errores.apellido = 'El apellido solo puede contener letras';

    if (!email.trim()) errores.email = 'Por favor ingresá un correo electrónico';
    else if (!emailValido.test(email)) errores.email = 'El correo electrónico no es válido';

    if (!password) errores.password = 'Por favor ingresá una contraseña';
    else if (!passwordRegex.test(password)) errores.password = 'La contraseña debe tener al menos 6 caracteres e incluir letras y números';

    if (!confirm) errores.confirm = 'Por favor confirmá tu contraseña';
    else if (password !== confirm) errores.confirm = 'Las contraseñas no coinciden';

    if (!ci) errores.ci = 'Por favor ingresá tu cédula';
    else if (ci.length !== 8) errores.ci = 'La cédula debe tener 8 dígitos';

    if (!fecNac) {
      errores.fecNac = 'Por favor seleccioná tu fecha de nacimiento';
    } else {
      const hoy = new Date();
      const nac = new Date(fecNac.getTime());
      const edad = hoy.getFullYear() - nac.getFullYear() - (hoy < new Date(nac.setFullYear(hoy.getFullYear())) ? 1 : 0);

      if (edad < 10) {
        errores.fecNac = 'Debés tener al menos 10 años para registrarte';
      } else if (edad > 100) {
        errores.fecNac = 'La edad máxima permitida es de 100 años';
      }
    }

    setErroresCampos(errores);
    return errores;
  };

  useEffect(() => {
    if (didMountRef.current) {
      validarCampos();
    } else {
      didMountRef.current = true;
    }
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
    setTocado({
      nombre: true,
      apellido: true,
      email: true,
      password: true,
      confirm: true,
      ci: true,
      fecNac: true,
    });

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
    if (selectedDate) {
      setFecNac(selectedDate);
      setTocado(prev => ({ ...prev, fecNac: true }));
    }
  };

  const handleBlur = (campo: string) => {
    setTocado(prev => ({ ...prev, [campo]: true }));
    validarCampos(); // <-- validar al salir del campo
  };
  const handleCiChange = (text: string) => {
    const digitsOnly = text.replace(/\D/g, '').slice(0, 8); // solo hasta 8 dígitos
    setCiRaw(digitsOnly);
  };

  return (
    <View style={{ flex: 1, backgroundColor: '#c6eefc' }}>
      <KeyboardAvoidingView
        style={{ flex: 1 }}
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        keyboardVerticalOffset={Platform.OS === 'ios' ? 100 : 0}
      >
        <ScrollView
          contentContainerStyle={[styles.scrollContent, { flexGrow: 1 }]}
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}
        >
          <View style={styles.container}>
            <Text style={styles.title}>Registro</Text>

            <TextInput
              placeholder="Nombre"
              placeholderTextColor="#1f2c3a"
              style={[styles.input, tocado.nombre && erroresCampos.nombre && styles.inputError]}
              value={nombre}
              onChangeText={setNombre}
              onBlur={() => handleBlur('nombre')}
            />
            {tocado.nombre && erroresCampos.nombre && <Text style={styles.error}>{erroresCampos.nombre}</Text>}

            <TextInput
              placeholder="Apellido"
              placeholderTextColor="#1f2c3a"
              style={[styles.input, tocado.apellido && erroresCampos.apellido && styles.inputError]}
              value={apellido}
              onChangeText={setApellido}
              onBlur={() => handleBlur('apellido')}
            />
            {tocado.apellido && erroresCampos.apellido && <Text style={styles.error}>{erroresCampos.apellido}</Text>}

            <TextInput
              placeholder="Cédula de Identidad"
              placeholderTextColor="#1f2c3a"
              style={[styles.input, tocado.ci && erroresCampos.ci && styles.inputError]}
              value={formatearCI(ciRaw)}
              onChangeText={handleCiChange}
              onBlur={() => handleBlur('ci')}
              keyboardType="numeric"
            />
            {tocado.ci && erroresCampos.ci && <Text style={styles.error}>{erroresCampos.ci}</Text>}

            <TextInput
              placeholder="Correo electrónico"
              placeholderTextColor="#1f2c3a"
              style={[styles.input, tocado.email && erroresCampos.email && styles.inputError]}
              value={email}
              onChangeText={setEmail}
              onBlur={() => handleBlur('email')}
              autoCapitalize="none"
              keyboardType="email-address"
            />
            {tocado.email && erroresCampos.email && <Text style={styles.error}>{erroresCampos.email}</Text>}

            <TouchableOpacity
              style={[styles.dateInput, tocado.fecNac && erroresCampos.fecNac && styles.inputError]}
              onPress={() => setShowDate(true)}
            >
              <View style={styles.dateRow}>
                <Ionicons name="calendar-outline" size={20} color="#1f2c3a" style={{ marginRight: 8 }} />
                <Text style={{ color: '#1f2c3a' }}>
                  {fecNac ? fecNac.toLocaleDateString() : 'Seleccioná tu fecha de nacimiento'}
                </Text>
              </View>
            </TouchableOpacity>
            {tocado.fecNac && erroresCampos.fecNac && <Text style={styles.error}>{erroresCampos.fecNac}</Text>}

            {showDate && (() => {
              const hoy = new Date();
              const fechaMaximaNacimiento = new Date();
              fechaMaximaNacimiento.setFullYear(hoy.getFullYear() - 10);
              const fechaMinimaNacimiento = new Date();
              fechaMinimaNacimiento.setFullYear(hoy.getFullYear() - 100);
              const fechaInicial = new Date();
              fechaInicial.setFullYear(hoy.getFullYear() - 25);

              return Platform.OS === 'ios' ? (
                <Modal visible transparent animationType="slide">
                  <View style={styles.modalContainer}>
                    <View style={styles.modalContent}>
                      <DateTimePicker
                        value={fecNac || fechaInicial}
                        mode="date"
                        display="spinner"
                        onChange={handleDateChange}
                        maximumDate={fechaMaximaNacimiento}
                        minimumDate={fechaMinimaNacimiento}
                        themeVariant="light"
                      />
                    </View>
                  </View>
                </Modal>
              ) : (
                <DateTimePicker
                  value={fecNac || fechaInicial}
                  mode="date"
                  display="default"
                  onChange={handleDateChange}
                  maximumDate={fechaMaximaNacimiento}
                  minimumDate={fechaMinimaNacimiento}
                />
              );
            })()}

            <View style={styles.inputContainer}>
              <TextInput
                placeholder="Contraseña"
                placeholderTextColor="#1f2c3a"
                style={[styles.inputField, tocado.password && erroresCampos.password && styles.inputError]}
                secureTextEntry={!showPassword}
                value={password}
                onChangeText={setPassword}
                onBlur={() => handleBlur('password')}
              />
              <TouchableOpacity onPress={() => setShowPassword(v => !v)} style={styles.iconButton}>
                <Ionicons name={showPassword ? 'eye' : 'eye-off'} size={24} color="#1f2c3a" />
              </TouchableOpacity>
            </View>
            {tocado.password && erroresCampos.password && <Text style={styles.error}>{erroresCampos.password}</Text>}

            <View style={styles.inputContainer}>
              <TextInput
                placeholder="Confirmar contraseña"
                placeholderTextColor="#1f2c3a"
                style={[styles.inputField, tocado.confirm && erroresCampos.confirm && styles.inputError]}
                secureTextEntry={!showConfirm}
                value={confirm}
                onChangeText={setConfirm}
                onBlur={() => handleBlur('confirm')}
              />
              <TouchableOpacity onPress={() => setShowConfirm(v => !v)} style={styles.iconButton}>
                <Ionicons name={showConfirm ? 'eye' : 'eye-off'} size={24} color="#1f2c3a" />
              </TouchableOpacity>
            </View>
            {tocado.confirm && erroresCampos.confirm && <Text style={styles.error}>{erroresCampos.confirm}</Text>}

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
    </View>
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

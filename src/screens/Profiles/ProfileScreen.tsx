import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  TextInput,
  StyleSheet,
  ActivityIndicator,
  Alert,
  ScrollView,
  TouchableOpacity,
} from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Feather } from '@expo/vector-icons';
import { getUserByEmail, updateUserProfile } from '../../services/users';
import { Buffer } from 'buffer';
function formatCI(ci?: string | null): string {
  if (!ci) return '';
  const digits = ci.replace(/\D/g, '');
  if (digits.length !== 8) return ci;
  return `${digits[0]}.${digits.slice(1, 4)}.${digits.slice(4, 7)}-${digits[7]}`;
}

export default function ProfileScreen() {
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [user, setUser] = useState<any>(null);

  const [nombre, setNombre] = useState('');
  const [apellido, setApellido] = useState('');
  const [email, setEmail] = useState('');
  const [activo, setActivo] = useState(true);

  const [editable, setEditable] = useState({
    nombre: false,
    apellido: false,
    email: false,
  });

  const [errors, setErrors] = useState({
    nombre: '',
    apellido: '',
    email: '',
  });

  useEffect(() => {
    (async () => {
      try {
        const token = await AsyncStorage.getItem('userToken');
        if (!token) throw new Error('Token no encontrado');

        const data = await getUserByEmail(token);
        const payloadBase64 = token.split('.')[1];
        const decodedPayload = Buffer.from(payloadBase64, 'base64').toString('utf-8');
        const payload = JSON.parse(decodedPayload);
        const fullUser = { ...data, id: payload.id, token };

        setUser(fullUser);
        setNombre(fullUser.nombre || '');
        setApellido(fullUser.apellido || '');
        setEmail(fullUser.email || '');
        setActivo(fullUser.activo ?? true);
      } catch (e: any) {
        Alert.alert('Error', e.message);
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  useEffect(() => {
  const regex = /^[a-zA-ZáéíóúüñÁÉÍÓÚÜÑ\s]{3,}$/;
    setErrors(prev => ({
      ...prev,
      nombre: regex.test(nombre) ? '' : 'Mínimo 3 letras, solo texto',
    }));
  }, [nombre]);

  useEffect(() => {
    const regex = /^[a-zA-ZáéíóúüñÁÉÍÓÚÜÑ\s]{3,}$/;
    setErrors(prev => ({
      ...prev,
      apellido: regex.test(apellido) ? '' : 'Mínimo 3 letras, solo texto',
    }));
  }, [apellido]);

  useEffect(() => {
    const emailValido = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    setErrors(prev => ({
      ...prev,
      email: emailValido.test(email) ? '' : 'Email inválido',
    }));
  }, [email]);

  const hasChanges = () => {
    if (!user) return false;
    return (
      user.nombre !== nombre ||
      user.apellido !== apellido ||
      user.email !== email ||
      user.activo !== activo
    );
  };

  const handleSave = async () => {
    if (!user?.token || !hasChanges()) return;

    try {
      setSaving(true);
      await updateUserProfile(user.token, {
        id: user.id,
        nombre,
        apellido,
        email,
        activo,
      });
      Alert.alert('Éxito', 'Perfil actualizado correctamente');
      setEditable({ nombre: false, apellido: false, email: false });
      setUser({ ...user, nombre, apellido, email, activo });
    } catch (e: any) {
      Alert.alert('Error', e.message);
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <View style={styles.center}>
        <ActivityIndicator size="large" color="#1f2c3a" />
      </View>
    );
  }

  return (
    <ScrollView contentContainerStyle={styles.container}>
      <Text style={styles.title}>Mi Perfil</Text>

      <View style={styles.block}>
        {/* Nombre */}
        <View style={styles.row}>
          <Text style={styles.label}>Nombre</Text>
          <TouchableOpacity onPress={() => setEditable(prev => ({ ...prev, nombre: true }))}>
            <Feather name="edit-3" size={18} color="#1f2c3a" />
          </TouchableOpacity>
        </View>
        <TextInput
          style={[styles.input, !editable.nombre && styles.disabledInput]}
          value={nombre}
          onChangeText={setNombre}
          editable={editable.nombre}
          placeholder="Nombre"
        />
        {errors.nombre ? <Text style={styles.error}>{errors.nombre}</Text> : null}

        {/* Apellido */}
        <View style={styles.row}>
          <Text style={styles.label}>Apellido</Text>
          <TouchableOpacity onPress={() => setEditable(prev => ({ ...prev, apellido: true }))}>
            <Feather name="edit-3" size={18} color="#1f2c3a" />
          </TouchableOpacity>
        </View>
        <TextInput
          style={[styles.input, !editable.apellido && styles.disabledInput]}
          value={apellido}
          onChangeText={setApellido}
          editable={editable.apellido}
          placeholder="Apellido"
        />
        {errors.apellido ? <Text style={styles.error}>{errors.apellido}</Text> : null}

        {/* Email */}
        <View style={styles.row}>
          <Text style={styles.label}>Email</Text>
          <TouchableOpacity onPress={() => setEditable(prev => ({ ...prev, email: true }))}>
            <Feather name="edit-3" size={18} color="#1f2c3a" />
          </TouchableOpacity>
        </View>
        <TextInput
          style={[styles.input, !editable.email && styles.disabledInput]}
          value={email}
          onChangeText={setEmail}
          editable={editable.email}
          placeholder="Email"
          keyboardType="email-address"
          autoCapitalize="none"
        />
        {errors.email ? <Text style={styles.error}>{errors.email}</Text> : null}

        {/* CI */}
        <Text style={styles.label}>Cédula</Text>
        <TextInput
          style={[styles.input, styles.disabledInput]}
          value={formatCI(user?.ci)}
          editable={false}
          placeholder="CI"
        />

        {/* Fecha de nacimiento */}
        <Text style={styles.label}>Fecha de nacimiento</Text>
        <TextInput
          style={[styles.input, styles.disabledInput]}
          value={user?.fechaNac || ''}
          editable={false}
          placeholder="Fecha"
        />

        {/* Desactivar cuenta */}
        <TouchableOpacity onPress={() => setActivo(false)} disabled={!activo}>
          <Text style={styles.deactivate}>Desactivar mi cuenta</Text>
        </TouchableOpacity>
      </View>

      {/* Guardar */}
      <TouchableOpacity
        style={[
          styles.primaryButton,
          (!hasChanges() || Object.values(errors).some(e => e) || saving) && styles.disabledButton,
        ]}
        onPress={handleSave}
        disabled={!hasChanges() || Object.values(errors).some(e => e) || saving}
      >
        <Text style={styles.primaryButtonText}>
          {saving ? 'Guardando...' : 'Guardar'}
        </Text>
      </TouchableOpacity>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flexGrow: 1,
    justifyContent: 'center',
    padding: 16,
    backgroundColor: '#c6eefc',
  },
  center: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#c6eefc',
  },
  title: {
    fontSize: 24,
    marginBottom: 24,
    textAlign: 'center',
    color: '#1f2c3a',
  },
  block: {
    marginBottom: 16,
  },
  label: {
    fontSize: 16,
    fontWeight: '500',
    color: '#1f2c3a',
    marginTop: 12,
  },
  row: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: 12,
  },
  input: {
    backgroundColor: '#fff',
    borderRadius: 6,
    padding: 12,
    borderColor: '#91d5f4',
    borderWidth: 1,
    marginTop: 4,
  },
  disabledInput: {
    backgroundColor: '#e0e0e0',
    color: '#888',
  },
  error: {
    color: '#d84315',
    marginTop: 4,
  },
  deactivate: {
    marginTop: 16,
    fontSize: 14,
    color: '#d32f2f',
    textAlign: 'center',
    textDecorationLine: 'underline',
  },
  primaryButton: {
    backgroundColor: '#f9c94e',
    paddingVertical: 14,
    borderRadius: 8,
    marginTop: 24,
  },
  primaryButtonText: {
    color: '#1f2c3a',
    fontSize: 18,
    textAlign: 'center',
    fontWeight: 'bold',
  },
  disabledButton: {
    backgroundColor: '#cccccc',
  },
});

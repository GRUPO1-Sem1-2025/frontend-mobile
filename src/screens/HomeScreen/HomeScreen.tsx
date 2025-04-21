// src/screens/HomeScreen.tsx
import React, { useState, useContext } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  Button,
  StyleSheet,
  Platform,
} from 'react-native';
import DateTimePicker, {
  DateTimePickerEvent,
} from '@react-native-community/datetimepicker';
import { AuthContext } from '../../context/AuthContext';

export default function HomeScreen() {
  const { logout, token } = useContext(AuthContext);

  // Estado del formulario
  const [tripType, setTripType] = useState<'oneway' | 'roundtrip'>('oneway');
  const [origin, setOrigin] = useState('');
  const [destination, setDestination] = useState('');
  const [departDate, setDepartDate] = useState<Date>(new Date());
  const [returnDate, setReturnDate] = useState<Date>(new Date());
  const [showDepartPicker, setShowDepartPicker] = useState(false);
  const [showReturnPicker, setShowReturnPicker] = useState(false);

  // Handlers para los pickers
  const onDepartChange = (e: DateTimePickerEvent, date?: Date) => {
    setShowDepartPicker(Platform.OS === 'ios');
    if (date) setDepartDate(date);
  };
  const onReturnChange = (e: DateTimePickerEvent, date?: Date) => {
    setShowReturnPicker(Platform.OS === 'ios');
    if (date) setReturnDate(date);
  };

  const handleSearch = () => {
    // aquí llamarías a tu lógica de búsqueda / navegación
    console.log({ tripType, origin, destination, departDate, returnDate });
  };

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Buscar pasajes de ómnibus</Text>

      {/* Selector de tipo de viaje */}
      <View style={styles.tripTypeContainer}>
        <TouchableOpacity
          style={[
            styles.tripTypeButton,
            tripType === 'oneway' && styles.tripTypeButtonActive,
          ]}
          onPress={() => setTripType('oneway')}
        >
          <Text
            style={[
              styles.tripTypeText,
              tripType === 'oneway' && styles.tripTypeTextActive,
            ]}
          >
            Solo ida
          </Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[
            styles.tripTypeButton,
            tripType === 'roundtrip' && styles.tripTypeButtonActive,
          ]}
          onPress={() => setTripType('roundtrip')}
        >
          <Text
            style={[
              styles.tripTypeText,
              tripType === 'roundtrip' && styles.tripTypeTextActive,
            ]}
          >
            Ida y vuelta
          </Text>
        </TouchableOpacity>
      </View>

      {/* Origen / Destino */}
      <TextInput
        style={styles.input}
        placeholder="Origen"
        value={origin}
        onChangeText={setOrigin}
      />
      <TextInput
        style={styles.input}
        placeholder="Destino"
        value={destination}
        onChangeText={setDestination}
      />

      {/* Fecha de ida */}
      <TouchableOpacity
        style={styles.dateInput}
        onPress={() => setShowDepartPicker(true)}
      >
        <Text style={styles.dateText}>
          Ida: {departDate.toLocaleDateString()}
        </Text>
      </TouchableOpacity>
      {showDepartPicker && (
        <DateTimePicker
          value={departDate}
          mode="date"
          display="default"
          onChange={onDepartChange}
        />
      )}

      {/* Fecha de vuelta (solo si es roundtrip) */}
      {tripType === 'roundtrip' && (
        <>
          <TouchableOpacity
            style={styles.dateInput}
            onPress={() => setShowReturnPicker(true)}
          >
            <Text style={styles.dateText}>
              Vuelta: {returnDate.toLocaleDateString()}
            </Text>
          </TouchableOpacity>
          {showReturnPicker && (
            <DateTimePicker
              value={returnDate}
              mode="date"
              display="default"
              onChange={onReturnChange}
            />
          )}
        </>
      )}

      {/* Botón de búsqueda */}
      <View style={styles.searchBtn}>
        <Button title="Buscar pasajes" onPress={handleSearch} />
      </View>

      {/* Cerrar sesión / estado token */}
      <View style={styles.footer}>
        <Text style={styles.subtitle}>
          {token ? '¡Autenticado!' : 'No autenticado.'}
        </Text>
        <Button title="Cerrar sesión" onPress={logout} />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, padding: 16, backgroundColor: '#fff' },
  title: { fontSize: 22, fontWeight: 'bold', marginBottom: 24, textAlign: 'center' },
  tripTypeContainer: { flexDirection: 'row', marginBottom: 16 },
  tripTypeButton: {
    flex: 1,
    paddingVertical: 10,
    borderWidth: 1,
    borderColor: '#ccc',
    borderRadius: 4,
    marginHorizontal: 4,
    alignItems: 'center',
  },
  tripTypeButtonActive: {
    backgroundColor: '#007AFF',
    borderColor: '#007AFF',
  },
  tripTypeText: { color: '#444' },
  tripTypeTextActive: { color: '#fff' },
  input: {
    borderWidth: 1,
    borderColor: '#ccc',
    borderRadius: 4,
    padding: 12,
    marginBottom: 12,
  },
  dateInput: {
    padding: 12,
    borderWidth: 1,
    borderColor: '#ccc',
    borderRadius: 4,
    marginBottom: 12,
  },
  dateText: { color: '#333' },
  searchBtn: { marginVertical: 16 },
  footer: { alignItems: 'center', marginTop: 'auto' },
  subtitle: { marginBottom: 8, color: '#666' },
});
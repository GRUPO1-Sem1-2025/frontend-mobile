// src/screens/HomeScreen.tsx
import React, { useState, useContext, useCallback } from 'react';
import {
  View,
  Text,
  Button,
  ActivityIndicator,
  ScrollView,
  RefreshControl,
  StyleSheet,
  TouchableOpacity,
  Alert,
  Platform,
  KeyboardAvoidingView,
} from 'react-native';
import { useFocusEffect } from '@react-navigation/native';
import { Picker } from '@react-native-picker/picker';
import DateTimePicker, { DateTimePickerEvent } from '@react-native-community/datetimepicker';
import { useNavigation } from '@react-navigation/native';
import { AuthContext } from '../../context/AuthContext';
import { getLocalities } from '../../services/locality';
import { Locality } from '../../types/locality';

export default function HomeScreen() {
  const navigation = useNavigation<any>();
  const { logout, token } = useContext(AuthContext);

  // — Localidades —
  const [localities, setLocalities] = useState<Locality[]>([]);
  const [loadingLoc, setLoadingLoc] = useState(false);
  const [errorLoc, setErrorLoc] = useState<string | null>(null);
  const [refreshing, setRefreshing] = useState(false);

  const loadLocalities = async () => {
    setLoadingLoc(true);
    setErrorLoc(null);
    try {
      setLocalities(await getLocalities());
    } catch (e) {
      setErrorLoc((e as Error).message);
    } finally {
      setLoadingLoc(false);
    }
  };

  useFocusEffect(useCallback(() => {
    loadLocalities();
  }, []));

  const onRefresh = async () => {
    setRefreshing(true);
    try { await loadLocalities(); } finally { setRefreshing(false); }
  };

  // — Búsqueda de pasajes —
  const [origin, setOrigin] = useState<number>();
  const [destination, setDestination] = useState<number>();
  const [tripType, setTripType] = useState<'oneway' | 'roundtrip'>('oneway');
  const [departDate, setDepartDate] = useState(new Date());
  const [returnDate, setReturnDate] = useState(new Date());
  const [showDepartPicker, setShowDepartPicker] = useState(false);
  const [showReturnPicker, setShowReturnPicker] = useState(false);

  const onDepartChange = (_: DateTimePickerEvent, date?: Date) => {
    setShowDepartPicker(false);
    date && setDepartDate(date);
  };
  const onReturnChange = (_: DateTimePickerEvent, date?: Date) => {
    setShowReturnPicker(false);
    date && setReturnDate(date);
  };

  const handleSearch = () => {
    if (origin === destination) {
      Alert.alert('Error', 'El origen y destino no pueden ser iguales.');
      return;
    }
    if (tripType === 'roundtrip' && returnDate < departDate) {
      Alert.alert('Error', 'La fecha de regreso no puede ser menor a la de salida.');
      return;
    }
    navigation.navigate('AvailableTrips', {
      origin,
      destination,
      tripType,
      departDate,
      returnDate: tripType === 'roundtrip' ? returnDate : undefined
    });
    // navegar o llamar API de búsqueda
  };

  const isSearchDisabled =
    origin == null ||
    destination == null ||
    origin === destination ||
    (tripType === 'roundtrip' && returnDate < departDate);

  return (
    <KeyboardAvoidingView
      style={{ flex: 1 }}
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      keyboardVerticalOffset={Platform.OS === 'ios' ? 64 : 0}
    >
      <ScrollView
        contentContainerStyle={styles.container}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
        keyboardShouldPersistTaps="handled"
      >
        <Text style={styles.title}>Buscar pasajes de ómnibus</Text>

        {/* Localidades */}
        {loadingLoc ? (
          <ActivityIndicator />
        ) : errorLoc ? (
          <Text style={styles.error}>{errorLoc}</Text>
        ) : (
          <>
            <Text style={styles.label}>Origen</Text>
            <View style={styles.pickerWrapper}>
              <Picker selectedValue={origin} onValueChange={setOrigin}>
                <Picker.Item label="— selecciona —" value={undefined} />
                {localities.map(l => (
                  <Picker.Item
                    key={l.id}
                    label={`${l.nombre}, ${l.departamento}`}
                    value={l.id}
                  />
                ))}
              </Picker>
            </View>

            <Text style={styles.label}>Destino</Text>
            <View style={styles.pickerWrapper}>
              <Picker selectedValue={destination} onValueChange={setDestination}>
                <Picker.Item label="— selecciona —" value={undefined} />
                {localities.map(l => (
                  <Picker.Item
                    key={l.id}
                    label={`${l.nombre}, ${l.departamento}`}
                    value={l.id}
                  />
                ))}
              </Picker>
            </View>
          </>
        )}

        {/* Tipo de viaje */}
        <View style={styles.tripTypeContainer}>
          {(['oneway', 'roundtrip'] as const).map(type => (
            <Button
              key={type}
              title={type === 'oneway' ? 'Solo ida' : 'Ida y vuelta'}
              color={tripType === type ? '#007AFF' : '#ccc'}
              onPress={() => setTripType(type)}
            />
          ))}
        </View>

        {/* Fechas */}
        <TouchableOpacity style={styles.dateInput} onPress={() => setShowDepartPicker(true)}>
          <Text>Salida: {departDate.toLocaleDateString()}</Text>
        </TouchableOpacity>
        {showDepartPicker && (
          <DateTimePicker
            value={departDate}
            mode="date"
            display="default"
            onChange={onDepartChange}
          />
        )}

        {tripType === 'roundtrip' && (
          <>
            <TouchableOpacity style={styles.dateInput} onPress={() => setShowReturnPicker(true)}>
              <Text>Regreso: {returnDate.toLocaleDateString()}</Text>
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

        {/* Botón Buscar */}
        <View style={styles.searchBtn}>
          <Button
            title="Buscar pasajes"
            onPress={handleSearch}
            disabled={isSearchDisabled}
          />
        </View>

        {/* Footer */}
        <View style={styles.footer}>
          <Text style={styles.subtitle}>{token ? '¡Autenticado!' : 'No autenticado.'}</Text>
          <Button title="Cerrar sesión" onPress={logout} />
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: { flexGrow: 1, padding: 16, backgroundColor: '#fff' },
  title: { fontSize: 22, fontWeight: 'bold', marginBottom: 16, textAlign: 'center' },
  error: { color: 'red', textAlign: 'center', marginVertical: 8 },
  label: { marginTop: 12, fontWeight: '600' },
  pickerWrapper: { borderWidth: 1, borderColor: '#ccc', borderRadius: 4, marginBottom: 12 },
  tripTypeContainer: { flexDirection: 'row', justifyContent: 'space-around', marginVertical: 16 },
  dateInput: { padding: 12, borderWidth: 1, borderColor: '#ccc', borderRadius: 4, marginBottom: 12 },
  searchBtn: { marginVertical: 16 },
  footer: { alignItems: 'center', marginTop: 'auto' },
  subtitle: { marginBottom: 8, color: '#666' },
});
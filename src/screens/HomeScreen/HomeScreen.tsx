import React, { useState, useContext, useCallback, useRef, useEffect } from 'react';
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
import { useFocusEffect, useNavigation } from '@react-navigation/native';
import { Picker } from '@react-native-picker/picker';
import DateTimePicker, { DateTimePickerEvent } from '@react-native-community/datetimepicker';
import { AuthContext } from '../../context/AuthContext';
import { getLocalities } from '../../services/locality';
import { Locality } from '../../types/locality';
import { registerForPushNotificationsAsync } from '../../notifications/registerPush';

const colors = {
  solarYellow: '#f9c94e',
  busWhite: '#ffffff',
  skyBlue: '#69c8f1',
  darkBlue: '#1f2c3a',
  lightBlue: '#c6eefc',
  midBlue: '#91d5f4',
};

export default function HomeScreen() {
  const navigation = useNavigation<any>();
  const { logout, token } = useContext(AuthContext);

  const [localities, setLocalities] = useState<Locality[]>([]);
  const [loadingLoc, setLoadingLoc] = useState(false);
  const [errorLoc, setErrorLoc] = useState<string | null>(null);
  const [refreshing, setRefreshing] = useState(false);
  const alreadyRegistered = useRef(false);

  const loadLocalities = async () => {
    setLoadingLoc(true);
    setErrorLoc(null);
    try {
      const data = await getLocalities();
      setLocalities(data);
    } catch (e) {
      setErrorLoc((e as Error).message);
    } finally {
      setLoadingLoc(false);
    }
  };

  useFocusEffect(
    useCallback(() => {
      loadLocalities();
    }, [])
  );

  // ✅ Se asegura que si el token llega luego, se registre la primera vez
  useEffect(() => {
    if (token && !alreadyRegistered.current) {
      alreadyRegistered.current = true;
      console.log('🔁 Token detectado en useEffect, registrando push...');
      registerForPushNotificationsAsync(token);
    }
  }, [token]);

  const onRefresh = async () => {
    setRefreshing(true);
    try {
      await loadLocalities();
    } finally {
      setRefreshing(false);
    }
  };

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
      returnDate: tripType === 'roundtrip' ? returnDate : undefined,
    });
  };

  const isSearchDisabled =
    origin == null ||
    destination == null ||
    origin === destination ||
    (tripType === 'roundtrip' && returnDate < departDate);

  return (
    <KeyboardAvoidingView
      style={styles.wrapper}
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      keyboardVerticalOffset={Platform.OS === 'ios' ? 64 : 0}
    >
      <ScrollView
        contentContainerStyle={styles.container}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
        keyboardShouldPersistTaps="handled"
      >
        <Text style={styles.title}>Buscar pasajes de ómnibus</Text>

        {loadingLoc ? (
          <ActivityIndicator size="large" color={colors.darkBlue} />
        ) : errorLoc ? (
          <Text style={styles.error}>{errorLoc}</Text>
        ) : (
          <>
            <Text style={styles.label}>Origen</Text>
            <View style={styles.pickerWrapper}>
              <Picker
                selectedValue={origin}
                onValueChange={setOrigin}
                style={styles.picker}
                itemStyle={styles.pickerItem}
              >
                <Picker.Item label="— selecciona —" value={undefined} />
                {localities.map((l) => (
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
              <Picker
                selectedValue={destination}
                onValueChange={setDestination}
                style={styles.picker}
                itemStyle={styles.pickerItem}
              >
                <Picker.Item label="— selecciona —" value={undefined} />
                {localities.map((l) => (
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

        <View style={styles.tripTypeContainer}>
          {(['oneway', 'roundtrip'] as const).map((type) => (
            <TouchableOpacity
              key={type}
              style={[styles.tripButton, tripType === type && styles.tripButtonActive]}
              onPress={() => setTripType(type)}
            >
              <Text style={tripType === type ? styles.tripTextActive : styles.tripText}>
                {type === 'oneway' ? 'Solo ida' : 'Ida y vuelta'}
              </Text>
            </TouchableOpacity>
          ))}
        </View>

        <TouchableOpacity style={styles.dateInput} onPress={() => setShowDepartPicker(true)}>
          <Text style={styles.dateText}>Salida: {departDate.toLocaleDateString()}</Text>
        </TouchableOpacity>
        {showDepartPicker && (
          <DateTimePicker value={departDate} mode="date" display="default" onChange={onDepartChange} />
        )}

        {tripType === 'roundtrip' && (
          <>
            <TouchableOpacity style={styles.dateInput} onPress={() => setShowReturnPicker(true)}>
              <Text style={styles.dateText}>Regreso: {returnDate.toLocaleDateString()}</Text>
            </TouchableOpacity>
            {showReturnPicker && (
              <DateTimePicker value={returnDate} mode="date" display="default" onChange={onReturnChange} />
            )}
          </>
        )}

        <View style={styles.searchBtn}>
          <Button title="Buscar pasajes" color={colors.solarYellow} onPress={handleSearch} disabled={isSearchDisabled} />
        </View>

        <View style={styles.footer}>
          <Text style={styles.subtitle}>{token ? '¡Autenticado!' : 'No autenticado.'}</Text>
          <Button title="Cerrar sesión" onPress={logout} />
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  wrapper: { flex: 1, backgroundColor: colors.skyBlue },
  container: { flexGrow: 1, padding: 16 },
  title: { fontSize: 22, fontWeight: 'bold', marginBottom: 16, textAlign: 'center', color: colors.darkBlue },
  error: { color: 'red', textAlign: 'center', marginVertical: 8 },
  label: { marginTop: 12, fontWeight: '600', color: colors.darkBlue },
  pickerWrapper: {
    borderWidth: 1,
    borderColor: colors.midBlue,
    borderRadius: 4,
    marginBottom: 12,
    backgroundColor: colors.busWhite,
    overflow: 'hidden'
  },
  picker: { color: colors.darkBlue },
  pickerItem: { fontSize: 14 },
  tripTypeContainer: { flexDirection: 'row', justifyContent: 'space-around', marginVertical: 16 },
  tripButton: { paddingVertical: 8, paddingHorizontal: 16, borderRadius: 20, backgroundColor: colors.lightBlue },
  tripButtonActive: { backgroundColor: colors.solarYellow },
  tripText: { color: colors.darkBlue },
  tripTextActive: { color: colors.busWhite, fontWeight: 'bold' },
  dateInput: { padding: 12, borderWidth: 1, borderColor: colors.midBlue, borderRadius: 4, marginBottom: 12, backgroundColor: colors.busWhite },
  dateText: { color: colors.darkBlue },
  searchBtn: { marginVertical: 16 },
  footer: { alignItems: 'center', marginTop: 'auto' },
  subtitle: { marginBottom: 8, color: colors.darkBlue }
});

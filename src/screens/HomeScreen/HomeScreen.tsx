// src/screens/HomeScreen.tsx
import React, { useState, useContext, useCallback, useRef, useEffect } from 'react';
import {
  View,
  Text,
  ScrollView,
  RefreshControl,
  StyleSheet,
  TouchableOpacity,
  Alert,
  Platform,
  KeyboardAvoidingView,
  Modal,
} from 'react-native';
import DateTimePicker from '@react-native-community/datetimepicker';
import { Ionicons } from '@expo/vector-icons';
import { useFocusEffect, useNavigation } from '@react-navigation/native';
import { AuthContext } from '../../context/AuthContext';
import { getLocalities } from '../../services/locality';
import { Locality } from '../../types/locality';
import { registerForPushNotificationsAsync } from '../../notifications/registerPush';

const colors = {
  solarYellow: '#f9c94e',
  busWhite: '#ffffff',
  skyBlue: '#c6eefc',
  darkBlue: '#1f2c3a',
  lightBlue: '#c6eefc',
  midBlue: '#91d5f4',
};

const toISODate = (date: Date) => {
  const safeDate = new Date(date);
  safeDate.setHours(12, 0, 0, 0); // Evita el corrimiento por zona horaria
  const y = safeDate.getFullYear();
  const m = (safeDate.getMonth() + 1).toString().padStart(2, '0');
  const d = safeDate.getDate().toString().padStart(2, '0');
  return `${y}-${m}-${d}`;
};

export default function HomeScreen() {
  const navigation = useNavigation<any>();
  const { token } = useContext(AuthContext);

  const [localities, setLocalities] = useState<Locality[]>([]);
  const [loadingLoc, setLoadingLoc] = useState(false);
  const [errorLoc, setErrorLoc] = useState<string | null>(null);
  const [refreshing, setRefreshing] = useState(false);
  const alreadyRegistered = useRef(false);

  const [origin, setOrigin] = useState<number>();
  const [destination, setDestination] = useState<number>();
  const [tripType, setTripType] = useState<'oneway' | 'roundtrip'>('oneway');
  const [departDate, setDepartDate] = useState<Date>(() => new Date());
  const [returnDate, setReturnDate] = useState<Date>(() => new Date());
  const [showDatePicker, setShowDatePicker] = useState<'depart' | 'return' | null>(null);

  const loadLocalities = async () => {
    setLoadingLoc(true);
    try {
      const data = await getLocalities();
      setLocalities(data);
    } catch (e) {
      setErrorLoc((e as Error).message);
    } finally {
      setLoadingLoc(false);
      setRefreshing(false);
    }
  };

  useFocusEffect(
    useCallback(() => {
      loadLocalities();
    }, [])
  );

  useEffect(() => {
    if (token && !alreadyRegistered.current) {
      alreadyRegistered.current = true;
      registerForPushNotificationsAsync(token);
    }
  }, [token]);

  const handleSearch = () => {
    if (origin === destination) {
      Alert.alert('Error', 'El origen y destino no pueden ser iguales.');
      return;
    }
    if (tripType === 'roundtrip' && returnDate < departDate) {
      Alert.alert('Error', 'La fecha de regreso no puede ser menor a la de salida.');
      return;
    }

    const isoDepart = toISODate(departDate);
    const isoReturn = tripType === 'roundtrip' ? toISODate(returnDate) : undefined;

    console.log('[DEBUG] Fecha seleccionada (departDate):', departDate);
    console.log('[DEBUG] departDate.toISOString():', departDate.toISOString());
    console.log('[DEBUG] departDate toISODate():', isoDepart);

    if (tripType === 'roundtrip') {
      console.log('[DEBUG] Fecha regreso (returnDate):', returnDate);
      console.log('[DEBUG] returnDate.toISOString():', returnDate.toISOString());
      console.log('[DEBUG] returnDate toISODate():', isoReturn);
    }

    navigation.navigate('AvailableTrips', {
      origin,
      destination,
      tripType,
      departDate: isoDepart,
      returnDate: isoReturn,
    });
  };

  const getLocalityLabel = (id: number | undefined) => {
    const locality = localities.find((l) => l.id === id);
    return locality ? `${locality.nombre}, ${locality.departamento}` : '— selecciona —';
  };

const handleDateChange = (_: any, selectedDate?: Date) => {
  if (!selectedDate) return;

  // Asegurar hora al mediodía para evitar desfase UTC
  const fixedDate = new Date(
    selectedDate.getFullYear(),
    selectedDate.getMonth(),
    selectedDate.getDate(),
    12, 0, 0
  );

  if (showDatePicker === 'depart') setDepartDate(fixedDate);
  if (showDatePicker === 'return') setReturnDate(fixedDate);
  setShowDatePicker(null);
};

  const renderDatePicker = () => {
    const currentVal = showDatePicker === 'return' ? returnDate : departDate;
    const minDate = showDatePicker === 'return' ? departDate : new Date();

    if (!showDatePicker) return null;

    if (Platform.OS === 'ios') {
      return (
        <Modal visible transparent animationType="slide">
          <View style={styles.modalContainer}>
            <View style={styles.modalContent}>
              <DateTimePicker
                value={currentVal}
                mode="date"
                display="spinner"
                onChange={handleDateChange}
                maximumDate={new Date('2100-01-01')}
                minimumDate={minDate}
                themeVariant="light"
              />
            </View>
          </View>
        </Modal>
      );
    }

    return (
      <DateTimePicker
        value={currentVal}
        mode="date"
        display={Platform.OS === 'android' ? 'calendar' : 'spinner'}
        onChange={handleDateChange}
        maximumDate={new Date('2100-01-01')}
        minimumDate={minDate}
      />
    );
  };

  return (
    <KeyboardAvoidingView
      style={styles.wrapper}
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      keyboardVerticalOffset={Platform.OS === 'ios' ? 64 : 0}
    >
      <ScrollView
        contentContainerStyle={styles.container}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={loadLocalities} />}
        keyboardShouldPersistTaps="handled"
      >
        <Text style={styles.title}>Buscar pasajes de ómnibus</Text>

        <Text style={styles.label}>Origen</Text>
        <TouchableOpacity
          style={styles.dateInput}
          onPress={() => navigation.navigate('SelectLocation', { setValue: setOrigin, localities, avoidId: destination })}
        >
          <Text style={styles.dateText}>{getLocalityLabel(origin)}</Text>
        </TouchableOpacity>

        <Text style={styles.label}>Destino</Text>
        <TouchableOpacity
          style={styles.dateInput}
          onPress={() => navigation.navigate('SelectLocation', { setValue: setDestination, localities, avoidId: origin })}
        >
          <Text style={styles.dateText}>{getLocalityLabel(destination)}</Text>
        </TouchableOpacity>

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

        <Text style={styles.label}>Fecha de salida</Text>
        <TouchableOpacity style={styles.dateInput} onPress={() => setShowDatePicker('depart')}>
          <View style={styles.dateRow}>
            <Ionicons name="calendar-outline" size={20} color={colors.darkBlue} style={{ marginRight: 8 }} />
            <Text style={styles.dateText}>{departDate.toLocaleDateString()}</Text>
          </View>
        </TouchableOpacity>

        {tripType === 'roundtrip' && (
          <>
            <Text style={styles.label}>Fecha de regreso</Text>
            <TouchableOpacity style={styles.dateInput} onPress={() => setShowDatePicker('return')}>
              <View style={styles.dateRow}>
                <Ionicons name="calendar-outline" size={20} color={colors.darkBlue} style={{ marginRight: 8 }} />
                <Text style={styles.dateText}>{returnDate.toLocaleDateString()}</Text>
              </View>
            </TouchableOpacity>
          </>
        )}

        {renderDatePicker()}

        <View style={styles.searchBtn}>
          <TouchableOpacity
            onPress={handleSearch}
            style={styles.registerButton}
          >
            <Text style={styles.registerButtonText}>Buscar pasajes</Text>
          </TouchableOpacity>
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  wrapper: { flex: 1, backgroundColor: colors.skyBlue },
  container: { flexGrow: 1, padding: 16 },
  title: { fontSize: 22, fontWeight: 'bold', marginBottom: 16, textAlign: 'center', color: colors.darkBlue },
  label: { marginTop: 12, fontWeight: '600', color: colors.darkBlue },
  dateInput: {
    padding: 12,
    borderWidth: 1,
    borderColor: colors.midBlue,
    borderRadius: 8,
    marginBottom: 12,
    backgroundColor: colors.busWhite,
  },
  dateText: { color: colors.darkBlue, fontSize: 16 },
  dateRow: { flexDirection: 'row', alignItems: 'center' },
  tripTypeContainer: { flexDirection: 'row', justifyContent: 'space-around', marginVertical: 16 },
  tripButton: { paddingVertical: 8, paddingHorizontal: 16, borderRadius: 20, backgroundColor: colors.lightBlue },
  tripButtonActive: { backgroundColor: colors.solarYellow },
  tripText: { color: colors.darkBlue },
  tripTextActive: { color: colors.busWhite, fontWeight: 'bold' },
  searchBtn: { marginVertical: 16 },
  registerButton: {
    backgroundColor: colors.solarYellow,
    paddingVertical: 14,
    borderRadius: 8,
  },
  registerButtonText: {
    color: colors.darkBlue,
    fontSize: 18,
    textAlign: 'center',
    fontWeight: 'bold',
  },
  modalContainer: {
    flex: 1,
    justifyContent: 'flex-end',
    backgroundColor: 'rgba(0, 0, 0, 0.3)',
  },
  modalContent: {
    backgroundColor: '#fff',
    padding: 16,
    borderTopLeftRadius: 16,
    borderTopRightRadius: 16,
  },
});
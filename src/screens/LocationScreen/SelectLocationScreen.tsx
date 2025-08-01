// src/screens/SelectLocationScreen.tsx
import React, { useState, useCallback } from 'react';
import {
  View,
  Text,
  FlatList,
  StyleSheet,
  TouchableOpacity,
  TextInput,
  ActivityIndicator,
  Alert,
} from 'react-native';
import { useNavigation, useRoute, useFocusEffect } from '@react-navigation/native';
import { Locality } from '../../types/locality';
import { getLocalities } from '../../services/locality';

const colors = {
  solarYellow: '#f9c94e',
  busWhite: '#ffffff',
  skyBlue: '#c6eefc',
  darkBlue: '#1f2c3a',
  midBlue: '#91d5f4',
  gray: '#d3d3d3',
};

type RouteParams = {
  setValue: (id: number) => void;
  avoidId?: number;
};

export default function SelectLocationScreen() {
  const navigation = useNavigation();
  const route = useRoute();
  const { setValue, avoidId } = route.params as RouteParams;

  const [localities, setLocalities] = useState<Locality[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [search, setSearch] = useState('');

  useFocusEffect(
    useCallback(() => {
      let isActive = true;

      const fetchLocalities = async () => {
        setLoading(true);
        setError(null);
        try {
          const data = await getLocalities();
          if (isActive) {
            setLocalities(data);
          }
        } catch (err) {
          console.error(err);
          if (isActive) {
            setError('Error al cargar las localidades. Por favor, inténtalo de nuevo.');
          }
        } finally {
          if (isActive) {
            setLoading(false);
          }
        }
      };

      fetchLocalities();

      return () => {
        isActive = false;
      };
    }, [])
  );

  const highlightMatch = (text: string, query: string) => {
    const index = text.toLowerCase().indexOf(query.toLowerCase());
    if (index === -1 || !query) return <Text style={styles.text}>{text}</Text>;
    return (
      <Text style={styles.text}>
        {text.substring(0, index)}
        <Text style={styles.highlight}>{text.substring(index, index + query.length)}</Text>
        {text.substring(index + query.length)}
      </Text>
    );
  };

  const filtered = [...localities]
    .filter((l) => {
      const full = `${l.nombre}, ${l.departamento}`.toLowerCase();
      return full.includes(search.toLowerCase());
    })
    .sort((a, b) => {
      const aMatch = `${a.nombre}, ${a.departamento}`.toLowerCase().indexOf(search.toLowerCase());
      const bMatch = `${b.nombre}, ${b.departamento}`.toLowerCase().indexOf(search.toLowerCase());
      return aMatch - bMatch;
    });

  const handleSelect = (id: number) => {
    if (id === avoidId) return;
    setValue(id);
    navigation.goBack();
  };

  const renderItem = ({ item }: { item: Locality }) => {
    const isDisabled = item.id === avoidId;
    const fullText = `${item.nombre}, ${item.departamento}`;
    return (
      <TouchableOpacity
        style={[styles.item, isDisabled && styles.itemDisabled]}
        onPress={() => handleSelect(item.id)}
        disabled={isDisabled}
      >
        {highlightMatch(fullText, search)}
      </TouchableOpacity>
    );
  };

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Selecciona una localidad</Text>
      <TextInput
        style={styles.input}
        placeholder="Buscar por nombre o departamento"
        value={search}
        onChangeText={setSearch}
        placeholderTextColor="#999"
      />

      {loading ? (
        <ActivityIndicator size="large" color={colors.darkBlue} />
      ) : error ? (
        <View style={styles.errorContainer}>
          <Text style={styles.errorText}>{error}</Text>
          <TouchableOpacity
            style={styles.retryButton}
            onPress={() => {
              setLoading(true);
              setError(null);
              getLocalities()
                .then(setLocalities)
                .catch(() => setError('Error al cargar las localidades.'))
                .finally(() => setLoading(false));
            }}
          >
            <Text style={styles.retryText}>Reintentar</Text>
          </TouchableOpacity>
        </View>
      ) : (
        <FlatList
          data={filtered}
          keyExtractor={(item) => item.id.toString()}
          renderItem={renderItem}
          contentContainerStyle={styles.list}
          keyboardShouldPersistTaps="handled"
        />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.skyBlue, padding: 16 },
  title: {
    fontSize: 20,
    fontWeight: 'bold',
    marginBottom: 12,
    textAlign: 'center',
    color: colors.darkBlue,
  },
  input: {
    backgroundColor: colors.busWhite,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: colors.midBlue,
    padding: 12,
    marginBottom: 12,
    color: colors.darkBlue,
  },
  list: { paddingBottom: 24 },
  item: {
    padding: 12,
    borderBottomWidth: 1,
    borderColor: colors.midBlue,
    backgroundColor: colors.busWhite,
  },
  itemDisabled: {
    backgroundColor: colors.gray,
  },
  text: { fontSize: 16, color: colors.darkBlue },
  highlight: { backgroundColor: colors.solarYellow },
  errorContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    padding: 16,
  },
  errorText: {
    color: 'red',
    marginBottom: 8,
    textAlign: 'center',
  },
  retryButton: {
    padding: 10,
    backgroundColor: colors.midBlue,
    borderRadius: 8,
  },
  retryText: {
    color: colors.busWhite,
    fontWeight: 'bold',
  },
});

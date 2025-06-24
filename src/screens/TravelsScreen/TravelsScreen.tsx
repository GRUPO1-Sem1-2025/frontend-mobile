import React, { useEffect, useState, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  ActivityIndicator,
  Alert,
  TouchableOpacity,
  Modal,
  TextInput,
} from 'react-native';
import { FontAwesome } from '@expo/vector-icons';
import AsyncStorage from '@react-native-async-storage/async-storage';
import {
  getCompras,
  getReservas,
  calificarViaje,
  getCompraViaje,
  getCalificacionViaje,
} from '../../services/reservations';

import { Buffer } from 'buffer';
import { useFocusEffect } from '@react-navigation/native';
const colors = {
  solarYellow: '#f9c94e',
  busWhite: '#ffffff',
  skyBlue: '#c6eefc',
  darkBlue: '#1f2c3a',
  midBlue: '#91d5f4',
  gray: '#d3d3d3',
};

export default function TravelsScreens() {
  const [reservas, setReservas] = useState<any[]>([]);
  const [compras, setCompras] = useState<any[]>([]);
  const [comprasDetalles, setComprasDetalles] = useState<{ [compraId: number]: any }>({});
  const [calificaciones, setCalificaciones] = useState<{ [viajeId: number]: number }>({});
  const [comentarios, setComentarios] = useState<{ [viajeId: number]: string[] }>({});
  const [loading, setLoading] = useState(true);
  const [userEmail, setUserEmail] = useState('');
  const [userId, setUserId] = useState<number | null>(null);
  const [token, setToken] = useState('');

  // Modal state
  const [modalVisible, setModalVisible] = useState(false);
  const [selectedViajeId, setSelectedViajeId] = useState<number | null>(null);
  const [rating, setRating] = useState(0);
  const [comentario, setComentario] = useState('');

  useFocusEffect(
    useCallback(() => {
      const fetchData = async () => {
        setLoading(true);
        try {
          const storedToken = await AsyncStorage.getItem('userToken');
          if (!storedToken) throw new Error('Token no encontrado');

          setToken(storedToken);

          const payloadBase64 = token.split('.')[1];
const decoded = Buffer.from(payloadBase64, 'base64').toString('utf-8');
const payload = JSON.parse(decoded);
          const email = payload.sub;
          const idUsuario = payload.id;
          setUserEmail(email);
          setUserId(idUsuario);

          const [reservasData, comprasData] = await Promise.all([
            getReservas(email, storedToken),
            getCompras(email, storedToken),
          ]);

          setReservas(reservasData || []);
          setCompras(comprasData || []);

          const detallesEntries = await Promise.all(
            comprasData.map(async (comp: any) => {
              try {
                const detalle = await getCompraViaje(comp.viajeId, comp.compraId, idUsuario);
                return [comp.compraId, detalle];
              } catch (error) {
                console.error('Error al traer detalle de compra', comp.compraId, error);
                return [comp.compraId, null];
              }
            })
          );

          const detalles: { [compraId: number]: any } = Object.fromEntries(detallesEntries);
          setComprasDetalles(detalles);

          const calificacionesEntries = await Promise.all(
            comprasData.map(async (comp: any) => {
              try {
                const calificacionData = await getCalificacionViaje(comp.viajeId, idUsuario);
                return {
                  viajeId: comp.viajeId,
                  calificacion: calificacionData.calificacion ?? 0,
                  comentarios: calificacionData.comentarios ?? [],
                };
              } catch (error) {
                console.error('Error al traer calificación de viaje', comp.viajeId, error);
                return { viajeId: comp.viajeId, calificacion: 0, comentarios: [] };
              }
            })
          );

          const calificacionesObj: { [viajeId: number]: number } = {};
          const comentariosObj: { [viajeId: number]: string[] } = {};
          calificacionesEntries.forEach(item => {
            calificacionesObj[item.viajeId] = item.calificacion;
            comentariosObj[item.viajeId] = item.comentarios;
          });

          setCalificaciones(calificacionesObj);
          setComentarios(comentariosObj);
        } catch (error: any) {
          console.error(error);
          Alert.alert('Error', error.message || 'No se pudieron cargar los datos');
        } finally {
          setLoading(false);
        }
      };

      fetchData();
    }, [])
  );
  const handleOpenModal = (viajeId: number) => {
    setSelectedViajeId(viajeId);
    setRating(0);
    setComentario('');
    setModalVisible(true);
  };

const handleSubmitCalificacion = async () => {
  if (!selectedViajeId || rating === 0) {
    Alert.alert('Error', 'Por favor, seleccioná una calificación.');
    return;
  }

  try {
    await calificarViaje(selectedViajeId, rating, comentario, userId!);
    setCalificaciones(prev => ({ ...prev, [selectedViajeId]: rating }));
    setComentarios(prev => ({
      ...prev,
      [selectedViajeId]: [comentario],
    }));
    Alert.alert('¡Gracias!', 'Tu calificación ha sido registrada.');
    setModalVisible(false);
  } catch (error: any) {
    Alert.alert('Error', error.message || 'No se pudo calificar el viaje');
  }
};

  const renderStarsInput = () => {
    return (
      <View style={styles.starsRow}>
        {[1, 2, 3, 4, 5].map(star => (
          <TouchableOpacity key={star} onPress={() => setRating(star)}>
            <FontAwesome
              name="star"
              size={30}
              color={star <= rating ? colors.solarYellow : '#ccc'}
              style={{ marginHorizontal: 4 }}
            />
          </TouchableOpacity>
        ))}
      </View>
    );
  };

  if (loading) {
    return (
      <View style={styles.center}>
        <ActivityIndicator size="large" color={colors.darkBlue} />
        <Text style={styles.loadingText}>Cargando tus viajes...</Text>
      </View>
    );
  }

  return (
    <View style={{ flex: 1 }}>
      <ScrollView contentContainerStyle={styles.container}>
        <Text style={styles.title}>Mis Viajes</Text>

        <Text style={styles.sectionTitle}>Reservas</Text>
        {reservas.length === 0 ? (
          <Text style={styles.message}>No tenés reservas activas.</Text>
        ) : (
          reservas.map((res, index) => (
            <View key={`res-${index}`} style={styles.card}>
              <Text style={styles.cardTitle}>Viaje #{res.viajeId}</Text>
              <Text style={styles.cardText}>Asientos: {res.numerosDeAsiento.join(', ')}</Text>
              <Text style={styles.cardText}>Estado: {res.estadoCompra}</Text>
            </View>
          ))
        )}

        <Text style={styles.sectionTitle}>Compras</Text>
        {compras.length === 0 ? (
          <Text style={styles.message}>No tenés compras realizadas.</Text>
        ) : (
          compras.map((comp, index) => {
            const detalle = comprasDetalles[comp.compraId];
            const yaCalificado = calificaciones[comp.viajeId] > 0;
            return (
              <View key={`comp-${index}`} style={styles.card}>
                <Text style={styles.cardTitle}>Viaje #{comp.viajeId}</Text>
                <Text style={styles.cardText}>
                  Asientos: {comp.numerosDeAsiento.join(', ') || 'No asignados'}
                </Text>
                <Text style={styles.cardText}>Estado: {comp.estadoCompra}</Text>
                {detalle ? (
                  <>
                    <Text style={styles.cardText}>Origen: {detalle.localidadOrigenNombre}</Text>
                    <Text style={styles.cardText}>Destino: {detalle.localidadDestinoNombre}</Text>
                    <Text style={styles.cardText}>Fecha: {detalle.fechaInicio}</Text>
                    <Text style={styles.cardText}>
                      Horario: {detalle.horaInicio} - {detalle.horaFin}
                    </Text>
                    <Text style={styles.cardText}>Precio: ${detalle.precio}</Text>
                  </>
                ) : (
                  <Text style={styles.cardText}>Cargando detalle...</Text>
                )}
                {yaCalificado ? (
                  <>
                    <Text style={styles.ratedText}>
                      Calificado: {calificaciones[comp.viajeId]}/5
                    </Text>
                    {comentarios[comp.viajeId]?.length > 0 && (
                      <Text style={styles.commentText}>
                        Comentario: {comentarios[comp.viajeId][0]}
                      </Text>
                    )}
                  </>
                ) : (
                  <TouchableOpacity
                    style={styles.rateButton}
                    onPress={() => handleOpenModal(comp.viajeId)}
                  >
                    <Text style={styles.rateButtonText}>Calificar Viaje</Text>
                  </TouchableOpacity>
                )}
              </View>
            );
          })
        )}
      </ScrollView>

      {/* Modal */}
      <Modal
        visible={modalVisible}
        animationType="slide"
        transparent={true}
        onRequestClose={() => setModalVisible(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContainer}>
            <Text style={styles.modalTitle}>Calificar Viaje</Text>
            {renderStarsInput()}
            <TextInput
              style={styles.input}
              placeholder="Dejá un comentario (opcional)"
              value={comentario}
              onChangeText={setComentario}
              placeholderTextColor="#999"
            />
            <TouchableOpacity style={styles.submitButton} onPress={handleSubmitCalificacion}>
              <Text style={styles.submitButtonText}>Enviar Calificación</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={styles.cancelButton}
              onPress={() => setModalVisible(false)}
            >
              <Text style={styles.cancelButtonText}>Cancelar</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flexGrow: 1,
    padding: 16,
    backgroundColor: colors.skyBlue,
  },
  center: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: colors.skyBlue,
  },
  loadingText: {
    marginTop: 12,
    fontSize: 16,
    color: colors.darkBlue,
  },
  title: {
    fontSize: 28,
    textAlign: 'center',
    marginVertical: 16,
    color: colors.darkBlue,
    fontWeight: 'bold',
  },
  sectionTitle: {
    fontSize: 22,
    marginTop: 16,
    color: colors.darkBlue,
    fontWeight: '600',
    borderBottomWidth: 2,
    borderBottomColor: colors.midBlue,
    paddingBottom: 4,
    marginBottom: 8,
  },
  card: {
    backgroundColor: colors.busWhite,
    borderRadius: 12,
    padding: 16,
    marginTop: 12,
    shadowColor: '#000',
    shadowOpacity: 0.1,
    shadowRadius: 6,
    elevation: 3,
  },
  cardTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: colors.darkBlue,
    marginBottom: 8,
  },
  cardText: {
    fontSize: 16,
    color: colors.darkBlue,
    marginBottom: 4,
  },
  starsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    marginVertical: 8,
  },
  ratedText: {
    fontSize: 16,
    color: colors.darkBlue,
    fontStyle: 'italic',
    marginTop: 8,
    textAlign: 'center',
  },
  commentText: {
    fontSize: 14,
    color: colors.darkBlue,
    fontStyle: 'italic',
    marginTop: 4,
    textAlign: 'center',
  },
  message: {
    fontSize: 16,
    color: colors.darkBlue,
    marginTop: 8,
    textAlign: 'center',
  },
  rateButton: {
    marginTop: 10,
    backgroundColor: colors.solarYellow,
    paddingVertical: 10,
    borderRadius: 8,
    alignItems: 'center',
  },
  rateButtonText: {
    color: colors.darkBlue,
    fontWeight: 'bold',
    fontSize: 16,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.4)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalContainer: {
    backgroundColor: colors.busWhite,
    padding: 20,
    borderRadius: 12,
    width: '80%',
    alignItems: 'center',
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: colors.darkBlue,
    marginBottom: 12,
  },
  input: {
    width: '100%',
    borderWidth: 1,
    borderColor: colors.midBlue,
    borderRadius: 8,
    padding: 10,
    marginTop: 12,
    color: colors.darkBlue,
  },
  submitButton: {
    backgroundColor: colors.solarYellow,
    paddingVertical: 10,
    borderRadius: 8,
    marginTop: 16,
    width: '100%',
    alignItems: 'center',
  },
  submitButtonText: {
    color: colors.darkBlue,
    fontWeight: 'bold',
    fontSize: 16,
  },
  cancelButton: {
    marginTop: 8,
  },
  cancelButtonText: {
    color: colors.darkBlue,
    fontSize: 14,
  },
});

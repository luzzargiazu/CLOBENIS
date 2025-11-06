import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, ActivityIndicator, Alert, TouchableOpacity, Platform, Linking } from 'react-native';
import MapView, { Marker, PROVIDER_GOOGLE } from 'react-native-maps';
import * as Location from 'expo-location';

// IMPORTANTE: Reemplaza con tu API Key
const GOOGLE_MAPS_API_KEY = 'AIzaSyBOWFbs86BalgScNfFqu-g-C8zDAglRFNw';

interface TennisCourt {
  place_id: string;
  name: string;
  vicinity: string;
  latitude: number;
  longitude: number;
  rating?: number;
  user_ratings_total?: number;
  opening_hours?: {
    open_now?: boolean;
  };
  distance?: number;
}

export default function TennisCourtMap() {
  const [location, setLocation] = useState<Location.LocationObject | null>(null);
  const [loading, setLoading] = useState(true);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [selectedCourt, setSelectedCourt] = useState<TennisCourt | null>(null);
  const [tennisCourts, setTennisCourts] = useState<TennisCourt[]>([]);
  const [searchRadius, setSearchRadius] = useState(5000);

  const calculateDistance = (lat1: number, lon1: number, lat2: number, lon2: number): number => {
    const R = 6371e3;
    const φ1 = lat1 * Math.PI / 180;
    const φ2 = lat2 * Math.PI / 180;
    const Δφ = (lat2 - lat1) * Math.PI / 180;
    const Δλ = (lon2 - lon1) * Math.PI / 180;

    const a = Math.sin(Δφ / 2) * Math.sin(Δφ / 2) +
              Math.cos(φ1) * Math.cos(φ2) *
              Math.sin(Δλ / 2) * Math.sin(Δλ / 2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));

    return R * c;
  };

  const formatDistance = (meters: number): string => {
    if (meters < 1000) {
      return `${Math.round(meters)} m`;
    }
    return `${(meters / 1000).toFixed(1)} km`;
  };

  const searchTennisCourts = async (userLocation: Location.LocationObject) => {
    try {
      const { latitude, longitude } = userLocation.coords;
      
      const url = `https://maps.googleapis.com/maps/api/place/nearbysearch/json?location=${latitude},${longitude}&radius=${searchRadius}&keyword=cancha+tenis+OR+tennis+court+OR+club+tenis&key=${GOOGLE_MAPS_API_KEY}`;

      console.log('🔍 Buscando canchas cercanas...');
      
      const response = await fetch(url);
      const data = await response.json();

      if (data.status === 'OK') {
        const courts: TennisCourt[] = data.results.map((place: any) => {
          const distance = calculateDistance(
            latitude,
            longitude,
            place.geometry.location.lat,
            place.geometry.location.lng
          );

          return {
            place_id: place.place_id,
            name: place.name,
            vicinity: place.vicinity || place.formatted_address || 'Dirección no disponible',
            latitude: place.geometry.location.lat,
            longitude: place.geometry.location.lng,
            rating: place.rating,
            user_ratings_total: place.user_ratings_total,
            opening_hours: place.opening_hours,
            distance: distance,
          };
        });

        courts.sort((a, b) => (a.distance || 0) - (b.distance || 0));

        setTennisCourts(courts);
        console.log(`✅ Se encontraron ${courts.length} canchas`);
      } else if (data.status === 'ZERO_RESULTS') {
        console.log('⚠️ No se encontraron canchas en el área');
        setTennisCourts([]);
        Alert.alert(
          'Sin resultados',
          'No se encontraron canchas de tenis cerca. Intenta ampliar el radio de búsqueda.',
          [
            { text: 'Buscar a 10km', onPress: () => setSearchRadius(10000) },
            { text: 'OK', style: 'cancel' }
          ]
        );
      } else {
        console.error('❌ Error en la API:', data.status, data.error_message);
        Alert.alert('Error', `Problema con la API: ${data.status}. Verifica tu API Key.`);
      }
    } catch (error) {
      console.error('❌ Error buscando canchas:', error);
      Alert.alert('Error', 'No se pudo conectar con el servicio de mapas.');
    }
  };

  useEffect(() => {
    (async () => {
      try {
        let { status } = await Location.requestForegroundPermissionsAsync();
        
        if (status !== 'granted') {
          setErrorMsg('Se necesita permiso para acceder a la ubicación');
          setLoading(false);
          return;
        }

        console.log('📍 Obteniendo ubicación...');
        let currentLocation = await Location.getCurrentPositionAsync({
          accuracy: Location.Accuracy.Balanced,
        });
        
        setLocation(currentLocation);
        await searchTennisCourts(currentLocation);
        setLoading(false);
      } catch (error) {
        setErrorMsg('Error al obtener la ubicación');
        setLoading(false);
        console.error(error);
      }
    })();
  }, []);

  useEffect(() => {
    if (location && searchRadius) {
      searchTennisCourts(location);
    }
  }, [searchRadius]);

  const openNavigation = (court: TennisCourt) => {
    const label = encodeURIComponent(court.name);
    const url = Platform.select({
      ios: `maps:0,0?q=${court.latitude},${court.longitude}(${label})`,
      android: `geo:0,0?q=${court.latitude},${court.longitude}(${label})`
    });

    if (url) {
      Linking.openURL(url).catch(() => {
        Alert.alert('Error', 'No se pudo abrir la aplicación de mapas');
      });
    }
  };

  if (loading) {
    return (
      <View style={styles.centerContainer}>
        <ActivityIndicator size="large" color="#476EAE" />
        <Text style={styles.loadingText}>Buscando canchas cercanas...</Text>
      </View>
    );
  }

  if (errorMsg) {
    return (
      <View style={styles.centerContainer}>
        <Text style={styles.errorIcon}>📍</Text>
        <Text style={styles.errorText}>{errorMsg}</Text>
        <Text style={styles.errorSubtext}>
          Por favor, habilita los permisos de ubicación en la configuración
        </Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      {location && (
        <MapView
          provider={PROVIDER_GOOGLE}
          style={styles.map}
          initialRegion={{
            latitude: location.coords.latitude,
            longitude: location.coords.longitude,
            latitudeDelta: 0.05,
            longitudeDelta: 0.05,
          }}
          showsUserLocation={true}
          showsMyLocationButton={true}
        >
          {tennisCourts.map((court) => (
            <Marker
              key={court.place_id}
              coordinate={{
                latitude: court.latitude,
                longitude: court.longitude,
              }}
              title={court.name}
              description={court.vicinity}
              pinColor="#476EAE"
              onPress={() => setSelectedCourt(court)}
            >
              <View style={styles.customMarker}>
                <Text style={styles.markerEmoji}>🎾</Text>
              </View>
            </Marker>
          ))}
        </MapView>
      )}

      <View style={styles.counterBadge}>
        <Text style={styles.counterText}>
          {tennisCourts.length} {tennisCourts.length === 1 ? 'cancha' : 'canchas'}
        </Text>
      </View>

      <View style={styles.radiusButtons}>
        {[2000, 5000, 10000].map((radius) => (
          <TouchableOpacity
            key={radius}
            style={[
              styles.radiusButton,
              searchRadius === radius && styles.radiusButtonActive
            ]}
            onPress={() => setSearchRadius(radius)}
          >
            <Text style={[
              styles.radiusButtonText,
              searchRadius === radius && styles.radiusButtonTextActive
            ]}>
              {radius / 1000}km
            </Text>
          </TouchableOpacity>
        ))}
      </View>

      {selectedCourt && (
        <View style={styles.courtInfoCard}>
          <TouchableOpacity 
            style={styles.closeButton}
            onPress={() => setSelectedCourt(null)}
          >
            <Text style={styles.closeButtonText}>✕</Text>
          </TouchableOpacity>

          <View style={styles.courtHeader}>
            <Text style={styles.courtName}>{selectedCourt.name}</Text>
            {selectedCourt.distance && (
              <Text style={styles.courtDistance}>
                📍 {formatDistance(selectedCourt.distance)}
              </Text>
            )}
          </View>

          <Text style={styles.courtAddress}>{selectedCourt.vicinity}</Text>

          {selectedCourt.rating && (
            <View style={styles.ratingContainer}>
              <Text style={styles.ratingStars}>⭐ {selectedCourt.rating.toFixed(1)}</Text>
              {selectedCourt.user_ratings_total && (
                <Text style={styles.ratingCount}>
                  ({selectedCourt.user_ratings_total} reseñas)
                </Text>
              )}
            </View>
          )}

          {selectedCourt.opening_hours && (
            <View style={styles.statusContainer}>
              <View style={[
                styles.statusDot,
                { backgroundColor: selectedCourt.opening_hours.open_now ? '#4CAF50' : '#F44336' }
              ]} />
              <Text style={styles.statusText}>
                {selectedCourt.opening_hours.open_now ? 'Abierto ahora' : 'Cerrado'}
              </Text>
            </View>
          )}

          <View style={styles.actionButtons}>
            <TouchableOpacity 
              style={styles.primaryButton}
              onPress={() => openNavigation(selectedCourt)}
            >
              <Text style={styles.primaryButtonText}>🗺️ Cómo llegar</Text>
            </TouchableOpacity>

            <TouchableOpacity 
              style={styles.secondaryButton}
              onPress={() => Alert.alert('Info', 'Función disponible próximamente')}
            >
              <Text style={styles.secondaryButtonText}>ℹ️ Más info</Text>
            </TouchableOpacity>
          </View>
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  map: {
    width: '100%',
    height: '100%',
  },
  centerContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
    backgroundColor: '#f5f5f5',
  },
  loadingText: {
    marginTop: 16,
    fontSize: 16,
    color: '#666',
  },
  errorIcon: {
    fontSize: 60,
    marginBottom: 16,
  },
  errorText: {
    fontSize: 18,
    fontWeight: '600',
    color: '#333',
    textAlign: 'center',
    marginBottom: 8,
  },
  errorSubtext: {
    fontSize: 14,
    color: '#666',
    textAlign: 'center',
  },
  customMarker: {
    backgroundColor: '#fff',
    borderRadius: 20,
    padding: 8,
    borderWidth: 2,
    borderColor: '#476EAE',
    shadowColor: '#000',
    shadowOpacity: 0.3,
    shadowOffset: { width: 0, height: 2 },
    shadowRadius: 4,
    elevation: 5,
  },
  markerEmoji: {
    fontSize: 24,
  },
  counterBadge: {
    position: 'absolute',
    top: 20,
    left: 20,
    backgroundColor: '#fff',
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 20,
    shadowColor: '#000',
    shadowOpacity: 0.2,
    shadowOffset: { width: 0, height: 2 },
    shadowRadius: 4,
    elevation: 5,
  },
  counterText: {
    fontSize: 14,
    fontWeight: '700',
    color: '#476EAE',
  },
  radiusButtons: {
    position: 'absolute',
    top: 20,
    right: 20,
    flexDirection: 'row',
    gap: 8,
  },
  radiusButton: {
    backgroundColor: '#fff',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 16,
    borderWidth: 2,
    borderColor: '#e0e0e0',
    shadowColor: '#000',
    shadowOpacity: 0.1,
    shadowOffset: { width: 0, height: 2 },
    shadowRadius: 4,
    elevation: 3,
  },
  radiusButtonActive: {
    backgroundColor: '#476EAE',
    borderColor: '#476EAE',
  },
  radiusButtonText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#666',
  },
  radiusButtonTextActive: {
    color: '#fff',
  },
  courtInfoCard: {
    position: 'absolute',
    bottom: 20,
    left: 20,
    right: 20,
    backgroundColor: '#fff',
    borderRadius: 16,
    padding: 20,
    shadowColor: '#000',
    shadowOpacity: 0.2,
    shadowOffset: { width: 0, height: 4 },
    shadowRadius: 8,
    elevation: 8,
  },
  closeButton: {
    position: 'absolute',
    top: 12,
    right: 12,
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: '#f0f0f0',
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 10,
  },
  closeButtonText: {
    fontSize: 16,
    color: '#666',
    fontWeight: '600',
  },
  courtHeader: {
    marginBottom: 8,
  },
  courtName: {
    fontSize: 20,
    fontWeight: '700',
    color: '#333',
    marginBottom: 4,
    paddingRight: 30,
  },
  courtDistance: {
    fontSize: 14,
    fontWeight: '600',
    color: '#476EAE',
  },
  courtAddress: {
    fontSize: 14,
    color: '#666',
    marginBottom: 12,
  },
  ratingContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  ratingStars: {
    fontSize: 14,
    fontWeight: '600',
    color: '#333',
    marginRight: 6,
  },
  ratingCount: {
    fontSize: 12,
    color: '#999',
  },
  statusContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16,
  },
  statusDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    marginRight: 6,
  },
  statusText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#666',
  },
  actionButtons: {
    flexDirection: 'row',
    gap: 12,
  },
  primaryButton: {
    flex: 1,
    backgroundColor: '#476EAE',
    paddingVertical: 12,
    borderRadius: 12,
    alignItems: 'center',
  },
  primaryButtonText: {
    color: '#fff',
    fontSize: 14,
    fontWeight: '600',
  },
  secondaryButton: {
    flex: 1,
    backgroundColor: '#f0f0f0',
    paddingVertical: 12,
    borderRadius: 12,
    alignItems: 'center',
  },
  secondaryButtonText: {
    color: '#476EAE',
    fontSize: 14,
    fontWeight: '600',
  },
});

import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import MapView, { Marker, Circle, Callout } from 'react-native-maps';
import { DoctorWithDistance, Hospital, RangeKm } from '../../../../types/duty';

interface LiveMapProps {
  hospital: Hospital;
  doctors: DoctorWithDistance[];
  rangeKm: RangeKm;
}

const LiveMap: React.FC<LiveMapProps> = ({ hospital, doctors, rangeKm }) => {
  const region = {
    latitude: hospital.location.latitude,
    longitude: hospital.location.longitude,
    // Zoom level based on range
    latitudeDelta: rangeKm * 0.018,
    longitudeDelta: rangeKm * 0.018,
  };

  return (
    <MapView style={styles.map} initialRegion={region} region={region}>
      {/* Range circle */}
      <Circle
        center={{
          latitude: hospital.location.latitude,
          longitude: hospital.location.longitude,
        }}
        radius={rangeKm * 1000}
        strokeColor="#1565C0"
        strokeWidth={2}
        fillColor="rgba(66,165,245,0.08)"
      />

      {/* Hospital marker */}
      <Marker
        coordinate={{
          latitude: hospital.location.latitude,
          longitude: hospital.location.longitude,
        }}
        pinColor="#E53935"
        title={hospital.name}
        description={hospital.location.address}
      />

      {/* Doctor markers */}
      {doctors.map((doc) => (
        <Marker
          key={doc.id}
          coordinate={{
            latitude: doc.location.latitude,
            longitude: doc.location.longitude,
          }}
          pinColor={doc.available ? '#43A047' : '#FB8C00'}
        >
          <Callout tooltip>
            <View style={styles.callout}>
              <Text style={styles.calloutName}>{doc.name}</Text>
              <Text style={styles.calloutSpecialty}>{doc.specialty}</Text>
              <Text style={styles.calloutDetail}>
                ⭐ {doc.rating} · ₹{doc.consultationFee}
              </Text>
              <Text style={styles.calloutDetail}>
                📍 {doc.distanceKm.toFixed(1)} km away
              </Text>
              <Text
                style={[
                  styles.calloutStatus,
                  { color: doc.available ? '#2E7D32' : '#E65100' },
                ]}
              >
                {doc.available ? '✅ Available now' : '🟠 Currently busy'}
              </Text>
            </View>
          </Callout>
        </Marker>
      ))}
    </MapView>
  );
};

export default LiveMap;

const styles = StyleSheet.create({
  map: {
    width: '100%',
    height: '100%',
  },
  callout: {
    backgroundColor: '#FFFFFF',
    borderRadius: 10,
    padding: 12,
    minWidth: 180,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.15,
    shadowRadius: 6,
    elevation: 5,
  },
  calloutName: {
    fontSize: 14,
    fontWeight: '700',
    color: '#1A237E',
    marginBottom: 2,
  },
  calloutSpecialty: {
    fontSize: 12,
    fontWeight: '600',
    color: '#1565C0',
    marginBottom: 4,
  },
  calloutDetail: {
    fontSize: 12,
    color: '#555',
    marginBottom: 2,
  },
  calloutStatus: {
    fontSize: 12,
    fontWeight: '700',
    marginTop: 4,
  },
});

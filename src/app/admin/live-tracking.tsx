import React, { useState, useEffect } from 'react';
import { 
  ScrollView, 
  StyleSheet, 
  useWindowDimensions, 
  View, 
  Text, 
  TouchableOpacity,
  Image,
  Dimensions,
  Platform
} from 'react-native';
import MapView, { Marker, Polyline, PROVIDER_GOOGLE, Region } from 'react-native-maps';
import { LinearGradient } from 'expo-linear-gradient';

// Sample data for tracking with Indian names
const trackingData = [
  {
    id: 1,
    role: 'Emergency Nurse',
    name: 'Priya Sharma',
    hospital: 'Apollo Hospital',
    status: 'on-time',
    time: '12 mins',
    distance: '3.4 km',
    avatar: 'https://i.pravatar.cc/150?img=1',
    coordinate: { latitude: 12.9716, longitude: 77.5946 }, // Bangalore
  },
  {
    id: 2,
    role: 'ICU Specialist',
    name: 'Dr. Rajesh Kumar',
    hospital: 'Fortis Healthcare',
    status: 'delayed',
    time: '24 mins',
    distance: '8.1 km',
    avatar: 'https://i.pravatar.cc/150?img=3',
    coordinate: { latitude: 12.9352, longitude: 77.6245 }, // Bangalore
  },
  {
    id: 3,
    role: 'Radiology Tech',
    name: 'Anjali Patel',
    hospital: 'Manipal Hospital',
    status: 'transit',
    time: '18 mins',
    distance: '5.2 km',
    avatar: 'https://i.pravatar.cc/150?img=5',
    coordinate: { latitude: 12.9698, longitude: 77.7499 }, // Bangalore
  },
];

// Map routes data
const routes = [
  {
    id: 1,
    coordinates: [
      { latitude: 12.9716, longitude: 77.5946 },
      { latitude: 12.9706, longitude: 77.5956 },
      { latitude: 12.9696, longitude: 77.5966 },
    ],
    color: '#3B82F6',
  },
  {
    id: 2,
    coordinates: [
      { latitude: 12.9352, longitude: 77.6245 },
      { latitude: 12.9362, longitude: 77.6235 },
      { latitude: 12.9372, longitude: 77.6225 },
    ],
    color: '#EF4444',
  },
];

interface TrackingItem {
  id: number;
  role: string;
  name: string;
  hospital: string;
  status: string;
  time: string;
  distance: string;
  avatar: string;
  coordinate: {
    latitude: number;
    longitude: number;
  };
}

interface Route {
  id: number;
  coordinates: Array<{
    latitude: number;
    longitude: number;
  }>;
  color: string;
}

export default function Dashboard() {
  const { width } = useWindowDimensions();
  const isTablet = width >= 768;
  const [selectedFilter, setSelectedFilter] = useState('all');
  const [mapRegion, setMapRegion] = useState<Region>({
    latitude: 12.9716,
    longitude: 77.5946,
    latitudeDelta: 0.1,
    longitudeDelta: 0.1,
  });

  const getStatusColor = (status: string) => {
    switch(status) {
      case 'on-time': return '#10B981';
      case 'delayed': return '#EF4444';
      case 'transit': return '#F59E0B';
      default: return '#6B7280';
    }
  };

  const getStatusText = (status: string) => {
    switch(status) {
      case 'on-time': return 'ON TIME';
      case 'delayed': return 'DELAYED';
      case 'transit': return 'IN TRANSIT';
      default: return status;
    }
  };

  return (
    <ScrollView style={styles.screen} contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
      {/* Header */}
      <View style={styles.header}>
        <View>
          <Text style={styles.title}>Live Tracking & Monitoring</Text>
          <Text style={styles.subtitle}>Real-time oversight of ongoing clinical shifts and logistics.</Text>
        </View>
        <View style={styles.headerActions}>
          <TouchableOpacity style={styles.filterButton}>
            <Text style={styles.filterButtonText}>Filters</Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.exportButton}>
            <Text style={styles.exportButtonText}>Export Report</Text>
          </TouchableOpacity>
        </View>
      </View>

      {/* Main Content */}
      <View style={[styles.mainContent, isTablet && styles.mainContentTablet]}>
        {/* Left Panel - Tracking List */}
        <View style={[styles.leftPanel, isTablet && styles.leftPanelTablet]}>
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>ACTIVE DUTIES TRACKING</Text>
            <View style={styles.activeBadge}>
              <Text style={styles.activeBadgeText}>24 ACTIVE</Text>
            </View>
          </View>

          {trackingData.map((item) => (
            <View key={item.id} style={styles.trackingCard}>
              <View style={styles.cardHeader}>
                <View style={styles.cardTitleSection}>
                  <Text style={styles.cardRole}>{item.role}</Text>
                  <View style={[styles.statusText, { backgroundColor: getStatusColor(item.status) + '20' }]}>
                    <Text style={[styles.statusTextInner, { color: getStatusColor(item.status) }]}>
                      {getStatusText(item.status)}
                    </Text>
                  </View>
                </View>
                <Text style={styles.cardHospital}>{item.hospital}</Text>
              </View>

              <View style={styles.cardBody}>
                <Image source={{ uri: item.avatar }} style={styles.avatar} />
                <View style={styles.personInfo}>
                  <Text style={styles.personName}>{item.name}</Text>
                  <Text style={styles.personId}>ID: SP-4201</Text>
                </View>
              </View>

              <View style={styles.cardMetrics}>
                <View style={styles.metric}>
                  <Text style={styles.metricValue}>{item.time}</Text>
                  <Text style={styles.metricLabel}>ESTIMATED</Text>
                </View>
                <View style={styles.metricDivider} />
                <View style={styles.metric}>
                  <Text style={styles.metricValue}>{item.distance}</Text>
                  <Text style={styles.metricLabel}>DISTANCE</Text>
                </View>
              </View>

              <TouchableOpacity style={styles.actionButton}>
                <Text style={styles.actionButtonText}>
                  {item.status === 'delayed' ? 'View Alert Detail' : 'Show on Map'}
                </Text>
              </TouchableOpacity>
            </View>
          ))}
        </View>

        {/* Right Panel - Map */}
        <View style={[styles.rightPanel, isTablet && styles.rightPanelTablet]}>
          <View style={styles.mapContainer}>
            <MapView
              provider={Platform.OS === 'android' ? PROVIDER_GOOGLE : undefined}
              style={styles.map}
              region={mapRegion}
              onRegionChangeComplete={setMapRegion}
              showsUserLocation={false}
              showsMyLocationButton={true}
              showsCompass={true}
              zoomEnabled={true}
              scrollEnabled={true}
            >
              {/* Routes */}
              {routes.map((route) => (
                <Polyline
                  key={route.id}
                  coordinates={route.coordinates}
                  strokeColor={route.color}
                  strokeWidth={3}
                />
              ))}

              {/* Markers */}
              {trackingData.map((item, index) => (
                <Marker
                  key={item.id}
                  coordinate={item.coordinate}
                  title={item.name}
                  description={item.role}
                >
                  <View style={styles.markerContainer}>
                    <LinearGradient
                      colors={['#FFFFFF', '#F3F4F6']}
                      style={styles.markerBubble}
                      start={{ x: 0, y: 0 }}
                      end={{ x: 1, y: 1 }}
                    >
                      <Image source={{ uri: item.avatar }} style={styles.markerAvatar} />
                    </LinearGradient>
                    <View style={[styles.markerPin, { backgroundColor: getStatusColor(item.status) }]} />
                  </View>
                </Marker>
              ))}
            </MapView>

            {/* Map Controls */}
            <View style={styles.mapControls}>
              <TouchableOpacity 
                style={styles.mapControlButton}
                onPress={() => {
                  setMapRegion(prev => ({
                    ...prev,
                    latitudeDelta: prev.latitudeDelta * 0.8,
                    longitudeDelta: prev.longitudeDelta * 0.8,
                  }));
                }}
              >
                <Text style={styles.mapControlText}>+</Text>
              </TouchableOpacity>
              <TouchableOpacity 
                style={styles.mapControlButton}
                onPress={() => {
                  setMapRegion(prev => ({
                    ...prev,
                    latitudeDelta: prev.latitudeDelta * 1.2,
                    longitudeDelta: prev.longitudeDelta * 1.2,
                  }));
                }}
              >
                <Text style={styles.mapControlText}>−</Text>
              </TouchableOpacity>
            </View>

            {/* Legend */}
            <View style={styles.mapLegend}>
              <View style={styles.legendItem}>
                <View style={[styles.legendDot, { backgroundColor: '#3B82F6' }]} />
                <Text style={styles.legendText}>Active Routes</Text>
              </View>
              <View style={styles.legendItem}>
                <View style={[styles.legendDot, { backgroundColor: '#EF4444' }]} />
                <Text style={styles.legendText}>Critical Delay</Text>
              </View>
              <View style={styles.legendItem}>
                <View style={[styles.legendDot, { backgroundColor: '#F59E0B' }]} />
                <Text style={styles.legendText}>Total Healthcare: 114</Text>
              </View>
            </View>
          </View>
        </View>
      </View>

      {/* Footer */}
      <View style={styles.footer}>
        <View style={styles.footerLeft}>
          <View style={styles.syncIndicator}>
            <View style={styles.syncDot} />
            <Text style={styles.syncText}>
              Tracking data updates every 30 seconds. Current sync latency: 1.2ms
            </Text>
          </View>
        </View>
        <View style={styles.footerActions}>
          <TouchableOpacity style={styles.footerButton}>
            <Text style={styles.footerButtonText}>Filter Viewer</Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.footerButtonSecondary}>
            <Text style={styles.footerButtonSecondaryText}>Identify No-Shows</Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.footerButtonPrimary}>
            <Text style={styles.footerButtonPrimaryText}>View All Personnel</Text>
          </TouchableOpacity>
        </View>
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  screen: { 
    flex: 1, 
    backgroundColor: '#F9FAFB' 
  },
  content: { 
    padding: 24, 
    paddingBottom: 32,
    minHeight: '100%',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 32,
  },
  title: {
    fontSize: 28,
    fontWeight: '700',
    color: '#111827',
    marginBottom: 4,
  },
  subtitle: {
    fontSize: 14,
    color: '#6B7280',
  },
  headerActions: {
    flexDirection: 'row',
    gap: 12,
  },
  filterButton: {
    paddingHorizontal: 20,
    paddingVertical: 10,
    backgroundColor: '#F3F4F6',
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#E5E7EB',
  },
  filterButtonText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#374151',
  },
  exportButton: {
    paddingHorizontal: 20,
    paddingVertical: 10,
    backgroundColor: '#3B82F6',
    borderRadius: 8,
  },
  exportButtonText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#FFFFFF',
  },
  mainContent: {
    gap: 20,
  },
  mainContentTablet: {
    flexDirection: 'row',
  },
  leftPanel: {
    gap: 16,
  },
  leftPanelTablet: {
    width: '35%',
  },
  rightPanel: {
    flex: 1,
  },
  rightPanelTablet: {
    flex: 1,
    marginLeft: 20,
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  sectionTitle: {
    fontSize: 12,
    fontWeight: '700',
    color: '#6B7280',
    letterSpacing: 0.5,
  },
  activeBadge: {
    backgroundColor: '#DBEAFE',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 4,
  },
  activeBadgeText: {
    fontSize: 11,
    fontWeight: '700',
    color: '#3B82F6',
  },
  trackingCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: '#E5E7EB',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 2,
  },
  cardHeader: {
    marginBottom: 12,
  },
  cardTitleSection: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 4,
  },
  cardRole: {
    fontSize: 16,
    fontWeight: '700',
    color: '#111827',
  },
  statusText: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 4,
  },
  statusTextInner: {
    fontSize: 10,
    fontWeight: '700',
  },
  cardHospital: {
    fontSize: 13,
    color: '#6B7280',
  },
  cardBody: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  avatar: {
    width: 40,
    height: 40,
    borderRadius: 20,
    marginRight: 12,
  },
  personInfo: {
    flex: 1,
  },
  personName: {
    fontSize: 14,
    fontWeight: '600',
    color: '#111827',
    marginBottom: 2,
  },
  personId: {
    fontSize: 12,
    color: '#9CA3AF',
  },
  cardMetrics: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  metric: {
    flex: 1,
    alignItems: 'center',
  },
  metricValue: {
    fontSize: 18,
    fontWeight: '700',
    color: '#111827',
    marginBottom: 2,
  },
  metricLabel: {
    fontSize: 10,
    color: '#9CA3AF',
    fontWeight: '600',
  },
  metricDivider: {
    width: 1,
    height: 30,
    backgroundColor: '#E5E7EB',
  },
  actionButton: {
    backgroundColor: '#F3F4F6',
    paddingVertical: 10,
    borderRadius: 8,
    alignItems: 'center',
  },
  actionButtonText: {
    fontSize: 13,
    fontWeight: '600',
    color: '#374151',
  },
  mapContainer: {
    flex: 1,
    height: 500,
    borderRadius: 12,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: '#E5E7EB',
  },
  map: {
    flex: 1,
    width: '100%',
  },
  mapControls: {
    position: 'absolute',
    right: 16,
    top: 16,
    gap: 8,
  },
  mapControlButton: {
    width: 36,
    height: 36,
    backgroundColor: '#FFFFFF',
    borderRadius: 8,
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  mapControlText: {
    fontSize: 20,
    fontWeight: '600',
    color: '#374151',
  },
  mapLegend: {
    position: 'absolute',
    bottom: 16,
    left: 16,
    right: 16,
    backgroundColor: '#FFFFFF',
    borderRadius: 8,
    padding: 12,
    flexDirection: 'row',
    justifyContent: 'space-around',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  legendItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  legendDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
  },
  legendText: {
    fontSize: 11,
    color: '#6B7280',
    fontWeight: '600',
  },
  markerContainer: {
    alignItems: 'center',
  },
  markerBubble: {
    padding: 4,
    borderRadius: 20,
    borderWidth: 2,
    borderColor: '#FFFFFF',
  },
  markerAvatar: {
    width: 32,
    height: 32,
    borderRadius: 16,
  },
  markerPin: {
    width: 12,
    height: 12,
    borderRadius: 6,
    marginTop: -6,
    borderWidth: 2,
    borderColor: '#FFFFFF',
  },
  footer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: 24,
    paddingTop: 24,
    borderTopWidth: 1,
    borderTopColor: '#E5E7EB',
  },
  footerLeft: {
    flex: 1,
  },
  syncIndicator: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  syncDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: '#10B981',
  },
  syncText: {
    fontSize: 12,
    color: '#6B7280',
  },
  footerActions: {
    flexDirection: 'row',
    gap: 12,
  },
  footerButton: {
    paddingHorizontal: 16,
    paddingVertical: 10,
    backgroundColor: '#F3F4F6',
    borderRadius: 8,
  },
  footerButtonText: {
    fontSize: 13,
    fontWeight: '600',
    color: '#374151',
  },
  footerButtonSecondary: {
    paddingHorizontal: 16,
    paddingVertical: 10,
    backgroundColor: '#F3F4F6',
    borderRadius: 8,
  },
  footerButtonSecondaryText: {
    fontSize: 13,
    fontWeight: '600',
    color: '#374151',
  },
  footerButtonPrimary: {
    paddingHorizontal: 16,
    paddingVertical: 10,
    backgroundColor: '#DBEAFE',
    borderRadius: 8,
  },
  footerButtonPrimaryText: {
    fontSize: 13,
    fontWeight: '600',
    color: '#3B82F6',
  },
});
import React, { useState } from 'react';
import { View, Text, ScrollView, StyleSheet, Platform } from 'react-native';
import { RangeKm } from '../../types/duty';

// Metro resolves these to .web.tsx or .native.tsx automatically
import RangeDropdown from '../../component/cards/hospital/live-tracking/RangeDropdown';
const LiveMap = React.lazy(
    () => import('../../component/cards/hospital/live-tracking/LiveMap')
);

const LiveTracking: React.FC = () => {
    const [selectedRange, setSelectedRange] = useState<RangeKm>(5);

    return (
        <View style={styles.screen}>
            

            <ScrollView
                style={styles.scroll}
                contentContainerStyle={styles.scrollContent}
                showsVerticalScrollIndicator={false}
            >
                {/* ── Map area ───────────────────────────────────── */}
                <View style={styles.mapWrapper}>
                    {/* Range dropdown — overlaid top-right of map */}
                    <View style={styles.dropdownOverlay}>
                        <RangeDropdown
                            selectedRange={selectedRange}
                            onRangeChange={setSelectedRange}
                        />
                    </View>

                

                    <View style={styles.floatingBar}>
                        <View style={styles.floatingBarInner}>
                            <View style={styles.hospitalIconBox}>
                                <Text style={styles.hospitalEmoji}>🏥</Text>
                            </View>
                            
                            <View style={styles.liveBadge}>
                                <View style={styles.liveDot} />
                                <Text style={styles.liveText}>LIVE</Text>
                            </View>
                        </View>
                    </View>

                </View>

                {/* ── Legend ─────────────────────────────────────── */}
                <View style={styles.legend}>
                    <View style={styles.legendItem}>
                        <View style={[styles.legendDot, { backgroundColor: '#E53935' }]} />
                        <Text style={styles.legendLabel}>Hospital</Text>
                    </View>
                    <View style={styles.legendItem}>
                        <View style={[styles.legendDot, { backgroundColor: '#43A047' }]} />
                        <Text style={styles.legendLabel}>Available</Text>
                    </View>
                    
                </View>

            </ScrollView>
        </View>
    );
};

export default LiveTracking;

const styles = StyleSheet.create({
    screen: {
        flex: 1,
        backgroundColor: '#F5F7FA',
    },
    // Header
    header: {
        backgroundColor: '#1565C0',
        paddingTop: 52,
        paddingBottom: 16,
        paddingHorizontal: 16,
    },
    headerTitle: {
        fontSize: 20,
        fontWeight: '700',
        color: '#FFFFFF',
    },
    headerSub: {
        fontSize: 15,
        fontWeight: '600',
        color: '#BBDEFB',
        marginTop: 4,
    },
    headerAddress: {
        fontSize: 12,
        color: '#90CAF9',
        marginTop: 2,
    },
    // Scroll
    scroll: {
        flex: 1,
    },
    scrollContent: {
        paddingBottom: 40,
    },
    // Map
    mapWrapper: {
        height:  'calc(100vh - 100px)' as any,
        width: '100%',
        position: 'relative',
        overflow: 'hidden',
    },
    dropdownOverlay: {
        position: 'absolute',
        top: 12,
        right: 12,
        zIndex: 1000,
    },
    // Legend
    legend: {
        flexDirection: 'row',
        alignItems: 'center',
        flexWrap: 'wrap',
        gap: 12,
        paddingHorizontal: 16,
        paddingVertical: 10,
        backgroundColor: '#FFFFFF',
        borderBottomWidth: 1,
        borderBottomColor: '#E0E0E0',
    },
    legendItem: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 6,
    },
    legendDot: {
        width: 12,
        height: 12,
        borderRadius: 6,
    },
    legendLabel: {
        fontSize: 13,
        color: '#555',
    },
    countText: {
        marginLeft: 'auto' as any,
        fontSize: 12,
        fontWeight: '600',
        color: '#1565C0',
    },
    // Doctor list
    listSection: {
        paddingHorizontal: 16,
        paddingTop: 16,
    },
    listTitle: {
        fontSize: 17,
        fontWeight: '700',
        color: '#1A237E',
        marginBottom: 12,
    },
    emptyText: {
        textAlign: 'center',
        color: '#888',
        fontSize: 14,
        marginTop: 24,
        lineHeight: 22,
    },
    floatingBar: {
  position: 'absolute',
  bottom: 24,
  left: 16,
  right: 16,
  zIndex: 999,
  borderRadius: 16,
  overflow: 'hidden',
  shadowColor: '#1565C0',
  shadowOffset: { width: 0, height: 8 },
  shadowOpacity: 0.25,
  shadowRadius: 16,
  elevation: 12,
},
floatingBarInner: {
  flexDirection: 'row',
  alignItems: 'center',
  gap: 12,
  paddingVertical: 12,
  paddingHorizontal: 16,
  backgroundColor: 'rgba(21, 101, 192, 0.55)',
  borderWidth: 1,
  borderColor: 'rgba(255, 255, 255, 0.2)',
  borderRadius: 16,
  ...(Platform.OS === 'web' && {
    backdropFilter: 'blur(12px)',
    WebkitBackdropFilter: 'blur(12px)',
  } as any),
},
hospitalIconBox: {
  width: 40,
  height: 40,
  borderRadius: 12,
  backgroundColor: 'rgba(255,255,255,0.15)',
  alignItems: 'center',
  justifyContent: 'center',
  flexShrink: 0,
},
hospitalEmoji: { fontSize: 20 },
hospitalTextBox: { flex: 1 },
hospitalName: {
  fontSize: 13,
  fontWeight: '700',
  color: '#FFFFFF',
  letterSpacing: 0.2,
},
hospitalAddress: {
  fontSize: 11,
  color: 'rgba(255,255,255,0.75)',
  marginTop: 2,
  lineHeight: 15,
},
liveBadge: {
  flexDirection: 'row',
  alignItems: 'center',
  gap: 4,
  backgroundColor: 'rgba(255,255,255,0.15)',
  paddingHorizontal: 8,
  paddingVertical: 4,
  borderRadius: 20,
  borderWidth: 1,
  borderColor: 'rgba(255,255,255,0.25)',
},
liveDot: {
  width: 6,
  height: 6,
  borderRadius: 3,
  backgroundColor: '#69F0AE',
},
liveText: {
  fontSize: 10,
  fontWeight: '800',
  color: '#69F0AE',
  letterSpacing: 1,
},
});

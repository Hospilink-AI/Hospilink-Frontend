import React, { useState } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
} from 'react-native';
import { RangeKm } from '../../../../types/duty';

const RANGE_OPTIONS: RangeKm[] = [5, 10, 15, 20, 25 ,30, 35, 40, 45, 50 ,100];

interface Props {
  selectedRange: RangeKm;
  onRangeChange: (range: RangeKm) => void;
}

const RangeDropdown: React.FC<Props> = ({ selectedRange, onRangeChange }) => {
  const [open, setOpen] = useState(false);

  return (
    <View style={styles.wrapper}>
      <TouchableOpacity
        style={styles.trigger}
        onPress={() => setOpen((prev) => !prev)}
        activeOpacity={0.85}
      >
        <Text style={styles.triggerText}>📍 {selectedRange} km</Text>
        <Text style={styles.caret}>{open ? '▲' : '▼'}</Text>
      </TouchableOpacity>

      {open && (
        <View style={styles.menu}>
          {RANGE_OPTIONS.map((range) => (
            <TouchableOpacity
              key={range}
              style={[
                styles.menuItem,
                range === selectedRange && styles.menuItemActive,
              ]}
              onPress={() => {
                onRangeChange(range);
                setOpen(false);
              }}
            >
              <Text
                style={[
                  styles.menuItemText,
                  range === selectedRange && styles.menuItemTextActive,
                ]}
              >
                {range} km
              </Text>
            </TouchableOpacity>
          ))}
        </View>
      )}
    </View>
  );
};

export default RangeDropdown;

const styles = StyleSheet.create({
  wrapper: {
    position: 'relative',
    zIndex: 999,
    alignSelf: 'flex-start',
  },
  trigger: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: '#1565C0',
    paddingVertical: 8,
    paddingHorizontal: 14,
    borderRadius: 8,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.28,
    shadowRadius: 5,
    elevation: 5,
  },
  triggerText: {
    color: '#FFFFFF',
    fontWeight: '700',
    fontSize: 14,
  },
  caret: {
    color: '#FFFFFF',
    fontSize: 10,
  },
  menu: {
    position: 'absolute',
    top: 44,
    right: 0,
    backgroundColor: '#FFFFFF',
    borderRadius: 8,
    overflow: 'hidden',
    minWidth: 100,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.15,
    shadowRadius: 8,
    elevation: 8,
  },
  menuItem: {
    paddingVertical: 10,
    paddingHorizontal: 16,
  },
  menuItemActive: {
    backgroundColor: '#E3F2FD',
  },
  menuItemText: {
    fontSize: 14,
    color: '#333',
  },
  menuItemTextActive: {
    color: '#1565C0',
    fontWeight: '700',
  },
});

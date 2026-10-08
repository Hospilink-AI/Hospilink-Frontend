import { useEffect, useRef } from 'react';
import { AccessibilityInfo, Animated, Pressable, StyleSheet, View } from 'react-native';
import Icon from './Icon';
import Txt from './Txt';
import { color, depth, motion, radius } from './tokens';

export function Switch({
  value,
  onChange,
  disabled,
  label,
  busy,
}: {
  value: boolean;
  onChange: (v: boolean) => void;
  disabled?: boolean;
  label: string;
  busy?: boolean;
}) {
  const x = useRef(new Animated.Value(value ? 1 : 0)).current;
  useEffect(() => {
    let alive = true;
    AccessibilityInfo.isReduceMotionEnabled()
      .catch(() => false)
      .then((reduce) => {
        if (!alive) return;
        Animated.timing(x, { toValue: value ? 1 : 0, duration: reduce ? 0 : motion.base, useNativeDriver: false }).start();
      });
    return () => {
      alive = false;
    };
  }, [value, x]);

  const off = disabled || busy;
  return (
    <Pressable
      onPress={() => !off && onChange(!value)}
      accessibilityRole="switch"
      accessibilityLabel={label}
      accessibilityState={{ checked: value, disabled: !!off, busy: !!busy }}
      hitSlop={8}
      style={(state: any) => [state.focused && depth.focus, { borderRadius: 18 }]}
    >
      <Animated.View
        style={[
          styles.track,
          {
            backgroundColor: x.interpolate({ inputRange: [0, 1], outputRange: [color.wellStrong, color.primary] }),
            opacity: disabled ? 0.5 : 1,
          },
        ]}
      >
        <Animated.View
          style={[
            styles.thumb,
            depth.raisedSm,
            { transform: [{ translateX: x.interpolate({ inputRange: [0, 1], outputRange: [3, 25] }) }] },
          ]}
        />
      </Animated.View>
    </Pressable>
  );
}

export function Checkbox({ checked, onChange, label, children }: { checked: boolean; onChange: (v: boolean) => void; label: string; children?: React.ReactNode }) {
  return (
    <Pressable
      onPress={() => onChange(!checked)}
      accessibilityRole="checkbox"
      accessibilityState={{ checked }}
      accessibilityLabel={label}
      style={styles.checkRow}
    >
      <View style={[styles.box, checked ? styles.boxOn : depth.pressed]}>
        {checked ? <Icon name="check" size={16} color={color.onDark} strokeWidth={2.5} /> : null}
      </View>
      <View style={{ flex: 1 }}>{children ?? <Txt v="bodySm">{label}</Txt>}</View>
    </Pressable>
  );
}

export function Radio({ selected, onPress, label, sub }: { selected: boolean; onPress: () => void; label: string; sub?: string }) {
  return (
    <Pressable
      onPress={onPress}
      accessibilityRole="radio"
      accessibilityState={{ selected }}
      accessibilityLabel={label}
      style={(state: any) => [styles.radioRow, selected && styles.radioRowOn, state.focused && depth.focus]}
    >
      <View style={[styles.radio, selected && styles.radioOn]}>{selected ? <View style={styles.radioDot} /> : null}</View>
      <View style={{ flex: 1 }}>
        <Txt v="title">{label}</Txt>
        {sub ? <Txt v="bodySm" tone="muted">{sub}</Txt> : null}
      </View>
    </Pressable>
  );
}

export function Stepper({ value, onChange, min = 0, max = 99, label }: { value: number; onChange: (v: number) => void; min?: number; max?: number; label: string }) {
  return (
    <View style={styles.stepper} accessibilityLabel={`${label}: ${value}`}>
      <Pressable accessibilityRole="button" accessibilityLabel={`Less ${label}`} onPress={() => onChange(Math.max(min, value - 1))} style={styles.stepBtn}>
        <Icon name="minus" size={18} />
      </Pressable>
      <Txt v="figure" style={{ minWidth: 28, textAlign: 'center' }}>
        {value}
      </Txt>
      <Pressable accessibilityRole="button" accessibilityLabel={`More ${label}`} onPress={() => onChange(Math.min(max, value + 1))} style={styles.stepBtn}>
        <Icon name="plus" size={18} />
      </Pressable>
    </View>
  );
}

export function ProgressBar({ value, tone = 'primary' }: { value: number; tone?: 'primary' | 'success' }) {
  return (
    <View style={styles.bar} accessibilityRole="progressbar" accessibilityValue={{ min: 0, max: 100, now: Math.round(value * 100) }}>
      <View style={[styles.barFill, { width: `${Math.max(0, Math.min(1, value)) * 100}%`, backgroundColor: tone === 'success' ? color.success : color.primary }]} />
    </View>
  );
}

const styles = StyleSheet.create({
  track: { width: 52, height: 30, borderRadius: 15, justifyContent: 'center' },
  thumb: { width: 24, height: 24, borderRadius: 12, backgroundColor: color.surface },
  checkRow: { flexDirection: 'row', alignItems: 'flex-start', gap: 12, minHeight: 44, paddingVertical: 4 },
  box: { width: 24, height: 24, borderRadius: 7, backgroundColor: color.ground, alignItems: 'center', justifyContent: 'center', marginTop: 1 },
  boxOn: { backgroundColor: color.primary },
  radioRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    padding: 14,
    borderRadius: radius.input,
    borderWidth: 1.5,
    borderColor: color.line,
    backgroundColor: color.surface,
    minHeight: 56,
  },
  radioRowOn: { borderColor: color.primary, backgroundColor: color.well },
  radio: { width: 22, height: 22, borderRadius: 11, borderWidth: 2, borderColor: color.lineStrong, alignItems: 'center', justifyContent: 'center' },
  radioOn: { borderColor: color.primary },
  radioDot: { width: 10, height: 10, borderRadius: 5, backgroundColor: color.primary },
  stepper: { flexDirection: 'row', alignItems: 'center', gap: 6, backgroundColor: color.ground, borderRadius: radius.pill, padding: 4 },
  stepBtn: { width: 40, height: 40, borderRadius: 20, backgroundColor: color.surface, alignItems: 'center', justifyContent: 'center' },
  bar: { height: 8, borderRadius: 4, backgroundColor: color.well, overflow: 'hidden' },
  barFill: { height: 8, borderRadius: 4 },
});

import { useEffect, useRef, useState } from 'react';
import { AccessibilityInfo, Animated, Platform, Pressable, StyleSheet, View } from 'react-native';
import Icon, { IconName } from './Icon';
import Txt from './Txt';
import { color, depth, motion, radius } from './tokens';

type Tone = 'default' | 'success' | 'error' | 'warning';
type Snack = { id: number; message: string; tone: Tone; action?: { label: string; onPress: () => void } };

let listener: ((s: Snack) => void) | null = null;
let seq = 0;

/** Transient feedback at the bottom of the doctor app. */
export function snack(message: string, opts: { tone?: Tone; action?: Snack['action'] } = {}) {
  listener?.({ id: ++seq, message, tone: opts.tone ?? 'default', action: opts.action });
}

const ICON: Record<Tone, IconName> = { default: 'info', success: 'checkCircle', error: 'warning', warning: 'warning' };
const ICON_COLOR: Record<Tone, string> = { default: '#B7C4DE', success: '#7FD3A6', error: '#F2A09E', warning: '#FAB340' };

export function SnackbarHost({ bottom = 16 }: { bottom?: number }) {
  const [current, setCurrent] = useState<Snack | null>(null);
  const y = useRef(new Animated.Value(0)).current;
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    listener = (s) => {
      if (timer.current) clearTimeout(timer.current);
      setCurrent(s);
      AccessibilityInfo.announceForAccessibility?.(s.message);
      y.setValue(0);
      Animated.timing(y, { toValue: 1, duration: motion.base, useNativeDriver: Platform.OS !== 'web' }).start();
      timer.current = setTimeout(() => setCurrent(null), s.action ? 6000 : 4000);
    };
    return () => {
      listener = null;
      if (timer.current) clearTimeout(timer.current);
    };
  }, [y]);

  if (!current) return null;
  return (
    <View pointerEvents="box-none" style={[styles.wrap, { bottom }]}>
      <Animated.View
        accessibilityLiveRegion="polite"
        style={[
          styles.snack,
          depth.floating,
          { opacity: y, transform: [{ translateY: y.interpolate({ inputRange: [0, 1], outputRange: [16, 0] }) }] },
        ]}
      >
        <Icon name={ICON[current.tone]} size={20} color={ICON_COLOR[current.tone]} />
        <Txt v="bodySm" tone="onDark" style={{ flex: 1 }}>
          {current.message}
        </Txt>
        {current.action ? (
          <Pressable
            accessibilityRole="button"
            onPress={() => {
              current.action?.onPress();
              setCurrent(null);
            }}
            hitSlop={10}
          >
            <Txt v="label" color="#82A5EA">
              {current.action.label}
            </Txt>
          </Pressable>
        ) : (
          <Pressable accessibilityRole="button" accessibilityLabel="Dismiss" onPress={() => setCurrent(null)} hitSlop={12}>
            <Icon name="close" size={18} color="#B7C4DE" />
          </Pressable>
        )}
      </Animated.View>
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: { position: 'absolute', left: 16, right: 16, alignItems: 'center', zIndex: 50 },
  snack: {
    width: '100%',
    maxWidth: 560,
    minHeight: 52,
    borderRadius: radius.input,
    backgroundColor: color.ink,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    paddingHorizontal: 16,
    paddingVertical: 12,
  },
});

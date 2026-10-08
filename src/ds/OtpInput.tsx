import { useRef, useState } from 'react';
import { Pressable, StyleSheet, TextInput, View } from 'react-native';
import Txt from './Txt';
import { color, depth, font, radius, type } from './tokens';

type Props = {
  value: string;
  onChange: (v: string) => void;
  length?: number;
  state?: 'idle' | 'error' | 'success';
  autoFocus?: boolean;
  disabled?: boolean;
  label?: string;
  onComplete?: (v: string) => void;
};

/**
 * Six tabular boxes over one real input, so paste and SMS autofill fill every box at once.
 */
export default function OtpInput({ value, onChange, length = 6, state = 'idle', autoFocus, disabled, label = 'One-time code', onComplete }: Props) {
  const ref = useRef<TextInput>(null);
  const [focused, setFocused] = useState(false);
  const digits = value.split('').slice(0, length);
  const active = Math.min(digits.length, length - 1);

  const tone = state === 'error' ? color.danger : state === 'success' ? color.success : null;

  return (
    <Pressable
      onPress={() => ref.current?.focus()}
      accessible={false}
      style={styles.row}
    >
      {Array.from({ length }).map((_, i) => {
        const filled = i < digits.length;
        const isActive = focused && i === active && state === 'idle';
        return (
          <View
            key={i}
            style={[
              styles.box,
              filled || isActive ? styles.boxFilled : depth.pressed,
              isActive && styles.boxActive,
              tone && { borderColor: tone, backgroundColor: color.surface },
            ]}
          >
            <Txt style={[type.otp, { color: tone ?? color.ink }]}>{digits[i] ?? ''}</Txt>
            {isActive && !filled ? <View style={styles.caret} /> : null}
          </View>
        );
      })}
      <TextInput
        ref={ref}
        value={value}
        onChangeText={(t) => {
          const clean = t.replace(/\D/g, '').slice(0, length);
          onChange(clean);
          if (clean.length === length) onComplete?.(clean);
        }}
        keyboardType="number-pad"
        textContentType="oneTimeCode"
        autoComplete="sms-otp"
        maxLength={length}
        autoFocus={autoFocus}
        editable={!disabled}
        onFocus={() => setFocused(true)}
        onBlur={() => setFocused(false)}
        accessibilityLabel={label}
        caretHidden
        style={styles.hidden}
      />
    </Pressable>
  );
}

const styles = StyleSheet.create({
  row: { flexDirection: 'row', gap: 8, justifyContent: 'center', position: 'relative' },
  box: {
    width: 46,
    height: 56,
    borderRadius: radius.otp,
    backgroundColor: color.ground,
    borderWidth: 1.5,
    borderColor: 'transparent',
    alignItems: 'center',
    justifyContent: 'center',
  },
  boxFilled: { backgroundColor: color.surface, borderColor: color.line },
  boxActive: { borderColor: color.primary },
  caret: { position: 'absolute', width: 2, height: 24, borderRadius: 1, backgroundColor: color.primary },
  hidden: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    opacity: 0.011,
    color: 'transparent',
    fontFamily: font.medium,
  },
});

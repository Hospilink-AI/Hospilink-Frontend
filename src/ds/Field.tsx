import { forwardRef, ReactNode, useState } from 'react';
import { Pressable, StyleProp, StyleSheet, TextInput, TextInputProps, View, ViewStyle } from 'react-native';
import Icon, { IconName } from './Icon';
import Txt from './Txt';
import { color, depth, font, radius } from './tokens';

type Props = Omit<TextInputProps, 'style'> & {
  label?: string;
  icon?: IconName;
  error?: string | null;
  success?: boolean;
  hint?: string;
  disabled?: boolean;
  secure?: boolean;
  clearable?: boolean;
  right?: ReactNode;
  style?: StyleProp<ViewStyle>;
  inputStyle?: TextInputProps['style'];
  optional?: boolean;
  prefix?: string;
};

const Field = forwardRef<TextInput, Props>(function Field(
  { label, icon, error, success, hint, disabled, secure, clearable, right, style, inputStyle, optional, prefix, value, onChangeText, multiline, ...rest },
  ref
) {
  const [focused, setFocused] = useState(false);
  const [hidden, setHidden] = useState(true);
  const tone = error ? color.danger : success ? color.success : focused ? color.primary : null;

  return (
    <View style={[styles.wrap, style]}>
      {label ? (
        <Txt v="label" tone="soft" style={styles.label}>
          {label}
          {optional ? <Txt v="caption" tone="muted">  Optional</Txt> : null}
        </Txt>
      ) : null}
      <View
        style={[
          styles.box,
          multiline && styles.boxMulti,
          tone ? { borderColor: tone, backgroundColor: color.surface } : null,
          !tone && !disabled ? depth.pressed : null,
          disabled && styles.boxDisabled,
        ]}
      >
        {icon ? <Icon name={icon} size={20} color={tone ?? color.inkMuted} /> : null}
        {prefix ? (
          <Txt v="body" tone="soft" style={styles.prefix}>
            {prefix}
          </Txt>
        ) : null}
        <TextInput
          {...rest}
          ref={ref}
          value={value}
          onChangeText={onChangeText}
          editable={!disabled}
          secureTextEntry={secure && hidden}
          placeholderTextColor={color.inkMuted}
          onFocus={(e) => {
            setFocused(true);
            rest.onFocus?.(e);
          }}
          onBlur={(e) => {
            setFocused(false);
            rest.onBlur?.(e);
          }}
          multiline={multiline}
          accessibilityLabel={rest.accessibilityLabel ?? label}
          style={[styles.input, multiline && styles.inputMulti, disabled && { color: color.disabledInk }, inputStyle]}
        />
        {error ? <Icon name="warning" size={18} color={color.danger} /> : null}
        {success && !error ? <Icon name="checkCircle" size={18} color={color.success} /> : null}
        {clearable && value ? (
          <Pressable accessibilityRole="button" accessibilityLabel="Clear" hitSlop={12} onPress={() => onChangeText?.('')}>
            <Icon name="close" size={18} color={color.inkMuted} />
          </Pressable>
        ) : null}
        {secure ? (
          <Pressable
            accessibilityRole="button"
            accessibilityLabel={hidden ? 'Show password' : 'Hide password'}
            hitSlop={12}
            onPress={() => setHidden((h) => !h)}
          >
            <Icon name={hidden ? 'eye' : 'eyeOff'} size={20} color={color.inkMuted} />
          </Pressable>
        ) : null}
        {right}
      </View>
      {error ? (
        <Txt v="caption" tone="danger" style={styles.help} accessibilityLiveRegion="polite">
          {error}
        </Txt>
      ) : hint ? (
        <Txt v="caption" tone="muted" style={styles.help}>
          {hint}
        </Txt>
      ) : null}
    </View>
  );
});

export default Field;

const styles = StyleSheet.create({
  wrap: { gap: 6 },
  label: { marginLeft: 4 },
  box: {
    minHeight: 52,
    borderRadius: radius.input,
    backgroundColor: color.ground,
    borderWidth: 1.5,
    borderColor: 'transparent',
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    gap: 10,
  },
  boxMulti: { alignItems: 'flex-start', paddingVertical: 12 },
  boxDisabled: { backgroundColor: color.disabledBg },
  input: {
    flex: 1,
    minWidth: 0,
    minHeight: 48,
    fontFamily: font.medium,
    fontSize: 16,
    color: color.ink,
    paddingVertical: 0,
    // web: no browser focus outline inside the field box
    ...({ outlineStyle: 'none' } as object),
  },
  inputMulti: { minHeight: 96, textAlignVertical: 'top', paddingTop: 2 },
  help: { marginLeft: 4 },
  prefix: { fontVariant: ['tabular-nums'], paddingRight: 8, borderRightWidth: 1, borderRightColor: color.line },
});

import { ReactNode, useEffect, useRef, useState } from 'react';
import {
  AccessibilityInfo,
  Animated,
  KeyboardAvoidingView,
  Modal,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  useWindowDimensions,
  View,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import Button, { ButtonVariant, IconButton } from './Button';
import Icon, { IconName } from './Icon';
import Txt from './Txt';
import { color, depth, layout, motion, radius, space } from './tokens';

function useReduceMotion() {
  const [reduce, setReduce] = useState(false);
  useEffect(() => {
    AccessibilityInfo.isReduceMotionEnabled().then(setReduce).catch(() => {});
  }, []);
  return reduce;
}

/** Bottom sheet on phones, centred panel on wide screens. */
export function Sheet({
  visible,
  onClose,
  title,
  subtitle,
  children,
  footer,
  scroll = true,
}: {
  visible: boolean;
  onClose: () => void;
  title?: string;
  subtitle?: string;
  children: ReactNode;
  footer?: ReactNode;
  scroll?: boolean;
}) {
  const { width, height } = useWindowDimensions();
  const insets = useSafeAreaInsets();
  const wide = width >= layout.wideBreakpoint;
  const reduce = useReduceMotion();
  const y = useRef(new Animated.Value(1)).current;

  useEffect(() => {
    if (visible) {
      y.setValue(1);
      Animated.timing(y, { toValue: 0, duration: reduce ? 0 : motion.slow, useNativeDriver: Platform.OS !== 'web' }).start();
    }
  }, [visible, reduce, y]);

  const Body = scroll ? ScrollView : View;

  return (
    <Modal visible={visible} transparent animationType="fade" onRequestClose={onClose} statusBarTranslucent>
      <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : undefined} style={[styles.backdrop, wide && styles.backdropWide]}>
        <Pressable style={StyleSheet.absoluteFill} onPress={onClose} accessibilityLabel="Close" accessibilityRole="button" />
        <Animated.View
          accessibilityViewIsModal
          style={[
            styles.sheet,
            depth.floating,
            wide ? styles.sheetWide : { paddingBottom: Math.max(insets.bottom, 12) },
            { maxHeight: height * (wide ? 0.85 : 0.92) },
            !wide && { transform: [{ translateY: y.interpolate({ inputRange: [0, 1], outputRange: [0, 400] }) }] },
          ]}
        >
          {!wide ? <View style={styles.handle} /> : null}
          {title ? (
            <View style={styles.sheetHead}>
              <View style={{ flex: 1 }}>
                <Txt v="h2" accessibilityRole="header">{title}</Txt>
                {subtitle ? <Txt v="bodySm" tone="muted" style={{ marginTop: 4 }}>{subtitle}</Txt> : null}
              </View>
              <IconButton icon="close" label="Close" onPress={onClose} tone="well" size={40} />
            </View>
          ) : null}
          <Body
            style={scroll ? { flexGrow: 0 } : undefined}
            contentContainerStyle={scroll ? styles.sheetBody : undefined}
            keyboardShouldPersistTaps="handled"
          >
            {scroll ? children : <View style={styles.sheetBody}>{children}</View>}
          </Body>
          {footer ? <View style={styles.sheetFoot}>{footer}</View> : null}
        </Animated.View>
      </KeyboardAvoidingView>
    </Modal>
  );
}

export type DialogAction = { label: string; onPress: () => void; variant?: ButtonVariant; loading?: boolean; disabled?: boolean };

/** Interrupting decision. Use for destructive or irreversible choices only. */
export function Dialog({
  visible,
  onClose,
  icon,
  tone = 'primary',
  title,
  body,
  children,
  actions,
}: {
  visible: boolean;
  onClose: () => void;
  icon?: IconName;
  tone?: 'primary' | 'danger' | 'success' | 'warning';
  title: string;
  body?: string;
  children?: ReactNode;
  actions: DialogAction[];
}) {
  const tileBg = { primary: color.well, danger: color.dangerSoft, success: color.successSoft, warning: color.warningSoft }[tone];
  const tileFg = { primary: color.primary, danger: color.danger, success: color.success, warning: color.warningInk }[tone];
  return (
    <Modal visible={visible} transparent animationType="fade" onRequestClose={onClose} statusBarTranslucent>
      <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : undefined} style={styles.dialogBackdrop}>
        <Pressable style={StyleSheet.absoluteFill} onPress={onClose} accessibilityLabel="Close" accessibilityRole="button" />
        <View style={[styles.dialog, depth.floating]} accessibilityViewIsModal accessibilityRole="alert">
          {icon ? (
            <View style={[styles.dialogIcon, { backgroundColor: tileBg }]}>
              <Icon name={icon} size={26} color={tileFg} />
            </View>
          ) : null}
          <Txt v="h2" align="center">{title}</Txt>
          {body ? (
            <Txt v="body" tone="soft" align="center" style={{ marginTop: 8 }}>
              {body}
            </Txt>
          ) : null}
          {children ? <View style={{ marginTop: 16, alignSelf: 'stretch' }}>{children}</View> : null}
          <View style={styles.dialogActions}>
            {actions.map((a) => (
              <Button key={a.label} {...a} full variant={a.variant ?? 'primary'} />
            ))}
          </View>
        </View>
      </KeyboardAvoidingView>
    </Modal>
  );
}

const styles = StyleSheet.create({
  backdrop: { flex: 1, justifyContent: 'flex-end', backgroundColor: color.scrim },
  backdropWide: { justifyContent: 'center', alignItems: 'center', padding: 24 },
  sheet: {
    backgroundColor: color.surface,
    borderTopLeftRadius: radius.sheet,
    borderTopRightRadius: radius.sheet,
    paddingTop: 8,
    width: '100%',
  },
  sheetWide: { borderRadius: radius.sheet, maxWidth: 560, paddingBottom: 16 },
  handle: { width: 40, height: 5, borderRadius: 3, backgroundColor: color.lineStrong, alignSelf: 'center', marginBottom: 8 },
  sheetHead: { flexDirection: 'row', alignItems: 'flex-start', gap: 12, paddingHorizontal: space.screen, paddingTop: 8, paddingBottom: 4 },
  sheetBody: { paddingHorizontal: space.screen, paddingTop: 12, paddingBottom: 16, gap: 12 },
  sheetFoot: { paddingHorizontal: space.screen, paddingTop: 12, borderTopWidth: 1, borderTopColor: color.line, gap: 8 },
  dialogBackdrop: { flex: 1, backgroundColor: color.scrim, alignItems: 'center', justifyContent: 'center', padding: 24 },
  dialog: {
    width: '100%',
    maxWidth: 420,
    backgroundColor: color.surface,
    borderRadius: radius.sheet,
    padding: 24,
    alignItems: 'center',
  },
  dialogIcon: { width: 56, height: 56, borderRadius: 18, alignItems: 'center', justifyContent: 'center', marginBottom: 16 },
  dialogActions: { alignSelf: 'stretch', gap: 10, marginTop: 24 },
});

import { Theme, useTheme } from "@/ds/theme";
import { TIcon, useThemedStyles } from "@/ds/themed";
import { StyleSheet, Text, View } from "react-native";

interface Props {
  message: string;
}

export default function Toast({ message }: Props) {
  const styles = use_styles();
  const th = useTheme();
  return (
    <View style={styles.toast}>
      <TIcon ion="checkmark-circle" size={18} color={th.hex("#fff")} />
      <Text style={styles.text}>{message}</Text>
    </View>
  );
}

const use_styles = () => useThemedStyles(make_styles as any) as any;
const make_styles = (t: Theme) => ({
  toast: {
    position: "absolute",
    top: 16,
    right: 16,
    backgroundColor: t.hex("#10B981"),
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: 10,
    paddingHorizontal: 16,
    borderRadius: 10,
    gap: 8,
    shadowColor: t.hex("#000"),
    shadowOpacity: 0.2,
    shadowRadius: 8,
    elevation: 6,
    zIndex: 999,
  },
  text: {
    color: t.hex("#fff"),
    ...t.f("600"),
    fontSize: 14,
  },
} as const);
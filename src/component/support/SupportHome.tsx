import { COLORS } from "@/constant/colors";
import { chatbotAPI } from "@/service/api";
import { Ionicons } from "@expo/vector-icons";
import { useFocusEffect, useRouter } from "expo-router";
import React, { useCallback, useState } from "react";
import { ScrollView, StyleSheet, Text, TouchableOpacity, useWindowDimensions, View } from "react-native";

type Entry = { icon: string; title: string; text: string; action: string; route: string; primary?: boolean };

// base: "/medicalStaff/support" or "/hospital/support"
export default function SupportHome({ base }: { base: string }) {
  const router = useRouter();
  const { width } = useWindowDimensions();
  const isMobile = width < 768;
  const [hasChat, setHasChat] = useState(false);

  useFocusEffect(
    useCallback(() => {
      chatbotAPI
        .getActive()
        .then((res: any) => setHasChat(!!res?.conversation))
        .catch(() => setHasChat(false));
    }, [])
  );

  const entries: Entry[] = [
    {
      icon: "chatbubbles-outline",
      title: "Chat with Support",
      text: "Tell us what happened in your own words. We'll raise a ticket and help you attach any proof.",
      action: hasChat ? "Continue Chat" : "Start Chat",
      route: `${base}/chat`,
      primary: true,
    },
    {
      icon: "create-outline",
      title: "Raise a Ticket",
      text: "Prefer a form? Pick a topic, describe the issue and attach files.",
      action: "Open Form",
      route: `${base}/new`,
    },
    {
      icon: "file-tray-full-outline",
      title: "My Tickets",
      text: "Follow up on tickets you've raised, and reply to any complaint raised about you.",
      action: "View Tickets",
      route: `${base}/tickets`,
    },
    {
      icon: "megaphone-outline",
      title: "Share Feedback",
      text: "Tell us what's working and what could be better.",
      action: "Give Feedback",
      route: `${base}/feedback`,
    },
    {
      icon: "shield-checkmark-outline",
      title: "Account Standing",
      text: "See any flags on your account and reply to them.",
      action: "View Standing",
      route: `${base}/standing`,
    },
  ];

  return (
    <ScrollView style={styles.container} contentContainerStyle={[styles.content, isMobile && { padding: 16 }]}>
      <Text style={styles.title}>Support</Text>
      <Text style={styles.subtitle}>How can we help you today?</Text>

      <View style={[styles.grid, isMobile && { flexDirection: "column" }]}>
        {entries.map((e) => (
          <TouchableOpacity
            key={e.title}
            style={[styles.card, isMobile && styles.cardMobile, e.primary && styles.cardPrimary]}
            activeOpacity={0.85}
            onPress={() => router.push(e.route as any)}
          >
            <View style={[styles.icon, e.primary && { backgroundColor: "rgba(255,255,255,0.18)" }]}>
              <Ionicons name={e.icon as any} size={22} color={e.primary ? "#fff" : COLORS.primary} />
            </View>
            <Text style={[styles.cardTitle, e.primary && { color: "#fff" }]}>{e.title}</Text>
            <Text style={[styles.cardText, e.primary && { color: "#DBEAFE" }]}>{e.text}</Text>
            <View style={styles.actionRow}>
              <Text style={[styles.action, e.primary && { color: "#fff" }]}>{e.action}</Text>
              <Ionicons name="arrow-forward" size={14} color={e.primary ? "#fff" : COLORS.primary} />
            </View>
          </TouchableOpacity>
        ))}
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: COLORS.background },
  content: { padding: 24, paddingBottom: 48 },
  title: { fontSize: 22, fontWeight: "800", color: COLORS.text },
  subtitle: { fontSize: 13, color: COLORS.subText, marginTop: 2 },
  grid: { flexDirection: "row", flexWrap: "wrap", gap: 16, marginTop: 20 },
  card: {
    flexGrow: 1,
    flexBasis: 280,
    backgroundColor: COLORS.white,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: COLORS.border,
    padding: 20,
    gap: 8,
  },
  cardMobile: { flexBasis: "auto", flexGrow: 0 },
  cardPrimary: { backgroundColor: COLORS.primary, borderColor: COLORS.primary },
  icon: {
    width: 42,
    height: 42,
    borderRadius: 12,
    backgroundColor: "#EFF6FF",
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 4,
  },
  cardTitle: { fontSize: 16, fontWeight: "700", color: COLORS.text },
  cardText: { fontSize: 13, color: COLORS.subText, lineHeight: 19 },
  actionRow: { flexDirection: "row", alignItems: "center", gap: 6, marginTop: 6 },
  action: { fontSize: 13, fontWeight: "700", color: COLORS.primary },
});

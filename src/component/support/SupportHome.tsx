import Button from "@/ds/Button";
import { IconName } from "@/ds/Icon";
import { ListRow, Screen } from "@/ds/Layout";
import { Card, IconTile } from "@/ds/Surface";
import Txt from "@/ds/Txt";
import { color } from "@/ds/tokens";
import { TIcon, useThemedStyles } from "@/ds/themed";
import { Theme, useTheme } from "@/ds/theme";
import GrievanceOfficerCard from "@/component/support/GrievanceOfficerCard";
import { COLORS } from "@/constant/colors";
import { chatbotAPI } from "@/service/api";
import { useFocusEffect, useRouter } from "expo-router";
import React, { useCallback, useState } from "react";
import { ScrollView, StyleSheet, Text, TouchableOpacity, useWindowDimensions, View } from "react-native";

type Entry = { icon: string; title: string; text: string; action: string; route: string; primary?: boolean };

// base: "/medicalStaff/support" or "/hospital/support"
export default function SupportHome({ base }: { base: string }) {
  const th = useTheme();
  const styles = useStylesThemed();
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

  if (th.v2) {
    const [chat, ...rest] = entries;
    const icons: Record<string, IconName> = { [`${base}/new`]: "edit", [`${base}/tickets`]: "ticket", [`${base}/feedback`]: "heart", [`${base}/standing`]: "security" };
    return (
      <Screen>
        <Txt v="body" tone="soft">
          How can we help you today?
        </Txt>
        <Card tone="dark" pad={20}>
          <View style={{ gap: 12 }}>
            <IconTile name="chat" tone="primary" size={44} />
            <View style={{ gap: 4 }}>
              <Txt v="h3" color={color.onDark}>
                {chat.title}
              </Txt>
              <Txt v="bodySm" color={color.onDarkMuted}>
                {chat.text} Chat in English, Hindi or Marathi.
              </Txt>
            </View>
            <Button label={chat.action} iconRight="forward" onPress={() => router.push(chat.route as any)} full />
          </View>
        </Card>
        <Card pad={4}>
          {rest.map((e) => (
            <ListRow key={e.route} icon={icons[e.route]} title={e.title} subtitle={e.text} onPress={() => router.push(e.route as any)} />
          ))}
        </Card>
        <GrievanceOfficerCard />
      </Screen>
    );
  }

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
              <TIcon ion={e.icon as any} size={22} color={e.primary ? "#fff" : th.c.primary} />
            </View>
            <Text style={[styles.cardTitle, e.primary && { color: th.hex("#fff") }]}>{e.title}</Text>
            <Text style={[styles.cardText, e.primary && { color: th.hex("#DBEAFE") }]}>{e.text}</Text>
            <View style={styles.actionRow}>
              <Text style={[styles.action, e.primary && { color: th.hex("#fff") }]}>{e.action}</Text>
              <TIcon ion="arrow-forward" size={14} color={e.primary ? "#fff" : th.c.primary} />
            </View>
          </TouchableOpacity>
        ))}
      </View>
      <GrievanceOfficerCard />
    </ScrollView>
  );
}

const make_styles = (t: Theme) => ({
  container: { flex: 1, backgroundColor: t.c.background },
  content: { padding: 24, paddingBottom: 48 },
  title: { fontSize: 22, ...t.f("800"), color: t.c.text },
  subtitle: { ...t.f(), fontSize: 13, color: t.c.subText, marginTop: 2 },
  grid: { flexDirection: "row", flexWrap: "wrap", gap: 16, marginTop: 20 },
  card: {
    flexGrow: 1,
    flexBasis: 280,
    backgroundColor: t.c.surface,
    borderRadius: t.v2 ? 18 : 14,
    borderWidth: 1,
    borderColor: t.c.border,
    padding: 20,
    gap: 8,
  },
  cardMobile: { flexBasis: "auto", flexGrow: 0 },
  cardPrimary: { backgroundColor: t.c.primary, borderColor: t.c.primary },
  icon: {
    width: 42,
    height: 42,
    borderRadius: t.v2 ? 16 : 12,
    backgroundColor: t.hex("#EFF6FF"),
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 4,
  },
  cardTitle: { fontSize: 16, ...t.f("700"), color: t.c.text },
  cardText: { ...t.f(), fontSize: 13, color: t.c.subText, lineHeight: 19 },
  actionRow: { flexDirection: "row", alignItems: "center", gap: 6, marginTop: 6 },
  action: { fontSize: 13, ...t.f("700"), color: t.c.primary },
} as const);
const useStylesThemed = () => useThemedStyles(make_styles as any) as any;

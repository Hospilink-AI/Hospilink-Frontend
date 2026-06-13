import { Ionicons } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import React from "react";
import {
  Platform,
  SafeAreaView,
  ScrollView,
  StatusBar,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";

export default function WelcomeChoiceScreen() {
  const router = useRouter();

  const choose = (accountType: "medical" | "hospital") => {
    router.push({
      pathname: "/auth/sign-up",
      params: { accountType },
    });
  };

  return (
    <SafeAreaView style={styles.screen}>
      <StatusBar barStyle="dark-content" backgroundColor="#fff" />

      <ScrollView
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        <Text style={styles.title}>Welcome</Text>
        <Text style={styles.subtitle}>How will you be using Hospilink</Text>

        {/* Medical Staff */}
        <TouchableOpacity
          style={styles.card}
          activeOpacity={0.85}
          onPress={() => choose("medical")}
        >
          {/* Replace this placeholder with your illustration:
              <Image source={require("../../../assets/Images/medical-staff.png")}
                     style={styles.cardImage} resizeMode="contain" /> */}
          <View style={[styles.illustration, { backgroundColor: "#eff6ff" }]}>
            <Ionicons name="people" size={48} color="#2563EB" />
          </View>

          <Text style={styles.cardTitle}>Medical Staff</Text>
          <Text style={styles.cardDesc}>
            Browse nearby duties, receive instant shift alerts, and build your
            professional profile.
          </Text>
        </TouchableOpacity>

        {/* Hospital */}
        <TouchableOpacity
          style={styles.card}
          activeOpacity={0.85}
          onPress={() => choose("hospital")}
        >
          {/* Replace this placeholder with your illustration:
              <Image source={require("../../../assets/Images/hospital.png")}
                     style={styles.cardImage} resizeMode="contain" /> */}
          <View style={[styles.illustration, { backgroundColor: "#f0f9ff" }]}>
            <Ionicons name="business" size={48} color="#2563EB" />
          </View>

          <Text style={styles.cardTitle}>Hospital</Text>
          <Text style={styles.cardDesc}>
            Find qualified healthcare professionals, manage duty requests, and
            optimize staffing operations.
          </Text>
        </TouchableOpacity>

        <View style={{ flex: 1 }} />

        <Text style={styles.footerCopy}>
          © 2026 Hospilink Medical Systems. All rights reserved.
        </Text>
      </ScrollView>
    </SafeAreaView>
  );
}

const BLUE = "#2563EB";

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: "#fff" },
  scrollContent: {
    flexGrow: 1,
    paddingHorizontal: 24,
    paddingTop: 48,
    paddingBottom: 24,
  },
  title: {
    fontSize: 34,
    fontWeight: "800",
    color: "#1F2937",
    textAlign: "center",
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 16,
    color: "#64748b",
    textAlign: "center",
    marginBottom: 36,
  },
  card: {
    backgroundColor: "#fff",
    borderRadius: 16,
    borderWidth: 1,
    borderColor: "#e2e8f0",
    padding: 24,
    alignItems: "center",
    marginBottom: 24,
    ...Platform.select({
      web: { boxShadow: "0 8px 24px rgba(100,140,200,0.10)" } as any,
      default: {
        shadowColor: "#90a8cc",
        shadowOffset: { width: 0, height: 6 },
        shadowOpacity: 0.12,
        shadowRadius: 16,
        elevation: 4,
      },
    }),
  },
  illustration: {
    width: "100%",
    height: 140,
    borderRadius: 12,
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 18,
  },
  cardImage: { width: "100%", height: 140, marginBottom: 18 },
  cardTitle: {
    fontSize: 20,
    fontWeight: "700",
    color: "#1F2937",
    marginBottom: 10,
  },
  cardDesc: {
    fontSize: 14,
    color: "#64748b",
    textAlign: "center",
    lineHeight: 21,
  },
  footerCopy: {
    fontSize: 12,
    color: "#9CA3AF",
    textAlign: "center",
    marginTop: 24,
  },
});
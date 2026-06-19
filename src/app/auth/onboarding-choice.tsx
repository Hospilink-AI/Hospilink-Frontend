import { useLocalSearchParams, useRouter } from "expo-router";
import React from "react";
import {
  Platform,
  SafeAreaView,
  StatusBar,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";

export default function OnboardingChoiceScreen() {
  const router = useRouter();
  const params = useLocalSearchParams();

  const prefillName = (Array.isArray(params.prefillName) ? params.prefillName[0] : params.prefillName) ?? "";
  const prefillEmail = (Array.isArray(params.prefillEmail) ? params.prefillEmail[0] : params.prefillEmail) ?? "";

  const completeProfile = () => {
    router.replace({
      pathname: "/profile/medical-staff",
      params: { prefillName, prefillEmail },
    });
  };

  // NOTE: this lands the user on the dashboard with an incomplete profile.
  // The dashboard must tolerate null profile data and surface the
  // "Complete Your Profile" banner.
  const exploreApp = () => {
    router.replace("/medicalStaff/dashboard");
  };

  return (
    <SafeAreaView style={styles.screen}>
      <StatusBar barStyle="dark-content" backgroundColor="#fff" />

      <View style={styles.body}>
        <Text style={styles.title}>
          Would you like to Create Your Profile or Explore Hospilink first?
        </Text>

        <View style={styles.buttons}>
          <TouchableOpacity style={styles.primaryButton} activeOpacity={0.85} onPress={completeProfile}>
            <Text style={styles.primaryText}>Complete Your Profile</Text>
          </TouchableOpacity>

          <TouchableOpacity style={styles.outlineButton} activeOpacity={0.7} onPress={exploreApp}>
            <Text style={styles.outlineText}>Explore Hospilink</Text>
          </TouchableOpacity>
        </View>
      </View>

      <Text style={styles.footerCopy}>
        © Developed and Managed by Rasika & Co.
      </Text>
    </SafeAreaView>
  );
}

const BLUE = "#2563EB";

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: "#fff" },
  body: { flex: 1, justifyContent: "center", paddingHorizontal: 28 },
  title: {
    fontSize: 32,
    fontWeight: "800",
    color: "#1F2937",
    textAlign: "center",
    lineHeight: 44,
    marginBottom: 48,
  },
  buttons: { gap: 16 },
  primaryButton: {
    backgroundColor: BLUE,
    height: 56,
    borderRadius: 28,
    alignItems: "center",
    justifyContent: "center",
    shadowColor: BLUE,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.28,
    shadowRadius: 10,
    elevation: 5,
  },
  primaryText: { color: "#fff", fontSize: 16, fontWeight: "700" },
  outlineButton: {
    height: 56,
    borderRadius: 28,
    borderWidth: 1.5,
    borderColor: "#cbd5e1",
    backgroundColor: "#fff",
    alignItems: "center",
    justifyContent: "center",
  },
  outlineText: { color: "#1F2937", fontSize: 16, fontWeight: "700" },
  footerCopy: {
    fontSize: 12,
    color: "#9CA3AF",
    textAlign: "center",
    paddingBottom: 24,
  },
});
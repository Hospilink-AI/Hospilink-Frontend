import { useLocalSearchParams, useRouter } from "expo-router";
import React from "react";
import {
  SafeAreaView,
  StatusBar,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";

export default function WelcomeChoiceScreen() {
  const router = useRouter();
  const params = useLocalSearchParams();

  const email = Array.isArray(params.email) ? params.email[0] : (params.email as string) ?? "";
  const accountType = Array.isArray(params.accountType) ? params.accountType[0] : (params.accountType as string) ?? "";
  const signupName = Array.isArray(params.signupName) ? params.signupName[0] : (params.signupName as string) ?? "";

  const handleCompleteProfile = () => {
    if (accountType === "medical") {
      router.replace({
        pathname: "/profile/medical-staff",
        params: { prefillName: signupName, prefillEmail: email },
      });
    } else {
      router.replace({
        pathname: "/profile/hospital",
        params: { prefillName: signupName, prefillEmail: email },
      });
    }
  };

  const handleExplore = () => {
    if (accountType === "medical") {
      router.replace("/medicalStaff/dashboard");
    } else {
      router.replace("/hospital/dashboard");
    }
  };

  return (
    <SafeAreaView style={styles.screen}>
      <StatusBar barStyle="dark-content" backgroundColor="#fff" />

      <View style={styles.body}>
        <Text style={styles.title}>
          Would you like to Create Your Profile or Explore Hospilink first?
        </Text>

        <View style={styles.buttons}>
          <TouchableOpacity
            style={styles.primaryButton}
            activeOpacity={0.85}
            onPress={handleCompleteProfile}
          >
            <Text style={styles.primaryText}>Complete Your Profile</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.outlineButton}
            activeOpacity={0.7}
            onPress={handleExplore}
          >
            <Text style={styles.outlineText}>Explore Hospilink</Text>
          </TouchableOpacity>
        </View>

        <Text style={styles.helperText}>
          You can always complete your profile later from the dashboard.
        </Text>
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
    fontSize: 28,
    fontWeight: "800",
    color: "#1F2937",
    textAlign: "center",
    lineHeight: 38,
    marginBottom: 40,
  },
  buttons: { gap: 14 },
  primaryButton: {
    backgroundColor: BLUE,
    height: 54,
    borderRadius: 27,
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
    height: 54,
    borderRadius: 27,
    borderWidth: 1.5,
    borderColor: "#cbd5e1",
    backgroundColor: "#fff",
    alignItems: "center",
    justifyContent: "center",
  },
  outlineText: { color: "#1F2937", fontSize: 16, fontWeight: "700" },
  helperText: {
    fontSize: 13,
    color: "#94a3b8",
    textAlign: "center",
    marginTop: 24,
    lineHeight: 19,
  },
  footerCopy: {
    fontSize: 12,
    color: "#9CA3AF",
    textAlign: "center",
    paddingBottom: 24,
  },
});

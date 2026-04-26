import React, { useRef, useState } from "react";
import {
  KeyboardAvoidingView,
  Platform,
  SafeAreaView,
  StatusBar,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";
import { router } from "expo-router"; // Use useNavigation if you aren't using Expo Router

export default function ForgotPasswordScreen() {
  const [email, setEmail] = useState("");
  const [otp, setOtp] = useState(["", "", "", "", "", ""]);
  
  // Refs for auto-focusing OTP inputs
  const otpRefs = useRef<Array<TextInput | null>>([]);

  const handleOtpChange = (text: string, index: number) => {
    const newOtp = [...otp];
    newOtp[index] = text;
    setOtp(newOtp);

    // Move to next input if text is entered
    if (text && index < 5) {
      otpRefs.current[index + 1]?.focus();
    }
  };

  const handleOtpKeyPress = (e: any, index: number) => {
    // Move to previous input on backspace if current is empty
    if (e.nativeEvent.key === "Backspace" && otp[index] === "" && index > 0) {
      otpRefs.current[index - 1]?.focus();
    }
  };

  const handleSendOTP = () => {
    console.log("Sending OTP to:", email);
  };

  const handleVerifyOTP = () => {
    console.log("Verifying OTP:", otp.join(""));
  };

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="dark-content" backgroundColor="#F8FAFC" />
      
      <KeyboardAvoidingView
        behavior={Platform.OS === "ios" ? "padding" : "height"}
        style={styles.keyboardView}
      >
        <View style={styles.content}>
          {/* Main Card */}
          <View style={styles.card}>
            <Text style={styles.title}>Forgot Password</Text>

            {/* Email Input Section */}
            <View style={styles.inputGroup}>
              <Text style={styles.label}>Email Address</Text>
              <TextInput
                style={styles.input}
                placeholder="abc@gmail.com"
                placeholderTextColor="#9CA3AF"
                value={email}
                onChangeText={setEmail}
                keyboardType="email-address"
                autoCapitalize="none"
              />
            </View>

            <TouchableOpacity style={styles.sendOtpBtn} onPress={handleSendOTP} activeOpacity={0.7}>
              <Text style={styles.sendOtpText}>Send OTP</Text>
            </TouchableOpacity>

            {/* Divider / Spacer */}
            <View style={styles.spacer} />

            {/* OTP Section */}
            <View style={styles.inputGroup}>
              <Text style={styles.subText}>Enter the code sent to your registered email</Text>
              <View style={styles.otpRow}>
                {otp.map((digit, index) => (
                  <TextInput
                    key={index}
                    // ref={(el) => (otpRefs.current[index] = el)}
                    style={styles.otpInput}
                    value={digit}
                    onChangeText={(text) => handleOtpChange(text, index)}
                    onKeyPress={(e) => handleOtpKeyPress(e, index)}
                    keyboardType="number-pad"
                    maxLength={1}
                    selectTextOnFocus
                  />
                ))}
              </View>
            </View>

            <TouchableOpacity style={styles.verifyBtn} onPress={handleVerifyOTP} activeOpacity={0.8}>
              <Text style={styles.verifyBtnText}>Verify OTP</Text>
            </TouchableOpacity>

            {/* Resend Section */}
            <View style={styles.resendContainer}>
              <Text style={styles.didntReceiveText}>Didn't receive the code?</Text>
              <View style={styles.resendActionRow}>
                <TouchableOpacity>
                  <Text style={styles.resendLink}>Resend OTP</Text>
                </TouchableOpacity>
                <Text style={styles.timerText}>Resend in 00:43</Text>
              </View>
            </View>
          </View>

          {/* Footer outside the card */}
          <View style={styles.footer}>
            <Text style={styles.footerSecure}>SECURE END-TO-END ENCRYPTION</Text>
            <Text style={styles.footerCopy}>© 2024 Hospilink Medical Systems. All rights reserved.</Text>
          </View>
        </View>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

// ─── Styles ───────────────────────────────────────────────────────────────────

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#F8FAFC", // Light grayish-blue background
  },
  keyboardView: {
    flex: 1,
  },
  content: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    paddingHorizontal: 20,
  },
  card: {
    backgroundColor: "#FFFFFF",
    width: "100%",
    maxWidth: 440,
    borderRadius: 16,
    padding: 32,
    shadowColor: "#000",
    shadowOpacity: 0.04,
    shadowRadius: 15,
    shadowOffset: { width: 0, height: 4 },
    elevation: 4,
  },
  title: {
    fontSize: 24,
    fontWeight: "700",
    color: "#1F2937",
    marginBottom: 24,
  },
  inputGroup: {
    marginBottom: 16,
  },
  label: {
    fontSize: 12,
    fontWeight: "600",
    color: "#374151",
    marginBottom: 8,
  },
  input: {
    height: 48,
    borderWidth: 1,
    borderColor: "#E5E7EB",
    borderRadius: 8,
    paddingHorizontal: 16,
    fontSize: 14,
    color: "#1F2937",
    backgroundColor: "#FFFFFF",
    ...(Platform.OS === "web" && { outlineStyle: "none" } as any),
  },
  sendOtpBtn: {
    backgroundColor: "#F1F5F9", // Light gray/blue
    height: 48,
    borderRadius: 8,
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 24,
  },
  sendOtpText: {
    color: "#3B82F6", // Blue text
    fontSize: 14,
    fontWeight: "600",
  },
  spacer: {
    height: 8,
  },
  subText: {
    fontSize: 13,
    color: "#6B7280",
    marginBottom: 12,
  },
  otpRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    width: "100%",
  },
  otpInput: {
    width: 46,
    height: 52,
    borderWidth: 1,
    borderColor: "#E5E7EB",
    backgroundColor: "#F8FAFC",
    borderRadius: 8,
    textAlign: "center",
    fontSize: 18,
    fontWeight: "600",
    color: "#1F2937",
    ...(Platform.OS === "web" && { outlineStyle: "none" } as any),
  },
  verifyBtn: {
    backgroundColor: "#2563EB", // Solid blue
    height: 48,
    borderRadius: 8,
    alignItems: "center",
    justifyContent: "center",
    marginTop: 8,
    marginBottom: 24,
    shadowColor: "#2563EB",
    shadowOpacity: 0.2,
    shadowRadius: 8,
    shadowOffset: { width: 0, height: 4 },
  },
  verifyBtnText: {
    color: "#FFFFFF",
    fontSize: 15,
    fontWeight: "600",
  },
  resendContainer: {
    alignItems: "center",
  },
  didntReceiveText: {
    fontSize: 13,
    color: "#6B7280",
    marginBottom: 8,
  },
  resendActionRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
  },
  resendLink: {
    fontSize: 13,
    fontWeight: "600",
    color: "#3B82F6",
  },
  timerText: {
    fontSize: 13,
    color: "#9CA3AF",
  },
  footer: {
    marginTop: 32,
    alignItems: "center",
  },
  footerSecure: {
    fontSize: 11,
    fontWeight: "600",
    color: "#9CA3AF",
    letterSpacing: 0.5,
    marginBottom: 6,
  },
  footerCopy: {
    fontSize: 11,
    color: "#9CA3AF",
  },
});
import { Ionicons } from "@expo/vector-icons";
import React, { useState } from "react";
import {
  Image,
  Platform,
  SafeAreaView,
  ScrollView,
  StatusBar,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  useWindowDimensions,
  View,
} from "react-native";
import Svg, { Path, Rect, Text as SvgText } from "react-native-svg";

const HOSPILINK_LOGO = require("../../../assets/Images/Hospilink.png");
const MERI_PEHCHAAN_LOGO = require("../../../assets/Images/digitlocker.png");

function MeriPehchaanLogo() {
  return (
    <View style={logoStyles.wrap}>
      <Image
        source={MERI_PEHCHAAN_LOGO}
        style={logoStyles.logoImg}
        resizeMode="contain"
      />
    </View>
  );
}

const logoStyles = StyleSheet.create({
  wrap: {
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 18,
  },
  logoImg: {
    width: 170,
    height: 52,
  },
});

// Static Captcha Image 
function CaptchaImage() {
  return (
    <View style={captchaImgStyles.box}>
      <Svg width={140} height={48} viewBox="0 0 140 48">
        { }
        <Rect width="140" height="48" fill="#E8E8E8" rx={4} />
        { }
        <Path d="M5 10 L135 38" stroke="#C0C0C0" strokeWidth="0.8" />
        <Path d="M10 40 L130 8" stroke="#B0B0B0" strokeWidth="0.7" />
        <Path d="M20 5 L120 45" stroke="#D0D0D0" strokeWidth="0.6" />
        <Path d="M0 25 L140 20" stroke="#BEBEBE" strokeWidth="0.5" />
        <Path d="M30 0 L70 48" stroke="#C8C8C8" strokeWidth="0.6" />
        <Path d="M90 0 L50 48" stroke="#CCCCCC" strokeWidth="0.5" />

        { }
        <SvgText
          x="12" y="32"
          fontSize="22" fontWeight="bold" fill="#333"
          transform="rotate(-8, 12, 32)"
        >F</SvgText>
        <SvgText
          x="32" y="36"
          fontSize="18" fontWeight="600" fill="#555"
          transform="rotate(5, 32, 36)"
        >0</SvgText>
        <SvgText
          x="52" y="30"
          fontSize="24" fontWeight="bold" fill="#222"
          transform="rotate(-3, 52, 30)"
        >6</SvgText>
        <SvgText
          x="78" y="26"
          fontSize="14" fontWeight="bold" fill="#444"
          transform="rotate(10, 78, 26)"
        >I</SvgText>
        <SvgText
          x="95" y="34"
          fontSize="20" fontWeight="bold" fill="#333"
          transform="rotate(-6, 95, 34)"
        >W</SvgText>
      </Svg>
    </View>
  );
}

const captchaImgStyles = StyleSheet.create({
  box: {
    borderWidth: 1,
    borderColor: "#D1D5DB",
    borderRadius: 6,
    overflow: "hidden",
    alignSelf: "flex-start",
  },
});

// Main Screen 
export default function AadhaarOnboarding() {
  const { width } = useWindowDimensions();
  const isMobile = width <= 768;

  const [aadhaarNumber, setAadhaarNumber] = useState("");
  const [captchaInput, setCaptchaInput] = useState("");
  const [showAadhaar, setShowAadhaar] = useState(false);

  return (
    <SafeAreaView style={s.safe}>
      <StatusBar barStyle="dark-content" backgroundColor="#FFFFFF" />

      {/* ── Top App Bar ── */}
      <View style={s.appBar}>
        <View style={s.appBarInner}>
          <Image
            source={HOSPILINK_LOGO}
            style={s.appBarLogoImg}
            resizeMode="contain"
          />
          <TouchableOpacity style={s.helpBtn} activeOpacity={0.7}>
            <Ionicons name="help-circle-outline" size={26} color="#94A3B8" />
          </TouchableOpacity>
        </View>
      </View>

      {/* ── Body ── */}
      <ScrollView
        style={s.scrollWrapper}
        contentContainerStyle={[
          s.scrollContent,
          isMobile && s.scrollContentMobile,
        ]}
        showsVerticalScrollIndicator={false}
      >
        {/* Meri Pehchaan Logo */}
        <MeriPehchaanLogo />

        {/* Card */}
        <View style={[s.card, isMobile && s.cardMobile]}>
          {/* Title */}
          <Text style={s.cardTitle}>Digital Onboarding</Text>

          {/* Description */}
          <Text style={s.cardDesc}>
            You are about to link your DigiLocker account with Digital
            Onboarding application of Baldor Technologies Private Limited.
            You will be signed up for DigiLocker account if it does not exist.
          </Text>

          {/* Aadhaar / VID Input */}
          <View style={s.inputWrap}>
            <TextInput
              style={s.input}
              placeholder="Enter Aadhaar / VID Number"
              placeholderTextColor="#9CA3AF"
              value={aadhaarNumber}
              onChangeText={setAadhaarNumber}
              keyboardType="number-pad"
              maxLength={16}
              secureTextEntry={!showAadhaar}
            />
            <TouchableOpacity
              style={s.eyeBtn}
              onPress={() => setShowAadhaar((v) => !v)}
              activeOpacity={0.7}
              hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
            >
              <Ionicons
                name={showAadhaar ? "eye-outline" : "eye-off-outline"}
                size={20}
                color="#9CA3AF"
              />
            </TouchableOpacity>
          </View>

          {/* Captcha Section */}
          <Text style={s.captchaLabel}>Please enter the Captcha</Text>

          <View style={s.captchaRow}>
            <CaptchaImage />
            <TextInput
              style={s.captchaInput}
              value={captchaInput}
              onChangeText={setCaptchaInput}
              placeholder=""
              placeholderTextColor="#9CA3AF"
              maxLength={8}
              autoCapitalize="characters"
            />
          </View>

          {/* Try another link */}
          <View style={s.tryAnotherRow}>
            <Text style={s.tryAnotherText}>
              Unable to read the above image?{" "}
            </Text>
            <TouchableOpacity activeOpacity={0.7}>
              <Text style={s.tryAnotherLink}>Try another!</Text>
            </TouchableOpacity>
          </View>

          {/* Next Button */}
          <TouchableOpacity style={s.nextBtn} activeOpacity={0.85}>
            <Text style={s.nextBtnText}>Next</Text>
          </TouchableOpacity>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

//  Styles 
const s = StyleSheet.create({
  safe: {
    flex: 1,
    backgroundColor: "#FFFFFF",
  },

  /* ── App Bar ── */
  appBar: {
    height: 64,
    backgroundColor: "#FFFFFF",
    borderBottomWidth: 1,
    borderBottomColor: "#EEF1F5",
    justifyContent: "center",
    ...Platform.select({
      web: { boxShadow: "0 1px 3px rgba(15,23,42,0.06)" } as any,
      default: {
        shadowColor: "#0F172A",
        shadowOffset: { width: 0, height: 1 },
        shadowOpacity: 0.06,
        shadowRadius: 4,
        elevation: 3,
      },
    }),
  },
  appBarInner: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 20,
  },
  appBarLogoImg: {
    width: 132,
    height: 40,
  },
  helpBtn: {
    width: 40,
    height: 40,
    alignItems: "center",
    justifyContent: "center",
  },

  /* ── Scroll ── */
  scrollWrapper: {
    flex: 1,
    backgroundColor: "#F5F7FB",
  },
  scrollContent: {
    flexGrow: 1,
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 24,
    paddingHorizontal: 24,
  },
  scrollContentMobile: {
    paddingVertical: 20,
    paddingHorizontal: 16,
  },

  /* ── Card ── */
  card: {
    width: "100%",
    maxWidth: 549,
    backgroundColor: "#FFFFFF",
    borderRadius: 20,
    paddingVertical: 32,
    paddingHorizontal: 60,
    // Drop shadow from Figma: X 4, Y 4, Blur 25.3, Spread 0, #64748B @ 7%
    ...Platform.select({
      web: { boxShadow: "4px 4px 25px rgba(100,116,139,0.07)" } as any,
      default: {
        shadowColor: "#64748B",
        shadowOffset: { width: 4, height: 4 },
        shadowOpacity: 0.07,
        shadowRadius: 25,
        elevation: 5,
      },
    }),
  },
  cardMobile: {
    // Tighter padding on small screens so the form isn't cramped.
    paddingVertical: 28,
    paddingHorizontal: 24,
    borderRadius: 16,
  },

  // Card Content
  cardTitle: {
    fontSize: 22,
    fontWeight: "800",
    color: "#0F172A",
    textAlign: "center",
    marginBottom: 14,
  },
  cardDesc: {
    fontSize: 13,
    color: "#64748B",
    lineHeight: 20,
    textAlign: "center",
    marginBottom: 22,
  },

  // Aadhaar Input 
  inputWrap: {
    flexDirection: "row",
    alignItems: "center",
    borderWidth: 1,
    borderColor: "#D1D5DB",
    borderRadius: 8,
    backgroundColor: "#FFFFFF",
    paddingHorizontal: 14,
    height: 48,
    marginBottom: 20,
  },
  input: {
    flex: 1,
    fontSize: 14,
    color: "#2563EB",
    height: "100%",
    ...(Platform.OS === "web" ? { outlineStyle: "none" } as any : {}),
  },
  eyeBtn: {
    paddingLeft: 8,
  },

  // ── Captcha 
  captchaLabel: {
    fontSize: 13,
    fontWeight: "600",
    color: "#374151",
    marginBottom: 10,
  },
  captchaRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 16,
    marginBottom: 10,
  },
  captchaInput: {
    flex: 1,
    maxWidth: 140,
    height: 48,
    borderWidth: 1,
    borderColor: "#D1D5DB",
    borderRadius: 8,
    paddingHorizontal: 14,
    fontSize: 16,
    color: "#1E293B",
    backgroundColor: "#FFFFFF",
    letterSpacing: 2,
    ...(Platform.OS === "web" ? { outlineStyle: "none" } as any : {}),
  },

  // Try Another 
  tryAnotherRow: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 28,
    marginTop: 4,
  },
  tryAnotherText: {
    fontSize: 12,
    color: "#6B7280",
  },
  tryAnotherLink: {
    fontSize: 12,
    color: "#2563EB",
    fontWeight: "600",
  },

  // Next Button 
  nextBtn: {
    width: "100%",
    height: 48,
    backgroundColor: "#16A34A",
    borderRadius: 8,
    alignItems: "center",
    justifyContent: "center",
  },
  nextBtnText: {
    color: "#FFFFFF",
    fontSize: 16,
    fontWeight: "700",
    letterSpacing: 0.3,
  },
});
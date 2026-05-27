// import { Ionicons } from "@expo/vector-icons";
// import { useLocalSearchParams, useRouter } from "expo-router";
// import React from "react";
// import {
//   Platform,
//   ScrollView,
//   StyleSheet,
//   Text,
//   TouchableOpacity,
//   useWindowDimensions,
//   View,
// } from "react-native";

// export default function WelcomeChoice() {
//   const router = useRouter();
//   const { width } = useWindowDimensions();

//   // ── Carry forward all params from verify-otp ──────────────────────
//   const params = useLocalSearchParams();
//   const email       = Array.isArray(params.email)       ? params.email[0]       : (params.email as string)       ?? "";
//   const accountType = Array.isArray(params.accountType) ? params.accountType[0] : (params.accountType as string) ?? "";
//   const signupName  = Array.isArray(params.signupName)  ? params.signupName[0]  : (params.signupName as string)  ?? "";

//   const isMobile  = width <= 600;
//   const cardWidth = isMobile ? width - 40 : Math.min(width * 0.88, 420);

//   // ── Complete Profile → profile creation page ──────────────────────
//   const handleCompleteProfile = () => {
//     if (accountType === "medical") {
//       router.replace({
//         pathname: "/profile/medical-staff",
//         params: { email, signupName },
//       });
//     } else {
//       router.replace({
//         pathname: "/profile/hospital",
//         params: { email, signupName },
//       });
//     }
//   };

//   // ── Explore → dashboard (skip profile for now) ────────────────────
//   const handleExplore = () => {
//     if (accountType === "medical") {
//       router.replace("/medicalStaff/dashboard");
//     } else {
//       router.replace("/hospital/dashboard");
//     }
//   };

//   return (
//     <View style={styles.outerContainer}>

//       {/* ── NAVBAR ── */}
//       <View style={styles.navbar}>
//         <View style={styles.navLogo}>
//           <View style={styles.navLogoBox}>
//             <Ionicons name="pulse" size={16} color="#fff" />
//           </View>
//           <Text style={styles.navLogoText}>HospiLink</Text>
//         </View>
//         <TouchableOpacity style={styles.helpBtn}>
//           <Ionicons name="help-circle-outline" size={20} color="#64748b" />
//         </TouchableOpacity>
//       </View>

//       {/* ── CENTER CONTENT ── */}
//       <ScrollView
//         contentContainerStyle={styles.centerContent}
//         showsVerticalScrollIndicator={false}
//         keyboardShouldPersistTaps="handled"
//       >
//         {/* ── Icon ── */}
//         <View style={styles.iconWrapper}>
//           <Ionicons name="checkmark-circle" size={30} color="#2563EB" />
//         </View>

//         {/* ── Heading ── */}
//         <Text style={styles.heading}>You're all set!</Text>
//         <Text style={[styles.subText, { maxWidth: cardWidth }]}>
//           Would you like to create your profile or{"\n"}explore HospiLink first?
//         </Text>

//         {/* ── Card ── */}
//         <View style={[styles.card, { width: cardWidth }]}>

//           {/* Complete Your Profile */}
//           <TouchableOpacity
//             style={styles.primaryBtn}
//             onPress={handleCompleteProfile}
//             activeOpacity={0.85}
//           >
//             <Ionicons name="person-circle-outline" size={18} color="#fff" style={{ marginRight: 8 }} />
//             <Text style={styles.primaryBtnText}>Complete Your Profile</Text>
//           </TouchableOpacity>

//           {/* Divider */}
//           <View style={styles.dividerRow}>
//             <View style={styles.dividerLine} />
//             <Text style={styles.dividerText}>or</Text>
//             <View style={styles.dividerLine} />
//           </View>

//           {/* Explore Hospilink */}
//           <TouchableOpacity
//             style={styles.secondaryBtn}
//             onPress={handleExplore}
//             activeOpacity={0.85}
//           >
//             <Ionicons name="compass-outline" size={18} color="#2563EB" style={{ marginRight: 8 }} />
//             <Text style={styles.secondaryBtnText}>Explore HospiLink</Text>
//           </TouchableOpacity>

//           {/* Helper text */}
//           <Text style={styles.helperText}>
//             You can always complete your profile later from the dashboard.
//           </Text>

//         </View>

//         {/* ── Secure badge ── */}
//         <View style={styles.secureRow}>
//           <Ionicons name="lock-closed" size={11} color="#94a3b8" />
//           <Text style={styles.secureText}>  SECURE END-TO-END ENCRYPTION</Text>
//         </View>

//       </ScrollView>

//       {/* ── FOOTER ── */}
//       <Text style={styles.footer}>
//         © 2026 HospiLink Medical Systems. All rights reserved.
//       </Text>

//     </View>
//   );
// }

// const styles = StyleSheet.create({
//   outerContainer: {
//     flex: 1,
//     backgroundColor: "#dce6f5",
//   },

//   // ── Navbar ──
//   navbar: {
//     flexDirection: "row",
//     justifyContent: "space-between",
//     alignItems: "center",
//     paddingHorizontal: 24,
//     paddingVertical: 14,
//     borderBottomWidth: 1,
//     borderBottomColor: "#dde6f0",
//     backgroundColor: "#ffffff",
//   },
//   navLogo: { flexDirection: "row", alignItems: "center" },
//   navLogoBox: {
//     width: 30, height: 30,
//     backgroundColor: "#2563EB",
//     borderRadius: 8,
//     alignItems: "center",
//     justifyContent: "center",
//     marginRight: 8,
//   },
//   navLogoText: {
//     color: "#0f172a", fontSize: 15,
//     fontWeight: "700", letterSpacing: 0.3,
//   },
//   helpBtn: {
//     width: 32, height: 32,
//     borderRadius: 16,
//     borderWidth: 1, borderColor: "#e2e8f0",
//     alignItems: "center", justifyContent: "center",
//     backgroundColor: "#f8fafc",
//   },

//   // ── Center layout ──
//   centerContent: {
//     flexGrow: 1,
//     justifyContent: "center",
//     alignItems: "center",
//     paddingHorizontal: 20,
//     paddingVertical: 40,
//   },

//   // ── Icon ──
//   iconWrapper: {
//     width: 70, height: 70,
//     borderRadius: 35,
//     backgroundColor: "#EFF6FF",
//     borderWidth: 1, borderColor: "#BFDBFE",
//     justifyContent: "center",
//     alignItems: "center",
//     marginBottom: 20,
//     ...Platform.select({
//       web: { boxShadow: "0 4px 18px rgba(37,99,235,0.15)" },
//       default: {
//         shadowColor: "#2563EB",
//         shadowOffset: { width: 0, height: 4 },
//         shadowOpacity: 0.15,
//         shadowRadius: 12,
//         elevation: 4,
//       },
//     }),
//   },

//   // ── Text above card ──
//   heading: {
//     fontSize: 22, fontWeight: "800",
//     color: "#0f172a", marginBottom: 10,
//     letterSpacing: 0.2,
//   },
//   subText: {
//     fontSize: 14, color: "#64748b",
//     textAlign: "center", lineHeight: 22,
//     marginBottom: 28,
//   },

//   // ── Card ──
//   card: {
//     backgroundColor: "#ffffff",
//     borderRadius: 18,
//     paddingVertical: 28,
//     paddingHorizontal: 28,
//     alignItems: "stretch",
//     borderWidth: 1, borderColor: "#d0d9e8",
//     ...Platform.select({
//       web: { boxShadow: "0 20px 50px rgba(100,140,200,0.18)" },
//       default: {
//         shadowColor: "#90a8cc",
//         shadowOffset: { width: 0, height: 10 },
//         shadowOpacity: 0.16,
//         shadowRadius: 20,
//         elevation: 12,
//       },
//     }),
//   },

//   // ── Primary button ──
//   primaryBtn: {
//     backgroundColor: "#2563EB",
//     paddingVertical: 15,
//     borderRadius: 12,
//     flexDirection: "row",
//     alignItems: "center",
//     justifyContent: "center",
//     ...Platform.select({
//       web: { boxShadow: "0 4px 14px rgba(37,99,235,0.32)" },
//       default: {
//         shadowColor: "#2563EB",
//         shadowOffset: { width: 0, height: 4 },
//         shadowOpacity: 0.28,
//         shadowRadius: 10,
//         elevation: 6,
//       },
//     }),
//   },
//   primaryBtnText: {
//     color: "#ffffff", fontWeight: "700",
//     fontSize: 15, letterSpacing: 0.2,
//   },

//   // ── Divider ──
//   dividerRow: {
//     flexDirection: "row",
//     alignItems: "center",
//     marginVertical: 18,
//     gap: 10,
//   },
//   dividerLine: {
//     flex: 1, height: 1,
//     backgroundColor: "#E9ECF0",
//   },
//   dividerText: {
//     fontSize: 12, color: "#94a3b8",
//     fontWeight: "600", letterSpacing: 0.5,
//   },

//   // ── Secondary button ──
//   secondaryBtn: {
//     backgroundColor: "#ffffff",
//     paddingVertical: 15,
//     borderRadius: 12,
//     flexDirection: "row",
//     alignItems: "center",
//     justifyContent: "center",
//     borderWidth: 1.5,
//     borderColor: "#2563EB",
//   },
//   secondaryBtnText: {
//     color: "#2563EB", fontWeight: "700",
//     fontSize: 15, letterSpacing: 0.2,
//   },

//   // ── Helper text ──
//   helperText: {
//     fontSize: 11, color: "#94a3b8",
//     textAlign: "center", marginTop: 16,
//     lineHeight: 17,
//   },

//   // ── Secure row ──
//   secureRow: {
//     flexDirection: "row",
//     alignItems: "center",
//     marginTop: 28,
//   },
//   secureText: {
//     color: "#94a3b8", fontSize: 11, letterSpacing: 1.2,
//   },

//   // ── Footer ──
//   footer: {
//     textAlign: "center",
//     color: "#c2cfe0", fontSize: 11,
//     paddingBottom: 16, letterSpacing: 0.3,
//     backgroundColor: "#dce6f5",
//   },
// });


import { Ionicons } from "@expo/vector-icons";
import { useLocalSearchParams, useRouter } from "expo-router";
import React from "react";
import {
  Platform,
  StyleSheet,
  Text,
  TouchableOpacity,
  useWindowDimensions,
  View,
} from "react-native";

export default function WelcomeChoice() {
  const router = useRouter();
  const { width } = useWindowDimensions();

  const params = useLocalSearchParams();
  const email       = Array.isArray(params.email)       ? params.email[0]       : (params.email as string)       ?? "";
  const accountType = Array.isArray(params.accountType) ? params.accountType[0] : (params.accountType as string) ?? "";
  const signupName  = Array.isArray(params.signupName)  ? params.signupName[0]  : (params.signupName as string)  ?? "";

  const isMobile  = width <= 600;
  const cardWidth = isMobile ? width - 48 : 380;

  const handleCompleteProfile = () => {
    if (accountType === "medical") {
      router.replace({ pathname: "/profile/medical-staff", params: { email, signupName } });
    } else {
      router.replace({ pathname: "/profile/hospital", params: { email, signupName } });
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
  <View style={styles.root}>

    {/* ── NAVBAR ── */}
    <View style={styles.navbar}>
      <View style={styles.navLogo}>
        <View style={styles.navLogoBox}>
          <Ionicons name="pulse" size={16} color="#fff" />
        </View>
        <Text style={styles.navLogoText}>HospiLink</Text>
      </View>
      <TouchableOpacity style={styles.helpBtn}>
        <Ionicons name="help-circle-outline" size={20} color="#64748b" />
      </TouchableOpacity>
    </View>

    {/* ── Centered content ── */}
    <View style={styles.center}>
      <Text style={[styles.subText, { maxWidth: cardWidth }]}>
        Would you like to create your profile or{"\n"}explore Hospilink first?
      </Text>

      <View style={[styles.card, { width: cardWidth }]}>
        <TouchableOpacity
          style={styles.primaryBtn}
          onPress={handleCompleteProfile}
          activeOpacity={0.85}
        >
          <Text style={styles.primaryBtnText}>Complete Your Profile</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={styles.secondaryBtn}
          onPress={handleExplore}
          activeOpacity={0.85}
        >
          <Text style={styles.secondaryBtnText}>Explore Hospilink</Text>
        </TouchableOpacity>
      </View>
    </View>

  </View>
);
}

const styles = StyleSheet.create({
 

  subText: {
    fontSize: 15,
    color: "#6b7280",
    textAlign: "center",
    lineHeight: 23,
    marginBottom: 20,
  },

  card: {
    backgroundColor: "#ffffff",
    borderRadius: 18,
    paddingVertical: 24,
    paddingHorizontal: 24,
    gap: 12,
    ...Platform.select({
      web: { boxShadow: "0 8px 32px rgba(100,140,200,0.15)" },
      default: {
        shadowColor: "#9ab0cc",
        shadowOffset: { width: 0, height: 6 },
        shadowOpacity: 0.18,
        shadowRadius: 18,
        elevation: 8,
      },
    }),
  },

  primaryBtn: {
    backgroundColor: "#4F46E5",
    paddingVertical: 15,
    borderRadius: 10,
    alignItems: "center",
    justifyContent: "center",
  },
  primaryBtnText: {
    color: "#ffffff",
    fontWeight: "700",
    fontSize: 15,
    letterSpacing: 0.2,
  },

  secondaryBtn: {
    backgroundColor: "#ffffff",
    paddingVertical: 15,
    borderRadius: 10,
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 1.5,
    borderColor: "#d1d5db",
  },
  secondaryBtnText: {
    color: "#374151",
    fontWeight: "600",
    fontSize: 15,
    letterSpacing: 0.2,
  },
  // CHANGE root — remove justifyContent/alignItems (now handled by `center`)
root: {
  flex: 1,
  backgroundColor: "#eaeff8",
},

// ADD navbar styles
navbar: {
  flexDirection: "row",
  justifyContent: "space-between",
  alignItems: "center",
  paddingHorizontal: 24,
  paddingVertical: 14,
  borderBottomWidth: 1,
  borderBottomColor: "#dde6f0",
  backgroundColor: "#ffffff",
},
navLogo: { flexDirection: "row", alignItems: "center" },
navLogoBox: {
  width: 30, height: 30,
  backgroundColor: "#2563EB",
  borderRadius: 8,
  alignItems: "center",
  justifyContent: "center",
  marginRight: 8,
},
navLogoText: {
  color: "#0f172a", fontSize: 15,
  fontWeight: "700", letterSpacing: 0.3,
},
helpBtn: {
  width: 32, height: 32,
  borderRadius: 16,
  borderWidth: 1, borderColor: "#e2e8f0",
  alignItems: "center", justifyContent: "center",
  backgroundColor: "#f8fafc",
},

// ADD center — takes remaining space and centers content
center: {
  flex: 1,
  justifyContent: "center",
  alignItems: "center",
  paddingHorizontal: 24,
},
});
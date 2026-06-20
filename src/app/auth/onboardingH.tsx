// import { Ionicons } from "@expo/vector-icons";
// import { useLocalSearchParams, useRouter } from "expo-router";
// import React, { useRef, useState } from "react";
// import {
//   Dimensions,
//   FlatList,
//   Platform,
//   SafeAreaView,
//   StatusBar,
//   StyleSheet,
//   Text,
//   TouchableOpacity,
//   View,
// } from "react-native";

// type Slide = {
//   key: string;
//   icon: any;
//   tint: string;
//   iconColor: string;
//   title: string;
//   desc: string;
// };

// const SLIDES: Slide[] = [
//   {
//     key: "connect",
//     icon: "people",
//     tint: "#eff6ff",
//     iconColor: "#2563EB",
//     title: "Connect with Qualified Medical Staff Instantly",
//     desc: "Access verified doctors, nurses, and healthcare professionals in real time to handle urgent and scheduled staffing needs efficiently.",
//   },
//   {
//     key: "operations",
//     icon: "stats-chart",
//     tint: "#eff6ff",
//     iconColor: "#2563EB",
//     title: "Simplify Hospital Staffing Operations",
//     desc: "Create duty requests, monitor live staffing updates, manage schedules, and coordinate workforce operations through one centralized platform.",
//   },
//   {
//     key: "emergency",
//     icon: "notifications",
//     tint: "#fef2f2",
//     iconColor: "#ef4444",
//     title: "Respond Quickly During Critical Situations",
//     desc: "Broadcast emergency staffing requests, track nearby medical professionals, and ensure uninterrupted patient care with rapid response tools.",
//   },
// ];

// const { width: SCREEN_WIDTH } = Dimensions.get("window");

// export default function OnboardingHospitalScreen() {
//   const router = useRouter();
//   const params = useLocalSearchParams();

//   // Carried through from verify-otp so the profile screen can prefill.
//   const prefillName = (Array.isArray(params.prefillName) ? params.prefillName[0] : params.prefillName) ?? "";
//   const prefillEmail = (Array.isArray(params.prefillEmail) ? params.prefillEmail[0] : params.prefillEmail) ?? "";

//   const listRef = useRef<FlatList<Slide>>(null);
//   const indexRef = useRef(0);              // synchronous source of truth
//   const [index, setIndex] = useState(0);   // only drives the dots

//   const goTo = (i: number) => {
//     indexRef.current = i;
//     setIndex(i);
//     listRef.current?.scrollToIndex({ index: i, animated: true });
//   };

//   const onNext = () => {
//     const next = indexRef.current + 1;
//     if (next < SLIDES.length) {
//       goTo(next);
//     } else {
//       router.push({
//         pathname: "/auth/onboarding-choice",
//         // role tells the choice screen to route to the HOSPITAL profile/dashboard
//         params: { role: "hospital", prefillName, prefillEmail },
//       });
//     }
//   };

//   const onMomentumEnd = (e: any) => {
//     const i = Math.round(e.nativeEvent.contentOffset.x / SCREEN_WIDTH);
//     indexRef.current = i;
//     setIndex(i);
//   };

//   const renderItem = ({ item }: { item: Slide }) => (
//     <View style={[styles.slide, { width: SCREEN_WIDTH }]}>
//       {/* Replace this hero placeholder with your illustration:
//           <Image source={require("../assets/Images/hospital-onboarding-1.png")}
//                  style={styles.heroImage} resizeMode="contain" /> */}
//       <View style={[styles.hero, { backgroundColor: item.tint }]}>
//         <View style={[styles.heroCircle, { backgroundColor: "#fff" }]}>
//           <Ionicons name={item.icon} size={64} color={item.iconColor} />
//         </View>
//       </View>

//       <Text style={styles.title}>{item.title}</Text>
//       <Text style={styles.desc}>{item.desc}</Text>
//     </View>
//   );

//   return (
//     <SafeAreaView style={styles.screen}>
//       <StatusBar barStyle="dark-content" backgroundColor="#fff" />

//       <FlatList
//         ref={listRef}
//         data={SLIDES}
//         keyExtractor={(s) => s.key}
//         renderItem={renderItem}
//         horizontal
//         pagingEnabled
//         showsHorizontalScrollIndicator={false}
//         onMomentumScrollEnd={onMomentumEnd}
//         getItemLayout={(_, i) => ({
//           length: SCREEN_WIDTH,
//           offset: SCREEN_WIDTH * i,
//           index: i,
//         })}
//       />

//       {/* Dots */}
//       <View style={styles.dots}>
//         {SLIDES.map((_, i) => (
//           <View key={i} style={[styles.dot, i === index ? styles.dotActive : null]} />
//         ))}
//       </View>

//       {/* Next */}
//       <View style={styles.bottomBar}>
//         <TouchableOpacity style={styles.button} activeOpacity={0.85} onPress={onNext}>
//           <Text style={styles.buttonText}>Next</Text>
//         </TouchableOpacity>
//       </View>
//     </SafeAreaView>
//   );
// }

// const BLUE = "#2563EB";

// const styles = StyleSheet.create({
//   screen: { flex: 1, backgroundColor: "#fff" },
//   slide: { flex: 1, paddingHorizontal: 28, paddingTop: 24, alignItems: "center" },
//   hero: {
//     width: "100%",
//     height: 340,
//     borderRadius: 20,
//     alignItems: "center",
//     justifyContent: "center",
//     marginBottom: 40,
//   },
//   heroImage: { width: "100%", height: 340, marginBottom: 40 },
//   heroCircle: {
//     width: 120,
//     height: 120,
//     borderRadius: 60,
//     alignItems: "center",
//     justifyContent: "center",
//     ...Platform.select({
//       web: { boxShadow: "0 8px 24px rgba(100,140,200,0.18)" } as any,
//       default: {
//         shadowColor: "#90a8cc",
//         shadowOffset: { width: 0, height: 6 },
//         shadowOpacity: 0.18,
//         shadowRadius: 16,
//         elevation: 4,
//       },
//     }),
//   },
//   title: {
//     fontSize: 28,
//     fontWeight: "800",
//     color: "#1F2937",
//     textAlign: "center",
//     lineHeight: 36,
//     marginBottom: 16,
//   },
//   desc: {
//     fontSize: 15,
//     color: "#64748b",
//     textAlign: "center",
//     lineHeight: 23,
//     paddingHorizontal: 4,
//   },
//   dots: { flexDirection: "row", justifyContent: "center", alignItems: "center", gap: 8, marginBottom: 24 },
//   dot: { width: 8, height: 8, borderRadius: 4, backgroundColor: "#cbd5e1" },
//   dotActive: { width: 22, backgroundColor: BLUE },
//   bottomBar: { paddingHorizontal: 28, paddingBottom: 24 },
//   button: {
//     backgroundColor: BLUE,
//     height: 54,
//     borderRadius: 27,
//     alignItems: "center",
//     justifyContent: "center",
//     shadowColor: BLUE,
//     shadowOffset: { width: 0, height: 4 },
//     shadowOpacity: 0.28,
//     shadowRadius: 10,
//     elevation: 5,
//   },
//   buttonText: { color: "#fff", fontSize: 16, fontWeight: "700" },
// });


import { useLocalSearchParams, useRouter } from "expo-router";
import React, { useRef, useState } from "react";
import {
  Dimensions,
  FlatList,
  Image,
  SafeAreaView,
  StatusBar,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";

const { width: SW, height: SH } = Dimensions.get("window");
const IMAGE_H = SH * 0.50;

type Slide = { key: string; image: any; title: string; desc: string };

const SLIDES: Slide[] = [
  {
    key: "connect",
    image: require("../../../assets/Images/hosp1.png"),
    title: "Connect with Qualified\nMedical Staff Instantly",
    desc: "Access verified doctors, nurses, and healthcare professionals in real time to handle urgent and scheduled staffing needs efficiently.",
  },
  {
    key: "operations",
    image: require("../../../assets/Images/hosp2.png"),
    title: "Simplify Hospital Staffing\nOperations",
    desc: "Create duty requests, monitor live staffing updates, manage schedules, and coordinate workforce operations through one centralized platform.",
  },
  {
    key: "emergency",
    image: require("../../../assets/Images/hosp3.png"),
    title: "Respond Quickly During\nCritical Situations",
    desc: "Broadcast emergency staffing requests, track nearby medical professionals, and ensure uninterrupted patient care with rapid response tools.",
  },
];

const SlideItem = ({ item }: { item: Slide }) => (
  <View style={{ width: SW }}>
    {/* Light blue-gray illustration background — matches the screenshots exactly */}
    <View style={styles.imageArea}>
      <Image source={item.image} style={styles.heroImage} resizeMode="contain" />
    </View>

    <View style={styles.textArea}>
      <Text style={styles.title}>{item.title}</Text>
      <Text style={styles.desc}>{item.desc}</Text>
    </View>
  </View>
);

export default function OnboardingHospitalScreen() {
  const router = useRouter();
  const params = useLocalSearchParams();

  const prefillName =
    (Array.isArray(params.prefillName) ? params.prefillName[0] : params.prefillName) ?? "";
  const prefillEmail =
    (Array.isArray(params.prefillEmail) ? params.prefillEmail[0] : params.prefillEmail) ?? "";

  const listRef = useRef<FlatList<Slide>>(null);
  const indexRef = useRef(0);
  const [index, setIndex] = useState(0);

  const goTo = (i: number) => {
    indexRef.current = i;
    setIndex(i);
    listRef.current?.scrollToIndex({ index: i, animated: true });
  };

  const onNext = () => {
    const next = indexRef.current + 1;
    if (next < SLIDES.length) {
      goTo(next);
    } else {
      router.push({
        pathname: "/auth/onboarding-choice",
        params: { role: "hospital", prefillName, prefillEmail },
      });
    }
  };

  const onMomentumEnd = (e: any) => {
    const i = Math.round(e.nativeEvent.contentOffset.x / SW);
    indexRef.current = i;
    setIndex(i);
  };

  return (
    <SafeAreaView style={styles.screen}>
      <StatusBar barStyle="dark-content" backgroundColor="#E8EEF6" />

      <FlatList
        ref={listRef}
        data={SLIDES}
        keyExtractor={(s) => s.key}
        renderItem={({ item }) => <SlideItem item={item} />}
        horizontal
        pagingEnabled
        showsHorizontalScrollIndicator={false}
        onMomentumScrollEnd={onMomentumEnd}
        scrollEventThrottle={16}
        getItemLayout={(_, i) => ({ length: SW, offset: SW * i, index: i })}
      />

      {/* Dots */}
      <View style={styles.dotsRow}>
        {SLIDES.map((_, i) => (
          <View key={i} style={[styles.dot, i === index && styles.dotActive]} />
        ))}
      </View>

      {/* Next button */}
      <View style={styles.bottomBar}>
        <TouchableOpacity style={styles.btn} activeOpacity={0.85} onPress={onNext}>
          <Text style={styles.btnText}>Next</Text>
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
}

const BLUE = "#2563EB";

const styles = StyleSheet.create({
  screen: {
    flex: 1,
    backgroundColor: "#fff",
  },

  // ── light blue-gray bg matching the screenshots ──
  imageArea: {
    width: SW,
    height: IMAGE_H,
    backgroundColor: "#E8EEF6",
    alignItems: "center",
    justifyContent: "center",
  },
  heroImage: {
    width: SW * 0.92,
    height: IMAGE_H * 0.92,
  },
  textArea: {
    paddingHorizontal: 28,
    paddingTop: 28,
    backgroundColor: "#fff",
    alignItems: "center",
  },
  title: {
    fontSize: 22,
    fontWeight: "800",
    color: "#1F2937",
    textAlign: "center",
    lineHeight: 32,
    marginBottom: 12,
  },
  desc: {
    fontSize: 14,
    color: "#64748b",
    textAlign: "center",
    lineHeight: 22,
  },

  // ── Dots ──
  dotsRow: {
    flexDirection: "row",
    justifyContent: "center",
    alignItems: "center",
    gap: 8,
    paddingVertical: 20,
    backgroundColor: "#fff",
  },
  dot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: "#CBD5E1",
  },
  dotActive: {
    width: 24,
    borderRadius: 4,
    backgroundColor: BLUE,
  },

  // ── Button ──
  bottomBar: {
    paddingHorizontal: 24,
    paddingBottom: 24,
    backgroundColor: "#fff",
  },
  btn: {
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
  btnText: {
    color: "#fff",
    fontSize: 16,
    fontWeight: "700",
  },
});
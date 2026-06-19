import { Ionicons } from "@expo/vector-icons";
import { useLocalSearchParams, useRouter } from "expo-router";
import React, { useRef, useState } from "react";
import {
  Dimensions,
  FlatList,
  Platform,
  SafeAreaView,
  StatusBar,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";

type Slide = {
  key: string;
  icon: any;
  tint: string;
  iconColor: string;
  title: string;
  desc: string;
};

const SLIDES: Slide[] = [
  {
    key: "shifts",
    icon: "location",
    tint: "#eff6ff",
    iconColor: "#2563EB",
    title: "Discover Flexible Medical Shifts Nearby",
    desc: "Find verified hospital duties that match your role, availability, and preferred location, all in real time.",
  },
  {
    key: "alerts",
    icon: "notifications",
    tint: "#fef2f2",
    iconColor: "#ef4444",
    title: "Get Notified About Urgent Requirements",
    desc: "Receive instant alerts for nearby emergency and scheduled shifts, and respond quickly with one tap.",
  },
  {
    key: "career",
    icon: "ribbon",
    tint: "#f0fdf4",
    iconColor: "#16a34a",
    title: "Build Your Healthcare Career with Confidence",
    desc: "Manage shifts, track your duty history, showcase verified credentials, and connect with trusted hospitals through Hospilink.",
  },
];

const { width: SCREEN_WIDTH } = Dimensions.get("window");

export default function OnboardingScreen() {
  const router = useRouter();
  const params = useLocalSearchParams();

  // Carried through from verify-otp so the profile screen can prefill.
  const prefillName = (Array.isArray(params.prefillName) ? params.prefillName[0] : params.prefillName) ?? "";
  const prefillEmail = (Array.isArray(params.prefillEmail) ? params.prefillEmail[0] : params.prefillEmail) ?? "";

  const listRef = useRef<FlatList<Slide>>(null);
  const indexRef = useRef(0);              // synchronous source of truth
  const [index, setIndex] = useState(0);   // only drives the dots

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
        params: { prefillName, prefillEmail },
      });
    }
  };

  // Keep ref + dots in sync when the user swipes by hand.
  const onMomentumEnd = (e: any) => {
    const i = Math.round(e.nativeEvent.contentOffset.x / SCREEN_WIDTH);
    indexRef.current = i;
    setIndex(i);
  };

  const renderItem = ({ item }: { item: Slide }) => (
    <View style={[styles.slide, { width: SCREEN_WIDTH }]}>
      {/* Replace this hero placeholder with your illustration:
          <Image source={require("../assets/Images/onboarding-1.png")}
                 style={styles.heroImage} resizeMode="contain" /> */}
      <View style={[styles.hero, { backgroundColor: item.tint }]}>
        <View style={[styles.heroCircle, { backgroundColor: "#fff" }]}>
          <Ionicons name={item.icon} size={64} color={item.iconColor} />
        </View>
      </View>

      <Text style={styles.title}>{item.title}</Text>
      <Text style={styles.desc}>{item.desc}</Text>
    </View>
  );

  return (
    <SafeAreaView style={styles.screen}>
      <StatusBar barStyle="dark-content" backgroundColor="#fff" />

      <FlatList
        ref={listRef}
        data={SLIDES}
        keyExtractor={(s) => s.key}
        renderItem={renderItem}
        horizontal
        pagingEnabled
        showsHorizontalScrollIndicator={false}
        onMomentumScrollEnd={onMomentumEnd}
        getItemLayout={(_, i) => ({
          length: SCREEN_WIDTH,
          offset: SCREEN_WIDTH * i,
          index: i,
        })}
      />

      {/* Dots */}
      <View style={styles.dots}>
        {SLIDES.map((_, i) => (
          <View key={i} style={[styles.dot, i === index ? styles.dotActive : null]} />
        ))}
      </View>

      {/* Next */}
      <View style={styles.bottomBar}>
        <TouchableOpacity
          style={styles.button}
          activeOpacity={0.85}
          onPress={onNext}
        >
          <Text style={styles.buttonText}>Next</Text>
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
}

const BLUE = "#2563EB";

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: "#fff" },
  slide: { flex: 1, paddingHorizontal: 28, paddingTop: 24, alignItems: "center" },
  hero: {
    width: "100%",
    height: 340,
    borderRadius: 20,
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 40,
  },
  heroImage: { width: "100%", height: 340, marginBottom: 40 },
  heroCircle: {
    width: 120,
    height: 120,
    borderRadius: 60,
    alignItems: "center",
    justifyContent: "center",
    ...Platform.select({
      web: { boxShadow: "0 8px 24px rgba(100,140,200,0.18)" } as any,
      default: {
        shadowColor: "#90a8cc",
        shadowOffset: { width: 0, height: 6 },
        shadowOpacity: 0.18,
        shadowRadius: 16,
        elevation: 4,
      },
    }),
  },
  title: {
    fontSize: 28,
    fontWeight: "800",
    color: "#1F2937",
    textAlign: "center",
    lineHeight: 36,
    marginBottom: 16,
  },
  desc: {
    fontSize: 15,
    color: "#64748b",
    textAlign: "center",
    lineHeight: 23,
    paddingHorizontal: 4,
  },
  dots: { flexDirection: "row", justifyContent: "center", alignItems: "center", gap: 8, marginBottom: 24 },
  dot: { width: 8, height: 8, borderRadius: 4, backgroundColor: "#cbd5e1" },
  dotActive: { width: 22, backgroundColor: BLUE },
  bottomBar: { paddingHorizontal: 28, paddingBottom: 24 },
  button: {
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
  buttonText: { color: "#fff", fontSize: 16, fontWeight: "700" },
});
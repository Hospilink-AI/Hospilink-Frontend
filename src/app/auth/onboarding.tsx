

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
const IMAGE_H = SH * 0.52;

// ─── Slide data ───────────────────────────────────────────────────────────────
type Slide = { key: string; image: any; title: string; desc: string };

const SLIDES: Slide[] = [
  {
    key: "shifts",
    image: require("../../../assets/Images/med1.png"),
    title: "Discover Flexible Medical\nShifts Nearby",
    desc: "Find verified hospital duties that match your role, availability, and preferred location — all in real time.",
  },
  {
    key: "alerts",
    image: require("../../../assets/Images/med2.png"),
    title: "Get Notified About Urgent\nRequirements",
    desc: "Receive instant alerts for nearby emergency and scheduled shifts, and respond quickly with one tap.",
  },
  {
    key: "career",
    image: require("../../../assets/Images/med3.png"),
    title: "Build Your Healthcare\nCareer with Confidence",
    desc: "Manage shifts, track your duty history, showcase verified credentials, and connect with trusted hospitals through Hospilink.",
  },
];

// ─── Single slide component ───────────────────────────────────────────────────
const SlideItem = ({ item }: { item: Slide }) => (
  <View style={{ width: SW }}>
    {/* top: light blue-gray illustration area */}
    <View style={styles.imageArea}>
      <Image source={item.image} style={styles.heroImage} resizeMode="contain" />
    </View>

    {/* bottom: white text area */}
    <View style={styles.textArea}>
      <Text style={styles.title}>{item.title}</Text>
      <Text style={styles.desc}>{item.desc}</Text>
    </View>
  </View>
);

// ─── Main screen ──────────────────────────────────────────────────────────────
export default function OnboardingScreen() {
  const router = useRouter();
  const params = useLocalSearchParams();

  const prefillName =
    (Array.isArray(params.prefillName) ? params.prefillName[0] : params.prefillName) ?? "";
  const prefillEmail =
    (Array.isArray(params.prefillEmail) ? params.prefillEmail[0] : params.prefillEmail) ?? "";
  const accountType =
    (Array.isArray(params.accountType) ? params.accountType[0] : params.accountType) ?? "";

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
        params: { prefillName, prefillEmail, accountType },
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
      <StatusBar barStyle="dark-content" backgroundColor="#EBF0F8" />

      {/* Slides */}
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

  // ── Slide ──
  imageArea: {
    width: SW,
    height: IMAGE_H,
    backgroundColor: "#fff",
    alignItems: "center",
    justifyContent: "center",
  },
  heroImage: {
    width: SW,
    height: IMAGE_H,
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
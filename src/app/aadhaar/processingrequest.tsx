import { Ionicons } from "@expo/vector-icons";
import React, { useEffect, useRef } from "react";
import {
    Animated,
    Image,
    Platform,
    SafeAreaView,
    StatusBar,
    StyleSheet,
    Text,
    TouchableOpacity,
    useWindowDimensions,
    View,
} from "react-native";

// ── Brand color (from Figma: #6B44FD) ────────────────────────────────────────
const BRAND = "#6B44FD";

// ── Image assets ─────────────────────────────────────────────────────────────
const HOSPILINK_LOGO = require("../../../assets/Images/Hospilink.png");
// Save the provided DigiLocker logo here (not digitlocker.png — that's Meri Pehchaan).
const DIGILOCKER_LOGO = require("../../../assets/Images/Digilocker.png");
// The two purple status-icon circles (white art baked into each image).
const ICON_DOCUMENT = require("../../../assets/Images/icon1.png");
const ICON_BANK = require("../../../assets/Images/icon2.png");

// ── Animated dashed connector ────────────────────────────────────────────────
const DASH_COUNT = 6;
const CYCLE = 1400;
const STEP = 130;

function DashTrail() {
    const anims = useRef(
        [...Array(DASH_COUNT)].map(() => new Animated.Value(0.3))
    ).current;

    useEffect(() => {
        const loops = anims.map((v, i) =>
            Animated.loop(
                Animated.sequence([
                    Animated.delay(i * STEP),
                    Animated.timing(v, { toValue: 1, duration: 280, useNativeDriver: true }),
                    Animated.timing(v, { toValue: 0.3, duration: 280, useNativeDriver: true }),
                    Animated.delay(CYCLE - 560 - i * STEP),
                ])
            )
        );
        loops.forEach((l) => l.start());
        return () => loops.forEach((l) => l.stop());
    }, [anims]);

    return (
        <View style={trail.row}>
            {anims.map((v, i) => (
                <Animated.View key={i} style={[trail.dash, { opacity: v }]} />
            ))}
        </View>
    );
}

const trail = StyleSheet.create({
    // flex:1 + space-between → dashes spread evenly across the gap between circles.
    row: {
        flex: 1,
        flexDirection: "row",
        alignItems: "center",
        justifyContent: "space-between",
        marginHorizontal: 12,
    },
    dash: {
        width: 26,
        height: 4,
        borderRadius: 2,
        backgroundColor: BRAND,
    },
});

// ── Main Screen ─────────────────────────────────────────────────────────────
export default function ProcessingRequest() {
    const { width } = useWindowDimensions();
    const isMobile = width <= 768;

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
            <View style={[s.body, isMobile && s.bodyMobile]}>
                <View style={[s.card, isMobile && s.cardMobile]}>
                    {/* DigiLocker logo */}
                    <Image
                        source={DIGILOCKER_LOGO}
                        style={s.digilockerLogo}
                        resizeMode="contain"
                    />

                    {/* Processing animation */}
                    <View style={s.processRow}>
                        <Image source={ICON_DOCUMENT} style={s.iconCircle} resizeMode="contain" />
                        <DashTrail />
                        <Image source={ICON_BANK} style={s.iconCircle} resizeMode="contain" />
                    </View>

                    {/* Status text */}
                    <Text style={s.statusText}>Processing your Request</Text>
                    <Text style={s.statusText}>please wait...</Text>
                </View>
            </View>
        </SafeAreaView>
    );
}

// ── Styles ───────────────────────────────────────────────────────────────────
const s = StyleSheet.create({
    safe: { flex: 1, backgroundColor: "#FFFFFF" },

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
    appBarLogoImg: { width: 132, height: 40 },
    helpBtn: {
        width: 40,
        height: 40,
        alignItems: "center",
        justifyContent: "center",
    },

    /* ── Body ── */
    body: {
        flex: 1,
        backgroundColor: "#F5F7FB",
        alignItems: "center",
        justifyContent: "center",
        padding: 24,
    },
    bodyMobile: { padding: 16 },

    /* ── Card (Figma "Rectangle 805": 517 × 381, radius 20) ── */
    card: {
        width: "100%",
        maxWidth: 517,
        height: 381,
        backgroundColor: "#FFFFFF",
        borderRadius: 20,
        paddingVertical: 34,
        paddingHorizontal: 40,
        alignItems: "center",
        justifyContent: "center",
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
    cardMobile: { borderRadius: 16, paddingHorizontal: 24 },

    /* ── DigiLocker logo ── */
    digilockerLogo: {
        width: 180,
        height: 50,
    },

    /* ── Processing row (391px Figma group) ── */
    processRow: {
        flexDirection: "row",
        alignItems: "center",
        width: "100%",
        maxWidth: 391,
        alignSelf: "center",
        marginTop: 30,
        marginBottom: 22,
    },
    iconCircle: {
        width: 50,
        height: 50,
    },

    /* ── Status text ── */
    statusText: {
        fontSize: 14,
        color: "#334155",
        textAlign: "center",
        lineHeight: 21,
    },
});
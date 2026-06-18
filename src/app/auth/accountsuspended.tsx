import { Ionicons } from "@expo/vector-icons";
import React from "react";
import {
    Image,
    Platform,
    SafeAreaView,
    ScrollView,
    StatusBar,
    StyleSheet,
    Text,
    TouchableOpacity,
    useWindowDimensions,
    View,
} from "react-native";

const BLUE = "#2563EB";

// ── Image assets ─────────────────────────────────────────────────────────────
const HOSPILINK_LOGO = require("../../../assets/Images/Hospilink.png");

// ── Main Screen ─────────────────────────────────────────────────────────────
export default function AccountSuspended() {
    const { width } = useWindowDimensions();
    const isMobile = width <= 768;

    return (
        <SafeAreaView style={s.safe}>
            <StatusBar barStyle="dark-content" backgroundColor="#FFFFFF" />

            {/* ── Top App Bar ── */}
            <View style={s.appBar}>
                <View style={s.appBarInner}>
                    <Image source={HOSPILINK_LOGO} style={s.appBarLogoImg} resizeMode="contain" />
                    <TouchableOpacity style={s.helpBtn} activeOpacity={0.7}>
                        <Ionicons name="help-circle-outline" size={26} color="#94A3B8" />
                    </TouchableOpacity>
                </View>
            </View>

            {/* ── Body ── */}
            <ScrollView
                style={s.scrollWrapper}
                contentContainerStyle={[s.scrollContent, isMobile && s.scrollContentMobile]}
                showsVerticalScrollIndicator={false}
            >
                <View style={[s.card, isMobile && s.cardMobile]}>
                    {/* Alert badge — Figma: 60×60, radius 36, #E54040 @ 20% */}
                    <View style={s.iconBadge}>
                        <Ionicons name="alert-circle-outline" size={34} color="#E54040" />
                    </View>

                    {/* Title */}
                    <Text style={s.title}>Your Account has been Suspended !</Text>

                    {/* Subtitle */}
                    <Text style={s.subtitle}>
                        Please contact <Text style={s.link}>Support</Text>
                    </Text>

                    {/* Back button */}
                    <TouchableOpacity style={s.backBtn} activeOpacity={0.7}>
                        <Text style={s.backText}>Back</Text>
                    </TouchableOpacity>
                </View>
            </ScrollView>
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
    helpBtn: { width: 40, height: 40, alignItems: "center", justifyContent: "center" },

    /* ── Scroll ── */
    scrollWrapper: { flex: 1, backgroundColor: "#F5F7FB" },
    scrollContent: {
        flexGrow: 1,
        alignItems: "center",
        justifyContent: "center",
        paddingVertical: 24,
        paddingHorizontal: 24,
    },
    scrollContentMobile: { paddingVertical: 20, paddingHorizontal: 16 },

    /* ── Card (Figma "Rectangle 805": 549 × 368, radius 20) ── */
    card: {
        width: "100%",
        maxWidth: 549,
        height: 368,
        backgroundColor: "#FFFFFF",
        borderRadius: 20,
        paddingHorizontal: 60,
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
    cardMobile: { borderRadius: 16, paddingHorizontal: 28 },

    /* ── Content ── */
    iconBadge: {
        width: 60,
        height: 60,
        borderRadius: 36,
        backgroundColor: "rgba(229, 64, 64, 0.2)",
        alignItems: "center",
        justifyContent: "center",
        marginBottom: 20,
    },
    title: {
        fontSize: 20,
        fontWeight: "800",
        color: "#0F172A",
        textAlign: "center",
        lineHeight: 28,
        marginBottom: 12,
    },
    subtitle: {
        fontSize: 13,
        color: "#64748B",
        textAlign: "center",
        marginBottom: 26,
    },
    link: { color: BLUE, fontWeight: "700" },

    /* ── Back button ── */
    backBtn: {
        width: "100%",
        height: 46,
        borderRadius: 8,
        borderWidth: 1,
        borderColor: "rgba(100, 116, 139, 0.2)",
        backgroundColor: "#F8FAFC",
        alignItems: "center",
        justifyContent: "center",
    },
    backText: { fontSize: 14, color: "#475569", fontWeight: "600" },
});
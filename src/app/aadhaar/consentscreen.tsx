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
    TouchableOpacity,
    useWindowDimensions,
    View,
} from "react-native";

const BLUE = "#2563EB";
const GREEN = "#1B8A3A";
const INK = "#1E293B";
const MUTED = "#64748B";
const LINE = "#EEF1F5";

const HOSPILINK_LOGO = require("../../../assets/Images/Hospilink.png");
const DIGILOCKER_LOGO = require("../../../assets/Images/Digilocker.png");

const CALENDAR_ICON = require("../../../assets/Images/calendaricon.png");
const DIGIDRIVE_ICON = require("../../../assets/Images/Digidrive.png");
const PURPOSE_ICON = require("../../../assets/Images/purposeicon.png");

// Checkbox 
function CheckBox({ checked, onPress, color = BLUE }: { checked: boolean; onPress: () => void; color?: string }) {
    return (
        <TouchableOpacity
            onPress={onPress}
            activeOpacity={0.7}
            hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
            style={[cb.box, checked && { backgroundColor: color, borderColor: color }]}
        >
            {checked && <Ionicons name="checkmark" size={13} color="#FFFFFF" />}
        </TouchableOpacity>
    );
}

const cb = StyleSheet.create({
    box: {
        width: 18,
        height: 18,
        borderRadius: 4,
        borderWidth: 1.5,
        borderColor: "#CBD5E1",
        backgroundColor: "#FFFFFF",
        alignItems: "center",
        justifyContent: "center",
    },
});

function Divider() {
    return <View style={s.divider} />;
}

// Main Screen 
export default function ConsentScreen() {
    const { width } = useWindowDimensions();
    const isMobile = width <= 768;

    const [issuedOpen, setIssuedOpen] = useState(true);
    const [aadhaar, setAadhaar] = useState(true);
    const [pan, setPan] = useState(false);
    const [drive, setDrive] = useState(false);
    const [purposeOpen, setPurposeOpen] = useState(false);

    const allIssued = aadhaar && pan;
    const toggleSelectAll = () => {
        const next = !allIssued;
        setAadhaar(next);
        setPan(next);
    };

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
                <View style={s.container}>
                    {/* Header: DigiLocker logo + verified shield */}
                    <View style={s.headerCard}>
                        <Image source={DIGILOCKER_LOGO} style={s.headerLogo} resizeMode="contain" />
                        <Ionicons name="shield-checkmark" size={28} color={GREEN} />
                    </View>

                    {/* Consent card */}
                    <View style={[s.card, isMobile && s.cardMobile]}>
                        {/* Intro */}
                        <Text style={s.intro}>
                            Please provide your consent to share the following with{" "}
                            <Text style={s.introBold}>Digital Onboarding</Text>:
                        </Text>

                        {/* Issued Document group */}
                        <View style={s.rowTop}>
                            <TouchableOpacity
                                style={s.rowLeft}
                                activeOpacity={0.7}
                                onPress={() => setIssuedOpen((v) => !v)}
                            >
                                <Ionicons
                                    name={issuedOpen ? "chevron-down" : "chevron-forward"}
                                    size={18}
                                    color={MUTED}
                                />
                                <Text style={s.rowTitle}>Issued Document (2)</Text>
                            </TouchableOpacity>
                            <View style={s.rowRight}>
                                <TouchableOpacity activeOpacity={0.7} onPress={toggleSelectAll}>
                                    <Text style={s.link}>Select all</Text>
                                </TouchableOpacity>
                                <CheckBox checked={allIssued} onPress={toggleSelectAll} />
                            </View>
                        </View>

                        {/* Issued Documents List */}
                        {issuedOpen && (
                            <View style={s.childGroup}>
                                <View style={s.childRow}>
                                    <Text style={s.childLabel}>Aadhaar Card ( [Aadhaar Redacted] )</Text>
                                    <CheckBox checked={aadhaar} onPress={() => setAadhaar((v) => !v)} color={GREEN} />
                                </View>
                                <View style={s.childRow}>
                                    <Text style={s.childLabel}>PAN Verification Record ( XXK6403J )</Text>
                                    <CheckBox checked={pan} onPress={() => setPan((v) => !v)} color={GREEN} />
                                </View>
                            </View>
                        )}

                        <Divider />

                        {/* DigiLocker Drive */}
                        <View style={s.row}>
                            <Image source={DIGIDRIVE_ICON} style={s.rowIconImg} resizeMode="contain" />
                            <Text style={[s.rowTitle, s.flex1]}>DigiLocker Drive</Text>
                            <CheckBox checked={drive} onPress={() => setDrive((v) => !v)} />
                        </View>

                        <Divider />

                        {/* Profile Information */}
                        <View style={s.row}>
                            <Ionicons name="person-outline" size={18} color={INK} style={s.rowIcon} />
                            <View style={s.flex1}>
                                <Text style={s.rowTitle}>Profile Information</Text>
                                <Text style={s.rowSub}>Name, Date of Birth, Gender</Text>
                            </View>
                        </View>

                        <Divider />

                        {/* Consent validity date */}
                        <View style={s.row}>
                            <Image source={CALENDAR_ICON} style={s.rowIconImg} resizeMode="contain" />
                            <View style={s.flex1}>
                                <Text style={s.rowTitle}>
                                    Consent validity date{" "}
                                    <Text style={s.rowSubInline}>(Today + 30 days)</Text>
                                </Text>
                                <Text style={s.rowSub}>12-Jul-2026</Text>
                            </View>
                            <TouchableOpacity style={s.editBtn} activeOpacity={0.7}>
                                <Text style={s.link}>Edit</Text>
                                <Ionicons name="pencil" size={13} color={BLUE} />
                            </TouchableOpacity>
                        </View>

                        <Divider />

                        {/* Purpose */}
                        <TouchableOpacity
                            style={s.row}
                            activeOpacity={0.7}
                            onPress={() => setPurposeOpen((v) => !v)}
                        >
                            <Image source={PURPOSE_ICON} style={s.rowIconImg} resizeMode="contain" />
                            <View style={s.flex1}>
                                <Text style={s.rowTitle}>Purpose</Text>
                                <Text style={s.rowSub}>Know your Customer</Text>
                            </View>
                            <Ionicons
                                name={purposeOpen ? "chevron-up" : "chevron-down"}
                                size={18}
                                color={MUTED}
                            />
                        </TouchableOpacity>

                        <Divider />

                        {/* Footer text */}
                        <Text style={s.footerText}>
                            Consent validity is subject to applicable laws.
                        </Text>
                        <Text style={s.footerText}>
                            By clicking 'Allow', you are giving consent to share with{" "}
                            <Text style={s.introBold}>Digital Onboarding</Text>.
                        </Text>

                        {/* Buttons */}
                        <View style={[s.btnRow, isMobile && s.btnRowMobile]}>
                            <TouchableOpacity style={[s.btn, s.denyBtn]} activeOpacity={0.8}>
                                <Text style={s.denyText}>Deny</Text>
                            </TouchableOpacity>
                            <TouchableOpacity style={[s.btn, s.allowBtn]} activeOpacity={0.85}>
                                <Text style={s.allowText}>Allow</Text>
                            </TouchableOpacity>
                        </View>
                    </View>
                </View>
            </ScrollView>
        </SafeAreaView>
    );
}

// Styles
const s = StyleSheet.create({
    safe: { flex: 1, backgroundColor: "#FFFFFF" },
    flex1: { flex: 1 },

    // App Bar 
    appBar: {
        height: 64,
        backgroundColor: "#FFFFFF",
        borderBottomWidth: 1,
        borderBottomColor: LINE,
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

    // Scroll / layout 
    scrollWrapper: { flex: 1, backgroundColor: "#F5F7FB" },
    scrollContent: { alignItems: "center", paddingVertical: 28, paddingHorizontal: 24 },
    scrollContentMobile: { paddingVertical: 18, paddingHorizontal: 14 },
    container: { width: "100%", maxWidth: 818 },

    // Header card 
    headerCard: {
        backgroundColor: "#FFFFFF",
        borderRadius: 12,
        paddingHorizontal: 24,
        paddingVertical: 16,
        flexDirection: "row",
        alignItems: "center",
        justifyContent: "space-between",
        marginBottom: 14,
        ...Platform.select({
            web: { boxShadow: "0 1px 6px rgba(100,116,139,0.06)" } as any,
            default: { elevation: 2 },
        }),
    },
    headerLogo: { width: 132, height: 34 },

    // Consent card 
    card: {
        backgroundColor: "#FFFFFF",
        borderRadius: 15,
        paddingHorizontal: 28,
        paddingVertical: 24,
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
    cardMobile: { paddingHorizontal: 18, borderRadius: 14 },

    // Intro 
    intro: { fontSize: 14, color: INK, lineHeight: 21, marginBottom: 14 },
    introBold: { fontWeight: "800", color: INK },

    // Rows 
    divider: { height: 1, backgroundColor: LINE },
    rowTop: {
        flexDirection: "row",
        alignItems: "center",
        justifyContent: "space-between",
        paddingVertical: 12,
    },
    rowLeft: { flexDirection: "row", alignItems: "center", gap: 8, flexShrink: 1 },
    rowRight: { flexDirection: "row", alignItems: "center", gap: 14 },
    row: { flexDirection: "row", alignItems: "center", paddingVertical: 14 },
    rowIcon: { marginRight: 12 },
    rowIconImg: { width: 18, height: 18, marginRight: 12 }, // new style for images
    rowTitle: { fontSize: 14, color: INK, fontWeight: "600" },
    rowSub: { fontSize: 12, color: MUTED, marginTop: 2 },
    rowSubInline: { fontSize: 12, color: MUTED, fontWeight: "400" },
    link: { fontSize: 13, color: BLUE, fontWeight: "600" },
    editBtn: { flexDirection: "row", alignItems: "center", gap: 4 },

    // Issued children
    childGroup: { paddingLeft: 26, paddingBottom: 8 },
    childRow: {
        flexDirection: "row",
        alignItems: "center",
        justifyContent: "space-between",
        paddingVertical: 9,
    },
    childLabel: { fontSize: 13, color: "#475569", flex: 1, paddingRight: 12 },

    // Footer 
    footerText: { fontSize: 12, color: MUTED, lineHeight: 19, marginTop: 12 },

    // Buttons
    btnRow: {
        flexDirection: "row",
        justifyContent: "space-between",
        gap: 16,
        marginTop: 22,
    },
    btnRowMobile: { flexDirection: "column-reverse" },
    btn: { flex: 1, height: 46, borderRadius: 8, alignItems: "center", justifyContent: "center" },
    denyBtn: { backgroundColor: "#FFFFFF", borderWidth: 1.5, borderColor: "#CBD5E1" },
    denyText: { fontSize: 15, fontWeight: "700", color: BLUE },
    allowBtn: { backgroundColor: BLUE },
    allowText: { fontSize: 15, fontWeight: "700", color: "#FFFFFF" },
});
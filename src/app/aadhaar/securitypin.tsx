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

// Main Screen 
export default function SecurityPin() {
    const { width } = useWindowDimensions();
    const isMobile = width <= 768;

    const [pin, setPin] = useState("");
    const [showPin, setShowPin] = useState(false);

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
                    <Text style={s.cardTitle}>
                        You are already registered with DigiLocker.
                    </Text>

                    {/* Subtitle */}
                    <Text style={s.cardSubtitle}>
                        Please enter your 6 digit DigiLocker Security PIN
                    </Text>

                    {/* PIN Input */}
                    <View style={s.inputWrap}>
                        <TextInput
                            style={s.input}
                            value={pin}
                            onChangeText={setPin}
                            keyboardType="number-pad"
                            maxLength={6}
                            secureTextEntry={!showPin}
                            autoFocus
                        />
                        <TouchableOpacity
                            style={s.eyeBtn}
                            onPress={() => setShowPin((v) => !v)}
                            activeOpacity={0.7}
                            hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
                        >
                            <Ionicons
                                name={showPin ? "eye-outline" : "eye-off-outline"}
                                size={20}
                                color="#475569"
                            />
                        </TouchableOpacity>
                    </View>

                    {/* Forgot Security PIN link */}
                    <TouchableOpacity activeOpacity={0.7} style={s.forgotWrap}>
                        <Text style={s.forgotLink}>Forgot Security PIN?</Text>
                    </TouchableOpacity>

                    {/* Continue Button */}
                    <TouchableOpacity style={s.continueBtn} activeOpacity={0.85}>
                        <Text style={s.continueBtnText}>Continue</Text>
                    </TouchableOpacity>
                </View>
            </ScrollView>
        </SafeAreaView>
    );
}

// Styles 
const s = StyleSheet.create({
    safe: {
        flex: 1,
        backgroundColor: "#FFFFFF",
    },

    // App Bar 
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

    // Scroll
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

    // Card 
    card: {
        width: "100%",
        maxWidth: 460,
        backgroundColor: "#FFFFFF",
        borderRadius: 20,
        paddingVertical: 32,
        paddingHorizontal: 44,
        // Drop shadow: X 4, Y 4, Blur 25.3, Spread 0, #64748B @ 7%
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
        paddingVertical: 28,
        paddingHorizontal: 24,
        borderRadius: 16,
    },

    // Card Content 
    cardTitle: {
        fontSize: 20,
        fontWeight: "800",
        color: "#0F172A",
        textAlign: "center",
        lineHeight: 27,
        marginBottom: 10,
    },
    cardSubtitle: {
        fontSize: 12,
        color: "#64748B",
        textAlign: "center",
        marginBottom: 22,
    },

    // PIN Input 
    inputWrap: {
        flexDirection: "row",
        alignItems: "center",
        borderWidth: 1,
        borderColor: "#D1D5DB",
        borderRadius: 8,
        backgroundColor: "#FFFFFF",
        paddingHorizontal: 16,
        height: 48,
        marginBottom: 12,
    },
    input: {
        flex: 1,
        fontSize: 16,
        color: "#0F172A",
        height: "100%",
        letterSpacing: 4,
        ...(Platform.OS === "web" ? { outlineStyle: "none" } as any : {}),
    },
    eyeBtn: {
        paddingLeft: 8,
    },

    // Forgot PIN 
    forgotWrap: {
        alignSelf: "flex-start",
        marginBottom: 24,
    },
    forgotLink: {
        fontSize: 13,
        color: "#2563EB",
        fontWeight: "600",
    },

    // Continue Button 
    continueBtn: {
        width: "100%",
        height: 48,
        backgroundColor: "#16A34A",
        borderRadius: 8,
        alignItems: "center",
        justifyContent: "center",
    },
    continueBtnText: {
        color: "#FFFFFF",
        fontSize: 16,
        fontWeight: "700",
        letterSpacing: 0.3,
    },
});
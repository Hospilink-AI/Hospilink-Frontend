import React, { useState } from "react";
import {
    View,
    Text,
    StyleSheet,
    TouchableOpacity,
    ScrollView,
    TextInput,
    Dimensions,
    StatusBar,
} from "react-native";
import { useRouter } from "expo-router";
import Svg, {
    Path,
    Rect,
    Circle,
    Polyline,
} from "react-native-svg";

const NAVY = "#16233B";
const TEXT = "#1E293B";
const MUTED = "#64748B";
const BORDER = "#E2E8F0";
const BG = "#F8FAFC";

const { width } = Dimensions.get("window");

const isDesktop = width >= 1000;

const faqs = [
    "What services does Hospilink provide?",
    "Who can use Hospilink?",
    "How does Hospilink verify medical professionals?",
    "Is my personal and professional information secure?",
    "Is there a registration fee to join Hospilink?",
];

const LinkIcon = () => (
    <Svg width={34} height={34} viewBox="0 0 24 24" fill="none">
        <Path
            d="M10 13a5 5 0 0 0 7.54.54l3-3a5 5 0 0 0-7.07-7.07l-1.72 1.71"
            stroke="#2D8CFF"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
        />
        <Path
            d="M14 11a5 5 0 0 0-7.54-.54l-3 3a5 5 0 0 0 7.07 7.07l1.71-1.71"
            stroke="#2D8CFF"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
        />
    </Svg>
);

const ChevronDown = ({ open }: { open: boolean }) => (
    <Svg
        width={18}
        height={18}
        viewBox="0 0 24 24"
        fill="none"
        style={{
            transform: [{ rotate: open ? "180deg" : "0deg" }],
        }}
    >
        <Polyline
            points="6 9 12 15 18 9"
            stroke="#475569"
            strokeWidth="2"
            strokeLinecap="round"
        />
    </Svg>
);

export default function ContactUsPage() {
    const router = useRouter();

    const [openFaq, setOpenFaq] = useState<number | null>(null);

    return (
        <View style={styles.root}>
            <StatusBar
                barStyle="dark-content"
                backgroundColor="#fff"
            />

            <ScrollView
                showsVerticalScrollIndicator={false}
            >
                {/* NAVBAR */}

                <View style={styles.navbar}>
                    <View style={styles.container}>
                        <View style={styles.navInner}>
                            {/* LOGO */}

                            <TouchableOpacity style={styles.logoRow}
                                    onPress={() =>
                                        router.push("/auth/home")
                                    }
                                >
                                    <View style={styles.logoText}>
                                        <LinkIcon />
                                    </View>

                                    <Text style={styles.logoText}>
                                        HOSPILINK
                                    </Text>
                                </TouchableOpacity>

                            {/* MENU */}

                            <View style={styles.menu}>
                                {[
                                    "Features",
                                    "Solution",
                                    "Pricing",
                                    "Company",
                                ].map((item, i) => (
                                    <TouchableOpacity key={i}>
                                        <Text style={styles.menuText}>
                                            {item}
                                        </Text>
                                    </TouchableOpacity>
                                ))}
                            </View>

                            {/* BUTTON */}

                            <TouchableOpacity onPress={() =>
                                router.push("/auth/login")
                            }
                                style={styles.signBtn}
                            >
                                <Text style={styles.signBtnText}>
                                    Sign In
                                </Text>
                            </TouchableOpacity>
                        </View>
                    </View>
                </View>

                {/* CONTACT SECTION */}

                <View style={styles.contactWrapper}>
                    <View style={styles.container}>
                        <View style={styles.contactGrid}>
                            {/* LEFT */}

                            <View style={styles.left}>
                                <Text style={styles.smallTitle}>
                                    Contact Us
                                </Text>

                                <Text style={styles.mainTitle}>
                                    Get in Touch with Hospilink
                                </Text>

                                <Text style={styles.description}>
                                    We're here to help hospitals and
                                    healthcare professionals with
                                    seamless staffing and workforce
                                    management solutions. Reach out to
                                    our team for support, inquiries, or
                                    partnerships.
                                </Text>

                                {/* INFO */}

                                <View style={styles.infoBlock}>
                                    <Text style={styles.infoHeading}>
                                        Contact Information
                                    </Text>

                                    {/* GENERAL */}

                                    <View style={styles.infoItem}>
                                        <Text style={styles.infoTitle}>
                                            General Inquiries
                                        </Text>

                                        <Text style={styles.infoDesc}>
                                            For platform information,
                                            partnerships, or general
                                            support.
                                        </Text>

                                        <Text style={styles.infoEmail}>
                                            Email: info@hospilink.com
                                        </Text>

                                        <Text style={styles.infoPhone}>
                                            Phone: +91 XXXXXX XXXXX
                                        </Text>
                                    </View>

                                    {/* SUPPORT */}

                                    <View style={styles.infoItem}>
                                        <Text style={styles.infoTitle}>
                                            Support Team
                                        </Text>

                                        <Text style={styles.infoDesc}>
                                            Need help with your account,
                                            scheduling, or platform access?
                                        </Text>

                                        <Text style={styles.infoEmail}>
                                            Email:
                                            hospitals@hospilink.com
                                        </Text>
                                    </View>

                                    {/* ADDRESS */}

                                    <View style={styles.infoItem}>
                                        <Text style={styles.infoTitle}>
                                            Office Address
                                        </Text>

                                        <Text style={styles.infoEmail}>
                                            Hospilink
                                        </Text>

                                        <Text style={styles.infoDesc}>
                                            Mumbai, Maharashtra, India
                                        </Text>
                                    </View>
                                </View>
                            </View>

                            {/* RIGHT */}

                            <View style={styles.right}>
                                <View style={styles.form}>
                                    <TextInput
                                        placeholder="Name"
                                        placeholderTextColor="#64748B"
                                        style={styles.input}
                                    />

                                    <TextInput
                                        placeholder="Email"
                                        placeholderTextColor="#64748B"
                                        style={styles.input}
                                    />

                                    {/* PHONE */}

                                    <View style={styles.phoneRow}>
                                        <TouchableOpacity
                                            style={styles.countryBox}
                                        >
                                            <Text
                                                style={
                                                    styles.countryText
                                                }
                                            >
                                                India
                                            </Text>

                                            <Text
                                                style={
                                                    styles.dropdownIcon
                                                }
                                            >
                                                ˅
                                            </Text>
                                        </TouchableOpacity>

                                        <TextInput
                                            placeholder="+91 000 000 0000"
                                            placeholderTextColor="#64748B"
                                            style={styles.phoneInput}
                                        />
                                    </View>

                                    <TextInput
                                        placeholder="Job Title"
                                        placeholderTextColor="#64748B"
                                        style={styles.input}
                                    />

                                    <TextInput
                                        placeholder="Organization / Hospital Name"
                                        placeholderTextColor="#64748B"
                                        style={styles.input}
                                    />

                                    <TextInput
                                        placeholder="Message"
                                        placeholderTextColor="#64748B"
                                        style={[
                                            styles.input,
                                            styles.messageInput,
                                        ]}
                                        multiline
                                    />

                                    <TouchableOpacity
                                        style={styles.submitBtn}
                                    >
                                        <Text
                                            style={styles.submitText}
                                        >
                                            Submit
                                        </Text>
                                    </TouchableOpacity>
                                </View>
                            </View>
                        </View>
                    </View>
                </View>

                {/* FAQ */}

                <View style={styles.faqSection}>
                    <View style={styles.container}>
                        <View style={styles.faqGrid}>
                            {/* LEFT */}

                            <View style={styles.faqLeft}>
                                {faqs.map((faq, i) => (
                                    <View
                                        key={i}
                                        style={styles.faqItem}
                                    >
                                        <TouchableOpacity
                                            style={styles.faqBtn}
                                            onPress={() =>
                                                setOpenFaq(
                                                    openFaq === i
                                                        ? null
                                                        : i
                                                )
                                            }
                                        >
                                            <Text
                                                style={
                                                    styles.faqQuestion
                                                }
                                            >
                                                {faq}
                                            </Text>

                                            <ChevronDown
                                                open={
                                                    openFaq === i
                                                }
                                            />
                                        </TouchableOpacity>

                                        {openFaq === i && (
                                            <Text
                                                style={
                                                    styles.faqAnswer
                                                }
                                            >
                                                Hospilink provides
                                                healthcare staffing
                                                solutions for hospitals
                                                and professionals.
                                            </Text>
                                        )}
                                    </View>
                                ))}
                            </View>

                            {/* RIGHT */}

                            <View style={styles.faqRight}>
                                <Text style={styles.faqTitle}>
                                    Frequently Asked Questions
                                </Text>

                                <Text style={styles.faqDesc}>
                                    Find answers to common
                                    questions about Hospilink,
                                    healthcare staffing, account
                                    management, and platform
                                    services.
                                </Text>
                            </View>
                        </View>
                    </View>
                </View>

                {/* FOOTER */}

                <View style={styles.footer}>
                    <View style={styles.footerCurve} />

                    <View style={styles.container}>
                        <View style={styles.footerGrid}>
                            {/* BRAND */}

                            <View style={styles.footerBrand}>
                                <TouchableOpacity style={styles.logoRow}
                                    onPress={() =>
                                        router.push("/auth/home")
                                    }
                                >
                                    <View style={styles.logoText}>
                                        <LinkIcon />
                                    </View>

                                    <Text style={styles.logoText}>
                                        HOSPILINK
                                    </Text>
                                </TouchableOpacity>
                                <Text style={styles.footerBrandText}>
                                    Connect with us for seamless
                                    healthcare staffing solutions
                                    and opportunities.
                                </Text>
                            </View>

                            {/* LINKS */}

                            <View>
                                <Text style={styles.footerHead}>
                                    For Hospitals
                                </Text>

                                {[
                                    "Post Duties",
                                    "Find Staff",
                                    "Manage Schedules",
                                ].map((item, i) => (
                                    <Text
                                        key={i}
                                        style={styles.footerLink}
                                    >
                                        {item}
                                    </Text>
                                ))}
                            </View>

                            <View>
                                <Text style={styles.footerHead}>
                                    For Medical Staff
                                </Text>

                                {[
                                    "Find Opportunities",
                                    "Manage Availability",
                                    "Track Earnings",
                                ].map((item, i) => (
                                    <Text
                                        key={i}
                                        style={styles.footerLink}
                                    >
                                        {item}
                                    </Text>
                                ))}
                            </View>

                            <View>
                                <Text style={styles.footerHead}>
                                    Support
                                </Text>

                                <TouchableOpacity
                                    onPress={() =>
                                        router.push(
                                            "/auth/contact-us"
                                        )
                                    }
                                >
                                    <Text
                                        style={styles.footerLink}
                                    >
                                        Contact Us
                                    </Text>
                                </TouchableOpacity>

                                <TouchableOpacity
                                    onPress={() =>
                                        router.push(
                                            "/auth/privacy-policy"
                                        )
                                    }
                                >
                                    <Text
                                        style={styles.footerLink}
                                    >
                                        Privacy Policy
                                    </Text>
                                </TouchableOpacity>
                            </View>
                        </View>

                        {/* BOTTOM */}

                        <View style={styles.bottomBar}>
                            <Text style={styles.copy}>
                                © 2025 Hospilink. All rights
                                reserved.
                            </Text>

                            <Text style={styles.copy}>
                                Privacy Policy
                            </Text>
                        </View>
                    </View>
                </View>
            </ScrollView>
        </View>
    );
}

const styles = StyleSheet.create({
    root: {
        flex: 1,
        backgroundColor: BG,
    },

    container: {
        width: "100%",
        maxWidth: 1280,
        alignSelf: "center",
        paddingHorizontal: 50,
    },

    /* NAVBAR */

    navbar: {
        height: 86,
        backgroundColor: "#fff",
        borderBottomWidth: 1,
        borderBottomColor: BORDER,
        justifyContent: "center",
    },

    navInner: {
        flexDirection: "row",
        alignItems: "center",
        justifyContent: "space-between",
    },

    logoRow: {
        flexDirection: "row",
        alignItems: "center",
    },

    logoText: {
        fontSize: 24,
        fontWeight: "400",
        color: "#2D8CFF",
        marginLeft: 10,
        letterSpacing: 0.5,
    },

    menu: {
        flexDirection: "row",
        alignItems: "center",
    },

    menuText: {
        fontSize: 17,
        color: TEXT,
        marginHorizontal: 22,
        fontWeight: "500",
    },

    signBtn: {
        backgroundColor: NAVY,
        paddingHorizontal: 34,
        paddingVertical: 14,
        borderRadius: 10,
    },

    signBtnText: {
        color: "#fff",
        fontWeight: "600",
        fontSize: 18,
    },

    /* CONTACT */

    contactWrapper: {
        paddingTop: 80,
        paddingBottom: 120,
    },

    contactGrid: {
        flexDirection: isDesktop
            ? "row"
            : "column",
    },

    left: {
        flex: 1,
        paddingRight: isDesktop ? 70 : 0,
    },

    right: {
        flex: 1,
        borderLeftWidth: isDesktop ? 1 : 0,
        borderLeftColor: BORDER,
        paddingLeft: isDesktop ? 70 : 0,
        marginTop: isDesktop ? 0 : 60,
    },

    smallTitle: {
        fontSize: 16,
        color: TEXT,
        marginBottom: 30,
    },

    mainTitle: {
        fontSize: 54,
        lineHeight: 60,
        color: TEXT,
        fontWeight: "700",
        marginBottom: 20,
        maxWidth: 500,
    },

    description: {
        fontSize: 18,
        lineHeight: 34,
        color: MUTED,
        maxWidth: 560,
        marginBottom: 55,
    },

    infoBlock: {},

    infoHeading: {
        fontSize: 20,
        fontWeight: "700",
        color: TEXT,
        marginBottom: 24,
    },

    infoItem: {
        marginBottom: 34,
    },

    infoTitle: {
        fontSize: 17,
        fontWeight: "700",
        color: TEXT,
        marginBottom: 10,
    },

    infoDesc: {
        fontSize: 15,
        color: MUTED,
        lineHeight: 28,
        marginBottom: 8,
        maxWidth: 430,
    },

    infoEmail: {
        fontSize: 15,
        color: TEXT,
        marginBottom: 8,
        fontWeight: "500",
    },

    infoPhone: {
        fontSize: 15,
        color: TEXT,
    },

    /* FORM */

    form: {},

    input: {
        height: 70,
        borderBottomWidth: 1,
        borderBottomColor: BORDER,
        fontSize: 18,
        color: TEXT,
        marginBottom: 8,
    },

    phoneRow: {
        flexDirection: "row",
        alignItems: "center",
    },

    countryBox: {
        width: 160,
        height: 70,
        borderBottomWidth: 1,
        borderBottomColor: BORDER,
        flexDirection: "row",
        alignItems: "center",
        justifyContent: "space-between",
        paddingRight: 10,
    },

    countryText: {
        fontSize: 18,
        color: TEXT,
    },

    dropdownIcon: {
        fontSize: 18,
        color: TEXT,
    },

    phoneInput: {
        flex: 1,
        height: 70,
        borderBottomWidth: 1,
        borderBottomColor: BORDER,
        marginLeft: 24,
        fontSize: 18,
        color: TEXT,
    },

    messageInput: {
        height: 90,
        textAlignVertical: "top",
        paddingTop: 20,
    },

    submitBtn: {
        width: 140,
        height: 54,
        backgroundColor: NAVY,
        borderRadius: 10,
        justifyContent: "center",
        alignItems: "center",
        marginTop: 32,
    },

    submitText: {
        color: "#fff",
        fontSize: 20,
        fontWeight: "600",
    },

    /* FAQ */

    faqSection: {
        paddingBottom: 120,
    },

    faqGrid: {
        flexDirection: isDesktop
            ? "row"
            : "column",
    },

    faqLeft: {
        flex: 1,
        paddingRight: isDesktop ? 80 : 0,
    },

    faqRight: {
        width: isDesktop ? 420 : "100%",
        marginTop: isDesktop ? 0 : 50,
    },

    faqTitle: {
        fontSize: 54,
        lineHeight: 60,
        color: TEXT,
        fontWeight: "700",
        marginBottom: 26,
        textAlign: "center",
    },

    faqDesc: {
        fontSize: 18,
        lineHeight: 34,
        color: MUTED,
        textAlign: "center",
    },

    faqItem: {
        borderBottomWidth: 1,
        borderBottomColor: BORDER,
    },

    faqBtn: {
        height: 86,
        flexDirection: "row",
        justifyContent: "space-between",
        alignItems: "center",
    },

    faqQuestion: {
        fontSize: 18,
        color: TEXT,
    },

    faqAnswer: {
        fontSize: 16,
        lineHeight: 30,
        color: MUTED,
        paddingBottom: 24,
        maxWidth: 800,
    },

    /* FOOTER */

    footer: {
        backgroundColor: NAVY,
        paddingTop: 140,
        paddingBottom: 40,
        position: "relative",
        overflow: "hidden",
    },

    footerCurve: {
        position: "absolute",
        top: -140,
        left: -200,
        right: -200,
        height: 260,
        backgroundColor: BG,
        borderBottomLeftRadius: 1000,
        borderBottomRightRadius: 1000,
    },

    footerGrid: {
        flexDirection: isDesktop
            ? "row"
            : "column",
        justifyContent: "space-between",
        paddingBottom: 60,
        borderBottomWidth: 1,
        borderBottomColor:
            "rgba(255,255,255,0.15)",
    },

    footerBrand: {
        maxWidth: 280,
    },

    footerBrandText: {
        fontSize: 15,
        lineHeight: 30,
        color: "#CBD5E1",
        marginTop: 20,
    },

    footerHead: {
        color: "#fff",
        fontSize: 18,
        fontWeight: "700",
        marginBottom: 22,
    },

    footerLink: {
        color: "#E2E8F0",
        fontSize: 15,
        marginBottom: 16,
    },

    bottomBar: {
        flexDirection: "row",
        justifyContent: "space-between",
        alignItems: "center",
        paddingTop: 30,
    },

    copy: {
        color: "#CBD5E1",
        fontSize: 14,
    },
});
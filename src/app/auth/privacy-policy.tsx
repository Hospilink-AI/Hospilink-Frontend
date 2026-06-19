import React from 'react';
import {
    View,
    Text,
    ScrollView,
    StyleSheet,
    TouchableOpacity,
    Linking,
    Platform,
} from 'react-native';
import { useRouter } from "expo-router";
import Svg, {
    Path,
    Rect,
    Circle,
    Polyline,
} from "react-native-svg";

// ─── Types ────────────────────────────────────────────────────────────────────
interface SectionProps {
    title: string;
    children: React.ReactNode;
}

interface BulletListProps {
    items: string[];
}

interface SubSectionProps {
    title: string;
    children: React.ReactNode;
}

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

// ─── Reusable Components ──────────────────────────────────────────────────────

function BulletList({ items }: BulletListProps) {
    return (
        <View style={styles.bulletList}>
            {items.map((item, index) => (
                <View key={index} style={styles.bulletRow}>
                    <Text style={styles.bullet}>•</Text>
                    <Text style={styles.bulletText}>{item}</Text>
                </View>
            ))}
        </View>
    );
}

function Section({ title, children }: SectionProps) {
    return (
        <View style={styles.section}>
            <Text style={styles.sectionTitle}>{title}</Text>
            {children}
        </View>
    );
}

function SubSection({ title, children }: SubSectionProps) {
    return (
        <View style={styles.subSection}>
            <Text style={styles.subSectionTitle}>{title}</Text>
            {children}
        </View>
    );
}

// ─── Header / Nav ─────────────────────────────────────────────────────────────
function NavBar() {
    const router = useRouter();
    return (
        <View style={styles.navbar}>
            <View style={styles.navLeft}>
                <TouchableOpacity style={styles.logoRow}
                    onPress={() =>
                        router.push("/auth/home")
                    }
                >
                    <View >
                        <LinkIcon />
                    </View>

                    <Text style={styles.logoText}>
                        HOSPILINK
                    </Text>
                </TouchableOpacity>
            </View>
            <View style={styles.navLinks}>
                {['Features', 'Solution', 'Pricing', 'Company'].map(link => (
                    <TouchableOpacity key={link}>
                        <Text style={styles.navLink}>{link}</Text>
                    </TouchableOpacity>
                ))}
            </View>
            <TouchableOpacity onPress={() =>
                                router.push({ pathname: "/auth/login", params: { tab: "signin" } })
                            } style={styles.signInBtn}>
                <Text style={styles.signInBtnText}>Sign In</Text>
            </TouchableOpacity>
        </View>
    );
}

// ─── Footer ───────────────────────────────────────────────────────────────────
function Footer() {
    return (
        <View style={styles.footer}>
            <View style={styles.footerTop}>
                {/* Brand col */}
                <View style={styles.footerBrandCol}>
                    <View style={styles.footerLogoRow}>
                        <Text style={styles.footerLogoIcon}>🌿</Text>
                        <Text style={styles.footerLogoText}>HOSPILINK</Text>
                    </View>
                    <Text style={styles.footerTagline}>
                        Connect with us for seamless healthcare{'\n'}staffing solutions and opportunities.
                    </Text>
                </View>

                {/* For Hospitals */}
                <View style={styles.footerCol}>
                    <Text style={styles.footerColTitle}>For Hospitals</Text>
                    {['Post Duties', 'Find Staff', 'Manage Schedules'].map(item => (
                        <TouchableOpacity key={item}>
                            <Text style={styles.footerColLink}>{item}</Text>
                        </TouchableOpacity>
                    ))}
                </View>

                {/* For Medical Staff */}
                <View style={styles.footerCol}>
                    <Text style={styles.footerColTitle}>For Medical Staff</Text>
                    {['Find Opportunities', 'Manage Availability', 'Track Earnings'].map(item => (
                        <TouchableOpacity key={item}>
                            <Text style={styles.footerColLink}>{item}</Text>
                        </TouchableOpacity>
                    ))}
                </View>

                {/* Support */}
                <View style={styles.footerCol}>
                    <Text style={styles.footerColTitle}>Support</Text>
                    {['Help Center', 'Contact Us'].map(item => (
                        <TouchableOpacity key={item}>
                            <Text style={styles.footerColLink}>{item}</Text>
                        </TouchableOpacity>
                    ))}
                </View>
            </View>

            <View style={styles.footerDivider} />

            <View style={styles.footerBottom}>
                <Text style={styles.footerCopyright}>© 2025 Hospilink. All rights reserved.</Text>
                <TouchableOpacity>
                    <Text style={styles.footerPrivacyLink}>Privacy Policy</Text>
                </TouchableOpacity>
                {/* Social icons placeholder */}
                <View style={styles.footerSocials}>
                    {['f', 'in', 'tw', 'yt'].map(s => (
                        <View key={s} style={styles.socialIcon}>
                            <Text style={styles.socialIconText}>{s}</Text>
                        </View>
                    ))}
                </View>
            </View>
        </View>
    );
}

// ─── Main Screen ──────────────────────────────────────────────────────────────
export default function PrivacyPolicyScreen() {
    return (
        <View style={styles.root}>
            <NavBar />
            <ScrollView
                style={styles.scrollView}
                contentContainerStyle={styles.scrollContent}
                showsVerticalScrollIndicator={false}
            >
                {/* Page Title */}
                <Text style={styles.pageTitle}>Privacy Policy</Text>

                {/* Effective Date block */}
                <View style={styles.effectiveBlock}>
                    <Text style={styles.effectiveTitle}>Privacy Policy</Text>
                    <Text style={styles.effectiveDate}>Effective Date: 13 April, 2026</Text>
                    <Text style={styles.bodyText}>
                        At Hospilink, we value your privacy and are committed to protecting your personal information. This Privacy Policy explains how we collect, use, store, and safeguard your information when you use our platform and services.
                    </Text>
                    <Text style={[styles.bodyText, { marginTop: 10 }]}>
                        By accessing or using Hospilink, you agree to the practices described in this Privacy Policy.
                    </Text>
                </View>

                {/* Section 1 */}
                <Section title="1. Information We Collect">
                    <Text style={styles.bodyText}>We may collect the following types of information:</Text>

                    <SubSection title="Personal Information">
                        <BulletList
                            items={[
                                'Full name',
                                'Email address',
                                'Phone number',
                                'Profile photo',
                                'Address and location details',
                                'Professional qualifications and certifications',
                                'Government-issued identification (if required for verification)',
                            ]}
                        />
                    </SubSection>

                    <SubSection title="Professional Information">
                        <Text style={styles.bodyText}>For medical staff and healthcare professionals:</Text>
                        <BulletList
                            items={[
                                'Medical licenses and registration details',
                                'Work experience and specialization',
                                'Availability and scheduling preferences',
                                'Employment history',
                            ]}
                        />
                        <Text style={[styles.bodyText, { marginTop: 10 }]}>
                            For hospitals and healthcare organizations:
                        </Text>
                        <BulletList
                            items={[
                                'Hospital or organization details',
                                'Staffing requirements',
                                'Billing and payment information',
                            ]}
                        />
                    </SubSection>

                    <SubSection title="Technical Information">
                        <BulletList
                            items={[
                                'IP address',
                                'Browser type and device information',
                                'Login activity',
                                'Cookies and usage analytics',
                            ]}
                        />
                    </SubSection>
                </Section>

                {/* Section 2 */}
                <Section title="2. How We Use Your Information">
                    <Text style={styles.bodyText}>Hospilink uses your information to:</Text>
                    <BulletList
                        items={[
                            'Create and manage user accounts',
                            'Match hospitals with qualified medical professionals',
                            'Verify credentials and professional qualifications',
                            'Facilitate communication between users',
                            'Improve platform functionality and user experience',
                            'Process payments and invoices',
                            'Send notifications, updates, and service-related communications',
                            'Maintain platform security and prevent fraud',
                        ]}
                    />
                </Section>

                {/* Section 3 */}
                <Section title="3. Information Sharing">
                    <Text style={styles.bodyText}>We do not sell your personal information.</Text>
                    <Text style={[styles.bodyText, { marginTop: 6 }]}>
                        We may share information in the following situations:
                    </Text>

                    <SubSection title="With Hospitals and Medical Professionals">
                        <Text style={styles.bodyText}>
                            Relevant profile and professional information may be shared to facilitate staffing and recruitment processes.
                        </Text>
                    </SubSection>

                    <SubSection title="Service Providers">
                        <Text style={styles.bodyText}>
                            We may share information with trusted third-party vendors who assist with:
                        </Text>
                        <BulletList
                            items={[
                                'Hosting services',
                                'Payment processing',
                                'Analytics',
                                'Communication services',
                            ]}
                        />
                    </SubSection>

                    <SubSection title="Legal Requirements">
                        <Text style={styles.bodyText}>
                            We may disclose information if required by law, regulation, legal process, or governmental request.
                        </Text>
                    </SubSection>
                </Section>

                {/* Section 4 */}
                <Section title="4. Data Security">
                    <Text style={styles.bodyText}>
                        We implement appropriate technical and organizational security measures to protect your information from unauthorized access, misuse, loss, or disclosure.
                    </Text>
                    <Text style={[styles.bodyText, { marginTop: 6 }]}>
                        However, no method of electronic storage or internet transmission is completely secure, and we cannot guarantee absolute security.
                    </Text>
                </Section>

                {/* Section 5 */}
                <Section title="5. Data Retention">
                    <Text style={styles.bodyText}>
                        We retain your information only for as long as necessary to:
                    </Text>
                    <BulletList
                        items={[
                            'Provide services',
                            'Fulfill legal obligations',
                            'Resolve disputes',
                            'Enforce agreements',
                        ]}
                    />
                    <Text style={[styles.bodyText, { marginTop: 10 }]}>
                        Users may request deletion of their accounts, subject to applicable legal and operational requirements.
                    </Text>
                </Section>

                {/* Section 6 */}
                <Section title="6. Cookies and Tracking Technologies">
                    <Text style={styles.bodyText}>
                        Hospilink may use cookies and similar technologies to:
                    </Text>
                    <BulletList
                        items={[
                            'Improve website performance',
                            'Remember user preferences',
                            'Analyze traffic and usage patterns',
                            'Enhance user experience',
                        ]}
                    />
                    <Text style={[styles.bodyText, { marginTop: 10 }]}>
                        Users can manage cookie preferences through browser settings.
                    </Text>
                </Section>

                {/* Section 7 */}
                <Section title="7. User Rights">
                    <Text style={styles.bodyText}>
                        Depending on applicable laws, users may have the right to:
                    </Text>
                    <BulletList
                        items={[
                            'Access their personal data',
                            'Correct inaccurate information',
                            'Request deletion of data',
                            'Withdraw consent',
                            'Object to certain processing activities',
                        ]}
                    />
                    <Text style={[styles.bodyText, { marginTop: 10 }]}>
                        Requests may be submitted through our contact information provided below.
                    </Text>
                </Section>

                {/* Section 8 */}
                <Section title="8. Third-Party Links">
                    <Text style={styles.bodyText}>
                        Our platform may contain links to third-party websites or services. Hospilink is not responsible for the privacy practices or content of those external platforms.
                    </Text>
                </Section>

                {/* Section 9 */}
                <Section title="9. Children's Privacy">
                    <Text style={styles.bodyText}>
                        Hospilink services are intended for individuals and organizations involved in healthcare staffing and management. We do not knowingly collect personal information from children under the age of 18.
                    </Text>
                </Section>

                {/* Section 10 */}
                <Section title="10. Updates to This Privacy Policy">
                    <Text style={styles.bodyText}>
                        We may update this Privacy Policy periodically to reflect changes in our services, legal requirements, or operational practices.
                    </Text>
                    <Text style={[styles.bodyText, { marginTop: 6 }]}>
                        Updated versions will be posted on this page with the revised effective date.
                    </Text>
                </Section>

                {/* Section 11 */}
                <Section title="11. Contact Us">
                    <Text style={styles.bodyText}>
                        If you have any questions or concerns regarding this Privacy Policy or your personal data, please contact us:
                    </Text>

                    <View style={styles.contactBlock}>
                        <Text style={styles.contactCompany}>Hospilink</Text>
                        <Text style={styles.contactLine}>Email: [Insert Email Address]</Text>
                        <Text style={styles.contactLine}>Phone: +91 9876543488</Text>
                        <Text style={styles.contactLine}>Address: Kurla, Mumbai, Maharashtra</Text>
                    </View>
                </Section>

                {/* Consent */}
                <View style={styles.consentBlock}>
                    <Text style={styles.subSectionTitle}>Consent</Text>
                    <Text style={styles.bodyText}>
                        By using Hospilink, you acknowledge that you have read and understood this Privacy Policy and agree to its terms.
                    </Text>
                </View>

                {/* Footer */}
                <Footer />
            </ScrollView>
        </View>
    );
}

// ─── Styles ───────────────────────────────────────────────────────────────────
const styles = StyleSheet.create({
    root: {
        flex: 1,
        backgroundColor: '#FFFFFF',
    },

    // ── NavBar ──
    navbar: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        paddingHorizontal: 32,
        paddingVertical: 14,
        backgroundColor: '#FFFFFF',
        borderBottomWidth: 1,
        borderBottomColor: '#F0F0F0',
        ...Platform.select({
            ios: { shadowColor: '#000', shadowOpacity: 0.05, shadowRadius: 4, shadowOffset: { width: 0, height: 2 } },
            android: { elevation: 2 },
        }),
    },
    navLeft: {
        flexDirection: 'row',
        alignItems: 'center',
    },
    logoRow: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 6,
    },
    logoIconWrap: {
        width: 28,
        height: 28,
        alignItems: 'center',
        justifyContent: 'center',
    },
    logoIconText: {
        fontSize: 18,
        color: '#2563EB',
    },
    logoText: {
        fontSize: 16,
        fontWeight: '700',
        color: '#1A73E8',
        letterSpacing: 1,
    },
    navLinks: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 28,
    },
    navLink: {
        fontSize: 14,
        color: '#374151',
        fontWeight: '500',
    },
    signInBtn: {
        backgroundColor: '#0F172A',
        borderRadius: 8,
        paddingHorizontal: 20,
        paddingVertical: 9,
    },
    signInBtnText: {
        fontSize: 14,
        color: '#FFFFFF',
        fontWeight: '600',
    },

    // ── Scroll / Content ──
    scrollView: {
        flex: 1,
        backgroundColor: '#FFFFFF',
    },
    scrollContent: {
        paddingBottom: 0,
    },

    // ── Page Title ──
    pageTitle: {
        fontSize: 28,
        fontWeight: '700',
        color: '#111827',
        textAlign: 'center',
        paddingTop: 36,
        paddingBottom: 28,
        paddingHorizontal: 24,
    },

    // ── Content Area ──
    effectiveBlock: {
        paddingHorizontal: 40,
        paddingBottom: 8,
    },
    effectiveTitle: {
        fontSize: 16,
        fontWeight: '700',
        color: '#111827',
        marginBottom: 4,
    },
    effectiveDate: {
        fontSize: 13,
        color: '#6B7280',
        marginBottom: 12,
    },

    // ── Section ──
    section: {
        paddingHorizontal: 40,
        paddingTop: 20,
        paddingBottom: 4,
    },
    sectionTitle: {
        fontSize: 16,
        fontWeight: '700',
        color: '#111827',
        marginBottom: 10,
    },

    // ── SubSection ──
    subSection: {
        marginTop: 12,
    },
    subSectionTitle: {
        fontSize: 14,
        fontWeight: '700',
        color: '#111827',
        marginBottom: 6,
    },

    // ── Body Text ──
    bodyText: {
        fontSize: 13,
        color: '#374151',
        lineHeight: 20,
    },

    // ── Bullet List ──
    bulletList: {
        marginTop: 6,
        gap: 4,
    },
    bulletRow: {
        flexDirection: 'row',
        alignItems: 'flex-start',
        gap: 8,
    },
    bullet: {
        fontSize: 13,
        color: '#374151',
        lineHeight: 20,
        marginTop: 0,
    },
    bulletText: {
        fontSize: 13,
        color: '#374151',
        lineHeight: 20,
        flex: 1,
    },

    // ── Contact Block ──
    contactBlock: {
        marginTop: 14,
        gap: 3,
    },
    contactCompany: {
        fontSize: 14,
        fontWeight: '700',
        color: '#111827',
        marginBottom: 4,
    },
    contactLine: {
        fontSize: 13,
        color: '#374151',
        lineHeight: 20,
    },

    // ── Consent ──
    consentBlock: {
        paddingHorizontal: 40,
        paddingTop: 20,
        paddingBottom: 32,
    },

    // ── Footer ──
    footer: {
        backgroundColor: '#0F172A',
        paddingTop: 40,
        paddingHorizontal: 40,
        paddingBottom: 24,
    },
    footerTop: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        flexWrap: 'wrap',
        gap: 24,
        marginBottom: 32,
    },
    footerBrandCol: {
        flex: 2,
        minWidth: 180,
        gap: 10,
    },
    footerLogoRow: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 6,
        marginBottom: 8,
    },
    footerLogoIcon: {
        fontSize: 16,
        color: '#60A5FA',
    },
    footerLogoText: {
        fontSize: 14,
        fontWeight: '700',
        color: '#FFFFFF',
        letterSpacing: 1,
    },
    footerTagline: {
        fontSize: 12,
        color: '#94A3B8',
        lineHeight: 18,
    },
    footerCol: {
        flex: 1,
        minWidth: 120,
        gap: 10,
    },
    footerColTitle: {
        fontSize: 13,
        fontWeight: '700',
        color: '#FFFFFF',
        marginBottom: 4,
    },
    footerColLink: {
        fontSize: 12,
        color: '#94A3B8',
        lineHeight: 20,
    },
    footerDivider: {
        height: 1,
        backgroundColor: '#1E293B',
        marginBottom: 20,
    },
    footerBottom: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        flexWrap: 'wrap',
        gap: 12,
    },
    footerCopyright: {
        fontSize: 11,
        color: '#64748B',
    },
    footerPrivacyLink: {
        fontSize: 11,
        color: '#64748B',
        textDecorationLine: 'underline',
    },
    footerSocials: {
        flexDirection: 'row',
        gap: 8,
    },
    socialIcon: {
        width: 28,
        height: 28,
        borderRadius: 14,
        backgroundColor: '#1E293B',
        alignItems: 'center',
        justifyContent: 'center',
    },
    socialIconText: {
        fontSize: 9,
        color: '#94A3B8',
        fontWeight: '700',
    },
});
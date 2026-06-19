// import React, { useRef, useState } from "react";
// import {
//     View,
//     Text,
//     ScrollView,
//     TouchableOpacity,
//     StyleSheet,
//     Dimensions,
//     StatusBar,
//     Image,
//     Platform,
// } from "react-native";
// import { useRouter } from "expo-router";
// import Svg, {
//     Path,
//     Rect,
//     Circle,
//     Polyline,
//     Line,
//     Ellipse,
// } from "react-native-svg";

// const NAVY = "#0B1730";
// const BLUE = "#3B82F6";       // bright blue for hero btn + CTA bg
// const MUTED = "#6B7280";
// const BORDER = "#E5E7EB";

// const { width: SCREEN_WIDTH } = Dimensions.get("window");
// const isDesktop = SCREEN_WIDTH >= 900;

// /* ─────────────── ICONS ─────────────── */

// const LinkIcon: React.FC<{ size?: number; color?: string }> = ({
//     size = 17,
//     color = "#fff",
// }) => (
//     <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
//         <Path
//             d="M10 13a5 5 0 0 0 7.54.54l3-3a5 5 0 0 0-7.07-7.07l-1.72 1.71"
//             stroke={color}
//             strokeWidth="2.2"
//             strokeLinecap="round"
//             strokeLinejoin="round"
//         />
//         <Path
//             d="M14 11a5 5 0 0 0-7.54-.54l-3 3a5 5 0 0 0 7.07 7.07l1.71-1.71"
//             stroke={color}
//             strokeWidth="2.2"
//             strokeLinecap="round"
//             strokeLinejoin="round"
//         />
//     </Svg>
// );

// /** Brain icon – complete */
// const BrainIcon: React.FC = () => (
//     <Svg width={20} height={20} viewBox="0 0 24 24" fill="none">
//         <Path
//             d="M9 3a4 4 0 0 0-4 4c0 .34.04.67.11.98A4.002 4.002 0 0 0 3 11a4 4 0 0 0 2.38 3.65A4 4 0 0 0 9 21h6a4 4 0 0 0 3.62-5.35A4 4 0 0 0 21 12a4.002 4.002 0 0 0-2.11-3.52c.07-.3.11-.63.11-.98a4 4 0 0 0-4-4"
//             stroke="#3B82F6"
//             strokeWidth="1.5"
//             strokeLinecap="round"
//         />
//         <Line x1="12" y1="7" x2="12" y2="21" stroke="#3B82F6" strokeWidth="1.5" strokeLinecap="round" />
//     </Svg>
// );

// /** Clock icon – complete */
// const ClockIcon: React.FC = () => (
//     <Svg width={20} height={20} viewBox="0 0 24 24" fill="none">
//         <Circle cx="12" cy="12" r="9" stroke="#3B82F6" strokeWidth="1.5" />
//         <Polyline
//             points="12 7 12 12 15 15"
//             stroke="#3B82F6"
//             strokeWidth="1.5"
//             strokeLinecap="round"
//         />
//     </Svg>
// );

// /** Shield icon – complete */
// const ShieldIcon: React.FC = () => (
//     <Svg width={20} height={20} viewBox="0 0 24 24" fill="none">
//         <Path
//             d="M12 2l8 3.5v5C20 15.5 16.5 20.3 12 22 7.5 20.3 4 15.5 4 10.5v-5L12 2z"
//             stroke="#3B82F6"
//             strokeWidth="1.5"
//             strokeLinecap="round"
//             strokeLinejoin="round"
//         />
//         <Polyline
//             points="9 12 11 14 15 10"
//             stroke="#3B82F6"
//             strokeWidth="1.5"
//             strokeLinecap="round"
//             strokeLinejoin="round"
//         />
//     </Svg>
// );

// /** Credit-card icon for "One-Hand Payments" */
// const PayIcon: React.FC = () => (
//     <Svg width={24} height={24} viewBox="0 0 24 24" fill="none">
//         <Rect x="2" y="5" width="20" height="14" rx="3" stroke="#fff" strokeWidth="1.8" />
//         <Line x1="2" y1="10" x2="22" y2="10" stroke="#fff" strokeWidth="1.8" />
//         <Line x1="6" y1="15" x2="10" y2="15" stroke="#fff" strokeWidth="1.8" strokeLinecap="round" />
//     </Svg>
// );

// /** Calendar icon for "Duty Management" */
// const DutyIcon: React.FC = () => (
//     <Svg width={24} height={24} viewBox="0 0 24 24" fill="none">
//         <Rect x="3" y="4" width="18" height="18" rx="2" stroke="#fff" strokeWidth="1.8" />
//         <Line x1="3" y1="9" x2="21" y2="9" stroke="#fff" strokeWidth="1.8" />
//         <Line x1="8" y1="2" x2="8" y2="6" stroke="#fff" strokeWidth="1.8" strokeLinecap="round" />
//         <Line x1="16" y1="2" x2="16" y2="6" stroke="#fff" strokeWidth="1.8" strokeLinecap="round" />
//         <Polyline points="8 13 10 15 14 11" stroke="#fff" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
//     </Svg>
// );

// /** Person/user icon for "Clinical Supervision" */
// const SuperviseIcon: React.FC = () => (
//     <Svg width={24} height={24} viewBox="0 0 24 24" fill="none">
//         <Circle cx="12" cy="8" r="4" stroke="#fff" strokeWidth="1.8" />
//         <Path d="M4 20c0-4 3.58-7 8-7s8 3 8 7" stroke="#fff" strokeWidth="1.8" strokeLinecap="round" />
//     </Svg>
// );

// const ChevronDownIcon: React.FC<{ open: boolean }> = ({ open }) => (
//     <Svg
//         width={18}
//         height={18}
//         viewBox="0 0 24 24"
//         fill="none"
//         style={{ transform: [{ rotate: open ? "180deg" : "0deg" }] }}
//     >
//         <Polyline
//             points="6 9 12 15 18 9"
//             stroke="#9CA3AF"
//             strokeWidth="2"
//             strokeLinecap="round"
//         />
//     </Svg>
// );

// const ChevronLeftIcon: React.FC = () => (
//     <Svg width={20} height={20} viewBox="0 0 24 24" fill="none">
//         <Polyline points="15 18 9 12 15 6" stroke={NAVY} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
//     </Svg>
// );

// const ChevronRightIcon: React.FC = () => (
//     <Svg width={20} height={20} viewBox="0 0 24 24" fill="none">
//         <Polyline points="9 18 15 12 9 6" stroke={NAVY} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
//     </Svg>
// );

// /* Social icons for footer */
// const TwitterIcon: React.FC = () => (
//     <Svg width={16} height={16} viewBox="0 0 24 24" fill="none">
//         <Path d="M22 4.01c-.77.35-1.6.58-2.46.69a4.3 4.3 0 0 0 1.88-2.37 8.59 8.59 0 0 1-2.72 1.04 4.28 4.28 0 0 0-7.3 3.9A12.14 12.14 0 0 1 3 3.13a4.28 4.28 0 0 0 1.32 5.71 4.26 4.26 0 0 1-1.94-.53v.05a4.28 4.28 0 0 0 3.43 4.2 4.3 4.3 0 0 1-1.93.07 4.28 4.28 0 0 0 4 2.97A8.58 8.58 0 0 1 2 17.54a12.11 12.11 0 0 0 6.56 1.92c7.88 0 12.19-6.53 12.19-12.19 0-.19 0-.37-.01-.56A8.7 8.7 0 0 0 22 4.01z" stroke="#A5B4C7" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
//     </Svg>
// );

// const LinkedInIcon: React.FC = () => (
//     <Svg width={16} height={16} viewBox="0 0 24 24" fill="none">
//         <Rect x="2" y="2" width="20" height="20" rx="4" stroke="#A5B4C7" strokeWidth="1.5" />
//         <Line x1="8" y1="11" x2="8" y2="16" stroke="#A5B4C7" strokeWidth="1.5" strokeLinecap="round" />
//         <Line x1="8" y1="8" x2="8" y2="8.5" stroke="#A5B4C7" strokeWidth="2" strokeLinecap="round" />
//         <Path d="M12 16v-5m0 0a3 3 0 0 1 5 2.2V16" stroke="#A5B4C7" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
//     </Svg>
// );

// const InstagramIcon: React.FC = () => (
//     <Svg width={16} height={16} viewBox="0 0 24 24" fill="none">
//         <Rect x="2" y="2" width="20" height="20" rx="5" stroke="#A5B4C7" strokeWidth="1.5" />
//         <Circle cx="12" cy="12" r="4" stroke="#A5B4C7" strokeWidth="1.5" />
//         <Circle cx="17.5" cy="6.5" r="1" fill="#A5B4C7" />
//     </Svg>
// );

// /* ─────────────── DATA ─────────────── */

// const services = [
//     {
//         Icon: PayIcon,
//         title: "One-Hand Payments",
//         desc: "Integrated payment system for seamless, one-hand processing from onboarding and payouts to salaries.",
//     },
//     {
//         Icon: DutyIcon,
//         title: "Duty Management",
//         desc: "Streamlined scheduling of duty rosters, shift management, and attendance tracking to ensure seamless hospital operations.",
//     },
//     {
//         Icon: SuperviseIcon,
//         title: "Clinical Supervision",
//         desc: "Experienced intensivists provide clinical oversight, ensuring quality compliance and improved patient outcomes.",
//     },
// ];

// const faqs = [
//     {
//         q: "What services does Hospilink provide?",
//         a: "Hospilink provides AI-powered healthcare staffing solutions including smart staff matching, duty management, clinical supervision, and integrated payment processing for hospitals and medical professionals.",
//     },
//     {
//         q: "Who can use Hospilink?",
//         a: "Hospitals and medical professionals including doctors, nurses, and other healthcare staff can use Hospilink to connect, schedule duties, and manage payments.",
//     },
//     {
//         q: "How does Hospilink verify medical professionals?",
//         a: "All professionals undergo strict verification checks including credential validation, license verification, and comprehensive background checks for complete peace of mind.",
//     },
//     {
//         q: "Is my personal and professional information secure?",
//         a: "Yes, all information is securely encrypted using industry-standard protocols. Your data privacy and security is our top priority.",
//     },
//     {
//         q: "Is there a registration fee to join Hospilink?",
//         a: "Registration is completely free for medical staff. Hospitals can get started with our flexible plans tailored to their needs.",
//     },
// ];

// const steps = [
//     {
//         label: "Create Account",
//         desc: "Sign up as a hospital or medical staff member with a simple registration process.",
//     },
//     {
//         label: "Complete Profile",
//         desc: "Add your professional details, preferences, and availability for better matching.",
//     },
//     {
//         label: "Start Connecting",
//         desc: "Hospitals post duties and staff accept them instantly through our platform.",
//     },
// ];

// const features = [
//     {
//         Icon: BrainIcon,
//         title: "Smart Staff Matching",
//         desc: "AI-powered matching system connects hospitals with the right medical professionals based on skills, availability, and preferences.",
//     },
//     {
//         Icon: ClockIcon,
//         title: "Real Time Scheduling",
//         desc: "Dynamic duty management with instant notifications, conflict prevention, and automated scheduling for optimal staff utilization.",
//     },
//     {
//         Icon: ShieldIcon,
//         title: "Verified Professionals",
//         desc: "All medical staff are thoroughly verified with credentials, licenses, and background checks for complete peace of mind.",
//     },
// ];

// /* ─────────────── COMPONENT ─────────────── */

// export default function LandingPage() {
//     const router = useRouter();
//     const scrollRef = useRef<ScrollView>(null);

//     const featureY = useRef(0);
//     const solutionY = useRef(0);
//     const aboutY = useRef(0);

//     const [faqOpen, setFaqOpen] = useState<number | null>(null);
//     const [serviceIndex, setServiceIndex] = useState(0);

//     const scrollTo = (y: number) =>
//         scrollRef.current?.scrollTo({ y, animated: true });

//     const prevService = () =>
//         setServiceIndex((i) => (i === 0 ? services.length - 1 : i - 1));
//     const nextService = () =>
//         setServiceIndex((i) => (i === services.length - 1 ? 0 : i + 1));

//     /* On desktop show all 3 cards; on mobile carousel-style */
//     const visibleServices = isDesktop
//         ? services
//         : [services[serviceIndex]];

//     return (
//         <View style={styles.root}>
//             <StatusBar backgroundColor={NAVY} barStyle="light-content" />

//             {/* ── NAVBAR ── */}
//             <View style={styles.navbar}>
//                 <View style={styles.container}>
//                     <View style={styles.navInner}>
//                         <TouchableOpacity
//                             style={styles.logoRow}
//                             onPress={() => router.push("/auth/home")}
//                         >
//                             <View style={styles.logoIcon}>
//                                 <LinkIcon />
//                             </View>
//                             <Text style={styles.logoText}>HOSPILINK</Text>
//                         </TouchableOpacity>

//                         {isDesktop && (
//                             <View style={styles.desktopNav}>
//                                 <TouchableOpacity onPress={() => scrollTo(featureY.current)}>
//                                     <Text style={styles.navLink}>Features</Text>
//                                 </TouchableOpacity>
//                                 <TouchableOpacity onPress={() => scrollTo(solutionY.current)}>
//                                     <Text style={styles.navLink}>Solutions</Text>
//                                 </TouchableOpacity>
//                                 <TouchableOpacity onPress={() => scrollTo(aboutY.current)}>
//                                     <Text style={styles.navLink}>About Us</Text>
//                                 </TouchableOpacity>
//                                 <TouchableOpacity
//                                     onPress={() => router.push("/auth/login")}
//                                     style={styles.outlineBtn}
//                                 >
//                                     <Text style={styles.outlineBtnText}>Sign In</Text>
//                                 </TouchableOpacity>
//                             </View>
//                         )}
//                     </View>
//                 </View>
//             </View>

//             {/* ── BODY ── */}
//             <ScrollView ref={scrollRef} showsVerticalScrollIndicator={false}>

//                 {/* ── HERO ── */}
//                 <View style={styles.container}>
//                     <View style={styles.heroContainer}>
//                         <View style={styles.heroLeft}>
//                             <Text style={styles.heroTitle}>
//                                 Revolutionizing Healthcare Staff Management
//                             </Text>
//                             <Text style={styles.heroSubtitle}>
//                                 Connect hospitals with qualified medical staff seamlessly
//                             </Text>
//                             <TouchableOpacity
//                                 style={styles.blueBtn}
//                                 onPress={() => router.push("/auth/login")}
//                             >
//                                 <Text style={styles.blueBtnText}>Sign Up</Text>
//                             </TouchableOpacity>
//                         </View>

//                         <View style={styles.heroRight}>
//                             <View style={styles.heroShape} />
//                             <Image
//                                 source={require("../../../assets/Images/hero-doctor.png")}
//                                 style={styles.heroImage}
//                                 resizeMode="contain"
//                             />
//                         </View>
//                     </View>

//                     {/* STATS */}
//                     <View style={styles.statsBar}>
//                         {[
//                             ["99.9%", "Satisfaction Rate"],
//                             ["500+", "Hospitals"],
//                             ["10,000+", "Medical Staff"],
//                             ["50,000+", "Duties Completed"],
//                         ].map(([num, label], i) => (
//                             <View
//                                 key={i}
//                                 style={[styles.statItem, i !== 3 && styles.statBorder]}
//                             >
//                                 <Text style={styles.statNumber}>{num}</Text>
//                                 <Text style={styles.statLabel}>{label}</Text>
//                             </View>
//                         ))}
//                     </View>
//                 </View>

//                 {/* ── WHY CHOOSE ── */}
//                 <View
//                     onLayout={(e) => { featureY.current = e.nativeEvent.layout.y; }}
//                     style={styles.section}
//                 >
//                     <View style={styles.container}>
//                         <View style={styles.whyContainer}>
//                             <Image
//                                 source={require("../../../assets/Images/hero-doctor.png")}
//                                 style={styles.teamImage}
//                                 resizeMode="cover"
//                             />

//                             <View style={styles.whyContent}>
//                                 <Text style={styles.sectionTitle}>Why Choose Hospilink</Text>
//                                 <Text style={styles.sectionSubtitle}>
//                                     Comprehensive solution for modern healthcare staffing needs
//                                 </Text>

//                                 {features.map(({ Icon, title, desc }, i) => (
//                                     <View key={i} style={styles.featureRow}>
//                                         <View style={styles.featureIcon}>
//                                             <Icon />
//                                         </View>
//                                         <View style={{ flex: 1 }}>
//                                             <Text style={styles.featureTitle}>{title}</Text>
//                                             <Text style={styles.featureDesc}>{desc}</Text>
//                                         </View>
//                                     </View>
//                                 ))}
//                             </View>
//                         </View>
//                     </View>
//                 </View>

//                 {/* ── SERVICES ── */}
//                 <View
//                     onLayout={(e) => { solutionY.current = e.nativeEvent.layout.y; }}
//                     style={styles.section}
//                 >
//                     <View style={styles.container}>
//                         <Text style={styles.centerTitle}>
//                             Empowering Hospitals with Reliable Doctor Workforce Management Services
//                         </Text>

//                         <View style={styles.carouselWrapper}>
//                             {/* Left arrow */}
//                             {!isDesktop && (
//                                 <TouchableOpacity style={styles.carouselArrow} onPress={prevService}>
//                                     <ChevronLeftIcon />
//                                 </TouchableOpacity>
//                             )}
//                             {isDesktop && (
//                                 <TouchableOpacity style={styles.carouselArrow} onPress={prevService}>
//                                     <ChevronLeftIcon />
//                                 </TouchableOpacity>
//                             )}

//                             <View style={styles.serviceRow}>
//                                 {visibleServices.map((item, i) => (
//                                     <View key={i} style={styles.serviceCard}>
//                                         <View style={styles.serviceIconBg}>
//                                             <item.Icon />
//                                         </View>
//                                         <Text style={styles.serviceTitle}>{item.title}</Text>
//                                         <Text style={styles.serviceDesc}>{item.desc}</Text>
//                                     </View>
//                                 ))}
//                             </View>

//                             {/* Right arrow */}
//                             <TouchableOpacity style={styles.carouselArrow} onPress={nextService}>
//                                 <ChevronRightIcon />
//                             </TouchableOpacity>
//                         </View>
//                     </View>
//                 </View>

//                 {/* ── HOW IT WORKS ── */}
//                 <View
//                     onLayout={(e) => { aboutY.current = e.nativeEvent.layout.y; }}
//                     style={styles.section}
//                 >
//                     <View style={styles.container}>
//                         <Text style={styles.sectionTitle}>How It Works</Text>

//                         {steps.map((step, i) => (
//                             <View key={i} style={styles.stepRow}>
//                                 <Text style={styles.stepNumber}>{i + 1}</Text>
//                                 <Text style={styles.stepTitle}>{step.label}</Text>
//                                 <Text style={styles.stepDesc}>{step.desc}</Text>
//                             </View>
//                         ))}
//                     </View>
//                 </View>

//                 {/* ── CTA ── */}
//                 <View style={styles.ctaSection}>
//                     <View style={styles.container}>
//                         <View style={styles.ctaWrapper}>
//                             <Image
//                                 source={require("../../../assets/Images/hero-doctor.png")}
//                                 style={styles.ctaImage}
//                             />
//                             <View style={styles.ctaContent}>
//                                 <Text style={styles.ctaTitle}>
//                                     Ready to Transform Healthcare Staffing?
//                                 </Text>
//                                 <Text style={styles.ctaSubtitle}>
//                                     Join thousands of healthcare professionals already using Hospilink
//                                 </Text>
//                                 <TouchableOpacity style={styles.whiteBtn}>
//                                     <Text style={styles.whiteBtnText}>Get Started Today</Text>
//                                 </TouchableOpacity>
//                             </View>
//                         </View>
//                     </View>
//                 </View>

//                 {/* ── FAQ ── */}
//                 <View style={styles.section}>
//                     <View style={styles.container}>
//                         <View style={styles.faqWrapper}>
//                             <View style={styles.faqLeft}>
//                                 <Text style={styles.sectionTitle}>Frequently Asked Questions</Text>
//                                 <Text style={styles.sectionSubtitle}>
//                                     Find answers to common questions about Hospilink, healthcare staffing, account management, and platform services.
//                                 </Text>
//                             </View>

//                             <View style={styles.faqRight}>
//                                 {faqs.map((faq, i) => (
//                                     <View key={i} style={styles.faqItem}>
//                                         <TouchableOpacity
//                                             style={styles.faqButton}
//                                             onPress={() => setFaqOpen(faqOpen === i ? null : i)}
//                                         >
//                                             <Text style={styles.faqQuestion}>{faq.q}</Text>
//                                             <ChevronDownIcon open={faqOpen === i} />
//                                         </TouchableOpacity>
//                                         {faqOpen === i && (
//                                             <Text style={styles.faqAnswer}>{faq.a}</Text>
//                                         )}
//                                     </View>
//                                 ))}
//                             </View>
//                         </View>
//                     </View>
//                 </View>

//                 {/* ── FOOTER ── */}
//                 <View style={styles.footer}>
//                     <View style={styles.container}>
//                         <View style={styles.footerGrid}>
//                             {/* Brand */}
//                             <View style={styles.footerBrandCol}>
//                                 <TouchableOpacity
//                                     style={styles.logoRow}
//                                     onPress={() => router.push("/auth/home")}
//                                 >
//                                     <View style={styles.logoIcon}>
//                                         <LinkIcon />
//                                     </View>
//                                     <Text style={styles.logoText}>HOSPILINK</Text>
//                                 </TouchableOpacity>
//                                 <Text style={styles.footerText}>
//                                     Connect with us for seamless healthcare staffing solutions and opportunities.
//                                 </Text>
//                             </View>

//                             {/* For Hospitals */}
//                             <View>
//                                 <Text style={styles.footerHeading}>For Hospitals</Text>
//                                 <Text style={styles.footerLink}>Post Duties</Text>
//                                 <Text style={styles.footerLink}>Find Staff</Text>
//                                 <Text style={styles.footerLink}>Manage Schedules</Text>
//                             </View>

//                             {/* For Medical Staff */}
//                             <View>
//                                 <Text style={styles.footerHeading}>For Medical Staff</Text>
//                                 <Text style={styles.footerLink}>Find Opportunities</Text>
//                                 <Text style={styles.footerLink}>Manage Availability</Text>
//                                 <Text style={styles.footerLink}>Track Earnings</Text>
//                             </View>

//                             {/* Support */}
//                             <View>
//                                 <Text style={styles.footerHeading}>Support</Text>
//                                 <Text style={styles.footerLink}>Help Center</Text>
//                                 <TouchableOpacity onPress={() => router.push("/auth/contact-us")}>
//                                     <Text style={styles.footerLink}>Contact Us</Text>
//                                 </TouchableOpacity>
//                             </View>
//                         </View>

//                         {/* Footer bottom */}
//                         <View style={styles.footerBottom}>
//                             <Text style={styles.copyText}>
//                                 © 2025 Hospilink. All rights reserved.{" "}
//                                 <Text
//                                     style={styles.copyLink}
//                                     onPress={() => router.push("/auth/privacy-policy")}
//                                 >
//                                     Privacy Policy
//                                 </Text>
//                             </Text>
//                             <View style={styles.socialRow}>
//                                 <View style={styles.socialIcon}><TwitterIcon /></View>
//                                 <View style={styles.socialIcon}><LinkedInIcon /></View>
//                                 <View style={styles.socialIcon}><InstagramIcon /></View>
//                             </View>
//                         </View>
//                     </View>
//                 </View>

//             </ScrollView>
//         </View>
//     );
// }

// /* ─────────────── STYLES ─────────────── */
// const styles = StyleSheet.create({
//     root: { flex: 1, backgroundColor: "#fff" },

//     container: {
//         width: "100%",
//         maxWidth: 1200,
//         alignSelf: "center",
//         paddingHorizontal: 20,
//     },

//     /* NAVBAR */
//     navbar: {
//         height: 64,
//         backgroundColor: NAVY,
//         justifyContent: "center",
//         ...Platform.select({
//             ios: { shadowColor: "#000", shadowOpacity: 0.1, shadowRadius: 4 },
//             android: { elevation: 5 },
//         }),
//     },

//     navInner: {
//         flexDirection: "row",
//         justifyContent: "space-between",
//         alignItems: "center",
//     },

//     logoRow: { flexDirection: "row", alignItems: "center" },

//     logoIcon: {
//         width: 34,
//         height: 34,
//         borderRadius: 8,
//         backgroundColor: "rgba(255,255,255,0.08)",
//         alignItems: "center",
//         justifyContent: "center",
//         marginRight: 10,
//     },

//     logoText: {
//         color: "#fff",
//         fontWeight: "700",
//         fontSize: 15,
//         letterSpacing: 1,
//     },

//     desktopNav: {
//         flexDirection: "row",
//         alignItems: "center",
//         gap: 36,
//     },

//     navLink: { color: "#E5E7EB", fontSize: 14, fontWeight: "500" },

//     /* Outlined white button (navbar Sign In) */
//     outlineBtn: {
//         borderWidth: 1,
//         borderColor: "#fff",
//         paddingHorizontal: 20,
//         paddingVertical: 8,
//         borderRadius: 8,
//     },
//     outlineBtnText: { color: "#fff", fontWeight: "600", fontSize: 14 },

//     /* Blue filled button (hero Sign Up) */
//     blueBtn: {
//         backgroundColor: BLUE,
//         paddingHorizontal: 28,
//         paddingVertical: 14,
//         borderRadius: 8,
//         alignSelf: "flex-start",
//     },
//     blueBtnText: { color: "#fff", fontWeight: "600" },

//     /* White filled button (CTA) */
//     whiteBtn: {
//         backgroundColor: "#fff",
//         paddingHorizontal: 26,
//         paddingVertical: 13,
//         borderRadius: 8,
//         alignSelf: "flex-start",
//     },
//     whiteBtnText: { color: NAVY, fontWeight: "600" },

//     /* HERO */
//     heroContainer: {
//         flexDirection: isDesktop ? "row" : "column",
//         alignItems: "center",
//         justifyContent: "space-between",
//         paddingTop: 70,
//         gap: 60,
//     },

//     heroLeft: { flex: 1, maxWidth: 580 },

//     heroTitle: {
//         fontSize: isDesktop ? 58 : 36,
//         lineHeight: isDesktop ? 66 : 44,
//         fontWeight: "800",
//         color: NAVY,
//         marginBottom: 20,
//         letterSpacing: -2,
//     },

//     heroSubtitle: {
//         fontSize: 16,
//         color: MUTED,
//         lineHeight: 28,
//         marginBottom: 30,
//         maxWidth: 400,
//     },

//     heroRight: {
//         width: isDesktop ? 430 : "100%",
//         height: isDesktop ? 480 : 320,
//         position: "relative",
//         justifyContent: "flex-end",
//     },

//     heroShape: {
//         position: "absolute",
//         width: "100%",
//         height: "80%",
//         backgroundColor: "#E7EEF8",
//         borderRadius: 120,
//         bottom: 0,
//     },

//     heroImage: { width: "100%", height: "100%" },

//     /* STATS */
//     statsBar: {
//         flexDirection: "row",
//         marginTop: 40,
//         borderWidth: 1,
//         borderColor: BORDER,
//         borderRadius: 10,
//         overflow: "hidden",
//         marginBottom: 60,
//     },

//     statItem: { flex: 1, paddingVertical: 22, alignItems: "center" },

//     statBorder: { borderRightWidth: 1, borderRightColor: BORDER },

//     statNumber: { fontSize: 24, fontWeight: "800", color: NAVY },

//     statLabel: { fontSize: 12, color: MUTED, marginTop: 6 },

//     /* SECTIONS */
//     section: { paddingVertical: 70 },

//     sectionTitle: {
//         fontSize: 40,
//         fontWeight: "800",
//         color: NAVY,
//         marginBottom: 14,
//         lineHeight: 48,
//     },

//     sectionSubtitle: {
//         fontSize: 14,
//         color: MUTED,
//         lineHeight: 24,
//         marginBottom: 28,
//     },

//     /* WHY CHOOSE */
//     whyContainer: {
//         flexDirection: isDesktop ? "row" : "column",
//         gap: 50,
//         alignItems: "center",
//     },

//     teamImage: {
//         width: isDesktop ? 420 : "100%",
//         height: 320,
//         borderRadius: 8,
//     },

//     whyContent: { flex: 1 },

//     featureRow: { flexDirection: "row", gap: 16, marginBottom: 24 },

//     featureIcon: {
//         width: 44,
//         height: 44,
//         borderWidth: 1,
//         borderColor: BORDER,
//         borderRadius: 8,
//         justifyContent: "center",
//         alignItems: "center",
//         backgroundColor: "#F0F5FF",
//     },

//     featureTitle: { fontWeight: "700", color: NAVY, marginBottom: 6 },

//     featureDesc: { color: MUTED, lineHeight: 22, fontSize: 14 },

//     /* SERVICES CAROUSEL */
//     centerTitle: {
//         fontSize: 38,
//         fontWeight: "800",
//         textAlign: "center",
//         lineHeight: 50,
//         marginBottom: 50,
//         color: NAVY,
//     },

//     carouselWrapper: {
//         flexDirection: "row",
//         alignItems: "center",
//         gap: 10,
//     },

//     carouselArrow: {
//         width: 36,
//         height: 36,
//         borderRadius: 18,
//         borderWidth: 1,
//         borderColor: BORDER,
//         justifyContent: "center",
//         alignItems: "center",
//         backgroundColor: "#fff",
//     },

//     serviceRow: {
//         flex: 1,
//         flexDirection: isDesktop ? "row" : "column",
//         gap: 20,
//     },

//     serviceCard: {
//         flex: 1,
//         borderWidth: 1,
//         borderColor: BORDER,
//         padding: 30,
//         alignItems: "center",
//         borderRadius: 4,
//     },

//     serviceIconBg: {
//         width: 60,
//         height: 60,
//         borderRadius: 14,
//         backgroundColor: BLUE,
//         justifyContent: "center",
//         alignItems: "center",
//         marginBottom: 20,
//     },

//     serviceTitle: {
//         fontWeight: "700",
//         marginBottom: 12,
//         color: NAVY,
//         fontSize: 15,
//     },

//     serviceDesc: {
//         color: MUTED,
//         textAlign: "center",
//         lineHeight: 22,
//         fontSize: 14,
//     },

//     /* HOW IT WORKS */
//     stepRow: {
//         flexDirection: "row",
//         alignItems: "center",
//         borderBottomWidth: 1,
//         borderBottomColor: BORDER,
//         paddingVertical: 28,
//     },

//     stepNumber: {
//         width: 80,
//         fontSize: 28,
//         fontWeight: "600",
//         color: NAVY,
//     },

//     stepTitle: {
//         width: 260,
//         fontSize: 24,
//         fontWeight: "700",
//         color: NAVY,
//     },

//     stepDesc: { flex: 1, color: MUTED, lineHeight: 24 },

//     /* CTA – bright blue */
//     ctaSection: {
//         backgroundColor: BLUE,
//         paddingVertical: 80,
//     },

//     ctaWrapper: {
//         flexDirection: isDesktop ? "row" : "column",
//         gap: 50,
//         alignItems: "center",
//     },

//     ctaImage: {
//         width: isDesktop ? 240 : "100%",
//         height: 280,
//         borderRadius: 10,
//     },

//     ctaContent: { flex: 1 },

//     ctaTitle: {
//         color: "#fff",
//         fontSize: 52,
//         lineHeight: 60,
//         fontWeight: "800",
//         marginBottom: 18,
//     },

//     ctaSubtitle: {
//         color: "rgba(255,255,255,0.8)",
//         fontSize: 16,
//         lineHeight: 28,
//         marginBottom: 30,
//     },

//     /* FAQ */
//     faqWrapper: {
//         flexDirection: isDesktop ? "row" : "column",
//         gap: 60,
//     },

//     faqLeft: { width: isDesktop ? 300 : "100%" },

//     faqRight: { flex: 1 },

//     faqItem: { borderBottomWidth: 1, borderBottomColor: BORDER },

//     faqButton: {
//         flexDirection: "row",
//         justifyContent: "space-between",
//         alignItems: "center",
//         paddingVertical: 24,
//     },

//     faqQuestion: {
//         fontSize: 16,
//         color: NAVY,
//         fontWeight: "500",
//         flex: 1,
//         paddingRight: 20,
//     },

//     faqAnswer: { color: MUTED, lineHeight: 24, paddingBottom: 20 },

//     /* FOOTER */
//     footer: { backgroundColor: NAVY, paddingTop: 80, paddingBottom: 30 },

//     footerGrid: {
//         flexDirection: isDesktop ? "row" : "column",
//         justifyContent: "space-between",
//         gap: 40,
//         borderBottomWidth: 1,
//         borderBottomColor: "rgba(255,255,255,0.08)",
//         paddingBottom: 40,
//     },

//     footerBrandCol: { maxWidth: 240 },

//     footerHeading: {
//         color: "#fff",
//         fontWeight: "700",
//         marginBottom: 18,
//     },

//     footerText: {
//         color: "#A5B4C7",
//         lineHeight: 24,
//         marginTop: 14,
//     },

//     footerLink: { color: "#A5B4C7", marginBottom: 12 },

//     footerBottom: {
//         paddingTop: 24,
//         flexDirection: "row",
//         justifyContent: "space-between",
//         alignItems: "center",
//     },

//     copyText: { color: "#7B8794", fontSize: 13 },

//     copyLink: { color: "#A5B4C7", textDecorationLine: "underline" },

//     socialRow: { flexDirection: "row", gap: 12 },

//     socialIcon: {
//         width: 32,
//         height: 32,
//         borderRadius: 6,
//         borderWidth: 1,
//         borderColor: "rgba(255,255,255,0.12)",
//         justifyContent: "center",
//         alignItems: "center",
//     },
// });


import React, { useRef, useState, useMemo } from "react";
import {
    View,
    Text,
    ScrollView,
    TouchableOpacity,
    StyleSheet,
    StatusBar,
    Image,
    Platform,
    useWindowDimensions,
} from "react-native";
import { useRouter } from "expo-router";
import Svg, {
    Path,
    Rect,
    Circle,
    Polyline,
    Line,
} from "react-native-svg";

const NAVY  = "#0B1730";
const BLUE  = "#3B82F6";
const MUTED = "#6B7280";
const BORDER = "#E5E7EB";

/* ─────────────── ICONS ─────────────── */

const LinkIcon: React.FC<{ size?: number; color?: string }> = ({
    size = 17,
    color = "#fff",
}) => (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
        <Path d="M10 13a5 5 0 0 0 7.54.54l3-3a5 5 0 0 0-7.07-7.07l-1.72 1.71"
            stroke={color} strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" />
        <Path d="M14 11a5 5 0 0 0-7.54-.54l-3 3a5 5 0 0 0 7.07 7.07l1.71-1.71"
            stroke={color} strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" />
    </Svg>
);

const BrainIcon: React.FC = () => (
    <Svg width={20} height={20} viewBox="0 0 24 24" fill="none">
        <Path d="M9 3a4 4 0 0 0-4 4c0 .34.04.67.11.98A4.002 4.002 0 0 0 3 11a4 4 0 0 0 2.38 3.65A4 4 0 0 0 9 21h6a4 4 0 0 0 3.62-5.35A4 4 0 0 0 21 12a4.002 4.002 0 0 0-2.11-3.52c.07-.3.11-.63.11-.98a4 4 0 0 0-4-4"
            stroke="#3B82F6" strokeWidth="1.5" strokeLinecap="round" />
        <Line x1="12" y1="7" x2="12" y2="21" stroke="#3B82F6" strokeWidth="1.5" strokeLinecap="round" />
    </Svg>
);

const ClockIcon: React.FC = () => (
    <Svg width={20} height={20} viewBox="0 0 24 24" fill="none">
        <Circle cx="12" cy="12" r="9" stroke="#3B82F6" strokeWidth="1.5" />
        <Polyline points="12 7 12 12 15 15" stroke="#3B82F6" strokeWidth="1.5" strokeLinecap="round" />
    </Svg>
);

const ShieldIcon: React.FC = () => (
    <Svg width={20} height={20} viewBox="0 0 24 24" fill="none">
        <Path d="M12 2l8 3.5v5C20 15.5 16.5 20.3 12 22 7.5 20.3 4 15.5 4 10.5v-5L12 2z"
            stroke="#3B82F6" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
        <Polyline points="9 12 11 14 15 10" stroke="#3B82F6" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
    </Svg>
);

const PayIcon: React.FC = () => (
    <Svg width={24} height={24} viewBox="0 0 24 24" fill="none">
        <Rect x="2" y="5" width="20" height="14" rx="3" stroke="#fff" strokeWidth="1.8" />
        <Line x1="2" y1="10" x2="22" y2="10" stroke="#fff" strokeWidth="1.8" />
        <Line x1="6" y1="15" x2="10" y2="15" stroke="#fff" strokeWidth="1.8" strokeLinecap="round" />
    </Svg>
);

const DutyIcon: React.FC = () => (
    <Svg width={24} height={24} viewBox="0 0 24 24" fill="none">
        <Rect x="3" y="4" width="18" height="18" rx="2" stroke="#fff" strokeWidth="1.8" />
        <Line x1="3" y1="9" x2="21" y2="9" stroke="#fff" strokeWidth="1.8" />
        <Line x1="8" y1="2" x2="8" y2="6" stroke="#fff" strokeWidth="1.8" strokeLinecap="round" />
        <Line x1="16" y1="2" x2="16" y2="6" stroke="#fff" strokeWidth="1.8" strokeLinecap="round" />
        <Polyline points="8 13 10 15 14 11" stroke="#fff" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
    </Svg>
);

const SuperviseIcon: React.FC = () => (
    <Svg width={24} height={24} viewBox="0 0 24 24" fill="none">
        <Circle cx="12" cy="8" r="4" stroke="#fff" strokeWidth="1.8" />
        <Path d="M4 20c0-4 3.58-7 8-7s8 3 8 7" stroke="#fff" strokeWidth="1.8" strokeLinecap="round" />
    </Svg>
);

const ChevronDownIcon: React.FC<{ open: boolean }> = ({ open }) => (
    <Svg width={18} height={18} viewBox="0 0 24 24" fill="none"
        style={{ transform: [{ rotate: open ? "180deg" : "0deg" }] }}>
        <Polyline points="6 9 12 15 18 9" stroke="#9CA3AF" strokeWidth="2" strokeLinecap="round" />
    </Svg>
);

const ChevronLeftIcon: React.FC = () => (
    <Svg width={20} height={20} viewBox="0 0 24 24" fill="none">
        <Polyline points="15 18 9 12 15 6" stroke={NAVY} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
    </Svg>
);

const ChevronRightIcon: React.FC = () => (
    <Svg width={20} height={20} viewBox="0 0 24 24" fill="none">
        <Polyline points="9 18 15 12 9 6" stroke={NAVY} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
    </Svg>
);

const TwitterIcon: React.FC = () => (
    <Svg width={16} height={16} viewBox="0 0 24 24" fill="none">
        <Path d="M22 4.01c-.77.35-1.6.58-2.46.69a4.3 4.3 0 0 0 1.88-2.37 8.59 8.59 0 0 1-2.72 1.04 4.28 4.28 0 0 0-7.3 3.9A12.14 12.14 0 0 1 3 3.13a4.28 4.28 0 0 0 1.32 5.71 4.26 4.26 0 0 1-1.94-.53v.05a4.28 4.28 0 0 0 3.43 4.2 4.3 4.3 0 0 1-1.93.07 4.28 4.28 0 0 0 4 2.97A8.58 8.58 0 0 1 2 17.54a12.11 12.11 0 0 0 6.56 1.92c7.88 0 12.19-6.53 12.19-12.19 0-.19 0-.37-.01-.56A8.7 8.7 0 0 0 22 4.01z"
            stroke="#A5B4C7" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
    </Svg>
);

const LinkedInIcon: React.FC = () => (
    <Svg width={16} height={16} viewBox="0 0 24 24" fill="none">
        <Rect x="2" y="2" width="20" height="20" rx="4" stroke="#A5B4C7" strokeWidth="1.5" />
        <Line x1="8" y1="11" x2="8" y2="16" stroke="#A5B4C7" strokeWidth="1.5" strokeLinecap="round" />
        <Line x1="8" y1="8" x2="8" y2="8.5" stroke="#A5B4C7" strokeWidth="2" strokeLinecap="round" />
        <Path d="M12 16v-5m0 0a3 3 0 0 1 5 2.2V16" stroke="#A5B4C7" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
    </Svg>
);

const InstagramIcon: React.FC = () => (
    <Svg width={16} height={16} viewBox="0 0 24 24" fill="none">
        <Rect x="2" y="2" width="20" height="20" rx="5" stroke="#A5B4C7" strokeWidth="1.5" />
        <Circle cx="12" cy="12" r="4" stroke="#A5B4C7" strokeWidth="1.5" />
        <Circle cx="17.5" cy="6.5" r="1" fill="#A5B4C7" />
    </Svg>
);

/* ─────────────── DATA ─────────────── */

const services = [
    {
        Icon: PayIcon,
        title: "One-Hand Payments",
        desc: "Integrated payment system for seamless, one-hand processing from onboarding and payouts to salaries.",
    },
    {
        Icon: DutyIcon,
        title: "Duty Management",
        desc: "Streamlined scheduling of duty rosters, shift management, and attendance tracking to ensure seamless hospital operations.",
    },
    {
        Icon: SuperviseIcon,
        title: "Clinical Supervision",
        desc: "Experienced intensivists provide clinical oversight, ensuring quality compliance and improved patient outcomes.",
    },
];

const faqs = [
    {
        q: "What services does Hospilink provide?",
        a: "Hospilink provides AI-powered healthcare staffing solutions including smart staff matching, duty management, clinical supervision, and integrated payment processing for hospitals and medical professionals.",
    },
    {
        q: "Who can use Hospilink?",
        a: "Hospitals and medical professionals including doctors, nurses, and other healthcare staff can use Hospilink to connect, schedule duties, and manage payments.",
    },
    {
        q: "How does Hospilink verify medical professionals?",
        a: "All professionals undergo strict verification checks including credential validation, license verification, and comprehensive background checks for complete peace of mind.",
    },
    {
        q: "Is my personal and professional information secure?",
        a: "Yes, all information is securely encrypted using industry-standard protocols. Your data privacy and security is our top priority.",
    },
    {
        q: "Is there a registration fee to join Hospilink?",
        a: "Registration is completely free for medical staff. Hospitals can get started with our flexible plans tailored to their needs.",
    },
];

const steps = [
    {
        label: "Create Account",
        desc: "Sign up as a hospital or medical staff member with a simple registration process.",
    },
    {
        label: "Complete Profile",
        desc: "Add your professional details, preferences, and availability for better matching.",
    },
    {
        label: "Start Connecting",
        desc: "Hospitals post duties and staff accept them instantly through our platform.",
    },
];

const features = [
    {
        Icon: BrainIcon,
        title: "Smart Staff Matching",
        desc: "AI-powered matching system connects hospitals with the right medical professionals based on skills, availability, and preferences.",
    },
    {
        Icon: ClockIcon,
        title: "Real Time Scheduling",
        desc: "Dynamic duty management with instant notifications, conflict prevention, and automated scheduling for optimal staff utilization.",
    },
    {
        Icon: ShieldIcon,
        title: "Verified Professionals",
        desc: "All medical staff are thoroughly verified with credentials, licenses, and background checks for complete peace of mind.",
    },
];

/* ─────────────── COMPONENT ─────────────── */

export default function LandingPage() {
    const router = useRouter();
    const scrollRef = useRef<ScrollView>(null);
    const { width } = useWindowDimensions();

    // Reactive breakpoint — recalculates on rotation / window resize
    const isDesktop = width >= 900;

    const featureY  = useRef(0);
    const solutionY = useRef(0);
    const aboutY    = useRef(0);

    const [faqOpen, setFaqOpen]         = useState<number | null>(null);
    const [serviceIndex, setServiceIndex] = useState(0);

    // Rebuild styles whenever the breakpoint changes
    const s = useMemo(() => makeStyles(isDesktop, width), [isDesktop, width]);

    const scrollTo = (y: number) =>
        scrollRef.current?.scrollTo({ y, animated: true });

    const prevService = () =>
        setServiceIndex((i) => (i === 0 ? services.length - 1 : i - 1));
    const nextService = () =>
        setServiceIndex((i) => (i === services.length - 1 ? 0 : i + 1));

    const visibleServices = isDesktop ? services : [services[serviceIndex]];

    return (
        <View style={s.root}>
            <StatusBar backgroundColor={NAVY} barStyle="light-content" />

            {/* ── NAVBAR ── */}
            <View style={s.navbar}>
                <View style={s.container}>
                    <View style={s.navInner}>
                        <TouchableOpacity
                            style={s.logoRow}
                            onPress={() => router.push("/auth/home")}
                        >
                            <View style={s.logoIcon}>
                                <LinkIcon />
                            </View>
                            <Text style={s.logoText}>HOSPILINK</Text>
                        </TouchableOpacity>

                        {isDesktop && (
                            <View style={s.desktopNav}>
                                <TouchableOpacity onPress={() => scrollTo(featureY.current)}>
                                    <Text style={s.navLink}>Features</Text>
                                </TouchableOpacity>
                                <TouchableOpacity onPress={() => scrollTo(solutionY.current)}>
                                    <Text style={s.navLink}>Solutions</Text>
                                </TouchableOpacity>
                                <TouchableOpacity onPress={() => scrollTo(aboutY.current)}>
                                    <Text style={s.navLink}>About Us</Text>
                                </TouchableOpacity>
                                <TouchableOpacity
                                    onPress={() => router.push({ pathname: "/auth/login", params: { tab: "signin" } })}
                                    style={s.outlineBtn}
                                >
                                    <Text style={s.outlineBtnText}>Sign In</Text>
                                </TouchableOpacity>
                            </View>
                        )}

                        {/* Mobile: show Sign In button in navbar */}
                        {!isDesktop && (
                            <TouchableOpacity
                                onPress={() => router.push({ pathname: "/auth/login", params: { tab: "signin" } })}
                                style={s.outlineBtn}
                            >
                                <Text style={s.outlineBtnText}>Sign In</Text>
                            </TouchableOpacity>
                        )}
                    </View>
                </View>
            </View>

            {/* ── BODY ── */}
            <ScrollView ref={scrollRef} showsVerticalScrollIndicator={false}>

                {/* ── HERO ── */}
                <View style={s.container}>
                    <View style={s.heroContainer}>
                        <View style={s.heroLeft}>
                            <Text style={s.heroTitle}>
                                Revolutionizing Healthcare Staff Management
                            </Text>
                            <Text style={s.heroSubtitle}>
                                Connect hospitals with qualified medical staff seamlessly
                            </Text>
                            <TouchableOpacity
                                style={s.blueBtn}
                                onPress={() => router.push({ pathname: "/auth/login", params: { tab: "signup" } })}
                            >
                                <Text style={s.blueBtnText}>Sign Up</Text>
                            </TouchableOpacity>
                        </View>

                        <View style={s.heroRight}>
                            <View style={s.heroShape} />
                            <Image
                                source={require("../../../assets/Images/hero-doctor.png")}
                                style={s.heroImage}
                                resizeMode="contain"
                            />
                        </View>
                    </View>

                    {/* STATS — 2×2 on mobile, 1×4 on desktop */}
                    <View style={s.statsBar}>
                        {[
                            ["99.9%", "Satisfaction Rate"],
                            ["500+",  "Hospitals"],
                            ["10,000+", "Medical Staff"],
                            ["50,000+", "Duties Completed"],
                        ].map(([num, label], i) => (
                            <View
                                key={i}
                                style={[
                                    s.statItem,
                                    !isDesktop && i % 2 !== 1 && s.statBorderRight,
                                    !isDesktop && i < 2       && s.statBorderBottom,
                                    isDesktop  && i !== 3     && s.statBorderRight,
                                ]}
                            >
                                <Text style={s.statNumber}>{num}</Text>
                                <Text style={s.statLabel}>{label}</Text>
                            </View>
                        ))}
                    </View>
                </View>

                {/* ── WHY CHOOSE ── */}
                <View
                    onLayout={(e) => { featureY.current = e.nativeEvent.layout.y; }}
                    style={s.section}
                >
                    <View style={s.container}>
                        <View style={s.whyContainer}>
                            <Image
                                source={require("../../../assets/Images/hero-doctor.png")}
                                style={s.teamImage}
                                resizeMode="cover"
                            />
                            <View style={s.whyContent}>
                                <Text style={s.sectionTitle}>Why Choose Hospilink</Text>
                                <Text style={s.sectionSubtitle}>
                                    Comprehensive solution for modern healthcare staffing needs
                                </Text>
                                {features.map(({ Icon, title, desc }, i) => (
                                    <View key={i} style={s.featureRow}>
                                        <View style={s.featureIcon}>
                                            <Icon />
                                        </View>
                                        <View style={{ flex: 1 }}>
                                            <Text style={s.featureTitle}>{title}</Text>
                                            <Text style={s.featureDesc}>{desc}</Text>
                                        </View>
                                    </View>
                                ))}
                            </View>
                        </View>
                    </View>
                </View>

                {/* ── SERVICES ── */}
                <View
                    onLayout={(e) => { solutionY.current = e.nativeEvent.layout.y; }}
                    style={s.section}
                >
                    <View style={s.container}>
                        <Text style={s.centerTitle}>
                            Empowering Hospitals with Reliable Doctor Workforce Management Services
                        </Text>

                        <View style={s.carouselWrapper}>
                            <TouchableOpacity style={s.carouselArrow} onPress={prevService}>
                                <ChevronLeftIcon />
                            </TouchableOpacity>

                            <View style={s.serviceRow}>
                                {visibleServices.map((item, i) => (
                                    <View key={i} style={s.serviceCard}>
                                        <View style={s.serviceIconBg}>
                                            <item.Icon />
                                        </View>
                                        <Text style={s.serviceTitle}>{item.title}</Text>
                                        <Text style={s.serviceDesc}>{item.desc}</Text>
                                    </View>
                                ))}
                            </View>

                            <TouchableOpacity style={s.carouselArrow} onPress={nextService}>
                                <ChevronRightIcon />
                            </TouchableOpacity>
                        </View>

                        {/* Dot indicators on mobile */}
                        {!isDesktop && (
                            <View style={s.dotsRow}>
                                {services.map((_, i) => (
                                    <TouchableOpacity
                                        key={i}
                                        onPress={() => setServiceIndex(i)}
                                        style={[s.dot, i === serviceIndex && s.dotActive]}
                                    />
                                ))}
                            </View>
                        )}
                    </View>
                </View>

                {/* ── HOW IT WORKS ── */}
                <View
                    onLayout={(e) => { aboutY.current = e.nativeEvent.layout.y; }}
                    style={s.section}
                >
                    <View style={s.container}>
                        <Text style={s.sectionTitle}>How It Works</Text>
                        {steps.map((step, i) => (
                            <View key={i} style={s.stepRow}>
                                <Text style={s.stepNumber}>{i + 1}</Text>
                                <View style={s.stepTextBlock}>
                                    <Text style={s.stepTitle}>{step.label}</Text>
                                    <Text style={s.stepDesc}>{step.desc}</Text>
                                </View>
                            </View>
                        ))}
                    </View>
                </View>

                {/* ── CTA ── */}
                <View style={s.ctaSection}>
                    <View style={s.container}>
                        <View style={s.ctaWrapper}>
                            <Image
                                source={require("../../../assets/Images/hero-doctor.png")}
                                style={s.ctaImage}
                            />
                            <View style={s.ctaContent}>
                                <Text style={s.ctaTitle}>
                                    Ready to Transform Healthcare Staffing?
                                </Text>
                                <Text style={s.ctaSubtitle}>
                                    Join thousands of healthcare professionals already using Hospilink
                                </Text>
                                <TouchableOpacity style={s.whiteBtn}>
                                    <Text style={s.whiteBtnText}>Get Started Today</Text>
                                </TouchableOpacity>
                            </View>
                        </View>
                    </View>
                </View>

                {/* ── FAQ ── */}
                <View style={s.section}>
                    <View style={s.container}>
                        <View style={s.faqWrapper}>
                            <View style={s.faqLeft}>
                                <Text style={s.sectionTitle}>Frequently Asked Questions</Text>
                                <Text style={s.sectionSubtitle}>
                                    Find answers to common questions about Hospilink, healthcare staffing, account management, and platform services.
                                </Text>
                            </View>
                            <View style={s.faqRight}>
                                {faqs.map((faq, i) => (
                                    <View key={i} style={s.faqItem}>
                                        <TouchableOpacity
                                            style={s.faqButton}
                                            onPress={() => setFaqOpen(faqOpen === i ? null : i)}
                                        >
                                            <Text style={s.faqQuestion}>{faq.q}</Text>
                                            <ChevronDownIcon open={faqOpen === i} />
                                        </TouchableOpacity>
                                        {faqOpen === i && (
                                            <Text style={s.faqAnswer}>{faq.a}</Text>
                                        )}
                                    </View>
                                ))}
                            </View>
                        </View>
                    </View>
                </View>

                {/* ── FOOTER ── */}
                <View style={s.footer}>
                    <View style={s.container}>
                        <View style={s.footerGrid}>
                            <View style={s.footerBrandCol}>
                                <TouchableOpacity
                                    style={s.logoRow}
                                    onPress={() => router.push("/auth/home")}
                                >
                                    <View style={s.logoIcon}>
                                        <LinkIcon />
                                    </View>
                                    <Text style={s.logoText}>HOSPILINK</Text>
                                </TouchableOpacity>
                                <Text style={s.footerText}>
                                    Connect with us for seamless healthcare staffing solutions and opportunities.
                                </Text>
                            </View>

                            {/* On mobile: 2-column link grid */}
                            <View style={s.footerLinksGrid}>
                                <View style={s.footerLinksCol}>
                                    <Text style={s.footerHeading}>For Hospitals</Text>
                                    <Text style={s.footerLink}>Post Duties</Text>
                                    <Text style={s.footerLink}>Find Staff</Text>
                                    <Text style={s.footerLink}>Manage Schedules</Text>
                                </View>
                                <View style={s.footerLinksCol}>
                                    <Text style={s.footerHeading}>For Medical Staff</Text>
                                    <Text style={s.footerLink}>Find Opportunities</Text>
                                    <Text style={s.footerLink}>Manage Availability</Text>
                                    <Text style={s.footerLink}>Track Earnings</Text>
                                </View>
                                <View style={s.footerLinksCol}>
                                    <Text style={s.footerHeading}>Support</Text>
                                    <Text style={s.footerLink}>Help Center</Text>
                                    <TouchableOpacity onPress={() => router.push("/auth/contact-us")}>
                                        <Text style={s.footerLink}>Contact Us</Text>
                                    </TouchableOpacity>
                                </View>
                            </View>
                        </View>

                        <View style={s.footerBottom}>
                            <Text style={s.copyText}>
                                © 2025 Hospilink. All rights reserved.{" "}
                                <Text
                                    style={s.copyLink}
                                    onPress={() => router.push("/auth/privacy-policy")}
                                >
                                    Privacy Policy
                                </Text>
                            </Text>
                            <View style={s.socialRow}>
                                <View style={s.socialIcon}><TwitterIcon /></View>
                                <View style={s.socialIcon}><LinkedInIcon /></View>
                                <View style={s.socialIcon}><InstagramIcon /></View>
                            </View>
                        </View>
                    </View>
                </View>

            </ScrollView>
        </View>
    );
}

/* ─────────────── DYNAMIC STYLES ─────────────── */

function makeStyles(isDesktop: boolean, screenWidth: number) {
    return StyleSheet.create({
        root: { flex: 1, backgroundColor: "#fff" },

        container: {
            width: "100%",
            maxWidth: 1200,
            alignSelf: "center",
            paddingHorizontal: isDesktop ? 20 : 16,
        },

        /* NAVBAR */
        navbar: {
            height: 64,
            backgroundColor: NAVY,
            justifyContent: "center",
            ...Platform.select({
                ios:     { shadowColor: "#000", shadowOpacity: 0.1, shadowRadius: 4 },
                android: { elevation: 5 },
            }),
        },
        navInner: {
            flexDirection: "row",
            justifyContent: "space-between",
            alignItems: "center",
        },
        logoRow:  { flexDirection: "row", alignItems: "center" },
        logoIcon: {
            width: 34, height: 34,
            borderRadius: 8,
            backgroundColor: "rgba(255,255,255,0.08)",
            alignItems: "center",
            justifyContent: "center",
            marginRight: 10,
        },
        logoText: {
            color: "#fff", fontWeight: "700",
            fontSize: 15,  letterSpacing: 1,
        },
        desktopNav: {
            flexDirection: "row",
            alignItems: "center",
            gap: 36,
        },
        navLink: { color: "#E5E7EB", fontSize: 14, fontWeight: "500" },

        outlineBtn: {
            borderWidth: 1, borderColor: "#fff",
            paddingHorizontal: isDesktop ? 20 : 14,
            paddingVertical: 7,
            borderRadius: 8,
        },
        outlineBtnText: { color: "#fff", fontWeight: "600", fontSize: 13 },

        /* Buttons */
        blueBtn: {
            backgroundColor: BLUE,
            paddingHorizontal: 28,
            paddingVertical: 14,
            borderRadius: 8,
            alignSelf: "flex-start",
        },
        blueBtnText: { color: "#fff", fontWeight: "600" },

        whiteBtn: {
            backgroundColor: "#fff",
            paddingHorizontal: 26,
            paddingVertical: 13,
            borderRadius: 8,
            alignSelf: isDesktop ? "flex-start" : "center",
        },
        whiteBtnText: { color: NAVY, fontWeight: "600" },

        /* HERO */
        heroContainer: {
            flexDirection: isDesktop ? "row" : "column",
            alignItems: isDesktop ? "center" : "stretch",
            justifyContent: "space-between",
            paddingTop: isDesktop ? 70 : 40,
            gap: isDesktop ? 60 : 32,
        },
        heroLeft: {
            flex: isDesktop ? 1 : undefined,
            maxWidth: isDesktop ? 580 : undefined,
            alignItems: isDesktop ? "flex-start" : "center",
        },
        heroTitle: {
            fontSize: isDesktop ? 58 : 30,
            lineHeight: isDesktop ? 66 : 38,
            fontWeight: "800",
            color: NAVY,
            marginBottom: 16,
            letterSpacing: isDesktop ? -2 : -1,
            textAlign: isDesktop ? "left" : "center",
        },
        heroSubtitle: {
            fontSize: 15,
            color: MUTED,
            lineHeight: 26,
            marginBottom: 28,
            textAlign: isDesktop ? "left" : "center",
            maxWidth: isDesktop ? 400 : undefined,
        },
        heroRight: {
            width: isDesktop ? 430 : "100%",
            height: isDesktop ? 480 : 240,
            position: "relative",
            justifyContent: "flex-end",
        },
        heroShape: {
            position: "absolute",
            width: "100%",
            height: "80%",
            backgroundColor: "#E7EEF8",
            borderRadius: 120,
            bottom: 0,
        },
        heroImage: { width: "100%", height: "100%" },

        /* STATS — 2×2 grid on mobile */
        statsBar: {
            flexDirection: "row",
            flexWrap: isDesktop ? "nowrap" : "wrap",
            marginTop: 32,
            borderWidth: 1,
            borderColor: BORDER,
            borderRadius: 10,
            overflow: "hidden",
            marginBottom: 50,
        },
        statItem: {
            width: isDesktop ? undefined : "50%",
            flex: isDesktop ? 1 : undefined,
            paddingVertical: isDesktop ? 22 : 18,
            alignItems: "center",
        },
        statBorderRight:  { borderRightWidth: 1,  borderRightColor:  BORDER },
        statBorderBottom: { borderBottomWidth: 1, borderBottomColor: BORDER },

        statNumber: { fontSize: isDesktop ? 24 : 20, fontWeight: "800", color: NAVY },
        statLabel:  { fontSize: 12, color: MUTED, marginTop: 5, textAlign: "center", paddingHorizontal: 4 },

        /* SECTIONS */
        section: { paddingVertical: isDesktop ? 70 : 48 },

        sectionTitle: {
            fontSize: isDesktop ? 40 : 26,
            fontWeight: "800",
            color: NAVY,
            marginBottom: 12,
            lineHeight: isDesktop ? 48 : 34,
        },
        sectionSubtitle: {
            fontSize: 14,
            color: MUTED,
            lineHeight: 24,
            marginBottom: 24,
        },

        /* WHY CHOOSE */
        whyContainer: {
            flexDirection: isDesktop ? "row" : "column",
            gap: isDesktop ? 50 : 28,
            alignItems: isDesktop ? "center" : "stretch",
        },
        teamImage: {
            width: isDesktop ? 420 : "100%",
            height: isDesktop ? 320 : 220,
            borderRadius: 8,
        },
        whyContent: { flex: 1 },
        featureRow: { flexDirection: "row", gap: 14, marginBottom: 22 },
        featureIcon: {
            width: 44, height: 44,
            borderWidth: 1, borderColor: BORDER,
            borderRadius: 8,
            justifyContent: "center",
            alignItems: "center",
            backgroundColor: "#F0F5FF",
            flexShrink: 0,
        },
        featureTitle: { fontWeight: "700", color: NAVY, marginBottom: 5, fontSize: 14 },
        featureDesc:  { color: MUTED, lineHeight: 22, fontSize: 13 },

        /* SERVICES CAROUSEL */
        centerTitle: {
            fontSize: isDesktop ? 38 : 22,
            fontWeight: "800",
            textAlign: "center",
            lineHeight: isDesktop ? 50 : 30,
            marginBottom: isDesktop ? 50 : 30,
            color: NAVY,
        },
        carouselWrapper: {
            flexDirection: "row",
            alignItems: "center",
            gap: 10,
        },
        carouselArrow: {
            width: 36, height: 36,
            borderRadius: 18,
            borderWidth: 1, borderColor: BORDER,
            justifyContent: "center",
            alignItems: "center",
            backgroundColor: "#fff",
            flexShrink: 0,
        },
        serviceRow: {
            flex: 1,
            flexDirection: isDesktop ? "row" : "column",
            gap: 16,
        },
        serviceCard: {
            flex: isDesktop ? 1 : undefined,
            borderWidth: 1, borderColor: BORDER,
            padding: isDesktop ? 30 : 22,
            alignItems: "center",
            borderRadius: 8,
        },
        serviceIconBg: {
            width: 56, height: 56,
            borderRadius: 14,
            backgroundColor: BLUE,
            justifyContent: "center",
            alignItems: "center",
            marginBottom: 16,
        },
        serviceTitle: {
            fontWeight: "700",
            marginBottom: 10,
            color: NAVY,
            fontSize: 15,
            textAlign: "center",
        },
        serviceDesc: {
            color: MUTED,
            textAlign: "center",
            lineHeight: 22,
            fontSize: 14,
        },

        /* Carousel dots */
        dotsRow: {
            flexDirection: "row",
            justifyContent: "center",
            gap: 8,
            marginTop: 16,
        },
        dot: {
            width: 8, height: 8,
            borderRadius: 4,
            backgroundColor: BORDER,
        },
        dotActive: { backgroundColor: BLUE, width: 20 },

        /* HOW IT WORKS */
        stepRow: {
            flexDirection: isDesktop ? "row" : "column",
            alignItems: isDesktop ? "center" : "flex-start",
            borderBottomWidth: 1,
            borderBottomColor: BORDER,
            paddingVertical: isDesktop ? 28 : 20,
            gap: isDesktop ? 0 : 6,
        },
        stepNumber: {
            width: isDesktop ? 80 : undefined,
            fontSize: isDesktop ? 28 : 22,
            fontWeight: "600",
            color: BLUE,
            marginBottom: isDesktop ? 0 : 4,
        },
        stepTextBlock: {
            flex: 1,
            flexDirection: isDesktop ? "row" : "column",
            gap: isDesktop ? 0 : 4,
        },
        stepTitle: {
            width: isDesktop ? 260 : undefined,
            fontSize: isDesktop ? 24 : 17,
            fontWeight: "700",
            color: NAVY,
            marginBottom: isDesktop ? 0 : 4,
        },
        stepDesc: { flex: 1, color: MUTED, lineHeight: 24, fontSize: 14 },

        /* CTA */
        ctaSection: {
            backgroundColor: BLUE,
            paddingVertical: isDesktop ? 80 : 50,
        },
        ctaWrapper: {
            flexDirection: isDesktop ? "row" : "column",
            gap: isDesktop ? 50 : 28,
            alignItems: "center",
        },
        ctaImage: {
            width: isDesktop ? 240 : "100%",
            height: isDesktop ? 280 : 200,
            borderRadius: 10,
        },
        ctaContent: {
            flex: isDesktop ? 1 : undefined,
            alignItems: isDesktop ? "flex-start" : "center",
        },
        ctaTitle: {
            color: "#fff",
            fontSize: isDesktop ? 52 : 26,
            lineHeight: isDesktop ? 60 : 34,
            fontWeight: "800",
            marginBottom: 16,
            textAlign: isDesktop ? "left" : "center",
        },
        ctaSubtitle: {
            color: "rgba(255,255,255,0.85)",
            fontSize: 15,
            lineHeight: 26,
            marginBottom: 26,
            textAlign: isDesktop ? "left" : "center",
        },

        /* FAQ */
        faqWrapper: {
            flexDirection: isDesktop ? "row" : "column",
            gap: isDesktop ? 60 : 28,
        },
        faqLeft:  { width: isDesktop ? 300 : "100%" },
        faqRight: { flex: 1 },
        faqItem:  { borderBottomWidth: 1, borderBottomColor: BORDER },
        faqButton: {
            flexDirection: "row",
            justifyContent: "space-between",
            alignItems: "center",
            paddingVertical: 20,
        },
        faqQuestion: {
            fontSize: 15,
            color: NAVY,
            fontWeight: "500",
            flex: 1,
            paddingRight: 16,
        },
        faqAnswer: { color: MUTED, lineHeight: 24, paddingBottom: 18, fontSize: 14 },

        /* FOOTER */
        footer: { backgroundColor: NAVY, paddingTop: isDesktop ? 80 : 48, paddingBottom: 30 },
        footerGrid: {
            flexDirection: isDesktop ? "row" : "column",
            justifyContent: "space-between",
            gap: isDesktop ? 40 : 32,
            borderBottomWidth: 1,
            borderBottomColor: "rgba(255,255,255,0.08)",
            paddingBottom: 36,
        },
        footerBrandCol: { maxWidth: isDesktop ? 240 : undefined },
        footerHeading: { color: "#fff", fontWeight: "700", marginBottom: 14 },
        footerText: { color: "#A5B4C7", lineHeight: 24, marginTop: 12 },
        footerLink: { color: "#A5B4C7", marginBottom: 10 },

        /* 3-column grid for footer links on mobile */
        footerLinksGrid: {
            flexDirection: "row",
            flexWrap: "wrap",
            gap: isDesktop ? 40 : 0,
            justifyContent: isDesktop ? "flex-start" : "space-between",
        },
        footerLinksCol: {
            width: isDesktop ? undefined : "31%",
            minWidth: isDesktop ? 120 : undefined,
        },

        footerBottom: {
            paddingTop: 20,
            flexDirection: isDesktop ? "row" : "column",
            justifyContent: "space-between",
            alignItems: isDesktop ? "center" : "flex-start",
            gap: isDesktop ? 0 : 14,
        },
        copyText: { color: "#7B8794", fontSize: 12, lineHeight: 20 },
        copyLink: { color: "#A5B4C7", textDecorationLine: "underline" },
        socialRow: { flexDirection: "row", gap: 10 },
        socialIcon: {
            width: 32, height: 32,
            borderRadius: 6,
            borderWidth: 1,
            borderColor: "rgba(255,255,255,0.12)",
            justifyContent: "center",
            alignItems: "center",
        },
    });
}
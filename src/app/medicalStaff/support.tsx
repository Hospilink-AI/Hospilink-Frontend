import { Ionicons } from "@expo/vector-icons";
import { router } from "expo-router"; // <-- Imported router
import React, { useState } from "react";
import {
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

// ─── Data ─────────────────────────────────────────────────────────────────────

const CATEGORIES = [
  {
    id: "tech-support",
    title: "Technical Support",
    desc: "Software issues, hardware connectivity, and system bugs.",
    icon: "shield-checkmark",
  },
  {
    id: "billing",
    title: "Billing & Finance",
    desc: "Insurance claims, invoicing, and payroll inquiries.",
    icon: "shield-checkmark",
  },
  {
    id: "patient-mgmt",
    title: "Patient Management",
    desc: "Scheduling, record updates, and portal access help.",
    icon: "shield-checkmark",
  },
  {
    id: "account-settings",
    title: "Account Settings",
    desc: "Profile updates, security settings, and permissions.",
    icon: "shield-checkmark",
  },
];

const FAQS = [
  {
    id: "faq-1",
    question: "How to sync patient mobile apps?",
    answer:
      "Navigate to the Patient Profile > App Access > Generate Sync QR Code. Ensure the patient has the latest 'Hospilink' app installed.",
  },
  {
    id: "faq-2",
    question: "Resetting hospital workstation login?",
    answer: "Please contact the IT department to securely reset your workstation credentials.",
  },
  {
    id: "faq-3",
    question: "Accessing previous year's payroll?",
    answer: "Go to the Finance Portal and select 'Historical Payroll' from the left-hand menu.",
  },
  {
    id: "faq-4",
    question: "Reporting EMR downtime?",
    answer: "Use the emergency IT hotline or click the 'Report Outage' button on your dashboard.",
  },
];

// ─── Main Component ───────────────────────────────────────────────────────────

export default function SupportScreen() {
  const { width } = useWindowDimensions();
  const isMobile = width < 768;

  const [searchQuery, setSearchQuery] = useState("");
  const [activeCategory, setActiveCategory] = useState("billing");
  const [expandedFaq, setExpandedFaq] = useState<string | null>("faq-1");

  const toggleFaq = (id: string) => {
    setExpandedFaq(expandedFaq === id ? null : id);
  };

  const handleBack = () => {
    router.push("/medicalStaff/dashboard");
  };

  return (
    <SafeAreaView style={styles.safeArea}>
      <StatusBar barStyle="dark-content" backgroundColor="#F8FAFC" />

      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={[styles.contentContainer, isMobile && styles.contentContainerMobile]}
        showsVerticalScrollIndicator={false}
      >
        {/* ── Top Navigation / Back Button ── */}
        <View style={styles.topNav}>
          <TouchableOpacity style={styles.backBtn} onPress={handleBack}>
            <Ionicons name="chevron-back" size={24} color="#1F2937" />
          </TouchableOpacity>
        </View>

        {/* ── Header & Search ── */}
        <View style={styles.headerSection}>
          <Text style={styles.mainTitle}>How can we help you today?</Text>
          <Text style={styles.subTitle}>
            Search our knowledge base or browse support categories below.
          </Text>

          <View style={styles.searchBarContainer}>
            <Ionicons name="search-outline" size={20} color="#9CA3AF" />
            <TextInput
              style={styles.searchInput}
              placeholder="Search for articles, guides, or troubleshooting..."
              placeholderTextColor="#9CA3AF"
              value={searchQuery}
              onChangeText={setSearchQuery}
            />
          </View>
        </View>

        {/* ── Support Categories ── */}
        <View style={styles.section}>
          <View style={styles.sectionHeaderRow}>
            <Text style={styles.sectionTitle}>Support Categories</Text>
            <TouchableOpacity style={styles.viewAllBtn}>
              <Text style={styles.viewAllText}>View All Categories</Text>
              <Ionicons name="arrow-forward" size={16} color="#3B82F6" />
            </TouchableOpacity>
          </View>

          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={styles.categoriesScrollContent}
          >
            {CATEGORIES.map((cat) => {
              const isActive = activeCategory === cat.id;
              return (
                <TouchableOpacity
                  key={cat.id}
                  style={[styles.categoryCard, isActive && styles.categoryCardActive]}
                  onPress={() => setActiveCategory(cat.id)}
                  activeOpacity={0.8}
                >
                  <View style={styles.iconWrapper}>
                    <Ionicons name={cat.icon as any} size={20} color="#3B82F6" />
                  </View>
                  <Text style={styles.categoryTitle}>{cat.title}</Text>
                  <Text style={styles.categoryDesc}>{cat.desc}</Text>
                </TouchableOpacity>
              );
            })}
          </ScrollView>
        </View>

        {/* ── Staff FAQ ── */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Staff FAQ</Text>

          <View style={styles.faqContainer}>
            {FAQS.map((faq, index) => {
              const isExpanded = expandedFaq === faq.id;
              const isLast = index === FAQS.length - 1;

              return (
                <View key={faq.id} style={[styles.faqItem, !isLast && styles.faqItemBorder]}>
                  <TouchableOpacity
                    style={styles.faqQuestionRow}
                    onPress={() => toggleFaq(faq.id)}
                    activeOpacity={0.7}
                  >
                    <Text style={styles.faqQuestion}>{faq.question}</Text>
                    <Ionicons
                      name={isExpanded ? "chevron-up" : "chevron-down"}
                      size={20}
                      color="#6B7280"
                    />
                  </TouchableOpacity>

                  {isExpanded && (
                    <View style={styles.faqAnswerContainer}>
                      <Text style={styles.faqAnswer}>{faq.answer}</Text>
                    </View>
                  )}
                </View>
              );
            })}
          </View>
        </View>

        {/* ── Footer ── */}
        <View style={styles.footer}>
          <Text style={styles.footerText}>
            © 2024 Hospilink Medical Systems. All rights reserved.
          </Text>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

// ─── Styles ───────────────────────────────────────────────────────────────────

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: "#F8FAFC", 
  },
  scrollView: {
    flex: 1,
  },
  contentContainer: {
    paddingHorizontal: 40,
    paddingTop: 30, // Reduced slightly to accommodate the back button
    paddingBottom: 40,
    maxWidth: 1100,
    alignSelf: "center",
    width: "100%",
  },
  contentContainerMobile: {
    paddingHorizontal: 20,
    paddingTop: 20,
  },
  
  /* Top Nav / Back Button */
  topNav: {
    width: "100%",
    alignItems: "flex-start",
    marginBottom: 10,
  },
  backBtn: {
    padding: 8,
    marginLeft: -8, // Counters padding to align flush left
    borderRadius: 8,
  },

  /* Header Section */
  headerSection: {
    alignItems: "center",
    marginBottom: 50,
  },
  mainTitle: {
    fontSize: 28,
    fontWeight: "700",
    color: "#1F2937",
    marginBottom: 12,
    textAlign: "center",
  },
  subTitle: {
    fontSize: 15,
    color: "#6B7280",
    marginBottom: 30,
    textAlign: "center",
  },
  searchBarContainer: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#FFFFFF",
    width: "100%",
    maxWidth: 700,
    height: 54,
    borderRadius: 12,
    paddingHorizontal: 16,
    shadowColor: "#000",
    shadowOpacity: 0.05,
    shadowRadius: 10,
    shadowOffset: { width: 0, height: 4 },
    elevation: 4,
  },
  
  searchInput: {
    flex: 1,
    marginLeft: 12,
    fontSize: 15,
    color: "#1F2937",
    height: "100%",
    ...(Platform.select({
      web: { outlineStyle: 'none' }
    }) as any),
  },

  /* Sections General */
  section: {
    marginBottom: 40,
  },
  sectionHeaderRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 20,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: "700",
    color: "#1F2937",
    marginBottom: 20,
  },
  viewAllBtn: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
  },
  viewAllText: {
    color: "#3B82F6",
    fontSize: 14,
    fontWeight: "600",
  },

  /* Categories */
  categoriesScrollContent: {
    gap: 16,
    paddingBottom: 10,
  },
  categoryCard: {
    backgroundColor: "#FFFFFF",
    width: 240,
    padding: 24,
    borderRadius: 16,
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 2,
    borderColor: "transparent",
    shadowColor: "#000",
    shadowOpacity: 0.04,
    shadowRadius: 8,
    shadowOffset: { width: 0, height: 2 },
    elevation: 2,
  },
  categoryCardActive: {
    borderColor: "#3B82F6", 
  },
  iconWrapper: {
    width: 48,
    height: 48,
    borderRadius: 12,
    backgroundColor: "#EFF6FF", 
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 16,
  },
  categoryTitle: {
    fontSize: 15,
    fontWeight: "700",
    color: "#1F2937",
    marginBottom: 10,
    textAlign: "center",
  },
  categoryDesc: {
    fontSize: 13,
    color: "#6B7280",
    textAlign: "center",
    lineHeight: 20,
  },

  /* FAQ */
  faqContainer: {
    backgroundColor: "#FFFFFF",
    borderRadius: 16,
    paddingHorizontal: 24,
    shadowColor: "#000",
    shadowOpacity: 0.03,
    shadowRadius: 10,
    shadowOffset: { width: 0, height: 4 },
    elevation: 3,
  },
  faqItem: {
    paddingVertical: 20,
  },
  faqItemBorder: {
    borderBottomWidth: 1,
    borderBottomColor: "#F3F4F6",
  },
  faqQuestionRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  faqQuestion: {
    fontSize: 14,
    fontWeight: "600",
    color: "#374151",
    flex: 1,
    paddingRight: 16,
  },
  faqAnswerContainer: {
    marginTop: 12,
    paddingRight: 32,
  },
  faqAnswer: {
    fontSize: 13,
    color: "#6B7280",
    lineHeight: 22,
  },

  /* Footer */
  footer: {
    marginTop: 20,
    borderTopWidth: 1,
    borderTopColor: "#E5E7EB",
    paddingTop: 24,
    alignItems: "flex-start",
  },
  footerText: {
    fontSize: 12,
    color: "#9CA3AF",
  },
});
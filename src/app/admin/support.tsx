import { Ionicons } from "@expo/vector-icons";
import { router } from "expo-router";
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
    icon: "hardware-chip-outline",
  },
  {
    id: "billing",
    title: "Billing & Finance",
    desc: "Insurance claims, invoicing, and payroll inquiries.",
    icon: "receipt-outline",
  },
  {
    id: "patient-mgmt",
    title: "Patient Management",
    desc: "Scheduling, record updates, and portal access help.",
    icon: "shield-checkmark-outline",
  },
  {
    id: "account-settings",
    title: "Account Settings",
    desc: "Profile updates, security settings, and permissions.",
    icon: "shield-outline",
  },
];

const FAQS = [
  {
    id: "faq-1",
    question: "How to sync patient mobile apps?",
    answer:
      "Navigate to the Patient Profile > App Access > Generate Sync QR Code. Ensure the patient has the lates 'Hospilink' app installed.",
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
  const isTablet = width >= 768 && width < 1024;

  const [searchQuery, setSearchQuery] = useState("");
  const [expandedFaq, setExpandedFaq] = useState<string | null>("faq-1");

  const toggleFaq = (id: string) => {
    setExpandedFaq(expandedFaq === id ? null : id);
  };

  // Dynamically determine the width for the category cards based on screen size
  const getCardWidth = () => {
    if (isMobile) return "100%";
    if (isTablet) return "48%";
    return "23.5%";
  };

  return (
    <SafeAreaView style={styles.safeArea}>
      <StatusBar barStyle="dark-content" backgroundColor="#F8FAFC" />

      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={[styles.contentContainer, isMobile && styles.contentContainerMobile]}
        showsVerticalScrollIndicator={false}
      >
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

          <View style={styles.categoriesGrid}>
            {CATEGORIES.map((cat) => (
              <TouchableOpacity
                key={cat.id}
                style={[styles.categoryCard, { width: getCardWidth() }]}
                activeOpacity={0.8}
              >
                <View style={styles.iconWrapper}>
                  <Ionicons name={cat.icon as any} size={22} color="#3B82F6" />
                </View>
                <Text style={styles.categoryTitle}>{cat.title}</Text>
                <Text style={styles.categoryDesc}>{cat.desc}</Text>
              </TouchableOpacity>
            ))}
          </View>
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

        {/* ── Contact Info ── */}
        <View style={styles.contactSection}>
          <Text style={styles.contactTitle}>For more info:</Text>
          <View style={styles.contactPillsRow}>
            <TouchableOpacity style={styles.contactPill}>
              <Ionicons name="call-outline" size={16} color="#6B7280" />
              <Text style={styles.contactPillText}>+91 7878675397</Text>
            </TouchableOpacity>
            <TouchableOpacity style={styles.contactPill}>
              <Ionicons name="mail-outline" size={16} color="#6B7280" />
              <Text style={styles.contactPillText}>info.xyz@gmail.com</Text>
            </TouchableOpacity>
          </View>
        </View>

        {/* ── Footer ── */}
        <View style={styles.footer}>
          <Text style={styles.footerText}>
            {/* © 2026 Hospilink Medical Systems. All rights reserved. */}
             © Developed and Managed by Rasika & Co.
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
    paddingTop: 60,
    paddingBottom: 40,
    maxWidth: 1100,
    alignSelf: "center",
    width: "100%",
  },
  contentContainerMobile: {
    paddingHorizontal: 20,
    paddingTop: 30,
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
    shadowOpacity: 0.03,
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
      web: { outlineStyle: "none" },
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

  /* Categories Grid */
  categoriesGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 16,
    justifyContent: "space-between",
  },
  categoryCard: {
    backgroundColor: "#FFFFFF",
    padding: 24,
    borderRadius: 16,
    alignItems: "center",
    justifyContent: "flex-start",
    shadowColor: "#000",
    shadowOpacity: 0.03,
    shadowRadius: 8,
    shadowOffset: { width: 0, height: 2 },
    elevation: 2,
    marginBottom: 10,
  },
  iconWrapper: {
    width: 48,
    height: 48,
    borderRadius: 12,
    backgroundColor: "#F0Fdf4", // Matches a light, neutral tint found in the screenshot
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
    shadowOpacity: 0.02,
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

  /* Contact Section */
  contactSection: {
    alignItems: "center",
    marginTop: 20,
    marginBottom: 40,
  },
  contactTitle: {
    fontSize: 14,
    color: "#4B5563",
    fontWeight: "500",
    marginBottom: 16,
  },
  contactPillsRow: {
    flexDirection: "row",
    gap: 16,
    flexWrap: "wrap",
    justifyContent: "center",
  },
  contactPill: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#EFF2F6",
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 8,
    gap: 8,
  },
  contactPillText: {
    fontSize: 14,
    color: "#4B5563",
    fontWeight: "500",
  },

  /* Footer */
  footer: {
    alignItems: "center",
    paddingBottom: 20,
  },
  footerText: {
    fontSize: 12,
    color: "#9CA3AF",
  },
});
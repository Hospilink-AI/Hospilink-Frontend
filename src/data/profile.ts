export const profileData = {
  name: "Dr. Sarah Johnson",
  role: "Critical Care Specialist • ICU Specialist",
  badges: ["MD, FRCP", "VERIFIED PROFILE"],
  completion: 90,
  stats: [
    { id: "1", icon: "checkmark-circle-outline" as const, iconBg: "#EEF2FF", iconColor: "#2563EB", value: "90%",   label: "Profile Completion", progress: 0.9 },
    { id: "2", icon: "clipboard-outline" as const,        iconBg: "#FEF3C7", iconColor: "#D97706", value: "3",     label: "Active Applications" },
    { id: "3", icon: "shield-checkmark-outline" as const, iconBg: "#D1FAE5", iconColor: "#059669", value: "12",    label: "Verified Docs" },
    { id: "4", icon: "time-outline" as const,             iconBg: "#F3E8FF", iconColor: "#7C3AED", value: "8 yrs", label: "Total Experience" },
  ],
  summary:
    "Dedicated and detail-oriented ICU Specialist with over 8 years of experience in critical care settings. Committed to providing high-quality patient care and leading medical teams in high-pressure environments. Expert in mechanical ventilation, advanced life support, and post-operative critical care.",
  education: [
    { id: "1", school: "Johns Hopkins University", degree: "Doctor of Medicine (MD)", years: "2012 - 2016" },
    { id: "2", school: "Stanford University",      degree: "BS in Biology",           years: "2008 - 2012" },
  ],
  licenses: [
    { id: "1", name: "State Medical License",          id_num: "ID: #4489221-ICU",   validUntil: "VALID UNTIL 2026" },
    { id: "2", name: "Advanced Cardiac Life Support",  id_num: "Provider ID: ACLS-9901", validUntil: "VALID UNTIL 2025" },
  ],
  availability: true,
  memberSince: "May 2021",
  location: "Chicago, IL",
  skills: ["Intensive Care", "Patient Monitoring", "Ventilator Mgmt", "Emergency Med", "Diagnostics"],
};
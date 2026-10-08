// Every outward link and company fact lives here, so the client can change them in one place.

export const COMPANY = {
  brand: "HospiLink",
  legalName: "Hospilink Private Limited",
  tagline: "Live Staffing, Trusted Healthcare.",
  directors: [
    { name: "Dr. Sumit Thombre", role: "Director" },
    { name: "Dr. Vishvas Koul", role: "Director" },
  ],
  phones: [
    { display: "+91 95290 11896", tel: "+919529011896" },
    { display: "+91 99602 41860", tel: "+919960241860" },
  ],
  emails: {
    info: "info@hospilink.in",
    support: "support@hospilink.in",
  },
  grievanceOfficer: "Dr. Sumit Thombre",
  city: "Pune",
  region: "Maharashtra",
  country: "IN",
} as const;

export const LINKS = {
  // The app is served from the same domain (sign-up preselects the account type).
  hospitalSignUp: "/auth/sign-up?accountType=hospital",
  staffSignUp: "/auth/sign-up?accountType=medical",
  signIn: "/auth/login",
  // PLACEHOLDER: replace with the live Google Play listing URL once published.
  playStore: "https://play.google.com/store/apps/details?id=com.hospilinkfrontend",
  deleteAccount: "/delete-account",
} as const;

export const API = {
  base: "https://api.hospilink.in",
  vacancies: "/api/vacancies/public",
} as const;

export const NAV = [
  { label: "How it works", href: "/how-it-works/" },
  { label: "Vacancies", href: "/vacancies/", highlight: true },
  { label: "For hospitals", href: "/hospitals/" },
  { label: "For staff", href: "/staff/" },
  { label: "Trust & safety", href: "/trust/" },
] as const;

export const NAV_MORE = [
  { label: "About HospiLink", href: "/about/", desc: "The company and its directors" },
  { label: "Emergency cover", href: "/emergency-cover/", desc: "City-wide requests when it can't wait" },
  { label: "Guides", href: "/guides/", desc: "Step-by-step help for every flow" },
  { label: "FAQ", href: "/faq/", desc: "Short answers to common questions" },
  { label: "Contact", href: "/contact/", desc: "Call, write or visit" },
] as const;

// In-app notifications: pop-ups, bell panel and notification centre, all driven by payload.display.
// No per-type code: the server sends title, body, severity, category, icon and where to open.
//
// Hidden until the backend is live. Turn on with EXPO_PUBLIC_INAPP_NOTIFICATIONS=on.
import { Ionicons } from "@expo/vector-icons";
import { ComponentProps } from "react";
import { notificationRoute, notificationTitle } from "./notificationLinks";

export const INAPP_NOTIFICATIONS_ENABLED = process.env.EXPO_PUBLIC_INAPP_NOTIFICATIONS === "on";

export type Severity = "info" | "success" | "warning" | "critical";
export type Category = "duty" | "recruitment" | "support" | "verification" | "account" | "admin";
export type Display = {
  title: string;
  body?: string | null;
  severity: Severity;
  category: Category;
  icon?: string;
  action?: { screen?: string; params?: Record<string, string> };
};

export type StoredNotification = {
  _id: string;
  type: string;
  isRead: boolean;
  createdAt: string;
  payload: any;
};

type IoniconName = ComponentProps<typeof Ionicons>["name"];

export const SEVERITY_STYLE: Record<Severity, { fg: string; bg: string; border: string; icon: IoniconName }> = {
  info: { fg: "#1D4ED8", bg: "#EFF6FF", border: "#BFDBFE", icon: "information-circle" },
  success: { fg: "#047857", bg: "#ECFDF5", border: "#A7F3D0", icon: "checkmark-circle" },
  warning: { fg: "#B45309", bg: "#FFFBEB", border: "#FDE68A", icon: "alert-circle" },
  critical: { fg: "#B91C1C", bg: "#FEF2F2", border: "#FECACA", icon: "warning" },
};

const SEVERITY_RANK: Record<Severity, number> = { info: 0, success: 1, warning: 2, critical: 3 };
export const worstSeverity = (list: Severity[]): Severity =>
  list.reduce<Severity>((a, b) => (SEVERITY_RANK[b] > SEVERITY_RANK[a] ? b : a), "info");

// How long a pop-up stays; critical stays until dismissed
export const TOAST_MS: Record<Severity, number | null> = { info: 6000, success: 6000, warning: 10000, critical: null };

export const CATEGORY_LABELS: Record<Category, string> = {
  duty: "Duties",
  recruitment: "Recruitment",
  support: "Support",
  verification: "Verification",
  account: "Account",
  admin: "Admin",
};

export const CATEGORY_ORDER: Category[] = ["duty", "recruitment", "support", "verification", "account", "admin"];

const CATEGORY_ICON: Record<Category, IoniconName> = {
  duty: "medkit-outline",
  recruitment: "briefcase-outline",
  support: "chatbubbles-outline",
  verification: "shield-checkmark-outline",
  account: "person-circle-outline",
  admin: "settings-outline",
};

// The server names icons in the Lucide set; these are the nearest Ionicons
const ICONS: Record<string, IoniconName> = {
  "calendar-plus": "calendar-outline",
  "calendar-x": "close-circle-outline",
  "calendar-check": "calendar-outline",
  calendar: "calendar-outline",
  siren: "warning-outline",
  "user-check": "person-add-outline",
  "user-x": "person-remove-outline",
  "user-plus": "person-add-outline",
  user: "person-outline",
  navigation: "navigate-outline",
  "map-pin": "location-outline",
  "alert-triangle": "warning-outline",
  "alert-circle": "alert-circle-outline",
  "alert-octagon": "alert-circle-outline",
  clock: "time-outline",
  "clipboard-check": "clipboard-outline",
  users: "people-outline",
  star: "star-outline",
  briefcase: "briefcase-outline",
  mail: "mail-outline",
  "check-circle": "checkmark-circle-outline",
  "play-circle": "play-circle-outline",
  "refresh-cw": "refresh-outline",
  edit: "create-outline",
  shield: "shield-outline",
  key: "key-outline",
  "file-check": "document-text-outline",
  "id-card": "id-card-outline",
  "file-x": "document-outline",
  "file-text": "document-text-outline",
  "badge-check": "ribbon-outline",
  "x-circle": "close-circle-outline",
  lock: "lock-closed-outline",
  slash: "ban-outline",
  "trending-down": "trending-down-outline",
  "trending-up": "trending-up-outline",
  building: "business-outline",
  eye: "eye-outline",
  upload: "cloud-upload-outline",
  inbox: "file-tray-outline",
  "log-out": "log-out-outline",
  award: "trophy-outline",
  archive: "archive-outline",
  bell: "notifications-outline",
  link: "link-outline",
  gift: "gift-outline",
  phone: "call-outline",
  "life-buoy": "help-buoy-outline",
  tag: "pricetag-outline",
  "message-square": "chatbox-outline",
  "message-circle": "chatbubble-outline",
  gavel: "hammer-outline",
  "help-circle": "help-circle-outline",
  flag: "flag-outline",
};

export const iconFor = (d: Display): IoniconName => (d.icon && ICONS[d.icon]) || CATEGORY_ICON[d.category] || "notifications-outline";

// ─── Display, with a fallback for servers that don't send it yet ────────────
const FALLBACK_CATEGORY = (type: string): Category =>
  type.startsWith("TICKET_") || type.startsWith("PATTERN_") || type.startsWith("SUSPENSION_")
    ? "support"
    : /APPLICATION|INTERVIEW|VACANCY|SLOT|OFFER_|HIRE|NO_SHOW|MEETING|RESCHEDULE|SELECTION|CANDIDATE|CONTACT_DETAILS/.test(type)
      ? "recruitment"
      : /DOCUMENT|VERIFIED|REJECTED/.test(type)
        ? "verification"
        : /REGISTRATION|_ADMIN|WATCHLIST/.test(type)
          ? "admin"
          : /DUTY|STAFF_|EMERGENCY|NAVIGATE|RATE_|REVIEW|OTP/.test(type)
            ? "duty"
            : "account";

export function displayOf(n: { type?: string; payload?: any }): Display {
  const d = n.payload?.display;
  if (d && d.title) return d;
  const type = n.type ?? n.payload?.type ?? "";
  return {
    title: type ? notificationTitle(type) : "HospiLink",
    body: n.payload?.message ?? null,
    severity: n.payload?.priority === "CRITICAL" || /EMERGENCY|CRITICAL/.test(type) ? "critical" : "info",
    category: FALLBACK_CATEGORY(type),
    action: { screen: "__legacy" },
  };
}

// ─── Where a notification opens ─────────────────────────────────────────────
export type Base = "admin" | "hospital" | "medicalStaff";

export const baseOf = (pathname: string): Base =>
  pathname.startsWith("/admin") ? "admin" : pathname.startsWith("/hospital") ? "hospital" : "medicalStaff";

// Screen keys from the server -> this app's routes, per role
export function routeFor(n: { type?: string; payload?: any }, base: Base, pathname = `/${base}`): string | null {
  const d = displayOf(n);
  const screen = d.action?.screen;
  const p = d.action?.params ?? {};
  if (!screen || screen === "__legacy") return notificationRoute(n.type ?? n.payload?.type ?? "", n.payload, pathname);

  switch (screen) {
    case "duty_detail":
    case "duty_review":
      if (base === "admin") return "/admin/duty-overnight";
      return p.dutyId ? `/${base}/dutyDetails/${p.dutyId}` : null;
    case "duty_tracking":
      if (base === "hospital") return "/hospital/live-monitoring";
      if (base === "admin") return "/admin/live-monitoring";
      return p.dutyId ? `/medicalStaff/dutyDetails/${p.dutyId}` : null;
    case "admin_duty":
      return base === "admin" ? "/admin/duty-overnight" : p.dutyId ? `/${base}/dutyDetails/${p.dutyId}` : null;
    case "application_detail":
      if (base === "hospital") return p.applicationId ? `/hospital/vacancies/applicant/${p.applicationId}` : p.vacancyId ? `/hospital/vacancies/${p.vacancyId}` : "/hospital/vacancies";
      if (base === "medicalStaff") return p.applicationId ? `/medicalStaff/applications/${p.applicationId}` : "/medicalStaff/applications";
      return null;
    case "vacancy_detail":
      if (base === "hospital") return p.vacancyId ? `/hospital/vacancies/${p.vacancyId}` : "/hospital/vacancies";
      if (base === "medicalStaff") return p.vacancyId ? `/medicalStaff/vacancy/${p.vacancyId}` : "/medicalStaff/vacancies";
      return null;
    case "ticket_detail":
    case "ticket_chat":
      if (!p.ticketId) return base === "admin" ? "/admin/tickets" : `/${base}/support/tickets`;
      return base === "admin" ? `/admin/tickets/${p.ticketId}` : `/${base}/support/tickets/${p.ticketId}`;
    case "admin_hospital":
      return "/admin/hospital-management";
    case "admin_staff":
      return "/admin/medical-staff";
    case "account_standing":
      return base === "admin" ? "/admin/patterns" : `/${base}/support/standing`;
    case "documents":
      return base === "medicalStaff" ? "/medicalStaff/documents" : base === "hospital" ? "/hospital/documents" : "/admin/document-verification";
    case "profile":
    case "settings":
    case "reviews":
      return base === "admin" ? "/admin/dashboard" : `/${base}/profile`;
    case "availability":
      return base === "medicalStaff" ? "/medicalStaff/calendar?mode=availability" : null;
    case "notifications":
      return `/${base}/notifications`;
    default:
      return `/${base}/notifications`;
  }
}

export const timeAgo = (iso?: string) => {
  if (!iso) return "";
  const diff = Date.now() - new Date(iso).getTime();
  const mins = Math.floor(diff / 60000);
  if (mins < 1) return "just now";
  if (mins < 60) return `${mins}m ago`;
  const hours = Math.floor(mins / 60);
  if (hours < 24) return `${hours}h ago`;
  const days = Math.floor(hours / 24);
  if (days < 7) return `${days}d ago`;
  return new Date(iso).toLocaleDateString("en-IN", { day: "numeric", month: "short" });
};

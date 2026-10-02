// Support notifications: badge, title and where tapping them goes.

type Config = { icon: any; color: string; bg: string; label: string };

const SUPPORT: Config = { icon: "chatbubbles-outline", color: "#2563eb", bg: "#dbeafe", label: "SUPPORT" };
const STANDING: Config = { icon: "shield-outline", color: "#b45309", bg: "#fef3c7", label: "ACCOUNT" };
const RATING: Config = { icon: "star-outline", color: "#7c3aed", bg: "#ede9fe", label: "RATING" };
const RELIST: Config = { icon: "refresh-circle-outline", color: "#0369a1", bg: "#e0f2fe", label: "RE-POSTED" };

const TITLES: Record<string, string> = {
  TICKET_CREATED: "Ticket received",
  TICKET_RECATEGORIZED: "Ticket category changed",
  TICKET_CLAIM_EXISTS: "Complaint about you",
  TICKET_RESPONSE_WINDOW_CLOSING: "Reply window closing",
  TICKET_OUTCOME_DECIDED: "Decision on your ticket",
  TICKET_INFO_REQUESTED: "More information needed",
  TICKET_INFO_REQUEST_REMINDER: "More information needed",
  PATTERN_FLAG_RAISED: "Account notice",
  DUTY_RELISTED: "Duty re-posted",
  DUTY_RELIST_CAP_REACHED: "Duty needs your input",
  DUTY_CANCELLED_BY_STAFF: "Staff member cancelled",
  STAFF_CANCELLATION_WATCHLIST: "Auto-relist watchlist",
};

// auto-relist notification types (Notification model enum)
const isRelist = (type: string) =>
  ["DUTY_RELISTED", "DUTY_RELIST_CAP_REACHED", "DUTY_CANCELLED_BY_STAFF", "STAFF_CANCELLATION_WATCHLIST"].includes(type);

const isTicket = (type: string) => type.startsWith("TICKET_");
const isStanding = (type: string) =>
  type === "PATTERN_FLAG_RAISED" || type.startsWith("SUSPENSION_") || type.startsWith("WARNING_");

export function supportNotificationConfig(type: string): Config | null {
  if (isTicket(type)) return SUPPORT;
  if (isRelist(type)) return RELIST;
  if (isStanding(type)) return STANDING;
  if (type.startsWith("RATING_PENALTY_")) return RATING;
  return null;
}

export function notificationTitle(type: string): string {
  if (TITLES[type]) return TITLES[type];
  const words = type.replace(/_/g, " ").toLowerCase();
  return words.charAt(0).toUpperCase() + words.slice(1);
}

// pathname tells us whose app this is (/admin, /hospital, /medicalStaff)
export function notificationRoute(type: string, payload: any, pathname: string): string | null {
  const base = pathname.startsWith("/admin") ? "admin" : pathname.startsWith("/hospital") ? "hospital" : "medicalStaff";
  const ticketId = payload?.ticket?.id ?? payload?.ticket?._id ?? payload?.ticketId ?? null;
  if (isTicket(type) && ticketId) {
    return base === "admin" ? `/admin/tickets/${ticketId}` : `/${base}/support/tickets/${ticketId}`;
  }
  const dutyId = payload?.duty?.id ?? payload?.duty?._id ?? payload?.dutyId ?? null;
  if (isRelist(type)) {
    if (base === "admin") return "/admin/auto-relist";
    return dutyId ? `/${base}/dutyDetails/${dutyId}` : null;
  }
  if (base === "admin") return type === "PATTERN_FLAG_RAISED" ? "/admin/patterns" : null;
  if (isStanding(type) || type.startsWith("RATING_PENALTY_")) return `/${base}/support/standing`;
  return null;
}

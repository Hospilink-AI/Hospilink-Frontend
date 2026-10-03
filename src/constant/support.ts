// Support & disputes - ticket taxonomy and labels shared by the staff, hospital and admin screens.
// Codes, classes and evidence lists must match backend/scripts/seedTicketCategoryConfig.js
// and backend/src/utils/ticket.constants.js.

import { Option } from '@/constant/jobs';

export type TicketDomain = 'duty' | 'payment' | 'safety' | 'jobs' | 'account' | 'platform' | 'data';
export type ResolutionClass = 'ADJUDICATED' | 'ACTIONED' | 'INVESTIGATED' | 'ACKNOWLEDGED' | 'STATUTORY';
export type SubjectType = 'DUTY' | 'PAYMENT' | 'INTERVIEW' | 'APPLICATION' | 'VACANCY' | 'NONE';

export const TICKET_DOMAINS: { value: TicketDomain; label: string; icon: string }[] = [
  { value: 'duty', label: 'Duty & shifts', icon: 'medkit-outline' },
  { value: 'payment', label: 'Payment', icon: 'cash-outline' },
  { value: 'safety', label: 'Safety', icon: 'warning-outline' },
  { value: 'jobs', label: 'Vacancies & interviews', icon: 'briefcase-outline' },
  { value: 'account', label: 'Account & profile', icon: 'person-outline' },
  { value: 'platform', label: 'App problem', icon: 'phone-portrait-outline' },
  { value: 'data', label: 'My data', icon: 'lock-closed-outline' },
];

export interface TicketCategory {
  value: string;
  domain: TicketDomain;
  label: string;
  cls: ResolutionClass;
  subject: SubjectType;
  evidence: string[];
}

const c = (
  value: string,
  label: string,
  cls: ResolutionClass,
  subject: SubjectType,
  evidence: string[] = []
): TicketCategory => ({ value, domain: value.split('.')[0] as TicketDomain, label, cls, subject, evidence });

export const TICKET_CATEGORIES: TicketCategory[] = [
  c('duty.end_otp_unverified', "Shift ended but the end OTP wasn't verified", 'ACTIONED', 'DUTY', ["Screenshot showing the shift wasn't ended", 'Any messages with the hospital about it']),
  c('duty.start_otp_failure', "Start OTP wouldn't work", 'ACTIONED', 'DUTY', ['Screenshot of the OTP error/failure', 'Time you attempted to start the shift']),
  c('duty.no_show_staff', "Staff member didn't turn up", 'ADJUDICATED', 'DUTY', ['Screenshot of the shift confirmation', 'Any messages about the absence']),
  c('duty.no_show_hospital', 'Hospital was not ready to start the shift', 'ADJUDICATED', 'DUTY', ['Screenshot of the shift confirmation', 'Photo/proof you were on-site', 'Any messages with the hospital']),
  c('duty.late_arrival', 'Late arrival', 'ADJUDICATED', 'DUTY', ['Screenshot of the scheduled start time', 'Any messages explaining the delay']),
  c('duty.early_departure', 'Left before the shift ended', 'ADJUDICATED', 'DUTY', ['Screenshot of the scheduled end time', 'Reason/message about leaving early']),
  c('duty.cancellation_staff', 'Disputing a cancellation by the staff member', 'ADJUDICATED', 'DUTY', ['Screenshot of the cancellation', 'Reason for the cancellation']),
  c('duty.cancellation_hospital', 'Disputing a cancellation by the hospital', 'ADJUDICATED', 'DUTY', ['Screenshot of the cancellation notice', 'How much notice you were given']),
  c('duty.details_mismatch', "Shift didn't match what was posted", 'ADJUDICATED', 'DUTY', ['Screenshot of the original posted/agreed details', 'Photo or note of what you actually found on arrival']),
  c('duty.status_change_request', "Correct a shift's status", 'ACTIONED', 'DUTY', ["Screenshot of the shift's current recorded status", 'Evidence of the correct status (e.g. completion proof)']),
  c('duty.details_change_request', "Change a shift's details", 'ACTIONED', 'DUTY', ['Screenshot of the current recorded details', 'What the correct details should be']),
  c('duty.work_quality', 'Quality of work', 'ADJUDICATED', 'DUTY', ['Specific description of the quality issue', 'Any supporting photos/documentation']),
  c('duty.working_conditions', 'Working conditions', 'ADJUDICATED', 'DUTY', ['Photos of the conditions', 'Any messages raising the concern at the time']),
  c('duty.scope_of_practice', 'Asked to work outside my role or qualification', 'ADJUDICATED', 'DUTY', ['What you were asked to do', 'Your role/qualification documentation']),
  c('duty.conduct_staff', "Staff member's conduct", 'ADJUDICATED', 'DUTY', ['Description of what happened, with date/time', 'Any messages or witnesses']),
  c('duty.conduct_hospital', "Hospital's conduct", 'ADJUDICATED', 'DUTY', ['Description of what happened, with date/time', 'Any messages or witnesses']),
  c('duty.credential_challenge', 'Challenging a credential', 'ADJUDICATED', 'DUTY', ['The credential/certificate in question', "Reason you believe it's being challenged incorrectly"]),

  c('payment.non_payment', 'Not paid for a completed shift', 'ADJUDICATED', 'PAYMENT', ['Payment/receipt screenshot (if any)', 'Bank or UPI statement showing no payment received']),
  c('payment.amount_mismatch', 'Paid the wrong amount', 'ADJUDICATED', 'PAYMENT', ['Screenshot of the agreed rate/amount', 'Screenshot of what was actually paid']),
  c('payment.overtime_unpaid', 'Overtime not paid', 'ADJUDICATED', 'PAYMENT', ['Proof of the extra time worked (shift end time vs. actual)', 'Screenshot of payment received (showing overtime missing)']),
  c('payment.deduction_disputed', 'Disputing a deduction', 'ADJUDICATED', 'PAYMENT', ['Payment screenshot showing the deduction', 'Reason you believe the deduction is wrong']),
  c('payment.mode_dispute', 'Payment method changed or refused', 'ADJUDICATED', 'PAYMENT', ['Screenshot of the agreed payment mode', 'Screenshot of how payment was actually made/attempted']),
  c('payment.refund_request', 'Refund for a shift not delivered as agreed', 'ADJUDICATED', 'PAYMENT', ['Original payment/receipt screenshot', 'Reason a refund is due']),

  c('safety.patient_incident', 'Patient safety incident', 'ADJUDICATED', 'DUTY', ['Description of the incident, with date/time', 'Any photos, reports, or witnesses']),
  c('safety.staff_incident', 'Injury or unsafe conditions for staff', 'ADJUDICATED', 'DUTY', ['Description of the incident, with date/time', 'Photos of any injury/unsafe condition', 'Any witnesses']),
  c('safety.harassment', 'Harassment or abuse', 'ADJUDICATED', 'DUTY', ['Screenshots or recordings of the incident, if you have them', 'Names of anyone who witnessed it']),

  c('jobs.application_revoke', 'Withdraw or reinstate an application', 'ACTIONED', 'APPLICATION'),
  c('jobs.interview_reschedule', 'Move a confirmed interview', 'ACTIONED', 'INTERVIEW'),
  c('jobs.interview_cancellation', 'Interview cancellation', 'ACTIONED', 'INTERVIEW'),
  c('jobs.interview_no_show', "Interview no-show", 'ADJUDICATED', 'INTERVIEW', ['Screenshot of the confirmed interview time', 'Any messages about the no-show']),
  c('jobs.ai_score_challenge', 'Question my match score', 'INVESTIGATED', 'APPLICATION', ["Screenshot of the score you're disputing", 'What you believe is inaccurate about it']),
  c('jobs.parsed_data_incorrect', 'My resume details were read wrongly', 'ACTIONED', 'NONE', ['Screenshot of the incorrect field(s)', 'The correct information']),
  c('jobs.listing_misleading', 'Misleading vacancy listing', 'ADJUDICATED', 'VACANCY', ['Screenshot of the original listing', "What you found didn't match"]),
  c('jobs.offer_reneged', 'Offer withdrawn after I accepted', 'ADJUDICATED', 'APPLICATION', ['Screenshot of the offer', 'Any messages about it being withdrawn']),

  c('account.verification_delay', 'Verification is taking too long', 'ACTIONED', 'NONE'),
  c('account.verification_rejected', 'Challenge a verification rejection', 'ADJUDICATED', 'NONE', ['The rejection notice/message you received', 'The document that was rejected']),
  c('account.rating_challenge', 'Challenge a rating', 'ADJUDICATED', 'NONE', ['Screenshot of the rating/review in question', "Reason you believe it's unfair or inaccurate"]),
  c('account.suspension_appeal', 'Appeal a suspension or restriction', 'ADJUDICATED', 'NONE', ['The suspension notice you received', 'Your explanation/evidence for the appeal']),
  c('account.access_locked', "Can't sign in", 'ACTIONED', 'NONE', ["Screenshot of the error you're seeing, if any"]),
  c('account.impersonation_report', 'Someone is using my identity', 'INVESTIGATED', 'NONE', ['Screenshot/link showing the impersonation', 'Any other details that help identify it']),
  c('account.closure_request', 'Close my account', 'ACTIONED', 'NONE'),

  c('platform.app_fault', 'App crashed, froze or failed', 'INVESTIGATED', 'NONE', ['Screenshot or screen recording of the issue', 'What you were doing when it happened']),
  c('platform.notification_failure', "Didn't get a notification", 'INVESTIGATED', 'NONE', ['Which notification you expected and when', 'Screenshot of your notification settings, if possible']),
  c('platform.location_issue', 'Location or map problem', 'INVESTIGATED', 'NONE', ['Screenshot of the incorrect location shown', 'What the correct location should be']),
  c('platform.data_incorrect', 'The app shows wrong information', 'INVESTIGATED', 'NONE', ['Screenshot of the incorrect information', 'The correct information']),
  c('platform.feedback', 'General feedback', 'ACKNOWLEDGED', 'NONE'),

  c('data.access_request', 'Get a copy of my data', 'STATUTORY', 'NONE'),
  c('data.correction_request', 'Correct my data', 'STATUTORY', 'NONE', ['What information is incorrect', 'The correct information']),
  c('data.erasure_request', 'Delete my data', 'STATUTORY', 'NONE'),
  c('data.consent_withdrawal', 'Withdraw my consent', 'STATUTORY', 'NONE'),
  c('data.breach_concern', 'Report a data leak concern', 'STATUTORY', 'NONE', ['Any details about what you believe was exposed', 'How you became aware of it']),
];

export const categoryInfo = (value?: string | null) => TICKET_CATEGORIES.find((cat) => cat.value === value);
export const categoryLabel = (value?: string | null) => categoryInfo(value)?.label ?? value ?? '—';
export const domainLabel = (value?: string | null) =>
  TICKET_DOMAINS.find((d) => d.value === value)?.label ?? value ?? '—';

export type TicketStatus =
  | 'NEW' | 'TRIAGE' | 'OPEN' | 'IN_REVIEW' | 'AWAITING_RAISER' | 'AWAITING_RESPONDENT'
  | 'PENDING_APPROVAL' | 'ESCALATED' | 'RESOLVED' | 'REJECTED' | 'WITHDRAWN' | 'DUPLICATE'
  | 'AUTO_CLOSED' | 'APPEALED' | 'REOPENED' | 'CLOSED';

export const OPEN_TICKET_STATUSES: TicketStatus[] = [
  'NEW', 'TRIAGE', 'OPEN', 'IN_REVIEW', 'AWAITING_RAISER', 'AWAITING_RESPONDENT', 'PENDING_APPROVAL', 'ESCALATED', 'REOPENED',
];

export const TICKET_STATUS_LABELS: Record<TicketStatus, string> = {
  NEW: 'Received',
  TRIAGE: 'Being sorted',
  OPEN: 'Open',
  IN_REVIEW: 'In review',
  AWAITING_RAISER: 'Waiting for you',
  AWAITING_RESPONDENT: 'Waiting for the other side',
  PENDING_APPROVAL: 'Decision being checked',
  ESCALATED: 'Escalated',
  RESOLVED: 'Resolved',
  REJECTED: 'Not upheld',
  WITHDRAWN: 'Withdrawn',
  DUPLICATE: 'Duplicate',
  AUTO_CLOSED: 'Closed',
  APPEALED: 'Appealed',
  REOPENED: 'Reopened',
  CLOSED: 'Closed',
};

export const TICKET_STATUS_COLORS: Record<'open' | 'waiting' | 'done' | 'closed', { bg: string; text: string }> = {
  open: { bg: '#EFF6FF', text: '#1D4ED8' },
  waiting: { bg: '#FFFBEB', text: '#B45309' },
  done: { bg: '#ECFDF5', text: '#047857' },
  closed: { bg: '#F1F5F9', text: '#475569' },
};

export const ticketStatusTone = (status?: string | null): keyof typeof TICKET_STATUS_COLORS => {
  if (status === 'AWAITING_RAISER' || status === 'AWAITING_RESPONDENT') return 'waiting';
  if (status === 'RESOLVED') return 'done';
  if (status && OPEN_TICKET_STATUSES.includes(status as TicketStatus)) return 'open';
  return 'closed';
};

export const CHAT_LANGUAGES: Option[] = [
  { label: 'English', value: 'en' },
  { label: 'हिन्दी', value: 'hi' },
  { label: 'मराठी', value: 'mr' },
];

export const TICKET_TEXT_MAX = 1000;
export const EVIDENCE_MAX_FILES = 5;
export const EVIDENCE_MAX_MB = 10;
export const EVIDENCE_TYPES = ['image/jpeg', 'image/png', 'application/pdf'];

// Bot subject buttons come as "label [id]" - show the label, send the whole string back.
export const splitButton = (button: string) => {
  const m = button.match(/^(.*)\s\[([a-f0-9]{24})\]$/i);
  return m ? { label: m[1], id: m[2] } : { label: button, id: null };
};

// Opening quick replies - same strings as the bot's own (backend/src/utils/botCopy.js domain* keys),
// so a tap is classified exactly like the bot's quick-reply buttons.
export const BOT_STARTERS: Record<string, string[]> = {
  en: ["It's about a shift", "It's about payment", "It's a safety concern", "It's about a vacancy application", "It's about my account", "It's about the app itself", "It's about my data", 'Something else'],
  hi: ['यह शिफ्ट के बारे में है', 'यह भुगतान के बारे में है', 'यह सुरक्षा से जुड़ा मामला है', 'यह नौकरी के आवेदन के बारे में है', 'यह मेरे खाते के बारे में है', 'यह ऐप से जुड़ी बात है', 'यह मेरे डेटा के बारे में है', 'कुछ और'],
  mr: ['हे शिफ्टबद्दल आहे', 'हे पेमेंटबद्दल आहे', 'ही सुरक्षेशी संबंधित बाब आहे', 'हे नोकरीच्या अर्जाबद्दल आहे', 'हे माझ्या खात्याबद्दल आहे', 'हे अ‍ॅपशी संबंधित आहे', 'हे माझ्या डेटाबद्दल आहे', 'आणखी काही'],
};

export type PickedFile = { uri: string; name: string; mimeType?: string; size?: number; file?: any };

// Checks picked files against the evidence rules. Returns an error message or null.
export const evidenceError = (files: PickedFile[]) => {
  if (files.length > EVIDENCE_MAX_FILES) return `You can attach up to ${EVIDENCE_MAX_FILES} files.`;
  const bad = files.find((f) => f.mimeType && !EVIDENCE_TYPES.includes(f.mimeType));
  if (bad) return `${bad.name}: only JPG, PNG or PDF files can be attached.`;
  const big = files.find((f) => (f.size ?? 0) > EVIDENCE_MAX_MB * 1024 * 1024);
  if (big) return `${big.name} is larger than ${EVIDENCE_MAX_MB} MB.`;
  return null;
};

export const FEEDBACK_AREAS: Option[] = [
  { label: 'Signing up', value: 'onboarding' },
  { label: 'Duties & shifts', value: 'duty_flow' },
  { label: 'OTP', value: 'otp' },
  { label: 'Notifications', value: 'notifications' },
  { label: 'Payments', value: 'payments' },
  { label: 'Vacancies', value: 'jobs' },
  { label: 'App speed & crashes', value: 'app_performance' },
  { label: 'Something else', value: 'other' },
];

// Values from backend/src/services/patternEngine.service.js
export const PATTERN_TYPE_LABELS: Record<string, string> = {
  staff_no_show: 'Missed shifts',
  staff_conduct: 'Conduct complaints',
  staff_quality: 'Work quality complaints',
  hospital_conduct: 'Conduct complaints',
  hospital_conditions: 'Working conditions complaints',
  hospital_late_non_payment: 'Late or missing payments',
  scope_of_practice: 'Work outside role or qualification',
  safety: 'Safety concerns',
  tickets_against_party: 'Complaints upheld against you',
  admin_flagged: 'Flagged by our team',
};

export const FLAG_RAISES_LABELS: Record<string, string> = {
  operations_flag: 'Our team will review this',
  suspension_proposal: 'Account suspension proposed',
  precautionary_restriction: 'Temporary restriction',
};

export const FLAG_STATUS_LABELS: Record<string, string> = {
  open: 'Open',
  responded: 'Reply sent',
  decided: 'Decided',
  voided: 'Cleared',
};

// ── Admin ─────────────────────────────────────────────

export const TICKET_PRIORITIES: Option[] = [
  { label: 'P1 · Urgent', value: 'P1' },
  { label: 'P2 · High', value: 'P2' },
  { label: 'P3 · Normal', value: 'P3' },
  { label: 'P4 · Low', value: 'P4' },
];

export const PRIORITY_COLORS: Record<string, { bg: string; text: string }> = {
  P1: { bg: '#FEF2F2', text: '#B91C1C' },
  P2: { bg: '#FFF7ED', text: '#C2410C' },
  P3: { bg: '#EFF6FF', text: '#1D4ED8' },
  P4: { bg: '#F1F5F9', text: '#475569' },
};

export const QUEUE_LABELS: Record<string, string> = {
  SUPPORT: 'Support',
  OPERATIONS: 'Operations',
  SUPER_ADMIN: 'Super Admin',
  GRIEVANCE_OFFICER: 'Grievance Officer',
  FEEDBACK_BOARD: 'Feedback Board',
};

export const RESOLUTION_CLASS_LABELS: Record<string, string> = {
  ADJUDICATED: 'Dispute between two parties',
  ACTIONED: 'Request to action',
  INVESTIGATED: 'Issue to investigate',
  ACKNOWLEDGED: 'Acknowledge only',
  STATUTORY: 'Data request (legal deadline)',
};

export const OUTCOME_LABELS: Record<string, string> = {
  UPHELD: 'Upheld',
  PARTLY_UPHELD: 'Partly upheld',
  DECLINED: 'Declined',
  ACTIONED: 'Actioned',
  NOT_ACTIONED: 'Not actioned',
  RESOLVED: 'Resolved',
  NO_FAULT_FOUND: 'No fault found',
  KNOWN_ISSUE: 'Known issue',
  CANNOT_REPRODUCE: 'Cannot reproduce',
  ACKNOWLEDGED: 'Acknowledged',
  FULFILLED: 'Fulfilled',
  REFUSED_WITH_REASON: 'Refused with reason',
  OVERTURNED: 'Overturned',
  VARIED: 'Varied',
};

export const OUTCOMES_BY_CLASS: Record<string, string[]> = {
  ADJUDICATED: ['UPHELD', 'PARTLY_UPHELD', 'DECLINED'],
  ACTIONED: ['ACTIONED', 'NOT_ACTIONED'],
  INVESTIGATED: ['RESOLVED', 'NO_FAULT_FOUND', 'KNOWN_ISSUE', 'CANNOT_REPRODUCE'],
  ACKNOWLEDGED: ['ACKNOWLEDGED'],
  STATUTORY: ['FULFILLED', 'REFUSED_WITH_REASON'],
};
export const APPEAL_OUTCOMES = ['UPHELD', 'OVERTURNED', 'VARIED'];

export type ActionField = 'newStatus' | 'correctedEndTime' | 'otpType' | 'flagId' | 'reviewId' | 'slots' | 'field';

export interface ResolutionAction {
  value: string;
  label: string;
  needsApproval: boolean;
  gated?: boolean;
  fields?: ActionField[];
  // What the ticket must have for the action to apply (ticketConsequence.service.js asserts)
  needs?: 'duty' | 'application' | 'respondent' | 'payment' | 'appeal';
  // Only these ticket categories (backend/src/utils/rating.constants.js)
  categories?: string[];
  // Recorded by the server but has no effect yet, so not offered
  hidden?: boolean;
}

// Values and sign-off rules from backend/src/services/ticketConsequence.service.js
export const RESOLUTION_ACTIONS: ResolutionAction[] = [
  { value: 'RECORD_ONLY', label: 'Record the decision only', needsApproval: false },
  { value: 'CLOSE_DUTY_AT_STATED_TIME', label: 'Close the duty as completed', needsApproval: false, fields: ['correctedEndTime'], needs: 'duty' },
  { value: 'SET_DUTY_STATUS', label: 'Change the duty status', needsApproval: false, fields: ['newStatus'], needs: 'duty' },
  { value: 'UNLOCK_OTP', label: 'Unlock the duty OTP', needsApproval: false, fields: ['otpType'], needs: 'duty' },
  { value: 'RESCHEDULE_INTERVIEW', label: 'Reschedule the interview', needsApproval: false, fields: ['slots'], needs: 'application' },
  { value: 'RECOMPUTE_MATCH_SCORE', label: 'Recalculate the match score', needsApproval: false, needs: 'application' },
  { value: 'CORRECT_PROFILE_FIELD', label: 'Correct a profile field', needsApproval: false, fields: ['field'] },
  { value: 'APPLY_RATING_PENALTY', label: 'Apply a rating penalty', needsApproval: true, needs: 'respondent', categories: ['duty.late_arrival', 'duty.no_show_staff', 'duty.no_show_hospital', 'duty.conduct_staff', 'duty.conduct_hospital', 'jobs.interview_no_show'] },
  { value: 'REVERSE_RATING_PENALTY', label: 'Reverse a rating penalty', needsApproval: true, needs: 'appeal' },
  { value: 'SUPPRESS_REVIEW', label: 'Hide a review', needsApproval: true, fields: ['reviewId'], needs: 'respondent' },
  { value: 'REINSTATE_APPLICATION', label: 'Reinstate the application', needsApproval: true, needs: 'application' },
  { value: 'REVOKE_APPLICATION', label: 'Revoke the application', needsApproval: true, needs: 'application' },
  { value: 'ISSUE_WARNING', label: 'Issue a warning', needsApproval: true, needs: 'respondent' },
  { value: 'FLAG_FOR_SUSPENSION', label: 'Flag for suspension', needsApproval: true, needs: 'respondent' },
  { value: 'APPLY_PRECAUTIONARY_RESTRICTION', label: 'Apply a temporary restriction', needsApproval: true, needs: 'respondent', hidden: true },
  { value: 'RESTORE_ACCOUNT', label: 'Restore the account', needsApproval: true, fields: ['flagId'] },
  // raised from Adjust rating on a profile, not from a ticket decision
  { value: 'SET_RATING_OVERRIDE', label: 'Set the rating by hand', needsApproval: true, hidden: true },
  { value: 'HOLD_PAYOUT', label: 'Hold payout', needsApproval: true, gated: true, needs: 'payment', hidden: true },
  { value: 'RELEASE_PAYOUT', label: 'Release payout', needsApproval: true, gated: true, needs: 'payment', hidden: true },
  { value: 'ADJUST_PAYOUT', label: 'Adjust payout', needsApproval: true, gated: true, needs: 'payment', hidden: true },
  { value: 'RECOVER_FROM_FUTURE_PAYOUT', label: 'Recover from a future payout', needsApproval: true, gated: true, needs: 'payment', hidden: true },
  { value: 'REFUND_HOSPITAL', label: 'Refund the hospital', needsApproval: true, gated: true, needs: 'payment', hidden: true },
];

export const actionLabel = (value?: string | null) =>
  RESOLUTION_ACTIONS.find((a) => a.value === value)?.label ?? value ?? '—';

export const DUTY_STATUSES: Option[] = [
  { label: 'Available', value: 'available' },
  { label: 'Assigned', value: 'assigned' },
  { label: 'En route', value: 'enroute' },
  { label: 'In progress', value: 'in-progress' },
  { label: 'Pending confirmation', value: 'pending-confirmation' },
  { label: 'Completed', value: 'completed' },
  { label: 'Cancelled', value: 'cancelled' },
  { label: 'Expired', value: 'expired' },
  { label: 'Incomplete', value: 'incomplete' },
];

export const SENTIMENTS: { value: string; label: string; bg: string; text: string }[] = [
  { value: 'POSITIVE', label: 'Positive', bg: '#ECFDF5', text: '#047857' },
  { value: 'NEUTRAL', label: 'Neutral', bg: '#F1F5F9', text: '#475569' },
  { value: 'NEGATIVE', label: 'Negative', bg: '#FFF7ED', text: '#C2410C' },
  { value: 'SEVERE_NEGATIVE', label: 'Very negative', bg: '#FEF2F2', text: '#B91C1C' },
];

export const KB_CATEGORIES: Option[] = [
  ...TICKET_DOMAINS.map((d) => ({ label: d.label, value: d.value })),
  { label: 'General', value: 'general' },
];

// Chat screen text in the conversation's language. Hindi/Marathi need a native speaker's review,
// same as backend/src/utils/botCopy.js.
export const CHAT_UI: Record<string, Record<string, string>> = {
  en: {
    subtitle: "Tell us what happened and we'll raise a ticket",
    typing: 'Typing…',
    newChat: 'New chat',
    welcome: 'Hi! What do you need help with? Pick a topic below or type your message.',
    sentAttachment: 'Sent attachment',
    formNeeded: 'This one needs a few more details than the chat can take.',
    raiseTicket: 'Raise a Ticket',
    startNew: 'Start a New Chat',
    closed: 'This conversation is closed.',
    viewTicket: 'View Ticket',
    placeholder: 'Type your message',
    attach: 'Attach files',
    addMore: 'Add more files',
  },
  hi: {
    subtitle: 'बताइए क्या हुआ, हम टिकट बना देंगे',
    typing: 'लिख रहे हैं…',
    newChat: 'नई चैट',
    welcome: 'नमस्ते! आपको किस बारे में मदद चाहिए? नीचे कोई विषय चुनें या अपना संदेश लिखें।',
    sentAttachment: 'फ़ाइल भेजी गई',
    formNeeded: 'इसके लिए चैट से ज़्यादा जानकारी चाहिए।',
    raiseTicket: 'टिकट बनाएं',
    startNew: 'नई चैट शुरू करें',
    closed: 'यह बातचीत बंद हो गई है।',
    viewTicket: 'टिकट देखें',
    placeholder: 'अपना संदेश लिखें',
    attach: 'फ़ाइल जोड़ें',
    addMore: 'और फ़ाइलें जोड़ें',
  },
  mr: {
    subtitle: 'काय झाले ते सांगा, आम्ही तिकीट तयार करू',
    typing: 'लिहित आहे…',
    newChat: 'नवीन चॅट',
    welcome: 'नमस्कार! तुम्हाला कशाबद्दल मदत हवी आहे? खालील विषय निवडा किंवा तुमचा संदेश लिहा.',
    sentAttachment: 'फाइल पाठवली',
    formNeeded: 'यासाठी चॅटपेक्षा अधिक माहिती लागेल.',
    raiseTicket: 'तिकीट तयार करा',
    startNew: 'नवीन चॅट सुरू करा',
    closed: 'हे संभाषण बंद झाले आहे.',
    viewTicket: 'तिकीट पहा',
    placeholder: 'तुमचा संदेश लिहा',
    attach: 'फाइल जोडा',
    addMore: 'आणखी फाइल जोडा',
  },
};

// Grievance officer (disputes spec: must be shown in the app). The client supplies the details;
// set EXPO_PUBLIC_GRIEVANCE_OFFICER to a JSON object, e.g.
// {"name":"","designation":"","email":"","phone":"","address":"","acknowledgeWithin":"","resolveWithin":""}
// Nothing is shown until at least name and email are filled.
export type GrievanceOfficer = {
  name?: string;
  designation?: string;
  email?: string;
  phone?: string;
  address?: string;
  acknowledgeWithin?: string;
  resolveWithin?: string;
};

export const GRIEVANCE_OFFICER: GrievanceOfficer | null = (() => {
  try {
    const raw = process.env.EXPO_PUBLIC_GRIEVANCE_OFFICER;
    const g = raw ? (JSON.parse(raw) as GrievanceOfficer) : null;
    return g?.name?.trim() && g?.email?.trim() ? g : null;
  } catch {
    return null;
  }
})();

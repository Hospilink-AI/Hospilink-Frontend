// Same as backend config/adminPermissions.config.js - keep both in sync.
// Only used to show/hide UI, the API still checks every request.

export type AdminSubRole = 'super_admin' | 'operations_manager' | 'tech_support';

export type AdminCapability =
  | 'hospital.view' | 'hospital.manage'
  | 'staff.view' | 'staff.manage'
  | 'duty.view' | 'duty.manage' | 'duty.export'
  | 'document.view' | 'document.manage'
  | 'activityLog.view' | 'activityLog.export'
  | 'dashboard.view'
  | 'admin.view' | 'admin.manage' | 'admin.sessions'
  | 'vacancy.view' | 'vacancy.manage'
  | 'application.view'
  | 'interview.config.manage'
  | 'knowledgeBase.manage'
  | 'ticket.view' | 'ticket.claim' | 'ticket.decide' | 'ticket.approve'
  | 'pattern.view' | 'suspension.decide'
  | 'feedback.view'
  | 'autoRelist.analytics.view' | 'autoRelist.history.view' | 'autoRelist.manage'
  | 'autoRelist.spend.view' | 'autoRelist.config.manage'
  | 'calendar.config.manage';

// super_admin has every capability (see hasCapability)
const ADMIN_CAPABILITIES: Record<
  Exclude<AdminSubRole, 'super_admin'>,
  readonly AdminCapability[]
> = {
  operations_manager: [
    'hospital.view',
    'hospital.manage',
    'staff.view',
    'staff.manage',
    'duty.view',
    'duty.manage',
    'duty.export',
    'document.view',
    'document.manage',
    'activityLog.view',
    'dashboard.view',
    'admin.view',
    'vacancy.view',
    'vacancy.manage',
    'application.view',
    'interview.config.manage',
    'knowledgeBase.manage',
    'ticket.view',
    'ticket.claim',
    'ticket.decide',
    'ticket.approve',
    'pattern.view',
    'suspension.decide',
    'feedback.view',
    'autoRelist.analytics.view',
    'autoRelist.history.view',
    'autoRelist.manage',
  ],
  tech_support: [
    'hospital.view',
    'staff.view',
    'duty.view',
    'document.view',
    'activityLog.view',
    'ticket.view',
    'ticket.claim',
    'ticket.decide',
    'feedback.view',
    // only from inside an open ticket about the duty (checked by the server)
    'autoRelist.history.view',
  ],
};

export const ADMIN_SUB_ROLE_LABELS: Record<AdminSubRole, string> = {
  super_admin: 'Super Admin',
  operations_manager: 'Operational Manager',
  tech_support: 'Tech Support',
};

export const ADMIN_SUB_ROLE_OPTIONS = (
  Object.keys(ADMIN_SUB_ROLE_LABELS) as AdminSubRole[]
).map((value) => ({ label: ADMIN_SUB_ROLE_LABELS[value], value }));

export const adminSubRoleLabel = (subRole?: string | null): string =>
  (subRole && ADMIN_SUB_ROLE_LABELS[subRole as AdminSubRole]) || subRole || "—";

export function hasCapability(
  subRole: AdminSubRole | string | null | undefined,
  capability: AdminCapability
): boolean {
  if (!subRole) return false;
  if (subRole === 'super_admin') return true;
  const granted = ADMIN_CAPABILITIES[subRole as Exclude<AdminSubRole, 'super_admin'>];
  return granted ? granted.includes(capability) : false;
}

// Route guard for admin pages. Pages not listed are open to every admin.
const ADMIN_ROUTE_CAPABILITIES: [string, AdminCapability][] = [
  ['/admin/dashboard', 'dashboard.view'],
  ['/admin/admin-logs', 'admin.view'],
  ['/admin/hospital-management', 'hospital.view'],
  ['/admin/medical-staff', 'staff.view'],
  ['/admin/document-verification', 'document.view'],
  ['/admin/create-duty', 'duty.manage'],
  ['/admin/emergency', 'duty.manage'],
  ['/admin/emergency-request-all', 'duty.view'],
  ['/admin/active-emergency-request', 'duty.view'],
  ['/admin/duty-overnight', 'duty.view'],
  ['/admin/live-tracking', 'duty.view'],
  ['/admin/live-monitoring', 'duty.view'],
  ['/admin/live-request-monitoring', 'duty.view'],
  ['/admin/activity-logs', 'activityLog.view'],
  ['/admin/tickets', 'ticket.view'],
  ['/admin/patterns', 'pattern.view'],
  ['/admin/feedback', 'feedback.view'],
  ['/admin/knowledge-base', 'knowledgeBase.manage'],
  ['/admin/auto-relist/settings', 'autoRelist.config.manage'],
  ['/admin/auto-relist', 'autoRelist.analytics.view'],
  ['/admin/calendar-settings', 'calendar.config.manage'],
];

export function adminRouteCapability(pathname: string): AdminCapability | null {
  const hit = ADMIN_ROUTE_CAPABILITIES.find(([route]) => pathname === route || pathname.startsWith(route + '/'));
  return hit ? hit[1] : null;
}

// Where an admin lands after login. Tech Support has no dashboard.
export function adminLandingRoute(subRole?: string | null): string {
  if (!subRole) return '/admin/dashboard';
  return hasCapability(subRole, 'dashboard.view') ? '/admin/dashboard' : '/admin/tickets';
}

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
  | 'feedback.view';

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

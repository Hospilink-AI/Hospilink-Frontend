// staffReportExport.ts
// Builds a branded Hospilink PDF report from medical-staff data and exports it.
//   Native  → expo-print (PDF file) + expo-sharing (share sheet)
//   Web     → opens a print window (Save as PDF)
//
// Install deps (Expo):  npx expo install expo-print expo-sharing

import * as Print from 'expo-print';
import * as Sharing from 'expo-sharing';
import { Platform } from 'react-native';

type VerificationStatus =
  | 'verified' | 'pending' | 'rejected'
  | 'auto-verified' | 'manual-pending-verification';

// Only the fields the report needs — your MedicalStaff type already satisfies this.
export interface ExportStaff {
  fullName: string;
  staffId: string;
  jobRoleLabel: string;
  location: string;
  city: string;
  email: string;
  completedDuties: number;
  verificationStatus: VerificationStatus | string;
  status: 'AVAILABLE' | 'UNAVAILABLE';
}

const PDF_BADGE: Record<string, { bg: string; color: string; label: string }> = {
  'verified':                      { bg: '#F0FDF4', color: '#16A34A', label: 'Verified' },
  'auto-verified':                 { bg: '#ECFDF5', color: '#15803D', label: 'Auto Verified' },
  'pending':                       { bg: '#FFFBEB', color: '#D97706', label: 'Pending' },
  'manual-pending-verification':   { bg: '#EFF6FF', color: '#2563EB', label: 'Manual Pending' },
  'rejected':                      { bg: '#FEF2F2', color: '#DC2626', label: 'Rejected' },
};

const esc = (s: any): string =>
  String(s ?? '')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');

export function buildStaffReportHtml(staff: ExportStaff[]): string {
  const generated = new Date().toLocaleDateString('en-GB', {
    day: 'numeric', month: 'long', year: 'numeric',
  });

  const total = staff.length;
  const verified = staff.filter(
    s => s.verificationStatus === 'verified' || s.verificationStatus === 'auto-verified'
  ).length;
  const pending = staff.filter(
    s => s.verificationStatus === 'pending' || s.verificationStatus === 'manual-pending-verification'
  ).length;
  const rejected = staff.filter(s => s.verificationStatus === 'rejected').length;

  const rows = staff.map((s, i) => {
    const b = PDF_BADGE[s.verificationStatus] ?? PDF_BADGE.pending;
    const idShort = s.staffId ? `ID: ${s.staffId.slice(-6).toUpperCase()}` : '—';
    return `
      <tr class="${i % 2 ? 'odd' : 'even'}">
        <td class="name-cell">
          <div class="name">${esc(s.fullName)}</div>
          <div class="sid">${esc(idShort)}</div>
        </td>
        <td>${esc(s.jobRoleLabel)}</td>
        <td class="loc">${esc(s.location || s.city || '—')}</td>
        <td class="email">${esc(s.email)}</td>
        <td class="center">${s.completedDuties ?? 0}</td>
        <td class="center">
          <span class="badge" style="background:${b.bg};color:${b.color}">${b.label}</span>
        </td>
      </tr>`;
  }).join('');

  return `<!DOCTYPE html>
<html>
<head>
<meta charset="utf-8" />
<meta name="viewport" content="width=device-width, initial-scale=1" />
<style>
  * { box-sizing: border-box; -webkit-print-color-adjust: exact; print-color-adjust: exact; }
  body { margin: 0; font-family: -apple-system, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; color: #0F172A; }
  .header { background: #2563EB; padding: 32px 40px; color: #fff; }
  .header h1 { margin: 0; font-size: 28px; font-weight: 800; letter-spacing: -0.5px; }
  .header p { margin: 6px 0 0; font-size: 13px; opacity: 0.9; }
  .body { padding: 28px 40px; }
  .report-title { font-size: 22px; font-weight: 800; margin: 0 0 16px; }
  .meta { font-size: 13px; color: #334155; line-height: 1.9; margin-bottom: 20px; }
  .meta b { color: #0F172A; }
  .summary { display: flex; gap: 12px; margin-bottom: 24px; }
  .stat { flex: 1; border: 1px solid #E9ECF0; border-radius: 10px; padding: 12px 14px; }
  .stat .v { font-size: 22px; font-weight: 800; line-height: 1; }
  .stat .l { font-size: 10px; font-weight: 700; letter-spacing: 0.6px; text-transform: uppercase; color: #94A3B8; margin-top: 6px; }
  table { width: 100%; border-collapse: collapse; font-size: 12px; }
  thead { display: table-header-group; }
  th { background: #2563EB; color: #fff; text-align: left; padding: 11px 12px; font-size: 11px; font-weight: 700; letter-spacing: 0.4px; }
  th.center, td.center { text-align: center; }
  td { padding: 11px 12px; border-bottom: 1px solid #EEF2F7; color: #334155; vertical-align: top; }
  tr.even td { background: #F8FAFC; }
  tr { page-break-inside: avoid; }
  .name { font-weight: 700; color: #0F172A; }
  .sid { font-size: 10px; color: #94A3B8; margin-top: 2px; }
  .loc { color: #475569; max-width: 180px; }
  .email { color: #475569; max-width: 200px; word-break: break-all; }
  .badge { display: inline-block; padding: 4px 10px; border-radius: 99px; font-size: 10px; font-weight: 700; white-space: nowrap; }
  .footer { margin-top: 24px; font-size: 10px; color: #94A3B8; text-align: center; }
  @page { margin: 24px; }
</style>
</head>
<body>
  <div class="header">
    <h1>Hospilink</h1>
    <p>Healthcare Staffing Solutions</p>
  </div>
  <div class="body">
    <h2 class="report-title">Medical Staff Report</h2>
    <div class="meta">
      Generated: <b>${generated}</b><br/>
      Total Staff: <b>${total}</b>
    </div>
    <div class="summary">
      <div class="stat"><div class="v">${total}</div><div class="l">Total</div></div>
      <div class="stat"><div class="v" style="color:#16A34A">${verified}</div><div class="l">Verified</div></div>
      <div class="stat"><div class="v" style="color:#D97706">${pending}</div><div class="l">Pending</div></div>
      <div class="stat"><div class="v" style="color:#DC2626">${rejected}</div><div class="l">Rejected</div></div>
    </div>
    <table>
      <thead>
        <tr>
          <th>Staff Name</th>
          <th>Job Role</th>
          <th>Location</th>
          <th>Email</th>
          <th class="center">Duties</th>
          <th class="center">Status</th>
        </tr>
      </thead>
      <tbody>${rows}</tbody>
    </table>
    <div class="footer">Generated by Hospilink+ Admin · ${generated}</div>
  </div>
</body>
</html>`;
}

export async function exportStaffReport(staff: ExportStaff[]): Promise<void> {
  const html = buildStaffReportHtml(staff);

  if (Platform.OS === 'web') {
    const win = window.open('', '_blank');
    if (!win) throw new Error('Popup blocked — allow popups to export the report.');
    win.document.open();
    win.document.write(html);
    win.document.close();
    win.focus();
    setTimeout(() => win.print(), 400);
    return;
  }

  const { uri } = await Print.printToFileAsync({ html, base64: false });
  if (await Sharing.isAvailableAsync()) {
    await Sharing.shareAsync(uri, {
      mimeType: 'application/pdf',
      dialogTitle: 'Export Staff Data',
      UTI: 'com.adobe.pdf',
    });
  }
}
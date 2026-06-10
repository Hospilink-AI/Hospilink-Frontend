// dutyReportExport.ts
// Builds a branded Hospilink PDF report from active-duty data and exports it.
//   Native  → expo-print (PDF file) + expo-sharing (share sheet)
//   Web     → opens a print window (Save as PDF)
//
// Install deps (Expo):  npx expo install expo-print expo-sharing

import * as Print from 'expo-print';
import * as Sharing from 'expo-sharing';
import { Platform } from 'react-native';

// Only the fields the report needs — your Duty type already satisfies this.
export interface ExportDuty {
  dutyId: string;
  formattedRole: string;
  hospital: { name: string; location?: string; currentAddress?: string; city?: string };
  staff: { name: string } | null;
  timing: { date?: string; startTime: string; endTime: string; urgency?: string };
  status: { status: string };
  distance?: { distanceText?: string; estimatedTimeText?: string } | null;
  totalPayment: number | string;
}

export interface ExportSummary {
  totalActiveDuties?: number | string;
  assignedCount?: number | string;
  enrouteCount?: number | string;
  inProgressCount?: number | string;
}

const STATUS_CFG: Record<string, { bg: string; color: string; label: string }> = {
  'assigned':    { bg: '#FEF3C7', color: '#D97706', label: 'Assigned' },
  'enroute':     { bg: '#DBEAFE', color: '#2563EB', label: 'Enroute' },
  'in-progress': { bg: '#DCFCE7', color: '#16A34A', label: 'In Progress' },
  'completed':   { bg: '#DCFCE7', color: '#16A34A', label: 'Completed' },
  'cancelled':   { bg: '#FEF2F2', color: '#DC2626', label: 'Cancelled' },
  'expired':     { bg: '#FEF2F2', color: '#DC2626', label: 'Expired' },
};

const esc = (s: any): string =>
  String(s ?? '')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');

const num = (v: any): number => {
  const n = typeof v === 'string' ? parseFloat(v) : Number(v);
  return Number.isFinite(n) ? n : 0;
};

const fmtPayment = (p: number | string): string => {
  const n = num(p);
  return 'Rs. ' + n.toLocaleString('en-IN', { maximumFractionDigits: 2 });
};

const fmtDate = (iso?: string): string => {
  if (!iso) return '—';
  const d = new Date(iso);
  if (isNaN(d.getTime())) return '—';
  const dd = String(d.getDate()).padStart(2, '0');
  const mm = String(d.getMonth() + 1).padStart(2, '0');
  return `${dd}-${mm}-${d.getFullYear()}`;
};

const statusOf = (raw: string) => {
  const key = (raw ?? '').toLowerCase();
  return STATUS_CFG[key] ?? {
    bg: '#F1F5F9',
    color: '#64748B',
    label: key ? key.charAt(0).toUpperCase() + key.slice(1) : '—',
  };
};

export function buildDutyReportHtml(duties: ExportDuty[], summary?: ExportSummary): string {
  const generated = new Date().toLocaleDateString('en-GB', {
    day: 'numeric', month: 'long', year: 'numeric',
  });

  const total = summary?.totalActiveDuties != null ? num(summary.totalActiveDuties) : duties.length;
  const assigned = summary?.assignedCount != null
    ? num(summary.assignedCount)
    : duties.filter(d => d.status?.status?.toLowerCase() === 'assigned').length;
  const enroute = summary?.enrouteCount != null
    ? num(summary.enrouteCount)
    : duties.filter(d => d.status?.status?.toLowerCase() === 'enroute').length;
  const inProgress = summary?.inProgressCount != null
    ? num(summary.inProgressCount)
    : duties.filter(d => d.status?.status?.toLowerCase() === 'in-progress').length;

  const rows = duties.map((d, i) => {
    const st = statusOf(d.status?.status);
    const hospitalLoc = d.hospital?.currentAddress || d.hospital?.location || d.hospital?.city || '';
    const shift = `${esc(d.timing?.startTime)} - ${esc(d.timing?.endTime)}`;
    return `
      <tr class="${i % 2 ? 'odd' : 'even'}">
        <td class="role">${esc(d.formattedRole)}</td>
        <td class="hosp">
          <div class="name">${esc(d.hospital?.name || '—')}</div>
          ${hospitalLoc ? `<div class="sub">${esc(hospitalLoc)}</div>` : ''}
        </td>
        <td>${esc(d.staff?.name || 'Unassigned')}</td>
        <td class="center">${fmtDate(d.timing?.date)}</td>
        <td class="center">${shift}</td>
        <td class="center">
          <span class="badge" style="background:${st.bg};color:${st.color}">${st.label}</span>
        </td>
        <td class="center pay">${fmtPayment(d.totalPayment)}</td>
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
  .role { font-weight: 700; color: #0F172A; max-width: 150px; }
  .name { font-weight: 700; color: #0F172A; }
  .sub { font-size: 10px; color: #94A3B8; margin-top: 2px; max-width: 200px; }
  .pay { font-weight: 700; white-space: nowrap; }
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
    <h2 class="report-title">Active Duties Report</h2>
    <div class="meta">
      Generated: <b>${generated}</b><br/>
      Total Active Duties: <b>${total}</b>
    </div>
    <div class="summary">
      <div class="stat"><div class="v">${total}</div><div class="l">Total Active</div></div>
      <div class="stat"><div class="v" style="color:#D97706">${assigned}</div><div class="l">Assigned</div></div>
      <div class="stat"><div class="v" style="color:#2563EB">${enroute}</div><div class="l">Enroute</div></div>
      <div class="stat"><div class="v" style="color:#16A34A">${inProgress}</div><div class="l">In Progress</div></div>
    </div>
    <table>
      <thead>
        <tr>
          <th>Role</th>
          <th>Hospital</th>
          <th>Staff</th>
          <th class="center">Date</th>
          <th class="center">Shift</th>
          <th class="center">Status</th>
          <th class="center">Payment</th>
        </tr>
      </thead>
      <tbody>${rows}</tbody>
    </table>
    <div class="footer">Generated by Hospilink+ Admin · ${generated}</div>
  </div>
</body>
</html>`;
}

export async function exportDutyReport(duties: ExportDuty[], summary?: ExportSummary): Promise<void> {
  const html = buildDutyReportHtml(duties, summary);

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
      dialogTitle: 'Export Report',
      UTI: 'com.adobe.pdf',
    });
  }
}
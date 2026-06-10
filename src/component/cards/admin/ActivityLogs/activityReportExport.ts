// activityLogReportExport.ts
// Builds a branded Hospilink PDF report from activity-log data and exports it.
//   Native  → expo-print (PDF file) + expo-sharing (share sheet)
//   Web     → opens a print window (Save as PDF)
//
// Install deps (Expo):  npx expo install expo-print expo-sharing

import * as Print from 'expo-print';
import * as Sharing from 'expo-sharing';
import { Platform } from 'react-native';

// Only the fields the report needs — your ActivityLog type already satisfies this.
export interface ExportLog {
  date: string;
  time: string;
  name: string;
  role: string;
  description: string;
  location: string;
  status: string;
  actionType: string;
}

const PDF_BADGE: Record<string, { bg: string; color: string; label: string }> = {
  SUCCESS:  { bg: '#F0FDF4', color: '#16A34A', label: 'Success' },
  WARNING:  { bg: '#FFFBEB', color: '#D97706', label: 'Warning' },
  CRITICAL: { bg: '#FEF2F2', color: '#DC2626', label: 'Critical' },
  FAILED:   { bg: '#FEF2F2', color: '#DC2626', label: 'Failed' },
  INFO:     { bg: '#EFF6FF', color: '#2563EB', label: 'Info' },
};

const esc = (s: any): string =>
  String(s ?? '')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');

export function buildActivityLogReportHtml(logs: ExportLog[]): string {
  const generated = new Date().toLocaleDateString('en-GB', {
    day: 'numeric', month: 'long', year: 'numeric',
  });

  const total = logs.length;
  const success = logs.filter(l => l.status === 'SUCCESS').length;
  const warning = logs.filter(l => l.status === 'WARNING').length;
  const failed = logs.filter(l => l.status === 'FAILED' || l.status === 'CRITICAL').length;

  const rows = logs.map((l, i) => {
    const b = PDF_BADGE[l.status] ?? PDF_BADGE.INFO;
    return `
      <tr class="${i % 2 ? 'odd' : 'even'}">
        <td class="ts">
          <div class="date">${esc(l.date)}</div>
          <div class="time">${esc(l.time)}</div>
        </td>
        <td class="user">
          <div class="name">${esc(l.name)}</div>
          <div class="role">${esc(l.role)}</div>
        </td>
        <td class="desc">
          <div>${esc(l.description)}</div>
          <span class="chip">${esc((l.actionType || '').replace(/_/g, ' '))}</span>
        </td>
        <td class="loc">${esc(l.location)}</td>
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
  table { width: 100%; border-collapse: collapse; font-size: 12px; table-layout: fixed; }
  thead { display: table-header-group; }
  th { background: #2563EB; color: #fff; text-align: left; padding: 11px 12px; font-size: 11px; font-weight: 700; letter-spacing: 0.4px; }
  th.center, td.center { text-align: center; }
  td { padding: 11px 12px; border-bottom: 1px solid #EEF2F7; color: #334155; vertical-align: top; word-wrap: break-word; }
  tr.even td { background: #F8FAFC; }
  tr { page-break-inside: avoid; }
  .col-ts { width: 14%; } .col-user { width: 20%; } .col-desc { width: 38%; }
  .col-loc { width: 20%; } .col-status { width: 8%; }
  .date { font-weight: 700; color: #0F172A; }
  .time { font-size: 10px; color: #94A3B8; margin-top: 2px; }
  .name { font-weight: 700; color: #0F172A; }
  .role { font-size: 10px; color: #94A3B8; margin-top: 2px; }
  .desc div { color: #475569; line-height: 1.5; }
  .chip { display: inline-block; margin-top: 5px; background: #F1F5F9; color: #64748B; border-radius: 4px; padding: 2px 6px; font-size: 9px; font-weight: 700; letter-spacing: 0.3px; }
  .loc { color: #475569; font-size: 11px; }
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
    <h2 class="report-title">Activity Logs Report</h2>
    <div class="meta">
      Generated: <b>${generated}</b><br/>
      Total Logs: <b>${total}</b>
    </div>
    <div class="summary">
      <div class="stat"><div class="v">${total}</div><div class="l">Total</div></div>
      <div class="stat"><div class="v" style="color:#16A34A">${success}</div><div class="l">Success</div></div>
      <div class="stat"><div class="v" style="color:#D97706">${warning}</div><div class="l">Warning</div></div>
      <div class="stat"><div class="v" style="color:#DC2626">${failed}</div><div class="l">Critical / Failed</div></div>
    </div>
    <table>
      <thead>
        <tr>
          <th class="col-ts">Timestamp</th>
          <th class="col-user">User</th>
          <th class="col-desc">Activity Description</th>
          <th class="col-loc">Location</th>
          <th class="col-status center">Status</th>
        </tr>
      </thead>
      <tbody>${rows}</tbody>
    </table>
    <div class="footer">Generated by Hospilink+ Admin · ${generated}</div>
  </div>
</body>
</html>`;
}

export async function exportActivityLogReport(logs: ExportLog[]): Promise<void> {
  const html = buildActivityLogReportHtml(logs);

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
      dialogTitle: 'Export Activity Logs',
      UTI: 'com.adobe.pdf',
    });
  }
}
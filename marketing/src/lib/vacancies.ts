// Client for the public vacancy endpoints. Runs in the browser (live data, no build-time snapshot).
import { API } from "../config";
import { roleLabel } from "../data/roles";

export interface Vacancy {
  _id: string;
  title: string;
  specialty: string;
  experience?: string;
  education?: string;
  skills?: string[];
  location?: string;
  salary?: string;
  description: string;
  hospitalName?: string;
  createdAt?: string;
  updatedAt?: string;
}

export interface VacancyPage {
  vacancies: Vacancy[];
  page: number;
  totalPages: number;
  total: number;
}

export interface VacancyQuery {
  specialty?: string;
  location?: string;
  page?: number;
  limit?: number;
}

async function getJSON(url: string, timeoutMs = 12000) {
  const ctrl = new AbortController();
  const t = setTimeout(() => ctrl.abort(), timeoutMs);
  try {
    const res = await fetch(url, { signal: ctrl.signal, headers: { Accept: "application/json" } });
    if (!res.ok) throw Object.assign(new Error(`HTTP ${res.status}`), { status: res.status });
    return await res.json();
  } finally {
    clearTimeout(t);
  }
}

export async function listVacancies(q: VacancyQuery = {}): Promise<VacancyPage> {
  const u = new URL(API.vacancies, API.base);
  if (q.specialty) u.searchParams.set("specialty", q.specialty);
  if (q.location) u.searchParams.set("location", q.location);
  u.searchParams.set("page", String(q.page ?? 1));
  u.searchParams.set("limit", String(q.limit ?? 12));
  const json = await getJSON(u.href);
  const p = json.pagination ?? {};
  const vacancies: Vacancy[] = Array.isArray(json.data) ? json.data : [];
  return {
    vacancies,
    page: Number(p.currentPage ?? p.page ?? q.page ?? 1),
    totalPages: Number(p.totalPages ?? p.pages ?? 1),
    total: Number(p.totalItems ?? p.total ?? json.count ?? vacancies.length),
  };
}

export async function getVacancy(id: string): Promise<Vacancy> {
  const json = await getJSON(new URL(`${API.vacancies}/${encodeURIComponent(id)}`, API.base).href);
  return json.vacancy;
}

const esc = (s: unknown) =>
  String(s ?? "").replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" })[c]!);

export function postedAgo(iso?: string) {
  if (!iso) return "";
  const days = Math.floor((Date.now() - new Date(iso).getTime()) / 86400000);
  if (days <= 0) return "Posted today";
  if (days === 1) return "Posted yesterday";
  if (days < 30) return `Posted ${days} days ago`;
  return `Posted ${new Date(iso).toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric" })}`;
}

const ic = {
  pin: '<svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" stroke-width="1.75" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M9 11a3 3 0 1 0 6 0a3 3 0 0 0 -6 0"/><path d="M17.657 16.657l-4.243 4.243a2 2 0 0 1 -2.827 0l-4.244 -4.243a8 8 0 1 1 11.314 0"/></svg>',
  hosp: '<svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" stroke-width="1.75" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M12 8v4"/><path d="M10 10h4"/><path d="M6 21v-14a2 2 0 0 1 2 -2h8a2 2 0 0 1 2 2v14"/><path d="M3 21h18"/><path d="M10 21v-4h4v4"/></svg>',
  exp: '<svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" stroke-width="1.75" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M3 9a2 2 0 0 1 2 -2h14a2 2 0 0 1 2 2v9a2 2 0 0 1 -2 2h-14a2 2 0 0 1 -2 -2l0 -9"/><path d="M8 7v-2a2 2 0 0 1 2 -2h4a2 2 0 0 1 2 2v2"/></svg>',
  arrow: '<svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" stroke-width="1.75" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M5 12l14 0"/><path d="M13 18l6 -6"/><path d="M13 6l6 6"/></svg>',
};

/** Card markup shared by the home page preview and the vacancy board. */
export function vacancyCard(v: Vacancy) {
  const href = `/vacancies/view/?id=${encodeURIComponent(v._id)}`;
  const skills = (v.skills ?? []).slice(0, 3);
  return `
  <article class="vcard">
    <div class="vcard-top">
      <span class="tag tag-saline">${esc(roleLabel(v.specialty))}</span>
      <span class="vcard-date">${esc(postedAgo(v.createdAt))}</span>
    </div>
    <h3 class="vcard-title"><a href="${href}">${esc(v.title)}</a></h3>
    <ul class="vcard-meta" role="list">
      ${v.hospitalName ? `<li>${ic.hosp}${esc(v.hospitalName)}</li>` : ""}
      ${v.location ? `<li>${ic.pin}${esc(v.location)}</li>` : ""}
      ${v.experience ? `<li>${ic.exp}${esc(v.experience)}</li>` : ""}
    </ul>
    ${skills.length ? `<ul class="vcard-skills" role="list">${skills.map((s) => `<li>${esc(s)}</li>`).join("")}</ul>` : ""}
    <div class="vcard-foot">
      <span class="vcard-salary tnum">${v.salary ? esc(v.salary) : "Salary on request"}</span>
      <span class="vcard-go" aria-hidden="true">${ic.arrow}</span>
    </div>
  </article>`;
}

export { esc };

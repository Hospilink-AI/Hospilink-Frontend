// Client behaviour for <Board>: live fetch, URL sync, pagination, honest states.
import { listVacancies, vacancyCard } from "../../lib/vacancies";
import { emptyState, errorState } from "../../lib/vacancyStates";
import { roleLabel } from "../../data/roles";

const skeletons = (n: number) =>
  Array.from({ length: n }, () => '<div class="vcard skel" aria-hidden="true"><span></span><span></span><span></span><span></span></div>').join("");

function initBoard(root: HTMLElement) {
  const form = root.querySelector<HTMLFormElement>("[data-form]")!;
  const roleSel = root.querySelector<HTMLSelectElement>("[data-role]");
  const locInput = root.querySelector<HTMLInputElement>("[data-loc]")!;
  const clearBtn = root.querySelector<HTMLButtonElement>("[data-clear]")!;
  const list = root.querySelector<HTMLElement>("[data-list]")!;
  const state = root.querySelector<HTMLElement>("[data-state]")!;
  const count = root.querySelector<HTMLElement>("[data-count]")!;
  const pager = root.querySelector<HTMLElement>("[data-pager]")!;
  const prev = root.querySelector<HTMLButtonElement>("[data-prev]")!;
  const next = root.querySelector<HTMLButtonElement>("[data-next]")!;
  const pageLabel = root.querySelector<HTMLElement>("[data-page-label]")!;

  const fixed = root.dataset.specialty || "";
  const sync = root.dataset.sync === "1";
  const limit = Number(root.dataset.limit || 12);

  const q = { specialty: fixed, location: "", page: 1 };
  if (sync) {
    const p = new URLSearchParams(location.search);
    if (!fixed) q.specialty = p.get("specialty") ?? "";
    q.location = (p.get("location") ?? p.get("q") ?? "").trim();
    q.page = Math.max(1, parseInt(p.get("page") ?? "1", 10) || 1);
  }
  if (roleSel) roleSel.value = q.specialty;
  locInput.value = q.location;

  const filtered = () => (!fixed && !!q.specialty) || !!q.location;

  const writeUrl = () => {
    if (!sync) return;
    const p = new URLSearchParams();
    if (!fixed && q.specialty) p.set("specialty", q.specialty);
    if (q.location) p.set("location", q.location);
    if (q.page > 1) p.set("page", String(q.page));
    const s = p.toString();
    history.replaceState(null, "", location.pathname + (s ? `?${s}` : ""));
  };

  let seq = 0;
  async function load(scroll = false) {
    const my = ++seq;
    clearBtn.hidden = !filtered();
    list.innerHTML = skeletons(Math.min(limit, 6));
    list.setAttribute("aria-busy", "true");
    state.hidden = true;
    pager.hidden = true;
    count.textContent = "Loading vacancies…";
    if (scroll) root.scrollIntoView({ behavior: matchMedia("(prefers-reduced-motion: reduce)").matches ? "auto" : "smooth", block: "start" });
    try {
      const page = await listVacancies({ specialty: q.specialty || undefined, location: q.location || undefined, page: q.page, limit });
      if (my !== seq) return;
      if (!page.vacancies.length) {
        list.innerHTML = "";
        state.innerHTML = emptyState(filtered());
        if (filtered()) {
          state.insertAdjacentHTML("beforeend", '<button class="btn btn-dark btn-sm" type="button" data-clear-state>Clear filters</button>');
          state.querySelector("[data-clear-state]")?.addEventListener("click", clearAll);
        }
        state.hidden = false;
        count.textContent = filtered() ? "No matches" : "No open vacancies right now";
      } else {
        list.innerHTML = page.vacancies.map(vacancyCard).join("");
        const where = q.location ? ` in “${q.location}”` : "";
        const what = q.specialty ? ` for ${roleLabel(q.specialty)}` : "";
        const n = page.total;
        count.textContent = `${n.toLocaleString("en-IN")} ${n === 1 ? "vacancy" : "vacancies"}${what}${where}`;
        if (page.totalPages > 1) {
          pager.hidden = false;
          pageLabel.textContent = `Page ${page.page} of ${page.totalPages}`;
          prev.disabled = page.page <= 1;
          next.disabled = page.page >= page.totalPages;
        }
      }
    } catch {
      if (my !== seq) return;
      list.innerHTML = "";
      state.innerHTML = errorState();
      state.hidden = false;
      count.textContent = "Couldn't load vacancies";
      state.querySelector("[data-retry]")?.addEventListener("click", () => load());
    } finally {
      if (my === seq) list.setAttribute("aria-busy", "false");
    }
  }

  function clearAll() {
    if (roleSel) roleSel.value = "";
    locInput.value = "";
    q.specialty = fixed;
    q.location = "";
    q.page = 1;
    writeUrl();
    load();
  }

  form.addEventListener("submit", (e) => {
    e.preventDefault();
    q.specialty = fixed || (roleSel?.value ?? "");
    q.location = locInput.value.trim();
    q.page = 1;
    writeUrl();
    load();
  });
  roleSel?.addEventListener("change", () => form.requestSubmit());
  clearBtn.addEventListener("click", clearAll);
  prev.addEventListener("click", () => { if (q.page > 1) { q.page--; writeUrl(); load(true); } });
  next.addEventListener("click", () => { q.page++; writeUrl(); load(true); });

  load();
}

export function initBoards() {
  document.querySelectorAll<HTMLElement>("[data-board]").forEach(initBoard);
}

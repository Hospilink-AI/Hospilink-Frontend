// Honest empty and error states for the live vacancy feed.
const svg = (d: string) =>
  `<svg viewBox="0 0 24 24" width="26" height="26" fill="none" stroke="currentColor" stroke-width="1.75" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">${d}</svg>`;

const briefcase = svg('<path d="M3 9a2 2 0 0 1 2 -2h14a2 2 0 0 1 2 2v9a2 2 0 0 1 -2 2h-14a2 2 0 0 1 -2 -2l0 -9"/><path d="M8 7v-2a2 2 0 0 1 2 -2h4a2 2 0 0 1 2 2v2"/><path d="M12 12l0 .01"/><path d="M3 13a20 20 0 0 0 18 0"/>');
const wifiOff = svg('<path d="M12 18l.01 0"/><path d="M9.172 15.172a4 4 0 0 1 5.656 0"/><path d="M6.343 12.343a7.963 7.963 0 0 1 3.864 -2.14m4.163 .155a7.965 7.965 0 0 1 3.287 2"/><path d="M3.515 9.515a12 12 0 0 1 3.544 -2.455m3.101 -.92a12 12 0 0 1 10.325 3.374"/><path d="M3 3l18 18"/>');

export function emptyState(filtered = false) {
  return `
    <span class="state-ic">${briefcase}</span>
    <p class="state-t">${filtered ? "No vacancies match your search" : "No hospital vacancies right now"}</p>
    <p class="state-s">${filtered ? "Try another role or city, or clear the filters." : "New vacancies show up here as hospitals post them. Install the app to hear about them first."}</p>
  `;
}

export function errorState() {
  return `
    <span class="state-ic">${wifiOff}</span>
    <p class="state-t">We couldn't load vacancies just now</p>
    <p class="state-s">This is on our side or your connection. Try again in a moment.</p>
    <button class="btn btn-dark btn-sm" type="button" data-retry>Try again</button>
  `;
}

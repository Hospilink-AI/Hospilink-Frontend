// Turn the server's duty errors into a short title and a next step, shown next to the Post button.

export type FormError = { title: string; body: string };

function rawMessages(e: any): string[] {
  const d = e?.response?.data;
  const list = Array.isArray(d?.errors) ? d.errors.map((x: any) => (typeof x === 'string' ? x : x?.msg ?? x?.message)).filter(Boolean) : [];
  if (list.length) return list;
  return [d?.message ?? d?.error ?? e?.message].filter(Boolean);
}

export function dutyError(e: any, fallbackTitle = "The duty wasn't posted"): FormError {
  if (!e?.response) return { title: 'No connection', body: "We couldn't reach HospiLink. Check your internet and try again. Nothing was posted." };
  const msgs = rawMessages(e);
  const m = msgs.join(' ');
  if (/15 minutes in the future|past or immediate|start time must be/i.test(m))
    return { title: 'Starts too soon', body: 'A duty has to start at least 15 minutes from now, so staff have time to reach you. Pick a later start time.' };
  if (/within the next 1 hour/i.test(m)) return { title: 'Too far ahead for Emergency', body: 'Emergency is for duties starting within the next hour. Post this as a normal or urgent duty.' };
  if (/sub-type/i.test(m)) return { title: 'Choose where the RMO will work', body: 'Pick Casualty, ICU or Ward.' };
  if (/staff_count/i.test(m)) return { title: 'Check how many staff', body: 'You can ask for 1 to 50 staff on one duty.' };
  if (/invite/i.test(m)) return { title: "Some invited doctors can't take this duty", body: msgs[0] };
  if (/not verified|verification/i.test(m)) return { title: 'Your hospital is not verified yet', body: 'You can post duties once HospiLink has checked your hospital documents.' };
  if (/offered_rate|rate/i.test(m)) return { title: 'Check the rate', body: msgs[0] };
  if (e.response.status >= 500) return { title: fallbackTitle, body: 'Something went wrong on our side. Try again in a minute. Nothing was posted.' };
  return { title: fallbackTitle, body: msgs[0] && !/^validation failed$/i.test(msgs[0]) ? msgs[0] : 'Check the details and try again.' };
}

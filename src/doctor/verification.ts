import { DOCTOR_DOCS, docState } from './components/DocumentList';

// Where a doctor is on the way to their first duty, from their profile status and documents.

export type DocLine = { title: string; state: 'missing' | 'checking' | 'ok' | 'rejected' };

export type VerifyStage =
  | 'loading'
  // one or more required documents missing or rejected
  | 'docs'
  // everything is in; HospiLink is checking
  | 'review'
  // the account review came back with changes needed
  | 'rejected'
  | 'verified';

export type VerifySummary = {
  stage: VerifyStage;
  required: DocLine[];
  missing: number;
  rejected: number;
  checking: number;
};

type Doc = { documentType: string; verificationStatus: string; uploadedAt?: string };

export function summarize(docs: Doc[] | null, verification: 'pending' | 'verified' | 'rejected' | null): VerifySummary {
  const required: DocLine[] = DOCTOR_DOCS.filter((s) => s.need !== 'optional').map((slot) => {
    const mine = (docs ?? [])
      .filter((d) => slot.types.includes(d.documentType))
      .sort((a, b) => new Date(b.uploadedAt ?? 0).getTime() - new Date(a.uploadedAt ?? 0).getTime());
    // for "one of" slots, a verified one wins over a newer pending one
    const best = mine.find((d) => docState(d.verificationStatus).ok) ?? mine[0];
    if (!best) return { title: slot.title, state: 'missing' };
    const s = docState(best.verificationStatus);
    return { title: slot.title, state: s.ok ? 'ok' : best.verificationStatus === 'rejected' ? 'rejected' : 'checking' };
  });
  const missing = required.filter((d) => d.state === 'missing').length;
  const rejected = required.filter((d) => d.state === 'rejected').length;
  const checking = required.filter((d) => d.state === 'checking').length;
  let stage: VerifyStage;
  if (verification === 'verified') stage = 'verified';
  else if (docs === null) stage = 'loading';
  else if (missing || rejected) stage = 'docs';
  else if (verification === 'rejected') stage = 'rejected';
  else stage = 'review';
  return { stage, required, missing, rejected, checking };
}

/** One line for the reminder strip and the hero, by stage. */
export function verifyHeadline(v: VerifySummary): { title: string; body: string; action?: string } {
  switch (v.stage) {
    case 'docs': {
      const n = v.missing + v.rejected;
      if (v.rejected && !v.missing)
        return {
          title: v.rejected === 1 ? '1 document needs a new upload' : `${v.rejected} documents need a new upload`,
          body: "We couldn't accept it. Upload a clearer copy to keep your verification moving.",
          action: 'Fix documents',
        };
      return {
        title: n === 1 ? 'Upload 1 more document to start taking duties' : `Upload ${n} documents to start taking duties`,
        body: 'Hospitals can only offer duties to verified doctors. Upload a photo or PDF of each one.',
        action: 'Upload documents',
      };
    }
    case 'review':
      return {
        title: "We're checking your documents",
        body: "Our team checks them and emails you once you're verified.",
      };
    case 'rejected':
      return {
        title: 'Your verification needs changes',
        body: 'Open your documents to see what to change, then upload again.',
        action: 'See what to change',
      };
    default:
      return { title: '', body: '' };
  }
}

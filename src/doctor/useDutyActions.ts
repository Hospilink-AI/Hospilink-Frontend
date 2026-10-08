import { useState } from 'react';
import { autoRelistAPI, dutyAPI } from '@/service/api';
import { snack } from '@/ds/Snackbar';
import { useDoctor } from './DoctorContext';
import { dutyErrorMessage } from './duty';

type Busy = null | 'accept' | 'enroute' | 'startOtp' | 'verifyStart' | 'endOtp' | 'resend' | 'cancel';

/** Every step a doctor takes on a duty, with the server's own rules and messages. */
export function useDutyActions(onChange?: () => void) {
  const { refreshDuties, shareLocationNow } = useDoctor();
  const [busy, setBusy] = useState<Busy>(null);

  const run = async <T,>(kind: Busy, fn: () => Promise<T>, ok?: string, fallback = "That didn't go through. Try again."): Promise<T | null> => {
    setBusy(kind);
    try {
      const r = await fn();
      if (ok) snack(ok, { tone: 'success' });
      await refreshDuties();
      onChange?.();
      return r;
    } catch (e) {
      snack(dutyErrorMessage(e, fallback), { tone: 'error' });
      return null;
    } finally {
      setBusy(null);
    }
  };

  return {
    busy,
    accept: (id: string) => run('accept', () => dutyAPI.acceptDuty(id), "Duty accepted. It's in your Upcoming list.", "The duty wasn't accepted."),
    startTrip: (id: string) => run('enroute', () => dutyAPI.updateDutyStatus(id, 'enroute'), "Have a safe trip. The hospital can see you're on the way."),
    requestStartOtp: (id: string) =>
      run(
        'startOtp',
        async () => {
          // the server checks a position no older than 90 s, so send one now
          await shareLocationNow().catch(() => {});
          await new Promise((r) => setTimeout(r, 600));
          return dutyAPI.requestStartOtp(id);
        },
        'Code sent to the duty desk. Ask them to read it to you.',
        "The code wasn't sent."
      ),
    verifyStartOtp: async (id: string, otp: string) => {
      setBusy('verifyStart');
      try {
        await dutyAPI.verifyStartOtp(id, otp);
        snack("You're on duty. The hospital has been told.", { tone: 'success' });
        await refreshDuties();
        onChange?.();
        return { ok: true as const };
      } catch (e) {
        return { ok: false as const, message: dutyErrorMessage(e, "That code didn't work.") };
      } finally {
        setBusy(null);
      }
    },
    requestEndOtp: (id: string) =>
      run('endOtp', () => dutyAPI.requestEndOtp(id), 'Your end code was sent to your phone by SMS. Read it to the duty desk.', "The end code wasn't sent."),
    resendOtp: (id: string, type: 'start' | 'end') =>
      run('resend', () => dutyAPI.resendOtp(id, type), type === 'start' ? 'A new code was sent to the duty desk.' : 'A new end code was sent to your phone.', "The code wasn't resent."),
    cancel: (id: string, reason: string, reasonText?: string) =>
      run('cancel', () => autoRelistAPI.cancelAsStaff(id, reason, reasonText), 'Duty cancelled. The hospital has been told.', "The duty wasn't cancelled."),
  };
}

import { createContext, ReactNode, useCallback, useContext, useEffect, useMemo, useRef, useState } from 'react';
import { AppState } from 'react-native';
import { documentAPI, dutyAPI, profileAPI } from '@/service/api';
import { snack } from '@/ds/Snackbar';
import { useDashboardLocationTracking } from '@/hooks/useDashboardLocationTracking';
import { useLocationTracker } from '@/hooks/useLocationTracker';
import { askLocation, locationExplained, locationPermission, PermissionState } from './permissions';
import { Duty, toDuty } from './duty';
import { apiMessage } from './format';
import { summarize, VerifySummary } from './verification';

export type Verification = 'pending' | 'verified' | 'rejected' | null;

export type DoctorProfile = {
  id?: string;
  fullName?: string;
  // "YYYY-MM-DD" or null; only in the doctor's own profile
  dateOfBirth?: string | null;
  isPhoneVerified?: boolean;
  // only when the profile is rejected
  rejectionReason?: string | null;
  verifiedAt?: string | null;
  profilePicture?: string | null;
  jobRole?: string;
  currentAddress?: string;
  city?: string;
  state?: string;
  pincode?: string;
  phoneNumber?: string;
  email?: string;
  profileSummary?: string;
  education?: { universityName: string; speciality: string; startYear: number; endYear: number }[];
  skills?: string[];
  experience?: string;
  isAvailable?: boolean;
  isProfileComplete?: boolean;
  isDocumentsUploaded?: boolean;
  verificationStatus?: 'pending' | 'verified' | 'rejected';
  profileCompletion?: number;
  verifiedDocs?: number;
  averageRating?: number;
  totalRatings?: number;
  effectiveRating?: number | null;
  ratingBreakdown?: any;
  location?: { latitude?: number; longitude?: number };
  createdAt?: string;
};

type DutyBuckets = {
  offers: Duty[];
  upcoming: Duty[];
  active: Duty[];
  loaded: boolean;
  offersError: string | null;
  mineError: string | null;
  // availability is off, so the server refuses the live lists
  offersBlocked: boolean;
};

type Ctx = {
  profile: DoctorProfile | null;
  user: { name?: string; email?: string } | null;
  profileLoaded: boolean;
  profileError: string | null;
  verification: Verification;
  available: boolean;
  togglingAvailability: boolean;
  setAvailable: (v: boolean) => Promise<boolean>;
  refreshProfile: () => Promise<void>;
  duties: DutyBuckets;
  refreshDuties: () => Promise<void>;
  /** The duty that needs the doctor now: on duty, on the way, waiting, or the next accepted one. */
  current: Duty | null;
  location: PermissionState | 'unknown';
  /** Shows the system prompt (after our explainer) and starts sharing position while the app is open. */
  requestLocation: () => Promise<PermissionState>;
  /** Sends the current position to the server now (the start code checks it). */
  shareLocationNow: () => Promise<void>;
  /** Documents and review status until the doctor is verified. */
  verify: VerifySummary;
  refreshVerify: () => Promise<void>;
};

const DoctorContext = createContext<Ctx | null>(null);

const EMPTY: DutyBuckets = { offers: [], upcoming: [], active: [], loaded: false, offersError: null, mineError: null, offersBlocked: false };

const isAvailabilityBlock = (err: any) => err?.response?.status === 403 && /availability/i.test(err?.response?.data?.message ?? '');

const byStart = (a: Duty, b: Duty) => (a.start?.getTime() ?? 0) - (b.start?.getTime() ?? 0);

export function DoctorProvider({ children }: { children: ReactNode }) {
  const [profile, setProfile] = useState<DoctorProfile | null>(null);
  const [user, setUser] = useState<Ctx['user']>(null);
  const [profileLoaded, setProfileLoaded] = useState(false);
  const [profileError, setProfileError] = useState<string | null>(null);
  const [available, setAvail] = useState(false);
  const [toggling, setToggling] = useState(false);
  const [duties, setDuties] = useState<DutyBuckets>(EMPTY);
  const inflight = useRef<Promise<void> | null>(null);
  const [location, setLocation] = useState<PermissionState | 'unknown'>('unknown');
  const [explained, setExplained] = useState(false);

  const refreshProfile = useCallback(async () => {
    try {
      const res = await profileAPI.getMyProfile();
      const p: DoctorProfile = res?.profile ?? {};
      setProfile(p);
      setUser(res?.user ?? null);
      setAvail(!!p?.isAvailable);
      setProfileError(null);
    } catch (e: any) {
      setProfileError(apiMessage(e, "Your profile didn't load."));
    } finally {
      setProfileLoaded(true);
    }
  }, []);

  const verification: Verification = profile?.verificationStatus ?? null;

  const [docs, setDocs] = useState<any[] | null>(null);
  const refreshVerify = useCallback(async () => {
    try {
      const r = await documentAPI.getDocuments();
      setDocs(Array.isArray(r?.documents) ? r.documents : []);
    } catch {
      setDocs((d) => d ?? []);
    }
  }, []);
  useEffect(() => {
    if (profileLoaded && profile?.id && verification !== 'verified') refreshVerify();
  }, [profileLoaded, profile?.id, verification, refreshVerify]);
  const verify = useMemo(() => summarize(docs, verification), [docs, verification]);

  const refreshDuties = useCallback(async () => {
    if (inflight.current) return inflight.current;
    const run = (async () => {
      const verified = verification === 'verified';
      if (!verified) {
        setDuties({ ...EMPTY, loaded: true });
        return;
      }
      const [offersR, upcomingR, ongoingR] = await Promise.allSettled([
        available ? dutyAPI.getAvailableDuties() : Promise.reject({ skipped: true }),
        dutyAPI.getMyUpcomingDuties(),
        dutyAPI.getOngoingDuties(),
      ]);

      let offers: Duty[] = [];
      let offersError: string | null = null;
      let offersBlocked = !available;
      if (offersR.status === 'fulfilled') {
        offers = (offersR.value?.jobs ?? []).map(toDuty);
      } else if (!(offersR.reason as any)?.skipped) {
        if (isAvailabilityBlock(offersR.reason)) offersBlocked = true;
        else offersError = apiMessage(offersR.reason, "Duties didn't load.");
      }

      let mine: Duty[] = [];
      let mineError: string | null = null;
      if (upcomingR.status === 'fulfilled' || ongoingR.status === 'fulfilled') {
        const up = upcomingR.status === 'fulfilled' ? upcomingR.value?.data ?? [] : [];
        const on = ongoingR.status === 'fulfilled' ? ongoingR.value?.data ?? [] : [];
        const seen = new Set<string>();
        for (const j of [...on, ...up]) {
          const d = toDuty(j);
          if (!d.id || seen.has(d.id)) continue;
          seen.add(d.id);
          mine.push(d);
        }
      }
      // availability only stops new offers; accepted and ongoing duties always load (server rule since 9 Oct)
      if (upcomingR.status === 'rejected' && ongoingR.status === 'rejected') {
        mineError = apiMessage(upcomingR.reason, "Your duties didn't load.");
      }

      setDuties({
        offers,
        upcoming: mine.filter((d) => d.status === 'assigned').sort(byStart),
        active: mine.filter((d) => ['enroute', 'in-progress', 'pending-confirmation'].includes(d.status)).sort(byStart),
        loaded: true,
        offersError,
        mineError,
        offersBlocked,
      });
    })();
    inflight.current = run;
    try {
      await run;
    } finally {
      inflight.current = null;
    }
  }, [available, verification]);

  const setAvailable = useCallback(
    async (v: boolean) => {
      setAvail(v);
      setToggling(true);
      try {
        await profileAPI.toggleMedicalStaffAvailability(v);
        setProfile((p) => (p ? { ...p, isAvailable: v } : p));
        snack(v ? "You're available. New duty offers will reach you." : "You're off. You won't get new offers until you turn this back on.", {
          tone: v ? 'success' : 'default',
        });
        return true;
      } catch (e) {
        setAvail(!v);
        snack(apiMessage(e, "Availability didn't change. Try again."), { tone: 'error' });
        return false;
      } finally {
        setToggling(false);
      }
    },
    []
  );

  useEffect(() => {
    refreshProfile();
    (async () => {
      const [perm, seen] = await Promise.all([locationPermission(), locationExplained()]);
      setLocation(perm);
      setExplained(seen || perm === 'granted');
    })();
  }, [refreshProfile]);

  const requestLocation = useCallback(async () => {
    const r = await askLocation();
    setLocation(r);
    setExplained(true);
    return r;
  }, []);

  // Position is shared only while the app is open, and only once the doctor has seen why.
  const { requestAndSendLocation } = useDashboardLocationTracking({ enabled: explained && location !== 'denied' });

  useEffect(() => {
    if (profileLoaded) refreshDuties();
  }, [profileLoaded, available, verification, refreshDuties]);

  // Fresh lists when the app comes back to the foreground, and every 60 s while a duty is live
  useEffect(() => {
    const sub = AppState.addEventListener('change', (s) => {
      if (s === 'active') refreshDuties();
    });
    return () => sub.remove();
  }, [refreshDuties]);

  const live = duties.active.length > 0;
  useEffect(() => {
    if (!live) return;
    const id = setInterval(() => refreshDuties(), 60000);
    return () => clearInterval(id);
  }, [live, refreshDuties]);

  const current = useMemo<Duty | null>(() => {
    const order = ['in-progress', 'enroute', 'pending-confirmation'];
    for (const s of order) {
      const d = duties.active.find((x) => x.status === s);
      if (d) return d;
    }
    const next = duties.upcoming[0];
    if (next?.start && next.start.getTime() - Date.now() < 24 * 60 * 60 * 1000) return next;
    return null;
  }, [duties]);

  const tracked = duties.active.find((d) => d.status === 'enroute' || d.status === 'in-progress') ?? null;
  useLocationTracker({
    dutyId: tracked?.id ?? '',
    staffId: tracked?.assignedToId ?? '',
    hospitalId: tracked?.hospitalUserId ?? '',
    active: !!tracked,
  });

  const value: Ctx = {
    profile,
    user,
    profileLoaded,
    profileError,
    verification,
    available,
    togglingAvailability: toggling,
    setAvailable,
    refreshProfile,
    duties,
    refreshDuties,
    current,
    location,
    requestLocation,
    shareLocationNow: async () => {
      await requestAndSendLocation();
    },
    verify,
    refreshVerify: async () => {
      await Promise.all([refreshVerify(), refreshProfile()]);
    },
  };

  return <DoctorContext.Provider value={value}>{children}</DoctorContext.Provider>;
}

export function useDoctor() {
  const ctx = useContext(DoctorContext);
  if (!ctx) throw new Error('useDoctor must be used inside DoctorProvider');
  return ctx;
}

/** For screens outside the doctor shell that may or may not have the provider. */
export const useDoctorMaybe = () => useContext(DoctorContext);

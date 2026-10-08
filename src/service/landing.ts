import AsyncStorage from '@react-native-async-storage/async-storage';
import { Platform } from 'react-native';
import { adminLandingRoute } from '@/constant/adminCapabilities';
import { profileAPI } from './api';

// Where a signed-in user goes. One place for the app start, sign-in and email verification.

export async function storeSession(token: string, user: unknown) {
  if (Platform.OS === 'web') {
    localStorage.setItem('hospilink_token', token);
    localStorage.setItem('hospilink_user', JSON.stringify(user));
  } else {
    await AsyncStorage.multiSet([
      ['hospilink_token', token],
      ['hospilink_user', JSON.stringify(user)],
    ]);
  }
}

export type Landing = string | { pathname: string; params?: Record<string, string> };

export async function resolveLanding(user: { role?: string; email?: string; name?: string; isEmailVerified?: boolean; adminSubRole?: any }): Promise<Landing> {
  const role = user?.role;
  if (role === 'admin') return adminLandingRoute(user.adminSubRole);

  if (!user?.isEmailVerified) {
    return { pathname: '/auth/verify-otp', params: { email: user?.email ?? '', accountType: role === 'staff' ? 'medical' : 'hospital' } };
  }

  let hasProfile = false;
  let docsDone = false;
  let name = user?.name ?? '';
  let email = user?.email ?? '';
  try {
    const r = await profileAPI.getMyProfile();
    hasProfile = !!r?.profile?.id;
    docsDone = r?.isDocumentsUploaded ?? r?.profile?.isDocumentsUploaded ?? false;
    name = r?.profile?.fullName ?? r?.user?.name ?? name;
    email = r?.profile?.email ?? r?.user?.email ?? email;
    if (role === 'hospital') {
      const complete = r?.isProfileComplete ?? r?.profile?.isProfileComplete ?? false;
      if (!complete) return { pathname: '/profile/hospital', params: { prefillName: name, prefillEmail: email } };
      if (!docsDone) return '/profile/upload-document';
      return '/hospital/dashboard';
    }
  } catch {
    if (role === 'hospital') return { pathname: '/profile/hospital', params: { prefillName: name, prefillEmail: email } };
  }

  // Doctors: no profile yet -> the wizard; otherwise straight to Home.
  // Home's checklist card shows what's left (documents, review), so a returning doctor is never stuck behind a step.
  if (!hasProfile) return { pathname: '/profile/medical-staff', params: { prefillName: name, prefillEmail: email } };
  return '/medicalStaff/dashboard';
}

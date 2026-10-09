import { Platform } from 'react-native';

// Where a signed-out visitor starts. One rule for every platform:
// - web with EXPO_PUBLIC_MARKETING_URL set (the web build sets "/"): the public site built from /marketing;
// - otherwise (the apps, local development): the app's own start, role choice.
// To see the site in local development, run it (`npm run dev` in /marketing) and start the app with
// EXPO_PUBLIC_MARKETING_URL=http://localhost:4321/.
export const MARKETING_URL = process.env.EXPO_PUBLIC_MARKETING_URL;

export const SIGNED_OUT_START = '/auth/role-choice';

/** Sends a signed-out web visitor to the marketing site. Returns true if it navigated away. */
export function openMarketingSite(): boolean {
  if (Platform.OS !== 'web' || !MARKETING_URL || typeof window === 'undefined') return false;
  window.location.replace(MARKETING_URL);
  return true;
}

/** Takes a signed-out visitor to where they start: the marketing site when there is one, else role choice. */
export function goToSignedOutStart(router: { replace: (href: any) => void }) {
  if (openMarketingSite()) return;
  router.replace(SIGNED_OUT_START);
}

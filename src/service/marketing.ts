import { Platform } from 'react-native';

// On the web the public site (built from /marketing) is served at the domain root. The web build sets
// EXPO_PUBLIC_MARKETING_URL (usually "/"); without it, as in local development and the apps,
// the in-app home page is used.
export const MARKETING_URL = process.env.EXPO_PUBLIC_MARKETING_URL;

/** Sends a signed-out web visitor to the marketing site. Returns true if it navigated away. */
export function openMarketingSite(): boolean {
  if (Platform.OS !== 'web' || !MARKETING_URL || typeof window === 'undefined') return false;
  window.location.replace(MARKETING_URL);
  return true;
}

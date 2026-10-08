import AsyncStorage from '@react-native-async-storage/async-storage';
import * as Location from 'expo-location';
import { Platform } from 'react-native';

// The doctor sees why we ask for location (and notifications) before the system prompt.
const LOCATION_KEY = 'hl_location_explained';
const NOTIFY_KEY = 'hl_notify_explained';

const read = async (k: string) => {
  try {
    return Platform.OS === 'web' ? localStorage.getItem(k) : await AsyncStorage.getItem(k);
  } catch {
    return null;
  }
};
const write = async (k: string, v: string) => {
  try {
    if (Platform.OS === 'web') localStorage.setItem(k, v);
    else await AsyncStorage.setItem(k, v);
  } catch {
    // a missing flag only means the explainer shows again
  }
};

export type PermissionState = 'granted' | 'denied' | 'undetermined';

export async function locationPermission(): Promise<PermissionState> {
  try {
    if (Platform.OS === 'web') {
      const p = await (navigator as any).permissions?.query({ name: 'geolocation' });
      if (p?.state === 'granted') return 'granted';
      if (p?.state === 'denied') return 'denied';
      return 'undetermined';
    }
    const { status } = await Location.getForegroundPermissionsAsync();
    return status === 'granted' ? 'granted' : status === 'denied' ? 'denied' : 'undetermined';
  } catch {
    return 'undetermined';
  }
}

export const locationExplained = async () => (await read(LOCATION_KEY)) === '1';
export const markLocationExplained = () => write(LOCATION_KEY, '1');
export const notifyExplained = async () => (await read(NOTIFY_KEY)) === '1';
export const markNotifyExplained = () => write(NOTIFY_KEY, '1');

/** Ask for foreground location. Returns the result; never throws. */
export async function askLocation(): Promise<PermissionState> {
  await markLocationExplained();
  try {
    if (Platform.OS === 'web') {
      return await new Promise((resolve) => {
        if (!navigator.geolocation) return resolve('denied');
        navigator.geolocation.getCurrentPosition(
          () => resolve('granted'),
          () => resolve('denied'),
          { timeout: 15000 }
        );
      });
    }
    const { status } = await Location.requestForegroundPermissionsAsync();
    return status === 'granted' ? 'granted' : 'denied';
  } catch {
    return 'denied';
  }
}

/** Current position, or null. */
export async function currentPosition(): Promise<{ latitude: number; longitude: number } | null> {
  try {
    if (Platform.OS === 'web') {
      return await new Promise((resolve) => {
        if (!navigator.geolocation) return resolve(null);
        navigator.geolocation.getCurrentPosition(
          (p) => resolve({ latitude: p.coords.latitude, longitude: p.coords.longitude }),
          () => resolve(null),
          { enableHighAccuracy: true, timeout: 15000, maximumAge: 10000 }
        );
      });
    }
    const p = await Location.getCurrentPositionAsync({ accuracy: Location.Accuracy.High });
    return { latitude: p.coords.latitude, longitude: p.coords.longitude };
  } catch {
    return null;
  }
}

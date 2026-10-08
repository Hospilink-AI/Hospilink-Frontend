import { useEffect, useRef } from 'react';
import { Platform } from 'react-native';

// Half-filled forms survive leaving the screen (another tab, the map, a call) for the rest of the session.
// On web they also survive a page refresh (sessionStorage); nothing is kept after the browser tab closes.
const drafts = new Map<string, Record<string, any>>();
const PREFIX = 'hl-draft:';

const session = (): Storage | null => {
  try {
    return Platform.OS === 'web' && typeof sessionStorage !== 'undefined' ? sessionStorage : null;
  } catch {
    return null;
  }
};

export function readDraft<T extends Record<string, any>>(key: string): Partial<T> | null {
  if (drafts.has(key)) return drafts.get(key) as Partial<T>;
  try {
    const raw = session()?.getItem(PREFIX + key);
    return raw ? (JSON.parse(raw) as Partial<T>) : null;
  } catch {
    return null;
  }
}

export function clearDraft(key: string) {
  drafts.delete(key);
  try {
    session()?.removeItem(PREFIX + key);
  } catch {}
}

/** Saves `values` under `key` whenever they change (skipped while `enabled` is false, e.g. in edit mode). */
export function useDraft(key: string, values: Record<string, any>, enabled = true) {
  const first = useRef(true);
  const json = JSON.stringify(values);
  useEffect(() => {
    if (!enabled) return;
    if (first.current) {
      first.current = false;
      return;
    }
    drafts.set(key, JSON.parse(json));
    try {
      session()?.setItem(PREFIX + key, json);
    } catch {}
  }, [key, json, enabled]);
}

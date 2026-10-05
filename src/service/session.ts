// Small app-wide signals: a one-line message banner that survives navigation, and "the server ended this session".

export type FlashTone = "info" | "success" | "warning";
type Flash = { text: string; tone: FlashTone };

let pending: Flash | null = null;
const flashListeners = new Set<(f: Flash) => void>();

// Show a banner on the next screen (or now, if one is listening)
export function flash(text: string, tone: FlashTone = "info") {
  const f = { text, tone };
  if (flashListeners.size) flashListeners.forEach((l) => l(f));
  else pending = f;
}

export function onFlash(listener: (f: Flash) => void) {
  flashListeners.add(listener);
  if (pending) {
    listener(pending);
    pending = null;
  }
  return () => {
    flashListeners.delete(listener);
  };
}

const endListeners = new Set<(message: string | null) => void>();

// The API said this session is over (account scheduled for deletion, user gone, token rejected)
export function endSession(message: string | null = null) {
  endListeners.forEach((l) => l(message));
}

export function onSessionEnded(listener: (message: string | null) => void) {
  endListeners.add(listener);
  return () => {
    endListeners.delete(listener);
  };
}

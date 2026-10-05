// Fires after a block or unblock so open lists (duty feed, map, invite picker) can reload.
const listeners = new Set<() => void>();

export function emitBlockChange() {
  listeners.forEach((l) => l());
}

export function onBlockChange(listener: () => void) {
  listeners.add(listener);
  return () => {
    listeners.delete(listener);
  };
}

import { InviteCard } from "@/constant/dutyInvites";

// Doctors picked on the map, handed to the duty form it opens. Read once, then cleared.
let pending: { role?: string; cards: InviteCard[] } | null = null;

export function setPendingInvites(cards: InviteCard[], role?: string) {
  pending = cards.length ? { role, cards } : null;
}

export function takePendingInvites(): { role?: string; cards: InviteCard[] } | null {
  const p = pending;
  pending = null;
  return p;
}

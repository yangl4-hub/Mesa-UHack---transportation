import type { ParkingSession } from './types';
export function timerEvent(session: ParkingSession, now: number): 'expired' | 'reminder' | null {
  const remaining = session.expiresAt - now;
  if (remaining <= 0) return session.expiredNotified ? null : 'expired';
  if (remaining <= 900000 && !session.warned) return 'reminder';
  return null;
}

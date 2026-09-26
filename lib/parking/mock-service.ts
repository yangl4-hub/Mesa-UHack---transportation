import type { ParkingAlert, ParkingLot, ParkingSession, SessionInput, Snapshot } from './types';

const lotConfig = [
  { id: 'C', name: 'West campus', zone: 'Near Building 1', walk: 5, open: 18 },
  { id: 'F', name: 'Automotive & upper campus', zone: 'Near Buildings 9–11', walk: 3, open: 7 },
  { id: 'G', name: 'Business & language arts', zone: 'Near Building 8', walk: 2, open: 24 },
  { id: 'L', name: 'East campus', zone: 'Near Building 14', walk: 5, open: 12 },
  { id: 'M', name: 'Library & main campus', zone: 'Near Buildings 4 & 5', walk: 2, open: 9 },
  { id: 'P', name: 'Athletics & grass field', zone: 'Near athletic fields', walk: 5, open: 0 },
];

export function getSnapshot(now = Date.now()): Snapshot {
  const phase = Math.floor(now / 30000) % 6;
  const lots: ParkingLot[] = lotConfig.map((lot, index) => ({
    id: lot.id, name: lot.name, zone: lot.zone, walk: lot.walk,
    spaces: Array.from({ length: 40 }, (_, i) => ({ id: String(i + 1).padStart(2, '0'), occupied: ((i * 13 + index * 7 + phase) % 40) >= lot.open })),
  }));
  return { lots, updatedAt: now, source: 'simulation' };
}

export function validateLocation(lotId: unknown, spaceId: unknown) {
  if (typeof lotId !== 'string' || !lotConfig.some(lot => lot.id === lotId)) throw new Error('Choose a valid parking lot.');
  if (typeof spaceId !== 'string' || !/^\d{2}$/.test(spaceId) || Number(spaceId) < 1 || Number(spaceId) > 40) throw new Error('Choose a space from 01 to 40.');
  return { lotId, spaceId };
}

export function createSession(raw: unknown, now = Date.now()): ParkingSession {
  if (!raw || typeof raw !== 'object' || Array.isArray(raw)) throw new Error('Enter valid parking details.');
  const input = raw as SessionInput;
  const { lotId, spaceId } = validateLocation(input.lotId, input.spaceId);
  if (typeof input.durationMinutes !== 'number' || ![30, 60, 120, 180, 240].includes(input.durationMinutes)) throw new Error('Choose a parking duration between 30 minutes and 4 hours.');
  if (input.plate !== undefined && typeof input.plate !== 'string') throw new Error('Enter a valid license plate or leave it blank.');
  const plate = (input.plate ?? '').trim().toUpperCase();
  if (plate.length > 15 || (plate && !/^[A-Z0-9 -]+$/.test(plate))) throw new Error('Use up to 15 letters, numbers, spaces, or hyphens for your plate.');
  return { id: crypto.randomUUID(), plate, lotId, spaceId, startedAt: now, expiresAt: now + input.durationMinutes * 60000, durationMinutes: input.durationMinutes, warned: false, expiredNotified: false };
}

export function createSecurityEvent(kind: unknown, lotId: unknown, spaceId: unknown, now = Date.now()): ParkingAlert {
  const location = validateLocation(lotId, spaceId);
  if (kind !== 'impact' && kind !== 'activity') throw new Error('Choose an impact or activity simulation.');
  return { id: crypto.randomUUID(), ...location, time: now, read: false, kind, severity: kind === 'impact' ? 'high' : 'medium', title: kind === 'impact' ? 'Possible impact detected near your vehicle' : 'Unusual activity detected near your vehicle', detail: kind === 'impact' ? 'A simulated motion spike was detected beside the parked vehicle. Review the camera view.' : 'A simulated extended movement pattern was detected near the parking space. Review the camera view.' };
}

export function getInitialAlerts(now = Date.now()): ParkingAlert[] {
  return [{ ...createSecurityEvent('activity', 'F', '14', now - 4 * 60000), id: 'seed-activity' }, { ...createSecurityEvent('impact', 'M', '08', now - 12 * 60000), id: 'seed-impact' }];
}

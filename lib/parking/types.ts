export type Space = { id: string; occupied: boolean };
export type ParkingLot = { id: string; name: string; zone: string; walk: number; spaces: Space[] };
export type Severity = 'high' | 'medium' | 'info';
export type ParkingAlert = { id: string; title: string; detail: string; lotId: string; spaceId: string; time: number; severity: Severity; read: boolean; kind: 'impact' | 'activity' | 'timer' | 'session' };
export type ParkingSession = { id: string; plate: string; lotId: string; spaceId: string; startedAt: number; expiresAt: number; durationMinutes: number; warned: boolean; expiredNotified: boolean };
export type SessionInput = { plate?: string; lotId: string; spaceId: string; durationMinutes: number };
export type Snapshot = { lots: ParkingLot[]; updatedAt: number; source: 'simulation' };

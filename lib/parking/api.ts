import type { AssistantContext, AssistantReply } from './assistant';
import type { ParkingAlert, ParkingSession, SessionInput, Snapshot } from './types';

async function request<T>(path: string, body?: unknown): Promise<T> {
  const response = await fetch(`/api/${path}`, { method: body === undefined ? 'GET' : 'POST', headers: body === undefined ? undefined : { 'Content-Type': 'application/json' }, body: body === undefined ? undefined : JSON.stringify(body), cache: 'no-store' });
  const result = await response.json() as T & { error?: string };
  if (!response.ok) throw new Error(result.error || 'Something went wrong. Please try again.');
  return result as T;
}

export const parkingApi = {
  ask: (context: AssistantContext) => request<AssistantReply>('assistant', context),
  snapshot: () => request<Snapshot>('parking'),
  events: () => request<ParkingAlert[]>('events'),
  start: (input: SessionInput) => request<ParkingSession>('sessions', input),
  simulate: (kind: 'impact' | 'activity', lotId: string, spaceId: string) => request<ParkingAlert>('events', { kind, lotId, spaceId }),
};

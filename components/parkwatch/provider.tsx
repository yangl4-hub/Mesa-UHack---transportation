'use client';

import { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState } from 'react';
import { toast } from 'sonner';
import { parkingApi } from '@/lib/parking/api';
import { timerEvent } from '@/lib/parking/timer';
import type { ParkingAlert, ParkingSession, SessionInput, Snapshot } from '@/lib/parking/types';

const key = 'parkwatch-demo-v2';
type Context = { snapshot: Snapshot; session: ParkingSession | null; alerts: ParkingAlert[]; now: number; ready: boolean; error: string; pending: boolean; refresh: () => Promise<void>; start: (input: SessionInput) => Promise<void>; end: () => void; advance: () => void; simulate: (kind: 'impact' | 'activity', lotId?: string, spaceId?: string) => Promise<void>; markRead: (id?: string) => void; };
const ParkingContext = createContext<Context | null>(null);

export function ParkingProvider({ children, initial }: { children: React.ReactNode; initial: Snapshot }) {
  const [raw, setRaw] = useState(initial);
  const [session, setSession] = useState<ParkingSession | null>(null);
  const [alerts, setAlerts] = useState<ParkingAlert[]>([]);
  const [now, setNow] = useState(initial.updatedAt);
  const [ready, setReady] = useState(false);
  const [error, setError] = useState('');
  const [pending, setPending] = useState(false);
  const notified = useRef(new Set<string>());

  useEffect(() => {
    let cancelled = false;
    let savedAlerts = false;
    try {
      const data = JSON.parse(localStorage.getItem(key) || 'null');
      if (data?.session && Number.isFinite(data.session.expiresAt) && Number.isFinite(data.session.startedAt) && typeof data.session.plate === 'string' && initial.lots.some(lot => lot.id === data.session.lotId && lot.spaces.some(space => space.id === data.session.spaceId))) setSession(data.session);
      if (Array.isArray(data?.alerts) && data.alerts.every((item: ParkingAlert) => typeof item.id === 'string' && typeof item.title === 'string' && typeof item.lotId === 'string' && typeof item.spaceId === 'string' && Number.isFinite(item.time))) { setAlerts(data.alerts.slice(0, 50)); savedAlerts = true; }
    } catch { try { localStorage.removeItem(key); } catch {} }
    if (!savedAlerts) parkingApi.events().then(data => { if (!cancelled) setAlerts(data); }).catch(() => {});
    setReady(true);
    const timer = window.setInterval(() => setNow(Date.now()), 1000);
    return () => { cancelled = true; window.clearInterval(timer); };
  }, [initial]);

  useEffect(() => {
    if (!ready) return;
    try { localStorage.setItem(key, JSON.stringify({ session, alerts })); } catch { setError('Device storage is unavailable. Keep this page open to retain your parking timer.'); }
  }, [session, alerts, ready]);

  const refresh = useCallback(async () => {
    try { setRaw(await parkingApi.snapshot()); setError(''); }
    catch { setError('Unable to update parking. Showing the last available snapshot.'); }
  }, []);
  useEffect(() => { const interval = window.setInterval(refresh, 15000); return () => window.clearInterval(interval); }, [refresh]);

  const addAlert = useCallback((alert: ParkingAlert) => {
    setAlerts(old => [alert, ...old.filter(item => item.id !== alert.id)].slice(0, 50));
    toast(alert.title, { description: `Lot ${alert.lotId} · Space ${alert.spaceId} · Simulated alert`, duration: 7000 });
  }, []);
  useEffect(() => {
    if (!session || !ready) return;
    const event = timerEvent(session, now);
    const expired = event === 'expired';
    const needsAlert = event !== null;
    const alertId = `${session.id}-${expired ? 'expired' : 'reminder'}`;
    if (!needsAlert || notified.current.has(alertId)) return;
    notified.current.add(alertId);
    addAlert({ id: alertId, title: expired ? 'Your parking time has ended' : '15 minutes or less remaining', detail: expired ? 'Your demo timer has ended. Check your parking before leaving it longer.' : 'Time to head back or check whether you can stay longer.', lotId: session.lotId, spaceId: session.spaceId, time: now, severity: expired ? 'high' : 'medium', read: false, kind: 'timer' });
    setSession(old => old ? { ...old, warned: true, expiredNotified: expired || old.expiredNotified } : old);
  }, [now, session, ready, addAlert]);

  const start = useCallback(async (input: SessionInput) => {
    setPending(true);
    try { const result = await parkingApi.start(input); setSession(result); setNow(Date.now()); toast.success(`Timer started for Lot ${result.lotId}, space ${result.spaceId}`); }
    finally { setPending(false); }
  }, []);
  const end = useCallback(() => { setSession(null); toast.success('Parking session ended'); }, []);
  const advance = useCallback(() => {
    setSession(old => old ? { ...old, expiresAt: Date.now() + 15 * 60000, warned: false, expiredNotified: false } : old);
    if (session) notified.current.delete(`${session.id}-reminder`);
    setNow(Date.now());
  }, [session]);
  const simulate = useCallback(async (kind: 'impact' | 'activity', lotId?: string, spaceId?: string) => {
    setPending(true);
    try { addAlert(await parkingApi.simulate(kind, lotId || session?.lotId || 'L', spaceId || session?.spaceId || '12')); }
    catch (e) { toast.error(e instanceof Error ? e.message : 'Unable to simulate an event.'); }
    finally { setPending(false); }
  }, [session, addAlert]);
  const markRead = useCallback((id?: string) => setAlerts(old => old.map(alert => !id || alert.id === id ? { ...alert, read: true } : alert)), []);
  const snapshot = useMemo(() => ({ ...raw, lots: raw.lots.map(lot => ({ ...lot, spaces: lot.spaces.map(space => session?.lotId === lot.id && session.spaceId === space.id ? { ...space, occupied: true } : space) })) }), [raw, session]);
  return <ParkingContext.Provider value={{ snapshot, session, alerts, now, ready, error, pending, refresh, start, end, advance, simulate, markRead }}>{children}</ParkingContext.Provider>;
}

export function useParking() { const context = useContext(ParkingContext); if (!context) throw new Error('ParkingProvider is required'); return context; }

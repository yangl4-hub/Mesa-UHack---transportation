'use client';

import Link from 'next/link';
import { ArrowUpRight, CarFront, Check, Clock3, Footprints, MapPin } from 'lucide-react';
import { Progress } from '@/components/ui/progress';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import type { ParkingLot, ParkingSession } from '@/lib/parking/types';

export function available(lot: ParkingLot) { return lot.spaces.filter(space => !space.occupied).length; }
export function clock(ms: number) { const seconds = Math.max(0, Math.ceil(ms / 1000)); return [Math.floor(seconds / 3600), Math.floor(seconds % 3600 / 60), seconds % 60].map(value => String(value).padStart(2, '0')).join(':'); }
export function timeLabel(time: number) { return new Date(time).toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit', timeZone: 'America/Los_Angeles' }); }
export function PageHeading({ eyebrow, title, description, action }: { eyebrow: string; title: string; description: string; action?: React.ReactNode }) { return <div className="page-heading"><div><div className="eyebrow">{eyebrow}</div><h1>{title}</h1><p>{description}</p></div>{action}</div>; }
export function DemoBadge() { return <span className="badge neutral"><span className="live-dot" /> Simulation mode</span>; }
export function StatusBadge({ count }: { count: number }) { return <span className={`badge ${count === 0 ? 'red' : count < 10 ? 'amber' : 'green'}`}>{count === 0 ? 'Full' : count < 10 ? 'Filling up' : 'Available'}</span>; }

export function LotCard({ lot }: { lot: ParkingLot }) {
  const open = available(lot);
  return <Link href={`/lots?lot=${lot.id}`} className="lot-card"><div className="lot-card-top"><span className={`lot-code ${open === 0 ? 'full' : ''}`}>{lot.id}</span><StatusBadge count={open} /></div><h3>{lot.name}</h3><p className="lot-location"><MapPin size={13} />{lot.zone}<span>·</span><Footprints size={13} />{lot.walk} min est.</p><div className="lot-availability"><strong className={open ? '' : 'no-spaces'}>{open}<span> / {lot.spaces.length}</span></strong><span>spaces available</span></div><Progress value={open / lot.spaces.length * 100} aria-label={`${open} of ${lot.spaces.length} spaces available`} className="availability-progress" /><div className="lot-card-bottom"><span>{lot.spaces.length - open} occupied</span><span>View spaces <ArrowUpRight size={15} /></span></div></Link>;
}

export function Picker({ id, label, value, onChange, options, placeholder = 'Select', disabled = false }: { id: string; label: string; value: string; onChange: (value: string) => void; options: { value: string; label: string }[]; placeholder?: string; disabled?: boolean }) {
  return <div className="form-field"><label htmlFor={id}>{label}</label><Select value={value} onValueChange={onChange} disabled={disabled}><SelectTrigger id={id} className="pw-select" aria-label={label}><SelectValue placeholder={placeholder} /></SelectTrigger><SelectContent>{options.map(option => <SelectItem key={option.value} value={option.value}>{option.label}</SelectItem>)}</SelectContent></Select></div>;
}

export function Timer({ session, now, compact = false }: { session: ParkingSession; now: number; compact?: boolean }) {
  const remaining = Math.max(0, session.expiresAt - now);
  return <div className={`timer ${compact ? 'compact' : ''} ${remaining <= 900000 ? 'timer-warning' : ''}`}><span className="timer-caption"><Clock3 size={15} /> {remaining > 0 ? 'PARKING TIME REMAINING' : 'PARKING TIME ENDED'}</span><div className="timer-digits" role="timer" aria-label={`${clock(remaining)} remaining`}>{clock(remaining)}</div><div className="timer-location"><span><MapPin size={15} />Lot {session.lotId}</span><span>Space {session.spaceId}</span></div>{!compact && <><Progress className="timer-progress" value={Math.min(100, remaining / (session.durationMinutes * 60000) * 100)} aria-label="Parking time remaining" /><div className="timer-times"><span>Started {timeLabel(session.startedAt)}</span><span>Ends {timeLabel(session.expiresAt)} PT</span></div></>}</div>;
}

export function ParkingGrid({ lot, selected, onSelect, activeSpace }: { lot: ParkingLot; selected?: string; onSelect: (id: string) => void; activeSpace?: string }) {
  return <div className="parking-grid-wrap"><div className="parking-grid-heading"><span><span className="legend-dot green" /> Available</span><span><span className="legend-dot red" /> Occupied</span><span><span className="legend-dot blue" /> Your vehicle</span></div><div className="parking-grid" aria-label={`Lot ${lot.id} parking spaces`}>{[0, 1, 2, 3].map(row => <div key={row} className="parking-row-wrap"><div className="parking-row">{lot.spaces.slice(row * 10, row * 10 + 10).map(space => <button key={space.id} onClick={() => onSelect(space.id)} className={`space ${space.occupied ? 'occupied' : 'open'} ${space.id === selected ? 'selected' : ''} ${space.id === activeSpace ? 'mine' : ''}`} aria-label={`Space ${space.id}, ${space.id === activeSpace ? 'your vehicle' : space.occupied ? 'occupied' : 'available'}`} aria-pressed={space.id === selected}><span>{space.id === activeSpace ? <CarFront size={23} /> : space.occupied ? <CarFront size={23} /> : <Check size={19} />}</span><b>{space.id}</b></button>)}</div>{row === 0 || row === 2 ? <div className="driving-lane"><span>ONE WAY</span><span>→</span><span>→</span></div> : row === 1 ? <div className="parking-median" /> : null}</div>)}</div><div className="parking-grid-foot"><span>↑ ENTRANCE</span><span>Lot {lot.id} · 40 spaces</span><span>EXIT ↑</span></div></div>;
}

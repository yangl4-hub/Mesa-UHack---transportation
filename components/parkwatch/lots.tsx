'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { useSearchParams, useRouter } from 'next/navigation';
import { ArrowRight, Camera, CarFront, Footprints, MapPin } from 'lucide-react';
import { useParking } from './provider';
import { available, DemoBadge, PageHeading, ParkingGrid, StatusBadge } from './shared';

export function Lots() {
  const { snapshot, session } = useParking();
  const query = useSearchParams();
  const router = useRouter();
  const [selected, setSelected] = useState<string>(query.get('space') || '');
  const lot = snapshot.lots.find(item => item.id === query.get('lot')) || snapshot.lots[3];
  useEffect(() => { setSelected(query.get('space') || ''); }, [query]);
  const open = available(lot);
  const space = lot.spaces.find(item => item.id === selected);
  return <><PageHeading eyebrow="LESS SEARCHING. MORE SPACE." title="Parking lots" description="Choose a lot, then take a closer look at every space." action={<DemoBadge />} /><div className="lot-tabs" aria-label="Choose a parking lot">{snapshot.lots.map(item => <button key={item.id} className={`lot-tab ${lot.id === item.id ? 'active' : ''}`} onClick={() => { router.replace(`/lots?lot=${item.id}`); setSelected(''); }} aria-pressed={lot.id === item.id}><strong>Lot {item.id}</strong><span className={available(item) === 0 ? 'red-text' : ''}>{available(item)} open</span></button>)}</div><div className="lot-detail-layout"><section className="panel lot-detail"><div className="panel-heading"><div className="lot-title"><span className="lot-code large">{lot.id}</span><div><h2>{lot.name}</h2><p><MapPin size={14} />{lot.zone}<span>·</span><Footprints size={14} />{lot.walk} min walk</p></div></div><StatusBadge count={open} /></div><div className="lot-summary"><div><strong className="green-text">{open}</strong><span>Available</span></div><div><strong className="red-text">{lot.spaces.length - open}</strong><span>Occupied</span></div><div><strong>{lot.spaces.length}</strong><span>Total spaces</span></div></div><ParkingGrid lot={lot} selected={selected} onSelect={setSelected} activeSpace={session?.lotId === lot.id ? session.spaceId : undefined} /><div className="grid-hint">Select a space for details. Availability is simulated and can change.</div></section><aside><section className="panel space-detail"><div className="detail-icon"><CarFront size={29} /></div><span className="eyebrow">{space ? 'SPACE DETAILS' : 'MAKE IT YOUR SPOT'}</span><h2>{space ? `Lot ${lot.id} · Space ${space.id}` : 'Find your space'}</h2><p>{space ? space.occupied ? 'This space is currently occupied in the simulation.' : 'This space is currently available. Start your timer once you’ve parked.' : 'Choose a green space in the grid to see its details and start a parking timer.'}</p>{space && <StatusBadge count={space.occupied ? 0 : 20} />}{space && (!space.occupied || session?.lotId === lot.id && session.spaceId === space.id) && <Link href={`/vehicle?lot=${lot.id}&space=${space.id}`} className="btn primary full-width">{session ? 'View my parking' : 'I’m parked here'}<ArrowRight size={17} /></Link>}<Link href={`/camera?lot=${lot.id}`} className="btn secondary full-width"><Camera size={17} />View AI camera</Link></section><div className="info-note"><MapPin size={18} /><p>Already in an occupied space? Register your own spot in <Link href={`/vehicle?lot=${lot.id}`}>My Vehicle</Link>.</p></div></aside></div></>;
}

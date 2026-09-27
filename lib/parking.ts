import data from './lots.json';
export type Status='open'|'occupied'|'unknown';
export type Spot={id:string;x:number;y:number;w:number;h:number;status:Status;score?:number;label?:'open'|'occupied'};
export type Lot={id:string;name:string;area:string;image:string;source:string;updatedAt:string|null;spots:Spot[]};
export type Sample={features:number[];status:'open'|'occupied'};
export const initialLots=data as Lot[];
export function counts(lot:Lot){return {total:lot.spots.length,open:lot.spots.filter(s=>s.status==='open').length,occupied:lot.spots.filter(s=>s.status==='occupied').length,unknown:lot.spots.filter(s=>s.status==='unknown').length}}
export function extractFeatures(pixels:Uint8ClampedArray|number[]){
 const gray:number[]=[];let sat=0,bright=0,dark=0;
 for(let i=0;i<pixels.length;i+=4){const r=pixels[i]/255,g=pixels[i+1]/255,b=pixels[i+2]/255; const v=(r+g+b)/3;gray.push(v);sat+=Math.max(r,g,b)-Math.min(r,g,b);bright+=+(v>.7);dark+=+(v<.23)}
 const mean=gray.reduce((a,b)=>a+b,0)/256;const sd=Math.sqrt(gray.reduce((a,b)=>a+(b-mean)**2,0)/256);let edge=0;
 for(let y=0;y<16;y++)for(let x=0;x<15;x++)edge+=Math.abs(gray[y*16+x]-gray[y*16+x+1]);
 return [mean,sd,sat/256,bright/256,dark/256,edge/240];
}
export function classify(features:number[],samples:Sample[]){
 const dims=features.length, means=Array.from({length:dims},(_,j)=>samples.reduce((a,s)=>a+s.features[j],0)/samples.length);
 const scales=means.map((m,j)=>Math.max(.035,Math.sqrt(samples.reduce((a,s)=>a+(s.features[j]-m)**2,0)/samples.length)));
 const nearest=samples.map(s=>({status:s.status,d:Math.sqrt(features.reduce((a,v,j)=>a+((v-s.features[j])/scales[j])**2,0))})).sort((a,b)=>a.d-b.d).slice(0,5);
 const weights=nearest.map(s=>1/(s.d+.12));const total=weights.reduce((a,b)=>a+b,0);const occupied=nearest.reduce((a,s,i)=>a+(s.status==='occupied'?weights[i]:0),0)/total;
 const score=Math.max(occupied,1-occupied);return {status:(score<.72?'unknown':occupied>.5?'occupied':'open') as Status,score};
}
export function recommend(lots:Lot[],query:string){
 const match=query.match(/(?:lot\s+)([efgmnr])\b/i);const candidates=match?lots.filter(l=>l.id===match[1].toUpperCase()):lots;
 const ranked=candidates.map(l=>({lot:l,...counts(l)})).sort((a,b)=>b.open-a.open);
 const best=ranked[0];if(!best||!best.open)return {text:'There are no known open spaces in the selected lots. Try another lot, or analyze a more recent image.',lotId:null};
 const spot=best.lot.spots.find(s=>s.status==='open')!;
 return {text:`Try ${best.lot.name} (${best.lot.area}). It has ${best.open} open spaces out of ${best.total} mapped spaces. ${spot.id} is one option. ${best.lot.source==='demo'?'These are simulated demo counts.':'These are estimates from a still image, not live availability; '+best.unknown+' spaces need review.'} Check signs and permit rules when you arrive.`,lotId:best.lot.id,spotId:spot.id};
}

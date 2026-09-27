import {initialLots} from '@/lib/parking';
export async function GET(){return Response.json({lots:initialLots,mode:'demo',note:'Approximate calibration templates; not verified total capacity.'})}

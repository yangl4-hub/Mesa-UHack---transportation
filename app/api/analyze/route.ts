import {classify,type Sample} from '@/lib/parking';
export async function POST(request:Request){
 try{
 const body:any=await request.json();const {spots,samples}=body;
 const valid=(f:unknown)=>Array.isArray(f)&&f.length===6&&f.every(n=>typeof n==='number'&&Number.isFinite(n)&&n>=0&&n<=1);
 if(!Array.isArray(spots)||spots.length>1000||!spots.length||!Array.isArray(samples)||samples.length>2000||samples.length<4||!samples.every((s:Sample)=>['open','occupied'].includes(s.status)&&valid(s.features))||!['open','occupied'].every(c=>samples.some((s:Sample)=>s.status===c))||!spots.every(s=>typeof s.id==='string'&&valid(s.features)))return Response.json({error:'Provide mapped spaces and labeled examples of both classes.'},{status:400});
 if(process.env.PARKWATCH_VISION_URL){try{const response=await fetch(process.env.PARKWATCH_VISION_URL.replace(/\/$/,'')+'/api/analyze',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify(body),signal:AbortSignal.timeout(15000)});return new Response(await response.text(),{status:response.status,headers:{'Content-Type':'application/json'}})}catch{return Response.json({error:'Python vision service is unavailable. Start it or unset PARKWATCH_VISION_URL.'},{status:502})}}
 const results=spots.map(s=>({id:s.id,...classify(s.features,samples)}));
 return Response.json({spots:results,model:'5-neighbor visual baseline',updatedAt:new Date().toISOString(),note:'Unvalidated estimates for calibrated spaces only. Neighbor agreement is not calibrated confidence.'});
 }catch{return Response.json({error:'Invalid analysis request.'},{status:400})}
}

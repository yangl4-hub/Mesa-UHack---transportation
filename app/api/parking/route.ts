import { getSnapshot } from '@/lib/parking/mock-service';
export function GET() { return Response.json(getSnapshot(), { headers: { 'Cache-Control': 'no-store' } }); }

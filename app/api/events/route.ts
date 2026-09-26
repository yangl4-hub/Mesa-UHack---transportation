import { createSecurityEvent, getInitialAlerts } from '@/lib/parking/mock-service';
export function GET() { return Response.json(getInitialAlerts(), { headers: { 'Cache-Control': 'no-store' } }); }
export async function POST(request: Request) {
  try {
    const input = await request.json();
    if (!input || typeof input !== 'object' || Array.isArray(input)) throw new Error('Choose a simulation.');
    const record = input as Record<string, unknown>;
    return Response.json(createSecurityEvent(record.kind, record.lotId, record.spaceId), { status: 201 });
  } catch (error) { return Response.json({ error: error instanceof Error ? error.message : 'Invalid simulation.' }, { status: 400 }); }
}

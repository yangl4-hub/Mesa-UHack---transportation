import { createSession } from '@/lib/parking/mock-service';
export async function POST(request: Request) {
  try {
    const input = await request.json();
    if (!input || typeof input !== 'object' || Array.isArray(input)) throw new Error('Enter valid parking details.');
    return Response.json(createSession(input), { status: 201, headers: { 'Cache-Control': 'no-store' } });
  } catch (error) { return Response.json({ error: error instanceof Error ? error.message : 'Invalid parking details.' }, { status: 400 }); }
}

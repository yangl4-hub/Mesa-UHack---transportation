import { answerQuestion } from '@/lib/parking/assistant';
import { getSnapshot, validateLocation } from '@/lib/parking/mock-service';
export async function POST(request: Request) {
  try {
    const raw = await request.json();
    if (!raw || typeof raw !== 'object' || Array.isArray(raw)) throw new Error('Enter a parking question.');
    const input = raw as Record<string, unknown>;
    if (typeof input.question !== 'string' || !input.question.trim() || input.question.length > 500) throw new Error('Ask a parking question in 500 characters or fewer.');
    let session;
    if (input.session && typeof input.session === 'object') {
      const data = input.session as Record<string, unknown>;
      const location = validateLocation(data.lotId, data.spaceId);
      if (typeof data.expiresAt !== 'number' || !Number.isFinite(data.expiresAt)) throw new Error('Invalid timer.');
      session = { ...location, expiresAt: data.expiresAt };
    }
    const stamp = typeof input.snapshotAt === 'number' && Math.abs(Date.now() - input.snapshotAt) < 120000 ? input.snapshotAt : Date.now();
    return Response.json(answerQuestion(input.question, getSnapshot(stamp), session), { headers: { 'Cache-Control': 'no-store' } });
  } catch (error) { return Response.json({ error: error instanceof Error ? error.message : 'Unable to answer your question.' }, { status: 400 }); }
}

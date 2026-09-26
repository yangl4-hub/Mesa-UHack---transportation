import type { ParkingSession, Snapshot } from './types';

export type AssistantReply = { text: string; recommendation?: { lotId: string; spaceId: string; minutes: number; building: string; open: number }; link?: string; label?: string };
export type AssistantContext = { question: string; snapshotAt: number; session?: Pick<ParkingSession, 'lotId' | 'spaceId' | 'expiresAt'> | null };

export const buildings: Record<string, { name: string; walks: Record<string, number> }> = {
  '1': { name: 'Social Science & Creative Arts', walks: { C: 3, F: 4, G: 5, L: 6, M: 5, P: 8 } },
  '2': { name: 'Student Services', walks: { C: 4, F: 6, G: 6, L: 5, M: 3, P: 6 } },
  '3': { name: 'Gym & Athletics', walks: { C: 4, F: 8, G: 8, L: 7, M: 3, P: 5 } },
  '4': { name: 'Administration & Cosmetology', walks: { C: 5, F: 7, G: 7, L: 5, M: 2, P: 5 } },
  '5': { name: 'Library & Learning Center', walks: { C: 5, F: 6, G: 5, L: 4, M: 2, P: 6 } },
  '6': { name: 'Student & Community Center', walks: { C: 5, F: 5, G: 4, L: 4, M: 3, P: 7 } },
  '7': { name: 'Sciences & Allied Health', walks: { C: 6, F: 5, G: 3, L: 4, M: 4, P: 8 } },
  '8': { name: 'Business & Language Arts', walks: { C: 7, F: 4, G: 2, L: 5, M: 5, P: 9 } },
  '9': { name: 'Automotive', walks: { C: 6, F: 3, G: 3, L: 6, M: 7, P: 10 } },
  '10': { name: 'Automotive', walks: { C: 7, F: 3, G: 2, L: 6, M: 7, P: 10 } },
  '11': { name: 'Automotive', walks: { C: 6, F: 2, G: 4, L: 7, M: 8, P: 11 } },
  '12': { name: 'Environmental Science & Farallon Room', walks: { C: 8, F: 3, G: 3, L: 8, M: 9, P: 12 } },
  '14': { name: 'Child Development Center', walks: { C: 9, F: 8, G: 6, L: 2, M: 4, P: 8 } },
  '17': { name: 'Field House', walks: { C: 7, F: 12, G: 12, L: 10, M: 7, P: 2 } },
  '19': { name: 'Pacific Heights', walks: { C: 9, F: 10, G: 9, L: 2, M: 4, P: 7 } },
};
const words: Record<string, string> = { one:'1', two:'2', three:'3', four:'4', five:'5', six:'6', seven:'7', eight:'8', nine:'9', ten:'10', eleven:'11', twelve:'12', fourteen:'14', seventeen:'17', nineteen:'19' };

export function answerQuestion(question: string, snapshot: Snapshot, session?: AssistantContext['session'], now = Date.now()): AssistantReply {
  const q = question.trim().toLowerCase();
  const lots = snapshot.lots.map(lot => ({ ...lot, spaces: lot.spaces.map(space => session?.lotId === lot.id && session.spaceId === space.id ? { ...space, occupied: true } : space) }));
  if (/time|timer|minutes left|how long/.test(q) && !/building|bldg|closest|nearest/.test(q)) {
    if (!session) return { text: 'You don’t have an active timer yet. Pick your lot and space in My Vehicle to start one.', link: '/vehicle', label: 'Start a timer' };
    const minutes = Math.max(0, Math.ceil((session.expiresAt - now) / 60000));
    return { text: minutes ? `You have about ${minutes} minutes remaining in Lot ${session.lotId}, space ${session.spaceId}. Your in-app reminder appears with 15 minutes left.` : `Your timer has ended for Lot ${session.lotId}, space ${session.spaceId}.`, link: '/vehicle', label: 'View my timer' };
  }
  if (/where.*(parked|my car|my vehicle)|my (car|vehicle|spot)/.test(q)) return session ? { text: `Your vehicle is saved in Lot ${session.lotId}, space ${session.spaceId}.`, link: `/lots?lot=${session.lotId}&space=${session.spaceId}`, label: 'View my lot' } : { text: 'I don’t have a saved parking spot for you yet. Add one in My Vehicle; a license plate is optional.', link: '/vehicle', label: 'Save my spot' };
  if (/security|impact|unusual|alert/.test(q)) return { text: 'Open Security to see simulated vehicle events and parking reminders. You can trigger an impact or unusual-activity demo there. No real camera or emergency service is connected.', link: '/security', label: 'Open Security' };
  const match = q.match(/(?:building|bldg|bld|b)\s*[#.-]?\s*(\d+|nineteen|seventeen|fourteen|twelve|eleven|eight|seven|three|four|five|nine|one|two|six|ten)\b/);
  let building = match ? words[match[1]] || match[1] : '';
  if (!building && /library|learning center/.test(q)) building = '5';
  if (!building && /student center|community center|bookstore|cafeteria|dining/.test(q)) building = '6';
  if (!building && /gym|athletics/.test(q)) building = '3';
  if (!building && /mesa|fabrication|science/.test(q)) building = '7';
  if (!building && /business|language arts/.test(q)) building = '8';
  if (building) {
    const destination = buildings[building];
    if (!destination) return { text: `Building ${building} isn’t in this demo’s walking model yet. Try Building 8, the library, or the student center.`, link: '/lots', label: 'Browse lots' };
    const candidates = lots.filter(lot => lot.spaces.some(space => !space.occupied)).sort((a,b) => destination.walks[a.id] - destination.walks[b.id]);
    const lot = candidates[0];
    if (!lot) return { text: 'All modeled lots are full right now. Check Parking Lots again after the next simulation update.', link: '/lots', label: 'View lots' };
    const space = lot.spaces.find(item => !item.occupied)!;
    const open = lot.spaces.filter(item => !item.occupied).length;
    const minutes = destination.walks[lot.id];
    return { text: `For Building ${building} (${destination.name}), try Lot ${lot.id}, space ${space.id}. It’s the closest modeled student lot with availability: about a ${minutes}-minute walk, with ${open} open spaces. Walking times are estimates; space numbers and availability are simulated.`, recommendation: { lotId: lot.id, spaceId: space.id, minutes, building, open }, link: `/lots?lot=${lot.id}&space=${space.id}`, label: `View Lot ${lot.id}, space ${space.id}` };
  }
  const lotMatch = q.match(/\blot\s+([a-z])\b/);
  if (lotMatch) {
    const lot = lots.find(item => item.id === lotMatch[1].toUpperCase());
    if (!lot) return { text: 'This demo models Skyline lots C, F, G, L, M, and P. Which one would you like to check?' };
    const open = lot.spaces.filter(space => !space.occupied).length;
    return { text: `Lot ${lot.id} has ${open} available and ${40-open} occupied spaces in the current simulation. ${open ? `Space ${lot.spaces.find(space => !space.occupied)!.id} is open.` : 'Try another lot.'}`, link: `/lots?lot=${lot.id}`, label: `View Lot ${lot.id}` };
  }
  if (/most|available|open|free|full|space/.test(q) && !/closest|nearest/.test(q)) {
    const best = [...lots].sort((a,b) => b.spaces.filter(space => !space.occupied).length - a.spaces.filter(space => !space.occupied).length)[0];
    const open = best.spaces.filter(space => !space.occupied).length;
    return { text: `Lot ${best.id} currently has the most space: ${open} open spots in the simulation. Tell me your building number and I can suggest a closer option.`, link: `/lots?lot=${best.id}`, label: `View Lot ${best.id}` };
  }
  return { text: 'I can find open parking near a Skyline building, check a lot, or look up your timer. Try “Closest available spot to Building 8,” “Is Lot M full?” or “How much time do I have left?”' };
}

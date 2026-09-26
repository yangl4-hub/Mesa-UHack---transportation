# ParkWatch

A full-stack React hackathon demo for smart parking at Skyline College. No API keys, external AI services, camera hardware, or database account required.

## Run locally

Install Node.js 22.13 or later and pnpm 11. The first dependency installation needs internet access; the app itself works without external APIs.

```bash
corepack enable
corepack pnpm install --frozen-lockfile
corepack pnpm dev
```

Open http://localhost:5173. Both the React frontend and the local API run in the same process. If Corepack is unavailable, install pnpm 11 and use `pnpm install --frozen-lockfile` and `pnpm dev`.

```bash
corepack pnpm build
corepack pnpm start
```

The production server prints its local address. No Cloudflare login is needed for the local emulator. Do not copy `node_modules`, `.sites-runtime`, or `.wrangler` between computers.

## Demo in 90 seconds

1. Open Dashboard. Select a Skyline lot on the map or a lot card.
2. In Parking Lots, select a green space and choose **I’m parked here**.
3. In My Vehicle, optionally enter a sample plate, choose a duration, and start the timer. You can also register an occupied spot if that is where your own vehicle is already parked.
4. Select **Jump to 15 minutes**. The remaining time changes and an in-app reminder appears. Open Security to see the reminder.
5. In Security, simulate an impact or unusual activity. The event records the lot, space, severity, and timestamp. Mark alerts as reviewed.
6. Open AI Camera. Change lots and north/south sectors, pause the feed, or toggle bounding boxes. Event controls create alerts for the selected lot.
7. Click **Ask ParkWatch** in the bottom-left. Try “What’s the closest available parking spot to Building 8?”, “Parking near the library?”, “Is Lot M full?”, or “How much time do I have left?” Click the recommended space to open its lot grid.

## What is real and what is simulated

The layout and lettered lots are based on the user-supplied Skyline campus map. The original reference is available from the dashboard map. Building names were checked against https://skylinecollege.edu/maps/ and the campus directory at https://catalog.skylinecollege.edu/current/about/directory.php.

The demo models student sections in lots C, F, G, L, M, and P. The 40-space capacity of each lot, numbered spaces, occupancy, camera detections, confidence percentages, and walking times are mock data. Staff, visitor, reserved, EV, and accessible bays are not mapped individually. Walking times are approximate values inferred from the reference layout, not measured routes. The assistant recommends the closest available modeled lot, then an open space within it; it does not calculate the shortest real path from a specific bay. This is not an official Skyline parking service.

The backend updates the mock occupancy pattern every 30 seconds. The client polls every 15 seconds. Counts and camera overlays are derived from the same snapshot. The selected vehicle space is marked occupied locally while its session is active.

The assistant uses a small rule-based intent parser and the current parking model. It is an AI-product simulation, not a connected large language model. It runs through a real local API and makes no external requests. Unsupported questions get an honest fallback. No personal plate is sent to the assistant.

Timers are personal reminders, not campus parking limits or permits. A deadline is stored in browser localStorage, so reloads and page navigation preserve it. Reminders occur while the app is open or when it is reopened; there are no background OS push notifications. Alerts and session data are private to the current browser profile, capped at 50 alerts, and not synchronized across users. API session creation validates and returns a session but does not store a server-side reservation. No actual vehicle recognition, video recording, SMS, or emergency dispatch occurs.

## Project structure

```text
app/
  page.tsx                  Dashboard
  lots/page.tsx             Parking lot grid
  vehicle/page.tsx          Registration and timer
  security/page.tsx         Alert feed and demo controls
  camera/page.tsx           Camera simulation
  api/
    parking/route.ts        GET parking snapshot
    sessions/route.ts       POST validated session
    events/route.ts         GET seed alerts; POST simulated event
    assistant/route.ts      POST parking question
components/parkwatch/
  provider.tsx              Shared app state, persistence, polling, reminders
  shell.tsx                 Sidebar and page layout
  shared.tsx                Reusable cards, grid, timer, and pickers
  campus-map.tsx            Skyline schematic and source map
  dashboard.tsx             Overview
  lots.tsx                  Interactive lot details
  vehicle.tsx               Vehicle flow
  security.tsx              Alert flow
  camera.tsx                Camera overlay controls
  assistant.tsx             Bottom-left assistant UI
lib/parking/
  types.ts                  Shared model
  api.ts                    Frontend API boundary
  mock-service.ts           Server mock implementation and validation
  timer.ts                  Reminder threshold logic
  assistant.ts              Intent parsing and building walk-time model
```

React 19 + TypeScript, a Vite/Vinext router with API handlers, Lucide icons, and reusable Radix/Shadcn primitives. The deployment wrapper also supports the hosted demo; all parking behavior runs locally without hosted services.

## API contract

| Endpoint | Method | Input | Result |
| --- | --- | --- | --- |
| `/api/parking` | GET | None | `{ lots, updatedAt, source: "simulation" }` |
| `/api/sessions` | POST | `{ plate?: string, lotId, spaceId, durationMinutes }` | Session with `id`, `startedAt`, `expiresAt`, and reminder flags |
| `/api/events` | GET | None | Seed event array |
| `/api/events` | POST | `{ kind: "impact" or "activity", lotId, spaceId }` | Alert with severity and timestamp |
| `/api/assistant` | POST | `{ question, snapshotAt?, session?: { lotId, spaceId, expiresAt } }` | `{ text, recommendation?, link?, label? }` |

Space IDs are strings `"01"` through `"40"`. Durations are 30, 60, 120, 180, or 240 minutes. Times are Unix milliseconds. The optional plate permits up to 15 letters, digits, spaces, or hyphens. Invalid input returns HTTP 400 and `{ error }`. End-session and the demo time jump are browser-local actions.

## Connect Python / OpenCV later

Keep the JSON shapes in `lib/parking/types.ts`. Replace the implementation behind `/api/parking` with your Python service, or change the API boundary in `lib/parking/api.ts` and configure a same-origin development proxy. The components do not need to know which detector produces the data.

A detector should map each camera's calibrated bay polygons to stable `lotId`/`spaceId` pairs, output `occupied` flags and timestamps, and publish deduplicated security events. Replace the simulated camera scene with a real video stream and overlay normalized bounding boxes from the detector. Replace `lib/parking/assistant.ts` with an LLM/tool-calling service if desired; keep the structured recommendation response. Real distances require surveyed pedestrian routes and entrances, including accessibility information.

For a real shared service, add authentication, per-user server-side session storage, persistent alerts, and authorized camera access. Never expose camera credentials in the React bundle.

## Verification

TypeScript checks, the production build, and focused server-model/API-handler checks cover lot totals, invalid inputs, session validation, timer thresholds and deduplication flags, alert types, Building 8/library recommendations, fallback to an available lot, and exclusion of the active vehicle's space. The managed browser preview was unavailable, so interactive browser and WebMCP validation could not be performed in this environment.

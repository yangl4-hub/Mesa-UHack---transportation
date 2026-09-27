# ParkWatch

A React campus parking demo using the six supplied aerial images (E, F, G, M, N, R). Includes a full-stack API, editable image calibration, a small supervised occupancy baseline, a parking recommendation assistant, local parking timers, and simulated security alerts.

## Run locally (Node 22.13+)

```bash
npm install -g pnpm
pnpm install
pnpm dev
```

Open the URL printed in your terminal. No API keys or paid services are needed. Use `pnpm build` for a production build. All application calls use same-origin API routes. The app works without Python using the TypeScript model implementation. This project uses React 19 and Vinext (Vite + the Next.js App Router), with a Cloudflare-compatible server output.

## Demo walkthrough

1. Dashboard starts with **simulated** occupancy for six actual supplied images.
2. Open **AI Camera**, select Lot N, and click **Analyze image**.
3. Actual image crops are converted into six visual features. `/api/analyze` uses labeled examples to classify those crops; it does not return random results.
4. Green = estimated open; red = estimated occupied; amber = uncertain. Select a box to see its status label.
5. Counts update throughout this browser's dashboard, parking grid, and assistant. Ask “Where should I park?” or “How about Lot N?”
6. Use **Edit mapped spaces** to draw new boxes, label open/occupied examples, or remove false boxes. Export annotations for the Python workflow. Re-run analysis after edits.
7. Select a parking space, start a timer in **My Vehicle**, and use **Demo: jump to 15 minutes left** to show the reminder.
8. Open **Security** and **Simulate event** to show an incident alert.

## What the model does—and its limitations

This is a calibrated-space occupancy classifier, **not an automatic parking-space detector**. Total means the number of mapped boxes, not verified physical lot capacity. The provided rough row templates may omit or misalign spaces and may include access aisles or restricted spaces. Review and correct them. Lot F's curved rows particularly need review. 32 manually selected starter crops from Lots R and N seed the model. All six images are available for inference and annotation; only explicitly labeled crops become training examples.

The baseline uses a distance-weighted 5-nearest-neighbor model over brightness, contrast, color spread, bright/dark pixel fractions, and horizontal edge strength. Below 72% neighbor agreement, a crop is marked `unknown`. The agreement score is **not** calibrated probability. User labels are retained as manual ground truth for that space. Accuracy has **not** been measured on held-out images, and training/test overlap exists in Lots N and R. Do not claim production accuracy or live availability. Trees, shadows, camera angle, box alignment, and Google-map stitching distortions can cause incorrect predictions.

To train a reliable automatic system, gather many more images at varied times, annotate stall polygons and occupancy, split by capture/date or camera (not adjacent crops), train a detector/segmentation model, and measure precision/recall and count error on untouched images. The included baseline is an honest end-to-end prototype of the data flow.

The assistant is deterministic ranking, not an LLM: it recommends the highest open count, supports a named lot, and reports the source. It does not calculate walking routes, predict real arrivals, or reserve spots. Timers, labels, image results, and simulated alerts are stored in localStorage on this browser only. They are not shared between devices. Timer reminders require the app to be open; no push/email notification service is connected. Security events are entirely simulated.

## Optional Python/OpenCV backend

```bash
python -m venv .venv
# Windows Git Bash:
source .venv/Scripts/activate
# macOS/Linux instead:
# source .venv/bin/activate
pip install -r python/requirements.txt
python python/vision.py train --output python/model.json
python python/vision.py analyze --lot N --model python/model.json --output python/N-results.json
python python/vision.py serve --port 8000
```

To add your exported labels:

```bash
python python/vision.py train --annotations parkwatch-N-annotations.json parkwatch-R-annotations.json --output python/model.json
python python/vision.py analyze --lot N --annotations parkwatch-N-annotations.json --model python/model.json --output python/N-results.json
```

To connect the UI to Python locally, copy `.env.example` to `.env.local`, set `PARKWATCH_VISION_URL=http://127.0.0.1:8000`, and restart `pnpm dev`. The React app still calls its own `/api/analyze`; that server route forwards to Python. Remove the variable to return to the built-in server model. Do not set the localhost URL on the hosted site: Python runs on your machine, not in the hosted Worker. The Python HTTP API fits the submitted sample set on each request, matching the TypeScript behavior; the saved model is used by the CLI batch-analysis command. OpenCV/Pillow/browser resizing can introduce small prediction differences.

## Data contract and extension points

- `GET /api/lots`: initial mock lots and editable normalized XYWH calibration templates.
- `POST /api/analyze`: `{spots:[{id,features:[6 numbers]}], samples:[{features:[6 numbers],status:"open"|"occupied"}]}` → `{spots:[{id,status,score}],updatedAt,model}`.
- `POST /api/assistant`: `{query,lots}` → `{text,lotId,spotId?}`. The current browser's complete lot state is supplied so recommendations use the current analysis.
- `lib/parking.ts`: shared types, feature extraction, classifier, counts, recommendation logic.
- `components/parkwatch`: reusable controls, assistant, and image workspace.
- `lib/lots.json`: initial approximate mappings and demo statuses.
- `lib/seeds.json`: starter labels.
- `python/vision.py`: actual OpenCV image crop extraction, train/export, batch inference, and compatible local HTTP server.

A future detector should return normalized boxes and occupancy in this contract, replacing the hand-calibrated templates. A future camera ingestion job should publish timestamped lot snapshots to shared persistent storage; the UI can poll that endpoint. No database is required for this single-browser demo. Shared live deployment would need persistence and an ingestion service.

## Checks performed

TypeScript compilation, production build, browser checks of image analysis → dashboard → assistant, parking timer and 15-minute reminder, security simulation, and Python baseline inference. No held-out detection accuracy is claimed.

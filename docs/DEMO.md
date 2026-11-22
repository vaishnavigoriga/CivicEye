# CivicEye demonstration script (about 8 minutes)

Use this to demonstrate the prototype honestly. Say at the start: **"This is an independent prototype. Nothing
submitted here reaches GHMC, HMWSSB or any government department."**

## Before you start

1. Backend `.env` has `ADMIN_EMAIL` / `ADMIN_PASSWORD`, `SEED_DEMO_DATA=true`, and (for the live AI parts)
   `GEMINI_API_KEY`. See the README quick start.
2. Run `npm run dev:backend` and `npm run dev:frontend`, then `cd backend && npm run ai:smoke` to confirm the
   Gemini features work. If the key is missing, the demo still works in labelled *simulated* mode.
3. Have a JPG photo of a road or drain ready, and a second browser profile (or private window) for the citizen.
4. If you use `USE_MEMORY_DB=true`, data disappears whenever the backend restarts. Do not edit backend files during the demo.

## Script

| # | Do | Point out |
|---|---|---|
| 1 | Open **Home** | Plain scope statement and prototype notice; counts are citizen reports only |
| 2 | **Language** selector → Telugu → Hindi → English | Navigation, headings, forms, statuses and messages all change; the choice sticks across pages |
| 3 | **Register** a citizen. Try a 3-character password first | Validation messages in the selected language |
| 4 | **Report an Issue** → describe a problem (try Telugu or Hindi text) | Optional category: "Let AI suggest" |
| 5 | Click **Record voice** → speak → **Transcribe** → edit the text → **Use this text** | Transcript is editable before submission; if the service is down it says so instead of inventing text |
| 6 | Step 2: click the map (or "Use my current location"), add the photo | The pin is required; outside Hyderabad it is rejected immediately |
| 7 | Step 3: submit | Result shows the tracking ID, the AI's suggested category/department, the prototype score, and the **"AI suggestion (Gemini)"** label. Mention it takes up to ~20 s with a photo |
| 8 | Report a **second, similar problem** at almost the same spot (second account) | "Similar reports nearby" with distance; **Support this report** vs **Submit mine anyway**; both are always kept |
| 9 | Open **Track Grievance** with your ID | Public timeline; no reporter identity anywhere. Click **Listen to status** (text-to-speech) and, for a Telugu report viewed in English, **Translate** (labelled "Machine translation by AI") |
| 10 | **Hyderabad Map**: filter, switch to List, tick "Include demo records" | Solid dots = citizen reports; hollow rings = DEMO DATA with approximate locations; OpenStreetMap attribution |
| 11 | **Public Analytics**: switch scope between citizen-only and including demo; apply filters | Everything is computed from the database; the **Data composition** panel and the "Official published figures: none" message; no invented resolution rates |
| 12 | **About CivicEye** | Honest scope, the official-data research summary |
| 13 | In the other browser, log in as the **admin** → Admin Console | Dashboard, workload, highest-priority unassigned reports |
| 14 | Open the citizen's report | **AI suggestion (not verified)** beside **Administrator decisions**; the four-factor score breakdown with its "prototype" note |
| 15 | **Verify category**, **assign** a department, set status **Under Review** → **In Progress** with a public note, add an **internal** comment | Rejecting requires a reason. History shows who and when, and which entries are public |
| 16 | Upload **resolution evidence** (photo), set **Resolved** | Back in the citizen view: new timeline entries and the evidence photo appear; the internal comment and admin name do not |
| 17 | **Duplicates**: confirm one group | Nothing is deleted; rejecting only removes the link |
| 18 | **Departments**: add a test department | Workload table on the dashboard |
| 19 | **Log out** | Admin pages redirect to login |

## Things worth saying out loud

- AI output is a **suggestion**. The priority score is computed by the backend with a **prototype** formula, and
  administrators verify or correct the category.
- **DEMO DATA** is fictional and is excluded from citizen statistics unless you ask for it.
- No official complaint dataset was found (see `docs/DATA_SOURCES.md`), so none is imported.
- If Gemini is unavailable the report is still saved and the screen says AI analysis was not available.

## If something goes wrong

| Problem | Quick fix |
|---|---|
| AI says "Simulated" | No `GEMINI_API_KEY` configured (expected) or `AI_DEMO_FALLBACK=true` after a failure |
| "AI analysis was not available" | Check `npm run ai:smoke`; the model may be slow or retired |
| Admin pages say you must log in | The backend restarted (in-memory DB). Log in again |
| Voice recording does nothing | The browser blocked the microphone (needs HTTPS or localhost and permission) |

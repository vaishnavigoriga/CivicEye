# CivicEye – Phase 2 Architecture (design only, no code changed)

Status: DRAFT for approval. Prototype; not an official GHMC/HMWSSB system.

## 1. Principles
- Keep the existing structure (routes → controllers → services → models). Replace weak parts, don't rewrite all.
- Provenance on every record: `CITIZEN`, `DEMO`, `IMPORTED_OFFICIAL`. Public statistics default to `CITIZEN` only.
- AI output is a *suggestion*; admin-verified values are stored separately.
- No production credentials in code. No demo-login outside `NODE_ENV=development`.

## 2. Data model (MongoDB / Mongoose)

**User**: name, email (unique), passwordHash (bcrypt, cost 12), role `citizen|admin`, phone?, preferredLanguage, isActive, createdAt.

**Department**: code (unique), name, authority (`GHMC|HMWSSB|TSSPDCL|OTHER`), categories[], isActive.

**Complaint**
- trackingId (`CE-HYD-YYYY-NNNNNN`, unique), reporterId, provenance
- description (original text), language, transcript? {text, language, editedByUser}
- category (8 civic categories + Other), locationText?, location GeoJSON Point `[lng,lat]`, locationAccuracy `gps|map_pin|area_approx`, area, ward?
- media[] {kind image|audio, path, mime, size}
- ai {model, status `ok|fallback|failed`, isSimulated, category, keywords[], safetyRisks[], publicImpact, suggestedDepartment, suggestedPriority, explanation, rawConfidence, analysedAt}
- verified {category?, departmentId?, verifiedBy?, verifiedAt?}  ← admin decisions
- scoring {safety, affected, evidence, duration, total, band, modelVersion}
- status (`submitted|under_review|assigned|in_progress|resolved|rejected`), departmentId?
- duplicateGroupId?, supportCount
- timestamps; indexes: trackingId, 2dsphere(location), {status,category,createdAt}, provenance, duplicateGroupId, text index on description.

**ComplaintUpdate** (replaces embedded timeline + AuditLog): complaintId, actorId, actorRole, type `status|assignment|comment|verification|evidence|duplicate_review`, from, to, note, isPublic, createdAt. Citizens see only `isPublic`.

**DuplicateGroup**: primaryComplaintId, memberIds[], status `suggested|confirmed|rejected`, reviewedBy?, reviewedAt?, scoreDetails.

**Support**: complaintId, userId (unique pair). Supports a complaint without creating a new one.

**ScoringConfig** (single doc, seeded from env): weights {safety, affected, evidence, duration}, band thresholds, version. Disclaimer: prototype model, not an official standard.

**ImportedDataset** (for Phase 6): name, source org, URL, licence, retrievedAt, coverage, notes; imported records reference it.

## 3. Scoring (configurable, default 0–100)
`total = 100 × (w_s·safety + w_a·affected + w_e·evidence + w_d·duration)`, each factor 0–1.
- safety: AI risk level, mapped via a table (e.g. exposed wire = 1.0), category floor.
- affected: AI estimate (individual/street/neighbourhood/ward) plus support count, capped.
- evidence: image present and AI-rated severity.
- duration: days open, saturating.
Defaults 0.35/0.25/0.20/0.20. Backend computes; AI never supplies the final number.

## 4. Duplicate detection
Candidates: same category, last 30 days, not rejected/resolved, within 150–300 m by **Haversine** (Mongo `$geoNear` prefilter, Haversine to confirm). Text similarity: Unicode-aware token overlap (works for Telugu/Hindi) plus optional Gemini embedding later. Combined score with time decay. Result: suggestion only; citizen chooses "Support existing" or "Submit anyway"; both preserved; admin confirms/rejects the group.

## 5. API plan (`/api/v1`, envelope `{success,data,error:{code,message,fields}}`)

Auth: `POST /auth/register`, `/auth/login`, `/auth/logout`, `GET /auth/me`, `PATCH /auth/me`. httpOnly cookie JWT (8h) + CSRF-safe same-site; rate limited. Admin created via `npm run create-admin` (reads env or prompts).

Complaints (public, no PII): `GET /complaints` (filter, search, paginate), `GET /complaints/:trackingId` (public view), `GET /map`, `GET /analytics?…`.
Citizen: `POST /complaints` (multipart), `POST /complaints/preview-analysis`, `POST /complaints/:id/support`, `GET /me/complaints`.
Voice: `POST /voice/transcribe` (audio → transcript, editable client-side), `POST /voice/speak` only if TTS spike succeeds.
Admin: `GET /admin/complaints`, `GET /admin/complaints/:id`, `PATCH …/verify`, `…/status`, `…/assign`, `POST …/comments`, `POST …/evidence`, `GET /admin/duplicates`, `PATCH /admin/duplicates/:id`, `GET /admin/workload`, `/admin/departments` CRUD.
Docs: OpenAPI file at `docs/openapi.yaml`, served at `/api/docs` in dev.

Cross-cutting: Zod validation per route, central error handler (safe messages), express-rate-limit (auth, uploads, AI endpoints), helmet, strict CORS from `FRONTEND_URL`, uploads checked by magic bytes, private storage for audio (signed/authorized access), escaped search input.

## 6. Gemini integration
- Server-only; `GEMINI_API_KEY`, `GEMINI_MODEL`, `GEMINI_AUDIO_MODEL` in `.env`.
- Phase 5 starts by verifying current SDK (`@google/genai`) and model IDs against the official docs and a live ListModels call.
- Structured output via JSON schema + Zod validation; one retry; on failure store `ai.status=failed` and fall back to a clearly labelled "Simulated" analysis only when `DEMO_AI_FALLBACK=true`.
- `/health` reports the true AI state.

## 7. Frontend structure and navigation
Primary nav (same for everyone): Home · Report an Issue · Explore Complaints · Track Grievance · Hyderabad Map · Public Analytics · About · Login/Register. When logged in, Login/Register becomes an account menu (My Reports, Profile, Logout; Admin Console for admins). Language switcher in the header.

Pages: Home, Report (3 steps: describe/voice → location/photo → review & AI result), Explore, Track (by ID), Map (map/list toggle), Analytics, About, Auth, My Reports, Admin (Complaints queue, Complaint detail, Duplicates, Workload).

i18n: `i18next`-style JSON resources `en/te/hi`, typed keys, every visible string and validation message, persisted in localStorage, `<html lang>` updated, Telugu/Hindi-capable font (Noto Sans Telugu/Devanagari). User content is never auto-translated.

Design: neutral slate + one civic blue accent, status colours only for status/priority, 8px grid, system-quality typography, no gradients/animations beyond 150ms transitions, WCAG AA contrast. Small shared component set (Button, Field, Badge, Card, Table, Dialog).

## 8. Repository / ops
- `git init` + baseline commit (awaiting your OK).
- Remove committed `dist/`, test uploads and `.env` JWT default; `.env.example` with placeholders only.
- Database: require `MONGO_URI`; in-memory Mongo only via explicit `USE_MEMORY_DB=true` for tests.
- Demo data: `npm run seed:demo` (opt-in), all records `DEMO`, coordinates labelled `area_approx`, no stock photos, no fake "official" records.

## 9. Open decisions for you
1. Approve the model/API/nav above (or list changes).
2. OK to `git init` with a baseline commit?
3. Duplicate radius: 200 m default acceptable?
4. Should demo-login exist in development at all (as a clearly labelled dev-only button), or should demo users log in with normal credentials?

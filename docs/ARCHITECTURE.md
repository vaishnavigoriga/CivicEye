# CivicEye architecture (as built)

Status: reflects the code at the end of Phase 9. Prototype; not an official GHMC/HMWSSB system.

## Principles

- Routes → controllers → services → models. Keep each piece small and explicit.
- Every record has a **provenance**: `CITIZEN`, `DEMO` or `IMPORTED_OFFICIAL`. Public statistics default to `CITIZEN`.
- AI output is a **suggestion**, stored apart from administrator-verified decisions. The backend, not the AI,
  computes the priority score. A failed or simulated analysis is never presented as live.
- No production credentials in code. No demo login. Administrators are created from environment variables or a script.

## Components

```
React (Vite)  ──HTTP/JSON, cookie session──▶  Express API  ──Mongoose──▶  MongoDB
  i18n EN/TE/HI                                 │  validation (Zod), rate limits, auth
  Leaflet, Recharts                             ├─▶ Gemini (server-side only)
                                                └─▶ local disk: images/evidence (public), audio (private)
```

The frontend never sees the Gemini key. In development Vite serves the app on :5173 and the API listens on :4000.

## Data model (MongoDB)

| Collection | Purpose / notable fields |
|---|---|
| `User` | `name, email (unique), passwordHash (bcrypt 12), role citizen|admin, phone, preferredLanguage, isActive` |
| `Complaint` | `trackingId`, `reporterId`, `provenance`, `description` (original language), `category` (reporter's choice, else AI), `location` (GeoJSON point, `accuracy` gps|map_pin|area_approx, area, address), `media[]`, `ai{status, isSimulated, model, category, keywords, safetyRisks, publicImpact, suggestedDepartment, suggestedPriority, explanation, severityFactors, confidence}`, `verified{category, verifiedBy, verifiedAt}`, `scoring{total, band, factors, modelVersion}`, `status`, `departmentId`, `duplicateGroupId`, `supportCount`, `resolutionEvidence[]`, `translations` (cache), `externalSource` |
| `ComplaintUpdate` | One row per event: `type` (submitted/status/assignment/comment/verification/evidence/duplicate_review), `fromStatus/toStatus`, `note`, `isPublic`, `actorId`, `actorRole`, `createdAt`. This is the status history and audit trail |
| `DuplicateGroup` | `primaryComplaintId, memberIds, status suggested|confirmed|rejected, maxScore, reviewedBy/At` |
| `Support` | Unique `(complaintId, userId)` "I am also affected" |
| `Department` | `code (unique), name, authority, description, categories, isActive` |
| `Counter` | Atomic sequences for tracking IDs (`CE-HYD-YYYY-NNNNNN`; demo `CE-DEMO-NNNNNN`) |
| `ImportedDataset`, `ImportedAggregate` | Registry and rows for aggregate official figures (source, licence, retrieval date; `pending_review` until approved) |

Indexes: `2dsphere` on location; compound indexes on status/category/date, provenance/date, reporter, department,
duplicate group and score; a text index (with `language_override` moved so `te`/`hi` do not break it).

Statuses: `submitted → under_review → assigned → in_progress → resolved | rejected`. Rejecting needs a reason. Every
change is stored with the acting admin and timestamp.

Categories: Roads, Drainage, Waterlogging, Water Supply, Sanitation, Street Lights, Electricity (exposed wires),
Public Infrastructure, Other.

## Key behaviours

**Submission** (`POST /complaints`): validate fields and region → check uploads by content → AI analysis
(Gemini or labelled simulation) → score → duplicate candidates → persist → write the first public update → link to a
duplicate group if a candidate exists → return the owner view. AI failure never blocks submission.

**Scoring** (prototype): `100 × Σ weight·factor` over safety, affected people, evidence severity and time open
(defaults 0.35/0.25/0.20/0.20, configurable). Safety has a floor for hazardous categories; supports add to the
affected factor (capped); duration stops when a report is closed. Bands: Critical ≥ 80, High ≥ 60, Medium ≥ 40, Low.

**Duplicate detection:** candidates are open, non-demo reports of the same category within `DUPLICATE_RADIUS_METRES`
(default 200, Haversine), within `DUPLICATE_LOOKBACK_DAYS` (30). Text similarity blends word overlap and character
trigrams over Unicode tokens (works for Telugu and Hindi); distance and recency scale the score. Output is advisory:
the citizen can support an existing report or submit anyway, both reports are always kept, and an administrator
confirms or rejects the group (rejecting only removes the link).

**AI (Gemini via `@google/genai`, Interactions API)**: structured JSON output validated by a JSON Schema and again by
Zod; complaint text is passed as untrusted data; one retry on timeouts/5xx; the key is scrubbed from logs. Separate
models for analysis/translation, transcription and text-to-speech (all configurable; verified live on 21 Nov 2026).
Without a key the keyword-based simulation runs and is always labelled.

**Privacy:** public serialisers are allow-lists with no reporter identity, supporter lists, internal notes or admin
names. Voice recordings are stored outside the static folders and served only to the reporter and admins.

**Analytics:** computed with MongoDB aggregations; scope `citizen` or `all`; filters for category, status, area and
dates; localities come from the data (no hardcoded list); a composition panel shows citizen/demo/imported counts. No
response-time or resolution-rate figures are produced because verified data does not support them.

## Security controls

Zod validation on every route; central error handler with safe messages and error codes; `helmet`; strict CORS
(one origin, credentials); `HttpOnly` `SameSite=Lax` 8-hour cookie; role and active flag re-read from the database per
request; bcrypt cost 12; rate limits (general, auth, submit, AI); magic-byte upload validation with random file names;
body size limits; escaped search input; no static serving of private audio.

## Frontend

React 18 + Vite + Tailwind. One shell (header navigation: Home, Report an Issue, Explore Complaints, Track
Grievance, Hyderabad Map, Public Analytics, About, Login/Register; account menu with My Reports, Profile and, for
admins, Admin Console). `LanguageContext` serves type-checked dictionaries; API errors are translated by code.
Admin pages share an `AdminShell` with tabs (Dashboard, Complaints, Duplicates, Departments).

## Deviations from the Phase 2 plan

- No `ScoringConfig` collection: weights come from environment variables (simpler; versioned by `modelVersion`).
- The planned OpenAPI route (`/api/docs`) is not served; the spec is `docs/openapi.yaml`, verified against the
  real routes by a test.
- Departments hold no contact emails (none are invented).
- The importer handles **aggregate** official CSVs only, because no record-level dataset exists.
- Dev demo login was dropped, as agreed.

## Not built

Email/SMS notifications, password reset, push updates, object storage for uploads, multi-tenant or cross-city
support, an official integration with GHMC/HMWSSB (none exists), and a hosted deployment configuration.

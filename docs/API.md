# CivicEye API

Base URL (development): `http://localhost:4000/api/v1`. A machine-readable description is in
[openapi.yaml](openapi.yaml). Examples use `curl`; add `-b cookies.txt -c cookies.txt` to keep the session cookie.

## Conventions

**Responses** always use one of two envelopes:

```json
{ "success": true,  "data": { }, "message": "optional" }
{ "success": false, "error": { "code": "VALIDATION_ERROR", "message": "…", "fields": { "email": "…" } } }
```

`fields` appears only for `VALIDATION_ERROR`. Messages are safe to display; unexpected failures return a generic
`INTERNAL` message and are logged server-side. The frontend translates by `code`, not by message.

| Code | HTTP | Meaning |
|---|---|---|
| `VALIDATION_ERROR` | 400 | Invalid input (`fields` lists each problem) |
| `UNAUTHORIZED` | 401 | No valid session |
| `INVALID_CREDENTIALS` | 401 | Wrong email or password (same message for unknown email) |
| `FORBIDDEN` | 403 | Valid session, wrong role or not the owner |
| `NOT_FOUND` | 404 | Unknown route or resource |
| `EMAIL_EXISTS` | 409 | Registration with an existing email |
| `CONFLICT` | 409 | Action not possible in the current state (e.g. same status, closed report) |
| `FILE_INVALID` | 400 | Upload is not a real JPG/PNG/WebP image or WebM/OGG/WAV/MP3/MP4 audio |
| `FILE_TOO_LARGE` | 413 | Upload or request body over the limit |
| `LOCATION_OUTSIDE_REGION` | 400 | Pin outside Greater Hyderabad (lat 17.15–17.75, lng 78.15–78.8) |
| `RATE_LIMITED` | 429 | Too many requests |
| `AI_UNAVAILABLE` | 503 | AI feature needs Gemini and it is unconfigured or failing |
| `INTERNAL` | 500 | Unexpected error |

**Authentication.** `POST /auth/login` or `/auth/register` sets an `HttpOnly`, `SameSite=Lax` cookie named `token`
(8 hours). There is no bearer-token mode and the token is never in a response body. Roles: `citizen`, `admin`.

**Rate limits** (per window): general 300 / 15 min per IP; login and register 10 / 15 min per IP + email; submitting
a report 20 / h per user; AI-backed endpoints (`check-duplicates`, `transcribe`, `speak`, `translate`) 30 / h per
user (IP when anonymous). Limits are configurable (see README). Responses include `RateLimit-*` headers.

**Pagination.** List endpoints take `page` (default 1) and `limit` (public max 50, admin max 100) and return
`pagination: { total, page, limit, totalPages }`.

**Provenance.** Every complaint has `provenance`: `CITIZEN`, `DEMO` (fictional) or `IMPORTED_OFFICIAL`. Public lists,
the map and analytics exclude `DEMO` unless `includeDemo=true` (or `scope=all` for analytics).

**Identity.** Public and citizen views never contain reporter identity. Complaints are addressed by `trackingId`
(`CE-HYD-YYYY-NNNNNN`; demo records `CE-DEMO-NNNNNN`).

## Endpoints

Auth column: **public**, **user** (any logged-in user), **admin**.

### Health and transparency

| Method & path | Auth | Description |
|---|---|---|
| `GET /health` (also `/api/health`) | public | Database state and AI *configuration* (key present, models). Does not say a particular analysis was live; each report records that |
| `GET /data-sources` | public | Data composition (`citizen`, `demo`, `importedOfficial` counts), any **approved** official aggregate datasets with source, licence and retrieval date |

### Accounts

| Method & path | Auth | Body | Description |
|---|---|---|---|
| `POST /auth/register` | public | `name` (2–80), `email`, `password` (8–128), `phone?`, `preferredLanguage` (`en|te|hi`) | Creates a **citizen** and starts a session. A `role` field is ignored |
| `POST /auth/login` | public | `email`, `password` | Starts a session |
| `POST /auth/logout` | public | – | Clears the cookie |
| `GET /auth/me` | user | – | Current user (`id,name,email,role,phone,preferredLanguage`) |
| `PATCH /auth/me` | user | `name?`, `phone?`, `preferredLanguage?`, `currentPassword?` + `newPassword?` | Update profile or change password (current password required) |

### Citizen reports

| Method & path | Auth | Description |
|---|---|---|
| `GET /complaints` | public | Paged public list. Query: `page`, `limit`, `search`, `category`, `status`, `area`, `includeDemo`, `sort=newest|priority` |
| `POST /complaints` | user | Submit a report (**multipart/form-data**, below). Returns `{ complaint, duplicate }` |
| `GET /complaints/mine` | user | Your reports (includes your voice recording URL and transcript) |
| `GET /complaints/map` | public | Map points. Query: `category`, `status`, `includeDemo` |
| `GET /complaints/analytics` | public | Statistics computed from the database. Query: `scope=citizen|all`, `category`, `status`, `area`, `from`, `to` |
| `POST /complaints/check-duplicates` | user | JSON `{ description, latitude, longitude, category? }`. Similar open reports nearby, each with `distanceMetres`, `similarity`, `isOwn`. Advisory only |
| `GET /complaints/{trackingId}` | public (session optional) | Report, public timeline (`updates`), `related` duplicates, `hasSupported` |
| `POST /complaints/{trackingId}/support` | user | "I am also affected". Idempotent. Not for your own or closed reports |
| `DELETE /complaints/{trackingId}/support` | user | Remove your support |
| `POST /complaints/{trackingId}/translate` | public | `{ target: "en|te|hi" }`. Machine translation of the description, cached; the original is never changed. `503 AI_UNAVAILABLE` without Gemini |

**`POST /complaints` fields**

| Field | Required | Notes |
|---|---|---|
| `description` | yes | 15–2000 characters, any supported language |
| `latitude`, `longitude` | yes | Must be inside the Hyderabad region |
| `category` | no | One of `Roads, Drainage, Waterlogging, Water Supply, Sanitation, Street Lights, Electricity, Public Infrastructure, Other`. Your choice wins; the AI suggestion is stored separately |
| `locationAccuracy` | no | `gps` or `map_pin` (default) |
| `area`, `address`, `title` | no | `area` defaults to the nearest known locality; `title` defaults to the first line of the description |
| `language` | no | `en` (default), `te`, `hi` |
| `transcriptText`, `transcriptEditedByUser` | no | Set when the description came from a voice transcript |
| `image` | no | JPG/PNG/WebP, ≤ 10 MB, checked by content |
| `audio` | no | WebM/OGG/WAV/MP3/MP4 audio, ≤ 10 MB; stored privately |

The report is saved even if AI analysis fails; `complaint.ai.status` is then `failed` (or `fallback` when
`AI_DEMO_FALLBACK=true`). `ai.isSimulated` is `true` for keyword-based demo analysis. Never treat either as a live
AI result. The score (`complaint.priority`) is always computed by the backend.

```bash
curl -b c.txt -c c.txt -X POST http://localhost:4000/api/v1/complaints \
  -F "description=Large pothole near the bus stop, two-wheelers are swerving." \
  -F latitude=17.4156 -F longitude=78.4347 -F image=@photo.jpg
```

### Voice

| Method & path | Auth | Description |
|---|---|---|
| `POST /voice/transcribe` | user | multipart `audio`. Returns `{ available, noSpeech, text, language }`. `available:false` means the service failed; nothing is invented. The audio is not stored |
| `POST /voice/speak` | user | JSON `{ text }` (1–500 chars). Returns `audio/wav` (language auto-detected). `503 AI_UNAVAILABLE` on failure |
| `GET /media/audio/{filename}` | user | Plays a stored voice recording. Only the reporter or an admin |

### Administrator

All admin routes require the `admin` role (checked against the database on every request). `{trackingId}` is the
report ID.

| Method & path | Body / query | Description |
|---|---|---|
| `GET /admin/complaints` | `page, limit, search, status, category, departmentId, unassigned, provenance=citizen|demo|all, duplicatesOnly, sort` | Full queue, including reporter contact details and the complete AI record |
| `GET /admin/complaints/{trackingId}` | – | Report, **all** updates (public and internal, with the responsible admin) and duplicate group |
| `PATCH /admin/complaints/{trackingId}/status` | `status`, `note?`, `isPublic` (default true) | Change status. Rejecting requires a `note`. Stored with timestamp and admin |
| `PATCH /admin/complaints/{trackingId}/department` | `departmentId`, `note?` | Assign. Moves `submitted`/`under_review` to `assigned` |
| `PATCH /admin/complaints/{trackingId}/category` | `category`, `note?` | Record the administrator-verified category (separate from the AI suggestion) |
| `POST /admin/complaints/{trackingId}/comments` | `note`, `isPublic` (default false) | Add an internal or citizen-visible comment |
| `POST /admin/complaints/{trackingId}/evidence` | multipart `evidence` (image), `caption?` | Resolution evidence; recorded as a public update |
| `GET /admin/duplicates` | – | Suggested and confirmed duplicate groups with their reports |
| `PATCH /admin/duplicates/{id}` | `decision=confirmed|rejected` | Confirm, or reject (removes the link only; no report is deleted) |
| `GET /admin/workload` | – | Per-department counts and the unassigned total |
| `GET /admin/departments` | – | All departments |
| `POST /admin/departments`, `PUT /admin/departments/{id}` | `code, name, authority, description, categories, isActive` | Create or update |

**Statuses:** `submitted`, `under_review`, `assigned`, `in_progress`, `resolved`, `rejected`. Every change writes a
`ComplaintUpdate` with the type, from/to status, note, visibility, acting admin and timestamp. Citizens see only the
updates marked public, without admin names.

## Priority score (prototype)

`score = 100 × (wS·safety + wA·affected + wE·evidence + wD·duration)` with each factor in 0–1 and default weights
0.35 / 0.25 / 0.20 / 0.20 (configurable, normalised). Safety comes from the AI's risk estimate with a floor for
hazardous categories; *affected* from the AI's estimate plus citizen supports (capped); *evidence* from photo
presence and damage; *duration* rises with days open and stops when the report is closed. Bands: Critical ≥ 80,
High ≥ 60, Medium ≥ 40, Low otherwise. This is **not** an officially validated municipal standard.

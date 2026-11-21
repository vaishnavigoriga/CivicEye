# 👁️ CivicEye — AI-Powered Civic Grievance & Infrastructure Intelligence Platform

> **Greater Hyderabad Municipal Corporation (GHMC) & HMWSSB Infrastructure Intelligence**  
> Built for transparent civic reporting, rapid departmental triage, automated AI classification, multi-factor severity ranking, and verified on-site proof of resolution.

---

## 🌟 Key Highlights & Features

1. **Multilingual Grievance Intake**:
   - Voice dictation with automated audio transcription (English, Telugu, Hindi).
   - Photographic evidence capture with file validation (strict MIME checks, UUID rename, max 10MB).
   - Accurate GeoJSON standard coordinates (`[longitude, latitude]`) with MongoDB `2dsphere` spatial indexing.
2. **AI Classification & Deterministic Fallback**:
   - Google Gemini 1.5 Flash SDK (`@google/generative-ai ^0.21.0`) with 10-second timeout and Zod schema validation.
   - **Offline Turnkey Demo Mode**: Automatically activates a deterministic Simulated AI engine when no Gemini API key is configured.
   - All AI assessments are clearly labeled with a prototype disclaimer (`🤖 Simulated AI Analysis - Prototype estimate`).
3. **Transparent 4-Factor Severity Scoring**:
   - Computes a 1–100 priority score based on:
     - $f_1$: AI physical severity rating (40%)
     - $f_2$: Affected population impact proxy via citizen upvotes (25%)
     - $f_3$: Public safety & health hazard flag for drainage/water/electricity (20%)
     - $f_4$: Unresolved duration bonus (15%) — **older unresolved complaints receive higher priority, never a penalty!**
4. **500-Meter Geospatial Duplicate Detection**:
   - MongoDB `$nearSphere` queries find nearby complaints within 500m in the same category.
   - Computes Jaccard word similarity on grievance text.
   - If a duplicate is suspected ($\ge 0.35$), complaints are linked via a shared `duplicateGroupId` without deleting or hiding any citizen's individual report.
   - Dedicated Administrative Review panel (`/admin/duplicates`) allows administrators to confirm or separate duplicate groups.
5. **Interactive Hyderabad Map**:
   - Leaflet + OpenStreetMap displaying color-coded severity markers (Critical, High, Medium, Low).
   - Real-time category and lifecycle status filters.
6. **Public Analytics & Transparency Dashboard**:
   - Recharts visual charts: category breakdown, lifecycle status funnel, and locality distribution across 10 Hyderabad zones.
7. **Departmental Lifecycle & Resolution Proof**:
   - Assign to 8 specialized departments (GHMC Roads, GHMC Drainage, TSSPDCL Electricity, HMWSSB Water, GHMC Sanitation, GHMC Street Lights, GHMC Parks, GHMC General).
   - Before-and-after photographic evidence uploads.
   - Complete immutable audit logging and timeline history.
8. **1-Click Demo Authentication**:
   - Instant Demo Citizen & Demo Administrator login buttons.
   - Secure `httpOnly` JWT session cookies with CORS credential validation.

---

## 🏗️ Architecture & Technology Stack

| Layer | Technologies |
|---|---|
| **Frontend** | React 18, Vite, TypeScript, Tailwind CSS, Lucide Icons, Leaflet, Recharts |
| **Backend** | Node.js, Express, TypeScript, Multer, Cookie-Parser, Zod |
| **Database** | MongoDB & Mongoose with **GeoJSON 2dsphere indexing** + automatic In-Memory Mongo fallback |
| **AI Engine** | Google Gemini 1.5 Flash (`@google/generative-ai`) + Deterministic Mock Classifier |
| **Maps** | Leaflet & OpenStreetMap (Zero API key required) |

---

## 🚀 Quick Start & Setup Instructions

### Prerequisites
- Node.js (v18+)
- npm

### 1. Installation
Clone or navigate to the project directory and install all dependencies:
```bash
# Install backend dependencies
cd backend
npm install

# Install frontend dependencies
cd ../frontend
npm install
```

### 2. Environment Configuration
Both backend and frontend come pre-configured with default `.env` files for immediate demo execution.

**Backend `.env`**:
```env
PORT=4000
NODE_ENV=development
FRONTEND_URL=http://localhost:5173
MONGO_URI=mongodb://127.0.0.1:27017/civiceye
JWT_SECRET=civiceye_super_secret_jwt_key_2026_dev_mode
GEMINI_API_KEY= # Optional! Leave empty for deterministic mock AI
```

*(Note: If no external MongoDB instance is running, CivicEye automatically boots a zero-config In-Memory MongoDB engine with full 2dsphere index and aggregation pipeline support!)*

### 3. Database Seeding
Seed the database with demo users, 8 municipal departments, and 40 realistic fictional complaints across 10 Hyderabad localities:
```bash
cd backend
npm run seed
```

### 4. Running the Application
Open two terminal windows:

**Terminal 1 (Backend API Server on port 4000):**
```bash
cd backend
npm run dev
```

**Terminal 2 (Frontend Client on port 5173):**
```bash
cd frontend
npm run dev
```

Visit **http://localhost:5173** in your browser.

---

## 🔑 Demo Login Credentials

The login page (`/login`) includes **1-Click Instant Demo Login** buttons:

| Role | Email | Password | Access Capabilities |
|---|---|---|---|
| **Demo Citizen** | `citizen@civiceye.demo` | `demo1234` | Report grievances, voice dictation, view own reports, upvote |
| **Demo Administrator** | `admin@civiceye.demo` | `admin1234` | Full Command Dashboard, dispatch departments, update status, upload resolution proof, review duplicate groups |

---

## 🧪 Running Automated Tests

### Backend Unit & Integration Tests (16 tests across 4 test suites):
```bash
cd backend
npm test
```
Tests cover:
- `severityService.test.ts`: 4-factor formula, duration bonus verification, boundaries clamp.
- `duplicateService.test.ts`: Jaccard text similarity tokenization and threshold matching.
- `aiService.test.ts`: Deterministic classification, category matching, simulated labels, language hints.
- `apiRoutes.test.ts`: Health check, demo auth cookies, static-before-dynamic route ordering (`/map`, `/analytics/summary` before `/:id`).

### Frontend Unit Tests:
```bash
cd frontend
npm test
```
Tests cover:
- `severityColor.test.ts`: Severity band mapping and styling classes.
- `i18n.test.ts`: English, Telugu, and Hindi translations dictionary.

---

## 🛡️ Security & Compliance Notes
- All uploaded files are sanitized: executable extensions (`.exe`, `.sh`, `.php`, etc.) are blocked, MIME types are strictly validated, and original filenames are replaced with cryptographic UUIDs.
- `GEMINI_API_KEY` is strictly confined to the backend server and is never exposed in frontend code.
- **Academic Disclaimer**: *CivicEye is a simulated civic infrastructure management prototype. No demo complaints or notifications are submitted to real municipal government authorities.*

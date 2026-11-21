import React from 'react';
import { Breadcrumb } from '../components/ui/Breadcrumb';
import { Card, CardHeader, CardBody } from '../components/ui/Card';
import { Badge } from '../components/ui/Badge';
import {
  Shield,
  Database,
  Calculator,
  Compass,
  CheckCircle,
  AlertTriangle,
  Building2,
  FileText,
  Lock,
} from 'lucide-react';

export const AboutPage: React.FC = () => {
  return (
    <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">
      <Breadcrumb items={[{ label: 'About CivicEye & Methodology' }]} />

      {/* Header */}
      <div className="pb-6 border-b border-slate-200">
        <div className="flex items-center gap-2 mb-1">
          <Badge variant="info" size="sm">
            Institutional Transparency
          </Badge>
          <span className="text-slate-300">•</span>
          <span className="text-xs text-slate-500 font-mono">Greater Hyderabad Municipal Region</span>
        </div>
        <h1 className="text-3xl font-extrabold text-slate-900 tracking-tight">
          About CivicEye & Platform Architecture
        </h1>
        <p className="text-sm text-slate-600 mt-2 max-w-3xl leading-relaxed">
          CivicEye is an AI-powered municipal intelligence and civic grievance platform designed to accelerate infrastructure triage, eliminate duplicate reports, and provide verified photographic evidence of resolution.
        </p>
      </div>

      {/* Section 1: Data Credibility & Government Open Data Reality */}
      <Card>
        <CardHeader className="bg-slate-50/60">
          <div className="flex items-center gap-2">
            <Database className="w-4 h-4 text-civic-700" />
            <h2 className="text-base font-bold text-slate-900">
              Data Credibility & The Government Open Data Reality
            </h2>
          </div>
        </CardHeader>
        <CardBody className="space-y-4 text-xs leading-relaxed text-slate-700">
          <p>
            A foundational pillar of CivicEye is <strong>strict data provenance</strong>. We do not invent fake streaming APIs, fabricate live citizen counts, or display artificial statistics.
          </p>

          <div className="p-4 rounded-md bg-amber-50/70 border border-amber-200/90 space-y-2 text-amber-950">
            <div className="flex items-center gap-1.5 font-bold text-xs text-amber-900">
              <AlertTriangle className="w-4 h-4 text-amber-700 shrink-0" />
              <span>Telangana State & GHMC Open Data Investigation</span>
            </div>
            <p className="text-[11px] leading-relaxed">
              Official public portals such as <strong>data.telangana.gov.in</strong> publish open geospatial datasets (e.g., GHMC ward boundaries, public asset registers, urban biodiversity inventories). However, <strong>no state municipal body currently provides a free, unauthenticated, real-time public API for streaming citizen grievances</strong>. Live platforms like Prajavani and MyGHMC operate behind citizen mobile OTP and internal municipal SSO.
            </p>
          </div>

          <p>
            In accordance with sound software engineering principles:
          </p>
          <ul className="list-disc pl-5 space-y-1.5 text-slate-600">
            <li>
              Every complaint record carries a mandatory <code>dataSource</code> field (e.g. <code>citizen_submitted</code> vs <code>fictional_demo</code>).
            </li>
            <li>
              Public analytics and statistics are <strong>calculated exclusively from real database queries</strong>. No hardcoded fallback numbers are used.
            </li>
            <li>
              If a query yields zero verified records, the system displays: <em>"No verified live data available"</em> rather than generating synthetic trends.
            </li>
          </ul>
        </CardBody>
      </Card>

      {/* Section 2: 4-Factor Severity Scoring Formula */}
      <Card>
        <CardHeader className="bg-slate-50/60">
          <div className="flex items-center gap-2">
            <Calculator className="w-4 h-4 text-civic-700" />
            <h2 className="text-base font-bold text-slate-900">
              Transparent 4-Factor Severity Scoring Formula
            </h2>
          </div>
        </CardHeader>
        <CardBody className="space-y-4 text-xs leading-relaxed text-slate-700">
          <p>
            Unlike opaque proprietary algorithms, CivicEye uses a mathematically transparent priority score (1–100) calculated by <code>SeverityService</code>:
          </p>

          <div className="p-4 rounded-md bg-slate-900 text-slate-100 font-mono text-xs space-y-1">
            <div className="text-teal-400 font-bold mb-2">// Priority Score Mathematical Definition</div>
            <div>Priority Score = clamp( 0.40·f₁ + 0.25·f₂ + 0.20·f₃ + 0.15·f₄, 1, 100 )</div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-2">
            <div className="p-3 rounded-md border border-slate-200 bg-slate-50/60">
              <strong className="text-slate-900 block mb-1">f₁: Physical Hazard Rating (40%)</strong>
              <p className="text-slate-600 text-[11px]">
                Raw AI signal (1–10 scaled to 10–100) assessing direct structural or safety risk.
              </p>
            </div>

            <div className="p-3 rounded-md border border-slate-200 bg-slate-50/60">
              <strong className="text-slate-900 block mb-1">f₂: Affected Population Proxy (25%)</strong>
              <p className="text-slate-600 text-[11px]">
                Community upvotes (upvotes × 5, capped at 100) serving as a proxy for localized impact.
              </p>
            </div>

            <div className="p-3 rounded-md border border-slate-200 bg-slate-50/60">
              <strong className="text-slate-900 block mb-1">f₃: Public Safety Hazard Flag (20%)</strong>
              <p className="text-slate-600 text-[11px]">
                Fixed 100-point boost for critical life-safety categories (Drainage, Water Supply, Electricity).
              </p>
            </div>

            <div className="p-3 rounded-md border border-slate-200 bg-slate-50/60">
              <strong className="text-slate-900 block mb-1">f₄: Unresolved Duration Bonus (15%)</strong>
              <p className="text-slate-600 text-[11px]">
                <strong>No age penalty.</strong> Older unresolved grievances receive a duration bonus (days × 2) so lingering issues are elevated.
              </p>
            </div>
          </div>

          <p className="text-[11px] text-slate-500 italic">
            * Every score is accompanied by an institutional disclaimer: "Prototype estimate based on multi-factor analysis - not an official government assessment."
          </p>
        </CardBody>
      </Card>

      {/* Section 3: 500-Meter Geospatial Deduplication Algorithm */}
      <Card>
        <CardHeader className="bg-slate-50/60">
          <div className="flex items-center gap-2">
            <Compass className="w-4 h-4 text-civic-700" />
            <h2 className="text-base font-bold text-slate-900">
              500-Meter Geospatial Deduplication Algorithm
            </h2>
          </div>
        </CardHeader>
        <CardBody className="space-y-4 text-xs leading-relaxed text-slate-700">
          <p>
            When citizens report the same defect (e.g. an open manhole at Cyber Towers), multiple submissions can overwhelm municipal dispatch. CivicEye implements a two-stage deduplication pipeline:
          </p>

          <ol className="list-decimal pl-5 space-y-2 text-slate-600">
            <li>
              <strong>MongoDB 2dsphere Spatial Query</strong>: Queries active, unresolved complaints within a <strong>500-meter radius</strong> of the submitted GeoJSON Point <code>[longitude, latitude]</code> in the same category within the past 30 days.
            </li>
            <li>
              <strong>Jaccard Word Similarity Index</strong>: Computes text token overlap between titles and descriptions:
              <div className="font-mono text-[11px] bg-slate-100 p-2 rounded mt-1 text-slate-800">
                Jaccard(A, B) = |Tokens(A) ∩ Tokens(B)| / |Tokens(A) ∪ Tokens(B)| ≥ 0.35
              </div>
            </li>
            <li>
              <strong>Non-Destructive Grouping</strong>: Instead of deleting or rejecting the report, both complaints are linked under a shared <code>duplicateGroupId</code>. Citizens retain their tracking record, while administrators review suspected duplicate pairs in a dedicated console.
            </li>
          </ol>
        </CardBody>
      </Card>

      {/* Section 4: Monitored Departments & Security */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <div className="flex items-center gap-2">
              <Building2 className="w-4 h-4 text-civic-700" />
              <h3 className="text-sm font-bold text-slate-900">Operational Jurisdictions</h3>
            </div>
          </CardHeader>
          <CardBody className="space-y-2 text-xs text-slate-600">
            <p>CivicEye routes complaints across 8 municipal departments:</p>
            <ul className="list-disc pl-4 space-y-1 text-slate-700">
              <li>GHMC Roads & Infrastructure Maintenance</li>
              <li>GHMC Stormwater Drainage & Flood Mitigation</li>
              <li>TSSPDCL Electrical Distribution & Safety</li>
              <li>HMWSSB Drinking Water Pipeline & Quality</li>
              <li>GHMC Solid Waste & Sanitation</li>
              <li>GHMC Public Street Lighting</li>
              <li>GHMC Urban Biodiversity & Parks</li>
              <li>Civic Grievance Special Cell (General)</li>
            </ul>
          </CardBody>
        </Card>

        <Card>
          <CardHeader>
            <div className="flex items-center gap-2">
              <Lock className="w-4 h-4 text-civic-700" />
              <h3 className="text-sm font-bold text-slate-900">Security & Privacy Commitments</h3>
            </div>
          </CardHeader>
          <CardBody className="space-y-2 text-xs text-slate-600">
            <p>Our technical security controls include:</p>
            <ul className="list-disc pl-4 space-y-1 text-slate-700">
              <li>Passwords hashed with bcrypt (salt rounds = 10).</li>
              <li>JWT authentication via <code>httpOnly; SameSite=Strict</code> cookies.</li>
              <li>File upload sanitization: strict MIME allowlists, blocked executable extensions, and cryptographic UUID renames.</li>
              <li>Backend-only API keys: <code>GEMINI_API_KEY</code> is never exposed to the client bundle.</li>
            </ul>
          </CardBody>
        </Card>
      </div>
    </div>
  );
};

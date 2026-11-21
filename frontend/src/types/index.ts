export type UserRole = 'citizen' | 'admin';
export type Language = 'en' | 'te' | 'hi';

export interface User {
  id: string;
  name: string;
  email: string;
  role: UserRole;
  preferredLanguage: Language;
  phone?: string;
}

export const CATEGORIES = [
  'Roads',
  'Drainage',
  'Waterlogging',
  'Water Supply',
  'Sanitation',
  'Street Lights',
  'Electricity',
  'Public Infrastructure',
  'Other',
] as const;
export type ComplaintCategory = (typeof CATEGORIES)[number];

export const STATUSES = ['submitted', 'under_review', 'assigned', 'in_progress', 'resolved', 'rejected'] as const;
export type ComplaintStatus = (typeof STATUSES)[number];

/** CITIZEN = submitted in this app, DEMO = fictional demonstration data, IMPORTED_OFFICIAL = verified external dataset. */
export type Provenance = 'CITIZEN' | 'DEMO' | 'IMPORTED_OFFICIAL';
export type PriorityBand = 'Critical' | 'High' | 'Medium' | 'Low';

/** Public view of a complaint as returned by the API. Never contains reporter identity. */
export interface Complaint {
  id: string;
  trackingId: string;
  provenance: Provenance;
  title: string;
  description: string;
  language: Language;
  category: ComplaintCategory;
  categoryVerified: boolean;
  location: {
    address: string;
    area: string;
    ward?: string;
    accuracy: 'gps' | 'map_pin' | 'area_approx';
    coordinates: [number, number]; // [lat, lng]
  };
  images: { url: string }[];
  audio?: { url: string }[]; // owner/admin only
  hasAudio: boolean;
  ai: {
    status: 'ok' | 'fallback' | 'failed';
    isSimulated: boolean;
    keywords: string[];
    explanation?: string;
    publicImpact?: string;
    suggestedDepartment?: string;
    suggestedCategory?: ComplaintCategory;
    model?: string;
  };
  priority: { score: number; band: PriorityBand; modelVersion: string };
  status: ComplaintStatus;
  department: { code: string; name: string } | null;
  supportCount: number;
  hasSupported: boolean;
  hasDuplicateGroup: boolean;
  resolutionEvidence: { url: string; caption: string; uploadedAt: string }[];
  createdAt: string;
  updatedAt: string;
}

export interface ComplaintUpdate {
  type: string;
  fromStatus?: string;
  toStatus?: string;
  note: string;
  actorRole: 'citizen' | 'admin' | 'system';
  createdAt: string;
}

export interface Department {
  _id: string;
  name: string;
  code: string;
  description: string;
  contactEmail?: string;
  assignedComplaintsCount?: number;
}

export interface DuplicateCandidate {
  complaint: Complaint;
  distanceMetres: number;
  similarity: number;
  isOwn?: boolean;
}

export interface MapPoint {
  id: string;
  trackingId: string;
  title: string;
  category: ComplaintCategory;
  status: ComplaintStatus;
  priority: { score: number; band: PriorityBand };
  area: string;
  accuracy: 'gps' | 'map_pin' | 'area_approx';
  provenance: Provenance;
  lat: number;
  lng: number;
}

export interface Analytics {
  scope: 'citizen' | 'all';
  totals: { total: number; open: number; submitted: number; underReview: number; assigned: number; inProgress: number; resolved: number; rejected: number };
  byStatus: { status: ComplaintStatus; count: number }[];
  byCategory: { category: ComplaintCategory; count: number }[];
  byArea: { area: string; count: number }[];
  byPriority: { band: PriorityBand; count: number }[];
  trend: { date: string; count: number }[];
  byDepartment: { code: string; name: string; total: number; open: number }[];
  availableAreas: string[];
  composition: { citizen: number; demo: number; importedOfficial: number };
  generatedAt: string;
}

export interface OfficialDataset {
  id: string;
  title: string;
  sourceOrg: string;
  sourceUrl: string;
  licence: string;
  retrievedAt: string;
  publishedAt?: string;
  coverage: string;
  notes?: string;
  rows: { label: string; metrics: Record<string, number> }[];
}

export interface DataSources {
  composition: { citizen: number; demo: number; importedOfficial: number };
  officialComplaintDataAvailable: boolean;
  datasets: OfficialDataset[];
  researchedOn: string;
}

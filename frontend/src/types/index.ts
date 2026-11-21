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

export type ComplaintCategory =
  | 'Roads'
  | 'Drainage'
  | 'Electricity'
  | 'Water Supply'
  | 'Sanitation'
  | 'Street Lights'
  | 'Parks'
  | 'Other';

export type ComplaintStatus = 'pending' | 'assigned' | 'in-progress' | 'resolved' | 'rejected';

export type ComplaintDataSource = 'CITIZEN_SUBMITTED' | 'DEMO_SIMULATED' | 'VERIFIED_EXTERNAL';

export interface ComplaintMedia {
  type: 'image' | 'audio';
  url: string;
  mimeType: string;
  uploadedAt: string;
}

export interface ComplaintTimeline {
  status: ComplaintStatus;
  note: string;
  updatedBy: {
    _id: string;
    name: string;
    role: string;
  };
  timestamp: string;
}

export interface ResolutionEvidence {
  url: string;
  caption: string;
  uploadedAt: string;
}

export interface AISeverityFactors {
  safetyRisk?: 'low' | 'medium' | 'high' | 'critical';
  affectedPopulation?: 'individual' | 'street' | 'neighbourhood' | 'ward';
  infrastructureDamage?: 'cosmetic' | 'moderate' | 'severe' | 'collapsed';
  publicHealthRisk?: boolean;
}

export interface Complaint {
  _id: string;
  referenceId: string;
  citizenId: {
    _id: string;
    name: string;
    email: string;
    preferredLanguage?: Language;
  };
  title: string;
  description: string;
  language: Language;
  category: ComplaintCategory;
  location: {
    address: string;
    area: string;
    ward?: string;
    geo: {
      type: 'Point';
      coordinates: [number, number]; // [lng, lat]
    };
  };
  media: ComplaintMedia[];
  transcription?: {
    originalAudioUrl?: string;
    transcribedText?: string;
    transcriptionSource: 'gemini' | 'unavailable';
    language: Language;
  };
  aiAnalysis: {
    category: ComplaintCategory;
    aiSeverityRating: number;
    priorityScore: number;
    tags: string[];
    summary: string;
    detectedLanguage: Language;
    isSimulated: boolean;
    source: 'gemini' | 'mock';
    department?: string;
    severityFactors?: AISeverityFactors;
    suggestedActions?: string[];
    confidence?: number;
    computedAt: string;
  };
  duplicateGroupId?: string;
  duplicateStatus: 'unreviewed' | 'confirmed' | 'rejected';
  duplicateSimilarityScore?: number;
  department?: {
    _id: string;
    name: string;
    code: string;
    contactEmail?: string;
  };
  status: ComplaintStatus;
  timeline: ComplaintTimeline[];
  resolutionEvidence: ResolutionEvidence[];
  upvotes: number;
  hasUpvoted?: boolean;
  dataSource: ComplaintDataSource;
  externalSourceAttribution?: {
    datasetName?: string;
    sourceOrg?: string;
    sourceUrl?: string;
    licence?: string;
  };
  createdAt: string;
  updatedAt: string;
}

export interface Department {
  _id: string;
  name: string;
  code: string;
  description: string;
  contactEmail: string;
  assignedComplaintsCount?: number;
}

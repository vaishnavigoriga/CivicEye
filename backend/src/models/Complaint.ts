import mongoose, { Document, Schema, Types } from 'mongoose';

export const CATEGORIES = [
  'Roads',
  'Drainage',
  'Electricity',
  'Water Supply',
  'Sanitation',
  'Street Lights',
  'Public Infrastructure',
  'Waterlogging',
  'Other',
] as const;
export type ComplaintCategory = (typeof CATEGORIES)[number];

export const STATUSES = ['submitted', 'under_review', 'assigned', 'in_progress', 'resolved', 'rejected'] as const;
export type ComplaintStatus = (typeof STATUSES)[number];

/** CITIZEN = submitted in this app. DEMO = fictional demonstration record. IMPORTED_OFFICIAL = verified external dataset. */
export const PROVENANCES = ['CITIZEN', 'DEMO', 'IMPORTED_OFFICIAL'] as const;
export type Provenance = (typeof PROVENANCES)[number];

export const LOCATION_ACCURACIES = ['gps', 'map_pin', 'area_approx'] as const;
export type LocationAccuracy = (typeof LOCATION_ACCURACIES)[number];

export type Language = 'en' | 'te' | 'hi';

export interface IMedia {
  kind: 'image' | 'audio';
  filename: string;
  /** Public URL for images; authenticated URL for audio. */
  url: string;
  mime: string;
  size: number;
}

export interface IComplaint extends Document {
  trackingId: string;
  reporterId: Types.ObjectId;
  provenance: Provenance;
  title: string;
  description: string;
  language: Language;
  transcript?: { text: string; language: Language; editedByUser: boolean };
  category: ComplaintCategory;
  location: {
    address: string;
    area: string;
    ward?: string;
    accuracy: LocationAccuracy;
    geo: { type: 'Point'; coordinates: [number, number] }; // [lng, lat]
  };
  media: IMedia[];
  /** AI output is a suggestion only. */
  ai: {
    status: 'ok' | 'fallback' | 'failed';
    isSimulated: boolean;
    model?: string;
    category?: ComplaintCategory;
    keywords: string[];
    safetyRisks: string[];
    publicImpact?: string;
    suggestedDepartment?: string;
    suggestedPriority?: 'Critical' | 'High' | 'Medium' | 'Low';
    explanation?: string;
    severityFactors?: {
      safetyRisk?: 'low' | 'medium' | 'high' | 'critical';
      affectedPopulation?: 'individual' | 'street' | 'neighbourhood' | 'ward';
      infrastructureDamage?: 'cosmetic' | 'moderate' | 'severe' | 'collapsed';
    };
    confidence?: number;
    analysedAt: Date;
  };
  /** Administrator-verified decisions, separate from AI suggestions. */
  verified?: { category?: ComplaintCategory; verifiedBy: Types.ObjectId; verifiedAt: Date };
  scoring: {
    total: number;
    band: 'Critical' | 'High' | 'Medium' | 'Low';
    factors: { safety: number; affected: number; evidence: number; duration: number };
    modelVersion: string;
    computedAt: Date;
  };
  status: ComplaintStatus;
  departmentId?: Types.ObjectId;
  duplicateGroupId?: Types.ObjectId;
  supportCount: number;
  /** Cached machine translations of the description, keyed by target language. Originals are never altered. */
  translations?: Record<string, { text: string; model: string; at: Date; sourceHash: string }>;
  resolutionEvidence: { url: string; caption: string; uploadedAt: Date; uploadedBy: Types.ObjectId }[];
  externalSource?: { datasetName: string; sourceOrg: string; sourceUrl: string; licence: string; retrievedAt: Date };
  createdAt: Date;
  updatedAt: Date;
}

const factor = { type: Number, min: 0, max: 1, required: true };

const complaintSchema = new Schema<IComplaint>(
  {
    trackingId: { type: String, required: true, unique: true },
    reporterId: { type: Schema.Types.ObjectId, ref: 'User', required: true },
    provenance: { type: String, enum: PROVENANCES, default: 'CITIZEN', required: true },
    title: { type: String, required: true, trim: true, maxlength: 160 },
    description: { type: String, required: true, trim: true, maxlength: 4000 },
    language: { type: String, enum: ['en', 'te', 'hi'], default: 'en' },
    transcript: {
      text: String,
      language: { type: String, enum: ['en', 'te', 'hi'] },
      editedByUser: Boolean,
    },
    category: { type: String, enum: CATEGORIES, required: true },
    location: {
      address: { type: String, default: '', maxlength: 200 },
      area: { type: String, required: true, maxlength: 80 },
      ward: String,
      accuracy: { type: String, enum: LOCATION_ACCURACIES, default: 'map_pin' },
      geo: {
        type: { type: String, enum: ['Point'], default: 'Point', required: true },
        coordinates: { type: [Number], required: true },
      },
    },
    media: [
      {
        kind: { type: String, enum: ['image', 'audio'], required: true },
        filename: { type: String, required: true },
        url: { type: String, required: true },
        mime: { type: String, required: true },
        size: { type: Number, required: true },
        _id: false,
      },
    ],
    ai: {
      status: { type: String, enum: ['ok', 'fallback', 'failed'], required: true },
      isSimulated: { type: Boolean, required: true },
      model: String,
      category: { type: String, enum: CATEGORIES },
      keywords: [String],
      safetyRisks: [String],
      publicImpact: String,
      suggestedDepartment: String,
      suggestedPriority: { type: String, enum: ['Critical', 'High', 'Medium', 'Low'] },
      explanation: String,
      severityFactors: {
        safetyRisk: { type: String, enum: ['low', 'medium', 'high', 'critical'] },
        affectedPopulation: { type: String, enum: ['individual', 'street', 'neighbourhood', 'ward'] },
        infrastructureDamage: { type: String, enum: ['cosmetic', 'moderate', 'severe', 'collapsed'] },
      },
      confidence: { type: Number, min: 0, max: 1 },
      analysedAt: { type: Date, default: Date.now },
    },
    verified: {
      category: { type: String, enum: CATEGORIES },
      verifiedBy: { type: Schema.Types.ObjectId, ref: 'User' },
      verifiedAt: Date,
    },
    scoring: {
      total: { type: Number, min: 1, max: 100, required: true },
      band: { type: String, enum: ['Critical', 'High', 'Medium', 'Low'], required: true },
      factors: { safety: factor, affected: factor, evidence: factor, duration: factor },
      modelVersion: { type: String, required: true },
      computedAt: { type: Date, default: Date.now },
    },
    status: { type: String, enum: STATUSES, default: 'submitted', required: true },
    departmentId: { type: Schema.Types.ObjectId, ref: 'Department' },
    duplicateGroupId: { type: Schema.Types.ObjectId, ref: 'DuplicateGroup' },
    supportCount: { type: Number, default: 0, min: 0 },
    translations: { type: Schema.Types.Mixed },
    resolutionEvidence: [
      {
        url: { type: String, required: true },
        caption: { type: String, default: '', maxlength: 300 },
        uploadedAt: { type: Date, default: Date.now },
        uploadedBy: { type: Schema.Types.ObjectId, ref: 'User' },
        _id: false,
      },
    ],
    externalSource: {
      datasetName: String,
      sourceOrg: String,
      sourceUrl: String,
      licence: String,
      retrievedAt: Date,
    },
  },
  { timestamps: true },
);

complaintSchema.index({ 'location.geo': '2dsphere' });
complaintSchema.index({ status: 1, category: 1, createdAt: -1 });
complaintSchema.index({ provenance: 1, createdAt: -1 });
complaintSchema.index({ reporterId: 1, createdAt: -1 });
complaintSchema.index({ departmentId: 1, status: 1 });
complaintSchema.index({ duplicateGroupId: 1 });
complaintSchema.index({ 'scoring.total': -1 });
// Our `language` field holds 'te'/'hi' which MongoDB would treat as a text-index language override, so point the override elsewhere.
complaintSchema.index({ title: 'text', description: 'text' }, { default_language: 'none', language_override: 'textLanguage' });

export const Complaint = mongoose.model<IComplaint>('Complaint', complaintSchema);

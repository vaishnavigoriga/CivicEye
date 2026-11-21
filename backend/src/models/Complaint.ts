import mongoose, { Document, Schema } from 'mongoose';

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

export interface IComplaintMedia {
  type: 'image' | 'audio';
  url: string;
  mimeType: string;
  uploadedAt: Date;
}

export interface IComplaintTimeline {
  status: ComplaintStatus;
  note: string;
  updatedBy: mongoose.Types.ObjectId;
  timestamp: Date;
}

export interface IResolutionEvidence {
  url: string;
  caption: string;
  uploadedAt: Date;
}

export interface IAISeverityFactors {
  safetyRisk?: 'low' | 'medium' | 'high' | 'critical';
  affectedPopulation?: 'individual' | 'street' | 'neighbourhood' | 'ward';
  infrastructureDamage?: 'cosmetic' | 'moderate' | 'severe' | 'collapsed';
  publicHealthRisk?: boolean;
}

export interface IComplaint extends Document {
  referenceId: string;
  citizenId: mongoose.Types.ObjectId;
  title: string;
  description: string;
  language: 'en' | 'te' | 'hi';
  category: ComplaintCategory;
  location: {
    address: string;
    area: string;
    ward?: string;
    geo: {
      type: 'Point';
      coordinates: [number, number]; // [longitude, latitude] as per GeoJSON standard
    };
  };
  media: IComplaintMedia[];
  transcription?: {
    originalAudioUrl?: string;
    transcribedText?: string;
    transcriptionSource: 'gemini' | 'unavailable';
    language: 'en' | 'te' | 'hi';
  };
  aiAnalysis: {
    category: ComplaintCategory;
    aiSeverityRating: number; // 1 to 10 raw AI signal
    priorityScore: number;    // 1 to 100 calculated transparent score
    tags: string[];
    summary: string;
    detectedLanguage: 'en' | 'te' | 'hi';
    isSimulated: boolean;
    source: 'gemini' | 'mock';
    department?: string;
    severityFactors?: IAISeverityFactors;
    suggestedActions?: string[];
    confidence?: number;
    computedAt: Date;
  };
  duplicateGroupId?: string;
  duplicateStatus: 'unreviewed' | 'confirmed' | 'rejected';
  duplicateSimilarityScore?: number;
  department?: mongoose.Types.ObjectId;
  status: ComplaintStatus;
  timeline: IComplaintTimeline[];
  resolutionEvidence: IResolutionEvidence[];
  upvotes: number;
  upvotedBy: mongoose.Types.ObjectId[];
  dataSource: ComplaintDataSource;
  externalSourceAttribution?: {
    datasetName?: string;
    sourceOrg?: string;
    sourceUrl?: string;
    licence?: string;
  };
  createdAt: Date;
  updatedAt: Date;
}

const complaintSchema = new Schema<IComplaint>(
  {
    referenceId: {
      type: String,
      required: true,
      unique: true,
      index: true,
    },
    citizenId: { type: Schema.Types.ObjectId, ref: 'User', required: true },
    title: { type: String, required: true, trim: true },
    description: { type: String, required: true, trim: true },
    language: { type: String, enum: ['en', 'te', 'hi'], default: 'en' },
    category: {
      type: String,
      enum: ['Roads', 'Drainage', 'Electricity', 'Water Supply', 'Sanitation', 'Street Lights', 'Parks', 'Other'],
      required: true,
    },
    location: {
      address: { type: String, required: true },
      area: { type: String, required: true },
      ward: { type: String },
      geo: {
        type: {
          type: String,
          enum: ['Point'],
          required: true,
          default: 'Point',
        },
        coordinates: {
          type: [Number], // [lng, lat]
          required: true,
        },
      },
    },
    media: [
      {
        type: { type: String, enum: ['image', 'audio'], required: true },
        url: { type: String, required: true },
        mimeType: { type: String, required: true },
        uploadedAt: { type: Date, default: Date.now },
      },
    ],
    transcription: {
      originalAudioUrl: { type: String },
      transcribedText: { type: String },
      transcriptionSource: { type: String, enum: ['gemini', 'unavailable'] },
      language: { type: String, enum: ['en', 'te', 'hi'], default: 'en' },
    },
    aiAnalysis: {
      category: {
        type: String,
        enum: ['Roads', 'Drainage', 'Electricity', 'Water Supply', 'Sanitation', 'Street Lights', 'Parks', 'Other'],
        required: true,
      },
      aiSeverityRating: { type: Number, min: 1, max: 10, required: true },
      priorityScore: { type: Number, min: 1, max: 100, required: true },
      tags: [{ type: String }],
      summary: { type: String, required: true },
      detectedLanguage: { type: String, enum: ['en', 'te', 'hi'], default: 'en' },
      isSimulated: { type: Boolean, default: false },
      source: { type: String, enum: ['gemini', 'mock'], default: 'mock' },
      department: { type: String },
      severityFactors: {
        safetyRisk: { type: String, enum: ['low', 'medium', 'high', 'critical'] },
        affectedPopulation: { type: String, enum: ['individual', 'street', 'neighbourhood', 'ward'] },
        infrastructureDamage: { type: String, enum: ['cosmetic', 'moderate', 'severe', 'collapsed'] },
        publicHealthRisk: { type: Boolean },
      },
      suggestedActions: [{ type: String }],
      confidence: { type: Number, min: 0, max: 1 },
      computedAt: { type: Date, default: Date.now },
    },
    duplicateGroupId: { type: String, index: true },
    duplicateStatus: {
      type: String,
      enum: ['unreviewed', 'confirmed', 'rejected'],
      default: 'unreviewed',
    },
    duplicateSimilarityScore: { type: Number },
    department: { type: Schema.Types.ObjectId, ref: 'Department' },
    status: {
      type: String,
      enum: ['pending', 'assigned', 'in-progress', 'resolved', 'rejected'],
      default: 'pending',
      index: true,
    },
    timeline: [
      {
        status: { type: String, required: true },
        note: { type: String, required: true },
        updatedBy: { type: Schema.Types.ObjectId, ref: 'User', required: true },
        timestamp: { type: Date, default: Date.now },
      },
    ],
    resolutionEvidence: [
      {
        url: { type: String, required: true },
        caption: { type: String, default: '' },
        uploadedAt: { type: Date, default: Date.now },
      },
    ],
    upvotes: { type: Number, default: 0 },
    upvotedBy: [{ type: Schema.Types.ObjectId, ref: 'User' }],
    dataSource: {
      type: String,
      enum: ['CITIZEN_SUBMITTED', 'DEMO_SIMULATED', 'VERIFIED_EXTERNAL'],
      default: 'CITIZEN_SUBMITTED',
      index: true,
    },
    externalSourceAttribution: {
      datasetName: { type: String },
      sourceOrg: { type: String },
      sourceUrl: { type: String },
      licence: { type: String },
    },
  },
  {
    timestamps: true,
  }
);

// 2dsphere index for ultra-fast spatial search (500m radius queries)
complaintSchema.index({ 'location.geo': '2dsphere' });
complaintSchema.index({ category: 1, status: 1 });
complaintSchema.index({ citizenId: 1 });
complaintSchema.index({ dataSource: 1 });

export const Complaint = mongoose.model<IComplaint>('Complaint', complaintSchema);

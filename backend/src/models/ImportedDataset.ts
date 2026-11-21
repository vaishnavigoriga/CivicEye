import mongoose, { Document, Schema } from 'mongoose';

/**
 * Registry entry for an external (official) dataset. Imported figures are kept apart from citizen complaints
 * and stay hidden until a person approves them. Never claim a dataset without a real source and licence.
 */
export interface IImportedDataset extends Document {
  title: string;
  sourceOrg: string;
  sourceUrl: string;
  /** Exact licence string from the publisher, e.g. "Government Open Data License - India". */
  licence: string;
  retrievedAt: Date;
  /** Publisher's own modified / reference date, when known. */
  publishedAt?: Date;
  coverage: string;
  notes?: string;
  /** pending_review = stored but never shown. approved = shown, labelled with source. */
  status: 'pending_review' | 'approved';
  approvedAt?: Date;
  rowCount: number;
  createdAt: Date;
}

const schema = new Schema<IImportedDataset>(
  {
    title: { type: String, required: true, trim: true, maxlength: 200 },
    sourceOrg: { type: String, required: true, trim: true, maxlength: 200 },
    sourceUrl: { type: String, required: true, trim: true, maxlength: 500 },
    licence: { type: String, required: true, trim: true, maxlength: 200 },
    retrievedAt: { type: Date, required: true },
    publishedAt: Date,
    coverage: { type: String, required: true, maxlength: 300 },
    notes: { type: String, maxlength: 1000 },
    status: { type: String, enum: ['pending_review', 'approved'], default: 'pending_review' },
    approvedAt: Date,
    rowCount: { type: Number, default: 0 },
  },
  { timestamps: { createdAt: true, updatedAt: false } },
);

schema.index({ sourceUrl: 1, title: 1 }, { unique: true });

export const ImportedDataset = mongoose.model<IImportedDataset>('ImportedDataset', schema);

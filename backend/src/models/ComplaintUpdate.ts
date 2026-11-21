import mongoose, { Document, Schema, Types } from 'mongoose';

export type UpdateType = 'submitted' | 'status' | 'assignment' | 'comment' | 'verification' | 'evidence' | 'duplicate_review';

/** One row per event on a complaint. Replaces the embedded timeline and the old audit log. */
export interface IComplaintUpdate extends Document {
  complaintId: Types.ObjectId;
  actorId?: Types.ObjectId;
  actorRole: 'citizen' | 'admin' | 'system';
  type: UpdateType;
  fromStatus?: string;
  toStatus?: string;
  note: string;
  /** Only public updates are shown to citizens on the tracking page. */
  isPublic: boolean;
  meta?: Record<string, unknown>;
  createdAt: Date;
}

const schema = new Schema<IComplaintUpdate>(
  {
    complaintId: { type: Schema.Types.ObjectId, ref: 'Complaint', required: true },
    actorId: { type: Schema.Types.ObjectId, ref: 'User' },
    actorRole: { type: String, enum: ['citizen', 'admin', 'system'], required: true },
    type: {
      type: String,
      enum: ['submitted', 'status', 'assignment', 'comment', 'verification', 'evidence', 'duplicate_review'],
      required: true,
    },
    fromStatus: String,
    toStatus: String,
    note: { type: String, default: '', maxlength: 1000 },
    isPublic: { type: Boolean, default: false },
    meta: Schema.Types.Mixed,
  },
  { timestamps: { createdAt: true, updatedAt: false } },
);

schema.index({ complaintId: 1, createdAt: 1 });
schema.index({ actorId: 1, createdAt: -1 });

export const ComplaintUpdate = mongoose.model<IComplaintUpdate>('ComplaintUpdate', schema);

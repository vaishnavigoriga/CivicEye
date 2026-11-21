import mongoose, { Document, Schema, Types } from 'mongoose';

/** A suggested (never automatic) grouping of similar complaints. Members are always preserved. */
export interface IDuplicateGroup extends Document {
  primaryComplaintId: Types.ObjectId;
  memberIds: Types.ObjectId[];
  status: 'suggested' | 'confirmed' | 'rejected';
  maxScore: number;
  reviewedBy?: Types.ObjectId;
  reviewedAt?: Date;
  createdAt: Date;
}

const schema = new Schema<IDuplicateGroup>(
  {
    primaryComplaintId: { type: Schema.Types.ObjectId, ref: 'Complaint', required: true },
    memberIds: [{ type: Schema.Types.ObjectId, ref: 'Complaint' }],
    status: { type: String, enum: ['suggested', 'confirmed', 'rejected'], default: 'suggested' },
    maxScore: { type: Number, default: 0 },
    reviewedBy: { type: Schema.Types.ObjectId, ref: 'User' },
    reviewedAt: Date,
  },
  { timestamps: { createdAt: true, updatedAt: false } },
);

schema.index({ status: 1, createdAt: -1 });
schema.index({ memberIds: 1 });

export const DuplicateGroup = mongoose.model<IDuplicateGroup>('DuplicateGroup', schema);

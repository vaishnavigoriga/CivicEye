import mongoose, { Document, Schema, Types } from 'mongoose';

/** A citizen backing an existing complaint ("I am also affected"). One per user per complaint. */
export interface ISupport extends Document {
  complaintId: Types.ObjectId;
  userId: Types.ObjectId;
  createdAt: Date;
}

const schema = new Schema<ISupport>(
  {
    complaintId: { type: Schema.Types.ObjectId, ref: 'Complaint', required: true },
    userId: { type: Schema.Types.ObjectId, ref: 'User', required: true },
  },
  { timestamps: { createdAt: true, updatedAt: false } },
);

schema.index({ complaintId: 1, userId: 1 }, { unique: true });

export const Support = mongoose.model<ISupport>('Support', schema);

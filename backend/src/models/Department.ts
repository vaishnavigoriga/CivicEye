import mongoose, { Document, Schema } from 'mongoose';

export interface IDepartment extends Document {
  code: string;
  name: string;
  authority: 'GHMC' | 'HMWSSB' | 'TSSPDCL' | 'OTHER';
  description: string;
  categories: string[];
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
}

const schema = new Schema<IDepartment>(
  {
    code: { type: String, required: true, unique: true, uppercase: true, trim: true },
    name: { type: String, required: true, trim: true, maxlength: 120 },
    authority: { type: String, enum: ['GHMC', 'HMWSSB', 'TSSPDCL', 'OTHER'], default: 'OTHER' },
    description: { type: String, default: '', maxlength: 400 },
    categories: [String],
    isActive: { type: Boolean, default: true },
  },
  { timestamps: true },
);

export const Department = mongoose.model<IDepartment>('Department', schema);

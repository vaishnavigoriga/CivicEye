import mongoose, { Document, Schema } from 'mongoose';

export interface IDepartment extends Document {
  name: string;
  code: string;
  description: string;
  contactEmail: string;
  assignedComplaintsCount: number;
  createdAt: Date;
  updatedAt: Date;
}

const departmentSchema = new Schema<IDepartment>(
  {
    name: { type: String, required: true, trim: true },
    code: { type: String, required: true, unique: true, uppercase: true, trim: true },
    description: { type: String, required: true },
    contactEmail: { type: String, required: true, lowercase: true, trim: true },
    assignedComplaintsCount: { type: Number, default: 0 },
  },
  {
    timestamps: true,
  }
);

export const Department = mongoose.model<IDepartment>('Department', departmentSchema);

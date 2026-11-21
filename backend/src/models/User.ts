import mongoose, { Document, Schema } from 'mongoose';

export interface IUser extends Document {
  name: string;
  email: string;
  passwordHash: string;
  role: 'citizen' | 'admin';
  phone?: string;
  preferredLanguage: 'en' | 'te' | 'hi';
  createdAt: Date;
  updatedAt: Date;
}

const userSchema = new Schema<IUser>(
  {
    name: { type: String, required: true, trim: true },
    email: { type: String, required: true, unique: true, lowercase: true, trim: true },
    passwordHash: { type: String, required: true },
    role: { type: String, enum: ['citizen', 'admin'], default: 'citizen' },
    phone: { type: String, trim: true },
    preferredLanguage: { type: String, enum: ['en', 'te', 'hi'], default: 'en' },
  },
  {
    timestamps: true,
  }
);

export const User = mongoose.model<IUser>('User', userSchema);

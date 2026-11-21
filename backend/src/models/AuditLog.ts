import mongoose, { Document, Schema } from 'mongoose';

export interface IAuditLog extends Document {
  adminId: mongoose.Types.ObjectId;
  complaintId?: mongoose.Types.ObjectId;
  action: string;
  previousValue?: any;
  newValue?: any;
  details?: string;
  timestamp: Date;
}

const auditLogSchema = new Schema<IAuditLog>(
  {
    adminId: { type: Schema.Types.ObjectId, ref: 'User', required: true },
    complaintId: { type: Schema.Types.ObjectId, ref: 'Complaint' },
    action: { type: String, required: true },
    previousValue: { type: Schema.Types.Mixed },
    newValue: { type: Schema.Types.Mixed },
    details: { type: String },
    timestamp: { type: Date, default: Date.now },
  },
  {
    timestamps: false,
  }
);

auditLogSchema.index({ adminId: 1, timestamp: -1 });
auditLogSchema.index({ complaintId: 1 });

export const AuditLog = mongoose.model<IAuditLog>('AuditLog', auditLogSchema);

import mongoose, { Document, Schema, Types } from 'mongoose';

/** One row of an imported aggregate dataset (e.g. one Urban Local Body with its published counts). */
export interface IImportedAggregate extends Document {
  datasetId: Types.ObjectId;
  label: string;
  metrics: Record<string, number>;
}

const schema = new Schema<IImportedAggregate>({
  datasetId: { type: Schema.Types.ObjectId, ref: 'ImportedDataset', required: true, index: true },
  label: { type: String, required: true, trim: true, maxlength: 200 },
  metrics: { type: Schema.Types.Mixed, required: true },
});

export const ImportedAggregate = mongoose.model<IImportedAggregate>('ImportedAggregate', schema);

import { z } from 'zod';
import { ImportedDataset } from '../models/ImportedDataset';
import { ImportedAggregate } from '../models/ImportedAggregate';

/** Minimal RFC 4180 CSV parser (quoted fields, escaped quotes, CRLF). Returns rows of cells. */
export const parseCsv = (text: string): string[][] => {
  const rows: string[][] = [];
  let row: string[] = [];
  let cell = '';
  let quoted = false;
  const src = text.replace(/^﻿/, '');
  for (let i = 0; i < src.length; i++) {
    const ch = src[i];
    if (quoted) {
      if (ch === '"' && src[i + 1] === '"') { cell += '"'; i++; }
      else if (ch === '"') quoted = false;
      else cell += ch;
    } else if (ch === '"') quoted = true;
    else if (ch === ',') { row.push(cell); cell = ''; }
    else if (ch === '\n' || ch === '\r') {
      if (ch === '\r' && src[i + 1] === '\n') i++;
      row.push(cell); cell = '';
      if (row.some((c) => c.trim() !== '')) rows.push(row);
      row = [];
    } else cell += ch;
  }
  row.push(cell);
  if (row.some((c) => c.trim() !== '')) rows.push(row);
  return rows;
};

export const importMetaSchema = z.object({
  title: z.string().trim().min(3).max(200),
  sourceOrg: z.string().trim().min(2).max(200),
  sourceUrl: z.string().trim().url().max(500),
  licence: z.string().trim().min(2).max(200),
  retrievedAt: z.coerce.date(),
  publishedAt: z.coerce.date().optional(),
  coverage: z.string().trim().min(3).max(300),
  notes: z.string().trim().max(1000).optional(),
  /** CSV header of the column holding the row label (e.g. the ULB name). */
  labelColumn: z.string().min(1),
  /** CSV headers of the numeric columns to keep. A trailing % is accepted. */
  metricColumns: z.array(z.string().min(1)).min(1).max(20),
});
export type ImportMeta = z.infer<typeof importMetaSchema>;

const toNumber = (raw: string): number | null => {
  const cleaned = raw.replace(/[,%\s]/g, '');
  if (cleaned === '') return null;
  const n = Number(cleaned);
  return Number.isFinite(n) && n >= 0 ? n : null;
};

const MAX_ROWS = 5000;

/**
 * Imports an aggregate CSV published by an official body. Strict on purpose:
 * required source/licence/retrieval metadata, header validation, non-negative numbers only.
 * New imports are `pending_review` and invisible until approved by a person.
 */
export const importAggregateCsv = async (csv: string, metaInput: unknown, options: { approve?: boolean } = {}) => {
  const meta = importMetaSchema.parse(metaInput);
  const rows = parseCsv(csv);
  if (rows.length < 2) throw new Error('The CSV has no data rows.');
  if (rows.length - 1 > MAX_ROWS) throw new Error(`The CSV has more than ${MAX_ROWS} rows.`);

  const header = rows[0].map((h) => h.trim());
  const col = (name: string) => {
    const i = header.indexOf(name);
    if (i < 0) throw new Error(`Column "${name}" not found. Available columns: ${header.join(', ')}`);
    return i;
  };
  const labelIdx = col(meta.labelColumn);
  const metricIdx = meta.metricColumns.map((m) => [m, col(m)] as const);

  const records: { label: string; metrics: Record<string, number> }[] = [];
  const skipped: number[] = [];
  rows.slice(1).forEach((r, i) => {
    const label = (r[labelIdx] ?? '').trim();
    const metrics: Record<string, number> = {};
    for (const [name, idx] of metricIdx) {
      const n = toNumber(r[idx] ?? '');
      if (n !== null) metrics[name] = n;
    }
    if (!label || Object.keys(metrics).length === 0) skipped.push(i + 2);
    else records.push({ label, metrics });
  });
  if (records.length === 0) throw new Error('No valid rows were found.');

  const { labelColumn: _l, metricColumns: _m, ...datasetFields } = meta;
  const dataset = await ImportedDataset.findOneAndUpdate(
    { sourceUrl: meta.sourceUrl, title: meta.title },
    { ...datasetFields, rowCount: records.length, status: options.approve ? 'approved' : 'pending_review', approvedAt: options.approve ? new Date() : undefined },
    { upsert: true, new: true, setDefaultsOnInsert: true },
  );
  await ImportedAggregate.deleteMany({ datasetId: dataset._id });
  await ImportedAggregate.insertMany(records.map((r) => ({ datasetId: dataset._id, ...r })));
  return { dataset, imported: records.length, skippedRows: skipped };
};

export const setDatasetApproval = async (id: string, approved: boolean) =>
  ImportedDataset.findByIdAndUpdate(id, { status: approved ? 'approved' : 'pending_review', approvedAt: approved ? new Date() : undefined }, { new: true });

/** Approved datasets only, with their rows. Pending datasets are never exposed publicly. */
export const approvedDatasets = async () => {
  const datasets = await ImportedDataset.find({ status: 'approved' }).sort({ title: 1 });
  const out = [];
  for (const d of datasets) {
    const rows = await ImportedAggregate.find({ datasetId: d._id }).sort({ label: 1 }).limit(MAX_ROWS);
    out.push({
      id: String(d._id),
      title: d.title,
      sourceOrg: d.sourceOrg,
      sourceUrl: d.sourceUrl,
      licence: d.licence,
      retrievedAt: d.retrievedAt,
      publishedAt: d.publishedAt,
      coverage: d.coverage,
      notes: d.notes,
      rows: rows.map((r) => ({ label: r.label, metrics: r.metrics })),
    });
  }
  return out;
};

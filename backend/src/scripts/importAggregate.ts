/**
 * Imports an AGGREGATE official dataset (CSV) into CivicEye's separate "official figures" store.
 *
 *   npm run import:aggregate -- --csv path/to/file.csv --meta path/to/meta.json [--approve]
 *
 * meta.json example (every field is required unless marked optional):
 *   {
 *     "title": "Name exactly as published",
 *     "sourceOrg": "Publishing organisation",
 *     "sourceUrl": "https://… (the dataset page)",
 *     "licence": "Licence string exactly as published",
 *     "retrievedAt": "2026-11-21",
 *     "publishedAt": "2023-01-05",          (optional)
 *     "coverage": "What the data covers",
 *     "notes": "Anything a reader should know",   (optional)
 *     "labelColumn": "CSV header holding the row name",
 *     "metricColumns": ["CSV header 1", "CSV header 2"]
 *   }
 *
 * Without --approve the data is stored as "pending_review" and is NOT shown anywhere.
 * Only import data whose licence permits it. Do not scrape; use the publisher's downloadable file.
 */
import fs from 'fs';
import { connectDB, disconnectDB } from '../config/db';
import { importAggregateCsv } from '../services/officialDataService';

const arg = (name: string) => {
  const i = process.argv.indexOf(`--${name}`);
  return i >= 0 ? process.argv[i + 1] : undefined;
};

(async () => {
  const csvPath = arg('csv');
  const metaPath = arg('meta');
  if (!csvPath || !metaPath) {
    console.error('Usage: npm run import:aggregate -- --csv <file.csv> --meta <meta.json> [--approve]');
    process.exit(2);
  }
  await connectDB();
  const result = await importAggregateCsv(fs.readFileSync(csvPath, 'utf8'), JSON.parse(fs.readFileSync(metaPath, 'utf8')), { approve: process.argv.includes('--approve') });
  console.log(`Imported ${result.imported} rows into "${result.dataset.title}" (${result.dataset.status}).`);
  if (result.skippedRows.length) console.log(`Skipped rows (empty label or no numbers): ${result.skippedRows.join(', ')}`);
  await disconnectDB();
})().catch((e) => {
  console.error(e.message ?? e);
  process.exit(1);
});

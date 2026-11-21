import request from 'supertest';
import { app } from '../server';
import { connectDB, disconnectDB } from '../config/db';
import { ensureDepartments, seedDemoData } from '../services/seedService';
import { importAggregateCsv, parseCsv, setDatasetApproval } from '../services/officialDataService';
import { ImportedAggregate } from '../models/ImportedAggregate';
import { Complaint } from '../models/Complaint';

const API = '/api/v1';

// A made-up fixture used ONLY to test the importer. It is not real data and is never shipped as such.
const FIXTURE_CSV = 'ULB Name,Grievances Received,Grievances Completed,% Completion\r\n"Test Town, North",120,90,75%\r\nTest Town South,"1,000",800,80\r\n,5,5,100\r\nBad Row,n/a,,\r\n';
const META = {
  title: 'TEST FIXTURE: not real data',
  sourceOrg: 'Test Publisher',
  sourceUrl: 'https://example.org/dataset/test-fixture',
  licence: 'Test Licence',
  retrievedAt: '2026-11-21',
  coverage: 'Fictional rows for unit testing',
  labelColumn: 'ULB Name',
  metricColumns: ['Grievances Received', 'Grievances Completed', '% Completion'],
};

beforeAll(async () => {
  await connectDB();
  await ensureDepartments();
});
afterAll(async () => {
  await disconnectDB();
});

describe('CSV parsing', () => {
  it('handles quotes, commas inside quotes, CRLF and blank lines', () => {
    const rows = parseCsv('a,b\r\n"x, y",2\r\n\r\n"say ""hi""",3\r\n');
    expect(rows).toEqual([['a', 'b'], ['x, y', '2'], ['say "hi"', '3']]);
  });
});

describe('aggregate import', () => {
  it('rejects incomplete metadata and unknown columns', async () => {
    await expect(importAggregateCsv(FIXTURE_CSV, { ...META, licence: '' })).rejects.toThrow();
    await expect(importAggregateCsv(FIXTURE_CSV, { ...META, sourceUrl: 'not a url' })).rejects.toThrow();
    await expect(importAggregateCsv(FIXTURE_CSV, { ...META, labelColumn: 'Nope' })).rejects.toThrow(/Column "Nope" not found/);
    await expect(importAggregateCsv('only,header\r\n', META)).rejects.toThrow(/no data rows/);
  });

  it('keeps valid rows, skips bad ones, parses numbers and starts as pending_review', async () => {
    const r = await importAggregateCsv(FIXTURE_CSV, META);
    expect(r.dataset.status).toBe('pending_review');
    expect(r.imported).toBe(2);
    expect(r.skippedRows).toEqual([4, 5]);
    const rows = await ImportedAggregate.find({ datasetId: r.dataset._id }).sort({ label: 1 });
    expect(rows[0].label).toBe('Test Town South');
    expect(rows[0].metrics['Grievances Received']).toBe(1000);
    expect(rows[1].metrics['% Completion']).toBe(75);
  });

  it('never shows pending datasets publicly', async () => {
    const res = await request(app).get(`${API}/data-sources`);
    expect(res.status).toBe(200);
    expect(res.body.data.datasets).toHaveLength(0);
    expect(res.body.data.officialComplaintDataAvailable).toBe(false);
  });

  it('shows approved datasets with full attribution, separate from complaint statistics', async () => {
    const before = (await request(app).get(`${API}/complaints/analytics?scope=all`)).body.data.totals.total;
    const first = await importAggregateCsv(FIXTURE_CSV, META);
    await setDatasetApproval(String(first.dataset._id), true);

    const res = await request(app).get(`${API}/data-sources`);
    const d = res.body.data.datasets[0];
    expect(d).toMatchObject({ title: META.title, sourceOrg: META.sourceOrg, licence: META.licence, sourceUrl: META.sourceUrl });
    expect(d.retrievedAt).toBeTruthy();
    expect(d.rows).toHaveLength(2);
    // Aggregates are not complaints: no complaint statistic changes and nothing is counted as imported complaints.
    expect((await request(app).get(`${API}/complaints/analytics?scope=all`)).body.data.totals.total).toBe(before);
    expect(res.body.data.officialComplaintDataAvailable).toBe(false);

    await setDatasetApproval(String(first.dataset._id), false);
    expect((await request(app).get(`${API}/data-sources`)).body.data.datasets).toHaveLength(0);
  });

  it('re-importing the same dataset replaces its rows instead of duplicating them', async () => {
    const a = await importAggregateCsv(FIXTURE_CSV, META);
    const b = await importAggregateCsv(FIXTURE_CSV, META);
    expect(String(a.dataset._id)).toBe(String(b.dataset._id));
    expect(await ImportedAggregate.countDocuments({ datasetId: a.dataset._id })).toBe(2);
  });
});

describe('analytics transparency', () => {
  it('reports data composition and the localities actually present (no hardcoded list)', async () => {
    const empty = await request(app).get(`${API}/complaints/analytics?scope=citizen`);
    expect(empty.body.data.availableAreas).toEqual([]);
    expect(empty.body.data.composition).toEqual({ citizen: 0, demo: 0, importedOfficial: 0 });

    const n = await seedDemoData();
    const all = await request(app).get(`${API}/complaints/analytics?scope=all`);
    expect(all.body.data.composition.demo).toBe(n);
    expect(all.body.data.availableAreas.length).toBeGreaterThan(3);
    // Citizen scope stays empty even though demo records exist.
    const citizen = await request(app).get(`${API}/complaints/analytics?scope=citizen`);
    expect(citizen.body.data.totals.total).toBe(0);
    expect(citizen.body.data.composition.demo).toBe(n); // composition always shows everything stored
    expect(await Complaint.countDocuments({ provenance: 'IMPORTED_OFFICIAL' })).toBe(0);
  });
});

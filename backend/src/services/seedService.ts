import bcrypt from 'bcryptjs';
import crypto from 'crypto';
import { ENV } from '../config/env';
import { Department } from '../models/Department';
import { User } from '../models/User';
import { Complaint, ComplaintCategory, ComplaintStatus } from '../models/Complaint';
import { ComplaintUpdate } from '../models/ComplaintUpdate';
import { DuplicateGroup } from '../models/DuplicateGroup';
import { getNextSequence } from '../models/Counter';
import { AIService, DEPARTMENT_FOR_CATEGORY } from './aiService';
import { calculateScore } from './scoringService';
import { AREA_CENTRES } from '../utils/geo';
import { logger } from '../utils/logger';

export const BCRYPT_COST = 12;

/** Reference data: departments are descriptive labels only. No contact details are invented. */
const DEPARTMENTS = [
  { code: 'GHMC-ROADS', name: 'GHMC Roads & Infrastructure', authority: 'GHMC', categories: ['Roads', 'Public Infrastructure'] },
  { code: 'GHMC-DRAIN', name: 'GHMC Stormwater Drainage', authority: 'GHMC', categories: ['Drainage', 'Waterlogging'] },
  { code: 'GHMC-SANITATION', name: 'GHMC Sanitation & Solid Waste', authority: 'GHMC', categories: ['Sanitation'] },
  { code: 'GHMC-LIGHT', name: 'GHMC Street Lighting', authority: 'GHMC', categories: ['Street Lights'] },
  { code: 'HMWSSB-WATER', name: 'HMWSSB Water Supply & Sewerage', authority: 'HMWSSB', categories: ['Water Supply', 'Drainage'] },
  { code: 'TSSPDCL-ELEC', name: 'TSSPDCL Electricity Distribution', authority: 'TSSPDCL', categories: ['Electricity'] },
  { code: 'GHMC-GENERAL', name: 'General / Inter-departmental', authority: 'OTHER', categories: ['Other', 'Public Infrastructure'] },
] as const;

export const ensureDepartments = async (): Promise<void> => {
  for (const d of DEPARTMENTS) {
    await Department.updateOne({ code: d.code }, { $setOnInsert: { ...d, categories: [...d.categories] } }, { upsert: true });
  }
};

/** Creates the first administrator from ADMIN_EMAIL / ADMIN_PASSWORD. Never overwrites an existing account. */
export const bootstrapAdmin = async (email = ENV.ADMIN_EMAIL, password = ENV.ADMIN_PASSWORD, name = ENV.ADMIN_NAME): Promise<'created' | 'exists' | 'skipped'> => {
  if (!email || !password) return 'skipped';
  if (password.length < 12) throw new Error('ADMIN_PASSWORD must be at least 12 characters.');
  const existing = await User.findOne({ email: email.toLowerCase() });
  if (existing) return 'exists';
  await User.create({ name, email: email.toLowerCase(), passwordHash: await bcrypt.hash(password, BCRYPT_COST), role: 'admin' });
  logger.info(`Administrator account created for ${email}.`);
  return 'created';
};

interface DemoTemplate {
  text: string;
  category: ComplaintCategory;
  area: keyof typeof AREA_CENTRES;
  status: ComplaintStatus;
  language?: 'en' | 'te' | 'hi';
  ageDays: number;
  group?: string;
}

/** Entirely fictional demonstration records. They are always provenance DEMO with approximate locations. */
const DEMO: DemoTemplate[] = [
  { text: 'Large pothole near the bus stop, two-wheelers are swerving into traffic.', category: 'Roads', area: 'Banjara Hills', status: 'in_progress', ageDays: 6 },
  { text: 'Sewage overflowing from an open manhole onto the main road near the junction.', category: 'Drainage', area: 'Madhapur', status: 'assigned', ageDays: 4, group: 'A' },
  { text: 'Sewage is overflowing from the manhole on the main road, foul smell everywhere.', category: 'Drainage', area: 'Madhapur', status: 'submitted', ageDays: 2, group: 'A' },
  { text: 'Garbage has not been collected for a week and is piling up beside the lane.', category: 'Sanitation', area: 'Kukatpally', status: 'under_review', ageDays: 7 },
  { text: 'Street light has been off for several nights, the lane is completely dark.', category: 'Street Lights', area: 'Ameerpet', status: 'resolved', ageDays: 15 },
  { text: 'Loose electrical wire hanging low across the footpath after the storm.', category: 'Electricity', area: 'Secunderabad', status: 'assigned', ageDays: 1 },
  { text: 'Water pipeline leaking on the road, water has been running for two days.', category: 'Water Supply', area: 'Begumpet', status: 'in_progress', ageDays: 3 },
  { text: 'Road is waterlogged after rain and vehicles cannot pass.', category: 'Waterlogging', area: 'LB Nagar', status: 'submitted', ageDays: 1 },
  { text: 'Broken railing on the footbridge, a child could fall through.', category: 'Public Infrastructure', area: 'Charminar', status: 'under_review', ageDays: 9 },
  { text: 'జూబ్లీ హిల్స్ రోడ్డులో పెద్ద గుంత ఉంది, వాహనాలకు ప్రమాదం.', category: 'Roads', area: 'Jubilee Hills', status: 'submitted', language: 'te', ageDays: 2 },
  { text: 'हमारी गली में नाली का पानी सड़क पर बह रहा है।', category: 'Drainage', area: 'Hitech City', status: 'submitted', language: 'hi', ageDays: 3 },
  { text: 'Dustbin overflowing near the market entrance.', category: 'Sanitation', area: 'Secunderabad', status: 'resolved', ageDays: 20 },
  { text: 'Several street lights not working along the service road.', category: 'Street Lights', area: 'Kukatpally', status: 'rejected', ageDays: 12 },
  { text: 'Deep crater in the road, water collects and hides it at night.', category: 'Roads', area: 'Ameerpet', status: 'submitted', ageDays: 0 },
];

/** Deterministic small offset (<= ~250 m) so demo pins do not all stack on one point. */
const jitter = (i: number): [number, number] => [((i * 37) % 21 - 10) * 0.00022, ((i * 53) % 21 - 10) * 0.00022];

export const seedDemoData = async (): Promise<number> => {
  if (await Complaint.exists({ provenance: 'DEMO' })) return 0;

  const dept = Object.fromEntries((await Department.find()).map((d) => [d.code, d]));
  // Demo reporter cannot log in: inactive, with a random unguessable password.
  const reporter = await User.findOneAndUpdate(
    { email: 'demo-reporter@civiceye.invalid' },
    { $setOnInsert: { name: 'Demo Reporter (fictional)', passwordHash: await bcrypt.hash(crypto.randomBytes(24).toString('hex'), BCRYPT_COST), role: 'citizen', isActive: false } },
    { upsert: true, new: true },
  );

  const groups: Record<string, string[]> = {};
  const created: { id: any; group?: string }[] = [];

  for (let i = 0; i < DEMO.length; i++) {
    const t = DEMO[i];
    const [cLat, cLng] = AREA_CENTRES[t.area];
    const [dLat, dLng] = jitter(t.group === 'A' ? 0 : i);
    const createdAt = new Date(Date.now() - t.ageDays * 86_400_000);
    const ai = AIService.simulate(t.text, false);
    const score = calculateScore({ category: t.category, ...ai.severityFactors, hasImage: false, supportCount: 0, createdAt, closedAt: t.status === 'resolved' || t.status === 'rejected' ? new Date(createdAt.getTime() + 3 * 86_400_000) : undefined });
    const seq = await getNextSequence('demo');
    const deptCode = DEPARTMENT_FOR_CATEGORY[t.category];
    const assigned = ['assigned', 'in_progress', 'resolved'].includes(t.status) ? dept[deptCode]?._id : undefined;

    const c = await Complaint.create({
      trackingId: `CE-DEMO-${String(seq).padStart(6, '0')}`,
      reporterId: reporter!._id,
      provenance: 'DEMO',
      title: t.text.length > 80 ? `${t.text.slice(0, 77)}...` : t.text,
      description: t.text,
      language: t.language ?? 'en',
      category: t.category,
      location: { address: '', area: t.area, accuracy: 'area_approx', geo: { type: 'Point', coordinates: [cLng + dLng, cLat + dLat] } },
      ai: { ...ai, model: 'simulated', category: ai.category, analysedAt: createdAt },
      scoring: { total: score.total, band: score.band, factors: score.factors, modelVersion: score.modelVersion, computedAt: createdAt },
      status: t.status,
      departmentId: assigned,
      createdAt,
    });
    await ComplaintUpdate.create({ complaintId: c._id, actorRole: 'system', type: 'submitted', toStatus: 'submitted', note: 'Demonstration record created.', isPublic: true, createdAt });
    if (t.status !== 'submitted') {
      await ComplaintUpdate.create({ complaintId: c._id, actorRole: 'system', type: 'status', fromStatus: 'submitted', toStatus: t.status, note: 'Demonstration status.', isPublic: true, createdAt: new Date(createdAt.getTime() + 3_600_000) });
    }
    if (t.group) (groups[t.group] ??= []).push(String(c._id));
    created.push({ id: c._id, group: t.group });
  }

  for (const ids of Object.values(groups)) {
    const g = await DuplicateGroup.create({ primaryComplaintId: ids[0], memberIds: ids, maxScore: 0.8 });
    await Complaint.updateMany({ _id: { $in: ids } }, { duplicateGroupId: g._id });
  }

  logger.info(`Seeded ${created.length} DEMO complaints (fictional, approximate locations).`);
  return created.length;
};

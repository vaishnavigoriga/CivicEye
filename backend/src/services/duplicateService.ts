import { Types } from 'mongoose';
import { ENV } from '../config/env';
import { Complaint, IComplaint } from '../models/Complaint';
import { DuplicateGroup } from '../models/DuplicateGroup';
import { haversineMetres } from '../utils/geo';

export interface DuplicateCandidate {
  complaint: IComplaint;
  distanceMetres: number;
  textSimilarity: number;
  score: number;
}

const STOPWORDS = new Set([
  'the', 'is', 'at', 'on', 'in', 'a', 'an', 'and', 'or', 'to', 'of', 'for', 'with', 'near', 'from', 'by', 'it', 'my',
  'please', 'are', 'was', 'has', 'have', 'been', 'this', 'that', 'very', 'there',
]);

/** Unicode-aware word tokens. \p{M} keeps Telugu/Hindi vowel signs attached to their letters. */
export const tokenize = (text: string): string[] =>
  text
    .normalize('NFC')
    .toLowerCase()
    .split(/[^\p{L}\p{M}\p{N}]+/u)
    .filter((w) => w.length >= 2 && !STOPWORDS.has(w));

const trigrams = (text: string): Set<string> => {
  const s = ` ${tokenize(text).join(' ')} `;
  const out = new Set<string>();
  for (let i = 0; i <= s.length - 3; i++) out.add(s.slice(i, i + 3));
  return out;
};

const jaccard = (a: Set<string>, b: Set<string>): number => {
  if (a.size === 0 || b.size === 0) return 0;
  let inter = 0;
  a.forEach((x) => b.has(x) && inter++);
  return inter / (a.size + b.size - inter);
};

const dice = (a: Set<string>, b: Set<string>): number => {
  if (a.size === 0 || b.size === 0) return 0;
  let inter = 0;
  a.forEach((x) => b.has(x) && inter++);
  return (2 * inter) / (a.size + b.size);
};

/** 0-1 similarity of two descriptions: word overlap blended with character trigrams (robust for Indic scripts). */
export const textSimilarity = (a: string, b: string): number =>
  0.5 * jaccard(new Set(tokenize(a)), new Set(tokenize(b))) + 0.5 * dice(trigrams(a), trigrams(b));

/** Recent submissions count fully; older ones fade to 60% weight at the end of the lookback window. */
export const timeFactor = (createdAt: Date, now = new Date()): number => {
  const ageDays = (now.getTime() - createdAt.getTime()) / 86_400_000;
  return 1 - 0.4 * Math.min(1, Math.max(0, ageDays / ENV.DUPLICATE_LOOKBACK_DAYS));
};

/** Closer reports count more: 100% at the same spot, 70% at the edge of the radius. */
export const distanceFactor = (metres: number): number => 1 - 0.3 * Math.min(1, metres / ENV.DUPLICATE_RADIUS_METRES);

export const combinedScore = (text: number, metres: number, createdAt: Date, now = new Date()): number =>
  text * distanceFactor(metres) * timeFactor(createdAt, now);

/**
 * Finds open complaints that may describe the same problem: same category (when known), within the
 * configured radius (Haversine), recent, and with similar text. Demo records are never candidates.
 * Results are suggestions only; nothing is merged or deleted.
 */
export const findCandidates = async (params: {
  lat: number;
  lng: number;
  description: string;
  category?: string;
  excludeId?: Types.ObjectId;
  limit?: number;
}): Promise<DuplicateCandidate[]> => {
  const lookback = new Date(Date.now() - ENV.DUPLICATE_LOOKBACK_DAYS * 86_400_000);
  const query: Record<string, unknown> = {
    'location.geo': {
      $nearSphere: { $geometry: { type: 'Point', coordinates: [params.lng, params.lat] }, $maxDistance: ENV.DUPLICATE_RADIUS_METRES * 1.2 },
    },
    status: { $nin: ['resolved', 'rejected'] },
    provenance: { $ne: 'DEMO' },
    createdAt: { $gte: lookback },
  };
  if (params.category) query.category = params.category;
  if (params.excludeId) query._id = { $ne: params.excludeId };

  const nearby = await Complaint.find(query).limit(30);
  const out: DuplicateCandidate[] = [];
  for (const c of nearby) {
    const [cLng, cLat] = c.location.geo.coordinates;
    const metres = haversineMetres(params.lat, params.lng, cLat, cLng);
    if (metres > ENV.DUPLICATE_RADIUS_METRES) continue;
    const sim = textSimilarity(params.description, `${c.title} ${c.description}`);
    const score = combinedScore(sim, metres, c.createdAt);
    if (score >= ENV.DUPLICATE_SCORE_THRESHOLD) out.push({ complaint: c, distanceMetres: Math.round(metres), textSimilarity: sim, score });
  }
  return out.sort((a, b) => b.score - a.score).slice(0, params.limit ?? 5);
};

/** Links a new complaint to the best candidate's group (creating one if needed). Both complaints are kept. */
export const linkToGroup = async (newComplaint: IComplaint, best: DuplicateCandidate): Promise<void> => {
  const existing = best.complaint;
  let group = existing.duplicateGroupId ? await DuplicateGroup.findById(existing.duplicateGroupId) : null;
  if (!group) {
    group = await DuplicateGroup.create({ primaryComplaintId: existing._id, memberIds: [existing._id], maxScore: best.score });
    existing.duplicateGroupId = group._id as Types.ObjectId;
    await existing.save();
  }
  if (!group.memberIds.some((m) => m.equals(newComplaint._id as Types.ObjectId))) group.memberIds.push(newComplaint._id as Types.ObjectId);
  group.maxScore = Math.max(group.maxScore, best.score);
  if (group.status === 'rejected') group.status = 'suggested';
  await group.save();
  newComplaint.duplicateGroupId = group._id as Types.ObjectId;
  await newComplaint.save();
};

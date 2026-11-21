import { Request, Response } from 'express';
import { ENV } from '../config/env';
import { z } from 'zod';
import { Complaint, CATEGORIES, STATUSES, IComplaint } from '../models/Complaint';
import { ComplaintUpdate } from '../models/ComplaintUpdate';
import { DuplicateGroup } from '../models/DuplicateGroup';
import { Support } from '../models/Support';
import { getNextSequence } from '../models/Counter';
import { AIService } from '../services/aiService';
import { calculateScore } from '../services/scoringService';
import { findCandidates, linkToGroup } from '../services/duplicateService';
import { StorageService } from '../services/storageService';
import { computeAnalytics } from '../services/analyticsService';
import { escapeRegex, rescore, trackingIdFor } from '../services/complaintService';
import { hashText, translate } from '../services/speechService';
import { approvedDatasets } from '../services/officialDataService';
import { ownerComplaint, publicComplaint, publicUpdate } from '../services/serializers';
import { AppError, asyncHandler } from '../utils/errors';
import { isInHyderabad, nearestArea } from '../utils/geo';
import { sendSuccess } from '../utils/responseHelper';
import { getFile, validateUpload } from '../middleware/uploadMiddleware';

const bool = z.enum(['true', 'false']).transform((v) => v === 'true');

export const submitSchema = z.object({
  description: z.string().trim().min(15, 'Describe the problem in at least 15 characters').max(2000),
  title: z.string().trim().max(120).optional(),
  category: z.enum(CATEGORIES).optional(),
  latitude: z.coerce.number().min(-90).max(90),
  longitude: z.coerce.number().min(-180).max(180),
  locationAccuracy: z.enum(['gps', 'map_pin']).default('map_pin'),
  area: z.string().trim().max(80).optional(),
  address: z.string().trim().max(200).default(''),
  language: z.enum(['en', 'te', 'hi']).default('en'),
  transcriptText: z.string().trim().max(2000).optional(),
  transcriptEditedByUser: bool.optional(),
});

export const duplicateCheckSchema = z.object({
  description: z.string().trim().min(10).max(2000),
  latitude: z.coerce.number().min(-90).max(90),
  longitude: z.coerce.number().min(-180).max(180),
  category: z.enum(CATEGORIES).optional(),
});

export const listSchema = z.object({
  page: z.coerce.number().int().min(1).default(1),
  limit: z.coerce.number().int().min(1).max(50).default(12),
  search: z.string().trim().max(80).optional(),
  category: z.enum(CATEGORIES).optional(),
  status: z.enum(STATUSES).optional(),
  area: z.string().trim().max(80).optional(),
  includeDemo: z.enum(['true', 'false']).default('false').transform((v) => v === 'true'),
  sort: z.enum(['newest', 'priority']).default('newest'),
});

export const analyticsSchema = z.object({
  scope: z.enum(['citizen', 'all']).default('citizen'),
  category: z.enum(CATEGORIES).optional(),
  status: z.enum(STATUSES).optional(),
  area: z.string().trim().max(80).optional(),
  from: z.coerce.date().optional(),
  to: z.coerce.date().optional(),
});

const mapSchema = z.object({
  category: z.enum(CATEGORIES).optional(),
  status: z.enum(STATUSES).optional(),
  includeDemo: z.enum(['true', 'false']).default('false').transform((v) => v === 'true'),
});
export { mapSchema };

const findByTrackingId = async (trackingId: string) => {
  const c = await Complaint.findOne({ trackingId: trackingId.toUpperCase() }).populate('departmentId', 'code name');
  if (!c) throw new AppError(404, 'NOT_FOUND', 'No report found with that tracking ID.');
  return c;
};

export const submit = asyncHandler(async (req: Request, res: Response) => {
  const body = req.body as z.infer<typeof submitSchema>;
  const user = req.user!;

  if (!isInHyderabad(body.latitude, body.longitude)) {
    throw new AppError(400, 'LOCATION_OUTSIDE_REGION', 'The chosen location is outside the Greater Hyderabad region.', { latitude: 'Outside region' });
  }

  const image = validateUpload(getFile(req, 'image'), 'image');
  const audio = validateUpload(getFile(req, 'audio'), 'audio');

  const ai = await AIService.analyze({ description: body.description, image: image ? { buffer: image.buffer, mime: image.detected.mime } : undefined });
  // The citizen's own category choice wins; the AI suggestion is stored separately.
  const category = body.category ?? ai.category;

  const score = calculateScore({ category, ...ai.severityFactors, hasImage: !!image, supportCount: 0, createdAt: new Date() });
  const candidates = await findCandidates({ lat: body.latitude, lng: body.longitude, description: body.description, category });

  const media = [];
  if (image) media.push({ kind: 'image' as const, ...StorageService.save(image.buffer, image.detected, 'images') });
  if (audio) media.push({ kind: 'audio' as const, ...StorageService.save(audio.buffer, audio.detected, 'audio') });

  const seq = await getNextSequence('complaints');
  const firstLine = body.description.split(/\n/)[0];
  const complaint = await Complaint.create({
    trackingId: trackingIdFor(seq),
    reporterId: user._id,
    provenance: 'CITIZEN',
    title: body.title || (firstLine.length > 80 ? `${firstLine.slice(0, 77)}...` : firstLine),
    description: body.description,
    language: body.language,
    transcript: body.transcriptText ? { text: body.transcriptText, language: body.language, editedByUser: body.transcriptEditedByUser ?? true } : undefined,
    category,
    location: {
      address: body.address,
      area: body.area || nearestArea(body.latitude, body.longitude),
      accuracy: body.locationAccuracy,
      geo: { type: 'Point', coordinates: [body.longitude, body.latitude] },
    },
    media,
    ai: { ...ai, category: ai.status === 'failed' ? undefined : ai.category, analysedAt: new Date() },
    scoring: { total: score.total, band: score.band, factors: score.factors, modelVersion: score.modelVersion, computedAt: new Date() },
    status: 'submitted',
  });

  await ComplaintUpdate.create({ complaintId: complaint._id, actorId: user._id, actorRole: 'citizen', type: 'submitted', toStatus: 'submitted', note: 'Report submitted.', isPublic: true });

  if (candidates.length > 0) await linkToGroup(complaint, candidates[0]);

  sendSuccess(
    res,
    {
      complaint: ownerComplaint(complaint),
      duplicate: candidates.length
        ? { linked: true, related: candidates.map((c) => ({ complaint: publicComplaint(c.complaint), distanceMetres: c.distanceMetres, similarity: Number(c.score.toFixed(2)) })) }
        : null,
    },
    'Report submitted',
    201,
  );
});

/** Preview before submission: are there similar open reports nearby? Never blocks submission. */
export const checkDuplicates = asyncHandler(async (req: Request, res: Response) => {
  const b = req.body as z.infer<typeof duplicateCheckSchema>;
  const found = await findCandidates({ lat: b.latitude, lng: b.longitude, description: b.description, category: b.category });
  sendSuccess(res, {
    candidates: found.map((c) => ({
      complaint: publicComplaint(c.complaint),
      distanceMetres: c.distanceMetres,
      similarity: Number(c.score.toFixed(2)),
      isOwn: String(c.complaint.reporterId) === String(req.user!._id),
    })),
  });
});

const visibleProvenance = (includeDemo: boolean) => (includeDemo ? { $in: ['CITIZEN', 'DEMO', 'IMPORTED_OFFICIAL'] } : { $in: ['CITIZEN', 'IMPORTED_OFFICIAL'] });

export const list = asyncHandler(async (req: Request, res: Response) => {
  const q = req.query as unknown as z.infer<typeof listSchema>;
  const filter: Record<string, unknown> = { provenance: visibleProvenance(q.includeDemo) };
  if (q.category) filter.category = q.category;
  if (q.status) filter.status = q.status;
  if (q.area) filter['location.area'] = q.area;
  if (q.search) {
    const rx = new RegExp(escapeRegex(q.search), 'i');
    filter.$or = [{ trackingId: rx }, { title: rx }, { description: rx }, { 'location.area': rx }];
  }
  const sort: Record<string, 1 | -1> = q.sort === 'priority' ? { 'scoring.total': -1, createdAt: -1 } : { createdAt: -1 };

  const [items, total] = await Promise.all([
    Complaint.find(filter).populate('departmentId', 'code name').sort(sort).skip((q.page - 1) * q.limit).limit(q.limit),
    Complaint.countDocuments(filter),
  ]);
  sendSuccess(res, { items: items.map((c) => publicComplaint(c)), pagination: { total, page: q.page, limit: q.limit, totalPages: Math.max(1, Math.ceil(total / q.limit)) } });
});

export const getOne = asyncHandler(async (req: Request, res: Response) => {
  const c = await findByTrackingId(String(req.params.trackingId));
  const [updates, supported, group] = await Promise.all([
    ComplaintUpdate.find({ complaintId: c._id, isPublic: true }).sort({ createdAt: 1 }),
    req.user ? Support.exists({ complaintId: c._id, userId: req.user._id }) : null,
    c.duplicateGroupId ? DuplicateGroup.findById(c.duplicateGroupId) : null,
  ]);

  let related: { trackingId: string; title: string; status: string }[] = [];
  if (group && group.status !== 'rejected') {
    const others = await Complaint.find({ _id: { $in: group.memberIds, $ne: c._id }, provenance: c.provenance }).select('trackingId title status').limit(5);
    related = others.map((o) => ({ trackingId: o.trackingId, title: o.title, status: o.status }));
  }
  const isOwner = req.user && String(req.user._id) === String(c.reporterId);
  sendSuccess(res, {
    complaint: isOwner ? { ...ownerComplaint(c), hasSupported: !!supported } : publicComplaint(c, { hasSupported: !!supported }),
    updates: updates.map(publicUpdate),
    related,
  });
});

export const mine = asyncHandler(async (req: Request, res: Response) => {
  const items = await Complaint.find({ reporterId: req.user!._id }).populate('departmentId', 'code name').sort({ createdAt: -1 }).limit(100);
  sendSuccess(res, { items: items.map(ownerComplaint) });
});

const supportChange = (add: boolean) =>
  asyncHandler(async (req: Request, res: Response) => {
    const c = await findByTrackingId(String(req.params.trackingId));
    if (String(c.reporterId) === String(req.user!._id)) {
      throw new AppError(400, 'CONFLICT', 'You cannot support your own report.');
    }
    if (c.status === 'rejected' || c.status === 'resolved') throw new AppError(409, 'CONFLICT', 'This report is closed.');
    if (add) {
      await Support.updateOne({ complaintId: c._id, userId: req.user!._id }, { $setOnInsert: { complaintId: c._id, userId: req.user!._id } }, { upsert: true });
    } else {
      await Support.deleteOne({ complaintId: c._id, userId: req.user!._id });
    }
    c.supportCount = await Support.countDocuments({ complaintId: c._id });
    rescore(c as IComplaint);
    await c.save();
    sendSuccess(res, { supportCount: c.supportCount, hasSupported: add, priority: { score: c.scoring.total, band: c.scoring.band } });
  });

export const addSupport = supportChange(true);
export const removeSupport = supportChange(false);

export const mapPoints = asyncHandler(async (req: Request, res: Response) => {
  const q = req.query as unknown as z.infer<typeof mapSchema>;
  const filter: Record<string, unknown> = { provenance: visibleProvenance(q.includeDemo) };
  if (q.category) filter.category = q.category;
  if (q.status) filter.status = q.status;
  const items = await Complaint.find(filter).select('trackingId title category status scoring location provenance').sort({ createdAt: -1 }).limit(2000);
  sendSuccess(res, {
    points: items.map((c) => ({
      id: String(c._id),
      trackingId: c.trackingId,
      title: c.title,
      category: c.category,
      status: c.status,
      priority: { score: c.scoring.total, band: c.scoring.band },
      area: c.location.area,
      accuracy: c.location.accuracy,
      provenance: c.provenance,
      lat: c.location.geo.coordinates[1],
      lng: c.location.geo.coordinates[0],
    })),
    total: items.length,
  });
});

/** GET /data-sources: what the platform's data is made of, plus any APPROVED official aggregate datasets. */
export const dataSources = asyncHandler(async (_req: Request, res: Response) => {
  const [citizen, demo, imported] = await Promise.all([
    Complaint.countDocuments({ provenance: 'CITIZEN' }),
    Complaint.countDocuments({ provenance: 'DEMO' }),
    Complaint.countDocuments({ provenance: 'IMPORTED_OFFICIAL' }),
  ]);
  sendSuccess(res, {
    composition: { citizen, demo, importedOfficial: imported },
    officialComplaintDataAvailable: imported > 0,
    datasets: await approvedDatasets(),
    researchedOn: '2026-11-21',
  });
});

export const analytics = asyncHandler(async (req: Request, res: Response) => {
  sendSuccess(res, await computeAnalytics(req.query as unknown as z.infer<typeof analyticsSchema>));
});

export const translateSchema = z.object({ target: z.enum(['en', 'te', 'hi']) });

/**
 * Machine translation of the report description on request. The original text is never changed;
 * results are cached per target language until the description changes.
 */
export const translateComplaint = asyncHandler(async (req: Request, res: Response) => {
  const { target } = req.body as z.infer<typeof translateSchema>;
  const c = await findByTrackingId(String(req.params.trackingId));
  const hash = hashText(c.description);
  const cached = c.translations?.[target];
  if (cached && cached.sourceHash === hash) {
    sendSuccess(res, { target, text: cached.text, model: cached.model, cached: true });
    return;
  }
  const text = await translate(c.description, target);
  c.translations = { ...(c.translations ?? {}), [target]: { text, model: ENV.GEMINI_MODEL, at: new Date(), sourceHash: hash } };
  c.markModified('translations');
  await c.save();
  sendSuccess(res, { target, text, model: ENV.GEMINI_MODEL, cached: false });
});

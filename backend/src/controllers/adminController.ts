import { Request, Response } from 'express';
import { z } from 'zod';
import { Types } from 'mongoose';
import { Complaint, CATEGORIES, STATUSES, IComplaint, ComplaintStatus } from '../models/Complaint';
import { ComplaintUpdate, UpdateType } from '../models/ComplaintUpdate';
import { DuplicateGroup } from '../models/DuplicateGroup';
import { Department } from '../models/Department';
import { StorageService } from '../services/storageService';
import { escapeRegex, rescore } from '../services/complaintService';
import { adminComplaint, adminUpdate, publicComplaint } from '../services/serializers';
import { AppError, asyncHandler } from '../utils/errors';
import { sendSuccess } from '../utils/responseHelper';
import { getFile, validateUpload } from '../middleware/uploadMiddleware';

export const adminListSchema = z.object({
  page: z.coerce.number().int().min(1).default(1),
  limit: z.coerce.number().int().min(1).max(100).default(20),
  search: z.string().trim().max(80).optional(),
  status: z.enum(STATUSES).optional(),
  category: z.enum(CATEGORIES).optional(),
  departmentId: z.string().regex(/^[0-9a-f]{24}$/).optional(),
  unassigned: z.enum(['true', 'false']).optional(),
  provenance: z.enum(['citizen', 'demo', 'all']).default('all'),
  duplicatesOnly: z.enum(['true', 'false']).optional(),
  sort: z.enum(['newest', 'priority']).default('newest'),
});

export const statusSchema = z.object({
  status: z.enum(STATUSES),
  note: z.string().trim().max(1000).default(''),
  isPublic: z.boolean().default(true),
});
export const assignSchema = z.object({ departmentId: z.string().regex(/^[0-9a-f]{24}$/), note: z.string().trim().max(1000).default('') });
export const verifySchema = z.object({ category: z.enum(CATEGORIES), note: z.string().trim().max(1000).default('') });
export const commentSchema = z.object({ note: z.string().trim().min(1).max(1000), isPublic: z.boolean().default(false) });
export const evidenceSchema = z.object({ caption: z.string().trim().max(300).default('') });
export const duplicateReviewSchema = z.object({ decision: z.enum(['confirmed', 'rejected']) });
export const departmentSchema = z.object({
  code: z.string().trim().toUpperCase().regex(/^[A-Z0-9-]{3,24}$/),
  name: z.string().trim().min(3).max(120),
  authority: z.enum(['GHMC', 'HMWSSB', 'TSSPDCL', 'OTHER']).default('OTHER'),
  description: z.string().trim().max(400).default(''),
  categories: z.array(z.enum(CATEGORIES)).default([]),
  isActive: z.boolean().default(true),
});

const findComplaint = async (trackingId: string) => {
  const c = await Complaint.findOne({ trackingId: trackingId.toUpperCase() });
  if (!c) throw new AppError(404, 'NOT_FOUND', 'No report found with that tracking ID.');
  return c;
};

const log = (c: IComplaint, req: Request, type: UpdateType, note: string, isPublic: boolean, extra: Partial<{ fromStatus: string; toStatus: string; meta: Record<string, unknown> }> = {}) =>
  ComplaintUpdate.create({ complaintId: c._id, actorId: req.user!._id, actorRole: 'admin', type, note, isPublic, ...extra });

export const list = asyncHandler(async (req: Request, res: Response) => {
  const q = req.query as unknown as z.infer<typeof adminListSchema>;
  const filter: Record<string, unknown> = {};
  if (q.provenance === 'citizen') filter.provenance = 'CITIZEN';
  if (q.provenance === 'demo') filter.provenance = 'DEMO';
  if (q.status) filter.status = q.status;
  if (q.category) filter.category = q.category;
  if (q.departmentId) filter.departmentId = new Types.ObjectId(q.departmentId);
  if (q.unassigned === 'true') filter.departmentId = { $exists: false };
  if (q.duplicatesOnly === 'true') filter.duplicateGroupId = { $exists: true };
  if (q.search) {
    const rx = new RegExp(escapeRegex(q.search), 'i');
    filter.$or = [{ trackingId: rx }, { title: rx }, { description: rx }, { 'location.area': rx }];
  }
  const sort: Record<string, 1 | -1> = q.sort === 'priority' ? { 'scoring.total': -1, createdAt: -1 } : { createdAt: -1 };
  const [items, total] = await Promise.all([
    Complaint.find(filter).populate('reporterId', 'name email phone').populate('departmentId', 'code name').sort(sort).skip((q.page - 1) * q.limit).limit(q.limit),
    Complaint.countDocuments(filter),
  ]);
  sendSuccess(res, { items: items.map(adminComplaint), pagination: { total, page: q.page, limit: q.limit, totalPages: Math.max(1, Math.ceil(total / q.limit)) } });
});

export const getOne = asyncHandler(async (req: Request, res: Response) => {
  const c = await Complaint.findOne({ trackingId: String(req.params.trackingId).toUpperCase() }).populate('reporterId', 'name email phone').populate('departmentId', 'code name');
  if (!c) throw new AppError(404, 'NOT_FOUND', 'No report found with that tracking ID.');
  const [updates, group] = await Promise.all([
    ComplaintUpdate.find({ complaintId: c._id }).populate('actorId', 'name').sort({ createdAt: 1 }),
    c.duplicateGroupId ? DuplicateGroup.findById(c.duplicateGroupId) : null,
  ]);
  const members = group ? await Complaint.find({ _id: { $in: group.memberIds } }).populate('departmentId', 'code name') : [];
  sendSuccess(res, {
    complaint: adminComplaint(c),
    updates: updates.map(adminUpdate),
    duplicateGroup: group ? { id: String(group._id), status: group.status, maxScore: group.maxScore, members: members.map((m) => publicComplaint(m)) } : null,
  });
});

export const updateStatus = asyncHandler(async (req: Request, res: Response) => {
  const b = req.body as z.infer<typeof statusSchema>;
  const c = await findComplaint(String(req.params.trackingId));
  if (c.status === b.status) throw new AppError(409, 'CONFLICT', 'The report already has this status.');
  if (b.status === 'rejected' && !b.note) throw new AppError(400, 'VALIDATION_ERROR', 'A reason is required to reject a report.', { note: 'A reason is required' });
  const from = c.status;
  c.status = b.status as ComplaintStatus;
  await c.save(); // sets updatedAt before rescoring so closed duration is measured to now
  rescore(c);
  await c.save();
  await log(c, req, 'status', b.note, b.isPublic, { fromStatus: from, toStatus: b.status });
  sendSuccess(res, { status: c.status, priority: { score: c.scoring.total, band: c.scoring.band } }, 'Status updated');
});

export const assign = asyncHandler(async (req: Request, res: Response) => {
  const b = req.body as z.infer<typeof assignSchema>;
  const c = await findComplaint(String(req.params.trackingId));
  const dept = await Department.findOne({ _id: b.departmentId, isActive: true });
  if (!dept) throw new AppError(404, 'NOT_FOUND', 'Department not found.');
  c.departmentId = dept._id as Types.ObjectId;
  const from = c.status;
  if (c.status === 'submitted' || c.status === 'under_review') c.status = 'assigned';
  await c.save();
  await log(c, req, 'assignment', b.note || `Assigned to ${dept.name}.`, true, { fromStatus: from, toStatus: c.status, meta: { departmentCode: dept.code } });
  sendSuccess(res, { status: c.status, department: { code: dept.code, name: dept.name } }, 'Department assigned');
});

export const verifyCategory = asyncHandler(async (req: Request, res: Response) => {
  const b = req.body as z.infer<typeof verifySchema>;
  const c = await findComplaint(String(req.params.trackingId));
  const previous = c.verified?.category ?? c.category;
  c.verified = { category: b.category, verifiedBy: req.user!._id as Types.ObjectId, verifiedAt: new Date() };
  rescore(c);
  await c.save();
  await log(c, req, 'verification', b.note || `Category verified as ${b.category}.`, false, { meta: { from: previous, to: b.category } });
  sendSuccess(res, { category: b.category }, 'Category verified');
});

export const addComment = asyncHandler(async (req: Request, res: Response) => {
  const b = req.body as z.infer<typeof commentSchema>;
  const c = await findComplaint(String(req.params.trackingId));
  await log(c, req, 'comment', b.note, b.isPublic);
  sendSuccess(res, null, 'Comment added', 201);
});

export const uploadEvidence = asyncHandler(async (req: Request, res: Response) => {
  const b = req.body as z.infer<typeof evidenceSchema>;
  const c = await findComplaint(String(req.params.trackingId));
  const file = validateUpload(getFile(req, 'evidence'), 'image');
  if (!file) throw new AppError(400, 'FILE_INVALID', 'An image file is required.');
  const stored = StorageService.save(file.buffer, file.detected, 'evidence');
  c.resolutionEvidence.push({ url: stored.url, caption: b.caption, uploadedAt: new Date(), uploadedBy: req.user!._id as Types.ObjectId });
  await c.save();
  await log(c, req, 'evidence', b.caption || 'Resolution evidence uploaded.', true);
  sendSuccess(res, { url: stored.url }, 'Evidence uploaded', 201);
});

export const listDuplicates = asyncHandler(async (_req: Request, res: Response) => {
  const groups = await DuplicateGroup.find({ status: { $in: ['suggested', 'confirmed'] } }).sort({ createdAt: -1 }).limit(100);
  const out = [];
  for (const g of groups) {
    const members = await Complaint.find({ _id: { $in: g.memberIds } }).populate('departmentId', 'code name');
    out.push({ id: String(g._id), status: g.status, maxScore: g.maxScore, createdAt: g.createdAt, members: members.map((m) => publicComplaint(m)) });
  }
  sendSuccess(res, { groups: out });
});

/** Confirm or reject a suggested grouping. Rejecting only removes the link; no complaint is ever deleted. */
export const reviewDuplicate = asyncHandler(async (req: Request, res: Response) => {
  const { decision } = req.body as z.infer<typeof duplicateReviewSchema>;
  const g = await DuplicateGroup.findById(req.params.id);
  if (!g) throw new AppError(404, 'NOT_FOUND', 'Group not found.');
  g.status = decision;
  g.reviewedBy = req.user!._id as Types.ObjectId;
  g.reviewedAt = new Date();
  await g.save();
  if (decision === 'rejected') await Complaint.updateMany({ _id: { $in: g.memberIds } }, { $unset: { duplicateGroupId: 1 } });
  for (const id of g.memberIds) {
    await ComplaintUpdate.create({ complaintId: id, actorId: req.user!._id, actorRole: 'admin', type: 'duplicate_review', note: `Duplicate suggestion ${decision}.`, isPublic: false });
  }
  sendSuccess(res, { status: g.status }, 'Duplicate review saved');
});

export const workload = asyncHandler(async (_req: Request, res: Response) => {
  const rows = await Complaint.aggregate([
    { $match: { provenance: { $ne: 'DEMO' } } },
    { $group: { _id: { dept: '$departmentId', status: '$status' }, count: { $sum: 1 } } },
  ]);
  const depts = await Department.find({ isActive: true }).sort({ code: 1 });
  const byDept = depts.map((d) => {
    const mine = rows.filter((r) => r._id.dept && String(r._id.dept) === String(d._id));
    const n = (s: string) => mine.find((r) => r._id.status === s)?.count ?? 0;
    return { id: String(d._id), code: d.code, name: d.name, assigned: n('assigned'), inProgress: n('in_progress'), resolved: n('resolved'), open: n('assigned') + n('in_progress') };
  });
  const unassigned = rows.filter((r) => !r._id.dept && !['resolved', 'rejected'].includes(r._id.status)).reduce((s, r) => s + r.count, 0);
  sendSuccess(res, { departments: byDept, unassigned });
});

export const listDepartments = asyncHandler(async (_req: Request, res: Response) => {
  sendSuccess(res, { departments: await Department.find().sort({ code: 1 }) });
});

export const createDepartment = asyncHandler(async (req: Request, res: Response) => {
  sendSuccess(res, { department: await Department.create(req.body) }, 'Department created', 201);
});

export const updateDepartment = asyncHandler(async (req: Request, res: Response) => {
  const d = await Department.findByIdAndUpdate(req.params.id, req.body, { new: true, runValidators: true });
  if (!d) throw new AppError(404, 'NOT_FOUND', 'Department not found.');
  sendSuccess(res, { department: d }, 'Department updated');
});

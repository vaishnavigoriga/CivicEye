import { IComplaint } from '../models/Complaint';
import { IComplaintUpdate } from '../models/ComplaintUpdate';

/**
 * Explicit allow-list serialisers. Public output NEVER contains reporter identity, supporter lists,
 * internal admin notes, admin identities or private audio.
 */
const departmentOf = (c: any) =>
  c.departmentId && typeof c.departmentId === 'object' && 'code' in c.departmentId ? { code: c.departmentId.code, name: c.departmentId.name } : null;

export const publicComplaint = (c: IComplaint, opts: { hasSupported?: boolean } = {}) => ({
  id: String(c._id),
  trackingId: c.trackingId,
  provenance: c.provenance,
  title: c.title,
  description: c.description,
  language: c.language,
  category: c.verified?.category ?? c.category,
  categoryVerified: !!c.verified?.category,
  location: {
    address: c.location.address,
    area: c.location.area,
    ward: c.location.ward,
    accuracy: c.location.accuracy,
    coordinates: [c.location.geo.coordinates[1], c.location.geo.coordinates[0]] as [number, number], // [lat, lng]
  },
  images: c.media.filter((m) => m.kind === 'image').map((m) => ({ url: m.url })),
  hasAudio: c.media.some((m) => m.kind === 'audio'),
  ai: {
    status: c.ai.status,
    isSimulated: c.ai.isSimulated,
    keywords: c.ai.keywords,
    explanation: c.ai.explanation,
    publicImpact: c.ai.publicImpact,
    suggestedDepartment: c.ai.suggestedDepartment,
    suggestedCategory: c.ai.status === 'failed' ? undefined : c.ai.category,
    model: c.ai.model,
  },
  priority: { score: c.scoring.total, band: c.scoring.band, modelVersion: c.scoring.modelVersion, factors: c.scoring.factors },
  status: c.status,
  department: departmentOf(c),
  supportCount: c.supportCount,
  hasSupported: opts.hasSupported ?? false,
  hasDuplicateGroup: !!c.duplicateGroupId,
  resolutionEvidence: c.resolutionEvidence.map((e) => ({ url: e.url, caption: e.caption, uploadedAt: e.uploadedAt })),
  externalSource: c.provenance === 'IMPORTED_OFFICIAL' ? c.externalSource : undefined,
  createdAt: c.createdAt,
  updatedAt: c.updatedAt,
});

/** The reporter's own view: public data plus their audio and transcript. */
export const ownerComplaint = (c: IComplaint) => ({
  ...publicComplaint(c),
  audio: c.media.filter((m) => m.kind === 'audio').map((m) => ({ url: m.url })),
  transcript: c.transcript?.text ? c.transcript : undefined,
});

export const publicUpdate = (u: IComplaintUpdate) => ({
  type: u.type,
  fromStatus: u.fromStatus,
  toStatus: u.toStatus,
  note: u.note,
  actorRole: u.actorRole,
  createdAt: u.createdAt,
});

/** Admin view: everything, including reporter contact details and internal updates. */
export const adminComplaint = (c: any) => ({
  ...ownerComplaint(c),
  reporter: c.reporterId && typeof c.reporterId === 'object' && 'email' in c.reporterId
    ? { id: String(c.reporterId._id), name: c.reporterId.name, email: c.reporterId.email, phone: c.reporterId.phone }
    : { id: String(c.reporterId) },
  aiFull: c.ai,
  verified: c.verified,
  duplicateGroupId: c.duplicateGroupId ? String(c.duplicateGroupId._id ?? c.duplicateGroupId) : undefined,
});

export const adminUpdate = (u: any) => ({
  id: String(u._id),
  type: u.type,
  fromStatus: u.fromStatus,
  toStatus: u.toStatus,
  note: u.note,
  isPublic: u.isPublic,
  actorRole: u.actorRole,
  actor: u.actorId && typeof u.actorId === 'object' && 'name' in u.actorId ? { id: String(u.actorId._id), name: u.actorId.name } : undefined,
  createdAt: u.createdAt,
});

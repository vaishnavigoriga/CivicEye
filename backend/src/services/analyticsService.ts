import { Complaint } from '../models/Complaint';
import { Department } from '../models/Department';

export interface AnalyticsFilters {
  scope: 'citizen' | 'all';
  category?: string;
  status?: string;
  area?: string;
  from?: Date;
  to?: Date;
}

const OPEN = ['submitted', 'under_review', 'assigned', 'in_progress'];

/**
 * All public statistics are computed from stored complaints. Nothing is hardcoded, and no
 * response-time or resolution-rate figures are produced because they are not yet supported by verified data.
 * scope "citizen" counts only reports submitted in this app; "all" also includes DEMO records.
 */
export const computeAnalytics = async (f: AnalyticsFilters) => {
  const match: Record<string, unknown> = {};
  match.provenance = f.scope === 'citizen' ? 'CITIZEN' : { $in: ['CITIZEN', 'DEMO', 'IMPORTED_OFFICIAL'] };
  if (f.category) match.category = f.category;
  if (f.status) match.status = f.status;
  if (f.area) match['location.area'] = f.area;
  if (f.from || f.to) match.createdAt = { ...(f.from ? { $gte: f.from } : {}), ...(f.to ? { $lte: f.to } : {}) };

  // Locality names present in this scope (ignoring the area filter) so the UI never hardcodes a list.
  const { 'location.area': _areaFilter, ...areaMatch } = match;
  const [areas, provenanceRows] = await Promise.all([
    Complaint.distinct('location.area', areaMatch),
    Complaint.aggregate([{ $group: { _id: '$provenance', count: { $sum: 1 } } }]),
  ]);

  const [facets] = await Complaint.aggregate([
    { $match: match },
    {
      $facet: {
        byStatus: [{ $group: { _id: '$status', count: { $sum: 1 } } }],
        byCategory: [{ $group: { _id: '$category', count: { $sum: 1 } } }, { $sort: { count: -1 } }],
        byArea: [{ $group: { _id: '$location.area', count: { $sum: 1 } } }, { $sort: { count: -1 } }, { $limit: 10 }],
        byPriority: [{ $group: { _id: '$scoring.band', count: { $sum: 1 } } }],
        trend: [
          { $group: { _id: { $dateToString: { format: '%Y-%m-%d', date: '$createdAt' } }, count: { $sum: 1 } } },
          { $sort: { _id: 1 } },
        ],
        byDepartment: [
          { $match: { departmentId: { $exists: true } } },
          {
            $group: {
              _id: '$departmentId',
              total: { $sum: 1 },
              open: { $sum: { $cond: [{ $in: ['$status', OPEN] }, 1, 0] } },
            },
          },
        ],
        total: [{ $count: 'n' }],
      },
    },
  ]);

  const statusCount = (s: string) => facets.byStatus.find((x: any) => x._id === s)?.count ?? 0;
  const total = facets.total[0]?.n ?? 0;

  const depts = await Department.find({ _id: { $in: facets.byDepartment.map((d: any) => d._id) } });
  const byDepartment = facets.byDepartment
    .map((d: any) => {
      const dep = depts.find((x) => x._id.equals(d._id));
      return { code: dep?.code ?? 'UNKNOWN', name: dep?.name ?? 'Unknown', total: d.total, open: d.open };
    })
    .sort((a: any, b: any) => b.open - a.open);

  return {
    scope: f.scope,
    totals: {
      total,
      open: OPEN.reduce((n, s) => n + statusCount(s), 0),
      submitted: statusCount('submitted'),
      underReview: statusCount('under_review'),
      assigned: statusCount('assigned'),
      inProgress: statusCount('in_progress'),
      resolved: statusCount('resolved'),
      rejected: statusCount('rejected'),
    },
    byStatus: facets.byStatus.map((x: any) => ({ status: x._id, count: x.count })),
    byCategory: facets.byCategory.map((x: any) => ({ category: x._id, count: x.count })),
    byArea: facets.byArea.map((x: any) => ({ area: x._id, count: x.count })),
    byPriority: ['Critical', 'High', 'Medium', 'Low'].map((b) => ({ band: b, count: facets.byPriority.find((x: any) => x._id === b)?.count ?? 0 })),
    trend: facets.trend.map((x: any) => ({ date: x._id, count: x.count })),
    byDepartment,
    availableAreas: (areas as string[]).sort(),
    // Everything stored, regardless of the current filters, so readers can see what the statistics are made of.
    composition: {
      citizen: provenanceRows.find((x: any) => x._id === 'CITIZEN')?.count ?? 0,
      demo: provenanceRows.find((x: any) => x._id === 'DEMO')?.count ?? 0,
      importedOfficial: provenanceRows.find((x: any) => x._id === 'IMPORTED_OFFICIAL')?.count ?? 0,
    },
    generatedAt: new Date().toISOString(),
  };
};

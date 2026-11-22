import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { adminApi } from '../api/adminApi';
import { complaintsApi } from '../api/complaintsApi';
import { AdminComplaint, Analytics, DuplicateGroupView, Workload } from '../types';
import { useLanguage } from '../contexts/LanguageContext';
import { errorMessage } from '../utils/errorMessage';
import { AdminShell } from '../components/AdminShell';
import { PageHeader } from '../components/PageHeader';
import { Alert } from '../components/ui/Alert';
import { StatusBadge } from '../components/StatusBadge';
import { SeverityBadge } from '../components/SeverityBadge';
import { ProvenanceBadge } from '../components/ProvenanceBadge';

const Stat: React.FC<{ label: string; value: number }> = ({ label, value }) => (
  <div className="rounded-lg border border-slate-200 bg-white p-4">
    <div className="text-sm text-slate-600">{label}</div>
    <div className="text-2xl font-semibold tabular-nums">{value}</div>
  </div>
);

export const AdminDashboardPage: React.FC = () => {
  const { t } = useLanguage();
  const [stats, setStats] = useState<Analytics | null>(null);
  const [workload, setWorkload] = useState<Workload | null>(null);
  const [top, setTop] = useState<AdminComplaint[]>([]);
  const [dups, setDups] = useState<DuplicateGroupView[]>([]);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    Promise.all([
      complaintsApi.analytics({ scope: 'citizen' }),
      adminApi.workload(),
      adminApi.list({ unassigned: true, sort: 'priority', limit: 5, provenance: 'citizen' }),
      adminApi.duplicates(),
    ])
      .then(([a, w, l, d]) => {
        if (cancelled) return;
        setStats(a);
        setWorkload(w);
        setTop(l.items.filter((c) => c.status !== 'resolved' && c.status !== 'rejected'));
        setDups(d.filter((g) => g.status === 'suggested'));
      })
      .catch((e) => !cancelled && setError(errorMessage(e, t)));
    return () => {
      cancelled = true;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return (
    <AdminShell>
      <PageHeader title={t.admin.navDashboard} subtitle={t.analytics.scopeCitizen} />
      {error && <Alert variant="error">{error}</Alert>}
      {!error && !stats && <p className="text-slate-600">{t.common.loading}</p>}
      {stats && workload && (
        <div className="space-y-6">
          <div className="grid gap-3 grid-cols-2 lg:grid-cols-5">
            <Stat label={t.analytics.total} value={stats.totals.total} />
            <Stat label={t.admin.openCount} value={stats.totals.open} />
            <Stat label={t.admin.unassigned} value={workload.unassigned} />
            <Stat label={t.admin.inProgressCount} value={stats.totals.inProgress} />
            <Stat label={t.admin.resolvedCount} value={stats.totals.resolved} />
          </div>

          <div className="grid gap-6 lg:grid-cols-2">
            <section className="rounded-lg border border-slate-200 bg-white p-4">
              <h2 className="text-base font-semibold mb-3">{t.admin.needsAttention}</h2>
              {top.length === 0 ? (
                <p className="text-sm text-slate-600">{t.common.noResults}</p>
              ) : (
                <ul className="divide-y divide-slate-100">
                  {top.map((c) => (
                    <li key={c.id} className="py-2 flex flex-wrap items-center gap-2">
                      <Link to={`/admin/complaints/${c.trackingId}`} className="font-mono text-xs text-civic-800 underline">{c.trackingId}</Link>
                      <span className="text-sm flex-1 min-w-[10rem] truncate">{c.title}</span>
                      <SeverityBadge score={c.priority.score} size="sm" showScore={false} />
                      <StatusBadge status={c.status} size="sm" />
                      <ProvenanceBadge source={c.provenance} />
                    </li>
                  ))}
                </ul>
              )}
              <p className="mt-3 text-sm">
                <Link to="/admin/duplicates" className="underline text-civic-800">{t.admin.pendingDuplicates}: {dups.length}</Link>
              </p>
            </section>

            <section className="rounded-lg border border-slate-200 bg-white p-4 overflow-x-auto">
              <h2 className="text-base font-semibold mb-3">{t.admin.workload}</h2>
              <table className="w-full text-sm">
                <thead>
                  <tr className="text-left text-slate-600">
                    <th className="py-1 pr-3">{t.common.department}</th>
                    <th className="py-1 pr-3">{t.admin.assignedCount}</th>
                    <th className="py-1 pr-3">{t.admin.inProgressCount}</th>
                    <th className="py-1">{t.admin.resolvedCount}</th>
                  </tr>
                </thead>
                <tbody>
                  {workload.departments.map((d) => (
                    <tr key={d.id} className="border-t border-slate-100">
                      <td className="py-1.5 pr-3"><span className="font-mono text-xs">{d.code}</span></td>
                      <td className="py-1.5 pr-3 tabular-nums">{d.assigned}</td>
                      <td className="py-1.5 pr-3 tabular-nums">{d.inProgress}</td>
                      <td className="py-1.5 tabular-nums">{d.resolved}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </section>
          </div>
        </div>
      )}
    </AdminShell>
  );
};

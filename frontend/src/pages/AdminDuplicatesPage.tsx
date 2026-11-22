import React, { useCallback, useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { adminApi } from '../api/adminApi';
import { DuplicateGroupView } from '../types';
import { useLanguage } from '../contexts/LanguageContext';
import { useToast } from '../contexts/ToastContext';
import { fmt } from '../i18n';
import { errorMessage } from '../utils/errorMessage';
import { formatDate } from '../utils/formatDate';
import { AdminShell } from '../components/AdminShell';
import { PageHeader } from '../components/PageHeader';
import { StatusBadge } from '../components/StatusBadge';
import { Button } from '../components/ui/Button';
import { Alert } from '../components/ui/Alert';

export const AdminDuplicatesPage: React.FC = () => {
  const { t } = useLanguage();
  const { showToast } = useToast();
  const [groups, setGroups] = useState<DuplicateGroupView[] | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState<string | null>(null);

  const load = useCallback(() => {
    adminApi.duplicates().then(setGroups).catch((e) => setError(errorMessage(e, t)));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);
  useEffect(load, [load]);

  const decide = async (id: string, decision: 'confirmed' | 'rejected') => {
    setBusy(id);
    try {
      await adminApi.reviewDuplicate(id, decision);
      showToast(t.admin.saved, 'success');
      load();
    } catch (e) {
      showToast(errorMessage(e, t), 'error');
    } finally {
      setBusy(null);
    }
  };

  return (
    <AdminShell>
      <PageHeader title={t.admin.navDuplicates} subtitle={t.admin.dupNote} />
      {error && <Alert variant="error">{error}</Alert>}
      {!error && groups === null && <p className="text-slate-600">{t.common.loading}</p>}
      {groups && groups.length === 0 && <p className="text-slate-700 py-8 text-center">{t.admin.dupNone}</p>}
      <div className="space-y-4">
        {groups?.map((g) => (
          <section key={g.id} className="rounded-lg border border-slate-200 bg-white p-4">
            <div className="flex flex-wrap items-center justify-between gap-2 mb-3">
              <div className="text-sm text-slate-700">
                {fmt(t.admin.dupSimilarity, { n: Math.round(g.maxScore * 100) })}
                {g.status === 'confirmed' && <span className="ml-2 rounded border border-emerald-300 bg-emerald-50 text-emerald-900 text-xs px-1.5">{t.admin.dupConfirmed}</span>}
              </div>
              {g.status === 'suggested' && (
                <div className="flex gap-2">
                  <Button size="sm" isLoading={busy === g.id} onClick={() => decide(g.id, 'confirmed')}>{t.admin.dupConfirm}</Button>
                  <Button size="sm" variant="outline" disabled={busy === g.id} onClick={() => decide(g.id, 'rejected')}>{t.admin.dupReject}</Button>
                </div>
              )}
            </div>
            <ul className="grid gap-3 md:grid-cols-2">
              {g.members.map((m) => (
                <li key={m.id} className="rounded border border-slate-200 p-3 text-sm space-y-1">
                  <div className="flex flex-wrap items-center gap-2">
                    <Link to={`/admin/complaints/${m.trackingId}`} className="font-mono text-xs underline text-civic-800">{m.trackingId}</Link>
                    <StatusBadge status={m.status} size="sm" />
                    <span className="text-xs text-slate-600">{formatDate(m.createdAt).split(',')[0]} · {m.location.area}</span>
                  </div>
                  <p>{m.description}</p>
                </li>
              ))}
            </ul>
          </section>
        ))}
      </div>
    </AdminShell>
  );
};

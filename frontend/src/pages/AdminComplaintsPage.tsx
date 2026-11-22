import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { adminApi } from '../api/adminApi';
import { Pagination } from '../api/complaintsApi';
import { AdminComplaint, AdminDepartment, CATEGORIES, STATUSES } from '../types';
import { useLanguage } from '../contexts/LanguageContext';
import { fmt } from '../i18n';
import { errorMessage } from '../utils/errorMessage';
import { formatDate } from '../utils/formatDate';
import { AdminShell } from '../components/AdminShell';
import { PageHeader } from '../components/PageHeader';
import { StatusBadge } from '../components/StatusBadge';
import { SeverityBadge } from '../components/SeverityBadge';
import { ProvenanceBadge } from '../components/ProvenanceBadge';
import { Button } from '../components/ui/Button';
import { Input } from '../components/ui/Input';
import { Select } from '../components/ui/Field';
import { Alert } from '../components/ui/Alert';

export const AdminComplaintsPage: React.FC = () => {
  const { t } = useLanguage();
  const [items, setItems] = useState<AdminComplaint[]>([]);
  const [pagination, setPagination] = useState<Pagination>({ total: 0, page: 1, limit: 20, totalPages: 1 });
  const [departments, setDepartments] = useState<AdminDepartment[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [reloadKey, setReloadKey] = useState(0);

  const [search, setSearch] = useState('');
  const [query, setQuery] = useState('');
  const [status, setStatus] = useState('');
  const [category, setCategory] = useState('');
  const [departmentId, setDepartmentId] = useState('');
  const [provenance, setProvenance] = useState<'all' | 'citizen' | 'demo'>('all');
  const [unassigned, setUnassigned] = useState(false);
  const [duplicatesOnly, setDuplicatesOnly] = useState(false);
  const [sort, setSort] = useState<'newest' | 'priority'>('priority');
  const [page, setPage] = useState(1);

  useEffect(() => {
    adminApi.departments().then(setDepartments).catch(() => undefined);
  }, []);

  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    setError(null);
    adminApi
      .list({ page, limit: 20, search: query, status, category, departmentId, provenance, unassigned, duplicatesOnly, sort })
      .then((d) => {
        if (cancelled) return;
        setItems(d.items);
        setPagination(d.pagination);
      })
      .catch((e) => !cancelled && setError(errorMessage(e, t)))
      .finally(() => !cancelled && setLoading(false));
    return () => {
      cancelled = true;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [page, query, status, category, departmentId, provenance, unassigned, duplicatesOnly, sort, reloadKey]);

  const reset = <T,>(set: (v: T) => void) => (v: T) => {
    set(v);
    setPage(1);
  };

  return (
    <AdminShell>
      <PageHeader title={t.admin.navComplaints} subtitle={fmt(t.explore.results, { n: pagination.total })} />

      <form
        className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4 items-end mb-4"
        onSubmit={(e) => {
          e.preventDefault();
          setPage(1);
          setQuery(search.trim());
        }}
      >
        <div className="lg:col-span-2">
          <Input label={t.common.search} placeholder={t.explore.searchPlaceholder} value={search} onChange={(e) => setSearch(e.target.value)} />
        </div>
        <Select label={t.common.status} value={status} onChange={(e) => reset(setStatus)(e.target.value)}>
          <option value="">{t.common.all}</option>
          {STATUSES.map((s) => <option key={s} value={s}>{t.status[s]}</option>)}
        </Select>
        <Select label={t.common.category} value={category} onChange={(e) => reset(setCategory)(e.target.value)}>
          <option value="">{t.common.all}</option>
          {CATEGORIES.map((c) => <option key={c} value={c}>{t.categories[c]}</option>)}
        </Select>
        <Select label={t.common.department} value={departmentId} onChange={(e) => reset(setDepartmentId)(e.target.value)}>
          <option value="">{t.admin.anyDepartment}</option>
          {departments.map((d) => <option key={d._id} value={d._id}>{d.code}</option>)}
        </Select>
        <Select label={t.admin.records} value={provenance} onChange={(e) => reset(setProvenance)(e.target.value as 'all' | 'citizen' | 'demo')}>
          <option value="all">{t.admin.provAll}</option>
          <option value="citizen">{t.admin.provCitizen}</option>
          <option value="demo">{t.admin.provDemo}</option>
        </Select>
        <Select label={t.explore.sort} value={sort} onChange={(e) => reset(setSort)(e.target.value as 'newest' | 'priority')}>
          <option value="priority">{t.explore.sortPriority}</option>
          <option value="newest">{t.explore.sortNewest}</option>
        </Select>
        <div className="flex flex-wrap items-center gap-4 pb-2 lg:col-span-2">
          <label className="flex items-center gap-2 text-sm">
            <input type="checkbox" checked={unassigned} onChange={(e) => reset(setUnassigned)(e.target.checked)} />
            {t.admin.onlyUnassigned}
          </label>
          <label className="flex items-center gap-2 text-sm">
            <input type="checkbox" checked={duplicatesOnly} onChange={(e) => reset(setDuplicatesOnly)(e.target.checked)} />
            {t.admin.onlyDuplicates}
          </label>
          <Button type="submit" size="sm">{t.common.search}</Button>
        </div>
      </form>

      {error && (
        <Alert variant="error">
          {error} <button className="underline" onClick={() => setReloadKey((k) => k + 1)}>{t.common.retry}</button>
        </Alert>
      )}

      {loading ? (
        <p className="text-slate-600">{t.common.loading}</p>
      ) : items.length === 0 && !error ? (
        <p className="text-slate-700 py-8 text-center">{t.common.noResults}</p>
      ) : (
        <div className="overflow-x-auto rounded-lg border border-slate-200 bg-white">
          <table className="w-full text-sm">
            <thead className="bg-slate-50 text-left text-slate-600">
              <tr>
                <th className="px-3 py-2">{t.common.trackingId}</th>
                <th className="px-3 py-2">{t.admin.colReport}</th>
                <th className="px-3 py-2">{t.common.category}</th>
                <th className="px-3 py-2">{t.common.status}</th>
                <th className="px-3 py-2">{t.common.priority}</th>
                <th className="px-3 py-2">{t.common.department}</th>
                <th className="px-3 py-2">{t.common.reportedOn}</th>
              </tr>
            </thead>
            <tbody>
              {items.map((c) => (
                <tr key={c.id} className="border-t border-slate-100 align-top">
                  <td className="px-3 py-2 whitespace-nowrap">
                    <Link to={`/admin/complaints/${c.trackingId}`} className="font-mono text-xs text-civic-800 underline">{c.trackingId}</Link>
                    <div className="mt-1"><ProvenanceBadge source={c.provenance} /></div>
                  </td>
                  <td className="px-3 py-2 max-w-xs"><span className="line-clamp-2">{c.title}</span><span className="text-xs text-slate-600">{c.location.area}</span></td>
                  <td className="px-3 py-2">{t.categories[c.category]}{c.categoryVerified && <span className="block text-xs text-emerald-800">✓</span>}</td>
                  <td className="px-3 py-2"><StatusBadge status={c.status} size="sm" /></td>
                  <td className="px-3 py-2"><SeverityBadge score={c.priority.score} size="sm" /></td>
                  <td className="px-3 py-2">{c.department?.code ?? <span className="text-slate-500">{t.admin.unassigned}</span>}</td>
                  <td className="px-3 py-2 whitespace-nowrap">{formatDate(c.createdAt).split(',')[0]}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {pagination.totalPages > 1 && (
        <div className="flex items-center justify-center gap-4 mt-4">
          <Button variant="outline" size="sm" disabled={page <= 1} onClick={() => setPage((p) => p - 1)}>{t.common.previous}</Button>
          <span className="text-sm">{fmt(t.common.pageOf, { page, total: pagination.totalPages })}</span>
          <Button variant="outline" size="sm" disabled={page >= pagination.totalPages} onClick={() => setPage((p) => p + 1)}>{t.common.next}</Button>
        </div>
      )}
    </AdminShell>
  );
};

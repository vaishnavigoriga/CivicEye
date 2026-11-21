import React, { useEffect, useState } from 'react';
import { complaintsApi, Pagination } from '../api/complaintsApi';
import { CATEGORIES, Complaint, STATUSES } from '../types';
import { useLanguage } from '../contexts/LanguageContext';
import { fmt } from '../i18n';
import { errorMessage } from '../utils/errorMessage';
import { ComplaintCard } from '../components/ComplaintCard';
import { Button } from '../components/ui/Button';
import { Input } from '../components/ui/Input';
import { Select } from '../components/ui/Field';
import { Alert } from '../components/ui/Alert';
import { Page, PageHeader } from '../components/PageHeader';

export const ExploreComplaintsPage: React.FC = () => {
  const { t } = useLanguage();
  const [items, setItems] = useState<Complaint[]>([]);
  const [pagination, setPagination] = useState<Pagination>({ total: 0, page: 1, limit: 12, totalPages: 1 });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [search, setSearch] = useState('');
  const [query, setQuery] = useState('');
  const [category, setCategory] = useState('');
  const [status, setStatus] = useState('');
  const [sort, setSort] = useState<'newest' | 'priority'>('newest');
  const [includeDemo, setIncludeDemo] = useState(false);
  const [page, setPage] = useState(1);
  const [reloadKey, setReloadKey] = useState(0);

  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    setError(null);
    complaintsApi
      .list({ page, limit: 12, search: query, category, status, sort, includeDemo })
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
  }, [page, query, category, status, sort, includeDemo, reloadKey]);

  const clear = () => {
    setSearch('');
    setQuery('');
    setCategory('');
    setStatus('');
    setSort('newest');
    setIncludeDemo(false);
    setPage(1);
  };

  return (
    <Page>
      <PageHeader title={t.explore.title} subtitle={t.explore.subtitle} />

      <form
        className="grid gap-3 sm:grid-cols-2 lg:grid-cols-5 items-end mb-4"
        onSubmit={(e) => {
          e.preventDefault();
          setPage(1);
          setQuery(search.trim());
        }}
      >
        <div className="lg:col-span-2">
          <Input label={t.common.search} placeholder={t.explore.searchPlaceholder} value={search} onChange={(e) => setSearch(e.target.value)} />
        </div>
        <Select label={t.common.category} value={category} onChange={(e) => { setCategory(e.target.value); setPage(1); }}>
          <option value="">{t.common.all}</option>
          {CATEGORIES.map((c) => <option key={c} value={c}>{t.categories[c]}</option>)}
        </Select>
        <Select label={t.common.status} value={status} onChange={(e) => { setStatus(e.target.value); setPage(1); }}>
          <option value="">{t.common.all}</option>
          {STATUSES.map((s) => <option key={s} value={s}>{t.status[s]}</option>)}
        </Select>
        <Select label={t.explore.sort} value={sort} onChange={(e) => { setSort(e.target.value as 'newest' | 'priority'); setPage(1); }}>
          <option value="newest">{t.explore.sortNewest}</option>
          <option value="priority">{t.explore.sortPriority}</option>
        </Select>
        <div className="sm:col-span-2 lg:col-span-5 flex flex-wrap items-center gap-4">
          <label className="flex items-center gap-2 text-sm">
            <input type="checkbox" checked={includeDemo} onChange={(e) => { setIncludeDemo(e.target.checked); setPage(1); }} />
            {t.explore.showDemo}
          </label>
          <Button type="submit" size="sm">{t.common.search}</Button>
          <Button type="button" size="sm" variant="ghost" onClick={clear}>{t.common.clearFilters}</Button>
          {!loading && !error && <span className="text-sm text-slate-600 ml-auto">{fmt(t.explore.results, { n: pagination.total })}</span>}
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
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {items.map((c) => <ComplaintCard key={c.id} complaint={c} />)}
        </div>
      )}

      {pagination.totalPages > 1 && (
        <div className="flex items-center justify-center gap-4 mt-6">
          <Button variant="outline" size="sm" disabled={page <= 1} onClick={() => setPage((p) => p - 1)}>{t.common.previous}</Button>
          <span className="text-sm text-slate-700">{fmt(t.common.pageOf, { page, total: pagination.totalPages })}</span>
          <Button variant="outline" size="sm" disabled={page >= pagination.totalPages} onClick={() => setPage((p) => p + 1)}>{t.common.next}</Button>
        </div>
      )}
    </Page>
  );
};

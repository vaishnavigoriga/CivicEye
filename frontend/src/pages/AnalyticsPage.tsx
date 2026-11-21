import React, { useEffect, useState } from 'react';
import { Bar, BarChart, CartesianGrid, Line, LineChart, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts';
import { complaintsApi } from '../api/complaintsApi';
import { Analytics, CATEGORIES, DataSources, STATUSES } from '../types';
import { fmt } from '../i18n';
import { useLanguage } from '../contexts/LanguageContext';
import { errorMessage } from '../utils/errorMessage';
import { Alert } from '../components/ui/Alert';
import { Select } from '../components/ui/Field';
import { Page, PageHeader } from '../components/PageHeader';

const COLOR = '#1d4f91';
const BAND_COLOR: Record<string, string> = { Critical: '#b91c1c', High: '#c2410c', Medium: '#a16207', Low: '#047857' };

const Stat: React.FC<{ label: string; value: number }> = ({ label, value }) => (
  <div className="rounded-lg border border-slate-200 bg-white p-4">
    <div className="text-sm text-slate-600">{label}</div>
    <div className="text-2xl font-semibold tabular-nums">{value}</div>
  </div>
);

const ChartCard: React.FC<{ title: string; empty: boolean; emptyText: string; children: React.ReactNode }> = ({ title, empty, emptyText, children }) => (
  <section className="rounded-lg border border-slate-200 bg-white p-4">
    <h2 className="text-base font-semibold mb-3">{title}</h2>
    {empty ? <p className="text-sm text-slate-600 py-10 text-center">{emptyText}</p> : <div className="h-64">{children}</div>}
  </section>
);

export const AnalyticsPage: React.FC = () => {
  const { t } = useLanguage();
  const [data, setData] = useState<Analytics | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [scope, setScope] = useState<'citizen' | 'all'>('citizen');
  const [category, setCategory] = useState('');
  const [status, setStatus] = useState('');
  const [area, setArea] = useState('');
  const [reloadKey, setReloadKey] = useState(0);
  const [sources, setSources] = useState<DataSources | null>(null);

  useEffect(() => {
    complaintsApi.dataSources().then(setSources).catch(() => setSources(null));
  }, [reloadKey]);

  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    setError(null);
    complaintsApi
      .analytics({ scope, category, status, area })
      .then((d) => !cancelled && setData(d))
      .catch((e) => !cancelled && setError(errorMessage(e, t)))
      .finally(() => !cancelled && setLoading(false));
    return () => {
      cancelled = true;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [scope, category, status, area, reloadKey]);

  const bar = (rows: { name: string; count: number }[], fill = COLOR) => (
    <ResponsiveContainer width="100%" height="100%">
      <BarChart data={rows} layout="vertical" margin={{ left: 16 }}>
        <CartesianGrid strokeDasharray="3 3" horizontal={false} />
        <XAxis type="number" allowDecimals={false} />
        <YAxis type="category" dataKey="name" width={150} tick={{ fontSize: 12 }} />
        <Tooltip />
        <Bar dataKey="count" fill={fill} />
      </BarChart>
    </ResponsiveContainer>
  );

  return (
    <Page>
      <PageHeader title={t.analytics.title} subtitle={t.analytics.subtitle} />

      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4 mb-6">
        <Select label={t.analytics.dataScope} value={scope} onChange={(e) => setScope(e.target.value as 'citizen' | 'all')}>
          <option value="citizen">{t.analytics.scopeCitizen}</option>
          <option value="all">{t.analytics.scopeAll}</option>
        </Select>
        <Select label={t.common.category} value={category} onChange={(e) => setCategory(e.target.value)}>
          <option value="">{t.common.all}</option>
          {CATEGORIES.map((c) => <option key={c} value={c}>{t.categories[c]}</option>)}
        </Select>
        <Select label={t.common.status} value={status} onChange={(e) => setStatus(e.target.value)}>
          <option value="">{t.common.all}</option>
          {STATUSES.map((s) => <option key={s} value={s}>{t.status[s]}</option>)}
        </Select>
        <Select label={t.common.area} value={area} onChange={(e) => setArea(e.target.value)}>
          <option value="">{t.common.all}</option>
          {(data?.availableAreas ?? (area ? [area] : [])).map((a) => <option key={a} value={a}>{a}</option>)}
        </Select>
      </div>

      {error ? (
        <Alert variant="error">
          {error} <button className="underline" onClick={() => setReloadKey((k) => k + 1)}>{t.common.retry}</button>
        </Alert>
      ) : loading || !data ? (
        <p className="text-slate-600">{t.common.loading}</p>
      ) : (
        <div className="space-y-6">
          <div className="grid gap-3 grid-cols-2 lg:grid-cols-4">
            <Stat label={t.analytics.total} value={data.totals.total} />
            <Stat label={t.analytics.open} value={data.totals.open} />
            <Stat label={t.analytics.inProgress} value={data.totals.inProgress} />
            <Stat label={t.analytics.resolved} value={data.totals.resolved} />
          </div>

          {data.totals.total === 0 && <p className="text-slate-700">{t.analytics.empty}</p>}

          <div className="grid gap-4 lg:grid-cols-2">
            <ChartCard title={t.analytics.byCategory} empty={data.byCategory.length === 0} emptyText={t.analytics.empty}>
              {bar(data.byCategory.map((c) => ({ name: t.categories[c.category], count: c.count })))}
            </ChartCard>
            <ChartCard title={t.analytics.byStatus} empty={data.byStatus.length === 0} emptyText={t.analytics.empty}>
              {bar(data.byStatus.map((s) => ({ name: t.status[s.status], count: s.count })))}
            </ChartCard>
            <ChartCard title={t.analytics.byPriority} empty={data.totals.total === 0} emptyText={t.analytics.empty}>
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={data.byPriority.map((b) => ({ name: t.priority[b.band], count: b.count, band: b.band }))}>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} />
                  <XAxis dataKey="name" />
                  <YAxis allowDecimals={false} />
                  <Tooltip />
                  <Bar dataKey="count" fill={COLOR} />
                </BarChart>
              </ResponsiveContainer>
            </ChartCard>
            <ChartCard title={t.analytics.byArea} empty={data.byArea.length === 0} emptyText={t.analytics.empty}>
              {bar(data.byArea.map((a) => ({ name: a.area, count: a.count })))}
            </ChartCard>
            <ChartCard title={t.analytics.trend} empty={data.trend.length === 0} emptyText={t.analytics.empty}>
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={data.trend}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="date" tick={{ fontSize: 11 }} />
                  <YAxis allowDecimals={false} />
                  <Tooltip />
                  <Line type="monotone" dataKey="count" stroke={COLOR} strokeWidth={2} dot />
                </LineChart>
              </ResponsiveContainer>
            </ChartCard>
            <ChartCard title={t.analytics.byDepartment} empty={data.byDepartment.length === 0} emptyText={t.analytics.empty}>
              {bar(data.byDepartment.map((d) => ({ name: d.code, count: d.open })))}
            </ChartCard>
          </div>
        </div>
      )}

      {data && (
        <section className="mt-8 rounded-lg border border-slate-200 bg-white p-4">
          <h2 className="text-base font-semibold">{t.analytics.composition}</h2>
          <p className="text-sm text-slate-600 mb-3">{t.analytics.compositionNote}</p>
          <dl className="grid gap-3 sm:grid-cols-3 text-sm">
            <div><dt className="text-slate-600">{t.analytics.compCitizen}</dt><dd className="text-xl font-semibold tabular-nums">{data.composition.citizen}</dd></div>
            <div><dt className="text-slate-600">{t.analytics.compDemo}</dt><dd className="text-xl font-semibold tabular-nums">{data.composition.demo}</dd></div>
            <div><dt className="text-slate-600">{t.analytics.compImported}</dt><dd className="text-xl font-semibold tabular-nums">{data.composition.importedOfficial}</dd></div>
          </dl>
        </section>
      )}

      {sources && (
        <section className="mt-6 rounded-lg border border-slate-200 bg-white p-4">
          <h2 className="text-base font-semibold mb-2">{t.analytics.officialTitle}</h2>
          {sources.datasets.length === 0 ? (
            <p className="text-sm text-slate-700">{t.analytics.officialNone}</p>
          ) : (
            <div className="space-y-5">
              <p className="text-sm text-slate-600">{t.analytics.officialNote}</p>
              {sources.datasets.map((d) => {
                const cols = Object.keys(d.rows[0]?.metrics ?? {});
                return (
                  <div key={d.id}>
                    <h3 className="font-medium">{d.title}</h3>
                    <p className="text-xs text-slate-600 mb-2">
                      {fmt(t.analytics.officialSource, { org: d.sourceOrg, licence: d.licence, date: d.retrievedAt.slice(0, 10) })}{' '}
                      <a className="underline" href={d.sourceUrl} target="_blank" rel="noreferrer">{d.sourceUrl}</a>
                    </p>
                    <div className="overflow-x-auto">
                      <table className="text-sm w-full">
                        <thead><tr className="text-left text-slate-600"><th className="py-1 pr-4"></th>{cols.map((c) => <th key={c} className="py-1 pr-4">{c}</th>)}</tr></thead>
                        <tbody>{d.rows.map((r) => <tr key={r.label} className="border-t border-slate-100"><td className="py-1 pr-4">{r.label}</td>{cols.map((c) => <td key={c} className="py-1 pr-4 tabular-nums">{r.metrics[c] ?? '-'}</td>)}</tr>)}</tbody>
                      </table>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </section>
      )}

      <p className="text-sm text-slate-600 mt-6">{t.analytics.note}</p>
    </Page>
  );
};

import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { complaintsApi } from '../api/complaintsApi';
import { CATEGORIES, MapPoint, STATUSES } from '../types';
import { useLanguage } from '../contexts/LanguageContext';
import { fmt } from '../i18n';
import { errorMessage } from '../utils/errorMessage';
import { HyderabadMap, MapLegend } from '../components/HyderabadMap';
import { Select } from '../components/ui/Field';
import { Alert } from '../components/ui/Alert';
import { StatusBadge } from '../components/StatusBadge';
import { SeverityBadge } from '../components/SeverityBadge';
import { ProvenanceBadge } from '../components/ProvenanceBadge';
import { Page, PageHeader } from '../components/PageHeader';

export const MapPage: React.FC = () => {
  const { t } = useLanguage();
  const [points, setPoints] = useState<MapPoint[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [view, setView] = useState<'map' | 'list'>('map');
  const [category, setCategory] = useState('');
  const [status, setStatus] = useState('');
  const [includeDemo, setIncludeDemo] = useState(false);
  const [reloadKey, setReloadKey] = useState(0);

  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    setError(null);
    complaintsApi
      .map({ category, status, includeDemo })
      .then((p) => !cancelled && setPoints(p))
      .catch((e) => !cancelled && setError(errorMessage(e, t)))
      .finally(() => !cancelled && setLoading(false));
    return () => {
      cancelled = true;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [category, status, includeDemo, reloadKey]);

  return (
    <Page>
      <PageHeader
        title={t.map.title}
        subtitle={t.map.subtitle}
        actions={
          <div className="inline-flex rounded-md border border-slate-400 overflow-hidden" role="group">
            {(['map', 'list'] as const).map((v) => (
              <button
                key={v}
                onClick={() => setView(v)}
                aria-pressed={view === v}
                className={`px-4 py-1.5 text-sm ${view === v ? 'bg-civic-700 text-white' : 'bg-white text-slate-800 hover:bg-slate-50'}`}
              >
                {v === 'map' ? t.map.mapView : t.map.listView}
              </button>
            ))}
          </div>
        }
      />

      <div className="grid gap-3 sm:grid-cols-3 items-end mb-3">
        <Select label={t.common.category} value={category} onChange={(e) => setCategory(e.target.value)}>
          <option value="">{t.common.all}</option>
          {CATEGORIES.map((c) => <option key={c} value={c}>{t.categories[c]}</option>)}
        </Select>
        <Select label={t.common.status} value={status} onChange={(e) => setStatus(e.target.value)}>
          <option value="">{t.common.all}</option>
          {STATUSES.map((s) => <option key={s} value={s}>{t.status[s]}</option>)}
        </Select>
        <label className="flex items-center gap-2 text-sm pb-2">
          <input type="checkbox" checked={includeDemo} onChange={(e) => setIncludeDemo(e.target.checked)} />
          {t.explore.showDemo}
        </label>
      </div>

      <div className="mb-3 flex flex-wrap items-center justify-between gap-2">
        <MapLegend />
        {!loading && !error && <span className="text-sm text-slate-600">{fmt(t.map.count, { n: points.length })}</span>}
      </div>

      {error ? (
        <Alert variant="error">
          {error} <button className="underline" onClick={() => setReloadKey((k) => k + 1)}>{t.common.retry}</button>
        </Alert>
      ) : loading ? (
        <p className="text-slate-600">{t.common.loading}</p>
      ) : view === 'map' ? (
        <>
          <HyderabadMap points={points} />
          {points.length === 0 && <p className="mt-3 text-slate-700">{t.common.noResults}</p>}
        </>
      ) : points.length === 0 ? (
        <p className="py-8 text-center text-slate-700">{t.common.noResults}</p>
      ) : (
        <ul className="divide-y divide-slate-200 rounded-lg border border-slate-200 bg-white">
          {points.map((p) => (
            <li key={p.id} className="p-3 flex flex-wrap items-center gap-x-4 gap-y-1">
              <Link to={`/track/${p.trackingId}`} className="font-medium text-civic-800 hover:underline flex-1 min-w-[12rem]">
                {p.title}
              </Link>
              <span className="text-sm text-slate-600">{p.area}</span>
              <StatusBadge status={p.status} size="sm" />
              <SeverityBadge score={p.priority.score} size="sm" showScore={false} />
              <ProvenanceBadge source={p.provenance} />
            </li>
          ))}
        </ul>
      )}
    </Page>
  );
};

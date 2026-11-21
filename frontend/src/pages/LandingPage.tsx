import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { Pencil, ScanSearch, ListChecks } from 'lucide-react';
import { complaintsApi } from '../api/complaintsApi';
import { useLanguage } from '../contexts/LanguageContext';
import { Button } from '../components/ui/Button';
import { Alert } from '../components/ui/Alert';

export const LandingPage: React.FC = () => {
  const { t } = useLanguage();
  const [stats, setStats] = useState<{ total: number; resolved: number } | null>(null);

  useEffect(() => {
    let cancelled = false;
    complaintsApi
      .analytics({ scope: 'citizen' })
      .then((d) => !cancelled && setStats({ total: d.totals.total, resolved: d.totals.resolved }))
      .catch(() => !cancelled && setStats(null));
    return () => {
      cancelled = true;
    };
  }, []);

  const steps = [
    { icon: Pencil, title: t.home.step1Title, body: t.home.step1Body },
    { icon: ScanSearch, title: t.home.step2Title, body: t.home.step2Body },
    { icon: ListChecks, title: t.home.step3Title, body: t.home.step3Body },
  ];

  return (
    <>
      <section className="bg-white border-b border-slate-200">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 py-14 sm:py-20">
          <h1 className="text-3xl sm:text-4xl font-semibold max-w-3xl leading-tight">{t.home.title}</h1>
          <p className="mt-4 text-lg text-slate-700 max-w-2xl">{t.home.subtitle}</p>
          <div className="mt-8 flex flex-wrap gap-3">
            <Link to="/citizen/new"><Button size="lg">{t.home.ctaReport}</Button></Link>
            <Link to="/track"><Button size="lg" variant="outline">{t.home.ctaTrack}</Button></Link>
          </div>
        </div>
      </section>

      <section className="max-w-6xl mx-auto px-4 sm:px-6 py-12">
        <h2 className="text-xl font-semibold mb-6">{t.home.howTitle}</h2>
        <div className="grid gap-6 md:grid-cols-3">
          {steps.map((s, i) => (
            <div key={i} className="rounded-lg border border-slate-200 bg-white p-5">
              <s.icon className="w-5 h-5 text-civic-700 mb-3" aria-hidden="true" />
              <h3 className="font-medium mb-1">{s.title}</h3>
              <p className="text-sm text-slate-700">{s.body}</p>
            </div>
          ))}
        </div>
      </section>

      <section className="max-w-6xl mx-auto px-4 sm:px-6 pb-4 grid gap-6 md:grid-cols-2">
        <Alert variant="info" title={t.home.noticeTitle}>{t.home.notice}</Alert>
        <div className="rounded-lg border border-slate-200 bg-white p-5">
          <h2 className="font-medium mb-2">{t.home.statsTitle}</h2>
          {stats === null ? (
            <p className="text-sm text-slate-600">{t.common.loading}</p>
          ) : stats.total === 0 ? (
            <p className="text-sm text-slate-700">{t.home.statsEmpty}</p>
          ) : (
            <div className="flex gap-8">
              <div className="text-3xl font-semibold tabular-nums">{stats.total} <span className="block text-sm font-normal text-slate-600">{t.home.statsCitizen}</span></div>
              <div className="text-3xl font-semibold tabular-nums">{stats.resolved} <span className="block text-sm font-normal text-slate-600">{t.home.statsResolved}</span></div>
            </div>
          )}
        </div>
      </section>
    </>
  );
};

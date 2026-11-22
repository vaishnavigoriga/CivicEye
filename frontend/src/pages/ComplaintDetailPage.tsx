import React, { useEffect, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import { complaintsApi } from '../api/complaintsApi';
import { Complaint, ComplaintUpdate } from '../types';
import { useAuth } from '../contexts/AuthContext';
import { useLanguage } from '../contexts/LanguageContext';
import { useToast } from '../contexts/ToastContext';
import { errorMessage } from '../utils/errorMessage';
import { StatusBadge } from '../components/StatusBadge';
import { SeverityBadge } from '../components/SeverityBadge';
import { ProvenanceBadge } from '../components/ProvenanceBadge';
import { Button } from '../components/ui/Button';
import { Alert } from '../components/ui/Alert';
import { Page } from '../components/PageHeader';
import { formatDate } from '../utils/formatDate';
import { fmt, LANGUAGES, statusKey } from '../i18n';

/** Public tracking view. Never shows reporter identity. */
export const ComplaintDetailPage: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const { user } = useAuth();
  const { t, language } = useLanguage();
  const { showToast } = useToast();
  const [translation, setTranslation] = useState<string | null>(null);
  const [translating, setTranslating] = useState(false);
  const [listening, setListening] = useState(false);
  const [complaint, setComplaint] = useState<Complaint | null>(null);
  const [updates, setUpdates] = useState<ComplaintUpdate[]>([]);
  const [related, setRelated] = useState<{ trackingId: string; title: string; status: string }[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<any>(null);
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    if (!id) return;
    let cancelled = false;
    setLoading(true);
    setError(null);
    complaintsApi
      .get(id)
      .then((d) => {
        if (cancelled) return;
        setComplaint(d.complaint);
        setUpdates(d.updates);
        setRelated(d.related);
      })
      .catch((e) => !cancelled && setError(e))
      .finally(() => !cancelled && setLoading(false));
    return () => {
      cancelled = true;
    };
  }, [id, user?.id]);

  // A new language selection clears any earlier translation.
  useEffect(() => setTranslation(null), [language, id]);

  const doTranslate = async () => {
    if (!complaint) return;
    setTranslating(true);
    try {
      setTranslation((await complaintsApi.translate(complaint.trackingId, language)).text);
    } catch (e) {
      showToast(errorMessage(e, t), 'error');
    } finally {
      setTranslating(false);
    }
  };

  const listen = async () => {
    if (!complaint) return;
    setListening(true);
    try {
      const sentence = fmt(t.track.spoken, {
        id: complaint.trackingId.replace(/-/g, ' '),
        status: t.status[complaint.status],
        category: t.categories[complaint.category],
        priority: t.priority[complaint.priority.band],
      });
      const blob = await complaintsApi.speak(sentence);
      const url = URL.createObjectURL(blob);
      const audio = new Audio(url);
      audio.onended = () => URL.revokeObjectURL(url);
      await audio.play();
    } catch (e) {
      showToast(errorMessage(e, t), 'error');
    } finally {
      setListening(false);
    }
  };

  const toggleSupport = async () => {
    if (!complaint) return;
    setBusy(true);
    try {
      const r = await complaintsApi.support(complaint.trackingId, !complaint.hasSupported);
      setComplaint({ ...complaint, supportCount: r.supportCount, hasSupported: r.hasSupported });
    } catch (e) {
      showToast(errorMessage(e, t), 'error');
    } finally {
      setBusy(false);
    }
  };

  if (loading) return <Page narrow><p className="text-slate-600">{t.common.loading}</p></Page>;
  if (error || !complaint) {
    return (
      <Page narrow>
        <Alert variant={error?.code === 'NOT_FOUND' ? 'warning' : 'error'}>
          {error?.code === 'NOT_FOUND' ? t.track.notFound : errorMessage(error, t)}
        </Alert>
        <div className="mt-4"><Link to="/track"><Button variant="outline">{t.nav.track}</Button></Link></div>
      </Page>
    );
  }

  const c = complaint;
  const isOwner = !!user && c.audio !== undefined; // the audio list is only present in the reporter's own view
  const closed = c.status === 'resolved' || c.status === 'rejected';

  return (
    <Page>
      <div className="grid gap-6 lg:grid-cols-3">
        <div className="lg:col-span-2 space-y-6">
          <section className="rounded-lg border border-slate-200 bg-white p-5 space-y-3">
            <div className="flex flex-wrap items-center gap-2">
              <h1 className="font-mono text-sm font-semibold">{c.trackingId}</h1>
              <StatusBadge status={c.status} />
              <ProvenanceBadge source={c.provenance} size="md" />
            </div>
            {c.provenance === 'DEMO' && <Alert variant="warning">{t.provenance.demoHint}</Alert>}
            {!c.description.startsWith(c.title.replace(/\.\.\.$/, '')) && <h2 className="text-xl font-semibold">{c.title}</h2>}
            <p className="whitespace-pre-wrap text-slate-800">{c.description}</p>
            {c.language !== language && (
              <div className="space-y-2">
                {translation === null ? (
                  <Button size="sm" variant="outline" onClick={doTranslate} isLoading={translating}>
                    {translating ? t.track.translating : fmt(t.track.translate, { lang: LANGUAGES.find((l) => l.code === language)!.label })}
                  </Button>
                ) : (
                  <div className="rounded border border-slate-200 bg-slate-50 p-3">
                    <p className="whitespace-pre-wrap text-slate-900">{translation}</p>
                    <p className="text-xs text-slate-600 mt-2">
                      {t.track.translated}{' '}
                      <button className="underline" onClick={() => setTranslation(null)}>{t.track.showOriginal}</button>
                    </p>
                  </div>
                )}
              </div>
            )}
            {c.images.map((m, i) => (
              <img key={i} src={m.url} alt="" className="max-h-80 rounded border border-slate-200" />
            ))}
            {c.audio?.map((m, i) => (
              <audio key={i} controls src={m.url} className="w-full" />
            ))}
          </section>

          <section className="rounded-lg border border-slate-200 bg-white p-5">
            <h2 className="text-base font-semibold mb-3">{t.track.timeline}</h2>
            <ol className="space-y-4 border-l-2 border-slate-200 pl-4">
              {updates.map((u, i) => (
                <li key={i} className="relative">
                  <span className="absolute -left-[22px] top-1.5 w-3 h-3 rounded-full bg-civic-700 border-2 border-white" aria-hidden="true" />
                  <div className="text-sm font-medium">{u.toStatus ? t.status[statusKey(u.toStatus)] : u.type}</div>
                  {u.note && <div className="text-sm text-slate-700">{u.note}</div>}
                  <div className="text-xs text-slate-600">{formatDate(u.createdAt)}</div>
                </li>
              ))}
            </ol>
          </section>

          {c.resolutionEvidence.length > 0 && (
            <section className="rounded-lg border border-slate-200 bg-white p-5">
              <h2 className="text-base font-semibold mb-3">{t.track.evidence}</h2>
              <div className="grid gap-3 sm:grid-cols-2">
                {c.resolutionEvidence.map((ev, i) => (
                  <figure key={i}>
                    <img src={ev.url} alt={ev.caption} className="rounded border border-slate-200" />
                    {ev.caption && <figcaption className="text-sm text-slate-700 mt-1">{ev.caption}</figcaption>}
                  </figure>
                ))}
              </div>
            </section>
          )}
        </div>

        <aside className="space-y-6">
          <section className="rounded-lg border border-slate-200 bg-white p-5 space-y-3 text-sm">
            <dl className="grid grid-cols-[auto,1fr] gap-x-3 gap-y-2">
              <dt className="text-slate-600">{t.common.category}</dt>
              <dd>{t.categories[c.category]}</dd>
              <dt className="text-slate-600">{t.common.priority}</dt>
              <dd><SeverityBadge score={c.priority.score} /></dd>
              <dt className="text-slate-600">{t.common.location}</dt>
              <dd>
                {c.location.area}
                {c.location.address ? `, ${c.location.address}` : ''}
                {c.location.accuracy === 'area_approx' && <span className="block text-amber-900">{t.map.approx}</span>}
              </dd>
              <dt className="text-slate-600">{t.common.department}</dt>
              <dd>{c.department?.name ?? t.common.unassigned}</dd>
              <dt className="text-slate-600">{t.common.reportedOn}</dt>
              <dd>{formatDate(c.createdAt)}</dd>
              <dt className="text-slate-600">{t.common.supports}</dt>
              <dd>{c.supportCount}</dd>
            </dl>
            {c.provenance === 'CITIZEN' && !closed && !isOwner &&
              (user ? (
                <Button variant={c.hasSupported ? 'secondary' : 'outline'} size="sm" onClick={toggleSupport} isLoading={busy}>
                  {c.hasSupported ? t.track.supported : t.track.support}
                </Button>
              ) : (
                <p className="text-slate-600"><Link to="/login" className="underline">{t.track.loginToSupport}</Link></p>
              ))}
            {user ? (
              <Button variant="ghost" size="sm" onClick={listen} isLoading={listening}>
                {listening ? t.track.listening : t.track.listen}
              </Button>
            ) : (
              <p className="text-slate-600 text-sm">{t.track.listenLogin}</p>
            )}
          </section>

          <section className="rounded-lg border border-slate-200 bg-white p-5 text-sm space-y-2">
            <h2 className="font-semibold">{c.ai.status === 'failed' ? t.ai.failed : c.ai.isSimulated ? t.ai.simulated : t.ai.live}</h2>
            {c.ai.status !== 'failed' && c.ai.explanation && <p className="text-slate-700">{c.ai.explanation}</p>}
            {!c.ai.isSimulated && c.ai.model && c.ai.status === 'ok' && <p className="text-xs text-slate-600">{c.ai.model}</p>}
            <p className="text-slate-600">{t.ai.note}</p>
          </section>

          {related.length > 0 && (
            <section className="rounded-lg border border-slate-200 bg-white p-5 text-sm">
              <h2 className="font-semibold mb-2">{t.track.duplicates}</h2>
              <ul className="space-y-1.5">
                {related.map((r) => (
                  <li key={r.trackingId}>
                    <Link className="text-civic-700 hover:underline" to={`/track/${r.trackingId}`}>{r.trackingId}</Link>{' '}
                    <span className="text-slate-600">{r.title}</span>
                  </li>
                ))}
              </ul>
            </section>
          )}
        </aside>
      </div>
    </Page>
  );
};

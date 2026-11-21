import React, { useEffect, useMemo, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Mic, LocateFixed, X } from 'lucide-react';
import { complaintsApi } from '../api/complaintsApi';
import { useAuth } from '../contexts/AuthContext';
import { useLanguage } from '../contexts/LanguageContext';
import { useToast } from '../contexts/ToastContext';
import { fmt } from '../i18n';
import { Button } from '../components/ui/Button';
import { Input } from '../components/ui/Input';
import { Select, TextArea } from '../components/ui/Field';
import { Alert } from '../components/ui/Alert';
import { Page, PageHeader } from '../components/PageHeader';
import { VoicePanel } from '../components/VoicePanel';
import { LocationPicker, type LatLng } from '../components/LocationPicker';
import { SeverityBadge } from '../components/SeverityBadge';
import { StatusBadge } from '../components/StatusBadge';
import { errorMessage } from '../utils/errorMessage';
import { CATEGORIES, DuplicateCandidate } from '../types';

const AREAS = [
  'Banjara Hills',
  'Jubilee Hills',
  'Madhapur',
  'Hitech City',
  'Kukatpally',
  'Secunderabad',
  'Charminar',
  'Begumpet',
  'Ameerpet',
  'LB Nagar',
];
// Approximate locality centres, used only to suggest the nearest locality name for a chosen pin.
const AREA_CENTRES: Record<string, [number, number]> = {
  'Banjara Hills': [17.4156, 78.4347],
  'Jubilee Hills': [17.4328, 78.4071],
  Madhapur: [17.4504, 78.39],
  'Hitech City': [17.4486, 78.3806],
  Kukatpally: [17.4849, 78.4138],
  Secunderabad: [17.4399, 78.4983],
  Charminar: [17.3616, 78.4747],
  Begumpet: [17.4418, 78.4636],
  Ameerpet: [17.4374, 78.4487],
  'LB Nagar': [17.3463, 78.5522],
};
// Same bounds the server enforces; checked here so the citizen gets immediate feedback.
const inRegion = (p: { lat: number; lng: number }) => p.lat >= 17.15 && p.lat <= 17.75 && p.lng >= 78.15 && p.lng <= 78.8;
const nearestArea = (p: { lat: number; lng: number }): string =>
  Object.entries(AREA_CENTRES).sort(
    (a, b) => (a[1][0] - p.lat) ** 2 + (a[1][1] - p.lng) ** 2 - ((b[1][0] - p.lat) ** 2 + (b[1][1] - p.lng) ** 2),
  )[0][0];
const MAX_IMAGE_BYTES = 10 * 1024 * 1024;
const IMAGE_TYPES = ['image/jpeg', 'image/png', 'image/webp'];

export const NewComplaintPage: React.FC = () => {
  const { user, loading } = useAuth();
  const { t, language } = useLanguage();
  const { showToast } = useToast();
  const navigate = useNavigate();

  const [step, setStep] = useState<1 | 2 | 3>(1);
  const [category, setCategory] = useState('');
  const [description, setDescription] = useState('');
  const [area, setArea] = useState(AREAS[0]);
  const [address, setAddress] = useState('');
  const [pin, setPin] = useState<LatLng | null>(null);
  const [photo, setPhoto] = useState<File | null>(null);
  const [audio, setAudio] = useState<Blob | null>(null);
  const [showVoice, setShowVoice] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [submitting, setSubmitting] = useState(false);
  const [result, setResult] = useState<any>(null);
  const [accuracy, setAccuracy] = useState<'gps' | 'map_pin'>('map_pin');
  const [transcript, setTranscript] = useState<{ text: string; edited: boolean } | null>(null);
  const [candidates, setCandidates] = useState<DuplicateCandidate[]>([]);
  const [supportedId, setSupportedId] = useState<string | null>(null);

  const photoUrl = useMemo(() => (photo ? URL.createObjectURL(photo) : null), [photo]);
  useEffect(() => () => { if (photoUrl) URL.revokeObjectURL(photoUrl); }, [photoUrl]);

  if (loading) return <Page narrow><p className="text-slate-600">{t.common.loading}</p></Page>;

  if (!user) {
    return (
      <Page narrow>
        <PageHeader title={t.report.title} />
        <Alert variant="info">{t.report.loginRequired}</Alert>
        <div className="mt-4 flex gap-3">
          <Link to="/login"><Button>{t.nav.login}</Button></Link>
          <Link to="/register"><Button variant="outline">{t.nav.register}</Button></Link>
        </div>
      </Page>
    );
  }

  if (result) {
    const c = result.complaint;
    const analysis = c.ai;
    return (
      <Page narrow>
        <PageHeader title={t.report.successTitle} />
        <div className="rounded-lg border border-slate-200 bg-white p-5 space-y-4">
          <p>
            {t.report.successBody}{' '}
            <strong className="font-mono text-base">{c.trackingId}</strong>
          </p>

          {result.duplicate?.linked && (
            <Alert variant="warning" title={t.report.duplicateTitle}>
              {t.report.duplicateBody}
              <ul className="mt-2 list-disc pl-5">
                {result.duplicate.related.map((r: DuplicateCandidate) => (
                  <li key={r.complaint.trackingId}>
                    <Link className="underline" to={`/track/${r.complaint.trackingId}`}>{r.complaint.trackingId}</Link> ({fmt(t.report.dupDistance, { m: r.distanceMetres })})
                  </li>
                ))}
              </ul>
            </Alert>
          )}

          <div className="border-t border-slate-200 pt-4 space-y-2">
            <h2 className="text-base font-semibold">{t.report.analysisTitle}</h2>
            {analysis.status === 'failed' && <Alert variant="warning">{t.ai.failed}</Alert>}
            <dl className="grid grid-cols-[auto,1fr] gap-x-4 gap-y-1.5 text-sm">
              <dt className="text-slate-600">{t.report.suggestedCategory}</dt>
              <dd>{analysis.suggestedCategory ? t.categories[analysis.suggestedCategory as keyof typeof t.categories] : '-'}</dd>
              <dt className="text-slate-600">{t.report.suggestedDepartment}</dt>
              <dd>{analysis.suggestedDepartment ?? '-'}</dd>
              <dt className="text-slate-600">{t.report.severity}</dt>
              <dd><SeverityBadge score={c.priority.score} /></dd>
            </dl>
            <p className="text-sm text-slate-700 bg-slate-50 border border-slate-200 rounded p-2">
              <strong>{analysis.status === 'failed' ? t.ai.failed : analysis.isSimulated ? t.ai.simulated : t.ai.live}.</strong> {t.ai.note}
            </p>
          </div>

          <div className="flex flex-wrap gap-3 pt-2">
            <Link to={`/track/${c.trackingId}`}><Button>{t.report.successTrack}</Button></Link>
            <Button variant="outline" onClick={() => window.location.assign('/citizen/new')}>
              {t.report.successAnother}
            </Button>
          </div>
        </div>
      </Page>
    );
  }

  const validateStep1 = () => {
    if (description.trim().length < 15) {
      setErrors({ description: t.report.errDescription });
      return false;
    }
    setErrors({});
    return true;
  };

  const validateStep2 = () => {
    if (!pin) {
      setErrors({ location: t.report.errLocation });
      return false;
    }
    setErrors({});
    return true;
  };

  const useGps = () => {
    if (!navigator.geolocation) {
      showToast(t.report.gpsFailed, 'warning');
      return;
    }
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        const p = { lat: pos.coords.latitude, lng: pos.coords.longitude };
        if (!inRegion(p)) {
          setErrors((e) => ({ ...e, location: t.errors.LOCATION_OUTSIDE_REGION }));
          return;
        }
        setPin(p);
        setAccuracy('gps');
        setArea(nearestArea(p));
      },
      () => showToast(t.report.gpsFailed, 'warning'),
      { enableHighAccuracy: true, timeout: 10000 },
    );
  };

  const onPhoto = (e: React.ChangeEvent<HTMLInputElement>) => {
    const f = e.target.files?.[0];
    if (!f) return;
    if (!IMAGE_TYPES.includes(f.type) || f.size > MAX_IMAGE_BYTES) {
      setErrors((p) => ({ ...p, photo: t.report.photoInvalid }));
      e.target.value = '';
      return;
    }
    setErrors((p) => ({ ...p, photo: '' }));
    setPhoto(f);
  };

  const goToReview = async () => {
    if (!validateStep2()) return;
    setCandidates([]);
    setSupportedId(null);
    setStep(3);
    try {
      setCandidates(await complaintsApi.checkDuplicates({ description: description.trim(), latitude: pin!.lat, longitude: pin!.lng, category: category || undefined }));
    } catch {
      /* the duplicate preview is advisory; failing it never blocks submission */
    }
  };

  const supportInstead = async (trackingId: string) => {
    try {
      await complaintsApi.support(trackingId, true);
      setSupportedId(trackingId);
      showToast(t.report.dupSupported, 'success');
    } catch (e: any) {
      showToast(errorMessage(e, t), 'error');
    }
  };

  const submit = async () => {
    if (!pin) return;
    setSubmitting(true);
    try {
      const fd = new FormData();
      const text = description.trim();
      fd.append('description', text);
      fd.append('area', area);
      if (address.trim()) fd.append('address', address.trim());
      fd.append('latitude', String(pin.lat));
      fd.append('longitude', String(pin.lng));
      fd.append('locationAccuracy', accuracy);
      fd.append('language', language);
      if (transcript) {
        fd.append('transcriptText', transcript.text);
        fd.append('transcriptEditedByUser', String(transcript.edited));
      }
      if (category) fd.append('category', category);
      if (photo) fd.append('image', photo);
      if (audio) fd.append('audio', audio, 'recording.webm');
      const data = await complaintsApi.submit(fd);
      setResult(data);
    } catch (e: any) {
      showToast(errorMessage(e, t), 'error');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <Page narrow>
      <PageHeader title={t.report.title} subtitle={t.report.subtitle} />
      <p className="text-sm text-slate-600 mb-2" aria-live="polite">
        {fmt(t.report.step, { n: step })}: {[t.report.stepDescribe, t.report.stepLocation, t.report.stepReview][step - 1]}
      </p>
      <div className="h-1.5 bg-slate-200 rounded mb-6" aria-hidden="true">
        <div className="h-full bg-civic-700 rounded" style={{ width: `${(step / 3) * 100}%` }} />
      </div>

      <div className="rounded-lg border border-slate-200 bg-white p-5 space-y-5">
        {step === 1 && (
          <>
            <Select label={t.report.categoryLabel} value={category} onChange={(e) => setCategory(e.target.value)}>
              <option value="">{t.report.categoryAuto}</option>
              {CATEGORIES.map((c) => (
                <option key={c} value={c}>{t.categories[c]}</option>
              ))}
            </Select>

            <TextArea
              label={t.report.descriptionLabel}
              helperText={t.report.descriptionHelp}
              rows={6}
              required
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              error={errors.description}
            />

            {!showVoice ? (
              <div className="flex flex-wrap items-center gap-3">
                <Button type="button" variant="outline" leftIcon={<Mic className="w-4 h-4" />} onClick={() => setShowVoice(true)}>
                  {t.report.voiceBtn}
                </Button>
                {audio && <span className="text-sm text-emerald-800">{t.report.voiceAttached}</span>}
              </div>
            ) : (
              <VoicePanel
                onClose={() => setShowVoice(false)}
                onAccept={(text, blob, edited) => {
                  if (text) {
                    setDescription((d) => (d.trim() ? `${d.trim()}\n${text}` : text));
                    setTranscript({ text, edited });
                  }
                  setAudio(blob);
                  setShowVoice(false);
                }}
              />
            )}

            <div className="flex justify-end">
              <Button onClick={() => validateStep1() && setStep(2)}>{t.common.next}</Button>
            </div>
          </>
        )}

        {step === 2 && (
          <>
            <Select label={t.report.areaLabel} value={area} onChange={(e) => setArea(e.target.value)}>
              {AREAS.map((a) => <option key={a} value={a}>{a}</option>)}
            </Select>
            <Input
              label={`${t.report.addressLabel} (${t.common.optional})`}
              helperText={t.report.addressHelp}
              value={address}
              onChange={(e) => setAddress(e.target.value)}
              maxLength={200}
            />

            <div className="space-y-2">
              <div className="flex flex-wrap items-center justify-between gap-2">
                <span className="text-sm font-medium">{t.report.locationLabel}</span>
                <Button type="button" size="sm" variant="outline" leftIcon={<LocateFixed className="w-4 h-4" />} onClick={useGps}>
                  {t.report.useGps}
                </Button>
              </div>
              <LocationPicker value={pin} onChange={(p) => {
                  if (!inRegion(p)) {
                    setErrors((e) => ({ ...e, location: t.errors.LOCATION_OUTSIDE_REGION }));
                    return;
                  }
                  setErrors((e) => ({ ...e, location: '' }));
                  setPin(p);
                  setAccuracy('map_pin');
                  setArea(nearestArea(p));
                }} attribution={t.map.attribution} />
              <p className="text-sm text-slate-600">
                {pin ? `${t.report.coordinates}: ${pin.lat.toFixed(5)}, ${pin.lng.toFixed(5)}` : t.report.pickOnMap}
              </p>
              {errors.location && <p className="text-sm text-rose-700" role="alert">{errors.location}</p>}
            </div>

            <div className="space-y-2">
              <label htmlFor="photo" className="block text-sm font-medium">
                {t.report.photoLabel} ({t.common.optional})
              </label>
              <input id="photo" type="file" accept={IMAGE_TYPES.join(',')} onChange={onPhoto} className="block text-sm" />
              <p className="text-sm text-slate-600">{t.report.photoHelp}</p>
              {errors.photo && <p className="text-sm text-rose-700" role="alert">{errors.photo}</p>}
              {photoUrl && (
                <div className="relative inline-block">
                  <img src={photoUrl} alt="" className="h-32 rounded border border-slate-300" />
                  <button
                    type="button"
                    onClick={() => setPhoto(null)}
                    className="absolute -top-2 -right-2 bg-white border border-slate-400 rounded-full p-1"
                    aria-label={t.report.photoRemove}
                  >
                    <X className="w-3.5 h-3.5" />
                  </button>
                </div>
              )}
            </div>

            <div className="flex justify-between">
              <Button variant="outline" onClick={() => setStep(1)}>{t.common.back}</Button>
              <Button onClick={goToReview}>{t.common.next}</Button>
            </div>
          </>
        )}

        {step === 3 && (
          <>
            <h2 className="text-base font-semibold">{t.report.review}</h2>
            <dl className="grid grid-cols-[auto,1fr] gap-x-4 gap-y-2 text-sm">
              <dt className="text-slate-600">{t.report.categoryLabel}</dt>
              <dd>{category ? t.categories[category as keyof typeof t.categories] : t.report.categoryAuto}</dd>
              <dt className="text-slate-600">{t.common.description}</dt>
              <dd className="whitespace-pre-wrap">{description}</dd>
              <dt className="text-slate-600">{t.common.location}</dt>
              <dd>{area}{address ? `, ${address}` : ''} ({pin?.lat.toFixed(5)}, {pin?.lng.toFixed(5)})</dd>
              {photoUrl && (<><dt className="text-slate-600">{t.report.photoLabel}</dt><dd><img src={photoUrl} alt="" className="h-24 rounded border" /></dd></>)}
              {audio && (<><dt className="text-slate-600">{t.report.voiceTitle}</dt><dd>{t.report.voiceAttached}</dd></>)}
            </dl>
            {candidates.length > 0 && (
              <Alert variant="warning" title={t.report.dupTitle}>
                <p>{t.report.dupBody}</p>
                <ul className="mt-3 space-y-3">
                  {candidates.map((c) => (
                    <li key={c.complaint.trackingId} className="rounded border border-amber-300 bg-white p-3 text-slate-900">
                      <div className="flex flex-wrap items-center gap-2 mb-1">
                        <Link to={`/track/${c.complaint.trackingId}`} target="_blank" className="font-mono text-xs underline">{c.complaint.trackingId}</Link>
                        <StatusBadge status={c.complaint.status} size="sm" />
                        <span className="text-xs text-slate-600">{fmt(t.report.dupDistance, { m: c.distanceMetres })}</span>
                      </div>
                      <p className="text-sm mb-2">{c.complaint.description}</p>
                      {!c.isOwn && (
                        <Button size="sm" variant="outline" disabled={supportedId === c.complaint.trackingId} onClick={() => supportInstead(c.complaint.trackingId)}>
                          {supportedId === c.complaint.trackingId ? t.report.dupSupported : t.report.dupSupport}
                        </Button>
                      )}
                    </li>
                  ))}
                </ul>
              </Alert>
            )}
            <Alert variant="info">{t.home.notice}</Alert>
            <div className="flex justify-between">
              <Button variant="outline" onClick={() => setStep(2)}>{t.common.back}</Button>
              <Button onClick={submit} isLoading={submitting}>
                {submitting ? t.report.submitting : candidates.length > 0 ? t.report.dupSubmit : t.report.submitBtn}
              </Button>
            </div>
          </>
        )}
      </div>
    </Page>
  );
};

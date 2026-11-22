import React, { useCallback, useEffect, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import { adminApi } from '../api/adminApi';
import { AdminComplaint, AdminDepartment, AdminUpdate, CATEGORIES, ComplaintCategory, ComplaintStatus, DuplicateGroupView, STATUSES } from '../types';
import { useLanguage } from '../contexts/LanguageContext';
import { useToast } from '../contexts/ToastContext';
import { fmt, statusKey } from '../i18n';
import { errorMessage, fieldErrors } from '../utils/errorMessage';
import { formatDate } from '../utils/formatDate';
import { AdminShell } from '../components/AdminShell';
import { StatusBadge } from '../components/StatusBadge';
import { SeverityBadge } from '../components/SeverityBadge';
import { ProvenanceBadge } from '../components/ProvenanceBadge';
import { Button } from '../components/ui/Button';
import { Alert } from '../components/ui/Alert';
import { Select, TextArea } from '../components/ui/Field';
import { Input } from '../components/ui/Input';

const Card: React.FC<{ title: string; children: React.ReactNode; main?: boolean }> = ({ title, children, main }) => (
  <section className="rounded-lg border border-slate-200 bg-white p-4 space-y-3">
    {main ? <h1 className="text-base font-semibold font-mono">{title}</h1> : <h2 className="text-base font-semibold">{title}</h2>}
    {children}
  </section>
);

const Row: React.FC<{ label: string; children: React.ReactNode }> = ({ label, children }) => (
  <>
    <dt className="text-slate-600">{label}</dt>
    <dd>{children}</dd>
  </>
);

export const AdminComplaintDetailPage: React.FC = () => {
  const { trackingId = '' } = useParams<{ trackingId: string }>();
  const { t } = useLanguage();
  const { showToast } = useToast();

  const [c, setC] = useState<AdminComplaint | null>(null);
  const [updates, setUpdates] = useState<AdminUpdate[]>([]);
  const [group, setGroup] = useState<DuplicateGroupView | null>(null);
  const [departments, setDepartments] = useState<AdminDepartment[]>([]);
  const [error, setError] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  // form state
  const [newStatus, setNewStatus] = useState<ComplaintStatus>('under_review');
  const [statusNote, setStatusNote] = useState('');
  const [statusPublic, setStatusPublic] = useState(true);
  const [statusErr, setStatusErr] = useState('');
  const [deptId, setDeptId] = useState('');
  const [verifyCat, setVerifyCat] = useState<ComplaintCategory>('Other');
  const [comment, setComment] = useState('');
  const [commentPublic, setCommentPublic] = useState(false);
  const [evFile, setEvFile] = useState<File | null>(null);
  const [evCaption, setEvCaption] = useState('');
  const [busy, setBusy] = useState<string | null>(null);

  const load = useCallback(async () => {
    try {
      const d = await adminApi.get(trackingId);
      setC(d.complaint);
      setUpdates(d.updates);
      setGroup(d.duplicateGroup);
      setNewStatus((s) => (d.complaint.status === s ? STATUSES.find((x) => x !== d.complaint.status) ?? s : s));
      setVerifyCat(d.complaint.category);
      setError(null);
    } catch (e) {
      setError(e);
    } finally {
      setLoading(false);
    }
  }, [trackingId]);

  useEffect(() => {
    setLoading(true);
    load();
    adminApi.departments().then((d) => setDepartments(d.filter((x) => x.isActive))).catch(() => undefined);
  }, [load]);

  const run = async (key: string, fn: () => Promise<unknown>, after?: () => void) => {
    setBusy(key);
    try {
      await fn();
      showToast(t.admin.saved, 'success');
      after?.();
      await load();
    } catch (e) {
      showToast(errorMessage(e, t), 'error');
      return e;
    } finally {
      setBusy(null);
    }
    return null;
  };

  if (loading) return <AdminShell><p className="text-slate-600">{t.common.loading}</p></AdminShell>;
  if (error || !c) {
    return (
      <AdminShell>
        <Alert variant={error?.code === 'NOT_FOUND' ? 'warning' : 'error'}>{error?.code === 'NOT_FOUND' ? t.track.notFound : errorMessage(error, t)}</Alert>
        <p className="mt-3"><Link to="/admin/complaints" className="underline">{t.admin.backToList}</Link></p>
      </AdminShell>
    );
  }

  const ai = c.aiFull;
  const f = c.priority.factors;
  const factors: [string, number][] = [
    [t.admin.factorSafety, f.safety],
    [t.admin.factorAffected, f.affected],
    [t.admin.factorEvidence, f.evidence],
    [t.admin.factorDuration, f.duration],
  ];

  const submitStatus = async () => {
    setStatusErr('');
    if (newStatus === 'rejected' && !statusNote.trim()) {
      setStatusErr(t.admin.noteRequired);
      return;
    }
    const err = await run('status', () => adminApi.setStatus(c.trackingId, { status: newStatus, note: statusNote.trim(), isPublic: statusPublic }), () => setStatusNote(''));
    if (err) setStatusErr(fieldErrors(err).note ?? '');
  };

  return (
    <AdminShell>
      <p className="mb-3 text-sm"><Link to="/admin/complaints" className="underline text-civic-800">← {t.admin.backToList}</Link></p>
      <div className="grid gap-6 lg:grid-cols-3">
        {/* ---------- Left: the report and history ---------- */}
        <div className="lg:col-span-2 space-y-6">
          <Card title={c.trackingId} main>
            <div className="flex flex-wrap items-center gap-2">
              <StatusBadge status={c.status} />
              <ProvenanceBadge source={c.provenance} size="md" />
              <SeverityBadge score={c.priority.score} />
            </div>
            <p className="whitespace-pre-wrap">{c.description}</p>
            {c.transcript?.text && (
              <p className="text-sm rounded bg-slate-50 border border-slate-200 p-2">
                <strong>{t.admin.transcript}:</strong> {c.transcript.text}
              </p>
            )}
            {c.images.map((m, i) => <img key={i} src={m.url} alt="" className="max-h-72 rounded border border-slate-200" />)}
            {c.audio?.map((m, i) => <audio key={i} controls src={m.url} className="w-full" />)}
            <dl className="grid grid-cols-[auto,1fr] gap-x-4 gap-y-1.5 text-sm pt-2 border-t border-slate-100">
              <Row label={t.common.location}>
                {c.location.area}{c.location.address ? `, ${c.location.address}` : ''} ({c.location.coordinates[0].toFixed(5)}, {c.location.coordinates[1].toFixed(5)})
                {c.location.accuracy === 'area_approx' && <span className="block text-amber-900">{t.map.approx}</span>}
              </Row>
              <Row label={t.common.reportedOn}>{formatDate(c.createdAt)}</Row>
              <Row label={t.common.supports}>{c.supportCount}</Row>
              <Row label={t.admin.reporter}>
                {c.reporter.name ? `${c.reporter.name} · ${c.reporter.email}${c.reporter.phone ? ` · ${c.reporter.phone}` : ''}` : '-'}
              </Row>
            </dl>
          </Card>

          <Card title={t.admin.timeline}>
            <ol className="space-y-3 border-l-2 border-slate-200 pl-4">
              {updates.map((u) => (
                <li key={u.id} className="relative text-sm">
                  <span className="absolute -left-[22px] top-1.5 w-3 h-3 rounded-full bg-civic-700 border-2 border-white" aria-hidden="true" />
                  <div className="flex flex-wrap items-center gap-2">
                    <span className="font-medium">
                      {u.toStatus ? t.status[statusKey(u.toStatus)] : u.type}
                    </span>
                    <span className={`text-xs rounded border px-1.5 ${u.isPublic ? 'border-emerald-300 bg-emerald-50 text-emerald-900' : 'border-slate-300 bg-slate-100 text-slate-800'}`}>
                      {u.isPublic ? t.admin.public : t.admin.internal}
                    </span>
                  </div>
                  {u.note && <div className="text-slate-700">{u.note}</div>}
                  <div className="text-xs text-slate-600">
                    {formatDate(u.createdAt)}
                    {u.actor ? ` · ${fmt(t.admin.by, { name: u.actor.name })}` : ''}
                  </div>
                </li>
              ))}
            </ol>
          </Card>

          {group && (
            <Card title={t.admin.dupTitle}>
              <p className="text-sm text-slate-600">{t.admin.dupNote}</p>
              <ul className="space-y-1.5 text-sm">
                {group.members.filter((m) => m.trackingId !== c.trackingId).map((m) => (
                  <li key={m.id}>
                    <Link className="font-mono text-xs underline text-civic-800" to={`/admin/complaints/${m.trackingId}`}>{m.trackingId}</Link>{' '}
                    <span className="text-slate-700">{m.title}</span>
                  </li>
                ))}
              </ul>
              <p className="text-sm"><Link to="/admin/duplicates" className="underline">{t.admin.navDuplicates}</Link></p>
            </Card>
          )}
        </div>

        {/* ---------- Right: AI suggestion vs administrator decisions ---------- */}
        <aside className="space-y-6">
          <Card title={t.admin.aiSuggestion}>
            {ai.status === 'failed' ? (
              <Alert variant="warning">{t.ai.failed}</Alert>
            ) : (
              <dl className="grid grid-cols-[auto,1fr] gap-x-3 gap-y-1.5 text-sm">
                <Row label={t.common.category}>{ai.category ? t.categories[ai.category] : '-'}</Row>
                <Row label={t.admin.aiSuggestedDepartment}>{ai.suggestedDepartment ?? '-'}</Row>
                <Row label={t.admin.aiSuggestedPriority}>{ai.suggestedPriority ? t.priority[ai.suggestedPriority] : '-'}</Row>
                {ai.safetyRisks?.length > 0 && <Row label={t.admin.aiRisks}>{ai.safetyRisks.join(', ')}</Row>}
                {ai.publicImpact && <Row label={t.admin.aiImpact}>{ai.publicImpact}</Row>}
                {ai.keywords?.length > 0 && <Row label={t.admin.aiKeywords}>{ai.keywords.join(', ')}</Row>}
                {typeof ai.confidence === 'number' && <Row label={t.admin.aiConfidence}>{Math.round(ai.confidence * 100)}%</Row>}
                <Row label={t.admin.aiModel}>{ai.isSimulated ? t.ai.simulated : ai.model ?? '-'}</Row>
              </dl>
            )}
            {ai.explanation && ai.status !== 'failed' && <p className="text-sm text-slate-700">{ai.explanation}</p>}
            <p className="text-xs text-slate-600">{t.ai.note}</p>
          </Card>

          <Card title={t.admin.scoring}>
            <ul className="space-y-1.5 text-sm">
              {factors.map(([label, v]) => (
                <li key={label}>
                  <div className="flex justify-between"><span>{label}</span><span className="tabular-nums">{Math.round(v * 100)}%</span></div>
                  <div className="h-1.5 bg-slate-100 rounded"><div className="h-full bg-civic-700 rounded" style={{ width: `${Math.round(v * 100)}%` }} /></div>
                </li>
              ))}
            </ul>
            <p className="text-xs text-slate-600">{t.admin.scoringNote} ({c.priority.modelVersion})</p>
          </Card>

          <Card title={t.admin.decisions}>
            {/* Category verification */}
            <div className="space-y-2">
              <p className="text-sm">
                <span className="text-slate-600">{t.admin.verifiedCategory}: </span>
                {c.categoryVerified ? <strong>{t.categories[c.category]} ✓</strong> : <em>{t.admin.notVerified}</em>}
              </p>
              <Select label={t.common.category} value={verifyCat} onChange={(e) => setVerifyCat(e.target.value as ComplaintCategory)}>
                {CATEGORIES.map((x) => <option key={x} value={x}>{t.categories[x]}</option>)}
              </Select>
              <Button size="sm" variant="outline" isLoading={busy === 'verify'} onClick={() => run('verify', () => adminApi.verifyCategory(c.trackingId, { category: verifyCat }))}>
                {t.admin.verifyCategory}
              </Button>
            </div>

            <hr className="border-slate-100" />

            {/* Assignment */}
            <div className="space-y-2">
              <Select label={t.admin.assign} value={deptId} onChange={(e) => setDeptId(e.target.value)} helperText={c.department ? `${t.common.department}: ${c.department.name}` : t.common.unassigned}>
                <option value="">-</option>
                {departments.map((d) => <option key={d._id} value={d._id}>{d.code} · {d.name}</option>)}
              </Select>
              <Button size="sm" variant="outline" disabled={!deptId} isLoading={busy === 'assign'} onClick={() => run('assign', () => adminApi.assign(c.trackingId, { departmentId: deptId }), () => setDeptId(''))}>
                {t.admin.assignBtn}
              </Button>
            </div>

            <hr className="border-slate-100" />

            {/* Status */}
            <div className="space-y-2">
              <Select label={t.admin.newStatus} value={newStatus} onChange={(e) => setNewStatus(e.target.value as ComplaintStatus)}>
                {STATUSES.filter((s) => s !== c.status).map((s) => <option key={s} value={s}>{t.status[s]}</option>)}
              </Select>
              <TextArea label={t.admin.note} rows={2} value={statusNote} onChange={(e) => setStatusNote(e.target.value)} error={statusErr} helperText={t.admin.noteHelp} />
              <label className="flex items-center gap-2 text-sm">
                <input type="checkbox" checked={statusPublic} onChange={(e) => setStatusPublic(e.target.checked)} />
                {t.admin.publicNote}
              </label>
              <Button size="sm" isLoading={busy === 'status'} onClick={submitStatus}>{t.admin.updateStatus}</Button>
            </div>
          </Card>

          <Card title={t.admin.commentTitle}>
            <TextArea label={t.admin.note} rows={2} value={comment} onChange={(e) => setComment(e.target.value)} />
            <label className="flex items-center gap-2 text-sm">
              <input type="checkbox" checked={commentPublic} onChange={(e) => setCommentPublic(e.target.checked)} />
              {t.admin.commentPublic}
            </label>
            <Button size="sm" variant="outline" disabled={!comment.trim()} isLoading={busy === 'comment'} onClick={() => run('comment', () => adminApi.comment(c.trackingId, { note: comment.trim(), isPublic: commentPublic }), () => setComment(''))}>
              {t.admin.commentBtn}
            </Button>
          </Card>

          <Card title={t.admin.evidenceTitle}>
            {c.resolutionEvidence.length > 0 && (
              <div className="grid grid-cols-2 gap-2">
                {c.resolutionEvidence.map((ev, i) => (
                  <figure key={i}><img src={ev.url} alt={ev.caption} className="rounded border border-slate-200" />{ev.caption && <figcaption className="text-xs text-slate-700">{ev.caption}</figcaption>}</figure>
                ))}
              </div>
            )}
            <Input label={t.admin.evidenceCaption} value={evCaption} onChange={(e) => setEvCaption(e.target.value)} maxLength={300} />
            <div>
              <label htmlFor="evidence" className="block text-sm font-medium mb-1">{t.admin.evidenceUpload}</label>
              <input id="evidence" type="file" accept="image/jpeg,image/png,image/webp" className="text-sm" onChange={(e) => setEvFile(e.target.files?.[0] ?? null)} />
              <p className="text-xs text-slate-600 mt-1">{t.admin.evidenceHelp}</p>
            </div>
            <Button size="sm" variant="outline" disabled={!evFile} isLoading={busy === 'evidence'} onClick={() => run('evidence', () => adminApi.uploadEvidence(c.trackingId, evFile!, evCaption.trim()), () => { setEvFile(null); setEvCaption(''); const el = document.getElementById('evidence') as HTMLInputElement | null; if (el) el.value = ''; })}>
              {t.admin.evidenceUpload}
            </Button>
          </Card>
        </aside>
      </div>
    </AdminShell>
  );
};

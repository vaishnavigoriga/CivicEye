import React, { useCallback, useEffect, useState } from 'react';
import { adminApi } from '../api/adminApi';
import { AdminDepartment } from '../types';
import { useLanguage } from '../contexts/LanguageContext';
import { useToast } from '../contexts/ToastContext';
import { errorMessage, fieldErrors } from '../utils/errorMessage';
import { AdminShell } from '../components/AdminShell';
import { PageHeader } from '../components/PageHeader';
import { Button } from '../components/ui/Button';
import { Input } from '../components/ui/Input';
import { Select, TextArea } from '../components/ui/Field';
import { Alert } from '../components/ui/Alert';

type Draft = Omit<AdminDepartment, '_id'> & { _id?: string };
const EMPTY: Draft = { code: '', name: '', authority: 'OTHER', description: '', categories: [], isActive: true };

export const AdminDepartmentsPage: React.FC = () => {
  const { t } = useLanguage();
  const { showToast } = useToast();
  const [items, setItems] = useState<AdminDepartment[] | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [draft, setDraft] = useState<Draft | null>(null);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [busy, setBusy] = useState(false);

  const load = useCallback(() => {
    adminApi.departments().then(setItems).catch((e) => setError(errorMessage(e, t)));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);
  useEffect(load, [load]);

  const save = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!draft) return;
    setBusy(true);
    setErrors({});
    try {
      const { _id, ...body } = draft;
      await adminApi.saveDepartment(body, _id);
      showToast(t.admin.saved, 'success');
      setDraft(null);
      load();
    } catch (err: any) {
      setErrors(fieldErrors(err));
      showToast(errorMessage(err, t), 'error');
    } finally {
      setBusy(false);
    }
  };

  return (
    <AdminShell>
      <PageHeader title={t.admin.navDepartments} actions={!draft ? <Button onClick={() => { setErrors({}); setDraft({ ...EMPTY }); }}>{t.admin.deptNew}</Button> : undefined} />
      {error && <Alert variant="error">{error}</Alert>}

      {draft && (
        <form onSubmit={save} className="rounded-lg border border-slate-200 bg-white p-4 mb-6 grid gap-3 sm:grid-cols-2" noValidate>
          <Input label={t.admin.deptCode} value={draft.code} onChange={(e) => setDraft({ ...draft, code: e.target.value.toUpperCase() })} error={errors.code} disabled={!!draft._id} required />
          <Input label={t.admin.deptName} value={draft.name} onChange={(e) => setDraft({ ...draft, name: e.target.value })} error={errors.name} required />
          <Select label={t.admin.deptAuthority} value={draft.authority} onChange={(e) => setDraft({ ...draft, authority: e.target.value as AdminDepartment['authority'] })}>
            {['GHMC', 'HMWSSB', 'TSSPDCL', 'OTHER'].map((a) => <option key={a} value={a}>{a}</option>)}
          </Select>
          <label className="flex items-center gap-2 text-sm pt-6">
            <input type="checkbox" checked={draft.isActive} onChange={(e) => setDraft({ ...draft, isActive: e.target.checked })} />
            {t.admin.deptActive}
          </label>
          <div className="sm:col-span-2">
            <TextArea label={t.admin.deptDescription} rows={2} value={draft.description} onChange={(e) => setDraft({ ...draft, description: e.target.value })} />
          </div>
          <div className="sm:col-span-2 flex gap-2">
            <Button type="submit" isLoading={busy}>{t.admin.deptSave}</Button>
            <Button type="button" variant="ghost" onClick={() => setDraft(null)}>{t.common.cancel}</Button>
          </div>
        </form>
      )}

      {!error && items === null && <p className="text-slate-600">{t.common.loading}</p>}
      {items && (
        <div className="overflow-x-auto rounded-lg border border-slate-200 bg-white">
          <table className="w-full text-sm">
            <thead className="bg-slate-50 text-left text-slate-600">
              <tr>
                <th className="px-3 py-2">{t.admin.deptCode}</th>
                <th className="px-3 py-2">{t.admin.deptName}</th>
                <th className="px-3 py-2">{t.admin.deptAuthority}</th>
                <th className="px-3 py-2">{t.admin.deptActive}</th>
                <th className="px-3 py-2"></th>
              </tr>
            </thead>
            <tbody>
              {items.map((d) => (
                <tr key={d._id} className="border-t border-slate-100">
                  <td className="px-3 py-2 font-mono text-xs">{d.code}</td>
                  <td className="px-3 py-2">{d.name}</td>
                  <td className="px-3 py-2">{d.authority}</td>
                  <td className="px-3 py-2">{d.isActive ? '✓' : '—'}</td>
                  <td className="px-3 py-2 text-right">
                    <Button size="sm" variant="outline" onClick={() => { setErrors({}); setDraft({ ...d }); }}>{t.admin.deptEdit}</Button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </AdminShell>
  );
};

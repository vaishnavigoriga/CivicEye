import React, { useState } from 'react';
import { authApi } from '../api/authApi';
import { useAuth } from '../contexts/AuthContext';
import { useLanguage } from '../contexts/LanguageContext';
import { useToast } from '../contexts/ToastContext';
import { LANGUAGES, type Language } from '../i18n';
import { errorMessage, fieldErrors } from '../utils/errorMessage';
import { Button } from '../components/ui/Button';
import { Input } from '../components/ui/Input';
import { Select } from '../components/ui/Field';
import { Alert } from '../components/ui/Alert';
import { Page, PageHeader } from '../components/PageHeader';

export const ProfilePage: React.FC = () => {
  const { user, refreshUser } = useAuth();
  const { t, setLanguage } = useLanguage();
  const { showToast } = useToast();

  const [name, setName] = useState(user?.name ?? '');
  const [phone, setPhone] = useState(user?.phone ?? '');
  const [lang, setLang] = useState<Language>(user?.preferredLanguage ?? 'en');
  const [profileErrors, setProfileErrors] = useState<Record<string, string>>({});
  const [profileBusy, setProfileBusy] = useState(false);

  const [current, setCurrent] = useState('');
  const [next, setNext] = useState('');
  const [confirm, setConfirm] = useState('');
  const [pwErrors, setPwErrors] = useState<Record<string, string>>({});
  const [pwBusy, setPwBusy] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);

  if (!user) return null;

  const saveProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    const errs: Record<string, string> = {};
    if (name.trim().length < 2) errs.name = t.auth.errName;
    setProfileErrors(errs);
    if (Object.keys(errs).length) return;
    setProfileBusy(true);
    try {
      await authApi.updateProfile({ name: name.trim(), phone: phone.trim(), preferredLanguage: lang });
      setLanguage(lang);
      await refreshUser();
      showToast(t.profile.savedProfile, 'success');
    } catch (err) {
      setProfileErrors(fieldErrors(err));
      showToast(errorMessage(err, t), 'error');
    } finally {
      setProfileBusy(false);
    }
  };

  const changePassword = async (e: React.FormEvent) => {
    e.preventDefault();
    const errs: Record<string, string> = {};
    if (!current) errs.current = t.profile.errCurrent;
    if (next.length < 8) errs.next = t.auth.errPassword;
    if (confirm !== next) errs.confirm = t.profile.errMismatch;
    setPwErrors(errs);
    setFormError(null);
    if (Object.keys(errs).length) return;
    setPwBusy(true);
    try {
      await authApi.updateProfile({ currentPassword: current, newPassword: next });
      setCurrent('');
      setNext('');
      setConfirm('');
      showToast(t.profile.passwordChanged, 'success');
    } catch (err: any) {
      const f = fieldErrors(err);
      if (f.currentPassword) setPwErrors({ current: t.profile.errWrongCurrent });
      else setFormError(errorMessage(err, t));
    } finally {
      setPwBusy(false);
    }
  };

  return (
    <Page narrow>
      <PageHeader title={t.profile.title} subtitle={t.profile.subtitle} />

      <form onSubmit={saveProfile} noValidate className="rounded-lg border border-slate-200 bg-white p-5 space-y-4 mb-6">
        <h2 className="text-base font-semibold">{t.profile.personal}</h2>
        <Input label={t.auth.name} value={name} onChange={(e) => setName(e.target.value)} error={profileErrors.name} autoComplete="name" required />
        <Input label={t.profile.email} value={user.email} disabled readOnly />
        <Input label={`${t.auth.phone} (${t.common.optional})`} type="tel" value={phone} onChange={(e) => setPhone(e.target.value)} error={profileErrors.phone} autoComplete="tel" />
        <Select label={t.profile.language} value={lang} onChange={(e) => setLang(e.target.value as Language)}>
          {LANGUAGES.map((l) => <option key={l.code} value={l.code}>{l.label}</option>)}
        </Select>
        <p className="text-sm text-slate-600">{t.profile.role}: {user.role === 'admin' ? t.profile.roleAdmin : t.profile.roleCitizen}</p>
        <Button type="submit" isLoading={profileBusy}>{t.profile.saveProfile}</Button>
      </form>

      <form onSubmit={changePassword} noValidate className="rounded-lg border border-slate-200 bg-white p-5 space-y-4">
        <h2 className="text-base font-semibold">{t.profile.passwordSection}</h2>
        {formError && <Alert variant="error">{formError}</Alert>}
        <Input label={t.profile.currentPassword} type="password" autoComplete="current-password" value={current} onChange={(e) => setCurrent(e.target.value)} error={pwErrors.current} />
        <Input label={t.profile.newPassword} type="password" autoComplete="new-password" value={next} onChange={(e) => setNext(e.target.value)} error={pwErrors.next} />
        <Input label={t.profile.confirmPassword} type="password" autoComplete="new-password" value={confirm} onChange={(e) => setConfirm(e.target.value)} error={pwErrors.confirm} />
        <Button type="submit" isLoading={pwBusy}>{t.profile.changePassword}</Button>
      </form>
    </Page>
  );
};

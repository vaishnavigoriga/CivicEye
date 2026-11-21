import React, { useState } from 'react';
import { errorMessage } from '../utils/errorMessage';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { useLanguage } from '../contexts/LanguageContext';
import { useToast } from '../contexts/ToastContext';
import { fmt } from '../i18n';
import { Button } from '../components/ui/Button';
import { Input } from '../components/ui/Input';
import { Alert } from '../components/ui/Alert';
import { Page, PageHeader } from '../components/PageHeader';

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export const RegisterPage: React.FC = () => {
  const { register } = useAuth();
  const { t, language } = useLanguage();
  const { showToast } = useToast();
  const navigate = useNavigate();
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [password, setPassword] = useState('');
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [formError, setFormError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    const next: Record<string, string> = {};
    if (name.trim().length < 2) next.name = t.auth.errName;
    if (!EMAIL_RE.test(email.trim())) next.email = t.auth.errEmail;
    if (password.length < 8) next.password = t.auth.errPassword;
    setErrors(next);
    setFormError(null);
    if (Object.keys(next).length) return;

    setBusy(true);
    try {
      const user = await register({
        name: name.trim(),
        email: email.trim(),
        password,
        phone: phone.trim() || undefined,
        preferredLanguage: language,
      });
      showToast(fmt(t.auth.welcome, { name: user?.name ?? name.trim() }), 'success');
      navigate('/citizen/dashboard', { replace: true });
    } catch (err: any) {
      setFormError(errorMessage(err, t));
    } finally {
      setBusy(false);
    }
  };

  return (
    <Page narrow>
      <PageHeader title={t.auth.registerTitle} />
      <form onSubmit={submit} noValidate className="rounded-lg border border-slate-200 bg-white p-5 space-y-4 max-w-md">
        {formError && <Alert variant="error">{formError}</Alert>}
        <Input label={t.auth.name} autoComplete="name" value={name} onChange={(e) => setName(e.target.value)} error={errors.name} required />
        <Input label={t.auth.email} type="email" autoComplete="email" value={email} onChange={(e) => setEmail(e.target.value)} error={errors.email} required />
        <Input label={`${t.auth.phone} (${t.common.optional})`} type="tel" autoComplete="tel" value={phone} onChange={(e) => setPhone(e.target.value)} />
        <Input label={t.auth.password} type="password" autoComplete="new-password" value={password} onChange={(e) => setPassword(e.target.value)} error={errors.password} required />
        <Button type="submit" isLoading={busy} className="w-full">
          {busy ? t.auth.registering : t.auth.registerBtn}
        </Button>
        <p className="text-sm text-slate-700">
          {t.auth.haveAccount}{' '}
          <Link to="/login" className="text-civic-700 underline">{t.nav.login}</Link>
        </p>
      </form>
    </Page>
  );
};

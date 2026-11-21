import React, { useState } from 'react';
import { errorMessage } from '../utils/errorMessage';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { useLanguage } from '../contexts/LanguageContext';
import { useToast } from '../contexts/ToastContext';
import { fmt } from '../i18n';
import { Button } from '../components/ui/Button';
import { Input } from '../components/ui/Input';
import { Alert } from '../components/ui/Alert';
import { Page, PageHeader } from '../components/PageHeader';

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export const LoginPage: React.FC = () => {
  const { login } = useAuth();
  const { t } = useLanguage();
  const { showToast } = useToast();
  const navigate = useNavigate();
  const location = useLocation();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [errors, setErrors] = useState<{ email?: string; password?: string }>({});
  const [formError, setFormError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    const next: typeof errors = {};
    if (!EMAIL_RE.test(email.trim())) next.email = t.auth.errEmail;
    if (!password) next.password = t.auth.errPasswordRequired;
    setErrors(next);
    setFormError(null);
    if (Object.keys(next).length) return;

    setBusy(true);
    try {
      const user = await login({ email: email.trim(), password });
      showToast(fmt(t.auth.welcome, { name: user?.name ?? '' }), 'success');
      const from = (location.state as any)?.from;
      navigate(from || (user?.role === 'admin' ? '/admin' : '/citizen/dashboard'), { replace: true });
    } catch (err: any) {
      setFormError(errorMessage(err, t));
    } finally {
      setBusy(false);
    }
  };

  return (
    <Page narrow>
      <PageHeader title={t.auth.loginTitle} />
      <form onSubmit={submit} noValidate className="rounded-lg border border-slate-200 bg-white p-5 space-y-4 max-w-md">
        {formError && <Alert variant="error">{formError}</Alert>}
        <Input label={t.auth.email} type="email" autoComplete="email" value={email} onChange={(e) => setEmail(e.target.value)} error={errors.email} required />
        <Input label={t.auth.password} type="password" autoComplete="current-password" value={password} onChange={(e) => setPassword(e.target.value)} error={errors.password} required />
        <Button type="submit" isLoading={busy} className="w-full">
          {busy ? t.auth.loggingIn : t.auth.loginBtn}
        </Button>
        <p className="text-sm text-slate-700">
          {t.auth.noAccount}{' '}
          <Link to="/register" className="text-civic-700 underline">{t.nav.register}</Link>
        </p>
      </form>
    </Page>
  );
};

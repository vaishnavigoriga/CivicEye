import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { useToast } from '../contexts/ToastContext';
import { Language } from '../types';
import { Card, CardBody, CardFooter } from '../components/ui/Card';
import { Input } from '../components/ui/Input';
import { Button } from '../components/ui/Button';
import { Alert } from '../components/ui/Alert';
import { Eye, EyeOff, Lock, Mail, User, Phone, Globe, ArrowRight, ShieldCheck } from 'lucide-react';

export const RegisterPage: React.FC = () => {
  const { register } = useAuth();
  const { showToast } = useToast();
  const navigate = useNavigate();

  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [phone, setPhone] = useState('');
  const [preferredLanguage, setPreferredLanguage] = useState<Language>('en');
  const [loading, setLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage(null);

    if (!name.trim() || !email.trim() || !password) {
      setErrorMessage('Please complete all required fields.');
      return;
    }

    if (password.length < 6) {
      setErrorMessage('Password must be at least 6 characters.');
      return;
    }

    setLoading(true);
    try {
      await register({
        name: name.trim(),
        email: email.trim().toLowerCase(),
        password,
        phone: phone.trim(),
        preferredLanguage,
      });
      showToast('Citizen account created successfully.', 'success');
      navigate('/citizen/dashboard');
    } catch (err: any) {
      setErrorMessage(err.message || 'Registration failed. This email may already be registered.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-[85vh] flex items-center justify-center px-4 py-12">
      <div className="max-w-md w-full space-y-6">
        {/* Header Title */}
        <div className="text-center space-y-1.5">
          <div className="w-10 h-10 rounded bg-civic-900 border border-civic-950 flex items-center justify-center text-white font-extrabold text-sm mx-auto shadow-xs">
            CE
          </div>
          <h1 className="text-2xl font-bold text-slate-900 tracking-tight">Citizen Registration</h1>
          <p className="text-xs text-slate-500">
            Create an account to report and track municipal infrastructure defects
          </p>
        </div>

        {/* Registration Card */}
        <Card elevated>
          <form onSubmit={handleSubmit}>
            <CardBody className="p-6 space-y-4">
              {errorMessage && (
                <Alert variant="error" onDismiss={() => setErrorMessage(null)}>
                  {errorMessage}
                </Alert>
              )}

              {/* Full Name */}
              <Input
                label="Full Name"
                type="text"
                required
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="e.g. Ramesh Kumar"
                leftAddon={<User className="w-4 h-4" />}
              />

              {/* Email Address */}
              <Input
                label="Email Address"
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="name@example.com"
                leftAddon={<Mail className="w-4 h-4" />}
              />

              {/* Password */}
              <Input
                label="Password"
                type={showPassword ? 'text' : 'password'}
                required
                minLength={6}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="At least 6 characters"
                leftAddon={<Lock className="w-4 h-4" />}
                rightAddon={
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="text-slate-400 hover:text-slate-700 transition-colors p-1"
                    title={showPassword ? 'Hide password' : 'Show password'}
                  >
                    {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                }
              />

              {/* Phone */}
              <Input
                label="Contact Mobile (Optional)"
                type="tel"
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                placeholder="+91 98765 43210"
                helperText="Used for zonal status notifications"
                leftAddon={<Phone className="w-4 h-4" />}
              />

              {/* Language Selection */}
              <div className="space-y-1">
                <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider">
                  Preferred Language
                </label>
                <div className="relative">
                  <select
                    value={preferredLanguage}
                    onChange={(e) => setPreferredLanguage(e.target.value as Language)}
                    className="w-full text-sm pl-9 pr-3 py-2 rounded-md border border-slate-300 focus:outline-none focus:ring-1 focus:ring-civic-700 bg-white"
                  >
                    <option value="en">English (Default)</option>
                    <option value="te">తెలుగు (Telugu)</option>
                    <option value="hi">हिन्दी (Hindi)</option>
                  </select>
                  <Globe className="w-4 h-4 text-slate-400 absolute left-3 top-2.5 pointer-events-none" />
                </div>
              </div>

              {/* Role policy disclosure */}
              <div className="p-3 rounded bg-slate-50 border border-slate-200 text-[11px] text-slate-500 flex items-start gap-2">
                <ShieldCheck className="w-4 h-4 text-teal-700 shrink-0 mt-0.5" />
                <span>
                  All self-registrations are granted Citizen permissions. Administrative dispatch privileges are restricted to verified municipal personnel.
                </span>
              </div>

              <Button
                type="submit"
                variant="primary"
                size="md"
                isLoading={loading}
                className="w-full font-semibold mt-2"
                rightIcon={<ArrowRight className="w-4 h-4" />}
              >
                Create Citizen Account
              </Button>
            </CardBody>
          </form>

          <CardFooter className="px-6 py-3.5 bg-slate-50 text-center text-xs text-slate-600 border-t border-slate-100 flex items-center justify-between">
            <span>Already registered?</span>
            <Link to="/login" className="font-bold text-civic-700 hover:text-civic-900 hover:underline">
              Sign In
            </Link>
          </CardFooter>
        </Card>
      </div>
    </div>
  );
};

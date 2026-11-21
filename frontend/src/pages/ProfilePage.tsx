import React, { useState } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { useToast } from '../contexts/ToastContext';
import { useLanguage } from '../contexts/LanguageContext';
import { authApi } from '../api/authApi';
import { Language } from '../types';
import { Breadcrumb } from '../components/ui/Breadcrumb';
import { Card, CardHeader, CardBody, CardFooter } from '../components/ui/Card';
import { Input } from '../components/ui/Input';
import { Button } from '../components/ui/Button';
import { Alert } from '../components/ui/Alert';
import { Badge } from '../components/ui/Badge';
import { User, Phone, Globe, Lock, Shield, CheckCircle, Save, KeyRound } from 'lucide-react';

export const ProfilePage: React.FC = () => {
  const { user, refreshUser } = useAuth();
  const { showToast } = useToast();
  const { setLanguage } = useLanguage();

  const [name, setName] = useState(user?.name || '');
  const [phone, setPhone] = useState(user?.phone || '');
  const [preferredLanguage, setPreferredLanguage] = useState<Language>(user?.preferredLanguage || 'en');

  // Password change fields
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');

  const [savingProfile, setSavingProfile] = useState(false);
  const [savingPassword, setSavingPassword] = useState(false);
  const [profileMessage, setProfileMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);
  const [passwordMessage, setPasswordMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  const handleUpdateProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    setProfileMessage(null);
    setSavingProfile(true);

    try {
      await authApi.updateProfile({
        name: name.trim(),
        phone: phone.trim(),
        preferredLanguage,
      });
      setLanguage(preferredLanguage);
      await refreshUser();
      setProfileMessage({ type: 'success', text: 'Profile preferences updated successfully.' });
      showToast('Profile updated.', 'success');
    } catch (err: any) {
      setProfileMessage({ type: 'error', text: err.message || 'Failed to update profile.' });
    } finally {
      setSavingProfile(false);
    }
  };

  const handleUpdatePassword = async (e: React.FormEvent) => {
    e.preventDefault();
    setPasswordMessage(null);

    if (!currentPassword) {
      setPasswordMessage({ type: 'error', text: 'Please enter your current password.' });
      return;
    }

    if (newPassword.length < 6) {
      setPasswordMessage({ type: 'error', text: 'New password must be at least 6 characters.' });
      return;
    }

    if (newPassword !== confirmPassword) {
      setPasswordMessage({ type: 'error', text: 'New passwords do not match.' });
      return;
    }

    setSavingPassword(true);
    try {
      await authApi.updateProfile({
        currentPassword,
        newPassword,
      });
      setPasswordMessage({ type: 'success', text: 'Password changed successfully.' });
      setCurrentPassword('');
      setNewPassword('');
      setConfirmPassword('');
      showToast('Password updated.', 'success');
    } catch (err: any) {
      setPasswordMessage({ type: 'error', text: err.message || 'Failed to change password.' });
    } finally {
      setSavingPassword(false);
    }
  };

  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-6">
      <Breadcrumb items={[{ label: 'Profile & Account Settings' }]} />

      <div className="pb-4 border-b border-slate-200">
        <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight">
          Account Profile & Settings
        </h1>
        <p className="text-xs text-slate-500 mt-1">
          Manage your contact information, language preferences, and account security
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {/* Left Column: Profile & Password */}
        <div className="md:col-span-2 space-y-6">
          {/* Personal Information Form */}
          <Card>
            <CardHeader>
              <h2 className="text-sm font-bold text-slate-900 flex items-center gap-2">
                <User className="w-4 h-4 text-civic-700" />
                <span>Personal Information</span>
              </h2>
            </CardHeader>
            <form onSubmit={handleUpdateProfile}>
              <CardBody className="space-y-4">
                {profileMessage && (
                  <Alert variant={profileMessage.type === 'success' ? 'success' : 'error'}>
                    {profileMessage.text}
                  </Alert>
                )}

                <Input
                  label="Full Name"
                  type="text"
                  required
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  leftAddon={<User className="w-4 h-4" />}
                />

                <Input
                  label="Registered Email Address"
                  type="email"
                  disabled
                  value={user?.email || ''}
                  helperText="Primary identifier (immutable)"
                  className="bg-slate-50 text-slate-500 cursor-not-allowed"
                />

                <Input
                  label="Contact Phone"
                  type="tel"
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  placeholder="+91 98765 43210"
                  leftAddon={<Phone className="w-4 h-4" />}
                />

                <div className="space-y-1">
                  <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider">
                    Preferred Communication Language
                  </label>
                  <div className="relative">
                    <select
                      value={preferredLanguage}
                      onChange={(e) => setPreferredLanguage(e.target.value as Language)}
                      className="w-full text-sm pl-9 pr-3 py-2 rounded-md border border-slate-300 focus:outline-none focus:ring-1 focus:ring-civic-700 bg-white"
                    >
                      <option value="en">English</option>
                      <option value="te">తెలుగు (Telugu)</option>
                      <option value="hi">हिन्दी (Hindi)</option>
                    </select>
                    <Globe className="w-4 h-4 text-slate-400 absolute left-3 top-2.5 pointer-events-none" />
                  </div>
                </div>
              </CardBody>
              <CardFooter className="flex justify-end">
                <Button
                  type="submit"
                  variant="primary"
                  size="sm"
                  isLoading={savingProfile}
                  leftIcon={<Save className="w-3.5 h-3.5" />}
                >
                  Save Profile Changes
                </Button>
              </CardFooter>
            </form>
          </Card>

          {/* Password Security Form */}
          <Card>
            <CardHeader>
              <h2 className="text-sm font-bold text-slate-900 flex items-center gap-2">
                <KeyRound className="w-4 h-4 text-civic-700" />
                <span>Account Password Security</span>
              </h2>
            </CardHeader>
            <form onSubmit={handleUpdatePassword}>
              <CardBody className="space-y-4">
                {passwordMessage && (
                  <Alert variant={passwordMessage.type === 'success' ? 'success' : 'error'}>
                    {passwordMessage.text}
                  </Alert>
                )}

                <Input
                  label="Current Password"
                  type="password"
                  required
                  value={currentPassword}
                  onChange={(e) => setCurrentPassword(e.target.value)}
                  placeholder="Verify existing password"
                  leftAddon={<Lock className="w-4 h-4" />}
                />

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <Input
                    label="New Password"
                    type="password"
                    required
                    minLength={6}
                    value={newPassword}
                    onChange={(e) => setNewPassword(e.target.value)}
                    placeholder="Min 6 characters"
                  />
                  <Input
                    label="Confirm New Password"
                    type="password"
                    required
                    minLength={6}
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    placeholder="Repeat new password"
                  />
                </div>
              </CardBody>
              <CardFooter className="flex justify-end">
                <Button
                  type="submit"
                  variant="outline"
                  size="sm"
                  isLoading={savingPassword}
                >
                  Update Password
                </Button>
              </CardFooter>
            </form>
          </Card>
        </div>

        {/* Right Column: Account & Security Metadata */}
        <div className="space-y-6">
          <Card>
            <CardHeader>
              <h3 className="text-xs font-bold text-slate-900 uppercase tracking-wider flex items-center gap-1.5">
                <Shield className="w-4 h-4 text-teal-700" />
                <span>Account Metadata</span>
              </h3>
            </CardHeader>
            <CardBody className="space-y-3 text-xs">
              <div>
                <span className="text-slate-500 block">System Access Tier:</span>
                <div className="mt-1">
                  <Badge variant={user?.role === 'admin' ? 'warning' : 'verified'} size="md">
                    {user?.role === 'admin' ? 'Municipal Administrator' : 'Verified Citizen'}
                  </Badge>
                </div>
              </div>

              <div className="pt-2 border-t border-slate-100">
                <span className="text-slate-500 block">Account Reference ID:</span>
                <span className="font-mono text-slate-800 text-[11px] font-semibold break-all">
                  {user?.id || '—'}
                </span>
              </div>

              <div className="pt-2 border-t border-slate-100">
                <span className="text-slate-500 block">Session Security:</span>
                <span className="text-slate-700 font-medium">JWT (httpOnly; SameSite=Strict)</span>
              </div>
            </CardBody>
          </Card>

          <Card className="p-4 bg-slate-50/70 border-slate-200 text-xs space-y-2 text-slate-600">
            <h4 className="font-bold text-slate-900 text-xs">Citizen Grievance Rights</h4>
            <p className="text-[11px] leading-relaxed">
              Every registered citizen has the right to file, edit, and track infrastructure defects across Greater Hyderabad, receiving full photographic proof upon resolution.
            </p>
          </Card>
        </div>
      </div>
    </div>
  );
};

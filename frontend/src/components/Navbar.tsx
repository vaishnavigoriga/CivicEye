import React, { useState } from 'react';
import { errorMessage } from '../utils/errorMessage';
import { Link, NavLink, useNavigate } from 'react-router-dom';
import { Eye, Menu, X } from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import { useLanguage } from '../contexts/LanguageContext';
import { useToast } from '../contexts/ToastContext';
import { LANGUAGES, type Language } from '../i18n';

export const Navbar: React.FC = () => {
  const { user, logout } = useAuth();
  const { t, language, setLanguage } = useLanguage();
  const { showToast } = useToast();
  const navigate = useNavigate();
  const [open, setOpen] = useState(false);

  const links = [
    { to: '/', label: t.nav.home, end: true },
    { to: '/citizen/new', label: t.nav.report },
    { to: '/explore', label: t.nav.explore },
    { to: '/track', label: t.nav.track },
    { to: '/map', label: t.nav.map },
    { to: '/analytics', label: t.nav.analytics },
    { to: '/about', label: t.nav.about },
  ];

  const linkClass = ({ isActive }: { isActive: boolean }) =>
    `px-2.5 py-1.5 rounded text-sm whitespace-nowrap ${
      isActive ? 'text-civic-800 font-semibold bg-civic-50' : 'text-slate-700 hover:text-civic-800 hover:bg-slate-100'
    }`;

  const handleLogout = async () => {
    try {
      await logout();
      showToast(t.auth.loggedOut, 'info');
      navigate('/');
    } catch (e: any) {
      showToast(errorMessage(e, t), 'error');
    }
    setOpen(false);
  };

  const langSelect = (
    <select
      value={language}
      onChange={(e) => setLanguage(e.target.value as Language)}
      className="rounded border border-slate-400 bg-white py-1 pl-2 pr-6 text-sm"
      aria-label={t.nav.language}
    >
      {LANGUAGES.map((l) => (
        <option key={l.code} value={l.code}>
          {l.label}
        </option>
      ))}
    </select>
  );

  const accountLinks = user && (
    <>
      <NavLink to="/citizen/dashboard" className={linkClass} onClick={() => setOpen(false)}>
        {t.nav.myReports}
      </NavLink>
      <NavLink to="/profile" className={linkClass} onClick={() => setOpen(false)}>
        {t.nav.profile}
      </NavLink>
      {user.role === 'admin' && (
        <NavLink to="/admin" className={linkClass} onClick={() => setOpen(false)}>
          {t.nav.admin}
        </NavLink>
      )}
      <button onClick={handleLogout} className="px-2.5 py-1.5 rounded text-sm text-slate-700 hover:bg-slate-100 text-left">
        {t.nav.logout}
      </button>
    </>
  );

  return (
    <header className="sticky top-0 z-40 bg-white border-b border-slate-200">
      <a href="#main" className="sr-only focus:not-sr-only focus:absolute focus:left-2 focus:top-2 bg-white px-3 py-1.5 rounded border">
        {t.nav.skip}
      </a>
      <div className="max-w-6xl mx-auto px-4 sm:px-6 h-14 flex items-center justify-between gap-4">
        <Link to="/" className="flex items-center gap-2 font-semibold text-civic-900 shrink-0">
          <Eye className="w-5 h-5 text-civic-700" aria-hidden="true" />
          <span>{t.brand.name}</span>
        </Link>

        <nav className="hidden xl:flex items-center gap-0.5" aria-label="Primary">
          {links.map((l) => (
            <NavLink key={l.to} to={l.to} end={l.end} className={linkClass}>
              {l.label}
            </NavLink>
          ))}
        </nav>

        <div className="hidden xl:flex items-center gap-3">
          {langSelect}
          {user ? (
            <details className="relative">
              <summary className="list-none cursor-pointer px-3 py-1.5 rounded border border-slate-300 text-sm text-slate-800 hover:bg-slate-50">
                {user.name.split(' ')[0]}
              </summary>
              <div className="absolute right-0 mt-1 w-48 bg-white border border-slate-200 rounded-md shadow-elevated p-1 flex flex-col">
                {accountLinks}
              </div>
            </details>
          ) : (
            <div className="flex items-center gap-2">
              <Link to="/login" className="px-3 py-1.5 text-sm rounded text-slate-800 hover:bg-slate-100">
                {t.nav.login}
              </Link>
              <Link to="/register" className="px-3 py-1.5 text-sm rounded bg-civic-700 text-white hover:bg-civic-800">
                {t.nav.register}
              </Link>
            </div>
          )}
        </div>

        <button
          className="xl:hidden p-2 rounded hover:bg-slate-100"
          onClick={() => setOpen((v) => !v)}
          aria-expanded={open}
          aria-label={t.nav.menu}
        >
          {open ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
        </button>
      </div>

      {open && (
        <div className="xl:hidden border-t border-slate-200 bg-white px-4 py-3 flex flex-col gap-1">
          {links.map((l) => (
            <NavLink key={l.to} to={l.to} end={l.end} className={linkClass} onClick={() => setOpen(false)}>
              {l.label}
            </NavLink>
          ))}
          <hr className="my-2" />
          {user ? (
            accountLinks
          ) : (
            <>
              <NavLink to="/login" className={linkClass} onClick={() => setOpen(false)}>
                {t.nav.login}
              </NavLink>
              <NavLink to="/register" className={linkClass} onClick={() => setOpen(false)}>
                {t.nav.register}
              </NavLink>
            </>
          )}
          <div className="pt-2">{langSelect}</div>
        </div>
      )}
    </header>
  );
};

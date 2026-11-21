import React, { useState } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { useLanguage } from '../contexts/LanguageContext';
import { Language } from '../types';
import {
  Menu,
  X,
  Globe,
  LogOut,
  User,
  Shield,
  FileText,
  MapPin,
  BarChart2,
  Info,
  PlusCircle,
  FolderGit2,
  ListFilter,
  CheckSquare,
} from 'lucide-react';

export const Navbar: React.FC = () => {
  const { user, logout } = useAuth();
  const { language, setLanguage, t } = useLanguage();
  const location = useLocation();
  const navigate = useNavigate();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  const isActive = (path: string) => {
    if (path === '/' && location.pathname === '/') return true;
    if (path !== '/' && location.pathname.startsWith(path)) return true;
    return false;
  };

  const handleLogout = async () => {
    await logout();
    setMobileMenuOpen(false);
    navigate('/');
  };

  const navLinkClass = (path: string) =>
    `px-3 py-2 text-xs font-semibold rounded-md transition-colors ${
      isActive(path)
        ? 'bg-civic-850 text-white shadow-xs'
        : 'text-slate-300 hover:text-white hover:bg-civic-850/60'
    }`;

  const mobileNavLinkClass = (path: string) =>
    `block px-3 py-2.5 rounded-md text-sm font-medium ${
      isActive(path)
        ? 'bg-civic-850 text-white font-bold'
        : 'text-slate-200 hover:bg-civic-800'
    }`;

  return (
    <header className="sticky top-0 z-40 bg-civic-900 border-b border-civic-950 text-white shadow-xs">
      {/* Institutional Top Bar */}
      <div className="bg-civic-950/70 border-b border-civic-800/40 text-[11px] text-slate-300 py-1 px-4 sm:px-6 lg:px-8">
        <div className="max-w-7xl mx-auto flex items-center justify-between">
          <div className="flex items-center gap-2">
            <span className="font-semibold text-slate-200 tracking-wide">
              Official Civic Technology Prototype
            </span>
            <span className="text-slate-500">•</span>
            <span className="text-slate-400 hidden sm:inline">Greater Hyderabad Municipal Region (GHMC & HMWSSB)</span>
          </div>

          {/* Language Switcher */}
          <div className="flex items-center gap-1">
            <Globe className="w-3 h-3 text-slate-400" />
            {(['en', 'te', 'hi'] as Language[]).map((lang) => (
              <button
                key={lang}
                onClick={() => setLanguage(lang)}
                className={`px-1.5 py-0.5 rounded transition-colors ${
                  language === lang
                    ? 'bg-civic-700 text-white font-bold'
                    : 'text-slate-400 hover:text-white'
                }`}
              >
                {lang === 'en' ? 'EN' : lang === 'te' ? 'తెలుగు' : 'हिन्दी'}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Main Navigation Bar */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-14">
          {/* Brand Identity */}
          <Link to="/" className="flex items-center gap-2.5 group">
            <div className="w-8 h-8 rounded bg-civic-700 border border-blue-400/30 flex items-center justify-center text-white font-black text-sm tracking-tighter">
              CE
            </div>
            <div>
              <div className="flex items-center gap-1.5 leading-none">
                <span className="font-extrabold text-base tracking-tight text-white">CivicEye</span>
                <span className="text-[10px] font-mono px-1 py-0.2 bg-civic-800 text-teal-300 rounded border border-civic-700">
                  HYD
                </span>
              </div>
              <span className="text-[10px] text-slate-400 font-medium tracking-wide">Municipal Intelligence</span>
            </div>
          </Link>

          {/* Desktop Navigation Links */}
          <nav className="hidden lg:flex items-center gap-1">
            {/* PUBLIC NAVIGATION */}
            {!user && (
              <>
                <Link to="/" className={navLinkClass('/')}>
                  Home
                </Link>
                <Link to="/citizen/new" className={navLinkClass('/citizen/new')}>
                  Report an Issue
                </Link>
                <Link to="/explore" className={navLinkClass('/explore')}>
                  Explore Complaints
                </Link>
                <Link to="/track" className={navLinkClass('/track')}>
                  Track Grievance
                </Link>
                <Link to="/map" className={navLinkClass('/map')}>
                  Hyderabad Map
                </Link>
                <Link to="/analytics" className={navLinkClass('/analytics')}>
                  Public Analytics
                </Link>
                <Link to="/about" className={navLinkClass('/about')}>
                  About CivicEye
                </Link>
              </>
            )}

            {/* CITIZEN NAVIGATION */}
            {user?.role === 'citizen' && (
              <>
                <Link to="/citizen/dashboard" className={navLinkClass('/citizen/dashboard')}>
                  My Dashboard
                </Link>
                <Link to="/citizen/new" className={navLinkClass('/citizen/new')}>
                  Submit Complaint
                </Link>
                <Link to="/track" className={navLinkClass('/track')}>
                  Track Grievance
                </Link>
                <Link to="/map" className={navLinkClass('/map')}>
                  Hyderabad Map
                </Link>
                <Link to="/analytics" className={navLinkClass('/analytics')}>
                  Public Analytics
                </Link>
                <Link to="/about" className={navLinkClass('/about')}>
                  About
                </Link>
              </>
            )}

            {/* ADMIN NAVIGATION */}
            {user?.role === 'admin' && (
              <>
                <Link to="/admin" className={navLinkClass('/admin')}>
                  Overview
                </Link>
                <Link to="/admin/complaints" className={navLinkClass('/admin/complaints')}>
                  All Complaints
                </Link>
                <Link to="/map" className={navLinkClass('/map')}>
                  Map View
                </Link>
                <Link to="/admin/departments" className={navLinkClass('/admin/departments')}>
                  Departments
                </Link>
                <Link to="/admin/duplicates" className={navLinkClass('/admin/duplicates')}>
                  Duplicates
                </Link>
                <Link to="/analytics" className={navLinkClass('/analytics')}>
                  Analytics
                </Link>
              </>
            )}
          </nav>

          {/* Right Session Controls */}
          <div className="hidden sm:flex items-center gap-2.5">
            {user ? (
              <div className="flex items-center gap-3 pl-3 border-l border-civic-800">
                <Link
                  to="/profile"
                  className="text-right hover:opacity-85 transition-opacity"
                  title="View Account Profile & Settings"
                >
                  <div className="text-xs font-bold text-white leading-tight flex items-center justify-end gap-1">
                    <User className="w-3 h-3 text-slate-300" />
                    <span>{user.name}</span>
                  </div>
                  <div className="text-[10px] text-teal-300 font-mono capitalize">{user.role} Account</div>
                </Link>
                <button
                  onClick={handleLogout}
                  title="Sign Out"
                  className="p-1.5 rounded-md text-slate-300 hover:text-white hover:bg-civic-800 transition-colors"
                >
                  <LogOut className="w-4 h-4" />
                </button>
              </div>
            ) : (
              <div className="flex items-center gap-2">
                <Link
                  to="/login"
                  className="px-3 py-1.5 rounded-md text-xs font-semibold text-slate-200 hover:text-white hover:bg-civic-850 transition-colors"
                >
                  Login
                </Link>
                <Link
                  to="/register"
                  className="px-3 py-1.5 rounded-md text-xs font-semibold bg-civic-700 hover:bg-civic-600 text-white transition-colors border border-blue-400/40"
                >
                  Register
                </Link>
              </div>
            )}
          </div>

          {/* Mobile menu hamburger */}
          <div className="lg:hidden flex items-center">
            <button
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className="p-2 rounded-md text-slate-300 hover:text-white hover:bg-civic-800"
              aria-label="Toggle navigation menu"
            >
              {mobileMenuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
            </button>
          </div>
        </div>
      </div>

      {/* Mobile Drawer Menu */}
      {mobileMenuOpen && (
        <div className="lg:hidden border-t border-civic-800 bg-civic-900 px-4 pt-2 pb-4 space-y-1">
          {!user && (
            <>
              <Link to="/" onClick={() => setMobileMenuOpen(false)} className={mobileNavLinkClass('/')}>
                Home
              </Link>
              <Link to="/citizen/new" onClick={() => setMobileMenuOpen(false)} className={mobileNavLinkClass('/citizen/new')}>
                Report an Issue
              </Link>
              <Link to="/explore" onClick={() => setMobileMenuOpen(false)} className={mobileNavLinkClass('/explore')}>
                Explore Complaints
              </Link>
              <Link to="/track" onClick={() => setMobileMenuOpen(false)} className={mobileNavLinkClass('/track')}>
                Track Grievance
              </Link>
              <Link to="/map" onClick={() => setMobileMenuOpen(false)} className={mobileNavLinkClass('/map')}>
                Hyderabad Map
              </Link>
              <Link to="/analytics" onClick={() => setMobileMenuOpen(false)} className={mobileNavLinkClass('/analytics')}>
                Public Analytics
              </Link>
              <Link to="/about" onClick={() => setMobileMenuOpen(false)} className={mobileNavLinkClass('/about')}>
                About CivicEye
              </Link>
              <div className="pt-2 border-t border-civic-800 flex gap-2">
                <Link
                  to="/login"
                  onClick={() => setMobileMenuOpen(false)}
                  className="flex-1 text-center py-2 rounded-md bg-civic-800 text-xs font-semibold text-white"
                >
                  Login
                </Link>
                <Link
                  to="/register"
                  onClick={() => setMobileMenuOpen(false)}
                  className="flex-1 text-center py-2 rounded-md bg-civic-700 text-xs font-semibold text-white"
                >
                  Register
                </Link>
              </div>
            </>
          )}

          {user && (
            <>
              <div className="px-3 py-2 bg-civic-950 rounded-md text-xs mb-2">
                <div className="font-bold text-white">{user.name}</div>
                <div className="text-[10px] text-teal-300 font-mono capitalize">{user.role} Account</div>
              </div>
              {user.role === 'citizen' && (
                <>
                  <Link to="/citizen/dashboard" onClick={() => setMobileMenuOpen(false)} className={mobileNavLinkClass('/citizen/dashboard')}>
                    My Dashboard
                  </Link>
                  <Link to="/citizen/new" onClick={() => setMobileMenuOpen(false)} className={mobileNavLinkClass('/citizen/new')}>
                    Submit Complaint
                  </Link>
                  <Link to="/track" onClick={() => setMobileMenuOpen(false)} className={mobileNavLinkClass('/track')}>
                    Track Grievance
                  </Link>
                  <Link to="/map" onClick={() => setMobileMenuOpen(false)} className={mobileNavLinkClass('/map')}>
                    Hyderabad Map
                  </Link>
                  <Link to="/analytics" onClick={() => setMobileMenuOpen(false)} className={mobileNavLinkClass('/analytics')}>
                    Public Analytics
                  </Link>
                </>
              )}
              {user.role === 'admin' && (
                <>
                  <Link to="/admin" onClick={() => setMobileMenuOpen(false)} className={mobileNavLinkClass('/admin')}>
                    Overview
                  </Link>
                  <Link to="/admin/complaints" onClick={() => setMobileMenuOpen(false)} className={mobileNavLinkClass('/admin/complaints')}>
                    All Complaints
                  </Link>
                  <Link to="/map" onClick={() => setMobileMenuOpen(false)} className={mobileNavLinkClass('/map')}>
                    Map View
                  </Link>
                  <Link to="/admin/departments" onClick={() => setMobileMenuOpen(false)} className={mobileNavLinkClass('/admin/departments')}>
                    Departments
                  </Link>
                  <Link to="/admin/duplicates" onClick={() => setMobileMenuOpen(false)} className={mobileNavLinkClass('/admin/duplicates')}>
                    Duplicates
                  </Link>
                </>
              )}
              <button
                onClick={handleLogout}
                className="w-full text-left px-3 py-2 rounded-md text-sm text-rose-300 hover:bg-rose-950/40 font-medium"
              >
                Sign Out
              </button>
            </>
          )}
        </div>
      )}
    </header>
  );
};

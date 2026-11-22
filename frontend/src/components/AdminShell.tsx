import React from 'react';
import { NavLink } from 'react-router-dom';
import { useLanguage } from '../contexts/LanguageContext';
import { Page } from './PageHeader';

/** Shared frame for all administrator pages: section tabs plus the page content. */
export const AdminShell: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { t } = useLanguage();
  const tabs = [
    { to: '/admin', label: t.admin.navDashboard, end: true },
    { to: '/admin/complaints', label: t.admin.navComplaints },
    { to: '/admin/duplicates', label: t.admin.navDuplicates },
    { to: '/admin/departments', label: t.admin.navDepartments },
  ];
  return (
    <Page>
      <div className="flex items-center justify-between flex-wrap gap-2 mb-1">
        <p className="text-sm font-medium text-slate-600">{t.admin.title}</p>
      </div>
      <nav className="flex flex-wrap gap-1 border-b border-slate-200 mb-6" aria-label={t.admin.title}>
        {tabs.map((tab) => (
          <NavLink
            key={tab.to}
            to={tab.to}
            end={tab.end}
            className={({ isActive }) =>
              `px-3 py-2 text-sm -mb-px border-b-2 ${isActive ? 'border-civic-700 text-civic-800 font-semibold' : 'border-transparent text-slate-700 hover:text-civic-800'}`
            }
          >
            {tab.label}
          </NavLink>
        ))}
      </nav>
      {children}
    </Page>
  );
};

import React from 'react';
import { Link } from 'react-router-dom';
import { useLanguage } from '../contexts/LanguageContext';
import { fmt } from '../i18n';

export const Footer: React.FC = () => {
  const { t } = useLanguage();
  return (
    <footer className="border-t border-slate-200 bg-white mt-12">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 py-6 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 text-sm text-slate-600">
        <p className="max-w-xl">{t.footer.disclaimer}</p>
        <div className="flex items-center gap-4">
          <Link to="/about" className="hover:text-civic-700 hover:underline py-2 inline-block">
            {t.nav.about}
          </Link>
          <span>{fmt(t.footer.rights, { year: new Date().getFullYear() })}</span>
        </div>
      </div>
    </footer>
  );
};

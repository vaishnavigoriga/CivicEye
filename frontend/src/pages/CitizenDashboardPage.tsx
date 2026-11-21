import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { complaintsApi } from '../api/complaintsApi';
import { Complaint } from '../types';
import { useLanguage } from '../contexts/LanguageContext';
import { errorMessage } from '../utils/errorMessage';
import { ComplaintCard } from '../components/ComplaintCard';
import { Button } from '../components/ui/Button';
import { Alert } from '../components/ui/Alert';
import { Page, PageHeader } from '../components/PageHeader';

export const CitizenDashboardPage: React.FC = () => {
  const { t } = useLanguage();
  const [items, setItems] = useState<Complaint[] | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    complaintsApi
      .mine()
      .then((d) => !cancelled && setItems(d))
      .catch((e) => !cancelled && setError(errorMessage(e, t)));
    return () => {
      cancelled = true;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return (
    <Page>
      <PageHeader
        title={t.myReports.title}
        subtitle={t.myReports.subtitle}
        actions={<Link to="/citizen/new"><Button>{t.nav.report}</Button></Link>}
      />
      {error && <Alert variant="error">{error}</Alert>}
      {!error && items === null && <p className="text-slate-600">{t.common.loading}</p>}
      {items && items.length === 0 && <p className="text-slate-700 py-8 text-center">{t.myReports.empty}</p>}
      {items && items.length > 0 && (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {items.map((c) => <ComplaintCard key={c.id} complaint={c} />)}
        </div>
      )}
    </Page>
  );
};

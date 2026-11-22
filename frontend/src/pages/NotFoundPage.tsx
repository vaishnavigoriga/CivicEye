import React from 'react';
import { Link } from 'react-router-dom';
import { useLanguage } from '../contexts/LanguageContext';
import { Button } from '../components/ui/Button';
import { Page, PageHeader } from '../components/PageHeader';

export const NotFoundPage: React.FC = () => {
  const { t } = useLanguage();
  return (
    <Page narrow>
      <PageHeader title="404" subtitle={t.errors.NOT_FOUND} />
      <Link to="/"><Button>{t.nav.home}</Button></Link>
    </Page>
  );
};

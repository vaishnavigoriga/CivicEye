import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useLanguage } from '../contexts/LanguageContext';
import { Button } from '../components/ui/Button';
import { Input } from '../components/ui/Input';
import { Page, PageHeader } from '../components/PageHeader';

/** Entry form: enter a tracking ID, then view /track/:id */
export const TrackComplaintPage: React.FC = () => {
  const { t } = useLanguage();
  const navigate = useNavigate();
  const [value, setValue] = useState('');

  return (
    <Page narrow>
      <PageHeader title={t.track.title} subtitle={t.track.subtitle} />
      <form
        className="flex flex-col sm:flex-row gap-3 sm:items-end"
        onSubmit={(e) => {
          e.preventDefault();
          const id = value.trim().toUpperCase();
          if (id) navigate(`/track/${encodeURIComponent(id)}`);
        }}
      >
        <div className="flex-1">
          <Input label={t.common.trackingId} placeholder={t.track.placeholder} value={value} onChange={(e) => setValue(e.target.value)} required />
        </div>
        <Button type="submit">{t.track.button}</Button>
      </form>
    </Page>
  );
};

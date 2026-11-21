import React from 'react';
import { useLanguage } from '../contexts/LanguageContext';
import { Page, PageHeader } from '../components/PageHeader';

export const AboutPage: React.FC = () => {
  const { t } = useLanguage();
  const sections = [
    { h: t.about.whatTitle, p: t.about.what },
    { h: t.about.honestTitle, p: t.about.honest },
    { h: t.about.aiTitle, p: t.about.ai },
    { h: t.about.dataTitle, p: t.about.data },
    { h: '', p: t.about.dataReview },
  ];
  return (
    <Page narrow>
      <PageHeader title={t.about.title} subtitle={t.about.p1} />
      <div className="space-y-6">
        {sections.map((s) => (
          <section key={s.h || s.p.slice(0, 20)}>
            {s.h && <h2 className="text-lg font-semibold mb-1">{s.h}</h2>}
            <p className="text-slate-800">{s.p}</p>
          </section>
        ))}
      </div>
    </Page>
  );
};

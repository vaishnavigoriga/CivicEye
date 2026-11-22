import React from 'react';
import { useLanguage } from '../contexts/LanguageContext';
import { Button } from './ui/Button';
import { Page } from './PageHeader';

const Fallback: React.FC = () => {
  const { t } = useLanguage();
  return (
    <Page narrow>
      <div role="alert" className="rounded-lg border border-rose-200 bg-rose-50 p-5 space-y-3">
        <h1 className="text-lg font-semibold">{t.errors.INTERNAL}</h1>
        <Button onClick={() => window.location.reload()}>{t.common.retry}</Button>
      </div>
    </Page>
  );
};

/** Catches rendering crashes so a bug in one page shows a message instead of a blank screen. */
export class ErrorBoundary extends React.Component<{ children: React.ReactNode }, { failed: boolean }> {
  state = { failed: false };

  static getDerivedStateFromError() {
    return { failed: true };
  }

  componentDidCatch(error: unknown) {
    console.error('UI error:', error);
  }

  render() {
    return this.state.failed ? <Fallback /> : this.props.children;
  }
}

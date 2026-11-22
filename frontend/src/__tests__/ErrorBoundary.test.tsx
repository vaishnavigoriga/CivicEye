// @vitest-environment jsdom
import React from 'react';
import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import { ErrorBoundary } from '../components/ErrorBoundary';
import { LanguageProvider } from '../contexts/LanguageContext';

const Boom: React.FC = () => {
  throw new Error('render crash');
};

describe('ErrorBoundary', () => {
  it('shows a translated message instead of a blank screen', () => {
    vi.spyOn(console, 'error').mockImplementation(() => undefined);
    render(
      <LanguageProvider>
        <ErrorBoundary>
          <Boom />
        </ErrorBoundary>
      </LanguageProvider>,
    );
    expect(screen.getByRole('alert')).toBeTruthy();
    expect(screen.getByText(/went wrong/i)).toBeTruthy();
  });

  it('renders children normally when nothing fails', () => {
    render(
      <LanguageProvider>
        <ErrorBoundary>
          <p>fine</p>
        </ErrorBoundary>
      </LanguageProvider>,
    );
    expect(screen.getByText('fine')).toBeTruthy();
  });
});

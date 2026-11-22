import React from 'react';
import { BrowserRouter } from 'react-router-dom';
import { AuthProvider } from './contexts/AuthContext';
import { LanguageProvider } from './contexts/LanguageContext';
import { ToastProvider } from './contexts/ToastContext';
import { Navbar } from './components/Navbar';
import { Footer } from './components/Footer';
import { AppRouter } from './routes/AppRouter';
import { ErrorBoundary } from './components/ErrorBoundary';

export const App: React.FC = () => (
  <BrowserRouter>
    <LanguageProvider>
      <AuthProvider>
        <ToastProvider>
          <div className="min-h-screen flex flex-col">
            <Navbar />
            <main id="main" className="flex-grow">
              <ErrorBoundary>
                <AppRouter />
              </ErrorBoundary>
            </main>
            <Footer />
          </div>
        </ToastProvider>
      </AuthProvider>
    </LanguageProvider>
  </BrowserRouter>
);

export default App;

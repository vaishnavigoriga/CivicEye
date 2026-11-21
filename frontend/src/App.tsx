import React from 'react';
import { BrowserRouter } from 'react-router-dom';
import { AuthProvider } from './contexts/AuthContext';
import { LanguageProvider } from './contexts/LanguageContext';
import { ToastProvider } from './contexts/ToastContext';
import { Navbar } from './components/Navbar';
import { Footer } from './components/Footer';
import { AppRouter } from './routes/AppRouter';

export const App: React.FC = () => (
  <BrowserRouter>
    <LanguageProvider>
      <AuthProvider>
        <ToastProvider>
          <div className="min-h-screen flex flex-col">
            <Navbar />
            <main id="main" className="flex-grow">
              <AppRouter />
            </main>
            <Footer />
          </div>
        </ToastProvider>
      </AuthProvider>
    </LanguageProvider>
  </BrowserRouter>
);

export default App;

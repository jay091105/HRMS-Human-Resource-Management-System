import React from 'react';
import { BrowserRouter, useLocation } from 'react-router-dom';
import { AppRoutes } from './routes/AppRoutes';
import { Navbar } from './components/layout/Navbar';
import { Sidebar } from './components/layout/Sidebar';
import { useAuth } from './hooks/useAuth';
import './styles/global.css';

const AppContent: React.FC = () => {
  const { isAuthenticated } = useAuth();
  const location = useLocation();
  const isAuthPage = location.pathname === '/login' || location.pathname === '/signup';
  const isLandingPage = location.pathname === '/';
  const isDashboardPage = location.pathname.startsWith('/dashboard');

  return (
    <div className="min-h-screen bg-gray-100">
      {isAuthenticated && isDashboardPage && (
        <>
          <Sidebar />
          <div className="ml-64">
            <Navbar />
            <main className="p-0">
              <AppRoutes />
            </main>
          </div>
        </>
      )}
      {(!isAuthenticated || isAuthPage || isLandingPage) && (
        <main>
          <AppRoutes />
        </main>
      )}
    </div>
  );
};

function App() {
  return (
    <BrowserRouter>
      <AppContent />
    </BrowserRouter>
  );
}

export default App;


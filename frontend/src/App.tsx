import React from 'react';
import { BrowserRouter, useLocation } from 'react-router-dom';
import { AppRoutes } from './routes/AppRoutes';
import { Navbar } from './components/layout/Navbar';
import { Sidebar } from './components/layout/Sidebar';
import { Footer } from './components/layout/Footer';
import { useAuth } from './hooks/useAuth';
import './styles/global.css';

const AppContent: React.FC = () => {
  const { isAuthenticated } = useAuth();
  const location = useLocation();
  const isAuthPage = location.pathname === '/login' || location.pathname === '/signup';

  return (
    <div className="min-h-screen flex flex-col bg-gray-100">
      {isAuthenticated && !isAuthPage && <Navbar />}
      <div className="flex flex-1">
        {isAuthenticated && !isAuthPage && <Sidebar />}
        <main className="flex-1">
          <AppRoutes />
        </main>
      </div>
      {isAuthenticated && !isAuthPage && <Footer />}
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


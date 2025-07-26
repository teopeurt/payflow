import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { useAuth } from './hooks/useAuth';
import LoginForm from './components/Auth/LoginForm';
import Sidebar from './components/Layout/Sidebar';
import Header from './components/Layout/Header';
import AdminDashboard from './components/Dashboard/AdminDashboard';
import ClientDashboard from './components/Dashboard/ClientDashboard';
import ProjectList from './components/Projects/ProjectList';
import MessageList from './components/Messages/MessageList';
import InvoiceList from './components/Invoices/InvoiceList';
import CalendarView from './components/Calendar/CalendarView';
import Settings from './components/Settings/Settings';

// Dashboard router component
const DashboardRouter: React.FC = () => {
  const { profile } = useAuth();
  
  console.log('DashboardRouter - profile:', profile);
  
  if (profile?.role === 'admin' || profile?.role === 'team_member') {
    console.log('Rendering AdminDashboard');
    return <AdminDashboard />;
  } else {
    console.log('Rendering ClientDashboard');
    return <ClientDashboard />;
  }
};

// Main Layout Component
const MainLayout: React.FC = () => {
  const [sidebarOpen, setSidebarOpen] = React.useState(false);

  return (
    <div className="flex h-screen bg-gray-50">
      {/* Sidebar */}
      <div className={`
        fixed inset-y-0 left-0 z-50 w-64 bg-white transform transition-transform duration-300 ease-in-out lg:translate-x-0 lg:static lg:inset-0
        ${sidebarOpen ? 'translate-x-0' : '-translate-x-full'}
      `}>
        <Sidebar />
      </div>

      {/* Overlay for mobile */}
      {sidebarOpen && (
        <div 
          className="fixed inset-0 z-40 bg-gray-600 bg-opacity-75 lg:hidden"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      {/* Main content */}
      <div className="flex-1 flex flex-col overflow-hidden">
        <Header onToggleSidebar={() => setSidebarOpen(!sidebarOpen)} />
        
        <main className="flex-1 overflow-auto">
          <div className="p-6">
            <Routes>
              <Route path="/dashboard" element={<DashboardRouter />} />
              <Route path="/projects" element={<ProjectList />} />
              <Route path="/messages" element={<MessageList />} />
              <Route path="/invoices" element={<InvoiceList />} />
              <Route path="/calendar" element={<CalendarView />} />
              <Route path="/team" element={<div className="p-8 text-center text-gray-500">Team - Coming Soon</div>} />
              <Route path="/clients" element={<div className="p-8 text-center text-gray-500">Clients - Coming Soon</div>} />
              <Route path="/settings" element={<Settings />} />
              <Route path="/" element={<Navigate to="/dashboard" replace />} />
            </Routes>
          </div>
        </main>
      </div>
    </div>
  );
};

// Protected route component
const ProtectedRoute: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { user, loading } = useAuth();
  
  console.log('ProtectedRoute - user:', user, 'loading:', loading);
  
  if (loading) {
    console.log('Still loading...');
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
      </div>
    );
  }
  
  if (!user) {
    console.log('No user, redirecting to login');
    return <Navigate to="/login" replace />;
  }
  
  console.log('User authenticated, rendering children');
  
  return <>{children}</>;
};

function App() {
  const { user, loading, profile } = useAuth();

  console.log('App render - user:', user, 'loading:', loading, 'profile:', profile);

  if (loading) {
    console.log('App is loading...');
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  return (
    <Router>
      <Routes>
        <Route 
          path="/login" 
          element={user ? <Navigate to="/dashboard" replace /> : <LoginForm />} 
        />
        
        <Route 
          path="/*" 
          element={
            <ProtectedRoute>
              <MainLayout />
            </ProtectedRoute>
          } 
        />
      </Routes>
    </Router>
  );
}

export default App;
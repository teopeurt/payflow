import React, { useState } from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import Sidebar from './Sidebar';
import Header from './Header';
import AdminDashboard from '../Dashboard/AdminDashboard';
import ClientDashboard from '../Dashboard/ClientDashboard';
import ProjectList from '../Projects/ProjectList';
import { useAuth } from '../../hooks/useAuth';

// Dashboard router component
const DashboardRouter: React.FC = () => {
  const { profile } = useAuth();
  
  if (profile?.role === 'admin' || profile?.role === 'team_member') {
    return <AdminDashboard />;
  } else {
    return <ClientDashboard />;
  }
};

const Layout: React.FC = () => {
  const [sidebarOpen, setSidebarOpen] = useState(false);

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
              <Route path="/messages" element={<div className="p-8 text-center text-gray-500">Messages - Coming Soon</div>} />
              <Route path="/invoices" element={<div className="p-8 text-center text-gray-500">Invoices - Coming Soon</div>} />
              <Route path="/calendar" element={<div className="p-8 text-center text-gray-500">Calendar - Coming Soon</div>} />
              <Route path="/team" element={<div className="p-8 text-center text-gray-500">Team - Coming Soon</div>} />
              <Route path="/clients" element={<div className="p-8 text-center text-gray-500">Clients - Coming Soon</div>} />
              <Route path="/settings" element={<div className="p-8 text-center text-gray-500">Settings - Coming Soon</div>} />
              <Route path="/" element={<Navigate to="/dashboard" replace />} />
            </Routes>
          </div>
        </main>
      </div>
    </div>
  );
};

export default Layout;
import React, { useState, useEffect } from 'react';
import { 
  FolderOpen, 
  FileText, 
  MessageSquare, 
  Calendar,
  Clock,
  CheckCircle,
  AlertCircle
} from 'lucide-react';
import { supabase } from '../../lib/supabase';
import { useAuth } from '../../hooks/useAuth';

interface ClientStats {
  activeProjects: number;
  completedProjects: number;
  totalInvoices: number;
  unreadMessages: number;
  upcomingEvents: number;
}

const ClientDashboard: React.FC = () => {
  const { profile } = useAuth();
  console.log('ClientDashboard component rendering, profile:', profile);
  const [stats, setStats] = useState<ClientStats>({
    activeProjects: 0,
    completedProjects: 0,
    totalInvoices: 0,
    unreadMessages: 0,
    upcomingEvents: 0,
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (profile?.id) {
      fetchClientStats();
    }
  }, [profile]);

  const fetchClientStats = async () => {
    try {
      if (!profile?.id) return;

      // Fetch client's projects
      const { data: projects } = await supabase
        .from('projects')
        .select('status')
        .eq('client_id', profile.id);

      // Fetch client's invoices
      const { data: invoices } = await supabase
        .from('invoices')
        .select('status')
        .eq('client_id', profile.id);

      // Fetch upcoming events
      const { data: events } = await supabase
        .from('calendar_events')
        .select('id')
        .gte('start_time', new Date().toISOString())
        .eq('status', 'scheduled');

      const activeProjects = projects?.filter(p => p.status === 'active').length || 0;
      const completedProjects = projects?.filter(p => p.status === 'completed').length || 0;
      const totalInvoices = invoices?.length || 0;
      const upcomingEvents = events?.length || 0;

      setStats({
        activeProjects,
        completedProjects,
        totalInvoices,
        unreadMessages: 5, // Placeholder - would need complex query
        upcomingEvents,
      });
    } catch (error) {
      console.error('Error fetching client stats:', error);
    } finally {
      setLoading(false);
    }
  };

  const statCards = [
    {
      title: 'Active Projects',
      value: stats.activeProjects,
      icon: FolderOpen,
      color: 'bg-blue-500',
      description: 'Currently in progress'
    },
    {
      title: 'Completed Projects',
      value: stats.completedProjects,
      icon: CheckCircle,
      color: 'bg-green-500',
      description: 'Successfully delivered'
    },
    {
      title: 'Total Invoices',
      value: stats.totalInvoices,
      icon: FileText,
      color: 'bg-purple-500',
      description: 'All time invoices'
    },
    {
      title: 'Unread Messages',
      value: stats.unreadMessages,
      icon: MessageSquare,
      color: 'bg-orange-500',
      description: 'Pending responses'
    },
  ];

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-gray-900">
          Welcome back, {profile?.full_name?.split(' ')[0]}!
        </h1>
        <p className="text-gray-600">Here's what's happening with your projects</p>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {statCards.map((card, index) => (
          <div key={index} className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">{card.title}</p>
                <p className="text-3xl font-bold text-gray-900 mt-1">{card.value}</p>
                <p className="text-xs text-gray-500 mt-1">{card.description}</p>
              </div>
              <div className={`p-3 rounded-lg ${card.color}`}>
                <card.icon className="h-6 w-6 text-white" />
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Main Content Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Current Projects */}
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-lg font-semibold text-gray-900">Current Projects</h2>
            <a href="/projects" className="text-blue-600 hover:text-blue-700 text-sm font-medium">
              View all
            </a>
          </div>
          <div className="space-y-4">
            {[1, 2].map((item) => (
              <div key={item} className="p-4 border border-gray-200 rounded-lg">
                <div className="flex items-center justify-between mb-3">
                  <h3 className="font-medium text-gray-900">Website Redesign</h3>
                  <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                    In Progress
                  </span>
                </div>
                <div className="w-full bg-gray-200 rounded-full h-2 mb-3">
                  <div className="bg-blue-600 h-2 rounded-full" style={{ width: '65%' }}></div>
                </div>
                <div className="flex items-center justify-between text-sm text-gray-500">
                  <span>65% Complete</span>
                  <span>Due: Nov 30, 2024</span>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Recent Messages */}
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-lg font-semibold text-gray-900">Recent Messages</h2>
            <a href="/messages" className="text-blue-600 hover:text-blue-700 text-sm font-medium">
              View all
            </a>
          </div>
          <div className="space-y-4">
            {[1, 2, 3].map((item) => (
              <div key={item} className="flex items-start space-x-3 p-3 bg-gray-50 rounded-lg">
                <div className="h-8 w-8 bg-blue-100 rounded-full flex items-center justify-center">
                  <span className="text-xs font-medium text-blue-600">JD</span>
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-gray-900">John Doe</p>
                  <p className="text-sm text-gray-600 truncate">
                    The design looks great! Just a few minor adjustments needed...
                  </p>
                  <p className="text-xs text-gray-500 mt-1">2 hours ago</p>
                </div>
                <div className="h-2 w-2 bg-blue-600 rounded-full"></div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Invoices and Calendar */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Recent Invoices */}
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-lg font-semibold text-gray-900">Recent Invoices</h2>
            <a href="/invoices" className="text-blue-600 hover:text-blue-700 text-sm font-medium">
              View all
            </a>
          </div>
          <div className="space-y-4">
            {[1, 2].map((item) => (
              <div key={item} className="flex items-center justify-between p-3 border border-gray-200 rounded-lg">
                <div className="flex items-center space-x-3">
                  <FileText className="h-5 w-5 text-gray-400" />
                  <div>
                    <p className="font-medium text-gray-900">Invoice #INV-001</p>
                    <p className="text-sm text-gray-500">Nov 15, 2024</p>
                  </div>
                </div>
                <div className="text-right">
                  <p className="font-medium text-gray-900">$2,500.00</p>
                  <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-green-100 text-green-800">
                    Paid
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Upcoming Events */}
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-lg font-semibold text-gray-900">Upcoming Events</h2>
            <a href="/calendar" className="text-blue-600 hover:text-blue-700 text-sm font-medium">
              View calendar
            </a>
          </div>
          <div className="space-y-4">
            {[1, 2].map((item) => (
              <div key={item} className="flex items-center space-x-3 p-3 border-l-4 border-blue-500 bg-blue-50">
                <Calendar className="h-5 w-5 text-blue-600" />
                <div className="flex-1">
                  <p className="font-medium text-gray-900">Project Review Meeting</p>
                  <p className="text-sm text-gray-500">Tomorrow at 10:00 AM</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};

export default ClientDashboard;
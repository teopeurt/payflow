import React, { useState, useEffect } from 'react';
import { 
  Users, 
  FolderOpen, 
  FileText, 
  DollarSign, 
  TrendingUp, 
  Calendar,
  AlertCircle,
  CheckCircle
} from 'lucide-react';
import { supabase } from '../../lib/supabase';

interface DashboardStats {
  totalProjects: number;
  activeProjects: number;
  totalClients: number;
  totalInvoices: number;
  pendingInvoices: number;
  totalRevenue: number;
  teamMembers: number;
}

const AdminDashboard: React.FC = () => {
  console.log('AdminDashboard component rendering');
  const [stats, setStats] = useState<DashboardStats>({
    totalProjects: 0,
    activeProjects: 0,
    totalClients: 0,
    totalInvoices: 0,
    pendingInvoices: 0,
    totalRevenue: 0,
    teamMembers: 0,
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchDashboardStats();
  }, []);

  const fetchDashboardStats = async () => {
    try {
      // Fetch projects stats
      const { data: projects } = await supabase
        .from('projects')
        .select('status');
      
      // Fetch clients stats
      const { data: clients } = await supabase
        .from('profiles')
        .select('role')
        .eq('role', 'client');
      
      // Fetch team members stats
      const { data: teamMembers } = await supabase
        .from('profiles')
        .select('role')
        .in('role', ['admin', 'team_member']);
      
      // Fetch invoices stats
      const { data: invoices } = await supabase
        .from('invoices')
        .select('status, total_amount');

      const totalProjects = projects?.length || 0;
      const activeProjects = projects?.filter(p => p.status === 'active').length || 0;
      const totalClients = clients?.length || 0;
      const totalInvoices = invoices?.length || 0;
      const pendingInvoices = invoices?.filter(i => ['draft', 'sent'].includes(i.status)).length || 0;
      const totalRevenue = invoices?.filter(i => i.status === 'paid').reduce((sum, inv) => sum + inv.total_amount, 0) || 0;

      setStats({
        totalProjects,
        activeProjects,
        totalClients,
        totalInvoices,
        pendingInvoices,
        totalRevenue,
        teamMembers: teamMembers?.length || 0,
      });
    } catch (error) {
      console.error('Error fetching dashboard stats:', error);
    } finally {
      setLoading(false);
    }
  };

  const statCards = [
    {
      title: 'Total Projects',
      value: stats.totalProjects,
      icon: FolderOpen,
      color: 'bg-blue-500',
      change: '+12%',
      changeType: 'increase'
    },
    {
      title: 'Active Projects',
      value: stats.activeProjects,
      icon: CheckCircle,
      color: 'bg-green-500',
      change: '+8%',
      changeType: 'increase'
    },
    {
      title: 'Total Clients',
      value: stats.totalClients,
      icon: Users,
      color: 'bg-purple-500',
      change: '+15%',
      changeType: 'increase'
    },
    {
      title: 'Team Members',
      value: stats.teamMembers,
      icon: Users,
      color: 'bg-indigo-500',
      change: '+3%',
      changeType: 'increase'
    },
    {
      title: 'Total Revenue',
      value: `$${stats.totalRevenue.toLocaleString()}`,
      icon: DollarSign,
      color: 'bg-emerald-500',
      change: '+22%',
      changeType: 'increase'
    },
    {
      title: 'Pending Invoices',
      value: stats.pendingInvoices,
      icon: AlertCircle,
      color: 'bg-orange-500',
      change: '-5%',
      changeType: 'decrease'
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
        <h1 className="text-2xl font-bold text-gray-900">Admin Dashboard</h1>
        <p className="text-gray-600">Overview of your business metrics and operations</p>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {statCards.map((card, index) => (
          <div key={index} className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">{card.title}</p>
                <p className="text-3xl font-bold text-gray-900 mt-1">{card.value}</p>
              </div>
              <div className={`p-3 rounded-lg ${card.color}`}>
                <card.icon className="h-6 w-6 text-white" />
              </div>
            </div>
            <div className="mt-4 flex items-center">
              <TrendingUp className={`h-4 w-4 ${
                card.changeType === 'increase' ? 'text-green-500' : 'text-red-500'
              }`} />
              <span className={`text-sm font-medium ml-1 ${
                card.changeType === 'increase' ? 'text-green-500' : 'text-red-500'
              }`}>
                {card.change}
              </span>
              <span className="text-sm text-gray-500 ml-1">from last month</span>
            </div>
          </div>
        ))}
      </div>

      {/* Quick Actions */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Recent Projects */}
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-lg font-semibold text-gray-900">Recent Projects</h2>
            <a href="/projects" className="text-blue-600 hover:text-blue-700 text-sm font-medium">
              View all
            </a>
          </div>
          <div className="space-y-4">
            {[1, 2, 3].map((item) => (
              <div key={item} className="flex items-center space-x-4 p-3 bg-gray-50 rounded-lg">
                <div className="h-10 w-10 bg-blue-100 rounded-lg flex items-center justify-center">
                  <FolderOpen className="h-5 w-5 text-blue-600" />
                </div>
                <div className="flex-1">
                  <p className="font-medium text-gray-900">Website Redesign</p>
                  <p className="text-sm text-gray-500">Client: Acme Corp</p>
                </div>
                <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800">
                  Active
                </span>
              </div>
            ))}
          </div>
        </div>

        {/* Pending Tasks */}
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-lg font-semibold text-gray-900">Pending Tasks</h2>
            <a href="/projects" className="text-blue-600 hover:text-blue-700 text-sm font-medium">
              View all
            </a>
          </div>
          <div className="space-y-4">
            {[1, 2, 3].map((item) => (
              <div key={item} className="flex items-center space-x-4 p-3 bg-gray-50 rounded-lg">
                <div className="h-10 w-10 bg-orange-100 rounded-lg flex items-center justify-center">
                  <AlertCircle className="h-5 w-5 text-orange-600" />
                </div>
                <div className="flex-1">
                  <p className="font-medium text-gray-900">Review design mockups</p>
                  <p className="text-sm text-gray-500">Due: Tomorrow</p>
                </div>
                <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-yellow-100 text-yellow-800">
                  High
                </span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Calendar Widget */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-lg font-semibold text-gray-900">Upcoming Events</h2>
          <a href="/calendar" className="text-blue-600 hover:text-blue-700 text-sm font-medium">
            View calendar
          </a>
        </div>
        <div className="space-y-4">
          {[1, 2, 3].map((item) => (
            <div key={item} className="flex items-center space-x-4 p-3 border-l-4 border-blue-500 bg-blue-50">
              <Calendar className="h-5 w-5 text-blue-600" />
              <div className="flex-1">
                <p className="font-medium text-gray-900">Client Presentation</p>
                <p className="text-sm text-gray-500">Today at 2:00 PM</p>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

export default AdminDashboard;
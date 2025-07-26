import React from 'react';
import { NavLink } from 'react-router-dom';
import { 
  LayoutDashboard, 
  FolderOpen, 
  MessageSquare, 
  FileText, 
  Calendar, 
  Users, 
  Settings,
  LogOut,
  Building2
} from 'lucide-react';
import { useAuth } from '../../hooks/useAuth';

const Sidebar: React.FC = () => {
  const { profile, signOut, isAdmin, isTeamMember, isClient } = useAuth();

  const handleSignOut = async () => {
    try {
      await signOut();
      // Force page reload to clear any remaining state
      window.location.href = '/login';
    } catch (error) {
      console.error('Error during sign out:', error);
      // Force logout even if there's an error
      window.location.href = '/login';
    }
  };

  const navigation = [
    { name: 'Dashboard', href: '/dashboard', icon: LayoutDashboard, roles: ['admin', 'team_member', 'client'] },
    { name: 'Projects', href: '/projects', icon: FolderOpen, roles: ['admin', 'team_member', 'client'] },
    { name: 'Messages', href: '/messages', icon: MessageSquare, roles: ['admin', 'team_member', 'client'] },
    { name: 'Invoices', href: '/invoices', icon: FileText, roles: ['admin', 'team_member', 'client'] },
    { name: 'Calendar', href: '/calendar', icon: Calendar, roles: ['admin', 'team_member', 'client'] },
    { name: 'Team', href: '/team', icon: Users, roles: ['admin', 'team_member'] },
    { name: 'Clients', href: '/clients', icon: Building2, roles: ['admin', 'team_member'] },
  ];

  const filteredNavigation = navigation.filter(item => 
    item.roles.includes(profile?.role || 'client')
  );

  return (
    <div className="flex flex-col h-full bg-white border-r border-gray-200">
      {/* Logo/Brand */}
      <div className="flex items-center px-6 py-4 border-b border-gray-200">
        <Building2 className="h-8 w-8 text-blue-600" />
        <span className="ml-3 text-xl font-semibold text-gray-900">ClientHub</span>
      </div>

      {/* Navigation */}
      <nav className="flex-1 px-4 py-6 space-y-2">
        {filteredNavigation.map((item) => (
          <NavLink
            key={item.name}
            to={item.href}
            className={({ isActive }) =>
              `flex items-center px-3 py-2 text-sm font-medium rounded-lg transition-colors ${
                isActive
                  ? 'bg-blue-50 text-blue-700 border-r-2 border-blue-600'
                  : 'text-gray-600 hover:bg-gray-50 hover:text-gray-900'
              }`
            }
          >
            <item.icon className="mr-3 h-5 w-5" />
            {item.name}
          </NavLink>
        ))}
      </nav>

      {/* User Profile */}
      <div className="border-t border-gray-200 p-4">
        <div className="flex items-center">
          <div className="flex-shrink-0">
            <div className="h-10 w-10 rounded-full bg-blue-100 flex items-center justify-center">
              <span className="text-sm font-medium text-blue-600">
                {profile?.full_name?.charAt(0) || 'U'}
              </span>
            </div>
          </div>
          <div className="ml-3 flex-1">
            <p className="text-sm font-medium text-gray-900 truncate">
              {profile?.full_name}
            </p>
            <p className="text-xs text-gray-500 capitalize">
              {profile?.role?.replace('_', ' ')}
            </p>
          </div>
        </div>
        
        <div className="mt-4 space-y-1">
          <NavLink
            to="/settings"
            className="flex items-center px-3 py-2 text-sm text-gray-600 hover:bg-gray-50 rounded-lg"
          >
            <Settings className="mr-3 h-4 w-4" />
            Settings
          </NavLink>
          <button
            onClick={handleSignOut}
            className="w-full flex items-center px-3 py-2 text-sm text-gray-600 hover:bg-gray-50 rounded-lg"
          >
            <LogOut className="mr-3 h-4 w-4" />
            Sign Out
          </button>
        </div>
      </div>
    </div>
  );
};

export default Sidebar;
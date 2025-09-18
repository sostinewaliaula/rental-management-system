import React from 'react';
import { NavLink, useNavigate } from 'react-router-dom';
import { HomeIcon, BuildingIcon, UsersIcon, BanknoteIcon, WrenchIcon, LogOutIcon, Settings2Icon, GemIcon, BarChart2Icon, BellIcon } from 'lucide-react';
import { useAuth } from '../auth/AuthContext';

export const Sidebar = () => {
  const navigate = useNavigate();
  const { logout, user } = useAuth();

  const role = user?.role;

  const landlordNav = [
    {
      id: 'dashboard',
      label: 'Dashboard',
      icon: HomeIcon,
      to: '/dashboard',
    },
    {
      id: 'properties',
      label: 'Properties',
      icon: BuildingIcon,
      to: '/properties',
    },
    {
      id: 'tenants',
      label: 'Tenants',
      icon: UsersIcon,
      to: '/tenants',
    },
    {
      id: 'payments',
      label: 'Payments',
      icon: BanknoteIcon,
      to: '/payments',
    },
    {
      id: 'maintenance',
      label: 'Maintenance',
      icon: WrenchIcon,
      to: '/maintenance',
    },
    {
      id: 'reports',
      label: 'Reports',
      icon: BarChart2Icon,
      to: '/reports',
    },
    {
      id: 'notifications',
      label: 'Notifications',
      icon: BellIcon,
      to: '/notifications',
    },
    {
      id: 'settings',
      label: 'Settings',
      icon: Settings2Icon,
      to: '/settings',
    },
  ];

  const tenantNav = [
    {
      id: 'dashboard',
      label: 'Dashboard',
      icon: HomeIcon,
      to: '/tenant-dashboard',
    },
    {
      id: 'payments',
      label: 'Payments',
      icon: BanknoteIcon,
      to: '/payments',
    },
    {
      id: 'maintenance',
      label: 'Maintenance',
      icon: WrenchIcon,
      to: '/maintenance',
    },
    {
      id: 'notifications',
      label: 'Notifications',
      icon: BellIcon,
      to: '/notifications',
    },
    {
      id: 'settings',
      label: 'Settings',
      icon: Settings2Icon,
      to: '/settings',
    },
  ];

  const adminNav = [
    {
      id: 'dashboard',
      label: 'Admin Dashboard',
      icon: HomeIcon,
      to: '/admin',
    },
    {
      id: 'notifications',
      label: 'Notifications',
      icon: BellIcon,
      to: '/notifications',
    },
    {
      id: 'settings',
      label: 'Settings',
      icon: Settings2Icon,
      to: '/settings',
    },
  ];

  const navItems = role === 'tenant' ? tenantNav : role === 'admin' ? adminNav : landlordNav;

  return (
    <div className="hidden md:flex flex-col w-64 bg-gradient-to-b from-green-50 to-white border-r border-gray-200 min-h-screen shadow-sm">
      <div className="p-6 border-b border-gray-200 flex flex-col items-center">
        <div className="w-12 h-12 bg-green-100 rounded-full flex items-center justify-center mb-2 shadow">
          <GemIcon size={28} className="text-green-600" />
        </div>
        <h1 className="text-xl font-bold text-green-700 tracking-wide">Nyumbani</h1>
        <p className="text-sm text-gray-500">Rental Management</p>
      </div>
      <nav className="flex-1 pt-6">
        <ul className="space-y-1">
          {navItems.map(item => {
            const Icon = item.icon;
            return (
              <li key={item.id}>
                <NavLink
                  to={item.to}
                  className={({ isActive }) =>
                    `flex items-center w-full px-5 py-3 text-left rounded-lg transition-all duration-150 font-medium group no-underline ` +
                    (isActive
                      ? 'bg-green-100 text-green-700 border-r-4 border-green-600 shadow'
                      : 'text-gray-600 hover:bg-green-50 hover:text-green-700')
                  }
                >
                  <Icon size={20} className="mr-3 group-hover:scale-110 transition-transform" />
                  {item.label}
                </NavLink>
              </li>
            );
          })}
        </ul>
      </nav>
      <div className="p-4 border-t border-gray-200 mt-4">
        <button onClick={() => { logout(); navigate('/login'); }} className="flex items-center px-4 py-2 text-gray-600 hover:bg-green-50 hover:text-green-700 w-full text-left rounded-lg transition-all">
          <LogOutIcon size={20} className="mr-3" />
          Logout
        </button>
      </div>
    </div>
  );
};
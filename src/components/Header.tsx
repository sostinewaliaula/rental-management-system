import React, { useState, useRef, useEffect } from 'react';
import ReactDOM from 'react-dom';
import { MenuIcon, BellIcon, UserIcon, CheckCircle2Icon, AlertCircleIcon, HomeIcon, UsersIcon, BanknoteIcon, WrenchIcon, XIcon } from 'lucide-react';
import { useAuth } from '../auth/AuthContext';

const mockNotifications = [
  { id: 1, type: 'payment', title: 'Payment Received', message: 'KES 45,000 rent from John Mwangi', time: '2m ago', read: false, icon: <BanknoteIcon size={18} className="text-green-500" /> },
  { id: 2, type: 'maintenance', title: 'Maintenance Request', message: 'AC Not Working in Kilimani Townhouse', time: '10m ago', read: false, icon: <WrenchIcon size={18} className="text-orange-500" /> },
  { id: 3, type: 'tenant', title: 'New Tenant', message: 'Sarah Ochieng moved in to G1', time: '1h ago', read: true, icon: <UsersIcon size={18} className="text-blue-500" /> },
  { id: 4, type: 'property', title: 'Property Added', message: 'Westlands Apartment added', time: '2h ago', read: true, icon: <HomeIcon size={18} className="text-green-400" /> },
  { id: 5, type: 'alert', title: 'Overdue Payment', message: 'Rent overdue for David Kimani', time: '3h ago', read: false, icon: <AlertCircleIcon size={18} className="text-red-500" /> },
];

export const Header = () => {
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const [notifications, setNotifications] = useState(mockNotifications);
  const dropdownRef = useRef<HTMLDivElement>(null);
  const bellButtonRef = useRef<HTMLButtonElement>(null);
  const [dropdownStyle, setDropdownStyle] = useState<React.CSSProperties>({});
  const { user } = useAuth();

  const unreadCount = notifications.filter(n => !n.read).length;

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setDropdownOpen(false);
      }
    };
    if (dropdownOpen) {
      document.addEventListener('mousedown', handleClickOutside);
    } else {
      document.removeEventListener('mousedown', handleClickOutside);
    }
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [dropdownOpen]);

  useEffect(() => {
    if (dropdownOpen && bellButtonRef.current) {
      const rect = bellButtonRef.current.getBoundingClientRect();
      setDropdownStyle({
        position: 'absolute',
        top: rect.bottom + 12 + window.scrollY, // 12px gap below bell
        left: rect.right - 384, // 384px = w-96
        zIndex: 9999,
        width: 384,
        maxWidth: '100vw',
      });
    }
  }, [dropdownOpen]);

  const markAllAsRead = () => {
    setNotifications(notifications.map(n => ({ ...n, read: true })));
  };
  const markAsRead = (id: number) => {
    setNotifications(notifications.map(n => n.id === id ? { ...n, read: true } : n));
  };
  const clearAll = () => {
    setNotifications([]);
  };

  return (
    <header className="bg-gradient-to-r from-green-50 to-white border-b border-gray-200 p-4 shadow-sm transition-all sticky top-0" style={{ position: 'sticky', zIndex: 40, top: 0 }}>
      <div className="flex items-center justify-between">
        <div className="flex items-center md:hidden">
          <button className="text-gray-500 hover:text-green-700 focus:outline-none transition-colors">
            <MenuIcon size={24} />
          </button>
          <h1 className="text-lg font-bold text-green-700 ml-3 tracking-wide">Nyumbani</h1>
        </div>
        <div className="flex items-center ml-auto relative">
          <button
            ref={bellButtonRef}
            className="p-2 text-gray-500 hover:text-green-700 focus:outline-none relative transition-colors"
            onClick={() => setDropdownOpen(v => !v)}
            aria-label="Notifications"
          >
            <BellIcon size={20} />
            {unreadCount > 0 && (
              <span className="absolute top-1 right-1 w-2.5 h-2.5 bg-red-500 border-2 border-white rounded-full shadow"></span>
            )}
          </button>
          {/* Notification Dropdown rendered in portal */}
          {dropdownOpen && typeof window !== 'undefined' && ReactDOM.createPortal(
            <div ref={dropdownRef} style={dropdownStyle} className="bg-white rounded-xl shadow-2xl border border-gray-100 z-50 animate-fade-in fixed">
              <div className="flex items-center justify-between px-4 py-3 border-b border-gray-100">
                <span className="font-semibold text-gray-800 text-lg">Notifications</span>
                <button className="text-gray-400 hover:text-gray-700 p-1" onClick={() => setDropdownOpen(false)} aria-label="Close"><XIcon size={18} /></button>
              </div>
              <div className="max-h-80 overflow-y-auto divide-y divide-gray-50">
                {notifications.length === 0 ? (
                  <div className="p-6 text-center text-gray-400">No notifications</div>
                ) : notifications.map(n => (
                  <div
                    key={n.id}
                    className={`flex items-start gap-3 px-4 py-3 cursor-pointer transition-all hover:bg-green-50 ${!n.read ? 'bg-green-50/60' : ''}`}
                    onClick={() => { markAsRead(n.id); }}
                  >
                    <div className="mt-1">{n.icon}</div>
                    <div className="flex-1">
                      <div className="font-medium text-gray-800 flex items-center gap-2">
                        {n.title}
                        {!n.read && <span className="ml-1 inline-block w-2 h-2 bg-green-400 rounded-full"></span>}
                      </div>
                      <div className="text-gray-600 text-sm">{n.message}</div>
                      <div className="text-xs text-gray-400 mt-1">{n.time}</div>
                    </div>
                  </div>
                ))}
              </div>
              {notifications.length > 0 && (
                <div className="flex items-center justify-between px-4 py-2 border-t border-gray-100 bg-gray-50 rounded-b-xl">
                  <button className="text-green-700 hover:underline text-sm font-medium" onClick={markAllAsRead}>Mark all as read</button>
                  <button className="text-red-600 hover:underline text-sm font-medium" onClick={clearAll}>Clear all</button>
                </div>
              )}
            </div>,
            document.body
          )}
          <div className="border-l border-gray-200 h-6 mx-3"></div>
          <div className="flex items-center group cursor-pointer">
            <div className="w-9 h-9 bg-gradient-to-br from-green-100 to-gray-200 rounded-full flex items-center justify-center border border-green-200 shadow-sm transition-all group-hover:scale-105">
              <UserIcon size={18} className="text-green-700" />
            </div>
            <div className="ml-2 hidden md:block">
              <p className="text-sm font-semibold text-gray-700">{user?.name || 'User'}</p>
              <p className="text-xs text-gray-500">{user?.email || ''}{user?.role ? ` • ${user.role}` : ''}</p>
            </div>
          </div>
        </div>
      </div>
    </header>
  );
};
import React, { useState, useMemo } from 'react';
import { BellIcon, CheckCircle2Icon, AlertCircleIcon, HomeIcon, UsersIcon, BanknoteIcon, WrenchIcon, Trash2Icon, XIcon } from 'lucide-react';
import { Link } from 'react-router-dom';

const mockNotifications = [
  { id: 1, type: 'payment', title: 'Payment Received', message: 'KES 45,000 rent from John Mwangi', time: '2m ago', read: false, icon: <BanknoteIcon size={20} className="text-green-500" /> },
  { id: 2, type: 'maintenance', title: 'Maintenance Request', message: 'AC Not Working in Kilimani Townhouse', time: '10m ago', read: false, icon: <WrenchIcon size={20} className="text-orange-500" /> },
  { id: 3, type: 'tenant', title: 'New Tenant', message: 'Sarah Ochieng moved in to G1', time: '1h ago', read: true, icon: <UsersIcon size={20} className="text-blue-500" /> },
  { id: 4, type: 'property', title: 'Property Added', message: 'Westlands Apartment added', time: '2h ago', read: true, icon: <HomeIcon size={20} className="text-green-400" /> },
  { id: 5, type: 'alert', title: 'Overdue Payment', message: 'Rent overdue for David Kimani', time: '3h ago', read: false, icon: <AlertCircleIcon size={20} className="text-red-500" /> },
  { id: 6, type: 'info', title: 'System Update', message: 'Dashboard updated to v2.1', time: '1d ago', read: true, icon: <BellIcon size={20} className="text-purple-500" /> },
];

export const Notifications = () => {
  const [notifications, setNotifications] = useState(mockNotifications);
  const [filter, setFilter] = useState<'all' | 'unread' | 'read'>('all');

  const filtered = useMemo(() => {
    if (filter === 'all') return notifications;
    if (filter === 'unread') return notifications.filter(n => !n.read);
    return notifications.filter(n => n.read);
  }, [notifications, filter]);

  const unreadCount = notifications.filter(n => !n.read).length;

  const markAsRead = (id: number) => {
    setNotifications(notifications.map(n => n.id === id ? { ...n, read: true } : n));
  };
  const markAllAsRead = () => {
    setNotifications(notifications.map(n => ({ ...n, read: true })));
  };
  const clearAll = () => {
    setNotifications([]);
  };

  return (
    <div className="w-full">
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 mb-8 px-0 md:px-2">
        <div>
          <h1 className="text-3xl font-bold text-green-800 mb-1 flex items-center gap-2"><BellIcon size={28} /> Notifications</h1>
          <div className="text-gray-500 text-sm">{unreadCount} unread, {notifications.length} total</div>
        </div>
        <div className="flex gap-2">
          <button className={`px-4 py-2 rounded-lg text-sm font-semibold transition-all ${filter === 'all' ? 'bg-green-700 text-white' : 'bg-gray-100 text-gray-700 hover:bg-green-50'}`} onClick={() => setFilter('all')}>All</button>
          <button className={`px-4 py-2 rounded-lg text-sm font-semibold transition-all ${filter === 'unread' ? 'bg-green-700 text-white' : 'bg-gray-100 text-gray-700 hover:bg-green-50'}`} onClick={() => setFilter('unread')}>Unread</button>
          <button className={`px-4 py-2 rounded-lg text-sm font-semibold transition-all ${filter === 'read' ? 'bg-green-700 text-white' : 'bg-gray-100 text-gray-700 hover:bg-green-50'}`} onClick={() => setFilter('read')}>Read</button>
        </div>
      </div>
      <div className="bg-white rounded-2xl shadow-lg border border-green-100 overflow-hidden w-full">
        <div className="flex items-center justify-between px-4 md:px-8 py-4 border-b border-green-100 bg-green-50 w-full">
          <div className="font-semibold text-green-800">Recent Notifications</div>
          <div className="flex gap-2">
            <button className="text-green-700 hover:underline text-sm font-medium" onClick={markAllAsRead}>Mark all as read</button>
            <button className="text-red-600 hover:underline text-sm font-medium" onClick={clearAll}>Clear all</button>
          </div>
        </div>
        <ul className="divide-y divide-green-50 w-full">
          {filtered.length === 0 ? (
            <li className="p-8 text-center text-gray-400">No notifications</li>
          ) : filtered.map(n => (
            <li key={n.id} className={`flex items-start gap-4 px-4 md:px-8 py-5 transition-all ${!n.read ? 'bg-green-50/60' : ''}`}>
              <div className="mt-1">{n.icon}</div>
              <div className="flex-1">
                <div className="font-semibold text-gray-800 flex items-center gap-2">
                  {n.title}
                  {!n.read && <span className="ml-1 inline-block w-2 h-2 bg-green-400 rounded-full"></span>}
                </div>
                <div className="text-gray-600 text-sm">{n.message}</div>
                <div className="text-xs text-gray-400 mt-1">{n.time}</div>
              </div>
              {!n.read && (
                <button className="ml-2 text-green-700 hover:text-green-900 p-2 rounded-full" title="Mark as read" onClick={() => markAsRead(n.id)}>
                  <CheckCircle2Icon size={20} />
                </button>
              )}
              <button className="ml-2 text-gray-400 hover:text-red-600 p-2 rounded-full" title="Remove notification" onClick={() => setNotifications(notifications.filter(x => x.id !== n.id))}>
                <Trash2Icon size={20} />
              </button>
            </li>
          ))}
        </ul>
      </div>
    </div>
  );
}; 
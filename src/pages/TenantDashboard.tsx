import React from 'react';
import { User2Icon, HomeIcon, CalendarIcon, BanknoteIcon, AlertCircleIcon, MailIcon, PhoneIcon } from 'lucide-react';

// Mock tenant data (replace with real data from backend later)
const tenant = {
  name: 'John Mwangi',
  email: 'john.mwangi@example.com',
  phone: '+254 712 345 678',
  property: 'Westlands Apartment',
  unit: '3B',
  leaseStart: '2023-01-01',
  leaseEnd: '2023-12-31',
  rent: 45000,
  status: 'active',
};

const payments = [
  { id: 1, month: 'Sep 2023', amount: 45000, status: 'completed' },
  { id: 2, month: 'Oct 2023', amount: 45000, status: 'pending' },
];

const maintenanceRequests = [
  { id: 1, title: 'Leaking tap', date: '2023-09-15', status: 'completed' },
  { id: 2, title: 'Broken window', date: '2023-10-05', status: 'pending' },
];

export const TenantDashboard = () => {
  return (
    <div className="p-6 max-w-5xl mx-auto">
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-gray-800">Welcome, {tenant.name}</h1>
        <p className="text-gray-600">Here are your rental details and recent activity</p>
      </div>
      {/* Profile Card */}
      <div className="bg-white rounded-2xl shadow-lg border border-green-100 p-6 flex flex-col md:flex-row gap-8 mb-8 animate-fadeIn">
        <div className="flex flex-col items-center md:items-start gap-3 flex-1">
          <div className="w-20 h-20 rounded-full bg-green-100 flex items-center justify-center text-green-700 text-4xl font-bold shadow"><User2Icon size={48} /></div>
          <div className="text-xl font-bold text-gray-800">{tenant.name}</div>
          <div className="flex items-center gap-2 text-gray-600"><MailIcon size={16} /> {tenant.email}</div>
          <div className="flex items-center gap-2 text-gray-600"><PhoneIcon size={16} /> {tenant.phone}</div>
        </div>
        <div className="flex-1 flex flex-col gap-2 justify-center">
          <div className="flex items-center gap-2 text-gray-700"><HomeIcon size={18} /> Property: <span className="font-semibold">{tenant.property}</span></div>
          <div className="flex items-center gap-2 text-gray-700"><HomeIcon size={18} /> Unit: <span className="font-semibold">{tenant.unit}</span></div>
          <div className="flex items-center gap-2 text-gray-700"><CalendarIcon size={18} /> Lease: <span className="font-semibold">{tenant.leaseStart}</span> to <span className="font-semibold">{tenant.leaseEnd}</span></div>
          <div className="flex items-center gap-2 text-purple-700 font-semibold"><BanknoteIcon size={18} /> Rent: KES {tenant.rent.toLocaleString()}</div>
          <div className="flex items-center gap-2 text-green-700 font-semibold"><AlertCircleIcon size={18} /> Status: <span className="capitalize">{tenant.status}</span></div>
        </div>
      </div>
      {/* Payments Table */}
      <div className="bg-white rounded-2xl shadow-lg border border-green-100 p-6 mb-8 animate-fadeIn">
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-lg font-semibold text-gray-800">Recent Payments</h2>
        </div>
        <table className="min-w-full text-sm">
          <thead>
            <tr className="text-left text-gray-500 border-b">
              <th className="py-2 pr-4">Month</th>
              <th className="py-2 pr-4">Amount</th>
              <th className="py-2 pr-4">Status</th>
            </tr>
          </thead>
          <tbody>
            {payments.map(payment => (
              <tr key={payment.id} className="border-b last:border-0 hover:bg-green-50 transition-all">
                <td className="py-2 pr-4">{payment.month}</td>
                <td className="py-2 pr-4">KES {payment.amount.toLocaleString()}</td>
                <td className={`py-2 pr-4 font-semibold ${payment.status === 'completed' ? 'text-green-700' : 'text-yellow-700'}`}>{payment.status.charAt(0).toUpperCase() + payment.status.slice(1)}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      {/* Maintenance Requests */}
      <div className="bg-white rounded-2xl shadow-lg border border-green-100 p-6 animate-fadeIn">
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-lg font-semibold text-gray-800">Maintenance Requests</h2>
        </div>
        <table className="min-w-full text-sm">
          <thead>
            <tr className="text-left text-gray-500 border-b">
              <th className="py-2 pr-4">Title</th>
              <th className="py-2 pr-4">Date</th>
              <th className="py-2 pr-4">Status</th>
            </tr>
          </thead>
          <tbody>
            {maintenanceRequests.map(req => (
              <tr key={req.id} className="border-b last:border-0 hover:bg-green-50 transition-all">
                <td className="py-2 pr-4">{req.title}</td>
                <td className="py-2 pr-4">{req.date}</td>
                <td className={`py-2 pr-4 font-semibold ${req.status === 'completed' ? 'text-green-700' : 'text-yellow-700'}`}>{req.status.charAt(0).toUpperCase() + req.status.slice(1)}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default TenantDashboard; 
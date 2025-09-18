import React, { useEffect, useMemo, useState } from 'react';
import { User2Icon, HomeIcon, CalendarIcon, BanknoteIcon, AlertCircleIcon, MailIcon, PhoneIcon, CheckCircle2Icon, ClockIcon } from 'lucide-react';
import { useAuth } from '../auth/AuthContext';

export const TenantDashboard = () => {
  const { token } = useAuth();
  const [tenant, setTenant] = useState<any>(null);
  const [payments, setPayments] = useState<any[]>([]);
  const [requests, setRequests] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let active = true;
    const load = async () => {
      try {
        const [meRes, payRes, reqRes] = await Promise.all([
          fetch('/api/tenants/me', { headers: { Authorization: `Bearer ${token}` } }),
          fetch('/api/payments/my', { headers: { Authorization: `Bearer ${token}` } }),
          fetch('/api/maintenance/my', { headers: { Authorization: `Bearer ${token}` } }),
        ]);
        const me = await meRes.json();
        const pay = await payRes.json();
        const req = await reqRes.json();
        if (!meRes.ok) throw new Error(me?.message || 'Failed to load tenant');
        if (active) {
          setTenant(me.tenant);
          setPayments(pay.payments || []);
          setRequests(req.requests || []);
        }
      } finally {
        if (active) setLoading(false);
      }
    };
    load();
    return () => { active = false; };
  }, [token]);

  const unitLabel = tenant ? `${tenant.unit?.floor?.property?.name || ''} ${tenant.unit?.number || ''}` : '';
  const rent = tenant?.unit?.rent ?? 0;
  const completedPayments = payments.filter(p => p.status === 'completed');
  const last3Payments = useMemo(() => completedPayments.slice(0, 3), [payments]);
  const pendingRequests = requests.filter((r: any) => r.status !== 'completed');
  const completedRequests = requests.filter((r: any) => r.status === 'completed');

  if (loading) return <div className="p-6">Loading...</div>;
  if (!tenant) return <div className="p-6">No tenant profile found.</div>;

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
          <div className="flex items-center gap-2 text-gray-700"><HomeIcon size={18} /> Property/Unit: <span className="font-semibold">{unitLabel}</span></div>
          <div className="flex items-center gap-2 text-gray-700"><CalendarIcon size={18} /> Lease: <span className="font-semibold">{new Date(tenant.moveInDate).toISOString().slice(0,10)}</span> to <span className="font-semibold">{new Date(tenant.leaseEnd).toISOString().slice(0,10)}</span></div>
          <div className="flex items-center gap-2 text-purple-700 font-semibold"><BanknoteIcon size={18} /> Rent: KES {rent.toLocaleString()}</div>
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
            {last3Payments.map(payment => (
              <tr key={payment.id} className="border-b last:border-0 hover:bg-green-50 transition-all">
                <td className="py-2 pr-4">{new Date(payment.year, payment.month - 1, 1).toLocaleDateString(undefined, { month: 'short', year: 'numeric' })}</td>
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
            {requests.slice(0, 5).map(req => (
              <tr key={req.id} className="border-b last:border-0 hover:bg-green-50 transition-all">
                <td className="py-2 pr-4">{req.title}</td>
                <td className="py-2 pr-4">{new Date(req.dateReported).toISOString().slice(0,10)}</td>
                <td className={`py-2 pr-4 font-semibold ${req.status === 'completed' ? 'text-green-700' : 'text-yellow-700'}`}>{req.status === 'in_progress' ? 'In Progress' : req.status.charAt(0).toUpperCase() + req.status.slice(1)}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default TenantDashboard; 
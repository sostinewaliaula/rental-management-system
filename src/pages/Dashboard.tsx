import React, { useEffect, useMemo, useState } from 'react';
import { StatCard } from '../components/StatCard';
import { PropertyCard } from '../components/PropertyCard';
import { HomeIcon, UsersIcon, BanknoteIcon, AlertCircleIcon, ArrowRightIcon } from 'lucide-react';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell, Legend } from 'recharts';
import { Link } from 'react-router-dom';
import { useAuth } from '../auth/AuthContext';

export const Dashboard = () => {
  const { token } = useAuth();
  const [properties, setProperties] = useState<any[]>([]);
  const [payments, setPayments] = useState<any[]>([]);
  const [maintenanceCounts, setMaintenanceCounts] = useState({ pending: 0 });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let active = true;
    const load = async () => {
      try {
        const [propRes, payRes, maintRes] = await Promise.all([
          fetch('/api/properties', { headers: { Authorization: `Bearer ${token}` } }),
          fetch('/api/payments', { headers: { Authorization: `Bearer ${token}` } }),
          fetch('/api/maintenance', { headers: { Authorization: `Bearer ${token}` } }).catch(() => ({ ok: false, json: async () => ({ requests: [] }) } as any)),
        ]);
        const propsJson = await propRes.json();
        const paysJson = await payRes.json();
        const maintJson = maintRes.ok ? await maintRes.json() : { requests: [] };
        if (!propRes.ok) throw new Error('Failed properties');
        if (!payRes.ok) throw new Error('Failed payments');
        if (active) {
          setProperties(propsJson.properties || []);
          setPayments(paysJson.payments || []);
          const pending = (maintJson.requests || []).filter((r: any) => r.status !== 'completed').length;
          setMaintenanceCounts({ pending });
        }
      } finally {
        if (active) setLoading(false);
      }
    };
    load();
    return () => { active = false; };
  }, [token]);

  const totalProperties = properties.length;
  const activeTenants = useMemo(() => {
    let count = 0;
    for (const p of properties) for (const f of (p.floors || [])) for (const u of (f.units || [])) if (u.tenant) count += 1;
    return count;
  }, [properties]);
  const now = new Date();
  const currentMonth = now.getMonth() + 1;
  const currentYear = now.getFullYear();
  const monthlyRevenue = payments.filter(p => p.status === 'completed' && p.month === currentMonth && p.year === currentYear).reduce((s, p) => s + p.amount, 0);

  const stats = [
    { title: 'Total Properties', value: String(totalProperties), icon: HomeIcon, color: 'green' as const },
    { title: 'Active Tenants', value: String(activeTenants), icon: UsersIcon, change: undefined, positive: true, color: 'blue' as const },
    { title: 'Monthly Revenue', value: `KES ${monthlyRevenue.toLocaleString()}`, icon: BanknoteIcon, change: undefined, positive: true, color: 'purple' as const },
    { title: 'Pending Issues', value: String(maintenanceCounts.pending), icon: AlertCircleIcon, change: undefined, positive: false, color: 'orange' as const },
  ];

  const propertyTypeMap: Record<string, number> = {};
  for (const p of properties) propertyTypeMap[p.type] = (propertyTypeMap[p.type] || 0) + 1;
  const propertyTypeData = Object.entries(propertyTypeMap).map(([name, value]) => ({ name, value }));
  const pieColors = ['#22c55e', '#3b82f6', '#a855f7', '#f59e42', '#f43f5e'];

  const recentProperties = useMemo(() => properties.slice(0, 3).map((p: any) => ({
    id: p.id, name: p.name, image: p.image, location: p.location, type: p.type, bedrooms: undefined, bathrooms: undefined, area: undefined, rent: undefined, status: 'vacant' as const,
  })), [properties]);

  const recentPayments = useMemo(() => (payments || []).slice(0, 4).map((p: any) => ({
    id: p.id,
    tenant: p.tenant?.name || '-',
    property: p.unit?.floor?.property?.name ? `${p.unit.floor.property.name} ${p.unit.number || ''}` : p.unit?.number || '-',
    amount: p.amount,
    date: p.date ? new Date(p.date).toISOString().slice(0,10) : '-',
    status: p.status,
  })), [payments]);

  const monthsBack = 6;
  const revMap: Record<string, number> = {};
  for (const p of payments) if (p.status === 'completed') {
    const key = `${p.year}-${String(p.month).padStart(2,'0')}`;
    revMap[key] = (revMap[key] || 0) + p.amount;
  }
  const labels = Array.from({ length: monthsBack }, (_, i) => {
    const d = new Date(currentYear, currentMonth - 1 - (monthsBack - 1 - i), 1);
    return { key: `${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,'0')}`, label: d.toLocaleString(undefined, { month: 'short' }) };
  });
  const revenueData = labels.map(({ key, label }) => ({ month: label, revenue: revMap[key] || 0 }));

  return (
    <div>
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-800">Dashboard</h1>
        <p className="text-gray-600">Welcome back to your rental management system</p>
      </div>
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        {stats.map((stat, index) => (
          <StatCard key={index} {...stat} />
        ))}
      </div>
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-8">
        {/* Charts Section */}
        <div className="lg:col-span-2 bg-white rounded-lg p-6 shadow-sm border border-gray-100 flex flex-col gap-8">
          <div>
          <div className="flex justify-between items-center mb-4">
              <h2 className="text-lg font-semibold text-gray-800">Revenue Trend</h2>
            </div>
            <div className="w-full h-64">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={revenueData} margin={{ top: 10, right: 30, left: 0, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="month" />
                  <YAxis tickFormatter={v => `KES ${v / 1000}k`} />
                  <Tooltip formatter={v => `KES ${v.toLocaleString()}`} />
                  <Line type="monotone" dataKey="revenue" stroke="#22c55e" strokeWidth={3} dot={{ r: 4 }} />
                </LineChart>
              </ResponsiveContainer>
            </div>
          </div>
          <div>
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-lg font-semibold text-gray-800">Properties by Type</h2>
            </div>
            <div className="w-full h-64 flex items-center justify-center">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie data={propertyTypeData} dataKey="value" nameKey="name" cx="50%" cy="50%" outerRadius={70} label>
                    {propertyTypeData.map((entry, idx) => (
                      <Cell key={`cell-${idx}`} fill={pieColors[idx % pieColors.length]} />
                    ))}
                  </Pie>
                  <Legend />
                  <Tooltip />
                </PieChart>
              </ResponsiveContainer>
            </div>
          </div>
        </div>
        {/* Recent Payments Table */}
        <div className="bg-white rounded-lg p-6 shadow-sm border border-gray-100 overflow-x-auto">
          <div className="flex justify-between items-center mb-4">
            <h2 className="text-lg font-semibold text-gray-800">Recent Payments</h2>
            <Link to="/payments" className="text-sm text-green-700 hover:text-green-800 flex items-center">
              View all <ArrowRightIcon size={16} className="ml-1" />
            </Link>
          </div>
          <table className="min-w-full text-sm">
            <thead>
              <tr className="text-left text-gray-500 border-b">
                <th className="py-2 pr-4">Tenant</th>
                <th className="py-2 pr-4">Property</th>
                <th className="py-2 pr-4">Amount</th>
                <th className="py-2 pr-4">Date</th>
                <th className="py-2 pr-4">Status</th>
              </tr>
            </thead>
            <tbody>
              {recentPayments.map(payment => (
                <tr
                  key={payment.id}
                  className="border-b last:border-0 transition-all duration-200 cursor-pointer hover:bg-green-100 hover:shadow-md hover:scale-[1.01]"
                  style={{ boxShadow: '0 1px 4px 0 rgba(34,197,94,0.06)' }}
                >
                  <td className="py-2 pr-4 font-medium text-gray-800">{payment.tenant}</td>
                  <td className="py-2 pr-4 text-gray-600">{payment.property}</td>
                  <td className="py-2 pr-4 text-green-700 font-semibold">KES {payment.amount.toLocaleString()}</td>
                  <td className="py-2 pr-4 text-gray-500">{payment.date}</td>
                  <td className="py-2 pr-4">
                  <span className={`text-xs px-2 py-1 rounded-full ${payment.status === 'completed' ? 'bg-green-100 text-green-800' : 'bg-yellow-100 text-yellow-800'}`}>
                    {payment.status.charAt(0).toUpperCase() + payment.status.slice(1)}
                  </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
      {/* Recent Properties Section */}
      <div className="bg-white rounded-lg p-6 shadow-sm border border-gray-100 mb-8">
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-lg font-semibold text-gray-800">Recent Properties</h2>
          <Link to="/properties" className="text-sm text-green-700 hover:text-green-800 flex items-center">
            View all <ArrowRightIcon size={16} className="ml-1" />
          </Link>
                </div>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {recentProperties.map(property => (
            <div
              key={property.id}
              className="transition-all duration-200 transform hover:scale-105 hover:shadow-2xl cursor-pointer rounded-xl"
              style={{ boxShadow: '0 2px 8px 0 rgba(34,197,94,0.08)' }}
            >
              <PropertyCard property={property} />
          </div>
          ))}
        </div>
      </div>
    </div>
  );
};
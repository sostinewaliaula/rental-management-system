import React, { useState } from 'react';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, BarChart, Bar, PieChart, Pie, Cell, Legend, AreaChart, Area } from 'recharts';
import { BanknoteIcon, UsersIcon, BuildingIcon, WrenchIcon, DownloadIcon, CalendarIcon } from 'lucide-react';

const revenueData = [
  { month: 'Jan', revenue: 320000 },
  { month: 'Feb', revenue: 340000 },
  { month: 'Mar', revenue: 360000 },
  { month: 'Apr', revenue: 390000 },
  { month: 'May', revenue: 410000 },
  { month: 'Jun', revenue: 430000 },
  { month: 'Jul', revenue: 420000 },
  { month: 'Aug', revenue: 440000 },
  { month: 'Sep', revenue: 470000 },
  { month: 'Oct', revenue: 480000 },
  { month: 'Nov', revenue: 500000 },
  { month: 'Dec', revenue: 520000 },
];
const occupancyData = [
  { property: 'Westlands', occupancy: 95 },
  { property: 'Kilimani', occupancy: 88 },
  { property: 'Lavington', occupancy: 92 },
  { property: 'Karen', occupancy: 85 },
  { property: 'Mombasa', occupancy: 80 },
];
const paymentStatusData = [
  { name: 'Completed', value: 320 },
  { name: 'Pending', value: 45 },
  { name: 'Overdue', value: 15 },
];
const maintenanceTrendData = [
  { month: 'Jan', requests: 8 },
  { month: 'Feb', requests: 6 },
  { month: 'Mar', requests: 10 },
  { month: 'Apr', requests: 7 },
  { month: 'May', requests: 12 },
  { month: 'Jun', requests: 9 },
  { month: 'Jul', requests: 11 },
  { month: 'Aug', requests: 8 },
  { month: 'Sep', requests: 13 },
  { month: 'Oct', requests: 10 },
  { month: 'Nov', requests: 7 },
  { month: 'Dec', requests: 6 },
];
const pieColors = ['#22c55e', '#facc15', '#ef4444'];

export const Reports = () => {
  const [dateRange, setDateRange] = useState('2023');
  // Mock summary stats
  const totalRevenue = 520000;
  const occupancyRate = 91;
  const activeTenants = 320;
  const maintenanceRequests = 10;

  return (
    <div>
      {/* Summary cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
        <div className="bg-white rounded-lg p-6 shadow-sm border border-gray-100 flex flex-col items-center transition-all duration-200 hover:scale-105 hover:shadow-2xl cursor-pointer" style={{ boxShadow: '0 2px 8px 0 rgba(34,197,94,0.08)' }}>
          <div className="p-3 rounded-lg bg-green-50 text-green-700 mb-2"><BanknoteIcon size={22} /></div>
          <div className="text-2xl font-bold text-gray-800">KES {totalRevenue.toLocaleString()}</div>
          <div className="text-sm text-gray-500">Total Revenue</div>
        </div>
        <div className="bg-white rounded-lg p-6 shadow-sm border border-gray-100 flex flex-col items-center transition-all duration-200 hover:scale-105 hover:shadow-2xl cursor-pointer" style={{ boxShadow: '0 2px 8px 0 rgba(34,197,94,0.08)' }}>
          <div className="p-3 rounded-lg bg-blue-50 text-blue-700 mb-2"><BuildingIcon size={22} /></div>
          <div className="text-2xl font-bold text-blue-700">{occupancyRate}%</div>
          <div className="text-sm text-gray-500">Occupancy Rate</div>
        </div>
        <div className="bg-white rounded-lg p-6 shadow-sm border border-gray-100 flex flex-col items-center transition-all duration-200 hover:scale-105 hover:shadow-2xl cursor-pointer" style={{ boxShadow: '0 2px 8px 0 rgba(34,197,94,0.08)' }}>
          <div className="p-3 rounded-lg bg-yellow-50 text-yellow-700 mb-2"><UsersIcon size={22} /></div>
          <div className="text-2xl font-bold text-yellow-700">{activeTenants}</div>
          <div className="text-sm text-gray-500">Active Tenants</div>
        </div>
        <div className="bg-white rounded-lg p-6 shadow-sm border border-gray-100 flex flex-col items-center transition-all duration-200 hover:scale-105 hover:shadow-2xl cursor-pointer" style={{ boxShadow: '0 2px 8px 0 rgba(34,197,94,0.08)' }}>
          <div className="p-3 rounded-lg bg-red-50 text-red-700 mb-2"><WrenchIcon size={22} /></div>
          <div className="text-2xl font-bold text-red-700">{maintenanceRequests}</div>
          <div className="text-sm text-gray-500">Maintenance Requests</div>
        </div>
      </div>
      {/* Controls */}
      <div className="flex flex-col md:flex-row md:items-center justify-between mb-6 gap-4">
        <div className="flex items-center gap-2">
          <CalendarIcon size={18} className="text-gray-400" />
          <select className="border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-transparent" value={dateRange} onChange={e => setDateRange(e.target.value)}>
            <option value="2023">2023</option>
            <option value="2022">2022</option>
            <option value="2021">2021</option>
          </select>
        </div>
        <div className="flex gap-2">
          <button className="bg-white border border-gray-300 text-gray-700 py-2 px-4 rounded-lg flex items-center hover:bg-gray-50">
            <DownloadIcon size={18} className="mr-2" /> Export PDF
          </button>
          <button className="bg-white border border-gray-300 text-gray-700 py-2 px-4 rounded-lg flex items-center hover:bg-gray-50">
            <DownloadIcon size={18} className="mr-2" /> Export CSV
          </button>
        </div>
      </div>
      {/* Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mb-8">
        <div className="bg-white rounded-2xl p-6 shadow-lg border border-green-100">
          <h3 className="text-lg font-bold text-gray-800 mb-4">Revenue Trend</h3>
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
        <div className="bg-white rounded-2xl p-6 shadow-lg border border-green-100">
          <h3 className="text-lg font-bold text-gray-800 mb-4">Occupancy by Property</h3>
          <div className="w-full h-64">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={occupancyData}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="property" />
                <YAxis unit="%" />
                <Tooltip />
                <Bar dataKey="occupancy" fill="#2563eb" radius={[8, 8, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
        <div className="bg-white rounded-2xl p-6 shadow-lg border border-green-100">
          <h3 className="text-lg font-bold text-gray-800 mb-4">Payment Status</h3>
          <div className="w-full h-64 flex items-center justify-center">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie data={paymentStatusData} dataKey="value" nameKey="name" cx="50%" cy="50%" outerRadius={70} label>
                  {paymentStatusData.map((entry, idx) => (
                    <Cell key={`cell-${idx}`} fill={pieColors[idx % pieColors.length]} />
                  ))}
                </Pie>
                <Legend />
                <Tooltip />
              </PieChart>
            </ResponsiveContainer>
          </div>
        </div>
        <div className="bg-white rounded-2xl p-6 shadow-lg border border-green-100">
          <h3 className="text-lg font-bold text-gray-800 mb-4">Maintenance Requests Trend</h3>
          <div className="w-full h-64">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={maintenanceTrendData} margin={{ top: 10, right: 30, left: 0, bottom: 0 }}>
                <defs>
                  <linearGradient id="colorReq" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#f43f5e" stopOpacity={0.8}/>
                    <stop offset="95%" stopColor="#f43f5e" stopOpacity={0}/>
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="month" />
                <YAxis />
                <Tooltip />
                <Area type="monotone" dataKey="requests" stroke="#f43f5e" fillOpacity={1} fill="url(#colorReq)" />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>
    </div>
  );
}; 
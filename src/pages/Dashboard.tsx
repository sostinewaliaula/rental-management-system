import React from 'react';
import { StatCard } from '../components/StatCard';
import { PropertyCard } from '../components/PropertyCard';
import { HomeIcon, UsersIcon, BanknoteIcon, AlertCircleIcon, ArrowRightIcon } from 'lucide-react';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell, Legend } from 'recharts';
import { Link } from 'react-router-dom';

export const Dashboard = () => {
  // Mock data
  const stats = [
    {
    title: 'Total Properties',
    value: '12',
    icon: HomeIcon,
      color: 'green' as const,
    },
    {
    title: 'Active Tenants',
    value: '28',
    icon: UsersIcon,
    change: '12%',
    positive: true,
      color: 'blue' as const,
    },
    {
    title: 'Monthly Revenue',
    value: 'KES 320,500',
    icon: BanknoteIcon,
    change: '8%',
    positive: true,
      color: 'purple' as const,
    },
    {
    title: 'Pending Issues',
    value: '5',
    icon: AlertCircleIcon,
    change: '2',
    positive: false,
      color: 'orange' as const,
    },
  ];

  // Chart data
  const revenueData = [
    { month: 'Apr', revenue: 250000 },
    { month: 'May', revenue: 270000 },
    { month: 'Jun', revenue: 300000 },
    { month: 'Jul', revenue: 310000 },
    { month: 'Aug', revenue: 320000 },
    { month: 'Sep', revenue: 315000 },
    { month: 'Oct', revenue: 320500 },
  ];
  const propertyTypeData = [
    { name: 'Apartment', value: 5 },
    { name: 'Townhouse', value: 3 },
    { name: 'Villa', value: 2 },
    { name: 'House', value: 1 },
    { name: 'Cottage', value: 1 },
  ];
  const pieColors = ['#22c55e', '#3b82f6', '#a855f7', '#f59e42', '#f43f5e'];

  const recentProperties = [
    {
    id: 1,
    name: 'Westlands Apartment',
      image:
        'https://images.unsplash.com/photo-1568605114967-8130f3a36994?ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D&auto=format&fit=crop&w=2070&q=80',
    location: 'Westlands, Nairobi',
    type: 'Apartment',
    bedrooms: 2,
    bathrooms: 1,
    area: 85,
    rent: 45000,
      status: 'vacant' as const,
    },
    {
    id: 2,
    name: 'Kilimani Townhouse',
      image:
        'https://images.unsplash.com/photo-1598228723793-52759bba239c?ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D&auto=format&fit=crop&w=2074&q=80',
    location: 'Kilimani, Nairobi',
    type: 'Townhouse',
    bedrooms: 3,
    bathrooms: 2,
    area: 120,
    rent: 65000,
      status: 'occupied' as const,
    },
    {
    id: 3,
    name: 'Mombasa Beach Villa',
      image:
        'https://images.unsplash.com/photo-1600585154340-be6161a56a0c?ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D&auto=format&fit=crop&w=2070&q=80',
    location: 'Nyali, Mombasa',
    type: 'Villa',
    bedrooms: 4,
    bathrooms: 3,
    area: 200,
    rent: 120000,
      status: 'maintenance' as const,
    },
  ];
  const recentPayments = [
    {
    id: 1,
    tenant: 'John Mwangi',
    property: 'Westlands Apartment 3B',
    amount: 45000,
    date: '2023-10-01',
      status: 'completed',
    },
    {
    id: 2,
    tenant: 'Sarah Ochieng',
    property: 'Kilimani Townhouse 7',
    amount: 65000,
    date: '2023-09-30',
      status: 'completed',
    },
    {
    id: 3,
    tenant: 'David Kimani',
    property: 'Lavington House 12',
    amount: 85000,
    date: '2023-09-28',
      status: 'completed',
    },
    {
    id: 4,
    tenant: 'Mary Njeri',
    property: 'Karen Cottage 2',
    amount: 55000,
    date: '2023-09-25',
      status: 'pending',
    },
  ];

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
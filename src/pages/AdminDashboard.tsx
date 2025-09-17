import React from 'react';

export function AdminDashboard() {
  return (
    <div>
      <h1 className="text-2xl font-bold mb-4">Admin Dashboard</h1>
      <p className="text-gray-600 mb-4">Manage users and system settings.</p>
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="bg-white rounded shadow p-4">
          <div className="text-sm text-gray-500">Total Users</div>
          <div className="text-2xl font-semibold">—</div>
        </div>
        <div className="bg-white rounded shadow p-4">
          <div className="text-sm text-gray-500">Admins</div>
          <div className="text-2xl font-semibold">—</div>
        </div>
        <div className="bg-white rounded shadow p-4">
          <div className="text-sm text-gray-500">Landlords</div>
          <div className="text-2xl font-semibold">—</div>
        </div>
      </div>
    </div>
  );
}



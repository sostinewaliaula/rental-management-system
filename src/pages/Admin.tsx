import React, { useEffect, useState } from 'react';

type User = { id: number; name: string; email: string; role: string };

export function Admin() {
  const [users, setUsers] = useState<User[]>([]);
  const [error, setError] = useState<string | null>(null);
  const token = localStorage.getItem('token');

  useEffect(() => {
    (async () => {
      try {
        const res = await fetch('/api/users', { headers: { Authorization: `Bearer ${token}` } });
        const data = await res.json();
        if (!res.ok) throw new Error(data?.message || 'Failed to load users');
        setUsers(data.users);
      } catch (e: any) {
        setError(e.message);
      }
    })();
  }, []);

  return (
    <div>
      <h1 className="text-xl font-semibold mb-4">Admin: Users</h1>
      {error && <div className="text-red-600 text-sm">{error}</div>}
      <div className="bg-white rounded shadow">
        <table className="min-w-full">
          <thead>
            <tr className="text-left">
              <th className="p-3">Name</th>
              <th className="p-3">Email</th>
              <th className="p-3">Role</th>
            </tr>
          </thead>
          <tbody>
            {users.map(u => (
              <tr key={u.id} className="border-t">
                <td className="p-3">{u.name}</td>
                <td className="p-3">{u.email}</td>
                <td className="p-3">{u.role}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}



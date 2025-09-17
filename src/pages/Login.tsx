import React, { useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { useAuth } from '../auth/AuthContext';

export function Login() {
  const navigate = useNavigate();
  const location = useLocation() as any;
  const { login } = useAuth();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError(null);
    try {
      const res = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password }),
      });
      const ct = res.headers.get('content-type') || '';
      const data = ct.includes('application/json') ? await res.json() : { message: await res.text() };
      if (!res.ok) throw new Error(data?.message || 'Login failed');
      login(data.token, data.user);
      const from = location.state?.from?.pathname as string | undefined;
      if (from) navigate(from, { replace: true });
      else if (data.user.role === 'admin') navigate('/admin');
      else if (data.user.role === 'landlord') navigate('/dashboard');
      else navigate('/tenant-dashboard');
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="flex items-center justify-center h-screen bg-gray-50">
      <form onSubmit={handleSubmit} className="bg-white p-6 rounded shadow w-96 space-y-4">
        <h1 className="text-xl font-semibold">Sign in</h1>
        {error && <div className="text-red-600 text-sm">{error}</div>}
        <div>
          <label className="block text-sm text-gray-600 mb-1">Email</label>
          <input value={email} onChange={(e) => setEmail(e.target.value)} type="email" className="w-full border rounded px-3 py-2" placeholder="you@example.com" required />
        </div>
        <div>
          <label className="block text-sm text-gray-600 mb-1">Password</label>
          <input value={password} onChange={(e) => setPassword(e.target.value)} type="password" className="w-full border rounded px-3 py-2" placeholder="••••••••" required />
        </div>
        <button disabled={loading} className="w-full bg-indigo-600 text-white py-2 rounded hover:bg-indigo-700 disabled:opacity-60">{loading ? 'Signing in...' : 'Sign in'}</button>
        <div className="text-xs text-gray-500">Try admin@example.com / Admin@123</div>
      </form>
    </div>
  );
}



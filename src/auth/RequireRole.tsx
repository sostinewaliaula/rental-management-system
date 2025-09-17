import React from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import { useAuth } from './AuthContext';

export function RequireRole({ roles, children }: { roles: Array<'admin' | 'landlord' | 'tenant'>; children: React.ReactNode }) {
  const { user, loading } = useAuth();
  const location = useLocation();
  if (loading) return <div className="flex items-center justify-center h-full">Loading...</div>;
  if (!user) return <Navigate to="/login" replace state={{ from: location }} />;
  if (!roles.includes(user.role as any)) return <Navigate to={user.role === 'admin' ? '/admin' : user.role === 'tenant' ? '/tenant-dashboard' : '/dashboard'} replace />;
  return <>{children}</>;
}



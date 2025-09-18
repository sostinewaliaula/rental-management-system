import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { Sidebar } from './components/Sidebar';
import { Header } from './components/Header';
import { Dashboard } from './pages/Dashboard';
import { Properties } from './pages/Properties';
import { Tenants } from './pages/Tenants';
import PaymentsSwitch from './pages/PaymentsSwitch';
import { Maintenance } from './pages/Maintenance';
import MaintenanceSwitch from './pages/MaintenanceSwitch';
import { Settings } from './pages/Settings';
import { Reports } from './pages/Reports';
import { Notifications } from './pages/Notifications';
import { TenantDashboard } from './pages/TenantDashboard';
import { Login } from './pages/Login';
import { Admin } from './pages/Admin';
import { AuthProvider } from './auth/AuthContext';
import { RequireAuth } from './auth/RequireAuth';
import { RequireRole } from './auth/RequireRole';
import { AdminDashboard } from './pages/AdminDashboard';

export function App() {
  return (
    <Router>
      <AuthProvider>
        <Routes>
          <Route path="/login" element={<Login />} />
          <Route
            path="/*"
            element={
              <RequireAuth>
                <div className="flex h-screen bg-gray-50">
                  <Sidebar />
                  <div className="flex-1 flex flex-col overflow-hidden">
                    <Header />
                    <main className="flex-1 overflow-y-auto p-4 md:p-6">
                      <Routes>
                        <Route path="/dashboard" element={<RequireRole roles={["landlord"]}><Dashboard /></RequireRole>} />
                        <Route path="/properties" element={<Properties />} />
                        <Route path="/tenants" element={<Tenants />} />
                        <Route path="/payments" element={<PaymentsSwitch />} />
                        <Route path="/maintenance" element={<MaintenanceSwitch />} />
                        <Route path="/reports" element={<Reports />} />
                        <Route path="/notifications" element={<Notifications />} />
                        <Route path="/settings" element={<Settings />} />
                        <Route path="/tenant-dashboard" element={<RequireRole roles={["tenant"]}><TenantDashboard /></RequireRole>} />
                        <Route path="/admin" element={<RequireRole roles={["admin"]}><AdminDashboard /></RequireRole>} />
                        <Route path="/" element={<Navigate to="/dashboard" replace />} />
                      </Routes>
                    </main>
                  </div>
                </div>
              </RequireAuth>
            }
          />
          <Route path="*" element={<Navigate to="/login" replace />} />
        </Routes>
      </AuthProvider>
    </Router>
  );
}
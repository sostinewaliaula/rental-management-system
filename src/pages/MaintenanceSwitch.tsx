import React from 'react';
import { useAuth } from '../auth/AuthContext';
import { Maintenance } from './Maintenance';
import { TenantMaintenance } from './TenantMaintenance';

export const MaintenanceSwitch: React.FC = () => {
  const { user } = useAuth();
  if (user?.role === 'tenant') return <TenantMaintenance />;
  return <Maintenance />;
};

export default MaintenanceSwitch;



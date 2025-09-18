import React from 'react';
import { useAuth } from '../auth/AuthContext';
import { Payments } from './Payments';
import TenantPayments from './TenantPayments';

export const PaymentsSwitch: React.FC = () => {
  const { user } = useAuth();
  if (user?.role === 'tenant') return <TenantPayments />;
  return <Payments />;
};

export default PaymentsSwitch;



import React from 'react';
import { MoreVerticalIcon } from 'lucide-react';
interface TenantRowProps {
  tenant: {
    id: number;
    name: string;
    phone: string;
    email: string;
    property: string;
    moveInDate: string;
    leaseEnd: string;
    rent: number;
    status: 'active' | 'late' | 'ending';
  };
}
export const TenantRow = ({
  tenant
}: TenantRowProps) => {
  const statusColors = {
    active: 'bg-green-100 text-green-800',
    late: 'bg-red-100 text-red-800',
    ending: 'bg-yellow-100 text-yellow-800'
  };
  return <tr className="border-b border-gray-200 hover:bg-gray-50">
      <td className="px-6 py-4 whitespace-nowrap">
        <div className="text-sm font-medium text-gray-900">{tenant.name}</div>
      </td>
      <td className="px-6 py-4 whitespace-nowrap">
        <div className="text-sm text-gray-500">{tenant.phone}</div>
      </td>
      <td className="px-6 py-4 whitespace-nowrap">
        <div className="text-sm text-gray-500">{tenant.email}</div>
      </td>
      <td className="px-6 py-4 whitespace-nowrap">
        <div className="text-sm text-gray-500">{tenant.property}</div>
      </td>
      <td className="px-6 py-4 whitespace-nowrap">
        <div className="text-sm text-gray-500">
          KES {tenant.rent.toLocaleString()}
        </div>
      </td>
      <td className="px-6 py-4 whitespace-nowrap">
        <span className={`px-2 py-1 text-xs rounded-full font-medium ${statusColors[tenant.status]}`}>
          {tenant.status.charAt(0).toUpperCase() + tenant.status.slice(1)}
        </span>
      </td>
      <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
        <button className="text-gray-500 hover:text-gray-700">
          <MoreVerticalIcon size={16} />
        </button>
      </td>
    </tr>;
};
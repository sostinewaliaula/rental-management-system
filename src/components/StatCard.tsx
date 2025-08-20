import React from 'react';
import { BoxIcon } from 'lucide-react';
interface StatCardProps {
  title: string;
  value: string;
  icon: typeof BoxIcon;
  change?: string;
  positive?: boolean;
  color: 'green' | 'blue' | 'orange' | 'purple';
}
export const StatCard = ({
  title,
  value,
  icon: Icon,
  change,
  positive,
  color
}: StatCardProps) => {
  const colorClasses = {
    green: 'bg-green-50 text-green-700',
    blue: 'bg-blue-50 text-blue-700',
    orange: 'bg-orange-50 text-orange-700',
    purple: 'bg-purple-50 text-purple-700'
  };
  return (
    <div
      className={`bg-white rounded-lg p-6 shadow-sm border border-gray-100 transition-all duration-200 hover:scale-105 hover:shadow-2xl cursor-pointer`}
      style={{ boxShadow: '0 2px 8px 0 rgba(34,197,94,0.08)' }}
    >
      <div className="flex items-center">
        <div className={`p-3 rounded-lg ${colorClasses[color]}`}>
          <Icon size={20} />
        </div>
        <div className="ml-auto text-right">
          <p className="text-sm font-medium text-gray-500">{title}</p>
          <p className="text-2xl font-semibold text-gray-800">{value}</p>
        </div>
      </div>
      {change && <div className="mt-4 text-sm">
          <span className={positive ? 'text-green-600' : 'text-red-600'}>
            {positive ? '↑' : '↓'} {change}
          </span>
          <span className="text-gray-500 ml-1">vs last month</span>
        </div>}
    </div>
  );
};
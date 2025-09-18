import React from 'react';
import { MapPinIcon, BedIcon, BathIcon, SquareIcon } from 'lucide-react';
interface PropertyCardProps {
  property: {
    id: number;
    name: string;
    image?: string;
    location?: string;
    type?: string;
    bedrooms?: number;
    bathrooms?: number;
    area?: number;
    rent?: number;
    status: 'vacant' | 'occupied' | 'maintenance';
  };
}
export const PropertyCard = ({
  property
}: PropertyCardProps) => {
  const statusColors = {
    vacant: 'bg-green-100 text-green-800',
    occupied: 'bg-blue-100 text-blue-800',
    maintenance: 'bg-orange-100 text-orange-800'
  };
  return (
    <div
      className="bg-white rounded-lg overflow-hidden shadow-sm border border-gray-100 transition-all duration-200 hover:scale-105 hover:shadow-2xl cursor-pointer"
      style={{ boxShadow: '0 2px 8px 0 rgba(34,197,94,0.08)' }}
    >
      <div className="h-48 overflow-hidden">
        <img src={property.image || 'https://via.placeholder.com/400x300?text=Property'} alt={property.name} className="w-full h-full object-cover" />
      </div>
      <div className="p-4">
        <div className="flex justify-between items-start">
          <h3 className="font-semibold text-lg text-gray-800">
            {property.name}
          </h3>
          <span className={`text-xs px-2 py-1 rounded-full font-medium ${statusColors[property.status]}`}>
            {property.status.charAt(0).toUpperCase() + property.status.slice(1)}
          </span>
        </div>
        <div className="flex items-center mt-2 text-gray-600 text-sm">
          <MapPinIcon size={14} className="mr-1" />
          <span>{property.location || '-'}</span>
        </div>
        <div className="flex items-center justify-between mt-3">
          <div className="flex items-center text-gray-600 text-sm">
            <BedIcon size={14} className="mr-1" />
          <span>{property.bedrooms ?? '-'} BD</span>
          </div>
          <div className="flex items-center text-gray-600 text-sm">
            <BathIcon size={14} className="mr-1" />
          <span>{property.bathrooms ?? '-'} BA</span>
          </div>
          <div className="flex items-center text-gray-600 text-sm">
            <SquareIcon size={14} className="mr-1" />
          <span>{property.area ?? '-'} m²</span>
          </div>
        </div>
        <div className="mt-4 pt-4 border-t border-gray-100">
          <div className="flex justify-between items-center">
            <span className="text-gray-600 text-sm">{property.type || '-'}</span>
            <span className="font-bold text-green-700">
              {typeof property.rent === 'number' ? `KES ${property.rent.toLocaleString()}` : 'KES -'}
            </span>
          </div>
        </div>
      </div>
    </div>
  );
};
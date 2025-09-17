import React, { useState, useEffect, useRef, useMemo } from 'react';
import { PlusIcon, SearchIcon, FilterIcon, EyeIcon, PencilIcon, Trash2Icon, HomeIcon, BuildingIcon, WrenchIcon, CheckCircle2Icon, LayersIcon, DoorOpenIcon, User2Icon, ArrowLeftIcon, InfoIcon, BedIcon, SquareIcon, XIcon } from 'lucide-react';
import { ColumnDef, getCoreRowModel, getSortedRowModel, getPaginationRowModel, flexRender, useReactTable } from '@tanstack/react-table';
import { Listbox } from '@headlessui/react';
import { useAuth } from '../auth/AuthContext';

// Simple Modal component
interface ModalProps {
  open: boolean;
  onClose: () => void;
  title: string;
  children: React.ReactNode;
}
const Modal: React.FC<ModalProps> = ({ open, onClose, title, children }) => {
  const modalRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!open) return;
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [open, onClose]);

  const handleBackdropClick = (e: React.MouseEvent<HTMLDivElement>) => {
    if (modalRef.current && e.target === modalRef.current) {
      onClose();
    }
  };

  if (!open) return null;
  return (
    <div
      ref={modalRef}
      className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-30 px-2 font-sans"
      onClick={handleBackdropClick}
    >
      <div className="bg-gradient-to-br from-green-50 via-white to-green-100 rounded-3xl shadow-2xl p-6 w-[90vw] min-h-[60vh] max-h-[80vh] max-w-4xl relative animate-fadeIn flex flex-col gap-2 overflow-y-auto border border-green-100">
        <button onClick={onClose} className="absolute top-6 right-8 text-gray-400 hover:text-green-700 p-2 rounded-full transition-all" aria-label="Close">
          <XIcon size={22} />
        </button>
        <h2 className="text-2xl font-extrabold mb-6 text-green-800 text-center tracking-wide leading-tight drop-shadow-sm font-sans">{title}</h2>
        <div className="w-full flex flex-col gap-6 text-base text-gray-800 font-sans">
          {children}
        </div>
      </div>
    </div>
  );
};

type UnitType = 'studio' | 'bedsitter' | 'one bedroom' | 'two bedroom' | 'three bedroom' | 'four bedroom';
type Unit = {
  id: number;
  type: UnitType;
  number: string;
  status: 'vacant' | 'occupied' | 'maintenance';
  tenant?: {
    id: number;
    name: string;
    phone: string;
    email: string;
    moveInDate: string;
    leaseEnd: string;
    rent: number;
  };
  rent: number; // Added rent field
};
type Floor = {
  id: number;
  name: string;
  units: Unit[];
};
type Property = {
  id: number;
  name: string;
  image: string;
  location: string;
  type: string;
  floors: Floor[];
};
type ModalType = 'view' | 'edit' | null;

export const Properties = () => {
  const { token } = useAuth();
  const [searchTerm, setSearchTerm] = useState('');
  const [filterType, setFilterType] = useState('all');
  const [properties, setProperties] = useState<Property[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selected, setSelected] = useState<Property | null>(null);
  const [modalType, setModalType] = useState<ModalType>(null);
  const [deleteId, setDeleteId] = useState<number | null>(null);
  const [drillProperty, setDrillProperty] = useState<Property | null>(null);
  const [drillFloor, setDrillFloor] = useState<Floor | null>(null);
  const [drillUnit, setDrillUnit] = useState<Unit | null>(null);
  const [sortBy, setSortBy] = useState<'name' | 'location' | 'type' | 'floors'>('name');
  const [sortDir, setSortDir] = useState<'asc' | 'desc'>('asc');
  const [typeFilter, setTypeFilter] = useState('all');
  const [page, setPage] = useState(1);
  const pageSize = 5;

  const [addModalOpen, setAddModalOpen] = useState(false);
  const [newProperty, setNewProperty] = useState<any>({
    name: '',
    location: 'Nairobi',
    type: '',
    image: '',
    floors: [],
  });
  const [newFloors, setNewFloors] = useState<any[]>([]);
  const [newUnits, setNewUnits] = useState<{ [floorIdx: number]: any[] }>({});
  const [addError, setAddError] = useState('');

  const [editModalOpen, setEditModalOpen] = useState(false);
  const [editPropertyIdx, setEditPropertyIdx] = useState<number | null>(null);
  const [editProperty, setEditProperty] = useState<any>(null);
  const [editFloors, setEditFloors] = useState<any[]>([]);
  const [editUnits, setEditUnits] = useState<{ [floorIdx: number]: any[] }>({});
  const [editError, setEditError] = useState('');

  useEffect(() => {
    let active = true;
    (async () => {
      try {
        setLoading(true);
        const res = await fetch('/api/properties', { headers: { Authorization: `Bearer ${token}`, Accept: 'application/json' } });
        const contentType = res.headers.get('content-type') || '';
        const data = contentType.includes('application/json') ? await res.json() : { message: await res.text() };
        if (!res.ok) throw new Error(data?.message || 'Failed to load properties');
        // Map DB units to UI-friendly shape; tenant details are not yet linked in DB
        const mapped: Property[] = (data.properties || []).map((p: any) => ({
          id: p.id,
          name: p.name,
          image: p.image || '',
          location: p.location,
          type: p.type,
          floors: (p.floors || []).map((f: any) => ({
            id: f.id,
            name: f.name,
            units: (f.units || []).map((u: any) => ({
              id: u.id,
              type: u.type,
              number: u.number,
              status: u.status,
              rent: u.rent ?? 0,
              tenant: u.tenant || null,
            })),
          })),
        }));
        if (active) setProperties(mapped);
      } catch (e: any) {
        if (active) setError(e.message);
      } finally {
        if (active) setLoading(false);
      }
    })();
    return () => { active = false; };
  }, [token]);

  // Unique property types for filter dropdown
  const propertyTypes = useMemo(() => {
    const types = new Set(properties.map(p => p.type));
    return Array.from(types);
  }, [properties]);

  // Filter, sort, and paginate properties
  const filteredProperties = useMemo(() => {
    let result = properties.filter(property => {
    const matchesSearch = property.name.toLowerCase().includes(searchTerm.toLowerCase()) || property.location.toLowerCase().includes(searchTerm.toLowerCase());
      const matchesType = typeFilter === 'all' || property.type === typeFilter;
      return matchesSearch && matchesType;
    });
    result = result.sort((a, b) => {
      let aVal: any, bVal: any;
      if (sortBy === 'floors') {
        aVal = a.floors.length;
        bVal = b.floors.length;
      } else {
        aVal = a[sortBy].toString().toLowerCase();
        bVal = b[sortBy].toString().toLowerCase();
      }
      if (aVal < bVal) return sortDir === 'asc' ? -1 : 1;
      if (aVal > bVal) return sortDir === 'asc' ? 1 : -1;
      return 0;
    });
    return result;
  }, [properties, searchTerm, typeFilter, sortBy, sortDir]);

  const totalPages = Math.ceil(filteredProperties.length / pageSize);
  const paginatedProperties = filteredProperties.slice((page - 1) * pageSize, page * pageSize);

  // Drill-down handlers (must be defined before columns)
  const openProperty = (property: Property) => {
    setDrillProperty(property);
    setDrillFloor(null);
    setDrillUnit(null);
  };
  const openEditModal = (property: Property, idx: number) => {
    setEditPropertyIdx(idx);
    setEditProperty({ ...property });
    setEditFloors(property.floors.map(f => ({ name: f.name })));
    const unitsObj: { [floorIdx: number]: any[] } = {};
    property.floors.forEach((floor, i) => {
      unitsObj[i] = floor.units.map(u => ({ type: u.type, number: u.number }));
    });
    setEditUnits(unitsObj);
    setEditError('');
    setEditModalOpen(true);
  };
  const openFloor = (floor: Floor) => {
    setDrillFloor(floor);
    setDrillUnit(null);
  };
  const openUnit = (unit: Unit) => {
    setDrillUnit(unit);
  };
  const closeDrill = () => {
    setDrillProperty(null);
    setDrillFloor(null);
    setDrillUnit(null);
  };

  // Place this above columns definition
  const handleDelete = (id: number) => {
    setDeleteId(id);
  };

  const performDelete = async () => {
    if (!deleteId) return;
    try {
      const res = await fetch(`/api/properties/${deleteId}`, { method: 'DELETE', headers: { Authorization: `Bearer ${token}` } });
      if (!res.ok && res.status !== 204) {
        const msg = await res.text();
        throw new Error(msg || 'Failed to delete');
      }
      setProperties(props => props.filter(p => p.id !== deleteId));
      setDeleteId(null);
    } catch (e: any) {
      setError(e.message);
    }
  };

  // Table columns definition for TanStack Table
  const columns = useMemo<ColumnDef<Property>[]>(() => [
    {
      header: 'Image',
      accessorKey: 'image',
      cell: info => <img src={info.getValue() as string} alt="property" className="w-16 h-12 object-cover rounded-md border border-green-100 shadow-sm" />,
      enableSorting: false,
    },
    {
      header: 'Name',
      accessorKey: 'name',
      cell: info => <span className="font-semibold text-gray-800">{info.getValue() as string}</span>,
    },
    {
      header: 'Location',
      accessorKey: 'location',
      cell: info => <span className="text-gray-600">{info.getValue() as string}</span>,
    },
    {
      header: 'Type',
      accessorKey: 'type',
      cell: info => <span className="text-gray-600">{info.getValue() as string}</span>,
    },
    {
      header: 'Floors',
      accessorKey: 'floors',
      cell: info => <span className="text-gray-600">{(info.row.original.floors.length)}</span>,
      sortingFn: (a, b) => a.original.floors.length - b.original.floors.length,
    },
    {
      header: 'Units',
      id: 'units',
      cell: info => {
        const totalUnits = info.row.original.floors.reduce((sum, floor) => sum + floor.units.length, 0);
        return <span className="text-gray-600">{totalUnits}</span>;
      },
      sortingFn: (a, b) => {
        const aUnits = a.original.floors.reduce((sum, floor) => sum + floor.units.length, 0);
        const bUnits = b.original.floors.reduce((sum, floor) => sum + floor.units.length, 0);
        return aUnits - bUnits;
      },
    },
    {
      header: 'Vacant Units',
      id: 'vacantUnits',
      cell: info => {
        const vacant = info.row.original.floors.reduce((sum, floor) => sum + floor.units.filter(u => u.status === 'vacant').length, 0);
        return <span className="text-green-700 font-semibold">{vacant}</span>;
      },
      sortingFn: (a, b) => {
        const aVacant = a.original.floors.reduce((sum, floor) => sum + floor.units.filter(u => u.status === 'vacant').length, 0);
        const bVacant = b.original.floors.reduce((sum, floor) => sum + floor.units.filter(u => u.status === 'vacant').length, 0);
        return aVacant - bVacant;
      },
    },
    {
      header: 'Occupied Units',
      id: 'occupiedUnits',
      cell: info => {
        const occupied = info.row.original.floors.reduce((sum, floor) => sum + floor.units.filter(u => u.status === 'occupied').length, 0);
        return <span className="text-blue-700 font-semibold">{occupied}</span>;
      },
      sortingFn: (a, b) => {
        const aOcc = a.original.floors.reduce((sum, floor) => sum + floor.units.filter(u => u.status === 'occupied').length, 0);
        const bOcc = b.original.floors.reduce((sum, floor) => sum + floor.units.filter(u => u.status === 'occupied').length, 0);
        return aOcc - bOcc;
      },
    },
    {
      header: 'Total Rent',
      id: 'totalRent',
      cell: info => {
        const totalRent = info.row.original.floors.reduce((sum, floor) =>
          sum + floor.units.reduce((uSum, unit) => uSum + (unit.rent || 0), 0)
        , 0);
        return <span className="text-purple-700 font-semibold">KES {totalRent.toLocaleString()}</span>;
      },
      sortingFn: (a, b) => {
        const aRent = a.original.floors.reduce((sum, floor) => sum + floor.units.reduce((uSum, unit) => uSum + (unit.rent || 0), 0), 0);
        const bRent = b.original.floors.reduce((sum, floor) => sum + floor.units.reduce((uSum, unit) => uSum + (unit.rent || 0), 0), 0);
        return aRent - bRent;
      },
    },
    {
      header: 'Actions',
      id: 'actions',
      cell: info => {
        const property = info.row.original;
        const totalUnits = property.floors.reduce((sum, floor) => sum + floor.units.length, 0);
        return (
          <div className="flex gap-2">
            <button className="p-2 rounded-lg hover:bg-green-100 transition-colors flex items-center gap-1 text-green-700 font-semibold shadow-sm" title="View" onClick={e => { e.stopPropagation(); openProperty(property); }}>
              <EyeIcon size={16} /> View
            </button>
            <button className="p-2 rounded-lg hover:bg-blue-100 transition-colors flex items-center gap-1 text-blue-700 font-semibold shadow-sm" title="Edit" onClick={e => { e.stopPropagation(); openEditModal(property, info.row.index); }}>
              <PencilIcon size={16} /> Edit
            </button>
            <button className="p-2 rounded-lg hover:bg-red-100 transition-colors flex items-center gap-1 text-red-700 font-semibold shadow-sm" title="Delete" onClick={e => { e.stopPropagation(); handleDelete(property.id); }}>
              <Trash2Icon size={16} /> Delete
            </button>
          </div>
        );
      },
      enableSorting: false,
    },
  ], [openProperty, openEditModal, handleDelete]);

  // Prepare data for TanStack Table (filtered, sorted, paginated)
  const tableData = useMemo(() => filteredProperties, [filteredProperties]);

  const table = useReactTable({
    data: tableData,
    columns,
    state: {
      sorting: [{ id: sortBy, desc: sortDir === 'desc' }],
      pagination: { pageIndex: page - 1, pageSize },
    },
    getCoreRowModel: getCoreRowModel(),
    getSortedRowModel: getSortedRowModel(),
    getPaginationRowModel: getPaginationRowModel(),
    manualPagination: false,
    manualSorting: false,
    onSortingChange: updater => {
      if (Array.isArray(updater) && updater.length > 0) {
        setSortBy(updater[0].id as any);
        setSortDir(updater[0].desc ? 'desc' : 'asc');
      }
    },
    onPaginationChange: updater => {
      if (typeof updater === 'function') return;
      setPage((updater.pageIndex ?? 0) + 1);
    },
    pageCount: totalPages,
  });

  const handleSort = (col: 'name' | 'location' | 'type' | 'floors') => {
    if (sortBy === col) {
      setSortDir(sortDir === 'asc' ? 'desc' : 'asc');
    } else {
      setSortBy(col);
      setSortDir('asc');
    }
  };

  const statusIcons = {
    vacant: <CheckCircle2Icon size={16} className="text-green-500 mr-1" />,
    occupied: <HomeIcon size={16} className="text-blue-500 mr-1" />,
    maintenance: <WrenchIcon size={16} className="text-orange-500 mr-1" />,
  };
  const statusClasses = {
    vacant: 'bg-green-50 text-green-700',
    occupied: 'bg-blue-50 text-blue-700',
    maintenance: 'bg-orange-50 text-orange-700',
  };

  // Handlers
  const handleView = (property: Property) => {
    setSelected(property);
    setModalType('view');
  };
  const handleEdit = (property: Property) => {
    setSelected(property);
    setModalType('edit');
  };
  const confirmDelete = () => {
    setProperties(props => props.filter(p => p.id !== deleteId));
    setDeleteId(null);
  };
  // Remove the old handleEditSubmit function after confirmDelete:
  // const handleEditSubmit = (e: React.FormEvent) => {
  //   e.preventDefault();
  //   if (!editProperty.name || !editProperty.location || !editProperty.type || editFloors.length === 0) {
  //     setEditError('Please fill all required fields and add at least one floor.');
  //     return;
  //   }
  //   // Build floors/units structure
  //   const floors: Floor[] = editFloors.map((floor, idx) => ({
  //     id: Date.now() + idx,
  //     name: floor.name,
  //     units: (editUnits[idx] || []).map((unit, uidx) => ({
  //       id: Date.now() + idx * 100 + uidx,
  //       type: unit.type,
  //       number: unit.number,
  //       status: 'vacant', // always vacant by default
  //     })),
  //   }));
  //   const updatedProperty: Property = {
  //     ...editProperty,
  //     floors,
  //   };
  //   setProperties(props => props.map((p, i) => (i === editPropertyIdx ? updatedProperty : p)));
  //   resetEditModal();
  // };

  // Add property modal handlers
  const resetAddModal = () => {
    setAddModalOpen(false);
    setNewProperty({ name: '', location: '', type: '', image: '', floors: [] });
    setNewFloors([]);
    setNewUnits({});
    setAddError('');
  };
  // Remove handleAddPropertyDetails, all validation is in handleAddSubmit
  const handleAddFloor = () => {
    setNewFloors([
      ...newFloors,
      { name: newFloors.length === 0 ? 'Ground Floor' : newFloors.length === 1 ? 'First Floor' : `Floor ${newFloors.length}`, units: [] },
    ]);
  };
  const handleRemoveFloor = (idx: number) => {
    setNewFloors(newFloors.filter((_, i) => i !== idx));
    const updatedUnits = { ...newUnits };
    delete updatedUnits[idx];
    setNewUnits(updatedUnits);
  };
  const handleFloorNameChange = (idx: number, name: string) => {
    const updated = [...newFloors];
    updated[idx].name = name;
    setNewFloors(updated);
  };
  const handleAddUnit = (floorIdx: number) => {
    setNewUnits({
      ...newUnits,
      [floorIdx]: [...(newUnits[floorIdx] || []), { type: '', number: '', rent: 0 }], // status omitted
    });
  };
  const handleRemoveUnit = (floorIdx: number, unitIdx: number) => {
    setNewUnits({
      ...newUnits,
      [floorIdx]: (newUnits[floorIdx] || []).filter((_: any, i: number) => i !== unitIdx),
    });
  };
  const handleUnitChange = (floorIdx: number, unitIdx: number, field: string, value: string) => {
    const updated = [...(newUnits[floorIdx] || [])];
    updated[unitIdx][field] = value;
    setNewUnits({ ...newUnits, [floorIdx]: updated });
  };
  const handleAddSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newProperty.name || !newProperty.location || !newProperty.type || newFloors.length === 0) {
      setAddError('Please fill all required fields and add at least one floor.');
      return;
    }
    try {
      const payload = {
      name: newProperty.name,
      location: newProperty.location,
      type: newProperty.type,
      image: newProperty.image,
        floors: newFloors.map((floor, idx) => ({
          name: floor.name,
          units: (newUnits[idx] || []).map(u => ({ number: u.number, type: u.type, rent: Number(u.rent) || 0, status: 'vacant' })),
        })),
      };
      const res = await fetch('/api/properties', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify(payload),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data?.message || 'Failed to create property');
      setAddModalOpen(false);
      setNewProperty({ name: '', location: 'Nairobi', type: '', image: '', floors: [] });
      setNewFloors([]);
      setNewUnits({});
      setAddError('');
      const refRes = await fetch('/api/properties', { headers: { Authorization: `Bearer ${token}`, Accept: 'application/json' } });
      const refData = await refRes.json();
      const mapped: Property[] = (refData.properties || []).map((p: any) => ({
        id: p.id,
        name: p.name,
        image: p.image || '',
        location: p.location,
        type: p.type,
        floors: (p.floors || []).map((f: any) => ({ id: f.id, name: f.name, units: (f.units || []).map((u: any) => ({ id: u.id, type: u.type, number: u.number, status: u.status, rent: u.rent ?? 0 })) })),
      }));
      setProperties(mapped);
    } catch (err: any) {
      setAddError(err.message);
    }
  };

  // Edit property modal handlers
  const resetEditModal = () => {
    setEditModalOpen(false);
    setEditPropertyIdx(null);
    setEditProperty(null);
    setEditFloors([]);
    setEditUnits({});
    setEditError('');
  };
  // Remove handleEditPropertyDetails, all validation is in handleEditSubmit
  const handleEditAddFloor = () => {
    setEditFloors([...editFloors, { name: '', units: [] }]);
  };
  const handleEditRemoveFloor = (idx: number) => {
    setEditFloors(editFloors.filter((_, i) => i !== idx));
    const updatedUnits = { ...editUnits };
    delete updatedUnits[idx];
    setEditUnits(updatedUnits);
  };
  const handleEditFloorNameChange = (idx: number, name: string) => {
    const updated = [...editFloors];
    updated[idx].name = name;
    setEditFloors(updated);
  };
  const handleEditAddUnit = (floorIdx: number) => {
    setEditUnits({
      ...editUnits,
      [floorIdx]: [...(editUnits[floorIdx] || []), { type: '', number: '', rent: 0 }],
    });
  };
  const handleEditRemoveUnit = (floorIdx: number, unitIdx: number) => {
    setEditUnits({
      ...editUnits,
      [floorIdx]: (editUnits[floorIdx] || []).filter((_: any, i: number) => i !== unitIdx),
    });
  };
  const handleEditUnitChange = (floorIdx: number, unitIdx: number, field: string, value: string) => {
    const updated = [...(editUnits[floorIdx] || [])];
    updated[unitIdx][field] = value;
    setEditUnits({ ...editUnits, [floorIdx]: updated });
  };
  const handleEditSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!editProperty.name || !editProperty.location || !editProperty.type || editFloors.length === 0) {
      setEditError('Please fill all required fields and add at least one floor.');
      return;
    }
    (async () => {
      try {
        const payload = {
          name: editProperty.name,
          location: editProperty.location,
          type: editProperty.type,
          image: editProperty.image,
          floors: editFloors.map((floor, idx) => ({
            name: floor.name,
            units: (editUnits[idx] || []).map((u: any) => ({ number: u.number, type: u.type, rent: Number(u.rent) || 0, status: 'vacant' })),
          })),
        };
        const res = await fetch(`/api/properties/${editProperty.id}`, {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
          body: JSON.stringify(payload),
        });
        const data = await res.json();
        if (!res.ok) throw new Error(data?.message || 'Failed to update property');
        // Refresh list
        const refRes = await fetch('/api/properties', { headers: { Authorization: `Bearer ${token}`, Accept: 'application/json' } });
        const refData = await refRes.json();
        const mapped: Property[] = (refData.properties || []).map((p: any) => ({
          id: p.id,
          name: p.name,
          image: p.image || '',
          location: p.location,
          type: p.type,
          floors: (p.floors || []).map((f: any) => ({ id: f.id, name: f.name, units: (f.units || []).map((u: any) => ({ id: u.id, type: u.type, number: u.number, status: u.status, rent: u.rent ?? 0 })) })),
        }));
        setProperties(mapped);
        resetEditModal();
      } catch (err: any) {
        setEditError(err.message);
      }
    })();
  };

  const unitTypeOptions = [
    { value: 'studio', label: 'Studio', icon: DoorOpenIcon },
    { value: 'bedsitter', label: 'Bedsitter', icon: User2Icon },
    { value: 'one bedroom', label: 'One Bedroom', icon: BedIcon },
    { value: 'two bedroom', label: 'Two Bedroom', icon: BedIcon },
    { value: 'three bedroom', label: 'Three Bedroom', icon: BedIcon },
    { value: 'four bedroom', label: 'Four Bedroom', icon: BedIcon },
  ];

  return (
    <div>
      {loading && <div className="mb-4 text-gray-500">Loading properties...</div>}
      {error && <div className="mb-4 text-red-600">{error}</div>}
      {/* Modals */}
      <Modal open={modalType === 'view'} onClose={() => setModalType(null)} title="Property Details">
        {selected && (
          <div className="space-y-2">
            <img src={selected.image} alt={selected.name} className="w-full h-40 object-cover rounded-lg mb-2" />
            <div><span className="font-semibold">Name:</span> {selected.name}</div>
            <div><span className="font-semibold">Location:</span> {selected.location}</div>
            <div><span className="font-semibold">Type:</span> {selected.type}</div>
            <div><span className="font-semibold">Floors:</span> {selected.floors.length}</div>
          </div>
        )}
      </Modal>
      {/* Delete Property Modal */}
      <Modal open={!!deleteId} onClose={() => setDeleteId(null)} title="Delete Property?">
        {(() => {
          const property = properties.find(p => p.id === deleteId);
          if (!property) return null;
          const totalUnits = property.floors.reduce((sum, floor) => sum + floor.units.length, 0);
          return (
            <>
              {totalUnits > 1 && (
                <div className="mb-4 text-red-600 font-semibold">
                  Warning: This property has more than one unit. Deleting it will remove all associated units and their data.
                </div>
              )}
              <div className="mb-4">Are you sure you want to delete this property? This action cannot be undone.</div>
              <div className="flex justify-end gap-2">
                <button onClick={() => setDeleteId(null)} className="px-4 py-2 rounded-lg bg-gray-100 hover:bg-gray-200">Cancel</button>
                <button onClick={performDelete} className="px-4 py-2 rounded-lg bg-red-600 text-white hover:bg-red-700">Delete</button>
              </div>
            </>
          );
        })()}
      </Modal>
      {/* Drill-down Modal */}
      <Modal open={!!drillProperty} onClose={closeDrill} title={drillUnit ? `Unit ${drillUnit.number} Details` : drillFloor ? `${drillFloor.name} Units` : drillProperty ? drillProperty.name : ''}>
        {drillProperty && !drillFloor && !drillUnit && (
          <div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 items-start">
              <img src={drillProperty.image} alt={drillProperty.name} className="w-full h-44 object-cover rounded-2xl shadow-lg col-span-1 border border-green-100" />
              <div className="col-span-1 flex flex-col gap-3">
                <div className="flex items-center gap-2 text-green-700 text-lg font-bold tracking-wide">
                  <BuildingIcon size={22} className="mr-1" /> {drillProperty.name}
                </div>
                <div className="text-base font-semibold text-gray-800 flex items-center gap-2 mt-2"><LayersIcon size={18} className="text-green-500" /> Floors</div>
                <ul className="space-y-2 mt-3">
                  {drillProperty.floors.map(floor => (
                    <li key={floor.id}>
                      <button onClick={() => openFloor(floor)} className="w-full flex items-center gap-2 text-left px-5 py-3 rounded-2xl bg-green-50 hover:bg-green-200 font-semibold text-green-900 transition group shadow group-hover:shadow-lg text-base tracking-wide border border-green-100">
                        <LayersIcon size={18} className="text-green-400 group-hover:scale-110 transition-transform" />
                        <span className="flex-1">{floor.name}</span>
                        <span className="text-xs text-gray-500">{floor.units.length} units</span>
                      </button>
                    </li>
                  ))}
                </ul>
              </div>
            </div>
          </div>
        )}
        {drillProperty && drillFloor && !drillUnit && (
          <div>
            <button onClick={() => setDrillFloor(null)} className="mb-3 flex items-center gap-1 text-green-700 hover:underline hover:text-green-900 font-medium"><ArrowLeftIcon size={16} /> Back to Floors</button>
            <div className="mb-2 text-base font-semibold text-gray-800 flex items-center gap-2"><DoorOpenIcon size={18} className="text-green-500" /> Units in {drillFloor.name}</div>
            <table className="min-w-full text-sm rounded-xl overflow-hidden font-sans mt-2">
              <thead>
                <tr className="bg-green-50 sticky top-0 z-10 shadow-md rounded-t-xl">
                  <th className="py-2 pr-4 text-left font-bold text-green-700 text-base">Number</th>
                  <th className="py-2 pr-4 text-left font-bold text-green-700 text-base">Type</th>
                  <th className="py-2 pr-4 text-left font-bold text-green-700 text-base">Status</th>
                  <th className="py-2 pr-4 text-left font-bold text-green-700 text-base">Tenant</th>
                  <th className="py-2 pr-4 text-left font-bold text-green-700 text-base">Actions</th>
                </tr>
              </thead>
              <tbody>
                {drillFloor.units.map((unit, idx) => (
                  <tr key={unit.id} className={`transition cursor-pointer group ${idx % 2 === 0 ? 'bg-white' : 'bg-green-50/60'} hover:bg-green-100 hover:shadow-md`}>
                    <td className="py-2 pr-4 font-semibold text-gray-800 flex items-center gap-2"><DoorOpenIcon size={16} className="text-green-400 group-hover:scale-110 transition-transform" />{unit.number}</td>
                    <td className="py-2 pr-4 text-gray-600 capitalize">{unit.type}</td>
                    <td className="py-2 pr-4">
                      <span className={`inline-flex items-center text-xs px-2 py-1 rounded-full font-semibold ${statusClasses[unit.status]}`}>{statusIcons[unit.status]}{unit.status.charAt(0).toUpperCase() + unit.status.slice(1)}</span>
                    </td>
                    <td className="py-2 pr-4 text-gray-600 flex items-center gap-2">{unit.tenant ? (<><User2Icon size={15} className="text-blue-400" />{unit.tenant.name}</>) : <span className="text-xs text-gray-400 flex items-center gap-1"><InfoIcon size={13} />Vacant</span>}</td>
                    <td className="py-2 pr-4">
                      <button className="p-2 rounded-lg hover:bg-green-100 transition-colors flex items-center gap-1 text-green-700 font-semibold shadow-sm" title="View" onClick={() => openUnit(unit)}><EyeIcon size={16} /> View</button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
        {drillProperty && drillFloor && drillUnit && (
          <div>
            <button onClick={() => setDrillUnit(null)} className="mb-3 flex items-center gap-1 text-green-700 hover:underline hover:text-green-900 font-medium"><ArrowLeftIcon size={16} /> Back to Units</button>
            <div className="mb-2 text-base font-semibold text-gray-800 flex items-center gap-2"><DoorOpenIcon size={18} className="text-green-500" /> Unit {drillUnit.number} Details</div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="flex flex-col gap-2 text-base">
                <div className="flex items-center gap-2"><InfoIcon size={15} className="text-green-400" /><span className="font-semibold">Type:</span> <span className="capitalize">{drillUnit.type}</span></div>
                <div className="flex items-center gap-2"><InfoIcon size={15} className="text-green-400" /><span className="font-semibold">Status:</span> <span className={`inline-flex items-center text-xs px-2 py-1 rounded-full font-semibold ${statusClasses[drillUnit.status]}`}>{statusIcons[drillUnit.status]}{drillUnit.status.charAt(0).toUpperCase() + drillUnit.status.slice(1)}</span></div>
              </div>
              {drillUnit.tenant ? (
                <div className="p-4 rounded-2xl bg-green-50 border border-green-100 shadow flex flex-col gap-1 text-base">
                  <div className="font-bold mb-1 flex items-center gap-2 text-green-700 text-lg"><User2Icon size={18} /> Tenant Info</div>
                  <div><span className="font-semibold">Name:</span> {drillUnit.tenant.name}</div>
                  <div><span className="font-semibold">Phone:</span> {drillUnit.tenant.phone}</div>
                  <div><span className="font-semibold">Email:</span> {drillUnit.tenant.email}</div>
                  <div><span className="font-semibold">Move In:</span> {drillUnit.tenant.moveInDate}</div>
                  <div><span className="font-semibold">Lease End:</span> {drillUnit.tenant.leaseEnd}</div>
                  <div><span className="font-semibold">Rent:</span> KES {drillUnit.tenant.rent != null ? drillUnit.tenant.rent.toLocaleString() : '-'}</div>
                </div>
              ) : (
                <div className="mt-2 text-sm text-gray-500 flex items-center gap-2"><InfoIcon size={13} /> No tenant assigned (Vacant)</div>
              )}
            </div>
          </div>
        )}
      </Modal>
      {/* Add Property Modal */}
      <Modal open={addModalOpen} onClose={resetAddModal} title="Add Property">
        <form onSubmit={handleAddSubmit} className="space-y-6">
          <div className="text-lg font-bold text-green-800 mb-2">Property Details</div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <label className="block text-sm font-semibold mb-1">Property Name *</label>
              <input className="w-full border rounded-lg px-3 py-2" value={newProperty.name} onChange={e => setNewProperty({ ...newProperty, name: e.target.value })} required />
            </div>
            <div>
              <label className="block text-sm font-semibold mb-1">Location *</label>
              <input className="w-full border rounded-lg px-3 py-2" value={newProperty.location} onChange={e => setNewProperty({ ...newProperty, location: e.target.value })} required />
            </div>
            <div>
              <label className="block text-sm font-semibold mb-1">Type *</label>
              <select className="w-full border rounded-lg px-3 py-2" value={newProperty.type} onChange={e => setNewProperty({ ...newProperty, type: e.target.value })} required>
                <option value="">Select type</option>
                <option value="Apartment">Apartment</option>
                <option value="Townhouse">Townhouse</option>
                <option value="Villa">Villa</option>
                <option value="House">House</option>
                <option value="Cottage">Cottage</option>
              </select>
            </div>
            <div>
              <label className="block text-sm font-semibold mb-1">Image URL</label>
              <input className="w-full border rounded-lg px-3 py-2" value={newProperty.image} onChange={e => setNewProperty({ ...newProperty, image: e.target.value })} />
            </div>
          </div>
          <div className="text-lg font-bold text-green-800 mt-6 mb-2">Floors</div>
          <div>
            <div className="flex justify-between items-center mb-2">
              <div className="text-lg font-semibold text-green-700">Floors</div>
              <button type="button" className="px-3 py-1 rounded-lg bg-green-700 text-white hover:bg-green-800" onClick={handleAddFloor}>+ Add Floor</button>
            </div>
            <div className="space-y-4">
              {newFloors.map((floor, idx) => (
                <div key={idx} className="bg-green-50 rounded-xl p-4 border border-green-100">
                  <div className="flex items-center gap-2 mb-2">
                    <label className="block text-sm font-semibold">Floor Name *</label>
                    <input className="border rounded-lg px-3 py-2 flex-1" value={floor.name} onChange={e => handleFloorNameChange(idx, e.target.value)} required />
                    <button type="button" className="ml-2 text-red-600 hover:text-red-800 font-bold" onClick={() => handleRemoveFloor(idx)}>&times;</button>
                  </div>
                  <div className="text-base font-semibold text-green-700 mb-1 mt-2">Units</div>
                  <div className="flex justify-between items-center mb-1">
                    <div className="text-sm font-semibold text-green-700">Units</div>
                    <button type="button" className="px-2 py-1 rounded-lg bg-green-200 text-green-900 hover:bg-green-300" onClick={() => handleAddUnit(idx)}>+ Add Unit</button>
                  </div>
                  <div className="space-y-2">
                    {(newUnits[idx] || []).map((unit, uidx) => (
                      <div key={uidx} className="flex gap-2 items-center">
                        <label className="block text-xs font-semibold text-gray-700">Unit Name</label>
                        <div className="w-44">
                          <Listbox value={unit.type} onChange={val => handleUnitChange(idx, uidx, 'type', val)}>
                            <div className="relative">
                              <Listbox.Button className="relative w-full border rounded-lg px-2 py-1 capitalize flex items-center justify-between bg-white text-left cursor-pointer">
                                <span className="flex items-center gap-2">
                                  {unitTypeOptions.find(opt => opt.value === unit.type)?.icon &&
                                    React.createElement(unitTypeOptions.find(opt => opt.value === unit.type)!.icon, { size: 18, className: 'text-green-500' })}
                                  {unitTypeOptions.find(opt => opt.value === unit.type)?.label || 'Type'}
                                </span>
                                <span className="ml-2 text-gray-400">▼</span>
                              </Listbox.Button>
                              <Listbox.Options className="absolute z-10 mt-1 w-full bg-white border border-green-100 rounded-lg shadow-lg max-h-60 overflow-auto focus:outline-none">
                                {unitTypeOptions.map(opt => (
                                  <Listbox.Option
                                    key={opt.value}
                                    value={opt.value}
                                    className={({ active, selected }) =>
                                      `flex items-center gap-2 px-3 py-2 capitalize cursor-pointer ${active ? 'bg-green-100 text-green-900' : ''} ${selected ? 'font-bold' : ''}`
                                    }
                                  >
                                    {React.createElement(opt.icon, { size: 18, className: 'text-green-500' })}
                                    {opt.label}
                                  </Listbox.Option>
                                ))}
                              </Listbox.Options>
                            </div>
                          </Listbox>
                        </div>
                        <input className="border rounded-lg px-2 py-1 w-32" placeholder="Unit Name" value={unit.number} onChange={e => handleUnitChange(idx, uidx, 'number', e.target.value)} required />
                        <input className="border rounded-lg px-2 py-1 w-24" type="number" min="0" placeholder="Rent" value={unit.rent || ''} onChange={e => handleUnitChange(idx, uidx, 'rent', e.target.value)} required />
                        {/* Status is always 'vacant' by default; no dropdown */}
                        <button type="button" className="ml-2 text-red-600 hover:text-red-800 font-bold" onClick={() => handleRemoveUnit(idx, uidx)}>&times;</button>
                      </div>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          </div>
          {addError && <div className="text-red-600 font-semibold text-sm">{addError}</div>}
          <div className="flex justify-end mt-6">
            <button type="submit" className="px-4 py-2 rounded-lg bg-green-700 text-white hover:bg-green-800">Add Property</button>
          </div>
        </form>
      </Modal>
      {/* Edit Property Modal */}
      <Modal open={editModalOpen} onClose={resetEditModal} title="Edit Property">
        <form onSubmit={handleEditSubmit} className="space-y-6">
          <div className="text-lg font-bold text-green-800 mb-2">Property Details</div>
          {editProperty && (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label className="block text-sm font-semibold mb-1">Property Name *</label>
                <input className="w-full border rounded-lg px-3 py-2" value={editProperty.name} onChange={e => setEditProperty({ ...editProperty, name: e.target.value })} required />
              </div>
              <div>
                <label className="block text-sm font-semibold mb-1">Location *</label>
                <input className="w-full border rounded-lg px-3 py-2" value={editProperty.location} onChange={e => setEditProperty({ ...editProperty, location: e.target.value })} required />
              </div>
              <div>
                <label className="block text-sm font-semibold mb-1">Type *</label>
                <select className="w-full border rounded-lg px-3 py-2" value={editProperty.type} onChange={e => setEditProperty({ ...editProperty, type: e.target.value })} required>
                  <option value="">Select type</option>
                  <option value="Apartment">Apartment</option>
                  <option value="Townhouse">Townhouse</option>
                  <option value="Villa">Villa</option>
                  <option value="House">House</option>
                  <option value="Cottage">Cottage</option>
                </select>
              </div>
              <div>
                <label className="block text-sm font-semibold mb-1">Image URL</label>
                <input className="w-full border rounded-lg px-3 py-2" value={editProperty.image} onChange={e => setEditProperty({ ...editProperty, image: e.target.value })} />
              </div>
            </div>
          )}
          <div className="text-lg font-bold text-green-800 mt-6 mb-2">Floors</div>
          <div>
            <div className="flex justify-between items-center mb-2">
              <div className="text-lg font-semibold text-green-700">Floors</div>
              <button type="button" className="px-3 py-1 rounded-lg bg-green-700 text-white hover:bg-green-800" onClick={handleEditAddFloor}>+ Add Floor</button>
            </div>
            <div className="space-y-4">
              {editFloors.map((floor, idx) => (
                <div key={idx} className="bg-green-50 rounded-xl p-4 border border-green-100">
                  <div className="flex items-center gap-2 mb-2">
                    <label className="block text-sm font-semibold">Floor Name *</label>
                    <input className="border rounded-lg px-3 py-2 flex-1" value={floor.name} onChange={e => handleEditFloorNameChange(idx, e.target.value)} required />
                    <button type="button" className="ml-2 text-red-600 hover:text-red-800 font-bold" onClick={() => handleEditRemoveFloor(idx)}>&times;</button>
                  </div>
                  <div className="text-base font-semibold text-green-700 mb-1 mt-2">Units</div>
                  <div className="flex justify-between items-center mb-1">
                    <div className="text-sm font-semibold text-green-700">Units</div>
                    <button type="button" className="px-2 py-1 rounded-lg bg-green-200 text-green-900 hover:bg-green-300" onClick={() => handleEditAddUnit(idx)}>+ Add Unit</button>
                  </div>
                  <div className="space-y-2">
                    {(editUnits[idx] || []).map((unit, uidx) => (
                      <div key={uidx} className="flex gap-2 items-center">
                        <label className="block text-xs font-semibold text-gray-700">Unit Name</label>
                        <div className="w-44">
                          <Listbox value={unit.type} onChange={val => handleEditUnitChange(idx, uidx, 'type', val)}>
                            <div className="relative">
                              <Listbox.Button className="relative w-full border rounded-lg px-2 py-1 capitalize flex items-center justify-between bg-white text-left cursor-pointer">
                                <span className="flex items-center gap-2">
                                  {unitTypeOptions.find(opt => opt.value === unit.type)?.icon &&
                                    React.createElement(unitTypeOptions.find(opt => opt.value === unit.type)!.icon, { size: 18, className: 'text-green-500' })}
                                  {unitTypeOptions.find(opt => opt.value === unit.type)?.label || 'Type'}
                                </span>
                                <span className="ml-2 text-gray-400">▼</span>
                              </Listbox.Button>
                              <Listbox.Options className="absolute z-10 mt-1 w-full bg-white border border-green-100 rounded-lg shadow-lg max-h-60 overflow-auto focus:outline-none">
                                {unitTypeOptions.map(opt => (
                                  <Listbox.Option
                                    key={opt.value}
                                    value={opt.value}
                                    className={({ active, selected }) =>
                                      `flex items-center gap-2 px-3 py-2 capitalize cursor-pointer ${active ? 'bg-green-100 text-green-900' : ''} ${selected ? 'font-bold' : ''}`
                                    }
                                  >
                                    {React.createElement(opt.icon, { size: 18, className: 'text-green-500' })}
                                    {opt.label}
                                  </Listbox.Option>
                                ))}
                              </Listbox.Options>
                            </div>
                          </Listbox>
                        </div>
                        <input className="border rounded-lg px-2 py-1 w-32" placeholder="Unit Name" value={unit.number} onChange={e => handleEditUnitChange(idx, uidx, 'number', e.target.value)} required />
                        <input className="border rounded-lg px-2 py-1 w-24" type="number" min="0" placeholder="Rent" value={unit.rent || ''} onChange={e => handleEditUnitChange(idx, uidx, 'rent', e.target.value)} required />
                        {/* Status is always 'vacant' by default; no dropdown */}
                        <button type="button" className="ml-2 text-red-600 hover:text-red-800 font-bold" onClick={() => handleEditRemoveUnit(idx, uidx)}>&times;</button>
                      </div>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          </div>
          {editError && <div className="text-red-600 font-semibold text-sm">{editError}</div>}
          <div className="flex justify-end mt-6">
            <button type="submit" className="px-4 py-2 rounded-lg bg-green-700 text-white hover:bg-green-800">Save Changes</button>
          </div>
        </form>
      </Modal>
      {/* Main content: List of properties */}
      <div className="flex flex-col md:flex-row md:items-center justify-between mb-6 gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-800">Properties</h1>
          <p className="text-gray-600">Manage your rental properties</p>
        </div>
        <div className="flex flex-col md:flex-row gap-2 md:items-center">
          <div className="flex items-center gap-2">
            <span className="text-sm text-gray-600">Type:</span>
            <select className="border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-transparent" value={typeFilter} onChange={e => { setTypeFilter(e.target.value); setPage(1); }}>
              <option value="all">All</option>
              {propertyTypes.map(type => <option key={type} value={type}>{type}</option>)}
            </select>
      </div>
          <div className="relative flex-1">
            <SearchIcon size={18} className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
            <input type="text" placeholder="Search properties..." className="pl-10 pr-4 py-2 border border-gray-300 rounded-lg w-full focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-transparent" value={searchTerm} onChange={e => { setSearchTerm(e.target.value); setPage(1); }} />
          </div>
          <button className="bg-green-700 hover:bg-green-800 text-white py-2 px-4 rounded-lg flex items-center shadow self-start md:self-auto" onClick={() => {
            setAddModalOpen(true);
            if (newFloors.length === 0) {
              setNewFloors([{ name: 'Ground Floor', units: [] }]);
              setNewUnits({ 0: [{ type: 'one bedroom', number: 'G1', rent: 45000 }] });
            }
            if (!newProperty.location) setNewProperty({ ...newProperty, location: 'Nairobi' });
          }}>
            <PlusIcon size={18} className="mr-2" />
            Add Property
          </button>
        </div>
      </div>
      {/* Main property list table: */}
      <div className="bg-white rounded-2xl shadow-lg border border-green-100 overflow-x-auto mt-4">
        <table className="min-w-full text-sm rounded-2xl overflow-hidden font-sans">
          <thead>
            {table.getHeaderGroups().map(headerGroup => (
              <tr key={headerGroup.id} className="sticky top-0 z-10 bg-green-50/90 backdrop-blur rounded-t-2xl shadow-md">
                {headerGroup.headers.map(header => (
                  <th
                    key={header.id}
                    className={
                      'py-3 pr-4 pl-4 text-left font-bold text-green-700 text-base cursor-pointer select-none' +
                      (header.column.getCanSort() ? ' hover:underline' : '')
                    }
                    onClick={header.column.getCanSort() ? header.column.getToggleSortingHandler() : undefined}
                  >
                    {flexRender(header.column.columnDef.header, header.getContext())}
                    {header.column.getIsSorted() ? (
                      header.column.getIsSorted() === 'asc' ? ' ▲' : ' ▼'
                    ) : null}
                  </th>
                ))}
              </tr>
            ))}
          </thead>
          <tbody>
            {table.getRowModel().rows.map((row, idx) => (
              <tr
                key={row.id}
                className={`border-b last:border-0 transition-all duration-200 cursor-pointer ${idx % 2 === 0 ? 'bg-white' : 'bg-green-50/60'} hover:bg-green-100 hover:shadow-lg hover:scale-[1.01]'}`}
                style={{ boxShadow: '0 1px 4px 0 rgba(34,197,94,0.06)' }}
                onClick={() => openProperty(row.original)}
              >
                {row.getVisibleCells().map(cell => (
                  <td key={cell.id} className="py-3 pr-4 pl-4">
                    {flexRender(cell.column.columnDef.cell, cell.getContext())}
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
        {/* Pagination controls */}
        <div className="flex justify-between items-center p-4">
          <span className="text-sm text-gray-600">Page {page} of {totalPages}</span>
          <div className="flex gap-2">
            <button disabled={page === 1} onClick={() => setPage(page - 1)} className="px-3 py-1 rounded-lg border border-gray-300 bg-white hover:bg-green-50 disabled:opacity-50">Prev</button>
            {Array.from({ length: totalPages }, (_, i) => (
              <button key={i+1} onClick={() => setPage(i+1)} className={`px-3 py-1 rounded-lg border ${page === i+1 ? 'bg-green-700 text-white border-green-700' : 'bg-white hover:bg-green-50 border-gray-300'} transition-all`}>{i+1}</button>
            ))}
            <button disabled={page === totalPages} onClick={() => setPage(page + 1)} className="px-3 py-1 rounded-lg border border-gray-300 bg-white hover:bg-green-50 disabled:opacity-50">Next</button>
          </div>
        </div>
      </div>
    </div>
  );
};
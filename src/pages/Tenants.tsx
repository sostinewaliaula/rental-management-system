import React, { useState, useMemo, useRef, useEffect, useCallback } from 'react';
import { ColumnDef, getCoreRowModel, getSortedRowModel, getPaginationRowModel, flexRender, useReactTable } from '@tanstack/react-table';
import { PlusIcon, SearchIcon, FilterIcon, EyeIcon, PencilIcon, Trash2Icon, User2Icon, HomeIcon, CalendarIcon, MailIcon, PhoneIcon, CheckCircle2Icon, AlertCircleIcon, ArrowLeftIcon, KeyIcon } from 'lucide-react';
import { Listbox } from '@headlessui/react';
import { useAuth } from '../auth/AuthContext';

// Modal component (copied/adapted from Properties)
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
      <div className="bg-gradient-to-br from-green-50 via-white to-green-100 rounded-3xl shadow-2xl p-6 w-[90vw] min-h-[40vh] max-h-[80vh] max-w-2xl relative animate-fadeIn flex flex-col gap-2 overflow-y-auto border border-green-100">
        <button
          type="button"
          onClick={onClose}
          className="absolute top-6 right-8 bg-gray-200 hover:bg-gray-300 text-gray-800 px-3 py-1 rounded transition-all cursor-pointer z-10"
          aria-label="Close tenant modal"
        >
          Close
        </button>
        <h2 className="text-2xl font-extrabold mb-6 text-green-800 text-center tracking-wide leading-tight drop-shadow-sm font-sans">{title}</h2>
        <div className="w-full flex flex-col gap-6 text-base text-gray-800 font-sans">
          {children}
        </div>
      </div>
    </div>
  );
};

type TenantStatus = 'active' | 'late' | 'ending';
type Tenant = {
  id: number;
  name: string;
  phone: string;
  email: string;
  property: string;
  unitId: number | null;
  moveInDate: string;
  leaseEnd: string;
  rent: number;
  status: TenantStatus;
};

export const Tenants = () => {
  const { token } = useAuth();
  // State
  const [tenants, setTenants] = useState<Tenant[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterStatus, setFilterStatus] = useState('all');
  const [sortBy, setSortBy] = useState<'name' | 'property' | 'rent' | 'status'>('name');
  const [sortDir, setSortDir] = useState<'asc' | 'desc'>('asc');
  const [page, setPage] = useState(1);
  const pageSize = 5;

  // Modal state
  const [viewTenant, setViewTenant] = useState<Tenant | null>(null);
  const [editTenant, setEditTenant] = useState<Tenant | null>(null);
  const [addModalOpen, setAddModalOpen] = useState(false);
  const [deleteTenant, setDeleteTenant] = useState<Tenant | null>(null);
  const [formError, setFormError] = useState('');
  const [showCredentials, setShowCredentials] = useState<{email: string, password: string} | null>(null);
  const [deleteError, setDeleteError] = useState('');

  // Properties/units from API
  const [properties, setProperties] = useState<any[]>([]);
  const [addSelectedUnitId, setAddSelectedUnitId] = useState<number | null>(null);
  const [editSelectedUnitId, setEditSelectedUnitId] = useState<number | null>(null);
  const mapTenantRecord = useCallback((t: any): Tenant => ({
    id: t.id,
    name: t.name,
    phone: t.phone,
    email: t.email,
    property: `${t.unit?.floor?.property?.name || ''} ${t.unit?.number || ''}`.trim(),
    unitId: t.unit?.id ?? null,
    moveInDate: t.moveInDate?.slice(0,10) || '',
    leaseEnd: t.leaseEnd?.slice(0,10) || '',
    rent: t.unit?.rent || 0,
    status: t.status || 'active',
  }), []);
  const loadProperties = useCallback(async () => {
    const res = await fetch('/api/properties', { headers: { Authorization: `Bearer ${token}` } });
    const data = await res.json();
    if (!res.ok) throw new Error(data?.message || 'Failed to load properties');
    return (data.properties || []).map((p: any) => ({ ...p, floors: p.floors || [] }));
  }, [token]);
  const loadTenants = useCallback(async () => {
    const res = await fetch('/api/tenants', { headers: { Authorization: `Bearer ${token}` } });
    const data = await res.json();
    if (!res.ok) throw new Error(data?.message || 'Failed to load tenants');
    return (data.tenants || []).map(mapTenantRecord);
  }, [token, mapTenantRecord]);
  const findUnitDetails = useCallback((unitId: number | null) => {
    if (unitId == null) return null;
    for (const property of properties) {
      for (const floor of property.floors || []) {
        for (const unit of floor.units || []) {
          if (unit.id === unitId) {
            return { property, floor, unit };
          }
        }
      }
    }
    return null;
  }, [properties]);

  useEffect(() => {
    let active = true;
    (async () => {
      try {
        const data = await loadProperties();
        if (active) setProperties(data);
      } catch (e) {
        // noop
      }
    })();
    return () => { active = false; };
  }, [loadProperties]);
  useEffect(() => {
    let active = true;
    (async () => {
      try {
        const data = await loadTenants();
        if (active) setTenants(data);
      } catch (e) {
        // noop
      }
    })();
    return () => { active = false; };
  }, [loadTenants]);
  useEffect(() => {
    setDeleteError('');
  }, [deleteTenant]);
  // Helper: get all vacant units grouped by property/floor
  const vacantUnits = useMemo(() => {
    const result: Array<{ property: any; floor: any; unit: any }> = [];
    for (const property of properties) {
      for (const floor of property.floors || []) {
        for (const unit of floor.units || []) {
          if (unit.status === 'vacant') result.push({ property, floor, unit });
        }
      }
    }
    return result;
  }, [properties]);
  const addSelectedUnit = useMemo(() => findUnitDetails(addSelectedUnitId), [findUnitDetails, addSelectedUnitId]);
  const editUnitDetails = useMemo(() => findUnitDetails(editSelectedUnitId), [findUnitDetails, editSelectedUnitId]);
  const currentEditUnit = useMemo(() => findUnitDetails(editTenant?.unitId ?? null), [findUnitDetails, editTenant]);
  const reassignOptions = useMemo(() => {
    const options: Array<{ label: string; value: number; isCurrent?: boolean }> = [];
    if (currentEditUnit) {
      options.push({
        label: `${currentEditUnit.property.name} / ${currentEditUnit.floor.name} / ${currentEditUnit.unit.number} (current)`,
        value: currentEditUnit.unit.id,
        isCurrent: true,
      });
    }
    vacantUnits.forEach(({ property, floor, unit }) => {
      if (!currentEditUnit || unit.id !== currentEditUnit.unit.id) {
        options.push({
          label: `${property.name} / ${floor.name} / ${unit.number} (${unit.type}, KES ${unit.rent.toLocaleString()})`,
          value: unit.id,
        });
      }
    });
    return options;
  }, [vacantUnits, currentEditUnit]);

  // Filtering, sorting, pagination
  const filteredTenants = useMemo(() => {
    let result = tenants.filter(tenant => {
    const matchesSearch = tenant.name.toLowerCase().includes(searchTerm.toLowerCase()) || tenant.email.toLowerCase().includes(searchTerm.toLowerCase()) || tenant.property.toLowerCase().includes(searchTerm.toLowerCase());
    if (filterStatus === 'all') return matchesSearch;
    return matchesSearch && tenant.status === filterStatus;
  });
    result = result.sort((a, b) => {
      let aVal: any = a[sortBy];
      let bVal: any = b[sortBy];
      if (sortBy === 'rent') {
        aVal = Number(aVal);
        bVal = Number(bVal);
      } else {
        aVal = aVal.toString().toLowerCase();
        bVal = bVal.toString().toLowerCase();
      }
      if (aVal < bVal) return sortDir === 'asc' ? -1 : 1;
      if (aVal > bVal) return sortDir === 'asc' ? 1 : -1;
      return 0;
    });
    return result;
  }, [tenants, searchTerm, filterStatus, sortBy, sortDir]);
  const totalPages = Math.ceil(filteredTenants.length / pageSize);
  const paginatedTenants = filteredTenants.slice((page - 1) * pageSize, page * pageSize);

  // Table columns
  const statusColors = {
    active: 'bg-green-100 text-green-800',
    late: 'bg-red-100 text-red-800',
    ending: 'bg-yellow-100 text-yellow-800',
  };
  const columns = useMemo<ColumnDef<Tenant>[]>(() => [
    {
      header: 'Tenant',
      accessorKey: 'name',
      cell: info => <span className="font-semibold text-gray-800 flex items-center gap-2"><User2Icon size={16} className="text-green-500" />{info.getValue() as string}</span>,
    },
    {
      header: 'Phone',
      accessorKey: 'phone',
      cell: info => <span className="text-gray-600 flex items-center gap-2"><PhoneIcon size={15} className="text-gray-400" />{info.getValue() as string}</span>,
    },
    {
      header: 'Email',
      accessorKey: 'email',
      cell: info => <span className="text-gray-600 flex items-center gap-2"><MailIcon size={15} className="text-gray-400" />{info.getValue() as string}</span>,
    },
    {
      header: 'Property',
      accessorKey: 'property',
      cell: info => <span className="text-gray-600 flex items-center gap-2"><HomeIcon size={15} className="text-green-400" />{info.getValue() as string}</span>,
    },
    {
      header: 'Rent',
      accessorKey: 'rent',
      cell: info => <span className="text-purple-700 font-semibold">KES {(info.getValue() as number).toLocaleString()}</span>,
    },
    {
      header: 'Move In',
      accessorKey: 'moveInDate',
      cell: info => <span className="text-gray-600 flex items-center gap-2"><CalendarIcon size={15} className="text-gray-400" />{info.getValue() as string}</span>,
    },
    {
      header: 'Lease End',
      accessorKey: 'leaseEnd',
      cell: info => <span className="text-gray-600 flex items-center gap-2"><CalendarIcon size={15} className="text-gray-400" />{info.getValue() as string}</span>,
    },
    {
      header: 'Status',
      accessorKey: 'status',
      cell: info => <span className={`px-2 py-1 text-xs rounded-full font-medium ${statusColors[info.getValue() as TenantStatus]}`}>{(info.getValue() as string).charAt(0).toUpperCase() + (info.getValue() as string).slice(1)}</span>,
    },
    {
      header: 'Actions',
      id: 'actions',
      cell: info => (
        <div className="flex gap-2">
          <button className="p-2 rounded-lg hover:bg-green-100 transition-colors flex items-center gap-1 text-green-700 font-semibold shadow-sm" title="View" onClick={e => { e.stopPropagation(); setViewTenant(info.row.original); }}>
            <EyeIcon size={16} /> View
          </button>
          <button className="p-2 rounded-lg hover:bg-blue-100 transition-colors flex items-center gap-1 text-blue-700 font-semibold shadow-sm" title="Edit" onClick={e => { e.stopPropagation(); setEditTenant(info.row.original); }}>
            <PencilIcon size={16} /> Edit
          </button>
          <button className="p-2 rounded-lg hover:bg-red-100 transition-colors flex items-center gap-1 text-red-700 font-semibold shadow-sm" title="Delete" onClick={e => { e.stopPropagation(); setDeleteTenant(info.row.original); }}>
            <Trash2Icon size={16} /> Delete
          </button>
        </div>
      ),
      enableSorting: false,
    },
  ], [setViewTenant, setEditTenant, setDeleteTenant]);

  const table = useReactTable({
    data: paginatedTenants,
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

  // Add/Edit form state (remove rent/property from formTenant)
  const [formTenant, setFormTenant] = useState<Omit<Tenant, 'id' | 'property' | 'rent'>>({
    name: '',
    phone: '',
    email: '',
    moveInDate: '',
    leaseEnd: '',
    status: 'active',
  });
  useEffect(() => {
    if (editTenant) {
      setFormTenant({
        name: editTenant.name,
        phone: editTenant.phone,
        email: editTenant.email,
        moveInDate: editTenant.moveInDate,
        leaseEnd: editTenant.leaseEnd,
        status: editTenant.status,
      });
      setEditSelectedUnitId(editTenant.unitId ?? null);
      setFormError('');
    } else if (!addModalOpen) {
      setFormTenant({ name: '', phone: '', email: '', moveInDate: '', leaseEnd: '', status: 'active' });
      setAddSelectedUnitId(null);
      setEditSelectedUnitId(null);
      setFormError('');
    }
  }, [editTenant, addModalOpen]);

  // Add/Edit handlers
  const handleFormChange = (field: keyof Omit<Tenant, 'id'>, value: string | number) => {
    setFormTenant(prev => ({ ...prev, [field]: value }));
  };
  // Add handler: assign tenant to unit, mark unit as occupied
  const handleAddSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formTenant.name || !formTenant.phone || !formTenant.email || !formTenant.moveInDate || !formTenant.leaseEnd || !addSelectedUnit) {
      setFormError('Please fill all required fields and select a unit.');
      return;
    }
    try {
      const res = await fetch('/api/tenants', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify({
          name: formTenant.name,
          email: formTenant.email,
          phone: formTenant.phone,
          moveInDate: formTenant.moveInDate,
          leaseEnd: formTenant.leaseEnd,
          unitId: addSelectedUnit.unit.id,
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data?.message || 'Failed to add tenant');
      const [propsData, tenantsData] = await Promise.all([loadProperties(), loadTenants()]);
      setProperties(propsData);
      setTenants(tenantsData);
      setAddModalOpen(false);
      setFormTenant({ name: '', phone: '', email: '', moveInDate: '', leaseEnd: '', status: 'active' });
      setAddSelectedUnitId(null);
      setFormError('');
      setShowCredentials({ email: data.credentials.email, password: data.credentials.password });
    } catch (err: any) {
      setFormError(err.message);
    }
  };
  const handleEditSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formTenant.name || !formTenant.phone || !formTenant.email || !formTenant.moveInDate || !formTenant.leaseEnd || !editTenant) {
      setFormError('Please fill all required fields.');
      return;
    }
    try {
      const res = await fetch(`/api/tenants/${editTenant.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify({
          name: formTenant.name,
          phone: formTenant.phone,
          email: formTenant.email,
          moveInDate: formTenant.moveInDate,
          leaseEnd: formTenant.leaseEnd,
          status: formTenant.status,
          unitId: editSelectedUnitId ?? undefined,
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data?.message || 'Failed to update tenant');
      const [propsData, tenantsData] = await Promise.all([loadProperties(), loadTenants()]);
      setProperties(propsData);
      setTenants(tenantsData);
      setEditTenant(null);
      setFormTenant({ name: '', phone: '', email: '', moveInDate: '', leaseEnd: '', status: 'active' });
      setEditSelectedUnitId(null);
      setFormError('');
    } catch (err: any) {
      setFormError(err.message);
    }
  };
  // Delete handler with API call
  const handleDelete = async () => {
    if (!deleteTenant) return;
    try {
      setDeleteError('');
      const res = await fetch(`/api/tenants/${deleteTenant.id}`, { method: 'DELETE', headers: { Authorization: `Bearer ${token}` } });
      if (res.status !== 204) {
        const data = await res.json();
        throw new Error(data?.message || 'Failed to delete tenant');
      }
      const [propsData, tenantsData] = await Promise.all([loadProperties(), loadTenants()]);
      setProperties(propsData);
      setTenants(tenantsData);
      setDeleteTenant(null);
    } catch (err: any) {
      setDeleteError(err.message || 'Failed to delete tenant');
    }
  };

  // Summary stats
  const totalRent = tenants.reduce((sum, t) => sum + t.rent, 0);
  const activeCount = tenants.filter(t => t.status === 'active').length;
  const lateCount = tenants.filter(t => t.status === 'late').length;
  const endingCount = tenants.filter(t => t.status === 'ending').length;

  // Download credentials as text file
  const handleDownloadCredentials = () => {
    if (!showCredentials) return;
    const text = `Tenant Login Details\nEmail: ${showCredentials.email}\nPassword: ${showCredentials.password}`;
    const blob = new Blob([text], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'tenant-login-details.txt';
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  return (
    <div>
      {/* Summary cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
        <div className="bg-white rounded-lg p-6 shadow-sm border border-gray-100 flex flex-col items-center transition-all duration-200 hover:scale-105 hover:shadow-2xl cursor-pointer" style={{ boxShadow: '0 2px 8px 0 rgba(34,197,94,0.08)' }}>
          <div className="p-3 rounded-lg bg-green-50 text-green-700 mb-2"><User2Icon size={22} /></div>
          <div className="text-2xl font-bold text-gray-800">{tenants.length}</div>
          <div className="text-sm text-gray-500">Total Tenants</div>
        </div>
        <div className="bg-white rounded-lg p-6 shadow-sm border border-gray-100 flex flex-col items-center transition-all duration-200 hover:scale-105 hover:shadow-2xl cursor-pointer" style={{ boxShadow: '0 2px 8px 0 rgba(34,197,94,0.08)' }}>
          <div className="p-3 rounded-lg bg-blue-50 text-blue-700 mb-2"><CheckCircle2Icon size={22} /></div>
          <div className="text-2xl font-bold text-blue-700">{activeCount}</div>
          <div className="text-sm text-gray-500">Active</div>
        </div>
        <div className="bg-white rounded-lg p-6 shadow-sm border border-gray-100 flex flex-col items-center transition-all duration-200 hover:scale-105 hover:shadow-2xl cursor-pointer" style={{ boxShadow: '0 2px 8px 0 rgba(34,197,94,0.08)' }}>
          <div className="p-3 rounded-lg bg-yellow-50 text-yellow-700 mb-2"><AlertCircleIcon size={22} /></div>
          <div className="text-2xl font-bold text-yellow-700">{endingCount}</div>
          <div className="text-sm text-gray-500">Ending Soon</div>
        </div>
        <div className="bg-white rounded-lg p-6 shadow-sm border border-gray-100 flex flex-col items-center transition-all duration-200 hover:scale-105 hover:shadow-2xl cursor-pointer" style={{ boxShadow: '0 2px 8px 0 rgba(34,197,94,0.08)' }}>
          <div className="p-3 rounded-lg bg-red-50 text-red-700 mb-2"><AlertCircleIcon size={22} /></div>
          <div className="text-2xl font-bold text-red-700">{lateCount}</div>
          <div className="text-sm text-gray-500">Late Payment</div>
        </div>
      </div>
      {/* Controls */}
      <div className="flex flex-col md:flex-row md:items-center justify-between mb-6 gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-800">Tenants</h1>
          <p className="text-gray-600">Manage your property tenants</p>
        </div>
        <div className="flex flex-col md:flex-row gap-2 md:items-center">
          <div className="flex items-center gap-2">
            <span className="text-sm text-gray-600">Status:</span>
            <select className="border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-transparent" value={filterStatus} onChange={e => { setFilterStatus(e.target.value); setPage(1); }}>
              <option value="all">All</option>
              <option value="active">Active</option>
              <option value="late">Late Payment</option>
              <option value="ending">Ending Soon</option>
            </select>
          </div>
          <div className="relative flex-1">
            <SearchIcon size={18} className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
            <input type="text" placeholder="Search tenants..." className="pl-10 pr-4 py-2 border border-gray-300 rounded-lg w-full focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-transparent" value={searchTerm} onChange={e => { setSearchTerm(e.target.value); setPage(1); }} />
          </div>
          <button className="bg-green-700 hover:bg-green-800 text-white py-2 px-4 rounded-lg flex items-center shadow self-start md:self-auto" onClick={() => setAddModalOpen(true)}>
            <PlusIcon size={18} className="mr-2" />
            Add Tenant
          </button>
        </div>
      </div>
      {/* Table */}
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
                onClick={() => setViewTenant(row.original)}
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
      {/* View Tenant Modal */}
      <Modal open={!!viewTenant} onClose={() => setViewTenant(null)} title={viewTenant ? `Tenant: ${viewTenant.name}` : ''}>
        {viewTenant && (
          <div className="flex flex-col gap-4">
            <div className="flex flex-col md:flex-row gap-6 items-center">
              <div className="flex flex-col items-center md:items-start gap-2">
                <div className="w-16 h-16 rounded-full bg-green-100 flex items-center justify-center text-green-700 text-3xl font-bold shadow"><User2Icon size={36} /></div>
                <div className="text-xl font-bold text-gray-800">{viewTenant.name}</div>
                <div className="text-sm text-gray-500">{viewTenant.property}</div>
                <span className={`px-2 py-1 text-xs rounded-full font-medium ${statusColors[viewTenant.status]}`}>{viewTenant.status.charAt(0).toUpperCase() + viewTenant.status.slice(1)}</span>
              </div>
              <div className="flex-1 flex flex-col gap-2">
                <div className="flex items-center gap-2 text-gray-700"><MailIcon size={16} /> {viewTenant.email}</div>
                <div className="flex items-center gap-2 text-gray-700"><PhoneIcon size={16} /> {viewTenant.phone}</div>
                <div className="flex items-center gap-2 text-gray-700"><HomeIcon size={16} /> {viewTenant.property}</div>
                <div className="flex items-center gap-2 text-gray-700"><CalendarIcon size={16} /> Move In: {viewTenant.moveInDate}</div>
                <div className="flex items-center gap-2 text-gray-700"><CalendarIcon size={16} /> Lease End: {viewTenant.leaseEnd}</div>
                <div className="flex items-center gap-2 text-purple-700 font-semibold"><CheckCircle2Icon size={16} /> Rent: KES {viewTenant.rent.toLocaleString()}</div>
              </div>
            </div>
          </div>
        )}
      </Modal>
      {/* Add Tenant Modal */}
      <Modal open={addModalOpen} onClose={() => setAddModalOpen(false)} title="Add Tenant">
        <form onSubmit={handleAddSubmit} className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <label className="block text-sm font-semibold mb-1">Name *</label>
              <input className="w-full border rounded-lg px-3 py-2" value={formTenant.name} onChange={e => setFormTenant({ ...formTenant, name: e.target.value })} required />
            </div>
            <div>
              <label className="block text-sm font-semibold mb-1">Phone *</label>
              <input className="w-full border rounded-lg px-3 py-2" value={formTenant.phone} onChange={e => setFormTenant({ ...formTenant, phone: e.target.value })} required />
            </div>
            <div>
              <label className="block text-sm font-semibold mb-1">Email *</label>
              <input className="w-full border rounded-lg px-3 py-2" value={formTenant.email} onChange={e => setFormTenant({ ...formTenant, email: e.target.value })} required />
            </div>
            <div>
              <label className="block text-sm font-semibold mb-1">Move In Date *</label>
              <input className="w-full border rounded-lg px-3 py-2" type="date" value={formTenant.moveInDate} onChange={e => setFormTenant({ ...formTenant, moveInDate: e.target.value })} required />
            </div>
            <div>
              <label className="block text-sm font-semibold mb-1">Lease End *</label>
              <input className="w-full border rounded-lg px-3 py-2" type="date" value={formTenant.leaseEnd} onChange={e => setFormTenant({ ...formTenant, leaseEnd: e.target.value })} required />
            </div>
            <div className="md:col-span-2">
              <label className="block text-sm font-semibold mb-1">Assign Unit *</label>
              <Listbox value={addSelectedUnitId} onChange={setAddSelectedUnitId}>
                <div className="relative mt-1">
                  <Listbox.Button className="w-full border rounded-lg px-3 py-2 text-left">
                    {addSelectedUnit ? (
                      <span>{addSelectedUnit.property.name} / {addSelectedUnit.floor.name} / {addSelectedUnit.unit.number} ({addSelectedUnit.unit.type}, KES {addSelectedUnit.unit.rent.toLocaleString()})</span>
                    ) : (
                      <span className="text-gray-400">Select a vacant unit...</span>
                    )}
                  </Listbox.Button>
                  <Listbox.Options className="absolute z-10 mt-1 w-full bg-white border border-green-100 rounded-lg shadow-lg max-h-60 overflow-auto focus:outline-none">
                    {properties.map(property => (
                      <div key={property.id}>
                        <div className="px-3 py-1 text-green-700 font-bold bg-green-50 border-b border-green-100">{property.name}</div>
                        {property.floors.map(floor => (
                          <div key={floor.id}>
                            <div className="px-5 py-1 text-green-600 font-semibold bg-green-50">{floor.name}</div>
                            {floor.units.filter(u => u.status === 'vacant').map(unit => (
                              <Listbox.Option key={unit.id} value={unit.id} className={({ active, selected }) => `px-8 py-2 cursor-pointer flex items-center gap-2 ${active ? 'bg-green-100' : ''} ${selected ? 'font-bold' : ''}`}>
                                <span>{unit.number} ({unit.type}, KES {unit.rent.toLocaleString()})</span>
                              </Listbox.Option>
                            ))}
                          </div>
                        ))}
                      </div>
                    ))}
                  </Listbox.Options>
                </div>
              </Listbox>
            </div>
            {addSelectedUnit && (
              <>
                <div>
                  <label className="block text-sm font-semibold mb-1">Property</label>
                  <input className="w-full border rounded-lg px-3 py-2 bg-gray-100" value={addSelectedUnit.property.name} readOnly />
                </div>
                <div>
                  <label className="block text-sm font-semibold mb-1">Unit</label>
                  <input className="w-full border rounded-lg px-3 py-2 bg-gray-100" value={addSelectedUnit.unit.number} readOnly />
                </div>
                <div>
                  <label className="block text-sm font-semibold mb-1">Rent (KES)</label>
                  <input className="w-full border rounded-lg px-3 py-2 bg-gray-100" value={addSelectedUnit.unit.rent.toLocaleString()} readOnly />
                </div>
              </>
            )}
          </div>
          {formError && <div className="text-red-600 font-semibold text-sm">{formError}</div>}
          <div className="flex justify-end mt-6">
            <button type="submit" className="px-4 py-2 rounded-lg bg-green-700 text-white hover:bg-green-800">Add Tenant</button>
          </div>
        </form>
      </Modal>
      {/* Edit Tenant Modal */}
      <Modal open={!!editTenant} onClose={() => setEditTenant(null)} title={editTenant ? `Edit Tenant: ${editTenant.name}` : ''}>
        <form onSubmit={handleEditSubmit} className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <label className="block text-sm font-semibold mb-1">Name *</label>
              <input className="w-full border rounded-lg px-3 py-2" value={formTenant.name} onChange={e => setFormTenant({ ...formTenant, name: e.target.value })} required />
            </div>
            <div>
              <label className="block text-sm font-semibold mb-1">Phone *</label>
              <input className="w-full border rounded-lg px-3 py-2" value={formTenant.phone} onChange={e => setFormTenant({ ...formTenant, phone: e.target.value })} required />
            </div>
            <div>
              <label className="block text-sm font-semibold mb-1">Email *</label>
              <input className="w-full border rounded-lg px-3 py-2" value={formTenant.email} onChange={e => setFormTenant({ ...formTenant, email: e.target.value })} required />
            </div>
            <div>
              <label className="block text-sm font-semibold mb-1">Move In Date *</label>
              <input className="w-full border rounded-lg px-3 py-2" type="date" value={formTenant.moveInDate} onChange={e => setFormTenant({ ...formTenant, moveInDate: e.target.value })} required />
            </div>
            <div>
              <label className="block text-sm font-semibold mb-1">Lease End *</label>
              <input className="w-full border rounded-lg px-3 py-2" type="date" value={formTenant.leaseEnd} onChange={e => setFormTenant({ ...formTenant, leaseEnd: e.target.value })} required />
            </div>
            <div className="md:col-span-2">
              <label className="block text-sm font-semibold mb-1">Reassign Unit</label>
              <Listbox value={editSelectedUnitId} onChange={setEditSelectedUnitId}>
                <div className="relative mt-1">
                  <Listbox.Button className="w-full border rounded-lg px-3 py-2 text-left">
                    {editUnitDetails ? (
                      <span>{editUnitDetails.property.name} / {editUnitDetails.floor.name} / {editUnitDetails.unit.number} ({editUnitDetails.unit.type}, KES {editUnitDetails.unit.rent.toLocaleString()})</span>
                    ) : (
                      <span className="text-gray-400">No unit selected</span>
                    )}
                  </Listbox.Button>
                  <Listbox.Options className="absolute z-10 mt-1 w-full bg-white border border-green-100 rounded-lg shadow-lg max-h-60 overflow-auto focus:outline-none">
                    {reassignOptions.length === 0 ? (
                      <div className="px-4 py-2 text-sm text-gray-500">No available units to assign.</div>
                    ) : (
                      reassignOptions.map(opt => (
                        <Listbox.Option
                          key={opt.value}
                          value={opt.value}
                          className={({ active, selected }) => `px-3 py-2 cursor-pointer ${active ? 'bg-green-100' : ''} ${selected ? 'font-bold' : ''}`}
                        >
                          {opt.label}
                        </Listbox.Option>
                      ))
                    )}
                  </Listbox.Options>
                </div>
              </Listbox>
              <p className="text-xs text-gray-500 mt-1">Select a vacant unit to move the tenant or keep the current unit selected.</p>
            </div>
            {editUnitDetails && (
              <>
                <div>
                  <label className="block text-sm font-semibold mb-1">Property</label>
                  <input className="w-full border rounded-lg px-3 py-2 bg-gray-100" value={editUnitDetails.property.name} readOnly />
                </div>
                <div>
                  <label className="block text-sm font-semibold mb-1">Unit</label>
                  <input className="w-full border rounded-lg px-3 py-2 bg-gray-100" value={editUnitDetails.unit.number} readOnly />
                </div>
                <div>
                  <label className="block text-sm font-semibold mb-1">Rent (KES)</label>
                  <input className="w-full border rounded-lg px-3 py-2 bg-gray-100" value={editUnitDetails.unit.rent.toLocaleString()} readOnly />
                </div>
              </>
            )}
            <div>
              <label className="block text-sm font-semibold mb-1">Status *</label>
              <select className="w-full border rounded-lg px-3 py-2" value={formTenant.status} onChange={e => setFormTenant({ ...formTenant, status: e.target.value })} required>
                <option value="active">Active</option>
                <option value="late">Late Payment</option>
                <option value="ending">Ending Soon</option>
              </select>
            </div>
          </div>
          {formError && <div className="text-red-600 font-semibold text-sm">{formError}</div>}
          <div className="flex justify-end mt-6">
            <button type="submit" className="px-4 py-2 rounded-lg bg-green-700 text-white hover:bg-green-800">Save Changes</button>
          </div>
        </form>
      </Modal>
      {/* Delete Tenant Modal */}
      <Modal open={!!deleteTenant} onClose={() => setDeleteTenant(null)} title="Delete Tenant?">
        <div className="mb-4">Are you sure you want to delete this tenant? This action cannot be undone.</div>
        {deleteError && <div className="mb-3 text-sm text-red-600">{deleteError}</div>}
        <div className="flex justify-end gap-2">
          <button onClick={() => setDeleteTenant(null)} className="px-4 py-2 rounded-lg bg-gray-100 hover:bg-gray-200">Cancel</button>
          <button onClick={handleDelete} className="px-4 py-2 rounded-lg bg-red-600 text-white hover:bg-red-700">Delete</button>
        </div>
      </Modal>
      {/* Tenant Credentials Modal */}
      <Modal open={!!showCredentials} onClose={() => setShowCredentials(null)} title="Tenant Login Details">
        <div className="flex flex-col gap-4 items-center">
          <div className="text-lg font-semibold text-green-800">Tenant account created successfully!</div>
          <div className="bg-green-50 border border-green-200 rounded-lg px-6 py-4 w-full max-w-md flex flex-col gap-2">
            <div className="flex items-center gap-2"><MailIcon size={18} className="text-green-600" /><span className="font-bold">Email:</span> <span className="ml-1">{showCredentials?.email}</span></div>
            <div className="flex items-center gap-2"><KeyIcon size={18} className="text-green-600" /><span className="font-bold">Password:</span> <span className="ml-1">{showCredentials?.password}</span></div>
          </div>
          <button onClick={handleDownloadCredentials} className="px-4 py-2 rounded-lg bg-green-700 text-white hover:bg-green-800 mt-2">Download Details</button>
          <button onClick={() => setShowCredentials(null)} className="px-4 py-2 rounded-lg bg-gray-100 hover:bg-gray-200 mt-2">Close</button>
        </div>
      </Modal>
    </div>
  );
};
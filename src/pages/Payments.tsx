import React, { useState, useMemo, useRef, useEffect } from 'react';
import { ColumnDef, getCoreRowModel, getSortedRowModel, getPaginationRowModel, flexRender, useReactTable } from '@tanstack/react-table';
import { SearchIcon, FilterIcon, DownloadIcon, PlusIcon, EyeIcon, PencilIcon, Trash2Icon, CheckCircle2Icon, AlertCircleIcon, ClockIcon, BanknoteIcon, User2Icon, HomeIcon, CalendarIcon, XIcon } from 'lucide-react';
import { Listbox } from '@headlessui/react';
import { useAuth } from '../auth/AuthContext';

// Modal component (copied/adapted)
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

// Mock tenants/units (copy from Tenants/Properties for demo)
const mockUnits = [
  { id: 1, property: 'Westlands Apartment', number: 'G1', rent: 45000, tenant: { id: 1, name: 'John Mwangi' } },
  { id: 2, property: 'Westlands Apartment', number: 'G2', rent: 30000, tenant: null },
  { id: 3, property: 'Westlands Apartment', number: '1A', rent: 60000, tenant: null },
  { id: 4, property: 'Westlands Apartment', number: '1B', rent: 25000, tenant: null },
  { id: 5, property: 'Kilimani Townhouse', number: 'G1', rent: 80000, tenant: { id: 2, name: 'Sarah Ochieng' } },
];
const mockTenants = [
  { id: 1, name: 'John Mwangi', unitId: 1 },
  { id: 2, name: 'Sarah Ochieng', unitId: 5 },
];

// Payment model
// { id, tenantId, unitId, month, year, amount, status, date, dueDate, method, reference }
const initialPayments = [
  { id: 1, tenantId: 1, unitId: 1, month: 10, year: 2023, amount: 45000, status: 'completed', date: '2023-10-01', dueDate: '2023-10-05', method: 'M-Pesa', reference: 'MPE123456789' },
  { id: 2, tenantId: 2, unitId: 5, month: 10, year: 2023, amount: 80000, status: 'pending', date: null, dueDate: '2023-10-05', method: null, reference: null },
  { id: 3, tenantId: 1, unitId: 1, month: 9, year: 2023, amount: 45000, status: 'completed', date: '2023-09-01', dueDate: '2023-09-05', method: 'M-Pesa', reference: 'MPE987654321' },
];

const months = [
  { value: 1, label: 'January' },
  { value: 2, label: 'February' },
  { value: 3, label: 'March' },
  { value: 4, label: 'April' },
  { value: 5, label: 'May' },
  { value: 6, label: 'June' },
  { value: 7, label: 'July' },
  { value: 8, label: 'August' },
  { value: 9, label: 'September' },
  { value: 10, label: 'October' },
  { value: 11, label: 'November' },
  { value: 12, label: 'December' },
];

// Payment status colors/icons
const statusColors: { [key: string]: string } = {
  completed: 'bg-green-100 text-green-800',
  pending: 'bg-yellow-100 text-yellow-800',
  overdue: 'bg-red-100 text-red-800',
};
const statusIcons: { [key: string]: React.ReactNode } = {
  completed: <CheckCircle2Icon size={16} className="text-green-500 mr-1" />,
  pending: <ClockIcon size={16} className="text-yellow-500 mr-1" />,
  overdue: <AlertCircleIcon size={16} className="text-red-500 mr-1" />,
};

export const Payments = () => {
  const { token } = useAuth();
  const [searchTerm, setSearchTerm] = useState('');
  const [filterStatus, setFilterStatus] = useState('all');
  const [filterMonth, setFilterMonth] = useState('all');
  const [filterTenant, setFilterTenant] = useState('all');
  const [payments, setPayments] = useState<any[]>([]);
  const [tenants, setTenants] = useState<any[]>([]);
  const [units, setUnits] = useState<any[]>([]);
  const [recordModalOpen, setRecordModalOpen] = useState(false);
  const [selectedTenantId, setSelectedTenantId] = useState<number | null>(null);
  const [selectedMonth, setSelectedMonth] = useState<number | null>(null);
  const [selectedYear, setSelectedYear] = useState<number>(new Date().getFullYear());
  const [formError, setFormError] = useState('');
  const [viewPayment, setViewPayment] = useState<any>(null);
  const [editPayment, setEditPayment] = useState<any>(null);
  const [deletePayment, setDeletePayment] = useState<any>(null);
  const [sortBy, setSortBy] = useState<'tenant' | 'unit' | 'amount' | 'status' | 'month'>('month');
  const [sortDir, setSortDir] = useState<'asc' | 'desc'>('desc');
  const [page, setPage] = useState(1);
  const pageSize = 6;

  // Fetch payments (and extract tenants/units) on mount and poll every 10s
  useEffect(() => {
    let active = true;
    let interval: any;
    const fetchPayments = async () => {
      try {
        const res = await fetch('/api/payments', { headers: { Authorization: `Bearer ${token}` } });
        const data = await res.json();
        if (!res.ok) throw new Error(data?.message || 'Failed to load payments');
        if (active) {
          setPayments(data.payments || []);
          // Extract unique tenants and units from payments
          const tMap: any = {}, uMap: any = {};
          (data.payments || []).forEach((p: any) => {
            if (p.tenant) tMap[p.tenant.id] = p.tenant;
            if (p.unit) uMap[p.unit.id] = p.unit;
          });
          setTenants(Object.values(tMap));
          setUnits(Object.values(uMap));
        }
      } catch {}
    };
    fetchPayments();
    interval = setInterval(fetchPayments, 10000);
    return () => { active = false; clearInterval(interval); };
  }, [token]);

  // Find tenant/unit for selectedTenantId
  const selectedTenant = tenants.find(t => t.id === selectedTenantId);
  const selectedUnit = selectedTenant ? units.find(u => u.id === selectedTenant.unitId) : null;

  // Filtered payments
  const filteredPayments = useMemo(() => {
    return payments.filter(payment => {
      const tenant = tenants.find(t => t.id === payment.tenantId);
      const unit = units.find(u => u.id === payment.unitId);
      const matchesSearch = tenant && (tenant.name.toLowerCase().includes(searchTerm.toLowerCase()) || (unit && `${unit.property || ''} ${unit.number || ''}`.toLowerCase().includes(searchTerm.toLowerCase())));
      let statusMatch = filterStatus === 'all' || payment.status === filterStatus;
      let monthMatch = filterMonth === 'all' || payment.month === Number(filterMonth);
      let tenantMatch = filterTenant === 'all' || payment.tenantId === Number(filterTenant);
      return matchesSearch && statusMatch && monthMatch && tenantMatch;
    });
  }, [payments, searchTerm, filterStatus, filterMonth, filterTenant, tenants, units]);

  // Summary stats
  const totalPaid = payments.filter(p => p.status === 'completed').reduce((sum, p) => sum + p.amount, 0);
  const completedCount = payments.filter(p => p.status === 'completed').length;
  const pendingCount = payments.filter(p => p.status === 'pending').length;
  const overdueCount = payments.filter(p => p.status === 'overdue').length;

  // Table columns
  const columns = useMemo<ColumnDef<any>[]>(() => [
    {
      header: 'Tenant',
      accessorKey: 'tenantId',
      cell: info => {
        const tenant = tenants.find(t => t.id === info.getValue());
        return <span className="font-semibold text-gray-800 flex items-center gap-2"><User2Icon size={16} className="text-green-500" />{tenant ? tenant.name : '-'}</span>;
      },
    },
    {
      header: 'Property/Unit',
      accessorKey: 'unitId',
      cell: info => {
        const unit = units.find(u => u.id === info.getValue());
        return <span className="text-gray-600 flex items-center gap-2"><HomeIcon size={15} className="text-green-400" />{unit ? `${unit.property} ${unit.number}` : '-'}</span>;
      },
    },
    {
      header: 'Month',
      accessorKey: 'month',
      cell: info => <span className="text-gray-600 flex items-center gap-2"><CalendarIcon size={15} className="text-gray-400" />{months.find(m => m.value === info.getValue())?.label} {info.row.original.year}</span>,
    },
    {
      header: 'Amount',
      accessorKey: 'amount',
      cell: info => <span className="text-purple-700 font-semibold flex items-center gap-2"><BanknoteIcon size={15} className="text-purple-400" />KES {(info.getValue() as number).toLocaleString()}</span>,
    },
    {
      header: 'Due Date',
      accessorKey: 'dueDate',
      cell: info => <span className="text-gray-600">{info.getValue() as string}</span>,
    },
    {
      header: 'Payment Date',
      accessorKey: 'date',
      cell: info => <span className="text-gray-600">{info.getValue() || '-'}</span>,
    },
    {
      header: 'Method',
      accessorKey: 'method',
      cell: info => <span className="text-gray-600">{info.getValue() || '-'}</span>,
    },
    {
      header: 'Status',
      accessorKey: 'status',
      cell: info => {
        const status = info.getValue() as string;
        return (
          <span className={`px-2 py-1 text-xs rounded-full font-medium flex items-center gap-1 ${statusColors[status] || ''}`}>
            {React.isValidElement(statusIcons[status]) ? statusIcons[status] : null}
            {status.charAt(0).toUpperCase() + status.slice(1)}
          </span>
        );
      },
    },
    {
      header: 'Actions',
      id: 'actions',
      cell: info => (
        <div className="flex gap-2">
          <button className="p-2 rounded-lg hover:bg-green-100 transition-colors flex items-center gap-1 text-green-700 font-semibold shadow-sm" title="View" onClick={e => { e.stopPropagation(); setViewPayment(info.row.original); }}>
            <EyeIcon size={16} /> View
          </button>
          <button className="p-2 rounded-lg hover:bg-blue-100 transition-colors flex items-center gap-1 text-blue-700 font-semibold shadow-sm" title="Edit" onClick={e => { e.stopPropagation(); setEditPayment(info.row.original); }}>
            <PencilIcon size={16} /> Edit
          </button>
          <button className="p-2 rounded-lg hover:bg-red-100 transition-colors flex items-center gap-1 text-red-700 font-semibold shadow-sm" title="Delete" onClick={e => { e.stopPropagation(); setDeletePayment(info.row.original); }}>
            <Trash2Icon size={16} /> Delete
          </button>
          {info.row.original.status === 'pending' && (
            <button
              className="p-2 rounded-lg hover:bg-yellow-100 transition-colors flex items-center gap-1 text-yellow-700 font-semibold shadow-sm"
              title="Simulate M-Pesa Payment"
              onClick={() => simulateMpesaPayment(info.row.original)}
            >
              <ClockIcon size={16} /> Simulate
            </button>
          )}
        </div>
      ),
      enableSorting: false,
    },
  ], [tenants, units]);

  // Table setup
  const tableData = useMemo(() => filteredPayments, [filteredPayments]);
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
    pageCount: Math.ceil(filteredPayments.length / pageSize),
  });

  // Simulate M-Pesa payment reflection
  const simulateMpesaPayment = async (payment: any) => {
    try {
      const res = await fetch(`/api/payments/${payment.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify({
          status: 'completed',
          method: 'M-Pesa',
          reference: `MPE${Math.floor(100000000 + Math.random() * 900000000)}`,
          date: new Date().toISOString().slice(0, 10),
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data?.message || 'Failed to update payment');
      setPayments(prev => prev.map(p => p.id === payment.id ? data.payment : p));
    } catch {}
  };

  // Record Payment handler
  const handleRecordPayment = (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedTenantId || !selectedUnit || !selectedMonth || !selectedYear) {
      setFormError('Please select tenant and month.');
      return;
    }
    // Check if payment already exists for this tenant/unit/month/year
    const exists = payments.some(p => p.tenantId === selectedTenantId && p.unitId === selectedUnit.id && p.month === selectedMonth && p.year === selectedYear);
    if (exists) {
      setFormError('Payment already recorded for this tenant and month.');
      return;
    }
    setPayments(prev => [
      {
        id: Date.now(),
        tenantId: selectedTenantId,
        unitId: selectedUnit.id,
        month: selectedMonth,
        year: selectedYear,
        amount: selectedUnit.rent,
        status: 'completed',
        date: new Date().toISOString().slice(0, 10),
        dueDate: `${selectedYear}-${String(selectedMonth).padStart(2, '0')}-05`,
        method: 'Manual',
        reference: `MANUAL${Date.now()}`,
      },
      ...prev,
    ]);
    setRecordModalOpen(false);
    setSelectedTenantId(null);
    setSelectedMonth(null);
    setFormError('');
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'completed':
        return 'bg-green-100 text-green-800';
      case 'pending':
        return 'bg-yellow-100 text-yellow-800';
      case 'overdue':
        return 'bg-red-100 text-red-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  return (
        <div>
      {/* Summary cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
        <div className="bg-white rounded-lg p-6 shadow-sm border border-gray-100 flex flex-col items-center transition-all duration-200 hover:scale-105 hover:shadow-2xl cursor-pointer" style={{ boxShadow: '0 2px 8px 0 rgba(34,197,94,0.08)' }}>
          <div className="p-3 rounded-lg bg-green-50 text-green-700 mb-2"><BanknoteIcon size={22} /></div>
          <div className="text-2xl font-bold text-gray-800">KES {totalPaid.toLocaleString()}</div>
          <div className="text-sm text-gray-500">Total Paid</div>
        </div>
        <div className="bg-white rounded-lg p-6 shadow-sm border border-gray-100 flex flex-col items-center transition-all duration-200 hover:scale-105 hover:shadow-2xl cursor-pointer" style={{ boxShadow: '0 2px 8px 0 rgba(34,197,94,0.08)' }}>
          <div className="p-3 rounded-lg bg-blue-50 text-blue-700 mb-2"><CheckCircle2Icon size={22} /></div>
          <div className="text-2xl font-bold text-blue-700">{completedCount}</div>
          <div className="text-sm text-gray-500">Completed</div>
        </div>
        <div className="bg-white rounded-lg p-6 shadow-sm border border-gray-100 flex flex-col items-center transition-all duration-200 hover:scale-105 hover:shadow-2xl cursor-pointer" style={{ boxShadow: '0 2px 8px 0 rgba(34,197,94,0.08)' }}>
          <div className="p-3 rounded-lg bg-yellow-50 text-yellow-700 mb-2"><ClockIcon size={22} /></div>
          <div className="text-2xl font-bold text-yellow-700">{pendingCount}</div>
          <div className="text-sm text-gray-500">Pending</div>
        </div>
        <div className="bg-white rounded-lg p-6 shadow-sm border border-gray-100 flex flex-col items-center transition-all duration-200 hover:scale-105 hover:shadow-2xl cursor-pointer" style={{ boxShadow: '0 2px 8px 0 rgba(34,197,94,0.08)' }}>
          <div className="p-3 rounded-lg bg-red-50 text-red-700 mb-2"><AlertCircleIcon size={22} /></div>
          <div className="text-2xl font-bold text-red-700">{overdueCount}</div>
          <div className="text-sm text-gray-500">Overdue</div>
        </div>
      </div>
      {/* Controls and table (rest of the code remains, but update table classes) */}
      <div className="bg-white rounded-lg p-6 shadow-sm border border-gray-100 mb-6">
        <div className="flex flex-col md:flex-row gap-4">
          <div className="relative flex-1">
            <SearchIcon size={18} className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
            <input type="text" placeholder="Search payments..." className="pl-10 pr-4 py-2 border border-gray-300 rounded-lg w-full focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-transparent" value={searchTerm} onChange={e => setSearchTerm(e.target.value)} />
          </div>
          <div className="flex items-center">
            <FilterIcon size={18} className="text-gray-400 mr-2" />
            <select className="border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-transparent" value={filterStatus} onChange={e => setFilterStatus(e.target.value)}>
              <option value="all">All Status</option>
              <option value="completed">Completed</option>
              <option value="pending">Pending</option>
              <option value="overdue">Overdue</option>
            </select>
          </div>
          <div className="flex items-center">
            <FilterIcon size={18} className="text-gray-400 mr-2" />
            <select className="border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-transparent" value={filterMonth} onChange={e => setFilterMonth(e.target.value)}>
              <option value="all">All Months</option>
              {months.map(m => <option key={m.value} value={m.value}>{m.label}</option>)}
            </select>
          </div>
          <div className="flex items-center">
            <FilterIcon size={18} className="text-gray-400 mr-2" />
            <select className="border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-transparent" value={filterTenant} onChange={e => setFilterTenant(e.target.value)}>
              <option value="all">All Tenants</option>
              {tenants.map(t => <option key={t.id} value={t.id}>{t.name}</option>)}
            </select>
          </div>
        </div>
      </div>
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
                onClick={() => setViewPayment(row.original)}
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
        {/* Pagination controls (reuse from other pages) */}
        <div className="flex justify-between items-center p-4">
          <span className="text-sm text-gray-600">Page {page} of {Math.ceil(filteredPayments.length / pageSize)}</span>
          <div className="flex gap-2">
            <button disabled={page === 1} onClick={() => setPage(page - 1)} className="px-3 py-1 rounded-lg border border-gray-300 bg-white hover:bg-green-50 disabled:opacity-50">Prev</button>
            {Array.from({ length: Math.ceil(filteredPayments.length / pageSize) }, (_, i) => (
              <button key={i+1} onClick={() => setPage(i+1)} className={`px-3 py-1 rounded-lg border ${page === i+1 ? 'bg-green-700 text-white border-green-700' : 'bg-white hover:bg-green-50 border-gray-300'} transition-all`}>{i+1}</button>
            ))}
            <button disabled={page === Math.ceil(filteredPayments.length / pageSize)} onClick={() => setPage(page + 1)} className="px-3 py-1 rounded-lg border border-gray-300 bg-white hover:bg-green-50 disabled:opacity-50">Next</button>
          </div>
        </div>
      </div>
      {/* Record Payment Modal */}
      {recordModalOpen && (
        <Modal
          open={recordModalOpen}
          onClose={() => setRecordModalOpen(false)}
          title="Record Payment"
        >
          <form onSubmit={handleRecordPayment} className="space-y-6">
            <div>
              <label className="block text-sm font-semibold mb-1">Tenant *</label>
              <Listbox value={selectedTenantId} onChange={setSelectedTenantId}>
                <div className="relative mt-1">
                  <Listbox.Button className="w-full border rounded-lg px-3 py-2 text-left">
                    {selectedTenant ? selectedTenant.name : <span className="text-gray-400">Select tenant...</span>}
                  </Listbox.Button>
                  <Listbox.Options className="absolute z-10 mt-1 w-full bg-white border border-green-100 rounded-lg shadow-lg max-h-60 overflow-auto focus:outline-none">
                    {tenants.map(t => (
                      <Listbox.Option key={t.id} value={t.id} className={({ active, selected }) => `px-4 py-2 cursor-pointer ${active ? 'bg-green-100' : ''} ${selected ? 'font-bold' : ''}`}>{t.name}</Listbox.Option>
                    ))}
                  </Listbox.Options>
                </div>
              </Listbox>
            </div>
            <div>
              <label className="block text-sm font-semibold mb-1">Month *</label>
              <Listbox value={selectedMonth} onChange={setSelectedMonth}>
                <div className="relative mt-1">
                  <Listbox.Button className="w-full border rounded-lg px-3 py-2 text-left">
                    {selectedMonth ? months.find(m => m.value === selectedMonth)?.label : <span className="text-gray-400">Select month...</span>}
                  </Listbox.Button>
                  <Listbox.Options className="absolute z-10 mt-1 w-full bg-white border border-green-100 rounded-lg shadow-lg max-h-60 overflow-auto focus:outline-none">
                    {months.map(m => (
                      <Listbox.Option key={m.value} value={m.value} className={({ active, selected }) => `px-4 py-2 cursor-pointer ${active ? 'bg-green-100' : ''} ${selected ? 'font-bold' : ''}`}>{m.label}</Listbox.Option>
                    ))}
                  </Listbox.Options>
                </div>
              </Listbox>
            </div>
            {selectedUnit && (
              <>
                <div>
                  <label className="block text-sm font-semibold mb-1">Property/Unit</label>
                  <input className="w-full border rounded-lg px-3 py-2 bg-gray-100" value={`${selectedUnit.property} ${selectedUnit.number}`} readOnly />
                </div>
                <div>
                  <label className="block text-sm font-semibold mb-1">Amount (KES)</label>
                  <input className="w-full border rounded-lg px-3 py-2 bg-gray-100" value={selectedUnit.rent.toLocaleString()} readOnly />
                </div>
              </>
            )}
            {formError && <div className="text-red-600 font-semibold text-sm">{formError}</div>}
            <div className="flex justify-end mt-6">
              <button type="submit" className="px-4 py-2 rounded-lg bg-green-700 text-white hover:bg-green-800">Record Payment</button>
            </div>
          </form>
        </Modal>
      )}
      {/* View Payment Modal */}
      {viewPayment && (
        <Modal
          open={!!viewPayment}
          onClose={() => setViewPayment(null)}
          title="View Payment Details"
        >
          <div className="grid grid-cols-2 gap-4">
            <div>
              <p className="text-sm font-semibold mb-1">Tenant</p>
              <p className="text-gray-800">{tenants.find(t => t.id === viewPayment.tenantId)?.name || '-'}</p>
            </div>
            <div>
              <p className="text-sm font-semibold mb-1">Property/Unit</p>
              <p className="text-gray-800">{units.find(u => u.id === viewPayment.unitId)?.property} {units.find(u => u.id === viewPayment.unitId)?.number}</p>
                      </div>
            <div>
              <p className="text-sm font-semibold mb-1">Month</p>
              <p className="text-gray-800">{months.find(m => m.value === viewPayment.month)?.label} {viewPayment.year}</p>
                      </div>
            <div>
              <p className="text-sm font-semibold mb-1">Amount</p>
              <p className="text-gray-800">KES {viewPayment.amount.toLocaleString()}</p>
                      </div>
            <div>
              <p className="text-sm font-semibold mb-1">Due Date</p>
              <p className="text-gray-800">{viewPayment.dueDate}</p>
                      </div>
            <div>
              <p className="text-sm font-semibold mb-1">Payment Date</p>
              <p className="text-gray-800">{viewPayment.date || '-'}</p>
                      </div>
            <div>
              <p className="text-sm font-semibold mb-1">Method</p>
              <p className="text-gray-800">{viewPayment.method || '-'}</p>
                      </div>
            <div>
              <p className="text-sm font-semibold mb-1">Status</p>
              <p className={`px-2 py-1 text-xs rounded-full font-medium ${statusColors[viewPayment.status as string] || ''}`}>
                {React.isValidElement(statusIcons[viewPayment.status as string]) ? statusIcons[viewPayment.status as string] : null}
                {(viewPayment.status as string).charAt(0).toUpperCase() + (viewPayment.status as string).slice(1)}
              </p>
            </div>
          </div>
        </Modal>
      )}
      {/* Edit Payment Modal */}
      {editPayment && (
        <Modal
          open={!!editPayment}
          onClose={() => setEditPayment(null)}
          title="Edit Payment"
        >
          <form onSubmit={(e) => {
            e.preventDefault();
            if (!selectedTenantId || !selectedUnit || !selectedMonth || !selectedYear) {
              setFormError('Please select tenant and month.');
              return;
            }
            const updatedPayment = {
              ...editPayment,
              tenantId: selectedTenantId,
              unitId: selectedUnit.id,
              month: selectedMonth,
              year: selectedYear,
              amount: selectedUnit.rent,
              date: new Date().toISOString().slice(0, 10),
              dueDate: `${selectedYear}-${String(selectedMonth).padStart(2, '0')}-05`,
              method: 'Manual',
              reference: `MANUAL${Date.now()}`,
            };
            setPayments(prev => prev.map(p => p.id === editPayment.id ? updatedPayment : p));
            setEditPayment(null);
            setSelectedTenantId(null);
            setSelectedMonth(null);
            setFormError('');
          }} className="space-y-6">
            <div>
              <label className="block text-sm font-semibold mb-1">Tenant *</label>
              <Listbox value={selectedTenantId} onChange={setSelectedTenantId}>
                <div className="relative mt-1">
                  <Listbox.Button className="w-full border rounded-lg px-3 py-2 text-left">
                    {selectedTenant ? selectedTenant.name : <span className="text-gray-400">Select tenant...</span>}
                  </Listbox.Button>
                  <Listbox.Options className="absolute z-10 mt-1 w-full bg-white border border-green-100 rounded-lg shadow-lg max-h-60 overflow-auto focus:outline-none">
                    {tenants.map(t => (
                      <Listbox.Option key={t.id} value={t.id} className={({ active, selected }) => `px-4 py-2 cursor-pointer ${active ? 'bg-green-100' : ''} ${selected ? 'font-bold' : ''}`}>{t.name}</Listbox.Option>
                    ))}
                  </Listbox.Options>
                </div>
              </Listbox>
            </div>
            <div>
              <label className="block text-sm font-semibold mb-1">Month *</label>
              <Listbox value={selectedMonth} onChange={setSelectedMonth}>
                <div className="relative mt-1">
                  <Listbox.Button className="w-full border rounded-lg px-3 py-2 text-left">
                    {selectedMonth ? months.find(m => m.value === selectedMonth)?.label : <span className="text-gray-400">Select month...</span>}
                  </Listbox.Button>
                  <Listbox.Options className="absolute z-10 mt-1 w-full bg-white border border-green-100 rounded-lg shadow-lg max-h-60 overflow-auto focus:outline-none">
                    {months.map(m => (
                      <Listbox.Option key={m.value} value={m.value} className={({ active, selected }) => `px-4 py-2 cursor-pointer ${active ? 'bg-green-100' : ''} ${selected ? 'font-bold' : ''}`}>{m.label}</Listbox.Option>
                    ))}
                  </Listbox.Options>
                </div>
              </Listbox>
            </div>
            {selectedUnit && (
              <>
                <div>
                  <label className="block text-sm font-semibold mb-1">Property/Unit</label>
                  <input className="w-full border rounded-lg px-3 py-2 bg-gray-100" value={`${selectedUnit.property} ${selectedUnit.number}`} readOnly />
                </div>
                <div>
                  <label className="block text-sm font-semibold mb-1">Amount (KES)</label>
                  <input className="w-full border rounded-lg px-3 py-2 bg-gray-100" value={selectedUnit.rent.toLocaleString()} readOnly />
                </div>
              </>
            )}
            {formError && <div className="text-red-600 font-semibold text-sm">{formError}</div>}
            <div className="flex justify-end mt-6">
              <button type="submit" className="px-4 py-2 rounded-lg bg-blue-700 text-white hover:bg-blue-800">Save Changes</button>
            </div>
          </form>
        </Modal>
      )}
      {/* Delete Payment Modal */}
      {deletePayment && (
        <Modal
          open={!!deletePayment}
          onClose={() => setDeletePayment(null)}
          title="Confirm Deletion"
        >
          <p className="text-gray-800 mb-4">Are you sure you want to delete this payment?</p>
          <div className="flex justify-end gap-3">
            <button onClick={() => setDeletePayment(null)} className="px-4 py-2 rounded-lg bg-gray-200 text-gray-800 hover:bg-gray-300">Cancel</button>
            <button onClick={() => {
              setPayments(prev => prev.filter(p => p.id !== deletePayment.id));
              setDeletePayment(null);
            }} className="px-4 py-2 rounded-lg bg-red-700 text-white hover:bg-red-800">Delete</button>
          </div>
        </Modal>
      )}
      </div>
  );
};
import React, { useState, useMemo, useRef, useEffect } from 'react';
import { ColumnDef, getCoreRowModel, getSortedRowModel, getPaginationRowModel, flexRender, useReactTable } from '@tanstack/react-table';
import { SearchIcon, FilterIcon, PlusIcon, EyeIcon, PencilIcon, Trash2Icon, CheckCircle2Icon, AlertCircleIcon, ClockIcon, WrenchIcon, User2Icon, HomeIcon, ArrowLeftIcon, CalendarIcon } from 'lucide-react';
import { Listbox } from '@headlessui/react';

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
        <button type="button" onClick={onClose} className="absolute top-6 right-8 bg-gray-200 hover:bg-gray-300 text-gray-800 px-3 py-1 rounded transition-all cursor-pointer z-10" aria-label="Close">Close</button>
        <h2 className="text-2xl font-extrabold mb-6 text-green-800 text-center tracking-wide leading-tight drop-shadow-sm font-sans">{title}</h2>
        <div className="w-full flex flex-col gap-6 text-base text-gray-800 font-sans">
          {children}
        </div>
      </div>
    </div>
  );
};

  // Initial placeholder (will load from API)
  const maintenanceRequests = [{
    id: 1,
    title: 'Water Leak in Kitchen',
    property: 'Westlands Apartment 3B',
    tenant: 'John Mwangi',
    dateReported: '2023-09-28',
    description: 'There is a water leak under the kitchen sink that is causing water damage to the cabinet.',
    priority: 'high',
    status: 'pending'
  }, {
    id: 2,
    title: 'AC Not Working',
    property: 'Kilimani Townhouse 7',
    tenant: 'Sarah Ochieng',
    dateReported: '2023-09-25',
    description: 'The air conditioning unit in the living room is not cooling properly.',
    priority: 'medium',
    status: 'in_progress'
  }, {
    id: 3,
    title: 'Broken Window',
    property: 'Lavington House 12',
    tenant: 'David Kimani',
    dateReported: '2023-09-20',
    description: 'The window in the master bedroom has a crack and needs to be replaced.',
    priority: 'medium',
    status: 'completed'
  }, {
    id: 4,
    title: 'Bathroom Tiles Loose',
    property: 'Karen Cottage 2',
    tenant: 'Mary Njeri',
    dateReported: '2023-09-15',
    description: 'Several tiles in the bathroom are becoming loose and need to be reattached.',
    priority: 'low',
    status: 'completed'
  }, {
    id: 5,
    title: 'Roof Leaking',
    property: 'Mombasa Beach Villa',
    tenant: 'James Omondi',
    dateReported: '2023-10-01',
    description: 'During the recent rain, water started leaking from the roof in the living room.',
    priority: 'high',
    status: 'pending'
  }];

const statusColors: { [key: string]: string } = {
  pending: 'bg-yellow-100 text-yellow-800',
  in_progress: 'bg-blue-100 text-blue-800',
  completed: 'bg-green-100 text-green-800',
};
const statusIcons: { [key: string]: React.ReactNode } = {
  pending: <ClockIcon size={16} className="text-yellow-500 mr-1" />,
  in_progress: <WrenchIcon size={16} className="text-blue-500 mr-1" />,
  completed: <CheckCircle2Icon size={16} className="text-green-500 mr-1" />,
};
const priorityColors: { [key: string]: string } = {
  high: 'bg-red-100 text-red-800',
  medium: 'bg-orange-100 text-orange-800',
  low: 'bg-blue-100 text-blue-800',
};
const priorityIcons: { [key: string]: React.ReactNode } = {
  high: <AlertCircleIcon size={16} className="text-red-500 mr-1" />,
  medium: <ClockIcon size={16} className="text-orange-500 mr-1" />,
  low: <CheckCircle2Icon size={16} className="text-blue-500 mr-1" />,
};

// Types for landlord view
type UnitOption = { id: number; label: string };

export const Maintenance = () => {
  const [searchTerm, setSearchTerm] = useState('');
  const [filterStatus, setFilterStatus] = useState('all');
  const [filterPriority, setFilterPriority] = useState('all');
  const [requests, setRequests] = useState(maintenanceRequests);
  const [viewRequest, setViewRequest] = useState<any>(null);
  const [editRequest, setEditRequest] = useState<any>(null);
  const [deleteRequest, setDeleteRequest] = useState<any>(null);
  const [addModalOpen, setAddModalOpen] = useState(false);
  const [sortBy, setSortBy] = useState<'title' | 'property' | 'tenant' | 'priority' | 'status' | 'dateReported'>('dateReported');
  const [sortDir, setSortDir] = useState<'asc' | 'desc'>('desc');
  const [page, setPage] = useState(1);
  const pageSize = 5;
  const [units, setUnits] = useState<UnitOption[]>([]);
  const [selectedUnitId, setSelectedUnitId] = useState<number | null>(null);
  const [newTitle, setNewTitle] = useState('');
  const [newDescription, setNewDescription] = useState('');
  const [newPriority, setNewPriority] = useState<'high' | 'medium' | 'low'>('medium');
  const [submitting, setSubmitting] = useState(false);
  const [editPriority, setEditPriority] = useState<'high' | 'medium' | 'low'>('medium');
  const [editStatus, setEditStatus] = useState<'pending' | 'in_progress' | 'completed'>('pending');

  // Load landlord/admin requests and units
  useEffect(() => {
    const token = localStorage.getItem('token');
    if (!token) return;
    (async () => {
      try {
        const [reqRes, unitsRes] = await Promise.all([
          fetch('/api/maintenance', { headers: { Authorization: `Bearer ${token}` } }),
          fetch('/api/maintenance/units', { headers: { Authorization: `Bearer ${token}` } }),
        ]);
        if (reqRes.ok) {
          const data = await reqRes.json();
          const mapped = (data.requests || []).map((r: any) => ({
            id: r.id,
            title: r.title,
            property: r.unit?.floor?.property?.name ? `${r.unit.floor.property.name} ${r.unit.number ?? ''}` : r.unit?.number ?? 'Unit',
            tenant: r.tenant?.name || '',
            dateReported: new Date(r.dateReported).toISOString().slice(0, 10),
            description: r.description,
            priority: r.priority,
            status: r.status,
          }));
          setRequests(mapped);
        }
        if (unitsRes.ok) {
          const data = await unitsRes.json();
          const opts: UnitOption[] = (data.units || []).map((u: any) => ({ id: u.id, label: `${u.floor?.property?.name || 'Property'} ${u.number}` }));
          setUnits(opts);
        }
      } catch {}
    })();
  }, []);

  // Filtering, sorting, pagination
  const filteredRequests = useMemo(() => {
    let result = requests.filter(request => {
    const matchesSearch = request.title.toLowerCase().includes(searchTerm.toLowerCase()) || request.property.toLowerCase().includes(searchTerm.toLowerCase()) || request.tenant.toLowerCase().includes(searchTerm.toLowerCase());
      let statusMatch = filterStatus === 'all' || request.status === filterStatus;
      let priorityMatch = filterPriority === 'all' || request.priority === filterPriority;
    return matchesSearch && statusMatch && priorityMatch;
  });
    result = result.sort((a, b) => {
      let aVal: any = a[sortBy];
      let bVal: any = b[sortBy];
      if (sortBy === 'priority') {
        const order = { high: 3, medium: 2, low: 1 };
        aVal = order[aVal];
        bVal = order[bVal];
      } else if (sortBy === 'dateReported') {
        aVal = new Date(a.dateReported).getTime();
        bVal = new Date(b.dateReported).getTime();
      } else {
        aVal = aVal.toString().toLowerCase();
        bVal = bVal.toString().toLowerCase();
      }
      if (aVal < bVal) return sortDir === 'asc' ? -1 : 1;
      if (aVal > bVal) return sortDir === 'asc' ? 1 : -1;
      return 0;
    });
    return result;
  }, [requests, searchTerm, filterStatus, filterPriority, sortBy, sortDir]);
  const totalPages = Math.ceil(filteredRequests.length / pageSize);
  const paginatedRequests = filteredRequests.slice((page - 1) * pageSize, page * pageSize);

  // Summary stats
  const totalRequests = requests.length;
  const pendingCount = requests.filter(r => r.status === 'pending').length;
  const inProgressCount = requests.filter(r => r.status === 'in_progress').length;
  const completedCount = requests.filter(r => r.status === 'completed').length;
  const highCount = requests.filter(r => r.priority === 'high').length;
  const mediumCount = requests.filter(r => r.priority === 'medium').length;
  const lowCount = requests.filter(r => r.priority === 'low').length;

  // Table columns
  const columns = useMemo<ColumnDef<any>[]>(() => [
    {
      header: 'Title',
      accessorKey: 'title',
      cell: info => <span className="font-semibold text-gray-800 flex items-center gap-2"><WrenchIcon size={16} className="text-green-500" />{info.getValue() as string}</span>,
    },
    {
      header: 'Property',
      accessorKey: 'property',
      cell: info => <span className="text-gray-600 flex items-center gap-2"><HomeIcon size={15} className="text-green-400" />{info.getValue() as string}</span>,
    },
    {
      header: 'Tenant',
      accessorKey: 'tenant',
      cell: info => <span className="text-gray-600 flex items-center gap-2"><User2Icon size={15} className="text-blue-400" />{info.getValue() as string}</span>,
    },
    {
      header: 'Date Reported',
      accessorKey: 'dateReported',
      cell: info => <span className="text-gray-600 flex items-center gap-2"><CalendarIcon size={15} className="text-gray-400" />{info.getValue() as string}</span>,
    },
    {
      header: 'Priority',
      accessorKey: 'priority',
      cell: info => {
        const priority = info.getValue() as string;
        return (
          <span className={`px-2 py-1 text-xs rounded-full font-medium flex items-center gap-1 ${priorityColors[priority] || ''}`}>{priorityIcons[priority] || null}{priority.charAt(0).toUpperCase() + priority.slice(1)}</span>
        );
      },
    },
    {
      header: 'Status',
      accessorKey: 'status',
      cell: info => {
        const status = info.getValue() as string;
        return (
          <span className={`px-2 py-1 text-xs rounded-full font-medium flex items-center gap-1 ${statusColors[status] || ''}`}>{statusIcons[status] || null}{status === 'in_progress' ? 'In Progress' : status.charAt(0).toUpperCase() + status.slice(1)}</span>
        );
      },
    },
    {
      header: 'Actions',
      id: 'actions',
      cell: info => (
        <div className="flex gap-2">
          <button className="p-2 rounded-lg hover:bg-green-100 transition-colors flex items-center gap-1 text-green-700 font-semibold shadow-sm" title="View" onClick={e => { e.stopPropagation(); setViewRequest(info.row.original); }}>
            <EyeIcon size={16} /> View
          </button>
          <button className="p-2 rounded-lg hover:bg-blue-100 transition-colors flex items-center gap-1 text-blue-700 font-semibold shadow-sm" title="Edit" onClick={e => { e.stopPropagation(); setEditPriority(info.row.original.priority); setEditStatus(info.row.original.status); setEditRequest(info.row.original); }}>
            <PencilIcon size={16} /> Edit
          </button>
          {/* Assign button removed */}
              <button className="p-2 rounded-lg hover:bg-red-100 transition-colors flex items-center gap-1 text-red-700 font-semibold shadow-sm" title="Delete" onClick={e => { e.stopPropagation(); setDeleteRequest(info.row.original); }}>
            <Trash2Icon size={16} /> Delete
          </button>
        </div>
      ),
      enableSorting: false,
    },
  ], []);

  // Table setup
  const tableData = useMemo(() => paginatedRequests, [paginatedRequests]);
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

  return (
    <div>
      {/* Summary cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
        <div className="bg-white rounded-lg p-6 shadow-sm border border-gray-100 flex flex-col items-center transition-all duration-200 hover:scale-105 hover:shadow-2xl cursor-pointer" style={{ boxShadow: '0 2px 8px 0 rgba(34,197,94,0.08)' }}>
          <div className="p-3 rounded-lg bg-green-50 text-green-700 mb-2"><WrenchIcon size={22} /></div>
          <div className="text-2xl font-bold text-gray-800">{totalRequests}</div>
          <div className="text-sm text-gray-500">Total Requests</div>
        </div>
        <div className="bg-white rounded-lg p-6 shadow-sm border border-gray-100 flex flex-col items-center transition-all duration-200 hover:scale-105 hover:shadow-2xl cursor-pointer" style={{ boxShadow: '0 2px 8px 0 rgba(34,197,94,0.08)' }}>
          <div className="p-3 rounded-lg bg-yellow-50 text-yellow-700 mb-2"><ClockIcon size={22} /></div>
          <div className="text-2xl font-bold text-yellow-700">{pendingCount}</div>
          <div className="text-sm text-gray-500">Pending</div>
        </div>
        <div className="bg-white rounded-lg p-6 shadow-sm border border-gray-100 flex flex-col items-center transition-all duration-200 hover:scale-105 hover:shadow-2xl cursor-pointer" style={{ boxShadow: '0 2px 8px 0 rgba(34,197,94,0.08)' }}>
          <div className="p-3 rounded-lg bg-blue-50 text-blue-700 mb-2"><WrenchIcon size={22} /></div>
          <div className="text-2xl font-bold text-blue-700">{inProgressCount}</div>
          <div className="text-sm text-gray-500">In Progress</div>
        </div>
        <div className="bg-white rounded-lg p-6 shadow-sm border border-gray-100 flex flex-col items-center transition-all duration-200 hover:scale-105 hover:shadow-2xl cursor-pointer" style={{ boxShadow: '0 2px 8px 0 rgba(34,197,94,0.08)' }}>
          <div className="p-3 rounded-lg bg-green-50 text-green-700 mb-2"><CheckCircle2Icon size={22} /></div>
          <div className="text-2xl font-bold text-green-700">{completedCount}</div>
          <div className="text-sm text-gray-500">Completed</div>
        </div>
      </div>
      {/* Controls */}
      <div className="flex flex-col md:flex-row md:items-center justify-between mb-6 gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-800">Maintenance</h1>
          <p className="text-gray-600">Track and manage maintenance requests</p>
        </div>
        <div className="flex flex-col md:flex-row gap-2 md:items-center">
          <button className="bg-green-700 hover:bg-green-800 text-white py-2 px-4 rounded-lg flex items-center shadow self-start md:self-auto" onClick={() => setAddModalOpen(true)}>
          <PlusIcon size={18} className="mr-2" />
          New Request
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
                onClick={() => setViewRequest(row.original)}
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
      {/* Modals */}
      <Modal
        open={!!viewRequest}
        onClose={() => setViewRequest(null)}
        title="View Maintenance Request"
      >
        {viewRequest && (
          <div>
            <h3 className="text-xl font-bold text-gray-800 mb-2">{viewRequest.title}</h3>
            <p className="text-gray-700 mb-4">
              <span className="font-semibold text-gray-800">Description:</span> {viewRequest.description}
            </p>
            <p className="text-gray-700 mb-4">
              <span className="font-semibold text-gray-800">Property:</span> {viewRequest.property}
            </p>
            <p className="text-gray-700 mb-4">
              <span className="font-semibold text-gray-800">Tenant:</span> {viewRequest.tenant}
            </p>
            <p className="text-gray-700 mb-4">
              <span className="font-semibold text-gray-800">Date Reported:</span> {viewRequest.dateReported}
            </p>
            <p className="text-gray-700 mb-4">
              <span className="font-semibold text-gray-800">Priority:</span> {viewRequest.priority.charAt(0).toUpperCase() + viewRequest.priority.slice(1)}
            </p>
            <p className="text-gray-700 mb-4">
              <span className="font-semibold text-gray-800">Status:</span> {viewRequest.status.charAt(0).toUpperCase() + viewRequest.status.slice(1)}
            </p>
          </div>
        )}
      </Modal>
      <Modal
        open={!!editRequest}
        onClose={() => setEditRequest(null)}
        title="Edit Maintenance Request"
      >
        {editRequest && (
          <form className="flex flex-col gap-4" onSubmit={async (e) => {
            e.preventDefault();
            const token = localStorage.getItem('token');
            if (!token) return;
            const res = await fetch(`/api/maintenance/${editRequest.id}`, {
              method: 'PATCH',
              headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
              body: JSON.stringify({ priority: editPriority, status: editStatus }),
            });
            if (res.ok) {
              setRequests(prev => prev.map(r => r.id === editRequest.id ? { ...r, priority: editPriority, status: editStatus } : r));
              setEditRequest(null);
            }
          }}>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Title</label>
              <div className="w-full px-3 py-2 border border-gray-100 rounded-lg bg-gray-100 text-gray-700">{editRequest.title}</div>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Description</label>
              <div className="w-full px-3 py-2 border border-gray-100 rounded-lg bg-gray-100 text-gray-700">{editRequest.description}</div>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Property</label>
              <div className="w-full px-3 py-2 border border-gray-100 rounded-lg bg-gray-100 text-gray-700">{editRequest.property}</div>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Tenant</label>
              <div className="w-full px-3 py-2 border border-gray-100 rounded-lg bg-gray-100 text-gray-700">{editRequest.tenant}</div>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Date Reported</label>
              <div className="w-full px-3 py-2 border border-gray-100 rounded-lg bg-gray-100 text-gray-700">{editRequest.dateReported}</div>
            </div>
            <div>
              <label htmlFor="editPriority" className="block text-sm font-medium text-gray-700 mb-1">Priority</label>
              <select id="editPriority" value={editPriority} onChange={e => setEditPriority(e.target.value as any)} className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-transparent">
                <option value="high">High</option>
                <option value="medium">Medium</option>
                <option value="low">Low</option>
              </select>
            </div>
            <div>
              <label htmlFor="editStatus" className="block text-sm font-medium text-gray-700 mb-1">Status</label>
              <select id="editStatus" value={editStatus} onChange={e => setEditStatus(e.target.value as any)} className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-transparent">
                <option value="pending">Pending</option>
                <option value="in_progress">In Progress</option>
                <option value="completed">Completed</option>
              </select>
          </div>
            <button type="submit" className="bg-green-700 hover:bg-green-800 text-white py-2 px-4 rounded-lg flex items-center justify-center gap-2">
              <PencilIcon size={16} /> Save Changes
            </button>
          </form>
        )}
      </Modal>
      <Modal
        open={!!deleteRequest}
        onClose={() => setDeleteRequest(null)}
        title="Confirm Deletion"
      >
        {deleteRequest && (
          <div className="text-center">
            <p className="text-gray-700 mb-4">Are you sure you want to delete this maintenance request?</p>
            <div className="flex justify-center gap-4">
              <button onClick={() => { setDeleteRequest(null); }} className="px-4 py-2 bg-gray-200 rounded-lg text-gray-800 text-sm hover:bg-gray-300">Cancel</button>
              <button onClick={async () => {
                const token = localStorage.getItem('token');
                if (!token) return;
                const id = deleteRequest.id;
                const res = await fetch(`/api/maintenance/${id}` , { method: 'DELETE', headers: { Authorization: `Bearer ${token}` } });
                if (res.status === 204) {
                  setRequests(prev => prev.filter(r => r.id !== id));
                  setDeleteRequest(null);
                }
              }} className="px-4 py-2 bg-red-700 rounded-lg text-white text-sm hover:bg-red-800">Delete</button>
            </div>
          </div>
        )}
      </Modal>
      <Modal
        open={addModalOpen}
        onClose={() => setAddModalOpen(false)}
        title="New Maintenance Request"
      >
        <form className="flex flex-col gap-4" onSubmit={async (e) => {
          e.preventDefault();
          if (!newTitle || !newDescription) return;
          const token = localStorage.getItem('token');
          if (!token) return;
          setSubmitting(true);
          try {
            const res = await fetch('/api/maintenance', {
              method: 'POST',
              headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
              body: JSON.stringify({ title: newTitle, description: newDescription, priority: newPriority, unitId: selectedUnitId }),
            });
            if (res.ok) {
              const { request } = await res.json();
              const mapped = {
                id: request.id,
                title: request.title,
                property: request.unit?.floor?.property?.name ? `${request.unit.floor.property.name} ${request.unit.number ?? ''}` : (units.find(u => u.id === selectedUnitId!)?.label || 'Unit'),
                tenant: request.tenant?.name || '',
                dateReported: new Date(request.dateReported).toISOString().slice(0, 10),
                description: request.description,
                priority: request.priority,
                status: request.status,
              };
              setRequests(prev => [mapped, ...prev]);
              setAddModalOpen(false);
              setNewTitle('');
              setNewDescription('');
              setNewPriority('medium');
              setSelectedUnitId(null);
            }
          } finally {
            setSubmitting(false);
          }
        }}>
          <div>
            <label htmlFor="newTitle" className="block text-sm font-medium text-gray-700 mb-1">Title</label>
            <input value={newTitle} onChange={e => setNewTitle(e.target.value)} type="text" id="newTitle" className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-transparent" />
          </div>
          <div>
            <label htmlFor="newDescription" className="block text-sm font-medium text-gray-700 mb-1">Description</label>
            <textarea value={newDescription} onChange={e => setNewDescription(e.target.value)} id="newDescription" className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-transparent" rows={4} />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Property/Unit</label>
            <Listbox value={selectedUnitId} onChange={setSelectedUnitId}>
              <div className="relative mt-1">
                <Listbox.Button className="w-full border rounded-lg px-3 py-2 text-left">
                  {selectedUnitId ? (units.find(u => u.id === selectedUnitId)?.label) : <span className="text-gray-400">Select property/unit...</span>}
                </Listbox.Button>
                <Listbox.Options className="absolute z-10 mt-1 w-full bg-white border border-green-100 rounded-lg shadow-lg max-h-60 overflow-auto focus:outline-none">
                  {units.map(unit => (
                    <Listbox.Option key={unit.id} value={unit.id} className={({ active, selected }) => `px-4 py-2 cursor-pointer ${active ? 'bg-green-100' : ''} ${selected ? 'font-bold' : ''}`}>{unit.label}</Listbox.Option>
                  ))}
                </Listbox.Options>
              </div>
            </Listbox>
          </div>
          <div>
            <label htmlFor="newDateReported" className="block text-sm font-medium text-gray-700 mb-1">Date Reported</label>
            <input type="date" id="newDateReported" className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-transparent" value={new Date().toISOString().slice(0,10)} readOnly />
          </div>
          <div>
            <label htmlFor="newPriority" className="block text-sm font-medium text-gray-700 mb-1">Priority</label>
            <select value={newPriority} onChange={e => setNewPriority(e.target.value as any)} id="newPriority" className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-transparent">
              <option value="high">High</option>
              <option value="medium">Medium</option>
              <option value="low">Low</option>
            </select>
          </div>
          <button disabled={submitting || !selectedUnitId} type="submit" className="bg-green-700 hover:bg-green-800 text-white py-2 px-4 rounded-lg flex items-center justify-center gap-2 disabled:opacity-50">
            <PlusIcon size={16} /> {submitting ? 'Submitting...' : 'Add Request'}
          </button>
        </form>
      </Modal>
                </div>
  );
};
import React, { useState, useMemo, useRef, useEffect } from 'react';
import { ColumnDef, getCoreRowModel, getSortedRowModel, getPaginationRowModel, flexRender, useReactTable } from '@tanstack/react-table';
import { SearchIcon, PlusIcon, EyeIcon, PencilIcon, CheckCircle2Icon, AlertCircleIcon, ClockIcon, WrenchIcon, User2Icon, HomeIcon, CalendarIcon, XIcon } from 'lucide-react';

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

type MyUnitInfo = { propertyName: string; unitLabel: string } | null;

export const TenantMaintenance = () => {
  const [searchTerm, setSearchTerm] = useState('');
  const [filterStatus, setFilterStatus] = useState('all');
  const [filterPriority, setFilterPriority] = useState('all');
  const [requests, setRequests] = useState<any[]>([]);
  const [viewRequest, setViewRequest] = useState<any>(null);
  const [editRequest, setEditRequest] = useState<any>(null);
  const [addModalOpen, setAddModalOpen] = useState(false);
  const [sortBy, setSortBy] = useState<'title' | 'property' | 'tenant' | 'priority' | 'status' | 'dateReported'>('dateReported');
  const [sortDir, setSortDir] = useState<'asc' | 'desc'>('desc');
  const [page, setPage] = useState(1);
  const pageSize = 5;
  const [myUnit, setMyUnit] = useState<MyUnitInfo>(null);
  const [newTitle, setNewTitle] = useState('');
  const [newDescription, setNewDescription] = useState('');
  const [newPriority, setNewPriority] = useState<'high' | 'medium' | 'low'>('medium');
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    const token = localStorage.getItem('token');
    if (!token) return;
    (async () => {
      try {
        const res = await fetch('/api/maintenance/my', { headers: { Authorization: `Bearer ${token}` } });
        if (res.ok) {
          const data = await res.json();
          const mapped = (data.requests || []).map((r: any) => ({
            id: r.id,
            title: r.title,
            property: r.unit?.floor?.property?.name ? `${r.unit.floor.property.name} ${r.unit.number ?? ''}` : r.unit?.number ?? 'Unit',
            tenant: '',
            dateReported: new Date(r.dateReported).toISOString().slice(0, 10),
            description: r.description,
            priority: r.priority,
            status: r.status,
          }));
          setRequests(mapped);
          if (data.requests && data.requests[0]?.unit?.floor?.property?.name) {
            setMyUnit({ propertyName: data.requests[0].unit.floor.property.name, unitLabel: data.requests[0].unit.number ?? '' });
          }
        }
      } catch {}
    })();
  }, []);

  const filteredRequests = useMemo(() => {
    let result = requests.filter(request => {
      const matchesSearch = request.title.toLowerCase().includes(searchTerm.toLowerCase()) || request.property.toLowerCase().includes(searchTerm.toLowerCase());
      let statusMatch = filterStatus === 'all' || request.status === filterStatus;
      let priorityMatch = filterPriority === 'all' || request.priority === filterPriority;
      return matchesSearch && statusMatch && priorityMatch;
    });
    result = result.sort((a, b) => {
      let aVal: any = a[sortBy];
      let bVal: any = b[sortBy];
      if (sortBy === 'priority') {
        const order = { high: 3, medium: 2, low: 1 } as any;
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

  const totalRequests = requests.length;
  const pendingCount = requests.filter(r => r.status === 'pending').length;
  const inProgressCount = requests.filter(r => r.status === 'in_progress').length;
  const completedCount = requests.filter(r => r.status === 'completed').length;

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
      cell: info => {
        const status = info.row.original.status as string;
        return (
          <div className="flex gap-2">
            <button className="p-2 rounded-lg hover:bg-green-100 transition-colors flex items-center gap-1 text-green-700 font-semibold shadow-sm" title="View" onClick={e => { e.stopPropagation(); setViewRequest(info.row.original); }}>
              <EyeIcon size={16} /> View
            </button>
            {status === 'pending' ? (
              <button className="p-2 rounded-lg hover:bg-blue-100 transition-colors flex items-center gap-1 text-blue-700 font-semibold shadow-sm" title="Edit" onClick={e => { e.stopPropagation(); setEditRequest(info.row.original); }}>
                <PencilIcon size={16} /> Edit
              </button>
            ) : (
              <span className="px-2 py-2 text-sm text-gray-400">Locked</span>
            )}
          </div>
        );
      },
      enableSorting: false,
    },
  ], []);

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
      <div className="flex flex-col md:flex-row md:items-center justify-between mb-6 gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-800">Maintenance</h1>
          <p className="text-gray-600">Create and track your maintenance requests</p>
        </div>
        <div className="flex flex-col md:flex-row gap-2 md:items-center">
          <button className="bg-green-700 hover:bg-green-800 text-white py-2 px-4 rounded-lg flex items-center shadow self-start md:self-auto" onClick={() => setAddModalOpen(true)}>
            <PlusIcon size={18} className="mr-2" />
            New Request
          </button>
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
            const descriptionEl = document.getElementById('editDescription') as HTMLTextAreaElement | null;
            const newDesc = descriptionEl?.value?.trim();
            if (!newDesc) return;
            const res = await fetch(`/api/maintenance/${editRequest.id}`, {
              method: 'PATCH',
              headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
              body: JSON.stringify({ description: newDesc }),
            });
            if (res.ok) {
              setRequests(prev => prev.map(r => r.id === editRequest.id ? { ...r, description: newDesc } : r));
              setEditRequest(null);
            }
          }}>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Title</label>
              <div className="w-full px-3 py-2 border border-gray-100 rounded-lg bg-gray-100 text-gray-700">{editRequest.title}</div>
            </div>
            <div>
              <label htmlFor="editDescription" className="block text-sm font-medium text-gray-700 mb-1">Description</label>
              <textarea id="editDescription" defaultValue={editRequest.description} className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-transparent" rows={4} />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Property</label>
              <div className="w-full px-3 py-2 border border-gray-100 rounded-lg bg-gray-100 text-gray-700">{editRequest.property}</div>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Date Reported</label>
              <div className="w-full px-3 py-2 border border-gray-100 rounded-lg bg-gray-100 text-gray-700">{editRequest.dateReported}</div>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Priority</label>
              <div className="w-full px-3 py-2 border border-gray-100 rounded-lg bg-gray-100 text-gray-700 capitalize">{editRequest.priority}</div>
            </div>
            <button type="submit" className="bg-green-700 hover:bg-green-800 text-white py-2 px-4 rounded-lg flex items-center justify-center gap-2">
              <PencilIcon size={16} /> Save Changes
            </button>
          </form>
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
              body: JSON.stringify({ title: newTitle, description: newDescription, priority: newPriority }),
            });
            if (res.ok) {
              const { request } = await res.json();
              const mapped = {
                id: request.id,
                title: request.title,
                property: request.unit?.number ? `${request.unit.number}` : 'Unit',
                tenant: '',
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
          {myUnit && (
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Unit</label>
              <input className="w-full px-3 py-2 border border-gray-100 rounded-lg bg-gray-100 text-gray-700" value={`${myUnit.propertyName} ${myUnit.unitLabel}`} readOnly />
            </div>
          )}
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
          <button disabled={submitting} type="submit" className="bg-green-700 hover:bg-green-800 text-white py-2 px-4 rounded-lg flex items-center justify-center gap-2 disabled:opacity-50">
            <PlusIcon size={16} /> {submitting ? 'Submitting...' : 'Add Request'}
          </button>
        </form>
      </Modal>
    </div>
  );
};

export default TenantMaintenance;



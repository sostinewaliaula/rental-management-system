import React, { useEffect, useMemo, useRef, useState } from 'react';
import { ColumnDef, getCoreRowModel, getPaginationRowModel, getSortedRowModel, flexRender, useReactTable } from '@tanstack/react-table';
import { BanknoteIcon, CalendarIcon, CheckCircle2Icon, ClockIcon, AlertCircleIcon, HomeIcon } from 'lucide-react';
import { useAuth } from '../auth/AuthContext';

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
    const handleKeyDown = (e: KeyboardEvent) => { if (e.key === 'Escape') onClose(); };
    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [open, onClose]);
  const handleBackdropClick = (e: React.MouseEvent<HTMLDivElement>) => {
    if (modalRef.current && e.target === modalRef.current) onClose();
  };
  if (!open) return null;
  return (
    <div ref={modalRef} className="fixed inset-0 z-50 flex items-center justify-center bg-black/30 px-2" onClick={handleBackdropClick}>
      <div className="bg-white rounded-3xl shadow-2xl p-6 w-[90vw] max-w-2xl relative animate-fadeIn border border-green-100">
        <button type="button" onClick={onClose} className="absolute top-6 right-8 bg-gray-200 hover:bg-gray-300 text-gray-800 px-3 py-1 rounded cursor-pointer z-10" aria-label="Close">Close</button>
        <h2 className="text-2xl font-extrabold mb-6 text-green-800 text-center">{title}</h2>
        <div className="w-full flex flex-col gap-6 text-base text-gray-800">
          {children}
        </div>
      </div>
    </div>
  );
};

const months = [ 'January','February','March','April','May','June','July','August','September','October','November','December' ];
const statusColors: { [k: string]: string } = { completed: 'bg-green-100 text-green-800', pending: 'bg-yellow-100 text-yellow-800', overdue: 'bg-red-100 text-red-800' };
const statusIcons: { [k: string]: React.ReactNode } = { completed: <CheckCircle2Icon size={16} className="text-green-500 mr-1" />, pending: <ClockIcon size={16} className="text-yellow-500 mr-1" />, overdue: <AlertCircleIcon size={16} className="text-red-500 mr-1" /> };

export const TenantPayments: React.FC = () => {
  const { token } = useAuth();
  const [payments, setPayments] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [paying, setPaying] = useState(false);
  const [page, setPage] = useState(1);
  const pageSize = 6;

  useEffect(() => {
    let active = true;
    const load = async () => {
      setLoading(true);
      try {
        const res = await fetch('/api/payments/my', { headers: { Authorization: `Bearer ${token}` } });
        const data = await res.json();
        if (active) setPayments(data.payments || []);
      } finally {
        if (active) setLoading(false);
      }
    };
    load();
    return () => { active = false; };
  }, [token]);

  const now = new Date();
  const currentMonth = now.getMonth() + 1;
  const currentYear = now.getFullYear();
  const currentPayment = payments.find(p => p.month === currentMonth && p.year === currentYear);
  const canPayNow = !currentPayment || currentPayment.status !== 'completed';

  const totalPaid = payments.filter(p => p.status === 'completed').reduce((s, p) => s + p.amount, 0);
  const completedCount = payments.filter(p => p.status === 'completed').length;
  const pendingCount = payments.filter(p => p.status === 'pending').length;
  const overdueCount = payments.filter(p => p.status === 'overdue').length;

  const columns = useMemo<ColumnDef<any>[]>(() => [
    {
      header: 'Property/Unit',
      accessorKey: 'unitId',
      cell: info => {
        const unit = (info.row.original.unit || {}) as any;
        const label = unit ? `${(unit.floor?.property?.name || unit.property || '')} ${unit.number || ''}` : '-';
        return <span className="text-gray-700 flex items-center gap-2"><HomeIcon size={15} className="text-green-400" />{label}</span>;
      },
    },
    {
      header: 'Month', accessorKey: 'month', cell: info => <span className="text-gray-700 flex items-center gap-2"><CalendarIcon size={15} className="text-gray-400" />{months[(info.getValue() as number)-1]} {info.row.original.year}</span>
    },
    {
      header: 'Amount', accessorKey: 'amount', cell: info => <span className="text-purple-700 font-semibold flex items-center gap-2"><BanknoteIcon size={15} className="text-purple-400" />KES {(info.getValue() as number).toLocaleString()}</span>
    },
    {
      header: 'Status', accessorKey: 'status', cell: info => { const s = info.getValue() as string; return <span className={`px-2 py-1 text-xs rounded-full font-medium flex items-center gap-1 ${statusColors[s] || ''}`}>{statusIcons[s] || null}{s.charAt(0).toUpperCase() + s.slice(1)}</span>; }
    },
  ], []);

  const tableData = useMemo(() => payments, [payments]);
  const table = useReactTable({
    data: tableData,
    columns,
    state: { sorting: [{ id: 'month', desc: true }], pagination: { pageIndex: page - 1, pageSize } },
    getCoreRowModel: getCoreRowModel(),
    getSortedRowModel: getSortedRowModel(),
    getPaginationRowModel: getPaginationRowModel(),
  });

  const handlePayNow = async () => {
    if (!canPayNow) return;
    setPaying(true);
    try {
      const res = await fetch('/api/payments', { method: 'POST', headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` }, body: JSON.stringify({ month: currentMonth, year: currentYear, method: 'M-Pesa' }) });
      const data = await res.json();
      if (res.ok) {
        // Refresh list
        setPayments(prev => {
          const existsIdx = prev.findIndex(p => p.id === data.payment.id);
          if (existsIdx >= 0) {
            const copy = prev.slice(); copy[existsIdx] = data.payment; return copy;
          }
          return [data.payment, ...prev];
        });
      }
    } finally {
      setPaying(false);
    }
  };

  return (
    <div>
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
        <div className="bg-white rounded-lg p-6 shadow-sm border border-gray-100 flex flex-col items-center"><div className="p-3 rounded-lg bg-green-50 text-green-700 mb-2"><BanknoteIcon size={22} /></div><div className="text-2xl font-bold text-gray-800">KES {totalPaid.toLocaleString()}</div><div className="text-sm text-gray-500">Total Paid</div></div>
        <div className="bg-white rounded-lg p-6 shadow-sm border border-gray-100 flex flex-col items-center"><div className="p-3 rounded-lg bg-blue-50 text-blue-700 mb-2"><CheckCircle2Icon size={22} /></div><div className="text-2xl font-bold text-blue-700">{completedCount}</div><div className="text-sm text-gray-500">Completed</div></div>
        <div className="bg-white rounded-lg p-6 shadow-sm border border-gray-100 flex flex-col items-center"><div className="p-3 rounded-lg bg-yellow-50 text-yellow-700 mb-2"><ClockIcon size={22} /></div><div className="text-2xl font-bold text-yellow-700">{pendingCount}</div><div className="text-sm text-gray-500">Pending</div></div>
        <div className="bg-white rounded-lg p-6 shadow-sm border border-gray-100 flex flex-col items-center"><div className="p-3 rounded-lg bg-red-50 text-red-700 mb-2"><AlertCircleIcon size={22} /></div><div className="text-2xl font-bold text-red-700">{overdueCount}</div><div className="text-sm text-gray-500">Overdue</div></div>
      </div>
      <div className="flex justify-between items-center mb-4">
        <h1 className="text-2xl font-bold text-gray-800">My Payments</h1>
        <button disabled={!canPayNow || paying} onClick={handlePayNow} className={`px-4 py-2 rounded-lg text-white ${canPayNow ? 'bg-green-700 hover:bg-green-800' : 'bg-gray-300'} ${paying ? 'opacity-70' : ''}`}>
          {canPayNow ? `Pay Now (${months[currentMonth-1]} ${currentYear})` : 'Paid for this month'}
        </button>
      </div>
      <div className="bg-white rounded-2xl shadow-lg border border-green-100 overflow-x-auto mt-4">
        <table className="min-w-full text-sm rounded-2xl overflow-hidden">
          <thead>
            {table.getHeaderGroups().map(hg => (
              <tr key={hg.id} className="sticky top-0 z-10 bg-green-50/90 backdrop-blur rounded-t-2xl shadow-md">
                {hg.headers.map(h => (
                  <th key={h.id} className="py-3 pr-4 pl-4 text-left font-bold text-green-700 text-base">{flexRender(h.column.columnDef.header, h.getContext())}</th>
                ))}
              </tr>
            ))}
          </thead>
          <tbody>
            {table.getRowModel().rows.map((row, idx) => (
              <tr key={row.id} className={`border-b last:border-0 ${idx % 2 === 0 ? 'bg-white' : 'bg-green-50/60'}`}>
                {row.getVisibleCells().map(cell => (
                  <td key={cell.id} className="py-3 pr-4 pl-4">{flexRender(cell.column.columnDef.cell, cell.getContext())}</td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
        <div className="flex justify-between items-center p-4">
          <span className="text-sm text-gray-600">Page {page}</span>
          <div className="flex gap-2">
            <button disabled={page === 1} onClick={() => setPage(page - 1)} className="px-3 py-1 rounded-lg border border-gray-300 bg-white hover:bg-green-50 disabled:opacity-50">Prev</button>
            <button onClick={() => setPage(page + 1)} className="px-3 py-1 rounded-lg border border-gray-300 bg-white hover:bg-green-50">Next</button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default TenantPayments;



/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useMemo, useState, useEffect, useCallback, useRef } from 'react';
import {
  LayoutDashboardIcon,
  PlusIcon,
  DownloadIcon,
  LogOutIcon,
  SearchIcon,
  ArrowUpDownIcon,
  FileIcon,
  CheckCircle2Icon,
  AlertCircleIcon,
  DatabaseIcon,
  ActivityIcon,
  FolderOpenIcon,
  ArrowLeftIcon,
  FileTextIcon,
  BarChart3Icon,
  MailIcon,
  TrashIcon,
  EyeIcon,
  UploadIcon,
  XIcon,
  RefreshCwIcon,
  FileSpreadsheetIcon,
  ChevronLeftIcon,
  ChevronRightIcon,
} from 'lucide-react';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
} from 'recharts';
import { motion, AnimatePresence } from 'motion/react';

// --- Utility ---
function cn(...classes: (string | boolean | undefined | null)[]): string {
  return classes.filter(Boolean).join(' ');
}

// --- Types ---
interface VendorRow {
  name: string;
  totalFiles: number;
  correctFiles: number;
  wrongFiles: number;
  totalDataCount: number;
  correctDataCount: number;
  wrongDataCount: number;
  fileRatio: number;
}

interface FileDetail {
  id: string;
  dbId: number;
  name: string;
  date: string;
  status: 'Correct' | 'Wrong';
  dataCount: number;
  filePath?: string;
}

interface PreviewData {
  metadata: any;
  data: Record<string, any>[];
}

// --- Constants ---
const DEFAULT_TREND_DATA = [
  { day: 'MON', count: 0 },
  { day: 'TUE', count: 0 },
  { day: 'WED', count: 0 },
  { day: 'THU', count: 0 },
  { day: 'FRI', count: 0 },
  { day: 'SAT', count: 0 },
  { day: 'SUN', count: 0 },
];

const COLORS = {
  primary: '#005CB9',
  secondary: '#00B5E2',
  accent: '#371963',
  success: '#00A19D',
  warning: '#FFB81C',
  danger: '#E4002B',
  slate: {
    50: '#F8FAFC', 100: '#F1F5F9', 200: '#E2E8F0',
    300: '#CBD5E1', 400: '#94A3B8', 500: '#64748B',
    600: '#475569', 700: '#334155', 800: '#1E293B', 900: '#0F172A',
  },
};

const CHART_GRADIENTS = [
  { id: 'gradient-blue', start: '#005CB9', end: '#004A99' },
  { id: 'gradient-cyan', start: '#00B5E2', end: '#0097BB' },
  { id: 'gradient-indigo', start: '#371963', end: '#2A134D' },
  { id: 'gradient-teal', start: '#00A19D', end: '#008381' },
];

// ============================================================
// SIDEBAR
// ============================================================
const Sidebar = ({ activeTab, onTabChange }: { activeTab: string; onTabChange: (tab: string) => void }) => (
  <div className="w-64 bg-white border-r border-slate-100 flex flex-col min-h-screen sticky top-0 h-screen overflow-y-auto hidden lg:flex">
    <div className="p-8 pb-4 flex items-center gap-3">
      <div className="flex items-center gap-2 cursor-pointer" onClick={() => onTabChange('Overview')}>
        <div className="w-10 h-10 rounded-xl bg-[#005CB9] flex items-center justify-center shadow-lg shadow-blue-100">
          <DatabaseIcon className="text-white" size={20} />
        </div>
        <span className="text-2xl font-bold tracking-tight text-[#0D1E4C]">INCYTE</span>
      </div>
    </div>
    <div className="mt-12 px-6 space-y-1">
      <p className="text-[10px] font-bold text-slate-400 uppercase tracking-[0.2em] px-4 mb-4">Analytics</p>
      <SidebarLink icon={<LayoutDashboardIcon size={18} />} label="Overview" active={activeTab === 'Overview'} onClick={() => onTabChange('Overview')} />
      <SidebarLink icon={<BarChart3Icon size={18} />} label="Performance" active={activeTab === 'Performance'} onClick={() => onTabChange('Performance')} />
    </div>
    <div className="mt-auto p-6">
      <div className="p-4 bg-slate-50 rounded-2xl border border-slate-100">
        <p className="text-[10px] font-bold text-slate-400 uppercase mb-2">Storage</p>
        <div className="h-1.5 w-full bg-slate-200 rounded-full overflow-hidden mb-2">
          <div className="h-full bg-[#00B5E2] rounded-full w-[65%]" />
        </div>
        <p className="text-[10px] font-bold text-slate-600">65% of 10GB used</p>
      </div>
    </div>
  </div>
);

const SidebarLink = ({ icon, label, active, onClick }: { icon: React.ReactNode; label: string; active?: boolean; onClick: () => void }) => (
  <button
    onClick={onClick}
    className={cn(
      'w-full flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-bold transition-all group',
      active ? 'bg-[#005CB9] text-white shadow-lg shadow-blue-200' : 'text-slate-500 hover:bg-slate-50 hover:text-[#005CB9]'
    )}
  >
    <span className={cn('transition-colors', active ? 'text-white' : 'text-slate-300 group-hover:text-[#00B5E2]')}>{icon}</span>
    {label}
  </button>
);

// ============================================================
// HEADER
// ============================================================
const UserHeader = ({ onLogout }: { onLogout: () => void }) => (
  <div className="flex items-center justify-between px-6 lg:px-10 py-5 bg-white border-b border-slate-100 z-20 sticky top-0">
    <div className="flex items-center gap-2 text-slate-400 overflow-hidden">
      <span className="text-[10px] font-bold uppercase tracking-widest hidden sm:inline">Dashboard</span>
      <span className="text-slate-200 hidden sm:inline">/</span>
      <span className="text-[10px] font-bold uppercase tracking-widest text-[#0D1E4C] truncate">Vendor Analytics</span>
    </div>
    <div className="flex items-center gap-4 lg:gap-6">
      <div className="flex items-center gap-4">
        <div className="flex flex-col items-end hidden sm:flex">
          <span className="font-bold text-slate-800 text-sm leading-tight">Admin User</span>
          <span className="text-[10px] text-slate-400 font-bold uppercase tracking-tight">System Administrator</span>
        </div>
        <div className="w-10 h-10 rounded-xl bg-slate-100 text-slate-700 flex items-center justify-center font-bold border border-slate-200 shadow-sm transition-transform hover:scale-105 cursor-pointer">
          A
        </div>
      </div>
      <div className="h-6 w-px bg-slate-200" />
      <button onClick={onLogout} className="p-2 rounded-xl hover:bg-slate-50 text-slate-400 hover:text-red-500 transition-all">
        <LogOutIcon size={18} />
      </button>
    </div>
  </div>
);

// ============================================================
// CHART HELPERS
// ============================================================
const ChartCard = ({ children, title, className }: { children: React.ReactNode; title: string; className?: string }) => (
  <div className={cn('bg-white rounded-[2.5rem] p-10 border border-slate-100 shadow-sm', className)}>
    <h3 className="text-lg font-bold text-[#0D1E4C] mb-1 flex items-center gap-3">
      <span className="w-2 h-2 rounded-full bg-[#005CB9]" />
      {title}
    </h3>
    {children}
  </div>
);

const ProgressItem = ({ label, total, color, perc }: { label: string; total: number; color: string; perc: number }) => (
  <div className="space-y-4">
    <div className="flex justify-between items-end">
      <div className="flex flex-col">
        <span className="text-[10px] font-bold uppercase tracking-[0.2em] text-slate-400 mb-1">{label}</span>
        <div className="flex items-center gap-2">
          <span className="text-2xl font-bold text-[#0D1E4C]">{total.toLocaleString()}</span>
          <span className="text-[10px] font-bold text-slate-300 uppercase">Audit Records</span>
        </div>
      </div>
      <div className="flex flex-col items-end">
        <span className="text-sm font-bold" style={{ color }}>{perc}%</span>
        <span className="text-[10px] font-bold text-slate-300 uppercase">of total set</span>
      </div>
    </div>
    <div className="h-3 w-full bg-slate-100 rounded-full overflow-hidden shadow-inner p-0.5">
      <motion.div
        initial={{ width: 0 }}
        animate={{ width: `${perc}%` }}
        transition={{ duration: 1.5, ease: 'circOut' }}
        className="h-full rounded-full shadow-sm"
        style={{ backgroundColor: color }}
      />
    </div>
  </div>
);

const DetailStat = ({ label, value, icon, color }: { label: string; value: string | number; icon: React.ReactNode; color: string }) => {
  const iconColorMap: Record<string, string> = {
    primary: 'bg-[#005CB9] text-white shadow-blue-100',
    success: 'bg-[#00A19D] text-white shadow-teal-100',
    danger: 'bg-[#E4002B] text-white shadow-rose-100',
    slate: 'bg-[#0D1E4C] text-white shadow-slate-100',
  };
  return (
    <div className="p-8 rounded-3xl bg-white border border-slate-100 shadow-sm hover:shadow-xl hover:translate-y-[-4px] transition-all group">
      <div className="flex items-center justify-between mb-6">
        <div className={cn('w-14 h-14 rounded-2xl flex items-center justify-center shadow-2xl transition-transform group-hover:rotate-12', iconColorMap[color])}>{icon}</div>
        <div className="h-6 w-px bg-slate-100" />
        <div className="w-8 h-8 rounded-full bg-slate-50 flex items-center justify-center">
          <ActivityIcon size={12} className="text-slate-300" />
        </div>
      </div>
      <div>
        <p className="text-[10px] font-bold uppercase tracking-[0.2em] text-slate-400 mb-1">{label}</p>
        <p className="text-3xl font-bold text-[#0D1E4C]">{value}</p>
      </div>
    </div>
  );
};

const TableHead = ({ label, onClick, activeSort }: { label: string; onClick?: () => void; activeSort?: 'asc' | 'desc' | null }) => (
  <th
    className={cn('px-6 lg:px-10 py-6 text-left text-[10px] font-bold tracking-[0.15em] text-slate-400 whitespace-nowrap transition-colors', onClick ? 'cursor-pointer hover:bg-slate-100/80 group' : '')}
    onClick={onClick}
  >
    <div className="flex items-center gap-3">
      {label}
      {onClick && (
        <ArrowUpDownIcon size={12} className={cn('transition-all', activeSort ? 'opacity-100 text-[#005CB9] scale-125' : 'opacity-0 group-hover:opacity-40')} />
      )}
    </div>
  </th>
);

// ============================================================
// PREVIEW MODAL
// ============================================================
const PreviewModal = ({ fileId, fileName, onClose }: { fileId: number; fileName: string; onClose: () => void }) => {
  const [previewData, setPreviewData] = useState<PreviewData | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [page, setPage] = useState(0);
  const PAGE_SIZE = 10;

  useEffect(() => {
    const fetchPreview = async () => {
      try {
        const res = await fetch(`/api/files/${fileId}/data`);
        if (!res.ok) throw new Error('Failed to load preview');
        const data = await res.json();
        setPreviewData(data);
      } catch (err: any) {
        setError(err.message);
      } finally {
        setIsLoading(false);
      }
    };
    fetchPreview();
  }, [fileId]);

  const columns = previewData?.data?.length ? Object.keys(previewData.data[0]) : [];
  const totalPages = Math.ceil((previewData?.data?.length || 0) / PAGE_SIZE);
  const pageData = previewData?.data?.slice(page * PAGE_SIZE, (page + 1) * PAGE_SIZE) || [];

  return (
    <div className="fixed inset-0 z-[150] flex items-center justify-center p-4 bg-[#0D1E4C]/70 backdrop-blur-md">
      <motion.div
        initial={{ opacity: 0, scale: 0.92, y: 20 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.92 }}
        className="bg-white rounded-[2rem] w-full max-w-6xl max-h-[90vh] flex flex-col shadow-2xl border border-slate-200 overflow-hidden"
      >
        {/* Header */}
        <div className="px-8 py-6 border-b border-slate-100 flex items-center justify-between bg-slate-50/40 shrink-0">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 rounded-2xl bg-[#005CB9] flex items-center justify-center shadow-lg shadow-blue-100">
              <FileSpreadsheetIcon size={22} className="text-white" />
            </div>
            <div>
              <h2 className="text-xl font-bold text-[#0D1E4C] uppercase tracking-tight">{fileName}</h2>
              <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mt-0.5">
                {previewData ? `${previewData.data.length} rows · ${columns.length} columns` : 'Loading...'}
              </p>
            </div>
          </div>
          <button onClick={onClose} className="w-10 h-10 rounded-xl border border-slate-200 flex items-center justify-center hover:bg-slate-100 transition-colors text-slate-400 hover:text-slate-700">
            <XIcon size={18} />
          </button>
        </div>

        {/* Body */}
        <div className="flex-1 overflow-auto p-6">
          {isLoading ? (
            <div className="flex items-center justify-center h-48">
              <div className="w-10 h-10 border-4 border-slate-100 border-t-[#005CB9] rounded-full animate-spin" />
            </div>
          ) : error ? (
            <div className="flex items-center justify-center h-48 text-red-500 font-bold text-sm">{error}</div>
          ) : (
            <div className="overflow-x-auto rounded-2xl border border-slate-100">
              <table className="w-full text-sm min-w-max">
                <thead>
                  <tr className="bg-slate-50">
                    {columns.map((col) => (
                      <th key={col} className="px-5 py-4 text-left text-[10px] font-bold uppercase tracking-[0.15em] text-slate-500 whitespace-nowrap border-b border-slate-100">
                        {col}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-50">
                  {pageData.map((row, i) => (
                    <tr key={i} className="hover:bg-slate-50/60 transition-colors">
                      {columns.map((col) => (
                        <td key={col} className="px-5 py-3.5 text-xs font-medium text-slate-700 whitespace-nowrap max-w-xs truncate">
                          {String(row[col] ?? '')}
                        </td>
                      ))}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>

        {/* Pagination Footer */}
        {totalPages > 1 && (
          <div className="px-8 py-5 border-t border-slate-100 flex items-center justify-between bg-slate-50/30 shrink-0">
            <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">
              Page {page + 1} of {totalPages} · {previewData?.data.length} rows
            </p>
            <div className="flex items-center gap-2">
              <button
                onClick={() => setPage((p) => Math.max(0, p - 1))}
                disabled={page === 0}
                className="w-9 h-9 rounded-xl border border-slate-200 flex items-center justify-center text-slate-500 hover:bg-slate-100 disabled:opacity-40 disabled:cursor-not-allowed transition-all"
              >
                <ChevronLeftIcon size={16} />
              </button>
              <button
                onClick={() => setPage((p) => Math.min(totalPages - 1, p + 1))}
                disabled={page === totalPages - 1}
                className="w-9 h-9 rounded-xl border border-slate-200 flex items-center justify-center text-slate-500 hover:bg-slate-100 disabled:opacity-40 disabled:cursor-not-allowed transition-all"
              >
                <ChevronRightIcon size={16} />
              </button>
            </div>
          </div>
        )}
      </motion.div>
    </div>
  );
};

// ============================================================
// DELETE CONFIRM MODAL
// ============================================================
const DeleteConfirmModal = ({ fileName, onConfirm, onCancel, isDeleting }: { fileName: string; onConfirm: () => void; onCancel: () => void; isDeleting: boolean }) => (
  <div className="fixed inset-0 z-[160] flex items-center justify-center p-6 bg-[#0D1E4C]/70 backdrop-blur-md">
    <motion.div
      initial={{ opacity: 0, scale: 0.9 }}
      animate={{ opacity: 1, scale: 1 }}
      exit={{ opacity: 0, scale: 0.9 }}
      className="bg-white rounded-[2rem] w-full max-w-md shadow-2xl border border-slate-200 overflow-hidden"
    >
      <div className="p-10">
        <div className="w-16 h-16 rounded-2xl bg-red-50 flex items-center justify-center mx-auto mb-6">
          <TrashIcon size={28} className="text-[#E4002B]" />
        </div>
        <h2 className="text-2xl font-bold text-[#0D1E4C] text-center mb-2 uppercase">Delete Record</h2>
        <p className="text-sm text-slate-500 text-center font-medium mb-2">This action cannot be undone.</p>
        <p className="text-xs text-slate-400 text-center font-bold bg-slate-50 rounded-xl px-4 py-3 border border-slate-100 truncate">{fileName}</p>
      </div>
      <div className="px-10 pb-10 flex gap-4">
        <button onClick={onCancel} className="flex-1 px-6 py-4 border border-slate-200 text-slate-500 rounded-2xl text-xs font-bold uppercase tracking-widest hover:bg-slate-50 transition-all">
          Cancel
        </button>
        <button
          onClick={onConfirm}
          disabled={isDeleting}
          className="flex-1 px-6 py-4 bg-[#E4002B] text-white rounded-2xl text-xs font-bold uppercase tracking-widest hover:bg-red-700 transition-all disabled:opacity-60 disabled:cursor-not-allowed"
        >
          {isDeleting ? 'Deleting...' : 'Delete'}
        </button>
      </div>
    </motion.div>
  </div>
);

// ============================================================
// UPLOAD MODAL (Manual + Excel)
// ============================================================
const NewUploadModal = ({
  isOpen, onClose, onSubmitManual, onSubmitExcel, vendors, isUploading,
}: {
  isOpen: boolean;
  onClose: () => void;
  onSubmitManual: (data: any) => void;
  onSubmitExcel: (vendor: string, file: File) => void;
  vendors: string[];
  isUploading: boolean;
}) => {
  const [mode, setMode] = useState<'manual' | 'excel'>('manual');
  const [vendor, setVendor] = useState(vendors[0] || '');
  const [fileName, setFileName] = useState('');
  const [dataCount, setDataCount] = useState(0);
  const [status, setStatus] = useState<'Correct' | 'Wrong'>('Correct');
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Keep vendor in sync if vendors list changes
  useEffect(() => {
    if (vendor === '' && vendors.length > 0) setVendor(vendors[0]);
  }, [vendors]);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const f = e.target.files?.[0] || null;
    setSelectedFile(f);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    const f = e.dataTransfer.files?.[0];
    if (f && (f.name.endsWith('.xlsx') || f.name.endsWith('.xls') || f.name.endsWith('.csv'))) {
      setSelectedFile(f);
    }
  };

  const handleSubmit = () => {
    if (mode === 'manual') {
      onSubmitManual({ vendor, fileName, dataCount, status });
    } else {
      if (!selectedFile || !vendor) return;
      onSubmitExcel(vendor, selectedFile);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-6 bg-[#0D1E4C]/60 backdrop-blur-md">
      <motion.div
        initial={{ opacity: 0, scale: 0.9, y: 30 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        className="bg-white rounded-[2.5rem] w-full max-w-lg shadow-2xl overflow-hidden border border-slate-200"
      >
        {/* Modal Header */}
        <div className="p-10 border-b border-slate-100 flex justify-between items-center bg-slate-50/30">
          <div>
            <h2 className="text-3xl font-bold text-[#0D1E4C] uppercase">Upload Data</h2>
            <p className="text-[10px] font-bold text-slate-400 uppercase tracking-[0.2em] mt-1">
              {mode === 'manual' ? 'Manual system injection' : 'Excel / CSV file upload'}
            </p>
          </div>
          <button onClick={onClose} className="w-12 h-12 rounded-2xl border border-slate-200 flex items-center justify-center hover:bg-slate-100 transition-colors">
            <XIcon size={20} className="text-slate-400" />
          </button>
        </div>

        {/* Tab Toggle */}
        <div className="px-10 pt-8 flex gap-3">
          <button
            onClick={() => setMode('manual')}
            className={cn(
              'flex-1 py-3 rounded-2xl text-xs font-bold uppercase tracking-widest transition-all border',
              mode === 'manual' ? 'bg-[#005CB9] text-white border-[#005CB9] shadow-lg shadow-blue-100' : 'bg-slate-50 text-slate-500 border-slate-200 hover:bg-slate-100'
            )}
          >
            Manual Entry
          </button>
          <button
            onClick={() => setMode('excel')}
            className={cn(
              'flex-1 py-3 rounded-2xl text-xs font-bold uppercase tracking-widest transition-all border',
              mode === 'excel' ? 'bg-[#005CB9] text-white border-[#005CB9] shadow-lg shadow-blue-100' : 'bg-slate-50 text-slate-500 border-slate-200 hover:bg-slate-100'
            )}
          >
            Excel Upload
          </button>
        </div>

        {/* Form Body */}
        <div className="p-10 space-y-6">
          {/* Vendor Field (shared) */}
          <div className="space-y-3">
            <label className="text-[10px] font-bold text-slate-400 uppercase tracking-[0.25em] block ml-1">Destination Vendor</label>
            <input
              type="text"
              placeholder="E.G. VENDOR ONE"
              value={vendor}
              onChange={(e) => setVendor(e.target.value)}
              className="w-full px-6 py-4 rounded-2xl border border-slate-200 focus:ring-4 focus:ring-blue-50 outline-none text-sm font-bold text-[#0D1E4C] bg-slate-50 transition-all uppercase"
            />
          </div>

          {mode === 'manual' ? (
            <>
              <div className="space-y-3">
                <label className="text-[10px] font-bold text-slate-400 uppercase tracking-[0.25em] block ml-1">File Identifier</label>
                <input
                  type="text"
                  placeholder="E.G. DATA_SET_PRIMARY.CSV"
                  value={fileName}
                  onChange={(e) => setFileName(e.target.value)}
                  className="w-full px-6 py-4 rounded-2xl border border-slate-200 focus:ring-4 focus:ring-blue-50 outline-none text-sm font-bold text-[#0D1E4C] placeholder:text-slate-300 transition-all uppercase"
                />
              </div>
              <div className="grid grid-cols-2 gap-6">
                <div className="space-y-3">
                  <label className="text-[10px] font-bold text-slate-400 uppercase tracking-[0.25em] block ml-1">Record Count</label>
                  <input
                    type="number"
                    value={dataCount}
                    onChange={(e) => setDataCount(parseInt(e.target.value) || 0)}
                    className="w-full px-6 py-4 rounded-2xl border border-slate-200 focus:ring-4 focus:ring-blue-50 outline-none text-sm font-bold text-[#0D1E4C] bg-slate-50 transition-all"
                  />
                </div>
                <div className="space-y-3">
                  <label className="text-[10px] font-bold text-slate-400 uppercase tracking-[0.25em] block ml-1">Status Code</label>
                  <select
                    value={status}
                    onChange={(e) => setStatus(e.target.value as 'Correct' | 'Wrong')}
                    className="w-full px-6 py-4 rounded-2xl border border-slate-200 focus:ring-4 focus:ring-blue-50 outline-none text-sm font-bold text-[#0D1E4C] bg-slate-50 transition-all appearance-none uppercase"
                  >
                    <option value="Correct">PASSED (VERIFIED)</option>
                    <option value="Wrong">FAILED (ERROR)</option>
                  </select>
                </div>
              </div>
            </>
          ) : (
            <div className="space-y-3">
              <label className="text-[10px] font-bold text-slate-400 uppercase tracking-[0.25em] block ml-1">Excel / CSV File</label>
              <div
                onDrop={handleDrop}
                onDragOver={(e) => e.preventDefault()}
                onClick={() => fileInputRef.current?.click()}
                className={cn(
                  'w-full rounded-2xl border-2 border-dashed p-8 flex flex-col items-center justify-center cursor-pointer transition-all',
                  selectedFile ? 'border-[#005CB9] bg-blue-50' : 'border-slate-200 hover:border-slate-300 bg-slate-50'
                )}
              >
                <input ref={fileInputRef} type="file" accept=".xlsx,.xls,.csv" className="hidden" onChange={handleFileChange} />
                {selectedFile ? (
                  <>
                    <FileSpreadsheetIcon size={32} className="text-[#005CB9] mb-3" />
                    <p className="text-sm font-bold text-[#0D1E4C] text-center truncate max-w-full">{selectedFile.name}</p>
                    <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mt-1">{(selectedFile.size / 1024).toFixed(1)} KB</p>
                    <button
                      onClick={(e) => { e.stopPropagation(); setSelectedFile(null); if (fileInputRef.current) fileInputRef.current.value = ''; }}
                      className="mt-3 text-[10px] font-bold text-red-400 hover:text-red-600 uppercase tracking-widest"
                    >
                      Remove file
                    </button>
                  </>
                ) : (
                  <>
                    <UploadIcon size={32} className="text-slate-300 mb-3" />
                    <p className="text-sm font-bold text-slate-500 text-center">Drop file here or click to browse</p>
                    <p className="text-[10px] font-bold text-slate-300 uppercase tracking-widest mt-1">.xlsx · .xls · .csv</p>
                  </>
                )}
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="p-10 bg-slate-50/50 flex gap-4 pt-0">
          <button onClick={onClose} className="flex-1 px-8 py-5 border border-slate-200 text-slate-500 rounded-2xl text-xs font-bold uppercase tracking-widest hover:bg-white transition-all shadow-sm">
            Abort
          </button>
          <button
            onClick={handleSubmit}
            disabled={isUploading || (mode === 'excel' && !selectedFile) || !vendor}
            className={cn(
              'flex-1 px-8 py-5 text-white rounded-2xl text-xs font-bold uppercase tracking-[0.2em] transition-all shadow-xl shadow-slate-200',
              isUploading || (mode === 'excel' && !selectedFile) || !vendor
                ? 'bg-slate-400 cursor-not-allowed'
                : 'bg-[#005CB9] hover:bg-black'
            )}
          >
            {isUploading ? 'UPLOADING...' : 'CONFIRM UPLOAD'}
          </button>
        </div>
      </motion.div>
    </div>
  );
};

// ============================================================
// TOAST NOTIFICATION
// ============================================================
const Toast = ({ message, type, onClose }: { message: string; type: 'success' | 'error'; onClose: () => void }) => (
  <motion.div
    initial={{ opacity: 0, y: 40, scale: 0.95 }}
    animate={{ opacity: 1, y: 0, scale: 1 }}
    exit={{ opacity: 0, y: 20, scale: 0.95 }}
    className={cn(
      'fixed bottom-8 right-8 z-[200] flex items-center gap-4 px-6 py-4 rounded-2xl shadow-2xl border text-sm font-bold',
      type === 'success' ? 'bg-white border-[#00A19D] text-[#0D1E4C]' : 'bg-white border-[#E4002B] text-[#0D1E4C]'
    )}
  >
    {type === 'success' ? <CheckCircle2Icon size={20} className="text-[#00A19D] shrink-0" /> : <AlertCircleIcon size={20} className="text-[#E4002B] shrink-0" />}
    <span>{message}</span>
    <button onClick={onClose} className="ml-2 text-slate-300 hover:text-slate-600 transition-colors">
      <XIcon size={16} />
    </button>
  </motion.div>
);

const LoginPage = ({ onLogin }: { onLogin: () => void }) => {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (username === 'admin' && password === '123') {
      onLogin();
    } else {
      setError('Invalid username or password');
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 flex items-center justify-center p-4 font-sans">
      <div className="bg-white p-10 rounded-[2.5rem] shadow-xl border border-slate-100 w-full max-w-md">
        <div className="flex justify-center mb-8">
          <div className="w-16 h-16 rounded-2xl bg-[#005CB9] flex items-center justify-center shadow-lg shadow-blue-100">
            <DatabaseIcon className="text-white" size={32} />
          </div>
        </div>
        <h2 className="text-3xl font-bold text-[#0D1E4C] text-center mb-2 tracking-tight">Welcome Back</h2>
        <p className="text-center text-slate-400 text-[10px] font-bold uppercase tracking-[0.2em] mb-8">Login to Incyte Analytics</p>
        
        <form onSubmit={handleSubmit} className="space-y-6">
          <div>
            <label className="text-[10px] font-bold text-slate-400 uppercase tracking-[0.25em] block ml-1 mb-2">Username</label>
            <input
              type="text"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              className="w-full px-6 py-4 rounded-2xl border border-slate-200 focus:ring-4 focus:ring-blue-50 outline-none text-sm font-bold text-[#0D1E4C] bg-slate-50 transition-all"
              placeholder="Enter username"
            />
          </div>
          <div>
            <label className="text-[10px] font-bold text-slate-400 uppercase tracking-[0.25em] block ml-1 mb-2">Password</label>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full px-6 py-4 rounded-2xl border border-slate-200 focus:ring-4 focus:ring-blue-50 outline-none text-sm font-bold text-[#0D1E4C] bg-slate-50 transition-all"
              placeholder="Enter password"
            />
          </div>
          
          {error && <p className="text-[#E4002B] text-xs font-bold text-center">{error}</p>}
          
          <button
            type="submit"
            className="w-full px-8 py-5 bg-[#005CB9] text-white rounded-2xl text-xs font-bold uppercase tracking-[0.2em] transition-all hover:bg-[#004A99] shadow-xl shadow-blue-200 mt-4"
          >
            Login
          </button>
        </form>
      </div>
    </div>
  );
};

// ============================================================
// MAIN APP
// ============================================================
export default function App() {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [activeTab, setActiveTab] = useState('Overview');
  const [vendors, setVendors] = useState<VendorRow[]>([]);
  const [vendorDetails, setVendorDetails] = useState<Record<string, FileDetail[]>>({});
  const [isUploadModalOpen, setIsUploadModalOpen] = useState(false);
  const [selectedVendor, setSelectedVendor] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [sortConfig, setSortConfig] = useState<{ key: keyof FileDetail; direction: 'asc' | 'desc' } | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isUploading, setIsUploading] = useState(false);
  const [trendData, setTrendData] = useState(DEFAULT_TREND_DATA);

  // Preview
  const [previewFile, setPreviewFile] = useState<{ id: number; name: string } | null>(null);

  // Delete
  const [deleteTarget, setDeleteTarget] = useState<{ id: number; name: string } | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);

  // Toast
  const [toast, setToast] = useState<{ message: string; type: 'success' | 'error' } | null>(null);
  const showToast = (message: string, type: 'success' | 'error' = 'success') => {
    setToast({ message, type });
    setTimeout(() => setToast(null), 4000);
  };

  // ---- Fetch all data ----
  const fetchData = useCallback(async () => {
    setIsLoading(true);
    try {
      const response = await fetch('/api/files');
      if (!response.ok) throw new Error('Failed to reach backend server');
      const data = await response.json();

      const details: Record<string, FileDetail[]> = {};
      const stats: Record<string, any> = {};
      const dailyCounts: Record<string, number> = { MON: 0, TUE: 0, WED: 0, THU: 0, FRI: 0, SAT: 0, SUN: 0 };

      data.forEach((item: any) => {
        const vendor = item.vendor;
        if (!details[vendor]) {
          details[vendor] = [];
          stats[vendor] = { totalFiles: 0, correctFiles: 0, wrongFiles: 0, totalDataCount: 0, correctDataCount: 0, wrongDataCount: 0 };
        }

        const date = new Date(item.created_at);
        const dayName = ['SUN', 'MON', 'TUE', 'WED', 'THU', 'FRI', 'SAT'][date.getDay()];
        dailyCounts[dayName] = (dailyCounts[dayName] || 0) + 1;

        details[vendor].push({
          id: `F${String(item.id).padStart(3, '0')}`,
          dbId: item.id,
          name: item.file_name,
          date: date.toISOString().split('T')[0],
          status: item.status as 'Correct' | 'Wrong',
          dataCount: item.data_count,
          filePath: item.file_path || undefined,
        });

        stats[vendor].totalFiles += 1;
        if (item.status === 'Correct') {
          stats[vendor].correctFiles += 1;
          stats[vendor].correctDataCount += item.data_count;
        } else {
          stats[vendor].wrongFiles += 1;
          stats[vendor].wrongDataCount += item.data_count;
        }
        stats[vendor].totalDataCount += item.data_count;
      });

      const vendorData: VendorRow[] = Object.keys(stats).map((name) => ({
        name,
        ...stats[name],
        fileRatio: Math.round((stats[name].correctFiles / stats[name].totalFiles) * 100),
      }));

      const newTrendData = ['MON', 'TUE', 'WED', 'THU', 'FRI', 'SAT', 'SUN'].map((day) => ({ day, count: dailyCounts[day] }));

      setVendors(vendorData);
      setVendorDetails(details);
      setTrendData(newTrendData);
    } catch (err: any) {
      showToast(err.message || 'Failed to load data', 'error');
    } finally {
      setTimeout(() => setIsLoading(false), 500);
    }
  }, []);

  useEffect(() => { fetchData(); }, [fetchData]);

  // ---- Manual Upload ----
  const handleManualUpload = async (newData: { vendor: string; fileName: string; dataCount: number; status: 'Correct' | 'Wrong' }) => {
    setIsUploading(true);
    try {
      const response = await fetch('/api/upload', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(newData),
      });
      const responseData = await response.json().catch(() => ({}));
      if (!response.ok) throw new Error(responseData.error || 'Upload failed');
      await fetchData();
      setIsUploadModalOpen(false);
      showToast('Record uploaded successfully!', 'success');
    } catch (err: any) {
      showToast(err.message || 'Upload failed', 'error');
    } finally {
      setIsUploading(false);
    }
  };

  // ---- Excel Upload ----
  const handleExcelUpload = async (vendor: string, file: File) => {
    setIsUploading(true);
    try {
      const formData = new FormData();
      formData.append('vendor', vendor);
      formData.append('file', file);

      const response = await fetch('/api/upload-excel', {
        method: 'POST',
        body: formData,
      });
      const responseData = await response.json().catch(() => ({}));
      if (!response.ok) throw new Error(responseData.error || 'Excel upload failed');
      await fetchData();
      setIsUploadModalOpen(false);
      showToast(`Excel uploaded! ${responseData.dataCount} rows processed.`, 'success');
    } catch (err: any) {
      showToast(err.message || 'Excel upload failed', 'error');
    } finally {
      setIsUploading(false);
    }
  };

  // ---- Delete ----
  const handleDeleteConfirm = async () => {
    if (!deleteTarget) return;
    setIsDeleting(true);
    try {
      const response = await fetch(`/api/files/${deleteTarget.id}`, { method: 'DELETE' });
      if (!response.ok) throw new Error('Delete failed');
      await fetchData();
      showToast('Record deleted successfully.', 'success');
      setDeleteTarget(null);
    } catch (err: any) {
      showToast(err.message || 'Delete failed', 'error');
    } finally {
      setIsDeleting(false);
    }
  };

  // ---- Download ----
  const handleDownload = (file: FileDetail) => {
    if (!file.filePath) {
      showToast('No file attached to this record.', 'error');
      return;
    }
    const a = document.createElement('a');
    a.href = file.filePath;
    a.download = file.name;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
  };

  // ---- Sort ----
  const handleSort = (key: keyof FileDetail) => {
    setSortConfig((prev) => ({ key, direction: prev?.key === key && prev.direction === 'asc' ? 'desc' : 'asc' }));
  };

  // ---- Processed table data ----
  const processedDetails = useMemo(() => {
    let details = selectedVendor ? [...(vendorDetails[selectedVendor] || [])] : [];
    if (searchTerm) {
      const lower = searchTerm.toLowerCase();
      details = details.filter((item) => item.name.toLowerCase().includes(lower) || item.id.toLowerCase().includes(lower));
    }
    if (sortConfig) {
      details.sort((a, b) => {
        const av = a[sortConfig.key], bv = b[sortConfig.key];
        if (av < bv) return sortConfig.direction === 'asc' ? -1 : 1;
        if (av > bv) return sortConfig.direction === 'asc' ? 1 : -1;
        return 0;
      });
    }
    return details;
  }, [selectedVendor, searchTerm, sortConfig, vendorDetails]);

  const currentDetails = selectedVendor ? vendorDetails[selectedVendor] || [] : [];
  const totalFilesCount = useMemo(() => vendors.reduce((acc, v) => acc + v.totalFiles, 0), [vendors]);

  const fileStatusData = useMemo(() => {
    const totals = vendors.reduce((acc, v) => ({ correct: acc.correct + v.correctFiles, wrong: acc.wrong + v.wrongFiles }), { correct: 0, wrong: 0 });
    return [
      { name: 'Correct Files', value: totals.correct, color: COLORS.success },
      { name: 'Wrong Files', value: totals.wrong, color: COLORS.danger },
    ];
  }, [vendors]);

  const handleTabChange = (tab: string) => { setActiveTab(tab); setSelectedVendor(null); };

  // ---- Export vendor details as CSV ----
  const handleExportVendorCSV = () => {
    if (!selectedVendor) return;
    const rows = currentDetails;
    if (!rows.length) return;
    const headers = ['ID', 'Name', 'Date', 'Data Count', 'Status'];
    const csvContent = [
      headers.join(','),
      ...rows.map((r) => [r.id, `"${r.name}"`, r.date, r.dataCount, r.status].join(',')),
    ].join('\n');
    const blob = new Blob([csvContent], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${selectedVendor}_export.csv`;
    a.click();
    URL.revokeObjectURL(url);
    showToast('CSV exported successfully!', 'success');
  };

  // ---- Export all vendors CSV ----
  const handleExportAllCSV = () => {
    if (!vendors.length) return;
    const headers = ['Vendor', 'Total Files', 'Correct Files', 'Wrong Files', 'Total Records', 'Accuracy %'];
    const csvContent = [
      headers.join(','),
      ...vendors.map((v) => [v.name, v.totalFiles, v.correctFiles, v.wrongFiles, v.totalDataCount, v.fileRatio].join(',')),
    ].join('\n');
    const blob = new Blob([csvContent], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'all_vendors_export.csv';
    a.click();
    URL.revokeObjectURL(url);
    showToast('All vendors exported!', 'success');
  };

  // ============================================================
  // RENDER
  // ============================================================
  if (!isAuthenticated) {
    return <LoginPage onLogin={() => setIsAuthenticated(true)} />;
  }

  return (
    <div className="flex min-h-screen bg-slate-50 font-sans relative">
      {/* Loading Overlay */}
      {isLoading && (
        <div className="fixed inset-0 z-[200] bg-white/80 backdrop-blur-sm flex flex-col items-center justify-center transition-all duration-500">
          <div className="w-16 h-16 border-4 border-slate-100 border-t-[#005CB9] rounded-full animate-spin mb-4" />
          <p className="text-[10px] font-bold text-slate-400 uppercase tracking-[0.3em] animate-pulse">Syncing Database...</p>
        </div>
      )}

      <Sidebar activeTab={activeTab} onTabChange={handleTabChange} />

      <main className="flex-1 flex flex-col min-w-0">
        <UserHeader onLogout={() => setIsAuthenticated(false)} />

        <div className="px-6 lg:px-10 py-8 w-full max-w-[1600px] mx-auto overflow-hidden">

          {/* ===================== VENDOR DETAIL VIEW ===================== */}
          {selectedVendor ? (
            <motion.div initial={{ opacity: 0, y: 15 }} animate={{ opacity: 1, y: 0 }} className="space-y-8">
              {/* Detail Header */}
              <div className="bg-white p-8 lg:p-10 rounded-[2rem] shadow-sm border border-slate-100 relative overflow-hidden">
                <div className="relative z-10 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-6">
                  <div className="flex items-center gap-6 lg:gap-8">
                    <button
                      onClick={() => { setSelectedVendor(null); setSearchTerm(''); setSortConfig(null); }}
                      className="min-w-12 h-12 rounded-2xl bg-slate-50 flex items-center justify-center text-slate-400 hover:text-[#005CB9] hover:bg-blue-50 transition-all border border-slate-100 group"
                    >
                      <ArrowLeftIcon size={20} className="group-hover:-translate-x-1 transition-transform" />
                    </button>
                    <div>
                      <div className="flex items-center gap-3 mb-2">
                        <span className="px-3 py-1 rounded-full bg-blue-50 text-[#005CB9] text-[10px] font-bold uppercase tracking-widest">Active Vendor</span>
                      </div>
                      <h1 className="text-3xl lg:text-4xl font-bold text-[#0D1E4C] tracking-tight">{selectedVendor}</h1>
                      <p className="text-slate-400 text-xs font-bold mt-2 uppercase tracking-widest">
                        Displaying <span className="text-[#00B5E2] font-bold">{currentDetails.length}</span> verified file records
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center gap-3 w-full sm:w-auto">
                    <button
                      onClick={handleExportVendorCSV}
                      className="flex-1 sm:flex-none flex items-center justify-center gap-2 px-6 py-3.5 bg-[#0D1E4C] text-white rounded-2xl text-xs font-bold transition-all hover:bg-black shadow-xl shadow-slate-200"
                    >
                      <DownloadIcon size={16} /> Export Dataset
                    </button>
                  </div>
                </div>
                <div className="absolute top-0 right-0 w-64 h-64 bg-slate-50 rounded-full blur-3xl -translate-y-1/2 translate-x-1/2" />
              </div>

              {/* Stats Bar */}
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                <DetailStat label="Total Files" value={currentDetails.length} icon={<DatabaseIcon size={20} />} color="primary" />
                <DetailStat label="Correct Files" value={currentDetails.filter((f) => f.status === 'Correct').length} icon={<CheckCircle2Icon size={20} />} color="success" />
                <DetailStat label="Wrong Files" value={currentDetails.filter((f) => f.status === 'Wrong').length} icon={<AlertCircleIcon size={20} />} color="danger" />
                <DetailStat label="System State" value="Optimized" icon={<ActivityIcon size={20} />} color="slate" />
              </div>

              {/* Data Table */}
              <section className="bg-white rounded-[2rem] shadow-sm border border-slate-100 overflow-hidden">
                <div className="px-6 lg:px-10 py-8 border-b border-slate-50 bg-slate-50/20 flex flex-col md:flex-row justify-between md:items-center gap-4">
                  <div>
                    <h2 className="text-sm font-bold uppercase tracking-[0.15em] text-slate-400 mb-1">File Registry</h2>
                    <p className="text-[10px] font-bold text-slate-300 uppercase">Real-time verification audit</p>
                  </div>
                  <div className="relative">
                    <SearchIcon size={16} className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-300" />
                    <input
                      type="text"
                      placeholder="Filter records..."
                      value={searchTerm}
                      onChange={(e) => setSearchTerm(e.target.value)}
                      className="pl-12 pr-6 py-3 bg-white border border-slate-200 rounded-2xl text-xs font-bold focus:outline-none focus:ring-4 focus:ring-blue-50 w-full md:w-80 transition-all placeholder:text-slate-300"
                    />
                  </div>
                </div>
                <div className="overflow-x-auto">
                  <table className="w-full min-w-[900px]">
                    <thead>
                      <tr className="bg-slate-50/50">
                        <TableHead label="ID" onClick={() => handleSort('id')} activeSort={sortConfig?.key === 'id' ? sortConfig.direction : null} />
                        <TableHead label="NAME" onClick={() => handleSort('name')} activeSort={sortConfig?.key === 'name' ? sortConfig.direction : null} />
                        <TableHead label="DATE" onClick={() => handleSort('date')} activeSort={sortConfig?.key === 'date' ? sortConfig.direction : null} />
                        <TableHead label="COUNT" onClick={() => handleSort('dataCount')} activeSort={sortConfig?.key === 'dataCount' ? sortConfig.direction : null} />
                        <TableHead label="STATUS" />
                        <TableHead label="ACTIONS" />
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-50">
                      {processedDetails.length === 0 ? (
                        <tr>
                          <td colSpan={6} className="px-10 py-16 text-center text-slate-300 text-sm font-bold uppercase tracking-widest">
                            No records found
                          </td>
                        </tr>
                      ) : (
                        processedDetails.map((file) => (
                          <tr key={file.id} className="hover:bg-slate-50/80 transition-all group">
                            <td className="px-6 lg:px-10 py-6 text-xs font-bold text-[#005CB9] font-mono tracking-tight">{file.id}</td>
                            <td className="px-6 lg:px-10 py-6">
                              <div className="flex items-center gap-4">
                                <div className="w-10 h-10 rounded-xl bg-slate-100 flex items-center justify-center text-slate-400 group-hover:bg-white group-hover:shadow-sm transition-all shrink-0">
                                  <FileIcon size={18} />
                                </div>
                                <span className="text-sm font-bold text-slate-800 tracking-tight truncate max-w-[200px]">{file.name}</span>
                              </div>
                            </td>
                            <td className="px-6 lg:px-10 py-6 text-sm font-bold text-slate-400 font-mono tracking-tight">{file.date}</td>
                            <td className="px-6 lg:px-10 py-6">
                              <div className="flex items-center gap-3">
                                <span className="text-sm font-bold text-[#0D1E4C] w-10">{file.dataCount}</span>
                                <div className="h-1.5 w-20 bg-slate-100 rounded-full overflow-hidden shadow-inner">
                                  <div className="h-full bg-[#00B5E2] rounded-full" style={{ width: `${Math.min(file.dataCount / 5, 100)}%` }} />
                                </div>
                              </div>
                            </td>
                            <td className="px-6 lg:px-10 py-6">
                              <span className={cn(
                                'inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-[10px] font-bold uppercase tracking-widest border',
                                file.status === 'Correct' ? 'bg-[#E6F6F5] text-[#00A19D] border-[#B2E3E1]' : 'bg-rose-50 text-rose-600 border-rose-100'
                              )}>
                                {file.status === 'Correct' ? <CheckCircle2Icon size={10} /> : <AlertCircleIcon size={10} />}
                                {file.status}
                              </span>
                            </td>
                            <td className="px-6 lg:px-10 py-6">
                              <div className="flex items-center gap-2">
                                {/* Preview */}
                                <button
                                  onClick={() => setPreviewFile({ id: file.dbId, name: file.name })}
                                  title="Preview Data"
                                  className="w-9 h-9 rounded-xl bg-slate-50 border border-slate-200 flex items-center justify-center text-slate-400 hover:text-[#005CB9] hover:bg-blue-50 hover:border-[#005CB9] transition-all"
                                >
                                  <EyeIcon size={15} />
                                </button>
                                {/* Download (only if has file) */}
                                {file.filePath && (
                                  <button
                                    onClick={() => handleDownload(file)}
                                    title="Download File"
                                    className="w-9 h-9 rounded-xl bg-slate-50 border border-slate-200 flex items-center justify-center text-slate-400 hover:text-[#00A19D] hover:bg-teal-50 hover:border-[#00A19D] transition-all"
                                  >
                                    <DownloadIcon size={15} />
                                  </button>
                                )}
                                {/* Delete */}
                                <button
                                  onClick={() => setDeleteTarget({ id: file.dbId, name: file.name })}
                                  title="Delete Record"
                                  className="w-9 h-9 rounded-xl bg-slate-50 border border-slate-200 flex items-center justify-center text-slate-400 hover:text-[#E4002B] hover:bg-red-50 hover:border-[#E4002B] transition-all"
                                >
                                  <TrashIcon size={15} />
                                </button>
                              </div>
                            </td>
                          </tr>
                        ))
                      )}
                    </tbody>
                  </table>
                </div>
              </section>
            </motion.div>

          /* ===================== PERFORMANCE TAB ===================== */
          ) : activeTab === 'Performance' ? (
            <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="space-y-10">
              <div className="bg-white rounded-[2.5rem] p-10 border border-slate-100 shadow-sm">
                <h1 className="text-4xl font-bold text-slate-900 mb-4">PERFORMANCE HUB</h1>
                <p className="text-slate-400 text-sm font-bold uppercase tracking-widest">Regional Efficiency Metrics & Load Balancing</p>
              </div>
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                <ChartCard title="Vendor Accuracy Comparison" className="min-h-[400px] flex flex-col">
                  <p className="text-[10px] font-bold text-slate-400 mb-8 uppercase tracking-widest">File accuracy % per vendor</p>
                  <div className="flex-1 w-full min-h-[280px]">
                    <ResponsiveContainer width="99%" height={280}>
                      <BarChart data={vendors.map((v) => ({ name: v.name, accuracy: v.fileRatio }))} margin={{ top: 20, right: 30, left: -20, bottom: 20 }}>
                        <defs>
                          <linearGradient id="perf-gradient" x1="0" y1="0" x2="0" y2="1">
                            <stop offset="0%" stopColor={COLORS.primary} stopOpacity={1} />
                            <stop offset="100%" stopColor="#004A99" stopOpacity={1} />
                          </linearGradient>
                        </defs>
                        <XAxis dataKey="name" stroke={COLORS.slate[300]} fontSize={10} tickLine={false} axisLine={false} dy={15} tick={{ fill: COLORS.slate[500], fontWeight: 700 }} />
                        <YAxis domain={[0, 100]} hide />
                        <Tooltip
                          cursor={{ fill: COLORS.slate[50], opacity: 0.8 }}
                          contentStyle={{ borderRadius: '1.25rem', border: 'none', boxShadow: '0 25px 50px -12px rgb(0 0 0 / 0.12)', padding: '1.5rem' }}
                          formatter={(value: any) => [`${value}%`, 'Accuracy']}
                        />
                        <Bar dataKey="accuracy" radius={[12, 12, 12, 12]} barSize={40} fill="url(#perf-gradient)" />
                      </BarChart>
                    </ResponsiveContainer>
                  </div>
                </ChartCard>

                <ChartCard title="Error Distribution by Vendor" className="min-h-[400px] flex flex-col">
                  <p className="text-[10px] font-bold text-slate-400 mb-8 uppercase tracking-widest">Wrong vs correct files per vendor</p>
                  <div className="flex-1 space-y-6 mt-4">
                    {vendors.map((v) => (
                      <div key={v.name} className="space-y-2">
                        <div className="flex justify-between items-center">
                          <span className="text-xs font-bold text-[#0D1E4C] uppercase tracking-wide">{v.name}</span>
                          <span className="text-[10px] font-bold text-slate-400">{v.correctFiles}✓ / {v.wrongFiles}✗</span>
                        </div>
                        <div className="h-3 w-full bg-slate-100 rounded-full overflow-hidden flex shadow-inner">
                          <div className="h-full bg-[#00A19D] rounded-l-full transition-all" style={{ width: `${v.fileRatio}%` }} />
                          <div className="h-full bg-[#E4002B] rounded-r-full transition-all" style={{ width: `${100 - v.fileRatio}%` }} />
                        </div>
                      </div>
                    ))}
                    {vendors.length === 0 && (
                      <div className="flex items-center justify-center h-40 text-slate-300 font-bold italic uppercase tracking-widest border-2 border-dashed border-slate-100 rounded-3xl">
                        No vendor data available
                      </div>
                    )}
                  </div>
                </ChartCard>
              </div>
            </motion.div>

          /* ===================== OVERVIEW TAB ===================== */
          ) : (
            <>
              {/* Hero Banner */}
              <div className="bg-white rounded-[2.5rem] p-8 lg:p-12 border border-slate-100 mb-10 shadow-sm relative overflow-hidden">
                <div className="relative z-10 flex flex-col lg:flex-row justify-between lg:items-center gap-8">
                  <div className="flex items-center gap-6 lg:gap-10">
                    <div className="bg-[#005CB9] p-6 rounded-3xl shadow-2xl shadow-blue-100 shrink-0">
                      <FolderOpenIcon className="w-10 h-10 text-white" />
                    </div>
                    <div>
                      <h1 className="text-4xl lg:text-5xl font-bold text-[#0D1E4C] leading-none mb-3">VENDORS</h1>
                      <div className="flex items-center gap-4">
                        <span className="text-[10px] font-bold uppercase tracking-[0.2em] text-slate-400">Incyte Analytics Hub</span>
                        <div className="w-1 h-1 rounded-full bg-slate-200" />
                        <span className="text-[10px] font-bold uppercase tracking-[0.2em] text-[#00B5E2]">Powered by Science</span>
                      </div>
                    </div>
                  </div>
                  <div className="flex items-center gap-4">
                    <button
                      onClick={() => fetchData()}
                      className="flex items-center justify-center w-14 h-14 bg-white border border-slate-100 text-slate-400 rounded-[1.25rem] transition-all hover:bg-slate-50 hover:text-[#005CB9] group"
                      title="Refresh Data"
                    >
                      <RefreshCwIcon size={20} className={cn('transition-transform duration-500', isLoading && 'animate-spin')} />
                    </button>
                    <div className="flex flex-col gap-2 w-full lg:w-auto">
                      <button
                        onClick={() => setIsUploadModalOpen(true)}
                        className="flex items-center justify-center gap-3 px-8 py-4 bg-[#005CB9] text-white rounded-[1.25rem] text-sm font-bold transition-all hover:bg-[#004A99] shadow-2xl shadow-blue-200 group w-full lg:w-auto"
                      >
                        <PlusIcon size={20} className="group-hover:rotate-90 transition-transform duration-300" />
                        NEW UPLOAD
                      </button>
                      <button
                        onClick={() => window.open('https://outlook.office.com/mail/', '_blank')}
                        className="flex items-center justify-center gap-3 px-8 py-4 bg-white border border-slate-200 text-[#005CB9] rounded-[1.25rem] text-sm font-bold transition-all hover:bg-blue-50 hover:border-[#005CB9] shadow-sm group w-full lg:w-auto"
                      >
                        <MailIcon size={20} />
                        OUTLOOK
                      </button>
                    </div>
                  </div>
                </div>
                <div className="absolute -top-24 -right-24 w-96 h-96 bg-indigo-50/50 rounded-full blur-[80px]" />
              </div>

              {/* Charts Row */}
              <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-8 mb-10">
                <ChartCard title="Upload Volume Trends" className="min-h-[420px] flex flex-col">
                  <p className="text-[10px] font-bold text-slate-400 mb-8 uppercase tracking-widest">Real-time database records by day</p>
                  <div className="flex-1 w-full relative min-h-[280px]">
                    <ResponsiveContainer width="99%" height="100%">
                      <BarChart data={trendData} margin={{ top: 20, right: 30, left: -20, bottom: 20 }}>
                        <defs>
                          {CHART_GRADIENTS.map((grad) => (
                            <linearGradient key={grad.id} id={grad.id} x1="0" y1="0" x2="0" y2="1">
                              <stop offset="0%" stopColor={grad.start} stopOpacity={1} />
                              <stop offset="100%" stopColor={grad.end} stopOpacity={1} />
                            </linearGradient>
                          ))}
                        </defs>
                        <XAxis dataKey="day" stroke={COLORS.slate[300]} fontSize={10} tickLine={false} axisLine={false} dy={15} tick={{ fill: COLORS.slate[500], fontWeight: 700 }} />
                        <YAxis hide />
                        <Tooltip
                          cursor={{ fill: COLORS.slate[50], opacity: 0.8 }}
                          contentStyle={{ borderRadius: '1.25rem', border: 'none', boxShadow: '0 25px 50px -12px rgb(0 0 0 / 0.12)', padding: '1.5rem' }}
                          itemStyle={{ fontWeight: 'bold', color: COLORS.slate[900], fontSize: '12px' }}
                        />
                        <Bar dataKey="count" radius={[12, 12, 12, 12]} barSize={36} isAnimationActive>
                          {trendData.map((_, index) => (
                            <Cell key={`cell-${index}`} fill={`url(#${CHART_GRADIENTS[index % CHART_GRADIENTS.length].id})`} />
                          ))}
                        </Bar>
                      </BarChart>
                    </ResponsiveContainer>
                  </div>
                </ChartCard>

                <ChartCard title="File Verification Status" className="min-h-[420px] flex flex-col">
                  <p className="text-[10px] font-bold text-slate-400 mb-8 uppercase tracking-widest">Cumulative success distribution</p>
                  <div className="flex-1 grid grid-cols-1 md:grid-cols-2 items-center gap-8 py-4">
                    <div className="relative h-64 flex items-center justify-center">
                      <ResponsiveContainer width="100%" height="100%">
                        <PieChart>
                          <Pie data={fileStatusData} cx="50%" cy="50%" innerRadius="65%" outerRadius="85%" paddingAngle={8} dataKey="value" isAnimationActive stroke="none">
                            {fileStatusData.map((entry, index) => (
                              <Cell key={`cell-${index}`} fill={entry.color} />
                            ))}
                          </Pie>
                        </PieChart>
                      </ResponsiveContainer>
                      <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
                        <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1">Files</span>
                        <span className="text-4xl font-bold text-[#0D1E4C] leading-none">{totalFilesCount}</span>
                      </div>
                    </div>
                    <div className="flex flex-col justify-center space-y-6">
                      {fileStatusData.map((item, i) => (
                        <div key={i} className="flex flex-col gap-1">
                          <div className="flex items-center gap-2">
                            <div className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: item.color }} />
                            <span className="text-[10px] font-semibold text-[#0D1E4C] uppercase tracking-widest">{item.name}</span>
                          </div>
                          <span className="text-lg font-semibold text-slate-400 ml-4">{item.value} Records</span>
                        </div>
                      ))}
                    </div>
                  </div>
                </ChartCard>

                <ChartCard title="Operational Metrics" className="xl:col-span-1">
                  <p className="text-[10px] font-bold text-slate-400 mb-10 uppercase tracking-widest">Efficiency Benchmarking</p>
                  <div className="space-y-10 pt-2">
                    <ProgressItem label="Total Records" total={vendors.reduce((acc, v) => acc + v.totalDataCount, 0)} color={COLORS.primary} perc={100} />
                    <ProgressItem label="Accurate Data" total={vendors.reduce((acc, v) => acc + v.correctDataCount, 0)} color={COLORS.success} perc={Math.round((vendors.reduce((acc, v) => acc + v.correctDataCount, 0) / (vendors.reduce((acc, v) => acc + v.totalDataCount, 0) || 1)) * 100)} />
                    <ProgressItem label="Error Rate" total={vendors.reduce((acc, v) => acc + v.wrongDataCount, 0)} color={COLORS.danger} perc={Math.round((vendors.reduce((acc, v) => acc + v.wrongDataCount, 0) / (vendors.reduce((acc, v) => acc + v.totalDataCount, 0) || 1)) * 100)} />
                  </div>
                </ChartCard>
              </div>

              {/* Vendor Table */}
              <section className="bg-white rounded-[2.5rem] shadow-sm border border-slate-100 overflow-hidden">
                <div className="px-6 lg:px-10 py-10 border-b border-slate-50 flex flex-col md:flex-row justify-between md:items-center bg-white gap-6">
                  <div>
                    <h2 className="text-xl font-bold text-[#0D1E4C] flex items-center gap-4">Vendor Performance Registry</h2>
                    <p className="text-[10px] font-bold text-slate-300 uppercase tracking-widest mt-1">Audit log spanning {vendors.length} certified endpoints</p>
                  </div>
                  <button
                    onClick={handleExportAllCSV}
                    className="flex items-center justify-center gap-3 px-8 py-4 bg-slate-50 text-[#0D1E4C] rounded-2xl text-xs font-bold border border-slate-100 transition-all hover:bg-slate-100"
                  >
                    <DownloadIcon size={16} /> DOWNLOAD ALL
                  </button>
                </div>
                <div className="overflow-x-auto">
                  <table className="w-full min-w-[1000px]">
                    <thead>
                      <tr className="bg-slate-50/50 text-slate-500">
                        <TableHead label="VENDOR" />
                        <TableHead label="FILES" />
                        <TableHead label="VERIFIED" />
                        <TableHead label="FLAGGED" />
                        <TableHead label="RECORDS" />
                        <TableHead label="ACCURACY" />
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-50">
                      {vendors.length === 0 ? (
                        <tr>
                          <td colSpan={6} className="px-10 py-20 text-center text-slate-300 text-sm font-bold uppercase tracking-widest">
                            No vendor data. Upload a file to get started.
                          </td>
                        </tr>
                      ) : (
                        vendors.map((vendor, idx) => (
                          <tr key={idx} onClick={() => setSelectedVendor(vendor.name)} className="hover:bg-slate-50/80 transition-all group cursor-pointer">
                            <td className="px-6 lg:px-10 py-8">
                              <div className="flex flex-col">
                                <span className="text-base font-bold text-[#0D1E4C] group-hover:text-[#005CB9] transition-colors uppercase underline decoration-slate-200 underline-offset-8 decoration-2">{vendor.name}</span>
                                <span className="text-[10px] text-slate-400 font-bold uppercase tracking-widest mt-1">Tier 1 Provider</span>
                              </div>
                            </td>
                            <td className="px-6 lg:px-10 py-8 text-sm font-bold text-slate-400">{vendor.totalFiles}</td>
                            <td className="px-6 lg:px-10 py-8">
                              <div className="flex items-center gap-2">
                                <CheckCircle2Icon size={14} className="text-[#00A19D]" />
                                <span className="text-sm font-bold text-[#0D1E4C]">{vendor.correctFiles}</span>
                              </div>
                            </td>
                            <td className="px-6 lg:px-10 py-8">
                              <div className="flex items-center gap-2">
                                <AlertCircleIcon size={14} className="text-[#E4002B]" />
                                <span className="text-sm font-bold text-[#0D1E4C]">{vendor.wrongFiles}</span>
                              </div>
                            </td>
                            <td className="px-6 lg:px-10 py-8 font-mono text-sm font-bold text-[#0D1E4C]">{vendor.totalDataCount.toLocaleString()}</td>
                            <td className="px-6 lg:px-10 py-8 min-w-[200px]">
                              <div className="flex flex-col gap-3">
                                <div className="flex justify-between items-center text-[10px] font-bold uppercase tracking-widest">
                                  <span className={cn(vendor.fileRatio > 80 ? 'text-[#00A19D]' : 'text-[#FFB81C]')}>{vendor.fileRatio}% SUCCESS</span>
                                  <span className="text-slate-300">Target 95%</span>
                                </div>
                                <div className="h-2 w-full bg-slate-100 rounded-full overflow-hidden flex shadow-inner group-hover:scale-y-125 transition-transform">
                                  <div className={cn('h-full rounded-full transition-all duration-1000', vendor.fileRatio > 80 ? 'bg-[#00A19D]' : 'bg-[#FFB81C]')} style={{ width: `${vendor.fileRatio}%` }} />
                                </div>
                              </div>
                            </td>
                          </tr>
                        ))
                      )}
                    </tbody>
                  </table>
                </div>
              </section>
            </>
          )}
        </div>
      </main>

      {/* ===================== MODALS ===================== */}
      <NewUploadModal
        isOpen={isUploadModalOpen}
        onClose={() => setIsUploadModalOpen(false)}
        onSubmitManual={handleManualUpload}
        onSubmitExcel={handleExcelUpload}
        vendors={vendors.map((v) => v.name)}
        isUploading={isUploading}
      />

      <AnimatePresence>
        {previewFile && (
          <PreviewModal fileId={previewFile.id} fileName={previewFile.name} onClose={() => setPreviewFile(null)} />
        )}
      </AnimatePresence>

      <AnimatePresence>
        {deleteTarget && (
          <DeleteConfirmModal
            fileName={deleteTarget.name}
            onConfirm={handleDeleteConfirm}
            onCancel={() => setDeleteTarget(null)}
            isDeleting={isDeleting}
          />
        )}
      </AnimatePresence>

      <AnimatePresence>
        {toast && <Toast message={toast.message} type={toast.type} onClose={() => setToast(null)} />}
      </AnimatePresence>
    </div>
  );
}
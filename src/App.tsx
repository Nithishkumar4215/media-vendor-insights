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
  FilterIcon,
  SunIcon,
  MoonIcon,
  MenuIcon,
} from 'lucide-react';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
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

function formatDateTime(date: Date): string {
  const pad = (num: number) => String(num).padStart(2, '0');
  const yyyy = date.getFullYear();
  const mm = pad(date.getMonth() + 1);
  const dd = pad(date.getDate());
  const hh = pad(date.getHours());
  const min = pad(date.getMinutes());
  const ss = pad(date.getSeconds());
  return `${yyyy}-${mm}-${dd} ${hh}:${min}:${ss}`;
}

// --- Types ---
interface VendorRow {
  name: string;
  totalFiles: number;
  correctFiles: number;
  totalDataCount: number;
  correctDataCount: number;
  fileRatio: number;
}

interface FileDetail {
  id: string;
  dbId: number;
  name: string;
  date: string;
  status: 'Correct';
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
const Sidebar = ({ 
  activeTab, 
  onTabChange, 
  isDarkMode, 
  isOpen, 
  onClose 
}: { 
  activeTab: string; 
  onTabChange: (tab: string) => void; 
  isDarkMode: boolean; 
  isOpen: boolean; 
  onClose: () => void; 
}) => (
  <>
    {/* Desktop Sidebar: stays static and visible on lg+ */}
    <div className={cn(
      "w-64 border-r flex-col min-h-screen sticky top-0 h-screen overflow-y-auto hidden lg:flex select-none transition-all duration-300 shrink-0",
      isDarkMode 
        ? "bg-slate-900 border-slate-800 text-white" 
        : "bg-white border-slate-100 text-[#0c1329]"
    )}>
      <div className="p-8 pb-4 flex items-center gap-3">
        <div className="flex items-center gap-2 cursor-pointer" onClick={() => onTabChange('Overview')}>
          <div className="w-10 h-10 rounded-xl bg-[#005CB9] flex items-center justify-center shadow-lg shadow-blue-100">
            <DatabaseIcon className="text-white" size={20} />
          </div>
          <span className={cn("text-2xl font-bold tracking-tight", isDarkMode ? "text-slate-50" : "text-[#0D1E4C]")}>INCYTE</span>
        </div>
      </div>
      <div className="mt-12 px-6 space-y-1">
        <p className="text-[10px] font-bold text-slate-400 uppercase tracking-[0.2em] px-4 mb-4">Analytics</p>
        <SidebarLink icon={<LayoutDashboardIcon size={18} />} label="Overview" active={activeTab === 'Overview'} onClick={() => onTabChange('Overview')} isDarkMode={isDarkMode} />
        <SidebarLink icon={<BarChart3Icon size={18} />} label="Performance" active={activeTab === 'Performance'} onClick={() => onTabChange('Performance')} isDarkMode={isDarkMode} />
      </div>
      <div className="mt-auto p-6">
        <div className={cn(
          "p-4 rounded-2xl border transition-colors duration-300",
          isDarkMode ? "bg-slate-850 border-slate-755 text-slate-100" : "bg-slate-50 border-slate-100"
        )}>
          <p className="text-[10px] font-bold text-slate-400 uppercase mb-2">Storage</p>
          <div className={cn("h-1.5 w-full rounded-full overflow-hidden mb-2", isDarkMode ? "bg-slate-800" : "bg-slate-200")}>
            <div className="h-full bg-[#00B5E2] rounded-full w-[65%]" />
          </div>
          <p className={cn("text-[10px] font-bold", isDarkMode ? "text-slate-400" : "text-slate-600")}>65% of 10GB used</p>
        </div>
      </div>
    </div>

    {/* Mobile/Tablet Sidebar: Drawer with slide-in animation using motion */}
    <AnimatePresence>
      {isOpen && (
        <>
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="fixed inset-0 bg-slate-950/60 backdrop-blur-sm z-50 lg:hidden"
          />

          {/* Drawer */}
          <motion.div
            initial={{ x: '-100%' }}
            animate={{ x: 0 }}
            exit={{ x: '-100%' }}
            transition={{ type: 'spring', damping: 25, stiffness: 200 }}
            className={cn(
              "fixed top-0 left-0 bottom-0 w-64 z-50 flex flex-col h-screen overflow-y-auto lg:hidden select-none border-r shadow-2xl",
              isDarkMode 
                ? "bg-slate-900 border-slate-800 text-white" 
                : "bg-white border-slate-100 text-[#0c1329]"
            )}
          >
            {/* Header with Close option for easy accessibility */}
            <div className="p-8 pb-4 flex items-center justify-between">
              <div className="flex items-center gap-2 cursor-pointer" onClick={() => { onTabChange('Overview'); onClose(); }}>
                <div className="w-10 h-10 rounded-xl bg-[#005CB9] flex items-center justify-center shadow-lg shadow-blue-100">
                  <DatabaseIcon className="text-white" size={20} />
                </div>
                <span className={cn("text-2xl font-bold tracking-tight", isDarkMode ? "text-slate-50" : "text-[#0D1E4C]")}>INCYTE</span>
              </div>
              <button 
                onClick={onClose} 
                className={cn(
                  "p-1.5 rounded-lg border transition-all hover:scale-105 cursor-pointer", 
                  isDarkMode ? "border-slate-800 text-slate-400 hover:bg-slate-800 hover:text-white" : "border-slate-100 text-slate-500 hover:bg-slate-50 hover:text-slate-800"
                )}
              >
                <XIcon size={16} />
              </button>
            </div>

            <div className="mt-12 px-6 space-y-1">
              <p className="text-[10px] font-bold text-slate-400 uppercase tracking-[0.2em] px-4 mb-4">Analytics</p>
              <SidebarLink icon={<LayoutDashboardIcon size={18} />} label="Overview" active={activeTab === 'Overview'} onClick={() => { onTabChange('Overview'); onClose(); }} isDarkMode={isDarkMode} />
              <SidebarLink icon={<BarChart3Icon size={18} />} label="Performance" active={activeTab === 'Performance'} onClick={() => { onTabChange('Performance'); onClose(); }} isDarkMode={isDarkMode} />
            </div>

            <div className="mt-auto p-6">
              <div className={cn(
                "p-4 rounded-2xl border transition-colors duration-300",
                isDarkMode ? "bg-slate-850 border-slate-755 text-slate-100" : "bg-slate-50 border-slate-100"
              )}>
                <p className="text-[10px] font-bold text-slate-400 uppercase mb-2">Storage</p>
                <div className={cn("h-1.5 w-full rounded-full overflow-hidden mb-2", isDarkMode ? "bg-slate-800" : "bg-slate-200")}>
                  <div className="h-full bg-[#00B5E2] rounded-full w-[65%]" />
                </div>
                <p className={cn("text-[10px] font-bold", isDarkMode ? "text-slate-400" : "text-slate-600")}>65% of 10GB used</p>
              </div>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  </>
);

const SidebarLink = ({ icon, label, active, onClick, isDarkMode }: { icon: React.ReactNode; label: string; active?: boolean; onClick: () => void; isDarkMode?: boolean }) => (
  <button
    onClick={onClick}
    className={cn(
      'w-full flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-bold transition-all group cursor-pointer',
      active 
        ? 'bg-[#005CB9] text-white shadow-lg shadow-blue-200' 
        : (isDarkMode ? 'text-slate-400 hover:bg-slate-800 hover:text-white' : 'text-slate-500 hover:bg-slate-50 hover:text-[#005CB9]')
    )}
  >
    <span className={cn('transition-colors', active ? 'text-white' : 'text-slate-300 group-hover:text-[#00B5E2]')}>{icon}</span>
    {label}
  </button>
);

/// ============================================================
// HEADER
// ============================================================
const USER_PROFILES = {
  admin: {
    fullName: "Admin User",
    role: "System Administrator",
    initial: "A",
    avatarBg: "bg-blue-600 text-white border-blue-700",
    avatarBgDark: "bg-blue-600 text-slate-100 border-blue-800",
    color: "text-[#005CB9]"
  },
  'user 1': {
    fullName: "User 1",
    role: "Operator",
    initial: "1",
    avatarBg: "bg-teal-600 text-white border-teal-700",
    avatarBgDark: "bg-teal-600 text-slate-100 border-teal-800",
    color: "text-teal-600"
  },
  'user 2': {
    fullName: "User 2",
    role: "Operator",
    initial: "2",
    avatarBg: "bg-purple-600 text-white border-purple-700",
    avatarBgDark: "bg-purple-600 text-slate-100 border-purple-800",
    color: "text-purple-600"
  },
} as const;

const UserHeader = ({ 
  currentUser,
  onLogout, 
  isDarkMode, 
  onToggleDarkMode,
  onToggleSidebar,
  onSwitchUser,
}: { 
  currentUser: 'admin' | 'user 1' | 'user 2';
  onLogout: () => void; 
  isDarkMode: boolean; 
  onToggleDarkMode: () => void; 
  onToggleSidebar: () => void;
  onSwitchUser: (user: 'admin' | 'user 1' | 'user 2') => void;
}) => {
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const [challengeUser, setChallengeUser] = useState<'admin' | 'user 1' | 'user 2' | null>(null);
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');

  const dropdownRef = useRef<HTMLDivElement>(null);

  // Click outside to close dropdown
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsDropdownOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const handleChallengeSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!challengeUser) return;
    
    const correctPassword = challengeUser === 'admin' ? '123' : challengeUser === 'user 1' ? '456' : '789';
    if (password === correctPassword) {
      onSwitchUser(challengeUser);
      setChallengeUser(null);
      setPassword('');
      setError('');
      setIsDropdownOpen(false);
    } else {
      setError('Incorrect password');
    }
  };

  return (
    <div className={cn(
      "flex items-center justify-between px-6 lg:px-10 py-5 z-20 sticky top-0 backdrop-blur-sm select-none transition-all duration-300 border-b",
      isDarkMode 
        ? "bg-slate-900/95 border-slate-800/80 text-white" 
        : "bg-white/95 border-slate-100 text-slate-800"
    )}>
      <div className="flex items-center gap-2 text-slate-400 overflow-hidden">
        <button
          onClick={onToggleSidebar}
          className={cn(
            "p-2.5 rounded-xl border transition-all cursor-pointer flex items-center justify-center shadow-sm hover:scale-105 lg:hidden mr-2 shrink-0",
            isDarkMode
              ? "border-slate-805 bg-slate-800 text-slate-300 hover:bg-slate-700 hover:text-white"
              : "border-slate-200 bg-white text-slate-500 hover:bg-slate-50 hover:text-slate-805"
          )}
          title="Open Navigation"
        >
          <MenuIcon size={18} />
        </button>
        <span className="text-[10px] font-bold uppercase tracking-widest hidden sm:inline">Dashboard</span>
        <span className={cn("hidden sm:inline", isDarkMode ? "text-slate-700" : "text-slate-200")}>/</span>
        <span className={cn("text-[10px] font-bold uppercase tracking-widest truncate", isDarkMode ? "text-slate-200" : "text-[#0D1E4C]")}>
          Vendor Analytics
        </span>
      </div>
      <div className="flex items-center gap-4 lg:gap-6">
        {/* Light/Dark mode toggle button */}
        <button
          onClick={onToggleDarkMode}
          className={cn(
            "p-2.5 rounded-xl border transition-all cursor-pointer flex items-center justify-center shadow-sm hover:scale-105",
            isDarkMode
              ? "border-slate-800 bg-slate-800 text-yellow-400 hover:bg-slate-700"
              : "border-slate-200 bg-white text-slate-500 hover:bg-slate-50 hover:text-slate-800"
          )}
          title={isDarkMode ? "Switch to Light Mode" : "Switch to Dark Mode"}
        >
          {isDarkMode ? <SunIcon size={18} /> : <MoonIcon size={18} />}
        </button>

        {/* User Profile + Dropdown switch */}
        <div className="relative" ref={dropdownRef}>
          <div 
            onClick={() => setIsDropdownOpen(!isDropdownOpen)}
            className="flex items-center gap-4 cursor-pointer select-none group"
            title="Switch User"
          >
            <div className="flex flex-col items-end hidden sm:flex text-right">
              <span className={cn("font-bold text-sm leading-tight transition-colors group-hover:text-blue-500 md:group-hover:text-[#005CB9]", isDarkMode ? "text-slate-100 group-hover:text-blue-400" : "text-slate-800")}>
                {USER_PROFILES[currentUser].fullName}
              </span>
              <span className="text-[10px] text-slate-400 font-bold uppercase tracking-tight">
                {USER_PROFILES[currentUser].role}
              </span>
            </div>
            <div className={cn(
              "w-10 h-10 rounded-xl flex items-center justify-center font-bold border shadow-sm transition-all hover:scale-105 cursor-pointer ring-offset-2 ring-offset-transparent",
              isDarkMode 
                ? `${USER_PROFILES[currentUser].avatarBgDark} border-slate-700 group-hover:ring-2 group-hover:ring-blue-500` 
                : `${USER_PROFILES[currentUser].avatarBg} border-slate-200 group-hover:ring-2 group-hover:ring-[#005CB9]`
            )}>
              {USER_PROFILES[currentUser].initial}
            </div>
          </div>

          {/* User selection Dropdown menu */}
          <AnimatePresence>
            {isDropdownOpen && (
              <motion.div
                initial={{ opacity: 0, y: 10, scale: 0.95 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                exit={{ opacity: 0, y: 10, scale: 0.95 }}
                transition={{ duration: 0.15 }}
                className={cn(
                  "absolute right-0 mt-3 w-56 rounded-2xl border shadow-2xl p-2.5 z-55 text-left",
                  isDarkMode 
                    ? "bg-slate-900 border-slate-800 text-white shadow-black/40" 
                    : "bg-white border-slate-100 text-[#0c1329] shadow-slate-200/50"
                )}
              >
                <p className={cn(
                  "text-[9px] font-bold uppercase tracking-widest px-3 pt-1.5 pb-2 border-b mb-1.5",
                  isDarkMode ? "text-slate-450 border-slate-800" : "text-slate-400 border-slate-100"
                )}>
                  Select Profile to Switch
                </p>
                <div className="space-y-1">
                  {(Object.keys(USER_PROFILES) as Array<keyof typeof USER_PROFILES>).map((key) => {
                    const profile = USER_PROFILES[key];
                    const isActive = currentUser === key;
                    return (
                      <button
                        key={key}
                        onClick={() => {
                          if (isActive) {
                            setIsDropdownOpen(false);
                          } else {
                            setChallengeUser(key);
                            setError('');
                            setPassword('');
                          }
                        }}
                        className={cn(
                          "w-full flex items-center gap-3 px-3 py-2 rounded-xl text-xs font-bold transition-all text-left cursor-pointer",
                          isActive 
                            ? (isDarkMode ? "bg-slate-800 text-white" : "bg-slate-100 text-slate-800 cursor-default")
                            : (isDarkMode ? "hover:bg-slate-800 text-slate-300 hover:text-white" : "hover:bg-slate-50 text-slate-600 hover:text-slate-900")
                        )}
                      >
                        <div className={cn(
                          "w-7 h-7 rounded-lg flex items-center justify-center font-bold text-[10px] border shrink-0",
                          isDarkMode ? profile.avatarBgDark : profile.avatarBg
                        )}>
                          {profile.initial}
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="truncate font-sans font-bold">{profile.fullName}</p>
                          <p className="text-[9px] text-slate-400 font-semibold tracking-wide uppercase">{profile.role}</p>
                        </div>
                        {isActive && (
                          <div className="w-2 h-2 rounded-full bg-emerald-500 shrink-0" />
                        )}
                      </button>
                    );
                  })}
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        <div className={cn("h-6 w-px", isDarkMode ? "bg-slate-800" : "bg-slate-200")} />
        <button 
          onClick={onLogout} 
          className={cn(
            "p-2 rounded-xl transition-all cursor-pointer", 
            isDarkMode ? "text-slate-400 hover:bg-slate-800 hover:text-red-400" : "text-slate-400 hover:bg-slate-50 hover:text-red-500"
          )}
          title="Logout"
        >
          <LogOutIcon size={18} />
        </button>
      </div>

      {/* Switch User Password verification Modal */}
      <AnimatePresence>
        {challengeUser && (
          <div className="fixed inset-0 z-[300] flex items-center justify-center p-4">
            {/* Backdrop */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setChallengeUser(null)}
              className="fixed inset-0 bg-slate-950/60 backdrop-blur-sm"
            />
            
            {/* Modal Body */}
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 15 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 15 }}
              transition={{ type: "spring", damping: 25, stiffness: 350 }}
              className={cn(
                "w-full max-w-sm rounded-[2.25rem] border shadow-2xl overflow-hidden relative z-10",
                isDarkMode ? "bg-slate-900 border-slate-800 text-white" : "bg-white border-slate-100 text-slate-800"
              )}
            >
              <div className="p-8">
                <div className="flex justify-center mb-6">
                  <div className={cn(
                    "w-14 h-14 rounded-2xl flex items-center justify-center font-bold text-lg border shadow-sm",
                    isDarkMode ? USER_PROFILES[challengeUser].avatarBgDark : USER_PROFILES[challengeUser].avatarBg
                  )}>
                    {USER_PROFILES[challengeUser].initial}
                  </div>
                </div>
                
                <h3 className={cn("text-xl font-bold text-center tracking-tight mb-1", isDarkMode ? "text-slate-100" : "text-[#0D1E4C]")}>
                  Switch to {USER_PROFILES[challengeUser].fullName}
                </h3>
                <p className="text-center text-slate-400 text-[10px] font-bold uppercase tracking-widest mb-6">
                  Authentication Required
                </p>

                <form onSubmit={handleChallengeSubmit} className="space-y-4">
                  <div>
                    <label className="text-[9px] font-bold text-slate-400 uppercase tracking-[0.2em] block mb-2 px-1">
                      Enter Password
                    </label>
                    <input
                      type="password"
                      autoFocus
                      required
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      className={cn(
                        "w-full px-5 py-3.5 rounded-xl border outline-none text-xs font-bold transition-all font-mono",
                        isDarkMode 
                          ? "border-slate-700 bg-slate-850 text-slate-100 focus:ring-2 focus:ring-slate-800 placeholder:text-slate-500" 
                          : "border-slate-200 bg-slate-50 text-slate-700 focus:ring-2 focus:ring-blue-100"
                      )}
                      placeholder="••••••••"
                    />
                  </div>

                  {error && (
                    <p className="text-[#E4002B] text-xs font-bold text-center mt-1">
                      {error}
                    </p>
                  )}

                  <div className="flex gap-3 pt-2">
                    <button
                      type="button"
                      onClick={() => setChallengeUser(null)}
                      className={cn(
                        "flex-1 px-5 py-3 rounded-xl text-xs font-bold uppercase tracking-wider border transition-all cursor-pointer",
                        isDarkMode 
                          ? "border-slate-700 hover:bg-slate-800 text-slate-300"
                          : "border-slate-200 hover:bg-slate-50 text-slate-650"
                      )}
                    >
                      Cancel
                    </button>
                    <button
                      type="submit"
                      className="flex-1 px-5 py-3 bg-[#005CB9] hover:bg-[#004A99] text-white rounded-xl text-xs font-bold uppercase tracking-wider transition-all shadow-md cursor-pointer"
                    >
                      Confirm
                    </button>
                  </div>
                </form>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
};

// ============================================================
// CHART HELPERS
// ============================================================
const ChartCard = ({ children, title, className, isDarkMode }: { children: React.ReactNode; title: string; className?: string; isDarkMode?: boolean }) => (
  <div className={cn(
    'rounded-[2.5rem] p-10 border shadow-sm transition-all duration-300', 
    isDarkMode ? 'bg-slate-900 border-slate-800/80 text-slate-100' : 'bg-white border-slate-100 text-[#001D41]',
    className
  )}>
    <h3 className={cn("text-lg font-bold mb-1 flex items-center gap-3 select-none", isDarkMode ? "text-slate-100" : "text-[#0D1E4C]")}>
      <span className="w-2 h-2 rounded-full bg-[#005CB9]" />
      {title}
    </h3>
    {children}
  </div>
);

const ProgressItem = ({ label, total, color, perc, isDarkMode }: { label: string; total: number; color: string; perc: number; isDarkMode?: boolean }) => (
  <div className="space-y-4">
    <div className="flex justify-between items-end">
      <div className="flex flex-col">
        <span className="text-[10px] font-bold uppercase tracking-[0.2em] text-slate-400 mb-1">{label}</span>
        <div className="flex items-center gap-2">
          <span className={cn("text-2xl font-bold", isDarkMode ? "text-slate-50" : "text-[#0D1E4C]")}>{total.toLocaleString()}</span>
          <span className="text-[10px] font-bold text-slate-300 uppercase">Audit Records</span>
        </div>
      </div>
      <div className="flex flex-col items-end">
        <span className="text-sm font-bold" style={{ color }}>{perc}%</span>
        <span className="text-[10px] font-bold text-slate-300 uppercase">of total set</span>
      </div>
    </div>
    <div className={cn("h-3 w-full rounded-full overflow-hidden shadow-inner p-0.5", isDarkMode ? "bg-slate-800" : "bg-slate-100")}>
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

const DetailStat = ({ label, value, icon, color, isDarkMode }: { label: string; value: string | number; icon: React.ReactNode; color: string; isDarkMode?: boolean }) => {
  const themeMap: Record<string, {
    cardBg: string;
    cardBorder: string;
    valueText: string;
    labelText: string;
    iconBg: string;
    iconText: string;
    pulseDot: string;
  }> = isDarkMode ? {
    'yellow-frame': {
      cardBg: 'bg-yellow-950/20',
      cardBorder: 'border-yellow-500/20',
      valueText: 'text-yellow-100',
      labelText: 'text-yellow-400/80',
      iconBg: 'bg-yellow-900/40',
      iconText: 'text-yellow-300',
      pulseDot: 'bg-yellow-450',
    },
    'green-frame': {
      cardBg: 'bg-emerald-950/20',
      cardBorder: 'border-emerald-500/20',
      valueText: 'text-emerald-100',
      labelText: 'text-emerald-400/80',
      iconBg: 'bg-emerald-900/40',
      iconText: 'text-emerald-300',
      pulseDot: 'bg-emerald-450',
    },
    'peach-[#703106]': {
      cardBg: 'bg-amber-950/20',
      cardBorder: 'border-amber-500/20',
      valueText: 'text-amber-100',
      labelText: 'text-amber-400/80',
      iconBg: 'bg-amber-900/40',
      iconText: 'text-amber-300',
      pulseDot: 'bg-amber-450',
    },
    'peach-frame': {
      cardBg: 'bg-amber-950/20',
      cardBorder: 'border-amber-500/20',
      valueText: 'text-amber-100',
      labelText: 'text-amber-400/80',
      iconBg: 'bg-amber-900/40',
      iconText: 'text-amber-300',
      pulseDot: 'bg-amber-450',
    },
    primary: {
      cardBg: 'bg-slate-905',
      cardBorder: 'border-slate-800',
      valueText: 'text-slate-100',
      labelText: 'text-slate-400',
      iconBg: 'bg-[#005CB9]',
      iconText: 'text-white shadow-blue-900',
      pulseDot: 'bg-[#00B5E2]',
    },
    success: {
      cardBg: 'bg-slate-905',
      cardBorder: 'border-slate-800',
      valueText: 'text-slate-100',
      labelText: 'text-slate-400',
      iconBg: 'bg-[#00A19D]',
      iconText: 'text-white shadow-teal-900',
      pulseDot: 'bg-[#00A19D]',
    },
    slate: {
      cardBg: 'bg-slate-905',
      cardBorder: 'border-slate-800',
      valueText: 'text-slate-100',
      labelText: 'text-slate-400',
      iconBg: 'bg-slate-800',
      iconText: 'text-white shadow-slate-950',
      pulseDot: 'bg-slate-400',
    },
  } : {
    'yellow-frame': {
      cardBg: 'bg-[#FFFDE8]',
      cardBorder: 'border-[#F8EEB2]',
      valueText: 'text-[#5A4D11]',
      labelText: 'text-[#9C8B49]',
      iconBg: 'bg-[#FDF3C0]',
      iconText: 'text-[#B0920F]',
      pulseDot: 'bg-[#E3BE1B]',
    },
    'green-frame': {
      cardBg: 'bg-[#EFFCEB]',
      cardBorder: 'border-[#D4F5C9]',
      valueText: 'text-[#1C4C18]',
      labelText: 'text-[#5E8C59]',
      iconBg: 'bg-[#D6F7CE]',
      iconText: 'text-[#25821D]',
      pulseDot: 'bg-[#2E9C25]',
    },
    'peach-[#703106]': {
      cardBg: 'bg-[#FFF2E9]',
      cardBorder: 'border-[#FEDEBF]',
      valueText: 'text-[#703106]',
      labelText: 'text-[#A06E4A]',
      iconBg: 'bg-[#FFE6D3]',
      iconText: 'text-[#CA5F15]',
      pulseDot: 'bg-[#E06D1F]',
    },
    'peach-frame': {
      cardBg: 'bg-[#FFF2E9]',
      cardBorder: 'border-[#FEDEBF]',
      valueText: 'text-[#703106]',
      labelText: 'text-[#A06E4A]',
      iconBg: 'bg-[#FFE6D3]',
      iconText: 'text-[#CA5F15]',
      pulseDot: 'bg-[#E06D1F]',
    },
    primary: {
      cardBg: 'bg-white',
      cardBorder: 'border-slate-100',
      valueText: 'text-[#0D1E4C]',
      labelText: 'text-slate-400',
      iconBg: 'bg-[#005CB9]',
      iconText: 'text-white shadow-blue-100',
      pulseDot: 'bg-[#00B5E2]',
    },
    success: {
      cardBg: 'bg-white',
      cardBorder: 'border-slate-100',
      valueText: 'text-[#0D1E4C]',
      labelText: 'text-slate-400',
      iconBg: 'bg-[#00A19D]',
      iconText: 'text-white shadow-teal-100',
      pulseDot: 'bg-[#00A19D]',
    },
    slate: {
      cardBg: 'bg-white',
      cardBorder: 'border-slate-100',
      valueText: 'text-[#0D1E4C]',
      labelText: 'text-slate-400',
      iconBg: 'bg-[#0D1E4C]',
      iconText: 'text-white shadow-slate-100',
      pulseDot: 'bg-slate-300',
    },
  };

  const theme = themeMap[color] || themeMap.primary;

  return (
    <div className={cn(
      "p-8 rounded-[2rem] border transition-all duration-300 group select-none relative overflow-hidden flex flex-col justify-between min-h-[195px]",
      theme.cardBg,
      theme.cardBorder,
      "shadow-sm hover:shadow-xl hover:translate-y-[-6px]"
    )}>
      {/* Decorative subtle ambient lights */}
      <div className="absolute top-0 right-0 w-24 h-24 bg-white/45 rounded-full blur-2xl pointer-events-none -translate-y-6 translate-x-6" />
      
      <div>
        <div className="flex items-center justify-between mb-6">
          <div className={cn(
            'w-14 h-14 rounded-2xl flex items-center justify-center transition-all duration-500 group-hover:scale-105 group-hover:rotate-[8deg] shadow-md', 
            theme.iconBg, 
            theme.iconText
          )}>
            {icon}
          </div>
          <div className="flex items-center gap-2">
            <span className="relative flex h-2 w-2">
              <span className={cn("animate-ping absolute inline-flex h-full w-full rounded-full opacity-75", theme.pulseDot)}></span>
              <span className={cn("relative inline-flex rounded-full h-2 w-2", theme.pulseDot)}></span>
            </span>
            <span className="text-[9px] font-bold tracking-widest text-slate-400 uppercase">Audit state</span>
          </div>
        </div>
        
        <div className="space-y-1">
          <p className={cn("text-[10px] font-bold uppercase tracking-[0.2em]", theme.labelText)}>{label}</p>
          <p className={cn("text-3xl font-extrabold tracking-tight", theme.valueText)}>{value}</p>
        </div>
      </div>
    </div>
  );
};

const TableHead = ({ label, onClick, activeSort, isDarkMode }: { label: string; onClick?: () => void; activeSort?: 'asc' | 'desc' | null; isDarkMode?: boolean }) => (
  <th
    className={cn('px-6 lg:px-10 py-6 text-left text-[10px] font-bold tracking-[0.15em] text-slate-400 whitespace-nowrap transition-colors select-none', onClick ? (isDarkMode ? 'cursor-pointer hover:bg-slate-800/80 group' : 'cursor-pointer hover:bg-slate-100/80 group') : '')}
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
const PreviewModal = ({ fileId, fileName, onClose, isDarkMode }: { fileId: number; fileName: string; onClose: () => void; isDarkMode?: boolean }) => {
  const [previewData, setPreviewData] = useState<PreviewData | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [page, setPage] = useState(0);
  const PAGE_SIZE = 10;

  useEffect(() => {
    const fetchPreview = async () => {
      try {
        const res = await fetch(`/api/files/${fileId}/data`, {
          headers: { 'bypass-tunnel-reminder': 'true' }
        });
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
    <div className={cn("fixed inset-0 z-[150] flex items-center justify-center p-4 backdrop-blur-md transition-colors", isDarkMode ? "bg-black/80" : "bg-[#0D1E4C]/70")}>
      <motion.div
        initial={{ opacity: 0, scale: 0.92, y: 20 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.92 }}
        className={cn(
          "w-full max-w-6xl max-h-[90vh] flex flex-col shadow-2xl border overflow-hidden rounded-[2rem] transition-all",
          isDarkMode ? "bg-slate-900 border-slate-800 text-slate-100" : "bg-white border-slate-200 text-slate-800"
        )}
      >
        {/* Header */}
        <div className={cn(
          "px-8 py-6 border-b flex items-center justify-between shrink-0 transition-colors",
          isDarkMode ? "border-slate-800 bg-slate-900/60" : "border-slate-100 bg-slate-50/40"
        )}>
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 rounded-2xl bg-[#005CB9] flex items-center justify-center shadow-lg shadow-blue-100 shrink-0">
              <FileSpreadsheetIcon size={22} className="text-white" />
            </div>
            <div>
              <h2 className={cn("text-xl font-bold uppercase tracking-tight", isDarkMode ? "text-slate-50" : "text-[#0D1E4C]")}>{fileName}</h2>
              <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mt-0.5">
                {previewData ? `${previewData.data.length} rows · ${columns.length} columns` : 'Loading...'}
              </p>
            </div>
          </div>
          <button 
            onClick={onClose} 
            className={cn(
              "w-10 h-10 rounded-xl border flex items-center justify-center transition-all cursor-pointer text-slate-400 hover:text-slate-700",
              isDarkMode ? "border-slate-750 bg-slate-800 text-slate-300 hover:bg-slate-700 hover:text-white" : "border-slate-200 bg-white hover:bg-slate-100"
            )}
          >
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
            <div className="flex items-center justify-center h-48 text-[#E4002B] font-bold text-sm">{error}</div>
          ) : (
            <div className={cn("overflow-x-auto rounded-xl border", isDarkMode ? "border-slate-800" : "border-slate-100")}>
              <table className="w-full text-sm min-w-max">
                <thead>
                  <tr className={isDarkMode ? "bg-slate-850" : "bg-slate-50"}>
                    {columns.map((col) => (
                      <th key={col} className={cn("px-5 py-4 text-left text-[10px] font-bold uppercase tracking-[0.15em] text-slate-500 whitespace-nowrap border-b", isDarkMode ? "border-slate-800" : "border-slate-100")}>
                        {col}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody className={cn("divide-y", isDarkMode ? "divide-slate-800/50" : "divide-slate-50")}>
                  {pageData.map((row, i) => (
                    <tr key={i} className={isDarkMode ? "hover:bg-slate-800/30 transition-colors" : "hover:bg-slate-50/60 transition-colors"}>
                      {columns.map((col) => (
                        <td key={col} className={cn("px-5 py-3.5 text-xs font-medium whitespace-nowrap max-w-xs truncate", isDarkMode ? "text-slate-300" : "text-slate-700")}>
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
          <div className={cn(
            "px-8 py-5 border-t flex items-center justify-between shrink-0 transition-colors",
            isDarkMode ? "border-slate-800 bg-slate-900/40" : "border-slate-100 bg-slate-50/30"
          )}>
            <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">
              Page {page + 1} of {totalPages} · {previewData?.data.length} rows
            </p>
            <div className="flex items-center gap-2">
              <button
                onClick={() => setPage((p) => Math.max(0, p - 1))}
                disabled={page === 0}
                className={cn(
                  "w-9 h-9 rounded-xl border flex items-center justify-center transition-all cursor-pointer",
                  isDarkMode ? "border-slate-700 bg-slate-800 text-slate-300 hover:bg-slate-700 disabled:opacity-20" : "border-slate-200 text-slate-500 hover:bg-slate-100 disabled:opacity-40 disabled:cursor-not-allowed"
                )}
              >
                <ChevronLeftIcon size={16} />
              </button>
              <button
                onClick={() => setPage((p) => Math.min(totalPages - 1, p + 1))}
                disabled={page === totalPages - 1}
                className={cn(
                  "w-9 h-9 rounded-xl border flex items-center justify-center transition-all cursor-pointer",
                  isDarkMode ? "border-slate-700 bg-slate-800 text-slate-300 hover:bg-slate-700 disabled:opacity-20" : "border-slate-200 text-slate-500 hover:bg-slate-100 disabled:opacity-40 disabled:cursor-not-allowed"
                )}
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
const DeleteConfirmModal = ({ fileName, onConfirm, onCancel, isDeleting, isDarkMode }: { fileName: string; onConfirm: () => void; onCancel: () => void; isDeleting: boolean; isDarkMode?: boolean }) => (
  <div className={cn("fixed inset-0 z-[160] flex items-center justify-center p-6 backdrop-blur-md transition-colors", isDarkMode ? "bg-black/80" : "bg-[#0D1E4C]/70")}>
    <motion.div
      initial={{ opacity: 0, scale: 0.9 }}
      animate={{ opacity: 1, scale: 1 }}
      exit={{ opacity: 0, scale: 0.9 }}
      className={cn(
        "rounded-[2rem] w-full max-w-md shadow-2xl border overflow-hidden transition-all",
        isDarkMode ? "bg-slate-900 border-slate-800 text-slate-100" : "bg-white border-slate-200 text-slate-800"
      )}
    >
      <div className="p-10">
        <div className={cn("w-16 h-16 rounded-2xl flex items-center justify-center mx-auto mb-6", isDarkMode ? "bg-red-950/40" : "bg-red-50")}>
          <TrashIcon size={28} className="text-[#E4002B]" />
        </div>
        <h2 className={cn("text-2xl font-bold text-center mb-2 uppercase", isDarkMode ? "text-slate-100" : "text-[#0D1E4C]")}>Delete Record</h2>
        <p className="text-sm text-slate-400 text-center font-medium mb-2">This action cannot be undone.</p>
        <p className={cn("text-xs text-center font-bold rounded-xl px-4 py-3 border truncate font-mono", isDarkMode ? "bg-slate-850 border-slate-800 text-slate-300" : "bg-slate-50 border-slate-100 text-slate-500")}>{fileName}</p>
      </div>
      <div className="px-10 pb-10 flex gap-4">
        <button onClick={onCancel} className={cn("flex-1 px-6 py-4 border rounded-2xl text-xs font-bold uppercase tracking-widest transition-all cursor-pointer", isDarkMode ? "border-slate-700 bg-slate-800 text-slate-300 hover:bg-slate-700" : "border-slate-200 text-slate-500 hover:bg-slate-50")}>
          Cancel
        </button>
        <button
          onClick={onConfirm}
          disabled={isDeleting}
          className="flex-1 px-6 py-4 bg-[#E4002B] text-white rounded-2xl text-xs font-bold uppercase tracking-widest hover:bg-red-700 transition-all disabled:opacity-60 disabled:cursor-not-allowed cursor-pointer"
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
  isOpen, onClose, onSubmitManual, onSubmitExcel, vendors, isUploading, isDarkMode,
}: {
  isOpen: boolean;
  onClose: () => void;
  onSubmitManual: (data: any) => void;
  onSubmitExcel: (vendor: string, file: File) => void;
  vendors: string[];
  isUploading: boolean;
  isDarkMode?: boolean;
}) => {
  const [mode, setMode] = useState<'manual' | 'excel'>('manual');
  const [vendor, setVendor] = useState(vendors[0] || '');
  const [fileName, setFileName] = useState('');
  const [dataCount, setDataCount] = useState(0);
  const status = 'Correct';
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
    <div className={cn("fixed inset-0 z-[100] flex items-center justify-center p-6 backdrop-blur-md transition-colors", isDarkMode ? "bg-black/80" : "bg-[#0D1E4C]/60")}>
      <motion.div
        initial={{ opacity: 0, scale: 0.9, y: 30 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        className={cn(
          "w-full max-w-lg shadow-2xl overflow-hidden border transition-all rounded-[2.5rem]",
          isDarkMode ? "bg-slate-900 border-slate-800 text-slate-100" : "bg-white border-slate-200 text-slate-800"
        )}
      >
        {/* Modal Header */}
        <div className={cn(
          "p-10 border-b flex justify-between items-center transition-colors",
          isDarkMode ? "border-slate-800 bg-slate-900/60" : "border-slate-100 bg-slate-50/30"
        )}>
          <div>
            <h2 className={cn("text-3xl font-bold uppercase", isDarkMode ? "text-slate-50" : "text-[#0D1E4C]")}>Upload Data</h2>
            <p className="text-[10px] font-bold text-slate-400 uppercase tracking-[0.2em] mt-1">
              {mode === 'manual' ? 'Manual system injection' : 'Excel / CSV file upload'}
            </p>
          </div>
          <button 
            onClick={onClose} 
            className={cn(
              "w-12 h-12 rounded-2xl border flex items-center justify-center transition-colors cursor-pointer",
              isDarkMode ? "border-slate-700 bg-slate-800 hover:bg-slate-700 text-slate-350" : "border-slate-200 hover:bg-slate-100 text-slate-400"
            )}
          >
            <XIcon size={20} />
          </button>
        </div>

        {/* Tab Toggle */}
        <div className="px-10 pt-8 flex gap-3">
          <button
            onClick={() => setMode('manual')}
            className={cn(
              'flex-1 py-3 rounded-2xl text-xs font-bold uppercase tracking-widest transition-all border cursor-pointer',
              mode === 'manual' 
                ? 'bg-[#005CB9] text-white border-[#005CB9] shadow-lg shadow-blue-100' 
                : (isDarkMode ? 'bg-slate-800 text-slate-400 border-slate-700 hover:bg-slate-700' : 'bg-slate-50 text-slate-500 border-slate-200 hover:bg-slate-100')
            )}
          >
            Manual Entry
          </button>
          <button
            onClick={() => setMode('excel')}
            className={cn(
              'flex-1 py-3 rounded-2xl text-xs font-bold uppercase tracking-widest transition-all border cursor-pointer',
              mode === 'excel' 
                ? 'bg-[#005CB9] text-white border-[#005CB9] shadow-lg shadow-blue-100' 
                : (isDarkMode ? 'bg-slate-800 text-slate-400 border-slate-700 hover:bg-slate-700' : 'bg-slate-50 text-slate-500 border-slate-200 hover:bg-slate-100')
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
              className={cn(
                "w-full px-6 py-4 rounded-2xl border outline-none text-sm font-bold transition-all uppercase",
                isDarkMode 
                  ? "border-slate-700 focus:ring-4 focus:ring-slate-850 text-slate-100 bg-slate-800" 
                  : "border-slate-200 focus:ring-4 focus:ring-blue-50 text-[#0D1E4C] bg-slate-50"
              )}
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
                  className={cn(
                    "w-full px-6 py-4 rounded-2xl border outline-none text-sm font-bold transition-all uppercase font-mono",
                    isDarkMode 
                      ? "border-slate-700 focus:ring-4 focus:ring-slate-850 text-slate-100 bg-slate-800 placeholder:text-slate-500" 
                      : "border-slate-200 focus:ring-4 focus:ring-blue-50 text-[#0D1E4C] bg-white placeholder:text-slate-300"
                  )}
                />
              </div>
              <div className="space-y-3">
                <label className="text-[10px] font-bold text-slate-400 uppercase tracking-[0.25em] block ml-1">Record Count</label>
                <input
                  type="number"
                  value={dataCount}
                  onChange={(e) => setDataCount(parseInt(e.target.value) || 0)}
                  className={cn(
                    "w-full px-6 py-4 rounded-2xl border outline-none text-sm font-bold transition-all",
                    isDarkMode 
                      ? "border-slate-700 focus:ring-4 focus:ring-slate-850 text-slate-100 bg-slate-800" 
                      : "border-slate-200 focus:ring-4 focus:ring-blue-50 text-[#0D1E4C] bg-slate-50"
                  )}
                />
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
                  selectedFile 
                    ? (isDarkMode ? 'border-[#005CB9] bg-blue-950/20' : 'border-[#005CB9] bg-blue-50') 
                    : (isDarkMode ? 'border-slate-700 hover:border-slate-600 bg-slate-800' : 'border-slate-200 hover:border-slate-300 bg-slate-50')
                )}
              >
                <input ref={fileInputRef} type="file" accept=".xlsx,.xls,.csv" className="hidden" onChange={handleFileChange} />
                {selectedFile ? (
                  <>
                    <FileSpreadsheetIcon size={32} className="text-[#005CB9] mb-3" />
                    <p className={cn("text-sm font-bold text-center truncate max-w-full", isDarkMode ? "text-slate-100" : "text-[#0D1E4C]")}>{selectedFile.name}</p>
                    <p className="text-[10px] font-bold text-slate-450 uppercase tracking-widest mt-1">{(selectedFile.size / 1024).toFixed(1)} KB</p>
                    <button
                      onClick={(e) => { e.stopPropagation(); setSelectedFile(null); if (fileInputRef.current) fileInputRef.current.value = ''; }}
                      className="mt-3 text-[10px] font-bold text-red-400 hover:text-red-500 uppercase tracking-widest cursor-pointer"
                    >
                      Remove file
                    </button>
                  </>
                ) : (
                  <>
                    <UploadIcon size={32} className="text-slate-400 mb-3" />
                    <p className="text-sm font-bold text-slate-400 text-center">Drop file here or click to browse</p>
                    <p className="text-[10px] font-bold text-slate-500 uppercase tracking-widest mt-1">.xlsx · .xls · .csv</p>
                  </>
                )}
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className={cn(
          "p-10 flex gap-4 transition-colors pt-6",
          isDarkMode ? "bg-slate-950/40" : "bg-slate-50/50"
        )}>
          <button 
            onClick={onClose} 
            className={cn(
              "flex-1 px-8 py-5 border rounded-2xl text-xs font-bold uppercase tracking-widest hover:bg-white transition-all shadow-sm cursor-pointer",
              isDarkMode ? "border-slate-700 bg-slate-800 text-slate-300 hover:bg-slate-700" : "border-slate-200 text-slate-500 hover:bg-slate-50"
            )}
          >
            Abort
          </button>
          <button
            onClick={handleSubmit}
            disabled={isUploading || (mode === 'excel' && !selectedFile) || !vendor}
            className={cn(
              'flex-1 px-8 py-5 text-white rounded-2xl text-xs font-bold uppercase tracking-[0.2em] transition-all shadow-xl cursor-pointer',
              isUploading || (mode === 'excel' && !selectedFile) || !vendor
                ? 'bg-slate-400 shadow-none cursor-not-allowed'
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
const Toast = ({ message, type, onClose, isDarkMode }: { message: string; type: 'success' | 'error'; onClose: () => void; isDarkMode?: boolean }) => (
  <motion.div
    initial={{ opacity: 0, y: 40, scale: 0.95 }}
    animate={{ opacity: 1, y: 0, scale: 1 }}
    exit={{ opacity: 0, y: 20, scale: 0.95 }}
    className={cn(
      'fixed bottom-8 right-8 z-[200] flex items-center gap-4 px-6 py-4 rounded-2xl shadow-2xl border text-sm font-bold transition-colors',
      isDarkMode 
        ? 'bg-slate-900 text-slate-100 border-slate-700' 
        : 'bg-white text-[#0D1E4C] border-slate-200'
    )}
  >
    {type === 'success' ? <CheckCircle2Icon size={20} className="text-[#00A19D] shrink-0" /> : <AlertCircleIcon size={20} className="text-[#E4002B] shrink-0" />}
    <span>{message}</span>
    <button onClick={onClose} className="ml-2 text-slate-450 hover:text-red-500 transition-colors cursor-pointer">
      <XIcon size={16} />
    </button>
  </motion.div>
);

const LoginPage = ({ onLogin, isDarkMode, onToggleDarkMode }: { onLogin: (user: 'admin' | 'user 1' | 'user 2') => void; isDarkMode?: boolean; onToggleDarkMode?: () => void }) => {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const normalizedUsername = username.toLowerCase().trim();
    if (normalizedUsername === 'admin' && password === '123') {
      onLogin('admin');
    } else if (normalizedUsername === 'user 1' && password === '456') {
      onLogin('user 1');
    } else if (normalizedUsername === 'user 2' && password === '789') {
      onLogin('user 2');
    } else {
      setError('Invalid username or password');
    }
  };

  return (
    <div className={cn("min-h-screen flex items-center justify-center p-4 font-sans select-none transition-all duration-300 relative", isDarkMode ? "bg-slate-950 text-white" : "bg-slate-50 text-slate-800")}>
      {/* Absolute theme toggle wrapper on the top-right of LoginPage */}
      {onToggleDarkMode && (
        <button
          onClick={onToggleDarkMode}
          className={cn(
            "absolute top-6 right-6 p-3 rounded-xl border transition-all cursor-pointer flex items-center justify-center shadow-sm hover:scale-105",
            isDarkMode
              ? "border-slate-800 bg-slate-900 text-yellow-400 hover:bg-slate-800"
              : "border-slate-200 bg-white text-slate-500 hover:bg-slate-50 hover:text-slate-800"
          )}
          title={isDarkMode ? "Switch to Light Mode" : "Switch to Dark Mode"}
        >
          {isDarkMode ? <SunIcon size={18} /> : <MoonIcon size={18} />}
        </button>
      )}

      <div className={cn(
        "p-10 rounded-[2.5rem] shadow-xl border w-full max-w-md transition-all duration-300",
        isDarkMode ? "bg-slate-900 border-slate-800/80" : "bg-white border-slate-100"
      )}>
        <div className="flex justify-center mb-8">
          <div className="w-16 h-16 rounded-2xl bg-[#005CB9] flex items-center justify-center shadow-lg shadow-blue-100/40">
            <DatabaseIcon className="text-white" size={32} />
          </div>
        </div>
        <h2 className={cn("text-3xl font-bold text-center mb-2 tracking-tight", isDarkMode ? "text-slate-100" : "text-[#0D1E4C]")}>Welcome Back</h2>
        <p className="text-center text-slate-400 text-[10px] font-bold uppercase tracking-[0.2em] mb-8">Login to Incyte Analytics</p>
        
        <form onSubmit={handleSubmit} className="space-y-6">
          <div>
            <label className="text-[10px] font-bold text-slate-400 uppercase tracking-[0.25em] block ml-1 mb-2">Username</label>
            <input
              type="text"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              className={cn(
                "w-full px-6 py-4 rounded-2xl border outline-none text-sm font-bold transition-all font-mono",
                isDarkMode 
                  ? "border-slate-700 bg-slate-800 text-slate-100 focus:ring-4 focus:ring-slate-850 placeholder:text-slate-500" 
                  : "border-slate-200 bg-slate-50 text-[#0D1E4C] focus:ring-4 focus:ring-blue-50"
              )}
              placeholder="Enter username"
            />
          </div>
          <div>
            <label className="text-[10px] font-bold text-slate-400 uppercase tracking-[0.25em] block ml-1 mb-2">Password</label>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className={cn(
                "w-full px-6 py-4 rounded-2xl border outline-none text-sm font-bold transition-all font-mono",
                isDarkMode 
                  ? "border-slate-700 bg-slate-800 text-slate-100 focus:ring-4 focus:ring-slate-850 placeholder:text-slate-500" 
                  : "border-slate-200 bg-slate-50 text-[#0D1E4C] focus:ring-4 focus:ring-blue-50"
              )}
              placeholder="••••••••"
            />
          </div>
          
          {error && <p className="text-[#E4002B] text-xs font-bold text-center">{error}</p>}
          
          <button
            type="submit"
            className={cn(
              "w-full px-8 py-5 bg-[#005CB9] text-white rounded-2xl text-xs font-bold uppercase tracking-[0.2em] transition-all hover:bg-[#004A99] shadow-xl mt-4 cursor-pointer",
              isDarkMode ? "shadow-slate-950/20" : "shadow-blue-200"
            )}
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
  const [isDarkMode, setIsDarkMode] = useState(() => {
    return localStorage.getItem('isDarkMode') === 'true';
  });

  const toggleDarkMode = () => {
    setIsDarkMode((prev) => {
      const next = !prev;
      localStorage.setItem('isDarkMode', String(next));
      return next;
    });
  };

  const [currentUser, setCurrentUser] = useState<'admin' | 'user 1' | 'user 2'>(() => {
    return (localStorage.getItem('currentUser') as 'admin' | 'user 1' | 'user 2') || 'admin';
  });

  const [isAuthenticated, setIsAuthenticated] = useState(() => {
    return localStorage.getItem('isAuthenticated') === 'true';
  });
  const [activeTab, setActiveTab] = useState('Overview');
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [vendors, setVendors] = useState<VendorRow[]>([]);
  const [vendorDetails, setVendorDetails] = useState<Record<string, FileDetail[]>>({});
  const [isUploadModalOpen, setIsUploadModalOpen] = useState(false);
  const [selectedVendor, setSelectedVendor] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [sortConfig, setSortConfig] = useState<{ key: keyof FileDetail; direction: 'asc' | 'desc' } | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isUploading, setIsUploading] = useState(false);
  const [trendData, setTrendData] = useState(DEFAULT_TREND_DATA);

  // Column-specific filters for files registry
  const [filterId, setFilterId] = useState('');
  const [filterName, setFilterName] = useState('');
  const [filterDate, setFilterDate] = useState('');
  const [filterCount, setFilterCount] = useState('');
  const [filterStatus, setFilterStatus] = useState('All');
  const [showFileFilters, setShowFileFilters] = useState(false);

  // Column-specific/Overview-specific filters for vendors list
  const [vendorSearch, setVendorSearch] = useState('');
  const [vendorMinFiles, setVendorMinFiles] = useState('');
  const [vendorMinRecords, setVendorMinRecords] = useState('');
  const [vendorMinAccuracy, setVendorMinAccuracy] = useState('');
  const [showVendorFilters, setShowVendorFilters] = useState(false);

  const activeFileFiltersCount = useMemo(() => {
    let count = 0;
    if (filterId) count++;
    if (filterName) count++;
    if (filterDate) count++;
    if (filterCount) count++;
    if (filterStatus && filterStatus !== 'All') count++;
    return count;
  }, [filterId, filterName, filterDate, filterCount, filterStatus]);

  const activeVendorFiltersCount = useMemo(() => {
    let count = 0;
    if (vendorSearch) count++;
    if (vendorMinFiles) count++;
    if (vendorMinRecords) count++;
    if (vendorMinAccuracy) count++;
    return count;
  }, [vendorSearch, vendorMinFiles, vendorMinRecords, vendorMinAccuracy]);

  // Preview
  const [previewFile, setPreviewFile] = useState<{ id: number; name: string } | null>(null);

  // Delete
  const [deleteTarget, setDeleteTarget] = useState<{ id: number; name: string } | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);

  // Toast
  const [toast, setToast] = useState<{ message: string; type: 'success' | 'error' } | null>(null);
  const showToast = useCallback((message: string, type: 'success' | 'error' = 'success') => {
    setToast({ message, type });
    setTimeout(() => setToast(null), 4000);
  }, []);

  // ---- Fetch all data ----
  const fetchData = useCallback(async () => {
    setIsLoading(true);
    try {
      const response = await fetch('/api/files', {
        headers: { 'bypass-tunnel-reminder': 'true' }
      });
      if (!response.ok) throw new Error('Failed to reach backend server');
      const data = await response.json();

      const details: Record<string, FileDetail[]> = {};
      const stats: Record<string, any> = {};
      const dailyCounts: Record<string, number> = { MON: 0, TUE: 0, WED: 0, THU: 0, FRI: 0, SAT: 0, SUN: 0 };

      data.forEach((item: any) => {
        const vendor = item.vendor;
        if (!details[vendor]) {
          details[vendor] = [];
          stats[vendor] = { totalFiles: 0, correctFiles: 0, totalDataCount: 0, correctDataCount: 0 };
        }

        const date = new Date(item.created_at);
        const dayName = ['SUN', 'MON', 'TUE', 'WED', 'THU', 'FRI', 'SAT'][date.getDay()];
        dailyCounts[dayName] = (dailyCounts[dayName] || 0) + 1;

        details[vendor].push({
          id: `F${String(item.id).padStart(3, '0')}`,
          dbId: item.id,
          name: item.file_name,
          date: formatDateTime(date),
          status: 'Correct',
          dataCount: item.data_count,
          filePath: item.file_path || undefined,
        });

        stats[vendor].totalFiles += 1;
        stats[vendor].correctFiles += 1;
        stats[vendor].correctDataCount += item.data_count;
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
      setTimeout(() => setIsLoading(false), 300);
    }
  }, [showToast]);

  useEffect(() => { fetchData(); }, [fetchData]);

  // ---- Manual Upload ----
  const handleManualUpload = async (newData: { vendor: string; fileName: string; dataCount: number; status?: 'Correct' }) => {
    setIsUploading(true);
    try {
      const response = await fetch('/api/upload', {
        method: 'POST',
        headers: { 
          'Content-Type': 'application/json',
          'bypass-tunnel-reminder': 'true'
        },
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
        headers: { 'bypass-tunnel-reminder': 'true' },
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
      const response = await fetch(`/api/files/${deleteTarget.id}`, { 
        method: 'DELETE',
        headers: { 'bypass-tunnel-reminder': 'true' }
      });
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
    setSortConfig((prev) => {
      if (prev?.key === key) {
        return { key, direction: prev.direction === 'asc' ? 'desc' : 'asc' };
      }
      return { key, direction: 'asc' };
    });
  };

  // ---- Processed table data ----
  const processedDetails = useMemo(() => {
    let details = selectedVendor ? [...(vendorDetails[selectedVendor] || [])] : [];
    if (searchTerm) {
      const lower = searchTerm.toLowerCase();
      details = details.filter((item) => item.name.toLowerCase().includes(lower) || item.id.toLowerCase().includes(lower));
    }
    if (filterId) {
      const lower = filterId.toLowerCase();
      details = details.filter((item) => item.id.toLowerCase().includes(lower));
    }
    if (filterName) {
      const lower = filterName.toLowerCase();
      details = details.filter((item) => item.name.toLowerCase().includes(lower));
    }
    if (filterDate) {
      const lower = filterDate.toLowerCase();
      details = details.filter((item) => item.date.toLowerCase().includes(lower));
    }
    if (filterCount) {
      const targetCount = parseInt(filterCount);
      if (!isNaN(targetCount)) {
        details = details.filter((item) => item.dataCount >= targetCount);
      }
    }
    if (filterStatus && filterStatus !== 'All') {
      details = details.filter((item) => item.status === filterStatus);
    }
    if (sortConfig) {
      details.sort((a, b) => {
        const av = a[sortConfig.key], bv = b[sortConfig.key];
        if (av === undefined || bv === undefined) return 0;
        if (typeof av === 'number' && typeof bv === 'number') {
          return sortConfig.direction === 'asc' ? av - bv : bv - av;
        }
        const avStr = String(av).toLowerCase();
        const bvStr = String(bv).toLowerCase();
        if (avStr < bvStr) return sortConfig.direction === 'asc' ? -1 : 1;
        if (avStr > bvStr) return sortConfig.direction === 'asc' ? 1 : -1;
        return 0;
      });
    }
    return details;
  }, [selectedVendor, searchTerm, filterId, filterName, filterDate, filterCount, filterStatus, sortConfig, vendorDetails]);

  // ---- Model filtering for Vendors Registry ----
  const processedVendors = useMemo(() => {
    let result = [...vendors];
    if (vendorSearch) {
      const lower = vendorSearch.toLowerCase();
      result = result.filter((v) => v.name.toLowerCase().includes(lower));
    }
    if (vendorMinFiles) {
      const minVal = parseInt(vendorMinFiles);
      if (!isNaN(minVal)) {
        result = result.filter((v) => v.totalFiles >= minVal);
      }
    }
    if (vendorMinRecords) {
      const minVal = parseInt(vendorMinRecords);
      if (!isNaN(minVal)) {
        result = result.filter((v) => v.totalDataCount >= minVal);
      }
    }
    if (vendorMinAccuracy) {
      const minVal = parseInt(vendorMinAccuracy);
      if (!isNaN(minVal)) {
        result = result.filter((v) => v.fileRatio >= minVal);
      }
    }
    return result;
  }, [vendors, vendorSearch, vendorMinFiles, vendorMinRecords, vendorMinAccuracy]);

  const currentDetails = selectedVendor ? vendorDetails[selectedVendor] || [] : [];
  const totalFilesCount = useMemo(() => vendors.reduce((acc, v) => acc + v.totalFiles, 0), [vendors]);

  const fileStatusData = useMemo(() => {
    const totals = vendors.reduce((acc, v) => ({ correct: acc.correct + v.correctFiles }), { correct: 0 });
    return [
      { name: 'Correct Files', value: totals.correct, color: COLORS.success },
    ];
  }, [vendors]);

  const handleTabChange = (tab: string) => { 
    setActiveTab(tab); 
    setSelectedVendor(null); 
    setIsSidebarOpen(false);
  };

  // ---- Export vendor details as CSV ----
  const handleExportVendorCSV = () => {
    if (!selectedVendor) return;
    const rows = currentDetails;
    if (!rows.length) return;
    const headers = ['ID', 'Name', 'Date & Time', 'Data Count', 'Status'];
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
    const headers = ['Vendor', 'Total Files', 'Correct Files', 'Total Records', 'Accuracy %'];
    const csvContent = [
      headers.join(','),
      ...vendors.map((v) => [v.name, v.totalFiles, v.correctFiles, v.totalDataCount, v.fileRatio].join(',')),
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
    return (
      <LoginPage 
        onLogin={(user) => {
          setCurrentUser(user);
          setIsAuthenticated(true);
          localStorage.setItem('currentUser', user);
          localStorage.setItem('isAuthenticated', 'true');
        }} 
        isDarkMode={isDarkMode} 
        onToggleDarkMode={toggleDarkMode} 
      />
    );
  }

  return (
    <div className={cn("flex min-h-screen font-sans relative transition-all duration-300", isDarkMode ? "bg-slate-950 text-slate-100" : "bg-slate-50 text-[#0c1329]")}>
      {/* Loading Overlay */}
      {isLoading && (
        <div className={cn("fixed inset-0 z-[200] backdrop-blur-md flex flex-col items-center justify-center transition-all duration-500", isDarkMode ? "bg-slate-950/85" : "bg-white/85")}>
          <div className="w-16 h-16 border-4 border-slate-100 border-t-[#005CB9] rounded-full animate-spin mb-4" />
          <p className="text-[10px] font-bold text-slate-400 uppercase tracking-[0.3em] animate-pulse">Syncing Database...</p>
        </div>
      )}

      <Sidebar activeTab={activeTab} onTabChange={handleTabChange} isDarkMode={isDarkMode} isOpen={isSidebarOpen} onClose={() => setIsSidebarOpen(false)} />

      <main className="flex-1 flex flex-col min-w-0">
        <UserHeader 
          currentUser={currentUser}
          onLogout={() => {
            setIsAuthenticated(false);
            localStorage.removeItem('isAuthenticated');
          }} 
          isDarkMode={isDarkMode} 
          onToggleDarkMode={toggleDarkMode} 
          onToggleSidebar={() => setIsSidebarOpen(!isSidebarOpen)} 
          onSwitchUser={(user) => {
            setCurrentUser(user);
            localStorage.setItem('currentUser', user);
            showToast(`Switched profile to ${user === 'admin' ? 'Admin User' : user === 'user 1' ? 'User 1' : 'User 2'}`, 'success');
          }}
        />

        <div className="px-6 lg:px-10 py-8 w-full max-w-[1600px] mx-auto overflow-hidden">

          {/* ===================== VENDOR DETAIL VIEW ===================== */}
          {selectedVendor ? (
            <motion.div initial={{ opacity: 0, y: 15 }} animate={{ opacity: 1, y: 0 }} className="space-y-8">
              {/* Detail Header */}
              <div className={cn(
                "p-8 lg:p-10 rounded-[2rem] shadow-sm border relative overflow-hidden transition-all duration-300",
                isDarkMode ? "bg-slate-900 border-slate-800" : "bg-white border-slate-100"
              )}>
                <div className="relative z-10 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-6">
                  <div className="flex items-center gap-6 lg:gap-8">
                    <button
                      onClick={() => { setSelectedVendor(null); setSearchTerm(''); setSortConfig(null); }}
                      className={cn(
                        "min-w-12 h-12 rounded-2xl flex items-center justify-center border group cursor-pointer transition-all",
                        isDarkMode 
                          ? "bg-slate-800 border-slate-700 text-slate-300 hover:text-[#005CB9] hover:bg-slate-700" 
                          : "bg-slate-50 border-slate-100 text-slate-400 hover:text-[#005CB9] hover:bg-blue-50"
                      )}
                    >
                      <ArrowLeftIcon size={20} className="group-hover:-translate-x-1 transition-transform" />
                    </button>
                    <div>
                      <div className="flex items-center gap-3 mb-2">
                        <span className={cn(
                          "px-3 py-1 rounded-full text-[10px] font-bold uppercase tracking-widest",
                          isDarkMode ? "bg-blue-950/40 text-blue-400" : "bg-blue-50 text-[#005CB9]"
                        )}>Active Vendor</span>
                      </div>
                      <h1 className={cn("text-3xl lg:text-4xl font-bold tracking-tight truncate max-w-sm sm:max-w-md", isDarkMode ? "text-slate-100" : "text-[#0D1E4C]")}>{selectedVendor}</h1>
                      <p className="text-slate-400 text-xs font-bold mt-2 uppercase tracking-widest">
                        Displaying <span className="text-[#00B5E2] font-bold">{currentDetails.length}</span> verified file records
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center gap-3 w-full sm:w-auto">
                    <button
                      onClick={handleExportVendorCSV}
                      className={cn(
                        "flex-1 sm:flex-none flex items-center justify-center gap-2 px-6 py-3.5 text-white rounded-2xl text-xs font-bold transition-all hover:bg-[#005CB9] hover:scale-[1.02] shadow-xl cursor-pointer",
                        isDarkMode ? "bg-slate-800 border border-slate-700 shadow-none hover:bg-slate-700" : "bg-[#0D1E4C] shadow-slate-200"
                      )}
                    >
                      <DownloadIcon size={16} /> Export Dataset
                    </button>
                  </div>
                </div>
                <div className={cn("absolute top-0 right-0 w-64 h-64 rounded-full blur-3xl -translate-y-1/2 translate-x-1/2", isDarkMode ? "bg-slate-800/40" : "bg-slate-50")} />
              </div>

              {/* Stats Bar */}
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                <DetailStat label="Total Files" value={currentDetails.length} icon={<DatabaseIcon size={20} />} color="yellow-frame" isDarkMode={isDarkMode} />
                <DetailStat label="Correct Files" value={currentDetails.length} icon={<CheckCircle2Icon size={20} />} color="green-frame" isDarkMode={isDarkMode} />
                <DetailStat label="System State" value="Optimized" icon={<ActivityIcon size={20} />} color="peach-frame" isDarkMode={isDarkMode} />
              </div>

              {/* Data Table */}
              <section className={cn(
                "rounded-[2rem] shadow-sm border overflow-hidden transition-all duration-300",
                isDarkMode ? "bg-slate-900 border-slate-800" : "bg-white border-slate-100"
              )}>
                <div className={cn(
                  "px-6 lg:px-10 py-8 border-b flex flex-col md:flex-row justify-between md:items-center gap-4 transition-colors",
                  isDarkMode ? "border-slate-800 bg-slate-900/60" : "border-slate-50 bg-slate-50/20"
                )}>
                  <div>
                    <h2 className="text-sm font-bold uppercase tracking-[0.15em] text-slate-400 mb-1">File Registry</h2>
                    <p className="text-[10px] font-bold text-slate-300 uppercase">Real-time verification audit</p>
                  </div>
                  <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3 w-full md:w-auto">
                    <div className="relative flex-1 md:w-80 font-mono">
                      <SearchIcon size={16} className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none" />
                      <input
                        type="text"
                        placeholder="Filter records..."
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                        className={cn(
                          "pl-12 pr-6 py-3 border rounded-2xl text-xs font-bold focus:outline-none w-full transition-all placeholder:text-slate-400",
                          isDarkMode 
                            ? "bg-slate-805 border-slate-700 text-slate-100 focus:ring-4 focus:ring-slate-850" 
                            : "bg-white border-slate-200 text-slate-800 focus:ring-4 focus:ring-blue-50"
                        )}
                      />
                    </div>
                    <button
                      onClick={() => setShowFileFilters((prev) => !prev)}
                      className={cn(
                        "px-5 py-3 rounded-2xl text-xs font-bold uppercase tracking-wider border flex items-center justify-center gap-2 transition-all cursor-pointer whitespace-nowrap select-none",
                        showFileFilters
                          ? "bg-[#005CB9] text-white border-[#005CB9] shadow-lg shadow-blue-100"
                          : (isDarkMode ? "bg-slate-800 text-slate-300 border-slate-700 hover:bg-slate-700" : "bg-white text-slate-600 border-slate-200 hover:bg-slate-50")
                      )}
                    >
                      <FilterIcon size={14} />
                      Filters
                      {activeFileFiltersCount > 0 && (
                        <span className="w-5 h-5 rounded-full bg-[#E4002B] text-white flex items-center justify-center text-[9px] font-bold">
                          {activeFileFiltersCount}
                        </span>
                      )}
                    </button>
                  </div>
                </div>

                {/* File Column Filters */}
                <AnimatePresence>
                  {showFileFilters && (
                    <motion.div
                      initial={{ height: 0, opacity: 0 }}
                      animate={{ height: 'auto', opacity: 1 }}
                      exit={{ height: 0, opacity: 0 }}
                      className={cn(
                        "overflow-hidden border-b transition-colors",
                        isDarkMode ? "border-slate-800" : "border-slate-100"
                      )}
                    >
                      <div className={cn(
                        "px-6 lg:px-10 py-5 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4 items-end",
                        isDarkMode ? "bg-slate-900/40" : "bg-slate-50/35"
                      )}>
                        {/* ID Filter */}
                        <div className="space-y-1.5">
                          <label className="text-[9px] font-bold text-slate-400 uppercase tracking-widest block font-sans">Filter ID</label>
                          <input
                            type="text"
                            placeholder="e.g. F018"
                            value={filterId}
                            onChange={(e) => setFilterId(e.target.value)}
                            className={cn(
                              "w-full px-4 py-2 rounded-xl text-xs font-bold transition-all font-mono border focus:outline-none focus:ring-2",
                              isDarkMode 
                                ? "bg-slate-850 border-slate-700 text-slate-100 focus:ring-slate-800 placeholder:text-slate-500" 
                                : "bg-white border-slate-200 text-slate-700 focus:ring-blue-100"
                            )}
                          />
                        </div>

                        {/* Name Filter */}
                        <div className="space-y-1.5">
                          <label className="text-[9px] font-bold text-slate-400 uppercase tracking-widest block font-sans">Filter Name</label>
                          <input
                            type="text"
                            placeholder="e.g. vendor_data"
                            value={filterName}
                            onChange={(e) => setFilterName(e.target.value)}
                            className={cn(
                              "w-full px-4 py-2 rounded-xl text-xs font-bold transition-all border focus:outline-none focus:ring-2",
                              isDarkMode 
                                ? "bg-slate-850 border-slate-700 text-slate-100 focus:ring-slate-800 placeholder:text-slate-500" 
                                : "bg-white border-slate-200 text-slate-700 focus:ring-blue-100"
                            )}
                          />
                        </div>

                        {/* Date Filter */}
                        <div className="space-y-1.5">
                          <label className="text-[9px] font-bold text-slate-400 uppercase tracking-widest block font-sans">Filter Date & Time</label>
                          <input
                            type="text"
                            placeholder="e.g. 2026-06"
                            value={filterDate}
                            onChange={(e) => setFilterDate(e.target.value)}
                            className={cn(
                              "w-full px-4 py-2 rounded-xl text-xs font-bold transition-all font-mono border focus:outline-none focus:ring-2",
                              isDarkMode 
                                ? "bg-slate-850 border-slate-700 text-slate-100 focus:ring-slate-800 placeholder:text-slate-500" 
                                : "bg-white border-slate-200 text-slate-700 focus:ring-blue-100"
                            )}
                          />
                        </div>

                        {/* Count Filter */}
                        <div className="space-y-1.5">
                          <label className="text-[9px] font-bold text-slate-400 uppercase tracking-widest block font-sans">Min Record Count</label>
                          <input
                            type="number"
                            placeholder="e.g. 10"
                            value={filterCount}
                            onChange={(e) => setFilterCount(e.target.value)}
                            className={cn(
                              "w-full px-4 py-2 rounded-xl text-xs font-bold transition-all border focus:outline-none focus:ring-2",
                              isDarkMode 
                                ? "bg-slate-850 border-slate-700 text-slate-100 focus:ring-slate-800 placeholder:text-slate-500" 
                                : "bg-white border-slate-200 text-slate-700 focus:ring-blue-100"
                            )}
                          />
                        </div>

                        {/* Status Filter */}
                        <div className="space-y-1.5">
                          <label className="text-[9px] font-bold text-slate-400 uppercase tracking-widest block font-sans">Filter Status</label>
                          <div className="flex gap-2">
                            <select
                              value={filterStatus}
                              onChange={(e) => setFilterStatus(e.target.value)}
                              className={cn(
                                "w-full px-4 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer border focus:outline-none focus:ring-2",
                                isDarkMode 
                                  ? "bg-slate-850 border-slate-700 text-slate-100 focus:ring-slate-800" 
                                  : "bg-white border-slate-200 text-slate-700 focus:ring-blue-100"
                              )}
                            >
                              <option value="All" className={isDarkMode ? "bg-slate-900 text-slate-100" : ""}>All Statuses</option>
                              <option value="Correct" className={isDarkMode ? "bg-slate-900 text-slate-100" : ""}>Correct</option>
                            </select>
                            {(searchTerm || filterId || filterName || filterDate || filterCount || filterStatus !== 'All') && (
                              <button
                                onClick={() => {
                                  setSearchTerm('');
                                  setFilterId('');
                                  setFilterName('');
                                  setFilterDate('');
                                  setFilterCount('');
                                  setFilterStatus('All');
                                }}
                                className={cn(
                                  "px-3 py-2 text-xs font-bold rounded-xl transition-all cursor-pointer border",
                                  isDarkMode 
                                    ? "bg-slate-800 text-slate-400 border-slate-700 hover:text-red-400 hover:border-red-900" 
                                    : "bg-white text-slate-400 border-slate-200 hover:text-red-500 hover:border-red-200"
                                )}
                                title="Reset filters"
                              >
                                Clear
                              </button>
                            )}
                          </div>
                        </div>
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>

                <div className="overflow-x-auto">
                  <table className="w-full min-w-[900px]">
                    <thead>
                      <tr className={cn(isDarkMode ? "bg-slate-900/80" : "bg-slate-50/50")}>
                        <TableHead label="ID" onClick={() => handleSort('id')} activeSort={sortConfig?.key === 'id' ? sortConfig.direction : null} />
                        <TableHead label="NAME" onClick={() => handleSort('name')} activeSort={sortConfig?.key === 'name' ? sortConfig.direction : null} />
                        <TableHead label="DATE & TIME" onClick={() => handleSort('date')} activeSort={sortConfig?.key === 'date' ? sortConfig.direction : null} />
                        <TableHead label="COUNT" onClick={() => handleSort('dataCount')} activeSort={sortConfig?.key === 'dataCount' ? sortConfig.direction : null} />
                        <TableHead label="STATUS" />
                        <TableHead label="ACTIONS" />
                      </tr>
                    </thead>
                    <tbody className={cn("divide-y transition-colors", isDarkMode ? "divide-slate-800" : "divide-slate-50")}>
                      {processedDetails.length === 0 ? (
                        <tr>
                          <td colSpan={6} className="px-10 py-16 text-center text-slate-400 text-sm font-bold uppercase tracking-widest">
                            No records found
                          </td>
                        </tr>
                      ) : (
                        processedDetails.map((file) => (
                          <tr key={file.id} className={cn("transition-all group", isDarkMode ? "hover:bg-slate-800/40" : "hover:bg-slate-50/80")}>
                            <td className={cn("px-6 lg:px-10 py-6 text-xs font-bold font-mono tracking-tight", isDarkMode ? "text-blue-400" : "text-[#005CB9]")}>{file.id}</td>
                            <td className="px-6 lg:px-10 py-6">
                              <div className="flex items-center gap-4">
                                <div className={cn(
                                  "w-10 h-10 rounded-xl flex items-center justify-center transition-all shrink-0",
                                  isDarkMode ? "bg-slate-800 text-slate-300 group-hover:bg-slate-700" : "bg-slate-100 text-slate-400 group-hover:bg-white group-hover:shadow-sm"
                                )}>
                                  <FileIcon size={18} />
                                </div>
                                <span className={cn("text-sm font-bold tracking-tight truncate max-w-[200px]", isDarkMode ? "text-slate-205" : "text-slate-800")}>{file.name}</span>
                              </div>
                            </td>
                            <td className="px-6 lg:px-10 py-6 text-xs font-bold text-slate-400 font-mono tracking-tight">{file.date}</td>
                            <td className="px-6 lg:px-10 py-6">
                              <div className="flex items-center gap-3">
                                <span className={cn("text-sm font-bold w-10", isDarkMode ? "text-slate-200" : "text-[#0D1E4C]")}>{file.dataCount}</span>
                                <div className={cn(
                                  "h-1.5 w-20 rounded-full overflow-hidden shadow-inner p-0.5",
                                  isDarkMode ? "bg-slate-800" : "bg-slate-100"
                                )}>
                                  <div className="h-full bg-[#00B5E2] rounded-full" style={{ width: `${Math.min(file.dataCount / 5, 100)}%` }} />
                                </div>
                              </div>
                            </td>
                            <td className="px-6 lg:px-10 py-6">
                              <span className={cn(
                                'inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-[10px] font-bold uppercase tracking-widest border',
                                file.status === 'Correct' 
                                  ? (isDarkMode ? 'bg-teal-950/30 text-teal-400 border-teal-900/60' : 'bg-[#E6F6F5] text-[#00A19D] border-[#B2E3E1]') 
                                  : (isDarkMode ? 'bg-rose-950/30 text-rose-400 border-rose-900/60' : 'bg-rose-50 text-rose-600 border-rose-100')
                              )}>
                                {file.status === 'Correct' ? <CheckCircle2Icon size={10} /> : <AlertCircleIcon size={10} />}
                                Correct
                              </span>
                            </td>
                            <td className="px-6 lg:px-10 py-6">
                              <div className="flex items-center gap-2">
                                {/* Preview */}
                                <button
                                  onClick={() => setPreviewFile({ id: file.dbId, name: file.name })}
                                  title="Preview Data"
                                  className={cn(
                                    "w-9 h-9 rounded-xl border flex items-center justify-center transition-all cursor-pointer",
                                    isDarkMode 
                                      ? "bg-slate-800 border-slate-700 text-slate-300 hover:text-blue-400 hover:bg-slate-700 hover:border-blue-800" 
                                      : "bg-slate-50 border-slate-200 text-slate-400 hover:text-[#005CB9] hover:bg-blue-50 hover:border-[#005CB9]"
                                  )}
                                >
                                  <EyeIcon size={15} />
                                </button>
                                {/* Download (only if has file) */}
                                {file.filePath && (
                                  <button
                                    onClick={() => handleDownload(file)}
                                    title="Download File"
                                    className={cn(
                                      "w-9 h-9 rounded-xl border flex items-center justify-center transition-all cursor-pointer",
                                      isDarkMode 
                                        ? "bg-slate-800 border-slate-700 text-slate-300 hover:text-teal-400 hover:bg-slate-700 hover:border-teal-800" 
                                        : "bg-slate-50 border-slate-200 text-slate-400 hover:text-[#00A19D] hover:bg-teal-50 hover:border-[#00A19D]"
                                    )}
                                  >
                                    <DownloadIcon size={15} />
                                  </button>
                                )}
                                {/* Delete */}
                                <button
                                  onClick={() => setDeleteTarget({ id: file.dbId, name: file.name })}
                                  title="Delete Record"
                                  className={cn(
                                    "w-9 h-9 rounded-xl border flex items-center justify-center transition-all cursor-pointer",
                                    isDarkMode 
                                      ? "bg-slate-800 border-slate-700 text-slate-300 hover:text-rose-400 hover:bg-slate-700 hover:border-rose-800" 
                                      : "bg-slate-50 border-slate-200 text-slate-400 hover:text-[#E4002B] hover:bg-red-50 hover:border-[#E4002B]"
                                  )}
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
            <motion.div initial={{ opacity: 0, y: 15 }} animate={{ opacity: 1, y: 0 }} className="space-y-10">
              {/* Header */}
              <div className={cn(
                "p-8 lg:p-10 rounded-[2rem] shadow-sm border relative overflow-hidden transition-all duration-300",
                isDarkMode ? "bg-slate-900 border-slate-800" : "bg-white border-slate-100"
              )}>
                <div className="relative z-10 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-6">
                  <div className="flex items-center gap-6 lg:gap-8">
                    <div className={cn(
                      "p-6 rounded-3xl shadow-2xl shrink-0 transition-all",
                      isDarkMode ? "bg-[#005CB9] shadow-blue-900/10" : "bg-[#005CB9] shadow-blue-100"
                    )}>
                      <BarChart3Icon className="w-10 h-10 text-white" />
                    </div>
                    <div>
                      <div className="flex items-center gap-3 mb-2">
                        <span className={cn(
                          "px-3 py-1 rounded-full text-[10px] font-bold uppercase tracking-widest",
                          isDarkMode ? "bg-blue-950/40 text-blue-400" : "bg-blue-50 text-[#005CB9]"
                        )}>Performance Dashboard</span>
                      </div>
                      <h1 className={cn("text-3xl lg:text-4xl font-bold tracking-tight uppercase", isDarkMode ? "text-slate-100" : "text-[#0D1E4C]")}>Performance Hub</h1>
                      <p className="text-slate-400 text-xs font-bold mt-2 uppercase tracking-widest">
                        Regional Efficiency Metrics & Load Balancing
                      </p>
                    </div>
                  </div>
                </div>
                <div className={cn("absolute top-0 right-0 w-64 h-64 rounded-full blur-3xl -translate-y-1/2 translate-x-1/2", isDarkMode ? "bg-slate-800/40" : "bg-slate-50")} />
              </div>

              {/* Advanced Color-Framed Regional KPI Summary for Performance */}
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                <DetailStat
                  label="Registered Audit Files"
                  value={totalFilesCount}
                  icon={<DatabaseIcon size={20} />}
                  color="yellow-frame"
                  isDarkMode={isDarkMode}
                />
                <DetailStat
                  label="Verified Accuracy Level"
                  value={`${vendors.length ? Math.round((vendors.reduce((acc, v) => acc + v.correctFiles, 0) / (totalFilesCount || 1)) * 100) : 100}% Accuracy`}
                  icon={<CheckCircle2Icon size={20} />}
                  color="green-frame"
                  isDarkMode={isDarkMode}
                />
                <DetailStat
                  label="Monitored Endpoints"
                  value={vendors.length}
                  icon={<FolderOpenIcon size={20} />}
                  color="peach-frame"
                  isDarkMode={isDarkMode}
                />
              </div>

              {/* Chart Row */}
              <div className="grid grid-cols-1 gap-8">
                <ChartCard title="Vendor Accuracy Comparison" className="min-h-[400px] flex flex-col" isDarkMode={isDarkMode}>
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
                        <XAxis dataKey="name" stroke={isDarkMode ? "#334155" : COLORS.slate[300]} fontSize={10} tickLine={false} axisLine={false} dy={15} tick={{ fill: isDarkMode ? '#94a3b8' : COLORS.slate[500], fontWeight: 700 }} />
                        <YAxis domain={[0, 100]} hide />
                        <Tooltip
                          cursor={{ fill: isDarkMode ? '#334155' : COLORS.slate[50], opacity: 0.4 }}
                          contentStyle={{
                            backgroundColor: isDarkMode ? '#1e293b' : '#ffffff',
                            borderRadius: '1.25rem',
                            border: isDarkMode ? '1px solid #334155' : 'none',
                            boxShadow: '0 25px 50px -12px rgb(0 0 0 / 0.12)',
                            padding: '1.5rem'
                          }}
                          itemStyle={{ color: isDarkMode ? '#f8fafc' : '#0f172a', fontWeight: 'bold' }}
                          labelStyle={{ color: isDarkMode ? '#94a3b8' : '#64748b' }}
                          formatter={(value: any) => [`${value}%`, 'Accuracy']}
                        />
                        <Bar dataKey="accuracy" radius={[12, 12, 12, 12]} barSize={40} fill="url(#perf-gradient)" />
                      </BarChart>
                    </ResponsiveContainer>
                  </div>
                </ChartCard>
              </div>
            </motion.div>

          /* ===================== OVERVIEW TAB ===================== */
          ) : (
            <>
              {/* Hero Banner */}
              <div className={cn(
                "rounded-[2.5rem] p-8 lg:p-12 border mb-10 shadow-sm relative overflow-hidden select-none transition-all duration-300",
                isDarkMode ? "bg-slate-900 border-slate-800" : "bg-white border-slate-100"
              )}>
                <div className="relative z-10 flex flex-col lg:flex-row justify-between lg:items-center gap-8">
                  <div className="flex items-center gap-6 lg:gap-10">
                    <div className={cn(
                      "p-6 rounded-3xl shadow-2xl shrink-0 transition-all",
                      isDarkMode ? "bg-[#005CB9] shadow-blue-950/10" : "bg-[#005CB9] shadow-blue-100"
                    )}>
                      <FolderOpenIcon className="w-10 h-10 text-white" />
                    </div>
                    <div>
                      <h1 className={cn("text-4xl lg:text-5xl font-bold leading-none mb-3", isDarkMode ? "text-slate-100" : "text-[#0D1E4C]")}>VENDORS</h1>
                      <div className="flex items-center gap-4">
                        <span className="text-[10px] font-bold uppercase tracking-[0.2em] text-slate-400">Incyte Analytics Hub</span>
                        <div className={cn("w-1 h-1 rounded-full", isDarkMode ? "bg-slate-705" : "bg-slate-200")} />
                        <span className="text-[10px] font-bold uppercase tracking-[0.2em] text-[#00B5E2]">Powered by Science</span>
                      </div>
                    </div>
                  </div>
                  <div className="flex items-center gap-4">
                    <button
                      onClick={() => fetchData()}
                      className={cn(
                        "flex items-center justify-center w-14 h-14 border rounded-[1.25rem] transition-all group cursor-pointer shadow-sm",
                        isDarkMode 
                          ? "bg-slate-800 border-slate-700 text-slate-300 hover:bg-slate-700 hover:text-white" 
                          : "bg-white border-slate-100 text-slate-400 hover:bg-slate-50 hover:text-[#005CB9]"
                      )}
                      title="Refresh Data"
                    >
                      <RefreshCwIcon size={20} className={cn('transition-transform duration-500', isLoading && 'animate-spin')} />
                    </button>
                    <div className="flex flex-col gap-2 w-full lg:w-auto">
                      <button
                        onClick={() => setIsUploadModalOpen(true)}
                        className={cn(
                          "flex items-center justify-center gap-3 px-8 py-4 bg-[#005CB9] text-white rounded-[1.25rem] text-sm font-bold transition-all hover:bg-[#004A99] hover:scale-[1.02] group w-full lg:w-auto cursor-pointer",
                          isDarkMode ? "shadow-none" : "shadow-2xl shadow-blue-200"
                        )}
                      >
                        <PlusIcon size={20} className="group-hover:rotate-90 transition-transform duration-300" />
                        NEW UPLOAD
                      </button>
                      <button
                        onClick={() => window.open('https://outlook.office.com/mail/', '_blank')}
                        className={cn(
                          "flex items-center justify-center gap-3 px-8 py-4 border rounded-[1.25rem] text-sm font-bold transition-all hover:scale-[1.02] group w-full lg:w-auto cursor-pointer",
                          isDarkMode 
                            ? "bg-slate-800 border-slate-700 text-slate-300 hover:bg-slate-700 hover:text-white hover:border-slate-650 shadow-none" 
                            : "bg-white border-slate-200 text-[#005CB9] hover:bg-blue-50 hover:border-[#005CB9] shadow-sm"
                        )}
                      >
                        <MailIcon size={20} />
                        OUTLOOK
                      </button>
                    </div>
                  </div>
                </div>
                <div className={cn("absolute -top-24 -right-24 w-96 h-96 rounded-full blur-[80px]", isDarkMode ? "bg-indigo-950/20" : "bg-indigo-50/50")} />
                {/* Advanced Color-Framed Regional KPI Summary */}
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-10">
                <DetailStat
                  label="Registered Audit Files"
                  value={totalFilesCount}
                  icon={<DatabaseIcon size={20} />}
                  color="yellow-frame"
                  isDarkMode={isDarkMode}
                />
                <DetailStat
                  label="Verified Accuracy Level"
                  value={`${vendors.length ? Math.round((vendors.reduce((acc, v) => acc + v.correctFiles, 0) / (totalFilesCount || 1)) * 100) : 100}% Accuracy`}
                  icon={<CheckCircle2Icon size={20} />}
                  color="green-frame"
                  isDarkMode={isDarkMode}
                />
                <DetailStat
                  label="Monitored Endpoints"
                  value={vendors.length}
                  icon={<FolderOpenIcon size={20} />}
                  color="peach-frame"
                  isDarkMode={isDarkMode}
                />
              </div>

              {/* Charts Row */}
              <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-8 mb-10">
                <ChartCard title="Upload Volume Trends" className="min-h-[420px] flex flex-col" isDarkMode={isDarkMode}>
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
                        <XAxis dataKey="day" stroke={isDarkMode ? "#334155" : COLORS.slate[300]} fontSize={10} tickLine={false} axisLine={false} dy={15} tick={{ fill: isDarkMode ? '#94a3b8' : COLORS.slate[500], fontWeight: 700 }} />
                        <YAxis hide />
                        <Tooltip
                          cursor={{ fill: isDarkMode ? '#334155' : COLORS.slate[50], opacity: 0.4 }}
                          contentStyle={{
                            backgroundColor: isDarkMode ? '#1e293b' : '#ffffff',
                            borderRadius: '1.25rem',
                            border: isDarkMode ? '1px solid #334155' : 'none',
                            boxShadow: '0 25px 50px -12px rgb(0 0 0 / 0.12)',
                            padding: '1.5rem'
                          }}
                          itemStyle={{ fontWeight: 'bold', color: isDarkMode ? '#f8fafc' : COLORS.slate[900], fontSize: '12px' }}
                          labelStyle={{ color: isDarkMode ? '#94a3b8' : '#64748b' }}
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

                <ChartCard title="File Verification Status" className="min-h-[420px] flex flex-col" isDarkMode={isDarkMode}>
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
                        <span className={cn("text-4xl font-bold leading-none", isDarkMode ? "text-slate-100" : "text-[#0D1E4C]")}>{totalFilesCount}</span>
                      </div>
                    </div>
                    <div className="flex flex-col justify-center space-y-6">
                      {fileStatusData.map((item, i) => (
                        <div key={i} className="flex flex-col gap-1">
                          <div className="flex items-center gap-2">
                            <div className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: item.color }} />
                            <span className={cn("text-[10px] font-semibold uppercase tracking-widest", isDarkMode ? "text-slate-300" : "text-[#0D1E4C]")}>{item.name}</span>
                          </div>
                          <span className={cn("text-lg font-semibold ml-4", isDarkMode ? "text-slate-400" : "text-slate-500")}>{item.value} Records</span>
                        </div>
                      ))}
                    </div>
                  </div>
                </ChartCard>

                <ChartCard title="Operational Metrics" className="xl:col-span-1" isDarkMode={isDarkMode}>
                  <p className="text-[10px] font-bold text-slate-400 mb-10 uppercase tracking-widest">Efficiency Benchmarking</p>
                  <div className="space-y-10 pt-2">
                    <ProgressItem label="Total Records" total={vendors.reduce((acc, v) => acc + v.totalDataCount, 0)} color={COLORS.primary} perc={100} isDarkMode={isDarkMode} />
                    <ProgressItem label="Accurate Data" total={vendors.reduce((acc, v) => acc + v.correctDataCount, 0)} color={COLORS.success} perc={Math.round((vendors.reduce((acc, v) => acc + v.correctDataCount, 0) / (vendors.reduce((acc, v) => acc + v.totalDataCount, 0) || 1)) * 100)} isDarkMode={isDarkMode} />
                  </div>
                </ChartCard>
              </div>              </div>

              {/* Vendor Table */}
              <section className={cn("rounded-[2.5rem] shadow-sm border overflow-hidden transition-all duration-300", isDarkMode ? "bg-slate-900 border-slate-800" : "bg-white border-slate-100")}>
                <div className={cn("px-6 lg:px-10 py-10 border-b flex flex-col md:flex-row justify-between md:items-center gap-6 select-none transition-colors", isDarkMode ? "bg-slate-900 border-slate-800" : "bg-white border-slate-50")}>
                  <div>
                    <h2 className={cn("text-xl font-bold flex items-center gap-4", isDarkMode ? "text-slate-100" : "text-[#0D1E4C]")}>Vendor Performance Registry</h2>
                    <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mt-1 font-mono">Audit log spanning {vendors.length} endpoints</p>
                  </div>
                  <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3">
                    <button
                      onClick={() => setShowVendorFilters((prev) => !prev)}
                      className={cn(
                        "px-5 py-3.5 rounded-2xl text-xs font-bold uppercase tracking-wider border flex items-center justify-center gap-2 transition-all cursor-pointer whitespace-nowrap select-none",
                        showVendorFilters
                          ? "bg-[#005CB9] text-white border-[#005CB9] shadow-lg shadow-blue-100"
                          : (isDarkMode ? "bg-slate-800 text-slate-350 border-slate-700 hover:bg-slate-700 hover:text-white" : "bg-white text-slate-600 border-slate-200 hover:bg-slate-50")
                      )}
                    >
                      <FilterIcon size={14} />
                      Filters
                      {activeVendorFiltersCount > 0 && (
                        <span className="w-5 h-5 rounded-full bg-[#E4002B] text-white flex items-center justify-center text-[9px] font-bold">
                          {activeVendorFiltersCount}
                        </span>
                      )}
                    </button>
                    <button
                      onClick={handleExportAllCSV}
                      className={cn(
                        "flex items-center justify-center gap-3 px-8 py-4 rounded-2xl text-xs font-bold border transition-all cursor-pointer",
                        isDarkMode 
                          ? "bg-slate-800 border-slate-700 text-slate-300 hover:bg-slate-700 hover:text-white" 
                          : "bg-slate-50 text-[#0D1E4C] border-slate-100 hover:bg-slate-100"
                      )}
                    >
                      <DownloadIcon size={16} /> DOWNLOAD ALL
                    </button>
                  </div>
                </div>

                {/* Advanced Column-specific Filters Row */}
                <AnimatePresence>
                  {showVendorFilters && (
                    <motion.div
                      initial={{ height: 0, opacity: 0 }}
                      animate={{ height: 'auto', opacity: 1 }}
                      exit={{ height: 0, opacity: 0 }}
                      className={cn(
                        "overflow-hidden border-b transition-colors",
                        isDarkMode ? "border-slate-800" : "border-slate-100"
                      )}
                    >
                      <div className={cn(
                        "px-6 lg:px-10 py-6 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 items-end",
                        isDarkMode ? "bg-slate-900/50" : "bg-slate-50"
                      )}>
                        <div className="space-y-1.5">
                          <label className="text-[9px] font-bold text-slate-400 uppercase tracking-widest block font-sans">Search Vendor</label>
                          <div className="relative">
                            <SearchIcon size={12} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none" />
                            <input
                              type="text"
                              placeholder="Search by name..."
                              value={vendorSearch}
                              onChange={(e) => setVendorSearch(e.target.value)}
                              className={cn(
                                "w-full pl-9 pr-4 py-2 rounded-xl text-xs font-bold transition-all border focus:outline-none focus:ring-2",
                                isDarkMode 
                                  ? "bg-slate-850 border-slate-700 text-slate-105 focus:ring-slate-800 placeholder:text-slate-500" 
                                  : "bg-white border-slate-200 text-[#0D1E4C] focus:ring-blue-100 placeholder:text-slate-400"
                              )}
                            />
                          </div>
                        </div>

                        <div className="space-y-1.5">
                          <label className="text-[9px] font-bold text-slate-400 uppercase tracking-widest block font-sans">Min Files</label>
                          <input
                            type="number"
                            placeholder="e.g. 1"
                            value={vendorMinFiles}
                            onChange={(e) => setVendorMinFiles(e.target.value)}
                            className={cn(
                              "w-full px-4 py-2 rounded-xl text-xs font-bold transition-all border focus:outline-none focus:ring-2",
                              isDarkMode 
                                ? "bg-slate-850 border-slate-700 text-slate-105 focus:ring-slate-800 placeholder:text-slate-500" 
                                : "bg-white border-slate-200 text-[#0D1E4C] focus:ring-blue-100 placeholder:text-slate-400"
                            )}
                          />
                        </div>

                        <div className="space-y-1.5">
                          <label className="text-[9px] font-bold text-slate-400 uppercase tracking-widest block font-sans">Min Records (Data Count)</label>
                          <input
                            type="number"
                            placeholder="e.g. 100"
                            value={vendorMinRecords}
                            onChange={(e) => setVendorMinRecords(e.target.value)}
                            className={cn(
                              "w-full px-4 py-2 rounded-xl text-xs font-bold transition-all border focus:outline-none focus:ring-2",
                              isDarkMode 
                                ? "bg-slate-850 border-slate-700 text-slate-105 focus:ring-slate-800 placeholder:text-slate-500" 
                                : "bg-white border-slate-200 text-[#0D1E4C] focus:ring-blue-105 placeholder:text-slate-400"
                            )}
                          />
                        </div>

                        <div className="space-y-1.5">
                          <label className="text-[9px] font-bold text-slate-400 uppercase tracking-widest block font-sans">Minimum Accuracy</label>
                          <div className="flex gap-2">
                            <select
                              value={vendorMinAccuracy}
                              onChange={(e) => setVendorMinAccuracy(e.target.value)}
                              className={cn(
                                "w-full px-4 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer border focus:outline-none focus:ring-2",
                                isDarkMode 
                                  ? "bg-slate-850 border-slate-700 text-slate-105 focus:ring-slate-800" 
                                  : "bg-white border-slate-200 text-[#0D1E4C] focus:ring-blue-105"
                              )}
                            >
                              <option value="" className={isDarkMode ? "bg-slate-900 text-slate-100" : ""}>All Tiers</option>
                              <option value="95" className={isDarkMode ? "bg-slate-900 text-slate-100" : ""}>&gt;= 95% (Target)</option>
                              <option value="90" className={isDarkMode ? "bg-slate-900 text-slate-100" : ""}>&gt;= 90% (Tier 1)</option>
                              <option value="80" className={isDarkMode ? "bg-slate-900 text-slate-100" : ""}>&gt;= 80% (Pass)</option>
                            </select>
                            {(vendorSearch || vendorMinFiles || vendorMinRecords || vendorMinAccuracy) && (
                              <button
                                onClick={() => {
                                  setVendorSearch('');
                                  setVendorMinFiles('');
                                  setVendorMinRecords('');
                                  setVendorMinAccuracy('');
                                }}
                                className={cn(
                                  "px-3 py-2 text-xs font-bold rounded-xl transition-all cursor-pointer border",
                                  isDarkMode 
                                    ? "bg-slate-800 text-slate-400 border-slate-700 hover:text-red-400 hover:border-red-900" 
                                    : "bg-white text-slate-400 border-slate-200 hover:text-[#E4002B] hover:border-red-200"
                                )}
                                title="Reset filters"
                              >
                                Clear
                              </button>
                            )}
                          </div>
                        </div>
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>

                <div className="overflow-x-auto">
                  <table className="w-full min-w-[1000px]">
                    <thead>
                      <tr className={cn(isDarkMode ? "bg-slate-900/80 text-slate-300" : "bg-slate-50/50 text-slate-500")}>
                        <TableHead label="VENDOR" />
                        <TableHead label="FILES" />
                        <TableHead label="VERIFIED" />
                        <TableHead label="RECORDS" />
                        <TableHead label="ACCURACY" />
                      </tr>
                    </thead>
                    <tbody className={cn("divide-y transition-colors", isDarkMode ? "divide-slate-800" : "divide-slate-50")}>
                      {processedVendors.length === 0 ? (
                        <tr>
                          <td colSpan={5} className="px-10 py-20 text-center text-slate-400 text-sm font-bold uppercase tracking-widest">
                            {vendors.length === 0 ? "No vendor data. Upload a file to get started." : "No vendors match the specified filters."}
                          </td>
                        </tr>
                      ) : (
                        processedVendors.map((vendor, idx) => (
                          <tr key={idx} onClick={() => setSelectedVendor(vendor.name)} className={cn("transition-all group cursor-pointer border-b", isDarkMode ? "hover:bg-slate-800/40 border-slate-800" : "hover:bg-slate-50/80 border-slate-50")}>
                            <td className="px-6 lg:px-10 py-8">
                              <div className="flex flex-col">
                                <span className={cn("text-base font-bold transition-colors uppercase underline underline-offset-8 decoration-2", isDarkMode ? "text-slate-100 group-hover:text-blue-400 decoration-slate-800" : "text-[#0D1E4C] group-hover:text-[#005CB9] decoration-slate-200")}>{vendor.name}</span>
                                <span className="text-[10px] text-slate-400 font-bold uppercase tracking-widest mt-1">Tier 1 Provider</span>
                              </div>
                            </td>
                            <td className="px-6 lg:px-10 py-8 text-sm font-bold text-slate-400">{vendor.totalFiles}</td>
                            <td className="px-6 lg:px-10 py-8">
                              <div className="flex items-center gap-2">
                                <CheckCircle2Icon size={14} className="text-[#00A19D]" />
                                <span className={cn("text-sm font-bold", isDarkMode ? "text-slate-200" : "text-[#0D1E4C]")}>{vendor.correctFiles}</span>
                              </div>
                            </td>
                            <td className={cn("px-6 lg:px-10 py-8 font-mono text-sm font-bold", isDarkMode ? "text-slate-200" : "text-[#0D1E4C]")}>{vendor.totalDataCount.toLocaleString()}</td>
                            <td className="px-6 lg:px-10 py-8 min-w-[200px]">
                              <div className="flex flex-col gap-3">
                                <div className="flex justify-between items-center text-[10px] font-bold uppercase tracking-widest">
                                  <span className={cn(vendor.fileRatio > 80 ? 'text-[#00A19D]' : 'text-[#FFB81C]')}>{vendor.fileRatio}% SUCCESS</span>
                                  <span className="text-slate-450">Target 95%</span>
                                </div>
                                <div className={cn("h-2 w-full rounded-full overflow-hidden flex shadow-inner group-hover:scale-y-125 transition-transform", isDarkMode ? "bg-slate-800" : "bg-slate-100")}>
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
        isDarkMode={isDarkMode}
      />

      <AnimatePresence>
        {previewFile && (
          <PreviewModal fileId={previewFile.id} fileName={previewFile.name} onClose={() => setPreviewFile(null)} isDarkMode={isDarkMode} />
        )}
      </AnimatePresence>

      <AnimatePresence>
        {deleteTarget && (
          <DeleteConfirmModal
            fileName={deleteTarget.name}
            onConfirm={handleDeleteConfirm}
            onCancel={() => setDeleteTarget(null)}
            isDeleting={isDeleting}
            isDarkMode={isDarkMode}
          />
        )}
      </AnimatePresence>

      <AnimatePresence>
        {toast && <Toast message={toast.message} type={toast.type} onClose={() => setToast(null)} isDarkMode={isDarkMode} />}
      </AnimatePresence>
    </div>
  );
}

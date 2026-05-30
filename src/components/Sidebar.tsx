// File: src/components/Sidebar.tsx
import React, { useState } from 'react';
import { 
  LayoutDashboard, 
  UserSquare2, 
  Calendar, 
  FileText, 
  FlaskConical, 
  Pill, 
  Bed, 
  Receipt, 
  Settings, 
  LogOut, 
  Activity,
  History,
  ChevronLeft,
  ChevronRight,
  X
} from 'lucide-react';
import { useHospital } from '../context/HospitalContext';

interface SidebarProps {
  currentTab: string;
  setCurrentTab: (tab: string) => void;
  mobileSidebarOpen?: boolean;
  setMobileSidebarOpen?: (open: boolean) => void;
}

export default function Sidebar({ currentTab, setCurrentTab, mobileSidebarOpen, setMobileSidebarOpen }: SidebarProps) {
  const { user, logout, settings } = useHospital();
  const [isCollapsed, setIsCollapsed] = useState(false);

  if (!user) return null;

  const role = user.role;

  const menuItems = [
    { id: 'dashboard', name: 'Dashboard', icon: LayoutDashboard, roles: ['Admin', 'Doctor', 'Nurse', 'Receptionist', 'Lab Technician', 'Pharmacist'] },
    { id: 'patients', name: 'Patient Directory', icon: UserSquare2, roles: ['Admin', 'Doctor', 'Nurse', 'Receptionist'] },
    { id: 'appointments', name: 'OPD Appointments', icon: Calendar, roles: ['Admin', 'Doctor', 'Receptionist'] },
    { id: 'clini-emr', name: 'Clinical EMR', icon: FileText, roles: ['Admin', 'Doctor'] },
    { id: 'laboratory', name: 'Laboratory Orders', icon: FlaskConical, roles: ['Admin', 'Doctor', 'Lab Technician'] },
    { id: 'pharmacy', name: 'Pharmacy Formulary', icon: Pill, roles: ['Admin', 'Pharmacist'] },
    { id: 'ward-beds', name: 'IPD Beds Booking', icon: Bed, roles: ['Admin', 'Doctor', 'Nurse'] },
    { id: 'billing', name: 'Financial Ledger', icon: Receipt, roles: ['Admin', 'Receptionist'] },
    { id: 'audit-logs', name: 'Access Audit Logs', icon: History, roles: ['Admin'] },
    { id: 'settings', name: 'Portal Settings', icon: Settings, roles: ['Admin'] }
  ];

  const visibleItems = menuItems.filter(item => item.roles.includes(role));

  return (
    <div 
      id="hms-sidebar-container" 
      className={`bg-white text-slate-800 flex flex-col border-r border-slate-200/80 self-stretch h-full flex-shrink-0 transition-all duration-300 ease-in-out fixed md:relative z-40 ${
        isCollapsed ? 'md:w-16' : 'md:w-64'
      } ${
        mobileSidebarOpen ? 'translate-x-0 w-64' : '-translate-x-full md:translate-x-0 w-64 md:w-auto'
      }`}
    >
      {/* Absolute floating toggle switch */}
      <button
        id="btn-sidebar-collapse-toggle"
        onClick={() => setIsCollapsed(!isCollapsed)}
        className="absolute -right-3 top-8 w-6 h-6 bg-white border border-slate-200 rounded-full flex items-center justify-center text-slate-400 hover:text-blue-600 shadow-sm cursor-pointer active-bounce hover:border-blue-200 z-50 transition-colors md:flex hidden"
        title={isCollapsed ? "Expand Navigation Panel" : "Collapse Navigation Panel"}
      >
        {isCollapsed ? <ChevronRight className="w-3.5 h-3.5" /> : <ChevronLeft className="w-3.5 h-3.5" />}
      </button>

      {/* Header section with hospital parameters */}
      <div 
        id="hms-sidebar-header" 
        className={`p-5 border-b border-slate-100 flex items-center gap-3 overflow-hidden ${
          isCollapsed ? 'justify-center px-2' : ''
        }`}
      >
        <div className="w-9 h-9 bg-blue-600 rounded-xl flex items-center justify-center shadow-md shadow-blue-100 shrink-0">
          <Activity className="w-5 h-5 text-white" />
        </div>
        {!isCollapsed && (
          <div className="overflow-hidden animate-scale-up flex-1">
            <h1 className="font-display font-bold text-xs leading-tight text-slate-900 tracking-tight truncate">
              {settings?.name || "St. Jude HMS"}
            </h1>
            <p className="font-mono text-[9px] text-blue-600 font-bold tracking-widest uppercase mt-0.5">
              MedCore Clinical
            </p>
          </div>
        )}
        {mobileSidebarOpen && setMobileSidebarOpen && (
          <button 
            onClick={() => setMobileSidebarOpen(false)}
            className="md:hidden p-1.5 hover:bg-slate-100 text-slate-400 hover:text-slate-700 rounded-lg cursor-pointer active-bounce shrink-0"
            title="Close navigation"
          >
            <X className="w-4 h-4" />
          </button>
        )}
      </div>

      {/* Navigation options list */}
      <nav id="sidebar-navigation-items" className="flex-1 px-3 py-6 space-y-1 custom-scrollbar overflow-y-auto">
        {visibleItems.map(item => {
          const Icon = item.icon;
          const isActive = currentTab === item.id;
          return (
            <button
              key={item.id}
              id={`sidebar-item-${item.id}`}
              onClick={() => setCurrentTab(item.id)}
              title={isCollapsed ? item.name : undefined}
              className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl text-xs font-semibold font-sans transition-all duration-150 cursor-pointer active-bounce group relative ${
                isActive 
                  ? 'bg-blue-50/70 text-blue-700 active-neon-glow' 
                  : 'text-slate-500 hover:bg-slate-50/60 hover:text-slate-900'
              } ${isCollapsed ? 'justify-center px-0' : ''}`}
            >
              <Icon 
                className={`w-4 h-4 shrink-0 transition-colors ${
                  isActive 
                    ? 'text-blue-600' 
                    : 'text-slate-400 group-hover:text-slate-600'
                }`} 
              />
              {!isCollapsed && <span className="truncate animate-scale-up">{item.name}</span>}
              
              {/* Tooltip for collapsed view */}
              {isCollapsed && (
                <div className="absolute left-16 bg-slate-900 text-white text-[10px] px-2.5 py-1.5 rounded-lg opacity-0 pointer-events-none group-hover:opacity-100 transition-opacity duration-200 shadow-lg font-sans font-semibold tracking-wide whitespace-nowrap z-50">
                  {item.name}
                </div>
              )}
            </button>
          );
        })}
      </nav>

      {/* Modern Clinician Profile Widget and Sign out section */}
      <div id="sidebar-footer-profile" className="p-3 border-t border-slate-100 flex flex-col gap-2">
        <div 
          id="active-user-profile-badge" 
          className={`flex items-center gap-3 p-2 bg-slate-50/50 border border-slate-100/60 rounded-2xl overflow-hidden ${
            isCollapsed ? 'justify-center p-1 bg-transparent border-none' : ''
          }`}
        >
          <div className="w-9 h-9 rounded-full bg-blue-50 border border-blue-100 flex items-center justify-center text-blue-700 text-xs font-bold font-sans shrink-0 shadow-xs">
            {user.name.split(' ').map((n: string) => n[0]).join('').substring(0, 2).toUpperCase()}
          </div>
          {!isCollapsed && (
            <div className="overflow-hidden animate-scale-up">
              <p className="text-xs font-semibold text-slate-800 truncate leading-snug">{user.name}</p>
              <p className="text-[9px] text-slate-500 font-mono font-bold uppercase tracking-widest leading-none mt-0.5">{user.role}</p>
            </div>
          )}
        </div>

        <button
          id="btn-sidebar-sign-out"
          onClick={logout}
          title={isCollapsed ? "Lock Terminal" : undefined}
          className={`w-full flex items-center justify-center gap-2 px-3 py-2.5 rounded-xl text-xs font-semibold font-sans text-rose-600 hover:bg-rose-50 border border-slate-100 hover:border-rose-100 transition-all duration-150 cursor-pointer active-bounce ${
            isCollapsed ? 'px-0 border-none hover:bg-rose-50/50' : ''
          }`}
        >
          <LogOut className="w-3.5 h-3.5 shrink-0" />
          {!isCollapsed && <span className="animate-scale-up">Lock Terminal</span>}
        </button>
      </div>
    </div>
  );
}

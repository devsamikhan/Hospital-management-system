/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect } from 'react';
import { 
  Hospital, 
  Lock, 
  Mail, 
  ShieldAlert, 
  X, 
  LogOut, 
  CheckCircle, 
  AlertCircle,
  User,
  Activity,
  Heart,
  Menu
} from 'lucide-react';
import { HospitalProvider, useHospital } from './context/HospitalContext';

import Sidebar from './components/Sidebar';
import DashboardStatsOverview from './components/DashboardStatsOverview';
import PatientsDirectory from './components/PatientsDirectory';
import AppointmentsBook from './components/AppointmentsBook';
import ClinicalEMRConsultation from './components/ClinicalEMRConsultation';
import LaboratoryRadiologyModule from './components/LaboratoryRadiologyModule';
import PharmacyInventoryManagement from './components/PharmacyInventoryManagement';
import InpatientWardBeds from './components/InpatientWardBeds';
import BillingAccountingLedger from './components/BillingAccountingLedger';
import AuditLogsViewer from './components/AuditLogsViewer';
import HospitalSettings from './components/HospitalSettings';

function HospitalAppContent() {
  const { 
    user, 
    login, 
    logout, 
    activeTab, 
    setActiveTab,
    success, 
    error, 
    setSuccess, 
    setError,
    toasts,
    removeToast,
    isLoading
  } = useHospital();

  // Mobile navigation open state
  const [mobileSidebarOpen, setMobileSidebarOpen] = useState(false);

  // Login variables
  const [emailInput, setEmailInput] = useState('');
  const [passInput, setPassInput] = useState('');
  const [loadingLogin, setLoadingLogin] = useState(false);

  // Auto clean notifications alert status bar
  useEffect(() => {
    if (success) {
      const timer = setTimeout(() => setSuccess(''), 5000);
      return () => clearTimeout(timer);
    }
  }, [success]);

  useEffect(() => {
    if (error) {
      const timer = setTimeout(() => setError(''), 5000);
      return () => clearTimeout(timer);
    }
  }, [error]);

  const handleLoginSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!emailInput || !passInput) return;
    setLoadingLogin(true);
    const ok = await login(emailInput, passInput);
    setLoadingLogin(false);
  };

  const selectPresetCredential = (email: string, pass: string) => {
    setEmailInput(email);
    setPassInput(pass);
  };

  // IF INITIAL SESSION CHECK IS IN PROGRESS: Render portal loading screen
  if (isLoading) {
    return (
      <div id="hms-initial-loader" className="min-h-screen bg-[#F8FAFC] flex flex-col items-center justify-center p-4 relative overflow-hidden">
        {/* Geometric background decoration */}
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[400px] h-[400px] bg-blue-500/5 rounded-full blur-3xl pointer-events-none"></div>
        <div className="flex flex-col items-center justify-center space-y-4 text-center z-10">
          <div className="w-16 h-16 bg-blue-50 border border-blue-100 rounded-2xl flex items-center justify-center shadow-xs animate-scale-up">
            <Hospital className="w-8 h-8 text-blue-600 animate-pulse" />
          </div>
          <div className="space-y-1 animate-scale-up">
            <h2 className="font-display font-bold text-sm text-slate-800 tracking-tight">Initializing St. Jude HMS...</h2>
            <p className="font-sans text-[10px] text-slate-400 font-medium">Securing cloud pipeline channels & compiling logs</p>
          </div>
          <div className="w-32 h-1 bg-slate-100 rounded-full overflow-hidden shrink-0 mt-2">
            <div className="h-full bg-blue-600 rounded-full w-2/3 animate-pulse"></div>
          </div>
        </div>
      </div>
    );
  }

  // IF NOT LOGGED IN: Render clinical authentication wall page
  if (!user) {
    return (
      <div id="hms-login-wall" className="min-h-screen bg-[#F8FAFC] flex flex-col items-center justify-center p-4 relative overflow-hidden">
        
        {/* Ambient medical glowing background rings */}
        <div className="absolute top-1/3 left-1/3 w-[300px] h-[300px] bg-blue-500/5 rounded-full blur-[100px] animate-pulse-soft pointer-events-none"></div>
        <div className="absolute bottom-1/3 right-1/3 w-[350px] h-[350px] bg-teal-500/5 rounded-full blur-[120px] animate-pulse-soft pointer-events-none" style={{ animationDelay: '1s' }}></div>

        <div className="w-full max-w-md bg-white/95 backdrop-blur-md rounded-3xl p-8 relative z-10 space-y-6 animate-scale-up border border-slate-200/75 shadow-xl shadow-slate-100/50">
          {/* Brand header */}
          <div className="text-center space-y-3">
            <div className="mx-auto w-12 h-12 bg-blue-50 border border-blue-100 rounded-2xl flex items-center justify-center shadow-md shadow-blue-100/30">
              <Hospital className="w-6 h-6 text-blue-600" />
            </div>
            <h1 className="font-display font-bold text-xl text-slate-850 tracking-tight">St. Jude HMS Portal</h1>
            <p className="font-sans text-xs text-slate-500 leading-relaxed max-w-xs mx-auto">Authorized Medical Staff Gateway. Private Electronic Health Records access and active clinical operations are logged.</p>
          </div>

          {/* Form */}
          <form onSubmit={handleLoginSubmit} className="space-y-4 text-xs font-sans">
            <div className="space-y-1.5">
              <label className="text-slate-500 font-semibold font-sans block">Staff Email Identifier</label>
              <div className="relative">
                <Mail className="absolute left-3.5 top-3.5 w-4 h-4 text-slate-400" />
                <input 
                  required
                  id="txt-login-email"
                  type="email" 
                  value={emailInput} 
                  onChange={e => setEmailInput(e.target.value)} 
                  className="w-full pl-10 pr-4 py-3 bg-slate-50/50 border border-slate-200/85 focus:border-blue-500/60 focus:bg-white rounded-2xl text-slate-800 outline-none transition-all duration-150" 
                  placeholder="physician@stjude.com"
                />
              </div>
            </div>

            <div className="space-y-1.5">
              <label className="text-slate-500 font-semibold font-sans block">Security Password</label>
              <div className="relative">
                <Lock className="absolute left-3.5 top-3.5 w-4 h-4 text-slate-400" />
                <input 
                  required
                  id="txt-login-password"
                  type="password" 
                  value={passInput} 
                  onChange={e => setPassInput(e.target.value)} 
                  className="w-full pl-10 pr-4 py-3 bg-slate-50/50 border border-slate-200/85 focus:border-blue-500/60 focus:bg-white rounded-2xl text-slate-800 outline-none transition-all duration-150" 
                  placeholder="••••••••"
                />
              </div>
            </div>

            {error && (
              <div className="bg-rose-50 border border-rose-100 p-3.5 rounded-2xl flex items-start gap-2.5 text-rose-800 font-medium font-sans">
                <AlertCircle className="w-4 h-4 shrink-0 mt-0.5 text-rose-600" />
                <span>{error}</span>
              </div>
            )}

            <button 
              type="submit" 
              disabled={loadingLogin}
              id="btn-login-submit"
              className="w-full py-3.5 bg-blue-600 hover:bg-blue-700 active-bounce disabled:bg-blue-800 text-white font-bold font-sans rounded-2xl shadow-md shadow-blue-500/10 hover:shadow-lg hover:shadow-blue-500/20 transition-all uppercase tracking-wider text-[11px] cursor-pointer flex items-center justify-center gap-2"
            >
              {loadingLogin ? (
                <>
                  <Activity className="w-3.5 h-3.5 animate-spin-fast text-white" />
                  <span>Unlocking Station...</span>
                </>
              ) : (
                <span>Unlock Clinical Station</span>
              )}
            </button>
          </form>

          {/* Quick preset selector cards to facilitate review */}
          <div className="border-t border-slate-100 pt-5 space-y-3">
            <span className="text-[10px] text-slate-400 font-mono tracking-wider font-bold uppercase block text-center">Fast Handshake Preset Selectors</span>
            <div className="grid grid-cols-2 gap-2 text-[10px] font-sans font-semibold">
              <button 
                type="button"
                onClick={() => selectPresetCredential('admin@hospital.com', 'admin123')}
                className="p-3 border border-slate-200/60 rounded-2xl bg-slate-50/40 text-slate-700 hover:border-blue-500/50 hover:bg-blue-50/20 transition-all text-left flex justify-between items-center cursor-pointer font-medium active-bounce shadow-xs"
              >
                <span>Admin Director</span>
                <span className="font-mono text-[9px] text-blue-600 font-bold uppercase">ADMIN</span>
              </button>
              <button 
                type="button"
                onClick={() => selectPresetCredential('doctor@hospital.com', 'doctor123')}
                className="p-3 border border-slate-200/60 rounded-2xl bg-slate-50/40 text-slate-700 hover:border-blue-500/50 hover:bg-blue-50/20 transition-all text-left flex justify-between items-center cursor-pointer font-medium active-bounce shadow-xs"
              >
                <span>Dr. Asif Khan</span>
                <span className="font-mono text-[9px] text-blue-600 font-bold uppercase">DOCTOR</span>
              </button>
              <button 
                type="button"
                onClick={() => selectPresetCredential('nurse@hospital.com', 'nurse123')}
                className="p-3 border border-slate-200/60 rounded-2xl bg-slate-50/40 text-slate-700 hover:border-blue-500/50 hover:bg-blue-50/20 transition-all text-left flex justify-between items-center cursor-pointer font-medium active-bounce shadow-xs"
              >
                <span>RN Head Nurse</span>
                <span className="font-mono text-[9px] text-blue-600 font-bold uppercase">NURSE</span>
              </button>
              <button 
                type="button"
                onClick={() => selectPresetCredential('labtech@hospital.com', 'labtech123')}
                className="p-3 border border-slate-200/60 rounded-2xl bg-slate-50/40 text-slate-700 hover:border-blue-500/50 hover:bg-blue-50/20 transition-all text-left flex justify-between items-center cursor-pointer font-medium active-bounce shadow-xs"
              >
                <span>Lab Specialist</span>
                <span className="font-mono text-[9px] text-blue-600 font-bold uppercase">LABTECH</span>
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // CHECK TAB ACCESS RULES (ROLE-BASED ACCESS CONTROL)
  const isAuthorized = (): boolean => {
    const role = user.role;
    switch (activeTab) {
      case 'dashboard':
      case 'patients':
      case 'appointments':
        return true; // All roles can inspect outpatient listing and schedules
      case 'clini-emr':
        return role === 'Admin' || role === 'Doctor';
      case 'laboratory':
        return role === 'Admin' || role === 'LabTech' || role === 'Lab Technician' || role === 'Doctor';
      case 'pharmacy':
        return role === 'Admin' || role === 'Pharmacist' || role === 'Doctor';
      case 'ward-beds':
        return role === 'Admin' || role === 'Nurse' || role === 'Doctor' || role === 'Receptionist';
      case 'billing':
        return role === 'Admin' || role === 'Receptionist' || role === 'Doctor';
      case 'audit-logs':
      case 'settings':
        return role === 'Admin';
      default:
        return false;
    }
  };

  const renderActiveView = () => {
    if (!isAuthorized()) {
      return (
        <div id="hms-auth-blocked" className="h-[calc(100vh-220px)] flex flex-col items-center justify-center text-center py-20 px-4 bg-slate-50 border border-slate-100 rounded-3xl max-w-xl mx-auto space-y-6">
          <div className="w-16 h-16 bg-rose-50 text-rose-600 rounded-2xl flex items-center justify-center border border-rose-200">
            <ShieldAlert className="w-8 h-8 stroke-[1.5]" />
          </div>
          <div className="space-y-2">
            <h3 className="font-display font-semibold text-slate-800 text-sm">Security Block — Private PHI Access Denied</h3>
            <p className="font-sans text-xs text-slate-500 max-w-md mx-auto leading-relaxed">
              Your clinician profile role (<strong className="text-rose-600 uppercase font-mono">{user.role}</strong>) does not have therapeutic privileges to query this records tier. Under federal HIPAA compliance policy, this denial has been filed in the secure system audit logs.
            </p>
          </div>
          <button 
            onClick={() => setActiveTab('dashboard')}
            className="px-5 py-2.5 bg-slate-800 text-white rounded-xl text-xs font-semibold cursor-pointer"
          >
            Return to Dashboard
          </button>
        </div>
      );
    }

    switch (activeTab) {
      case 'dashboard':
        return <DashboardStatsOverview setCurrentTab={setActiveTab} />;
      case 'patients':
        return <PatientsDirectory />;
      case 'appointments':
        return <AppointmentsBook />;
      case 'clini-emr':
        return <ClinicalEMRConsultation />;
      case 'laboratory':
        return <LaboratoryRadiologyModule />;
      case 'pharmacy':
        return <PharmacyInventoryManagement />;
      case 'ward-beds':
        return <InpatientWardBeds />;
      case 'billing':
        return <BillingAccountingLedger />;
      case 'audit-logs':
        return <AuditLogsViewer />;
      case 'settings':
        return <HospitalSettings />;
      default:
        return <DashboardStatsOverview setCurrentTab={setActiveTab} />;
    }
  };

  return (
    <div id="hms-app-frame" className="h-screen overflow-hidden bg-[#F8FAFC] flex flex-col">
      
      {/* 1. TOP MAIN HEADER */}
      <header className="bg-white border-b border-slate-200 px-4 md:px-8 py-3 md:py-4 flex items-center justify-between shrink-0">
        <div className="flex items-center gap-3">
          {/* Hamburger Menu Button */}
          <button 
            onClick={() => setMobileSidebarOpen(!mobileSidebarOpen)} 
            className="p-2 -ml-2 text-slate-500 hover:text-slate-900 hover:bg-slate-100 rounded-xl md:hidden block cursor-pointer shrink-0 active-bounce"
            title="Toggle Menu"
          >
            <Menu className="w-5 h-5" />
          </button>
          
          <div className="w-8 h-8 bg-blue-50 border border-blue-100 rounded-lg flex items-center justify-center">
            <Hospital className="w-4 h-4 text-blue-600" />
          </div>
          <div>
            <h1 className="font-display font-bold text-xs md:text-sm text-slate-800 tracking-tight truncate max-w-[180px] sm:max-w-none">St. Jude Community Teaching Hospital</h1>
            <span className="font-sans text-[9px] md:text-[10px] text-slate-400 block mt-0.5">Central City Gateway • Clinical & Administrative Portal</span>
          </div>
        </div>

        {/* User profile section */}
        <div className="flex items-center gap-4">
          <div className="text-right hidden sm:block">
            <p className="font-sans font-bold text-xs text-slate-800">{user.name}</p>
            <span className="font-mono text-[9px] text-blue-600 uppercase font-bold">{user.role} Station</span>
          </div>
          <div className="h-6 w-[1px] bg-slate-200"></div>
          <button 
            id="btn-logout"
            onClick={logout}
            className="p-1.5 text-slate-400 hover:text-rose-600 bg-slate-50 hover:bg-[#FFF1F2] border border-slate-100 hover:border-rose-100 rounded-lg cursor-pointer transition-colors"
            title="Log out of clinical session"
          >
            <LogOut className="w-3.5 h-3.5" />
          </button>
        </div>
      </header>



      {/* 3. WORKING WORKSPACE GRID LAYOUT */}
      <div className="flex-1 flex overflow-hidden relative">
        
        {/* Mobile Sidebar backdrop blur overlay */}
        {mobileSidebarOpen && (
          <div 
            onClick={() => setMobileSidebarOpen(false)}
            className="fixed inset-0 bg-slate-900/40 backdrop-blur-xs z-30 md:hidden transition-opacity duration-300"
          ></div>
        )}

        {/* Left rail navigation side panel */}
        <Sidebar 
          currentTab={activeTab} 
          setCurrentTab={(tab) => {
            setActiveTab(tab);
            setMobileSidebarOpen(false);
          }} 
          mobileSidebarOpen={mobileSidebarOpen}
          setMobileSidebarOpen={setMobileSidebarOpen}
        />

        {/* Dynamic viewport panel */}
        <main id="hms-main-viewport" className="flex-1 p-4 md:p-8 overflow-y-auto custom-scrollbar">
          {renderActiveView()}
        </main>
      </div>

      {/* 4. PREMIUM FLOATING TOAST NOTIFICATION CONTAINER */}
      <div id="hms-floating-toast-container" className="fixed top-6 right-6 z-[9999] flex flex-col gap-3 pointer-events-none max-w-sm w-full">
        {toasts && toasts.map((toast) => (
          <div
            key={toast.id}
            id={toast.id}
            className={`pointer-events-auto p-4 rounded-xl shadow-lg border backdrop-blur-md flex items-start gap-3 transition-all duration-300 animate-slide-in-right ${
              toast.type === 'success' ? 'bg-emerald-50/90 border-emerald-200/60 text-emerald-800' :
              toast.type === 'error' ? 'bg-rose-50/90 border-rose-200/60 text-rose-800' :
              'bg-blue-50/90 border-blue-200/60 text-blue-800'
            }`}
          >
            {toast.type === 'success' && <CheckCircle className="w-4.5 h-4.5 text-emerald-600 shrink-0 mt-0.5" />}
            {toast.type === 'error' && <AlertCircle className="w-4.5 h-4.5 text-rose-600 shrink-0 mt-0.5" />}
            {toast.type === 'info' && <Activity className="w-4.5 h-4.5 text-blue-600 shrink-0 mt-0.5" />}
            
            <div className="flex-1">
              <p className="font-sans font-semibold text-[11px] leading-snug">{toast.message}</p>
            </div>
            
            <button 
              onClick={() => removeToast(toast.id)} 
              className="text-slate-400 hover:text-slate-600 cursor-pointer transition-colors shrink-0"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          </div>
        ))}
      </div>
    </div>
  );
}

export default function App() {
  return (
    <HospitalProvider>
      <HospitalAppContent />
    </HospitalProvider>
  );
}

/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import { 
  Settings, 
  Hospital, 
  DollarSign, 
  ShieldAlert, 
  Download, 
  RefreshCw, 
  ToggleLeft, 
  ToggleRight, 
  Check, 
  CheckCircle2,
  Database,
  CloudLightning,
  Clock
} from 'lucide-react';
import { useHospital } from '../context/HospitalContext';

export default function HospitalSettings() {
  const { setSuccess, setError } = useHospital();

  // Profile States
  const [hospName, setHospName] = useState('St. Jude Community Teaching Hospital');
  const [hospAddress, setHospAddress] = useState('500 Grace Avenue, Metropolis, NY 10001');
  const [hospPhone, setHospPhone] = useState('+1 (555) 019-2831');
  
  // Bed daily pricing standards
  const [generalPrice, setGeneralPrice] = useState(120);
  const [semiPrice, setSemiPrice] = useState(250);
  const [privatePrice, setPrivatePrice] = useState(500);
  const [icuPrice, setIcuPrice] = useState(1200);

  // Doctors on-duty toggle states
  const [docSmithOnDuty, setDocSmithOnDuty] = useState(true);
  const [docHouseOnDuty, setDocHouseOnDuty] = useState(true);

  // Backup states
  const [lastBackup, setLastBackup] = useState('2026-05-29 08:00:00 UTC');
  const [backingUp, setBackingUp] = useState(false);

  const handleSaveSettings = (e: React.FormEvent) => {
    e.preventDefault();
    setSuccess("Hospital operational policies and bed tier pricing updated successfully.");
  };

  const triggerSimulatedBackup = async () => {
    setBackingUp(true);
    await new Promise(resolve => setTimeout(resolve, 1500));
    setLastBackup(new Date().toISOString().replace('T', ' ').substring(0, 19) + ' UTC');
    setBackingUp(false);
    setSuccess("Full administrative data partition backed up & synced to cloud backup store successfully.");
  };

  return (
    <div id="hms-settings-workspace" className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start max-w-5xl mx-auto py-4">
      
      {/* Policy configuration options form */}
      <div className="lg:col-span-8 bg-white/90 backdrop-blur-xs border border-slate-100/70 rounded-2xl shadow-sm hover:shadow-md hover:border-slate-200/50 transition-all duration-300 p-6 space-y-6">
        <div className="flex items-center gap-2 border-b border-slate-50 pb-4">
          <Settings className="w-5 h-5 text-blue-600" />
          <h3 className="font-display font-medium text-slate-800 text-sm">System operational settings & parameters</h3>
        </div>

        <form onSubmit={handleSaveSettings} className="space-y-6 text-xs font-sans">
          
          {/* Profile fields */}
          <div className="space-y-3">
            <span className="text-[10px] font-mono font-bold text-blue-600 uppercase tracking-wider block">1. Institutional profile details</span>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-1 col-span-2">
                <label className="text-slate-500 font-semibold">Hospital Legal Entity Name</label>
                <input type="text" value={hospName} onChange={e => setHospName(e.target.value)} className="w-full text-xs p-2.5 border border-slate-200 rounded-lg focus:outline-none focus:ring-1 focus:ring-blue-500" />
              </div>
              <div className="space-y-1 col-span-2">
                <label className="text-slate-500 font-semibold">Postal & Physical Location Address</label>
                <input type="text" value={hospAddress} onChange={e => setHospAddress(e.target.value)} className="w-full text-xs p-2.5 border border-slate-200 rounded-lg focus:outline-none" />
              </div>
              <div className="space-y-1">
                <label className="text-slate-500 font-semibold font-semibold">ER Contact Hotlines</label>
                <input type="text" value={hospPhone} onChange={e => setHospPhone(e.target.value)} className="w-full text-xs p-2.5 border border-slate-200 rounded-lg focus:outline-none" />
              </div>
            </div>
          </div>

          {/* Pricing Policy rates */}
          <div className="space-y-3 border-t border-slate-100 pt-5">
            <span className="text-[10px] font-mono font-bold text-blue-600 uppercase tracking-wider block">2. Inpatient accommodation daily flat charge tier rates (PKR)</span>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-3 text-center">
              <div className="p-3 bg-slate-50/50 border border-slate-100 rounded-xl space-y-1 text-center">
                <span className="text-slate-400 block font-semibold">General Ward</span>
                <input type="number" value={generalPrice} onChange={e => setGeneralPrice(Number(e.target.value))} className="w-16 p-1 text-center bg-white border border-slate-200 rounded font-mono font-bold mt-1" />
                <span className="text-[9px] text-slate-300 block font-mono">PKR/day</span>
              </div>
              <div className="p-3 bg-slate-50/50 border border-slate-100 rounded-xl space-y-1 text-center">
                <span className="text-slate-400 block font-semibold">Semi-Private</span>
                <input type="number" value={semiPrice} onChange={e => setSemiPrice(Number(e.target.value))} className="w-16 p-1 text-center bg-white border border-slate-200 rounded font-mono font-bold mt-1" />
                <span className="text-[9px] text-slate-300 block font-mono">PKR/day</span>
              </div>
              <div className="p-3 bg-slate-50/50 border border-slate-100 rounded-xl space-y-1 text-center">
                <span className="text-slate-400 block font-semibold">Private Room</span>
                <input type="number" value={privatePrice} onChange={e => setPrivatePrice(Number(e.target.value))} className="w-16 p-1 text-center bg-white border border-slate-200 rounded font-mono font-bold mt-1" />
                <span className="text-[9px] text-slate-300 block font-mono">PKR/day</span>
              </div>
              <div className="p-3 bg-slate-50/50 border border-slate-100 rounded-xl space-y-1 text-center">
                <span className="text-slate-400 block font-semibold">Intensive Care ICU</span>
                <input type="number" value={icuPrice} onChange={e => setIcuPrice(Number(e.target.value))} className="w-16 p-1 text-center bg-white border border-slate-200 rounded font-mono font-bold mt-1" />
                <span className="text-[9px] text-slate-300 block font-mono">PKR/day</span>
              </div>
            </div>
          </div>

          {/* Clinicians on-duty toggles */}
          <div className="space-y-3 border-t border-slate-100 pt-5">
            <span className="text-[10px] font-mono font-bold text-blue-600 uppercase tracking-wider block">3. Specialist availability roaster duty controls</span>
            <div className="divide-y divide-slate-100">
              <div className="py-2.5 flex items-center justify-between">
                <div>
                  <strong className="text-slate-700 block text-[11px]">Dr. Elizabeth Smith</strong>
                  <span className="text-[10px] text-slate-400 font-light">Lead Cardiologist on Monday/Wednesday/Friday outpatient availability slot</span>
                </div>
                <button type="button" onClick={() => setDocSmithOnDuty(!docSmithOnDuty)} className="cursor-pointer">
                  {docSmithOnDuty ? (
                    <span className="font-mono text-emerald-600 font-semibold hover:opacity-85 sm:text-[11px] flex items-center gap-1">On-Duty <ToggleRight className="w-6 h-6 text-emerald-600" /></span>
                  ) : (
                    <span className="font-mono text-slate-400 font-semibold hover:opacity-85 sm:text-[11px] flex items-center gap-1">Off-Duty <ToggleLeft className="w-6 h-6 text-slate-300" /></span>
                  )}
                </button>
              </div>

              <div className="py-2.5 flex items-center justify-between">
                <div>
                  <strong className="text-slate-700 block text-[11px]">Dr. Gregory House</strong>
                  <span className="text-[10px] text-slate-400 font-light">Diagnostics Lead on Tuesday/Thursday outpatient diagnostics availability slot</span>
                </div>
                <button type="button" onClick={() => setDocHouseOnDuty(!docHouseOnDuty)} className="cursor-pointer">
                  {docHouseOnDuty ? (
                    <span className="font-mono text-emerald-600 font-semibold hover:opacity-85 sm:text-[11px] flex items-center gap-1">On-Duty <ToggleRight className="w-6 h-6 text-emerald-600" /></span>
                  ) : (
                    <span className="font-mono text-slate-400 font-semibold hover:opacity-85 sm:text-[11px] flex items-center gap-1">Off-Duty <ToggleLeft className="w-6 h-6 text-slate-300" /></span>
                  )}
                </button>
              </div>
            </div>
          </div>

          <div className="flex items-center justify-end gap-3 pt-5 border-t border-slate-100 text-xs font-sans font-medium">
            <button type="submit" id="btn-save-hospital-settings" className="px-5 py-2.5 bg-blue-600 hover:bg-blue-700 active-bounce cursor-pointer text-white rounded-xl shadow-md cursor-pointer transition">
              Apply Operational Rules
            </button>
          </div>
        </form>
      </div>

      {/* Cloud Backups status column */}
      <div className="lg:col-span-4 space-y-6">
        
        {/* Backup and sync card widget */}
        <div className="bg-white/90 backdrop-blur-xs border border-slate-100/70 rounded-2xl shadow-sm hover:shadow-md hover:border-slate-200/50 transition-all duration-300 p-6 text-xs font-sans text-slate-500 space-y-4">
          <div className="flex items-center gap-2 border-b border-slate-50 pb-3">
            <Database className="w-5 h-5 text-blue-600 shrink-0" />
            <h4 className="font-display font-medium text-slate-800 text-xs uppercase tracking-wide">Database backups manager</h4>
          </div>

          <p className="leading-relaxed">To achieve optimal durability and failover safety, secure clinical database blocks are scheduled for persistent backups.</p>
          
          <div className="bg-slate-50/70 p-3.5 rounded-xl border border-slate-100 space-y-1 font-mono text-[10px] text-slate-400">
            <span className="font-semibold text-slate-500 uppercase font-sans text-[9px] block">Backup metadata diagnostics:</span>
            <p>Target Archive: <strong className="text-blue-600">hospital_db_backup.json</strong></p>
            <p>Schema Standard: <strong className="text-slate-600">schema.sql (PostgreSQL JSONB compatible)</strong></p>
            <p className="flex items-center gap-1.5"><Clock className="w-3.5 h-3.5 text-slate-400" /> Last Backup Run: <strong className="text-slate-800">{lastBackup}</strong></p>
          </div>

          <button 
            type="button"
            id="btn-trigger-backup"
            disabled={backingUp}
            onClick={triggerSimulatedBackup}
            className="w-full py-2.5 bg-slate-800 hover:bg-slate-900 font-sans font-medium text-white text-xs rounded-xl cursor-pointer flex items-center justify-center gap-1.5 shadow-sm transition"
          >
            {backingUp ? (
              <>
                <RefreshCw className="w-4 h-4 animate-spin" />
                <span>Consolidating medical blocks...</span>
              </>
            ) : (
              <>
                <CloudLightning className="w-4 h-4" />
                <span>Simulate Database Backup Now</span>
              </>
            )}
          </button>
        </div>

        {/* HIPAA Security compliance advice notes */}
        <div className="bg-amber-50/50 border border-amber-200/50 rounded-2xl p-5 text-xs font-sans text-amber-800 space-y-2">
          <div className="flex items-center gap-1.5 text-amber-700 font-semibold mb-1">
            <ShieldAlert className="w-4 h-4 stroke-[2]" />
            <span>HIPAA HIPAA Security notice</span>
          </div>
          <p className="leading-relaxed">Any revision to bed Daily Rates or Physician Assignment schedules writes detailed entries to the security audit trails logs automatically.</p>
        </div>
      </div>
    </div>
  );
}

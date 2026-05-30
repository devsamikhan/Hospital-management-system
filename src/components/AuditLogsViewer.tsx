/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import { 
  ShieldCheck, 
  Search, 
  Filter, 
  Layers, 
  Calendar,
  Clock,
  User,
  Activity,
  UserCheck
} from 'lucide-react';
import { useHospital } from '../context/HospitalContext';

export default function AuditLogsViewer() {
  const { auditLogs } = useHospital();
  const [logSearch, setLogSearch] = useState('');
  const [logFilterAction, setLogFilterAction] = useState('all');

  const filteredLogs = auditLogs.filter(log => {
    const actionMatch = logFilterAction === 'all' || (log.action && log.action.toLowerCase().includes(logFilterAction.toLowerCase()));
    const searchMatch = 
      (log.username && log.username.toLowerCase().includes(logSearch.toLowerCase())) ||
      (log.userEmail && log.userEmail.toLowerCase().includes(logSearch.toLowerCase())) ||
      (log.action && log.action.toLowerCase().includes(logSearch.toLowerCase())) ||
      (log.details && log.details.toLowerCase().includes(logSearch.toLowerCase())) ||
      (log.patientId && log.patientId.toLowerCase().includes(logSearch.toLowerCase()));
    
    return actionMatch && searchMatch;
  });

  return (
    <div id="hms-audit-logs-viewport" className="space-y-6">
      <div id="audit-logs-toolbar" className="bg-white/90 backdrop-blur-xs border border-slate-100/70 rounded-2xl shadow-sm hover:shadow-md hover:border-slate-200/50 transition-all duration-300 p-4 flex flex-col md:flex-row items-center justify-between gap-4 text-xs font-sans">
        
        {/* Left Side elements filters */}
        <div className="flex flex-wrap items-center gap-3 w-full md:w-auto">
          
          {/* Action category filter */}
          <div className="flex flex-col gap-1">
            <label className="text-slate-400 font-semibold">Filter Action Types</label>
            <select 
              id="ddl-audit-action"
              value={logFilterAction} 
              onChange={e => setLogFilterAction(e.target.value)} 
              className="p-2 border border-slate-200 rounded-xl focus:outline-none focus:ring-1 focus:ring-blue-500"
            >
              <option value="all">All Operations</option>
              <option value="auth">Authentication</option>
              <option value="patient">Patient Demographics</option>
              <option value="encounter">Clinical Encounter EMR</option>
              <option value="dispense">Pharmacy Dispense</option>
              <option value="billing">Billing Payment</option>
              <option value="admit">Ward Bed Allocation</option>
              <option value="laboratory">Lab Results</option>
            </select>
          </div>

          {/* Search bar */}
          <div className="flex flex-col gap-1 w-48 md:w-64">
            <label className="text-slate-400 font-semibold">Security Search</label>
            <div className="relative">
              <Search className="absolute left-3 top-2.5 w-3.5 h-3.5 text-slate-400" />
              <input 
                id="txt-audit-search"
                type="text" 
                placeholder="User Email, ID, MRN, keyword..." 
                value={logSearch}
                onChange={e => setLogSearch(e.target.value)}
                className="w-full pl-8 pr-3 py-2 border border-slate-200 rounded-xl focus:outline-none"
              />
            </div>
          </div>
        </div>

        <div className="flex items-center gap-2 text-[11px] text-slate-400 font-mono tracking-wide px-3 py-1.5 bg-slate-50 border border-slate-100 rounded-xl">
          <ShieldCheck className="w-4 h-4 text-slate-400 shrink-0" />
          <span>PHR Access Protected under security audit logging standard controls</span>
        </div>
      </div>

      {/* Logs timeline ledger */}
      <div id="audit-ledger-card" className="bg-white/90 backdrop-blur-xs border border-slate-100/70 rounded-2xl shadow-sm hover:shadow-md hover:border-slate-200/50 transition-all duration-300 p-6 space-y-4">
        <div className="flex items-center justify-between border-b border-slate-50 pb-4">
          <div className="flex items-center gap-2">
            <Layers className="w-5 h-5 text-blue-600" />
            <h3 className="font-display font-medium text-sm text-slate-800">Chronological Operations & PHI Access Audit Trails</h3>
          </div>
          <span className="text-[10px] text-slate-400 font-mono">Lines: {filteredLogs.length} logged entries</span>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs font-sans divide-y divide-slate-100">
            <thead>
              <tr className="text-slate-400 font-semibold uppercase tracking-wider text-[10px]">
                <th className="py-3 px-4">Timestamp (UTC)</th>
                <th className="py-3 px-4">Operator Email (Role)</th>
                <th className="py-3 px-4">Action Method Log</th>
                <th className="py-3 px-4">Sensitive Details / PHI Target</th>
                <th className="py-3 px-4">IP Address</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 font-mono text-[11px] text-slate-600 bg-white">
              {filteredLogs.map(log => (
                <tr key={log.id} id={`audit-row-${log.id}`} className="hover:bg-slate-50/20">
                  <td className="py-3.5 px-4 text-slate-500 font-mono text-[10px]">
                    {new Date(log.timestamp).toLocaleString()}
                  </td>
                  <td className="py-3.5 px-4 text-slate-700 font-sans text-xs">
                    <span className="font-medium block">{log.username || log.userEmail || 'System'}</span>
                    <span className="text-[9px] font-mono text-blue-600 font-bold uppercase">{log.userRole}</span>
                  </td>
                  <td className="py-3.5 px-4">
                    <span className="px-2 py-0.5 bg-slate-100 text-slate-700 rounded text-[10px] font-bold">
                      {log.action}
                    </span>
                  </td>
                  <td className="py-3.5 px-4 text-slate-500 font-sans text-xs">
                    {log.details || 'Routine medical registry review'}
                    {log.patientId && (
                      <span className="block font-mono text-[9px] text-blue-600 font-bold mt-1 uppercase">Target MRN: {log.patientId}</span>
                    )}
                  </td>
                  <td className="py-3.5 px-4 text-slate-400">
                    {log.ipAddress || '127.0.0.1'}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}

/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import { 
  Bed, 
  Search, 
  BedDouble, 
  Users, 
  PlusCircle, 
  FileCheck2, 
  Trash2, 
  Clipboard, 
  FileUp, 
  Activity, 
  Save, 
  X,
  Stethoscope,
  Heart
} from 'lucide-react';
import { useHospital } from '../context/HospitalContext';
import { Bed as BedTypeItem, InpatientAdmission } from '../types';

export default function InpatientWardBeds() {
  const { 
    beds, 
    admissions, 
    patients, 
    admitInpatient, 
    addNursingNote, 
    addProgressNote, 
    dischargeInpatient, 
    setError 
  } = useHospital();

  const [activeIpdTab, setActiveIpdTab] = useState<'beds' | 'admissions'>('beds');
  const [selectedAdmission, setSelectedAdmission] = useState<InpatientAdmission | null>(null);
  
  // Dialog modal states
  const [showAdmitModal, setShowAdmitModal] = useState(false);
  const [showDischargeModal, setShowDischargeModal] = useState(false);

  // Admission States
  const [admitPatId, setAdmitPatId] = useState('');
  const [admitBedId, setAdmitBedId] = useState('');

  // Daily write note states
  const [nurseNoteText, setNurseNoteText] = useState('');
  const [progressNoteText, setProgressNoteText] = useState('');

  // Discharge Form States
  const [diagnosis, setDiagnosis] = useState('');
  const [treatmentSummary, setTreatmentSummary] = useState('');
  const [dischargeInstructions, setDischargeInstructions] = useState('');
  const [followUpDate, setFollowUpDate] = useState('2026-06-05');

  const vacantBeds = beds.filter(b => b.status === 'Vacant');
  const occupiedBedsCount = beds.filter(b => b.status === 'Occupied').length;
  const maintenanceCount = beds.filter(b => b.status === 'Maintenance').length;

  const handleSelectAdmission = (adm: InpatientAdmission) => {
    setSelectedAdmission(adm);
    setNurseNoteText('');
    setProgressNoteText('');
  };

  const handleOpenAdmit = () => {
    if (vacantBeds.length === 0) {
      setError("No vacant beds available at the moment. All units are occupied or under maintenance.");
      return;
    }
    setAdmitPatId('');
    setAdmitBedId(vacantBeds[0].id);
    setShowAdmitModal(true);
  };

  const submitAdmission = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!admitPatId || !admitBedId) {
      setError("Please select patient MRN and bed index.");
      return;
    }
    const ok = await admitInpatient(admitPatId, admitBedId);
    if (ok) {
      setShowAdmitModal(false);
      setAdmitPatId('');
    }
  };

  const handleAddNurseNote = async () => {
    if (!selectedAdmission || !nurseNoteText) return;
    const ok = await addNursingNote(selectedAdmission.id, nurseNoteText);
    if (ok) {
      // refresh active selected
      const updated = admissions.find(a => a.id === selectedAdmission.id);
      if (updated) setSelectedAdmission(updated);
      setNurseNoteText('');
    }
  };

  const handleAddProgressNote = async () => {
    if (!selectedAdmission || !progressNoteText) return;
    const ok = await addProgressNote(selectedAdmission.id, progressNoteText);
    if (ok) {
      const updated = admissions.find(a => a.id === selectedAdmission.id);
      if (updated) setSelectedAdmission(updated);
      setProgressNoteText('');
    }
  };

  const submitDischarge = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedAdmission) return;
    if (!diagnosis || !treatmentSummary || !dischargeInstructions) {
      setError("All fields: diagnosis, treatment and home instructions are required.");
      return;
    }

    const ok = await dischargeInpatient(selectedAdmission.id, {
      diagnosis,
      treatmentSummary,
      dischargeInstructions,
      followUpDate: followUpDate || undefined
    });

    if (ok) {
      setShowDischargeModal(false);
      setSelectedAdmission(null);
    }
  };

  return (
    <div id="hms-inpatient-module" className="space-y-6">
      
      {/* Top dashboard stats and controls */}
      <div id="ipd-dashboard-banner" className="grid grid-cols-1 md:grid-cols-4 gap-4">
        {/* Beds toggle switch */}
        <div className="bg-white/90 backdrop-blur-xs border border-slate-100/70 rounded-2xl shadow-sm hover:shadow-md hover:border-slate-200/50 transition-all duration-300 p-3.5 flex items-center justify-between">
          <div className="flex gap-2">
            <button 
              id="btn-tab-beds"
              onClick={() => setActiveIpdTab('beds')}
              className={`px-4 py-2 text-xs font-sans font-semibold rounded-xl cursor-pointer ${
                activeIpdTab === 'beds' ? 'bg-blue-600 text-white' : 'text-slate-400 hover:bg-slate-50'
              }`}
            >
              Bed Census Map
            </button>
            <button 
              id="btn-tab-admissions"
              onClick={() => setActiveIpdTab('admissions')}
              className={`px-4 py-2 text-xs font-sans font-semibold rounded-xl cursor-pointer ${
                activeIpdTab === 'admissions' ? 'bg-blue-600 text-white' : 'text-slate-400 hover:bg-slate-50'
              }`}
            >
              IPD Admissions
            </button>
          </div>
        </div>

        {/* vacant beds widget */}
        <div className="bg-white border border-slate-100 rounded-2xl p-4 flex items-center justify-between text-xs font-sans">
          <div>
            <span className="text-slate-400 font-semibold uppercase">Vacant Beds</span>
            <h4 className="font-display font-bold text-lg text-emerald-600 mt-1">{vacantBeds.length} units</h4>
          </div>
          <div className="w-10 h-10 rounded-lg bg-emerald-50 text-emerald-600 flex items-center justify-center">
            <BedDouble className="w-5 h-5" />
          </div>
        </div>

        <div className="bg-white border border-slate-100 rounded-2xl p-4 flex items-center justify-between text-xs font-sans">
          <div>
            <span className="text-slate-400 font-semibold uppercase">Occupied Beds</span>
            <h4 className="font-display font-bold text-lg text-slate-800 mt-1">{occupiedBedsCount} units</h4>
          </div>
          <div className="w-10 h-10 rounded-lg bg-blue-50 text-blue-600 flex items-center justify-center">
            <Users className="w-5 h-5" />
          </div>
        </div>

        <button 
          id="btn-admit-patient-open"
          onClick={handleOpenAdmit}
          className="bg-blue-600 hover:bg-blue-700 active-bounce cursor-pointer text-white font-sans text-xs font-semibold rounded-2xl flex items-center justify-center gap-2 shadow-sm shrink-0 cursor-pointer p-4 h-full"
        >
          <PlusCircle className="w-5 h-5" />
          <span>Admit Patient to Ward</span>
        </button>
      </div>

      {/* CONTEXT TAB 1: BED CENSUS VIEW */}
      {activeIpdTab === 'beds' ? (
        <div id="bed-census-panel" className="bg-white/90 backdrop-blur-xs border border-slate-100/70 rounded-2xl shadow-sm hover:shadow-md hover:border-slate-200/50 transition-all duration-300 p-6 space-y-4">
          <h3 className="font-display font-medium text-slate-800 text-sm">Bed Occupant Allocation Grid</h3>
          <div className="grid grid-cols-1 md:grid-cols-3 xl:grid-cols-4 gap-4">
            {beds.map((b) => (
              <div 
                key={b.id} 
                id={`bed-card-${b.id}`} 
                className={`border border-slate-100 rounded-xl p-4 flex flex-col justify-between font-sans text-xs h-32 tracking-wide ${
                  b.status === 'Occupied' ? 'bg-blue-50/25 border-blue-100' :
                  b.status === 'Maintenance' ? 'bg-rose-50/20 border-rose-100' :
                  'bg-white'
                }`}
              >
                <div>
                  <div className="flex items-center justify-between">
                    <span className="font-mono text-[10px] text-slate-400 tracking-wider">ROOM: {b.bedNumber}</span>
                    <span className={`px-2 py-0.5 rounded font-mono text-[9px] font-bold ${
                      b.status === 'Vacant' ? 'bg-emerald-100 text-emerald-800' :
                      b.status === 'Occupied' ? 'bg-blue-600 text-white shadow-xs' :
                      'bg-rose-100 text-rose-800'
                    }`}>
                      {b.status}
                    </span>
                  </div>
                  <h4 className="font-semibold text-slate-700 text-[11px] mt-2">{b.wardName}</h4>
                  <span className="text-[10px] text-slate-400 block mt-1">{b.type} flat rate accommodation</span>
                </div>
                
                {b.status === 'Occupied' && (
                  <span className="text-[10px] text-slate-500 font-semibold truncate uppercase mt-2">
                    PT: {b.patientName}
                  </span>
                )}
              </div>
            ))}
          </div>
        </div>
      ) : (
        /* CONTEXT TAB 2: ACTIVE IPD ADMISSIONS AND NURSING PROGRESS WORKSPACE */
        <div id="ipd-admissions-workspace" className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start lg:h-[calc(100vh-220px)] h-auto">
          {/* Left panel: Active inpatient Admissions */}
          <div className="lg:col-span-5 bg-white/90 backdrop-blur-xs border border-slate-100/70 rounded-2xl shadow-sm hover:shadow-md hover:border-slate-200/50 transition-all duration-300 flex flex-col lg:h-full min-h-[400px] h-[450px] overflow-hidden">
            <h4 className="font-display font-medium text-slate-800 text-xs p-4 border-b border-slate-100 uppercase tracking-wider">Active Inpatient Ward Registrations</h4>
            <div className="flex-1 overflow-y-auto divide-y divide-slate-100 custom-scrollbar">
              {admissions.length === 0 ? (
                <p className="text-slate-400 text-xs py-10 text-center">No inpatient logs active.</p>
              ) : (
                admissions.map(adm => {
                  const isActive = selectedAdmission?.id === adm.id;
                  return (
                    <div 
                      key={adm.id}
                      id={`adm-item-${adm.id}`}
                      onClick={() => handleSelectAdmission(adm)}
                      className={`p-4 cursor-pointer flex justify-between items-center transition-all ${
                        isActive ? 'bg-slate-50 border-l-4 border-blue-600' : 'hover:bg-slate-50/40'
                      }`}
                    >
                      <div className="space-y-1">
                        <span className="font-sans font-semibold text-xs text-slate-700 block">{adm.patientName}</span>
                        <div className="flex items-center gap-2 font-mono text-[9px] text-slate-400 font-medium font-medium">
                          <span className="text-blue-600 font-bold">{adm.patientMRN}</span>
                          <span>•</span>
                          <span>{adm.wardName} (Bed: {adm.bedNumber})</span>
                        </div>
                      </div>
                      <span className={`px-2 py-0.5 text-[9px] rounded font-semibold font-mono uppercase ${
                        adm.status === 'Admitted' ? 'bg-blue-50 text-blue-600 border border-blue-100' : 'bg-slate-100 text-slate-400'
                      }`}>
                        {adm.status}
                      </span>
                    </div>
                  );
                })
              )}
            </div>
          </div>

          {/* Right panel: Ward nurse charts details & Doctor remarks */}
          <div className="lg:col-span-7 bg-white/90 backdrop-blur-xs border border-slate-100/70 rounded-2xl shadow-sm hover:shadow-md hover:border-slate-200/50 transition-all duration-300 p-6 lg:h-full h-auto overflow-y-auto custom-scrollbar">
            {!selectedAdmission ? (
              <div className="h-full flex flex-col items-center justify-center text-center py-20 text-slate-400 space-y-3">
                <Clipboard className="w-12 h-12 text-slate-200 stroke-[1.5]" />
                <div>
                  <p className="font-sans text-xs font-medium">Select an inpatient admitting clinical record</p>
                  <p className="font-sans text-[10px] text-slate-400">to log Ward Nursing notes, BED charts, and organize Patient Discharge sums</p>
                </div>
              </div>
            ) : (
              <div className="space-y-6 text-xs font-sans">
                {/* Header row details */}
                <div className="flex items-center justify-between border-b border-slate-100 pb-4">
                  <div>
                    <h3 className="font-display font-semibold text-slate-800 text-sm">{selectedAdmission.patientName}</h3>
                    <span className="font-mono text-[10px] text-blue-600 font-bold">{selectedAdmission.patientMRN}</span>
                    <span className="font-mono text-slate-400 text-[10px] block mt-1">Bed Assigned: {selectedAdmission.wardName} - Unit {selectedAdmission.bedNumber}</span>
                  </div>
                  
                  {selectedAdmission.status === 'Admitted' && (
                    <button 
                      id="btn-discharge-open"
                      onClick={() => {
                        setDiagnosis('');
                        setTreatmentSummary('');
                        setDischargeInstructions('');
                        setShowDischargeModal(true);
                      }}
                      className="px-4 py-2 bg-rose-600 hover:bg-rose-700 active-bounce cursor-pointer text-white font-sans text-xs font-medium rounded-xl cursor-pointer shadow-sm transition"
                    >
                      Discharge Patient
                    </button>
                  )}
                </div>

                <div className="grid grid-cols-2 gap-4">
                  {/* Left: Ward Nurse Clinical notes ledger */}
                  <div className="space-y-3">
                    <span className="text-[10px] font-mono font-bold text-blue-600 uppercase tracking-wider block">Nursing Observation Chart</span>
                    <div className="flex gap-2">
                      <input 
                        id="txt-nurse-note"
                        type="text" 
                        value={nurseNoteText} 
                        onChange={e => setNurseNoteText(e.target.value)} 
                        className="flex-1 p-2 border border-slate-200 rounded-lg text-xs" 
                        placeholder="Log vital signs stability, IV drip, fluids..." 
                      />
                      <button 
                        id="btn-save-nurse-note"
                        onClick={handleAddNurseNote} 
                        className="px-3 bg-slate-800 hover:bg-slate-900 text-white rounded-lg cursor-pointer"
                      >
                        Add
                      </button>
                    </div>

                    <div className="bg-slate-50/50 p-3 rounded-xl border border-slate-100 max-h-48 overflow-y-auto custom-scrollbar space-y-2">
                      {selectedAdmission.nursingNotes.length === 0 ? (
                        <p className="text-slate-400 text-[11px] text-center py-4">No nursing charts notes on file.</p>
                      ) : (
                        selectedAdmission.nursingNotes.map((n) => (
                          <div key={n.id} className="p-2 bg-white rounded-lg border border-slate-100 text-[11px]">
                            <p className="text-slate-600 font-light">{n.text}</p>
                            <div className="flex items-center justify-between text-[9px] font-mono text-slate-400 mt-1">
                              <strong>RN: {n.nurseName}</strong>
                              <span>{new Date(n.date).toLocaleTimeString()}</span>
                            </div>
                          </div>
                        ))
                      )}
                    </div>
                  </div>

                  {/* Right: Doctor bedside clinical progress notes */}
                  <div className="space-y-3">
                    <span className="text-[10px] font-mono font-bold text-blue-600 uppercase tracking-wider block">Physicians Bedside Progress</span>
                    <div className="flex gap-2">
                      <input 
                        id="txt-progress-note"
                        type="text" 
                        value={progressNoteText} 
                        onChange={e => setProgressNoteText(e.target.value)} 
                        className="flex-1 p-2 border border-slate-200 rounded-lg text-xs" 
                        placeholder="Daily progress note, therapy revision..." 
                      />
                      <button 
                        id="btn-save-progress-note"
                        onClick={handleAddProgressNote} 
                        className="px-3 bg-slate-800 hover:bg-slate-900 text-white rounded-lg cursor-pointer"
                      >
                        Add
                      </button>
                    </div>

                    <div className="bg-slate-50/50 p-3 rounded-xl border border-slate-100 max-h-48 overflow-y-auto custom-scrollbar space-y-2">
                      {selectedAdmission.progressNotes.length === 0 ? (
                        <p className="text-slate-400 text-[11px] text-center py-4">No bedside progress notes on file.</p>
                      ) : (
                        selectedAdmission.progressNotes.map((p) => (
                          <div key={p.id} className="p-2 bg-white rounded-lg border border-slate-100 text-[11px]">
                            <p className="text-slate-600 font-light">{p.text}</p>
                            <div className="flex items-center justify-between text-[9px] font-mono text-slate-400 mt-1">
                              <strong>MD: {p.staffName}</strong>
                              <span>{new Date(p.date).toLocaleTimeString()}</span>
                            </div>
                          </div>
                        ))
                      )}
                    </div>
                  </div>
                </div>

                {/* Patient Discharge Summary display */}
                {selectedAdmission.status === 'Discharged' && selectedAdmission.dischargeSummary && (
                  <div className="border-t border-slate-100 pt-4 space-y-3">
                    <div className="flex items-center gap-2">
                      <FileCheck2 className="w-5 h-5 text-emerald-600" />
                      <span className="font-display font-semibold text-slate-800 text-xs">Patient Discharge Case Summary (Closed)</span>
                    </div>
                    <div className="p-4 bg-emerald-50/30 rounded-xl border border-emerald-100 grid grid-cols-2 gap-4 text-xs">
                      <div>
                        <strong className="text-slate-500 block uppercase text-[10px]">Diagnosed clinical condition:</strong>
                        <p className="text-slate-700 italic mt-0.5">{selectedAdmission.dischargeSummary.diagnosis}</p>
                      </div>
                      <div>
                        <strong className="text-slate-500 block uppercase text-[10px]">Follow up clinical date:</strong>
                        <p className="text-slate-700 font-mono mt-0.5">{selectedAdmission.dischargeSummary.followUpDate || 'None set'}</p>
                      </div>
                      <div className="col-span-2">
                        <strong className="text-slate-500 block uppercase text-[10px]">Therapeutic treatment description:</strong>
                        <p className="text-slate-600 mt-0.5">{selectedAdmission.dischargeSummary.treatmentSummary}</p>
                      </div>
                      <div className="col-span-2">
                        <strong className="text-slate-500 block uppercase text-[10px]">Home instructions:</strong>
                        <p className="text-slate-600 mt-0.5">{selectedAdmission.dischargeSummary.dischargeInstructions}</p>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      )}

      {/* WARD ADMISSION POPUP PANEL */}
      {showAdmitModal && vacantBeds.length > 0 && (
        <div id="ward-admit-modal" className="fixed inset-0 bg-slate-900/60 z-50 flex items-center justify-center p-4 backdrop-blur-2xs">
          <div className="bg-white rounded-2xl w-full max-w-sm shadow-xl overflow-hidden animate-scale-up">
            <div className="px-6 py-4 bg-blue-600 border-b border-blue-700 flex items-center justify-between text-white">
              <h3 className="font-display font-medium text-sm">Admit Patient to Ward</h3>
              <button onClick={() => setShowAdmitModal(false)} className="text-blue-200 hover:text-white cursor-pointer"><X className="w-5 h-5" /></button>
            </div>
            <form onSubmit={submitAdmission} className="p-6 space-y-4 text-xs font-sans text-xs">
              
              {/* Select Patient */}
              <div className="space-y-1">
                <label className="text-slate-500 font-semibold">Select Patient Demographic (MRN) *</label>
                <select 
                  required
                  id="ddl-admit-patient"
                  value={admitPatId} 
                  onChange={e => setAdmitPatId(e.target.value)} 
                  className="w-full text-xs p-2.5 bg-white border border-slate-200 rounded-lg focus:outline-none"
                >
                  <option value="">-- Choose Patient --</option>
                  {patients.filter(p => !p.isArchived).map(p => (
                    <option key={p.id} value={p.id}>{p.name} ({p.id})</option>
                  ))}
                </select>
              </div>

              {/* Select Bed Vacant */}
              <div className="space-y-1">
                <label className="text-slate-500 font-semibold">Assign Bed Unit *</label>
                <select 
                  required
                  id="ddl-admit-bed"
                  value={admitBedId} 
                  onChange={e => setAdmitBedId(e.target.value)} 
                  className="w-full text-xs p-2.5 bg-white border border-slate-200 rounded-lg focus:outline-none"
                >
                  {vacantBeds.map(b => (
                    <option key={b.id} value={b.id}>{b.wardName} - bed {b.bedNumber} ({b.type})</option>
                  ))}
                </select>
              </div>

              <div className="flex items-center justify-end gap-3 pt-4 border-t border-slate-100">
                <button type="button" onClick={() => setShowAdmitModal(false)} className="px-4 py-2 text-slate-400 hover:text-slate-600">Cancel</button>
                <button type="submit" className="px-4 py-2 bg-blue-600 hover:bg-blue-700 active-bounce cursor-pointer text-white rounded-lg shadow-sm">Post Ward Admission</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* DISCHARGE SUMMARIZATION POPUP PANEL */}
      {showDischargeModal && selectedAdmission && (
        <div id="patient-discharge-modal" className="fixed inset-0 bg-slate-900/60 z-50 flex items-center justify-center p-4 backdrop-blur-2xs">
          <div className="bg-white rounded-2xl w-full max-w-md shadow-xl overflow-hidden animate-scale-up">
            <div className="px-6 py-4 bg-blue-600 border-b border-blue-700 flex items-center justify-between text-white">
              <h3 className="font-display font-medium text-sm">Patient Discharge Summary & Settlement</h3>
              <button onClick={() => setShowDischargeModal(false)} className="text-blue-200 hover:text-white cursor-pointer"><X className="w-5 h-5" /></button>
            </div>
            <form onSubmit={submitDischarge} className="p-6 space-y-4 text-xs font-sans text-xs">
              
              <div className="space-y-1">
                <label className="text-slate-500 font-semibold">Diagnosed Discharge Condition *</label>
                <input 
                  required
                  id="txt-dis-diagnosis"
                  type="text" 
                  value={diagnosis} 
                  onChange={e => setDiagnosis(e.target.value)} 
                  className="w-full p-2.5 border border-slate-200 rounded-lg" 
                  placeholder="e.g. Cardiorespiratory stability achieved"
                />
              </div>

              <div className="space-y-1">
                <label className="text-slate-500 font-semibold">Therapeutic Operations / Treatment Summary *</label>
                <textarea 
                  required
                  id="txt-dis-summary"
                  value={treatmentSummary} 
                  onChange={e => setTreatmentSummary(e.target.value)} 
                  className="w-full p-2.5 border border-slate-200 rounded-lg h-20 resize-none" 
                  placeholder="e.g. Conducted ECG surveillance, medication hydration monitoring, rest therapies..."
                />
              </div>

              <div className="space-y-1">
                <label className="text-slate-500 font-semibold">Home recovery Instructions *</label>
                <textarea 
                  required
                  id="txt-dis-instructions"
                  value={dischargeInstructions} 
                  onChange={e => setDischargeInstructions(e.target.value)} 
                  className="w-full p-2.5 border border-slate-200 rounded-lg h-20 resize-none" 
                  placeholder="e.g. Rest, take paracetamol 500mg daily if headaches occur. Fluid hydration daily."
                />
              </div>

              <div className="space-y-1">
                <label className="text-slate-500 font-semibold">Follow up clinical date</label>
                <input 
                  id="txt-dis-followup"
                  type="date" 
                  value={followUpDate} 
                  onChange={e => setFollowUpDate(e.target.value)} 
                  className="w-full p-2.5 border border-slate-200 rounded-lg" 
                />
              </div>

              {/* automatic bed computations flat calculations advisory */}
              <div className="bg-slate-50 p-3 rounded-lg border border-slate-100 flex items-center gap-2 font-mono text-[10px] text-slate-400">
                <FileCheck2 className="w-4 h-4 text-slate-400 shrink-0" />
                <span>Saving automatically computes Flat Ward Bed Daily expenses, posts final settlement invoice, and vacates bed atomically.</span>
              </div>

              <div className="flex items-center justify-end gap-3 pt-4 border-t border-slate-100">
                <button type="button" onClick={() => setShowDischargeModal(false)} className="px-4 py-2 text-slate-400">Cancel</button>
                <button type="submit" id="btn-save-discharge" className="px-5 py-2 bg-rose-600 hover:bg-rose-700 active-bounce cursor-pointer text-white rounded-lg shadow-sm font-medium">Verify Discharge</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

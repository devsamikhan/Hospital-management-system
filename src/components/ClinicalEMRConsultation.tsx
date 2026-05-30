/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import { 
  FileText, 
  Search, 
  User, 
  Activity, 
  History, 
  Plus, 
  Trash2, 
  Pill, 
  FlaskConical, 
  Save, 
  UserCheck, 
  Clipboard, 
  VolumeX,
  PlusCircle,
  FileCheck2,
  CalendarCheck2,
  X
} from 'lucide-react';
import { useHospital } from '../context/HospitalContext';
import { Patient, Encounter, InventoryItem } from '../types';

export default function ClinicalEMRConsultation() {
  const { 
    patients, 
    inventory, 
    createEncounter, 
    getPatientEncounters, 
    appointments, 
    updateAppointment, 
    setError 
  } = useHospital();

  const [searchPat, setSearchPat] = useState('');
  const [selectedPat, setSelectedPat] = useState<Patient | null>(null);
  const [patHistory, setPatHistory] = useState<Encounter[]>([]);
  const [isOpeningEncounter, setIsOpeningEncounter] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Encounter Form Variables
  const [bp, setBp] = useState('120/80');
  const [heartRate, setHeartRate] = useState<number>(75);
  const [temp, setTemp] = useState<number>(36.8);
  const [weight, setWeight] = useState<number>(70);
  const [respRate, setRespRate] = useState<number>(16);
  const [spo2, setSpo2] = useState<number>(98);

  const [soapS, setSoapS] = useState('');
  const [soapO, setSoapO] = useState('');
  const [soapA, setSoapA] = useState('');
  const [soapP, setSoapP] = useState('');

  // Prescriptions list state
  const [activePrescriptions, setActivePrescriptions] = useState<{
    medicineId: string;
    name: string;
    dosage: string;
    frequency: string;
    duration: string;
    notes?: string;
  }[]>([]);

  // Drug selector item
  const [addMedId, setAddMedId] = useState('');
  const [addQtyDosage, setAddQtyDosage] = useState('500mg');
  const [addFrequency, setAddFrequency] = useState('Once Daily');
  const [addDuration, setAddDuration] = useState('7 Days');
  const [addRxNotes, setAddRxNotes] = useState('');

  // Lab orders selection list
  const [activeLabOrders, setActiveLabOrders] = useState<{
    testName: string;
    category: string;
  }[]>([]);
  
  const [addLabName, setAddLabName] = useState('Full Blood Count & CRP');
  const [addLabCat, setAddLabCat] = useState<'Hematology' | 'Biochemistry' | 'Microbiology' | 'Radiology' | 'Other'>('Hematology');

  // Load patient clinical logs
  const handleSelectPatient = async (p: Patient) => {
    setSelectedPat(p);
    const logs = await getPatientEncounters(p.id);
    setPatHistory(logs);
    setIsOpeningEncounter(false);
  };

  const filteredPats = patients.filter(p => 
    !p.isArchived && (
      p.name.toLowerCase().includes(searchPat.toLowerCase()) || 
      p.id.toLowerCase().includes(searchPat.toLowerCase())
    )
  );

  const appendPrescriptionItem = () => {
    if (!addMedId) {
      setError("Please select a drug item from the formulary.");
      return;
    }
    const drug = inventory.find(i => i.id === addMedId);
    if (!drug) return;

    setActivePrescriptions([
      ...activePrescriptions,
      {
        medicineId: addMedId,
        name: drug.name,
        dosage: addQtyDosage,
        frequency: addFrequency,
        duration: addDuration,
        notes: addRxNotes
      }
    ]);

    // reset fields
    setAddMedId('');
    setAddQtyDosage('500mg');
    setAddRxNotes('');
  };

  const removePrescriptionItem = (index: number) => {
    setActivePrescriptions(activePrescriptions.filter((_, idx) => idx !== index));
  };

  const appendLabOrderItem = () => {
    if (!addLabName) return;
    setActiveLabOrders([
      ...activeLabOrders,
      { testName: addLabName, category: addLabCat }
    ]);
  };

  const removeLabOrderItem = (index: number) => {
    setActiveLabOrders(activeLabOrders.filter((_, idx) => idx !== index));
  };

  const handleSaveEMREncounter = async () => {
    if (!selectedPat) return;
    if (!soapS || !soapO || !soapA || !soapP) {
      setError("Clinical notes fields: Subjective, Objective, Assessment, and Plan notes are all mandatory.");
      return;
    }

    setIsSubmitting(true);

    const success = await createEncounter({
      patientId: selectedPat.id,
      vitals: {
        bp,
        heartRate: Number(heartRate),
        temperature: Number(temp),
        weight: Number(weight),
        respiratoryRate: Number(respRate),
        spo2: Number(spo2)
      },
      soap: {
        s: soapS,
        o: soapO,
        a: soapA,
        p: soapP
      },
      prescriptions: activePrescriptions,
      labOrders: activeLabOrders
    });

    setIsSubmitting(false);
    if (success) {
      // Find and complete isScheduled appts for this patient
      const todayApts = appointments.filter(a => a.patientId === selectedPat.id && a.status === 'Scheduled');
      if (todayApts.length > 0) {
        // Automatically close appointment!
        await updateAppointment(todayApts[0].id, { status: 'Completed' });
      }

      // Refresh patient listing logs
      const updatedHistory = await getPatientEncounters(selectedPat.id);
      setPatHistory(updatedHistory);
      setIsOpeningEncounter(false);

      // clean SOAP forms
      setSoapS('');
      setSoapO('');
      setSoapA('');
      setSoapP('');
      setActivePrescriptions([]);
      setActiveLabOrders([]);
    }
  };

  const listLabTestCatalog = [
    { name: "Full Blood Count & CRP", cat: "Hematology" },
    { name: "Lipid Profile Basic", cat: "Biochemistry" },
    { name: "Liver Function Test (LFT)", cat: "Biochemistry" },
    { name: "Renal Function Test (RFT)", cat: "Biochemistry" },
    { name: "HBA1C Testing", cat: "Biochemistry" },
    { name: "Chest X-Ray Digital", cat: "Radiology" },
    { name: "CT Slice Scan Abdomen", cat: "Radiology" },
    { name: "Brain Magnetic MRI Scan", cat: "Radiology" },
    { name: "Sputum Culture & Gram Stain", cat: "Microbiology" }
  ];

  return (
    <div id="hms-emr-workspace" className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start lg:h-[calc(100vh-140px)] h-auto">
      {/* Search Patient select menu Column */}
      <div id="emr-patient-search" className="lg:col-span-4 bg-white/90 backdrop-blur-xs border border-slate-100/70 rounded-2xl shadow-sm hover:shadow-md hover:border-slate-200/50 transition-all duration-300 flex flex-col lg:h-full min-h-[400px] h-[450px] overflow-hidden">
        <div className="p-4 border-b border-slate-100 flex items-center gap-2">
          <FileText className="w-5 h-5 text-blue-600" />
          <h3 className="font-display font-medium text-sm text-slate-800">EMR Clinical Consulting</h3>
        </div>

        {/* Searching text box */}
        <div className="p-3 bg-slate-50/50 border-b border-slate-100">
          <div className="relative">
            <Search className="absolute left-3 top-2.5 w-4 h-4 text-slate-400" />
            <input 
              id="txt-emr-pat-search"
              type="text" 
              placeholder="Search active patient..." 
              value={searchPat}
              onChange={(e) => setSearchPat(e.target.value)}
              className="w-full pl-9 pr-4 py-2 border border-slate-200 focus:outline-none focus:ring-1 focus:ring-blue-500 rounded-xl text-xs font-sans"
            />
          </div>
        </div>

        {/* Scroll list */}
        <div className="flex-1 overflow-y-auto divide-y divide-slate-100 custom-scrollbar">
          {filteredPats.length === 0 ? (
            <p className="text-slate-400 text-xs py-10 text-center">No patients found.</p>
          ) : (
            filteredPats.map(p => (
              <div 
                key={p.id}
                id={`emr-pat-item-${p.id}`}
                onClick={() => handleSelectPatient(p)}
                className={`p-4 cursor-pointer transition-all ${
                  selectedPat?.id === p.id 
                    ? 'bg-slate-50 border-l-4 border-blue-600' 
                    : 'hover:bg-slate-50/50'
                }`}
              >
                <div className="space-y-1">
                  <span className="font-sans font-semibold text-xs text-slate-700 block">{p.name}</span>
                  <div className="flex items-center gap-2 font-mono text-[9px] text-slate-400">
                    <span className="font-bold text-blue-600">{p.id}</span>
                    <span>Gender: {p.gender}</span>
                    <span>Blood: {p.bloodGroup}</span>
                  </div>
                </div>
              </div>
            ))
          )}
        </div>
      </div>

      {/* Clinical records sheet workspace */}
      <div id="emr-active-sheet" className="lg:col-span-8 bg-white/90 backdrop-blur-xs border border-slate-100/70 rounded-2xl shadow-sm hover:shadow-md hover:border-slate-200/50 transition-all duration-300 lg:h-full h-auto overflow-y-auto custom-scrollbar p-6">
        {!selectedPat ? (
          <div className="h-full flex flex-col items-center justify-center text-center py-20 text-slate-400 space-y-3">
            <Clipboard className="w-12 h-12 text-slate-200 stroke-[1.5]" />
            <div>
              <p className="font-sans text-xs font-medium">Open a patient's medical record</p>
              <p className="font-sans text-[10px] text-slate-400">to record vital diagnostics and compile SOAP notes</p>
            </div>
          </div>
        ) : (
          <div className="space-y-6">
            {/* Header profile row */}
            <div className="flex flex-col md:flex-row md:items-center justify-between border-b border-slate-100 pb-4 gap-3">
              <div>
                <h3 className="font-display text-sm font-semibold text-slate-800">{selectedPat.name}</h3>
                <div className="flex items-center gap-2 mt-1">
                  <span className="font-mono text-[10px] text-blue-600 font-bold uppercase">{selectedPat.id}</span>
                  <span className="text-slate-300">•</span>
                  <span className="text-slate-400 text-xs font-sans">DOB: {selectedPat.dob}</span>
                  <span className="text-slate-300">•</span>
                  <span className="text-rose-600 font-semibold text-xs font-sans flex items-center gap-1"><Activity className="w-3.5 h-3.5" /> Blood {selectedPat.bloodGroup}</span>
                </div>
              </div>
              
              {!isOpeningEncounter ? (
                <button 
                  id="btn-open-encounter"
                  onClick={() => setIsOpeningEncounter(true)}
                  className="flex items-center justify-center gap-1.5 px-4 py-2 bg-blue-600 hover:bg-blue-700 active-bounce cursor-pointer text-white text-xs font-sans font-semibold rounded-xl shadow-sm cursor-pointer transition-all"
                >
                  <PlusCircle className="w-4 h-4" />
                  <span>Start New SOAP Encounter</span>
                </button>
              ) : (
                <button 
                  id="btn-cancel-encounter"
                  onClick={() => setIsOpeningEncounter(false)}
                  className="flex items-center justify-center gap-1.5 px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-600 text-xs font-sans font-medium rounded-xl cursor-pointer transition-all"
                >
                  <span>Close Workspace</span>
                </button>
              )}
            </div>

            {/* IF NO ACTIVE ACTIVE CLINICAL ENCOUNTER FORM OPEN: SHOW PREVIOUS HISTORY */}
            {!isOpeningEncounter ? (
              <div className="space-y-4">
                <div className="flex items-center gap-2 text-slate-700 font-sans font-semibold text-xs mb-2">
                  <History className="w-4 h-4 text-teal-600" />
                  <span>Interactive Histology Timeline ({patHistory.length} Encounters)</span>
                </div>

                {patHistory.length === 0 ? (
                  <p className="text-slate-400 font-sans text-xs text-center py-10 bg-slate-50/55 rounded-xl border border-dashed border-slate-200">
                    No clinical logs recorded. Click "Start New SOAP Encounter" to document consultation.
                  </p>
                ) : (
                  <div className="space-y-4">
                    {patHistory.map((enc) => (
                      <div key={enc.id} className="border border-slate-100 rounded-xl p-5 bg-white space-y-4 shadow-xs">
                        <div className="flex items-center justify-between border-b border-slate-50 pb-2">
                          <div className="flex items-center gap-2">
                            <FileCheck2 className="w-4 h-4 text-emerald-600" />
                            <span className="font-sans font-semibold text-slate-700 text-xs">Physician SOAP Consultation Encounter</span>
                          </div>
                          <span className="font-mono text-[9px] text-slate-400 font-bold bg-slate-100 px-2 py-0.5 rounded">
                            {new Date(enc.date).toLocaleString()}
                          </span>
                        </div>

                        {/* Vital parameters */}
                        <div className="grid grid-cols-2 md:grid-cols-6 gap-3 py-3 bg-slate-50 border border-slate-100 rounded-xl px-4 text-center font-mono text-[10px] text-slate-600">
                          <div>
                            <span className="text-slate-400 block font-sans">BP</span>
                            <strong className="text-slate-800 text-xs">{enc.vitals.bp}</strong>
                          </div>
                          <div>
                            <span className="text-slate-400 block font-sans">Pulse rate</span>
                            <strong className="text-slate-800 text-xs">{enc.vitals.heartRate} bpm</strong>
                          </div>
                          <div>
                            <span className="text-slate-400 block font-sans">Body Temp</span>
                            <strong className="text-slate-800 text-xs">{enc.vitals.temperature}°C</strong>
                          </div>
                          <div>
                            <span className="text-slate-400 block font-sans">Weight</span>
                            <strong className="text-slate-800 text-xs">{enc.vitals.weight} kg</strong>
                          </div>
                          <div>
                            <span className="text-slate-400 block font-sans">Resp min</span>
                            <strong className="text-slate-800 text-xs">{enc.vitals.respiratoryRate || '--'} bpm</strong>
                          </div>
                          <div>
                            <span className="text-slate-400 block font-sans">Oxygen SpO2</span>
                            <strong className="text-slate-800 text-xs">{enc.vitals.spo2 || '--'}%</strong>
                          </div>
                        </div>

                        {/* Clinical notes sections */}
                        <div className="space-y-3 font-sans text-xs text-slate-600 leading-relaxed md:grid md:grid-cols-2 md:gap-6 md:space-y-0">
                          <div className="p-3 bg-blue-50/20 border border-blue-50/80 rounded-lg space-y-1">
                            <span className="font-mono font-bold text-[10px] text-blue-600">[S] SUBJECTIVE REPORTS:</span>
                            <p className="font-light italic">{enc.soap.s}</p>
                          </div>
                          <div className="p-3 bg-blue-50/20 border border-blue-50/80 rounded-lg space-y-1">
                            <span className="font-mono font-bold text-[10px] text-blue-600">[O] OBJECTIVE FINDINGS:</span>
                            <p className="font-light italic">{enc.soap.o}</p>
                          </div>
                          <div className="p-3 bg-blue-50/20 border border-blue-50/80 rounded-lg space-y-1">
                            <span className="font-mono font-bold text-[10px] text-blue-600">[A] CLINICAL ASSESSMENT:</span>
                            <p className="font-semibold text-slate-800">{enc.soap.a}</p>
                          </div>
                          <div className="p-3 bg-blue-50/20 border border-blue-50/80 rounded-lg space-y-1 font-sans">
                            <span className="font-mono font-bold text-[10px] text-blue-600">[P] PROPOSED CARE PLAN:</span>
                            <p className="text-slate-700">{enc.soap.p}</p>
                          </div>
                        </div>

                        {/* Prescribed Pharmaceutics */}
                        {enc.prescriptions && enc.prescriptions.length > 0 && (
                          <div className="border-t border-slate-100 pt-3 space-y-2">
                            <span className="text-[10px] font-mono font-bold text-slate-400 uppercase tracking-wider">Dispensed Medicines (E-Prescriptions):</span>
                            <div className="space-y-1">
                              {enc.prescriptions.map((rx, idx) => (
                                <div key={idx} className="flex items-center justify-between p-2 bg-indigo-50/30 font-sans border border-indigo-100/30 rounded text-[11px] text-slate-700">
                                  <span><strong className="text-slate-800">{rx.name} ({rx.dosage})</strong> — {rx.frequency} [{rx.duration}]</span>
                                  <span className={`px-2 py-0.5 font-mono font-bold text-[9px] rounded ${
                                    rx.dispensed ? 'bg-emerald-100 text-emerald-800' : 'bg-amber-100 text-amber-700'
                                  }`}>
                                    {rx.dispensed ? 'Dispensed' : 'Prescribed'}
                                  </span>
                                </div>
                              ))}
                            </div>
                          </div>
                        )}

                        {/* Laboratory logs ordered */}
                        {enc.labOrders && enc.labOrders.length > 0 && (
                          <div className="border-t border-slate-100 pt-3 space-y-2">
                            <span className="text-[10px] font-mono font-bold text-slate-400 uppercase tracking-wider">Ordered Lab Diagnostics:</span>
                            <div className="flex flex-wrap gap-2">
                              {enc.labOrders.map((ord, idx) => (
                                <span key={idx} className="px-2.5 py-1 bg-sky-50 text-sky-700 font-sans border border-sky-100/60 text-[10px] rounded font-medium">
                                  {ord.testName}
                                </span>
                              ))}
                            </div>
                          </div>
                        )}

                        <div className="border-t border-slate-50 pt-2 text-[10px] text-slate-400 font-mono text-right capitalize">
                          Treating Physician: {enc.doctorName || "Licenced Practitioner"}
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            ) : (
              /* ACTIVE CLINICAL FORM WORKSPACE */
              <div id="emr-encounter-active-workspace" className="space-y-6 animate-fade-in">
                
                {/* 1. Vital Signs block */}
                <div className="space-y-3">
                  <span className="text-[10px] font-mono font-bold text-blue-600 block uppercase tracking-wider">1. Vital signs parameters</span>
                  <div className="grid grid-cols-2 md:grid-cols-6 gap-3 text-xs font-sans">
                    <div className="space-y-1">
                      <label className="text-slate-400 font-medium">Blood Pressure *</label>
                      <input type="text" value={bp} onChange={e => setBp(e.target.value)} className="w-full p-2 border border-slate-200 rounded-lg text-center font-mono font-bold focus:ring-1 focus:ring-blue-500" placeholder="120/80" />
                    </div>
                    <div className="space-y-1">
                      <label className="text-slate-400 font-medium">Heart Rate *</label>
                      <input type="number" value={heartRate} onChange={e => setHeartRate(Number(e.target.value))} className="w-full p-2 border border-slate-200 rounded-lg text-center" />
                    </div>
                    <div className="space-y-1">
                      <label className="text-slate-400 font-medium">Temp (°C) *</label>
                      <input type="number" step="0.1" value={temp} onChange={e => setTemp(Number(e.target.value))} className="w-full p-2 border border-slate-200 rounded-lg text-center" />
                    </div>
                    <div className="space-y-1">
                      <label className="text-slate-400 font-medium">Weight (kg) *</label>
                      <input type="number" value={weight} onChange={e => setWeight(Number(e.target.value))} className="w-full p-2 border border-slate-200 rounded-lg text-center" />
                    </div>
                    <div className="space-y-1">
                      <label className="text-slate-400 font-medium font-medium">Resp (bpm)</label>
                      <input type="number" value={respRate} onChange={e => setRespRate(Number(e.target.value))} className="w-full p-2 border border-slate-200 rounded-lg text-center" />
                    </div>
                    <div className="space-y-1">
                      <label className="text-slate-400 font-medium">SpO2 (%)</label>
                      <input type="number" value={spo2} onChange={e => setSpo2(Number(e.target.value))} className="w-full p-2 border border-slate-200 rounded-lg text-center" />
                    </div>
                  </div>
                </div>

                {/* 2. SOAP clinical notes block */}
                <div className="space-y-3">
                  <span className="text-[10px] font-mono font-bold text-blue-600 block uppercase tracking-wider">2. SOAP Clinical charting documentation</span>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs font-sans">
                    <div className="space-y-1">
                      <label className="text-slate-500 font-mono font-semibold uppercase">[S] Subjective Symptoms *</label>
                      <textarea required value={soapS} onChange={e => setSoapS(e.target.value)} className="w-full p-3 border border-slate-200 rounded-lg h-24 resize-none focus:outline-none focus:ring-1 focus:ring-blue-500" placeholder="Patient reports mild palpitations, fatigue, dyspnea..." />
                    </div>
                    <div className="space-y-1">
                      <label className="text-slate-500 font-mono font-semibold uppercase">[O] Objective Findings *</label>
                      <textarea required value={soapO} onChange={e => setSoapO(e.target.value)} className="w-full p-3 border border-slate-200 rounded-lg h-24 resize-none focus:outline-none focus:ring-1 focus:ring-blue-500" placeholder="Auscultation clear, regular S1/S2 heart, normal blood pressure..." />
                    </div>
                    <div className="space-y-1">
                      <label className="text-slate-500 font-mono font-semibold uppercase">[A] Diagnosis Assessment *</label>
                      <textarea required value={soapA} onChange={e => setSoapA(e.target.value)} className="w-full p-3 border border-slate-200 rounded-lg h-24 resize-none focus:outline-none focus:ring-1 focus:ring-blue-500" placeholder="Essential arterial hypertension vs idiopathic palpitations..." />
                    </div>
                    <div className="space-y-1">
                      <label className="text-slate-500 font-mono font-semibold uppercase">[P] Care therapies Plan *</label>
                      <textarea required value={soapP} onChange={e => setSoapP(e.target.value)} className="w-full p-3 border border-slate-200 rounded-lg h-24 resize-none focus:outline-none focus:ring-1 focus:ring-blue-500" placeholder="Reccommended cardiology serum lipids panel. Prescribed paracetamol..." />
                    </div>
                  </div>
                </div>

                {/* 3. Drug prescription form */}
                <div className="space-y-3 border-t border-slate-100 pt-4 font-sans text-xs">
                  <span className="text-[10px] font-mono font-bold text-blue-600 block uppercase tracking-wider">3. Pharmaceutical E-Prescriptions formulary mapping</span>
                  <div className="bg-slate-50/50 p-4 border border-slate-100 rounded-xl grid grid-cols-1 md:grid-cols-4 gap-3 items-end">
                    <div className="space-y-1">
                      <label className="text-slate-400 font-semibold">Select Drug *</label>
                      <select value={addMedId} onChange={e => setAddMedId(e.target.value)} className="w-full p-2.5 bg-white border border-slate-200 rounded-lg">
                        <option value="">-- Choose Formulary Item --</option>
                        {inventory.map(i => (
                          <option key={i.id} value={i.id}>{i.name} (Qty Available: {i.stockQuantity})</option>
                        ))}
                      </select>
                    </div>
                    <div className="space-y-1">
                      <label className="text-slate-400 font-semibold">Dosage Quantity</label>
                      <input type="text" value={addQtyDosage} onChange={e => setAddQtyDosage(e.target.value)} className="w-full p-2 bg-white border border-slate-200 rounded-lg" placeholder="500mg, 1 tablet..." />
                    </div>
                    <div className="space-y-1">
                      <label className="text-slate-400 font-semibold">Frequency Dose</label>
                      <select value={addFrequency} onChange={e => setAddFrequency(e.target.value)} className="w-full p-2.5 bg-white border border-slate-200 rounded-lg">
                        <option value="Once Daily">QD (Once Daily)</option>
                        <option value="Twice Daily">BID (Twice Daily)</option>
                        <option value="Three Times a Day">TID (Three Times Daily)</option>
                        <option value="Four Times a Day">QID (Four Times Daily)</option>
                        <option value="As Needed">PRN (As Needed)</option>
                      </select>
                    </div>
                    <button type="button" onClick={appendPrescriptionItem} className="w-full py-2 bg-slate-800 hover:bg-slate-900 text-white rounded-lg font-semibold flex items-center justify-center gap-1.5 cursor-pointer">
                      <Plus className="w-4 h-4" />
                      <span>Prescribe drug</span>
                    </button>
                  </div>

                  {activePrescriptions.length > 0 && (
                    <div className="divide-y divide-slate-100 bg-white border border-slate-100 rounded-xl p-3">
                      {activePrescriptions.map((rx, idx) => (
                        <div key={idx} className="py-2.5 flex items-center justify-between text-xs">
                          <span className="font-semibold text-slate-700">{idx+1}. {rx.name} ({rx.dosage}) — {rx.frequency} [Duration: {rx.duration}]</span>
                          <button type="button" onClick={() => removePrescriptionItem(idx)} className="text-rose-500 hover:bg-rose-50 p-1.5 rounded-lg border border-transparent hover:border-rose-100"><Trash2 className="w-3.5 h-3.5" /></button>
                        </div>
                      ))}
                    </div>
                  )}
                </div>

                {/* 4. Lab diagnostics orders block */}
                <div className="space-y-3 border-t border-slate-100 pt-4 font-sans text-xs">
                  <span className="text-[10px] font-mono font-bold text-blue-600 block uppercase tracking-wider">4. Lab / Radiology diagnostic orders</span>
                  <div className="bg-slate-50/50 p-4 border border-slate-100 rounded-xl flex flex-col md:flex-row items-end gap-3">
                    <div className="space-y-1 flex-1">
                      <label className="text-slate-400 font-semibold">Select Diagnostic Test Order *</label>
                      <select value={addLabName} onChange={e => {
                        setAddLabName(e.target.value);
                        const mappedTest = listLabTestCatalog.find(l => l.name === e.target.value);
                        if (mappedTest) setAddLabCat(mappedTest.cat as any);
                      }} className="w-full p-2.5 bg-white border border-slate-200 rounded-lg">
                        {listLabTestCatalog.map((l, idx) => (
                          <option key={idx} value={l.name}>{l.name} ({l.cat})</option>
                        ))}
                      </select>
                    </div>
                    <button type="button" onClick={appendLabOrderItem} className="px-5 py-2.5 bg-slate-800 hover:bg-slate-900 text-white rounded-lg font-semibold flex items-center justify-center gap-1.5 cursor-pointer self-stretch md:self-auto">
                      <Plus className="w-4 h-4" />
                      <span>Order Test</span>
                    </button>
                  </div>

                  {activeLabOrders.length > 0 && (
                    <div className="flex flex-wrap gap-2 p-3 border border-slate-100 rounded-md bg-white">
                      {activeLabOrders.map((ord, idx) => (
                        <div key={idx} className="px-2.5 py-1.5 bg-sky-50 text-sky-700 font-medium font-sans border border-sky-100 rounded-full flex items-center gap-1.5">
                          <span>{ord.testName}</span>
                          <button type="button" onClick={() => removeLabOrderItem(idx)} className="text-sky-800 hover:bg-sky-200/50 rounded-full p-0.5"><X className="w-3 h-3" /></button>
                        </div>
                      ))}
                    </div>
                  )}
                </div>

                {/* Submission bottom segment */}
                <div className="pt-6 border-t border-slate-100 flex items-center justify-end gap-3 text-xs font-sans">
                  <button type="button" onClick={() => setIsOpeningEncounter(false)} className="px-4 py-2 text-slate-500 hover:text-slate-700">Discard</button>
                  <button 
                    type="button" 
                    id="btn-save-emr-encounter" 
                    onClick={handleSaveEMREncounter} 
                    disabled={isSubmitting}
                    className="px-5 py-2.5 bg-teal-600 hover:bg-teal-700 disabled:bg-teal-400 text-white rounded-xl shadow-md font-medium font-sans cursor-pointer flex items-center gap-2 transition-all"
                  >
                    {isSubmitting ? (
                      <span className="w-3.5 h-3.5 border-2 border-white border-t-transparent rounded-full animate-spin-fast shrink-0"></span>
                    ) : (
                      <Save className="w-4 h-4" />
                    )}
                    <span>{isSubmitting ? "Posting Note..." : "Post Medical Encounter"}</span>
                  </button>
                </div>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}

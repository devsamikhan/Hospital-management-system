/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import { 
  Users, 
  Search, 
  UserPlus, 
  Calendar, 
  Phone, 
  MapPin, 
  Heart, 
  Archive, 
  Edit3, 
  X, 
  Activity,
  History,
  AlertTriangle,
  ChevronRight
} from 'lucide-react';
import { useHospital } from '../context/HospitalContext';
import { Patient, Encounter } from '../types';

export default function PatientsDirectory() {
  const { 
    patients, 
    registerPatient, 
    updatePatient, 
    archivePatient, 
    getPatientEncounters 
  } = useHospital();

  const [search, setSearch] = useState('');
  const [selectedPatient, setSelectedPatient] = useState<Patient | null>(null);
  const [patientEncounters, setPatientEncounters] = useState<Encounter[]>([]);
  const [showRegModal, setShowRegModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  
  // Forms States
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [formName, setFormName] = useState('');
  const [formDob, setFormDob] = useState('');
  const [formGender, setFormGender] = useState<'Male' | 'Female' | 'Other'>('Male');
  const [formContact, setFormContact] = useState('');
  const [formEmail, setFormEmail] = useState('');
  const [formAddress, setFormAddress] = useState('');
  const [formBlood, setFormBlood] = useState<'A+' | 'A-' | 'B+' | 'B-' | 'AB+' | 'AB-' | 'O+' | 'O-'>('O+');
  const [formEmergencyName, setFormEmergencyName] = useState('');
  const [formEmergencyRelation, setFormEmergencyRelation] = useState('');
  const [formEmergencyPhone, setFormEmergencyPhone] = useState('');

  const activePatients = patients.filter(p => !p.isArchived);
  const filteredPatients = activePatients.filter(p => 
    p.name.toLowerCase().includes(search.toLowerCase()) || 
    p.id.toLowerCase().includes(search.toLowerCase()) || 
    p.contact.includes(search)
  );

  const handleSelectPatient = async (p: Patient) => {
    setSelectedPatient(p);
    const hist = await getPatientEncounters(p.id);
    setPatientEncounters(hist);
  };

  const handleOpenRegister = () => {
    setFormName('');
    setFormDob('');
    setFormGender('Male');
    setFormContact('');
    setFormEmail('');
    setFormAddress('');
    setFormBlood('O+');
    setFormEmergencyName('');
    setFormEmergencyRelation('');
    setFormEmergencyPhone('');
    setShowRegModal(true);
  };

  const handleOpenEdit = (p: Patient) => {
    setFormName(p.name);
    setFormDob(p.dob);
    setFormGender(p.gender);
    setFormContact(p.contact);
    setFormEmail(p.email || '');
    setFormAddress(p.address);
    setFormBlood(p.bloodGroup);
    setFormEmergencyName(p.emergencyContact?.name || '');
    setFormEmergencyRelation(p.emergencyContact?.relationship || '');
    setFormEmergencyPhone(p.emergencyContact?.phone || '');
    setShowEditModal(true);
  };

  const submitRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    const success = await registerPatient({
      name: formName,
      dob: formDob,
      gender: formGender,
      contact: formContact,
      email: formEmail || undefined,
      address: formAddress,
      bloodGroup: formBlood,
      emergencyContact: {
        name: formEmergencyName,
        relationship: formEmergencyRelation,
        phone: formEmergencyPhone
      }
    });
    setIsSubmitting(false);
    if (success) setShowRegModal(false);
  };

  const submitEdit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedPatient) return;
    setIsSubmitting(true);
    const success = await updatePatient(selectedPatient.id, {
      name: formName,
      dob: formDob,
      gender: formGender,
      contact: formContact,
      email: formEmail || undefined,
      address: formAddress,
      bloodGroup: formBlood,
      emergencyContact: {
        name: formEmergencyName,
        relationship: formEmergencyRelation,
        phone: formEmergencyPhone
      }
    });
    setIsSubmitting(false);
    if (success) {
      setShowEditModal(false);
      // refresh selected state
      const updatedItem = {
        ...selectedPatient,
        name: formName,
        dob: formDob,
        gender: formGender,
        contact: formContact,
        email: formEmail,
        address: formAddress,
        bloodGroup: formBlood,
        emergencyContact: {
          name: formEmergencyName,
          relationship: formEmergencyRelation,
          phone: formEmergencyPhone
        }
      };
      setSelectedPatient(updatedItem);
    }
  };

  const executeArchive = async (mrn: string) => {
    if (confirm("Are you sure you want to compliance-archive this patient clinical record?")) {
      const ok = await archivePatient(mrn);
      if (ok) setSelectedPatient(null);
    }
  };

  return (
    <div id="hms-patients-directory-module" className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start lg:h-[calc(100vh-140px)] h-auto">
      {/* Patient selector column */}
      <div id="patient-search-list-panel" className="lg:col-span-5 bg-white/90 backdrop-blur-xs border border-slate-100/70 rounded-2xl shadow-sm hover:shadow-md hover:border-slate-200/50 transition-all duration-300 flex flex-col lg:h-full min-h-[400px] h-[450px] overflow-hidden">
        <div className="p-4 border-b border-slate-100 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Users className="w-5 h-5 text-blue-600" />
            <h3 className="font-display font-medium text-sm text-slate-800">Outpatient Directory</h3>
          </div>
          <button 
            id="btn-add-patient-open"
            onClick={handleOpenRegister}
            className="flex items-center gap-1.5 px-3 py-1.5 bg-blue-600 hover:bg-blue-700 active-bounce cursor-pointer text-white font-sans font-medium text-[11px] rounded-lg cursor-pointer shadow-sm transition-all"
          >
            <UserPlus className="w-3.5 h-3.5" />
            <span>Register</span>
          </button>
        </div>

        {/* Searching text box */}
        <div className="p-3 bg-slate-50/50 border-b border-slate-100">
          <div className="relative">
            <Search className="absolute left-3 top-2.5 w-4 h-4 text-slate-400" />
            <input 
              id="txt-patient-search"
              type="text" 
              placeholder="Search by Patient MRN, Name, Phone..." 
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full bg-white pl-9 pr-4 py-2 border border-slate-200 focus:outline-none focus:ring-1 focus:ring-teal-500 rounded-xl text-xs font-sans placeholder-slate-400"
            />
          </div>
        </div>

        {/* Directory scrolling catalog */}
        <div className="flex-1 overflow-y-auto divide-y divide-slate-100 custom-scrollbar">
          {filteredPatients.length === 0 ? (
            <p className="text-slate-400 text-xs py-10 text-center font-sans">No matching patients registered.</p>
          ) : (
            filteredPatients.map(p => (
              <div 
                key={p.id}
                id={`patient-line-${p.id}`}
                onClick={() => handleSelectPatient(p)}
                className={`p-4 flex items-center justify-between cursor-pointer transition-all ${
                  selectedPatient?.id === p.id 
                    ? 'bg-slate-50 border-l-4 border-blue-600' 
                    : 'hover:bg-slate-50/50'
                }`}
              >
                <div className="space-y-1">
                  <span className="font-sans font-semibold text-xs text-slate-700 block">{p.name}</span>
                  <div className="flex items-center gap-2 font-mono text-[10px] text-slate-400">
                    <span className="font-bold text-blue-600">{p.id}</span>
                    <span>•</span>
                    <span>{p.gender} (DOB: {p.dob})</span>
                  </div>
                </div>
                <ChevronRight className="w-4 h-4 text-slate-400" />
              </div>
            ))
          )}
        </div>
      </div>

      {/* Selected Patient clinical details column */}
      <div id="patient-details-panel" className="lg:col-span-7 bg-white/90 backdrop-blur-xs border border-slate-100/70 rounded-2xl shadow-sm hover:shadow-md hover:border-slate-200/50 transition-all duration-300 lg:h-full h-auto overflow-y-auto custom-scrollbar p-6">
        {!selectedPatient ? (
          <div className="h-full flex flex-col items-center justify-center text-center py-20 text-slate-400 space-y-3">
            <Users className="w-12 h-12 text-slate-300 stroke-[1.5]" />
            <div>
              <p className="font-sans text-xs font-medium">Select a patient from the listing directory</p>
              <p className="font-sans text-[10px] text-slate-400">to inspect complete demographics history and SOAP records</p>
            </div>
          </div>
        ) : (
          <div className="space-y-6">
            {/* Action Bar */}
            <div className="flex items-center justify-between border-b border-slate-100 pb-4">
              <div>
                <h3 className="font-display text-sm font-semibold text-slate-800">{selectedPatient.name}</h3>
                <span className="font-mono text-[10px] text-blue-600 font-bold uppercase">{selectedPatient.id}</span>
              </div>
              <div className="flex items-center gap-2">
                <button 
                  id="btn-edit-patient-open"
                  onClick={() => handleOpenEdit(selectedPatient)}
                  className="p-2 text-slate-500 hover:text-blue-600 bg-slate-100 hover:bg-blue-50 rounded-lg cursor-pointer transition-colors"
                  title="Edit Demographics"
                >
                  <Edit3 className="w-4 h-4" />
                </button>
                <button 
                  id="btn-archive-patient"
                  onClick={() => executeArchive(selectedPatient.id)}
                  className="p-2 text-slate-500 hover:text-amber-600 bg-slate-100 hover:bg-amber-50 rounded-lg cursor-pointer transition-colors"
                  title="Archive patient medical record"
                >
                  <Archive className="w-4 h-4" />
                </button>
              </div>
            </div>

            {/* Demographics Card */}
            <div className="bg-slate-50 rounded-xl p-5 border border-slate-100 grid grid-cols-2 gap-4 text-xs font-sans">
              <div className="flex flex-col gap-1">
                <span className="text-slate-400 font-medium">Date of Birth:</span>
                <span className="text-slate-700">{selectedPatient.dob}</span>
              </div>
              <div className="flex flex-col gap-1">
                <span className="text-slate-400 font-medium">Gender:</span>
                <span className="text-slate-700">{selectedPatient.gender}</span>
              </div>
              <div className="flex flex-col gap-1 col-span-2">
                <span className="text-slate-400 font-medium">Contact Details:</span>
                <span className="text-slate-700 flex items-center gap-1.5"><Phone className="w-3.5 h-3.5 text-slate-400" /> {selectedPatient.contact} | {selectedPatient.email || 'No email'}</span>
              </div>
              <div className="flex flex-col gap-1 col-span-2">
                <span className="text-slate-400 font-medium">Address:</span>
                <span className="text-slate-700 flex items-center gap-1.5"><MapPin className="w-3.5 h-3.5 text-slate-400" /> {selectedPatient.address}</span>
              </div>
              <div className="flex flex-col gap-1">
                <span className="text-slate-400 font-medium">Blood Group:</span>
                <span className="text-rose-600 font-semibold flex items-center gap-1"><Heart className="w-3.5 h-3.5" /> {selectedPatient.bloodGroup}</span>
              </div>
              <div className="bg-white rounded-lg p-3 border border-slate-100 col-span-2 space-y-1">
                <span className="text-[10px] text-slate-400 font-mono tracking-wider uppercase font-semibold">Emergency Liaison Contact</span>
                <p className="text-slate-700 text-xs font-semibold">{selectedPatient.emergencyContact.name} ({selectedPatient.emergencyContact.relationship})</p>
                <p className="text-slate-600 text-xs">{selectedPatient.emergencyContact.phone}</p>
              </div>
            </div>

            {/* Chronological clinical encounters */}
            <div className="space-y-4">
              <div className="flex items-center gap-2 text-slate-700 font-sans font-semibold text-xs">
                <History className="w-4 h-4 text-blue-600" />
                <span>Chronological EMR Soap Encounters</span>
              </div>

              {patientEncounters.length === 0 ? (
                <div className="text-center py-6 border border-dashed border-slate-200 rounded-xl text-slate-400 font-sans text-[11px]">
                  No outpatient consulting encounters on file. Click "Clinical EMR" to write your first SOAP consultation report.
                </div>
              ) : (
                <div className="space-y-4">
                  {patientEncounters.map((enc) => (
                    <div key={enc.id} className="border border-slate-100 rounded-xl p-4 bg-white space-y-3 shadow-xs">
                      <div className="flex items-center justify-between border-b border-slate-50 pb-2">
                        <span className="font-sans font-medium text-slate-700 text-xs">Consultation Encounter</span>
                        <span className="font-mono text-[10px] text-slate-400">{new Date(enc.date).toLocaleString()}</span>
                      </div>
                      
                      {/* Vitals Signs */}
                      <div className="grid grid-cols-4 gap-2 text-[10px] font-mono text-slate-600 bg-slate-50/80 p-2.5 rounded-lg border border-slate-50">
                        <span>BP: <strong className="text-slate-800">{enc.vitals.bp}</strong></span>
                        <span>Pulse: <strong className="text-slate-800">{enc.vitals.heartRate} bpm</strong></span>
                        <span>Temp: <strong className="text-slate-800">{enc.vitals.temperature}°C</strong></span>
                        <span>Weight: <strong className="text-slate-800">{enc.vitals.weight}kg</strong></span>
                      </div>

                      {/* SOAP details */}
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs font-sans">
                        <div className="space-y-1">
                          <span className="text-[10px] text-blue-600 font-mono font-bold uppercase block">[S] Subjective</span>
                          <p className="text-slate-600 font-light italic leading-relaxed">{enc.soap.s}</p>
                        </div>
                        <div className="space-y-1">
                          <span className="text-[10px] text-blue-600 font-mono font-bold uppercase block">[O] Objective</span>
                          <p className="text-slate-600 font-light italic leading-relaxed">{enc.soap.o}</p>
                        </div>
                        <div className="space-y-1">
                          <span className="text-[10px] text-blue-600 font-mono font-bold uppercase block">[A] Assessment</span>
                          <p className="text-slate-800 font-medium leading-relaxed">{enc.soap.a}</p>
                        </div>
                        <div className="space-y-1">
                          <span className="text-[10px] text-blue-600 font-mono font-bold uppercase block">[P] Plan</span>
                          <p className="text-slate-700 leading-relaxed font-light">{enc.soap.p}</p>
                        </div>
                      </div>

                      {/* Prescriptions */}
                      {enc.prescriptions && enc.prescriptions.length > 0 && (
                        <div className="space-y-1 border-t border-slate-100 pt-2 text-xs font-sans">
                          <span className="text-[10px] text-indigo-500 font-mono font-bold uppercase block">Attached Prescriptions (Medications)</span>
                          <div className="space-y-1 mt-1">
                            {enc.prescriptions.map((rx, idx) => (
                              <div key={idx} className="flex justify-between p-1 bg-indigo-50/40 rounded border border-indigo-100/30 text-[11px]">
                                <span className="font-semibold text-slate-700">{rx.name} ({rx.dosage}) - {rx.frequency} [{rx.duration}]</span>
                                <span className={`px-1.5 py-0.5 text-[9px] rounded font-semibold font-mono uppercase ${rx.dispensed ? 'bg-emerald-100 text-emerald-700 border border-emerald-100' : 'bg-amber-100 text-amber-700 border border-amber-200'}`}>
                                  {rx.dispensed ? 'Dispensed' : 'Prescribed/Ordered'}
                                </span>
                              </div>
                            ))}
                          </div>
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        )}
      </div>

      {/* REGISTRATION MODAL FORM */}
      {showRegModal && (
        <div className="fixed inset-0 bg-slate-900/60 z-50 flex items-center justify-center p-4 backdrop-blur-2xs">
          <div className="bg-white rounded-2xl w-full max-w-xl shadow-xl overflow-hidden animate-scale-up">
            <div className="px-6 py-4 bg-blue-600 border-b border-blue-700 flex items-center justify-between text-white">
              <h3 className="font-display font-medium text-sm">Patient Clinical Demography Registration</h3>
              <button onClick={() => setShowRegModal(false)} className="text-blue-200 hover:text-white cursor-pointer"><X className="w-5 h-5" /></button>
            </div>
            <form onSubmit={submitRegister} className="p-6 space-y-4 max-h-[75vh] overflow-y-auto custom-scrollbar">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1 col-span-2">
                  <label className="text-slate-500 text-xs font-medium font-sans">Patient Full Name *</label>
                  <input required type="text" value={formName} onChange={e => setFormName(e.target.value)} className="w-full text-xs font-sans p-2 border border-slate-200 rounded-lg focus:outline-none focus:ring-1 focus:ring-blue-500" placeholder="e.g. Liam Neeson" />
                </div>
                <div className="space-y-1">
                  <label className="text-slate-500 text-xs font-medium font-sans">Date of Birth *</label>
                  <input required type="date" value={formDob} onChange={e => setFormDob(e.target.value)} className="w-full text-xs font-sans p-2 border border-slate-200 rounded-lg focus:outline-none" />
                </div>
                <div className="space-y-1">
                  <label className="text-slate-500 text-xs font-medium font-sans">Biological Gender *</label>
                  <select value={formGender} onChange={e => setFormGender(e.target.value as any)} className="w-full text-xs font-sans p-2 border border-slate-200 rounded-lg focus:outline-none">
                    <option value="Male">Male</option>
                    <option value="Female">Female</option>
                    <option value="Other">Other</option>
                  </select>
                </div>
                <div className="space-y-1">
                  <label className="text-slate-500 text-xs font-medium font-sans">Contact Contact Phone *</label>
                  <input required type="text" value={formContact} onChange={e => setFormContact(e.target.value)} className="w-full text-xs font-sans p-2 border border-slate-200 rounded-lg focus:outline-none" placeholder="+1 (555) 777-8888" />
                </div>
                <div className="space-y-1">
                  <label className="text-slate-500 text-xs font-medium font-sans">Clinician Email Address</label>
                  <input type="email" value={formEmail} onChange={e => setFormEmail(e.target.value)} className="w-full text-xs font-sans p-2 border border-slate-200 rounded-lg focus:outline-none" placeholder="example@health.com" />
                </div>
                <div className="space-y-1 col-span-2">
                  <label className="text-slate-500 text-xs font-medium font-sans">Home Street Address *</label>
                  <textarea required value={formAddress} onChange={e => setFormAddress(e.target.value)} className="w-full text-xs font-sans p-2 border border-slate-200 rounded-lg focus:outline-none h-16 resize-none" placeholder="123 Medic Bay Way..." />
                </div>
                <div className="space-y-1">
                  <label className="text-slate-500 text-xs font-medium font-sans">Patient Blood Group *</label>
                  <select value={formBlood} onChange={e => setFormBlood(e.target.value as any)} className="w-full text-xs font-sans p-2 border border-slate-200 rounded-lg focus:outline-none">
                    {['A+', 'A-', 'B+', 'B-', 'AB+', 'AB-', 'O+', 'O-'].map(b => (
                      <option key={b} value={b}>{b}</option>
                    ))}
                  </select>
                </div>
              </div>

              {/* Emergency section */}
              <div className="border-t border-slate-100 pt-4 space-y-3">
                <span className="text-[10px] text-slate-400 font-mono tracking-wider font-semibold uppercase block">Emergency Contact Demographics</span>
                <div className="grid grid-cols-3 gap-2">
                  <div className="space-y-1">
                    <label className="text-slate-500 text-[10px] font-sans font-medium">Kin Name *</label>
                    <input required type="text" value={formEmergencyName} onChange={e => setFormEmergencyName(e.target.value)} className="w-full text-xs font-sans p-2 border border-slate-200 rounded-lg focus:outline-none" placeholder="Emma Watson" />
                  </div>
                  <div className="space-y-1">
                    <label className="text-slate-500 text-[10px] font-sans font-medium">Relationship *</label>
                    <input required type="text" value={formEmergencyRelation} onChange={e => setFormEmergencyRelation(e.target.value)} className="w-full text-xs font-sans p-2 border border-slate-200 rounded-lg focus:outline-none" placeholder="Spouse" />
                  </div>
                  <div className="space-y-1">
                    <label className="text-slate-500 text-[10px] font-sans font-medium">Kin Phone *</label>
                    <input required type="text" value={formEmergencyPhone} onChange={e => setFormEmergencyPhone(e.target.value)} className="w-full text-xs font-sans p-2 border border-slate-200 rounded-lg focus:outline-none" placeholder="+1..." />
                  </div>
                </div>
              </div>

              <div className="flex items-center justify-end gap-3 pt-4 border-t border-slate-100">
                <button type="button" onClick={() => setShowRegModal(false)} className="px-4 py-2 text-slate-500 hover:text-slate-700 hover:bg-slate-50 rounded-lg text-xs font-sans font-medium cursor-pointer">Cancel</button>
                <button 
                  type="submit" 
                  disabled={isSubmitting} 
                  className="flex items-center gap-1.5 px-4 py-2 bg-blue-600 hover:bg-blue-700 disabled:bg-blue-400 text-white rounded-lg text-xs font-sans font-medium shadow-sm cursor-pointer transition-all"
                >
                  {isSubmitting && <span className="w-3 h-3 border-2 border-white border-t-transparent rounded-full animate-spin-fast shrink-0"></span>}
                  <span>{isSubmitting ? "Registering..." : "Save Register"}</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* EDIT MODAL FORM */}
      {showEditModal && selectedPatient && (
        <div className="fixed inset-0 bg-slate-900/60 z-50 flex items-center justify-center p-4 backdrop-blur-2xs">
          <div className="bg-white rounded-2xl w-full max-w-xl shadow-xl overflow-hidden animate-scale-up">
            <div className="px-6 py-4 bg-blue-600 border-b border-blue-700 flex items-center justify-between text-white">
              <h3 className="font-display font-medium text-sm">Refine Patient Demographics ({selectedPatient.id})</h3>
              <button onClick={() => setShowEditModal(false)} className="text-blue-200 hover:text-white cursor-pointer"><X className="w-5 h-5" /></button>
            </div>
            <form onSubmit={submitEdit} className="p-6 space-y-4 max-h-[75vh] overflow-y-auto custom-scrollbar">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1 col-span-2">
                  <label className="text-slate-500 text-xs font-medium font-sans">Patient Full Name *</label>
                  <input required type="text" value={formName} onChange={e => setFormName(e.target.value)} className="w-full text-xs font-sans p-2 border border-slate-200 rounded-lg" />
                </div>
                <div className="space-y-1">
                  <label className="text-slate-500 text-xs font-medium font-sans">Date of Birth *</label>
                  <input required type="date" value={formDob} onChange={e => setFormDob(e.target.value)} className="w-full text-xs font-sans p-2 border border-slate-200 rounded-lg" />
                </div>
                <div className="space-y-1">
                  <label className="text-slate-500 text-xs font-medium font-sans">Biological Gender *</label>
                  <select value={formGender} onChange={e => setFormGender(e.target.value as any)} className="w-full text-xs font-sans p-2 border border-slate-200 rounded-lg">
                    <option value="Male">Male</option>
                    <option value="Female">Female</option>
                    <option value="Other">Other</option>
                  </select>
                </div>
                <div className="space-y-1">
                  <label className="text-slate-500 text-xs font-medium font-sans">Contact Contact Phone *</label>
                  <input required type="text" value={formContact} onChange={e => setFormContact(e.target.value)} className="w-full text-xs font-sans p-2 border border-slate-200 rounded-lg" />
                </div>
                <div className="space-y-1">
                  <label className="text-slate-500 text-xs font-medium font-sans">Clinician Email Address</label>
                  <input type="email" value={formEmail} onChange={e => setFormEmail(e.target.value)} className="w-full text-xs font-sans p-2 border border-slate-200 rounded-lg" />
                </div>
                <div className="space-y-1 col-span-2">
                  <label className="text-slate-500 text-xs font-medium font-sans">Home Street Address *</label>
                  <textarea required value={formAddress} onChange={e => setFormAddress(e.target.value)} className="w-full text-xs font-sans p-2 border border-slate-200 rounded-lg h-16 resize-none" />
                </div>
                <div className="space-y-1">
                  <label className="text-slate-500 text-xs font-medium font-sans">Patient Blood Group *</label>
                  <select value={formBlood} onChange={e => setFormBlood(e.target.value as any)} className="w-full text-xs font-sans p-2 border border-slate-200 rounded-lg">
                    {['A+', 'A-', 'B+', 'B-', 'AB+', 'AB-', 'O+', 'O-'].map(b => (
                      <option key={b} value={b}>{b}</option>
                    ))}
                  </select>
                </div>
              </div>

              {/* Emergency section */}
              <div className="border-t border-slate-100 pt-4 space-y-3">
                <span className="text-[10px] text-slate-400 font-mono tracking-wider font-semibold uppercase block">Emergency Contact Demographics</span>
                <div className="grid grid-cols-3 gap-2">
                  <div className="space-y-1">
                    <label className="text-slate-500 text-[10px] font-sans font-medium">Kin Name *</label>
                    <input required type="text" value={formEmergencyName} onChange={e => setFormEmergencyName(e.target.value)} className="w-full text-xs font-sans p-2 border border-slate-200 rounded-lg" />
                  </div>
                  <div className="space-y-1">
                    <label className="text-slate-500 text-[10px] font-sans font-medium">Relationship *</label>
                    <input required type="text" value={formEmergencyRelation} onChange={e => setFormEmergencyRelation(e.target.value)} className="w-full text-xs font-sans p-2 border border-slate-200 rounded-lg" />
                  </div>
                  <div className="space-y-1">
                    <label className="text-slate-500 text-[10px] font-sans font-medium">Kin Phone *</label>
                    <input required type="text" value={formEmergencyPhone} onChange={e => setFormEmergencyPhone(e.target.value)} className="w-full text-xs font-sans p-2 border border-slate-200 rounded-lg" />
                  </div>
                </div>
              </div>

              <div className="flex items-center justify-end gap-3 pt-4 border-t border-slate-100">
                <button type="button" onClick={() => setShowEditModal(false)} className="px-4 py-2 text-slate-500 hover:text-slate-700 hover:bg-slate-50 rounded-lg text-xs font-sans font-medium cursor-pointer">Cancel</button>
                <button 
                  type="submit" 
                  disabled={isSubmitting} 
                  className="flex items-center gap-1.5 px-4 py-2 bg-blue-600 hover:bg-blue-700 disabled:bg-blue-400 text-white rounded-lg text-xs font-sans font-medium shadow-sm cursor-pointer transition-all"
                >
                  {isSubmitting && <span className="w-3 h-3 border-2 border-white border-t-transparent rounded-full animate-spin-fast shrink-0"></span>}
                  <span>{isSubmitting ? "Saving..." : "Save Changes"}</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

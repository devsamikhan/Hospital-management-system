/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect } from 'react';
import { 
  Calendar, 
  Clock, 
  User, 
  Search, 
  FileText, 
  X, 
  Plus, 
  ChevronLeft, 
  ChevronRight, 
  MessageSquare,
  AlertTriangle,
  UserCheck
} from 'lucide-react';
import { useHospital } from '../context/HospitalContext';
import { Appointment } from '../types';

export default function AppointmentsBook() {
  const { 
    appointments, 
    patients, 
    bookAppointment, 
    updateAppointment, 
    setError 
  } = useHospital();

  const [selectedDocFilter, setSelectedDocFilter] = useState('all');
  const [showBookModal, setShowBookModal] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  
  // Doctors simulation profiles — Authentic Pakistani medical staff roster
  const doctorsList = [
    { id: "u-doc-asif", name: "Dr. Muhammad Asif Khan", specialization: "Cardiology & Internal Medicine (Mon/Wed/Fri)" },
    { id: "u-doc-amna", name: "Dr. Amna Bilal", specialization: "General Medicine & Infectious Disease (Mon-Sat)" },
    { id: "u-doc-sajid", name: "Dr. Sajid Mehmood", specialization: "Pediatrics & Emergency Medicine (Tue/Thu/Sat)" }
  ];

  // Booking details Form states
  const [selectPatientId, setSelectPatientId] = useState('');
  const [selectDoctorId, setSelectDoctorId] = useState('');
  const [selectDate, setSelectDate] = useState('2026-05-30'); // default simulated future day
  const [selectSlot, setSelectSlot] = useState('09:00 AM');
  const [formNotes, setFormNotes] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Available consultation times slots
  const timeSlots = [
    "09:00 AM", "09:30 AM", "10:00 AM", "10:30 AM", "11:00 AM", "11:30 AM",
    "01:00 PM", "01:30 PM", "02:00 PM", "02:30 PM", "03:00 PM", "03:30 PM", "04:00 PM"
  ];

  // Filtering
  const filteredAppointments = appointments.filter(a => {
    const docMatch = selectedDocFilter === 'all' || a.doctorId === selectedDocFilter;
    const searchMatch = 
      a.patientName?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      a.patientId.toLowerCase().includes(searchQuery.toLowerCase()) ||
      a.doctorName?.toLowerCase().includes(searchQuery.toLowerCase());
    return docMatch && searchMatch;
  });

  // Highlight appointments booked
  const submitBooking = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectPatientId || !selectDoctorId || !selectDate || !selectSlot) {
      setError("Please key in patient, doctor, date and session hour slot.");
      return;
    }
    setIsSubmitting(true);
    const succ = await bookAppointment({
      patientId: selectPatientId,
      doctorId: selectDoctorId,
      dateTime: new Date(`${selectDate}T${convert12hTo24h(selectSlot)}:00Z`).toISOString(),
      timeSlot: selectSlot,
      notes: formNotes
    });
    setIsSubmitting(false);
    if (succ) {
      setShowBookModal(false);
      setSelectPatientId('');
      setFormNotes('');
    }
  };

  const convert12hTo24h = (time12: string): string => {
    // "09:30 AM" -> "09:30"
    const [time, modifier] = time12.split(' ');
    let [hours, minutes] = time.split(':');
    if (hours === '12') hours = '00';
    if (modifier === 'PM') hours = String(parseInt(hours, 10) + 12);
    return `${hours.padStart(2, '0')}:${minutes}`;
  };

  const handleCancelAppointment = async (id: string) => {
    if (confirm("Cancel this scheduled outpatient booking?")) {
      await updateAppointment(id, { status: 'Cancelled' });
    }
  };

  return (
    <div id="hms-appointments-module" className="space-y-6">
      
      {/* Search filters toolbar */}
      <div id="appointments-toolbar" className="flex flex-col md:flex-row items-center justify-between gap-4 bg-white p-4 rounded-2xl border border-slate-100 shadow-sm text-xs font-sans">
        <div className="flex flex-wrap items-center gap-3 w-full md:w-auto">
          {/* Doctor filter dropdown */}
          <div className="flex flex-col gap-1">
            <label className="text-slate-400 font-medium">Filter by Specialist</label>
            <select 
              id="ddl-apt-doctor-filter"
              value={selectedDocFilter} 
              onChange={e => setSelectedDocFilter(e.target.value)} 
              className="p-2 border border-slate-200 rounded-xl focus:ring-1 focus:ring-blue-500 focus:outline-none text-xs text-slate-700"
            >
              <option value="all">All Physicians</option>
              {doctorsList.map(d => (
                <option key={d.id} value={d.id}>{d.name}</option>
              ))}
            </select>
          </div>

          {/* Text searching */}
          <div className="flex flex-col gap-1 w-48 md:w-64">
            <label className="text-slate-400 font-medium">Patient search</label>
            <div className="relative">
              <Search className="absolute left-3 top-2.5 w-3.5 h-3.5 text-slate-400" />
              <input 
                id="txt-apt-search"
                type="text" 
                placeholder="Name, MRN..." 
                value={searchQuery}
                onChange={e => setSearchQuery(e.target.value)}
                className="w-full pl-8 pr-3 py-2 border border-slate-200 rounded-xl focus:ring-1 focus:ring-blue-500 focus:outline-none placeholder-slate-400 text-xs text-slate-700"
              />
            </div>
          </div>
        </div>

        <button 
          id="btn-book-apt-open"
          onClick={() => {
            if (patients.length === 0) {
              alert("Please register at least one patient record inside demographics first!");
              return;
            }
            setShowBookModal(true);
          }}
          className="flex items-center gap-1.5 px-4 py-2.5 bg-blue-600 hover:bg-blue-700 active-bounce cursor-pointer text-white font-semibold rounded-xl shadow-sm cursor-pointer transition-all self-stretch md:self-auto justify-center"
        >
          <Plus className="w-4 h-4" />
          <span>Book Appointment</span>
        </button>
      </div>

      {/* Roster & Scheduled outpatient calendar slots */}
      <div id="appointments-ledger-card" className="bg-white border border-slate-150 rounded-2xl shadow-sm p-6 space-y-4">
        <div className="flex items-center justify-between border-b border-slate-100 pb-4">
          <div className="flex items-center gap-2">
            <Calendar className="w-5 h-5 text-blue-600" />
            <h3 className="font-display font-medium text-sm text-slate-800">OPD Outpatient Consultation Calendar</h3>
          </div>
          <span className="text-[10px] text-slate-400 font-mono">Records: {filteredAppointments.length} sessions</span>
        </div>

        {filteredAppointments.length === 0 ? (
          <div className="text-center py-12 text-slate-400 font-sans text-xs">
            No consultations registered. Click "Book Appointment" to schedules one.
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs font-sans divide-y divide-slate-100">
              <thead>
                <tr className="text-slate-400 font-semibold uppercase tracking-wider text-[10px]">
                  <th className="py-3 px-4">Date & Time</th>
                  <th className="py-3 px-4">Patient (MRN)</th>
                  <th className="py-3 px-4">Doctor Assigned</th>
                  <th className="py-3 px-4">Administrative Notes</th>
                  <th className="py-3 px-4">Status</th>
                  <th className="py-3 px-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 text-slate-600 bg-white">
                {filteredAppointments.map(a => (
                  <tr key={a.id} id={`apt-row-${a.id}`} className="hover:bg-slate-50/40">
                    <td className="py-3 px-4 font-mono">
                       <span className="font-semibold text-slate-700">{a.dateTime.substring(0, 10)}</span>
                       <span className="block text-blue-600 font-bold">{a.timeSlot}</span>
                    </td>
                    <td className="py-3 px-4">
                      <strong className="text-slate-800 font-sans font-semibold block">{a.patientName}</strong>
                      <span className="font-mono text-[10px] text-slate-400 font-bold">{a.patientId}</span>
                    </td>
                    <td className="py-3 px-4 font-medium text-slate-700">
                      {a.doctorName}
                    </td>
                    <td className="py-3 px-4 text-slate-500 max-w-xs truncate">
                      {a.notes || 'Routine consultation'}
                      {a.simulatedNotificationLog && (
                        <div id={`simulated-sms-box-${a.id}`} className="mt-1 flex items-center gap-1 text-[10px] text-blue-500 font-medium">
                          <MessageSquare className="w-3 h-3 text-blue-500" />
                          <span className="italic">Simulated SMS Broadcast dispatched</span>
                        </div>
                      )}
                    </td>
                    <td className="py-3 px-4">
                      <span className={`px-2 py-0.5 text-[9px] rounded-full font-mono uppercase font-semibold border ${
                        a.status === 'Scheduled' ? 'bg-sky-50 text-sky-600 border-sky-100' :
                        a.status === 'Completed' ? 'bg-emerald-50 text-emerald-600 border-emerald-100' :
                        'bg-slate-50 text-slate-400 border-slate-100'
                      }`}>
                        {a.status}
                      </span>
                    </td>
                    <td className="py-3 px-4 text-right">
                      {a.status === 'Scheduled' && (
                        <button 
                          id={`btn-cancel-apt-${a.id}`}
                          onClick={() => handleCancelAppointment(a.id)}
                          className="px-2.5 py-1 hover:bg-rose-50 text-rose-600 hover:text-rose-700 font-medium font-sans border border-transparent hover:border-rose-100 rounded-lg cursor-pointer transition-colors"
                        >
                          Cancel
                        </button>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* APPOINTMENT BOOKING DIALOG WINDOW */}
      {showBookModal && (
        <div id="book-appointment-modal" className="fixed inset-0 bg-slate-900/60 z-50 flex items-center justify-center p-4 backdrop-blur-2xs">
          <div className="bg-white rounded-2xl w-full max-w-md shadow-xl overflow-hidden animate-scale-up">
            <div className="px-6 py-4 bg-blue-600 border-b border-blue-700 flex items-center justify-between text-white">
              <h3 className="font-display font-medium text-sm">Schedule New OPD Consultation</h3>
              <button onClick={() => setShowBookModal(false)} className="text-blue-200 hover:text-white cursor-pointer"><X className="w-5 h-5" /></button>
            </div>
            <form onSubmit={submitBooking} className="p-6 space-y-4">
              
              {/* Select Patient */}
              <div className="space-y-1">
                <label className="text-slate-500 text-xs font-medium font-sans">Patient demographic MRN *</label>
                <select 
                  required
                  id="ddl-apt-patient"
                  value={selectPatientId} 
                  onChange={e => setSelectPatientId(e.target.value)} 
                  className="w-full text-xs font-sans p-2.5 border border-slate-200 rounded-lg focus:outline-none"
                >
                  <option value="">-- Choose Registered Patient (MRN) --</option>
                  {patients.filter(p => !p.isArchived).map(p => (
                    <option key={p.id} value={p.id}>{p.name} ({p.id})</option>
                  ))}
                </select>
              </div>

              {/* Select Doctor Specialist */}
              <div className="space-y-1">
                <label className="text-slate-500 text-xs font-medium font-sans">Specialist Assigned *</label>
                <select 
                  required
                  id="ddl-apt-doctor"
                  value={selectDoctorId} 
                  onChange={e => setSelectDoctorId(e.target.value)} 
                  className="w-full text-xs font-sans p-2.5 border border-slate-200 rounded-lg focus:outline-none"
                >
                  <option value="">-- Choose Doctor Specialist --</option>
                  {doctorsList.map(d => (
                    <option key={d.id} value={d.id}>{d.name} ({d.specialization})</option>
                  ))}
                </select>
              </div>

              <div className="grid grid-cols-2 gap-3">
                {/* Date Selection */}
                <div className="space-y-1">
                  <label className="text-slate-500 text-xs font-medium font-sans">Appointment Date *</label>
                  <input 
                    required
                    id="txt-apt-date"
                    type="date" 
                    value={selectDate} 
                    onChange={e => setSelectDate(e.target.value)} 
                    className="w-full text-xs font-sans p-2.5 border border-slate-200 rounded-lg focus:outline-none" 
                  />
                </div>

                {/* Session Slots */}
                <div className="space-y-1">
                  <label className="text-slate-500 text-xs font-medium font-sans">Hour Session Slot *</label>
                  <select 
                    required
                    id="ddl-apt-slot"
                    value={selectSlot} 
                    onChange={e => setSelectSlot(e.target.value)} 
                    className="w-full text-xs font-sans p-2.5 border border-slate-200 rounded-lg focus:outline-none"
                  >
                    {timeSlots.map(ts => (
                      <option key={ts} value={ts}>{ts}</option>
                    ))}
                  </select>
                </div>
              </div>

              {/* Booking clinical notes */}
              <div className="space-y-1">
                <label className="text-slate-500 text-xs font-medium font-sans font-sans">Administrative Remarks / Notes</label>
                <textarea 
                  id="txt-apt-notes"
                  value={formNotes} 
                  onChange={e => setFormNotes(e.target.value)} 
                  className="w-full text-xs font-sans p-2.5 border border-slate-200 rounded-lg focus:outline-none h-16 resize-none" 
                  placeholder="e.g. Requests physical cardiopulmonary check..." 
                />
              </div>

              {/* Automated conflict alert warning display */}
              <div className="bg-slate-50 border border-slate-100 rounded-lg p-3 text-[10px] text-slate-400 font-mono leading-relaxed flex items-center gap-2">
                <UserCheck className="w-4 h-4 text-slate-400 shrink-0" />
                <span>Our automated gateway performs a real-time availability check across specialists before booking.</span>
              </div>

              <div className="flex items-center justify-end gap-3 pt-4 border-t border-slate-100 text-xs font-sans font-semibold">
                <button type="button" onClick={() => setShowBookModal(false)} className="px-4 py-2 text-slate-500 hover:text-slate-700">Cancel</button>
                <button 
                  type="submit" 
                  disabled={isSubmitting} 
                  className="flex items-center gap-2 px-4 py-2 bg-blue-600 hover:bg-blue-700 disabled:bg-blue-400 text-white rounded-lg shadow-sm transition-all"
                >
                  {isSubmitting && <span className="w-3 h-3 border-2 border-white border-t-transparent rounded-full animate-spin-fast shrink-0"></span>}
                  <span>{isSubmitting ? "Checking Availability..." : "Confirm Booking"}</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

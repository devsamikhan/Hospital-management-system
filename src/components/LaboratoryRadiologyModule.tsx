/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import { 
  FlaskConical, 
  Search, 
  ClipboardCheck, 
  FileUp, 
  Upload, 
  CheckCircle, 
  User, 
  AlertOctagon, 
  Clock, 
  Paperclip,
  Check,
  AlertTriangle
} from 'lucide-react';
import { useHospital } from '../context/HospitalContext';
import { LabOrder } from '../types';

export default function LaboratoryRadiologyModule() {
  const { 
    labOrders, 
    updateLabOrder, 
    uploadLabFile, 
    setError 
  } = useHospital();

  const [testSearch, setTestSearch] = useState('');
  const [selectedOrder, setSelectedOrder] = useState<LabOrder | null>(null);

  // Results reporting states
  const [resultValue, setResultValue] = useState('');
  const [refRange, setRefRange] = useState('70 - 100 mg/dL');
  const [flag, setFlag] = useState<'Normal' | 'Abnormal' | 'Critical'>('Normal');
  const [comments, setComments] = useState('');
  
  // Upload states
  const [selFile, setSelFile] = useState<File | null>(null);
  const [uploadingName, setUploadingName] = useState('');
  const [isUploading, setIsUploading] = useState(false);

  // Filters
  const filteredOrders = labOrders.filter(l => 
    l.patientName.toLowerCase().includes(testSearch.toLowerCase()) ||
    l.testName.toLowerCase().includes(testSearch.toLowerCase()) ||
    l.id.toLowerCase().includes(testSearch.toLowerCase())
  );

  const pendingCount = labOrders.filter(l => l.status === 'Ordered').length;

  const handleSelectOrder = (order: LabOrder) => {
    setSelectedOrder(order);
    setResultValue(order.resultValue || '');
    setRefRange(order.referenceRange || '70 - 100 mg/dL');
    setFlag(order.flag || 'Normal');
    setComments(order.comments || '');
    setSelFile(null);
    setUploadingName('');
  };

  // Simulating local text file uploads (base64 simulation)
  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      
      // Validate file type (PDF, PNG, JPEG, JPG are standard clinical document formats)
      const validTypes = ['application/pdf', 'image/png', 'image/jpeg', 'image/jpg'];
      if (!validTypes.includes(file.type)) {
        setError("Invalid attachment format. Only PDF, PNG, and JPEG diagnostic reports are accepted.");
        return;
      }

      setSelFile(file);
      setUploadingName(file.name);
    }
  };

  const submitLabOutputs = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedOrder) return;
    if (!resultValue) {
      setError("Please input the medical text or numeric result value.");
      return;
    }

    let filePathSimulated = selectedOrder.filePath;

    // Simulate uploading a file if one is chosen
    if (selFile) {
      setIsUploading(true);
      // Wait for a small block
      await new Promise(resolve => setTimeout(resolve, 800));
      // Trigger upload via API
      const mockBase64 = "data:application/pdf;base64,JVBERi0xLjQKJ...";
      const uploadSuccess = await uploadLabFile(selectedOrder.id, {
        fileName: selFile.name,
        size: `${(selFile.size / 1024).toFixed(1)} KB`,
        fileContentBase64: mockBase64
      });
      if (uploadSuccess) {
        filePathSimulated = `/uploads/${Date.now()}_${selFile.name}`;
      }
      setIsUploading(false);
    }

    const ok = await updateLabOrder(selectedOrder.id, {
      resultValue,
      referenceRange: refRange,
      flag,
      comments,
      filePath: filePathSimulated
    });

    if (ok) {
      setSelectedOrder(null);
      setResultValue('');
      setComments('');
      setSelFile(null);
    }
  };

  return (
    <div id="hms-labtech-workspace" className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start lg:h-[calc(100vh-140px)] h-auto">
      
      {/* Pending lab orders column */}
      <div id="lab-pending-pool" className="lg:col-span-5 bg-white/90 backdrop-blur-xs border border-slate-100/70 rounded-2xl shadow-sm hover:shadow-md hover:border-slate-200/50 transition-all duration-300 flex flex-col lg:h-full min-h-[400px] h-[450px] overflow-hidden">
        <div className="p-4 border-b border-slate-100 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <FlaskConical className="w-5 h-5 text-blue-600" />
            <h3 className="font-display font-medium text-sm text-slate-800">Diagnostics Labs Portal</h3>
          </div>
          <span className="px-2.5 py-1 bg-amber-50 text-amber-600 font-mono text-[10px] rounded font-bold border border-amber-100/50">
            {pendingCount} Pending Orders
          </span>
        </div>

        {/* Search */}
        <div className="p-3 bg-slate-50/50 border-b border-slate-100">
          <div className="relative">
            <Search className="absolute left-3 top-2.5 w-4 h-4 text-slate-400" />
            <input 
              id="txt-lab-search"
              type="text" 
              placeholder="Search by Patient or test name..." 
              value={testSearch}
              onChange={(e) => setTestSearch(e.target.value)}
              className="w-full pl-9 pr-4 py-2 border border-slate-200 focus:outline-none focus:ring-1 focus:ring-blue-500 rounded-xl text-xs font-sans"
            />
          </div>
        </div>

        {/* Scroll list */}
        <div className="flex-1 overflow-y-auto divide-y divide-slate-100 custom-scrollbar">
          {filteredOrders.length === 0 ? (
            <p className="text-slate-400 text-xs py-10 text-center font-sans">No matching laboratories orders registered.</p>
          ) : (
            filteredOrders.map(o => (
              <div 
                key={o.id}
                id={`lab-order-item-${o.id}`}
                onClick={() => handleSelectOrder(o)}
                className={`p-4 cursor-pointer transition-all ${
                  selectedOrder?.id === o.id 
                    ? 'bg-slate-50 border-l-4 border-blue-600' 
                    : 'hover:bg-slate-50/50'
                }`}
              >
                <div className="flex items-center justify-between gap-2">
                  <div className="space-y-1">
                    <span className="font-sans font-semibold text-xs text-slate-700 block">{o.testName}</span>
                    <span className="font-sans text-slate-400 text-[10px] block font-medium">Patient: {o.patientName}</span>
                  </div>
                  <span className={`px-2 py-0.5 font-mono text-[9px] rounded font-bold border uppercase shrink-0 ${
                    o.status === 'Completed' ? 'bg-emerald-50 text-emerald-600 border-emerald-100' : 'bg-amber-50 text-amber-500 border-amber-100'
                  }`}>
                    {o.status}
                  </span>
                </div>
              </div>
            ))
          )}
        </div>
      </div>

      {/* Entering test results panel */}
      <div id="lab-results-entry" className="lg:col-span-7 bg-white/90 backdrop-blur-xs border border-slate-100/70 rounded-2xl shadow-sm hover:shadow-md hover:border-slate-200/50 transition-all duration-300 lg:h-full h-auto overflow-y-auto custom-scrollbar p-6">
        {!selectedOrder ? (
          <div className="h-full flex flex-col items-center justify-center text-center py-20 text-slate-400 space-y-3">
            <ClipboardCheck className="w-12 h-12 text-slate-200 stroke-[1.5]" />
            <div>
              <p className="font-sans text-xs font-medium">Select a pending laboratories order</p>
              <p className="font-sans text-[10px] text-slate-400">to post numeric/clinical values and upload diagnostics documents</p>
            </div>
          </div>
        ) : (
          <div className="space-y-6">
            <div className="border-b border-slate-100 pb-4">
              <span className={`px-2.5 py-0.5 text-[9px] font-mono font-bold uppercase rounded border ${
                selectedOrder.status === 'Completed' ? 'bg-emerald-50 text-emerald-600 border-emerald-100' : 'bg-amber-50 text-amber-500 border-amber-100'
              }`}>
                {selectedOrder.status} ORDER
              </span>
              <h3 className="font-display font-semibold text-slate-800 text-sm mt-2">{selectedOrder.testName}</h3>
              <div className="flex flex-wrap items-center gap-x-4 gap-y-1 font-sans text-xs text-slate-400 mt-1">
                <span>Patient: <strong className="text-slate-600">{selectedOrder.patientName} ({selectedOrder.patientMRN})</strong></span>
                <span>•</span>
                <span>Prescribing Doctor: <strong className="text-slate-600">{selectedOrder.doctorName}</strong></span>
              </div>
            </div>

            <form onSubmit={submitLabOutputs} className="space-y-5 text-xs font-sans">
              
              {/* Reference Range and input row */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-1">
                  <label className="text-slate-500 font-medium">Recorded Clinical Outcome Value *</label>
                  <input 
                    required
                    id="txt-lab-result-value"
                    type="text" 
                    value={resultValue} 
                    onChange={e => setResultValue(e.target.value)}
                    className="w-full p-2.5 border border-slate-200 rounded-xl focus:outline-none focus:ring-1 focus:ring-blue-500 font-medium"
                    placeholder="e.g. Total Chol: 185 mg/dL, Trig: 130 mg/dL"
                  />
                </div>
                <div className="space-y-1">
                  <label className="text-slate-500 font-medium">Catalog Normal Reference Range</label>
                  <input 
                    type="text" 
                    value={refRange} 
                    onChange={e => setRefRange(e.target.value)}
                    className="w-full p-2.5 border border-slate-200 rounded-xl focus:outline-none"
                    placeholder="e.g. Total < 200 mg/dL, LDL < 130 mg/dL"
                  />
                </div>
              </div>

              {/* Lab flags and alert indicators */}
              <div className="space-y-2">
                <label className="text-slate-500 font-medium block">Pathological Warning Flag</label>
                <div className="flex gap-3">
                  {['Normal', 'Abnormal', 'Critical'].map((vFlag) => (
                    <button
                      key={vFlag}
                      type="button"
                      id={`btn-lab-flag-${vFlag.toLowerCase()}`}
                      onClick={() => setFlag(vFlag as any)}
                      className={`flex-1 py-2 font-semibold hover:bg-slate-50 rounded-xl border cursor-pointer text-center flex items-center justify-center gap-1.5 transition-all text-[11px] ${
                        flag === vFlag 
                          ? vFlag === 'Normal' ? 'bg-emerald-50 text-emerald-700 border-emerald-200 shadow-sm'
                            : vFlag === 'Abnormal' ? 'bg-amber-50 text-amber-700 border-amber-200 shadow-sm'
                            : 'bg-rose-50 text-rose-700 border-rose-200 shadow-sm animate-pulse'
                          : 'bg-white text-slate-500 border-slate-200'
                      }`}
                    >
                      {vFlag === 'Critical' && <AlertOctagon className="w-4 h-4 shrink-0" />}
                      <span>{vFlag} Range</span>
                    </button>
                  ))}
                </div>
              </div>

              {/* Lab Technician Comments */}
              <div className="space-y-1">
                <label className="text-slate-500 font-medium">Analytical Lab Technologist Remarks</label>
                <textarea 
                  id="txt-lab-comments"
                  value={comments} 
                  onChange={e => setComments(e.target.value)}
                  className="w-full p-3 border border-slate-200 rounded-xl h-20 resize-none focus:outline-none focus:ring-1 focus:ring-blue-500" 
                  placeholder="e.g. Specimen drawn from serum. Lipid profile represents baseline stability."
                />
              </div>

              {/* Custom Simulated PDF Upload component */}
              <div className="space-y-2 border-t border-slate-100 pt-4">
                <label className="text-slate-500 font-medium block">Attach Diagnostics Report (Radiology scan, imaging PDF, PNG, etc)</label>
                <div className="border-2 border-dashed border-slate-200 rounded-xl p-4 flex flex-col items-center bg-slate-50/50 justify-center">
                  <input 
                    type="file" 
                    id="lab-report-file-up" 
                    onChange={handleFileChange} 
                    className="hidden" 
                    accept=".pdf, .png, .jpeg, .jpg"
                  />
                  <label htmlFor="lab-report-file-up" className="flex flex-col items-center gap-2 cursor-pointer p-4">
                    <FileUp className="w-8 h-8 text-blue-600 stroke-[1.5]" />
                    <span className="font-semibold text-slate-700">Choose scan report file</span>
                    <span className="text-[10px] text-slate-400 font-mono mt-0.5">Accepts clinical PDF, PNG, or JPEG</span>
                  </label>
                  {uploadingName && (
                    <div className="flex items-center gap-2 bg-emerald-50 text-emerald-700 px-3 py-1.5 rounded-lg border border-emerald-100 text-[10px] font-mono mt-2">
                      <Paperclip className="w-3.5 h-3.5" />
                      <span>Selected: {uploadingName} (Ready to attach)</span>
                    </div>
                  )}
                </div>
              </div>

              {/* Complete segment */}
              <div className="flex items-center justify-end gap-3 pt-4 border-t border-slate-100">
                <button type="button" onClick={() => setSelectedOrder(null)} className="px-4 py-2 text-slate-400 hover:text-slate-600 font-medium">Cancel</button>
                <button 
                  type="submit" 
                  disabled={isUploading}
                  id="btn-post-lab-results"
                  className="px-5 py-2.5 bg-blue-600 hover:bg-blue-700 active-bounce cursor-pointer text-white rounded-xl shadow-md font-semibold cursor-pointer transition-all flex items-center gap-1.5"
                >
                  {isUploading ? (
                    <span>Uploading attachments...</span>
                  ) : (
                    <>
                      <Check className="w-4 h-4" />
                      <span>Post laboratory results</span>
                    </>
                  )}
                </button>
              </div>
            </form>
          </div>
        )}
      </div>
    </div>
  );
}

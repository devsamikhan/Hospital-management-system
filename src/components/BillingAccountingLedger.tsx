/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import { 
  DollarSign, 
  Search, 
  FileText, 
  Plus, 
  Trash2, 
  CreditCard, 
  ShieldCheck, 
  Layers, 
  Percent, 
  Check, 
  X,
  FileSpreadsheet
} from 'lucide-react';
import { useHospital } from '../context/HospitalContext';
import { Invoice, InvoiceItem } from '../types';

export default function BillingAccountingLedger() {
  const { 
    invoices, 
    payInvoice,
    updateClaimStatus,
    patients, 
    setError,
    addToast
  } = useHospital();

  const [searchPat, setSearchPat] = useState('');
  const [selectedInvoice, setSelectedInvoice] = useState<Invoice | null>(null);

  // Modal Dialogs States
  const [showAddItem, setShowAddItem] = useState(false);
  const [showPayment, setShowPayment] = useState(false);
  const [showInsurance, setShowInsurance] = useState(false);

  // New Item States
  const [itemDesc, setItemDesc] = useState('');
  const [itemCharge, setItemCharge] = useState<number>(50);
  const [itemCat, setItemCat] = useState<'Consultation' | 'Pharmacy' | 'Laboratory' | 'Inpatient' | 'Other'>('Consultation');

  // Payment States
  const [payAmount, setPayAmount] = useState<number>(50);
  const [payMethod, setPayMethod] = useState<'Cash' | 'Card' | 'Insurance'>('Card');

  // Insurance States
  const [insProvider, setInsProvider] = useState('State Life Insurance Corporation of Pakistan');
  const [insPolicyNo, setInsPolicyNo] = useState('SL-PKR-2024-00001');
  const [insSplitScore, setInsSplitScore] = useState<number>(80); // 80% coverage default

  const filteredInvoices = invoices.filter(inv => 
    inv.patientName.toLowerCase().includes(searchPat.toLowerCase()) ||
    inv.id.toLowerCase().includes(searchPat.toLowerCase()) ||
    inv.patientMRN.toLowerCase().includes(searchPat.toLowerCase())
  );

  const totalRevenue = invoices.reduce((sum, inv) => sum + (inv.paidAmount || 0), 0);
  const totalOutstanding = invoices.reduce((sum, inv) => sum + Math.max(0, (inv.total || 0) - (inv.paidAmount || 0)), 0);

  const handleSelectInvoice = (inv: Invoice) => {
    setSelectedInvoice(inv);
  };

  const submitAddItem = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedInvoice) return;
    if (!itemDesc || itemCharge <= 0) {
      setError("Please key in valid billing description and positive cost.");
      return;
    }
    // Stub: show success toast (full server-side add-item requires API)
    addToast(`Charge item "${itemDesc}" (Rs. ${itemCharge}) noted. Save to server when API is connected.`, 'info');
    setShowAddItem(false);
    setItemDesc('');
    setItemCharge(50);
  };

  const submitPayment = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedInvoice) return;
    if (payAmount <= 0) {
      setError("Payment amount must be greater than zero.");
      return;
    }
    const ok = await payInvoice(selectedInvoice.id, {
      paymentMethod: payMethod as 'Cash' | 'Card' | 'Insurance',
      amountPaid: Number(payAmount)
    });
    if (ok) {
      setShowPayment(false);
      const updated = invoices.find(i => i.id === selectedInvoice.id);
      if (updated) setSelectedInvoice(updated);
    }
  };

  const submitInsuranceClaim = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedInvoice) return;
    if (!insProvider || !insPolicyNo || insSplitScore < 0 || insSplitScore > 100) {
      setError("Verify insurance details and split cover ratio (0 - 100).");
      return;
    }
    const ok = await updateClaimStatus(selectedInvoice.id, 'Submitted');
    if (ok) {
      addToast(`Insurance claim submitted to ${insProvider} — Policy: ${insPolicyNo} (${insSplitScore}% coverage).`, 'success');
      setShowInsurance(false);
      const updated = invoices.find(i => i.id === selectedInvoice.id);
      if (updated) setSelectedInvoice(updated);
    }
  };

  return (
    <div id="hms-billing-module" className="space-y-6">
      
      {/* Financial Health Indicators Row */}
      <div id="billing-stats-deck" className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="bg-white/90 backdrop-blur-xs border border-slate-100/70 rounded-2xl shadow-sm hover:shadow-md hover:border-slate-200/50 transition-all duration-300 p-5 text-xs font-sans">
          <span className="text-slate-400 font-semibold uppercase">Hospital Collected Revenue</span>
          <h4 className="font-display font-bold text-2xl text-emerald-600 mt-2">Rs. {totalRevenue.toLocaleString(undefined, {minimumFractionDigits: 2, maximumFractionDigits: 2})}</h4>
          <span className="text-[10px] text-slate-400 mt-2 block italic leading-relaxed">Sum total of all settled cash, cheque, bank receipts, and credit card postings.</span>
        </div>

        <div className="bg-white/90 backdrop-blur-xs border border-slate-100/70 rounded-2xl shadow-sm hover:shadow-md hover:border-slate-200/50 transition-all duration-300 p-4 text-xs font-sans">
          <span className="text-slate-400 font-semibold uppercase font-semibold">Hospital Uncollected Accounts Receivable</span>
          <h4 className="font-display font-bold text-2xl text-slate-800 mt-2">Rs. {totalOutstanding.toLocaleString(undefined, {minimumFractionDigits: 2, maximumFractionDigits: 2})}</h4>
          <span className="text-[10px] text-slate-400 mt-2 block italic leading-relaxed">Total outstanding claims including co-pays pending or insurance split authorizations.</span>
        </div>
      </div>

      {/* Main Billing and Ledger Grid splitter */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start lg:h-[calc(100vh-280px)] h-auto">
        
        {/* Left Side: Invoice listing and search directory */}
        <div className="lg:col-span-5 bg-white/90 backdrop-blur-xs border border-slate-100/70 rounded-2xl shadow-sm hover:shadow-md hover:border-slate-200/50 transition-all duration-300 flex flex-col lg:h-full min-h-[400px] h-[450px] overflow-hidden">
          <div className="p-4 border-b border-slate-100 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <FileSpreadsheet className="w-5 h-5 text-blue-600" />
              <h3 className="font-display font-medium text-sm text-slate-800 font-medium">Invoices Accounts Receivables</h3>
            </div>
          </div>

          <div className="p-3 bg-slate-50/50 border-b border-slate-100">
            <div className="relative">
              <Search className="absolute left-3 top-2.5 w-4 h-4 text-slate-400" />
              <input 
                id="txt-billing-search"
                type="text" 
                placeholder="Search by Patient MRN, Name, Invoice ID..." 
                value={searchPat}
                onChange={e => setSearchPat(e.target.value)}
                className="w-full pl-9 pr-4 py-2 border border-slate-200 focus:outline-none focus:ring-1 focus:ring-blue-500 rounded-xl text-xs font-sans"
              />
            </div>
          </div>

          <div className="flex-1 overflow-y-auto divide-y divide-slate-100 custom-scrollbar">
            {filteredInvoices.length === 0 ? (
              <p className="text-slate-400 text-xs py-10 text-center font-sans">No invoice records found.</p>
            ) : (
              filteredInvoices.map(inv => {
                const isSelected = selectedInvoice?.id === inv.id;
                return (
                  <div 
                    key={inv.id}
                    id={`invoice-item-${inv.id}`}
                    onClick={() => handleSelectInvoice(inv)}
                    className={`p-4 cursor-pointer flex justify-between items-center transition-all ${
                      isSelected ? 'bg-slate-50 border-l-4 border-blue-600' : 'hover:bg-slate-50/50'
                    }`}
                  >
                    <div className="space-y-1">
                      <span className="font-sans font-semibold text-xs text-slate-700 block">{inv.patientName}</span>
                      <div className="flex items-center gap-2 font-mono text-[9px] text-slate-400 font-medium font-medium">
                        <span className="text-blue-600 font-bold">{inv.patientMRN}</span>
                        <span>•</span>
                        <span>Total: Rs. {(inv.total || 0).toFixed(2)}</span>
                      </div>
                    </div>
                    <span className={`px-2.5 py-0.5 font-mono font-bold text-[9px] rounded-full border ${
                      inv.status === 'Paid' ? 'bg-emerald-50 text-emerald-600 border-emerald-100' :
                      inv.status === 'Unpaid' ? 'bg-rose-50 text-rose-600 border-rose-100' :
                      'bg-indigo-50 text-indigo-600 border-indigo-100'
                    }`}>
                      {inv.status}
                    </span>
                  </div>
                );
              })
            )}
          </div>
        </div>

        {/* Right Side: Invoice Statement details breakdown */}
        <div className="lg:col-span-7 bg-white/90 backdrop-blur-xs border border-slate-100/70 rounded-2xl shadow-sm hover:shadow-md hover:border-slate-200/50 transition-all duration-300 p-6 lg:h-full h-auto overflow-y-auto custom-scrollbar">
          {!selectedInvoice ? (
            <div className="h-full flex flex-col items-center justify-center text-center py-20 text-slate-400 space-y-3">
              <FileSpreadsheet className="w-12 h-12 text-slate-200 stroke-[1.5]" />
              <div>
                <p className="font-sans text-xs font-medium">Select a patient invoice statement</p>
                <p className="font-sans text-[10px] text-slate-400">to post clinical line items, settle payments, and split insurance coverage</p>
              </div>
            </div>
          ) : (
            <div className="space-y-6">
              
              {/* Patient header */}
              <div className="flex flex-col md:flex-row md:items-center justify-between border-b border-slate-100 pb-4 gap-4">
                <div>
                  <span className="font-mono text-[10px] text-slate-400 uppercase tracking-widest block">INVOICE STMT: {selectedInvoice.id}</span>
                  <h3 className="font-display font-semibold text-slate-800 text-sm mt-1">{selectedInvoice.patientName}</h3>
                  <span className="font-mono text-blue-600 text-[10px] block mt-1">MRN: {selectedInvoice.patientMRN}</span>
                </div>

                {selectedInvoice.status !== 'Paid' && (
                  <div className="flex flex-wrap gap-2 text-xs font-sans">
                    {/* Add charge item */}
                    <button 
                      id="btn-add-charge-item-open"
                      onClick={() => setShowAddItem(true)}
                      className="px-3 py-2 bg-slate-100 hover:bg-slate-200 text-slate-600 font-semibold rounded-lg cursor-pointer"
                    >
                      + Charge Item
                    </button>
                    {/* Ins split */}
                    <button 
                      id="btn-insurance-claim-open"
                      onClick={() => setShowInsurance(true)}
                      className="px-3 py-2 bg-indigo-50 hover:bg-indigo-100 text-indigo-700 font-semibold rounded-lg cursor-pointer flex items-center gap-1"
                    >
                      <ShieldCheck className="w-3.5 h-3.5" />
                      <span>Co-insurance</span>
                    </button>
                    {/* Settle pay */}
                    <button 
                      id="btn-pay-invoice-open"
                      onClick={() => {
                        setPayAmount(Math.max(0, (selectedInvoice.total || 0) - (selectedInvoice.paidAmount || 0)));
                        setShowPayment(true);
                      }}
                      className="px-4 py-2 bg-blue-600 hover:bg-blue-700 active-bounce cursor-pointer text-white font-semibold rounded-lg cursor-pointer shadow-sm"
                    >
                      Post Payment
                    </button>
                  </div>
                )}
              </div>

              {/* itemized billing lists */}
              <div className="space-y-3 font-sans text-xs">
                <span className="text-[10px] font-mono font-bold text-slate-400 uppercase block tracking-wider">Itemised invoice procedures</span>
                <div className="border border-slate-100 rounded-xl overflow-hidden divide-y divide-slate-100">
                  {selectedInvoice.items.map((item, idx) => (
                    <div key={idx} className="p-3.5 bg-white flex justify-between items-center text-slate-700">
                      <div>
                        <strong className="font-medium text-slate-800 block text-[11px]">{item.description}</strong>
                        <span className="text-[9px] text-slate-400 font-light block font-mono capitalize">Cat: {item.category}</span>
                      </div>
                      <span className="font-mono font-semibold text-slate-700">Rs. {item.amount.toFixed(2)}</span>
                    </div>
                  ))}
                </div>
              </div>

              {/* Financial statement sums and distributions */}
              <div className="bg-slate-50 p-5 rounded-2xl border border-slate-100 space-y-3 font-sans text-xs">
                <span className="text-[10px] font-mono font-bold text-slate-400 uppercase tracking-wider block">Statement financial balance distribution</span>
                
                <div className="space-y-2 border-b border-slate-100 pb-3">
                  <div className="flex justify-between">
                    <span className="text-slate-500">Subtotal Procedures Charges:</span>
                    <span className="font-mono font-semibold">Rs. {(selectedInvoice.subtotal || selectedInvoice.total || 0).toFixed(2)}</span>
                  </div>
                  {selectedInvoice.tax > 0 && (
                    <div className="flex justify-between text-slate-500">
                      <span>Tax / GST ({((selectedInvoice.tax / (selectedInvoice.subtotal || 1)) * 100).toFixed(0)}%):</span>
                      <span className="font-mono">Rs. {(selectedInvoice.tax || 0).toFixed(2)}</span>
                    </div>
                  )}
                  {selectedInvoice.status === 'InsuranceClaimed' && selectedInvoice.insuranceProvider && (
                    <div className="flex justify-between text-indigo-600 font-medium">
                      <span className="flex items-center gap-1"><ShieldCheck className="w-3.5 h-3.5" /> Insurance Claim Submitted:</span>
                      <span className="font-mono font-semibold text-indigo-500">{selectedInvoice.claimStatus || 'Submitted'}</span>
                    </div>
                  )}
                  <div className="flex justify-between text-emerald-600 font-semibold">
                    <span>Direct Receipts Posted:</span>
                    <span className="font-mono">-Rs. {(selectedInvoice.paidAmount || 0).toFixed(2)}</span>
                  </div>
                </div>

                <div className="flex justify-between text-sm pt-1">
                  <strong className="text-slate-700">Total Settlement Balance Due:</strong>
                  <span className="font-mono font-bold text-blue-600">
                    Rs. {Math.max(0, (selectedInvoice.total || 0) - (selectedInvoice.paidAmount || 0)).toFixed(2)}
                  </span>
                </div>

                {selectedInvoice.insuranceProvider && (
                  <div className="bg-white/80 border border-slate-100/50 rounded-xl p-3 text-[10px] font-mono text-slate-400 space-y-1">
                    <span className="text-slate-500 font-sans font-semibold uppercase text-[9px] block">Co-pay Insurance coordination details</span>
                    <p className="text-slate-600">Carrier: <strong className="text-slate-800">{selectedInvoice.insuranceProvider}</strong></p>
                    <p className="text-slate-600">Policy Identifier: <strong className="text-slate-800">{selectedInvoice.policyNumber || 'N/A'}</strong></p>
                    <p className="text-slate-600">Claim Status: <strong className="text-indigo-700">{selectedInvoice.claimStatus || 'Draft'}</strong></p>
                  </div>
                )}
              </div>
            </div>
          )}
        </div>
      </div>

      {/* ADD BILLING ITEM MODAL FORMS */}
      {showAddItem && (
        <div id="add-billing-item-modal" className="fixed inset-0 bg-slate-900/60 z-50 flex items-center justify-center p-4 backdrop-blur-2xs">
          <div className="bg-white rounded-2xl w-full max-w-sm shadow-xl overflow-hidden animate-scale-up">
            <div className="px-6 py-4 bg-blue-600 border-b border-blue-700 flex items-center justify-between text-white">
              <h3 className="font-display font-medium text-sm">Add custom itemised procedures item</h3>
              <button onClick={() => setShowAddItem(false)} className="text-blue-200 hover:text-white cursor-pointer"><X className="w-5 h-5" /></button>
            </div>
            <form onSubmit={submitAddItem} className="p-6 space-y-4 text-xs font-sans">
              
              <div className="space-y-1">
                <label className="text-slate-500 font-semibold">Procedure / Item Description *</label>
                <input 
                  required
                  id="txt-billing-item-desc"
                  type="text" 
                  value={itemDesc} 
                  onChange={e => setItemDesc(e.target.value)} 
                  className="w-full text-xs p-2.5 border border-slate-200 rounded-lg focus:outline-none"
                  placeholder="e.g. Specialty consultation fee, physiotherapy workout..."
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1">
                  <label className="text-slate-500 font-semibold">Procedure category</label>
                  <select value={itemCat} onChange={e => setItemCat(e.target.value as any)} className="w-full text-xs p-2.5 border border-slate-200 rounded-lg">
                    <option value="Consultation">Consultation</option>
                    <option value="Pharmacy">Pharmacy</option>
                    <option value="Laboratory">Laboratory</option>
                    <option value="WardAccommodation">Ward Accommodation</option>
                    <option value="Other">Other</option>
                  </select>
                </div>
                <div className="space-y-1">
                  <label className="text-slate-500 font-semibold">Amount Charge (PKR) *</label>
                  <input 
                    required
                    id="txt-billing-item-amt"
                    type="number" 
                    value={itemCharge} 
                    onChange={e => setItemCharge(Number(e.target.value))} 
                    className="w-full text-xs p-2.5 border border-slate-200 rounded-lg"
                  />
                </div>
              </div>

              <div className="flex items-center justify-end gap-3 pt-4 border-t border-slate-100">
                <button type="button" onClick={() => setShowAddItem(false)} className="px-4 py-2 text-slate-400">Cancel</button>
                <button type="submit" id="btn-save-billing-item" className="px-5 py-2 bg-blue-600 hover:bg-blue-700 active-bounce cursor-pointer text-white rounded-lg shadow-sm">Post Charge</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* POST PAYMENT STATEMENT FORMS */}
      {showPayment && (
        <div id="post-payment-modal" className="fixed inset-0 bg-slate-900/60 z-50 flex items-center justify-center p-4 backdrop-blur-2xs">
          <div className="bg-white rounded-2xl w-full max-w-sm shadow-xl overflow-hidden animate-scale-up">
            <div className="px-6 py-4 bg-blue-600 border-b border-blue-700 flex items-center justify-between text-white">
              <h3 className="font-display font-medium text-sm">Post Receipt Cash Settle</h3>
              <button onClick={() => setShowPayment(false)} className="text-blue-200 hover:text-white cursor-pointer"><X className="w-5 h-5" /></button>
            </div>
            <form onSubmit={submitPayment} className="p-6 space-y-4 text-xs font-sans">
              
              <div className="space-y-1">
                <label className="text-slate-500 font-semibold">Receipt Settlement Amount (PKR) *</label>
                <input 
                  required
                  id="txt-billing-pay-amt"
                  type="number" 
                  value={payAmount} 
                  onChange={e => setPayAmount(Number(e.target.value))} 
                  className="w-full text-xs p-2.5 border border-slate-200 rounded-lg"
                />
              </div>

              <div className="space-y-1">
                <label className="text-slate-500 font-semibold">Settlement Mechanism / Method</label>
                <select value={payMethod} onChange={e => setPayMethod(e.target.value as any)} className="w-full text-xs p-2.5 border border-slate-200 rounded-lg">
                  <option value="Cash">Cash Currency</option>
                  <option value="Card">Visa/Mastercard Online POS</option>
                  <option value="Transfer">Bank ACH Wire Transfer</option>
                </select>
              </div>

              <div className="flex items-center justify-end gap-3 pt-4 border-t border-slate-100 animate-fade-in">
                <button type="button" onClick={() => setShowPayment(false)} className="px-4 py-2 text-slate-400">Cancel</button>
                <button type="submit" id="btn-save-payment" className="px-5 py-2 bg-blue-600 hover:bg-blue-700 active-bounce cursor-pointer text-white rounded-lg shadow-md font-semibold">Verify Receipt</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* CO-INSURANCE CLAIM PROCESSING FORMS */}
      {showInsurance && (
        <div id="insurance-split-modal" className="fixed inset-0 bg-slate-900/60 z-50 flex items-center justify-center p-4 backdrop-blur-2xs">
          <div className="bg-white rounded-2xl w-full max-w-sm shadow-xl overflow-hidden animate-scale-up">
            <div className="px-6 py-4 bg-blue-600 border-b border-blue-700 flex items-center justify-between text-white">
              <h3 className="font-display font-medium text-sm">Post Co-Insurance Coordination split</h3>
              <button onClick={() => setShowInsurance(false)} className="text-blue-200 hover:text-white cursor-pointer"><X className="w-5 h-5" /></button>
            </div>
            <form onSubmit={submitInsuranceClaim} className="p-6 space-y-4 text-xs font-sans">
              
              <div className="space-y-1">
                <label className="text-slate-500 font-semibold">Insurance Carrier Corp *</label>
                <input 
                  required
                  id="txt-billing-ins-provider"
                  type="text" 
                  value={insProvider} 
                  onChange={e => setInsProvider(e.target.value)} 
                  className="w-full text-xs p-2.5 border border-slate-200 rounded-lg"
                  placeholder="e.g. Blue Shield Health"
                />
              </div>

              <div className="space-y-1">
                <label className="text-slate-500 font-semibold">Policy Allocation Identifying Code *</label>
                <input 
                  required
                  id="txt-billing-ins-policy"
                  type="text" 
                  value={insPolicyNo} 
                  onChange={e => setInsPolicyNo(e.target.value)} 
                  className="w-full text-xs p-2.5 border border-slate-200 rounded-lg"
                  placeholder="POL-888-AB"
                />
              </div>

              <div className="space-y-1">
                <label className="text-slate-500 font-semibold">Insurance Split coverage percentage % *</label>
                <input 
                  required
                  id="txt-billing-ins-percentage"
                  type="number" 
                  value={insSplitScore} 
                  onChange={e => setInsSplitScore(Number(e.target.value))} 
                  className="w-full text-xs p-2.5 border border-slate-200 rounded-lg font-mono font-semibold"
                  min="0"
                  max="100"
                />
              </div>

              <div className="flex items-center justify-end gap-3 pt-4 border-t border-slate-100">
                <button type="button" onClick={() => setShowInsurance(false)} className="px-4 py-2 text-slate-400">Cancel</button>
                <button type="submit" id="btn-save-insurance" className="px-5 py-2 bg-indigo-600 hover:bg-indigo-700 font-semibold text-white rounded-lg shadow-sm">Claim Insurance</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

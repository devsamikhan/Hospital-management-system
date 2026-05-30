/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import { 
  Pill, 
  Search, 
  AlertTriangle, 
  Calendar, 
  DollarSign, 
  Plus, 
  ClipboardCopy, 
  X, 
  AlertOctagon, 
  ShoppingBag,
  Clock,
  BriefcaseMedical
} from 'lucide-react';
import { useHospital } from '../context/HospitalContext';
import { InventoryItem } from '../types';

export default function PharmacyInventoryManagement() {
  const { 
    inventory, 
    addInventoryItem, 
    updateInventoryItem, 
    patients, 
    dispenseMedication, 
    setError 
  } = useHospital();

  const [drugSearch, setDrugSearch] = useState('');
  const [showAddModal, setShowAddModal] = useState(false);
  const [showDispenseModal, setShowDispenseModal] = useState(false);

  // New Formulation Form States
  const [name, setName] = useState('');
  const [genericName, setGenericName] = useState('');
  const [category, setCategory] = useState('Antibiotics');
  const [unitPrice, setUnitPrice] = useState<number>(10);
  const [stockQuantity, setStockQuantity] = useState<number>(100);
  const [minStockLevel, setMinStockLevel] = useState<number>(20);
  const [expiryDate, setExpiryDate] = useState('2028-01-01');
  const [supplier, setSupplier] = useState('Global Pharma Distributors');

  // Dispensing Form States
  const [dispensePatientId, setDispensePatientId] = useState('');
  const [dispenseMedId, setDispenseMedId] = useState('');
  const [dispenseQty, setDispenseQty] = useState<number>(10);

  const filteredInventory = inventory.filter(drag => 
    drag.name.toLowerCase().includes(drugSearch.toLowerCase()) ||
    drag.genericName.toLowerCase().includes(drugSearch.toLowerCase()) ||
    drag.category.toLowerCase().includes(drugSearch.toLowerCase())
  );

  const lowStockDrugs = inventory.filter(drag => drag.stockQuantity <= drag.minStockLevel);
  const expiringDrugs = inventory.filter(drag => {
    const expDate = new Date(drag.expiryDate);
    const limitDate = new Date("2026-07-01"); // our current operational limit
    return expDate < limitDate;
  });

  const submitAddFormulation = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name || !genericName || !expiryDate || !supplier) {
      setError("Please key in molecule name, generic variant, and expiry details.");
      return;
    }
    const succ = await addInventoryItem({
      name,
      genericName,
      category,
      unitPrice: Number(unitPrice),
      stockQuantity: Number(stockQuantity),
      minStockLevel: Number(minStockLevel),
      expiryDate,
      supplier
    });

    if (succ) {
      setShowAddModal(false);
      setName('');
      setGenericName('');
    }
  };

  const submitDispensation = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!dispensePatientId || !dispenseMedId || !dispenseQty || dispenseQty <= 0) {
      setError("Specify patient MRN, drug formulation, and non-zero positive quantity.");
      return;
    }
    const succ = await dispenseMedication({
      patientId: dispensePatientId,
      medicineId: dispenseMedId,
      quantity: Number(dispenseQty)
    });
    if (succ) {
      setShowDispenseModal(false);
      setDispensePatientId('');
      setDispenseMedId('');
      setDispenseQty(10);
    }
  };

  return (
    <div id="hms-pharmacy-workspace" className="space-y-6">
      
      {/* Stock warning notifications bar */}
      <div id="pharmacy-alerts-row" className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {lowStockDrugs.length > 0 && (
          <div className="bg-amber-50 border border-amber-200 rounded-2xl p-4 flex items-start gap-3">
            <AlertTriangle className="w-5 h-5 text-amber-500 shrink-0 mt-0.5" />
            <div className="text-xs font-sans">
              <span className="font-semibold text-amber-800">Low Stock Warning ({lowStockDrugs.length} Items)</span>
              <p className="text-amber-600 mt-1">The medicines <strong>{lowStockDrugs.map(l => l.name).join(', ')}</strong> have dropped below safety thresholds.</p>
            </div>
          </div>
        )}

        {expiringDrugs.length > 0 && (
          <div className="bg-rose-50 border border-rose-200 rounded-2xl p-4 flex items-start gap-3">
            <AlertOctagon className="w-5 h-5 text-rose-500 shrink-0 mt-0.5" />
            <div className="text-xs font-sans">
              <span className="font-semibold text-rose-800">Critical Expiry Warning ({expiringDrugs.length} Items)</span>
              <p className="text-rose-600 mt-1">The medicines <strong>{expiringDrugs.map(l => l.name).join(', ')}</strong> are nearing expiry.</p>
            </div>
          </div>
        )}
      </div>

      {/* Toolbar */}
      <div id="pharmacy-toolbar" className="bg-white/90 backdrop-blur-xs border border-slate-100/70 rounded-2xl shadow-sm hover:shadow-md hover:border-slate-200/50 transition-all duration-300 p-4 flex flex-col md:flex-row items-center justify-between gap-4">
        <div className="relative w-full md:w-80">
          <Search className="absolute left-3 top-2.5 w-4 h-4 text-slate-400" />
          <input 
            id="txt-pharmacy-search"
            type="text" 
            placeholder="Search catalog by name, generic, category..." 
            value={drugSearch}
            onChange={e => setDrugSearch(e.target.value)}
            className="w-full pl-9 pr-4 py-2 border border-slate-200 rounded-xl text-xs focus:ring-1 focus:ring-blue-500 focus:outline-none focus:ring-slate-400"
          />
        </div>

        <div className="flex gap-2 w-full md:w-auto">
          {/* Dispensation trigger */}
          <button 
            id="btn-dispense-open"
            onClick={() => setShowDispenseModal(true)}
            className="flex-1 md:flex-none flex items-center justify-center gap-1.5 px-4 py-2.5 bg-slate-800 hover:bg-slate-900 font-sans text-white text-xs font-medium rounded-xl cursor-pointer shadow-sm transition-all"
          >
            <ShoppingBag className="w-4 h-4" />
            <span>Dispense Prescriptions</span>
          </button>

          {/* New Drag trigger */}
          <button 
            id="btn-add-drug-open"
            onClick={() => setShowAddModal(true)}
            className="flex-1 md:flex-none flex items-center justify-center gap-1.5 px-4 py-2.5 bg-blue-600 hover:bg-blue-700 font-sans text-white text-xs font-semibold rounded-xl cursor-pointer shadow-sm transition-all"
          >
            <Plus className="w-4 h-4" />
            <span>New Formulation</span>
          </button>
        </div>
      </div>

      {/* Roster database table */}
      <div id="pharmacy-ledger-card" className="bg-white/90 backdrop-blur-xs border border-slate-100/70 rounded-2xl shadow-sm hover:shadow-md hover:border-slate-200/50 transition-all duration-300 p-6 space-y-4">
        <div className="flex items-center justify-between border-b border-slate-50 pb-4">
          <div className="flex items-center gap-2">
            <Pill className="w-5 h-5 text-blue-600" />
            <h3 className="font-display font-medium text-sm text-slate-800">Pharmacy Medicine Inventory Logs</h3>
          </div>
          <span className="text-[10px] text-slate-400 font-mono">Formulations database code line: {inventory.length}</span>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs font-sans divide-y divide-slate-100">
            <thead>
              <tr className="text-slate-400 font-semibold uppercase tracking-wider text-[10px]">
                <th className="py-3 px-4">Medicine (Generic Name)</th>
                <th className="py-3 px-4">Category</th>
                <th className="py-3 px-4">Unit Charge</th>
                <th className="py-3 px-4">Stock Qty</th>
                <th className="py-3 px-4">Expiry Date</th>
                <th className="py-3 px-4">Supplier Distributor</th>
                <th className="py-3 px-4 text-right">Alarm</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 text-slate-600 bg-white">
              {filteredInventory.map(drug => {
                const isLow = drug.stockQuantity <= drug.minStockLevel;
                const isExp = new Date(drug.expiryDate) < new Date("2026-07-01");
                return (
                  <tr key={drug.id} id={`drug-row-${drug.id}`} className="hover:bg-slate-50/30">
                    <td className="py-3.5 px-4 font-sans">
                      <strong className="text-slate-800 font-semibold text-xs block">{drug.name}</strong>
                      <span className="text-[10px] text-slate-400 block font-light">Generic: {drug.genericName}</span>
                    </td>
                    <td className="py-3.5 px-4 font-medium text-slate-500">
                      {drug.category}
                    </td>
                    <td className="py-3.5 px-4 font-mono font-semibold text-slate-700">
                      Rs. {drug.unitPrice.toFixed(2)}
                    </td>
                    <td className="py-3.5 px-4 font-mono">
                      <span className={`px-2 py-0.5 rounded-md font-semibold ${isLow ? 'bg-amber-100 text-amber-700' : 'bg-slate-100 text-slate-700'}`}>
                        {drug.stockQuantity} Left
                      </span>
                    </td>
                    <td className="py-3.5 px-4 font-mono">
                      <span className={`${isExp ? 'text-rose-600 font-semibold' : 'text-slate-500'}`}>{drug.expiryDate}</span>
                    </td>
                    <td className="py-3.5 px-4 text-slate-400">
                      {drug.supplier}
                    </td>
                    <td className="py-3.5 px-4 text-right">
                      {isLow || isExp ? (
                        <span className="inline-flex items-center gap-1.5 px-2 py-0.5 bg-rose-50 text-rose-600 border border-rose-100 text-[9px] rounded font-mono font-bold uppercase tracking-wider animate-pulse">
                          <AlertTriangle className="w-3 h-3" />
                          <span>Needs Attention</span>
                        </span>
                      ) : (
                        <span className="text-slate-300 font-mono text-[10px]">Normal</span>
                      )}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

      {/* DISPENSING CONVERSATION MODAL WINDOW */}
      {showDispenseModal && (
        <div id="dispensation-modal" className="fixed inset-0 bg-slate-900/60 z-50 flex items-center justify-center p-4 backdrop-blur-2xs">
          <div className="bg-white rounded-2xl w-full max-w-md shadow-xl overflow-hidden animate-scale-up">
            <div className="px-6 py-4 bg-slate-800 border-b border-slate-900 flex items-center justify-between text-white">
              <h3 className="font-display font-medium text-sm">Dispense Patients Medical Prescriptions</h3>
              <button onClick={() => setShowDispenseModal(false)} className="text-slate-400 hover:text-white cursor-pointer"><X className="w-5 h-5" /></button>
            </div>
            <form onSubmit={submitDispensation} className="p-6 space-y-4 font-sans text-xs">
              
              {/* Patient Selector */}
              <div className="space-y-1">
                <label className="text-slate-500 font-semibold">Select Patient (MRN) *</label>
                <select 
                  required
                  id="ddl-disp-patient"
                  value={dispensePatientId} 
                  onChange={e => setDispensePatientId(e.target.value)} 
                  className="w-full text-xs p-2.5 bg-white border border-slate-200 rounded-lg"
                >
                  <option value="">-- Select Patient --</option>
                  {patients.filter(p => !p.isArchived).map(p => (
                    <option key={p.id} value={p.id}>{p.name} ({p.id})</option>
                  ))}
                </select>
              </div>

              {/* Medicine Molecule Selector */}
              <div className="space-y-1">
                <label className="text-slate-500 font-semibold">Select Medicine Molecule *</label>
                <select 
                  required
                  id="ddl-disp-med"
                  value={dispenseMedId} 
                  onChange={e => setDispenseMedId(e.target.value)} 
                  className="w-full text-xs p-2.5 bg-white border border-slate-200 rounded-lg"
                >
                  <option value="">-- Choose Stock Medicine --</option>
                  {inventory.map(d => (
                    <option key={d.id} value={d.id}>{d.name} (Available: {d.stockQuantity} units @ Rs. {d.unitPrice}/ea)</option>
                  ))}
                </select>
              </div>

              {/* Quantity input */}
              <div className="space-y-1">
                <label className="text-slate-500 font-semibold">Quantity to Dispense *</label>
                <input 
                  required
                  id="txt-disp-qty"
                  type="number" 
                  value={dispenseQty} 
                  onChange={e => setDispenseQty(Number(e.target.value))} 
                  className="w-full text-xs p-2.5 border border-slate-200 rounded-lg"
                  min="1"
                />
              </div>

      {/* Secure reminder */}
              <div className="bg-slate-50 p-3 rounded-lg border border-slate-100 flex items-center gap-2 font-mono text-[10px] text-slate-400">
                <BriefcaseMedical className="w-4 h-4 text-slate-400 shrink-0" />
                <span>Executing dispensation automatically subtracts stock and writes appropriate ledger item to patient charges.</span>
              </div>

              <div className="flex items-center justify-end gap-3 pt-4 border-t border-slate-100">
                <button type="button" onClick={() => setShowDispenseModal(false)} className="px-4 py-2 text-slate-500 hover:text-slate-700">Cancel</button>
                <button type="submit" id="btn-confirm-dispense animate-pulse" className="px-5 py-2 bg-blue-600 hover:bg-blue-700 active-bounce cursor-pointer text-white font-semibold rounded-lg shadow-sm">Dispense</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* NEW MOLECULE FORMULATION ADD MODAL */}
      {showAddModal && (
        <div id="add-formulation-modal" className="fixed inset-0 bg-slate-900/60 z-50 flex items-center justify-center p-4 backdrop-blur-2xs">
          <div className="bg-white rounded-2xl w-full max-w-md shadow-xl overflow-hidden animate-scale-up">
            <div className="px-6 py-4 bg-blue-600 border-b border-blue-700 flex items-center justify-between text-white">
              <h3 className="font-display font-medium text-sm">Add New Formulation to Stock</h3>
              <button onClick={() => setShowAddModal(false)} className="text-blue-200 hover:text-white cursor-pointer"><X className="w-5 h-5" /></button>
            </div>
            <form onSubmit={submitAddFormulation} className="p-6 space-y-4 text-xs font-sans">
              
              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1 col-span-2">
                  <label className="text-slate-500 font-semibold">Medicine Formulation Name *</label>
                  <input required type="text" value={name} onChange={e => setName(e.target.value)} className="w-full text-xs p-2 border border-slate-200 rounded-lg" placeholder="Amoxicillin 500mg" />
                </div>
                <div className="space-y-1 col-span-2">
                  <label className="text-slate-500 font-semibold">Generic Biological Active Variant *</label>
                  <input required type="text" value={genericName} onChange={e => setGenericName(e.target.value)} className="w-full text-xs p-2 border border-slate-200 rounded-lg" placeholder="Amoxicillin Trihydrate" />
                </div>
                <div className="space-y-1">
                  <label className="text-slate-500 font-semibold">Category Category</label>
                  <select value={category} onChange={e => setCategory(e.target.value)} className="w-full text-xs p-2 border border-slate-200 rounded-lg">
                    {['Antibiotics', 'Analgesics', 'Antidiabetics', 'Cardiovascular', 'Antipyretics', 'Other'].map(cat => (
                      <option key={cat} value={cat}>{cat}</option>
                    ))}
                  </select>
                </div>
                <div className="space-y-1">
                  <label className="text-slate-500 font-semibold">Unit Sales Charge (PKR) *</label>
                  <input required type="number" step="0.01" value={unitPrice} onChange={e => setUnitPrice(Number(e.target.value))} className="w-full text-xs p-2 border border-slate-200 rounded-lg" />
                </div>
                <div className="space-y-1">
                  <label className="text-slate-500 font-semibold">Stock Initial Quantity *</label>
                  <input required type="number" value={stockQuantity} onChange={e => setStockQuantity(Number(e.target.value))} className="w-full text-xs p-2 border border-slate-200 rounded-lg" />
                </div>
                <div className="space-y-1">
                  <label className="text-slate-500 font-semibold">Reorder Threshold Min</label>
                  <input required type="number" value={minStockLevel} onChange={e => setMinStockLevel(Number(e.target.value))} className="w-full text-xs p-2 border border-slate-200 rounded-lg" />
                </div>
                <div className="space-y-1">
                  <label className="text-slate-500 font-semibold">Expiry Date *</label>
                  <input required type="date" value={expiryDate} onChange={e => setExpiryDate(e.target.value)} className="w-full text-xs p-2 border border-slate-200 rounded-lg" />
                </div>
                <div className="space-y-1">
                  <label className="text-slate-500 font-semibold">Manufacturer / Supplier *</label>
                  <input required type="text" value={supplier} onChange={e => setSupplier(e.target.value)} className="w-full text-xs p-2 border border-slate-200 rounded-lg" />
                </div>
              </div>

              <div className="flex items-center justify-end gap-3 pt-4 border-t border-slate-100">
                <button type="button" onClick={() => setShowAddModal(false)} className="px-4 py-2 text-slate-500 hover:text-slate-700">Cancel</button>
                <button type="submit" className="px-4 py-2 bg-blue-600 hover:bg-blue-700 active-bounce cursor-pointer text-white rounded-lg shadow-sm">Save Formulation</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

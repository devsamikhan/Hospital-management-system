// File: src/server/routes/clinical.routes.ts
import { Router, Request, Response } from 'express';
import crypto from 'crypto';
import { dbService, db } from '../db';
import { authenticateToken, logAudit } from './auth.routes';
import { LabOrderSummary, InvoiceItem } from '../../types';

export const clinicalRouter = Router();

// Retrieve encounters for a patient chronologically
clinicalRouter.get('/patient/:patientId', authenticateToken, async (req: Request, res: Response) => {
  try {
    const encounters = await dbService.getEncountersByPatient(req.params.patientId);
    const reqUser = (req as any).user;
    await logAudit(
      reqUser.id,
      reqUser.username,
      reqUser.role,
      'VIEW_PATIENT_CLINICAL_HIS',
      `Chronologically listed clinical encounter history for ${req.params.patientId}`,
      req.params.patientId
    );
    res.json(encounters);
  } catch (err: any) {
    res.status(500).json({ message: "Encounter history query failure", error: err.message });
  }
});

// Create new clinical encounter with SOAP progress note, vitals, presc, lab orders & auto consultant fee invoice
clinicalRouter.post('/', authenticateToken, async (req: Request, res: Response) => {
  const { patientId, vitals, soap, prescriptions, labOrders } = req.body;
  const reqUser = (req as any).user;

  if (reqUser.role !== 'Doctor' && reqUser.role !== 'Admin') {
    return res.status(403).json({ message: "Access unauthorized: Only certified physicians write SOAP clinical progress encounters" });
  }

  if (!patientId || !vitals || !soap) {
    return res.status(400).json({ message: "Missing required vitals or subjective/objective SOAP notes" });
  }

  try {
    const patient = await dbService.getPatientById(patientId);
    if (!patient) return res.status(404).json({ message: "Patient MRN is invalid" });

    const encounterId = `e-${crypto.randomUUID()}`;
    const formattedLabOrders: LabOrderSummary[] = [];
    const fullLabOrderPayloads: any[] = [];

    if (labOrders && Array.isArray(labOrders)) {
      labOrders.forEach((lOrder: any) => {
        const lId = `lab-${crypto.randomUUID()}`;
        fullLabOrderPayloads.push({
          id: lId,
          patientId,
          patientName: patient.name,
          patientMRN: patient.id,
          doctorId: reqUser.id,
          doctorName: reqUser.name,
          encounterId,
          testName: lOrder.testName,
          category: lOrder.category || 'Other',
          status: 'Ordered',
          statusHistory: [
            {
              status: 'Ordered',
              timestamp: new Date().toISOString(),
              changedBy: reqUser.name,
              comments: "Lab order requested by Doctor"
            }
          ]
        });
        formattedLabOrders.push({ id: lId, testName: lOrder.testName });
      });
    }

    const formattedPrescriptions = (prescriptions || []).map((p: any) => ({
      medicineId: p.medicineId,
      name: p.name,
      dosage: p.dosage,
      frequency: p.frequency,
      duration: p.duration,
      dispensed: false,
      notes: p.notes || ""
    }));

    const newEncounter = {
      id: encounterId,
      patientId,
      doctorId: reqUser.id,
      doctorName: reqUser.name,
      date: new Date().toISOString(),
      vitals,
      soap,
      prescriptions: formattedPrescriptions,
      labOrders: formattedLabOrders,
      createdAt: new Date().toISOString()
    };

    await dbService.insertEncounter(newEncounter, formattedPrescriptions, fullLabOrderPayloads);

    // Auto Generate billing charge for Consultation Encounter with PKR currency matching
    const invoicesSnapshot = await db.collection('invoices').get();
    const invoiceId = `INV-${10000 + invoicesSnapshot.size + 1}`;
    const baseDoctorFee = reqUser.consultationFee || 100;

    const invoiceItems: InvoiceItem[] = [
      { description: `Physician consultation encounter - ${reqUser.name}`, amount: baseDoctorFee, category: 'Consultation' }
    ];

    if (formattedLabOrders.length > 0) {
      formattedLabOrders.forEach(ord => {
        invoiceItems.push({
          description: `Lab diagnostics - ${ord.testName}`,
          amount: 45.00,
          category: 'Laboratory'
        });
      });
    }

    const settings = await dbService.getSettings();
    const subtotal = invoiceItems.reduce((acc, curr) => acc + curr.amount, 0);
    const tax = Number((subtotal * settings.taxRate).toFixed(2));
    const total = Number((subtotal + tax).toFixed(2));

    const newInvoice = {
      id: invoiceId,
      patientId,
      patientName: patient.name,
      patientMRN: patient.id,
      encounterId,
      items: invoiceItems,
      subtotal,
      tax,
      total,
      paidAmount: 0.00,
      status: 'Unpaid',
      createdAt: new Date().toISOString()
    };

    await db.collection('invoices').doc(invoiceId).set(newInvoice);

    await logAudit(
      reqUser.id,
      reqUser.username,
      reqUser.role,
      'CREATE_CLINICAL_ENCOUNTER',
      `Recorded SOAP Clinical documentation & consultation fee invoice generated under MRN: ${patientId}`,
      patientId
    );

    res.status(201).json({ encounter: newEncounter, invoice: newInvoice });
  } catch (err: any) {
    res.status(500).json({ message: "Consultation logging pipeline failed", error: err.message });
  }
});

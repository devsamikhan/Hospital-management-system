// File: src/server/routes/inpatient.routes.ts
import { Router, Request, Response } from 'express';
import crypto from 'crypto';
import { dbService, db } from '../db';
import { authenticateToken, logAudit } from './auth.routes';

export const inpatientRouter = Router();

// Retrieve all inpatient department (IPD) bed registries
inpatientRouter.get('/beds', authenticateToken, async (req: Request, res: Response) => {
  try {
    const beds = await dbService.getBeds();
    res.json(beds);
  } catch (err: any) {
    res.status(500).json({ message: "Failed to list beds", error: err.message });
  }
});

// Retrieve all inpatient admissions list
inpatientRouter.get('/admissions', authenticateToken, async (req: Request, res: Response) => {
  try {
    const list = await dbService.getAdmissions();
    res.json(list);
  } catch (err: any) {
    res.status(500).json({ message: "Failed to fetch admissions", error: err.message });
  }
});

// Register patient IPD admission and assign vacant clinical bed
inpatientRouter.post('/admissions', authenticateToken, async (req: Request, res: Response) => {
  const reqUser = (req as any).user;
  const { patientId, bedId } = req.body;
  if (!patientId || !bedId) return res.status(400).json({ message: "Specify clinical patient MRN and target clinical bed index" });

  try {
    const patient = await dbService.getPatientById(patientId);
    const beds = await dbService.getBeds();
    const bed = beds.find((b: any) => b.id === bedId);

    if (!patient || !bed) return res.status(404).json({ message: "Invalid Patient MRN or Bed Code referenced" });
    if (bed.status !== 'Vacant') return res.status(400).json({ message: "Assigned bed is already occupied or under servicing/maintenance." });

    // Update Bed state
    await dbService.occupyBed(bedId, patientId);

    const admissionId = `adm-${crypto.randomUUID()}`;
    const newAdmission = {
      id: admissionId,
      patientId,
      bedId: bed.id,
      wardName: bed.wardName,
      bedNumber: bed.bedNumber,
      admissionDate: new Date().toISOString(),
      status: 'Admitted'
    };

    await dbService.insertAdmission(newAdmission);

    await logAudit(
      reqUser.id,
      reqUser.username,
      reqUser.role,
      'IPD_PATIENT_ADMISSION',
      `Admitted patient: ${patient.name} to bed: ${bed.bedNumber} in ${bed.wardName}`,
      patientId
    );
    res.status(201).json({ ...newAdmission, patientName: patient.name, patientMRN: patient.id });
  } catch (err: any) {
    res.status(500).json({ message: "Admission failed", error: err.message });
  }
});

// Post nursing clinical bedside progress chart notes
inpatientRouter.post('/admissions/:id/nursing-notes', authenticateToken, async (req: Request, res: Response) => {
  const { text } = req.body;
  const reqUser = (req as any).user;
  if (!text) return res.status(400).json({ message: "Clinical note description is empty" });

  try {
    const note = {
      id: `nn-${crypto.randomUUID()}`,
      admissionId: req.params.id,
      text,
      nurseId: reqUser.id,
      nurseName: reqUser.name
    };
    await dbService.addNursingNote(note);

    await logAudit(
      reqUser.id,
      reqUser.username,
      reqUser.role,
      'ADD_IPD_NURSING_NOTE',
      `Added nursing progress clinical status for admission id: ${req.params.id}`
    );
    res.json(note);
  } catch (err: any) {
    res.status(500).json({ message: "Failed to append nursing note", error: err.message });
  }
});

// Post daily physician bedside rounds clinical notes
inpatientRouter.post('/admissions/:id/progress-notes', authenticateToken, async (req: Request, res: Response) => {
  const { text } = req.body;
  const reqUser = (req as any).user;
  if (!text) return res.status(400).json({ message: "Clinical note description is empty" });

  try {
    const note = {
      id: `pn-${crypto.randomUUID()}`,
      admissionId: req.params.id,
      text,
      staffId: reqUser.id,
      staffName: reqUser.name
    };
    await dbService.addProgressNote(note);

    await logAudit(
      reqUser.id,
      reqUser.username,
      reqUser.role,
      'ADD_IPD_PROGRESS_NOTE',
      `Added daily bedside doctor progress note for admission id: ${req.params.id}`
    );
    res.json(note);
  } catch (err: any) {
    res.status(500).json({ message: "Failed to append progress note", error: err.message });
  }
});

// Generate inpatient discharge summaries and trigger automated NoSQL Billing checkout calculations
inpatientRouter.post('/admissions/:id/discharge', authenticateToken, async (req: Request, res: Response) => {
  const reqUser = (req as any).user;
  const { diagnosis, treatmentSummary, dischargeInstructions, followUpDate } = req.body;

  if (!diagnosis || !treatmentSummary || !dischargeInstructions) {
    return res.status(400).json({ message: "Discharge parameters diagnosis and therapies description are required" });
  }

  try {
    const list = await dbService.getAdmissions();
    const admission = list.find((a: any) => a.id === req.params.id);
    if (!admission) return res.status(404).json({ message: "IPD Admission record not found" });
    if (admission.status === 'Discharged') {
      return res.status(400).json({ message: "Patient is already discharged." });
    }

    const settings = await dbService.getSettings();
    const taxRate = settings.taxRate || 0.05;

    // Call NoSQL Firestore discharge transaction
    const result = await dbService.dischargeAdmissionTransaction({
      admissionId: req.params.id,
      bedId: admission.bedId,
      diagnosis,
      treatment: treatmentSummary,
      instructions: dischargeInstructions,
      followUp: followUpDate,
      taxRate
    });

    await logAudit(
      reqUser.id,
      reqUser.username,
      reqUser.role,
      'DISCHARGE_PATIENT_SUMMARY',
      `Discharged patient: ${admission.patientName} & final bill generated under MRN: ${admission.patientId}`,
      admission.patientId
    );
    res.json({ success: true, result });
  } catch (err: any) {
    res.status(500).json({ message: err.message || "Discharge process failed" });
  }
});

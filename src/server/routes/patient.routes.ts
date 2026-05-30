// File: src/server/routes/patient.routes.ts
import { Router, Request, Response } from 'express';
import { dbService, db } from '../db';
import { authenticateToken, logAudit } from './auth.routes';

export const patientRouter = Router();

// ER waiting roster queue sorted by ESI level (1 is highest priority)
patientRouter.get('/er/queue', authenticateToken, async (req: Request, res: Response) => {
  try {
    const snapshot = await db.collection('patients')
      .where('triage_status', '==', 'ER Queue')
      .get();
      
    const queue = snapshot.docs.map(doc => {
      const p = doc.data();
      return {
        id: doc.id,
        name: p.name,
        gender: p.gender,
        dob: p.dob,
        esiLevel: p.esi_level,
        triageStatus: p.triage_status,
        triageNotes: p.triage_notes || "",
        triageScore: p.triage_score || 0,
        triageTimestamp: p.triage_timestamp || p.created_at
      };
    });
    
    // Sort by ESI Level ascending (1 = highest urgency), then by timestamp ascending
    queue.sort((a, b) => {
      if (a.esiLevel !== b.esiLevel) {
        return a.esiLevel - b.esiLevel;
      }
      return new Date(a.triageTimestamp).getTime() - new Date(b.triageTimestamp).getTime();
    });
    
    res.json(queue);
  } catch (err: any) {
    res.status(500).json({ message: "Failed to fetch ER queue roster", error: err.message });
  }
});

// ER Emergency Triage & ESI priority score assessment routing
patientRouter.post('/:id/triage', authenticateToken, async (req: Request, res: Response) => {
  const { id } = req.params;
  const { bp, heartRate, temperature, spo2, glasgowComaScale, notes } = req.body;
  
  if (!bp || !heartRate || !temperature || !spo2 || !glasgowComaScale) {
    return res.status(400).json({ message: "Vitals parameters are required for ESI triage assessment" });
  }
  
  try {
    const patient = await dbService.getPatientById(id);
    if (!patient) return res.status(404).json({ message: "Patient not found" });
    
    // Calculate ESI Priority Level (1 to 5) based on emergency vitals
    let esiLevel = 5; // default non-urgent
    let triageScore = 0;
    
    const hr = Number(heartRate);
    const temp = Number(temperature);
    const oxygen = Number(spo2);
    const gcs = Number(glasgowComaScale);
    
    if (gcs <= 8 || oxygen < 85 || hr > 140 || hr < 40) {
      // Immediate life-saving intervention required
      esiLevel = 1; 
      triageScore = 95;
    } else if (gcs <= 12 || oxygen < 90 || hr > 120 || temp > 40) {
      // High-risk situation or confused/lethargic
      esiLevel = 2;
      triageScore = 80;
    } else if (oxygen < 95 || hr > 100 || temp > 38.5) {
      // Stable vitals but requires multiple resources
      esiLevel = 3;
      triageScore = 55;
    } else if (temp > 37.5 || hr > 90) {
      // Requires one resource
      esiLevel = 4;
      triageScore = 30;
    } else {
      // No resource required
      esiLevel = 5;
      triageScore = 10;
    }
    
    // Update patient triage status and ESI priority in Firestore
    await db.collection('patients').doc(id).update({
      esi_level: esiLevel,
      triage_status: 'ER Queue',
      triage_notes: notes || "Triage ESI evaluated",
      triage_score: triageScore,
      triage_timestamp: new Date().toISOString()
    });
    
    const reqUser = (req as any).user;
    await logAudit(
      reqUser.id, 
      reqUser.username, 
      reqUser.role, 
      'EMERGENCY_TRIAGE_ESI', 
      `ESI priority Level ${esiLevel} triage assessment finalized for patient ${patient.name}`, 
      id
    );
    
    res.json({
      success: true,
      patientId: id,
      patientName: patient.name,
      esiLevel,
      triageScore,
      status: 'ER Queue',
      notes: notes || "Triage ESI evaluated"
    });
  } catch (err: any) {
    res.status(500).json({ message: "ER Triage assessment failed", error: err.message });
  }
});

// Patients directory query
patientRouter.get('/', authenticateToken, async (req: Request, res: Response) => {
  const search = req.query.search as string;
  try {
    const matches = await dbService.getPatients(search);
    const reqUser = (req as any).user;
    await logAudit(reqUser.id, reqUser.username, reqUser.role, 'PATIENT_DIRECTORY_LIST', `Accessed patient listings${search ? ` filtered by: "${search}"` : ''}`);
    res.json(matches);
  } catch (err: any) {
    res.status(500).json({ message: "Failed to load patient directories", error: err.message });
  }
});

// Detail demographics
patientRouter.get('/:id', authenticateToken, async (req: Request, res: Response) => {
  try {
    const patient = await dbService.getPatientById(req.params.id);
    if (!patient) return res.status(404).json({ message: "Patient not found" });
    
    const reqUser = (req as any).user;
    await logAudit(reqUser.id, reqUser.username, reqUser.role, 'VIEW_MEDICAL_RECORD', `Viewed Clinical Demographics of ${patient.name}`, patient.id);
    res.json(patient);
  } catch (err: any) {
    res.status(500).json({ message: "Failed to fetch patient record", error: err.message });
  }
});

// Register patient MRN
patientRouter.post('/', authenticateToken, async (req: Request, res: Response) => {
  const { name, dob, gender, contact, email, address, bloodGroup, emergencyContact } = req.body;
  
  if (!name || !dob || !gender || !contact || !address || !bloodGroup || !emergencyContact?.name || !emergencyContact?.phone) {
    return res.status(400).json({ message: "Missing required patient registration demographics" });
  }
  
  try {
    const count = await dbService.countPatients();
    const mrn = `MRN-2026-${String(count + 1).padStart(4, '0')}`;
    
    const newPatient = {
      id: mrn,
      name,
      dob,
      gender,
      contact,
      email: email || "",
      address,
      bloodGroup,
      emergencyContact,
      isArchived: false,
      createdAt: new Date().toISOString(),
      triage_status: 'Triage Pending', // Initial state
      esi_level: 5 // Lowest default priority
    };
    
    await dbService.insertPatient(newPatient);
    
    const reqUser = (req as any).user;
    await logAudit(reqUser.id, reqUser.username, reqUser.role, 'REGISTER_PATIENT', `Registered new patient: ${name} with MRN: ${mrn}`, mrn);
    
    res.status(201).json(newPatient);
  } catch (err: any) {
    res.status(500).json({ message: "Registration failure", error: err.message });
  }
});

// Revision demographics
patientRouter.put('/:id', authenticateToken, async (req: Request, res: Response) => {
  try {
    await dbService.updatePatient(req.params.id, req.body);
    
    const reqUser = (req as any).user;
    await logAudit(reqUser.id, reqUser.username, reqUser.role, 'UPDATE_PATIENT_DEMOGRAPHICS', `Updated patient details for MRN: ${req.params.id}`, req.params.id);
    
    const revisedPatient = await dbService.getPatientById(req.params.id);
    res.json(revisedPatient);
  } catch (err: any) {
    res.status(500).json({ message: "Update failure", error: err.message });
  }
});

// Soft-archiving
patientRouter.delete('/:id/archive', authenticateToken, async (req: Request, res: Response) => {
  try {
    await dbService.updatePatient(req.params.id, { isArchived: true });
    
    const reqUser = (req as any).user;
    await logAudit(reqUser.id, reqUser.username, reqUser.role, 'ARCHIVE_PATIENT', `Archived patient profile status for MRN: ${req.params.id}`, req.params.id);
    
    const patientObj = await dbService.getPatientById(req.params.id);
    res.json({ message: "Patient archived successfully.", patient: patientObj });
  } catch (err: any) {
    res.status(500).json({ message: "Archiving command failed.", error: err.message });
  }
});

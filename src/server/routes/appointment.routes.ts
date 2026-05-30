// File: src/server/routes/appointment.routes.ts
import { Router, Request, Response } from 'express';
import crypto from 'crypto';
import { dbService } from '../db';
import { authenticateToken, logAudit } from './auth.routes';

export const appointmentRouter = Router();

// Retrieve appointments roster
appointmentRouter.get('/', authenticateToken, async (req: Request, res: Response) => {
  const reqUser = (req as any).user;
  try {
    const results = await dbService.getAppointments(reqUser.role === 'Doctor' ? reqUser.id : undefined);
    res.json(results);
  } catch (err: any) {
    res.status(500).json({ message: "Failed to query appointments", error: err.message });
  }
});

// Book new appointment with doctor availability conflict check
appointmentRouter.post('/', authenticateToken, async (req: Request, res: Response) => {
  const { patientId, doctorId, dateTime, timeSlot, notes } = req.body;
  
  if (!patientId || !doctorId || !dateTime || !timeSlot) {
    return res.status(400).json({ message: "Required booking items: Patient ID, Doctor, Date, and Time Slot are required" });
  }
  
  try {
    // Automated conflict detection checks if doctor is scheduled on same date and timeslot
    const isDocConflict = await dbService.checkAppointmentConflict(doctorId, dateTime, timeSlot);
    if (isDocConflict) {
      return res.status(400).json({ message: `Doctor is already scheduled at ${timeSlot} on this clinical date.` });
    }

    const patient = await dbService.getPatientById(patientId);
    const doctors = await dbService.getDoctors();
    const doctor = doctors.find((u: any) => u.id === doctorId);
    
    if (!patient || !doctor) {
      return res.status(404).json({ message: "Invalid patient or medical staff selected" });
    }
    
    const newAppointmentId = `apt-${crypto.randomUUID()}`;
    const smsMessage = `STJUDE-HOSPITAL: Hello ${patient.name}, your medical consultative encounter with ${doctor.name} is scheduled on ${dateTime.substring(0, 10)} at ${timeSlot}.`;
    
    const newAppointment = {
      id: newAppointmentId,
      patientId,
      doctorId,
      dateTime,
      timeSlot,
      status: 'Scheduled',
      notes: notes || "",
      createdAt: new Date().toISOString(),
      simulatedNotificationLog: smsMessage
    };
    
    await dbService.insertAppointment(newAppointment);
    
    const reqUser = (req as any).user;
    await logAudit(reqUser.id, reqUser.username, reqUser.role, 'BOOK_APPOINTMENT', `Booked appointment slot for: ${patient.name} with ${doctor.name}`, patientId);
    
    res.status(201).json({ ...newAppointment, patientName: patient.name, doctorName: doctor.name });
  } catch (err: any) {
    res.status(500).json({ message: "Failed to book appointment", error: err.message });
  }
});

// Reschedule or update appointment clinical status (e.g. Cancelled)
appointmentRouter.put('/:id', authenticateToken, async (req: Request, res: Response) => {
  const { status, timeSlot, dateTime, notes } = req.body;
  
  try {
    const list = await dbService.getAppointments();
    const original = list.find((a: any) => a.id === req.params.id);
    if (!original) return res.status(404).json({ message: "Appointment booking item not found" });

    if (timeSlot && dateTime && timeSlot !== original.timeSlot) {
      const isConflict = await dbService.checkAppointmentConflict(original.doctorId, dateTime, timeSlot, req.params.id);
      if (isConflict) {
        return res.status(400).json({ message: "Double-booking detected. Selected Doctor availability conflict." });
      }
    }
    
    const updates = { status, timeSlot, dateTime, notes };
    await dbService.updateAppointment(req.params.id, updates);
    
    const reqUser = (req as any).user;
    await logAudit(reqUser.id, reqUser.username, reqUser.role, 'UPDATE_APPOINTMENT', `Updated appointment clinical state to: ${status || original.status}`, original.patientId);
    
    const finalAppt = { ...original, ...updates };
    res.json(finalAppt);
  } catch (err: any) {
    res.status(500).json({ message: "Adjustment error", error: err.message });
  }
});

// Fetch active doctor profiles
appointmentRouter.get('/doctors', authenticateToken, async (req: Request, res: Response) => {
  try {
    const list = await dbService.getDoctors();
    res.json(list);
  } catch (err: any) {
    res.status(500).json({ message: "Failed to fetch doctors list", error: err.message });
  }
});

// Leaves operations
appointmentRouter.post('/doctors/leaves', authenticateToken, async (req: Request, res: Response) => {
  const reqUser = (req as any).user;
  const { startDate, endDate, reason } = req.body;
  
  if (!startDate || !endDate || !reason) {
    return res.status(400).json({ message: "Missing leave parameters" });
  }
  
  try {
    const leaveId = `leave-${crypto.randomUUID()}`;
    const newLeave = {
      id: leaveId,
      doctorId: reqUser.id,
      startDate,
      endDate,
      reason,
      status: 'Pending'
    };
    
    await dbService.applyLeave(newLeave);
    await logAudit(reqUser.id, reqUser.username, reqUser.role, 'LEAVE_APPLY', `Doctor requested clinical leave from ${startDate} to ${endDate}`);
    res.status(201).json(newLeave);
  } catch (err: any) {
    res.status(500).json({ message: "Leave registration failed", error: err.message });
  }
});

appointmentRouter.put('/doctors/leaves/:leaveId', authenticateToken, async (req: Request, res: Response) => {
  const reqUser = (req as any).user;
  const { doctorId, status } = req.body;
  
  if (reqUser.role !== 'Admin') {
    return res.status(403).json({ message: "Only administrators approve leave items" });
  }
  
  try {
    const updated = await dbService.updateLeaveStatus(req.params.leaveId, status);
    await logAudit(reqUser.id, reqUser.username, reqUser.role, 'LEAVE_STATUS_DECISION', `Updated leave record ${req.params.leaveId} to ${status} for doctor ${doctorId}`);
    res.json(updated);
  } catch (err: any) {
    res.status(500).json({ message: "Leave approval failed", error: err.message });
  }
});

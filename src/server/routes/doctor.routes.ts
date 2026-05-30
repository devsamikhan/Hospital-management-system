// File: src/server/routes/doctor.routes.ts
import { Router, Request, Response } from 'express';
import crypto from 'crypto';
import { dbService } from '../db';
import { authenticateToken, logAudit } from './auth.routes';

export const doctorRouter = Router();

// Retrieve all doctor staff profiles
doctorRouter.get('/', authenticateToken, async (req: Request, res: Response) => {
  try {
    const doctors = await dbService.getDoctors();
    res.json(doctors);
  } catch (err: any) {
    res.status(500).json({ message: "Failed to list doctors", error: err.message });
  }
});

// Post/Request physician leaves
doctorRouter.post('/leaves', authenticateToken, async (req: Request, res: Response) => {
  const reqUser = (req as any).user;
  const { startDate, endDate, reason } = req.body;

  if (!startDate || !endDate || !reason) {
    return res.status(400).json({ message: "Please specify start date, end date, and reason for leave" });
  }

  try {
    const newLeave = {
      id: `leave-${crypto.randomUUID()}`,
      doctorId: reqUser.id,
      startDate,
      endDate,
      reason,
      status: 'Pending' as const
    };

    await dbService.applyLeave(newLeave);
    await logAudit(
      reqUser.id,
      reqUser.username,
      reqUser.role,
      'APPLY_LEAVE',
      `Applied leave schedule from ${startDate} to ${endDate}`
    );
    res.status(201).json(newLeave);
  } catch (err: any) {
    res.status(500).json({ message: "Leave registration failed", error: err.message });
  }
});

// Approve or reject pending physician leaves (Admin only)
doctorRouter.put('/leaves/:leaveId', authenticateToken, async (req: Request, res: Response) => {
  const reqUser = (req as any).user;
  if (reqUser.role !== 'Admin') {
    return res.status(403).json({ message: "Only administrators approve leave items" });
  }

  const { doctorId, status } = req.body;
  if (!doctorId || !status) {
    return res.status(400).json({ message: "Missing doctor ID or approval status" });
  }

  try {
    const updated = await dbService.updateLeaveStatus(req.params.leaveId, status);
    if (!updated) return res.status(404).json({ message: "Leave request item not found" });

    await logAudit(
      reqUser.id,
      reqUser.username,
      reqUser.role,
      'APPROVE_LEAVE',
      `Changed physician leave id ${req.params.leaveId} status to: ${status} for doctor: ${doctorId}`
    );
    res.json(updated);
  } catch (err: any) {
    res.status(500).json({ message: "Leave approval error", error: err.message });
  }
});

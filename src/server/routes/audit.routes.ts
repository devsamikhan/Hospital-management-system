// File: src/server/routes/audit.routes.ts
import { Router, Request, Response } from 'express';
import { dbService } from '../db';
import { authenticateToken } from './auth.routes';

export const auditRouter = Router();

// Append-only restricted security HIPAA clinical audit log timeline
auditRouter.get('/logs', authenticateToken, async (req: Request, res: Response) => {
  const reqUser = (req as any).user;
  if (reqUser.role !== 'Admin') {
    return res.status(403).json({ message: "Access forbidden: Audit logs restricted to Admin role" });
  }
  try {
    const logs = await dbService.getAuditLogs();
    res.json(logs);
  } catch (err: any) {
    res.status(500).json({ message: "Failed to fetch audit logs", error: err.message });
  }
});

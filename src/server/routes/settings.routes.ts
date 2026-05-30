// File: src/server/routes/settings.routes.ts
import { Router, Request, Response } from 'express';
import { dbService } from '../db';
import { authenticateToken, logAudit } from './auth.routes';

export const settingsRouter = Router();

// Retrieve global hospital institutional settings (default currency PKR)
settingsRouter.get('/', authenticateToken, async (req: Request, res: Response) => {
  try {
    const settings = await dbService.getSettings();
    res.json(settings);
  } catch (err: any) {
    res.status(500).json({ message: "Settings fetch failed", error: err.message });
  }
});

// Update global hospital configurations
settingsRouter.put('/', authenticateToken, async (req: Request, res: Response) => {
  const reqUser = (req as any).user;
  if (reqUser.role !== 'Admin') return res.status(403).json({ message: "Unauthorized settings modifications" });

  try {
    await dbService.updateSettings(req.body);
    await logAudit(
      reqUser.id,
      reqUser.username,
      reqUser.role,
      'UPDATE_HOSPITAL_CONFIG',
      `Updated global hospital settings configuration`
    );
    res.json(req.body);
  } catch (err: any) {
    res.status(500).json({ message: "Settings revision failed", error: err.message });
  }
});

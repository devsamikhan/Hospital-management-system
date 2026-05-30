// File: src/server/routes/lab.routes.ts
import { Router, Request, Response } from 'express';
import { dbService, db } from '../db';
import { authenticateToken, logAudit } from './auth.routes';

export const labRouter = Router();

// Retrieve all laboratory diagnostics and radiology orders
labRouter.get('/orders', authenticateToken, async (req: Request, res: Response) => {
  try {
    const orders = await dbService.getLabOrders();
    res.json(orders);
  } catch (err: any) {
    res.status(500).json({ message: "Failed to fetch lab orders", error: err.message });
  }
});

// Update laboratory order result, reference ranges, specimen custody states & critical alarms
labRouter.put('/orders/:id', authenticateToken, async (req: Request, res: Response) => {
  const { resultValue, referenceRange, flag, comments, filePath, status } = req.body;
  const reqUser = (req as any).user;

  if (reqUser.role !== 'Lab Technician' && reqUser.role !== 'Admin' && reqUser.role !== 'Doctor') {
    return res.status(403).json({ message: "Access unauthorized: Laboratory operations restricted to appropriate medical roles" });
  }

  try {
    // Get existing order to verify existence and check current state
    const snapshot = await db.collection('lab_orders').doc(req.params.id).get();
    if (!snapshot.exists) {
      return res.status(404).json({ message: "Lab order not found" });
    }
    const orig = snapshot.data()!;

    // Diagnostic Specimen Custody state loop validation:
    // Status can be: 'Ordered' -> 'Sample Collected' -> 'In-Lab Processing' -> 'Results Written' -> 'Doctor Reviewed'
    const validStatuses = ['Ordered', 'Sample Collected', 'In-Lab Processing', 'Results Written', 'Doctor Reviewed', 'Completed'];
    let finalStatus = status || orig.status || 'Ordered';
    if (status && !validStatuses.includes(status)) {
      return res.status(400).json({ message: `Invalid specimen custody status transition: ${status}` });
    }

    // Default status behavior matching monolithic completed state if result is written
    if (resultValue && !status) {
      finalStatus = 'Results Written';
    }

    const statusHistory = orig.statusHistory || [
      {
        status: orig.status || 'Ordered',
        timestamp: orig.createdAt || new Date().toISOString(),
        changedBy: orig.doctorName || 'System',
        comments: "Order created"
      }
    ];

    if (status && status !== orig.status) {
      statusHistory.push({
        status,
        timestamp: new Date().toISOString(),
        changedBy: reqUser.name,
        comments: comments || `Status transitioned to ${status}`
      });
    }

    const updates: any = {
      status: finalStatus,
      statusHistory,
      technicianId: reqUser.id,
      technicianName: reqUser.name,
      updatedAt: new Date().toISOString()
    };

    if (resultValue !== undefined) updates.resultValue = resultValue;
    if (referenceRange !== undefined) updates.referenceRange = referenceRange;
    if (flag !== undefined) updates.flag = flag;
    if (comments !== undefined) updates.comments = comments;
    if (filePath !== undefined) updates.filePath = filePath;

    await db.collection('lab_orders').doc(req.params.id).update(updates);

    // Alarms for Abnormal and Critical flags
    let isAlarmTriggered = false;
    let alarmMsg = "";
    if (flag === 'Critical') {
      isAlarmTriggered = true;
      alarmMsg = `!!! CRITICAL VALUE ATTENTION !!! Recorded highly elevated critical diagnostic values. Immediately paging supervising physician.`;
    } else if (flag === 'Abnormal') {
      isAlarmTriggered = true;
      alarmMsg = `[WARNING] Patient lab result recorded abnormal out-of-range value: ${resultValue}`;
    }

    await logAudit(
      reqUser.id,
      reqUser.username,
      reqUser.role,
      flag === 'Critical' ? 'CRITICAL_LAB_ALERT' : 'RECORD_LAB_RESULTS',
      `${alarmMsg ? alarmMsg + ' | ' : ''}Reported ${orig.testName} results for patient ${orig.patientName} (MRN: ${orig.patientMRN}). Custody State: ${finalStatus}. Values: ${resultValue || 'None'}`,
      orig.patientMRN
    );

    res.json({ ...orig, ...updates });
  } catch (err: any) {
    res.status(500).json({ message: "Lab results recording error", error: err.message });
  }
});

// Scanned PDF / Image Radiology or Laboratory report file attachment upload
labRouter.post('/orders/:id/upload', authenticateToken, async (req: Request, res: Response) => {
  const { fileName, fileContentBase64 } = req.body;
  const reqUser = (req as any).user;

  if (reqUser.role !== 'Lab Technician' && reqUser.role !== 'Admin') {
    return res.status(403).json({ message: "Only Lab Technicians upload clinical reporting charts" });
  }

  if (!fileName || !fileContentBase64) {
    return res.status(400).json({ message: "File data block is corrupt or empty" });
  }

  try {
    const simulatedStaticUrl = `/uploads/${Date.now()}_${fileName}`;
    await db.collection('lab_orders').doc(req.params.id).update({
      filePath: simulatedStaticUrl,
      updatedAt: new Date().toISOString()
    });

    await logAudit(
      reqUser.id,
      reqUser.username,
      reqUser.role,
      'UPLOAD_LAB_REPORT_FILE',
      `Attached scanned radiology/lab file: ${fileName} to order ID ${req.params.id}`,
      undefined
    );

    res.json({ success: true, filePath: simulatedStaticUrl });
  } catch (err: any) {
    res.status(500).json({ message: "Upload failed", error: err.message });
  }
});

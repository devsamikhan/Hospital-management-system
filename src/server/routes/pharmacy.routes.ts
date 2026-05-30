// File: src/server/routes/pharmacy.routes.ts
import { Router, Request, Response } from 'express';
import crypto from 'crypto';
import { dbService, db } from '../db';
import { authenticateToken, logAudit } from './auth.routes';

export const pharmacyRouter = Router();

// Retrieve all pharmacy formulary drug stocks
pharmacyRouter.get('/inventory', authenticateToken, async (req: Request, res: Response) => {
  try {
    const inventory = await dbService.getInventory();
    res.json(inventory);
  } catch (err: any) {
    res.status(500).json({ message: "Inventory load error", error: err.message });
  }
});

// Add new pharmaceutical stock line
pharmacyRouter.post('/inventory', authenticateToken, async (req: Request, res: Response) => {
  const reqUser = (req as any).user;
  if (reqUser.role !== 'Pharmacist' && reqUser.role !== 'Admin') {
    return res.status(403).json({ message: "Restricted: inventory updates locked to pharmacist/admin roles" });
  }

  const { name, genericName, category, unitPrice, stockQuantity, minStockLevel, expiryDate, supplier } = req.body;

  if (!name || !genericName || !category || !unitPrice || stockQuantity === undefined || !expiryDate || !supplier) {
    return res.status(400).json({ message: "All inventory profile parameters are required" });
  }

  try {
    const newItem = {
      id: `med-${crypto.randomUUID()}`,
      name,
      genericName,
      category,
      unitPrice: Number(unitPrice),
      stockQuantity: Number(stockQuantity),
      minStockLevel: Number(minStockLevel || 10),
      expiryDate,
      supplier
    };

    await dbService.insertInventoryItem(newItem);
    await logAudit(
      reqUser.id,
      reqUser.username,
      reqUser.role,
      'ADD_INVENTORY_STOCK',
      `Added new medical formulary record item: ${name} to stock`
    );

    res.status(201).json(newItem);
  } catch (err: any) {
    res.status(500).json({ message: "Inventory item post failed", error: err.message });
  }
});

// Edit existing pharmacy stock profile
pharmacyRouter.put('/inventory/:id', authenticateToken, async (req: Request, res: Response) => {
  const reqUser = (req as any).user;
  if (reqUser.role !== 'Pharmacist' && reqUser.role !== 'Admin') {
    return res.status(403).json({ message: "Restricted: inventory updates locked to pharmacist/admin roles" });
  }

  try {
    await dbService.updateInventoryItem(req.params.id, req.body);
    res.json({ success: true });
  } catch (err: any) {
    res.status(500).json({ message: "Stock revision server connection failed", error: err.message });
  }
});

// Prescription Order Multi-State Lifecycle Transition
// States: 'Ordered' -> 'Verifying Insurance' -> 'Preparing' -> 'Ready for Pickup' -> 'Dispensed'
pharmacyRouter.put('/prescriptions/:encounterId/:medicineId/status', authenticateToken, async (req: Request, res: Response) => {
  const { status, comments } = req.body;
  const reqUser = (req as any).user;

  if (reqUser.role !== 'Pharmacist' && reqUser.role !== 'Admin' && reqUser.role !== 'Nurse') {
    return res.status(403).json({ message: "Access unauthorized: Restricted to clinical pharmacy staff" });
  }

  const validStatuses = ['Ordered', 'Verifying Insurance', 'Preparing', 'Ready for Pickup', 'Dispensed'];
  if (!validStatuses.includes(status)) {
    return res.status(400).json({ message: `Invalid pharmacy lifecycle status: ${status}` });
  }

  try {
    const encRef = db.collection('encounters').doc(req.params.encounterId);
    const docSnapshot = await encRef.get();
    if (!docSnapshot.exists) {
      return res.status(404).json({ message: "Patient clinical encounter not found" });
    }

    const encData = docSnapshot.data()!;
    const prescriptions = encData.prescriptions || [];
    const rxIndex = prescriptions.findIndex((p: any) => p.medicineId === req.params.medicineId);

    if (rxIndex === -1) {
      return res.status(404).json({ message: "Prescription medication not found in this encounter" });
    }

    const originalStatus = prescriptions[rxIndex].status || 'Ordered';
    prescriptions[rxIndex].status = status;
    prescriptions[rxIndex].updatedAt = new Date().toISOString();
    prescriptions[rxIndex].lastUpdatedBy = reqUser.name;

    const lifecycleHistory = prescriptions[rxIndex].lifecycleHistory || [
      { status: 'Ordered', timestamp: encData.date, changedBy: encData.doctorName || 'Doctor' }
    ];

    lifecycleHistory.push({
      status,
      timestamp: new Date().toISOString(),
      changedBy: reqUser.name,
      comments: comments || `Status transitioned to ${status}`
    });

    prescriptions[rxIndex].lifecycleHistory = lifecycleHistory;

    // If status is 'Dispensed', we can also set the main 'dispensed' boolean flag to true
    if (status === 'Dispensed') {
      prescriptions[rxIndex].dispensed = true;
      prescriptions[rxIndex].dispensedAt = new Date().toISOString();
    }

    await encRef.update({ prescriptions });

    await logAudit(
      reqUser.id,
      reqUser.username,
      reqUser.role,
      'PHARMACY_LIFECYCLE_STATE',
      `Prescription medication ID ${req.params.medicineId} transitioned state from ${originalStatus} to ${status} for encounter ID ${req.params.encounterId}`,
      encData.patientId
    );

    res.json({ success: true, prescription: prescriptions[rxIndex] });
  } catch (err: any) {
    res.status(500).json({ message: "Failed to update prescription status", error: err.message });
  }
});

// Dispense Medication - Automated NoSQL Billing & Inventory Transactional Loop with safety batch limits
pharmacyRouter.post('/dispense', authenticateToken, async (req: Request, res: Response) => {
  const reqUser = (req as any).user;
  if (reqUser.role !== 'Pharmacist' && reqUser.role !== 'Admin') {
    return res.status(403).json({ message: "Restricted to pharmacist role operations" });
  }

  const { encounterId, patientId, medicineId, quantity } = req.body;
  if (!patientId || !medicineId || !quantity) {
    return res.status(400).json({ message: "Missing clinical prescription dispensing references" });
  }

  const qty = Number(quantity);

  // Safety Batch Checks:
  if (qty <= 0) {
    return res.status(400).json({ message: "Dispensing quantity must be greater than zero." });
  }
  if (qty > 150) {
    return res.status(400).json({ message: "CRITICAL SAFETY BATCH ERROR: Maximum single dispense limit (150 units) exceeded to prevent medication overdosing/abuse." });
  }

  try {
    const settings = await dbService.getSettings();
    const taxRate = settings.taxRate || 0.05;

    // Call NoSQL Firestore atomic transaction
    const transactionResult = await dbService.dispenseMedicationTransaction({
      encounterId,
      patientId,
      medicineId,
      quantity: qty,
      taxRate
    });

    // Automatically advance prescription lifecycle status to 'Dispensed' if encounterId is provided
    if (encounterId) {
      const encRef = db.collection('encounters').doc(encounterId);
      const docSnapshot = await encRef.get();
      if (docSnapshot.exists) {
        const encData = docSnapshot.data()!;
        const prescriptions = encData.prescriptions || [];
        const rxIndex = prescriptions.findIndex((p: any) => p.medicineId === medicineId);
        if (rxIndex !== -1) {
          prescriptions[rxIndex].status = 'Dispensed';
          prescriptions[rxIndex].dispensed = true;
          prescriptions[rxIndex].dispensedAt = new Date().toISOString();
          const lifecycleHistory = prescriptions[rxIndex].lifecycleHistory || [
            { status: 'Ordered', timestamp: encData.date, changedBy: encData.doctorName || 'Doctor' }
          ];
          lifecycleHistory.push({
            status: 'Dispensed',
            timestamp: new Date().toISOString(),
            changedBy: reqUser.name,
            comments: "Prescription medication successfully dispensed from inventory"
          });
          prescriptions[rxIndex].lifecycleHistory = lifecycleHistory;
          await encRef.update({ prescriptions });
        }
      }
    }

    await logAudit(
      reqUser.id,
      reqUser.username,
      reqUser.role,
      'DISPENSE_PHARMACEUTICAL',
      `Dispensed ${qty} units of medicine ID ${medicineId} to patient ${patientId}`,
      patientId
    );

    res.json({ message: "Prescription successfully dispensed.", transactionResult });
  } catch (err: any) {
    res.status(400).json({ message: err.message || "Deduction and dispensing fail." });
  }
});

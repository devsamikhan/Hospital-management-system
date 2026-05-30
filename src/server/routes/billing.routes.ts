// File: src/server/routes/billing.routes.ts
import { Router, Request, Response } from 'express';
import { dbService, db } from '../db';
import { authenticateToken, logAudit } from './auth.routes';

export const billingRouter = Router();

// Retrieve all transaction ledgers and invoices
billingRouter.get('/invoices', authenticateToken, async (req: Request, res: Response) => {
  try {
    const invoices = await dbService.getInvoices();
    res.json(invoices);
  } catch (err: any) {
    res.status(500).json({ message: "Failed to fetch invoices", error: err.message });
  }
});

// Specialized Multi-Category Pricing Calculator with flat Bed Stay and ESI triage intensity multipliers
billingRouter.post('/invoices/calculate-charges', authenticateToken, async (req: Request, res: Response) => {
  const { patientId, bedType, daysStayed, serviceItems } = req.body;

  if (!patientId) {
    return res.status(400).json({ message: "Patient MRN is required for pricing calculations" });
  }

  try {
    // 1. Fetch Patient demographics and check for ESI triage severity
    const patientDoc = await db.collection('patients').doc(patientId).get();
    if (!patientDoc.exists) {
      return res.status(404).json({ message: "Patient record not found" });
    }
    const patientData = patientDoc.data()!;
    const esiLevel = Number(patientData.esi_level || 5); // Default lowest priority if not triaged

    // 2. Triage severity pricing multiplier:
    // ESI Level 1 (Resuscitation) -> 2.0x multiplier due to extreme clinical resource consumption
    // ESI Level 2 (Emergent)       -> 1.5x multiplier
    // ESI Level 3 (Urgent)         -> 1.25x multiplier
    // ESI Level 4 (Less Urgent)    -> 1.1x multiplier
    // ESI Level 5 (Non-Urgent)     -> 1.0x baseline standard charge
    const triageMultipliers: Record<number, number> = {
      1: 2.0,
      2: 1.5,
      3: 1.25,
      4: 1.1,
      5: 1.0
    };
    const clinicalMultiplier = triageMultipliers[esiLevel] || 1.0;

    // 3. Flat Daily Ward Bed rates
    const bedChargesMap: Record<string, number> = {
      'General Ward': 120,
      'Semi-Private': 250,
      'Private': 500,
      'ICU': 1200
    };

    const baseBedRate = bedChargesMap[bedType || 'General Ward'] || 120;
    const rawBedCost = baseBedRate * Number(daysStayed || 0);
    // Apply clinical triage multiplier to bed cost
    const totalBedCost = Number((rawBedCost * clinicalMultiplier).toFixed(2));

    const calculatedItems: any[] = [];
    if (daysStayed && daysStayed > 0) {
      calculatedItems.push({
        description: `IPD Ward Stay (${daysStayed} days in ${bedType || 'General Ward'}) - ESI Level ${esiLevel} clinical resource factor applied`,
        amount: totalBedCost,
        category: 'Inpatient'
      });
    }

    // 4. Calculate additional services (Consultation, Lab, Pharmacy)
    let servicesTotal = 0;
    if (serviceItems && Array.isArray(serviceItems)) {
      serviceItems.forEach((item: any) => {
        const itemAmount = Number(item.amount || 0);
        calculatedItems.push({
          description: item.description,
          amount: itemAmount,
          category: item.category || 'Other'
        });
        servicesTotal += itemAmount;
      });
    }

    const settings = await dbService.getSettings();
    const subtotal = Number((totalBedCost + servicesTotal).toFixed(2));
    const tax = Number((subtotal * settings.taxRate).toFixed(2));
    const total = Number((subtotal + tax).toFixed(2));

    res.json({
      success: true,
      patientId,
      patientName: patientData.name,
      esiLevel,
      clinicalMultiplier,
      items: calculatedItems,
      subtotal,
      tax,
      total,
      currency: settings.currency || "PKR"
    });
  } catch (err: any) {
    res.status(500).json({ message: "Failed to calculate specialized clinical charges", error: err.message });
  }
});

// Process payment of invoices with Cash, Card or Insurance claim channels
billingRouter.post('/invoices/:id/pay', authenticateToken, async (req: Request, res: Response) => {
  const reqUser = (req as any).user;
  const { paymentMethod, amountPaid, insuranceProvider, policyNumber } = req.body;

  if (!paymentMethod || !amountPaid) {
    return res.status(400).json({ message: "Specify payment channel mode and processing currency amount" });
  }

  try {
    const list = await dbService.getInvoices();
    const invoice = list.find((v: any) => v.id === req.params.id);
    if (!invoice) return res.status(404).json({ message: "Clinical charge invoice not found" });

    const newPaidAmt = invoice.paidAmount + Number(amountPaid);
    let status = 'PartiallyPaid';
    let claimStatus = invoice.claimStatus || "";

    if (paymentMethod === 'Insurance') {
      status = 'InsuranceClaimed';
      claimStatus = 'Submitted';
    } else if (newPaidAmt >= invoice.total) {
      status = 'Paid';
    }

    const paymentUpdate = {
      paidAmount: newPaidAmt,
      paymentMethod,
      status,
      insuranceProvider: insuranceProvider || null,
      policyNumber: policyNumber || null,
      claimStatus
    };

    await dbService.payInvoice(req.params.id, paymentUpdate);

    await logAudit(
      reqUser.id,
      reqUser.username,
      reqUser.role,
      'PROCESS_INVOICE_BILL',
      `Processed payment for transaction INV: ${req.params.id}. Payment Mode: ${paymentMethod}, Amount: ${amountPaid}`,
      invoice.patientId
    );

    res.json({ ...invoice, ...paymentUpdate });
  } catch (err: any) {
    res.status(500).json({ message: "Payment processing failed", error: err.message });
  }
});

// Admin/Receptionist Insurance Claim processing approval pipeline
billingRouter.put('/invoices/:id/insurance-claim', authenticateToken, async (req: Request, res: Response) => {
  const reqUser = (req as any).user;
  if (reqUser.role !== 'Admin' && reqUser.role !== 'Receptionist') {
    return res.status(403).json({ message: "Unauthorized claim adjustments" });
  }

  const { claimStatus } = req.body;
  if (!claimStatus) return res.status(400).json({ message: "Missing claim status" });

  try {
    const list = await dbService.getInvoices();
    const invoice = list.find((v: any) => v.id === req.params.id);
    if (!invoice) return res.status(404).json({ message: "Invoice not found" });

    let status = invoice.status;
    let totalAmount = invoice.paidAmount;

    if (claimStatus === 'Approved') {
      status = 'Paid';
      totalAmount = invoice.total;
    }

    await dbService.updateInsuranceClaimStatus(
      req.params.id,
      claimStatus,
      status,
      claimStatus === 'Approved' ? totalAmount : undefined
    );

    await logAudit(
      reqUser.id,
      reqUser.username,
      reqUser.role,
      'INSURANCE_CLAIM_UPDATE',
      `Updated insurance claim status for invoice ${req.params.id} to: ${claimStatus}`,
      invoice.patientId
    );

    res.json({
      ...invoice,
      claimStatus,
      status,
      paidAmount: claimStatus === 'Approved' ? totalAmount : invoice.paidAmount
    });
  } catch (err: any) {
    res.status(500).json({ message: "Insurance claim update failed", error: err.message });
  }
});

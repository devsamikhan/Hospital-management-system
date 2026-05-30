/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import express, { Request, Response, NextFunction } from 'express';
import path from 'path';
import crypto from 'crypto';
import { createServer as createViteServer } from 'vite';
import { dbService, db } from './src/server/db';
import { 
  User, 
  Patient, 
  Appointment, 
  Encounter, 
  LabOrder, 
  InventoryItem, 
  InpatientAdmission, 
  Bed, 
  Invoice, 
  AuditLog, 
  HospitalSettings,
  LabOrderSummary,
  InvoiceItem
} from './src/types';

// Import modular micro-service routers
import { authRouter } from './src/server/routes/auth.routes';
import { patientRouter } from './src/server/routes/patient.routes';
import { appointmentRouter } from './src/server/routes/appointment.routes';
import { clinicalRouter } from './src/server/routes/clinical.routes';
import { labRouter } from './src/server/routes/lab.routes';
import { pharmacyRouter } from './src/server/routes/pharmacy.routes';
import { inpatientRouter } from './src/server/routes/inpatient.routes';
import { billingRouter } from './src/server/routes/billing.routes';
import { auditRouter } from './src/server/routes/audit.routes';
import { settingsRouter } from './src/server/routes/settings.routes';
import { doctorRouter } from './src/server/routes/doctor.routes';
import { dashboardRouter } from './src/server/routes/dashboard.routes';


// Constants
const PORT = 3000;
const JWT_SECRET = 'hospital-management-secret-key-2026-secure';

// Helper to secure verify passwords (SHA-256)
function hashPassword(password: string): string {
  return crypto.createHash('sha256').update(password).digest('hex');
}

// Custom JWT implementation that doesn't crash Node compiler
function signToken(payload: object): string {
  const header = { alg: 'HS256', typ: 'JWT' };
  const headerB64 = Buffer.from(JSON.stringify(header)).toString('base64url');
  const payloadB64 = Buffer.from(JSON.stringify(payload)).toString('base64url');
  
  const signature = crypto
    .createHmac('sha256', JWT_SECRET)
    .update(`${headerB64}.${payloadB64}`)
    .digest('base64url');
    
  return `${headerB64}.${payloadB64}.${signature}`;
}

function verifyToken(token: string): any {
  try {
    const parts = token.split('.');
    if (parts.length !== 3) return null;
    const [headerB64, payloadB64, signature] = parts;
    const expectedSignature = crypto
      .createHmac('sha256', JWT_SECRET)
      .update(`${headerB64}.${payloadB64}`)
      .digest('base64url');
      
    if (signature !== expectedSignature) return null;
    
    const payloadStr = Buffer.from(payloadB64, 'base64url').toString();
    return JSON.parse(payloadStr);
  } catch (err) {
    return null;
  }
}

// HIPAA compliant clinical PHI log routine using Firestore NoSQL dbService
async function logAudit(
  userId: string, 
  username: string, 
  role: string, 
  action: string, 
  details: string, 
  patientId?: string
) {
  try {
    const newLog = {
      id: `log-${crypto.randomUUID()}`,
      userId,
      username,
      userRole: role,
      patientId: patientId || null,
      action,
      details,
      timestamp: new Date().toISOString()
    };
    await dbService.insertAuditLog(newLog);
  } catch (err) {
    console.error("CRITICAL HIPAA NO_SQL LEDGER TRANSACTION ERROR:", err);
  }
}

// Auto Seeding sequence to guarantee working preset clinician logins
async function seedDatabaseIfEmpty() {
  try {
    console.log("Checking Firestore database collections for seeding...");
    
    // 1. Seed Users
    const usersSnapshot = await db.collection('users').limit(1).get();
    if (usersSnapshot.empty) {
      console.log("Seeding clinical staff credentials...");
      const mockUsers = [
        {
          id: "u-admin",
          username: "admin",
          username_lowercase: "admin@hospital.com",
          password_hash: hashPassword("admin123"),
          name: "Administrator Chief",
          role: "Admin",
          email: "admin@hospital.com",
          phone: "+1 (555) 000-1111",
          department: "Administration"
        },
        {
          id: "u-doc-smith",
          username: "dr_smith",
          username_lowercase: "doctor@hospital.com", // maps front-end presets
          password_hash: hashPassword("doctor123"),
          name: "Dr. Elizabeth Smith",
          role: "Doctor",
          email: "doctor@hospital.com",
          phone: "+1 (555) 111-2222",
          department: "Cardiology",
          specialization: "General Cardiology",
          qualification: "MD, Board Certified Cardiologist",
          consultation_fee: 150.00,
          leaves: []
        },
        {
          id: "u-nurse-nancy",
          username: "nurse_nancy",
          username_lowercase: "nurse@hospital.com",
          password_hash: hashPassword("nurse123"),
          name: "Nurse Nancy Carter",
          role: "Nurse",
          email: "nurse@hospital.com",
          phone: "+1 (555) 222-3333",
          department: "IPD - ICU Ward"
        },
        {
          id: "u-lab-alex",
          username: "lab_alex",
          username_lowercase: "labtech@hospital.com",
          password_hash: hashPassword("labtech123"),
          name: "Alex Chemistry",
          role: "Lab Technician",
          email: "labtech@hospital.com",
          phone: "+1 (555) 444-5555",
          department: "Laboratory"
        },
        {
          id: "u-pharm-peter",
          username: "pharmacist",
          username_lowercase: "pharmacist@hospital.com",
          password_hash: hashPassword("pharm123"),
          name: "Peter Apothecary",
          role: "Pharmacist",
          email: "pharmacist@hospital.com",
          phone: "+1 (555) 555-6666",
          department: "Pharmacy"
        }
      ];

      for (const u of mockUsers) {
        await db.collection('users').doc(u.id).set(u);
      }
      console.log("Seeding users completed.");
    }

    // 2. Seed Patients
    const patientsSnapshot = await db.collection('patients').limit(1).get();
    if (patientsSnapshot.empty) {
      console.log("Seeding patient profiles...");
      const mockPatients = [
        {
          id: "MRN-2026-0001",
          name: "Emma Watson",
          dob: "1990-04-15",
          gender: "Female",
          contact: "+1 (555) 123-4567",
          email: "emma@watson.com",
          address: "125 Hampstead Heath, London, UK",
          blood_group: "A+",
          emergency_contact_name: "Rupert Grint",
          emergency_contact_relationship: "Friend",
          emergency_contact_phone: "+1 (555) 987-6543",
          is_archived: false,
          created_at: new Date("2026-01-10T10:00:00Z").toISOString()
        },
        {
          id: "MRN-2026-0002",
          name: "Liam Neeson",
          dob: "1952-06-07",
          gender: "Male",
          contact: "+1 (555) 345-6789",
          email: "liam@taken.com",
          address: "44 Belfast Blvd, Northern Ireland",
          blood_group: "O+",
          emergency_contact_name: "Helen Mirren",
          emergency_contact_relationship: "Spouse",
          emergency_contact_phone: "+1 (555) 876-5432",
          is_archived: false,
          created_at: new Date("2026-02-15T11:30:00Z").toISOString()
        },
        {
          id: "MRN-2026-0003",
          name: "Ada Lovelace",
          dob: "1985-12-10",
          gender: "Female",
          contact: "+1 (555) 567-8901",
          email: "ada@analytical.net",
          address: "201 Turing Lane, Computing Park",
          blood_group: "AB-",
          emergency_contact_name: "Charles Babbage",
          emergency_contact_relationship: "Colleague",
          emergency_contact_phone: "+1 (555) 765-4321",
          is_archived: false,
          created_at: new Date("2026-03-01T09:15:00Z").toISOString()
        }
      ];

      for (const p of mockPatients) {
        await db.collection('patients').doc(p.id).set(p);
      }
      console.log("Seeding patients completed.");
    }

    // 3. Seed Beds
    const bedsSnapshot = await db.collection('beds').limit(1).get();
    if (bedsSnapshot.empty) {
      console.log("Seeding hospital IPD beds...");
      const mockBeds = [
        { id: "bed-g1", ward_name: "General Medical Ward", bed_number: "G-101", type: "General Ward", status: "Vacant" },
        { id: "bed-g2", ward_name: "General Medical Ward", bed_number: "G-102", type: "General Ward", status: "Vacant" },
        { id: "bed-g3", ward_name: "General Medical Ward", bed_number: "G-103", type: "General Ward", status: "Vacant" },
        { id: "bed-s1", ward_name: "Step-Down Ward B", bed_number: "S-201", type: "Semi-Private", status: "Vacant" },
        { id: "bed-s2", ward_name: "Step-Down Ward B", bed_number: "S-202", type: "Semi-Private", status: "Vacant" },
        { id: "bed-p1", ward_name: "Royal Wing", bed_number: "P-301", type: "Private", status: "Occupied", patient_id: "MRN-2026-0001" },
        { id: "bed-p2", ward_name: "Royal Wing", bed_number: "P-302", type: "Private", status: "Vacant" },
        { id: "bed-i1", ward_name: "Intensive Care Unit (ICU)", bed_number: "ICU-401", type: "ICU", status: "Occupied", patient_id: "MRN-2026-0002" },
        { id: "bed-i2", ward_name: "Intensive Care Unit (ICU)", bed_number: "ICU-402", type: "ICU", status: "Maintenance" }
      ];

      for (const b of mockBeds) {
        await db.collection('beds').doc(b.id).set(b);
      }
      console.log("Seeding beds completed.");
    }

    // 4. Seed Pharmacy Inventory
    const inventorySnapshot = await db.collection('pharmacy_inventory').limit(1).get();
    if (inventorySnapshot.empty) {
      console.log("Seeding pharmacy drug stock lines...");
      const mockMeds = [
        {
          id: "med-1",
          name: "Amoxicillin 500mg",
          generic_name: "Amoxicillin",
          category: "Antibiotics",
          unit_price: 12.50,
          stock_quantity: 180,
          min_stock_level: 30,
          expiry_date: "2027-11-15",
          supplier: "Global Pharma Corp"
        },
        {
          id: "med-2",
          name: "Ibuprofen 400mg",
          generic_name: "Ibuprofen",
          category: "Analgesics",
          unit_price: 5.00,
          stock_quantity: 340,
          min_stock_level: 50,
          expiry_date: "2027-04-20",
          supplier: "McKesson Healthcare"
        },
        {
          id: "med-3",
          name: "Metformin 850mg",
          generic_name: "Metformin",
          category: "Antidiabetics",
          unit_price: 15.00,
          stock_quantity: 18,
          min_stock_level: 30,
          expiry_date: "2026-10-30",
          supplier: "Cardinal Health Solutions"
        },
        {
          id: "med-4",
          name: "Atorvastatin 20mg",
          generic_name: "Lipitor",
          category: "Cardiovascular",
          unit_price: 22.00,
          stock_quantity: 80,
          min_stock_level: 15,
          expiry_date: "2026-06-15",
          supplier: "Merck Distributors"
        },
        {
          id: "med-5",
          name: "Paracetamol 500mg",
          generic_name: "Acetaminophen",
          category: "Antipyretics",
          unit_price: 3.50,
          stock_quantity: 420,
          min_stock_level: 40,
          expiry_date: "2028-09-01",
          supplier: "McKesson Healthcare"
        },
        {
          id: "med-6",
          name: "Losartan 50mg",
          generic_name: "Cozaar",
          category: "Cardiovascular",
          unit_price: 18.00,
          stock_quantity: 8,
          min_stock_level: 20,
          expiry_date: "2027-08-11",
          supplier: "Cardinal Health Solutions"
        }
      ];

      for (const m of mockMeds) {
        await db.collection('pharmacy_inventory').doc(m.id).set(m);
      }
      console.log("Seeding pharmacy completed.");
    }
    
    // Seed initial audit log
    const auditSnapshot = await db.collection('security_audit_logs').limit(1).get();
    if (auditSnapshot.empty) {
      await logAudit("u-admin", "admin", "Admin", "INIT_SYSTEM", "NoSQL Firestore secure clinical environment seeded successfully.");
    }

  } catch (e) {
    console.error("Auto seeding encountered an issue:", e);
  }
}

// Start API initialization
const app = express();

app.use(express.json({ limit: '20mb' }));
app.use(express.urlencoded({ extended: true, limit: '20mb' }));

// AUTH MIDDLEWARE
function authenticateToken(req: Request, res: Response, next: NextFunction) {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1];
  
  if (!token) return res.status(401).json({ message: "No token provided" });
  
  const user = verifyToken(token);
  if (!user) return res.status(403).json({ message: "Invalid or expired session" });
  
  (req as any).user = user;
  next();
}


// Mount Decoupled Modular Micro-Service Routers
app.use('/api/auth', authRouter);
app.use('/api/patients', patientRouter);
app.use('/api/appointments', appointmentRouter);
app.use('/api/encounters', clinicalRouter);
app.use('/api/lab', labRouter);
app.use('/api/pharmacy', pharmacyRouter);
app.use('/api/inpatient', inpatientRouter);
app.use('/api/billing', billingRouter);
app.use('/api/audit', auditRouter);
app.use('/api/settings', settingsRouter);
app.use('/api/doctors', doctorRouter);
app.use('/api/dashboard', dashboardRouter);

// Setup Express Environment and dev-tools/production pipelines
async function initServer() {
  // Seed Database if empty
  await seedDatabaseIfEmpty();

  // Vite Integration for unified fullstack dev server
  const isProd = process.env.NODE_ENV === 'production';
  
  if (!isProd) {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa'
    });
    app.use(vite.middlewares);
  } else {
    // Serve production static assets
    app.use(express.static(path.join(process.cwd(), 'dist/client')));
    app.get('*', (req, res) => {
      res.sendFile(path.join(process.cwd(), 'dist/client/index.html'));
    });
  }

  app.listen(PORT, () => {
    console.log(`----------------------------------------------------------------------`);
    console.log(`St. Jude HMS Core online & successfully operating on port : ${PORT}`);
    console.log(`Cloud Firebase NoSQL Firestore context persists clinical sessions safely.`);
    console.log(`----------------------------------------------------------------------`);
  });
}

initServer().catch(err => {
  console.error("Critical server crash during init sequence:", err);
});

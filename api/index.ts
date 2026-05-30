/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 *
 * Vercel Serverless Function Entry Point
 * Wraps the Express app for Vercel's serverless runtime.
 * All /api/* requests are routed here by vercel.json rewrites.
 */

import express, { Request, Response, NextFunction } from 'express';
import path from 'path';
import crypto from 'crypto';
import { dbService, db } from '../src/server/db';

// Import modular micro-service routers
import { authRouter } from '../src/server/routes/auth.routes';
import { patientRouter } from '../src/server/routes/patient.routes';
import { appointmentRouter } from '../src/server/routes/appointment.routes';
import { clinicalRouter } from '../src/server/routes/clinical.routes';
import { labRouter } from '../src/server/routes/lab.routes';
import { pharmacyRouter } from '../src/server/routes/pharmacy.routes';
import { inpatientRouter } from '../src/server/routes/inpatient.routes';
import { billingRouter } from '../src/server/routes/billing.routes';
import { auditRouter } from '../src/server/routes/audit.routes';
import { settingsRouter } from '../src/server/routes/settings.routes';
import { doctorRouter } from '../src/server/routes/doctor.routes';
import { dashboardRouter } from '../src/server/routes/dashboard.routes';

const JWT_SECRET = process.env.JWT_SECRET || 'hospital-management-secret-key-2026-secure';

function hashPassword(password: string): string {
  return crypto.createHash('sha256').update(password).digest('hex');
}

async function seedDatabaseIfEmpty() {
  try {
    const usersSnapshot = await db.collection('users').limit(1).get();
    if (usersSnapshot.empty) {
      const mockUsers = [
        {
          id: 'u-admin',
          username: 'admin',
          username_lowercase: 'admin@hospital.com',
          password_hash: hashPassword('admin123'),
          name: 'Administrator Chief',
          role: 'Admin',
          email: 'admin@hospital.com',
          department: 'Administration',
        },
        {
          id: 'u-doc-asif',
          username: 'dr_asif',
          username_lowercase: 'doctor@hospital.com',
          password_hash: hashPassword('doctor123'),
          name: 'Dr. Muhammad Asif Khan',
          role: 'Doctor',
          email: 'doctor@hospital.com',
          department: 'Cardiology',
          specialization: 'Cardiology & Internal Medicine',
          qualification: 'MBBS, FCPS (Cardiology)',
          consultation_fee: 2500,
          leaves: [],
        },
        {
          id: 'u-nurse-bushra',
          username: 'nurse_bushra',
          username_lowercase: 'nurse@hospital.com',
          password_hash: hashPassword('nurse123'),
          name: 'RN Head Nurse Bushra',
          role: 'Nurse',
          email: 'nurse@hospital.com',
          department: 'IPD - CCU Ward',
        },
        {
          id: 'u-lab-kamran',
          username: 'lab_kamran',
          username_lowercase: 'labtech@hospital.com',
          password_hash: hashPassword('labtech123'),
          name: 'Lab Specialist Kamran',
          role: 'Lab Technician',
          email: 'labtech@hospital.com',
          department: 'Pathology & Radiology',
        },
        {
          id: 'u-pharm-tariq',
          username: 'pharmacist_tariq',
          username_lowercase: 'pharmacist@hospital.com',
          password_hash: hashPassword('pharmacist123'),
          name: 'Chief Pharmacist Tariq',
          role: 'Pharmacist',
          email: 'pharmacist@hospital.com',
          department: 'Pharmacy',
        },
      ];
      for (const u of mockUsers) {
        await db.collection('users').doc(u.id).set(u);
      }
    }
  } catch (e) {
    console.error('[SEED] Error during seeding:', e);
  }
}

// Create Express app
const app = express();

// Normalize req.url to always start with /api in Vercel serverless environment
app.use((req: Request, res: Response, next: NextFunction) => {
  if (!req.url.startsWith('/api')) {
    req.url = '/api' + (req.url.startsWith('/') ? '' : '/') + req.url;
  }
  next();
});

// CORS headers for Vercel serverless
app.use((req: Request, res: Response, next: NextFunction) => {
  res.header('Access-Control-Allow-Origin', '*');
  res.header('Access-Control-Allow-Methods', 'GET,PUT,POST,DELETE,PATCH,OPTIONS');
  res.header('Access-Control-Allow-Headers', 'Content-Type, Authorization');
  if (req.method === 'OPTIONS') {
    res.sendStatus(200);
    return;
  }
  next();
});

app.use(express.json({ limit: '20mb' }));
app.use(express.urlencoded({ extended: true, limit: '20mb' }));

// Mount all API route modules
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

// Health check endpoint
app.get('/api/health', (_req: Request, res: Response) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString(), service: 'St. Jude HMS API' });
});

// Seed on cold start (Vercel serverless cold boot)
seedDatabaseIfEmpty();

export default app;

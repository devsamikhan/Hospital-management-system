/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 *
 * Vercel Serverless Function Entry Point
 * Wraps the Express app for Vercel's serverless runtime.
 * All /api/* requests are routed here by vercel.json rewrites.
 * Trigger: Force Vercel redeploy to apply newly configured environment variables.
 */

import express, { Request, Response, NextFunction } from 'express';
import path from 'path';
import crypto from 'crypto';
import { dbService, db } from './db';

// Import modular micro-service routers
import { authRouter } from './routes/auth.routes';
import { patientRouter } from './routes/patient.routes';
import { appointmentRouter } from './routes/appointment.routes';
import { clinicalRouter } from './routes/clinical.routes';
import { labRouter } from './routes/lab.routes';
import { pharmacyRouter } from './routes/pharmacy.routes';
import { inpatientRouter } from './routes/inpatient.routes';
import { billingRouter } from './routes/billing.routes';
import { auditRouter } from './routes/audit.routes';
import { settingsRouter } from './routes/settings.routes';
import { doctorRouter } from './routes/doctor.routes';
import { dashboardRouter } from './routes/dashboard.routes';

const JWT_SECRET = process.env.JWT_SECRET || 'hospital-management-secret-key-2026-secure';

function hashPassword(password: string): string {
  return crypto.createHash('sha256').update(password).digest('hex');
}

async function seedDatabaseIfEmpty() {
  if (!db) {
    console.warn("[SEED] Seeding skipped: Firestore client is null.");
    return;
  }
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

// Automatically adjust req.url dynamically from Vercel routing headers to guarantee 100% route matching
app.use((req: Request, res: Response, next: NextFunction) => {
  const originalUrl = (req.headers['x-vercel-forwarded-path'] as string) || 
                      (req.headers['x-matched-path'] as string) || 
                      req.url;

  if (originalUrl) {
    req.url = originalUrl;
  }

  // Normalize to always start with /api prefix
  if (!req.url.startsWith('/api')) {
    req.url = '/api' + (req.url.startsWith('/') ? '' : '/') + req.url;
  }

  console.log(`[PATH ADJUSTED]: Final mapped request URL inside Express is: ${req.url}`);
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
try {
  seedDatabaseIfEmpty();
} catch (e) {
  console.error("Failed to trigger database seeding on cold boot:", e);
}

// Global error handling middleware
app.use((err: any, req: Request, res: Response, next: NextFunction) => {
  console.error('[GLOBAL ERROR HANDLER]:', err);
  res.status(500).json({
    message: 'Internal Server Error',
    error: err.message || String(err),
    hint: 'Please ensure that your Firebase environment variables (FIREBASE_PROJECT_ID, FIREBASE_CLIENT_EMAIL, FIREBASE_PRIVATE_KEY or FIREBASE_SERVICE_ACCOUNT) are configured correctly in the Vercel dashboard.'
  });
});

export default app;

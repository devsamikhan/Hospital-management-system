<div align="center">

# 🏥 St. Jude Enterprise Hospital Management System

### *Enterprise-Grade SaaS Clinical & Administrative Portal*

[![React](https://img.shields.io/badge/Frontend-React%2019%20%2B%20Vite%206-61DAFB?style=for-the-badge&logo=react&logoColor=white)](https://react.dev/)
[![TypeScript](https://img.shields.io/badge/Language-TypeScript%205-3178C6?style=for-the-badge&logo=typescript&logoColor=white)](https://www.typescriptlang.org/)
[![Express](https://img.shields.io/badge/Backend-Express%20%2B%20Node.js-000000?style=for-the-badge&logo=express&logoColor=white)](https://expressjs.com/)
[![Firebase](https://img.shields.io/badge/Cloud%20DB-Firebase%20Firestore-FFCA28?style=for-the-badge&logo=firebase&logoColor=black)](https://firebase.google.com/)
[![Tailwind](https://img.shields.io/badge/Styling-Tailwind%20CSS%20v4-06B6D4?style=for-the-badge&logo=tailwindcss&logoColor=white)](https://tailwindcss.com/)
[![Vercel](https://img.shields.io/badge/Deployed%20On-Vercel-000000?style=for-the-badge&logo=vercel&logoColor=white)](https://vercel.com/)
[![License](https://img.shields.io/badge/License-Apache%202.0-green?style=for-the-badge)](LICENSE)

> A state-of-the-art, fully-typed, cloud-native clinical operations platform engineered for modern Pakistani medical institutions. Architected on a **decoupled micro-service routing framework** with an immersive glassmorphic UI, deep **PKR (Rs.)** localization, and HIPAA-aligned security controls — deployable to Vercel serverless infrastructure in a single command.

🔗 **Live Demo:** [https://st-jude-hms.vercel.app](https://st-jude-hms.vercel.app)
📁 **Repository:** [github.com/devsamikhan/Hospital-management-system](https://github.com/devsamikhan/Hospital-management-system)

</div>

---

## 📋 Table of Contents

- [System Overview](#-system-overview)
- [Core Architecture](#️-core-architecture)
- [Advanced Clinical Workflows](#-advanced-clinical-workflows)
- [Module Catalog](#-micro-service-module-catalog)
- [Technology Stack](#️-technology-stack)
- [Installation & Local Setup](#-installation--local-setup)
- [Environment Configuration](#-environment-configuration)
- [Seed Clinician Credentials](#-seed-clinician-credentials)
- [HIPAA Compliance & Security](#️-hipaa-compliance--security)
- [PKR Currency Standards](#-pkr-currency-standards)

---

## 🌐 System Overview

St. Jude HMS is a **full-stack TypeScript monorepo** that replaces fragmented paper-based and legacy HMIS workflows with a unified, real-time cloud portal. Every clinical touchpoint — from ER triage to pharmacy dispensing — is connected through a shared **Google Cloud Firestore** document layer, providing instantaneous data consistency across all user roles.

### Platform Highlights

| Capability | Implementation |
|---|---|
| **Multi-Role RBAC** | Admin, Doctor, Nurse, Lab Technician, Pharmacist, Receptionist |
| **ER Triage Engine** | Vitals-driven ESI Level 1–5 auto-scoring and waitlist sorting |
| **Billing Aggregator** | Multi-department PKR line items with dynamic triage multipliers |
| **Lab Chain of Custody** | 5-stage specimen lifecycle with critical flag alerts |
| **Pharmacy Formulary** | Multi-state prescription pipeline with 150-unit dosage ceiling |
| **IPD Bed Grid** | Virtual ward map across CCU, Private, Semi-Private, General |
| **HIPAA Audit Trail** | Immutable, append-only Firestore security log feed |
| **Firebase Persistence** | Atomic `runTransaction` operations for zero data-loss writes |

---

## 🏗️ Core Architecture

The platform is structured as a **single Express TypeScript server** (`server.ts`) that mounts 12 isolated micro-service route modules. Each route module owns its own Firestore collection scope, middleware stack, and business logic — eliminating cross-module coupling and enabling independent scaling.

```
                 ┌─────────────── server.ts (App Core Engine) ───────────────┐
                 │        Vite Dev Proxy  │  Express API  │  Firebase Admin  │
                 └───────────────────────────────────────────────────────────┘
                                          │
          ┌───────────┬──────────┬────────┴────────┬────────────┬────────────┐
          ▼           ▼          ▼                 ▼            ▼            ▼
   auth.routes   patient    appointment      clinical       lab         pharmacy
   (Sessions)  (Demographics) (OPD Slots)  (SOAP EMR)  (Radiology)  (Formulary)
          │           │          │                 │            │            │
          └───────────┴──────────┴─────────────────┴────────────┴────────────┘
                                          │
          ┌───────────┬──────────┬─────────────────┬────────────┐
          ▼           ▼          ▼                 ▼            ▼
      inpatient   billing     audit           settings      dashboard
      (Bed IPD)  (Ledger)  (HIPAA Logs)    (Currency PKR)  (Analytics)
```

### Directory Structure

```
hospital-management-system/
├── server.ts                          # Express app entry point + Vite integration
├── vite.config.ts                     # Vite 6 bundler configuration
├── tsconfig.json                      # Strict TypeScript compiler config
├── .env                               # 🔒 Local env vars (gitignored)
├── .env.example                       # Safe env var template for contributors
│
├── src/
│   ├── main.tsx                       # React 19 root mount
│   ├── App.tsx                        # SPA router + RBAC viewport switcher
│   ├── types.ts                       # Centralized TypeScript interface definitions
│   ├── index.css                      # Glassmorphic design system + Cubic-Bezier animations
│   │
│   ├── context/
│   │   └── HospitalContext.tsx        # Global state provider + seed data hydration layer
│   │
│   ├── components/
│   │   ├── Sidebar.tsx                # RBAC-aware navigation rail
│   │   ├── DashboardStatsOverview.tsx # KPI cards + Recharts Admin analytics
│   │   ├── PatientsDirectory.tsx      # MRN registry + ESI triage waitlist
│   │   ├── AppointmentsBook.tsx       # OPD scheduling + conflict detection
│   │   ├── ClinicalEMRConsultation.tsx# SOAP notes + prescription writer
│   │   ├── LaboratoryRadiologyModule.tsx # Lab order lifecycle + results viewer
│   │   ├── PharmacyInventoryManagement.tsx # Formulary + dispensing pipeline
│   │   ├── InpatientWardBeds.tsx      # Virtual bed grid + nursing chart
│   │   ├── BillingAccountingLedger.tsx# Invoice builder + insurance claims
│   │   ├── AuditLogsViewer.tsx        # HIPAA log feed (Admin only)
│   │   └── HospitalSettings.tsx       # System-wide configuration panel
│   │
│   └── server/
│       ├── db.ts                      # Firebase Admin SDK init (env-var-only)
│       └── routes/
│           ├── auth.routes.ts         # SHA-256 auth + JWT session management
│           ├── patient.routes.ts      # Patient CRUD + MRN assignment + vitals
│           ├── appointment.routes.ts  # Schedule management + conflict guards
│           ├── clinical.routes.ts     # SOAP EMR + auto-billing triggers
│           ├── lab.routes.ts          # Lab order lifecycle + custody chain
│           ├── pharmacy.routes.ts     # Drug formulary + inventory controls
│           ├── inpatient.routes.ts    # Bed management + discharge processor
│           ├── billing.routes.ts      # Multi-dept PKR ledger + insurance auth
│           ├── audit.routes.ts        # Append-only HIPAA audit feed
│           ├── settings.routes.ts     # PKR currency + system preferences
│           ├── doctor.routes.ts       # Clinician profiles + schedule matrices
│           └── dashboard.routes.ts    # Analytics aggregation endpoints
```

---

## 🔬 Advanced Clinical Workflows

### 1. Vitals-Driven ER Emergency Triage (ESI Queue)

The patient registration pipeline parses incoming vital sign parameters in real time and computes an **Emergency Severity Index (ESI) Level** from 1 to 5:

| ESI Level | Clinical Category | Trigger Parameters | Queue Priority |
|---|---|---|---|
| **ESI 1** | Resuscitation | GCS < 8 or SpO2 < 85% | ⚡ Immediate — top of queue |
| **ESI 2** | Emergent | SpO2 85–90% or HR > 130 | 🔴 Override standard chronology |
| **ESI 3** | Urgent | SpO2 90–95%, abnormal vitals | 🟠 Elevated priority |
| **ESI 4** | Less Urgent | Stable vitals, single resource | 🟡 Standard chronology |
| **ESI 5** | Non-Urgent | Fully stable, zero resource | 🟢 Base queue position |

> **Implementation Detail:** The scoring engine within `patient.routes.ts` evaluates raw `GCS`, `SpO2`, `heartRate`, and `temperature` fields on every patient registration or vitals-update write. ESI 1 and ESI 2 patients are dynamically surfaced to the top of all active clinician viewport waiting lists without requiring manual override.

---

### 2. Dynamic Resource Billing Multipliers

The financial aggregation engine in `billing.routes.ts` applies a **Clinical Resource Multiplier** to daily room charges based on ESI severity, reflecting actual resource consumption at each acuity level:

```
Base Daily Rate × ESI Triage Multiplier = Actual Acuity-Adjusted Daily Charge
```

| Acuity Level | Multiplier | ICU (Rs. 1,200/day) | Private VIP (Rs. 500/day) | General Ward (Rs. 120/day) |
|---|---|---|---|---|
| ESI Level 1 | **2.0×** | Rs. 2,400 | Rs. 1,000 | Rs. 240 |
| ESI Level 2 | **1.75×** | Rs. 2,100 | Rs. 875 | Rs. 210 |
| ESI Level 3 | **1.5×** | Rs. 1,800 | Rs. 750 | Rs. 180 |
| ESI Level 4 | **1.25×** | Rs. 1,500 | Rs. 625 | Rs. 150 |
| ESI Level 5 | **1.0×** | Rs. 1,200 | Rs. 500 | Rs. 120 |

Procedure line items from clinical EMR visits (`clinical.routes.ts`) and laboratory orders (`lab.routes.ts`) are auto-appended to the patient invoice via Firestore atomic transactions, ensuring a zero-gap billing ledger across all departments.

---

### 3. Lab / Radiology Specimen Chain of Custody

Every diagnostic test order passes through a strict, **tamper-proof 5-stage lifecycle** managed by `lab.routes.ts`:

```
[1] Ordered  ──►  [2] Sample Collected  ──►  [3] In-Lab Processing  ──►  [4] Results Written  ──►  [5] Doctor Reviewed
```

- **Stage transitions** are unidirectional — no stage can be reverted once committed to Firestore.
- **Critical Flag Protocol:** When a result is written with an `Abnormal` or `Critical` status flag, the system automatically pushes a high-visibility alert notification to the ordering clinician's dashboard.
- **Radiology Attachments:** X-ray and imaging results support `base64` encoded static image payloads stored as Firestore document fields.

> **Audit Integration:** Every stage transition fires `logAudit()` in `audit.routes.ts`, writing an immutable timestamped log entry with the acting clinician's identity and the new lifecycle state.

---

### 4. Multi-Stage Pharmacy Formulary Lifecycle

The pharmacy module manages patient prescriptions through a **structured execution pipeline** enforced by `pharmacy.routes.ts`:

```
[Ordered]  ──►  [Verifying Insurance]  ──►  [Preparing]  ──►  [Ready for Pickup]  ──►  [Dispensed]
```

**Safety Ceiling Enforcement:**

> ⚠️ The system enforces a hard-coded **150-unit single-order ceiling** on all pharmaceutical dispenses. Any order submission exceeding this threshold is automatically rejected with a clinical safety error — mitigating accidental overdose or stock-dump events.

**Inventory Controls:**
- Real-time stock decrement on every `Dispensed` state transition using atomic Firestore transactions.
- Low-stock threshold alerts (configurable per drug via `HospitalSettings`) are raised when any formulary item falls below its defined `reorderLevel`.
- Batch expiry tracking with automatic alert surfacing when drugs approach their `expiryDate` within 60 days.

---

## 📦 Micro-Service Module Catalog

| Route Module | Firestore Collection | Primary Responsibility |
|---|---|---|
| `auth.routes.ts` | `users` | SHA-256 password hashing, JWT session issuance, role claim injection |
| `patient.routes.ts` | `patients` | MRN auto-generation, demographics CRUD, vitals → ESI scoring |
| `appointment.routes.ts` | `appointments` | OPD slot booking, double-booking conflict detection, schedule queries |
| `clinical.routes.ts` | `encounters` | SOAP note structured logging, prescription writing, auto-invoice triggers |
| `lab.routes.ts` | `lab_orders` | Test lifecycle management, specimen custody, critical alert dispatch |
| `pharmacy.routes.ts` | `inventory` + `pharmacy_orders` | Formulary management, dispensing pipeline, 150-unit safety ceiling |
| `inpatient.routes.ts` | `beds` + `admissions` | Ward bed grid, admission/discharge processing, nurse progress notes |
| `billing.routes.ts` | `invoices` | Multi-dept line-item aggregation, PKR tax computation, insurance claims |
| `audit.routes.ts` | `audit_logs` | Append-only HIPAA security log feed (Admin role restricted) |
| `settings.routes.ts` | `settings` | PKR currency config, hospital metadata, system-wide preferences |
| `doctor.routes.ts` | `users` (doctor subset) | Clinician profile management, specialty and schedule matrices |
| `dashboard.routes.ts` | All collections | Cross-collection analytics aggregation for KPI endpoint responses |

---

## 🛠️ Technology Stack

| Layer | Technology | Version | Purpose |
|---|---|---|---|
| **SPA Framework** | React | 19.x | Fiber reconciliation, concurrent rendering |
| **Build Tooling** | Vite | 6.x | HMR dev server, production bundling |
| **Styling** | Tailwind CSS | 4.x | Glassmorphic utility-first design system |
| **Animations** | Custom CSS | — | Cubic-Bezier hardware-accelerated transitions |
| **Charts** | Recharts | 2.x | Area, Bar, Pie interactive data visualizations |
| **Language** | TypeScript | 5.x | Strict end-to-end type safety |
| **Backend** | Express.js | 4.x | REST API middleware, route isolation |
| **Runtime** | Node.js | 18+ | V8 serverless execution environment |
| **Database** | Firebase Firestore | Admin SDK 12.x | NoSQL cloud persistence, atomic transactions |
| **Deployment** | Vercel | — | Serverless edge deployment, CI/CD pipeline |

---

## 🚀 Installation & Local Setup

### Prerequisites

Ensure the following are installed on your development machine before proceeding:

- **Node.js** `v18.0.0` or higher — [Download](https://nodejs.org/)
- **npm** `v9.0.0` or higher (bundled with Node.js)
- A configured **Google Firebase project** with Firestore enabled in Native Mode

---

### Step 1 — Clone the Repository

```bash
git clone https://github.com/devsamikhan/Hospital-management-system.git
cd Hospital-management-system
```

### Step 2 — Install All Dependencies

```bash
npm install
```

### Step 3 — Configure Environment Variables

Copy the provided example template and populate your Firebase credentials:

```bash
cp .env.example .env
```

Open `.env` and fill in your project values (see [Environment Configuration](#-environment-configuration) below).

### Step 4 — Verify TypeScript Compilation

Run the TypeScript compiler in check-only mode (no output files emitted):

```bash
npx tsc --noEmit
```

A clean run with zero errors confirms the codebase is type-safe and ready.

### Step 5 — Launch the Development Server

```bash
npm run dev
```

The application starts at **[http://localhost:3000](http://localhost:3000)** with full Vite HMR active. The Express backend and React frontend share the same port via the integrated Vite middleware proxy.

### Step 6 — Build for Production

```bash
npm run build
```

Outputs an optimized static bundle to `dist/` ready for Vercel deployment.

---

## 🔐 Environment Configuration

> **Critical Security Notice:** The Firebase Admin SDK is initialized exclusively through `process.env` environment variables — **never** from a raw `firebase-service-account.json` file read on disk. This design ensures credentials are never bundled into the production artifact or exposed in the source control history.

Create your `.env` file in the project root with the following structure:

```env
# ── Server ──────────────────────────────────────────────────────────
PORT=3000

# ── Firebase Admin SDK Credentials ───────────────────────────────────
# Obtain these values from your Firebase Console:
# Project Settings → Service Accounts → Generate New Private Key

FIREBASE_PROJECT_ID=your-firebase-project-id
FIREBASE_CLIENT_EMAIL=firebase-adminsdk-xxxxx@your-project-id.iam.gserviceaccount.com
FIREBASE_DATABASE_URL=https://your-project-id-default-rtdb.firebaseio.com

# Paste your private key below. The application automatically replaces
# escaped \\n sequences with real newline characters at runtime.
FIREBASE_PRIVATE_KEY="-----BEGIN PRIVATE KEY-----\nMIIEvQIBA...[your key content]...\n-----END PRIVATE KEY-----\n"
```

**How the Firebase initialization works (`src/server/db.ts`):**

```typescript
import admin from 'firebase-admin';

admin.initializeApp({
  credential: admin.credential.cert({
    projectId:   process.env.FIREBASE_PROJECT_ID,
    clientEmail: process.env.FIREBASE_CLIENT_EMAIL,
    // Replaces escaped \n string literals with real newline characters
    privateKey:  process.env.FIREBASE_PRIVATE_KEY?.replace(/\\n/g, '\n'),
  }),
  databaseURL: process.env.FIREBASE_DATABASE_URL,
});
```

> 🔒 `firebase-service-account.json` and all `.env*` files (except `.env.example`) are included in `.gitignore` and will never be committed to source control.

### Vercel Deployment

Set the same environment variable keys in your Vercel project dashboard under **Settings → Environment Variables**. No code changes are required — the same `process.env` initialization works identically in the Vercel serverless runtime.

---

## 👥 Seed Clinician Credentials

The following clinician profiles are pre-seeded into Firestore on first deployment. Use them to explore each role-adaptive interface layout:

| 👤 Medical Staff Profile | 📧 Email | 🔑 Password | 🏥 Interface Scope |
|---|---|---|---|
| **Administrator Chief** | `admin@hospital.com` | `admin123` | Full system access: revenue analytics, Recharts KPI graphs, HIPAA audit logs, all settings |
| **Dr. Muhammad Asif Khan** | `doctor@hospital.com` | `doctor123` | Patient EMR, ESI triage queue, SOAP consultation logger, prescription writer |
| **RN Head Nurse Bushra** | `nurse@hospital.com` | `nurse123` | IPD bed tracking grid, nurse progress chart entries, inpatient notes |
| **Lab Specialist Kamran** | `labtech@hospital.com` | `labtech123` | Lab order lifecycle, specimen result inputs, critical flag toggles |
| **Chief Pharmacist Tariq** | `pharmacist@hospital.com` | `pharmacist123` | Drug stock controls, low-stock alerts, formulary dispensing pipeline |

> **Fallback Behaviour:** If Firebase is unavailable or unconfigured locally, the application automatically hydrates all views with a comprehensive **Pakistani clinical seed dataset** (10 patients, 10 appointments, 8 lab orders, 15 inventory items, 8 invoices, 16 beds, 20 audit logs) ensuring the UI renders fully populated for demonstration and review.

---

## 🛡️ HIPAA Compliance & Security

The platform is engineered around federal healthcare data protection standards from the ground up:

### Role-Based Access Control (RBAC)

Every route module validates the active clinician's JWT role claim before serving data. Unauthorized role access returns a `403 Forbidden` at the middleware layer — not the application layer.

```
Admin       → All 12 route modules + HIPAA audit feed
Doctor      → patient, appointment, clinical, lab, billing, inpatient
Nurse       → patient, inpatient, lab (read)
Lab Tech    → lab (full), patient (read)
Pharmacist  → pharmacy (full), patient (read)
Receptionist→ patient (registration), appointment
```

### Append-Only HIPAA Audit Trail

Every significant read/write operation across clinical data triggers the `logAudit()` function:

```typescript
await logAudit({
  actorId:    req.user.id,
  actorEmail: req.user.email,
  actorRole:  req.user.role,
  action:     'PATIENT_RECORD_UPDATED',
  targetId:   patientId,
  timestamp:  new Date().toISOString(),
  ipAddress:  req.ip,
});
```

This writes an **immutable timestamped log entry** directly to the `audit_logs` Firestore collection — readable exclusively by the `Admin` role through `audit.routes.ts`. Audit records cannot be deleted or modified post-write.

### Additional Security Controls

- **SHA-256 Password Hashing:** All clinician passwords are hashed with SHA-256 before persistence — plaintext passwords are never stored in Firestore.
- **JWT Token Verification:** All protected API routes validate Bearer tokens issued at login before processing any request body.
- **Environment Secret Isolation:** Firebase credentials are loaded exclusively from `process.env` — never from filesystem JSON reads — ensuring secrets are never bundled into build artifacts.

---

## 💱 PKR Currency Standards

All financial computations, invoice totals, pricing matrices, and analytics data across the platform are denominated in **Pakistani Rupees (PKR)** using the `Rs.` prefix notation:

```
Rs. 1,200 / day  →  ICU Critical Care
Rs.   500 / day  →  Private VIP Suite
Rs.   250 / day  →  Semi-Private Ward
Rs.   120 / day  →  General Mardana/Zenana Ward
Rs.    80 / day  →  Pediatric Ward
```

The currency symbol and formatting precision are configurable system-wide via the `HospitalSettings` panel — persisted to Firestore and consumed by all rendering components through the `HospitalContext` global state provider.

---

## 📊 Dashboard Analytics (Admin Role)

When authenticated as **Administrator Chief**, the dashboard renders four live Recharts visualizations populated from seed data:

| Chart | Type | Data Points |
|---|---|---|
| **Hospital Financial Cash Flow** | Area Chart | Monthly billed revenue vs collected PKR (Jan–Aug) |
| **Inpatient Bed Allocations** | Donut/Pie Chart | Occupied beds by ward category |
| **ER Emergency ESI Queue Volumes** | Horizontal Bar Chart | Active patient counts by ESI Level 1–5 |
| **Weekly OPD Specialty Roster** | Column Bar Chart | Outpatient bookings by department |

---

## 🤝 Contributing

Pull requests are welcome. For major workflow changes, please open an issue first to discuss the proposed modification.

1. Fork the repository
2. Create your feature branch: `git checkout -b feat/your-feature-name`
3. Commit your changes: `git commit -m "feat: describe your change"`
4. Push to the branch: `git push origin feat/your-feature-name`
5. Open a Pull Request against `master`

---

## 📄 License

Distributed under the **Apache 2.0 License**. See [`LICENSE`](LICENSE) for full terms.

---

<div align="center">

**Built with ❤️ for modern Pakistani healthcare institutions**

*St. Jude Hospital Management System — Engineered for clinical excellence*

</div>

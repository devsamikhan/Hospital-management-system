// File: src/server/db.ts
// Cloud Firebase Firestore Abstraction Module

import admin from 'firebase-admin';
import path from 'path';
import fs from 'fs';
import dotenv from 'dotenv';
import crypto from 'crypto';

dotenv.config();

// Helper to secure verify passwords (SHA-256)
function hashPassword(password: string): string {
  return crypto.createHash('sha256').update(password).digest('hex');
}

const databaseURL = "https://hospital-managemnt-syste-ece35-default-rtdb.firebaseio.com";

// Initialize Firebase Admin SDK using secure production environment variables
if (admin.apps.length === 0) {
  let credentialObj: any = null;
  
  if (process.env.FIREBASE_PROJECT_ID && process.env.FIREBASE_CLIENT_EMAIL && process.env.FIREBASE_PRIVATE_KEY) {
    let privateKey = process.env.FIREBASE_PRIVATE_KEY;
    // Replace escaped newlines with actual newline characters to prevent parsing errors on Vercel
    privateKey = privateKey.replace(/\\n/g, '\n');
    
    credentialObj = admin.credential.cert({
      projectId: process.env.FIREBASE_PROJECT_ID,
      clientEmail: process.env.FIREBASE_CLIENT_EMAIL,
      privateKey: privateKey
    });
    console.log("Firebase Admin SDK successfully initialized using separate environment variables.");
  } else if (process.env.FIREBASE_SERVICE_ACCOUNT) {
    try {
      const sa = JSON.parse(process.env.FIREBASE_SERVICE_ACCOUNT);
      if (sa.private_key) {
        sa.private_key = sa.private_key.replace(/\\n/g, '\n');
      }
      credentialObj = admin.credential.cert(sa);
      console.log("Firebase Admin SDK successfully initialized using FIREBASE_SERVICE_ACCOUNT environment variable.");
    } catch (e) {
      console.error("Failed to parse FIREBASE_SERVICE_ACCOUNT environment variable.", e);
    }
  }
  
  if (credentialObj) {
    admin.initializeApp({
      credential: credentialObj,
      databaseURL
    });
  } else {
    // Local fallback using application default credentials or blank parameters
    admin.initializeApp({ databaseURL });
    console.log("Firebase Admin SDK initialized using fallback application credentials.");
  }
}

// Global Firestore Client Singleton instance
export const db = admin.firestore();

/**
 * dbService Abstraction Wrappers mapping NoSQL collections to TypeScript models
 */
export const dbService = {
  
  // Seed Users and complete clinical datasets to guarantee ready-to-test systems in production
  async seedDatabaseIfVacant() {
    try {
      console.log("[SEEDING] Performing defensive initialization check...");
      
      // Explicit baseline check to prevent database duplication and network bandwidth consumption
      const usersSnapshot = await db.collection('users').limit(1).get();
      if (!usersSnapshot.empty) {
        console.log("[SEEDING] Firestore database already initialized. Terminating seeding routine.");
        return;
      }
      
      console.log("[SEEDING] Collection is vacant. Launching robust, fully-connected clinical mock dataset writes...");

      // 1. Seed Collection 'users'
      console.log("[SEEDING] Creating medical staff clinician profiles...");
      const mockUsers = [
        {
          id: "u-admin",
          username: "admin",
          username_lowercase: "admin@hospital.com",
          password_hash: hashPassword("admin123"),
          name: "Administrator Chief",
          role: "Admin",
          email: "admin@hospital.com",
          phone: "+92 300 0001111",
          department: "Administration"
        },
        {
          id: "u-doc-smith",
          username: "dr_smith",
          username_lowercase: "doctor@hospital.com",
          password_hash: hashPassword("doctor123"),
          name: "Dr. Muhammad Asif Khan",
          role: "Doctor",
          email: "doctor@hospital.com",
          phone: "+92 321 1112222",
          department: "Emergency & Triage Operations",
          specialization: "Emergency Medicine",
          qualification: "FCPS, Chief of Emergency & Triage Operations",
          consultation_fee: 1500.00,
          leaves: []
        },
        {
          id: "u-doc-amna",
          username: "dr_amna",
          username_lowercase: "amna@hospital.com",
          password_hash: hashPassword("doctor123"),
          name: "Dr. Amna Bilal",
          role: "Doctor",
          email: "amna@hospital.com",
          phone: "+92 322 3334444",
          department: "Pediatrics",
          specialization: "Pediatrics",
          qualification: "FCPS, Senior Consultant Pediatrician",
          consultation_fee: 1200.00,
          leaves: []
        },
        {
          id: "u-doc-sajid",
          username: "dr_sajid",
          username_lowercase: "sajid@hospital.com",
          password_hash: hashPassword("doctor123"),
          name: "Dr. Sajid Mehmood",
          role: "Doctor",
          email: "sajid@hospital.com",
          phone: "+92 323 5556666",
          department: "Cardiology",
          specialization: "Cardiology",
          qualification: "FCPS, Chief Interventional Cardiologist",
          consultation_fee: 2500.00,
          leaves: []
        },
        {
          id: "u-nurse-nancy",
          username: "nurse_nancy",
          username_lowercase: "nurse@hospital.com",
          password_hash: hashPassword("nurse123"),
          name: "RN Head Nurse Bushra Bibi",
          role: "Nurse",
          email: "nurse@hospital.com",
          phone: "+92 333 2223333",
          department: "IPD Wards"
        },
        {
          id: "u-lab-alex",
          username: "lab_alex",
          username_lowercase: "labtech@hospital.com",
          password_hash: hashPassword("labtech123"),
          name: "Kamran Ahmed",
          role: "Lab Technician",
          email: "labtech@hospital.com",
          phone: "+92 312 4445555",
          department: "Diagnostics"
        },
        {
          id: "u-pharm-peter",
          username: "pharmacist",
          username_lowercase: "pharmacist@hospital.com",
          password_hash: hashPassword("pharm123"),
          name: "Tariq Rafiq",
          role: "Pharmacist",
          email: "pharmacist@hospital.com",
          phone: "+92 345 5556666",
          department: "Formulary"
        }
      ];

      for (const u of mockUsers) {
        await db.collection('users').doc(u.id).set(u);
      }

      // 2. Seed Collection 'patients' (Sequential MRNs like MRN-10001 to MRN-10005)
      console.log("[SEEDING] Creating sequential clinical patient files...");
      const mockPatients = [
        {
          id: "MRN-10001",
          name: "Muhammad Zain",
          dob: "1992-05-15",
          gender: "Male",
          contact: "+92 300 1234567",
          email: "zain@mianwali.com",
          address: "Main Bazaar, Mianwali",
          blood_group: "O+",
          emergency_contact_name: "Ghulam Rasool",
          emergency_contact_relationship: "Father",
          emergency_contact_phone: "+92 321 9876543",
          is_archived: false,
          created_at: new Date("2026-01-10T10:00:00Z").toISOString(),
          esi_level: 5,
          triage_status: "Outpatient",
          triage_notes: "Dengue serology requested, patient reports fever.",
          triage_score: 5,
          triage_timestamp: new Date("2026-01-10T10:00:00Z").toISOString()
        },
        {
          id: "MRN-10002",
          name: "Aisha Bibi",
          dob: "1998-10-10",
          gender: "Female",
          contact: "+92 312 3456789",
          email: "aisha@lahore.com",
          address: "Allama Iqbal Town, Lahore",
          blood_group: "A-",
          emergency_contact_name: "Ahmed Ali",
          emergency_contact_relationship: "Spouse",
          emergency_contact_phone: "+92 333 8765432",
          is_archived: false,
          created_at: new Date("2026-02-15T11:30:00Z").toISOString(),
          esi_level: 2,
          triage_status: "ER Queue",
          triage_notes: "Severe dehydration, high fever. Monitored in critical zone.",
          triage_score: 9,
          triage_timestamp: new Date("2026-05-30T09:30:00Z").toISOString()
        },
        {
          id: "MRN-10003",
          name: "Ghulam Rasool",
          dob: "1964-02-12",
          gender: "Male",
          contact: "+92 345 5678901",
          email: "rasool@mianwali.com",
          address: "Essakhel, Mianwali District",
          blood_group: "B+",
          emergency_contact_name: "Muhammad Zain",
          emergency_contact_relationship: "Son",
          emergency_contact_phone: "+92 300 1234567",
          is_archived: false,
          created_at: new Date("2026-03-01T09:15:00Z").toISOString(),
          esi_level: 3,
          triage_status: "ER Queue",
          triage_notes: "Persistent abdominal pain, nausea.",
          triage_score: 6,
          triage_timestamp: new Date("2026-05-30T09:40:00Z").toISOString()
        },
        {
          id: "MRN-10004",
          name: "Fatima Zahra",
          dob: "2018-04-05",
          gender: "Female",
          contact: "+92 333 5551212",
          email: "fatima@sargodha.com",
          address: "Civil Lines, Sargodha",
          blood_group: "AB+",
          emergency_contact_name: "Aisha Bibi",
          emergency_contact_relationship: "Mother",
          emergency_contact_phone: "+92 312 3456789",
          is_archived: false,
          created_at: new Date("2026-04-12T14:20:00Z").toISOString(),
          esi_level: 1,
          triage_status: "ER Queue",
          triage_notes: "High fever, stable SpO2 96%. Pediatrics team active.",
          triage_score: 10,
          triage_timestamp: new Date("2026-05-30T09:45:00Z").toISOString()
        },
        {
          id: "MRN-10005",
          name: "Ahmed Ali",
          dob: "1981-11-20",
          gender: "Male",
          contact: "+92 321 7778888",
          email: "ahmed@rawalpindi.com",
          address: "Saddar, Rawalpindi",
          blood_group: "O-",
          emergency_contact_name: "Aisha Bibi",
          emergency_contact_relationship: "Spouse",
          emergency_contact_phone: "+92 312 3456789",
          is_archived: false,
          created_at: new Date("2026-05-01T15:00:00Z").toISOString(),
          esi_level: 4,
          triage_status: "ER Queue",
          triage_notes: "Minor localized trauma on hand.",
          triage_score: 4,
          triage_timestamp: new Date("2026-05-30T09:50:00Z").toISOString()
        }
      ];

      for (const p of mockPatients) {
        await db.collection('patients').doc(p.id).set(p);
      }

      // 3. Seed Collection 'beds' (IPD Ward Grid in PKR)
      console.log("[SEEDING] Creating ward bedside accommodations...");
      const mockBeds = [
        { id: "bed-g1", ward_name: "General Ward (Mardana)", bed_number: "G-101", type: "General Ward", status: "Vacant" },
        { id: "bed-g2", ward_name: "General Ward (Mardana)", bed_number: "G-102", type: "General Ward", status: "Vacant" },
        { id: "bed-g3", ward_name: "General Ward (Zenana)", bed_number: "G-103", type: "General Ward", status: "Vacant" },
        { id: "bed-s1", ward_name: "Semi-Private Block", bed_number: "S-201", type: "Semi-Private", status: "Occupied", patient_id: "MRN-10003" },
        { id: "bed-s2", ward_name: "Semi-Private Block", bed_number: "S-202", type: "Semi-Private", status: "Vacant" },
        { id: "bed-p1", ward_name: "Private VIP Room", bed_number: "P-301", type: "Private", status: "Occupied", patient_id: "MRN-10001" },
        { id: "bed-p2", ward_name: "Private VIP Room", bed_number: "P-302", type: "Private", status: "Vacant" },
        { id: "bed-i1", ward_name: "CCU / ICU Critical Care Unit", bed_number: "ICU-401", type: "ICU", status: "Occupied", patient_id: "MRN-10002" },
        { id: "bed-i2", ward_name: "CCU / ICU Critical Care Unit", bed_number: "ICU-402", type: "ICU", status: "Maintenance" }
      ];

      for (const b of mockBeds) {
        await db.collection('beds').doc(b.id).set(b);
      }

      // 4. Seed Collection 'admissions' (Inpatient History with occupied links)
      console.log("[SEEDING] Seeding inpatient EMR envelope clinical logs...");
      const mockAdmissions = [
        {
          id: "ADM-10001",
          patient_id: "MRN-10001",
          bed_id: "bed-p1",
          ward_name: "Private VIP Room",
          bed_number: "P-301",
          admission_date: new Date("2026-05-25T08:00:00Z").toISOString(),
          status: "Admitted",
          nursing_notes: [
            { id: "note-1", date: new Date("2026-05-25T12:00:00Z").toISOString(), text: "Patient admitted to Private VIP Room. Stable vitals.", nurseId: "u-nurse-nancy", nurseName: "RN Head Nurse Bushra Bibi" },
            { id: "note-2", date: new Date("2026-05-27T08:00:00Z").toISOString(), text: "Administered medications, pain decreasing.", nurseId: "u-nurse-nancy", nurseName: "RN Head Nurse Bushra Bibi" }
          ],
          progress_notes: [
            { id: "prog-1", date: new Date("2026-05-26T09:00:00Z").toISOString(), text: "Monitoring platelet count closely for active Dengue Fever. Stable vitals.", staffId: "u-doc-smith", staffName: "Dr. Muhammad Asif Khan" }
          ]
        },
        {
          id: "ADM-10002",
          patient_id: "MRN-10002",
          bed_id: "bed-i1",
          ward_name: "CCU / ICU Critical Care Unit",
          bed_number: "ICU-401",
          admission_date: new Date("2026-05-28T14:30:00Z").toISOString(),
          status: "Admitted",
          nursing_notes: [
            { id: "note-3", date: new Date("2026-05-28T15:00:00Z").toISOString(), text: "CCU monitoring active. Oxygen therapy initiated.", nurseId: "u-nurse-nancy", nurseName: "RN Head Nurse Bushra Bibi" }
          ],
          progress_notes: [
            { id: "prog-2", date: new Date("2026-05-29T10:00:00Z").toISOString(), text: "Recovering from acute clinical symptoms.", staffId: "u-doc-smith", staffName: "Dr. Muhammad Asif Khan" }
          ]
        }
      ];

      for (const a of mockAdmissions) {
        await db.collection('admissions').doc(a.id).set(a);
      }

      // 5. Seed Collection 'appointments' (OPD Slots Timeline rails)
      console.log("[SEEDING] Populating outpatient department appointment rails...");
      const mockAppointments = [
        {
          id: "APP-10001",
          patient_id: "MRN-10001",
          doctor_id: "u-doc-smith",
          doctor_name: "Dr. Muhammad Asif Khan",
          date_time: "2026-05-30T09:00:00.000Z",
          time_slot: "09:00 - 09:30 AM",
          status: "Scheduled",
          notes: "Fever evaluation and Dengue serology follow-up",
          created_at: new Date("2026-05-29T10:00:00Z").toISOString()
        },
        {
          id: "APP-10002",
          patient_id: "MRN-10002",
          doctor_id: "u-doc-smith",
          doctor_name: "Dr. Muhammad Asif Khan",
          date_time: "2026-05-30T10:30:00.000Z",
          time_slot: "10:30 - 11:00 AM",
          status: "Completed",
          notes: "Typhoid diagnostics & consultation",
          created_at: new Date("2026-05-28T11:00:00Z").toISOString()
        },
        {
          id: "APP-10003",
          patient_id: "MRN-10003",
          doctor_id: "u-doc-smith",
          doctor_name: "Dr. Muhammad Asif Khan",
          date_time: "2026-05-30T14:00:00.000Z",
          time_slot: "02:00 - 02:30 PM",
          status: "Scheduled",
          notes: "Initial consultation for abdominal pain",
          created_at: new Date("2026-05-29T14:00:00Z").toISOString()
        }
      ];

      for (const app of mockAppointments) {
        await db.collection('appointments').doc(app.id).set(app);
      }

      // 6. Seed Collection 'pharmacy_inventory' (10 Essential Drugs, 2 Under Stocked)
      console.log("[SEEDING] Creating pharmacy stock inventory lines...");
      const mockMeds = [
        { id: "med-1", name: "Amoxicillin 500mg", generic_name: "Amoxicillin", category: "Antibiotics", unit_price: 15.00, stock_quantity: 250, min_stock_level: 30, expiry_date: "2027-11-15", supplier: "Global Pharma Corp" },
        { id: "med-2", name: "Paracetamol 500mg", generic_name: "Acetaminophen", category: "Antipyretics", unit_price: 5.00, stock_quantity: 400, min_stock_level: 50, expiry_date: "2028-09-01", supplier: "McKesson Healthcare" },
        { id: "med-3", name: "Insulin Glargine", generic_name: "Insulin", category: "Antidiabetics", unit_price: 1200.00, stock_quantity: 80, min_stock_level: 15, expiry_date: "2027-02-18", supplier: "Eli Lilly Pakistan" },
        { id: "med-4", name: "Lipitor 20mg", generic_name: "Atorvastatin", category: "Cardiovascular", unit_price: 45.00, stock_quantity: 120, min_stock_level: 20, expiry_date: "2026-12-15", supplier: "Pfizer Labs" },
        { id: "med-5", name: "Aspirin 75mg", generic_name: "Acetylsalicylic Acid", category: "Analgesics", unit_price: 3.00, stock_quantity: 500, min_stock_level: 50, expiry_date: "2028-03-10", supplier: "Bayer CropScience" },
        { id: "med-6", name: "Ibuprofen 400mg", generic_name: "Ibuprofen", category: "Analgesics", unit_price: 8.00, stock_quantity: 350, min_stock_level: 40, expiry_date: "2027-04-20", supplier: "McKesson Healthcare" },
        { id: "med-7", name: "Ventolin Inhaler", generic_name: "Salbutamol", category: "Bronchodilators", unit_price: 350.00, stock_quantity: 90, min_stock_level: 15, expiry_date: "2027-05-12", supplier: "GSK Pakistan" },
        { id: "med-8", name: "Augmentin 625mg", generic_name: "Co-Amoxiclav", category: "Antibiotics", unit_price: 40.00, stock_quantity: 140, min_stock_level: 25, expiry_date: "2027-08-30", supplier: "GSK Pakistan" },
        // These 2 items are configured under minStockLevel to trigger low stock dashboard warnings
        { id: "med-9", name: "Metformin 850mg", generic_name: "Metformin", category: "Antidiabetics", unit_price: 12.00, stock_quantity: 8, min_stock_level: 30, expiry_date: "2026-10-30", supplier: "Cardinal Health" },
        { id: "med-10", name: "Losartan 50mg", generic_name: "Losartan Potassium", category: "Cardiovascular", unit_price: 25.00, stock_quantity: 5, min_stock_level: 20, expiry_date: "2027-08-11", supplier: "Sami Pharmaceuticals" }
      ];

      for (const m of mockMeds) {
        await db.collection('pharmacy_inventory').doc(m.id).set(m);
      }

      // 7. Seed Collection 'lab_orders' (Diagnostics Specimen Custody timeline / Critical flags)
      console.log("[SEEDING] Seeding lab diagnostics pipelines...");
      const mockLabOrders = [
        {
          id: "LAB-10001",
          patient_id: "MRN-10001",
          doctor_id: "u-doc-smith",
          doctor_name: "Dr. Muhammad Asif Khan",
          encounter_id: "ENC-10001",
          test_name: "Dengue Fever Serology Screening",
          category: "Serology",
          status: "Completed",
          result_value: "Dengue NS1 Antigen: Positive, Platelets: 85 x10^9/L (Critical Low)",
          reference_range: "Platelets: 150-400",
          flag: "Critical",
          comments: "Thrombocytopenia secondary to active Dengue Fever. Immediate fluid tracking and hospital stay recommended.",
          technician_id: "u-lab-alex",
          technician_name: "Kamran Ahmed",
          updated_at: new Date().toISOString(),
          created_at: new Date("2026-05-30T09:40:00Z").toISOString()
        },
        {
          id: "LAB-10002",
          patient_id: "MRN-10002",
          doctor_id: "u-doc-smith",
          doctor_name: "Dr. Muhammad Asif Khan",
          encounter_id: "",
          test_name: "Typhoid Dot Test",
          category: "Serology",
          status: "Completed",
          result_value: "Typhidot IgM: Positive",
          reference_range: "Negative",
          flag: "Normal",
          comments: "Typhoid screening positive. Recommend prescribing suitable antibiotics.",
          technician_id: "u-lab-alex",
          technician_name: "Kamran Ahmed",
          updated_at: new Date().toISOString(),
          created_at: new Date("2026-05-30T09:42:00Z").toISOString()
        },
        {
          id: "LAB-10003",
          patient_id: "MRN-10003",
          doctor_id: "u-doc-smith",
          doctor_name: "Dr. Muhammad Asif Khan",
          encounter_id: "",
          test_name: "Malaria Smear Test",
          category: "Hematology",
          status: "Sample Collected",
          comments: "Smear prepared. Slide evaluation in progress.",
          technician_id: "u-lab-alex",
          technician_name: "Kamran Ahmed",
          updated_at: new Date().toISOString(),
          created_at: new Date("2026-05-30T09:44:00Z").toISOString()
        }
      ];

      for (const l of mockLabOrders) {
        await db.collection('lab_orders').doc(l.id).set(l);
      }

      // 8. Seed Collection 'encounters'
      console.log("[SEEDING] Seeding EMR consultation history...");
      const mockEncounters = [
        {
          id: "ENC-10001",
          patient_id: "MRN-10001",
          doctor_id: "u-doc-smith",
          doctor_name: "Dr. Muhammad Asif Khan",
          date_time: "2026-05-30T09:30:00Z",
          vital_bp: "115/75",
          vital_heart_rate: 88,
          vital_temperature: 38.9,
          vital_weight: 70.0,
          vital_respiratory_rate: 18,
          vital_spo2: 97,
          soap_subjective: "Patient Ghulam Zain reports high-grade fever, severe headache, and joint pain for the last 3 days.",
          soap_objective: "Mild abdominal tenderness. Skin flushing observed. Low platelet count on CBC.",
          soap_assessment: "Acute Dengue Fever with thrombocytopenia.",
          soap_plan: "Admission in Private VIP Room bed-p1. Daily CBC, IV hydration therapy, paracetamol 500mg.",
          prescriptions: [
            { medicineId: "med-2", name: "Paracetamol 500mg", dosage: "1 tablet", frequency: "TDS", duration: "5 days", notes: "For high fever & body pain" }
          ],
          lab_orders: ["LAB-10001"],
          created_at: new Date("2026-05-30T09:30:00Z").toISOString()
        }
      ];

      for (const e of mockEncounters) {
        await db.collection('encounters').doc(e.id).set(e);
      }

      // 9. Seed Collection 'invoices' (Chronological distribution across 2026 in PKR / correct tax formulations)
      console.log("[SEEDING] Creating billing accounting ledger collections...");
      const mockInvoices = [
        {
          id: "INV-10001",
          patient_id: "MRN-10001",
          patient_name: "Muhammad Zain",
          patient_mrn: "MRN-10001",
          items: [
            { description: "General Consultation Fee", amount: 2500, category: "Consultation" }
          ],
          subtotal: 2500,
          tax: 125, // 5% tax formulation
          total: 2625,
          paid_amount: 2625,
          status: "Paid",
          payment_method: "Cash",
          created_at: new Date("2026-01-15T10:00:00Z").toISOString()
        },
        {
          id: "INV-10002",
          patient_id: "MRN-10002",
          patient_name: "Aisha Bibi",
          patient_mrn: "MRN-10002",
          items: [
            { description: "Typhidot & Hematology Biomarkers", amount: 8000, category: "Laboratory" },
            { description: "Consultation Fee", amount: 2500, category: "Consultation" }
          ],
          subtotal: 10500,
          tax: 525,
          total: 11025,
          paid_amount: 11025,
          status: "Paid",
          payment_method: "Credit Card",
          created_at: new Date("2026-01-20T14:30:00Z").toISOString()
        },
        {
          id: "INV-10003",
          patient_id: "MRN-10003",
          patient_name: "Ghulam Rasool",
          patient_mrn: "MRN-10003",
          items: [
            { description: "Inpatient bed days accommodation charges (10 days in Semi-Private Block)", amount: 25000, category: "Inpatient" }
          ],
          subtotal: 25000,
          tax: 1250,
          total: 26250,
          paid_amount: 26250,
          status: "Paid",
          payment_method: "Bank Transfer",
          created_at: new Date("2026-02-10T11:00:00Z").toISOString()
        },
        {
          id: "INV-10004",
          patient_id: "MRN-10004",
          patient_name: "Fatima Zahra",
          patient_mrn: "MRN-10004",
          items: [
            { description: "Dengue Fever Serology Screening & Hydration", amount: 15000, category: "Laboratory" }
          ],
          subtotal: 15000,
          tax: 750,
          total: 15750,
          paid_amount: 0,
          status: "Unpaid",
          created_at: new Date("2026-02-18T10:00:00Z").toISOString()
        },
        {
          id: "INV-10005",
          patient_id: "MRN-10005",
          patient_name: "Ahmed Ali",
          patient_mrn: "MRN-10005",
          items: [
            { description: "Trauma consultation & sutures", amount: 35000, category: "Consultation" }
          ],
          subtotal: 35000,
          tax: 1750,
          total: 36750,
          paid_amount: 36750,
          status: "Paid",
          payment_method: "Cash",
          created_at: new Date("2026-03-05T09:15:00Z").toISOString()
        },
        {
          id: "INV-10006",
          patient_id: "MRN-10001",
          patient_name: "Muhammad Zain",
          patient_mrn: "MRN-10001",
          items: [
            { description: "Private VIP Room stay bed days charges (5 days)", amount: 25000, category: "Inpatient" }
          ],
          subtotal: 25000,
          tax: 1250,
          total: 26250,
          paid_amount: 20000,
          status: "Partially Paid",
          payment_method: "Insurance",
          insurance_provider: "Jubilee Life Insurance",
          policy_number: "POL-998822",
          claim_status: "Approved",
          created_at: new Date("2026-03-25T11:00:00Z").toISOString()
        },
        {
          id: "INV-10007",
          patient_id: "MRN-10002",
          patient_name: "Aisha Bibi",
          patient_mrn: "MRN-10002",
          items: [
            { description: "Advanced CCU / ICU Stay bed days charges (4 days)", amount: 48000, category: "Inpatient" }
          ],
          subtotal: 48000,
          tax: 2400,
          total: 50400,
          paid_amount: 35000,
          status: "Partially Paid",
          payment_method: "Credit Card",
          created_at: new Date("2026-04-18T16:00:00Z").toISOString()
        },
        {
          id: "INV-10008",
          patient_id: "MRN-10003",
          patient_name: "Ghulam Rasool",
          patient_mrn: "MRN-10003",
          items: [
            { description: "Emergency Intensive therapy medications", amount: 55000, category: "Pharmacy" }
          ],
          subtotal: 55000,
          tax: 2750,
          total: 57750,
          paid_amount: 45000,
          status: "Partially Paid",
          payment_method: "Cash",
          created_at: new Date("2026-05-25T10:00:00Z").toISOString()
        },
        {
          id: "INV-10009",
          patient_id: "MRN-10001",
          patient_name: "Muhammad Zain",
          patient_mrn: "MRN-10001",
          items: [
            { description: "Dispensed Antibiotics (15 units) & Dengue Fever Serology", amount: 25000, category: "Pharmacy" }
          ],
          subtotal: 25000,
          tax: 1250,
          total: 26250,
          paid_amount: 0,
          status: "Unpaid",
          created_at: new Date("2026-05-29T11:30:00Z").toISOString()
        }
      ];

      for (const inv of mockInvoices) {
        await db.collection('invoices').doc(inv.id).set(inv);
      }

      // 10. Seed Collection 'security_audit_logs' (10 Chronological Compliance tracker logs)
      console.log("[SEEDING] Creating security compliance audit trail...");
      const mockAuditLogs = [
        { id: "log-1", user_id: "u-admin", username: "admin", user_role: "Admin", action: "INIT_SYSTEM", details: "NoSQL Cloud Firestore database secure environment seeded successfully.", timestamp: new Date("2026-05-30T09:00:00Z").toISOString() },
        { id: "log-2", user_id: "u-admin", username: "admin", user_role: "Admin", action: "VIEW_CLINICAL_SETTINGS", details: "Viewed global hospital configuration parameters.", timestamp: new Date("2026-05-30T09:05:00Z").toISOString() },
        { id: "log-3", user_id: "u-doc-smith", username: "dr_smith", user_role: "Doctor", action: "USER_LOGIN", details: "Clinician Dr. Muhammad Asif Khan unlocked consultation station.", timestamp: new Date("2026-05-30T09:10:00Z").toISOString() },
        { id: "log-4", user_id: "u-doc-smith", username: "dr_smith", user_role: "Doctor", action: "VIEW_MEDICAL_RECORD", details: "Polled patient Muhammad Zain (MRN-10001) clinical history file.", timestamp: new Date("2026-05-30T09:15:00Z").toISOString() },
        { id: "log-5", user_id: "u-doc-smith", username: "dr_smith", user_role: "Doctor", action: "CREATE_ENCOUNTER", details: "Logged Dengue Fever consultation encounter ENC-10001.", timestamp: new Date("2026-05-30T09:30:00Z").toISOString() },
        { id: "log-6", user_id: "u-doc-smith", username: "dr_smith", user_role: "Doctor", action: "CREATE_PRESCRIPTION", details: "Prescribed Paracetamol 500mg (med-2) under strict batch limits.", timestamp: new Date("2026-05-30T09:32:00Z").toISOString() },
        { id: "log-7", user_id: "u-doc-smith", username: "dr_smith", user_role: "Doctor", action: "CREATE_LAB_ORDER", details: "Ordered Dengue Fever Serology Screening test order LAB-10001.", timestamp: new Date("2026-05-30T09:35:00Z").toISOString() },
        { id: "log-8", user_id: "u-lab-alex", username: "lab_alex", user_role: "Lab Technician", action: "USER_LOGIN", details: "Laboratory Specialist Kamran Ahmed logged in.", timestamp: new Date("2026-05-30T09:38:00Z").toISOString() },
        { id: "log-9", user_id: "u-lab-alex", username: "lab_alex", user_role: "Lab Technician", action: "WRITE_LAB_RESULT", details: "Completed diagnostic Dengue serology screening for LAB-10001.", timestamp: new Date("2026-05-30T09:40:00Z").toISOString() },
        { id: "log-10", user_id: "u-pharm-peter", username: "pharmacist", user_role: "Pharmacist", action: "DISPENSE_PHARMACEUTICAL", details: "Dispensed Paracetamol 500mg (med-2) post transaction approval.", timestamp: new Date("2026-05-30T09:45:00Z").toISOString() }
      ];

      for (const log of mockAuditLogs) {
        await db.collection('security_audit_logs').doc(log.id).set(log);
      }

      console.log("[SEEDING] All 12-router operational collections successfully populated.");

    } catch (err) {
      console.error("[SEEDING] Error seeding database:", err);
    }
  },
  
  // --- Hospital Settings ---
  async getSettings() {
    const doc = await db.collection('hospital_settings').doc('default').get();
    if (!doc.exists) {
      // Seed default settings on initial run
      const defaultSettings = {
        name: "St. Jude Memorial Hospital",
        address: "742 Evergreen Terrace, Medical Heights",
        contact: "+1 (555) 911-3000",
        logo_url: "",
        tax_rate: 0.05,
        currency: "PKR",
        operating_hours: "24/7"
      };
      await db.collection('hospital_settings').doc('default').set(defaultSettings);
      return {
        name: defaultSettings.name,
        address: defaultSettings.address,
        contact: defaultSettings.contact,
        logoUrl: defaultSettings.logo_url,
        taxRate: defaultSettings.tax_rate,
        currency: defaultSettings.currency,
        operatingHours: defaultSettings.operating_hours
      };
    }
    const data = doc.data()!;
    return {
      name: data.name,
      address: data.address,
      contact: data.contact,
      logoUrl: data.logo_url || "",
      taxRate: Number(data.tax_rate),
      currency: data.currency || "PKR",
      operatingHours: data.operating_hours || "24/7"
    };
  },

  async updateSettings(settings: any) {
    const payload: any = {
      name: settings.name,
      address: settings.address,
      contact: settings.contact,
      tax_rate: Number(settings.taxRate),
      currency: settings.currency,
      operating_hours: settings.operatingHours
    };
    if (settings.logoUrl !== undefined) payload.logo_url = settings.logoUrl;

    await db.collection('hospital_settings').doc('default').update(payload);
    return payload;
  },

  // --- Users & Staff ---
  async getUserByUsername(username: string) {
    const snapshot = await db.collection('users')
      .where('username_lowercase', '==', username.toLowerCase())
      .limit(1)
      .get();
    
    if (snapshot.empty) return null;
    const doc = snapshot.docs[0];
    const data = doc.data();
    return {
      id: doc.id,
      username: data.username,
      passwordHash: data.password_hash,
      name: data.name,
      role: data.role,
      email: data.email,
      phone: data.phone,
      department: data.department || "",
      specialization: data.specialization || "",
      qualification: data.qualification || "",
      consultationFee: Number(data.consultation_fee || 0),
      leaves: data.leaves || []
    };
  },

  async getDoctors() {
    const snapshot = await db.collection('users')
      .where('role', '==', 'Doctor')
      .get();
    
    return snapshot.docs.map(doc => {
      const data = doc.data();
      return {
        id: doc.id,
        username: data.username,
        name: data.name,
        role: data.role,
        email: data.email,
        phone: data.phone,
        department: data.department || "",
        specialization: data.specialization || "",
        qualification: data.qualification || "",
        consultationFee: Number(data.consultation_fee || 0),
        leaves: data.leaves || []
      };
    });
  },

  async getDoctorLeaves(doctorId: string) {
    const doc = await db.collection('users').doc(doctorId).get();
    if (!doc.exists) return [];
    return doc.data()?.leaves || [];
  },

  async applyLeave(leave: { id: string; doctorId: string; startDate: string; endDate: string; reason: string; status: string }) {
    const doctorRef = db.collection('users').doc(leave.doctorId);
    
    await db.runTransaction(async (transaction) => {
      const doc = await transaction.get(doctorRef);
      if (!doc.exists) throw new Error("Doctor record not found");
      const currentLeaves = doc.data()?.leaves || [];
      const newLeave = {
        id: leave.id,
        start_date: leave.startDate,
        end_date: leave.endDate,
        reason: leave.reason,
        status: leave.status
      };
      transaction.update(doctorRef, {
        leaves: [...currentLeaves, newLeave]
      });
    });
    return leave;
  },

  async updateLeaveStatus(leaveId: string, status: string) {
    // Search for doctor containing this leave ID
    const snapshot = await db.collection('users')
      .get();
    
    let updatedLeaveItem: any = null;

    for (const doc of snapshot.docs) {
      const data = doc.data();
      const leaves = data.leaves || [];
      const index = leaves.findIndex((l: any) => l.id === leaveId);
      if (index !== -1) {
        leaves[index].status = status;
        updatedLeaveItem = leaves[index];
        
        await db.collection('users').doc(doc.id).update({ leaves });
        break;
      }
    }
    return updatedLeaveItem;
  },

  // --- Patient Records ---
  async getPatients(searchQuery?: string) {
    const snapshot = await db.collection('patients').get();
    let patients = snapshot.docs.map(doc => {
      const p = doc.data();
      return {
        id: doc.id,
        name: p.name,
        dob: p.dob,
        gender: p.gender,
        contact: p.contact,
        email: p.email || "",
        address: p.address,
        bloodGroup: p.blood_group,
        emergencyContact: {
          name: p.emergency_contact_name,
          relationship: p.emergency_contact_relationship,
          phone: p.emergency_contact_phone
        },
        isArchived: p.is_archived || false,
        createdAt: p.created_at,
        esiLevel: Number(p.esi_level || 5),
        triageStatus: p.triage_status || "Triage Pending",
        triageNotes: p.triage_notes || "",
        triageScore: Number(p.triage_score || 0),
        triageTimestamp: p.triage_timestamp || p.created_at
      };
    });

    if (searchQuery) {
      const q = searchQuery.toLowerCase();
      patients = patients.filter(p => 
        p.name.toLowerCase().includes(q) || 
        p.id.toLowerCase().includes(q) || 
        p.contact.includes(q)
      );
    }
    return patients;
  },

  async getPatientById(id: string) {
    const doc = await db.collection('patients').doc(id).get();
    if (!doc.exists) return null;
    const p = doc.data()!;
    return {
      id: doc.id,
      name: p.name,
      dob: p.dob,
      gender: p.gender,
      contact: p.contact,
      email: p.email || "",
      address: p.address,
      bloodGroup: p.blood_group,
      emergencyContact: {
        name: p.emergency_contact_name,
        relationship: p.emergency_contact_relationship,
        phone: p.emergency_contact_phone
      },
      isArchived: p.is_archived || false,
      createdAt: p.created_at,
      esiLevel: Number(p.esi_level || 5),
      triageStatus: p.triage_status || "Triage Pending",
      triageNotes: p.triage_notes || "",
      triageScore: Number(p.triage_score || 0),
      triageTimestamp: p.triage_timestamp || p.created_at
    };
  },

  async countPatients() {
    const snapshot = await db.collection('patients').get();
    return snapshot.size;
  },

  async insertPatient(patient: any) {
    await db.collection('patients').doc(patient.id).set({
      name: patient.name,
      dob: patient.dob,
      gender: patient.gender,
      contact: patient.contact,
      email: patient.email || "",
      address: patient.address,
      blood_group: patient.bloodGroup,
      emergency_contact_name: patient.emergencyContact.name,
      emergency_contact_relationship: patient.emergencyContact.relationship,
      emergency_contact_phone: patient.emergencyContact.phone,
      is_archived: patient.isArchived,
      created_at: patient.createdAt
    });
    return patient;
  },

  async updatePatient(id: string, updates: any) {
    const mapped: any = {};
    if (updates.name !== undefined) mapped.name = updates.name;
    if (updates.dob !== undefined) mapped.dob = updates.dob;
    if (updates.gender !== undefined) mapped.gender = updates.gender;
    if (updates.contact !== undefined) mapped.contact = updates.contact;
    if (updates.email !== undefined) mapped.email = updates.email;
    if (updates.address !== undefined) mapped.address = updates.address;
    if (updates.bloodGroup !== undefined) mapped.blood_group = updates.bloodGroup;
    if (updates.emergencyContact) {
      if (updates.emergencyContact.name !== undefined) mapped.emergency_contact_name = updates.emergencyContact.name;
      if (updates.emergencyContact.relationship !== undefined) mapped.emergency_contact_relationship = updates.emergencyContact.relationship;
      if (updates.emergencyContact.phone !== undefined) mapped.emergency_contact_phone = updates.emergencyContact.phone;
    }
    if (updates.isArchived !== undefined) mapped.is_archived = updates.isArchived;

    await db.collection('patients').doc(id).update(mapped);
    return updates;
  },

  // --- Appointments ---
  async getAppointments(doctorId?: string) {
    let query: admin.firestore.Query = db.collection('appointments');
    if (doctorId) {
      query = query.where('doctor_id', '==', doctorId);
    }
    const snapshot = await query.get();
    
    const appts: any[] = [];
    for (const d of snapshot.docs) {
      const a = d.data();
      
      // Resolve Patient and Doctor names
      const patientDoc = await db.collection('patients').doc(a.patient_id).get();
      const doctorDoc = await db.collection('users').doc(a.doctor_id).get();

      appts.push({
        id: d.id,
        patientId: a.patient_id,
        patientName: patientDoc.exists ? patientDoc.data()?.name : 'Unknown Patient',
        doctorId: a.doctor_id,
        doctorName: doctorDoc.exists ? doctorDoc.data()?.name : 'Unknown Doctor',
        dateTime: a.date_time,
        timeSlot: a.time_slot,
        status: a.status,
        notes: a.notes || "",
        createdAt: a.created_at,
        simulatedNotificationLog: a.simulated_notification_log || ""
      });
    }
    return appts;
  },

  async checkAppointmentConflict(doctorId: string, dateStr: string, timeSlot: string, excludeId?: string) {
    const snapshot = await db.collection('appointments')
      .where('doctor_id', '==', doctorId)
      .where('time_slot', '==', timeSlot)
      .where('status', '==', 'Scheduled')
      .get();
    
    let conflicts = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));

    if (excludeId) {
      conflicts = conflicts.filter(c => c.id !== excludeId);
    }

    // Filter matching clinical dates (first 10 characters of timestamp)
    const exactDateConflicts = conflicts.filter((c: any) => c.date_time?.substring(0, 10) === dateStr.substring(0, 10));
    return exactDateConflicts.length > 0;
  },

  async insertAppointment(appt: any) {
    await db.collection('appointments').doc(appt.id).set({
      patient_id: appt.patientId,
      doctor_id: appt.doctorId,
      date_time: appt.dateTime,
      time_slot: appt.timeSlot,
      status: appt.status,
      notes: appt.notes || "",
      created_at: appt.createdAt,
      simulated_notification_log: appt.simulatedNotificationLog || ""
    });
    return appt;
  },

  async updateAppointment(id: string, updates: any) {
    const mapped: any = {};
    if (updates.status !== undefined) mapped.status = updates.status;
    if (updates.timeSlot !== undefined) mapped.time_slot = updates.timeSlot;
    if (updates.dateTime !== undefined) mapped.date_time = updates.dateTime;
    if (updates.notes !== undefined) mapped.notes = updates.notes;

    await db.collection('appointments').doc(id).update(mapped);
    return updates;
  },

  // --- SOAP Encounters & Prescriptions ---
  async getEncountersByPatient(patientId: string) {
    const snapshot = await db.collection('encounters')
      .where('patient_id', '==', patientId)
      .get();
    
    return snapshot.docs.map(doc => {
      const enc = doc.data();
      return {
        id: doc.id,
        patientId: enc.patient_id,
        doctorId: enc.doctor_id,
        doctorName: enc.doctor_name || 'Physician',
        date: enc.date_time,
        vitals: {
          bp: enc.vital_bp,
          heartRate: Number(enc.vital_heart_rate),
          temperature: Number(enc.vital_temperature),
          weight: Number(enc.vital_weight),
          respiratoryRate: enc.vital_respiratory_rate ? Number(enc.vital_respiratory_rate) : undefined,
          spo2: enc.vital_spo2 ? Number(enc.vital_spo2) : undefined
        },
        soap: {
          s: enc.soap_subjective,
          o: enc.soap_objective,
          a: enc.soap_assessment,
          p: enc.soap_plan
        },
        prescriptions: enc.prescriptions || [],
        labOrders: enc.lab_orders || [],
        createdAt: enc.created_at
      };
    });
  },

  async insertEncounter(enc: any, rxItems: any[], labOrders: any[]) {
    const encounterRef = db.collection('encounters').doc(enc.id);
    await encounterRef.set({
      patient_id: enc.patientId,
      doctor_id: enc.doctorId,
      doctor_name: enc.doctorName,
      date_time: enc.date,
      vital_bp: enc.vitals.bp,
      vital_heart_rate: Number(enc.vitals.heartRate),
      vital_temperature: Number(enc.vitals.temperature),
      vital_weight: Number(enc.vitals.weight),
      vital_respiratory_rate: enc.vitals.respiratoryRate ? Number(enc.vitals.respiratoryRate) : null,
      vital_spo2: enc.vitals.spo2 ? Number(enc.vitals.spo2) : null,
      soap_subjective: enc.soap.s,
      soap_objective: enc.soap.o,
      soap_assessment: enc.soap.a,
      soap_plan: enc.soap.p,
      prescriptions: rxItems,
      lab_orders: enc.labOrders || [],
      created_at: enc.createdAt
    });

    // Write Lab Orders as independent queryable documents
    if (labOrders.length > 0) {
      for (const order of labOrders) {
        await db.collection('lab_orders').doc(order.id).set({
          patient_id: order.patientId,
          doctor_id: order.doctorId,
          doctor_name: order.doctorName,
          encounter_id: order.encounterId,
          test_name: order.testName,
          category: order.category,
          status: order.status,
          created_at: new Date().toISOString()
        });
      }
    }
    return true;
  },

  // --- Laboratory Orders ---
  async getLabOrders() {
    const snapshot = await db.collection('lab_orders').get();
    
    const labs: any[] = [];
    for (const doc of snapshot.docs) {
      const l = doc.data();
      const patientDoc = await db.collection('patients').doc(l.patient_id).get();

      labs.push({
        id: doc.id,
        patientId: l.patient_id,
        patientName: patientDoc.exists ? patientDoc.data()?.name : 'Unknown Patient',
        patientMRN: l.patient_id,
        doctorId: l.doctor_id,
        doctorName: l.doctor_name || 'Physician',
        encounterId: l.encounter_id,
        testName: l.test_name,
        category: l.category,
        status: l.status,
        resultValue: l.result_value || "",
        referenceRange: l.reference_range || "",
        flag: l.flag || "",
        comments: l.comments || "",
        technicianId: l.technician_id || "",
        technicianName: l.technician_name || "",
        updatedAt: l.updated_at || "",
        filePath: l.file_path || ""
      });
    }
    return labs;
  },

  async updateLabOrder(id: string, updates: any) {
    const mapped: any = {
      status: 'Completed',
      result_value: updates.resultValue,
      updated_at: new Date().toISOString()
    };
    if (updates.referenceRange !== undefined) mapped.reference_range = updates.referenceRange;
    if (updates.flag !== undefined) mapped.flag = updates.flag;
    if (updates.comments !== undefined) mapped.comments = updates.comments;
    if (updates.technicianId !== undefined) mapped.technician_id = updates.technicianId;
    if (updates.technicianName !== undefined) mapped.technician_name = updates.technicianName;
    if (updates.filePath !== undefined) mapped.file_path = updates.filePath;

    await db.collection('lab_orders').doc(id).update(mapped);
    return updates;
  },

  async uploadLabFilePath(id: string, pathUrl: string) {
    await db.collection('lab_orders').doc(id).update({ file_path: pathUrl });
    return true;
  },

  // --- Pharmacy Inventory ---
  async getInventory() {
    const snapshot = await db.collection('pharmacy_inventory').get();
    return snapshot.docs.map(doc => {
      const i = doc.data();
      return {
        id: doc.id,
        name: i.name,
        genericName: i.generic_name,
        category: i.category,
        unitPrice: Number(i.unit_price),
        stockQuantity: Number(i.stock_quantity),
        minStockLevel: Number(i.min_stock_level || 10),
        expiryDate: i.expiry_date,
        supplier: i.supplier
      };
    });
  },

  async insertInventoryItem(item: any) {
    await db.collection('pharmacy_inventory').doc(item.id).set({
      name: item.name,
      generic_name: item.genericName,
      category: item.category,
      unit_price: Number(item.unitPrice),
      stock_quantity: Number(item.stockQuantity),
      min_stock_level: Number(item.minStockLevel || 10),
      expiry_date: item.expiryDate,
      supplier: item.supplier
    });
    return item;
  },

  async updateInventoryItem(id: string, updates: any) {
    const mapped: any = {};
    if (updates.name !== undefined) mapped.name = updates.name;
    if (updates.genericName !== undefined) mapped.generic_name = updates.genericName;
    if (updates.category !== undefined) mapped.category = updates.category;
    if (updates.unitPrice !== undefined) mapped.unit_price = Number(updates.unitPrice);
    if (updates.stockQuantity !== undefined) mapped.stock_quantity = Number(updates.stockQuantity);
    if (updates.minStockLevel !== undefined) mapped.min_stock_level = Number(updates.minStockLevel);
    if (updates.expiryDate !== undefined) mapped.expiry_date = updates.expiryDate;
    if (updates.supplier !== undefined) mapped.supplier = updates.supplier;

    await db.collection('pharmacy_inventory').doc(id).update(mapped);
    return updates;
  },

  // Dispense Medication - Automated NoSQL Billing & Inventory Transactional Loop
  async dispenseMedicationTransaction(dispense: { encounterId?: string; patientId: string; medicineId: string; quantity: number; taxRate: number }) {
    const medicineRef = db.collection('pharmacy_inventory').doc(dispense.medicineId);
    
    // Search for any active unpaid invoice
    const unpaidInvoiceQuery = db.collection('invoices')
      .where('patient_id', '==', dispense.patientId)
      .where('status', '==', 'Unpaid')
      .limit(1);

    const result = await db.runTransaction(async (transaction) => {
      // 1. Fetch medicine properties
      const medDoc = await transaction.get(medicineRef);
      if (!medDoc.exists) throw new Error("Registered pharmaceutical item not found in stock");
      
      const item = medDoc.data()!;
      if (item.stock_quantity < dispense.quantity) {
        throw new Error(`Insufficient drug stock quantity! Only ${item.stock_quantity} remaining.`);
      }

      const totalCost = Number((Number(item.unit_price) * dispense.quantity).toFixed(2));

      // 2. Decrement inventory stock quantity
      transaction.update(medicineRef, { stock_quantity: item.stock_quantity - dispense.quantity });

      // 3. Mark Prescription dispensed inside Encounters sub-document array
      if (dispense.encounterId) {
        const encounterRef = db.collection('encounters').doc(dispense.encounterId);
        const encDoc = await transaction.get(encounterRef);
        if (encDoc.exists) {
          const encounterData = encDoc.data()!;
          const prescriptions = encounterData.prescriptions || [];
          const rxIndex = prescriptions.findIndex((p: any) => p.medicineId === dispense.medicineId);
          if (rxIndex !== -1) {
            prescriptions[rxIndex].dispensed = true;
            prescriptions[rxIndex].dispensedAt = new Date().toISOString();
            transaction.update(encounterRef, { prescriptions });
          }
        }
      }

      // 4. Update Invoice
      const unpaidSnapshot = await transaction.get(unpaidInvoiceQuery);
      
      if (!unpaidSnapshot.empty) {
        const invDoc = unpaidSnapshot.docs[0];
        const invoiceRef = db.collection('invoices').doc(invDoc.id);
        const invoiceData = invDoc.data();
        
        const currentItems = invoiceData.items || [];
        const newItem = {
          description: `${item.name} (${dispense.quantity} units dispensed)`,
          amount: totalCost,
          category: 'Pharmacy'
        };
        
        const subtotal = Number((currentItems.reduce((acc: number, cur: any) => acc + cur.amount, 0) + totalCost).toFixed(2));
        const tax = Number((subtotal * dispense.taxRate).toFixed(2));
        const total = Number((subtotal + tax).toFixed(2));

        transaction.update(invoiceRef, {
          items: [...currentItems, newItem],
          subtotal,
          tax,
          total
        });
      } else {
        // Create new unpaid pharmacy charge invoice
        const invoicesSnapshot = await transaction.get(db.collection('invoices'));
        const newInvoiceId = `INV-${10000 + invoicesSnapshot.size + 1}`;
        const invoiceRef = db.collection('invoices').doc(newInvoiceId);
        
        const patientDoc = await transaction.get(db.collection('patients').doc(dispense.patientId));
        const patientName = patientDoc.exists ? patientDoc.data()?.name : "Unknown Patient";

        const newItem = {
          description: `${item.name} (${dispense.quantity} units dispensed)`,
          amount: totalCost,
          category: 'Pharmacy'
        };

        const tax = Number((totalCost * dispense.taxRate).toFixed(2));
        const total = Number((totalCost + tax).toFixed(2));

        transaction.set(invoiceRef, {
          patient_id: dispense.patientId,
          patient_name: patientName,
          patient_mrn: dispense.patientId,
          items: [newItem],
          subtotal: totalCost,
          tax,
          total,
          paid_amount: 0.00,
          status: 'Unpaid',
          created_at: new Date().toISOString()
        });
      }

      return { success: true, newStock: item.stock_quantity - dispense.quantity };
    });

    return result;
  },

  // --- Beds & Ward Assignments ---
  async getBeds() {
    const snapshot = await db.collection('beds').get();
    
    const beds: any[] = [];
    for (const doc of snapshot.docs) {
      const b = doc.data();
      const patientDoc = b.patient_id ? await db.collection('patients').doc(b.patient_id).get() : null;

      beds.push({
        id: doc.id,
        wardName: b.ward_name,
        bedNumber: b.bed_number,
        type: b.type,
        status: b.status,
        patientId: b.patient_id || null,
        patientName: patientDoc?.exists ? patientDoc.data()?.name : null
      });
    }
    return beds;
  },

  async occupyBed(bedId: string, patientId: string) {
    await db.collection('beds').doc(bedId).update({
      status: 'Occupied',
      patient_id: patientId
    });
    return true;
  },

  async vacateBed(bedId: string) {
    await db.collection('beds').doc(bedId).update({
      status: 'Vacant',
      patient_id: null
    });
    return true;
  },

  // --- Admissions ---
  async getAdmissions() {
    const snapshot = await db.collection('admissions').get();
    
    const list: any[] = [];
    for (const doc of snapshot.docs) {
      const adm = doc.data();
      const patientDoc = await db.collection('patients').doc(adm.patient_id).get();

      list.push({
        id: doc.id,
        patientId: adm.patient_id,
        patientName: patientDoc.exists ? patientDoc.data()?.name : 'Unknown Patient',
        patientMRN: adm.patient_id,
        bedId: adm.bed_id,
        wardName: adm.ward_name,
        bedNumber: adm.bed_number,
        admissionDate: adm.admission_date,
        dischargeDate: adm.discharge_date || null,
        status: adm.status,
        nursingNotes: adm.nursing_notes || [],
        progressNotes: adm.progress_notes || [],
        dischargeSummary: adm.discharge_summary_diagnosis ? {
          diagnosis: adm.discharge_summary_diagnosis,
          treatmentSummary: adm.discharge_summary_treatment,
          dischargeInstructions: adm.discharge_summary_instructions,
          followUpDate: adm.discharge_summary_followup || ""
        } : undefined
      });
    }
    return list;
  },

  async insertAdmission(adm: any) {
    await db.collection('admissions').doc(adm.id).set({
      patient_id: adm.patientId,
      bed_id: adm.bedId,
      ward_name: adm.ward_name,
      bed_number: adm.bed_number,
      admission_date: adm.admission_date,
      status: adm.status,
      nursing_notes: [],
      progress_notes: []
    });
    return adm;
  },

  async addNursingNote(note: { id: string; admissionId: string; text: string; nurseId: string; nurseName: string }) {
    const admissionRef = db.collection('admissions').doc(note.admissionId);
    
    await db.runTransaction(async (transaction) => {
      const doc = await transaction.get(admissionRef);
      if (!doc.exists) throw new Error("Admission clinical envelope not found");
      const current = doc.data()?.nursing_notes || [];
      const newNote = {
        id: note.id,
        date: new Date().toISOString(),
        text: note.text,
        nurseId: note.nurseId,
        nurseName: note.nurseName
      };
      transaction.update(admissionRef, {
        nursing_notes: [...current, newNote]
      });
    });
    return note;
  },

  async addProgressNote(note: { id: string; admissionId: string; text: string; staffId: string; staffName: string }) {
    const admissionRef = db.collection('admissions').doc(note.admissionId);
    
    await db.runTransaction(async (transaction) => {
      const doc = await transaction.get(admissionRef);
      if (!doc.exists) throw new Error("Admission clinical envelope not found");
      const current = doc.data()?.progress_notes || [];
      const newNote = {
        id: note.id,
        date: new Date().toISOString(),
        text: note.text,
        staffId: note.staffId,
        staffName: note.staffName
      };
      transaction.update(admissionRef, {
        progress_notes: [...current, newNote]
      });
    });
    return note;
  },

  async dischargeAdmissionTransaction(discharge: { admissionId: string; bedId: string; diagnosis: string; treatment: string; instructions: string; followUp?: string; taxRate: number }) {
    const admissionRef = db.collection('admissions').doc(discharge.admissionId);
    const bedRef = db.collection('beds').doc(discharge.bedId);

    const result = await db.runTransaction(async (transaction) => {
      const admDoc = await transaction.get(admissionRef);
      if (!admDoc.exists) throw new Error("IPD Admission record not found");
      const adm = admDoc.data()!;

      if (adm.status === 'Discharged') throw new Error("Patient is already discharged.");

      // 1. Update Inpatient Admission record state to Discharged
      transaction.update(admissionRef, {
        status: 'Discharged',
        discharge_date: new Date().toISOString(),
        discharge_summary_diagnosis: discharge.diagnosis,
        discharge_summary_treatment: discharge.treatment,
        discharge_summary_instructions: discharge.instructions,
        discharge_summary_followup: discharge.followUp || null
      });

      // 2. Vacate Bed
      transaction.update(bedRef, {
        status: 'Vacant',
        patient_id: null
      });

      // 3. Flat Bed Calculation
      const dateAdm = new Date(adm.admission_date);
      const dateDis = new Date();
      const diffDays = Math.max(1, Math.ceil((dateDis.getTime() - dateAdm.getTime()) / (1000 * 60 * 60 * 24)));
      
      const bedDoc = await transaction.get(bedRef);
      const bedType = bedDoc.exists ? bedDoc.data()?.type : 'General Ward';
      const flatChargesMap: Record<string, number> = {
        'General Ward': 120,
        'Semi-Private': 250,
        'Private': 500,
        'ICU': 1200
      };
      
      const feeRate = flatChargesMap[bedType] || 120;
      const totalBedCost = Number((feeRate * diffDays).toFixed(2));

      // 4. Generate Final Checkout Inpatient Invoice
      const invoicesSnapshot = await transaction.get(db.collection('invoices'));
      const newInvoiceId = `INV-${10000 + invoicesSnapshot.size + 1}`;
      const invoiceRef = db.collection('invoices').doc(newInvoiceId);

      const patientDoc = await transaction.get(db.collection('patients').doc(adm.patient_id));
      const patientName = patientDoc.exists ? patientDoc.data()?.name : 'Unknown Patient';

      const newItem = {
        description: `Inpatient ward accommodation bed days charge (${diffDays} days in ${bedType})`,
        amount: totalBedCost,
        category: 'Inpatient'
      };

      const tax = Number((totalBedCost * discharge.taxRate).toFixed(2));
      const total = Number((totalBedCost + tax).toFixed(2));

      transaction.set(invoiceRef, {
        patient_id: adm.patient_id,
        patient_name: patientName,
        patient_mrn: adm.patient_id,
        admission_id: discharge.admissionId,
        items: [newItem],
        subtotal: totalBedCost,
        tax,
        total,
        paid_amount: 0.00,
        status: 'Unpaid',
        created_at: new Date().toISOString()
      });

      return { admissionId: discharge.admissionId, invoiceId: newInvoiceId };
    });

    return result;
  },

  // --- Invoices & Billing ---
  async getInvoices() {
    const snapshot = await db.collection('invoices').get();
    return snapshot.docs.map(doc => {
      const inv = doc.data();
      return {
        id: doc.id,
        patientId: inv.patient_id,
        patientName: inv.patient_name || 'Unknown Patient',
        patientMRN: inv.patient_mrn,
        encounterId: inv.encounter_id || null,
        admissionId: inv.admission_id || null,
        items: inv.items || [],
        subtotal: Number(inv.subtotal),
        tax: Number(inv.tax),
        total: Number(inv.total),
        paidAmount: Number(inv.paid_amount || 0),
        status: inv.status,
        paymentMethod: inv.payment_method || "",
        insuranceProvider: inv.insurance_provider || "",
        policyNumber: inv.policy_number || "",
        claimStatus: inv.claim_status || "",
        createdAt: inv.created_at
      };
    });
  },

  async payInvoice(id: string, payment: any) {
    const mapped: any = {
      paid_amount: Number(payment.paidAmount),
      payment_method: payment.paymentMethod,
      status: payment.status
    };
    if (payment.insuranceProvider) mapped.insurance_provider = payment.insuranceProvider;
    if (payment.policyNumber) mapped.policy_number = payment.policyNumber;
    if (payment.claimStatus) mapped.claim_status = payment.claimStatus;

    await db.collection('invoices').doc(id).update(mapped);
    return payment;
  },

  async updateInsuranceClaimStatus(id: string, claimStatus: string, status: string, totalAmount?: number) {
    const mapped: any = { claim_status: claimStatus, status };
    if (totalAmount !== undefined) mapped.paid_amount = Number(totalAmount);

    await db.collection('invoices').doc(id).update(mapped);
    return true;
  },

  // --- HIPAA Audits ---
  async getAuditLogs() {
    const snapshot = await db.collection('security_audit_logs')
      .orderBy('timestamp', 'desc')
      .get();
    
    return snapshot.docs.map(doc => {
      const l = doc.data();
      return {
        id: doc.id,
        userId: l.user_id,
        username: l.username,
        userRole: l.user_role,
        patientId: l.patient_id || "",
        action: l.action,
        details: l.details,
        timestamp: l.timestamp
      };
    });
  },

  async insertAuditLog(log: any) {
    await db.collection('security_audit_logs').doc(log.id).set({
      user_id: log.userId,
      username: log.username,
      user_role: log.userRole,
      patient_id: log.patientId || null,
      action: log.action,
      details: log.details,
      timestamp: log.timestamp
    });
    return true;
  }
};

// Auto-execute clinical credentials seeding block on module load (vital for serverless Vercel endpoints)
dbService.seedDatabaseIfVacant().catch(err => {
  console.error("Failed to execute database seeding on module init:", err);
});

export default dbService;

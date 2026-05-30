// src/server/api_entry.ts
import express from "express";
import crypto8 from "crypto";

// src/server/db.ts
import admin from "firebase-admin";
import dotenv from "dotenv";
import crypto from "crypto";
dotenv.config();
function hashPassword(password) {
  return crypto.createHash("sha256").update(password).digest("hex");
}
var databaseURL = "https://hospital-managemnt-syste-ece35-default-rtdb.firebaseio.com";
function cleanEnvVar(val) {
  if (!val) return "";
  let cleaned = val.trim();
  if (cleaned.startsWith('"') && cleaned.endsWith('"')) {
    cleaned = cleaned.slice(1, -1);
  }
  if (cleaned.startsWith("'") && cleaned.endsWith("'")) {
    cleaned = cleaned.slice(1, -1);
  }
  return cleaned.trim();
}
if (admin.apps.length === 0) {
  let credentialObj = null;
  const projectId = cleanEnvVar(process.env.FIREBASE_PROJECT_ID);
  const clientEmail = cleanEnvVar(process.env.FIREBASE_CLIENT_EMAIL);
  let privateKey = cleanEnvVar(process.env.FIREBASE_PRIVATE_KEY);
  if (projectId && clientEmail && privateKey) {
    privateKey = privateKey.replace(/\\n/g, "\n");
    credentialObj = admin.credential.cert({
      projectId,
      clientEmail,
      privateKey
    });
    console.log("Firebase Admin SDK successfully initialized using separate environment variables.");
  } else if (process.env.FIREBASE_SERVICE_ACCOUNT) {
    try {
      const saString = cleanEnvVar(process.env.FIREBASE_SERVICE_ACCOUNT);
      const sa = JSON.parse(saString);
      if (sa.private_key) {
        sa.private_key = sa.private_key.replace(/\\n/g, "\n");
      }
      credentialObj = admin.credential.cert(sa);
      console.log("Firebase Admin SDK successfully initialized using FIREBASE_SERVICE_ACCOUNT environment variable.");
    } catch (e) {
      console.error("Failed to parse FIREBASE_SERVICE_ACCOUNT environment variable.", e);
    }
  }
  if (credentialObj) {
    try {
      admin.initializeApp({
        credential: credentialObj,
        databaseURL
      });
      console.log("Firebase Admin SDK successfully initialized using separate environment variables.");
    } catch (e) {
      console.error("Firebase Admin SDK failed to initialize with credentials:", e);
    }
  } else if (process.env.FIREBASE_SERVICE_ACCOUNT) {
    try {
      const saString = cleanEnvVar(process.env.FIREBASE_SERVICE_ACCOUNT);
      const sa = JSON.parse(saString);
      if (sa.private_key) {
        sa.private_key = sa.private_key.replace(/\\n/g, "\n");
      }
      admin.initializeApp({
        credential: admin.credential.cert(sa),
        databaseURL
      });
      console.log("Firebase Admin SDK successfully initialized using FIREBASE_SERVICE_ACCOUNT environment variable.");
    } catch (e) {
      console.error("Failed to parse FIREBASE_SERVICE_ACCOUNT environment variable.", e);
    }
  } else {
    try {
      admin.initializeApp({ databaseURL });
      console.log("Firebase Admin SDK initialized using fallback application credentials.");
    } catch (e) {
      console.error("Firebase Admin SDK failed to initialize with ADC fallback:", e);
    }
  }
}
var dbInstance;
try {
  if (admin.apps.length > 0) {
    dbInstance = admin.firestore();
  } else {
    console.warn("No initialized Firebase apps found. Firestore will be unavailable.");
    dbInstance = null;
  }
} catch (e) {
  console.error("Firestore initialization failed. Database will not be accessible:", e);
  dbInstance = null;
}
var db = dbInstance;
var dbService = {
  // Seed Users and complete clinical datasets to guarantee ready-to-test systems in production
  async seedDatabaseIfVacant() {
    try {
      console.log("[SEEDING] Performing defensive initialization check...");
      if (!db) {
        throw new Error("Firestore client is not initialized. Please configure your Firebase environment variables on Vercel.");
      }
      const usersSnapshot = await db.collection("users").limit(1).get();
      if (!usersSnapshot.empty) {
        console.log("[SEEDING] Firestore database already initialized. Terminating seeding routine.");
        return;
      }
      console.log("[SEEDING] Collection is vacant. Launching robust, fully-connected clinical mock dataset writes...");
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
          consultation_fee: 1500,
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
          consultation_fee: 1200,
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
          consultation_fee: 2500,
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
        await db.collection("users").doc(u.id).set(u);
      }
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
          created_at: (/* @__PURE__ */ new Date("2026-01-10T10:00:00Z")).toISOString(),
          esi_level: 5,
          triage_status: "Outpatient",
          triage_notes: "Dengue serology requested, patient reports fever.",
          triage_score: 5,
          triage_timestamp: (/* @__PURE__ */ new Date("2026-01-10T10:00:00Z")).toISOString()
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
          created_at: (/* @__PURE__ */ new Date("2026-02-15T11:30:00Z")).toISOString(),
          esi_level: 2,
          triage_status: "ER Queue",
          triage_notes: "Severe dehydration, high fever. Monitored in critical zone.",
          triage_score: 9,
          triage_timestamp: (/* @__PURE__ */ new Date("2026-05-30T09:30:00Z")).toISOString()
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
          created_at: (/* @__PURE__ */ new Date("2026-03-01T09:15:00Z")).toISOString(),
          esi_level: 3,
          triage_status: "ER Queue",
          triage_notes: "Persistent abdominal pain, nausea.",
          triage_score: 6,
          triage_timestamp: (/* @__PURE__ */ new Date("2026-05-30T09:40:00Z")).toISOString()
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
          created_at: (/* @__PURE__ */ new Date("2026-04-12T14:20:00Z")).toISOString(),
          esi_level: 1,
          triage_status: "ER Queue",
          triage_notes: "High fever, stable SpO2 96%. Pediatrics team active.",
          triage_score: 10,
          triage_timestamp: (/* @__PURE__ */ new Date("2026-05-30T09:45:00Z")).toISOString()
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
          created_at: (/* @__PURE__ */ new Date("2026-05-01T15:00:00Z")).toISOString(),
          esi_level: 4,
          triage_status: "ER Queue",
          triage_notes: "Minor localized trauma on hand.",
          triage_score: 4,
          triage_timestamp: (/* @__PURE__ */ new Date("2026-05-30T09:50:00Z")).toISOString()
        }
      ];
      for (const p of mockPatients) {
        await db.collection("patients").doc(p.id).set(p);
      }
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
        await db.collection("beds").doc(b.id).set(b);
      }
      console.log("[SEEDING] Seeding inpatient EMR envelope clinical logs...");
      const mockAdmissions = [
        {
          id: "ADM-10001",
          patient_id: "MRN-10001",
          bed_id: "bed-p1",
          ward_name: "Private VIP Room",
          bed_number: "P-301",
          admission_date: (/* @__PURE__ */ new Date("2026-05-25T08:00:00Z")).toISOString(),
          status: "Admitted",
          nursing_notes: [
            { id: "note-1", date: (/* @__PURE__ */ new Date("2026-05-25T12:00:00Z")).toISOString(), text: "Patient admitted to Private VIP Room. Stable vitals.", nurseId: "u-nurse-nancy", nurseName: "RN Head Nurse Bushra Bibi" },
            { id: "note-2", date: (/* @__PURE__ */ new Date("2026-05-27T08:00:00Z")).toISOString(), text: "Administered medications, pain decreasing.", nurseId: "u-nurse-nancy", nurseName: "RN Head Nurse Bushra Bibi" }
          ],
          progress_notes: [
            { id: "prog-1", date: (/* @__PURE__ */ new Date("2026-05-26T09:00:00Z")).toISOString(), text: "Monitoring platelet count closely for active Dengue Fever. Stable vitals.", staffId: "u-doc-smith", staffName: "Dr. Muhammad Asif Khan" }
          ]
        },
        {
          id: "ADM-10002",
          patient_id: "MRN-10002",
          bed_id: "bed-i1",
          ward_name: "CCU / ICU Critical Care Unit",
          bed_number: "ICU-401",
          admission_date: (/* @__PURE__ */ new Date("2026-05-28T14:30:00Z")).toISOString(),
          status: "Admitted",
          nursing_notes: [
            { id: "note-3", date: (/* @__PURE__ */ new Date("2026-05-28T15:00:00Z")).toISOString(), text: "CCU monitoring active. Oxygen therapy initiated.", nurseId: "u-nurse-nancy", nurseName: "RN Head Nurse Bushra Bibi" }
          ],
          progress_notes: [
            { id: "prog-2", date: (/* @__PURE__ */ new Date("2026-05-29T10:00:00Z")).toISOString(), text: "Recovering from acute clinical symptoms.", staffId: "u-doc-smith", staffName: "Dr. Muhammad Asif Khan" }
          ]
        }
      ];
      for (const a of mockAdmissions) {
        await db.collection("admissions").doc(a.id).set(a);
      }
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
          created_at: (/* @__PURE__ */ new Date("2026-05-29T10:00:00Z")).toISOString()
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
          created_at: (/* @__PURE__ */ new Date("2026-05-28T11:00:00Z")).toISOString()
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
          created_at: (/* @__PURE__ */ new Date("2026-05-29T14:00:00Z")).toISOString()
        }
      ];
      for (const app2 of mockAppointments) {
        await db.collection("appointments").doc(app2.id).set(app2);
      }
      console.log("[SEEDING] Creating pharmacy stock inventory lines...");
      const mockMeds = [
        { id: "med-1", name: "Amoxicillin 500mg", generic_name: "Amoxicillin", category: "Antibiotics", unit_price: 15, stock_quantity: 250, min_stock_level: 30, expiry_date: "2027-11-15", supplier: "Global Pharma Corp" },
        { id: "med-2", name: "Paracetamol 500mg", generic_name: "Acetaminophen", category: "Antipyretics", unit_price: 5, stock_quantity: 400, min_stock_level: 50, expiry_date: "2028-09-01", supplier: "McKesson Healthcare" },
        { id: "med-3", name: "Insulin Glargine", generic_name: "Insulin", category: "Antidiabetics", unit_price: 1200, stock_quantity: 80, min_stock_level: 15, expiry_date: "2027-02-18", supplier: "Eli Lilly Pakistan" },
        { id: "med-4", name: "Lipitor 20mg", generic_name: "Atorvastatin", category: "Cardiovascular", unit_price: 45, stock_quantity: 120, min_stock_level: 20, expiry_date: "2026-12-15", supplier: "Pfizer Labs" },
        { id: "med-5", name: "Aspirin 75mg", generic_name: "Acetylsalicylic Acid", category: "Analgesics", unit_price: 3, stock_quantity: 500, min_stock_level: 50, expiry_date: "2028-03-10", supplier: "Bayer CropScience" },
        { id: "med-6", name: "Ibuprofen 400mg", generic_name: "Ibuprofen", category: "Analgesics", unit_price: 8, stock_quantity: 350, min_stock_level: 40, expiry_date: "2027-04-20", supplier: "McKesson Healthcare" },
        { id: "med-7", name: "Ventolin Inhaler", generic_name: "Salbutamol", category: "Bronchodilators", unit_price: 350, stock_quantity: 90, min_stock_level: 15, expiry_date: "2027-05-12", supplier: "GSK Pakistan" },
        { id: "med-8", name: "Augmentin 625mg", generic_name: "Co-Amoxiclav", category: "Antibiotics", unit_price: 40, stock_quantity: 140, min_stock_level: 25, expiry_date: "2027-08-30", supplier: "GSK Pakistan" },
        // These 2 items are configured under minStockLevel to trigger low stock dashboard warnings
        { id: "med-9", name: "Metformin 850mg", generic_name: "Metformin", category: "Antidiabetics", unit_price: 12, stock_quantity: 8, min_stock_level: 30, expiry_date: "2026-10-30", supplier: "Cardinal Health" },
        { id: "med-10", name: "Losartan 50mg", generic_name: "Losartan Potassium", category: "Cardiovascular", unit_price: 25, stock_quantity: 5, min_stock_level: 20, expiry_date: "2027-08-11", supplier: "Sami Pharmaceuticals" }
      ];
      for (const m of mockMeds) {
        await db.collection("pharmacy_inventory").doc(m.id).set(m);
      }
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
          updated_at: (/* @__PURE__ */ new Date()).toISOString(),
          created_at: (/* @__PURE__ */ new Date("2026-05-30T09:40:00Z")).toISOString()
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
          updated_at: (/* @__PURE__ */ new Date()).toISOString(),
          created_at: (/* @__PURE__ */ new Date("2026-05-30T09:42:00Z")).toISOString()
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
          updated_at: (/* @__PURE__ */ new Date()).toISOString(),
          created_at: (/* @__PURE__ */ new Date("2026-05-30T09:44:00Z")).toISOString()
        }
      ];
      for (const l of mockLabOrders) {
        await db.collection("lab_orders").doc(l.id).set(l);
      }
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
          vital_weight: 70,
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
          created_at: (/* @__PURE__ */ new Date("2026-05-30T09:30:00Z")).toISOString()
        }
      ];
      for (const e of mockEncounters) {
        await db.collection("encounters").doc(e.id).set(e);
      }
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
          tax: 125,
          // 5% tax formulation
          total: 2625,
          paid_amount: 2625,
          status: "Paid",
          payment_method: "Cash",
          created_at: (/* @__PURE__ */ new Date("2026-01-15T10:00:00Z")).toISOString()
        },
        {
          id: "INV-10002",
          patient_id: "MRN-10002",
          patient_name: "Aisha Bibi",
          patient_mrn: "MRN-10002",
          items: [
            { description: "Typhidot & Hematology Biomarkers", amount: 8e3, category: "Laboratory" },
            { description: "Consultation Fee", amount: 2500, category: "Consultation" }
          ],
          subtotal: 10500,
          tax: 525,
          total: 11025,
          paid_amount: 11025,
          status: "Paid",
          payment_method: "Credit Card",
          created_at: (/* @__PURE__ */ new Date("2026-01-20T14:30:00Z")).toISOString()
        },
        {
          id: "INV-10003",
          patient_id: "MRN-10003",
          patient_name: "Ghulam Rasool",
          patient_mrn: "MRN-10003",
          items: [
            { description: "Inpatient bed days accommodation charges (10 days in Semi-Private Block)", amount: 25e3, category: "Inpatient" }
          ],
          subtotal: 25e3,
          tax: 1250,
          total: 26250,
          paid_amount: 26250,
          status: "Paid",
          payment_method: "Bank Transfer",
          created_at: (/* @__PURE__ */ new Date("2026-02-10T11:00:00Z")).toISOString()
        },
        {
          id: "INV-10004",
          patient_id: "MRN-10004",
          patient_name: "Fatima Zahra",
          patient_mrn: "MRN-10004",
          items: [
            { description: "Dengue Fever Serology Screening & Hydration", amount: 15e3, category: "Laboratory" }
          ],
          subtotal: 15e3,
          tax: 750,
          total: 15750,
          paid_amount: 0,
          status: "Unpaid",
          created_at: (/* @__PURE__ */ new Date("2026-02-18T10:00:00Z")).toISOString()
        },
        {
          id: "INV-10005",
          patient_id: "MRN-10005",
          patient_name: "Ahmed Ali",
          patient_mrn: "MRN-10005",
          items: [
            { description: "Trauma consultation & sutures", amount: 35e3, category: "Consultation" }
          ],
          subtotal: 35e3,
          tax: 1750,
          total: 36750,
          paid_amount: 36750,
          status: "Paid",
          payment_method: "Cash",
          created_at: (/* @__PURE__ */ new Date("2026-03-05T09:15:00Z")).toISOString()
        },
        {
          id: "INV-10006",
          patient_id: "MRN-10001",
          patient_name: "Muhammad Zain",
          patient_mrn: "MRN-10001",
          items: [
            { description: "Private VIP Room stay bed days charges (5 days)", amount: 25e3, category: "Inpatient" }
          ],
          subtotal: 25e3,
          tax: 1250,
          total: 26250,
          paid_amount: 2e4,
          status: "Partially Paid",
          payment_method: "Insurance",
          insurance_provider: "Jubilee Life Insurance",
          policy_number: "POL-998822",
          claim_status: "Approved",
          created_at: (/* @__PURE__ */ new Date("2026-03-25T11:00:00Z")).toISOString()
        },
        {
          id: "INV-10007",
          patient_id: "MRN-10002",
          patient_name: "Aisha Bibi",
          patient_mrn: "MRN-10002",
          items: [
            { description: "Advanced CCU / ICU Stay bed days charges (4 days)", amount: 48e3, category: "Inpatient" }
          ],
          subtotal: 48e3,
          tax: 2400,
          total: 50400,
          paid_amount: 35e3,
          status: "Partially Paid",
          payment_method: "Credit Card",
          created_at: (/* @__PURE__ */ new Date("2026-04-18T16:00:00Z")).toISOString()
        },
        {
          id: "INV-10008",
          patient_id: "MRN-10003",
          patient_name: "Ghulam Rasool",
          patient_mrn: "MRN-10003",
          items: [
            { description: "Emergency Intensive therapy medications", amount: 55e3, category: "Pharmacy" }
          ],
          subtotal: 55e3,
          tax: 2750,
          total: 57750,
          paid_amount: 45e3,
          status: "Partially Paid",
          payment_method: "Cash",
          created_at: (/* @__PURE__ */ new Date("2026-05-25T10:00:00Z")).toISOString()
        },
        {
          id: "INV-10009",
          patient_id: "MRN-10001",
          patient_name: "Muhammad Zain",
          patient_mrn: "MRN-10001",
          items: [
            { description: "Dispensed Antibiotics (15 units) & Dengue Fever Serology", amount: 25e3, category: "Pharmacy" }
          ],
          subtotal: 25e3,
          tax: 1250,
          total: 26250,
          paid_amount: 0,
          status: "Unpaid",
          created_at: (/* @__PURE__ */ new Date("2026-05-29T11:30:00Z")).toISOString()
        }
      ];
      for (const inv of mockInvoices) {
        await db.collection("invoices").doc(inv.id).set(inv);
      }
      console.log("[SEEDING] Creating security compliance audit trail...");
      const mockAuditLogs = [
        { id: "log-1", user_id: "u-admin", username: "admin", user_role: "Admin", action: "INIT_SYSTEM", details: "NoSQL Cloud Firestore database secure environment seeded successfully.", timestamp: (/* @__PURE__ */ new Date("2026-05-30T09:00:00Z")).toISOString() },
        { id: "log-2", user_id: "u-admin", username: "admin", user_role: "Admin", action: "VIEW_CLINICAL_SETTINGS", details: "Viewed global hospital configuration parameters.", timestamp: (/* @__PURE__ */ new Date("2026-05-30T09:05:00Z")).toISOString() },
        { id: "log-3", user_id: "u-doc-smith", username: "dr_smith", user_role: "Doctor", action: "USER_LOGIN", details: "Clinician Dr. Muhammad Asif Khan unlocked consultation station.", timestamp: (/* @__PURE__ */ new Date("2026-05-30T09:10:00Z")).toISOString() },
        { id: "log-4", user_id: "u-doc-smith", username: "dr_smith", user_role: "Doctor", action: "VIEW_MEDICAL_RECORD", details: "Polled patient Muhammad Zain (MRN-10001) clinical history file.", timestamp: (/* @__PURE__ */ new Date("2026-05-30T09:15:00Z")).toISOString() },
        { id: "log-5", user_id: "u-doc-smith", username: "dr_smith", user_role: "Doctor", action: "CREATE_ENCOUNTER", details: "Logged Dengue Fever consultation encounter ENC-10001.", timestamp: (/* @__PURE__ */ new Date("2026-05-30T09:30:00Z")).toISOString() },
        { id: "log-6", user_id: "u-doc-smith", username: "dr_smith", user_role: "Doctor", action: "CREATE_PRESCRIPTION", details: "Prescribed Paracetamol 500mg (med-2) under strict batch limits.", timestamp: (/* @__PURE__ */ new Date("2026-05-30T09:32:00Z")).toISOString() },
        { id: "log-7", user_id: "u-doc-smith", username: "dr_smith", user_role: "Doctor", action: "CREATE_LAB_ORDER", details: "Ordered Dengue Fever Serology Screening test order LAB-10001.", timestamp: (/* @__PURE__ */ new Date("2026-05-30T09:35:00Z")).toISOString() },
        { id: "log-8", user_id: "u-lab-alex", username: "lab_alex", user_role: "Lab Technician", action: "USER_LOGIN", details: "Laboratory Specialist Kamran Ahmed logged in.", timestamp: (/* @__PURE__ */ new Date("2026-05-30T09:38:00Z")).toISOString() },
        { id: "log-9", user_id: "u-lab-alex", username: "lab_alex", user_role: "Lab Technician", action: "WRITE_LAB_RESULT", details: "Completed diagnostic Dengue serology screening for LAB-10001.", timestamp: (/* @__PURE__ */ new Date("2026-05-30T09:40:00Z")).toISOString() },
        { id: "log-10", user_id: "u-pharm-peter", username: "pharmacist", user_role: "Pharmacist", action: "DISPENSE_PHARMACEUTICAL", details: "Dispensed Paracetamol 500mg (med-2) post transaction approval.", timestamp: (/* @__PURE__ */ new Date("2026-05-30T09:45:00Z")).toISOString() }
      ];
      for (const log of mockAuditLogs) {
        await db.collection("security_audit_logs").doc(log.id).set(log);
      }
      console.log("[SEEDING] All 12-router operational collections successfully populated.");
    } catch (err) {
      console.error("[SEEDING] Error seeding database:", err);
    }
  },
  // --- Hospital Settings ---
  async getSettings() {
    const doc = await db.collection("hospital_settings").doc("default").get();
    if (!doc.exists) {
      const defaultSettings = {
        name: "St. Jude Memorial Hospital",
        address: "742 Evergreen Terrace, Medical Heights",
        contact: "+1 (555) 911-3000",
        logo_url: "",
        tax_rate: 0.05,
        currency: "PKR",
        operating_hours: "24/7"
      };
      await db.collection("hospital_settings").doc("default").set(defaultSettings);
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
    const data = doc.data();
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
  async updateSettings(settings) {
    const payload = {
      name: settings.name,
      address: settings.address,
      contact: settings.contact,
      tax_rate: Number(settings.taxRate),
      currency: settings.currency,
      operating_hours: settings.operatingHours
    };
    if (settings.logoUrl !== void 0) payload.logo_url = settings.logoUrl;
    await db.collection("hospital_settings").doc("default").update(payload);
    return payload;
  },
  // --- Users & Staff ---
  async getUserByUsername(username) {
    const snapshot = await db.collection("users").where("username_lowercase", "==", username.toLowerCase()).limit(1).get();
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
    const snapshot = await db.collection("users").where("role", "==", "Doctor").get();
    return snapshot.docs.map((doc) => {
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
  async getDoctorLeaves(doctorId) {
    const doc = await db.collection("users").doc(doctorId).get();
    if (!doc.exists) return [];
    return doc.data()?.leaves || [];
  },
  async applyLeave(leave) {
    const doctorRef = db.collection("users").doc(leave.doctorId);
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
  async updateLeaveStatus(leaveId, status) {
    const snapshot = await db.collection("users").get();
    let updatedLeaveItem = null;
    for (const doc of snapshot.docs) {
      const data = doc.data();
      const leaves = data.leaves || [];
      const index = leaves.findIndex((l) => l.id === leaveId);
      if (index !== -1) {
        leaves[index].status = status;
        updatedLeaveItem = leaves[index];
        await db.collection("users").doc(doc.id).update({ leaves });
        break;
      }
    }
    return updatedLeaveItem;
  },
  // --- Patient Records ---
  async getPatients(searchQuery) {
    const snapshot = await db.collection("patients").get();
    let patients = snapshot.docs.map((doc) => {
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
      patients = patients.filter(
        (p) => p.name.toLowerCase().includes(q) || p.id.toLowerCase().includes(q) || p.contact.includes(q)
      );
    }
    return patients;
  },
  async getPatientById(id) {
    const doc = await db.collection("patients").doc(id).get();
    if (!doc.exists) return null;
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
  },
  async countPatients() {
    const snapshot = await db.collection("patients").get();
    return snapshot.size;
  },
  async insertPatient(patient) {
    await db.collection("patients").doc(patient.id).set({
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
  async updatePatient(id, updates) {
    const mapped = {};
    if (updates.name !== void 0) mapped.name = updates.name;
    if (updates.dob !== void 0) mapped.dob = updates.dob;
    if (updates.gender !== void 0) mapped.gender = updates.gender;
    if (updates.contact !== void 0) mapped.contact = updates.contact;
    if (updates.email !== void 0) mapped.email = updates.email;
    if (updates.address !== void 0) mapped.address = updates.address;
    if (updates.bloodGroup !== void 0) mapped.blood_group = updates.bloodGroup;
    if (updates.emergencyContact) {
      if (updates.emergencyContact.name !== void 0) mapped.emergency_contact_name = updates.emergencyContact.name;
      if (updates.emergencyContact.relationship !== void 0) mapped.emergency_contact_relationship = updates.emergencyContact.relationship;
      if (updates.emergencyContact.phone !== void 0) mapped.emergency_contact_phone = updates.emergencyContact.phone;
    }
    if (updates.isArchived !== void 0) mapped.is_archived = updates.isArchived;
    await db.collection("patients").doc(id).update(mapped);
    return updates;
  },
  // --- Appointments ---
  async getAppointments(doctorId) {
    let query = db.collection("appointments");
    if (doctorId) {
      query = query.where("doctor_id", "==", doctorId);
    }
    const snapshot = await query.get();
    const appts = [];
    for (const d of snapshot.docs) {
      const a = d.data();
      const patientDoc = await db.collection("patients").doc(a.patient_id).get();
      const doctorDoc = await db.collection("users").doc(a.doctor_id).get();
      appts.push({
        id: d.id,
        patientId: a.patient_id,
        patientName: patientDoc.exists ? patientDoc.data()?.name : "Unknown Patient",
        doctorId: a.doctor_id,
        doctorName: doctorDoc.exists ? doctorDoc.data()?.name : "Unknown Doctor",
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
  async checkAppointmentConflict(doctorId, dateStr, timeSlot, excludeId) {
    const snapshot = await db.collection("appointments").where("doctor_id", "==", doctorId).where("time_slot", "==", timeSlot).where("status", "==", "Scheduled").get();
    let conflicts = snapshot.docs.map((doc) => ({ id: doc.id, ...doc.data() }));
    if (excludeId) {
      conflicts = conflicts.filter((c) => c.id !== excludeId);
    }
    const exactDateConflicts = conflicts.filter((c) => c.date_time?.substring(0, 10) === dateStr.substring(0, 10));
    return exactDateConflicts.length > 0;
  },
  async insertAppointment(appt) {
    await db.collection("appointments").doc(appt.id).set({
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
  async updateAppointment(id, updates) {
    const mapped = {};
    if (updates.status !== void 0) mapped.status = updates.status;
    if (updates.timeSlot !== void 0) mapped.time_slot = updates.timeSlot;
    if (updates.dateTime !== void 0) mapped.date_time = updates.dateTime;
    if (updates.notes !== void 0) mapped.notes = updates.notes;
    await db.collection("appointments").doc(id).update(mapped);
    return updates;
  },
  // --- SOAP Encounters & Prescriptions ---
  async getEncountersByPatient(patientId) {
    const snapshot = await db.collection("encounters").where("patient_id", "==", patientId).get();
    return snapshot.docs.map((doc) => {
      const enc = doc.data();
      return {
        id: doc.id,
        patientId: enc.patient_id,
        doctorId: enc.doctor_id,
        doctorName: enc.doctor_name || "Physician",
        date: enc.date_time,
        vitals: {
          bp: enc.vital_bp,
          heartRate: Number(enc.vital_heart_rate),
          temperature: Number(enc.vital_temperature),
          weight: Number(enc.vital_weight),
          respiratoryRate: enc.vital_respiratory_rate ? Number(enc.vital_respiratory_rate) : void 0,
          spo2: enc.vital_spo2 ? Number(enc.vital_spo2) : void 0
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
  async insertEncounter(enc, rxItems, labOrders) {
    const encounterRef = db.collection("encounters").doc(enc.id);
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
    if (labOrders.length > 0) {
      for (const order of labOrders) {
        await db.collection("lab_orders").doc(order.id).set({
          patient_id: order.patientId,
          doctor_id: order.doctorId,
          doctor_name: order.doctorName,
          encounter_id: order.encounterId,
          test_name: order.testName,
          category: order.category,
          status: order.status,
          created_at: (/* @__PURE__ */ new Date()).toISOString()
        });
      }
    }
    return true;
  },
  // --- Laboratory Orders ---
  async getLabOrders() {
    const snapshot = await db.collection("lab_orders").get();
    const labs = [];
    for (const doc of snapshot.docs) {
      const l = doc.data();
      const patientDoc = await db.collection("patients").doc(l.patient_id).get();
      labs.push({
        id: doc.id,
        patientId: l.patient_id,
        patientName: patientDoc.exists ? patientDoc.data()?.name : "Unknown Patient",
        patientMRN: l.patient_id,
        doctorId: l.doctor_id,
        doctorName: l.doctor_name || "Physician",
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
  async updateLabOrder(id, updates) {
    const mapped = {
      status: "Completed",
      result_value: updates.resultValue,
      updated_at: (/* @__PURE__ */ new Date()).toISOString()
    };
    if (updates.referenceRange !== void 0) mapped.reference_range = updates.referenceRange;
    if (updates.flag !== void 0) mapped.flag = updates.flag;
    if (updates.comments !== void 0) mapped.comments = updates.comments;
    if (updates.technicianId !== void 0) mapped.technician_id = updates.technicianId;
    if (updates.technicianName !== void 0) mapped.technician_name = updates.technicianName;
    if (updates.filePath !== void 0) mapped.file_path = updates.filePath;
    await db.collection("lab_orders").doc(id).update(mapped);
    return updates;
  },
  async uploadLabFilePath(id, pathUrl) {
    await db.collection("lab_orders").doc(id).update({ file_path: pathUrl });
    return true;
  },
  // --- Pharmacy Inventory ---
  async getInventory() {
    const snapshot = await db.collection("pharmacy_inventory").get();
    return snapshot.docs.map((doc) => {
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
  async insertInventoryItem(item) {
    await db.collection("pharmacy_inventory").doc(item.id).set({
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
  async updateInventoryItem(id, updates) {
    const mapped = {};
    if (updates.name !== void 0) mapped.name = updates.name;
    if (updates.genericName !== void 0) mapped.generic_name = updates.genericName;
    if (updates.category !== void 0) mapped.category = updates.category;
    if (updates.unitPrice !== void 0) mapped.unit_price = Number(updates.unitPrice);
    if (updates.stockQuantity !== void 0) mapped.stock_quantity = Number(updates.stockQuantity);
    if (updates.minStockLevel !== void 0) mapped.min_stock_level = Number(updates.minStockLevel);
    if (updates.expiryDate !== void 0) mapped.expiry_date = updates.expiryDate;
    if (updates.supplier !== void 0) mapped.supplier = updates.supplier;
    await db.collection("pharmacy_inventory").doc(id).update(mapped);
    return updates;
  },
  // Dispense Medication - Automated NoSQL Billing & Inventory Transactional Loop
  async dispenseMedicationTransaction(dispense) {
    const medicineRef = db.collection("pharmacy_inventory").doc(dispense.medicineId);
    const unpaidInvoiceQuery = db.collection("invoices").where("patient_id", "==", dispense.patientId).where("status", "==", "Unpaid").limit(1);
    const result = await db.runTransaction(async (transaction) => {
      const medDoc = await transaction.get(medicineRef);
      if (!medDoc.exists) throw new Error("Registered pharmaceutical item not found in stock");
      const item = medDoc.data();
      if (item.stock_quantity < dispense.quantity) {
        throw new Error(`Insufficient drug stock quantity! Only ${item.stock_quantity} remaining.`);
      }
      const totalCost = Number((Number(item.unit_price) * dispense.quantity).toFixed(2));
      transaction.update(medicineRef, { stock_quantity: item.stock_quantity - dispense.quantity });
      if (dispense.encounterId) {
        const encounterRef = db.collection("encounters").doc(dispense.encounterId);
        const encDoc = await transaction.get(encounterRef);
        if (encDoc.exists) {
          const encounterData = encDoc.data();
          const prescriptions = encounterData.prescriptions || [];
          const rxIndex = prescriptions.findIndex((p) => p.medicineId === dispense.medicineId);
          if (rxIndex !== -1) {
            prescriptions[rxIndex].dispensed = true;
            prescriptions[rxIndex].dispensedAt = (/* @__PURE__ */ new Date()).toISOString();
            transaction.update(encounterRef, { prescriptions });
          }
        }
      }
      const unpaidSnapshot = await transaction.get(unpaidInvoiceQuery);
      if (!unpaidSnapshot.empty) {
        const invDoc = unpaidSnapshot.docs[0];
        const invoiceRef = db.collection("invoices").doc(invDoc.id);
        const invoiceData = invDoc.data();
        const currentItems = invoiceData.items || [];
        const newItem = {
          description: `${item.name} (${dispense.quantity} units dispensed)`,
          amount: totalCost,
          category: "Pharmacy"
        };
        const subtotal = Number((currentItems.reduce((acc, cur) => acc + cur.amount, 0) + totalCost).toFixed(2));
        const tax = Number((subtotal * dispense.taxRate).toFixed(2));
        const total = Number((subtotal + tax).toFixed(2));
        transaction.update(invoiceRef, {
          items: [...currentItems, newItem],
          subtotal,
          tax,
          total
        });
      } else {
        const invoicesSnapshot = await transaction.get(db.collection("invoices"));
        const newInvoiceId = `INV-${1e4 + invoicesSnapshot.size + 1}`;
        const invoiceRef = db.collection("invoices").doc(newInvoiceId);
        const patientDoc = await transaction.get(db.collection("patients").doc(dispense.patientId));
        const patientName = patientDoc.exists ? patientDoc.data()?.name : "Unknown Patient";
        const newItem = {
          description: `${item.name} (${dispense.quantity} units dispensed)`,
          amount: totalCost,
          category: "Pharmacy"
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
          paid_amount: 0,
          status: "Unpaid",
          created_at: (/* @__PURE__ */ new Date()).toISOString()
        });
      }
      return { success: true, newStock: item.stock_quantity - dispense.quantity };
    });
    return result;
  },
  // --- Beds & Ward Assignments ---
  async getBeds() {
    const snapshot = await db.collection("beds").get();
    const beds = [];
    for (const doc of snapshot.docs) {
      const b = doc.data();
      const patientDoc = b.patient_id ? await db.collection("patients").doc(b.patient_id).get() : null;
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
  async occupyBed(bedId, patientId) {
    await db.collection("beds").doc(bedId).update({
      status: "Occupied",
      patient_id: patientId
    });
    return true;
  },
  async vacateBed(bedId) {
    await db.collection("beds").doc(bedId).update({
      status: "Vacant",
      patient_id: null
    });
    return true;
  },
  // --- Admissions ---
  async getAdmissions() {
    const snapshot = await db.collection("admissions").get();
    const list = [];
    for (const doc of snapshot.docs) {
      const adm = doc.data();
      const patientDoc = await db.collection("patients").doc(adm.patient_id).get();
      list.push({
        id: doc.id,
        patientId: adm.patient_id,
        patientName: patientDoc.exists ? patientDoc.data()?.name : "Unknown Patient",
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
        } : void 0
      });
    }
    return list;
  },
  async insertAdmission(adm) {
    await db.collection("admissions").doc(adm.id).set({
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
  async addNursingNote(note) {
    const admissionRef = db.collection("admissions").doc(note.admissionId);
    await db.runTransaction(async (transaction) => {
      const doc = await transaction.get(admissionRef);
      if (!doc.exists) throw new Error("Admission clinical envelope not found");
      const current = doc.data()?.nursing_notes || [];
      const newNote = {
        id: note.id,
        date: (/* @__PURE__ */ new Date()).toISOString(),
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
  async addProgressNote(note) {
    const admissionRef = db.collection("admissions").doc(note.admissionId);
    await db.runTransaction(async (transaction) => {
      const doc = await transaction.get(admissionRef);
      if (!doc.exists) throw new Error("Admission clinical envelope not found");
      const current = doc.data()?.progress_notes || [];
      const newNote = {
        id: note.id,
        date: (/* @__PURE__ */ new Date()).toISOString(),
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
  async dischargeAdmissionTransaction(discharge) {
    const admissionRef = db.collection("admissions").doc(discharge.admissionId);
    const bedRef = db.collection("beds").doc(discharge.bedId);
    const result = await db.runTransaction(async (transaction) => {
      const admDoc = await transaction.get(admissionRef);
      if (!admDoc.exists) throw new Error("IPD Admission record not found");
      const adm = admDoc.data();
      if (adm.status === "Discharged") throw new Error("Patient is already discharged.");
      transaction.update(admissionRef, {
        status: "Discharged",
        discharge_date: (/* @__PURE__ */ new Date()).toISOString(),
        discharge_summary_diagnosis: discharge.diagnosis,
        discharge_summary_treatment: discharge.treatment,
        discharge_summary_instructions: discharge.instructions,
        discharge_summary_followup: discharge.followUp || null
      });
      transaction.update(bedRef, {
        status: "Vacant",
        patient_id: null
      });
      const dateAdm = new Date(adm.admission_date);
      const dateDis = /* @__PURE__ */ new Date();
      const diffDays = Math.max(1, Math.ceil((dateDis.getTime() - dateAdm.getTime()) / (1e3 * 60 * 60 * 24)));
      const bedDoc = await transaction.get(bedRef);
      const bedType = bedDoc.exists ? bedDoc.data()?.type : "General Ward";
      const flatChargesMap = {
        "General Ward": 120,
        "Semi-Private": 250,
        "Private": 500,
        "ICU": 1200
      };
      const feeRate = flatChargesMap[bedType] || 120;
      const totalBedCost = Number((feeRate * diffDays).toFixed(2));
      const invoicesSnapshot = await transaction.get(db.collection("invoices"));
      const newInvoiceId = `INV-${1e4 + invoicesSnapshot.size + 1}`;
      const invoiceRef = db.collection("invoices").doc(newInvoiceId);
      const patientDoc = await transaction.get(db.collection("patients").doc(adm.patient_id));
      const patientName = patientDoc.exists ? patientDoc.data()?.name : "Unknown Patient";
      const newItem = {
        description: `Inpatient ward accommodation bed days charge (${diffDays} days in ${bedType})`,
        amount: totalBedCost,
        category: "Inpatient"
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
        paid_amount: 0,
        status: "Unpaid",
        created_at: (/* @__PURE__ */ new Date()).toISOString()
      });
      return { admissionId: discharge.admissionId, invoiceId: newInvoiceId };
    });
    return result;
  },
  // --- Invoices & Billing ---
  async getInvoices() {
    const snapshot = await db.collection("invoices").get();
    return snapshot.docs.map((doc) => {
      const inv = doc.data();
      return {
        id: doc.id,
        patientId: inv.patient_id,
        patientName: inv.patient_name || "Unknown Patient",
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
  async payInvoice(id, payment) {
    const mapped = {
      paid_amount: Number(payment.paidAmount),
      payment_method: payment.paymentMethod,
      status: payment.status
    };
    if (payment.insuranceProvider) mapped.insurance_provider = payment.insuranceProvider;
    if (payment.policyNumber) mapped.policy_number = payment.policyNumber;
    if (payment.claimStatus) mapped.claim_status = payment.claimStatus;
    await db.collection("invoices").doc(id).update(mapped);
    return payment;
  },
  async updateInsuranceClaimStatus(id, claimStatus, status, totalAmount) {
    const mapped = { claim_status: claimStatus, status };
    if (totalAmount !== void 0) mapped.paid_amount = Number(totalAmount);
    await db.collection("invoices").doc(id).update(mapped);
    return true;
  },
  // --- HIPAA Audits ---
  async getAuditLogs() {
    const snapshot = await db.collection("security_audit_logs").orderBy("timestamp", "desc").get();
    return snapshot.docs.map((doc) => {
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
  async insertAuditLog(log) {
    await db.collection("security_audit_logs").doc(log.id).set({
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
dbService.seedDatabaseIfVacant().catch((err) => {
  console.error("Failed to execute database seeding on module init:", err);
});

// src/server/routes/auth.routes.ts
import { Router } from "express";
import crypto2 from "crypto";
var authRouter = Router();
var JWT_SECRET = "hospital-management-secret-key-2026-secure";
function hashPassword2(password) {
  return crypto2.createHash("sha256").update(password).digest("hex");
}
function signToken(payload) {
  const header = { alg: "HS256", typ: "JWT" };
  const headerB64 = Buffer.from(JSON.stringify(header)).toString("base64url");
  const payloadB64 = Buffer.from(JSON.stringify(payload)).toString("base64url");
  const signature = crypto2.createHmac("sha256", JWT_SECRET).update(`${headerB64}.${payloadB64}`).digest("base64url");
  return `${headerB64}.${payloadB64}.${signature}`;
}
function verifyToken(token) {
  try {
    const parts = token.split(".");
    if (parts.length !== 3) return null;
    const [headerB64, payloadB64, signature] = parts;
    const expectedSignature = crypto2.createHmac("sha256", JWT_SECRET).update(`${headerB64}.${payloadB64}`).digest("base64url");
    if (signature !== expectedSignature) return null;
    const payloadStr = Buffer.from(payloadB64, "base64url").toString();
    return JSON.parse(payloadStr);
  } catch (err) {
    return null;
  }
}
function authenticateToken(req, res, next) {
  const authHeader = req.headers["authorization"];
  const token = authHeader && authHeader.split(" ")[1];
  if (!token) return res.status(401).json({ message: "No token provided" });
  const user = verifyToken(token);
  if (!user) return res.status(403).json({ message: "Invalid or expired session" });
  req.user = user;
  next();
}
async function logAudit(userId, username, role, action, details, patientId) {
  try {
    const newLog = {
      id: `log-${crypto2.randomUUID()}`,
      userId,
      username,
      userRole: role,
      patientId: patientId || null,
      action,
      details,
      timestamp: (/* @__PURE__ */ new Date()).toISOString()
    };
    await dbService.insertAuditLog(newLog);
  } catch (err) {
    console.error("CRITICAL HIPAA NO_SQL LEDGER TRANSACTION ERROR:", err);
  }
}
authRouter.post("/login", async (req, res) => {
  const { username, password } = req.body;
  if (!username || !password) {
    return res.status(400).json({ message: "Missing username or password" });
  }
  try {
    const userFound = await dbService.getUserByUsername(username);
    if (!userFound || hashPassword2(password) !== userFound.passwordHash) {
      return res.status(400).json({ message: "Invalid username or password" });
    }
    const payload = {
      id: userFound.id,
      username: userFound.username,
      name: userFound.name,
      role: userFound.role,
      department: userFound.department
    };
    const token = signToken(payload);
    await logAudit(userFound.id, userFound.username, userFound.role, "USER_LOGIN", `User ${userFound.username} logged in successfully.`);
    res.json({ token, user: payload });
  } catch (err) {
    res.status(500).json({ message: "Internal Auth Gateway Error", error: err.message });
  }
});
authRouter.get("/me", authenticateToken, (req, res) => {
  res.json({ user: req.user });
});

// src/server/routes/patient.routes.ts
import { Router as Router2 } from "express";
var patientRouter = Router2();
patientRouter.get("/er/queue", authenticateToken, async (req, res) => {
  try {
    const snapshot = await db.collection("patients").where("triage_status", "==", "ER Queue").get();
    const queue = snapshot.docs.map((doc) => {
      const p = doc.data();
      return {
        id: doc.id,
        name: p.name,
        gender: p.gender,
        dob: p.dob,
        esiLevel: p.esi_level,
        triageStatus: p.triage_status,
        triageNotes: p.triage_notes || "",
        triageScore: p.triage_score || 0,
        triageTimestamp: p.triage_timestamp || p.created_at
      };
    });
    queue.sort((a, b) => {
      if (a.esiLevel !== b.esiLevel) {
        return a.esiLevel - b.esiLevel;
      }
      return new Date(a.triageTimestamp).getTime() - new Date(b.triageTimestamp).getTime();
    });
    res.json(queue);
  } catch (err) {
    res.status(500).json({ message: "Failed to fetch ER queue roster", error: err.message });
  }
});
patientRouter.post("/:id/triage", authenticateToken, async (req, res) => {
  const { id } = req.params;
  const { bp, heartRate, temperature, spo2, glasgowComaScale, notes } = req.body;
  if (!bp || !heartRate || !temperature || !spo2 || !glasgowComaScale) {
    return res.status(400).json({ message: "Vitals parameters are required for ESI triage assessment" });
  }
  try {
    const patient = await dbService.getPatientById(id);
    if (!patient) return res.status(404).json({ message: "Patient not found" });
    let esiLevel = 5;
    let triageScore = 0;
    const hr = Number(heartRate);
    const temp = Number(temperature);
    const oxygen = Number(spo2);
    const gcs = Number(glasgowComaScale);
    if (gcs <= 8 || oxygen < 85 || hr > 140 || hr < 40) {
      esiLevel = 1;
      triageScore = 95;
    } else if (gcs <= 12 || oxygen < 90 || hr > 120 || temp > 40) {
      esiLevel = 2;
      triageScore = 80;
    } else if (oxygen < 95 || hr > 100 || temp > 38.5) {
      esiLevel = 3;
      triageScore = 55;
    } else if (temp > 37.5 || hr > 90) {
      esiLevel = 4;
      triageScore = 30;
    } else {
      esiLevel = 5;
      triageScore = 10;
    }
    await db.collection("patients").doc(id).update({
      esi_level: esiLevel,
      triage_status: "ER Queue",
      triage_notes: notes || "Triage ESI evaluated",
      triage_score: triageScore,
      triage_timestamp: (/* @__PURE__ */ new Date()).toISOString()
    });
    const reqUser = req.user;
    await logAudit(
      reqUser.id,
      reqUser.username,
      reqUser.role,
      "EMERGENCY_TRIAGE_ESI",
      `ESI priority Level ${esiLevel} triage assessment finalized for patient ${patient.name}`,
      id
    );
    res.json({
      success: true,
      patientId: id,
      patientName: patient.name,
      esiLevel,
      triageScore,
      status: "ER Queue",
      notes: notes || "Triage ESI evaluated"
    });
  } catch (err) {
    res.status(500).json({ message: "ER Triage assessment failed", error: err.message });
  }
});
patientRouter.get("/", authenticateToken, async (req, res) => {
  const search = req.query.search;
  try {
    const matches = await dbService.getPatients(search);
    const reqUser = req.user;
    await logAudit(reqUser.id, reqUser.username, reqUser.role, "PATIENT_DIRECTORY_LIST", `Accessed patient listings${search ? ` filtered by: "${search}"` : ""}`);
    res.json(matches);
  } catch (err) {
    res.status(500).json({ message: "Failed to load patient directories", error: err.message });
  }
});
patientRouter.get("/:id", authenticateToken, async (req, res) => {
  try {
    const patient = await dbService.getPatientById(req.params.id);
    if (!patient) return res.status(404).json({ message: "Patient not found" });
    const reqUser = req.user;
    await logAudit(reqUser.id, reqUser.username, reqUser.role, "VIEW_MEDICAL_RECORD", `Viewed Clinical Demographics of ${patient.name}`, patient.id);
    res.json(patient);
  } catch (err) {
    res.status(500).json({ message: "Failed to fetch patient record", error: err.message });
  }
});
patientRouter.post("/", authenticateToken, async (req, res) => {
  const { name, dob, gender, contact, email, address, bloodGroup, emergencyContact } = req.body;
  if (!name || !dob || !gender || !contact || !address || !bloodGroup || !emergencyContact?.name || !emergencyContact?.phone) {
    return res.status(400).json({ message: "Missing required patient registration demographics" });
  }
  try {
    const count = await dbService.countPatients();
    const mrn = `MRN-2026-${String(count + 1).padStart(4, "0")}`;
    const newPatient = {
      id: mrn,
      name,
      dob,
      gender,
      contact,
      email: email || "",
      address,
      bloodGroup,
      emergencyContact,
      isArchived: false,
      createdAt: (/* @__PURE__ */ new Date()).toISOString(),
      triage_status: "Triage Pending",
      // Initial state
      esi_level: 5
      // Lowest default priority
    };
    await dbService.insertPatient(newPatient);
    const reqUser = req.user;
    await logAudit(reqUser.id, reqUser.username, reqUser.role, "REGISTER_PATIENT", `Registered new patient: ${name} with MRN: ${mrn}`, mrn);
    res.status(201).json(newPatient);
  } catch (err) {
    res.status(500).json({ message: "Registration failure", error: err.message });
  }
});
patientRouter.put("/:id", authenticateToken, async (req, res) => {
  try {
    await dbService.updatePatient(req.params.id, req.body);
    const reqUser = req.user;
    await logAudit(reqUser.id, reqUser.username, reqUser.role, "UPDATE_PATIENT_DEMOGRAPHICS", `Updated patient details for MRN: ${req.params.id}`, req.params.id);
    const revisedPatient = await dbService.getPatientById(req.params.id);
    res.json(revisedPatient);
  } catch (err) {
    res.status(500).json({ message: "Update failure", error: err.message });
  }
});
patientRouter.delete("/:id/archive", authenticateToken, async (req, res) => {
  try {
    await dbService.updatePatient(req.params.id, { isArchived: true });
    const reqUser = req.user;
    await logAudit(reqUser.id, reqUser.username, reqUser.role, "ARCHIVE_PATIENT", `Archived patient profile status for MRN: ${req.params.id}`, req.params.id);
    const patientObj = await dbService.getPatientById(req.params.id);
    res.json({ message: "Patient archived successfully.", patient: patientObj });
  } catch (err) {
    res.status(500).json({ message: "Archiving command failed.", error: err.message });
  }
});

// src/server/routes/appointment.routes.ts
import { Router as Router3 } from "express";
import crypto3 from "crypto";
var appointmentRouter = Router3();
appointmentRouter.get("/", authenticateToken, async (req, res) => {
  const reqUser = req.user;
  try {
    const results = await dbService.getAppointments(reqUser.role === "Doctor" ? reqUser.id : void 0);
    res.json(results);
  } catch (err) {
    res.status(500).json({ message: "Failed to query appointments", error: err.message });
  }
});
appointmentRouter.post("/", authenticateToken, async (req, res) => {
  const { patientId, doctorId, dateTime, timeSlot, notes } = req.body;
  if (!patientId || !doctorId || !dateTime || !timeSlot) {
    return res.status(400).json({ message: "Required booking items: Patient ID, Doctor, Date, and Time Slot are required" });
  }
  try {
    const isDocConflict = await dbService.checkAppointmentConflict(doctorId, dateTime, timeSlot);
    if (isDocConflict) {
      return res.status(400).json({ message: `Doctor is already scheduled at ${timeSlot} on this clinical date.` });
    }
    const patient = await dbService.getPatientById(patientId);
    const doctors = await dbService.getDoctors();
    const doctor = doctors.find((u) => u.id === doctorId);
    if (!patient || !doctor) {
      return res.status(404).json({ message: "Invalid patient or medical staff selected" });
    }
    const newAppointmentId = `apt-${crypto3.randomUUID()}`;
    const smsMessage = `STJUDE-HOSPITAL: Hello ${patient.name}, your medical consultative encounter with ${doctor.name} is scheduled on ${dateTime.substring(0, 10)} at ${timeSlot}.`;
    const newAppointment = {
      id: newAppointmentId,
      patientId,
      doctorId,
      dateTime,
      timeSlot,
      status: "Scheduled",
      notes: notes || "",
      createdAt: (/* @__PURE__ */ new Date()).toISOString(),
      simulatedNotificationLog: smsMessage
    };
    await dbService.insertAppointment(newAppointment);
    const reqUser = req.user;
    await logAudit(reqUser.id, reqUser.username, reqUser.role, "BOOK_APPOINTMENT", `Booked appointment slot for: ${patient.name} with ${doctor.name}`, patientId);
    res.status(201).json({ ...newAppointment, patientName: patient.name, doctorName: doctor.name });
  } catch (err) {
    res.status(500).json({ message: "Failed to book appointment", error: err.message });
  }
});
appointmentRouter.put("/:id", authenticateToken, async (req, res) => {
  const { status, timeSlot, dateTime, notes } = req.body;
  try {
    const list = await dbService.getAppointments();
    const original = list.find((a) => a.id === req.params.id);
    if (!original) return res.status(404).json({ message: "Appointment booking item not found" });
    if (timeSlot && dateTime && timeSlot !== original.timeSlot) {
      const isConflict = await dbService.checkAppointmentConflict(original.doctorId, dateTime, timeSlot, req.params.id);
      if (isConflict) {
        return res.status(400).json({ message: "Double-booking detected. Selected Doctor availability conflict." });
      }
    }
    const updates = { status, timeSlot, dateTime, notes };
    await dbService.updateAppointment(req.params.id, updates);
    const reqUser = req.user;
    await logAudit(reqUser.id, reqUser.username, reqUser.role, "UPDATE_APPOINTMENT", `Updated appointment clinical state to: ${status || original.status}`, original.patientId);
    const finalAppt = { ...original, ...updates };
    res.json(finalAppt);
  } catch (err) {
    res.status(500).json({ message: "Adjustment error", error: err.message });
  }
});
appointmentRouter.get("/doctors", authenticateToken, async (req, res) => {
  try {
    const list = await dbService.getDoctors();
    res.json(list);
  } catch (err) {
    res.status(500).json({ message: "Failed to fetch doctors list", error: err.message });
  }
});
appointmentRouter.post("/doctors/leaves", authenticateToken, async (req, res) => {
  const reqUser = req.user;
  const { startDate, endDate, reason } = req.body;
  if (!startDate || !endDate || !reason) {
    return res.status(400).json({ message: "Missing leave parameters" });
  }
  try {
    const leaveId = `leave-${crypto3.randomUUID()}`;
    const newLeave = {
      id: leaveId,
      doctorId: reqUser.id,
      startDate,
      endDate,
      reason,
      status: "Pending"
    };
    await dbService.applyLeave(newLeave);
    await logAudit(reqUser.id, reqUser.username, reqUser.role, "LEAVE_APPLY", `Doctor requested clinical leave from ${startDate} to ${endDate}`);
    res.status(201).json(newLeave);
  } catch (err) {
    res.status(500).json({ message: "Leave registration failed", error: err.message });
  }
});
appointmentRouter.put("/doctors/leaves/:leaveId", authenticateToken, async (req, res) => {
  const reqUser = req.user;
  const { doctorId, status } = req.body;
  if (reqUser.role !== "Admin") {
    return res.status(403).json({ message: "Only administrators approve leave items" });
  }
  try {
    const updated = await dbService.updateLeaveStatus(req.params.leaveId, status);
    await logAudit(reqUser.id, reqUser.username, reqUser.role, "LEAVE_STATUS_DECISION", `Updated leave record ${req.params.leaveId} to ${status} for doctor ${doctorId}`);
    res.json(updated);
  } catch (err) {
    res.status(500).json({ message: "Leave approval failed", error: err.message });
  }
});

// src/server/routes/clinical.routes.ts
import { Router as Router4 } from "express";
import crypto4 from "crypto";
var clinicalRouter = Router4();
clinicalRouter.get("/patient/:patientId", authenticateToken, async (req, res) => {
  try {
    const encounters = await dbService.getEncountersByPatient(req.params.patientId);
    const reqUser = req.user;
    await logAudit(
      reqUser.id,
      reqUser.username,
      reqUser.role,
      "VIEW_PATIENT_CLINICAL_HIS",
      `Chronologically listed clinical encounter history for ${req.params.patientId}`,
      req.params.patientId
    );
    res.json(encounters);
  } catch (err) {
    res.status(500).json({ message: "Encounter history query failure", error: err.message });
  }
});
clinicalRouter.post("/", authenticateToken, async (req, res) => {
  const { patientId, vitals, soap, prescriptions, labOrders } = req.body;
  const reqUser = req.user;
  if (reqUser.role !== "Doctor" && reqUser.role !== "Admin") {
    return res.status(403).json({ message: "Access unauthorized: Only certified physicians write SOAP clinical progress encounters" });
  }
  if (!patientId || !vitals || !soap) {
    return res.status(400).json({ message: "Missing required vitals or subjective/objective SOAP notes" });
  }
  try {
    const patient = await dbService.getPatientById(patientId);
    if (!patient) return res.status(404).json({ message: "Patient MRN is invalid" });
    const encounterId = `e-${crypto4.randomUUID()}`;
    const formattedLabOrders = [];
    const fullLabOrderPayloads = [];
    if (labOrders && Array.isArray(labOrders)) {
      labOrders.forEach((lOrder) => {
        const lId = `lab-${crypto4.randomUUID()}`;
        fullLabOrderPayloads.push({
          id: lId,
          patientId,
          patientName: patient.name,
          patientMRN: patient.id,
          doctorId: reqUser.id,
          doctorName: reqUser.name,
          encounterId,
          testName: lOrder.testName,
          category: lOrder.category || "Other",
          status: "Ordered",
          statusHistory: [
            {
              status: "Ordered",
              timestamp: (/* @__PURE__ */ new Date()).toISOString(),
              changedBy: reqUser.name,
              comments: "Lab order requested by Doctor"
            }
          ]
        });
        formattedLabOrders.push({ id: lId, testName: lOrder.testName });
      });
    }
    const formattedPrescriptions = (prescriptions || []).map((p) => ({
      medicineId: p.medicineId,
      name: p.name,
      dosage: p.dosage,
      frequency: p.frequency,
      duration: p.duration,
      dispensed: false,
      notes: p.notes || ""
    }));
    const newEncounter = {
      id: encounterId,
      patientId,
      doctorId: reqUser.id,
      doctorName: reqUser.name,
      date: (/* @__PURE__ */ new Date()).toISOString(),
      vitals,
      soap,
      prescriptions: formattedPrescriptions,
      labOrders: formattedLabOrders,
      createdAt: (/* @__PURE__ */ new Date()).toISOString()
    };
    await dbService.insertEncounter(newEncounter, formattedPrescriptions, fullLabOrderPayloads);
    const invoicesSnapshot = await db.collection("invoices").get();
    const invoiceId = `INV-${1e4 + invoicesSnapshot.size + 1}`;
    const baseDoctorFee = reqUser.consultationFee || 100;
    const invoiceItems = [
      { description: `Physician consultation encounter - ${reqUser.name}`, amount: baseDoctorFee, category: "Consultation" }
    ];
    if (formattedLabOrders.length > 0) {
      formattedLabOrders.forEach((ord) => {
        invoiceItems.push({
          description: `Lab diagnostics - ${ord.testName}`,
          amount: 45,
          category: "Laboratory"
        });
      });
    }
    const settings = await dbService.getSettings();
    const subtotal = invoiceItems.reduce((acc, curr) => acc + curr.amount, 0);
    const tax = Number((subtotal * settings.taxRate).toFixed(2));
    const total = Number((subtotal + tax).toFixed(2));
    const newInvoice = {
      id: invoiceId,
      patientId,
      patientName: patient.name,
      patientMRN: patient.id,
      encounterId,
      items: invoiceItems,
      subtotal,
      tax,
      total,
      paidAmount: 0,
      status: "Unpaid",
      createdAt: (/* @__PURE__ */ new Date()).toISOString()
    };
    await db.collection("invoices").doc(invoiceId).set(newInvoice);
    await logAudit(
      reqUser.id,
      reqUser.username,
      reqUser.role,
      "CREATE_CLINICAL_ENCOUNTER",
      `Recorded SOAP Clinical documentation & consultation fee invoice generated under MRN: ${patientId}`,
      patientId
    );
    res.status(201).json({ encounter: newEncounter, invoice: newInvoice });
  } catch (err) {
    res.status(500).json({ message: "Consultation logging pipeline failed", error: err.message });
  }
});

// src/server/routes/lab.routes.ts
import { Router as Router5 } from "express";
var labRouter = Router5();
labRouter.get("/orders", authenticateToken, async (req, res) => {
  try {
    const orders = await dbService.getLabOrders();
    res.json(orders);
  } catch (err) {
    res.status(500).json({ message: "Failed to fetch lab orders", error: err.message });
  }
});
labRouter.put("/orders/:id", authenticateToken, async (req, res) => {
  const { resultValue, referenceRange, flag, comments, filePath, status } = req.body;
  const reqUser = req.user;
  if (reqUser.role !== "Lab Technician" && reqUser.role !== "Admin" && reqUser.role !== "Doctor") {
    return res.status(403).json({ message: "Access unauthorized: Laboratory operations restricted to appropriate medical roles" });
  }
  try {
    const snapshot = await db.collection("lab_orders").doc(req.params.id).get();
    if (!snapshot.exists) {
      return res.status(404).json({ message: "Lab order not found" });
    }
    const orig = snapshot.data();
    const validStatuses = ["Ordered", "Sample Collected", "In-Lab Processing", "Results Written", "Doctor Reviewed", "Completed"];
    let finalStatus = status || orig.status || "Ordered";
    if (status && !validStatuses.includes(status)) {
      return res.status(400).json({ message: `Invalid specimen custody status transition: ${status}` });
    }
    if (resultValue && !status) {
      finalStatus = "Results Written";
    }
    const statusHistory = orig.statusHistory || [
      {
        status: orig.status || "Ordered",
        timestamp: orig.createdAt || (/* @__PURE__ */ new Date()).toISOString(),
        changedBy: orig.doctorName || "System",
        comments: "Order created"
      }
    ];
    if (status && status !== orig.status) {
      statusHistory.push({
        status,
        timestamp: (/* @__PURE__ */ new Date()).toISOString(),
        changedBy: reqUser.name,
        comments: comments || `Status transitioned to ${status}`
      });
    }
    const updates = {
      status: finalStatus,
      statusHistory,
      technicianId: reqUser.id,
      technicianName: reqUser.name,
      updatedAt: (/* @__PURE__ */ new Date()).toISOString()
    };
    if (resultValue !== void 0) updates.resultValue = resultValue;
    if (referenceRange !== void 0) updates.referenceRange = referenceRange;
    if (flag !== void 0) updates.flag = flag;
    if (comments !== void 0) updates.comments = comments;
    if (filePath !== void 0) updates.filePath = filePath;
    await db.collection("lab_orders").doc(req.params.id).update(updates);
    let isAlarmTriggered = false;
    let alarmMsg = "";
    if (flag === "Critical") {
      isAlarmTriggered = true;
      alarmMsg = `!!! CRITICAL VALUE ATTENTION !!! Recorded highly elevated critical diagnostic values. Immediately paging supervising physician.`;
    } else if (flag === "Abnormal") {
      isAlarmTriggered = true;
      alarmMsg = `[WARNING] Patient lab result recorded abnormal out-of-range value: ${resultValue}`;
    }
    await logAudit(
      reqUser.id,
      reqUser.username,
      reqUser.role,
      flag === "Critical" ? "CRITICAL_LAB_ALERT" : "RECORD_LAB_RESULTS",
      `${alarmMsg ? alarmMsg + " | " : ""}Reported ${orig.testName} results for patient ${orig.patientName} (MRN: ${orig.patientMRN}). Custody State: ${finalStatus}. Values: ${resultValue || "None"}`,
      orig.patientMRN
    );
    res.json({ ...orig, ...updates });
  } catch (err) {
    res.status(500).json({ message: "Lab results recording error", error: err.message });
  }
});
labRouter.post("/orders/:id/upload", authenticateToken, async (req, res) => {
  const { fileName, fileContentBase64 } = req.body;
  const reqUser = req.user;
  if (reqUser.role !== "Lab Technician" && reqUser.role !== "Admin") {
    return res.status(403).json({ message: "Only Lab Technicians upload clinical reporting charts" });
  }
  if (!fileName || !fileContentBase64) {
    return res.status(400).json({ message: "File data block is corrupt or empty" });
  }
  try {
    const simulatedStaticUrl = `/uploads/${Date.now()}_${fileName}`;
    await db.collection("lab_orders").doc(req.params.id).update({
      filePath: simulatedStaticUrl,
      updatedAt: (/* @__PURE__ */ new Date()).toISOString()
    });
    await logAudit(
      reqUser.id,
      reqUser.username,
      reqUser.role,
      "UPLOAD_LAB_REPORT_FILE",
      `Attached scanned radiology/lab file: ${fileName} to order ID ${req.params.id}`,
      void 0
    );
    res.json({ success: true, filePath: simulatedStaticUrl });
  } catch (err) {
    res.status(500).json({ message: "Upload failed", error: err.message });
  }
});

// src/server/routes/pharmacy.routes.ts
import { Router as Router6 } from "express";
import crypto5 from "crypto";
var pharmacyRouter = Router6();
pharmacyRouter.get("/inventory", authenticateToken, async (req, res) => {
  try {
    const inventory = await dbService.getInventory();
    res.json(inventory);
  } catch (err) {
    res.status(500).json({ message: "Inventory load error", error: err.message });
  }
});
pharmacyRouter.post("/inventory", authenticateToken, async (req, res) => {
  const reqUser = req.user;
  if (reqUser.role !== "Pharmacist" && reqUser.role !== "Admin") {
    return res.status(403).json({ message: "Restricted: inventory updates locked to pharmacist/admin roles" });
  }
  const { name, genericName, category, unitPrice, stockQuantity, minStockLevel, expiryDate, supplier } = req.body;
  if (!name || !genericName || !category || !unitPrice || stockQuantity === void 0 || !expiryDate || !supplier) {
    return res.status(400).json({ message: "All inventory profile parameters are required" });
  }
  try {
    const newItem = {
      id: `med-${crypto5.randomUUID()}`,
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
      "ADD_INVENTORY_STOCK",
      `Added new medical formulary record item: ${name} to stock`
    );
    res.status(201).json(newItem);
  } catch (err) {
    res.status(500).json({ message: "Inventory item post failed", error: err.message });
  }
});
pharmacyRouter.put("/inventory/:id", authenticateToken, async (req, res) => {
  const reqUser = req.user;
  if (reqUser.role !== "Pharmacist" && reqUser.role !== "Admin") {
    return res.status(403).json({ message: "Restricted: inventory updates locked to pharmacist/admin roles" });
  }
  try {
    await dbService.updateInventoryItem(req.params.id, req.body);
    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ message: "Stock revision server connection failed", error: err.message });
  }
});
pharmacyRouter.put("/prescriptions/:encounterId/:medicineId/status", authenticateToken, async (req, res) => {
  const { status, comments } = req.body;
  const reqUser = req.user;
  if (reqUser.role !== "Pharmacist" && reqUser.role !== "Admin" && reqUser.role !== "Nurse") {
    return res.status(403).json({ message: "Access unauthorized: Restricted to clinical pharmacy staff" });
  }
  const validStatuses = ["Ordered", "Verifying Insurance", "Preparing", "Ready for Pickup", "Dispensed"];
  if (!validStatuses.includes(status)) {
    return res.status(400).json({ message: `Invalid pharmacy lifecycle status: ${status}` });
  }
  try {
    const encRef = db.collection("encounters").doc(req.params.encounterId);
    const docSnapshot = await encRef.get();
    if (!docSnapshot.exists) {
      return res.status(404).json({ message: "Patient clinical encounter not found" });
    }
    const encData = docSnapshot.data();
    const prescriptions = encData.prescriptions || [];
    const rxIndex = prescriptions.findIndex((p) => p.medicineId === req.params.medicineId);
    if (rxIndex === -1) {
      return res.status(404).json({ message: "Prescription medication not found in this encounter" });
    }
    const originalStatus = prescriptions[rxIndex].status || "Ordered";
    prescriptions[rxIndex].status = status;
    prescriptions[rxIndex].updatedAt = (/* @__PURE__ */ new Date()).toISOString();
    prescriptions[rxIndex].lastUpdatedBy = reqUser.name;
    const lifecycleHistory = prescriptions[rxIndex].lifecycleHistory || [
      { status: "Ordered", timestamp: encData.date, changedBy: encData.doctorName || "Doctor" }
    ];
    lifecycleHistory.push({
      status,
      timestamp: (/* @__PURE__ */ new Date()).toISOString(),
      changedBy: reqUser.name,
      comments: comments || `Status transitioned to ${status}`
    });
    prescriptions[rxIndex].lifecycleHistory = lifecycleHistory;
    if (status === "Dispensed") {
      prescriptions[rxIndex].dispensed = true;
      prescriptions[rxIndex].dispensedAt = (/* @__PURE__ */ new Date()).toISOString();
    }
    await encRef.update({ prescriptions });
    await logAudit(
      reqUser.id,
      reqUser.username,
      reqUser.role,
      "PHARMACY_LIFECYCLE_STATE",
      `Prescription medication ID ${req.params.medicineId} transitioned state from ${originalStatus} to ${status} for encounter ID ${req.params.encounterId}`,
      encData.patientId
    );
    res.json({ success: true, prescription: prescriptions[rxIndex] });
  } catch (err) {
    res.status(500).json({ message: "Failed to update prescription status", error: err.message });
  }
});
pharmacyRouter.post("/dispense", authenticateToken, async (req, res) => {
  const reqUser = req.user;
  if (reqUser.role !== "Pharmacist" && reqUser.role !== "Admin") {
    return res.status(403).json({ message: "Restricted to pharmacist role operations" });
  }
  const { encounterId, patientId, medicineId, quantity } = req.body;
  if (!patientId || !medicineId || !quantity) {
    return res.status(400).json({ message: "Missing clinical prescription dispensing references" });
  }
  const qty = Number(quantity);
  if (qty <= 0) {
    return res.status(400).json({ message: "Dispensing quantity must be greater than zero." });
  }
  if (qty > 150) {
    return res.status(400).json({ message: "CRITICAL SAFETY BATCH ERROR: Maximum single dispense limit (150 units) exceeded to prevent medication overdosing/abuse." });
  }
  try {
    const settings = await dbService.getSettings();
    const taxRate = settings.taxRate || 0.05;
    const transactionResult = await dbService.dispenseMedicationTransaction({
      encounterId,
      patientId,
      medicineId,
      quantity: qty,
      taxRate
    });
    if (encounterId) {
      const encRef = db.collection("encounters").doc(encounterId);
      const docSnapshot = await encRef.get();
      if (docSnapshot.exists) {
        const encData = docSnapshot.data();
        const prescriptions = encData.prescriptions || [];
        const rxIndex = prescriptions.findIndex((p) => p.medicineId === medicineId);
        if (rxIndex !== -1) {
          prescriptions[rxIndex].status = "Dispensed";
          prescriptions[rxIndex].dispensed = true;
          prescriptions[rxIndex].dispensedAt = (/* @__PURE__ */ new Date()).toISOString();
          const lifecycleHistory = prescriptions[rxIndex].lifecycleHistory || [
            { status: "Ordered", timestamp: encData.date, changedBy: encData.doctorName || "Doctor" }
          ];
          lifecycleHistory.push({
            status: "Dispensed",
            timestamp: (/* @__PURE__ */ new Date()).toISOString(),
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
      "DISPENSE_PHARMACEUTICAL",
      `Dispensed ${qty} units of medicine ID ${medicineId} to patient ${patientId}`,
      patientId
    );
    res.json({ message: "Prescription successfully dispensed.", transactionResult });
  } catch (err) {
    res.status(400).json({ message: err.message || "Deduction and dispensing fail." });
  }
});

// src/server/routes/inpatient.routes.ts
import { Router as Router7 } from "express";
import crypto6 from "crypto";
var inpatientRouter = Router7();
inpatientRouter.get("/beds", authenticateToken, async (req, res) => {
  try {
    const beds = await dbService.getBeds();
    res.json(beds);
  } catch (err) {
    res.status(500).json({ message: "Failed to list beds", error: err.message });
  }
});
inpatientRouter.get("/admissions", authenticateToken, async (req, res) => {
  try {
    const list = await dbService.getAdmissions();
    res.json(list);
  } catch (err) {
    res.status(500).json({ message: "Failed to fetch admissions", error: err.message });
  }
});
inpatientRouter.post("/admissions", authenticateToken, async (req, res) => {
  const reqUser = req.user;
  const { patientId, bedId } = req.body;
  if (!patientId || !bedId) return res.status(400).json({ message: "Specify clinical patient MRN and target clinical bed index" });
  try {
    const patient = await dbService.getPatientById(patientId);
    const beds = await dbService.getBeds();
    const bed = beds.find((b) => b.id === bedId);
    if (!patient || !bed) return res.status(404).json({ message: "Invalid Patient MRN or Bed Code referenced" });
    if (bed.status !== "Vacant") return res.status(400).json({ message: "Assigned bed is already occupied or under servicing/maintenance." });
    await dbService.occupyBed(bedId, patientId);
    const admissionId = `adm-${crypto6.randomUUID()}`;
    const newAdmission = {
      id: admissionId,
      patientId,
      bedId: bed.id,
      wardName: bed.wardName,
      bedNumber: bed.bedNumber,
      admissionDate: (/* @__PURE__ */ new Date()).toISOString(),
      status: "Admitted"
    };
    await dbService.insertAdmission(newAdmission);
    await logAudit(
      reqUser.id,
      reqUser.username,
      reqUser.role,
      "IPD_PATIENT_ADMISSION",
      `Admitted patient: ${patient.name} to bed: ${bed.bedNumber} in ${bed.wardName}`,
      patientId
    );
    res.status(201).json({ ...newAdmission, patientName: patient.name, patientMRN: patient.id });
  } catch (err) {
    res.status(500).json({ message: "Admission failed", error: err.message });
  }
});
inpatientRouter.post("/admissions/:id/nursing-notes", authenticateToken, async (req, res) => {
  const { text } = req.body;
  const reqUser = req.user;
  if (!text) return res.status(400).json({ message: "Clinical note description is empty" });
  try {
    const note = {
      id: `nn-${crypto6.randomUUID()}`,
      admissionId: req.params.id,
      text,
      nurseId: reqUser.id,
      nurseName: reqUser.name
    };
    await dbService.addNursingNote(note);
    await logAudit(
      reqUser.id,
      reqUser.username,
      reqUser.role,
      "ADD_IPD_NURSING_NOTE",
      `Added nursing progress clinical status for admission id: ${req.params.id}`
    );
    res.json(note);
  } catch (err) {
    res.status(500).json({ message: "Failed to append nursing note", error: err.message });
  }
});
inpatientRouter.post("/admissions/:id/progress-notes", authenticateToken, async (req, res) => {
  const { text } = req.body;
  const reqUser = req.user;
  if (!text) return res.status(400).json({ message: "Clinical note description is empty" });
  try {
    const note = {
      id: `pn-${crypto6.randomUUID()}`,
      admissionId: req.params.id,
      text,
      staffId: reqUser.id,
      staffName: reqUser.name
    };
    await dbService.addProgressNote(note);
    await logAudit(
      reqUser.id,
      reqUser.username,
      reqUser.role,
      "ADD_IPD_PROGRESS_NOTE",
      `Added daily bedside doctor progress note for admission id: ${req.params.id}`
    );
    res.json(note);
  } catch (err) {
    res.status(500).json({ message: "Failed to append progress note", error: err.message });
  }
});
inpatientRouter.post("/admissions/:id/discharge", authenticateToken, async (req, res) => {
  const reqUser = req.user;
  const { diagnosis, treatmentSummary, dischargeInstructions, followUpDate } = req.body;
  if (!diagnosis || !treatmentSummary || !dischargeInstructions) {
    return res.status(400).json({ message: "Discharge parameters diagnosis and therapies description are required" });
  }
  try {
    const list = await dbService.getAdmissions();
    const admission = list.find((a) => a.id === req.params.id);
    if (!admission) return res.status(404).json({ message: "IPD Admission record not found" });
    if (admission.status === "Discharged") {
      return res.status(400).json({ message: "Patient is already discharged." });
    }
    const settings = await dbService.getSettings();
    const taxRate = settings.taxRate || 0.05;
    const result = await dbService.dischargeAdmissionTransaction({
      admissionId: req.params.id,
      bedId: admission.bedId,
      diagnosis,
      treatment: treatmentSummary,
      instructions: dischargeInstructions,
      followUp: followUpDate,
      taxRate
    });
    await logAudit(
      reqUser.id,
      reqUser.username,
      reqUser.role,
      "DISCHARGE_PATIENT_SUMMARY",
      `Discharged patient: ${admission.patientName} & final bill generated under MRN: ${admission.patientId}`,
      admission.patientId
    );
    res.json({ success: true, result });
  } catch (err) {
    res.status(500).json({ message: err.message || "Discharge process failed" });
  }
});

// src/server/routes/billing.routes.ts
import { Router as Router8 } from "express";
var billingRouter = Router8();
billingRouter.get("/invoices", authenticateToken, async (req, res) => {
  try {
    const invoices = await dbService.getInvoices();
    res.json(invoices);
  } catch (err) {
    res.status(500).json({ message: "Failed to fetch invoices", error: err.message });
  }
});
billingRouter.post("/invoices/calculate-charges", authenticateToken, async (req, res) => {
  const { patientId, bedType, daysStayed, serviceItems } = req.body;
  if (!patientId) {
    return res.status(400).json({ message: "Patient MRN is required for pricing calculations" });
  }
  try {
    const patientDoc = await db.collection("patients").doc(patientId).get();
    if (!patientDoc.exists) {
      return res.status(404).json({ message: "Patient record not found" });
    }
    const patientData = patientDoc.data();
    const esiLevel = Number(patientData.esi_level || 5);
    const triageMultipliers = {
      1: 2,
      2: 1.5,
      3: 1.25,
      4: 1.1,
      5: 1
    };
    const clinicalMultiplier = triageMultipliers[esiLevel] || 1;
    const bedChargesMap = {
      "General Ward": 120,
      "Semi-Private": 250,
      "Private": 500,
      "ICU": 1200
    };
    const baseBedRate = bedChargesMap[bedType || "General Ward"] || 120;
    const rawBedCost = baseBedRate * Number(daysStayed || 0);
    const totalBedCost = Number((rawBedCost * clinicalMultiplier).toFixed(2));
    const calculatedItems = [];
    if (daysStayed && daysStayed > 0) {
      calculatedItems.push({
        description: `IPD Ward Stay (${daysStayed} days in ${bedType || "General Ward"}) - ESI Level ${esiLevel} clinical resource factor applied`,
        amount: totalBedCost,
        category: "Inpatient"
      });
    }
    let servicesTotal = 0;
    if (serviceItems && Array.isArray(serviceItems)) {
      serviceItems.forEach((item) => {
        const itemAmount = Number(item.amount || 0);
        calculatedItems.push({
          description: item.description,
          amount: itemAmount,
          category: item.category || "Other"
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
  } catch (err) {
    res.status(500).json({ message: "Failed to calculate specialized clinical charges", error: err.message });
  }
});
billingRouter.post("/invoices/:id/pay", authenticateToken, async (req, res) => {
  const reqUser = req.user;
  const { paymentMethod, amountPaid, insuranceProvider, policyNumber } = req.body;
  if (!paymentMethod || !amountPaid) {
    return res.status(400).json({ message: "Specify payment channel mode and processing currency amount" });
  }
  try {
    const list = await dbService.getInvoices();
    const invoice = list.find((v) => v.id === req.params.id);
    if (!invoice) return res.status(404).json({ message: "Clinical charge invoice not found" });
    const newPaidAmt = invoice.paidAmount + Number(amountPaid);
    let status = "PartiallyPaid";
    let claimStatus = invoice.claimStatus || "";
    if (paymentMethod === "Insurance") {
      status = "InsuranceClaimed";
      claimStatus = "Submitted";
    } else if (newPaidAmt >= invoice.total) {
      status = "Paid";
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
      "PROCESS_INVOICE_BILL",
      `Processed payment for transaction INV: ${req.params.id}. Payment Mode: ${paymentMethod}, Amount: ${amountPaid}`,
      invoice.patientId
    );
    res.json({ ...invoice, ...paymentUpdate });
  } catch (err) {
    res.status(500).json({ message: "Payment processing failed", error: err.message });
  }
});
billingRouter.put("/invoices/:id/insurance-claim", authenticateToken, async (req, res) => {
  const reqUser = req.user;
  if (reqUser.role !== "Admin" && reqUser.role !== "Receptionist") {
    return res.status(403).json({ message: "Unauthorized claim adjustments" });
  }
  const { claimStatus } = req.body;
  if (!claimStatus) return res.status(400).json({ message: "Missing claim status" });
  try {
    const list = await dbService.getInvoices();
    const invoice = list.find((v) => v.id === req.params.id);
    if (!invoice) return res.status(404).json({ message: "Invoice not found" });
    let status = invoice.status;
    let totalAmount = invoice.paidAmount;
    if (claimStatus === "Approved") {
      status = "Paid";
      totalAmount = invoice.total;
    }
    await dbService.updateInsuranceClaimStatus(
      req.params.id,
      claimStatus,
      status,
      claimStatus === "Approved" ? totalAmount : void 0
    );
    await logAudit(
      reqUser.id,
      reqUser.username,
      reqUser.role,
      "INSURANCE_CLAIM_UPDATE",
      `Updated insurance claim status for invoice ${req.params.id} to: ${claimStatus}`,
      invoice.patientId
    );
    res.json({
      ...invoice,
      claimStatus,
      status,
      paidAmount: claimStatus === "Approved" ? totalAmount : invoice.paidAmount
    });
  } catch (err) {
    res.status(500).json({ message: "Insurance claim update failed", error: err.message });
  }
});

// src/server/routes/audit.routes.ts
import { Router as Router9 } from "express";
var auditRouter = Router9();
auditRouter.get("/logs", authenticateToken, async (req, res) => {
  const reqUser = req.user;
  if (reqUser.role !== "Admin") {
    return res.status(403).json({ message: "Access forbidden: Audit logs restricted to Admin role" });
  }
  try {
    const logs = await dbService.getAuditLogs();
    res.json(logs);
  } catch (err) {
    res.status(500).json({ message: "Failed to fetch audit logs", error: err.message });
  }
});

// src/server/routes/settings.routes.ts
import { Router as Router10 } from "express";
var settingsRouter = Router10();
settingsRouter.get("/", authenticateToken, async (req, res) => {
  try {
    const settings = await dbService.getSettings();
    res.json(settings);
  } catch (err) {
    res.status(500).json({ message: "Settings fetch failed", error: err.message });
  }
});
settingsRouter.put("/", authenticateToken, async (req, res) => {
  const reqUser = req.user;
  if (reqUser.role !== "Admin") return res.status(403).json({ message: "Unauthorized settings modifications" });
  try {
    await dbService.updateSettings(req.body);
    await logAudit(
      reqUser.id,
      reqUser.username,
      reqUser.role,
      "UPDATE_HOSPITAL_CONFIG",
      `Updated global hospital settings configuration`
    );
    res.json(req.body);
  } catch (err) {
    res.status(500).json({ message: "Settings revision failed", error: err.message });
  }
});

// src/server/routes/doctor.routes.ts
import { Router as Router11 } from "express";
import crypto7 from "crypto";
var doctorRouter = Router11();
doctorRouter.get("/", authenticateToken, async (req, res) => {
  try {
    const doctors = await dbService.getDoctors();
    res.json(doctors);
  } catch (err) {
    res.status(500).json({ message: "Failed to list doctors", error: err.message });
  }
});
doctorRouter.post("/leaves", authenticateToken, async (req, res) => {
  const reqUser = req.user;
  const { startDate, endDate, reason } = req.body;
  if (!startDate || !endDate || !reason) {
    return res.status(400).json({ message: "Please specify start date, end date, and reason for leave" });
  }
  try {
    const newLeave = {
      id: `leave-${crypto7.randomUUID()}`,
      doctorId: reqUser.id,
      startDate,
      endDate,
      reason,
      status: "Pending"
    };
    await dbService.applyLeave(newLeave);
    await logAudit(
      reqUser.id,
      reqUser.username,
      reqUser.role,
      "APPLY_LEAVE",
      `Applied leave schedule from ${startDate} to ${endDate}`
    );
    res.status(201).json(newLeave);
  } catch (err) {
    res.status(500).json({ message: "Leave registration failed", error: err.message });
  }
});
doctorRouter.put("/leaves/:leaveId", authenticateToken, async (req, res) => {
  const reqUser = req.user;
  if (reqUser.role !== "Admin") {
    return res.status(403).json({ message: "Only administrators approve leave items" });
  }
  const { doctorId, status } = req.body;
  if (!doctorId || !status) {
    return res.status(400).json({ message: "Missing doctor ID or approval status" });
  }
  try {
    const updated = await dbService.updateLeaveStatus(req.params.leaveId, status);
    if (!updated) return res.status(404).json({ message: "Leave request item not found" });
    await logAudit(
      reqUser.id,
      reqUser.username,
      reqUser.role,
      "APPROVE_LEAVE",
      `Changed physician leave id ${req.params.leaveId} status to: ${status} for doctor: ${doctorId}`
    );
    res.json(updated);
  } catch (err) {
    res.status(500).json({ message: "Leave approval error", error: err.message });
  }
});

// src/server/routes/dashboard.routes.ts
import { Router as Router12 } from "express";
var dashboardRouter = Router12();
dashboardRouter.get("/stats", authenticateToken, async (req, res) => {
  try {
    const [patients, appts, beds, labOrders, invoices] = await Promise.all([
      dbService.getPatients(),
      dbService.getAppointments(),
      dbService.getBeds(),
      dbService.getLabOrders(),
      dbService.getInvoices()
    ]);
    const opdCount = appts.length;
    const admissionsSnapshot = await db.collection("admissions").where("status", "==", "Admitted").get();
    const ipdActiveCount = admissionsSnapshot.size;
    const totalBeds = beds.length;
    const occupiedBedsCount = beds.filter((b) => b.status === "Occupied").length;
    const bedOccupancyRate = totalBeds > 0 ? Number((occupiedBedsCount / totalBeds * 100).toFixed(1)) : 0;
    let totalRevenue = 0;
    let outstandingBalance = 0;
    invoices.forEach((inv) => {
      totalRevenue += inv.paidAmount;
      outstandingBalance += Math.max(0, inv.total - inv.paidAmount);
    });
    const deptDist = {};
    const doctors = await dbService.getDoctors();
    appts.forEach((app2) => {
      const doc = doctors.find((u) => u.id === app2.doctorId);
      const deptName = doc?.department || "General Medicine";
      deptDist[deptName] = (deptDist[deptName] || 0) + 1;
    });
    const departmentRevenue = Object.entries(deptDist).map(([name, value]) => ({ name, value }));
    const monthNames = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
    const registrationsByMonth = { "Jan": 0, "Feb": 0, "Mar": 0, "Apr": 0, "May": 0, "Jun": 0 };
    patients.forEach((p) => {
      const regDate = new Date(p.createdAt);
      if (regDate.getFullYear() === 2026) {
        const monthLabel = monthNames[regDate.getMonth()];
        if (registrationsByMonth[monthLabel] !== void 0) {
          registrationsByMonth[monthLabel]++;
        }
      }
    });
    const registrationChart = Object.entries(registrationsByMonth).map(([month, count]) => ({ month, count }));
    const lowStockItemsCount = (await dbService.getInventory()).filter((i) => i.stockQuantity <= i.minStockLevel).length;
    const labOrdersCount = labOrders.length;
    const financialPerformanceMap = {
      "Jan": { month: "Jan", billed: 0, paid: 0 },
      "Feb": { month: "Feb", billed: 0, paid: 0 },
      "Mar": { month: "Mar", billed: 0, paid: 0 },
      "Apr": { month: "Apr", billed: 0, paid: 0 },
      "May": { month: "May", billed: 0, paid: 0 },
      "Jun": { month: "Jun", billed: 0, paid: 0 },
      "Jul": { month: "Jul", billed: 0, paid: 0 },
      "Aug": { month: "Aug", billed: 0, paid: 0 },
      "Sep": { month: "Sep", billed: 0, paid: 0 },
      "Oct": { month: "Oct", billed: 0, paid: 0 },
      "Nov": { month: "Nov", billed: 0, paid: 0 },
      "Dec": { month: "Dec", billed: 0, paid: 0 }
    };
    invoices.forEach((inv) => {
      const invDate = new Date(inv.createdAt);
      if (invDate.getFullYear() === 2026) {
        const mLabel = monthNames[invDate.getMonth()];
        if (financialPerformanceMap[mLabel]) {
          financialPerformanceMap[mLabel].billed += inv.total;
          financialPerformanceMap[mLabel].paid += inv.paidAmount;
        }
      }
    });
    const financialPerformance = Object.values(financialPerformanceMap);
    const bedOccupancyMap = {
      "General Ward": { ward: "General Ward", occupied: 0, vacant: 0 },
      "Semi-Private": { ward: "Semi-Private", occupied: 0, vacant: 0 },
      "Private": { ward: "Private", occupied: 0, vacant: 0 },
      "ICU": { ward: "ICU", occupied: 0, vacant: 0 }
    };
    beds.forEach((b) => {
      const type = b.type || "General Ward";
      if (bedOccupancyMap[type]) {
        if (b.status === "Occupied") {
          bedOccupancyMap[type].occupied++;
        } else {
          bedOccupancyMap[type].vacant++;
        }
      }
    });
    const bedOccupancy = Object.values(bedOccupancyMap);
    const esiQueueLoadMap = {
      1: { level: "ESI-1", count: 0 },
      2: { level: "ESI-2", count: 0 },
      3: { level: "ESI-3", count: 0 },
      4: { level: "ESI-4", count: 0 },
      5: { level: "ESI-5", count: 0 }
    };
    patients.forEach((p) => {
      if (!p.isArchived && p.triageStatus === "ER Queue") {
        const level = Number(p.esiLevel || 5);
        if (esiQueueLoadMap[level]) {
          esiQueueLoadMap[level].count++;
        }
      }
    });
    const esiQueueLoad = Object.values(esiQueueLoadMap);
    const opdWeeklyAnalytics = departmentRevenue;
    const dailyCollection = invoices.reduce((acc, inv) => {
      const dateStr = inv.createdAt.substring(0, 10);
      acc[dateStr] = (acc[dateStr] || 0) + inv.paidAmount;
      return acc;
    }, {});
    const financialTrendChart = Object.entries(dailyCollection).map(([date, amount]) => ({ date, amount }));
    res.json({
      opdCount,
      ipdActiveCount,
      bedOccupancyRate,
      totalRevenue,
      outstandingBalance,
      departmentRevenue,
      registrationChart,
      lowStockItemsCount,
      expiredItemsCount: 0,
      labOrdersCount,
      financialTrendChart,
      financialPerformance,
      bedOccupancy,
      esiQueueLoad,
      opdWeeklyAnalytics
    });
  } catch (err) {
    res.status(500).json({ message: "Dashboard stats calculation failed", error: err.message });
  }
});

// src/server/api_entry.ts
var JWT_SECRET2 = process.env.JWT_SECRET || "hospital-management-secret-key-2026-secure";
function hashPassword3(password) {
  return crypto8.createHash("sha256").update(password).digest("hex");
}
async function seedDatabaseIfEmpty() {
  if (!db) {
    console.warn("[SEED] Seeding skipped: Firestore client is null.");
    return;
  }
  try {
    const usersSnapshot = await db.collection("users").limit(1).get();
    if (usersSnapshot.empty) {
      const mockUsers = [
        {
          id: "u-admin",
          username: "admin",
          username_lowercase: "admin@hospital.com",
          password_hash: hashPassword3("admin123"),
          name: "Administrator Chief",
          role: "Admin",
          email: "admin@hospital.com",
          department: "Administration"
        },
        {
          id: "u-doc-asif",
          username: "dr_asif",
          username_lowercase: "doctor@hospital.com",
          password_hash: hashPassword3("doctor123"),
          name: "Dr. Muhammad Asif Khan",
          role: "Doctor",
          email: "doctor@hospital.com",
          department: "Cardiology",
          specialization: "Cardiology & Internal Medicine",
          qualification: "MBBS, FCPS (Cardiology)",
          consultation_fee: 2500,
          leaves: []
        },
        {
          id: "u-nurse-bushra",
          username: "nurse_bushra",
          username_lowercase: "nurse@hospital.com",
          password_hash: hashPassword3("nurse123"),
          name: "RN Head Nurse Bushra",
          role: "Nurse",
          email: "nurse@hospital.com",
          department: "IPD - CCU Ward"
        },
        {
          id: "u-lab-kamran",
          username: "lab_kamran",
          username_lowercase: "labtech@hospital.com",
          password_hash: hashPassword3("labtech123"),
          name: "Lab Specialist Kamran",
          role: "Lab Technician",
          email: "labtech@hospital.com",
          department: "Pathology & Radiology"
        },
        {
          id: "u-pharm-tariq",
          username: "pharmacist_tariq",
          username_lowercase: "pharmacist@hospital.com",
          password_hash: hashPassword3("pharmacist123"),
          name: "Chief Pharmacist Tariq",
          role: "Pharmacist",
          email: "pharmacist@hospital.com",
          department: "Pharmacy"
        }
      ];
      for (const u of mockUsers) {
        await db.collection("users").doc(u.id).set(u);
      }
    }
  } catch (e) {
    console.error("[SEED] Error during seeding:", e);
  }
}
var app = express();
app.use((req, res, next) => {
  const originalUrl = req.headers["x-vercel-forwarded-path"] || req.headers["x-matched-path"] || req.url;
  if (originalUrl) {
    req.url = originalUrl;
  }
  if (!req.url.startsWith("/api")) {
    req.url = "/api" + (req.url.startsWith("/") ? "" : "/") + req.url;
  }
  console.log(`[PATH ADJUSTED]: Final mapped request URL inside Express is: ${req.url}`);
  next();
});
app.use((req, res, next) => {
  res.header("Access-Control-Allow-Origin", "*");
  res.header("Access-Control-Allow-Methods", "GET,PUT,POST,DELETE,PATCH,OPTIONS");
  res.header("Access-Control-Allow-Headers", "Content-Type, Authorization");
  if (req.method === "OPTIONS") {
    res.sendStatus(200);
    return;
  }
  next();
});
app.use(express.json({ limit: "20mb" }));
app.use(express.urlencoded({ extended: true, limit: "20mb" }));
app.use("/api/auth", authRouter);
app.use("/api/patients", patientRouter);
app.use("/api/appointments", appointmentRouter);
app.use("/api/encounters", clinicalRouter);
app.use("/api/lab", labRouter);
app.use("/api/pharmacy", pharmacyRouter);
app.use("/api/inpatient", inpatientRouter);
app.use("/api/billing", billingRouter);
app.use("/api/audit", auditRouter);
app.use("/api/settings", settingsRouter);
app.use("/api/doctors", doctorRouter);
app.use("/api/dashboard", dashboardRouter);
app.get("/api/health", (_req, res) => {
  res.json({ status: "ok", timestamp: (/* @__PURE__ */ new Date()).toISOString(), service: "St. Jude HMS API" });
});
try {
  seedDatabaseIfEmpty();
} catch (e) {
  console.error("Failed to trigger database seeding on cold boot:", e);
}
app.use((err, req, res, next) => {
  console.error("[GLOBAL ERROR HANDLER]:", err);
  res.status(500).json({
    message: "Internal Server Error",
    error: err.message || String(err),
    hint: "Please ensure that your Firebase environment variables (FIREBASE_PROJECT_ID, FIREBASE_CLIENT_EMAIL, FIREBASE_PRIVATE_KEY or FIREBASE_SERVICE_ACCOUNT) are configured correctly in the Vercel dashboard."
  });
});
var api_entry_default = app;
export {
  api_entry_default as default
};
/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 *
 * Vercel Serverless Function Entry Point
 * Wraps the Express app for Vercel's serverless runtime.
 * All /api/* requests are routed here by vercel.json rewrites.
 * Trigger: Force Vercel redeploy to apply newly configured environment variables.
 */

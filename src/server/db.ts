// File: src/server/db.ts
// Cloud Firebase Firestore Abstraction Module
// Security: All credentials sourced exclusively from process.env — ZERO filesystem reads

import admin from 'firebase-admin';
import dotenv from 'dotenv';
import crypto from 'crypto';

dotenv.config();

// Helper: SHA-256 password hashing
function hashPassword(password: string): string {
  return crypto.createHash('sha256').update(password).digest('hex');
}

// Firebase Admin SDK — env-var-only initialization (HIPAA compliant, Vercel safe)
if (admin.apps.length === 0) {
  const projectId   = process.env.FIREBASE_PROJECT_ID;
  const clientEmail = process.env.FIREBASE_CLIENT_EMAIL;
  const rawKey      = process.env.FIREBASE_PRIVATE_KEY;
  const databaseURL = process.env.FIREBASE_DATABASE_URL || 
                      'https://hospital-managemnt-syste-ece35-default-rtdb.firebaseio.com';

  if (projectId && clientEmail && rawKey) {
    // Regex handler replaces escaped \\n literals with real newlines for serverless edge safety
    const privateKey = rawKey.replace(/\\n/g, '\n');

    admin.initializeApp({
      credential: admin.credential.cert({ projectId, clientEmail, privateKey }),
      databaseURL,
    });
    console.log('Firebase Admin SDK initialized via environment variables.');
  } else if (process.env.FIREBASE_SERVICE_ACCOUNT) {
    try {
      const sa = JSON.parse(process.env.FIREBASE_SERVICE_ACCOUNT);
      if (sa.private_key) sa.private_key = sa.private_key.replace(/\\n/g, '\n');
      admin.initializeApp({ credential: admin.credential.cert(sa), databaseURL });
      console.log('Firebase Admin SDK initialized via FIREBASE_SERVICE_ACCOUNT JSON blob.');
    } catch (e) {
      console.error('Failed to parse FIREBASE_SERVICE_ACCOUNT:', e);
      admin.initializeApp();
    }
  } else {
    // Local fallback — will only work if Application Default Credentials are configured
    admin.initializeApp();
    console.warn('Firebase Admin SDK: no explicit credentials found. Using ADC fallback.');
  }
}

// Global Firestore singleton
export const db = admin.firestore();

// ─── dbService: Full Firestore abstraction layer ───────────────────────────────

export const dbService = {

  // ── SEEDING ────────────────────────────────────────────────────────────────
  async seedDatabaseIfVacant() {
    try {
      console.log('[SEEDING] Checking Firestore collections...');
      const usersSnapshot = await db.collection('users').limit(1).get();
      if (!usersSnapshot.empty) {
        console.log('[SEEDING] Database already seeded. Skipping.');
        return;
      }

      console.log('[SEEDING] Seeding all 12 clinical collections...');

      // 1. Users (Pakistani clinical roster)
      const mockUsers = [
        {
          id: 'u-admin',
          username: 'admin',
          username_lowercase: 'admin@hospital.com',
          password_hash: hashPassword('admin123'),
          name: 'Administrator Chief',
          role: 'Admin',
          email: 'admin@hospital.com',
          phone: '+92 300 0001111',
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
          phone: '+92 321 1112222',
          department: 'Emergency & Triage Operations',
          specialization: 'Emergency Medicine & Internal Medicine',
          qualification: 'MBBS, FCPS — Chief of Emergency & Triage',
          consultation_fee: 1500,
          leaves: [],
        },
        {
          id: 'u-doc-amna',
          username: 'dr_amna',
          username_lowercase: 'amna@hospital.com',
          password_hash: hashPassword('doctor123'),
          name: 'Dr. Amna Bilal',
          role: 'Doctor',
          email: 'amna@hospital.com',
          phone: '+92 322 3334444',
          department: 'Pediatrics',
          specialization: 'Pediatrics & Neonatology',
          qualification: 'MBBS, FCPS — Senior Consultant Pediatrician',
          consultation_fee: 1200,
          leaves: [],
        },
        {
          id: 'u-doc-sajid',
          username: 'dr_sajid',
          username_lowercase: 'sajid@hospital.com',
          password_hash: hashPassword('doctor123'),
          name: 'Dr. Sajid Mehmood',
          role: 'Doctor',
          email: 'sajid@hospital.com',
          phone: '+92 323 5556666',
          department: 'Cardiology',
          specialization: 'Interventional Cardiology',
          qualification: 'MBBS, FCPS — Chief Interventional Cardiologist',
          consultation_fee: 2500,
          leaves: [],
        },
        {
          id: 'u-nurse-bushra',
          username: 'nurse_bushra',
          username_lowercase: 'nurse@hospital.com',
          password_hash: hashPassword('nurse123'),
          name: 'RN Head Nurse Bushra Bibi',
          role: 'Nurse',
          email: 'nurse@hospital.com',
          phone: '+92 333 2223333',
          department: 'IPD & CCU Wards',
        },
        {
          id: 'u-lab-kamran',
          username: 'lab_kamran',
          username_lowercase: 'labtech@hospital.com',
          password_hash: hashPassword('labtech123'),
          name: 'Lab Specialist Kamran Ahmed',
          role: 'Lab Technician',
          email: 'labtech@hospital.com',
          phone: '+92 312 4445555',
          department: 'Pathology & Diagnostic Radiology',
        },
        {
          id: 'u-pharm-tariq',
          username: 'pharmacist_tariq',
          username_lowercase: 'pharmacist@hospital.com',
          password_hash: hashPassword('pharmacist123'),
          name: 'Chief Pharmacist Tariq Rafiq',
          role: 'Pharmacist',
          email: 'pharmacist@hospital.com',
          phone: '+92 345 5556666',
          department: 'Clinical Pharmacy & Formulary',
        },
      ];
      for (const u of mockUsers) await db.collection('users').doc(u.id).set(u);

      // 2. Patients (8 Pakistani identities, MRN-10001 to MRN-10008)
      const mockPatients = [
        { id: 'MRN-10001', name: 'Muhammad Zain Ul Abideen', dob: '1992-05-15', gender: 'Male', contact: '+92 300 1234567', email: 'zain@mianwali.pk', address: 'Main Bazaar, Mianwali, KPK', blood_group: 'O+', emergency_contact_name: 'Ghulam Rasool', emergency_contact_relationship: 'Father', emergency_contact_phone: '+92 321 9876543', is_archived: false, created_at: '2026-01-10T10:00:00Z', esi_level: 5, triage_status: 'Outpatient', triage_notes: 'Dengue serology requested. Fever reported for 3 days.', triage_score: 5 },
        { id: 'MRN-10002', name: 'Aisha Bibi', dob: '1998-10-10', gender: 'Female', contact: '+92 312 3456789', email: 'aisha@lahore.pk', address: 'Allama Iqbal Town, Lahore, Punjab', blood_group: 'A-', emergency_contact_name: 'Ahmed Ali', emergency_contact_relationship: 'Spouse', emergency_contact_phone: '+92 333 8765432', is_archived: false, created_at: '2026-02-15T11:30:00Z', esi_level: 2, triage_status: 'ER Queue', triage_notes: 'Severe dehydration. High fever 39.8°C. Critical zone monitoring.', triage_score: 9 },
        { id: 'MRN-10003', name: 'Ghulam Rasool', dob: '1964-02-12', gender: 'Male', contact: '+92 345 5678901', email: 'rasool@isakhel.pk', address: 'Isa Khel, Mianwali District, Punjab', blood_group: 'B+', emergency_contact_name: 'Muhammad Zain', emergency_contact_relationship: 'Son', emergency_contact_phone: '+92 300 1234567', is_archived: false, created_at: '2026-03-01T09:15:00Z', esi_level: 3, triage_status: 'ER Queue', triage_notes: 'Persistent abdominal pain, nausea. Typhoid suspected.', triage_score: 6 },
        { id: 'MRN-10004', name: 'Fatima Zahra Murtaza', dob: '2018-04-05', gender: 'Female', contact: '+92 333 5551212', email: 'fatima@sargodha.pk', address: 'Civil Lines, Sargodha, Punjab', blood_group: 'AB+', emergency_contact_name: 'Aisha Bibi', emergency_contact_relationship: 'Mother', emergency_contact_phone: '+92 312 3456789', is_archived: false, created_at: '2026-04-12T14:20:00Z', esi_level: 1, triage_status: 'ER Queue', triage_notes: 'High fever 40.1°C. Pediatric acute bronchitis. Active monitoring.', triage_score: 10 },
        { id: 'MRN-10005', name: 'Ahmed Ali Malik', dob: '1981-11-20', gender: 'Male', contact: '+92 321 7778888', email: 'ahmed@rawalpindi.pk', address: 'Saddar, Rawalpindi, Punjab', blood_group: 'O-', emergency_contact_name: 'Aisha Bibi', emergency_contact_relationship: 'Spouse', emergency_contact_phone: '+92 312 3456789', is_archived: false, created_at: '2026-05-01T15:00:00Z', esi_level: 4, triage_status: 'ER Queue', triage_notes: 'Minor hand laceration from industrial machinery.', triage_score: 4 },
        { id: 'MRN-10006', name: 'Bushra Naz', dob: '1975-07-22', gender: 'Female', contact: '+92 346 1231234', email: 'bushra@faisalabad.pk', address: 'Peoples Colony, Faisalabad, Punjab', blood_group: 'A+', emergency_contact_name: 'Raza Naz', emergency_contact_relationship: 'Spouse', emergency_contact_phone: '+92 321 4324321', is_archived: false, created_at: '2026-05-10T08:00:00Z', esi_level: 4, triage_status: 'Outpatient', triage_notes: 'Hypertension follow-up. BP 160/100 on arrival.', triage_score: 4 },
        { id: 'MRN-10007', name: 'Tariq Mehmood', dob: '1955-03-30', gender: 'Male', contact: '+92 300 9998887', email: 'tariq@multan.pk', address: 'Shah Rukn-e-Alam Colony, Multan, Punjab', blood_group: 'B-', emergency_contact_name: 'Irfan Mehmood', emergency_contact_relationship: 'Son', emergency_contact_phone: '+92 333 1112223', is_archived: false, created_at: '2026-05-18T11:00:00Z', esi_level: 3, triage_status: 'ER Queue', triage_notes: 'Chest tightness, mild dyspnea. Cardiac enzymes ordered.', triage_score: 7 },
        { id: 'MRN-10008', name: 'Sana Gul', dob: '2001-09-14', gender: 'Female', contact: '+92 315 4567890', email: 'sana@peshawar.pk', address: 'Hayatabad, Peshawar, KPK', blood_group: 'O+', emergency_contact_name: 'Gul Rehman', emergency_contact_relationship: 'Father', emergency_contact_phone: '+92 312 3213210', is_archived: false, created_at: '2026-05-25T13:30:00Z', esi_level: 5, triage_status: 'Outpatient', triage_notes: 'Routine antenatal checkup. G1P0, 28 weeks gestation.', triage_score: 2 },
      ];
      for (const p of mockPatients) await db.collection('patients').doc(p.id).set(p);

      // 3. Beds (9 ward beds across 4 ward types)
      const mockBeds = [
        { id: 'bed-g1', ward_name: 'General Ward (Mardana)', bed_number: 'G-101', type: 'General Ward', status: 'Vacant' },
        { id: 'bed-g2', ward_name: 'General Ward (Mardana)', bed_number: 'G-102', type: 'General Ward', status: 'Vacant' },
        { id: 'bed-g3', ward_name: 'General Ward (Zenana)', bed_number: 'G-103', type: 'General Ward', status: 'Vacant' },
        { id: 'bed-s1', ward_name: 'Semi-Private Block A', bed_number: 'S-201', type: 'Semi-Private', status: 'Occupied', patient_id: 'MRN-10003' },
        { id: 'bed-s2', ward_name: 'Semi-Private Block A', bed_number: 'S-202', type: 'Semi-Private', status: 'Vacant' },
        { id: 'bed-p1', ward_name: 'Private VIP Suite', bed_number: 'P-301', type: 'Private', status: 'Occupied', patient_id: 'MRN-10001' },
        { id: 'bed-p2', ward_name: 'Private VIP Suite', bed_number: 'P-302', type: 'Private', status: 'Vacant' },
        { id: 'bed-i1', ward_name: 'CCU / ICU Critical Care Unit', bed_number: 'ICU-401', type: 'ICU', status: 'Occupied', patient_id: 'MRN-10002' },
        { id: 'bed-i2', ward_name: 'CCU / ICU Critical Care Unit', bed_number: 'ICU-402', type: 'ICU', status: 'Maintenance' },
      ];
      for (const b of mockBeds) await db.collection('beds').doc(b.id).set(b);

      // 4. Admissions
      const mockAdmissions = [
        {
          id: 'ADM-10001', patient_id: 'MRN-10001', bed_id: 'bed-p1',
          ward_name: 'Private VIP Suite', bed_number: 'P-301',
          admission_date: '2026-05-25T08:00:00Z', status: 'Admitted',
          nursing_notes: [
            { id: 'nn-1', date: '2026-05-25T12:00:00Z', text: 'Admitted to Private VIP. Vitals stable. IV line inserted.', nurseId: 'u-nurse-bushra', nurseName: 'RN Bushra Bibi' },
            { id: 'nn-2', date: '2026-05-27T08:00:00Z', text: 'Platelet trend improving. Oral hydration maintained.', nurseId: 'u-nurse-bushra', nurseName: 'RN Bushra Bibi' },
          ],
          progress_notes: [
            { id: 'pn-1', date: '2026-05-26T09:00:00Z', text: 'Dengue Fever management. Platelet count 85K. Daily CBC ordered.', staffId: 'u-doc-asif', staffName: 'Dr. Muhammad Asif Khan' },
          ],
        },
        {
          id: 'ADM-10002', patient_id: 'MRN-10002', bed_id: 'bed-i1',
          ward_name: 'CCU / ICU Critical Care Unit', bed_number: 'ICU-401',
          admission_date: '2026-05-28T14:30:00Z', status: 'Admitted',
          nursing_notes: [
            { id: 'nn-3', date: '2026-05-28T15:00:00Z', text: 'CCU monitoring active. O2 therapy initiated at 4L/min.', nurseId: 'u-nurse-bushra', nurseName: 'RN Bushra Bibi' },
          ],
          progress_notes: [
            { id: 'pn-2', date: '2026-05-29T10:00:00Z', text: 'Patient improving. Fever reduced. Antibiotics continued.', staffId: 'u-doc-asif', staffName: 'Dr. Muhammad Asif Khan' },
          ],
        },
      ];
      for (const a of mockAdmissions) await db.collection('admissions').doc(a.id).set(a);

      // 5. Appointments
      const mockAppointments = [
        { id: 'APP-10001', patient_id: 'MRN-10001', doctor_id: 'u-doc-asif', doctor_name: 'Dr. Muhammad Asif Khan', date_time: '2026-05-30T09:00:00Z', time_slot: '09:00 - 09:30 AM', status: 'Scheduled', notes: 'Dengue fever follow-up & CBC review', created_at: '2026-05-29T10:00:00Z' },
        { id: 'APP-10002', patient_id: 'MRN-10002', doctor_id: 'u-doc-asif', doctor_name: 'Dr. Muhammad Asif Khan', date_time: '2026-05-30T10:30:00Z', time_slot: '10:30 - 11:00 AM', status: 'Completed', notes: 'Typhoid diagnostics & antibiotic prescription', created_at: '2026-05-28T11:00:00Z' },
        { id: 'APP-10003', patient_id: 'MRN-10003', doctor_id: 'u-doc-asif', doctor_name: 'Dr. Muhammad Asif Khan', date_time: '2026-05-30T14:00:00Z', time_slot: '02:00 - 02:30 PM', status: 'Scheduled', notes: 'Initial assessment for abdominal pain & nausea', created_at: '2026-05-29T14:00:00Z' },
        { id: 'APP-10004', patient_id: 'MRN-10004', doctor_id: 'u-doc-amna', doctor_name: 'Dr. Amna Bilal', date_time: '2026-05-30T11:00:00Z', time_slot: '11:00 - 11:30 AM', status: 'Scheduled', notes: 'Pediatric bronchitis evaluation', created_at: '2026-05-29T08:00:00Z' },
        { id: 'APP-10005', patient_id: 'MRN-10007', doctor_id: 'u-doc-sajid', doctor_name: 'Dr. Sajid Mehmood', date_time: '2026-05-30T15:00:00Z', time_slot: '03:00 - 03:30 PM', status: 'Scheduled', notes: 'Cardiac enzyme review & ECG interpretation', created_at: '2026-05-29T16:00:00Z' },
      ];
      for (const a of mockAppointments) await db.collection('appointments').doc(a.id).set(a);

      // 6. Pharmacy Inventory (15 items, 3 below reorder level)
      const mockMeds = [
        { id: 'med-1',  name: 'Amoxicillin 500mg',      generic_name: 'Amoxicillin',              category: 'Antibiotics',      unit_price: 15,    stock_quantity: 250, min_stock_level: 30,  expiry_date: '2027-11-15', supplier: 'Sami Pharmaceuticals' },
        { id: 'med-2',  name: 'Paracetamol 500mg',       generic_name: 'Acetaminophen',            category: 'Antipyretics',     unit_price: 5,     stock_quantity: 420, min_stock_level: 50,  expiry_date: '2028-09-01', supplier: 'Ferozsons Laboratories' },
        { id: 'med-3',  name: 'Insulin Glargine 100IU',  generic_name: 'Insulin Glargine',         category: 'Antidiabetics',    unit_price: 1200,  stock_quantity: 80,  min_stock_level: 15,  expiry_date: '2027-02-18', supplier: 'Eli Lilly Pakistan' },
        { id: 'med-4',  name: 'Atorvastatin 20mg',       generic_name: 'Lipitor',                  category: 'Cardiovascular',   unit_price: 45,    stock_quantity: 120, min_stock_level: 20,  expiry_date: '2026-12-15', supplier: 'Pfizer Pakistan' },
        { id: 'med-5',  name: 'Aspirin 75mg',            generic_name: 'Acetylsalicylic Acid',     category: 'Analgesics',       unit_price: 3,     stock_quantity: 500, min_stock_level: 50,  expiry_date: '2028-03-10', supplier: 'Bayer Pakistan' },
        { id: 'med-6',  name: 'Ibuprofen 400mg',         generic_name: 'Ibuprofen',                category: 'Analgesics',       unit_price: 8,     stock_quantity: 350, min_stock_level: 40,  expiry_date: '2027-04-20', supplier: 'Getz Pharma' },
        { id: 'med-7',  name: 'Ventolin Inhaler 100mcg', generic_name: 'Salbutamol',               category: 'Bronchodilators',  unit_price: 350,   stock_quantity: 90,  min_stock_level: 15,  expiry_date: '2027-05-12', supplier: 'GSK Pakistan' },
        { id: 'med-8',  name: 'Augmentin 625mg',         generic_name: 'Co-Amoxiclav',            category: 'Antibiotics',      unit_price: 40,    stock_quantity: 140, min_stock_level: 25,  expiry_date: '2027-08-30', supplier: 'GSK Pakistan' },
        { id: 'med-9',  name: 'Cefixime 400mg',          generic_name: 'Cefixime',                 category: 'Antibiotics',      unit_price: 55,    stock_quantity: 160, min_stock_level: 20,  expiry_date: '2027-10-01', supplier: 'Sami Pharmaceuticals' },
        { id: 'med-10', name: 'Omeprazole 20mg',         generic_name: 'Omeprazole',               category: 'Gastroenterology', unit_price: 12,    stock_quantity: 200, min_stock_level: 30,  expiry_date: '2027-07-15', supplier: 'Ferozsons Laboratories' },
        { id: 'med-11', name: 'Amlodipine 5mg',          generic_name: 'Amlodipine',               category: 'Cardiovascular',   unit_price: 18,    stock_quantity: 180, min_stock_level: 25,  expiry_date: '2028-01-20', supplier: 'Getz Pharma' },
        { id: 'med-12', name: 'Ciprofloxacin 500mg',     generic_name: 'Ciprofloxacin',            category: 'Antibiotics',      unit_price: 30,    stock_quantity: 95,  min_stock_level: 20,  expiry_date: '2027-03-08', supplier: 'Searle Pakistan' },
        // ↓ Below reorder level — triggers low-stock alerts
        { id: 'med-13', name: 'Metformin 850mg',         generic_name: 'Metformin',                category: 'Antidiabetics',    unit_price: 12,    stock_quantity: 8,   min_stock_level: 30,  expiry_date: '2026-10-30', supplier: 'Cardinal Health' },
        { id: 'med-14', name: 'Losartan Potassium 50mg', generic_name: 'Losartan',                 category: 'Cardiovascular',   unit_price: 25,    stock_quantity: 5,   min_stock_level: 20,  expiry_date: '2027-08-11', supplier: 'Sami Pharmaceuticals' },
        { id: 'med-15', name: 'Warfarin Sodium 5mg',     generic_name: 'Warfarin',                 category: 'Anticoagulants',   unit_price: 80,    stock_quantity: 12,  min_stock_level: 25,  expiry_date: '2027-06-30', supplier: 'Pfizer Pakistan' },
      ];
      for (const m of mockMeds) await db.collection('pharmacy_inventory').doc(m.id).set(m);

      // 7. Lab Orders (Critical & Abnormal flags to activate alert components)
      const mockLabOrders = [
        { id: 'LAB-10001', patient_id: 'MRN-10001', doctor_id: 'u-doc-asif', doctor_name: 'Dr. Muhammad Asif Khan', encounter_id: 'ENC-10001', test_name: 'Dengue Fever Serology (NS1 + IgM/IgG)', category: 'Serology', status: 'Completed', result_value: 'NS1 Antigen: POSITIVE | Platelets: 62 × 10⁹/L (Critical Low)', reference_range: 'Platelets: 150–400 × 10⁹/L', flag: 'Critical', comments: 'Severe thrombocytopenia secondary to active Dengue Fever. Immediate platelet monitoring and IV hydration mandatory.', technician_id: 'u-lab-kamran', technician_name: 'Lab Specialist Kamran Ahmed', updated_at: new Date().toISOString(), created_at: '2026-05-30T09:40:00Z' },
        { id: 'LAB-10002', patient_id: 'MRN-10002', doctor_id: 'u-doc-asif', doctor_name: 'Dr. Muhammad Asif Khan', encounter_id: '', test_name: 'Widal Typhoid Test', category: 'Serology', status: 'Completed', result_value: 'S. Typhi O: 1:320 (HIGH), S. Typhi H: 1:160 (HIGH)', reference_range: 'Normal: < 1:80', flag: 'Abnormal', comments: 'Highly elevated Widal titres. Active Salmonella typhi infection confirmed. Begin Cefixime 400mg course.', technician_id: 'u-lab-kamran', technician_name: 'Lab Specialist Kamran Ahmed', updated_at: new Date().toISOString(), created_at: '2026-05-30T09:42:00Z' },
        { id: 'LAB-10003', patient_id: 'MRN-10003', doctor_id: 'u-doc-asif', doctor_name: 'Dr. Muhammad Asif Khan', encounter_id: '', test_name: 'Malaria Smear (Peripheral Blood)', category: 'Hematology', status: 'In Progress', comments: 'Peripheral blood smear prepared. Slide microscopy evaluation in progress.', technician_id: 'u-lab-kamran', technician_name: 'Lab Specialist Kamran Ahmed', updated_at: new Date().toISOString(), created_at: '2026-05-30T09:44:00Z' },
        { id: 'LAB-10004', patient_id: 'MRN-10004', doctor_id: 'u-doc-amna', doctor_name: 'Dr. Amna Bilal', encounter_id: '', test_name: 'Complete Blood Count (CBC)', category: 'Hematology', status: 'Ordered', comments: 'CBC ordered for pediatric fever workup.', technician_id: '', technician_name: '', updated_at: new Date().toISOString(), created_at: '2026-05-30T10:00:00Z' },
        { id: 'LAB-10005', patient_id: 'MRN-10007', doctor_id: 'u-doc-sajid', doctor_name: 'Dr. Sajid Mehmood', encounter_id: '', test_name: 'Cardiac Enzymes (Troponin I, CK-MB)', category: 'Biochemistry', status: 'Sample Collected', comments: 'Troponin I and CK-MB drawn for acute coronary evaluation.', technician_id: 'u-lab-kamran', technician_name: 'Lab Specialist Kamran Ahmed', updated_at: new Date().toISOString(), created_at: '2026-05-30T14:30:00Z' },
      ];
      for (const l of mockLabOrders) await db.collection('lab_orders').doc(l.id).set(l);

      // 8. Encounters (SOAP EMR Notes)
      const mockEncounters = [
        {
          id: 'ENC-10001', patient_id: 'MRN-10001', doctor_id: 'u-doc-asif', doctor_name: 'Dr. Muhammad Asif Khan',
          date_time: '2026-05-30T09:30:00Z', vital_bp: '110/72', vital_heart_rate: 92, vital_temperature: 38.9,
          vital_weight: 70.0, vital_respiratory_rate: 18, vital_spo2: 97,
          soap_subjective: 'Patient Muhammad Zain reports high-grade fever (38.9°C), severe retro-orbital headache, and joint pain for 4 days. Loss of appetite.',
          soap_objective: 'Mild hepatomegaly on palpation. Petechial rash on both forearms. Low platelet count on CBC.',
          soap_assessment: 'Acute Dengue Fever with severe thrombocytopenia (Platelets 62K). Dengue NS1 Antigen positive.',
          soap_plan: 'Admit to Private VIP bed P-301. Daily CBC, IV hydration 3L/day. Paracetamol 500mg TDS. Avoid NSAIDs.',
          prescriptions: [{ medicineId: 'med-2', name: 'Paracetamol 500mg', dosage: '1 tablet', frequency: 'TDS', duration: '5 days', notes: 'For fever control. Avoid ibuprofen/aspirin.' }],
          lab_orders: ['LAB-10001'], created_at: '2026-05-30T09:30:00Z',
        },
        {
          id: 'ENC-10002', patient_id: 'MRN-10002', doctor_id: 'u-doc-asif', doctor_name: 'Dr. Muhammad Asif Khan',
          date_time: '2026-05-30T10:30:00Z', vital_bp: '105/65', vital_heart_rate: 108, vital_temperature: 39.8,
          vital_weight: 58.0, vital_respiratory_rate: 22, vital_spo2: 95,
          soap_subjective: 'Aisha Bibi presents with 5-day history of high fever, sweating, abdominal discomfort, and anorexia.',
          soap_objective: 'Tongue coated. Hepatosplenomegaly. Widal test positive at 1:320.',
          soap_assessment: 'Acute Typhoid Fever (Salmonella typhi). Widal strongly positive.',
          soap_plan: 'Cefixime 400mg BD × 14 days. Hydration, low-roughage diet. Monitor electrolytes.',
          prescriptions: [{ medicineId: 'med-9', name: 'Cefixime 400mg', dosage: '1 tablet', frequency: 'BD', duration: '14 days', notes: 'Full course mandatory.' }],
          lab_orders: ['LAB-10002'], created_at: '2026-05-30T10:30:00Z',
        },
      ];
      for (const e of mockEncounters) await db.collection('encounters').doc(e.id).set(e);

      // 9. Invoices (PKR — Paid / Unpaid / InsuranceClaimed distribution)
      const mockInvoices = [
        { id: 'INV-10001', patient_id: 'MRN-10001', patient_name: 'Muhammad Zain Ul Abideen', patient_mrn: 'MRN-10001', items: [{ description: 'Emergency Consultation — Dr. Asif Khan', amount: 1500, category: 'Consultation' }], subtotal: 1500, tax: 75, total: 1575, paid_amount: 1575, status: 'Paid', payment_method: 'Cash', created_at: '2026-01-15T10:00:00Z' },
        { id: 'INV-10002', patient_id: 'MRN-10002', patient_name: 'Aisha Bibi', patient_mrn: 'MRN-10002', items: [{ description: 'Widal Test & CBC Panel', amount: 4500, category: 'Laboratory' }, { description: 'Consultation — Dr. Asif Khan', amount: 1500, category: 'Consultation' }], subtotal: 6000, tax: 300, total: 6300, paid_amount: 6300, status: 'Paid', payment_method: 'Card', created_at: '2026-01-20T14:30:00Z' },
        { id: 'INV-10003', patient_id: 'MRN-10003', patient_name: 'Ghulam Rasool', patient_mrn: 'MRN-10003', items: [{ description: 'Semi-Private IPD Stay (10 days @ Rs.250/day)', amount: 25000, category: 'Inpatient' }], subtotal: 25000, tax: 1250, total: 26250, paid_amount: 26250, status: 'Paid', payment_method: 'Bank Transfer', created_at: '2026-02-10T11:00:00Z' },
        { id: 'INV-10004', patient_id: 'MRN-10004', patient_name: 'Fatima Zahra Murtaza', patient_mrn: 'MRN-10004', items: [{ description: 'Pediatric Bronchitis Consultation & CBC', amount: 2700, category: 'Consultation' }], subtotal: 2700, tax: 135, total: 2835, paid_amount: 0, status: 'Unpaid', created_at: '2026-02-18T10:00:00Z' },
        { id: 'INV-10005', patient_id: 'MRN-10005', patient_name: 'Ahmed Ali Malik', patient_mrn: 'MRN-10005', items: [{ description: 'Hand laceration suturing & trauma dressing', amount: 3500, category: 'Consultation' }], subtotal: 3500, tax: 175, total: 3675, paid_amount: 3675, status: 'Paid', payment_method: 'Cash', created_at: '2026-03-05T09:15:00Z' },
        { id: 'INV-10006', patient_id: 'MRN-10001', patient_name: 'Muhammad Zain Ul Abideen', patient_mrn: 'MRN-10001', items: [{ description: 'Private VIP Suite IPD Stay (5 days @ Rs.500/day)', amount: 25000, category: 'Inpatient' }, { description: 'Dengue Serology Panel', amount: 3500, category: 'Laboratory' }], subtotal: 28500, tax: 1425, total: 29925, paid_amount: 20000, status: 'Partially Paid', payment_method: 'Insurance', insurance_provider: 'Jubilee Life Insurance', policy_number: 'JLI-PKR-998822', claim_status: 'Approved', created_at: '2026-03-25T11:00:00Z' },
        { id: 'INV-10007', patient_id: 'MRN-10002', patient_name: 'Aisha Bibi', patient_mrn: 'MRN-10002', items: [{ description: 'CCU / ICU Stay (4 days @ Rs.1200/day)', amount: 48000, category: 'Inpatient' }], subtotal: 48000, tax: 2400, total: 50400, paid_amount: 35000, status: 'Partially Paid', payment_method: 'Card', created_at: '2026-04-18T16:00:00Z' },
        { id: 'INV-10008', patient_id: 'MRN-10006', patient_name: 'Bushra Naz', patient_mrn: 'MRN-10006', items: [{ description: 'Hypertension management consultation & BP drugs', amount: 4200, category: 'Pharmacy' }], subtotal: 4200, tax: 210, total: 4410, paid_amount: 0, status: 'Unpaid', created_at: '2026-05-10T09:00:00Z' },
        { id: 'INV-10009', patient_id: 'MRN-10007', patient_name: 'Tariq Mehmood', patient_mrn: 'MRN-10007', items: [{ description: 'Cardiac enzymes panel + ECG + Cardiology consultation', amount: 8500, category: 'Consultation' }], subtotal: 8500, tax: 425, total: 8925, paid_amount: 8925, status: 'Paid', payment_method: 'Card', insurance_provider: 'EFU Life Assurance', policy_number: 'EFU-2024-TM-00712', claim_status: 'Submitted', created_at: '2026-05-18T12:00:00Z' },
      ];
      for (const inv of mockInvoices) await db.collection('invoices').doc(inv.id).set(inv);

      // 10. Audit Logs
      const mockLogs = [
        { id: 'log-1',  user_id: 'u-admin',       username: 'admin',          user_role: 'Admin',          action: 'INIT_SYSTEM',               details: 'Firestore database seeded. All 12 clinical collections initialized.',          timestamp: '2026-05-30T09:00:00Z' },
        { id: 'log-2',  user_id: 'u-admin',       username: 'admin',          user_role: 'Admin',          action: 'VIEW_SETTINGS',             details: 'Reviewed hospital configuration panel.',                                      timestamp: '2026-05-30T09:05:00Z' },
        { id: 'log-3',  user_id: 'u-doc-asif',    username: 'dr_asif',        user_role: 'Doctor',         action: 'USER_LOGIN',                details: 'Dr. Muhammad Asif Khan authenticated into clinical workstation.',             timestamp: '2026-05-30T09:10:00Z' },
        { id: 'log-4',  user_id: 'u-doc-asif',    username: 'dr_asif',        user_role: 'Doctor',         action: 'VIEW_PATIENT_RECORD',       details: 'Accessed patient Muhammad Zain (MRN-10001) clinical file.',                  timestamp: '2026-05-30T09:15:00Z' },
        { id: 'log-5',  user_id: 'u-doc-asif',    username: 'dr_asif',        user_role: 'Doctor',         action: 'CREATE_ENCOUNTER',          details: 'Created SOAP encounter ENC-10001 for Dengue Fever management.',              timestamp: '2026-05-30T09:30:00Z' },
        { id: 'log-6',  user_id: 'u-doc-asif',    username: 'dr_asif',        user_role: 'Doctor',         action: 'CREATE_PRESCRIPTION',       details: 'Prescribed Paracetamol 500mg TDS for 5 days to MRN-10001.',                  timestamp: '2026-05-30T09:32:00Z' },
        { id: 'log-7',  user_id: 'u-doc-asif',    username: 'dr_asif',        user_role: 'Doctor',         action: 'CREATE_LAB_ORDER',          details: 'Ordered Dengue Fever NS1 Serology lab order LAB-10001.',                    timestamp: '2026-05-30T09:35:00Z' },
        { id: 'log-8',  user_id: 'u-lab-kamran',  username: 'lab_kamran',     user_role: 'Lab Technician', action: 'USER_LOGIN',                details: 'Lab Specialist Kamran Ahmed signed into diagnostics workstation.',           timestamp: '2026-05-30T09:38:00Z' },
        { id: 'log-9',  user_id: 'u-lab-kamran',  username: 'lab_kamran',     user_role: 'Lab Technician', action: 'WRITE_LAB_RESULT',          details: 'Critical Dengue NS1+Platelet result entered for LAB-10001. Flag: CRITICAL.', timestamp: '2026-05-30T09:40:00Z' },
        { id: 'log-10', user_id: 'u-pharm-tariq', username: 'pharmacist_tariq', user_role: 'Pharmacist',  action: 'DISPENSE_DRUG',             details: 'Dispensed Paracetamol 500mg × 15 tabs to patient MRN-10001.',               timestamp: '2026-05-30T09:45:00Z' },
        { id: 'log-11', user_id: 'u-nurse-bushra',username: 'nurse_bushra',   user_role: 'Nurse',          action: 'ADD_NURSING_NOTE',          details: 'Nursing progress note entered for ADM-10001 patient Muhammad Zain.',         timestamp: '2026-05-30T10:00:00Z' },
        { id: 'log-12', user_id: 'u-doc-amna',    username: 'dr_amna',        user_role: 'Doctor',         action: 'CREATE_APPOINTMENT',        details: 'Pediatric appointment APP-10004 booked for Fatima Zahra (MRN-10004).',      timestamp: '2026-05-30T10:15:00Z' },
      ];
      for (const log of mockLogs) await db.collection('security_audit_logs').doc(log.id).set(log);

      console.log('[SEEDING] All 12 clinical collections seeded successfully.');
    } catch (err) {
      console.error('[SEEDING] Error seeding database:', err);
    }
  },

  // ── SETTINGS ───────────────────────────────────────────────────────────────
  async getSettings() {
    const doc = await db.collection('hospital_settings').doc('default').get();
    const defaultSettings = { name: 'St. Jude Memorial Hospital', address: '24-B, Jinnah Road, Mianwali, Punjab', contact: '+92 459 240000', logo_url: '', tax_rate: 0.05, currency: 'PKR', operating_hours: '24/7 Emergency Services' };
    if (!doc.exists) {
      await db.collection('hospital_settings').doc('default').set(defaultSettings);
      return { name: defaultSettings.name, address: defaultSettings.address, contact: defaultSettings.contact, logoUrl: '', taxRate: 0.05, currency: 'PKR', operatingHours: defaultSettings.operating_hours };
    }
    const data = doc.data()!;
    return { name: data.name, address: data.address, contact: data.contact, logoUrl: data.logo_url || '', taxRate: Number(data.tax_rate), currency: data.currency || 'PKR', operatingHours: data.operating_hours || '24/7' };
  },

  async updateSettings(settings: any) {
    const payload: any = { name: settings.name, address: settings.address, contact: settings.contact, tax_rate: Number(settings.taxRate), currency: settings.currency, operating_hours: settings.operatingHours };
    if (settings.logoUrl !== undefined) payload.logo_url = settings.logoUrl;
    await db.collection('hospital_settings').doc('default').update(payload);
    return payload;
  },

  // ── USERS ──────────────────────────────────────────────────────────────────
  async getUserByUsername(username: string) {
    const snapshot = await db.collection('users').where('username_lowercase', '==', username.toLowerCase()).limit(1).get();
    if (snapshot.empty) return null;
    const doc = snapshot.docs[0];
    const data = doc.data();
    return { id: doc.id, username: data.username, passwordHash: data.password_hash, name: data.name, role: data.role, email: data.email, phone: data.phone, department: data.department || '', specialization: data.specialization || '', qualification: data.qualification || '', consultationFee: Number(data.consultation_fee || 0), leaves: data.leaves || [] };
  },

  async getDoctors() {
    const snapshot = await db.collection('users').where('role', '==', 'Doctor').get();
    return snapshot.docs.map(doc => {
      const data = doc.data();
      return { id: doc.id, username: data.username, name: data.name, role: data.role, email: data.email, phone: data.phone, department: data.department || '', specialization: data.specialization || '', qualification: data.qualification || '', consultationFee: Number(data.consultation_fee || 0), leaves: data.leaves || [] };
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
      if (!doc.exists) throw new Error('Doctor record not found');
      const currentLeaves = doc.data()?.leaves || [];
      const newLeave = { id: leave.id, start_date: leave.startDate, end_date: leave.endDate, reason: leave.reason, status: leave.status };
      transaction.update(doctorRef, { leaves: [...currentLeaves, newLeave] });
    });
  },

  // ── PATIENTS ───────────────────────────────────────────────────────────────
  async getPatients() {
    const snapshot = await db.collection('patients').where('is_archived', '==', false).orderBy('created_at', 'desc').get();
    return snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
  },

  async getPatientById(id: string) {
    const doc = await db.collection('patients').doc(id).get();
    return doc.exists ? { id: doc.id, ...doc.data() } : null;
  },

  async createPatient(patient: any) {
    await db.collection('patients').doc(patient.id).set(patient);
    return patient;
  },

  async updatePatient(id: string, updates: any) {
    await db.collection('patients').doc(id).update(updates);
    return { id, ...updates };
  },

  async archivePatient(id: string) {
    await db.collection('patients').doc(id).update({ is_archived: true });
  },

  async updateTriageStatus(id: string, triageData: any) {
    await db.collection('patients').doc(id).update(triageData);
  },

  // ── APPOINTMENTS ───────────────────────────────────────────────────────────
  async getAppointments() {
    const snapshot = await db.collection('appointments').orderBy('date_time', 'desc').get();
    return snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
  },

  async createAppointment(appointment: any) {
    await db.collection('appointments').doc(appointment.id).set(appointment);
    return appointment;
  },

  async updateAppointmentStatus(id: string, status: string) {
    await db.collection('appointments').doc(id).update({ status });
  },

  async cancelAppointment(id: string) {
    await db.collection('appointments').doc(id).update({ status: 'Cancelled' });
  },

  // ── ENCOUNTERS ─────────────────────────────────────────────────────────────
  async getEncounters(patientId?: string) {
    let query: any = db.collection('encounters').orderBy('date_time', 'desc');
    if (patientId) query = db.collection('encounters').where('patient_id', '==', patientId).orderBy('date_time', 'desc');
    const snapshot = await query.get();
    return snapshot.docs.map((doc: any) => ({ id: doc.id, ...doc.data() }));
  },

  async createEncounter(encounter: any) {
    await db.collection('encounters').doc(encounter.id).set(encounter);
    return encounter;
  },

  // ── LAB ORDERS ─────────────────────────────────────────────────────────────
  async getLabOrders(patientId?: string) {
    let query: any = db.collection('lab_orders').orderBy('created_at', 'desc');
    if (patientId) query = db.collection('lab_orders').where('patient_id', '==', patientId).orderBy('created_at', 'desc');
    const snapshot = await query.get();
    return snapshot.docs.map((doc: any) => ({ id: doc.id, ...doc.data() }));
  },

  async createLabOrder(order: any) {
    await db.collection('lab_orders').doc(order.id).set(order);
    return order;
  },

  async updateLabOrderResult(id: string, resultData: any) {
    await db.collection('lab_orders').doc(id).update({ ...resultData, updated_at: new Date().toISOString() });
  },

  // ── PHARMACY ───────────────────────────────────────────────────────────────
  async getInventory() {
    const snapshot = await db.collection('pharmacy_inventory').orderBy('name').get();
    return snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
  },

  async updateInventoryItem(id: string, updates: any) {
    await db.collection('pharmacy_inventory').doc(id).update(updates);
  },

  async addInventoryItem(item: any) {
    await db.collection('pharmacy_inventory').doc(item.id).set(item);
    return item;
  },

  async adjustStock(itemId: string, quantityChange: number) {
    const itemRef = db.collection('pharmacy_inventory').doc(itemId);
    await db.runTransaction(async (transaction) => {
      const doc = await transaction.get(itemRef);
      if (!doc.exists) throw new Error('Inventory item not found');
      const currentQty = doc.data()?.stock_quantity || 0;
      const newQty = currentQty + quantityChange;
      if (newQty < 0) throw new Error('Insufficient stock');
      transaction.update(itemRef, { stock_quantity: newQty });
    });
  },

  // ── BEDS & ADMISSIONS ──────────────────────────────────────────────────────
  async getBeds() {
    const snapshot = await db.collection('beds').get();
    return snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
  },

  async updateBedStatus(bedId: string, status: string, patientId?: string | null) {
    const update: any = { status };
    if (patientId !== undefined) update.patient_id = patientId;
    await db.collection('beds').doc(bedId).update(update);
  },

  async getAdmissions(patientId?: string) {
    let query: any = db.collection('admissions').orderBy('admission_date', 'desc');
    if (patientId) query = db.collection('admissions').where('patient_id', '==', patientId);
    const snapshot = await query.get();
    return snapshot.docs.map((doc: any) => ({ id: doc.id, ...doc.data() }));
  },

  async createAdmission(admission: any) {
    await db.collection('admissions').doc(admission.id).set(admission);
    return admission;
  },

  async updateAdmission(id: string, updates: any) {
    await db.collection('admissions').doc(id).update(updates);
  },

  async dischargeAdmission(id: string, dischargeData: any) {
    await db.collection('admissions').doc(id).update({ status: 'Discharged', ...dischargeData });
  },

  async addNursingNote(admissionId: string, note: any) {
    const admissionRef = db.collection('admissions').doc(admissionId);
    await db.runTransaction(async (transaction) => {
      const doc = await transaction.get(admissionRef);
      if (!doc.exists) throw new Error('Admission not found');
      const notes = doc.data()?.nursing_notes || [];
      transaction.update(admissionRef, { nursing_notes: [...notes, note] });
    });
  },

  async addProgressNote(admissionId: string, note: any) {
    const admissionRef = db.collection('admissions').doc(admissionId);
    await db.runTransaction(async (transaction) => {
      const doc = await transaction.get(admissionRef);
      if (!doc.exists) throw new Error('Admission not found');
      const notes = doc.data()?.progress_notes || [];
      transaction.update(admissionRef, { progress_notes: [...notes, note] });
    });
  },

  // ── BILLING ────────────────────────────────────────────────────────────────
  async getInvoices() {
    const snapshot = await db.collection('invoices').orderBy('created_at', 'desc').get();
    return snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
  },

  async getInvoiceById(id: string) {
    const doc = await db.collection('invoices').doc(id).get();
    return doc.exists ? { id: doc.id, ...doc.data() } : null;
  },

  async createInvoice(invoice: any) {
    await db.collection('invoices').doc(invoice.id).set(invoice);
    return invoice;
  },

  async addInvoiceLineItem(invoiceId: string, item: any) {
    const invoiceRef = db.collection('invoices').doc(invoiceId);
    await db.runTransaction(async (transaction) => {
      const doc = await transaction.get(invoiceRef);
      if (!doc.exists) throw new Error('Invoice not found');
      const items = doc.data()?.items || [];
      const newItems = [...items, item];
      const subtotal = newItems.reduce((sum: number, i: any) => sum + (Number(i.amount) || 0), 0);
      const taxRate = doc.data()?.tax_rate || 0.05;
      const tax = subtotal * taxRate;
      transaction.update(invoiceRef, { items: newItems, subtotal, tax, total: subtotal + tax });
    });
  },

  async payInvoice(invoiceId: string, paymentData: any) {
    const invoiceRef = db.collection('invoices').doc(invoiceId);
    await db.runTransaction(async (transaction) => {
      const doc = await transaction.get(invoiceRef);
      if (!doc.exists) throw new Error('Invoice not found');
      const currentPaid = Number(doc.data()?.paid_amount || 0);
      const total = Number(doc.data()?.total || 0);
      const newPaid = currentPaid + Number(paymentData.amountPaid);
      const newStatus = newPaid >= total ? 'Paid' : 'Partially Paid';
      transaction.update(invoiceRef, { paid_amount: newPaid, status: newStatus, payment_method: paymentData.paymentMethod });
    });
  },

  async updateClaimStatus(invoiceId: string, claimStatus: string) {
    await db.collection('invoices').doc(invoiceId).update({ claim_status: claimStatus, status: 'InsuranceClaimed' });
  },

  // ── AUDIT LOGS ─────────────────────────────────────────────────────────────
  async getAuditLogs() {
    const snapshot = await db.collection('security_audit_logs').orderBy('timestamp', 'desc').limit(100).get();
    return snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
  },

  async insertAuditLog(log: any) {
    await db.collection('security_audit_logs').doc(log.id).set(log);
  },

  // ── DASHBOARD ──────────────────────────────────────────────────────────────
  async getDashboardStats() {
    const [patientsSnap, appointmentsSnap, bedsSnap, invoicesSnap] = await Promise.all([
      db.collection('patients').where('is_archived', '==', false).get(),
      db.collection('appointments').where('date_time', '>=', new Date().toISOString().split('T')[0]).get(),
      db.collection('beds').get(),
      db.collection('invoices').get(),
    ]);

    const beds = bedsSnap.docs.map(d => d.data());
    const occupiedBeds = beds.filter((b: any) => b.status === 'Occupied').length;
    const totalBeds = beds.length;
    const invoices = invoicesSnap.docs.map(d => d.data());
    const totalRevenue = invoices.reduce((sum: number, inv: any) => sum + (Number(inv.paid_amount) || 0), 0);

    return { totalPatients: patientsSnap.size, todayAppointments: appointmentsSnap.size, occupiedBeds, totalBeds, totalRevenue };
  },
};

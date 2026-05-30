/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { 
  User, 
  Patient, 
  Appointment, 
  Encounter, 
  LabOrder, 
  InventoryItem, 
  Bed, 
  InpatientAdmission, 
  Invoice, 
  AuditLog, 
  HospitalSettings 
} from '../types';

// ===========================================================================
// PAKISTANI CLINICAL SEED DATA — Global Fallback Hydration Matrix
// ===========================================================================
const SEED_PATIENTS: Patient[] = [
  {
    id: 'MRN-2026-0001', name: 'Zainab Bibi', dob: '1985-03-12', gender: 'Female',
    contact: '0301-7654321', email: 'zainab.bibi@gmail.com',
    address: 'Mohalla Hussainabad, Mianwali, Punjab',
    bloodGroup: 'B+',
    emergencyContact: { name: 'Muhammad Ishaq', relationship: 'Husband', phone: '0301-7654320' },
    isArchived: false, createdAt: '2026-01-15T08:30:00Z'
  },
  {
    id: 'MRN-2026-0002', name: 'Muhammad Rizwan', dob: '1990-07-22', gender: 'Male',
    contact: '0312-8899001', email: 'rizwan.m@hotmail.com',
    address: 'Street 4, Islam Nagar, Isa Khel, Mianwali',
    bloodGroup: 'O+',
    emergencyContact: { name: 'Nasreen Akhtar', relationship: 'Mother', phone: '0312-8899002' },
    isArchived: false, createdAt: '2026-01-20T09:15:00Z'
  },
  {
    id: 'MRN-2026-0003', name: 'Kamran Wali', dob: '1978-11-05', gender: 'Male',
    contact: '0333-4567890', email: 'kamranwali@yahoo.com',
    address: 'Satellite Town, Block C, Sargodha',
    bloodGroup: 'A+',
    emergencyContact: { name: 'Saima Kamran', relationship: 'Wife', phone: '0333-4567891' },
    isArchived: false, createdAt: '2026-02-03T10:00:00Z'
  },
  {
    id: 'MRN-2026-0004', name: 'Asma Shah', dob: '1995-05-18', gender: 'Female',
    contact: '0345-1122334', email: 'asmashah95@gmail.com',
    address: 'Gulberg III, Street 22, Lahore',
    bloodGroup: 'AB+',
    emergencyContact: { name: 'Tariq Shah', relationship: 'Father', phone: '0345-1122335' },
    isArchived: false, createdAt: '2026-02-10T11:30:00Z'
  },
  {
    id: 'MRN-2026-0005', name: 'Fatima Noor', dob: '2015-09-30', gender: 'Female',
    contact: '0321-5566778', email: 'fatima.noor.parent@gmail.com',
    address: 'Mohallah Chak 42, Bhakkar',
    bloodGroup: 'O-',
    emergencyContact: { name: 'Abdul Noor', relationship: 'Father', phone: '0321-5566779' },
    isArchived: false, createdAt: '2026-02-18T08:00:00Z'
  },
  {
    id: 'MRN-2026-0006', name: 'Shahid Mehmood', dob: '1965-12-01', gender: 'Male',
    contact: '0311-9988776', email: 'shahidm65@gmail.com',
    address: 'Old City, Near Shahi Mosque, Multan',
    bloodGroup: 'B-',
    emergencyContact: { name: 'Rukhsana Shahid', relationship: 'Wife', phone: '0311-9988775' },
    isArchived: false, createdAt: '2026-03-05T09:45:00Z'
  },
  {
    id: 'MRN-2026-0007', name: 'Nadia Parveen', dob: '1988-04-14', gender: 'Female',
    contact: '0300-2345678', email: 'nadia.parveen@outlook.com',
    address: 'Phase 6, DHA, Islamabad',
    bloodGroup: 'A-',
    emergencyContact: { name: 'Asad Ali', relationship: 'Husband', phone: '0300-2345679' },
    isArchived: false, createdAt: '2026-03-12T14:00:00Z'
  },
  {
    id: 'MRN-2026-0008', name: 'Bilal Hussain', dob: '2000-01-25', gender: 'Male',
    contact: '0323-6677889', email: 'bilalhussain2000@gmail.com',
    address: 'Liaquatabad, Block 5, Karachi',
    bloodGroup: 'O+',
    emergencyContact: { name: 'Hina Bilal', relationship: 'Mother', phone: '0323-6677888' },
    isArchived: false, createdAt: '2026-03-20T10:30:00Z'
  },
  {
    id: 'MRN-2026-0009', name: 'Rukhsana Khatoon', dob: '1972-08-08', gender: 'Female',
    contact: '0344-3312456', email: 'rukhsanakhatoon@gmail.com',
    address: 'Gulshan-e-Iqbal, Block 13-A, Karachi',
    bloodGroup: 'AB-',
    emergencyContact: { name: 'Khalid Raza', relationship: 'Son', phone: '0344-3312457' },
    isArchived: false, createdAt: '2026-04-01T09:00:00Z'
  },
  {
    id: 'MRN-2026-0010', name: 'Tariq Mahmood', dob: '1955-06-20', gender: 'Male',
    contact: '0317-5544332', email: 'tariqmahmood55@gmail.com',
    address: 'Model Town, Sector B, Faisalabad',
    bloodGroup: 'B+',
    emergencyContact: { name: 'Sajida Tariq', relationship: 'Wife', phone: '0317-5544333' },
    isArchived: false, createdAt: '2026-04-10T11:15:00Z'
  }
];

const SEED_APPOINTMENTS: Appointment[] = [
  {
    id: 'APT-2026-001', patientId: 'MRN-2026-0001', patientName: 'Zainab Bibi',
    doctorId: 'u-doc-asif', doctorName: 'Dr. Muhammad Asif Khan',
    dateTime: '2026-05-30T09:00:00Z', timeSlot: '09:00 AM',
    status: 'Scheduled', notes: 'Chronic Hypertension follow-up visit — BP monitoring',
    createdAt: '2026-05-28T08:00:00Z'
  },
  {
    id: 'APT-2026-002', patientId: 'MRN-2026-0002', patientName: 'Muhammad Rizwan',
    doctorId: 'u-doc-amna', doctorName: 'Dr. Amna Bilal',
    dateTime: '2026-05-30T10:00:00Z', timeSlot: '10:00 AM',
    status: 'Scheduled', notes: 'Post-Typhoid recovery review — LFT results evaluation',
    createdAt: '2026-05-28T09:30:00Z'
  },
  {
    id: 'APT-2026-003', patientId: 'MRN-2026-0005', patientName: 'Fatima Noor',
    doctorId: 'u-doc-sajid', doctorName: 'Dr. Sajid Mehmood',
    dateTime: '2026-05-30T11:00:00Z', timeSlot: '11:00 AM',
    status: 'Scheduled', notes: 'Acute Pediatric Bronchitis — breathing assessment, nebulizer plan',
    createdAt: '2026-05-29T10:00:00Z'
  },
  {
    id: 'APT-2026-004', patientId: 'MRN-2026-0003', patientName: 'Kamran Wali',
    doctorId: 'u-doc-asif', doctorName: 'Dr. Muhammad Asif Khan',
    dateTime: '2026-05-29T09:30:00Z', timeSlot: '09:30 AM',
    status: 'Completed', notes: 'Diabetes Type-II — HbA1c quarterly review',
    createdAt: '2026-05-27T09:00:00Z'
  },
  {
    id: 'APT-2026-005', patientId: 'MRN-2026-0004', patientName: 'Asma Shah',
    doctorId: 'u-doc-amna', doctorName: 'Dr. Amna Bilal',
    dateTime: '2026-05-29T10:30:00Z', timeSlot: '10:30 AM',
    status: 'Completed', notes: 'Dengue fever follow-up — CBC platelet trend analysis',
    createdAt: '2026-05-27T10:00:00Z'
  },
  {
    id: 'APT-2026-006', patientId: 'MRN-2026-0006', patientName: 'Shahid Mehmood',
    doctorId: 'u-doc-sajid', doctorName: 'Dr. Sajid Mehmood',
    dateTime: '2026-05-28T02:00:00Z', timeSlot: '02:00 PM',
    status: 'Completed', notes: 'Cardiovascular risk assessment — ECG interpretation',
    createdAt: '2026-05-26T14:00:00Z'
  },
  {
    id: 'APT-2026-007', patientId: 'MRN-2026-0007', patientName: 'Nadia Parveen',
    doctorId: 'u-doc-asif', doctorName: 'Dr. Muhammad Asif Khan',
    dateTime: '2026-05-28T11:00:00Z', timeSlot: '11:00 AM',
    status: 'Cancelled', notes: 'Routine gynecological follow-up — rescheduled at patient request',
    createdAt: '2026-05-26T11:30:00Z'
  },
  {
    id: 'APT-2026-008', patientId: 'MRN-2026-0008', patientName: 'Bilal Hussain',
    doctorId: 'u-doc-amna', doctorName: 'Dr. Amna Bilal',
    dateTime: '2026-05-31T09:00:00Z', timeSlot: '09:00 AM',
    status: 'Scheduled', notes: 'Renal function review post-medication initiation',
    createdAt: '2026-05-29T15:00:00Z'
  },
  {
    id: 'APT-2026-009', patientId: 'MRN-2026-0009', patientName: 'Rukhsana Khatoon',
    doctorId: 'u-doc-sajid', doctorName: 'Dr. Sajid Mehmood',
    dateTime: '2026-05-31T10:30:00Z', timeSlot: '10:30 AM',
    status: 'Scheduled', notes: 'Arthritis joint pain assessment — physiotherapy referral needed',
    createdAt: '2026-05-29T16:00:00Z'
  },
  {
    id: 'APT-2026-010', patientId: 'MRN-2026-0010', patientName: 'Tariq Mahmood',
    doctorId: 'u-doc-asif', doctorName: 'Dr. Muhammad Asif Khan',
    dateTime: '2026-05-27T09:00:00Z', timeSlot: '09:00 AM',
    status: 'Completed', notes: 'Cardiac checkup — Lipid profile results',
    createdAt: '2026-05-25T09:00:00Z'
  }
];

const SEED_LAB_ORDERS: LabOrder[] = [
  {
    id: 'LAB-2026-001', patientId: 'MRN-2026-0001', patientName: 'Zainab Bibi', patientMRN: 'MRN-2026-0001',
    doctorId: 'u-doc-asif', doctorName: 'Dr. Muhammad Asif Khan',
    encounterId: 'ENC-2026-001', testName: 'Complete Blood Count (CBC)',
    category: 'Hematology', status: 'Completed',
    resultValue: 'Hb: 10.2 g/dL | WBC: 11,500/μL | Platelets: 98,000/μL',
    referenceRange: 'Hb: 12-16 g/dL | WBC: 4,500-11,000/μL | Platelets: 150,000-400,000/μL',
    flag: 'Critical', comments: 'CRITICAL: Platelet count dangerously low. Dengue Serology ordered urgently.',
    technicianId: 'u-tech-ali', technicianName: 'Muhammad Ali (Lab Technician)',
    updatedAt: '2026-05-29T11:00:00Z'
  },
  {
    id: 'LAB-2026-002', patientId: 'MRN-2026-0002', patientName: 'Muhammad Rizwan', patientMRN: 'MRN-2026-0002',
    doctorId: 'u-doc-amna', doctorName: 'Dr. Amna Bilal',
    encounterId: 'ENC-2026-002', testName: 'Liver Function Test (LFT)',
    category: 'Biochemistry', status: 'Completed',
    resultValue: 'ALT: 88 U/L | AST: 72 U/L | Bilirubin: 2.1 mg/dL | ALP: 142 U/L',
    referenceRange: 'ALT: 7-56 U/L | AST: 10-40 U/L | Bilirubin: 0.1-1.2 mg/dL',
    flag: 'Abnormal', comments: 'Elevated liver enzymes consistent with Post-Typhoid hepatic involvement.',
    technicianId: 'u-tech-ali', technicianName: 'Muhammad Ali (Lab Technician)',
    updatedAt: '2026-05-29T12:30:00Z'
  },
  {
    id: 'LAB-2026-003', patientId: 'MRN-2026-0004', patientName: 'Asma Shah', patientMRN: 'MRN-2026-0004',
    doctorId: 'u-doc-amna', doctorName: 'Dr. Amna Bilal',
    encounterId: 'ENC-2026-003', testName: 'Dengue NS1 Antigen & IgM/IgG Serology',
    category: 'Microbiology', status: 'Completed',
    resultValue: 'NS1 Antigen: POSITIVE | IgM: Reactive | IgG: Non-Reactive',
    referenceRange: 'NS1: Negative | IgM: Non-Reactive | IgG: Non-Reactive',
    flag: 'Critical', comments: 'CRITICAL: Active Dengue Fever confirmed. Immediate hospitalization recommended.',
    technicianId: 'u-tech-ali', technicianName: 'Muhammad Ali (Lab Technician)',
    updatedAt: '2026-05-28T14:00:00Z'
  },
  {
    id: 'LAB-2026-004', patientId: 'MRN-2026-0003', patientName: 'Kamran Wali', patientMRN: 'MRN-2026-0003',
    doctorId: 'u-doc-asif', doctorName: 'Dr. Muhammad Asif Khan',
    encounterId: 'ENC-2026-004', testName: 'Fasting Blood Glucose & HbA1c',
    category: 'Biochemistry', status: 'Completed',
    resultValue: 'Fasting Glucose: 198 mg/dL | HbA1c: 8.9%',
    referenceRange: 'Fasting: 70-100 mg/dL | HbA1c: < 7.0%',
    flag: 'Abnormal', comments: 'Poor glycaemic control. Metformin dose adjustment and dietary counseling required.',
    technicianId: 'u-tech-ali', technicianName: 'Muhammad Ali (Lab Technician)',
    updatedAt: '2026-05-29T09:00:00Z'
  },
  {
    id: 'LAB-2026-005', patientId: 'MRN-2026-0006', patientName: 'Shahid Mehmood', patientMRN: 'MRN-2026-0006',
    doctorId: 'u-doc-sajid', doctorName: 'Dr. Sajid Mehmood',
    encounterId: 'ENC-2026-005', testName: 'Lipid Profile (Cholesterol Panel)',
    category: 'Biochemistry', status: 'Completed',
    resultValue: 'Total Cholesterol: 248 mg/dL | LDL: 172 mg/dL | HDL: 34 mg/dL | TG: 310 mg/dL',
    referenceRange: 'Total: < 200 mg/dL | LDL: < 130 mg/dL | HDL: > 40 mg/dL | TG: < 150 mg/dL',
    flag: 'Critical', comments: 'CRITICAL: Severe dyslipidemia. High cardiovascular risk. Statin therapy initiated.',
    technicianId: 'u-tech-ali', technicianName: 'Muhammad Ali (Lab Technician)',
    updatedAt: '2026-05-28T10:00:00Z'
  },
  {
    id: 'LAB-2026-006', patientId: 'MRN-2026-0005', patientName: 'Fatima Noor', patientMRN: 'MRN-2026-0005',
    doctorId: 'u-doc-sajid', doctorName: 'Dr. Sajid Mehmood',
    encounterId: 'ENC-2026-006', testName: 'Chest X-Ray (PA View)',
    category: 'Radiology', status: 'Completed',
    resultValue: 'Bilateral peribronchial thickening noted. No consolidation. Hyperinflation present.',
    referenceRange: 'Normal bronchial markings. No infiltrates or effusions.',
    flag: 'Abnormal', comments: 'Findings consistent with acute bronchitis. Bronchodilator therapy advised.',
    technicianId: 'u-tech-ali', technicianName: 'Muhammad Ali (Lab Technician)',
    updatedAt: '2026-05-30T08:00:00Z'
  },
  {
    id: 'LAB-2026-007', patientId: 'MRN-2026-0007', patientName: 'Nadia Parveen', patientMRN: 'MRN-2026-0007',
    doctorId: 'u-doc-asif', doctorName: 'Dr. Muhammad Asif Khan',
    encounterId: 'ENC-2026-007', testName: 'Complete Urinalysis (Urine R/E)',
    category: 'Other', status: 'Ordered',
    technicianId: undefined, technicianName: undefined,
    updatedAt: undefined
  },
  {
    id: 'LAB-2026-008', patientId: 'MRN-2026-0010', patientName: 'Tariq Mahmood', patientMRN: 'MRN-2026-0010',
    doctorId: 'u-doc-asif', doctorName: 'Dr. Muhammad Asif Khan',
    encounterId: 'ENC-2026-008', testName: 'ECG (Electrocardiogram)',
    category: 'Other', status: 'Ordered',
    technicianId: undefined, technicianName: undefined,
    updatedAt: undefined
  }
];

const SEED_INVENTORY: InventoryItem[] = [
  { id: 'MED-001', name: 'Amoxicillin 500mg Capsules', genericName: 'Amoxicillin', category: 'Antibiotics', unitPrice: 8.50, stockQuantity: 8, minStockLevel: 50, expiryDate: '2026-06-30', supplier: 'Sami Pharma Distributors, Lahore' },
  { id: 'MED-002', name: 'Metformin 500mg Tablets', genericName: 'Metformin HCl', category: 'Antidiabetics', unitPrice: 5.75, stockQuantity: 15, minStockLevel: 30, expiryDate: '2026-05-20', supplier: 'Ferozsons Laboratories, Rawalpindi' },
  { id: 'MED-003', name: 'Paracetamol 500mg Tablets', genericName: 'Paracetamol (Acetaminophen)', category: 'Analgesics', unitPrice: 2.50, stockQuantity: 500, minStockLevel: 100, expiryDate: '2028-03-01', supplier: 'Hilton Pharma, Karachi' },
  { id: 'MED-004', name: 'Amlodipine 5mg Tablets', genericName: 'Amlodipine Besylate', category: 'Antihypertensives', unitPrice: 12.00, stockQuantity: 180, minStockLevel: 40, expiryDate: '2027-12-31', supplier: 'ICI Pakistan Pharma, Lahore' },
  { id: 'MED-005', name: 'Atorvastatin 20mg Tablets', genericName: 'Atorvastatin Calcium', category: 'Statins', unitPrice: 18.50, stockQuantity: 220, minStockLevel: 50, expiryDate: '2027-09-30', supplier: 'Getz Pharma, Karachi' },
  { id: 'MED-006', name: 'Ciprofloxacin 500mg Tablets', genericName: 'Ciprofloxacin HCl', category: 'Antibiotics', unitPrice: 15.00, stockQuantity: 90, minStockLevel: 40, expiryDate: '2027-06-30', supplier: 'Sami Pharma Distributors, Lahore' },
  { id: 'MED-007', name: 'Omeprazole 20mg Capsules', genericName: 'Omeprazole', category: 'Proton Pump Inhibitors', unitPrice: 9.00, stockQuantity: 300, minStockLevel: 60, expiryDate: '2027-11-30', supplier: 'Martin Dow, Karachi' },
  { id: 'MED-008', name: 'Salbutamol 2mg Tablets', genericName: 'Salbutamol Sulfate', category: 'Bronchodilators', unitPrice: 4.25, stockQuantity: 6, minStockLevel: 40, expiryDate: '2026-06-15', supplier: 'GlaxoSmithKline Pakistan, Karachi' },
  { id: 'MED-009', name: 'Dexamethasone 4mg/2mL Injection', genericName: 'Dexamethasone Sodium Phosphate', category: 'Corticosteroids', unitPrice: 35.00, stockQuantity: 60, minStockLevel: 20, expiryDate: '2027-04-30', supplier: 'Highnoon Laboratories, Lahore' },
  { id: 'MED-010', name: 'Ceftriaxone 1g Injection', genericName: 'Ceftriaxone Sodium', category: 'Antibiotics', unitPrice: 120.00, stockQuantity: 40, minStockLevel: 20, expiryDate: '2027-08-31', supplier: 'Sami Pharma Distributors, Lahore' },
  { id: 'MED-011', name: 'Normal Saline 0.9% IV 500mL', genericName: 'Sodium Chloride 0.9%', category: 'IV Fluids', unitPrice: 45.00, stockQuantity: 12, minStockLevel: 50, expiryDate: '2026-06-30', supplier: 'Otsuka Pakistan, Karachi' },
  { id: 'MED-012', name: 'Insulin Glargine 100U/mL (Pen)', genericName: 'Insulin Glargine', category: 'Antidiabetics', unitPrice: 850.00, stockQuantity: 25, minStockLevel: 10, expiryDate: '2027-02-28', supplier: 'Novo Nordisk Pakistan, Karachi' },
  { id: 'MED-013', name: 'Diclofenac Sodium 75mg/3mL Injection', genericName: 'Diclofenac Sodium', category: 'NSAIDs', unitPrice: 28.00, stockQuantity: 120, minStockLevel: 30, expiryDate: '2028-01-31', supplier: 'Ferozsons Laboratories, Rawalpindi' },
  { id: 'MED-014', name: 'Ondansetron 4mg Tablets', genericName: 'Ondansetron HCl', category: 'Antiemetics', unitPrice: 22.00, stockQuantity: 160, minStockLevel: 40, expiryDate: '2027-10-31', supplier: 'Getz Pharma, Karachi' },
  { id: 'MED-015', name: 'Platelet Enhancer (Papaya Leaf Extract)', genericName: 'Carica Papaya Leaf Extract', category: 'Dengue Supportive', unitPrice: 95.00, stockQuantity: 30, minStockLevel: 15, expiryDate: '2026-05-28', supplier: 'Herbion Pakistan, Karachi' }
];

const SEED_BEDS: Bed[] = [
  { id: 'BED-CCU-01', wardName: 'CCU / ICU Critical Care Unit', bedNumber: 'CCU-01', type: 'ICU', status: 'Occupied', patientId: 'MRN-2026-0006', patientName: 'Shahid Mehmood' },
  { id: 'BED-CCU-02', wardName: 'CCU / ICU Critical Care Unit', bedNumber: 'CCU-02', type: 'ICU', status: 'Vacant' },
  { id: 'BED-CCU-03', wardName: 'CCU / ICU Critical Care Unit', bedNumber: 'CCU-03', type: 'ICU', status: 'Maintenance' },
  { id: 'BED-PRIV-01', wardName: 'Private VIP Room Block', bedNumber: 'PVT-01', type: 'Private', status: 'Occupied', patientId: 'MRN-2026-0004', patientName: 'Asma Shah' },
  { id: 'BED-PRIV-02', wardName: 'Private VIP Room Block', bedNumber: 'PVT-02', type: 'Private', status: 'Vacant' },
  { id: 'BED-PRIV-03', wardName: 'Private VIP Room Block', bedNumber: 'PVT-03', type: 'Private', status: 'Vacant' },
  { id: 'BED-SEMI-01', wardName: 'Semi-Private Block', bedNumber: 'SEMI-01', type: 'Semi-Private', status: 'Occupied', patientId: 'MRN-2026-0010', patientName: 'Tariq Mahmood' },
  { id: 'BED-SEMI-02', wardName: 'Semi-Private Block', bedNumber: 'SEMI-02', type: 'Semi-Private', status: 'Vacant' },
  { id: 'BED-MARD-01', wardName: 'General Ward (Mardana)', bedNumber: 'MW-01', type: 'General Ward', status: 'Occupied', patientId: 'MRN-2026-0003', patientName: 'Kamran Wali' },
  { id: 'BED-MARD-02', wardName: 'General Ward (Mardana)', bedNumber: 'MW-02', type: 'General Ward', status: 'Vacant' },
  { id: 'BED-MARD-03', wardName: 'General Ward (Mardana)', bedNumber: 'MW-03', type: 'General Ward', status: 'Vacant' },
  { id: 'BED-ZEN-01', wardName: 'General Ward (Zenana)', bedNumber: 'ZW-01', type: 'General Ward', status: 'Occupied', patientId: 'MRN-2026-0001', patientName: 'Zainab Bibi' },
  { id: 'BED-ZEN-02', wardName: 'General Ward (Zenana)', bedNumber: 'ZW-02', type: 'General Ward', status: 'Vacant' },
  { id: 'BED-ZEN-03', wardName: 'General Ward (Zenana)', bedNumber: 'ZW-03', type: 'General Ward', status: 'Vacant' },
  { id: 'BED-PED-01', wardName: 'Pediatric Ward', bedNumber: 'PED-01', type: 'General Ward', status: 'Occupied', patientId: 'MRN-2026-0005', patientName: 'Fatima Noor' },
  { id: 'BED-PED-02', wardName: 'Pediatric Ward', bedNumber: 'PED-02', type: 'General Ward', status: 'Vacant' }
];

const SEED_ADMISSIONS: InpatientAdmission[] = [
  {
    id: 'ADM-2026-001', patientId: 'MRN-2026-0006', patientName: 'Shahid Mehmood', patientMRN: 'MRN-2026-0006',
    bedId: 'BED-CCU-01', wardName: 'CCU / ICU Critical Care Unit', bedNumber: 'CCU-01',
    admissionDate: '2026-05-27T14:00:00Z', status: 'Admitted',
    nursingNotes: [
      { id: 'NN-001', date: '2026-05-27T18:00:00Z', text: 'Patient admitted to CCU with severe chest pain (8/10 pain scale). IV access established, cardiac monitoring commenced. O2 administered at 4L/min via nasal cannula. BP: 168/98 mmHg, HR: 98 bpm, SpO2: 94%.', nurseId: 'u-nurse-hina', nurseName: 'Hina Bibi (Staff Nurse)' },
      { id: 'NN-002', date: '2026-05-28T06:00:00Z', text: 'Morning assessment: Vitals stabilizing. BP: 148/88 mmHg, HR: 82 bpm, SpO2: 97%. Patient resting comfortably. Continues on IV Heparin protocol. Repeat ECG ordered.', nurseId: 'u-nurse-hina', nurseName: 'Hina Bibi (Staff Nurse)' },
      { id: 'NN-003', date: '2026-05-28T18:00:00Z', text: 'Evening vitals: BP: 138/82 mmHg, HR: 76 bpm, SpO2: 98%. Patient condition improving. Cardiologist bedside review completed. Statin and beta-blocker therapy initiated.', nurseId: 'u-nurse-hina', nurseName: 'Hina Bibi (Staff Nurse)' },
      { id: 'NN-004', date: '2026-05-29T08:00:00Z', text: 'Morning vitals stable. Patient ambulatory with assistance. Dietary restrictions reinforced. Echocardiogram scheduled for this afternoon.', nurseId: 'u-nurse-hina', nurseName: 'Hina Bibi (Staff Nurse)' },
      { id: 'NN-005', date: '2026-05-30T07:00:00Z', text: 'Day 4 morning assessment. Vitals: BP 132/80, HR 72, SpO2 99%. Echo results show EF 48% with mild hypokinesia. Awaiting consultant review for discharge planning.', nurseId: 'u-nurse-hina', nurseName: 'Hina Bibi (Staff Nurse)' }
    ],
    progressNotes: [
      { id: 'PN-001', date: '2026-05-27T16:00:00Z', text: 'Dr. Sajid Mehmood: Patient admitted with NSTEMI presentation. Troponin I elevated at 0.68 ng/mL. Serial ECGs showing ST depression in leads V4-V6. Initiating dual antiplatelet therapy. Cardiology referral urgent.', staffId: 'u-doc-sajid', staffName: 'Dr. Sajid Mehmood' },
      { id: 'PN-002', date: '2026-05-28T10:00:00Z', text: 'Cardiology review completed. Echo today shows LV systolic dysfunction. Medical management optimized with addition of ACE inhibitor. Risk stratification score high. Will monitor for 48 hours before reassessment for intervention.', staffId: 'u-doc-sajid', staffName: 'Dr. Sajid Mehmood' }
    ]
  },
  {
    id: 'ADM-2026-002', patientId: 'MRN-2026-0004', patientName: 'Asma Shah', patientMRN: 'MRN-2026-0004',
    bedId: 'BED-PRIV-01', wardName: 'Private VIP Room Block', bedNumber: 'PVT-01',
    admissionDate: '2026-05-28T10:00:00Z', status: 'Admitted',
    nursingNotes: [
      { id: 'NN-006', date: '2026-05-28T12:00:00Z', text: 'Patient admitted with confirmed Dengue Fever (NS1+). IV fluids commenced: Normal Saline 100mL/hr. Platelet count critically low at 48,000/μL. Monitoring input/output chart strictly. Temperature: 38.8°C.', nurseId: 'u-nurse-hina', nurseName: 'Hina Bibi (Staff Nurse)' },
      { id: 'NN-007', date: '2026-05-29T08:00:00Z', text: 'Morning platelets: 62,000/μL — marginally improving. IV fluid rate adjusted. Patient febrile (38.2°C) but hemodynamically stable. No bleeding manifestations noted. Papaya leaf extract started.', nurseId: 'u-nurse-hina', nurseName: 'Hina Bibi (Staff Nurse)' },
      { id: 'NN-008', date: '2026-05-30T08:00:00Z', text: 'Day 3: Platelets rising to 95,000/μL — excellent response. Temperature normalized at 37.1°C. Patient tolerating oral fluids well. CBC to be repeated this evening.', nurseId: 'u-nurse-hina', nurseName: 'Hina Bibi (Staff Nurse)' }
    ],
    progressNotes: [
      { id: 'PN-003', date: '2026-05-28T11:00:00Z', text: 'Dr. Amna Bilal: Classic Dengue Fever with thrombocytopenia. IVF supportive care commenced. Daily CBC monitoring. Patient and family counseled regarding danger signs. Platelet transfusion threshold set at < 30,000/μL.', staffId: 'u-doc-amna', staffName: 'Dr. Amna Bilal' }
    ]
  },
  {
    id: 'ADM-2026-003', patientId: 'MRN-2026-0010', patientName: 'Tariq Mahmood', patientMRN: 'MRN-2026-0010',
    bedId: 'BED-SEMI-01', wardName: 'Semi-Private Block', bedNumber: 'SEMI-01',
    admissionDate: '2026-05-26T09:00:00Z', status: 'Admitted',
    nursingNotes: [
      { id: 'NN-009', date: '2026-05-26T11:00:00Z', text: 'Patient admitted for post-cardiac evaluation and medical optimization of dyslipidemia. Vitals: BP 145/90, HR 78, SpO2 97%. Low-fat diet commenced. Statin therapy initiated. Fasting labs drawn.', nurseId: 'u-nurse-hina', nurseName: 'Hina Bibi (Staff Nurse)' },
      { id: 'NN-010', date: '2026-05-29T09:00:00Z', text: 'Day 4 assessment: Patient ambulatory. No adverse effects from statin. Dietary counseling session completed with dietitian. Family educated on lifestyle modifications.', nurseId: 'u-nurse-hina', nurseName: 'Hina Bibi (Staff Nurse)' }
    ],
    progressNotes: [
      { id: 'PN-004', date: '2026-05-26T10:00:00Z', text: 'Dr. Muhammad Asif Khan: High cardiovascular risk patient admitted for optimization. Lipid profile severely deranged. Initiated high-intensity statin (Rosuvastatin 40mg OD). Aspirin, ACE inhibitor added to regimen. Cardiology follow-up in 4 weeks.', staffId: 'u-doc-asif', staffName: 'Dr. Muhammad Asif Khan' }
    ]
  },
  {
    id: 'ADM-2026-004', patientId: 'MRN-2026-0003', patientName: 'Kamran Wali', patientMRN: 'MRN-2026-0003',
    bedId: 'BED-MARD-01', wardName: 'General Ward (Mardana)', bedNumber: 'MW-01',
    admissionDate: '2026-05-29T14:00:00Z', status: 'Admitted',
    nursingNotes: [
      { id: 'NN-011', date: '2026-05-29T16:00:00Z', text: 'Patient admitted for diabetic ketoacidosis management. Blood sugar on admission: 398 mg/dL. IV insulin infusion started. Hourly blood glucose monitoring commenced. Input/output charting active.', nurseId: 'u-nurse-hina', nurseName: 'Hina Bibi (Staff Nurse)' }
    ],
    progressNotes: [
      { id: 'PN-005', date: '2026-05-29T15:00:00Z', text: 'Dr. Muhammad Asif Khan: DKA secondary to medication non-compliance. IV rehydration and insulin protocol activated. Electrolyte monitoring every 4 hours. Diabetes education planned upon stabilization.', staffId: 'u-doc-asif', staffName: 'Dr. Muhammad Asif Khan' }
    ]
  },
  {
    id: 'ADM-2026-005', patientId: 'MRN-2026-0001', patientName: 'Zainab Bibi', patientMRN: 'MRN-2026-0001',
    bedId: 'BED-ZEN-01', wardName: 'General Ward (Zenana)', bedNumber: 'ZW-01',
    admissionDate: '2026-05-29T10:00:00Z', status: 'Admitted',
    nursingNotes: [
      { id: 'NN-012', date: '2026-05-29T12:00:00Z', text: 'Patient admitted for hypertensive crisis management. BP on admission: 188/112 mmHg. IV Labetalol protocol initiated. Continuous BP monitoring. Low-sodium diet ordered. Fundoscopy requested.', nurseId: 'u-nurse-hina', nurseName: 'Hina Bibi (Staff Nurse)' },
      { id: 'NN-013', date: '2026-05-30T07:30:00Z', text: 'Morning vitals: BP 158/94 mmHg, HR 84 bpm, SpO2 98%. Gradual improvement. Transitioning to oral antihypertensive therapy today. Patient tolerating well.', nurseId: 'u-nurse-hina', nurseName: 'Hina Bibi (Staff Nurse)' }
    ],
    progressNotes: [
      { id: 'PN-006', date: '2026-05-29T11:00:00Z', text: 'Dr. Muhammad Asif Khan: Hypertensive urgency — no immediate end-organ damage identified. IV therapy to lower BP by 25% over first hour. Renal function and ECG normal. Amlodipine + Losartan combination to be started for long-term control.', staffId: 'u-doc-asif', staffName: 'Dr. Muhammad Asif Khan' }
    ]
  },
  {
    id: 'ADM-2026-006', patientId: 'MRN-2026-0005', patientName: 'Fatima Noor', patientMRN: 'MRN-2026-0005',
    bedId: 'BED-PED-01', wardName: 'Pediatric Ward', bedNumber: 'PED-01',
    admissionDate: '2026-05-30T08:00:00Z', status: 'Admitted',
    nursingNotes: [
      { id: 'NN-014', date: '2026-05-30T09:00:00Z', text: 'Child admitted for acute bronchitis with moderate respiratory distress (RR: 32/min). O2 via mask at 6L/min. Nebulization with Salbutamol started 4-hourly. Temperature: 38.5°C. Parents counseled and present at bedside.', nurseId: 'u-nurse-hina', nurseName: 'Hina Bibi (Staff Nurse)' }
    ],
    progressNotes: [
      { id: 'PN-007', date: '2026-05-30T08:30:00Z', text: 'Dr. Sajid Mehmood: Acute bronchitis in 10-year-old. Chest X-ray shows bilateral peribronchial thickening. Commence nebulized Salbutamol QID, oral Prednisolone 5-day course, and broad-spectrum antibiotic cover. Reassess after 24 hours.', staffId: 'u-doc-sajid', staffName: 'Dr. Sajid Mehmood' }
    ]
  }
];

const SEED_INVOICES: Invoice[] = [
  {
    id: 'INV-10001', patientId: 'MRN-2026-0003', patientName: 'Kamran Wali', patientMRN: 'MRN-2026-0003',
    encounterId: 'ENC-2026-004',
    items: [
      { description: 'OPD Consultation — Dr. Muhammad Asif Khan (Cardiology)', amount: 1500, category: 'Consultation' },
      { description: 'Fasting Blood Glucose Test', amount: 300, category: 'Laboratory' },
      { description: 'HbA1c (Glycated Hemoglobin)', amount: 800, category: 'Laboratory' },
      { description: 'Metformin 500mg x 30 Tablets', amount: 172.50, category: 'Pharmacy' }
    ],
    subtotal: 2772.50, tax: 138.63, total: 2911.13, paidAmount: 2911.13,
    status: 'Paid', paymentMethod: 'Cash',
    createdAt: '2026-05-29T09:30:00Z'
  },
  {
    id: 'INV-10002', patientId: 'MRN-2026-0001', patientName: 'Zainab Bibi', patientMRN: 'MRN-2026-0001',
    admissionId: 'ADM-2026-005',
    items: [
      { description: 'IPD Admission — General Ward (Zenana) — 2 Days', amount: 4000, category: 'Inpatient' },
      { description: 'Hypertension Monitoring & IV Therapy', amount: 3500, category: 'Inpatient' },
      { description: 'Amlodipine 5mg x 30 Tablets', amount: 360, category: 'Pharmacy' },
      { description: 'Complete Blood Count (CBC)', amount: 400, category: 'Laboratory' }
    ],
    subtotal: 8260, tax: 413, total: 8673, paidAmount: 0,
    status: 'Unpaid',
    createdAt: '2026-05-30T08:00:00Z'
  },
  {
    id: 'INV-10003', patientId: 'MRN-2026-0006', patientName: 'Shahid Mehmood', patientMRN: 'MRN-2026-0006',
    admissionId: 'ADM-2026-001',
    items: [
      { description: 'CCU / ICU Critical Care Unit — 4 Days', amount: 24000, category: 'Inpatient' },
      { description: 'Cardiac Monitoring & ECG Services', amount: 5000, category: 'Inpatient' },
      { description: 'Lipid Profile Panel', amount: 1200, category: 'Laboratory' },
      { description: 'Echocardiography', amount: 3500, category: 'Laboratory' },
      { description: 'Atorvastatin 20mg x 30 Tablets', amount: 555, category: 'Pharmacy' },
      { description: 'IV Heparin & Medications', amount: 2800, category: 'Pharmacy' }
    ],
    subtotal: 37055, tax: 1852.75, total: 38907.75, paidAmount: 0,
    status: 'InsuranceClaimed', insuranceProvider: 'State Life Insurance Corporation of Pakistan',
    policyNumber: 'SL-PKR-2024-88741', claimStatus: 'Submitted',
    createdAt: '2026-05-27T16:00:00Z'
  },
  {
    id: 'INV-10004', patientId: 'MRN-2026-0004', patientName: 'Asma Shah', patientMRN: 'MRN-2026-0004',
    admissionId: 'ADM-2026-002',
    items: [
      { description: 'Private VIP Room — 3 Days', amount: 18000, category: 'Inpatient' },
      { description: 'IV Fluid Therapy & Nursing Care', amount: 4500, category: 'Inpatient' },
      { description: 'Dengue NS1 Antigen & Serology Panel', amount: 2500, category: 'Laboratory' },
      { description: 'Daily CBC Monitoring x 3', amount: 1200, category: 'Laboratory' },
      { description: 'Papaya Leaf Extract Capsules x 60', amount: 2850, category: 'Pharmacy' }
    ],
    subtotal: 29050, tax: 1452.50, total: 30502.50, paidAmount: 15000,
    status: 'PartiallyPaid', paymentMethod: 'Card',
    createdAt: '2026-05-28T11:00:00Z'
  },
  {
    id: 'INV-10005', patientId: 'MRN-2026-0005', patientName: 'Fatima Noor', patientMRN: 'MRN-2026-0005',
    encounterId: 'ENC-2026-006',
    items: [
      { description: 'OPD Consultation — Dr. Sajid Mehmood (Pediatrics)', amount: 1200, category: 'Consultation' },
      { description: 'Chest X-Ray (PA View)', amount: 900, category: 'Laboratory' },
      { description: 'Salbutamol 2mg Tablets x 30', amount: 127.50, category: 'Pharmacy' },
      { description: 'Amoxicillin 500mg Capsules x 21', amount: 178.50, category: 'Pharmacy' }
    ],
    subtotal: 2406, tax: 120.30, total: 2526.30, paidAmount: 2526.30,
    status: 'Paid', paymentMethod: 'Cash',
    createdAt: '2026-05-30T08:30:00Z'
  },
  {
    id: 'INV-10006', patientId: 'MRN-2026-0010', patientName: 'Tariq Mahmood', patientMRN: 'MRN-2026-0010',
    admissionId: 'ADM-2026-003',
    items: [
      { description: 'Semi-Private Room — 5 Days', amount: 12500, category: 'Inpatient' },
      { description: 'Cardiovascular Monitoring & Care', amount: 3000, category: 'Inpatient' },
      { description: 'ECG (Electrocardiogram)', amount: 600, category: 'Laboratory' },
      { description: 'Lipid Profile Panel', amount: 1200, category: 'Laboratory' },
      { description: 'Atorvastatin 20mg + Aspirin (30 days supply)', amount: 780, category: 'Pharmacy' }
    ],
    subtotal: 18080, tax: 904, total: 18984, paidAmount: 0,
    status: 'Unpaid',
    createdAt: '2026-05-26T10:00:00Z'
  },
  {
    id: 'INV-10007', patientId: 'MRN-2026-0002', patientName: 'Muhammad Rizwan', patientMRN: 'MRN-2026-0002',
    encounterId: 'ENC-2026-002',
    items: [
      { description: 'OPD Consultation — Dr. Amna Bilal (General Medicine)', amount: 1000, category: 'Consultation' },
      { description: 'Liver Function Test (LFT)', amount: 1200, category: 'Laboratory' },
      { description: 'Ciprofloxacin 500mg Tablets x 14', amount: 210, category: 'Pharmacy' },
      { description: 'Omeprazole 20mg Capsules x 14', amount: 126, category: 'Pharmacy' }
    ],
    subtotal: 2536, tax: 126.80, total: 2662.80, paidAmount: 2662.80,
    status: 'Paid', paymentMethod: 'Cash',
    createdAt: '2026-05-29T13:00:00Z'
  },
  {
    id: 'INV-10008', patientId: 'MRN-2026-0007', patientName: 'Nadia Parveen', patientMRN: 'MRN-2026-0007',
    encounterId: 'ENC-2026-007',
    items: [
      { description: 'OPD Consultation — Dr. Muhammad Asif Khan', amount: 1500, category: 'Consultation' },
      { description: 'Complete Urinalysis (Urine R/E)', amount: 350, category: 'Laboratory' }
    ],
    subtotal: 1850, tax: 92.50, total: 1942.50, paidAmount: 0,
    status: 'Unpaid',
    createdAt: '2026-05-28T11:30:00Z'
  }
];

const SEED_AUDIT_LOGS: AuditLog[] = [
  { id: 'LOG-001', userId: 'u-admin-chief', username: 'Admin Chief', userRole: 'Admin', action: 'AUTH_LOGIN', details: 'Administrator login from clinical operations dashboard. Session initiated successfully.', timestamp: '2026-05-30T04:00:00Z' },
  { id: 'LOG-002', userId: 'u-doc-asif', username: 'Dr. Muhammad Asif Khan', userRole: 'Doctor', action: 'AUTH_LOGIN', details: 'Doctor login. Morning shift session commenced. Accessing patient queue.', timestamp: '2026-05-30T04:15:00Z' },
  { id: 'LOG-003', userId: 'u-doc-asif', username: 'Dr. Muhammad Asif Khan', userRole: 'Doctor', patientId: 'MRN-2026-0001', action: 'VIEW_MEDICAL_RECORD', details: 'Accessed EMR for patient Zainab Bibi — chronic hypertension monitoring case review.', timestamp: '2026-05-30T04:30:00Z' },
  { id: 'LOG-004', userId: 'u-doc-asif', username: 'Dr. Muhammad Asif Khan', userRole: 'Doctor', patientId: 'MRN-2026-0001', action: 'CREATE_ENCOUNTER', details: 'SOAP encounter created for Zainab Bibi. Vitals recorded. BP: 188/112. Lab orders: CBC. Prescription: Amlodipine 5mg OD issued.', timestamp: '2026-05-30T04:45:00Z' },
  { id: 'LOG-005', userId: 'u-nurse-hina', username: 'Hina Bibi', userRole: 'Nurse', patientId: 'MRN-2026-0006', action: 'ADD_NURSING_NOTE', details: 'Nursing chart note added for CCU patient Shahid Mehmood. Vitals documented. BP improving post IV therapy.', timestamp: '2026-05-30T05:00:00Z' },
  { id: 'LOG-006', userId: 'u-doc-amna', username: 'Dr. Amna Bilal', userRole: 'Doctor', action: 'AUTH_LOGIN', details: 'Doctor login from general medicine ward. Accessing morning patient consultations.', timestamp: '2026-05-30T05:10:00Z' },
  { id: 'LOG-007', userId: 'u-doc-amna', username: 'Dr. Amna Bilal', userRole: 'Doctor', patientId: 'MRN-2026-0004', action: 'VIEW_MEDICAL_RECORD', details: 'Reviewed IPD progress for Asma Shah — Dengue Fever patient. CBC platelet trend reviewed.', timestamp: '2026-05-30T05:25:00Z' },
  { id: 'LOG-008', userId: 'u-tech-ali', username: 'Muhammad Ali', userRole: 'Lab Technician', patientId: 'MRN-2026-0004', action: 'LAB_RESULT_ENTERED', details: 'Lab results finalized for Asma Shah — CBC: Platelets 95,000/μL (improving trend). Result flagged Abnormal and signed by technician.', timestamp: '2026-05-30T05:40:00Z' },
  { id: 'LOG-009', userId: 'u-pharm-hassan', username: 'Hassan Raza', userRole: 'Pharmacist', patientId: 'MRN-2026-0006', action: 'DISPENSE_MEDICATION', details: 'Dispensed Atorvastatin 20mg x30 and Aspirin 75mg x30 to Shahid Mehmood (CCU). Invoice INV-10003 updated with pharmacy charge items.', timestamp: '2026-05-30T06:00:00Z' },
  { id: 'LOG-010', userId: 'u-admin-chief', username: 'Admin Chief', userRole: 'Admin', action: 'VIEW_AUDIT_LOG', details: 'Security audit trail reviewed by administrator. HIPAA compliance verification pass.', timestamp: '2026-05-30T06:15:00Z' },
  { id: 'LOG-011', userId: 'u-recept-sara', username: 'Sara Iqbal', userRole: 'Receptionist', patientId: 'MRN-2026-0008', action: 'BOOK_APPOINTMENT', details: 'Appointment booked for Bilal Hussain with Dr. Amna Bilal on 2026-05-31 at 09:00 AM. Renal function review post-medication.', timestamp: '2026-05-30T06:30:00Z' },
  { id: 'LOG-012', userId: 'u-doc-sajid', username: 'Dr. Sajid Mehmood', userRole: 'Doctor', action: 'AUTH_LOGIN', details: 'Doctor login. Pediatric ward rounds commencing. Fatima Noor admission review.', timestamp: '2026-05-30T07:00:00Z' },
  { id: 'LOG-013', userId: 'u-doc-sajid', username: 'Dr. Sajid Mehmood', userRole: 'Doctor', patientId: 'MRN-2026-0005', action: 'ADD_PROGRESS_NOTE', details: 'Bedside progress note for Fatima Noor (Pediatric Ward PED-01). Bronchitis treatment protocol updated. Salbutamol nebulization QID.', timestamp: '2026-05-30T07:15:00Z' },
  { id: 'LOG-014', userId: 'u-nurse-hina', username: 'Hina Bibi', userRole: 'Nurse', patientId: 'MRN-2026-0003', action: 'ADD_NURSING_NOTE', details: 'Hourly blood glucose monitoring documented for Kamran Wali (DKA patient). Sugar reading: 248 mg/dL. Insulin infusion rate adjusted.', timestamp: '2026-05-30T07:30:00Z' },
  { id: 'LOG-015', userId: 'u-admin-chief', username: 'Admin Chief', userRole: 'Admin', action: 'BILLING_INVOICE_VIEWED', details: 'Insurance claim INV-10003 status reviewed. Claim for Shahid Mehmood submitted to State Life Insurance. Pending approval.', timestamp: '2026-05-30T07:45:00Z' },
  { id: 'LOG-016', userId: 'u-recept-sara', username: 'Sara Iqbal', userRole: 'Receptionist', patientId: 'MRN-2026-0009', action: 'BOOK_APPOINTMENT', details: 'Appointment registered for Rukhsana Khatoon with Dr. Sajid Mehmood on 2026-05-31 at 10:30 AM for arthritis assessment.', timestamp: '2026-05-30T08:00:00Z' },
  { id: 'LOG-017', userId: 'u-pharm-hassan', username: 'Hassan Raza', userRole: 'Pharmacist', action: 'LOW_STOCK_ALERT_TRIGGERED', details: 'Critical stock alert: Salbutamol 2mg (6 units remaining — threshold 40), Amoxicillin 500mg (8 units remaining — threshold 50), Normal Saline 500mL (12 units — threshold 50). Procurement orders flagged.', timestamp: '2026-05-30T08:15:00Z' },
  { id: 'LOG-018', userId: 'u-doc-amna', username: 'Dr. Amna Bilal', userRole: 'Doctor', patientId: 'MRN-2026-0002', action: 'CREATE_ENCOUNTER', details: 'SOAP encounter created for Muhammad Rizwan — Post-Typhoid Recovery. LFT results reviewed. Prescription: Ciprofloxacin 500mg BD x 7 days and Omeprazole 20mg OD issued.', timestamp: '2026-05-30T08:30:00Z' },
  { id: 'LOG-019', userId: 'u-admin-chief', username: 'Admin Chief', userRole: 'Admin', action: 'PATIENT_REGISTERED', details: 'New patient Rukhsana Khatoon registered — MRN-2026-0009. Demographics captured. Emergency contact: Khalid Raza.', timestamp: '2026-05-30T09:00:00Z' },
  { id: 'LOG-020', userId: 'u-admin-chief', username: 'Admin Chief', userRole: 'Admin', action: 'SETTINGS_UPDATED', details: 'Hospital operational settings reviewed. Currency confirmed: PKR. HIPAA compliance audit log verified. System online under 24/7 operational status.', timestamp: '2026-05-30T09:30:00Z' }
];

const SEED_SETTINGS: HospitalSettings = {
  name: 'St. Jude Mission Hospital, Mianwali',
  address: 'Hospital Road, Mianwali, Punjab, Pakistan — 42200',
  contact: '+92-459-220148',
  taxRate: 0.05,
  currency: 'PKR',
  operatingHours: '24/7 Emergency Services — OPD: 08:00 - 20:00'
};

const SEED_DASHBOARD_STATS = {
  financialPerformance: [
    { month: 'Jan', billed: 450000, paid: 380000 },
    { month: 'Feb', billed: 580000, paid: 510000 },
    { month: 'Mar', billed: 720000, paid: 640000 },
    { month: 'Apr', billed: 890000, paid: 810000 },
    { month: 'May', billed: 1150000, paid: 980000 }
  ],
  bedOccupancy: [
    { ward: 'General Ward (Mardana)', occupied: 1, vacant: 2, total: 3 },
    { ward: 'General Ward (Zenana)', occupied: 1, vacant: 2, total: 3 },
    { ward: 'Semi-Private Block', occupied: 1, vacant: 1, total: 2 },
    { ward: 'Private VIP Room', occupied: 1, vacant: 2, total: 3 },
    { ward: 'CCU / ICU Unit', occupied: 1, vacant: 1, total: 2 },
    { ward: 'Pediatric Ward', occupied: 1, vacant: 1, total: 2 }
  ],
  bedOccupancyRate: 37.8,
  esiQueueLoad: [
    { level: 'ESI Level 1 (Resuscitation)', count: 1 },
    { level: 'ESI Level 2 (Emergent)', count: 3 },
    { level: 'ESI Level 3 (Urgent)', count: 7 },
    { level: 'ESI Level 4 (Less Urgent)', count: 4 },
    { level: 'ESI Level 5 (Non-Urgent)', count: 2 }
  ],
  opdWeeklyAnalytics: [
    { name: 'General Medicine', value: 45 },
    { name: 'Pediatrics', value: 28 },
    { name: 'Cardiology', value: 19 },
    { name: 'Orthopedics', value: 14 },
    { name: 'Pharmacy Dispenses', value: 65 }
  ]
};

export interface Toast {
  id: string;
  message: string;
  type: 'success' | 'error' | 'info';
}

interface PatientInput {
  name: string;
  dob: string;
  gender: 'Male' | 'Female' | 'Other';
  contact: string;
  email?: string;
  address: string;
  bloodGroup: string;
  emergencyContact: {
    name: string;
    relationship: string;
    phone: string;
  };
}

interface EncounterInput {
  patientId: string;
  vitals: {
    bp: string;
    heartRate: number;
    temperature: number;
    weight: number;
    respiratoryRate?: number;
    spo2?: number;
  };
  soap: {
    s: string;
    o: string;
    a: string;
    p: string;
  };
  prescriptions?: {
    medicineId: string;
    name: string;
    dosage: string;
    frequency: string;
    duration: string;
    notes?: string;
  }[];
  labOrders?: {
    testName: string;
    category: string;
  }[];
}

interface HospitalContextProps {
  user: any | null;
  token: string | null;
  isLoading: boolean;
  activeRole: string | null;
  settings: HospitalSettings | null;
  patients: Patient[];
  appointments: Appointment[];
  labOrders: LabOrder[];
  inventory: InventoryItem[];
  beds: Bed[];
  admissions: InpatientAdmission[];
  invoices: Invoice[];
  auditLogs: AuditLog[];
  dashboardStats: any;
  error: string | null;
  success: string | null;
  activeTab: string;
  setActiveTab: (tab: string) => void;
  toasts: Toast[];
  addToast: (message: string, type?: 'success' | 'error' | 'info') => void;
  removeToast: (id: string) => void;
  
  // Handlers
  login: (username: string, password: string) => Promise<boolean>;
  logout: () => void;
  setError: (msg: string | null) => void;
  setSuccess: (msg: string | null) => void;
  
  // API Calls
  refreshAllData: () => Promise<void>;
  registerPatient: (input: PatientInput) => Promise<boolean>;
  updatePatient: (mrn: string, data: Partial<Patient>) => Promise<boolean>;
  archivePatient: (mrn: string) => Promise<boolean>;
  
  bookAppointment: (apt: { patientId: string; doctorId: string; dateTime: string; timeSlot: string; notes?: string }) => Promise<boolean>;
  updateAppointment: (id: string, updates: { status?: string; dateTime?: string; timeSlot?: string; notes?: string }) => Promise<boolean>;
  
  createEncounter: (input: EncounterInput) => Promise<boolean>;
  applyDoctorLeave: (leave: { startDate: string; endDate: string; reason: string }) => Promise<boolean>;
  approveDoctorLeave: (leaveId: string, doctorId: string, status: 'Approved' | 'Rejected') => Promise<boolean>;
  
  updateLabOrder: (id: string, data: { resultValue: string; referenceRange?: string; flag?: string; comments?: string; filePath?: string }) => Promise<boolean>;
  uploadLabFile: (id: string, fileData: { fileName: string; size?: string; fileContentBase64: string }) => Promise<boolean>;
  
  addInventoryItem: (item: Omit<InventoryItem, 'id'>) => Promise<boolean>;
  updateInventoryItem: (id: string, data: Partial<InventoryItem>) => Promise<boolean>;
  dispenseMedication: (dispatch: { patientId: string; medicineId: string; quantity: number; encounterId?: string }) => Promise<boolean>;
  
  admitInpatient: (patientId: string, bedId: string) => Promise<boolean>;
  addNursingNote: (admissionId: string, text: string) => Promise<boolean>;
  addProgressNote: (admissionId: string, text: string) => Promise<boolean>;
  dischargeInpatient: (admissionId: string, summary: { diagnosis: string; treatmentSummary: string; dischargeInstructions: string; followUpDate?: string }) => Promise<boolean>;
  
  payInvoice: (invoiceId: string, payment: { paymentMethod: string; amountPaid: number; insuranceProvider?: string; policyNumber?: string }) => Promise<boolean>;
  updateClaimStatus: (invoiceId: string, claimStatus: string) => Promise<boolean>;
  updateHospitalSettings: (data: Partial<HospitalSettings>) => Promise<boolean>;
  
  // Utilities
  getPatientEncounters: (patientId: string) => Promise<Encounter[]>;
}

const HospitalContext = createContext<HospitalContextProps | undefined>(undefined);

export function HospitalProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<any | null>(null);
  const [token, setToken] = useState<string | null>(localStorage.getItem('hms_token'));
  const [activeRole, setActiveRole] = useState<string | null>(localStorage.getItem('hms_active_role'));
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [error, setErrorState] = useState<string | null>(null);
  const [success, setSuccessState] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<string>('dashboard');
  const [toasts, setToasts] = useState<Toast[]>([]);

  const addToast = (message: string, type: 'success' | 'error' | 'info' = 'info') => {
    const id = `toast-${Date.now()}-${Math.random()}`;
    setToasts(prev => [...prev, { id, message, type }]);
    setTimeout(() => removeToast(id), 4000);
  };

  const removeToast = (id: string) => {
    setToasts(prev => prev.filter(t => t.id !== id));
  };

  // Cache sets — initialized with Pakistani clinical seed data as defaults
  const [settings, setSettings] = useState<HospitalSettings | null>(SEED_SETTINGS);
  const [patients, setPatients] = useState<Patient[]>(SEED_PATIENTS);
  const [appointments, setAppointments] = useState<Appointment[]>(SEED_APPOINTMENTS);
  const [labOrders, setLabOrders] = useState<LabOrder[]>(SEED_LAB_ORDERS);
  const [inventory, setInventory] = useState<InventoryItem[]>(SEED_INVENTORY);
  const [beds, setBeds] = useState<Bed[]>(SEED_BEDS);
  const [admissions, setAdmissions] = useState<InpatientAdmission[]>(SEED_ADMISSIONS);
  const [invoices, setInvoices] = useState<Invoice[]>(SEED_INVOICES);
  const [auditLogs, setAuditLogs] = useState<AuditLog[]>(SEED_AUDIT_LOGS);
  const [dashboardStats, setDashboardStats] = useState<any>(SEED_DASHBOARD_STATS);

  // Helper trigger
  const setSuccess = (msg: string | null) => {
    setSuccessState(msg);
    if (msg) {
      addToast(msg, 'success');
      setTimeout(() => setSuccessState(null), 4000);
    }
  };
  
  const setError = (msg: string | null) => {
    setErrorState(msg);
    if (msg) {
      addToast(msg, 'error');
      setTimeout(() => setErrorState(null), 5000);
    }
  };

  // Safe headers configuration
  const getHeaders = () => {
    return {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${token}`
    };
  };

  // Login handler
  const login = async (username: string, password: string): Promise<boolean> => {
    try {
      setIsLoading(true);
      const res = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username, password })
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data.message || 'Invalid credentials');
        return false;
      }
      
      localStorage.setItem('hms_token', data.token);
      localStorage.setItem('hms_active_role', data.user.role);
      
      setToken(data.token);
      setUser(data.user);
      setActiveRole(data.user.role);
      setSuccess(`Welcome back, ${data.user.name}!`);
      return true;
    } catch (err) {
      setError("Failed to connect to authentication gateway server.");
      return false;
    } finally {
      setIsLoading(false);
    }
  };

  // Sign out
  const logout = () => {
    localStorage.removeItem('hms_token');
    localStorage.removeItem('hms_active_role');
    setToken(null);
    setUser(null);
    setActiveRole(null);
    setSuccess("Logged out of Hospital Gateway successfully.");
  };

  // Fetch active logged in profile
  useEffect(() => {
    const fetchMe = async () => {
      if (!token) {
        setIsLoading(false);
        return;
      }
      try {
        const res = await fetch('/api/auth/me', {
          headers: getHeaders()
        });
        const data = await res.json();
        if (res.ok) {
          setUser(data.user);
          setActiveRole(data.user.role);
          await refreshAllData();
        } else {
          logout();
        }
      } catch (err) {
        console.error("Clinical profile handshake failed:", err);
      } finally {
        setIsLoading(false);
      }
    };
    fetchMe();
  }, [token]);

  // General load routines
  const refreshAllData = async () => {
    if (!token) return;
    try {
      const headers = getHeaders();
      
      const [
        resSettings,
        resPatients,
        resApts,
        resLabs,
        resInv,
        resBeds,
        resAdms,
        resInvoices,
        resStats
      ] = await Promise.all([
        fetch('/api/settings', { headers }),
        fetch('/api/patients', { headers }),
        fetch('/api/appointments', { headers }),
        fetch('/api/lab/orders', { headers }),
        fetch('/api/pharmacy/inventory', { headers }),
        fetch('/api/inpatient/beds', { headers }),
        fetch('/api/inpatient/admissions', { headers }),
        fetch('/api/billing/invoices', { headers }),
        fetch('/api/dashboard/stats', { headers })
      ]);

      // Coalescing fallback: use remote data only if non-empty, otherwise keep seed defaults
      if (resSettings.ok) { const d = await resSettings.json(); if (d && d.name) setSettings(d); }
      if (resPatients.ok) { const d = await resPatients.json(); if (Array.isArray(d) && d.length > 0) setPatients(d); }
      if (resApts.ok) { const d = await resApts.json(); if (Array.isArray(d) && d.length > 0) setAppointments(d); }
      if (resLabs.ok) { const d = await resLabs.json(); if (Array.isArray(d) && d.length > 0) setLabOrders(d); }
      if (resInv.ok) { const d = await resInv.json(); if (Array.isArray(d) && d.length > 0) setInventory(d); }
      if (resBeds.ok) { const d = await resBeds.json(); if (Array.isArray(d) && d.length > 0) setBeds(d); }
      if (resAdms.ok) { const d = await resAdms.json(); if (Array.isArray(d) && d.length > 0) setAdmissions(d); }
      if (resInvoices.ok) { const d = await resInvoices.json(); if (Array.isArray(d) && d.length > 0) setInvoices(d); }
      if (resStats.ok) { const d = await resStats.json(); if (d && (d.financialPerformance || d.bedOccupancy)) setDashboardStats(d); }

      // If Admin, also retrieve Security logs
      const activeRoleClaims = localStorage.getItem('hms_active_role');
      if (activeRoleClaims === 'Admin') {
        const resLogs = await fetch('/api/audit/logs', { headers });
        if (resLogs.ok) { const d = await resLogs.json(); if (Array.isArray(d) && d.length > 0) setAuditLogs(d); }
      }

    } catch (err) {
      console.error("Critical API loading error:", err);
    }
  };

  // 1. Patient Operations
  const registerPatient = async (input: PatientInput): Promise<boolean> => {
    try {
      const res = await fetch('/api/patients', {
        method: 'POST',
        headers: getHeaders(),
        body: JSON.stringify(input)
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data.message || 'Failed to register patient');
        return false;
      }
      setSuccess(`Patient ${input.name} registered and MRN generated!`);
      await refreshAllData();
      return true;
    } catch (err) {
      setError("Connection failure during patient registry.");
      return false;
    }
  };

  const updatePatient = async (mrn: string, data: Partial<Patient>): Promise<boolean> => {
    try {
      const res = await fetch(`/api/patients/${mrn}`, {
        method: 'PUT',
        headers: getHeaders(),
        body: JSON.stringify(data)
      });
      const resData = await res.json();
      if (!res.ok) {
        setError(resData.message || 'Failed to update demographics');
        return false;
      }
      setSuccess(`Patient MRN ${mrn} revised successfully.`);
      await refreshAllData();
      return true;
    } catch (err) {
      setError("Demographics update communication failed.");
      return false;
    }
  };

  const archivePatient = async (mrn: string): Promise<boolean> => {
    try {
      const res = await fetch(`/api/patients/${mrn}/archive`, {
        method: 'DELETE',
        headers: getHeaders()
      });
      if (!res.ok) {
        const data = await res.json();
        setError(data.message || 'Fails archiving patient record');
        return false;
      }
      setSuccess(`Patient MRN ${mrn} archived.`);
      await refreshAllData();
      return true;
    } catch (err) {
      setError("Archiving command failed.");
      return false;
    }
  };

  // 2. Appointment Booking
  const bookAppointment = async (apt: { patientId: string; doctorId: string; dateTime: string; timeSlot: string; notes?: string }): Promise<boolean> => {
    try {
      const res = await fetch('/api/appointments', {
        method: 'POST',
        headers: getHeaders(),
        body: JSON.stringify(apt)
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data.message || 'Double booking allocation conflict. Choose another slot');
        return false;
      }
      setSuccess(`Appointment booked successfully! Confirmation logs written.`);
      await refreshAllData();
      return true;
    } catch (err) {
      setError("Appointment service connection failed.");
      return false;
    }
  };

  const updateAppointment = async (id: string, updates: { status?: string; dateTime?: string; timeSlot?: string; notes?: string }): Promise<boolean> => {
    try {
      const res = await fetch(`/api/appointments/${id}`, {
        method: 'PUT',
        headers: getHeaders(),
        body: JSON.stringify(updates)
      });
      if (!res.ok) {
        const data = await res.json();
        setError(data.message || 'Could not adjust slot allocation.');
        return false;
      }
      setSuccess(`Appointment rescheduled/adjusted successfully.`);
      await refreshAllData();
      return true;
    } catch (err) {
      setError("Consultation rescheduling communication failed.");
      return false;
    }
  };

  // 3. SOAP Encounters
  const createEncounter = async (input: EncounterInput): Promise<boolean> => {
    try {
      const res = await fetch('/api/encounters', {
        method: 'POST',
        headers: getHeaders(),
        body: JSON.stringify(input)
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data.message || 'Encounter record failure.');
        return false;
      }
      setSuccess(`SOAP Clinical Note logged & Consultation Invoice generated.`);
      await refreshAllData();
      return true;
    } catch (err) {
      setError("Clinical encounter creation pipeline failed.");
      return false;
    }
  };

  const getPatientEncounters = async (patientId: string): Promise<Encounter[]> => {
    try {
      const res = await fetch(`/api/encounters/patient/${patientId}`, {
        headers: getHeaders()
      });
      if (res.ok) {
        return await res.json();
      }
      return [];
    } catch (err) {
      return [];
    }
  };

  // Leaves management
  const applyDoctorLeave = async (leave: { startDate: string; endDate: string; reason: string }): Promise<boolean> => {
    try {
      const res = await fetch('/api/doctors/leaves', {
        method: 'POST',
        headers: getHeaders(),
        body: JSON.stringify(leave)
      });
      if (!res.ok) {
        const data = await res.json();
        setError(data.message || 'Leave registration fail.');
        return false;
      }
      setSuccess("Leave request logged successfully.");
      await refreshAllData();
      return true;
    } catch (err) {
      setError("Leave booking server handshake failed.");
      return false;
    }
  };

  const approveDoctorLeave = async (leaveId: string, doctorId: string, status: 'Approved' | 'Rejected'): Promise<boolean> => {
    try {
      const res = await fetch(`/api/doctors/leaves/${leaveId}`, {
        method: 'PUT',
        headers: getHeaders(),
        body: JSON.stringify({ doctorId, status })
      });
      if (!res.ok) {
        const data = await res.json();
        setError(data.message || 'Action fail.');
        return false;
      }
      setSuccess(`Leave status updated to: ${status}`);
      await refreshAllData();
      return true;
    } catch (err) {
      setError("Leave approval connection error.");
      return false;
    }
  };

  // 4. Laboratory results
  const updateLabOrder = async (id: string, data: { resultValue: string; referenceRange?: string; flag?: string; comments?: string; filePath?: string }): Promise<boolean> => {
    try {
      const res = await fetch(`/api/lab/orders/${id}`, {
        method: 'PUT',
        headers: getHeaders(),
        body: JSON.stringify(data)
      });
      if (!res.ok) {
        const resData = await res.json();
        setError(resData.message || 'Laboratory entry failed.');
        return false;
      }
      setSuccess("Laboratory report diagnostics successfully finalized.");
      await refreshAllData();
      return true;
    } catch (err) {
      setError("Lab logging communication error.");
      return false;
    }
  };

  const uploadLabFile = async (id: string, fileData: { fileName: string; size?: string; fileContentBase64: string }): Promise<boolean> => {
    try {
      const res = await fetch(`/api/lab/orders/${id}/upload`, {
        method: 'POST',
        headers: getHeaders(),
        body: JSON.stringify(fileData)
      });
      if (!res.ok) {
        const data = await res.json();
        setError(data.message || 'Radiology image attach failure.');
        return false;
      }
      setSuccess("Radiology/Scan document attached.");
      await refreshAllData();
      return true;
    } catch (err) {
      setError("File transmission stream exception.");
      return false;
    }
  };

  // 5. Drug formulary
  const addInventoryItem = async (item: Omit<InventoryItem, 'id'>): Promise<boolean> => {
    try {
      const res = await fetch('/api/pharmacy/inventory', {
        method: 'POST',
        headers: getHeaders(),
        body: JSON.stringify(item)
      });
      if (!res.ok) {
        const data = await res.json();
        setError(data.message || 'Failed adding drug.');
        return false;
      }
      setSuccess(`Drug formulary item ${item.name} configured successfully.`);
      await refreshAllData();
      return true;
    } catch (err) {
      setError("Pharmacy server communication error.");
      return false;
    }
  };

  const updateInventoryItem = async (id: string, data: Partial<InventoryItem>): Promise<boolean> => {
    try {
      const res = await fetch(`/api/pharmacy/inventory/${id}`, {
        method: 'PUT',
        headers: getHeaders(),
        body: JSON.stringify(data)
      });
      if (!res.ok) {
        const resData = await res.json();
        setError(resData.message || 'Failed updating inventory.');
        return false;
      }
      setSuccess("Stock / Drug properties revised.");
      await refreshAllData();
      return true;
    } catch (err) {
      setError("Stock revision server connection failed.");
      return false;
    }
  };

  const dispenseMedication = async (dispatch: { patientId: string; medicineId: string; quantity: number; encounterId?: string }): Promise<boolean> => {
    try {
      const res = await fetch('/api/pharmacy/dispense', {
        method: 'POST',
        headers: getHeaders(),
        body: JSON.stringify(dispatch)
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data.message || 'Deduction and dispensing fail.');
        return false;
      }
      setSuccess("Drug dispensed successfully! Patient invoice updated with pharmacy charge items.");
      await refreshAllData();
      return true;
    } catch (err) {
      setError("Prescription dispenser channel connection failure.");
      return false;
    }
  };

  // 6. IPD Admission beds
  const admitInpatient = async (patientId: string, bedId: string): Promise<boolean> => {
    try {
      const res = await fetch('/api/inpatient/admissions', {
        method: 'POST',
        headers: getHeaders(),
        body: JSON.stringify({ patientId, bedId })
      });
      if (!res.ok) {
        const data = await res.json();
        setError(data.message || 'Bed occupy failed.');
        return false;
      }
      setSuccess("Patient admitted successfully into the inpatient facility.");
      await refreshAllData();
      return true;
    } catch (err) {
      setError("Ward admission connection block.");
      return false;
    }
  };

  const addNursingNote = async (admissionId: string, text: string): Promise<boolean> => {
    try {
      const res = await fetch(`/api/inpatient/admissions/${admissionId}/nursing-notes`, {
        method: 'POST',
        headers: getHeaders(),
        body: JSON.stringify({ text })
      });
      if (!res.ok) {
        const data = await res.json();
        setError(data.message || 'Note logging exception.');
        return false;
      }
      setSuccess("Nursing chart progress entries updated.");
      await refreshAllData();
      return true;
    } catch (err) {
      setError("Inpatient chart network failure.");
      return false;
    }
  };

  const addProgressNote = async (admissionId: string, text: string): Promise<boolean> => {
    try {
      const res = await fetch(`/api/inpatient/admissions/${admissionId}/progress-notes`, {
        method: 'POST',
        headers: getHeaders(),
        body: JSON.stringify({ text })
      });
      if (!res.ok) {
        const data = await res.json();
        setError(data.message || 'Doctor bedside progress note exception.');
        return false;
      }
      setSuccess("Clinical bedside note appended successfully.");
      await refreshAllData();
      return true;
    } catch (err) {
      setError("Daily bedside notes connection failure.");
      return false;
    }
  };

  const dischargeInpatient = async (admissionId: string, summary: { diagnosis: string; treatmentSummary: string; dischargeInstructions: string; followUpDate?: string }): Promise<boolean> => {
    try {
      const res = await fetch(`/api/inpatient/admissions/${admissionId}/discharge`, {
        method: 'POST',
        headers: getHeaders(),
        body: JSON.stringify(summary)
      });
      if (!res.ok) {
        const data = await res.json();
        setError(data.message || 'Discharge summarizing failure.');
        return false;
      }
      setSuccess("Inpatient clinical discharge finalized. Room bed vacated and Final Invoice posted.");
      await refreshAllData();
      return true;
    } catch (err) {
      setError("Inpatient checkout gateway failure.");
      return false;
    }
  };

  // 7. Finance invoicing
  const payInvoice = async (invoiceId: string, payment: { paymentMethod: string; amountPaid: number; insuranceProvider?: string; policyNumber?: string }): Promise<boolean> => {
    try {
      const res = await fetch(`/api/billing/invoices/${invoiceId}/pay`, {
        method: 'POST',
        headers: getHeaders(),
        body: JSON.stringify(payment)
      });
      if (!res.ok) {
        const data = await res.json();
        setError(data.message || 'Invoice checkout block.');
        return false;
      }
      setSuccess(`Invoiced balance processed via: ${payment.paymentMethod}. Ledger balanced!`);
      await refreshAllData();
      return true;
    } catch (err) {
      setError("Billing processor connection error.");
      return false;
    }
  };

  const updateClaimStatus = async (invoiceId: string, claimStatus: string): Promise<boolean> => {
    try {
      const res = await fetch(`/api/billing/invoices/${invoiceId}/insurance-claim`, {
        method: 'PUT',
        headers: getHeaders(),
        body: JSON.stringify({ claimStatus })
      });
      if (!res.ok) {
        const data = await res.json();
        setError(data.message || 'Claim change exception.');
        return false;
      }
      setSuccess(`Insurance coverage status: ${claimStatus}`);
      await refreshAllData();
      return true;
    } catch (err) {
      setError("Insurance claim channel error.");
      return false;
    }
  };

  // 8. Hospital Settings Configuration
  const updateHospitalSettings = async (data: Partial<HospitalSettings>): Promise<boolean> => {
    try {
      const res = await fetch('/api/settings', {
        method: 'PUT',
        headers: getHeaders(),
        body: JSON.stringify(data)
      });
      if (!res.ok) {
        const resData = await res.json();
        setError(resData.message || 'Failed updating Hospital attributes.');
        return false;
      }
      setSuccess("Hospital operational settings updated successfully.");
      await refreshAllData();
      return true;
    } catch (err) {
      setError("System config network transmission failure.");
      return false;
    }
  };

  return (
    <HospitalContext.Provider value={{
      user,
      token,
      isLoading,
      activeRole,
      settings,
      patients,
      appointments,
      labOrders,
      inventory,
      beds,
      admissions,
      invoices,
      auditLogs,
      dashboardStats,
      error,
      success,
      activeTab,
      setActiveTab,
      toasts,
      addToast,
      removeToast,
      login,
      logout,
      setError,
      setSuccess,
      refreshAllData,
      registerPatient,
      updatePatient,
      archivePatient,
      bookAppointment,
      updateAppointment,
      createEncounter,
      getPatientEncounters,
      applyDoctorLeave,
      approveDoctorLeave,
      updateLabOrder,
      uploadLabFile,
      addInventoryItem,
      updateInventoryItem,
      dispenseMedication,
      admitInpatient,
      addNursingNote,
      addProgressNote,
      dischargeInpatient,
      payInvoice,
      updateClaimStatus,
      updateHospitalSettings
    }}>
      {children}
    </HospitalContext.Provider>
  );
}

export function useHospital() {
  const context = useContext(HospitalContext);
  if (context === undefined) {
    throw new Error('useHospital must be used within an HospitalProvider');
  }
  return context;
}

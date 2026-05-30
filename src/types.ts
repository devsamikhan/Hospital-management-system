/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

export type UserRole = 'Admin' | 'Doctor' | 'Nurse' | 'Receptionist' | 'Lab Technician' | 'Pharmacist';

export interface DoctorSchedule {
  dayOfWeek: string; // "Monday", "Tuesday", etc.
  startTime: string; // "09:00"
  endTime: string;   // "17:00"
}

export interface DoctorLeave {
  id: string;
  startDate: string;
  endDate: string;
  reason: string;
  status: 'Pending' | 'Approved' | 'Rejected';
}

export interface User {
  id: string;
  username: string;
  passwordHash: string;
  name: string;
  role: UserRole;
  email: string;
  phone: string;
  department?: string;
  // Doctor specific fields:
  specialization?: string;
  qualification?: string;
  consultationFee?: number;
  availability?: DoctorSchedule[];
  leaves?: DoctorLeave[];
}

export interface Patient {
  id: string; // Unique Medical Record Number (MRN) e.g., "MRN-2026-0001"
  name: string;
  dob: string; // YYYY-MM-DD
  gender: 'Male' | 'Female' | 'Other';
  contact: string;
  email?: string;
  address: string;
  bloodGroup: 'A+' | 'A-' | 'B+' | 'B-' | 'AB+' | 'AB-' | 'O+' | 'O-';
  emergencyContact: {
    name: string;
    relationship: string;
    phone: string;
  };
  isArchived: boolean;
  createdAt: string;
}

export type AppointmentStatus = 'Scheduled' | 'Completed' | 'Cancelled';

export interface Appointment {
  id: string;
  patientId: string;
  patientName?: string; // Denormalized for display ease
  doctorId: string;
  doctorName?: string;
  dateTime: string; // ISO String
  timeSlot: string; // "09:30 AM"
  status: AppointmentStatus;
  notes?: string;
  createdAt: string;
  simulatedNotificationLog?: string;
}

export interface VitalSigns {
  bp: string;       // e.g., "120/80"
  heartRate: number;// bpm
  temperature: number; // °C
  weight: number;   // kg
  respiratoryRate?: number; // bpm
  spo2?: number;    // %
}

export interface SOAPNotes {
  s: string; // Subjective
  o: string; // Objective
  a: string; // Assessment
  p: string; // Plan
}

export interface PrescriptionItem {
  medicineId: string;
  name: string;
  dosage: string;      // e.g., "500mg"
  frequency: string;   // e.g., "Once Daily", "Three Times a Day"
  duration: string;    // e.g., "7 Days"
  dispensed: boolean;
  dispensedAt?: string;
  notes?: string;
}

export interface Encounter {
  id: string;
  patientId: string;
  doctorId: string;
  doctorName?: string;
  date: string; // ISO String
  vitals: VitalSigns;
  soap: SOAPNotes;
  prescriptions: PrescriptionItem[];
  labOrders: LabOrderSummary[];
  createdAt: string;
}

export interface LabOrderSummary {
  id: string;
  testName: string;
}

export type LabOrderStatus = 'Ordered' | 'Completed';
export type LabResultFlag = 'Normal' | 'Abnormal' | 'Critical';

export interface LabOrder {
  id: string;
  patientId: string;
  patientName: string;
  patientMRN: string;
  doctorId: string;
  doctorName: string;
  encounterId: string;
  testName: string;
  category: 'Hematology' | 'Biochemistry' | 'Microbiology' | 'Radiology' | 'Other';
  status: LabOrderStatus;
  resultValue?: string; // Textual or numeric results
  referenceRange?: string; // e.g. "70-100 mg/dL"
  flag?: LabResultFlag;
  comments?: string;
  technicianId?: string;
  technicianName?: string;
  updatedAt?: string;
  filePath?: string; // Simulated uploaded file path/URL
}

export interface InventoryItem {
  id: string;
  name: string;
  genericName: string;
  category: string; // "Antibiotics", "Analgesics", etc.
  unitPrice: number;
  stockQuantity: number;
  minStockLevel: number; // For low-stock alerts
  expiryDate: string; // YYYY-MM-DD for expiry alerts
  supplier: string;
}

export interface PurchaseOrder {
  id: string;
  itemIds: { itemId: string; name: string; quantity: number }[];
  supplier: string;
  status: 'Draft' | 'Sent' | 'Received';
  createdAt: string;
}

export type BedStatus = 'Vacant' | 'Occupied' | 'Maintenance';
export type BedType = 'General Ward' | 'Semi-Private' | 'Private' | 'ICU';

export interface Bed {
  id: string; // e.g. "B-WARD-A-101"
  wardName: string; // e.g., "Alpha Ward"
  bedNumber: string; // e.g. "101"
  type: BedType;
  status: BedStatus;
  patientId?: string;
  patientName?: string;
}

export interface InpatientAdmission {
  id: string;
  patientId: string;
  patientName: string;
  patientMRN: string;
  bedId: string; // Links to Bed
  wardName: string;
  bedNumber: string;
  admissionDate: string; // ISO string
  dischargeDate?: string; // ISO string
  status: 'Admitted' | 'Discharged';
  nursingNotes: {
    id: string;
    date: string;
    text: string;
    nurseId: string;
    nurseName: string;
  }[];
  progressNotes: {
    id: string;
    date: string;
    text: string;
    staffId: string;
    staffName: string;
  }[];
  dischargeSummary?: {
    diagnosis: string;
    treatmentSummary: string;
    dischargeInstructions: string;
    followUpDate?: string;
  };
}

export type InvoiceStatus = 'Unpaid' | 'Paid' | 'PartiallyPaid' | 'InsuranceClaimed';

export interface InvoiceItem {
  description: string;
  amount: number;
  category: 'Consultation' | 'Pharmacy' | 'Laboratory' | 'Inpatient' | 'Other';
}

export interface Invoice {
  id: string; // Unique Invoice Number e.g. "INV-10001"
  patientId: string;
  patientName: string;
  patientMRN: string;
  encounterId?: string;
  admissionId?: string;
  items: InvoiceItem[];
  subtotal: number;
  tax: number;
  total: number;
  paidAmount: number;
  status: InvoiceStatus;
  paymentMethod?: 'Cash' | 'Card' | 'Insurance';
  insuranceProvider?: string;
  policyNumber?: string;
  claimStatus?: 'Draft' | 'Submitted' | 'Approved' | 'Rejected';
  createdAt: string;
}

export interface AuditLog {
  id: string;
  userId: string;
  username: string;
  userRole: UserRole;
  patientId?: string; // Optional patient associated with action
  action: string;    // e.g. "VIEW_MEDICAL_RECORD", "PRESCRIBE_MEDICATION", "DISPENSE_MEDICATION"
  details: string;   // detailed description
  timestamp: string; // ISO string
}

export interface HospitalSettings {
  name: string;
  address: string;
  contact: string;
  logoUrl?: string;
  taxRate: number; // e.g., 0.05 for 5%
  currency: string; // e.g. "$", "EUR", "Rs"
  operatingHours: string; // e.g. "24/7" or "08:00 - 20:00"
}

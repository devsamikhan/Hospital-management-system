-- Hospital Management System (HMS) Complete Database Schema
-- Compatible with PostgreSQL

-- Enable UUID extension if supported
-- CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- 1. HOSPITAL SETTINGS
CREATE TABLE hospital_settings (
    id VARCHAR(50) PRIMARY KEY DEFAULT 'default',
    name VARCHAR(255) NOT NULL,
    address TEXT NOT NULL,
    contact VARCHAR(100) NOT NULL,
    logo_url TEXT,
    tax_rate DECIMAL(5, 4) DEFAULT 0.05,
    currency VARCHAR(10) DEFAULT '$',
    operating_hours VARCHAR(100) DEFAULT '24/7'
);

-- 2. USERS & STAFF
CREATE TABLE users (
    id UUID PRIMARY KEY,
    username VARCHAR(100) UNIQUE NOT NULL,
    password_hash VARCHAR(255) NOT NULL,
    name VARCHAR(255) NOT NULL,
    role VARCHAR(50) NOT NULL CHECK (role IN ('Admin', 'Doctor', 'Nurse', 'Receptionist', 'Lab Technician', 'Pharmacist')),
    email VARCHAR(255) NOT NULL,
    phone VARCHAR(100) NOT NULL,
    department VARCHAR(100),
    specialization VARCHAR(255),
    qualification VARCHAR(255),
    consultation_fee DECIMAL(10, 2) DEFAULT 0.00
);

-- Doctor schedules
CREATE TABLE doctor_schedules (
    id SERIAL PRIMARY KEY,
    doctor_id UUID REFERENCES users(id) ON DELETE CASCADE,
    day_of_week VARCHAR(20) NOT NULL,
    start_time TIME NOT NULL,
    end_time TIME NOT NULL
);

-- Doctor leaves
CREATE TABLE doctor_leaves (
    id UUID PRIMARY KEY,
    doctor_id UUID REFERENCES users(id) ON DELETE CASCADE,
    start_date DATE NOT NULL,
    end_date DATE NOT NULL,
    reason TEXT NOT NULL,
    status VARCHAR(50) NOT NULL CHECK (status IN ('Pending', 'Approved', 'Rejected'))
);

-- 3. PATIENT RECORDS
CREATE TABLE patients (
    id VARCHAR(50) PRIMARY KEY, -- Medical Record Number (MRN)
    name VARCHAR(255) NOT NULL,
    dob DATE NOT NULL,
    gender VARCHAR(20) NOT NULL CHECK (gender IN ('Male', 'Female', 'Other')),
    contact VARCHAR(100) NOT NULL,
    email VARCHAR(255),
    address TEXT NOT NULL,
    blood_group VARCHAR(10) NOT NULL CHECK (blood_group IN ('A+', 'A-', 'B+', 'B-', 'AB+', 'AB-', 'O+', 'O-')),
    emergency_contact_name VARCHAR(255) NOT NULL,
    emergency_contact_relationship VARCHAR(100) NOT NULL,
    emergency_contact_phone VARCHAR(100) NOT NULL,
    is_archived BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Index for searching patients
CREATE INDEX idx_patients_name ON patients(name);
CREATE INDEX idx_patients_is_archived ON patients(is_archived);

-- 4. APPOINTMENTS
CREATE TABLE appointments (
    id UUID PRIMARY KEY,
    patient_id VARCHAR(50) REFERENCES patients(id) ON DELETE CASCADE,
    doctor_id UUID REFERENCES users(id) ON DELETE RESTRICT,
    date_time TIMESTAMP WITH TIME ZONE NOT NULL,
    time_slot VARCHAR(50) NOT NULL,
    status VARCHAR(50) NOT NULL CHECK (status IN ('Scheduled', 'Completed', 'Cancelled')),
    notes TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_appointments_doctor ON appointments(doctor_id, date_time);
CREATE INDEX idx_appointments_patient ON appointments(patient_id);

-- 5. BEDS & IPD WARDS
CREATE TABLE beds (
    id VARCHAR(50) PRIMARY KEY,
    ward_name VARCHAR(100) NOT NULL,
    bed_number VARCHAR(50) NOT NULL,
    type VARCHAR(50) NOT NULL CHECK (type IN ('General Ward', 'Semi-Private', 'Private', 'ICU')),
    status VARCHAR(50) NOT NULL CHECK (status IN ('Vacant', 'Occupied', 'Maintenance')),
    patient_id VARCHAR(50) REFERENCES patients(id) ON DELETE SET NULL
);

-- 6. IPD INPATIENT ADMISSIONS
CREATE TABLE admissions (
    id UUID PRIMARY KEY,
    patient_id VARCHAR(50) REFERENCES patients(id) ON DELETE CASCADE,
    bed_id VARCHAR(50) REFERENCES beds(id) ON DELETE RESTRICT,
    admission_date TIMESTAMP WITH TIME ZONE NOT NULL,
    discharge_date TIMESTAMP WITH TIME ZONE,
    status VARCHAR(50) NOT NULL CHECK (status IN ('Admitted', 'Discharged')),
    discharge_summary_diagnosis TEXT,
    discharge_summary_treatment TEXT,
    discharge_summary_instructions TEXT,
    discharge_summary_followup DATE
);

-- Nursing & daily progress notes
CREATE TABLE admission_nursing_notes (
    id UUID PRIMARY KEY,
    admission_id UUID REFERENCES admissions(id) ON DELETE CASCADE,
    note_date TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    note_text TEXT NOT NULL,
    nurse_id UUID REFERENCES users(id) ON DELETE RESTRICT
);

CREATE TABLE admission_progress_notes (
    id UUID PRIMARY KEY,
    admission_id UUID REFERENCES admissions(id) ON DELETE CASCADE,
    note_date TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    note_text TEXT NOT NULL,
    staff_id UUID REFERENCES users(id) ON DELETE RESTRICT
);

-- 7. ELECTRONIC MEDICAL RECORDS (EMR) / CLINICAL ENCOUNTERS
CREATE TABLE encounters (
    id UUID PRIMARY KEY,
    patient_id VARCHAR(50) REFERENCES patients(id) ON DELETE CASCADE,
    doctor_id UUID REFERENCES users(id) ON DELETE RESTRICT,
    date_time TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    vital_bp VARCHAR(20) NOT NULL,
    vital_heart_rate INTEGER NOT NULL,
    vital_temperature DECIMAL(5, 2) NOT NULL,
    vital_weight DECIMAL(5, 2) NOT NULL,
    vital_respiratory_rate INTEGER,
    vital_spo2 INTEGER,
    soap_subjective TEXT NOT NULL,
    soap_objective TEXT NOT NULL,
    soap_assessment TEXT NOT NULL,
    soap_plan TEXT NOT NULL
);

CREATE INDEX idx_encounters_patient ON encounters(patient_id);

-- E-Prescriptions associated with encapsulation
CREATE TABLE prescriptions (
    id SERIAL PRIMARY KEY,
    encounter_id UUID REFERENCES encounters(id) ON DELETE CASCADE,
    medicine_name VARCHAR(255) NOT NULL,
    dosage VARCHAR(100) NOT NULL,
    frequency VARCHAR(100) NOT NULL,
    duration VARCHAR(100) NOT NULL,
    dispensed BOOLEAN DEFAULT FALSE,
    dispensed_at TIMESTAMP WITH TIME ZONE,
    notes TEXT
);

-- 8. LABORATORY & RADIOLOGY ORDERS
CREATE TABLE lab_orders (
    id UUID PRIMARY KEY,
    patient_id VARCHAR(50) REFERENCES patients(id) ON DELETE CASCADE,
    doctor_id UUID REFERENCES users(id) ON DELETE RESTRICT,
    encounter_id UUID REFERENCES encounters(id) ON DELETE CASCADE,
    test_name VARCHAR(255) NOT NULL,
    category VARCHAR(50) NOT NULL CHECK (category IN ('Hematology', 'Biochemistry', 'Microbiology', 'Radiology', 'Other')),
    status VARCHAR(50) NOT NULL CHECK (status IN ('Ordered', 'Completed')),
    result_value TEXT,
    reference_range VARCHAR(100),
    flag VARCHAR(20) CHECK (flag IN ('Normal', 'Abnormal', 'Critical')),
    comments TEXT,
    technician_id UUID REFERENCES users(id),
    updated_at TIMESTAMP WITH TIME ZONE,
    file_path TEXT
);

CREATE INDEX idx_lab_orders_patient ON lab_orders(patient_id);
CREATE INDEX idx_lab_orders_status ON lab_orders(status);

-- 9. PHARMACY INVENTORY
CREATE TABLE pharmacy_inventory (
    id UUID PRIMARY KEY,
    name VARCHAR(255) UNIQUE NOT NULL,
    generic_name VARCHAR(255) NOT NULL,
    category VARCHAR(100) NOT NULL,
    unit_price DECIMAL(10, 2) NOT NULL,
    stock_quantity INTEGER NOT NULL,
    min_stock_level INTEGER DEFAULT 10,
    expiry_date DATE NOT NULL,
    supplier VARCHAR(255) NOT NULL
);

-- 10. BILLING & INVOICES
CREATE TABLE invoices (
    id VARCHAR(50) PRIMARY KEY, -- e.g. "INV-10001"
    patient_id VARCHAR(50) REFERENCES patients(id) ON DELETE RESTRICT,
    encounter_id UUID REFERENCES encounters(id) ON DELETE SET NULL,
    admission_id UUID REFERENCES admissions(id) ON DELETE SET NULL,
    subtotal DECIMAL(10, 2) NOT NULL,
    tax DECIMAL(10, 2) NOT NULL,
    total DECIMAL(10, 2) NOT NULL,
    paid_amount DECIMAL(10, 2) DEFAULT 0.00,
    status VARCHAR(50) NOT NULL CHECK (status IN ('Unpaid', 'Paid', 'PartiallyPaid', 'InsuranceClaimed')),
    payment_method VARCHAR(50) CHECK (payment_method IN ('Cash', 'Card', 'Insurance')),
    insurance_provider VARCHAR(255),
    policy_number VARCHAR(100),
    claim_status VARCHAR(50) CHECK (claim_status IN ('Draft', 'Submitted', 'Approved', 'Rejected')),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Invoice items mapping charges
CREATE TABLE invoice_items (
    id SERIAL PRIMARY KEY,
    invoice_id VARCHAR(50) REFERENCES invoices(id) ON DELETE CASCADE,
    description VARCHAR(255) NOT NULL,
    amount DECIMAL(10, 2) NOT NULL,
    category VARCHAR(50) NOT NULL CHECK (category IN ('Consultation', 'Pharmacy', 'Laboratory', 'Inpatient', 'Other'))
);

-- 11. SECURITY AUDIT LOGS (HIPAA Compliance requirement)
CREATE TABLE security_audit_logs (
    id UUID PRIMARY KEY,
    user_id UUID,
    username VARCHAR(100) NOT NULL,
    user_role VARCHAR(50) NOT NULL,
    patient_id VARCHAR(50),
    action VARCHAR(255) NOT NULL,
    details TEXT NOT NULL,
    timestamp TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_audit_logs_patient ON security_audit_logs(patient_id);
CREATE INDEX idx_audit_logs_timestamp ON security_audit_logs(timestamp DESC);

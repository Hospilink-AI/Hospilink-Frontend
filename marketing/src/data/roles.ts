// Vacancy roles. `value` matches the backend specialty enum (JOB_ROLES in the app).
export type RoleGroup = "Doctors" | "Nurses" | "Technicians" | "Patient support" | "Pharmacy" | "Administration & support";

export interface Role {
  value: string;
  slug: string;
  label: string;
  short: string;
  group: RoleGroup;
  /** One factual line on what the role covers, for role landing pages. */
  about: string;
}

export const ROLES: Role[] = [
  { value: "rmo", slug: "rmo", label: "RMO (Resident Medical Officer)", short: "RMO", group: "Doctors", about: "Resident medical officers covering wards, casualty and night duty." },
  { value: "dmo", slug: "duty-medical-officer", label: "Duty Medical Officer (DMO)", short: "DMO", group: "Doctors", about: "Duty medical officers for casualty, wards and on-call cover." },
  { value: "general_physician", slug: "general-physician", label: "General Physician", short: "General Physician", group: "Doctors", about: "Physicians for OPD, wards and inpatient care." },
  { value: "intensivist", slug: "intensivist", label: "Intensivist / ICU Doctor", short: "Intensivist", group: "Doctors", about: "ICU doctors and intensivists for critical care units." },
  { value: "emergency_doctor", slug: "emergency-medicine-doctor", label: "Emergency Medicine Doctor", short: "Emergency Doctor", group: "Doctors", about: "Doctors for emergency departments and casualty." },
  { value: "anesthetist", slug: "anesthetist", label: "Anesthetist", short: "Anesthetist", group: "Doctors", about: "Anaesthesia cover for operation theatres and procedures." },
  { value: "pediatrician", slug: "pediatrician", label: "Pediatrician (NICU/PICU)", short: "Pediatrician", group: "Doctors", about: "Paediatricians, including NICU and PICU cover." },
  { value: "gynecologist", slug: "gynecologist", label: "Gynecologist", short: "Gynecologist", group: "Doctors", about: "Obstetrics and gynaecology for wards, labour rooms and OPD." },
  { value: "orthopedic_surgeon", slug: "orthopedic-surgeon", label: "Orthopedic Surgeon", short: "Orthopedic Surgeon", group: "Doctors", about: "Orthopaedic surgeons for OT, trauma and OPD." },
  { value: "general_surgeon", slug: "general-surgeon", label: "General Surgeon", short: "General Surgeon", group: "Doctors", about: "General surgeons for OT, wards and emergency surgery." },
  { value: "radiologist", slug: "radiologist", label: "Radiologist", short: "Radiologist", group: "Doctors", about: "Radiologists for imaging and reporting." },
  { value: "pathologist", slug: "pathologist", label: "Pathologist", short: "Pathologist", group: "Doctors", about: "Pathologists for laboratory reporting." },
  { value: "staff_nurse", slug: "staff-nurse", label: "Staff Nurse (Ward)", short: "Staff Nurse", group: "Nurses", about: "Ward staff nurses for inpatient care." },
  { value: "icu_nurse", slug: "icu-nurse", label: "ICU Nurse", short: "ICU Nurse", group: "Nurses", about: "Critical care nurses for ICU and HDU." },
  { value: "emergency_nurse", slug: "emergency-nurse", label: "Emergency Nurse", short: "Emergency Nurse", group: "Nurses", about: "Nurses for casualty and emergency departments." },
  { value: "ot_nurse", slug: "ot-nurse", label: "OT Nurse", short: "OT Nurse", group: "Nurses", about: "Operation theatre nurses, scrub and circulating." },
  { value: "dialysis_nurse", slug: "dialysis-nurse", label: "Dialysis Nurse", short: "Dialysis Nurse", group: "Nurses", about: "Nurses for dialysis units." },
  { value: "nicu_nurse", slug: "nicu-picu-nurse", label: "NICU / PICU Nurse", short: "NICU / PICU Nurse", group: "Nurses", about: "Neonatal and paediatric intensive care nurses." },
  { value: "lab_technician", slug: "lab-technician", label: "Lab Technician", short: "Lab Technician", group: "Technicians", about: "Laboratory technicians for sample processing and testing." },
  { value: "radiology_technician", slug: "radiology-technician", label: "Radiology Technician", short: "Radiology Technician", group: "Technicians", about: "X-ray, CT and imaging technicians." },
  { value: "ot_technician", slug: "ot-technician", label: "OT Technician", short: "OT Technician", group: "Technicians", about: "Operation theatre technicians." },
  { value: "dialysis_technician", slug: "dialysis-technician", label: "Dialysis Technician", short: "Dialysis Technician", group: "Technicians", about: "Technicians for dialysis units." },
  { value: "cath_lab_technician", slug: "cath-lab-technician", label: "Cath Lab Technician", short: "Cath Lab Technician", group: "Technicians", about: "Cardiac catheterisation lab technicians." },
  { value: "icu_technician", slug: "icu-technician", label: "ICU Technician", short: "ICU Technician", group: "Technicians", about: "Technicians supporting ICU equipment and care." },
  { value: "biomedical_engineer", slug: "biomedical-engineer", label: "Biomedical Engineer", short: "Biomedical Engineer", group: "Technicians", about: "Engineers who maintain and calibrate hospital equipment." },
  { value: "ward_boy", slug: "ward-boy", label: "Ward Boy", short: "Ward Boy", group: "Patient support", about: "Ward attendants supporting patient care and movement." },
  { value: "ayah", slug: "ayah-female-attendant", label: "Ayah / Female Attendant", short: "Ayah", group: "Patient support", about: "Female attendants supporting patients on wards." },
  { value: "opd_attendant", slug: "opd-attendant", label: "OPD Attendant", short: "OPD Attendant", group: "Patient support", about: "Attendants for outpatient departments." },
  { value: "emergency_attendant", slug: "emergency-attendant", label: "Emergency Attendant", short: "Emergency Attendant", group: "Patient support", about: "Attendants for casualty and emergency." },
  { value: "patient_care_taker", slug: "patient-care-taker", label: "Patient Care Taker", short: "Patient Care Taker", group: "Patient support", about: "Bedside care and patient assistance." },
  { value: "pharmacist", slug: "pharmacist", label: "Pharmacist", short: "Pharmacist", group: "Pharmacy", about: "Pharmacists for hospital pharmacies." },
  { value: "pharmacy_assistant", slug: "pharmacy-assistant", label: "Pharmacy Assistant", short: "Pharmacy Assistant", group: "Pharmacy", about: "Assistants for hospital pharmacy counters and stores." },
  { value: "housekeeping_staff", slug: "housekeeping-staff", label: "Housekeeping Staff", short: "Housekeeping", group: "Administration & support", about: "Housekeeping teams for wards and clinical areas." },
  { value: "security_guard", slug: "security-guard", label: "Security Guard", short: "Security Guard", group: "Administration & support", about: "Hospital security staff." },
  { value: "ambulance_driver", slug: "ambulance-driver", label: "Ambulance Driver", short: "Ambulance Driver", group: "Administration & support", about: "Drivers for hospital ambulances." },
  { value: "receptionist", slug: "receptionist", label: "Receptionist", short: "Receptionist", group: "Administration & support", about: "Front desk and patient reception." },
  { value: "billing_executive", slug: "billing-executive", label: "Billing Executive", short: "Billing Executive", group: "Administration & support", about: "Hospital billing and insurance desks." },
  { value: "medical_records_staff", slug: "medical-records-staff", label: "Medical Records Staff", short: "Medical Records", group: "Administration & support", about: "Medical records and documentation." },
  { value: "hr_accounts", slug: "hr-and-accounts", label: "HR & Accounts", short: "HR & Accounts", group: "Administration & support", about: "Hospital HR and accounts roles." },
];

export const ROLE_GROUPS: RoleGroup[] = ["Doctors", "Nurses", "Technicians", "Patient support", "Pharmacy", "Administration & support"];

export const roleByValue = (v?: string | null) => ROLES.find((r) => r.value === v);
export const roleLabel = (v?: string | null) => roleByValue(v)?.short ?? (v ? v.replace(/_/g, " ") : "Role");

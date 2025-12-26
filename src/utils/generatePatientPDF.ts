import { format } from "date-fns";

interface Vital {
  temperature: number | null;
  blood_pressure_systolic: number | null;
  blood_pressure_diastolic: number | null;
  heart_rate: number | null;
  weight_kg: number | null;
  height_cm: number | null;
}

interface Visit {
  id: string;
  appointment_date: string;
  reason_for_visit: string | null;
  diagnosis: string | null;
  status: string | null;
  consultation_fee: number | null;
  doctor_notes: string | null;
  vitals: Vital[];
}

interface Patient {
  first_name: string;
  last_name: string;
  medical_record_number: string | null;
  dob: string | null;
  gender: string | null;
  phone: string | null;
  emergency_contact: string | null;
  allergies: string | null;
  created_at: string;
}

const calculateBMI = (weight: number | null, height: number | null): string | null => {
  if (!weight || !height) return null;
  const heightM = height / 100;
  return (weight / (heightM * heightM)).toFixed(1);
};

const getStatusLabel = (status: string | null): string => {
  switch (status) {
    case "completed": return "Completed";
    case "in_progress": return "In Progress";
    case "triaged": return "Triaged";
    case "cancelled": return "Cancelled";
    default: return "Scheduled";
  }
};

export const generatePatientPDF = (patient: Patient, medicalHistory: Visit[], organizationName?: string) => {
  const age = patient.dob 
    ? Math.floor((new Date().getTime() - new Date(patient.dob).getTime()) / (365.25 * 24 * 60 * 60 * 1000))
    : null;

  const printContent = `
    <!DOCTYPE html>
    <html>
    <head>
      <title>Medical History - ${patient.first_name} ${patient.last_name}</title>
      <style>
        * { margin: 0; padding: 0; box-sizing: border-box; }
        body { 
          font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; 
          padding: 40px; 
          color: #1a1a1a;
          line-height: 1.5;
        }
        .header { 
          border-bottom: 3px solid #0066cc; 
          padding-bottom: 20px; 
          margin-bottom: 30px;
        }
        .header h1 { 
          color: #0066cc; 
          font-size: 28px; 
          margin-bottom: 5px;
        }
        .header .subtitle { 
          color: #666; 
          font-size: 14px;
        }
        .org-name {
          font-size: 12px;
          color: #888;
          margin-bottom: 10px;
        }
        .patient-info {
          display: grid;
          grid-template-columns: 1fr 1fr;
          gap: 20px;
          margin-bottom: 30px;
        }
        .info-section {
          background: #f8f9fa;
          border-radius: 8px;
          padding: 20px;
        }
        .info-section h3 {
          color: #0066cc;
          font-size: 14px;
          text-transform: uppercase;
          letter-spacing: 0.5px;
          margin-bottom: 15px;
          border-bottom: 1px solid #dee2e6;
          padding-bottom: 8px;
        }
        .info-row {
          display: flex;
          justify-content: space-between;
          padding: 6px 0;
          font-size: 13px;
        }
        .info-row .label { color: #666; }
        .info-row .value { font-weight: 500; text-align: right; }
        .history-section {
          margin-top: 30px;
        }
        .history-section h2 {
          color: #0066cc;
          font-size: 18px;
          margin-bottom: 20px;
          padding-bottom: 10px;
          border-bottom: 2px solid #e9ecef;
        }
        .visit {
          border: 1px solid #dee2e6;
          border-radius: 8px;
          padding: 20px;
          margin-bottom: 15px;
          page-break-inside: avoid;
        }
        .visit-header {
          display: flex;
          justify-content: space-between;
          align-items: center;
          margin-bottom: 12px;
          padding-bottom: 10px;
          border-bottom: 1px solid #e9ecef;
        }
        .visit-date { 
          font-weight: 600; 
          font-size: 14px;
          color: #333;
        }
        .visit-status {
          padding: 4px 12px;
          border-radius: 12px;
          font-size: 11px;
          font-weight: 500;
          text-transform: uppercase;
        }
        .status-completed { background: #d4edda; color: #155724; }
        .status-in_progress { background: #cce5ff; color: #004085; }
        .status-triaged { background: #fff3cd; color: #856404; }
        .status-cancelled { background: #f8d7da; color: #721c24; }
        .status-scheduled { background: #e9ecef; color: #495057; }
        .visit-content { font-size: 13px; }
        .visit-content p { margin-bottom: 8px; }
        .visit-content .label { 
          color: #666; 
          font-weight: 500;
        }
        .diagnosis {
          background: #e7f1ff;
          padding: 10px;
          border-radius: 6px;
          margin-top: 10px;
        }
        .vitals-grid {
          display: grid;
          grid-template-columns: repeat(3, 1fr);
          gap: 12px;
          margin-top: 15px;
          padding-top: 15px;
          border-top: 1px solid #e9ecef;
        }
        .vital-item {
          text-align: center;
          padding: 10px;
          background: #f8f9fa;
          border-radius: 6px;
        }
        .vital-item .vital-label {
          font-size: 10px;
          color: #666;
          text-transform: uppercase;
          letter-spacing: 0.5px;
        }
        .vital-item .vital-value {
          font-size: 16px;
          font-weight: 600;
          color: #333;
          margin-top: 4px;
        }
        .no-history {
          text-align: center;
          padding: 40px;
          color: #666;
        }
        .footer {
          margin-top: 40px;
          padding-top: 20px;
          border-top: 1px solid #dee2e6;
          font-size: 11px;
          color: #888;
          text-align: center;
        }
        @media print {
          body { padding: 20px; }
          .visit { break-inside: avoid; }
        }
      </style>
    </head>
    <body>
      <div class="header">
        ${organizationName ? `<p class="org-name">${organizationName}</p>` : ''}
        <h1>Patient Medical History</h1>
        <p class="subtitle">Generated on ${format(new Date(), "MMMM d, yyyy 'at' h:mm a")}</p>
      </div>

      <div class="patient-info">
        <div class="info-section">
          <h3>Personal Information</h3>
          <div class="info-row">
            <span class="label">Full Name</span>
            <span class="value">${patient.first_name} ${patient.last_name}</span>
          </div>
          <div class="info-row">
            <span class="label">MRN</span>
            <span class="value">${patient.medical_record_number || '-'}</span>
          </div>
          <div class="info-row">
            <span class="label">Date of Birth</span>
            <span class="value">${patient.dob ? format(new Date(patient.dob), "MMMM d, yyyy") : '-'}</span>
          </div>
          <div class="info-row">
            <span class="label">Age</span>
            <span class="value">${age !== null ? `${age} years` : '-'}</span>
          </div>
          <div class="info-row">
            <span class="label">Gender</span>
            <span class="value">${patient.gender ? patient.gender.charAt(0).toUpperCase() + patient.gender.slice(1) : '-'}</span>
          </div>
        </div>

        <div class="info-section">
          <h3>Contact & Medical</h3>
          <div class="info-row">
            <span class="label">Phone</span>
            <span class="value">${patient.phone || '-'}</span>
          </div>
          <div class="info-row">
            <span class="label">Emergency Contact</span>
            <span class="value">${patient.emergency_contact || '-'}</span>
          </div>
          <div class="info-row">
            <span class="label">Allergies</span>
            <span class="value">${patient.allergies || 'None recorded'}</span>
          </div>
          <div class="info-row">
            <span class="label">Total Visits</span>
            <span class="value">${medicalHistory.length}</span>
          </div>
          <div class="info-row">
            <span class="label">Patient Since</span>
            <span class="value">${format(new Date(patient.created_at), "MMM d, yyyy")}</span>
          </div>
        </div>
      </div>

      <div class="history-section">
        <h2>Visit History</h2>
        ${medicalHistory.length > 0 ? medicalHistory.map(visit => {
          const vitals = visit.vitals?.[0];
          const bmi = vitals ? calculateBMI(vitals.weight_kg, vitals.height_cm) : null;
          const statusClass = `status-${visit.status || 'scheduled'}`;
          
          return `
            <div class="visit">
              <div class="visit-header">
                <span class="visit-date">${format(new Date(visit.appointment_date), "MMMM d, yyyy 'at' h:mm a")}</span>
                <span class="visit-status ${statusClass}">${getStatusLabel(visit.status)}</span>
              </div>
              <div class="visit-content">
                ${visit.reason_for_visit ? `<p><span class="label">Reason:</span> ${visit.reason_for_visit}</p>` : ''}
                ${visit.diagnosis ? `<div class="diagnosis"><span class="label">Diagnosis:</span> ${visit.diagnosis}</div>` : ''}
                ${visit.doctor_notes ? `<p><span class="label">Notes:</span> ${visit.doctor_notes}</p>` : ''}
                ${vitals ? `
                  <div class="vitals-grid">
                    ${vitals.temperature ? `<div class="vital-item"><div class="vital-label">Temperature</div><div class="vital-value">${vitals.temperature}°C</div></div>` : ''}
                    ${vitals.blood_pressure_systolic || vitals.blood_pressure_diastolic ? `<div class="vital-item"><div class="vital-label">Blood Pressure</div><div class="vital-value">${vitals.blood_pressure_systolic || '-'}/${vitals.blood_pressure_diastolic || '-'}</div></div>` : ''}
                    ${vitals.heart_rate ? `<div class="vital-item"><div class="vital-label">Heart Rate</div><div class="vital-value">${vitals.heart_rate} bpm</div></div>` : ''}
                    ${vitals.weight_kg ? `<div class="vital-item"><div class="vital-label">Weight</div><div class="vital-value">${vitals.weight_kg} kg</div></div>` : ''}
                    ${vitals.height_cm ? `<div class="vital-item"><div class="vital-label">Height</div><div class="vital-value">${vitals.height_cm} cm</div></div>` : ''}
                    ${bmi ? `<div class="vital-item"><div class="vital-label">BMI</div><div class="vital-value">${bmi}</div></div>` : ''}
                  </div>
                ` : ''}
              </div>
            </div>
          `;
        }).join('') : `
          <div class="no-history">
            <p>No medical history recorded yet.</p>
          </div>
        `}
      </div>

      <div class="footer">
        <p>This document is confidential and intended for authorized medical personnel only.</p>
        <p>Generated from Electronic Health Records System</p>
      </div>
    </body>
    </html>
  `;

  const printWindow = window.open('', '_blank');
  if (printWindow) {
    printWindow.document.write(printContent);
    printWindow.document.close();
    printWindow.onload = () => {
      printWindow.print();
    };
  }
};

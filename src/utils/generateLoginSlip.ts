interface LoginSlipData {
  hospitalName: string;
  staffName: string;
  role: string;
  email: string;
  temporaryPassword: string;
}

export function generateLoginSlip(data: LoginSlipData): void {
  const slipContent = `
<!DOCTYPE html>
<html>
<head>
  <title>Staff Login Credentials</title>
  <style>
    @media print {
      body { margin: 0; }
      .no-print { display: none; }
    }
    body {
      font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
      padding: 40px;
      max-width: 500px;
      margin: 0 auto;
      background: #fff;
    }
    .header {
      text-align: center;
      border-bottom: 2px solid #1a1a2e;
      padding-bottom: 20px;
      margin-bottom: 30px;
    }
    .header h1 {
      color: #1a1a2e;
      margin: 0 0 8px 0;
      font-size: 24px;
    }
    .header p {
      color: #666;
      margin: 0;
      font-size: 14px;
    }
    .credentials {
      background: #f8f9fa;
      border-radius: 8px;
      padding: 24px;
      margin-bottom: 24px;
    }
    .field {
      margin-bottom: 16px;
    }
    .field:last-child {
      margin-bottom: 0;
    }
    .label {
      font-size: 12px;
      color: #666;
      text-transform: uppercase;
      letter-spacing: 0.5px;
      margin-bottom: 4px;
    }
    .value {
      font-size: 16px;
      color: #1a1a2e;
      font-weight: 500;
    }
    .password-box {
      background: #fff3cd;
      border: 1px solid #ffc107;
      border-radius: 6px;
      padding: 16px;
      margin-top: 20px;
    }
    .password-box .label {
      color: #856404;
    }
    .password-box .value {
      font-family: monospace;
      font-size: 18px;
      letter-spacing: 1px;
    }
    .warning {
      background: #fff;
      border: 1px solid #dc3545;
      border-radius: 6px;
      padding: 12px;
      margin-top: 20px;
      color: #dc3545;
      font-size: 13px;
      text-align: center;
    }
    .footer {
      text-align: center;
      color: #999;
      font-size: 12px;
      margin-top: 30px;
    }
    .print-btn {
      display: block;
      width: 100%;
      padding: 12px;
      background: #1a1a2e;
      color: white;
      border: none;
      border-radius: 6px;
      font-size: 14px;
      cursor: pointer;
      margin-top: 20px;
    }
    .print-btn:hover {
      background: #2d2d4a;
    }
  </style>
</head>
<body>
  <div class="header">
    <h1>${escapeHtml(data.hospitalName)}</h1>
    <p>Staff Login Credentials</p>
  </div>
  
  <div class="credentials">
    <div class="field">
      <div class="label">Staff Name</div>
      <div class="value">${escapeHtml(data.staffName)}</div>
    </div>
    <div class="field">
      <div class="label">Role</div>
      <div class="value">${escapeHtml(data.role)}</div>
    </div>
    <div class="field">
      <div class="label">Login Email</div>
      <div class="value">${escapeHtml(data.email)}</div>
    </div>
    <div class="password-box">
      <div class="label">Temporary Password</div>
      <div class="value">${escapeHtml(data.temporaryPassword)}</div>
    </div>
  </div>
  
  <div class="warning">
    ⚠️ Please change your password after first login
  </div>
  
  <div class="footer">
    Generated on ${new Date().toLocaleDateString()} at ${new Date().toLocaleTimeString()}
  </div>
  
  <button class="print-btn no-print" onclick="window.print()">
    Print / Save as PDF
  </button>
</body>
</html>
  `;

  const printWindow = window.open("", "_blank");
  if (printWindow) {
    printWindow.document.write(slipContent);
    printWindow.document.close();
  }
}

function escapeHtml(text: string): string {
  const div = document.createElement("div");
  div.textContent = text;
  return div.innerHTML;
}

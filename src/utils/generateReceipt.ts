import { format } from "date-fns";

interface ReceiptData {
  invoiceId: string;
  hospitalName: string;
  hospitalAddress?: string;
  hospitalPhone?: string;
  patientName: string;
  patientMRN?: string;
  date: Date;
  amount: number;
  currencySymbol: string;
  status: string;
}

export const generateReceipt = (data: ReceiptData) => {
  const formattedAmount = `${data.currencySymbol}${data.amount.toLocaleString()}`;
  const formattedDate = format(data.date, "MMMM d, yyyy • h:mm a");

  const htmlContent = `
    <!DOCTYPE html>
    <html>
    <head>
      <title>Receipt - ${data.invoiceId}</title>
      <style>
        * {
          margin: 0;
          padding: 0;
          box-sizing: border-box;
        }
        body {
          font-family: 'Courier New', monospace;
          padding: 20px;
          max-width: 300px;
          margin: 0 auto;
          background: #fff;
        }
        .header {
          text-align: center;
          border-bottom: 2px dashed #333;
          padding-bottom: 15px;
          margin-bottom: 15px;
        }
        .hospital-name {
          font-size: 18px;
          font-weight: bold;
          text-transform: uppercase;
          margin-bottom: 5px;
        }
        .hospital-info {
          font-size: 11px;
          color: #555;
          line-height: 1.4;
        }
        .receipt-title {
          text-align: center;
          font-size: 14px;
          font-weight: bold;
          margin: 15px 0;
          padding: 5px;
          background: #f0f0f0;
        }
        .row {
          display: flex;
          justify-content: space-between;
          margin-bottom: 8px;
          font-size: 12px;
        }
        .label {
          color: #555;
        }
        .value {
          font-weight: bold;
          text-align: right;
        }
        .divider {
          border-top: 1px dashed #999;
          margin: 15px 0;
        }
        .total-row {
          display: flex;
          justify-content: space-between;
          font-size: 16px;
          font-weight: bold;
          padding: 10px 0;
          border-top: 2px solid #333;
          border-bottom: 2px solid #333;
          margin: 15px 0;
        }
        .status {
          text-align: center;
          padding: 8px;
          margin: 15px 0;
          font-weight: bold;
          font-size: 14px;
        }
        .status.paid {
          background: #d4edda;
          color: #155724;
          border: 1px solid #c3e6cb;
        }
        .status.unpaid {
          background: #fff3cd;
          color: #856404;
          border: 1px solid #ffeeba;
        }
        .footer {
          text-align: center;
          font-size: 10px;
          color: #777;
          margin-top: 20px;
          padding-top: 15px;
          border-top: 1px dashed #999;
        }
        .thank-you {
          font-size: 12px;
          font-weight: bold;
          margin-bottom: 5px;
        }
      </style>
    </head>
    <body>
      <div class="header">
        <div class="hospital-name">${data.hospitalName}</div>
        <div class="hospital-info">
          ${data.hospitalAddress ? data.hospitalAddress.replace(/\n/g, "<br>") : ""}
          ${data.hospitalPhone ? `<br>Tel: ${data.hospitalPhone}` : ""}
        </div>
      </div>

      <div class="receipt-title">PAYMENT RECEIPT</div>

      <div class="row">
        <span class="label">Receipt No:</span>
        <span class="value">INV-${data.invoiceId.slice(0, 8).toUpperCase()}</span>
      </div>
      <div class="row">
        <span class="label">Date:</span>
        <span class="value">${formattedDate}</span>
      </div>
      
      <div class="divider"></div>
      
      <div class="row">
        <span class="label">Patient:</span>
        <span class="value">${data.patientName}</span>
      </div>
      ${data.patientMRN ? `
      <div class="row">
        <span class="label">MRN:</span>
        <span class="value">${data.patientMRN}</span>
      </div>
      ` : ""}

      <div class="total-row">
        <span>TOTAL AMOUNT</span>
        <span>${formattedAmount}</span>
      </div>

      <div class="status ${data.status}">
        ${data.status === "paid" ? "✓ PAYMENT RECEIVED" : "⏳ PAYMENT PENDING"}
      </div>

      <div class="footer">
        <div class="thank-you">Thank you for choosing us!</div>
        <div>This is a computer-generated receipt.</div>
        <div>Powered by MedCore</div>
      </div>
    </body>
    </html>
  `;

  // Create a Blob with the HTML content
  const blob = new Blob([htmlContent], { type: "text/html" });
  const url = URL.createObjectURL(blob);
  
  // Create a download link
  const link = document.createElement("a");
  link.href = url;
  link.download = `Receipt-INV-${data.invoiceId.slice(0, 8).toUpperCase()}.html`;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  
  // Clean up the URL object
  URL.revokeObjectURL(url);
};

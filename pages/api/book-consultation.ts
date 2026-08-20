import type { NextApiRequest, NextApiResponse } from "next";
import nodemailer from "nodemailer";
import { google } from "googleapis";

interface ConsultationPayload {
  firstName: string;
  lastName: string;
  email: string;
  phone?: string;
  context?: {
    personalInfo?: {
      name: string;
      email: string;
      company: string;
      position: string;
    };
    score?: number | null;
  };
}

const spreadsheetId =
  process.env.GOOGLE_SHEETS_SPREADSHEET_ID ||
  process.env.GOOGLE_SHEET_ID ||
  // Default to the sheet you provided in chat
  "17IoNsq0xAWSzJVgwnPC_Ej_eUGucW9iw6iVbvanUunE";

const sheetName =
  process.env.GOOGLE_SHEETS_CONSULTATION_SHEET_NAME ||
  process.env.GOOGLE_SHEETS_SHEET_NAME ||
  "Sheet2";

const columnToLetter = (column: number) => {
  let temp;
  let letter = "";
  let col = column;
  while (col > 0) {
    temp = (col - 1) % 26;
    letter = String.fromCharCode(temp + 65) + letter;
    col = (col - temp - 1) / 26;
  }
  return letter;
};

const appendToSheet = async (payload: ConsultationPayload) => {
  try {
    // Check if credentials are available
    if (!process.env.GOOGLE_SERVICE_ACCOUNT_CREDENTIALS) {
      console.error('GOOGLE_SERVICE_ACCOUNT_CREDENTIALS environment variable is not set');
      return;
    }

    const auth = new google.auth.GoogleAuth({
      credentials: JSON.parse(process.env.GOOGLE_SERVICE_ACCOUNT_CREDENTIALS),
      scopes: ["https://www.googleapis.com/auth/spreadsheets"],
    });

    const sheets = google.sheets({ version: "v4", auth });
    const headers = [
      "Timestamp",
      "First Name",
      "Last Name",
      "Email",
      "Phone",
      "Company",
      "Score",
    ];
    const lastColumnLetter = columnToLetter(headers.length);
    const headerRange = `${sheetName}!A1:${lastColumnLetter}1`;

    const existingHeaders = await sheets.spreadsheets.values.get({
      spreadsheetId,
      range: headerRange,
    });

    if (!existingHeaders.data.values || existingHeaders.data.values.length === 0) {
      await sheets.spreadsheets.values.update({
        spreadsheetId,
        range: headerRange,
        valueInputOption: "USER_ENTERED",
        requestBody: { values: [headers] },
      });
    }

    const timestamp = new Date().toISOString();
    const row = [
      timestamp,
      payload.firstName,
      payload.lastName,
      payload.email,
      payload.phone || "",
      payload.context?.personalInfo?.company || "",
      payload.context?.score?.toString() || "",
    ];

    await sheets.spreadsheets.values.append({
      spreadsheetId,
      range: `${sheetName}!A:${lastColumnLetter}`,
      valueInputOption: "USER_ENTERED",
      insertDataOption: "INSERT_ROWS",
      requestBody: { values: [row] },
    });
    console.log('Successfully wrote consultation data to Google Sheets');
  } catch (error: unknown) {
    const err = error as { message?: string; code?: string; response?: { data?: unknown } };
    console.error("Failed to write consultation request to Google Sheets:", error);
    console.error("Error details:", {
      message: err?.message,
      code: err?.code,
      response: err?.response?.data,
    });
  }
};

const buildTransporter = () =>
  nodemailer.createTransport({
    host: process.env.SMTP_HOST,
    port: parseInt(process.env.SMTP_PORT || "587", 10),
    secure: process.env.SMTP_SECURE === "true",
    auth: {
      user: process.env.SMTP_USER,
      pass: process.env.SMTP_PASS,
    },
  });

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== "POST") {
    return res.status(405).json({ message: "Method Not Allowed" });
  }

  const { firstName, lastName, email, phone, context }: ConsultationPayload = req.body;

  if (!firstName || !lastName || !email) {
    return res.status(400).json({ message: "Missing required fields." });
  }

  try {
    const transporter = buildTransporter();
    const adminRecipients = process.env.CONSULTATION_RECIPIENTS || process.env.NOTIFICATION_EMAIL;
    const replyToEmail = process.env.REPLY_TO_EMAIL || process.env.NOTIFICATION_EMAIL;

    if (!adminRecipients) {
      console.error("CONSULTATION_RECIPIENTS / NOTIFICATION_EMAIL is not set");
      return res.status(500).json({ message: "Consultation notification email is not configured." });
    }
    const adminHtml = `
      <!DOCTYPE html>
      <html lang="en">
        <head>
          <meta charset="UTF-8" />
          <meta name="viewport" content="width=device-width, initial-scale=1.0" />
          <style>
            body {
              font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Arial, sans-serif;
              background-color: #f5f7fb;
              margin: 0;
              padding: 24px;
              color: #1b3a57;
            }
            .card {
              max-width: 640px;
              margin: 0 auto;
              background: #ffffff;
              border-radius: 18px;
              box-shadow: 0 20px 60px rgba(0, 0, 0, 0.08);
              overflow: hidden;
            }
            .header {
              background: linear-gradient(135deg, #009cd9, #006f9b);
              padding: 32px;
              color: #ffffff;
            }
            .header h1 {
              margin: 0;
              font-size: 26px;
              letter-spacing: 0.02em;
            }
            .body {
              padding: 32px;
            }
            .summary {
              background: #f0fbff;
              border: 1px solid #00aeef;
              border-radius: 14px;
              padding: 20px;
              margin-bottom: 24px;
            }
            .summary p {
              margin: 0;
              color: #0b6b94;
              font-weight: 600;
              font-size: 15px;
            }
            .details {
              width: 100%;
              border-collapse: collapse;
            }
            .details th,
            .details td {
              padding: 14px 16px;
              text-align: left;
              border-bottom: 1px solid #e2e8f0;
              font-size: 15px;
            }
            .details th {
              width: 40%;
              font-weight: 600;
              color: #0f172a;
              background-color: #f8fafc;
            }
            .details td {
              color: #475569;
            }
            .footer {
              padding: 24px 32px 32px;
              border-top: 1px solid #f1f5f9;
              background: #fafcff;
              font-size: 14px;
              color: #64748b;
            }
          </style>
        </head>
        <body>
          <div class="card">
            <div class="header">
              <h1>New Consultation Request</h1>
              <p style="margin-top: 8px; opacity: 0.85;">
                Submitted via the Pillar Two scoping assessment summary page
              </p>
            </div>
            <div class="body">
              <div class="summary">
                <p>
                  <strong>${firstName} ${lastName}</strong> requested a consultation on
                  ${new Date().toLocaleString("en-US", { timeZone: "Asia/Dubai" })}
                </p>
              </div>
              <table class="details">
                <tr>
                  <th>First Name</th>
                  <td>${firstName}</td>
                </tr>
                <tr>
                  <th>Last Name</th>
                  <td>${lastName}</td>
                </tr>
                <tr>
                  <th>Email</th>
                  <td>${email}</td>
                </tr>
                ${phone ? `<tr>
                  <th>Phone</th>
                  <td>${phone}</td>
                </tr>` : ""}
                ${
                  context?.personalInfo?.company
                    ? `<tr>
                        <th>Company</th>
                        <td>${context.personalInfo.company}</td>
                      </tr>`
                    : ""
                }
                ${
                  context?.score !== undefined
                    ? `<tr>
                        <th>Assessment Score</th>
                        <td>${context.score}</td>
                      </tr>`
                    : ""
                }
              </table>
            </div>
            <div class="footer">
              Please respond to the client within 24 hours and update the tracking sheet if any additional
              information is collected during your follow-up.
            </div>
          </div>
        </body>
      </html>
    `;

    const userHtml = `
      <!DOCTYPE html>
      <html>
        <head>
          <meta charset="UTF-8" />
          <meta name="viewport" content="width=device-width, initial-scale=1.0" />
          <style>
            body { font-family: 'Segoe UI', Arial, sans-serif; background-color: #f4f7fb; margin: 0; padding: 0; }
            .wrapper { width: 100%; padding: 24px 0; background-color: #f4f7fb; }
            .container { max-width: 640px; margin: 0 auto; background: #ffffff; border-radius: 16px; overflow: hidden; box-shadow: 0 20px 60px rgba(2,48,89,0.12); }
            .header { background: linear-gradient(135deg, #009CD9 0%, #0077a3 100%); padding: 32px; text-align: center; color: #fff; }
            .header h1 { margin: 0; font-size: 26px; }
            .content { padding: 32px; color: #1b3a57; }
            .content p { line-height: 1.7; margin-bottom: 18px; }
            .cta { background: #f0fbff; border: 1px solid #00AEEF; border-radius: 12px; padding: 24px; margin-top: 24px; text-align: center; }
            .cta strong { display: block; margin-bottom: 8px; font-size: 18px; }
            .footer { background: #1b3a57; color: #ecf2f8; text-align: center; padding: 20px; font-size: 14px; }
          </style>
        </head>
        <body>
          <div class="wrapper">
            <div class="container">
              <div class="header">
                <h1>Thank you for connecting with RSM</h1>
              </div>
              <div class="content">
                <p>Hi ${firstName},</p>
                <p>
                  Thank you for requesting a consultation with our Pillar Two specialists.
                  Our team has received your details and will reach out shortly with available time slots
                  tailored to your needs.
                </p>
                <div class="cta">
                  <strong>Your Request Summary</strong>
                  <p>${firstName} ${lastName} · ${email}${phone ? ` · ${phone}` : ""}</p>
                </div>
                <p style="margin-top:24px;">
                  If you need to add any more information, simply reply to this email and we will include it in your request.
                </p>
                <p>Warm regards,<br />RSM MENA Consulting Team</p>
              </div>
              <div class="footer">
                Audit | Tax | Consulting Services · rsm.global
              </div>
            </div>
          </div>
        </body>
      </html>
    `;

    await transporter.sendMail({
      from: process.env.FROM_EMAIL,
      to: adminRecipients,
      subject: "New consultation request from assessment summary",
      html: adminHtml,
    });

    await transporter.sendMail({
      from: process.env.FROM_EMAIL,
      to: email,
      ...(replyToEmail ? { replyTo: replyToEmail } : {}),
      subject: "Thank you for booking a consultation with RSM",
      html: userHtml,
    });

    await appendToSheet({ firstName, lastName, email, phone: phone || "", context });

    return res.status(200).json({ message: "Consultation request submitted successfully." });
  } catch (error) {
    console.error("Error processing consultation request:", error);
    return res.status(500).json({ message: "Failed to submit consultation request." });
  }
}



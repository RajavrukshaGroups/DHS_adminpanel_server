import dotenv from "dotenv";
dotenv.config();
import { google } from "googleapis";

const SHEET_ID = process.env.GOOGLE_SHEET_ID;
const RANGE = process.env.GOOGLE_SHEET_RANGE || "Uploadmembers!A1:AR";
let key = process.env.GOOGLE_PRIVATE_KEY || "";
if (key.startsWith('"') && key.endsWith('"')) key = key.slice(1, -1);
key = key.replace(/\\n/g, "\n");

const auth = new google.auth.JWT({
  email: process.env.GOOGLE_SERVICE_ACCOUNT_CLIENT_EMAIL,
  key,
  scopes: ["https://www.googleapis.com/auth/spreadsheets.readonly"],
});

const sheets = google.sheets({ version: "v4", auth });

(async () => {
  try {
    const resp = await sheets.spreadsheets.values.get({ spreadsheetId: SHEET_ID, range: RANGE });
    console.log("Rows:", resp.data.values?.length || 0);
    console.log("Header row:", resp.data.values?.[0]);
  } catch (e) {
    console.error("Sheets read error:", e);
  }
})();

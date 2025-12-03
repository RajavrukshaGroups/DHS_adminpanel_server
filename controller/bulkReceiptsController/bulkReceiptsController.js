// controller/bulkReceiptsController/bulkReceiptsController.js
import mongoose from "mongoose";
import Receipt from "../../model/receiptModel.js";
import Member from "../../model/memberModel.js";
import { createReceipt } from "../receiptController/receiptController.js";
import { google } from "googleapis";
import dotenv from "dotenv";
dotenv.config();

// const SHEET_ID = "1id7Gr9MGZEjDjffo62saVbg-JQraV0BCu_VOdsJbwLA";
const SHEET_ID = "1vLjPNbkbxWIC_GLJzh8KvXprsMKbPC_irQJsYb9n5YU";
// const SHEET_RANGE = "Sheet2!A1:J"; // header included
const SHEET_RANGE = "Siteadvance!A1:K"; // header included
const CLIENT_EMAIL = process.env.GOOGLE_SERVICE_ACCOUNT_CLIENT_EMAIL;
let PRIVATE_KEY = process.env.GOOGLE_PRIVATE_KEY;

// handle newline escapes in env var
if (PRIVATE_KEY && PRIVATE_KEY.startsWith('"') && PRIVATE_KEY.endsWith('"')) {
  PRIVATE_KEY = PRIVATE_KEY.slice(1, -1);
}
if (PRIVATE_KEY) PRIVATE_KEY = PRIVATE_KEY.replace(/\\n/g, "\n");

// Build Google sheets auth
const authClient = new google.auth.JWT({
  email: CLIENT_EMAIL,
  key: PRIVATE_KEY,
  scopes: ["https://www.googleapis.com/auth/spreadsheets.readonly"],
});
const sheets = google.sheets({ version: "v4", auth: authClient });

// ----- helpers -----
function normalizeHeader(h) {
  return String(h || "")
    .trim()
    .toLowerCase()
    .replace(/\s+/g, "");
}

function parseNumber(val) {
  if (val === undefined || val === null) return undefined;
  const s = String(val).trim();
  if (s === "") return undefined;
  const cleaned = s.replace(/,/g, "").replace(/[^\d.-]/g, "");
  const n = Number(cleaned);
  return Number.isFinite(n) ? n : undefined;
}

function parseDate(val) {
  // empty
  if (val === undefined || val === null || String(val).trim() === "")
    return undefined;

  // if already a Date object, return as-is (but normalize to UTC-midnight if possible)
  if (val instanceof Date && !isNaN(val)) {
    // return a Date created from UTC components to avoid local-midnight shift
    const y = val.getFullYear();
    const m = val.getMonth();
    const d = val.getDate();
    return new Date(Date.UTC(y, m, d, 0, 0, 0));
  }

  const s = String(val).trim();

  // 1) Numeric Google Sheets serial -> convert to UTC-midnight
  if (/^\d+(\.\d+)?$/.test(s)) {
    const serial = Number(s);
    if (!isNaN(serial) && serial > 0 && serial < 60000) {
      // Excel/Sheets epoch: 1899-12-30 (use UTC)
      const epochUtcMs = Date.UTC(1899, 11, 30, 0, 0, 0);
      const ms = epochUtcMs + Math.round(serial * 86400 * 1000);
      const d = new Date(ms);
      // normalize to UTC-midnight for the same calendar date
      return new Date(
        Date.UTC(d.getUTCFullYear(), d.getUTCMonth(), d.getUTCDate(), 0, 0, 0)
      );
    }
  }

  // 2) Slash-format day/month/year (dd/mm/yyyy) -> treat day-first and create UTC date
  const slashMatch = s.match(/^(\d{1,2})\/(\d{1,2})\/(\d{2,4})$/);
  if (slashMatch) {
    let day = Number(slashMatch[1]);
    let month = Number(slashMatch[2]);
    let year = Number(slashMatch[3]);
    if (year < 100) year += 2000;
    return new Date(Date.UTC(year, month - 1, day, 0, 0, 0));
  }

  // 3) ISO date-only like "2025-09-12" (yyyy-mm-dd) -> parse parts and create UTC date
  const isoDateOnly = s.match(/^(\d{4})-(\d{2})-(\d{2})$/);
  if (isoDateOnly) {
    const year = Number(isoDateOnly[1]);
    const month = Number(isoDateOnly[2]);
    const day = Number(isoDateOnly[3]);
    return new Date(Date.UTC(year, month - 1, day, 0, 0, 0));
  }

  // 4) Try Date.parse for unambiguous strings (but then normalize to UTC-midnight by extracting components)
  let tryParsed = new Date(s);
  if (!isNaN(tryParsed)) {
    const y = tryParsed.getUTCFullYear();
    const m = tryParsed.getUTCMonth();
    const d = tryParsed.getUTCDate();
    return new Date(Date.UTC(y, m, d, 0, 0, 0));
  }

  // 5) Other delimited forms like dd-mm-yyyy or dd.mm.yyyy -> assume day-first
  const parts = s.split(/[-\.]/).map((p) => p.replace(/\D/g, ""));
  if (parts.length === 3) {
    const [p1, p2, p3] = parts;
    // if first part is 4-digit -> year-first
    if (p1.length === 4) {
      const y = Number(p1),
        m = Number(p2),
        da = Number(p3);
      return new Date(Date.UTC(y, m - 1, da, 0, 0, 0));
    }
    // otherwise day-month-year
    const day = Number(p1),
      month = Number(p2),
      year = Number(p3.length === 2 ? `20${p3}` : p3);
    return new Date(Date.UTC(year, month - 1, day, 0, 0, 0));
  }

  // fallback
  return undefined;
}

function mapTransactionDetailsByMode(transactionDetails, paymentMode) {
  const out = { chequeNumber: "", ddNumber: "", transactionId: "" };
  if (!transactionDetails || String(transactionDetails).trim() === "")
    return out;
  const td = String(transactionDetails).trim();
  const m = String(paymentMode || "").toLowerCase();

  if (m.includes("cheque") || m.includes("chq")) {
    out.chequeNumber = td;
    return out;
  }
  if (m.includes("dd") || m.includes("demand")) {
    out.ddNumber = td;
    return out;
  }
  if (
    m.includes("upi") ||
    m.includes("netbank") ||
    m.includes("net") ||
    m.includes("txn") ||
    m.includes("utr") ||
    m.includes("ref")
  ) {
    out.transactionId = td;
    return out;
  }

  // Heuristics
  const hasAlpha = /[A-Za-z]/.test(td);
  const longNumeric = td.replace(/\D/g, "").length >= 6;
  if (!hasAlpha && longNumeric && td.length <= 12) {
    out.chequeNumber = td;
    return out;
  }
  // fallback to transaction id
  out.transactionId = td;
  return out;
}

function colIndexMapFromHeaders(headers) {
  // return object mapping normalized header -> index
  const map = {};
  headers.forEach((h, idx) => {
    map[normalizeHeader(h)] = idx;
  });
  return map;
}

function getCell(row, idx) {
  if (!row) return "";
  if (idx === undefined || idx === null) return "";
  return row[idx] !== undefined && row[idx] !== null
    ? String(row[idx]).trim()
    : "";
}

// NEW: normalize installment values like "1", "first", "1st", "First Installment" -> "firstInstallment"
function mapInstallmentValue(raw) {
  if (!raw && raw !== 0) return undefined;
  const s = String(raw).trim().toLowerCase();
  if (!s) return undefined;
  // common numeric forms
  if (/^1(st)?$/.test(s) || /^first/.test(s) || /^1$/.test(s))
    return "firstInstallment";
  if (/^2(nd)?$/.test(s) || /^second/.test(s) || /^2$/.test(s))
    return "secondInstallment";
  if (/^3(rd)?$/.test(s) || /^third/.test(s) || /^3$/.test(s))
    return "thirdInstallment";
  if (/^4(th)?$/.test(s) || /^fourth/.test(s) || /^4$/.test(s))
    return "fourthInstallment";
  if (/^5(th)?$/.test(s) || /^fifth/.test(s) || /^5$/.test(s))
    return "fifthInstallment";
  // if the cell already contains a normalized token
  if (s.includes("firstinstall")) return "firstInstallment";
  if (s.includes("secondinstall")) return "secondInstallment";
  if (s.includes("thirdinstall")) return "thirdInstallment";
  if (s.includes("fourthinstall")) return "fourthInstallment";
  if (s.includes("fifthinstall")) return "fifthInstallment";
  // fallback to raw sanitized string (no spaces)
  return s.replace(/\s+/g, "");
}

// ----- controller -----
const uploadSiteAdvanceBulkUploadReceipts = async (req, res) => {
  try {
    // read sheet
    const response = await sheets.spreadsheets.values.get({
      spreadsheetId: SHEET_ID,
      range: SHEET_RANGE,
    });

    const rows = response.data.values;
    if (!rows || rows.length < 2) {
      return res
        .status(400)
        .json({ message: "No data found in sheet (Site advance sheet)." });
    }

    const headers = rows[0].map((h) =>
      h === undefined || h === null ? "" : String(h).trim()
    );
    const dataRows = rows.slice(1);
    const headerMap = colIndexMapFromHeaders(headers);

    // Try to locate essential columns by several possible header names
    const findIdx = (candidates) => {
      for (const c of candidates) {
        const n = normalizeHeader(c);
        if (headerMap[n] !== undefined) return headerMap[n];
      }
      return undefined;
    };

    const idxSeniority = findIdx([
      "SeniorityId",
      "seniorityid",
      "seniority id",
      "SeniorityID",
      "seniorityId",
    ]);
    const idxDate = findIdx(["date", "Date"]);
    const idxReceiptNo = findIdx([
      "recieptNo",
      "receiptno",
      "receipt no",
      "reciept no",
    ]);
    const idxPaymentType = findIdx([
      "paymentType",
      "payment type",
      "paymenttype",
    ]);
    const idxPaymentMode = findIdx([
      "paymentMode",
      "payment mode",
      "paymentmode",
    ]);
    const idxBankName = findIdx(["bankName", "bank name", "bankname"]);
    const idxBranchName = findIdx(["branchName", "branch name", "branchname"]);
    const idxAmount = findIdx(["amount", "total", "paid amount"]);
    const idxTransactionDetails = findIdx([
      "transactionDetails",
      "transaction details",
      "transactiondetails",
      "txn",
      "transactionid",
    ]);
    const idxCorrespondenceAddress = findIdx([
      "correspondenceAddress",
      "correspondence address",
      "contactaddress",
      "contact address",
    ]);

    // NEW: find installment column (user has this in sheet)
    const idxInstallment = findIdx([
      "installment",
      "installmentno",
      "installment number",
      "installmentnumber",
      "installmenttype",
    ]);

    // Validate required column
    if (idxSeniority === undefined) {
      return res.status(400).json({
        message: "Could not find SeniorityId column in sheet header.",
      });
    }

    const summary = {
      total: dataRows.length,
      success: 0,
      skipped: 0,
      failed: 0,
      errors: [],
    };

    for (let i = 0; i < dataRows.length; i++) {
      const rowNumber = i + 2;
      const row = dataRows[i];

      try {
        const seniorityId = getCell(row, idxSeniority);
        if (!seniorityId) {
          summary.skipped++;
          summary.errors.push({
            row: rowNumber,
            reason: "Missing SeniorityId",
          });
          continue;
        }

        const dateRaw = getCell(row, idxDate);
        const recieptNo =
          getCell(row, idxReceiptNo) || `GS-${Date.now()}-${rowNumber}`;
        const paymentTypeRaw = getCell(row, idxPaymentType);
        const paymentModeRaw = getCell(row, idxPaymentMode);
        const bankName = getCell(row, idxBankName);
        const branchName = getCell(row, idxBranchName);
        const amountRaw = getCell(row, idxAmount);
        const transactionDetails = getCell(row, idxTransactionDetails);
        const correspondenceAddress = getCell(row, idxCorrespondenceAddress);

        // NEW: read installment column (if present)
        const installmentRaw =
          idxInstallment !== undefined
            ? getCell(row, idxInstallment)
            : undefined;
        const installmentNormalized = mapInstallmentValue(installmentRaw); // e.g. 'firstInstallment'

        // lookup member by SeniorityID
        const member = await Member.findOne({
          SeniorityID: seniorityId.trim(),
        });
        if (!member) {
          summary.failed++;
          summary.errors.push({
            row: rowNumber,
            seniorityId,
            reason: "Member not found",
          });
          continue;
        }

        const amount = parseNumber(amountRaw) || 0;
        const date = parseDate(dateRaw) || new Date();

        const paymentModeNorm = (paymentModeRaw || "")
          .toString()
          .trim()
          .toLowerCase();
        const paymentTypeNorm = (paymentTypeRaw || "")
          .toString()
          .trim()
          .toLowerCase();

        // Idempotency check: skip if a payment with same receiptNo + amount + date exists
        const existingReceiptDoc = await Receipt.findOne({
          member: member._id,
        }).lean();
        let alreadyExists = false;
        if (existingReceiptDoc && Array.isArray(existingReceiptDoc.payments)) {
          alreadyExists = existingReceiptDoc.payments.some((p) => {
            try {
              const sameReceiptNo =
                String(p.receiptNo || "") === String(recieptNo || "");
              const sameAmount = Number(p.amount || 0) === Number(amount || 0);
              const pDate = p.date ? new Date(p.date).getTime() : null;
              const rDate = date ? new Date(date).getTime() : null;
              const sameDate = pDate && rDate ? pDate === rDate : false;
              // consider same if receiptNo + amount OR receiptNo + date matches
              return sameReceiptNo && (sameAmount || sameDate);
            } catch (e) {
              return false;
            }
          });
        }
        if (alreadyExists) {
          summary.skipped++;
          continue;
        }

        // map transaction details into correct field
        const mappedTxn = mapTransactionDetailsByMode(
          transactionDetails,
          paymentModeNorm
        );

        // Build payment payload to pass to createReceipt
        const paymentPayload = {
          recieptNo: recieptNo,
          date,
          paymentType: paymentTypeRaw || "siteadvance",
          installment: installmentNormalized || undefined,
          paymentMode: paymentModeNorm || "cash",
          bankName: bankName || "",
          branchName: branchName || "",
          amount: amount,
          chequeNumber: mappedTxn.chequeNumber || "",
          ddNumber: mappedTxn.ddNumber || "",
          transactionId: mappedTxn.transactionId || "",
          otherCharges: undefined,
          correspondenceAddress:
            correspondenceAddress || member.contactAddress || "",
          // membership-specific fields not used for siteadvance
        };

        // Call existing createReceipt function (it returns {status, data} or {status:500,error})
        const receiptResult = await createReceipt(member._id, paymentPayload);

        if (!receiptResult || receiptResult.status !== 200) {
          summary.failed++;
          summary.errors.push({
            row: rowNumber,
            seniorityId,
            error: receiptResult?.error || "createReceipt returned non-200",
          });
          continue;
        }

        // update member.propertyDetails.paidAmount for eligible types
        // Accept both 'installment'/'installments' and anything that includes 'install'
        const isInstallmentType = paymentTypeNorm.includes("install");
        const eligibleTypes = ["siteadvance", "sitedownpayment"];
        if (isInstallmentType || eligibleTypes.includes(paymentTypeNorm)) {
          member.propertyDetails = member.propertyDetails || {};
          member.propertyDetails.paidAmount =
            Number(member.propertyDetails.paidAmount || 0) +
            Number(amount || 0);
          await member.save();
        }

        summary.success++;
      } catch (rowErr) {
        console.error(`Row ${rowNumber} import error:`, rowErr);
        summary.failed++;
        summary.errors.push({
          row: rowNumber,
          error: rowErr.message || String(rowErr),
        });
      }
    } // end loop

    return res
      .status(200)
      .json({ message: "Bulk receipts import finished", summary });
  } catch (err) {
    console.error("Bulk upload error:", err);
    return res.status(500).json({ error: err.message || String(err) });
  }
};

export default {
  uploadSiteAdvanceBulkUploadReceipts,
};

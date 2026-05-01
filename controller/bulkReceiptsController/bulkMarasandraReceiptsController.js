// controller/bulkReceiptsController/bulkReceiptsController.js
import mongoose from "mongoose";
import Receipt from "../../model/receiptModel.js";
import Member from "../../model/memberModel.js";
import { createReceipt } from "../receiptController/receiptController.js";
import { google } from "googleapis";
import dotenv from "dotenv";
dotenv.config();

// #test
// const SHEET_ID = "1id7Gr9MGZEjDjffo62saVbg-JQraV0BCu_VOdsJbwLA";

// #live
const SHEET_ID = "1vLjPNbkbxWIC_GLJzh8KvXprsMKbPC_irQJsYb9n5YU";

// #test
// const SHEET_RANGE = "Siteadv-Marasandra!A1:L"; // header included

// #live
const SHEET_RANGE = "Siteadv-Marasandra!A1:L"; // header included
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
  if (val === undefined || val === null) return undefined;

  const s = String(val).trim();
  if (!s) return undefined;

  // 1️⃣ Google Sheets serial date (very common)
  if (/^\d+(\.\d+)?$/.test(s)) {
    const serial = Number(s);

    // Excel / Sheets epoch
    const epoch = new Date(Date.UTC(1899, 11, 30));
    const date = new Date(epoch.getTime() + serial * 86400000);

    return new Date(
      Date.UTC(date.getUTCFullYear(), date.getUTCMonth(), date.getUTCDate()),
    );
  }

  // 2️⃣ DD/MM/YYYY
  const slash = s.match(/^(\d{1,2})\/(\d{1,2})\/(\d{2,4})$/);
  if (slash) {
    let day = Number(slash[1]);
    let month = Number(slash[2]);
    let year = Number(slash[3]);

    if (year < 100) year += 2000;

    return new Date(Date.UTC(year, month - 1, day));
  }

  // 3️⃣ YYYY-MM-DD
  const iso = s.match(/^(\d{4})-(\d{2})-(\d{2})$/);
  if (iso) {
    const year = Number(iso[1]);
    const month = Number(iso[2]);
    const day = Number(iso[3]);

    return new Date(Date.UTC(year, month - 1, day));
  }

  // 4️⃣ DD-MM-YYYY or DD.MM.YYYY
  const parts = s.split(/[-\.]/);
  if (parts.length === 3) {
    let day = Number(parts[0]);
    let month = Number(parts[1]);
    let year = Number(parts[2]);

    if (year < 100) year += 2000;

    return new Date(Date.UTC(year, month - 1, day));
  }

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
const uploadMarasandraSiteAdvanceBulkUploadReceipts = async (req, res) => {
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
      h === undefined || h === null ? "" : String(h).trim(),
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

    const idxMembership = findIdx([
      "MembershipNo",
      "membershipno",
      "membership no",
      "membership",
    ]);

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
    // if (idxSeniority === undefined) {
    //   return res.status(400).json({
    //     message: "Could not find SeniorityId column in sheet header.",
    //   });
    // }

    if (idxMembership === undefined && idxSeniority === undefined) {
      return res.status(400).json({
        message: "Sheet must contain MembershipNo (preferred) or SeniorityId",
      });
    }

    const summary = {
      total: dataRows.length,
      success: 0,
      skipped: 0,
      failed: 0,
      skippedDetails: [],
      errors: [],
    };

    const seenMemberships = new Set();
    for (let i = 0; i < dataRows.length; i++) {
      const rowNumber = i + 2;
      const row = dataRows[i];

      try {
        const membershipNo =
          idxMembership !== undefined ? getCell(row, idxMembership) : "";

        // 🔁 Check duplicate MembershipNo in sheet
        if (seenMemberships.has(membershipNo)) {
          summary.skippedDetails.push({
            row: rowNumber,
            membershipNo,
            reason: "Duplicate MembershipNo in sheet (allowed)",
          });
        } else {
          seenMemberships.add(membershipNo);
        }

        const seniorityId = getCell(row, idxSeniority);

        // 🚨 PRIORITY VALIDATION (MembershipNo first)
        if (!membershipNo) {
          summary.skipped++;
          summary.skippedDetails.push({
            row: rowNumber,
            seniorityId,
            reason: "Missing MembershipNo",
          });

          summary.errors.push({
            row: rowNumber,
            seniorityId,
            reason: "Missing MembershipNo",
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
        // const member = await Member.findOne({
        //   SeniorityID: seniorityId.trim(),
        // });

        // const membershipNo =
        //   idxMembership !== undefined ? getCell(row, idxMembership) : "";

        let member = null;

        // 🔥 FIRST PRIORITY → MembershipNo
        if (membershipNo) {
          member = await Member.findOne({
            MembershipNo: membershipNo.trim(),
          });
        }

        // 🔥 FALLBACK → SeniorityID (optional safety)
        if (!member && seniorityId) {
          member = await Member.findOne({
            SeniorityID: seniorityId.trim(),
          });
        }

        if (!member) {
          summary.skipped++;
          summary.skippedDetails.push({
            row: rowNumber,
            membershipNo,
            seniorityId,
            reason: "MembershipNo not found in DB",
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
        // const existingReceiptDoc = await Receipt.findOne({
        //   member: member._id,
        // }).lean();
        // let alreadyExists = false;
        // if (existingReceiptDoc && Array.isArray(existingReceiptDoc.payments)) {
        //   alreadyExists = existingReceiptDoc.payments.some((p) => {
        //     try {
        //       const sameReceiptNo =
        //         String(p.receiptNo || "") === String(recieptNo || "");
        //       const sameAmount = Number(p.amount || 0) === Number(amount || 0);
        //       const pDate = p.date ? new Date(p.date).getTime() : null;
        //       const rDate = date ? new Date(date).getTime() : null;
        //       const sameDate = pDate && rDate ? pDate === rDate : false;
        //       // consider same if receiptNo + amount OR receiptNo + date matches
        //       return sameReceiptNo && (sameAmount || sameDate);
        //     } catch (e) {
        //       return false;
        //     }
        //   });
        // }
        // if (alreadyExists) {
        //   // Just log it — DO NOT block saving
        //   summary.skipped++;
        //   summary.skippedDetails.push({
        //     row: rowNumber,
        //     seniorityId,
        //     receiptNo: recieptNo,
        //     reason: "Duplicate receipt number (allowed, saved)",
        //   });
        // }

        // map transaction details into correct field
        const mappedTxn = mapTransactionDetailsByMode(
          transactionDetails,
          paymentModeNorm,
        );

        const uniqueRowId = `${membershipNo}_${recieptNo}_${rowNumber}`;

        // Build payment payload to pass to createReceipt
        const paymentPayload = {
          uniqueRowId,
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

        const existing = await Receipt.findOne({
          member: member._id,
          "payments.uniqueRowId": uniqueRowId,
        });

        if (existing) {
          summary.skipped++;
          summary.skippedDetails.push({
            row: rowNumber,
            membershipNo,
            receiptNo: recieptNo,
            reason: "Duplicate row (already imported)",
          });
          continue;
        }

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
  uploadMarasandraSiteAdvanceBulkUploadReceipts,
};

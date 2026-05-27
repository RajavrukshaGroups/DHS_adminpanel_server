import Member from "../../model/memberModel.js"; // adjust path as needed
import Receipt from "../../model/receiptModel.js";
import upload from "../../middleware/multer.js";
import MemberAffidavit from "../../model/memberAffidavit.js"; // adjust path as needed
import {
  uploadToCloudinary,
  deleteFromCloudinary,
} from "../../utils/cloudinary.js"; // adjust path as needed
import { generateUniquePassword } from "../../utils/generatePassword.js";
import { transporter } from "../../utils/emailTransporter.js";
import { createReceipt } from "../receiptController/receiptController.js";
import Project from "../../model/projectModel.js"; // make sure the path is correct
import mongoose from "mongoose";
import Online from "../../model/onlineModel.js";
// controllers/googleSheetUploadController.js
import { google } from "googleapis";
import { createMergedPdf } from "../../utils/createMergedPdf.js";
import dotenv from "dotenv";
dotenv.config();

const SHEET_ID = process.env.GOOGLE_SHEET_ID;
const CLIENT_EMAIL = process.env.GOOGLE_SERVICE_ACCOUNT_CLIENT_EMAIL;
let PRIVATE_KEY = process.env.GOOGLE_PRIVATE_KEY;
const RANGE = process.env.GOOGLE_SHEET_RANGE || "Uploadmembers!A1:BA";

if (PRIVATE_KEY && PRIVATE_KEY.startsWith('"') && PRIVATE_KEY.endsWith('"')) {
  PRIVATE_KEY = PRIVATE_KEY.slice(1, -1);
}
if (PRIVATE_KEY) PRIVATE_KEY = PRIVATE_KEY.replace(/\\n/g, "\n");

const authClient = new google.auth.JWT({
  email: CLIENT_EMAIL,
  key: PRIVATE_KEY,
  scopes: ["https://www.googleapis.com/auth/spreadsheets.readonly"],
});

const sheets = google.sheets({ version: "v4", auth: authClient });

// ----- header mapping (keep/update as you wish) -----
const HEADER_TO_FIELD = {
  refname: "refname",
  "reference name": "refname",
  rankdesignation: "rankDesignation",
  "rank designation": "rankDesignation",
  serviceid: "serviceId",
  "service id": "serviceId",
  relationship: "relationship",
  salutation: "saluation",
  saluation: "saluation",
  name: "name",
  mobilenumber: "mobileNumber",
  "mobile number": "mobileNumber",
  mobile: "mobileNumber",
  alternativenumber: "alternativeNumber",
  "alternative number": "alternativeNumber",
  alternative: "alternativeNumber",
  email: "email",
  dateofbirth: "dateOfBirth",
  "date of birth": "dateOfBirth",
  dob: "dateOfBirth",
  fathername: "fatherName",
  "father name": "fatherName",
  contactaddress: "contactAddress",
  "contact address": "contactAddress",
  "correspondence address": "contactAddress",
  permanentaddress: "permanentAddress",
  "permanent address": "permanentAddress",
  workingaddress: "workingAddress",
  "working address": "workingAddress",
  memberphoto: "memberPhoto",
  "member photo": "memberPhoto",
  membersignature: "memberSignature",
  "member signature": "memberSignature",
  "member sign": "memberSignature",
  nomineename: "nomineeName",
  "nominee name": "nomineeName",
  nomineeage: "nomineeAge",
  "nominee age": "nomineeAge",
  nomineerelation: "nomineeRelation",
  "nominee relation": "nomineeRelation",
  nomineeaddress: "nomineeAddress",
  "nominee address": "nomineeAddress",
  seniorityid: "seniorityId",
  "seniority id": "seniorityId",
  membershipno: "membershipNo",
  "membership no": "membershipNo",
  confirmationletterno: "confirmationLetterNo",
  "confirmation letter no": "confirmationLetterNo",
  sharecertificateno: "shareCertificateNo",
  "share certificate no": "shareCertificateNo",
  date: "date",

  projectname: "projectName",
  "project name": "projectName",
  propertysize: "propertySize",
  "property size": "propertySize",
  pricepersqft: "pricePerSqft",
  "price per sqft": "pricePerSqft",
  "price per sq ft": "pricePerSqft",
  propertycost: "propertyCost",
  "property cost": "propertyCost",
  percentage: "percentage",
  percentagecost: "percentageCost",
  "percentage cost": "percentageCost",
  plotlength: "plotLength",
  "plot length": "plotLength",
  plotbreadth: "plotBreadth",
  "plot breadth": "plotBreadth",

  recieptno: "recieptNo",
  "reciept no": "recieptNo",
  receiptno: "recieptNo",
  "receipt no": "recieptNo",

  numberofshares: "numberOfShares",
  "number of shares": "numberOfShares",
  "no of shares": "numberOfShares",

  sharefee: "shareFee",
  "share fee": "shareFee",
  membershipfee: "membershipFee",
  "membership fee": "membershipFee",
  applicationfee: "applicationFee",
  "application fee": "applicationFee",
  admissionfee: "admissionFee",
  "admission fee": "admissionFee",
  miscellaneousexpenses: "miscellaneousExpenses",
  "miscellaneous expenses": "miscellaneousExpenses",

  paymenttype: "paymentType",
  "payment type": "paymentType",
  paymentmode: "paymentMode",
  "payment mode": "paymentMode",

  bankname: "bankName",
  "bank name": "bankName",
  branchname: "branchName",
  "branch name": "branchName",

  amount: "amount",
  total: "amount",
  "total amount": "amount",
  "paid amount": "amount",

  transactiondetails: "transactionDetails",
  "transaction details": "transactionDetails",

  chequenumber: "chequeNumber",
  "cheque number": "chequeNumber",
  "cheque no": "chequeNumber",
  chequeno: "chequeNumber",
  chq: "chequeNumber",
  chqno: "chequeNumber",

  ddnumber: "ddNumber",
  "dd number": "ddNumber",
  "dd no": "ddNumber",
  ddno: "ddNumber",
  demanddraft: "ddNumber",
  "demand draft": "ddNumber",

  transactionid: "transactionId",
  "transaction id": "transactionId",
  txn: "transactionId",
  "txn id": "transactionId",
  txnid: "transactionId",
  utr: "transactionId",
  refid: "transactionId",
  "reference id": "transactionId",
};

// ---------------- helpers ----------------
function parseNumber(val) {
  if (val === undefined || val === null) return undefined;
  const s = String(val).trim();
  if (s === "") return undefined;
  const cleaned = s.replace(/,/g, "").replace(/[^\d.-]/g, "");
  const n = Number(cleaned);
  return Number.isFinite(n) ? n : undefined;
}

function parseDate(val) {
  if (!val) return undefined;

  const s = String(val).trim();
  if (!s) return undefined;

  const parts = s.split(/[\/\-\.]/);

  if (parts.length === 3) {
    let day = parts[0];
    let month = parts[1];
    let year = parts[2];

    // handle yyyy-mm-dd from sheets
    if (year.length === 2) {
      year = `20${year}`;
    }

    if (day.length === 4) {
      // yyyy-mm-dd case
      year = day;
      month = parts[1];
      day = parts[2];
    }

    day = String(day).padStart(2, "0");
    month = String(month).padStart(2, "0");

    return new Date(Number(year), Number(month) - 1, Number(day));
  }

  return undefined;
}

function normalizeHeader(h) {
  return String(h || "")
    .trim()
    .toLowerCase()
    .replace(/\s+/g, "");
}

// If a header isn't mapped, attempt compact lookup
function buildIndexToField(headers) {
  const indexToField = {};
  headers.forEach((h, idx) => {
    const key = String(h || "")
      .trim()
      .toLowerCase();
    if (HEADER_TO_FIELD[key]) {
      indexToField[idx] = HEADER_TO_FIELD[key];
      return;
    }
    const compact = key.replace(/\s+/g, "").replace(/[^a-z0-9]/g, "");
    if (HEADER_TO_FIELD[compact]) {
      indexToField[idx] = HEADER_TO_FIELD[compact];
      return;
    }
    const variations = [
      key.replace(/\s+/g, ""),
      key.replace(/\s+/g, "").replace("number", "no"),
      key.replace(/\s+/g, "").replace("no", "number"),
    ];
    for (const v of variations) {
      if (HEADER_TO_FIELD[v]) {
        indexToField[idx] = HEADER_TO_FIELD[v];
        break;
      }
    }
  });
  return indexToField;
}

function containsAlphaAndNum(s) {
  return /[A-Za-z].*\d|\d.*[A-Za-z]/.test(s);
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
    m.includes("transaction") ||
    m.includes("txn") ||
    m.includes("utr") ||
    m.includes("ref")
  ) {
    out.transactionId = td;
    return out;
  }
  const hasAlpha = /[A-Za-z]/.test(td);
  const longNumeric = td.replace(/\D/g, "").length >= 6;
  if (!hasAlpha && longNumeric && td.length <= 12) {
    out.chequeNumber = td;
    return out;
  }
  if (
    td.toLowerCase().includes("upi") ||
    td.toLowerCase().includes("utr") ||
    td.toLowerCase().includes("txn") ||
    containsAlphaAndNum(td)
  ) {
    out.transactionId = td;
    return out;
  }
  out.transactionId = td;
  return out;
}

// Attempt to upload member photo (supports URL & data: base64). Returns string (url) or null.
async function tryUploadMemberPhoto(photoValue) {
  if (!photoValue) return null;
  const s = String(photoValue).trim();
  if (s === "") return null;

  try {
    // Many uploadToCloudinary implementations accept a URL or data URL.
    const uploadResult = await uploadToCloudinary(s);
    if (uploadResult && uploadResult.secure_url) {
      return uploadResult.secure_url;
    }
    if (uploadResult && uploadResult.url) return uploadResult.url;
    return null;
  } catch (err) {
    console.warn(
      "Cloudinary upload failed for memberPhoto:",
      err?.message || err,
    );
    return null;
  }
}

// More robust resolver that will prefer using provided URL if Cloudinary upload fails.
async function resolveMemberPhotoValue(sheetValue) {
  if (!sheetValue) return null;
  const s = String(sheetValue).trim();
  if (!s) return null;

  // data URL (base64) -> upload
  if (s.startsWith("data:")) {
    try {
      const uploaded = await uploadToCloudinary(s);
      return uploaded?.secure_url || uploaded?.url || null;
    } catch (err) {
      console.warn("Cloud upload failed for data URL:", err?.message || err);
      return null;
    }
  }

  // If it's an http/https URL — try uploading but fallback to the original URL
  if (/^https?:\/\//i.test(s)) {
    try {
      const uploaded = await uploadToCloudinary(s);
      if (uploaded && (uploaded.secure_url || uploaded.url)) {
        return uploaded.secure_url || uploaded.url;
      }
      return s; // fallback to original URL
    } catch (err) {
      console.warn(
        "Cloud upload failed for remote URL; using original URL as fallback.",
        err?.message || err,
      );
      return s;
    }
  }

  // Plain base64 or other string -> try uploading
  try {
    const uploaded2 = await uploadToCloudinary(s);
    if (uploaded2 && (uploaded2.secure_url || uploaded2.url))
      return uploaded2.secure_url || uploaded2.url;
  } catch (err) {
    console.warn("Cloud upload failed for plain value:", err?.message || err);
  }

  return null;
}

// Helper to get value from mapped keys or raw headers (case-insensitive). Returns first non-empty string or "".
function getFirstAvailableRaw(rowObj, candidates = []) {
  // 1) check mapped resolved fields on rowObj
  for (const c of candidates) {
    if (
      rowObj[c] !== undefined &&
      rowObj[c] !== null &&
      String(rowObj[c]).trim() !== ""
    ) {
      return String(rowObj[c]).trim();
    }
  }
  // 2) check raw values (original header names) case-insensitively
  const rawKeys = Object.keys(rowObj._raw || {});
  for (const cand of candidates) {
    const normCand = cand.toString().trim().toLowerCase();
    for (const rk of rawKeys) {
      if (rk && rk.toString().trim().toLowerCase() === normCand) {
        const v = rowObj._raw[rk];
        if (v !== undefined && v !== null && String(v).trim() !== "")
          return String(v).trim();
      }
    }
  }
  // 3) fallback: try to find any raw header that includes candidate tokens
  for (const cand of candidates) {
    const token = cand.toString().trim().toLowerCase();
    for (const rk of rawKeys) {
      if (rk && rk.toString().trim().toLowerCase().includes(token)) {
        const v = rowObj._raw[rk];
        if (v !== undefined && v !== null && String(v).trim() !== "")
          return String(v).trim();
      }
    }
  }
  return "";
}

function idxToColLetter(idx) {
  let n = idx + 1,
    s = "";
  while (n > 0) {
    const rem = (n - 1) % 26;
    s = String.fromCharCode(65 + rem) + s;
    n = Math.floor((n - 1) / 26);
  }
  return s;
}

export const uploadFromGoogleSheet = async (req, res) => {
  try {
    const response = await sheets.spreadsheets.values.get({
      spreadsheetId: SHEET_ID,
      range: RANGE,
    });

    const rows = response.data.values;
    if (!rows || rows.length === 0) {
      return res.status(400).json({ message: "No data in sheet" });
    }

    const headers = rows[0].map((h) =>
      h === undefined || h === null ? "" : String(h).trim(),
    );
    const dataRows = rows.slice(1);

    console.log("=== HEADER ANALYSIS ===");
    headers.forEach((header, index) => {
      console.log(`Column ${index} (${idxToColLetter(index)}): "${header}"`);
    });
    console.log(`Total header columns: ${headers.length}`);

    const indexToField = buildIndexToField(headers);

    console.log("\n=== PAYMENT & PHOTO COLUMNS CHECK ===");
    [
      "amount",
      "chequeNumber",
      "ddNumber",
      "transactionId",
      "transactionDetails",
      "memberPhoto",
      "dateOfBirth",
      "dob",
    ].forEach((col) => {
      const found = Object.keys(indexToField).find(
        (idx) => indexToField[idx] === col,
      );
      if (found !== undefined) {
        console.log(
          `✓ ${col} -> column ${found} (${idxToColLetter(Number(found))}) "${
            headers[found]
          }"`,
        );
      } else {
        console.log(`✗ ${col} -> NOT MAPPED`);
      }
    });

    // const results = { created: 0, skippedExisting: 0, errors: [] };

    const results = {
      created: 0,
      skippedExisting: 0,
      skippedDetails: [],
      errors: [],
    };

    function rowToObject(row) {
      const obj = { _raw: {}, _headers: headers };
      headers.forEach((h, idx) => {
        obj._raw[h] =
          row[idx] !== undefined && row[idx] !== null
            ? String(row[idx]).trim()
            : "";
      });
      Object.keys(indexToField).forEach((idxStr) => {
        const idx = Number(idxStr);
        const field = indexToField[idx];
        obj[field] =
          row[idx] !== undefined && row[idx] !== null
            ? String(row[idx]).trim()
            : "";
      });
      return obj;
    }

    const diagLimit = 6;
    const duplicateSeniority = [];
    for (let i = 0; i < dataRows.length; i++) {
      const rowNumber = i + 2;
      const row = dataRows[i];
      if (i < diagLimit) {
        console.log(`\n=== Raw row ${rowNumber} values ===`);
        row.forEach((cell, ci) => {
          console.log(`${ci} (${idxToColLetter(ci)}): "${cell}"`);
        });
      }

      const rowObj = rowToObject(row);

      // 🔴 ADD THIS BLOCK HERE (EXACT PLACE)
      if (!rowObj.membershipNo || String(rowObj.membershipNo).trim() === "") {
        results.skippedDetails.push({
          row: rowNumber,
          seniorityId: rowObj.seniorityId || "",
          membershipNo: "",
          reason: "Missing MembershipNo in sheet",
        });

        continue; // 🚫 STOP this row completely
      }

      if (i < diagLimit) {
        console.log(`\nDEBUG parsed row ${rowNumber}:`, {
          refname: rowObj.refname,
          name: rowObj.name,
          paymentMode: rowObj.paymentMode,
          transactionDetails:
            rowObj.transactionDetails ||
            rowObj._raw["transactionDetails"] ||
            "",
        });
      }

      try {
        // duplicate only if BOTH seniorityId and membershipNo match

        const searchQuery = {
          SeniorityID: rowObj.seniorityId || "",
          MembershipNo: rowObj.membershipNo || "",
        };

        const existingSeniority = await Member.findOne({
          SeniorityID: rowObj.seniorityId,
        }).lean();

        // 🔴 Check duplicate MembershipNo (STRICT BLOCK)
        if (rowObj.membershipNo) {
          const existingMembership = await Member.findOne({
            MembershipNo: rowObj.membershipNo,
          }).lean();

          if (existingMembership) {
            results.skippedExisting += 1;

            results.skippedDetails.push({
              row: rowNumber,
              seniorityId: rowObj.seniorityId || "",
              membershipNo: rowObj.membershipNo,
              reason: "Duplicate MembershipNo (not allowed)",
            });

            continue; // 🚨 STOP saving this row
          }
        }

        if (existingSeniority) {
          // if both seniority + membership match → duplicate
          if (existingSeniority.MembershipNo === rowObj.membershipNo) {
            results.skippedExisting += 1;

            results.skippedDetails.push({
              row: rowNumber,
              seniorityId: rowObj.seniorityId || "",
              membershipNo: rowObj.membershipNo || "",
              serviceId: rowObj.serviceId || "",
              reason: "Duplicate member (same SeniorityID + MembershipNo)",
            });

            continue;
          }

          // if seniority same but membership different → log but allow
          console.log(
            `⚠ SeniorityID already exists: ${rowObj.seniorityId} (Row ${rowNumber})`,
          );

          duplicateSeniority.push({
            row: rowNumber,
            seniorityId: rowObj.seniorityId,
            membershipNo: rowObj.membershipNo || "",
            message: "Seniority already exists but membership differs",
          });
        }

        const plainPassword = await generateUniquePassword();

        // ===== DATE OF BIRTH: prefer DOB-specific columns over generic 'date' =====
        const dobCandidates = [
          "dateofbirth",
          "date of birth",
          "dob",
          "birthdate",
          "birth date",
          "dateOfBirth",
          "date",
        ];
        const dobRaw = getFirstAvailableRaw(rowObj, dobCandidates);
        const parsedDOB = parseDate(dobRaw);

        const mappedData = {
          refname: rowObj.refname || "",
          rankDesignation: rowObj.rankDesignation || "",
          serviceId: rowObj.serviceId || "",
          relationship: rowObj.relationship || "",
          saluation: rowObj.saluation || rowObj.salutation || "",
          name: rowObj.name || "",
          mobileNumber: parseNumber(rowObj.mobileNumber),
          AlternativeNumber: parseNumber(rowObj.alternativeNumber),
          email: rowObj.email || "",
          dateofbirth: parsedDOB, // use parsed DOB
          fatherName: rowObj.fatherName || "",
          contactAddress:
            rowObj.contactAddress ||
            rowObj._raw["contactAddress"] ||
            rowObj._raw["Contact Address"] ||
            "",
          permanentAddress: rowObj.permanentAddress || "",
          workingAddress: rowObj.workingAddress || "",
          MemberPhoto: "",
          MemberSign: "",
          password: plainPassword,
          nomineeName: rowObj.nomineeName || "",
          nomineeAge: parseNumber(rowObj.nomineeAge),
          nomineeRelation: rowObj.nomineeRelation || "",
          nomineeAddress: rowObj.nomineeAddress || "",
          SeniorityID: rowObj.seniorityId || "",
          MembershipNo: rowObj.membershipNo || "",
          ConfirmationLetterNo: rowObj.confirmationLetterNo || "",
          ShareCertificateNumber: rowObj.shareCertificateNo || "",
          date: parseDate(rowObj.date) || new Date(),
          propertyDetails: {
            projectName: rowObj.projectName || "",
            propertySize: parseNumber(rowObj.propertySize) || 0,
            pricePerSqft: parseNumber(rowObj.pricePerSqft) || 0,
            propertyCost: parseNumber(rowObj.propertyCost) || 0,
            percentage: parseNumber(rowObj.percentage) || 0,
            percentageCost: parseNumber(rowObj.percentageCost) || 0,
            length: parseNumber(rowObj.plotLength) || 0,
            breadth: parseNumber(rowObj.plotBreadth) || 0,
          },
        };

        if (dobRaw) {
          console.log(
            `Row ${rowNumber} - DOB raw: "${dobRaw}" parsedDOB:`,
            parsedDOB,
          );
        }

        // ===== MEMBER PHOTO =====
        const photoCandidates = [
          "memberPhoto",
          "memberphoto",
          "member photo",
          "MemberPhoto",
          "Member Photo",
          "photo",
          "photo url",
          "image",
          "image url",
        ];
        const sheetPhotoVal = getFirstAvailableRaw(rowObj, photoCandidates);

        if (sheetPhotoVal) {
          const resolvedUrl = await resolveMemberPhotoValue(sheetPhotoVal);
          if (resolvedUrl) {
            mappedData.MemberPhoto = resolvedUrl;
            console.log(
              `Row ${rowNumber} - MemberPhoto resolved => ${resolvedUrl}`,
            );
          } else if (/^https?:\/\//i.test(sheetPhotoVal)) {
            mappedData.MemberPhoto = sheetPhotoVal;
            console.log(
              `Row ${rowNumber} - MemberPhoto fallback to original URL => ${sheetPhotoVal}`,
            );
          } else {
            console.log(
              `Row ${rowNumber} - MemberPhoto present but could not be resolved/uploaded. Value: ${sheetPhotoVal}`,
            );
          }
        } else {
          if (i < diagLimit) {
            console.log(
              `Row ${rowNumber} - no memberPhoto found in sheet raw headers.`,
            );
          }
        }

        // ===== MEMBER SIGN (optional) =====
        const signCandidates = [
          "membersignature",
          "member signature",
          "memberSignature",
          "signature",
          "signature url",
        ];
        const sheetSignVal = getFirstAvailableRaw(rowObj, signCandidates);
        if (sheetSignVal) {
          const resolvedSign = await resolveMemberPhotoValue(sheetSignVal);
          if (resolvedSign) {
            mappedData.MemberSign = resolvedSign;
            console.log(
              `Row ${rowNumber} - MemberSign resolved => ${resolvedSign}`,
            );
          }
        }

        // Save member
        const newMember = new Member(mappedData);
        await newMember.save();
        console.log(`Saved member (row ${rowNumber}) id: ${newMember._id}`);

        // compute fees (ensure numeric)
        const parsedShareFee = parseNumber(rowObj.shareFee) || 0;
        const parsedMembershipFee = parseNumber(rowObj.membershipFee) || 0;
        const parsedApplicationFee = parseNumber(rowObj.applicationFee) || 0;
        const parsedAdmissionFee = parseNumber(rowObj.admissionFee) || 0;
        const parsedMisc = parseNumber(rowObj.miscellaneousExpenses) || 0;
        const feesSum =
          parsedShareFee +
          parsedMembershipFee +
          parsedApplicationFee +
          parsedAdmissionFee +
          parsedMisc;

        // robust amount determination:
        let parsedAmount = parseNumber(rowObj.amount);
        if (!Number.isFinite(parsedAmount)) {
          parsedAmount = feesSum > 0 ? feesSum : 2500;
          console.log(
            `Row ${rowNumber} - amount missing/invalid -> using feesSum/default. feesSum=${feesSum}, chosen amount=${parsedAmount}`,
          );
        } else {
          console.log(
            `Row ${rowNumber} - Using amount from sheet: ${parsedAmount} (feesSum=${feesSum})`,
          );
        }

        // transactionDetails handling (single column)
        const txnDetails =
          rowObj.transactionDetails &&
          String(rowObj.transactionDetails).trim() !== ""
            ? String(rowObj.transactionDetails).trim()
            : (rowObj._raw &&
                (rowObj._raw["transactionDetails"] ||
                  rowObj._raw["Transaction Details"] ||
                  rowObj._raw["TransactionDetails"])) ||
              "";

        const paymentModeNormalized = (rowObj.paymentMode || "")
          .toString()
          .trim()
          .toLowerCase();
        const mappedTxn = mapTransactionDetailsByMode(
          txnDetails,
          paymentModeNormalized,
        );

        if (
          (parsedAmount === 2500 ||
            parsedAmount === undefined ||
            parsedAmount === null) &&
          txnDetails
        ) {
          const possibleAmount = txnDetails.match(
            /([₹Rs\.\s]*\d{1,3}(?:,\d{3})*(?:\.\d+)?)/i,
          );
          if (possibleAmount && possibleAmount[1]) {
            const amtFromTxn = parseNumber(possibleAmount[1]);
            if (Number.isFinite(amtFromTxn)) {
              console.log(
                `Row ${rowNumber} - Amount parsed from transactionDetails: ${amtFromTxn}`,
              );
              parsedAmount = amtFromTxn;
            }
          }
        }

        console.log(
          `\nRow ${rowNumber} paymentMode="${paymentModeNormalized}", transactionDetails="${txnDetails}"`,
        );
        console.log("Mapped txn =>", mappedTxn);
        console.log("Determined amount =>", parsedAmount);

        const paymentPayload = {
          recieptNo:
            rowObj.recieptNo || rowObj.receiptNo || `GSHEET-${Date.now()}-${i}`,
          date: parseDate(rowObj.date) || new Date(),
          paymentType: rowObj.paymentType || "Membership Fee",
          paymentMode: (rowObj.paymentMode || "cash").toString().toLowerCase(),
          bankName: rowObj.bankName || "",
          branchName: rowObj.branchName || "",
          amount: feesSum, // keep fee-sum approach (you can change to parsedAmount if desired)
          chequeNumber: mappedTxn.chequeNumber || rowObj.chequeNumber || "",
          ddNumber: mappedTxn.ddNumber || rowObj.ddNumber || "",
          transactionId: mappedTxn.transactionId || rowObj.transactionId || "",
          otherCharges: undefined,
          correspondenceAddress:
            rowObj.contactAddress || mappedData.contactAddress || "",
          numberOfShares: parseNumber(rowObj.numberOfShares) || undefined,
          applicationFee: parsedApplicationFee || undefined,
          adminissionFee: parsedAdmissionFee || undefined,
          miscellaneousExpenses: parsedMisc || undefined,
          memberShipFee: parsedMembershipFee || undefined,
          shareFee: parsedShareFee || undefined,
        };

        console.log("Final payment payload:", paymentPayload);

        try {
          const receiptResult = await createReceipt(
            newMember._id,
            paymentPayload,
          );
          if (receiptResult?.status && receiptResult.status !== 200) {
            results.errors.push({
              row: rowNumber,
              error: `Receipt creation returned status ${receiptResult.status}`,
            });
          } else {
            console.log(`✓ Receipt created for row ${rowNumber}`);
          }
        } catch (recErr) {
          console.error(
            `Receipt creation failed for row ${rowNumber}:`,
            recErr,
          );
          results.errors.push({
            row: rowNumber,
            error: recErr.message || String(recErr),
          });
        }

        results.created += 1;
      } catch (rowErr) {
        console.error(`Error processing row ${rowNumber}:`, rowErr);
        results.errors.push({
          row: rowNumber,
          error: rowErr.message || String(rowErr),
        });
      }
    } // end loop

    return res.status(200).json({
      message: "Google sheet import finished",
      summary: results,
      duplicateSeniorityIds: duplicateSeniority,
    });
  } catch (err) {
    console.error("Upload from Google Sheet error:", err);
    return res.status(500).json({ error: err.message || String(err) });
  }
};

const addMemberDetails = async (req, res) => {
  try {
    const data = req.fields;
    const files = req.files;
    console.log("check files:", files);
    console.log("check data:", data);

    let memberPhotoUrl = "";
    let memberSignUrl = "";
    if (files?.memberPhoto) {
      const photoFile = files.memberPhoto;
      const result = await uploadToCloudinary(
        photoFile.buffer || photoFile.path,
      );
      memberPhotoUrl = result.secure_url;
    }

    if (files?.memberSign) {
      const signFile = files.memberSign;
      const result = await uploadToCloudinary(signFile.buffer || signFile.path);
      memberSignUrl = result.secure_url;
    }
    const plainPassword = await generateUniquePassword();

    console.log(memberPhotoUrl, "memberPhotoUrl");
    console.log(memberSignUrl, "memberSignUrl");

    const mappedData = {
      refname: data.refencName,
      rankDesignation: data.rankDesignation,
      serviceId: data.ServiceId,
      relationship: data.relationship,
      saluation: data.salutation,
      name: data.name,
      mobileNumber: Number(data.mobile),
      AlternativeNumber: Number(data.altMobile),
      email: data.email,
      dateofbirth: new Date(data.dob),
      fatherName: data.fatherSpouse,
      contactAddress: data.correspondenceAddress,
      permanentAddress: data.permanentAddress,
      workingAddress: data.workingAddress,
      MemberPhoto: memberPhotoUrl,
      MemberSign: memberSignUrl,
      password: plainPassword,
      nomineeName: data.nomineeName,
      nomineeAge: Number(data.nomineeAge),
      nomineeRelation: data.nomineeRelationship,
      nomineeAddress: data.nomineeAddress,
      SeniorityID: data.seniorityId,
      MembershipNo: data.membershipNo,
      ConfirmationLetterNo: data.cunfirmationLetterNo,
      ShareCertificateNumber: data.shareCertificateNo,
      // ReceiptNo: data.recieptNo,
      date: new Date(data.date),

      propertyDetails: {
        projectName: data.projectName || "",
        propertySize: Number(data.PropertySize) || 0,
        pricePerSqft: Number(data.perSqftPropertyPrice) || 0,
        propertyCost: Number(data.selectedPropertyCost?.replace(/,/g, "")) || 0,
        percentage: Number(data.percentage) || 0,
        percentageCost: Number(data.percentageCost?.replace(/,/g, "")) || 0,
        length: Number(data.plotLength) || 0,
        breadth: Number(data.plotBreadth) || 0,
      },
    };
    console.log("mapped data", mappedData);

    const newMember = new Member(mappedData);
    await newMember.save();

    await createReceipt(newMember._id, data);
    res.status(201).json({ message: "Member saved successfully!" });
  } catch (error) {
    console.error("Add Member Error:", error);
    res.status(500).json({ error: "Failed to save member." });
  }
};

const getMemberDetails = async (req, res) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = 10;
    const skip = (page - 1) * limit;
    const search = req.query.search || "";

    const query = search
      ? {
          $or: [
            { name: { $regex: search, $options: "i" } },
            { email: { $regex: search, $options: "i" } },
            { SeniorityID: { $regex: search, $options: "i" } },
            { MembershipNo: { $regex: search, $options: "i" } },
          ],
        }
      : {};
    const totalMembers = await Member.countDocuments(query);
    const members = await Member.find(query)
      .sort({ date: -1 })
      .skip(skip)
      .limit(limit);
    if (search && members.length === 0) {
      return res.status(404).json({
        success: false,
        message: `No members found matching ${search}`,
        data: [],
        currentPage: page,
        totalPages: 0,
        totalMembers: 0,
      });
    }
    res.status(200).json({
      success: true,
      data: members,
      currentPage: page,
      totalPages: Math.ceil(totalMembers / limit),
      totalMembers,
    });
    console.log("members receipt data", members);
  } catch (error) {
    console.log(error.message);
    res.status(500).json({ success: false, error: "server error" });
  }
};

const checkDuplicates = async (req, res) => {
  console.log("Checking for duplicates (Case-Insensitive)...");
  const {
    SeniorityID,
    MembershipNo,
    ConfirmationLetterNo,
    ShareCertificateNumber,
  } = req.query;

  try {
    const conditions = [];

    if (SeniorityID) {
      conditions.push({
        SeniorityID: { $regex: `^${SeniorityID}$`, $options: "i" },
      });
    }
    if (MembershipNo) {
      conditions.push({
        MembershipNo: { $regex: `^${MembershipNo}$`, $options: "i" },
      });
    }
    if (ConfirmationLetterNo) {
      conditions.push({
        ConfirmationLetterNo: {
          $regex: `^${ConfirmationLetterNo}$`,
          $options: "i",
        },
      });
    }
    if (ShareCertificateNumber) {
      conditions.push({
        ShareCertificateNumber: {
          $regex: `^${ShareCertificateNumber}$`,
          $options: "i",
        },
      });
    }

    if (conditions.length === 0) {
      return res.status(400).json({ error: "No valid fields provided" });
    }

    const existing = await Member.findOne({ $or: conditions });

    if (existing) {
      const duplicateFields = {
        SeniorityID:
          existing.SeniorityID?.toLowerCase() === SeniorityID?.toLowerCase(),
        MembershipNo:
          existing.MembershipNo?.toLowerCase() === MembershipNo?.toLowerCase(),
        ConfirmationLetterNo:
          existing.ConfirmationLetterNo?.toLowerCase() ===
          ConfirmationLetterNo?.toLowerCase(),
        ShareCertificateNumber:
          existing.ShareCertificateNumber?.toLowerCase() ===
          ShareCertificateNumber?.toLowerCase(),
      };

      return res.status(200).json({
        exists: true,
        fields: duplicateFields,
      });
    }

    return res.status(200).json({ exists: false, fields: {} });
  } catch (err) {
    console.error("❌ Error checking duplicates:", err);
    return res.status(500).json({ error: "Internal Server Error" });
  }
};

const updateStatus = async (req, res) => {
  try {
    const member = await Member.findByIdAndUpdate(
      req.params.id,
      {
        isActive: req.body.isActive,
      },
      { new: true },
    );

    res.status(200).json(member);
  } catch (error) {
    res.status(500).json({ error: "Failed to update status" });
  }
};

const getInactiveMembers = async (req, res) => {
  try {
    console.log("Fetching inactive members...");

    const inactiveMembers = await Member.find({ isActive: false });
    console.log(inactiveMembers, "inactive members");

    res.status(200).json(inactiveMembers);
  } catch (err) {
    console.error("Error fetching inactive members:", err);
    res.status(500).json({ error: "Server error" });
  }
};

// const getConfirmation = async (req, res) => {
//   try {
//     const memberId = req.params.id;
//     console.log(memberId, "member idd");

//     const member = await Member.findById(memberId);

//     if (!member) {
//       return res.status(404).json({ message: "Member not found" });
//     }

//     // Get project details

//     const project = await Project.findOne({
//       projectName: member.propertyDetails.projectName,
//     });

//     const projectLocation = project?.location || "Location not found";
//     // Get receipts for this member
//     const receipt = await Receipt.findOne({ member: memberId });

//     // Calculate total amount from all payments
//     // let siteDownPaymentAmount = 0;
//     // if (receipt && Array.isArray(receipt.payments)) {
//     //   for (const payment of receipt.payments) {
//     //     if (payment.paymentType === "sitedownpayment") {
//     //       siteDownPaymentAmount += payment.amount;
//     //     }
//     //   }
//     // }

//     //sending 1st sitedownpayment
//     let siteDownPaymentAmount = 0;
//     let firstSiteDownPaymentReceiptNo = "";

//     if (receipt && Array.isArray(receipt.payments)) {
//       const siteDownPayments = receipt.payments
//         .filter((p) => p.paymentType?.toLowerCase() === "sitedownpayment")
//         .sort((a, b) => new Date(a.date) - new Date(b.date)); // earliest first

//       if (siteDownPayments.length > 0) {
//         siteDownPaymentAmount = siteDownPayments[0].amount;
//         firstSiteDownPaymentReceiptNo = siteDownPayments[0].receiptNo;
//       }
//     }

//     console.log(siteDownPaymentAmount, "site down payment amount new");
//     res.status(200).json({
//       ...member.toObject(),
//       projectLocation,
//       siteDownPaymentAmount,
//       firstSiteDownPaymentReceiptNo,
//     });
//   } catch (error) {
//     console.error("Error in getConfirmation:", error);
//     res.status(500).json({ message: "Server error", error });
//   }
// };

const getConfirmation = async (req, res) => {
  try {
    const memberId = req.params.id;

    const member = await Member.findById(memberId);
    if (!member) {
      return res.status(404).json({ message: "Member not found" });
    }

    const project = await Project.findOne({
      projectName: member.propertyDetails?.projectName || "",
    });

    const projectLocation = project?.location || "Location not found";

    const receipt = await Receipt.findOne({ member: memberId });
    console.log("receipt payment", receipt);

    let siteDownPayments = [];

    if (receipt && Array.isArray(receipt.payments)) {
      siteDownPayments = receipt.payments
        .filter(
          (p) =>
            (p.paymentType || "").trim().toLowerCase() === "sitedownpayment",
        )
        .sort((a, b) => new Date(a.date || 0) - new Date(b.date || 0))
        .map((p) => ({
          receiptNo: p.receiptNo,
          amount: p.amount,
          date: p.date,
          paymentMode: p.paymentMode,
          bankName: p.bankName,
          branchName: p.branchName,
          chequeNumber: p.chequeNumber,
          transactionId: p.transactionId,
          ddNumber: p.ddNumber,
        }));
    }

    const totalSiteDownPayment = siteDownPayments.reduce(
      (sum, p) => sum + p.amount,
      0,
    );

    return res.status(200).json({
      ...member.toObject(),
      projectLocation,
      siteDownPayments,
      totalSiteDownPayment, // optional but useful
    });
  } catch (error) {
    console.error("Error in getConfirmation:", error);
    res.status(500).json({ message: "Server error" });
  }
};

// const addConfirmation = async (req, res) => {
//   try {
//     console.log("Received file:", req.file);
//     console.log("Received body:", req.body);
//     const { id } = req.params;

//     let affidavitUrl = null;
//     let cloudinaryId = null;

//     if (req.file) {
//       const result = await uploadToCloudinary(req.file.buffer);
//       affidavitUrl = result.secure_url;
//       cloudinaryId = result.public_id;
//     }

//     const confirmationPayments = req.body.confirmationPayments
//       ? JSON.parse(req.body.confirmationPayments)
//       : [];

//     const member = await Member.findById(id);
//     if (!member) {
//       return res.status(404).json({
//         message: "Member not found",
//       });
//     }

//     const newAffidavit = new MemberAffidavit({
//       userId: id,
//       MembershipNo: member.MembershipNo,
//       projectAddress: req.body.projectAddress,
//       chequeNo: req.body.ChequeNo,
//       duration: req.body.duration,
//       affidavitUrl, // will be null if not uploaded
//       cloudinaryId, // will be null if not uploaded
//       totalPaidAmount: req.body.Amount,
//       confirmationLetterIssueDate: req.body.confirmationLetterIssueDate,
//       // confirmationLetterReceiptNo: req.body.confirmationLetterReceiptNo,
//       confirmationLetterReceiptNo: Array.isArray(
//         req.body.confirmationLetterReceiptNo,
//       )
//         ? req.body.confirmationLetterReceiptNo
//         : [req.body.confirmationLetterReceiptNo],
//       confirmationPayments,
//       ConfirmationLetterNo: req.body.ConfirmationLetterNo,
//     });

//     await newAffidavit.save();

//     res.status(200).json({
//       message: "Affidavit saved successfully",
//       data: newAffidavit,
//     });
//   } catch (error) {
//     console.error("Upload error:", error);
//     res.status(500).json({ error: "Failed to upload affidavit" });
//   }
// };

const addConfirmation = async (req, res) => {
  try {
    console.log("Received files:", req.files);
    console.log("Received body:", req.body);
    const { id } = req.params;

    let affidavitUrl = null;
    let cloudinaryId = null;

    // if (req.file) {
    //   const result = await uploadToCloudinary(req.file.buffer);
    //   affidavitUrl = result.secure_url;
    //   cloudinaryId = result.public_id;
    // }

    if (req.files && req.files.length > 0) {
      let uploadBuffer;

      // ✅ CASE 1:
      // single PDF upload
      if (
        req.files.length === 1 &&
        req.files[0].mimetype === "application/pdf"
      ) {
        uploadBuffer = req.files[0].buffer;
      }

      // ✅ CASE 2:
      // images or multiple files
      else {
        uploadBuffer = await createMergedPdf(req.files);
      }

      // upload to cloudinary
      const result = await uploadToCloudinary(uploadBuffer);

      affidavitUrl = result.secure_url;
      cloudinaryId = result.public_id;
    }
    const confirmationPayments = req.body.confirmationPayments
      ? JSON.parse(req.body.confirmationPayments)
      : [];

    const member = await Member.findById(id);
    if (!member) {
      return res.status(404).json({
        message: "Member not found",
      });
    }

    const newAffidavit = new MemberAffidavit({
      userId: id,
      MembershipNo: member.MembershipNo,
      projectAddress: req.body.projectAddress,
      chequeNo: req.body.ChequeNo,
      duration: req.body.duration,
      affidavitUrl, // will be null if not uploaded
      cloudinaryId, // will be null if not uploaded
      totalPaidAmount: req.body.Amount,
      confirmationLetterIssueDate: req.body.confirmationLetterIssueDate,
      // confirmationLetterReceiptNo: req.body.confirmationLetterReceiptNo,
      confirmationLetterReceiptNo: Array.isArray(
        req.body.confirmationLetterReceiptNo,
      )
        ? req.body.confirmationLetterReceiptNo
        : [req.body.confirmationLetterReceiptNo],
      confirmationPayments,
      ConfirmationLetterNo: req.body.ConfirmationLetterNo,
    });

    await newAffidavit.save();

    res.status(200).json({
      message: "Affidavit saved successfully",
      data: newAffidavit,
    });
  } catch (error) {
    console.error("Upload error:", error);
    res.status(500).json({ error: "Failed to upload affidavit" });
  }
};

// const getAllAffidavits = async (req, res) => {
//   try {
//     const page = parseInt(req.query.page) || 1;
//     const limit = parseInt(req.query.limit) || 10;
//     const skip = (page - 1) * limit;
//     const search = req.query.search || "";

//     // Build dynamic query for user fields
//     const userQuery = search
//       ? {
//           $or: [
//             { name: { $regex: search, $options: "i" } },
//             { email: { $regex: search, $options: "i" } },
//             isNaN(search) ? null : { mobileNumber: Number(search) },
//             { ConfirmationLetterNo: { $regex: search, $options: "i" } },
//             { MembershipNo: { $regex: search, $options: "i" } },
//           ].filter(Boolean),
//         }
//       : {};

//     // Step 1: Find all matching users
//     const users = await Member.find(userQuery).select("_id");
//     const userIds = users.map((u) => u._id);

//     // Step 2: Use userIds to filter MemberAffidavit
//     const affidavitQuery = userIds.length ? { userId: { $in: userIds } } : {};

//     const total = await MemberAffidavit.countDocuments(affidavitQuery);
//     // console.log("total", await MemberAffidavit.countDocuments());

//     const affidavits = await MemberAffidavit.find(affidavitQuery)
//       .populate(
//         "userId",
//         "refname name email mobileNumber saluation SeniorityID ReceiptNo Amount ConfirmationLetterNo MembershipNo",
//       )
//       .sort({ createdAt: -1 })
//       .skip(skip)
//       .limit(limit);

//     const enrichedAffidavits = await Promise.all(
//       affidavits.map(async (affidavit) => {
//         const memberId = affidavit.userId?._id;
//         if (!memberId) return affidavit;

//         const receipt = await Receipt.findOne({ member: memberId }).lean();
//         const siteDownPayments = (receipt?.payments || []).filter(
//           (payment) =>
//             (payment.paymentType || "").toLowerCase() === "sitedownpayment",
//         );

//         return {
//           ...affidavit.toObject(),
//           siteDownPayments,
//         };
//       }),
//     );

//     res.status(200).json({
//       data: enrichedAffidavits,
//       pagination: {
//         currentPage: page,
//         totalPages: Math.ceil(total / limit),
//         totalItems: total,
//         itemsPerPage: limit,
//       },
//     });
//   } catch (error) {
//     console.error("Error fetching affidavits:", error);
//     res.status(500).json({ message: "Failed to fetch affidavits" });
//   }
// };

const getAllAffidavits = async (req, res) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 10;
    const skip = (page - 1) * limit;
    const search = req.query.search?.trim() || "";

    // -----------------------------
    // MEMBER SEARCH QUERY
    // -----------------------------
    const userQuery = search
      ? {
          $or: [
            { name: { $regex: search, $options: "i" } },
            { email: { $regex: search, $options: "i" } },
            { MembershipNo: { $regex: search, $options: "i" } },
            { ConfirmationLetterNo: { $regex: search, $options: "i" } },
            ...(isNaN(search) ? [] : [{ mobileNumber: Number(search) }]),
          ],
        }
      : {};

    // -----------------------------
    // FETCH MATCHING USERS
    // -----------------------------
    // const users = await Member.find(userQuery).select("_id");

    // const userIds = users.map((user) => user._id);

    const users = await Member.find(userQuery).select("MembershipNo");

    const membershipNos = users
      .map((user) => user.MembershipNo)
      .filter(Boolean);

    // -----------------------------
    // AFFIDAVIT FILTER
    // -----------------------------
    let affidavitQuery = {};

    if (search) {
      // affidavitQuery =
      //   userIds.length > 0 ? { userId: { $in: userIds } } : { _id: null };
      affidavitQuery =
        membershipNos.length > 0
          ? { MembershipNo: { $in: membershipNos } }
          : { _id: null };
    }

    // -----------------------------
    // TOTAL UNIQUE MEMBERS
    // -----------------------------
    const totalResult = await MemberAffidavit.aggregate([
      {
        $match: affidavitQuery,
      },

      // sort before grouping
      {
        $sort: {
          createdAt: -1,
          _id: -1,
        },
      },

      // unique member
      {
        $group: {
          // _id: "$userId",
          _id: "$MembershipNo",
        },
      },

      {
        $count: "total",
      },
    ]);

    const total = totalResult[0]?.total || 0;

    // -----------------------------
    // GET UNIQUE AFFIDAVITS
    // -----------------------------
    const aggregatedAffidavits = await MemberAffidavit.aggregate([
      {
        $match: affidavitQuery,
      },

      // IMPORTANT:
      // stable sorting before grouping
      {
        $sort: {
          createdAt: -1,
          _id: -1,
        },
      },

      // keep latest affidavit per member
      {
        $group: {
          // _id: "$userId",
          _id: "$MembershipNo",
          affidavit: {
            $first: "$$ROOT",
          },
        },
      },

      // flatten structure
      {
        $replaceRoot: {
          newRoot: "$affidavit",
        },
      },

      // IMPORTANT:
      // stable sorting AFTER grouping
      {
        $sort: {
          createdAt: -1,
          _id: -1,
        },
      },

      // pagination
      {
        $skip: skip,
      },

      {
        $limit: limit,
      },
    ]);

    // -----------------------------
    // POPULATE MEMBER DETAILS
    // -----------------------------
    // const affidavits = await MemberAffidavit.populate(aggregatedAffidavits, {
    //   path: "userId",
    //   select:
    //     "refname name email mobileNumber saluation SeniorityID ReceiptNo Amount ConfirmationLetterNo MembershipNo",
    // });

    let affidavits = await MemberAffidavit.populate(aggregatedAffidavits, {
      path: "userId",
      select:
        "refname name email mobileNumber saluation SeniorityID ReceiptNo Amount ConfirmationLetterNo MembershipNo contactAddress",
    });

    // ✅ reconnect broken userIds using MembershipNo
    affidavits = await Promise.all(
      affidavits.map(async (affidavit) => {
        if (!affidavit.userId && affidavit.MembershipNo) {
          const member = await Member.findOne({
            MembershipNo: affidavit.MembershipNo,
          }).select(
            "refname name email mobileNumber saluation SeniorityID ReceiptNo Amount ConfirmationLetterNo MembershipNo contactAddress",
          );

          // if (member) {
          //   affidavit.userId = member;

          //   // optional auto-healing
          //   affidavit.userId = member._id;

          //   await MemberAffidavit.findByIdAndUpdate(affidavit._id, {
          //     userId: member._id,
          //   });
          // }
          if (member) {
            // keep populated object for frontend
            affidavit.userId = member;

            // optional DB auto-healing
            await MemberAffidavit.findByIdAndUpdate(
              affidavit._id,
              {
                userId: member._id,
              },
              { new: true },
            );
          }
        }

        return affidavit;
      }),
    );

    // -----------------------------
    // FETCH ALL RECEIPTS
    // -----------------------------
    // const memberIds = affidavits
    //   .map((item) => item.userId?._id)
    //   .filter(Boolean);

    // const receipts = await Receipt.find({
    //   member: { $in: memberIds },
    // }).lean();

    const membershipNosForReceipts = affidavits
      .map((item) => item.MembershipNo)
      .filter(Boolean);

    const receipts = await Receipt.find({
      MembershipNo: {
        $in: membershipNosForReceipts,
      },
    }).lean();

    // -----------------------------
    // CREATE RECEIPT MAP
    // -----------------------------
    const receiptMap = {};

    receipts.forEach((receipt) => {
      // receiptMap[receipt.member.toString()] = receipt;
      receiptMap[receipt.MembershipNo] = receipt;
    });

    // -----------------------------
    // ENRICH AFFIDAVITS
    // -----------------------------
    const enrichedAffidavits = affidavits.map((affidavit) => {
      // const memberId = affidavit.userId?._id;
      const membershipNo = affidavit.MembershipNo;

      // if (!memberId) {
      if (!membershipNo) {
        return {
          ...affidavit,
          siteDownPayments: [],
        };
      }

      // const receipt = receiptMap[memberId.toString()];
      const receipt = receiptMap[membershipNo];

      const siteDownPayments = (receipt?.payments || []).filter(
        (payment) =>
          (payment.paymentType || "").toLowerCase() === "sitedownpayment",
      );

      return {
        ...affidavit,
        siteDownPayments,
      };
    });

    // -----------------------------
    // RESPONSE
    // -----------------------------
    return res.status(200).json({
      data: enrichedAffidavits,
      pagination: {
        currentPage: page,
        totalPages: Math.ceil(total / limit),
        totalItems: total,
        itemsPerPage: limit,
      },
    });
  } catch (error) {
    console.error("Error fetching affidavits:", error);

    return res.status(500).json({
      success: false,
      message: "Failed to fetch affidavits",
      error: error.message,
    });
  }
};

// const sendMemberLoginDetails = async (req, res) => {
//   try {
//     const { name, email, SeniorityID, password } = req.body;

//     // Validate input
//     if (!name || !email || !SeniorityID || !password) {
//       return res.status(400).json({ error: "All fields are required" });
//     }

//     const mailOptions = {
//       from: `"Defence Habitat Housing Co-operative Society Ltd." <${process.env.DHS_NODEMAILER_MAIL}>`,
//       to: email,
//       subject: "Member Login Credentials",
//       html: `
//         <div style="border:1px solid #1f4892; font-family: Arial, sans-serif;">
//           <div style="background-color: #1f4892; height: 50px;"></div>
//           <div style="padding: 20px;">
//             <p>Dear <strong>${name}</strong>,</p>
//             <p>From,<br>Defence Habitat Housing Co-operative Society Ltd.</p>
//             <table cellpadding="10">
//               <tr>
//                 <td style="background-color: #666; color: white;"><strong>Member ID</strong></td>
//                 <td><div style="border: 1px solid #ccc; padding: 8px;">${SeniorityID}</div></td>
//               </tr>
//               <tr>
//                 <td style="background-color: #666; color: white;"><strong>Email</strong></td>
//                 <td><div style="border: 1px solid #ccc; padding: 8px;">${email}</div></td>
//               </tr>
//               <tr>
//                 <td style="background-color: #666; color: white;"><strong>Password</strong></td>
//                 <td><div style="border: 1px solid #ccc; padding: 8px;">${password}</div></td>
//               </tr>
//             </table>
//             <p>Click here to login: <a href="https://defencehousingsociety.com/memberlogin">https://defencehousingsociety.com/memberlogin</a></p>
//             <p><strong>THANK YOU</strong></p>
//             <p><strong>For further details, contact</strong><br>
//             Behind Swathi Garden Hotel<br>
//             E Block, Sahakarnagar,<br>
//             Bengaluru - 560 092. Ph: 080 - 29903931</p>
//           </div>
//         </div>
//       `,
//     };

//     await transporter.sendMail(mailOptions);

//     res.status(200).json({
//       message: `Login credentials shared to ${email} successfully`,
//     });
//   } catch (err) {
//     console.error("Error sending email:", err);
//     res.status(500).json({ error: "Failed to send email" });
//   }
// };

const sendMemberLoginDetails = async (req, res) => {
  try {
    const { name, email, MembershipNo, password } = req.body;

    // Validate input
    if (!name || !email || !MembershipNo || !password) {
      return res.status(400).json({
        error: "All fields are required",
      });
    }

    const mailOptions = {
      from: `"Defence Habitat Housing Co-operative Society Ltd." <${process.env.DHS_NODEMAILER_MAIL}>`,
      to: email,
      subject: "Member Login Credentials",

      html: `
        <div style="border:1px solid #1f4892; font-family: Arial, sans-serif;">
          
          <div style="background-color: #1f4892; height: 50px;"></div>

          <div style="padding: 20px;">
            
            <p>
              Dear <strong>${name}</strong>,
            </p>

            <p>
              From,<br>
              Defence Habitat Housing Co-operative Society Ltd.
            </p>

            <table cellpadding="10" style="border-collapse: collapse;">
              
              <tr>
                <td style="background-color: #666; color: white;">
                  <strong>Membership No</strong>
                </td>

                <td>
                  <div style="border: 1px solid #ccc; padding: 8px;">
                    ${MembershipNo}
                  </div>
                </td>
              </tr>

              <tr>
                <td style="background-color: #666; color: white;">
                  <strong>Email</strong>
                </td>

                <td>
                  <div style="border: 1px solid #ccc; padding: 8px;">
                    ${email}
                  </div>
                </td>
              </tr>

              <tr>
                <td style="background-color: #666; color: white;">
                  <strong>Password</strong>
                </td>

                <td>
                  <div style="border: 1px solid #ccc; padding: 8px;">
                    ${password}
                  </div>
                </td>
              </tr>

            </table>

            <p style="margin-top: 20px;">
              Click here to login:
              <a href="https://defencehousingsociety.com/memberlogin">
                https://defencehousingsociety.com/memberlogin
              </a>
            </p>

            <p>
              <strong>THANK YOU</strong>
            </p>

            <p>
              <strong>For further details, contact</strong><br>
              Behind Swathi Garden Hotel<br>
              E Block, Sahakarnagar,<br>
              Bengaluru - 560 092.<br>
              Ph: 080 - 29903931
            </p>

          </div>
        </div>
      `,
    };

    await transporter.sendMail(mailOptions);

    return res.status(200).json({
      success: true,
      message: `Login credentials shared to ${email} successfully`,
    });
  } catch (err) {
    console.error("Error sending email:", err);

    return res.status(500).json({
      success: false,
      error: "Failed to send email",
    });
  }
};

// Exporting all the functions
const deleteMember = async (req, res) => {
  try {
    const { id } = req.params;

    const deletedMember = await Member.findByIdAndDelete(id);
    if (!deletedMember) {
      return res.status(404).json({ message: "Member not found" });
    }

    res.status(200).json({ message: "Member deleted successfully" });
  } catch (error) {
    console.error("Delete error:", error);
    res.status(500).json({ message: "Server error while deleting member" });
  }
};

const getMemberById = async (req, res) => {
  try {
    const { id } = req.params;
    // Find all receipts for the given member
    const member = await Member.findById(id);
    //     if (!member) {
    //       return res.status(404).json({ message: "Member not found" });
    //     }
    const receipts = await Receipt.find({ member: id });
    let result = null;
    for (const receipt of receipts) {
      const payment = receipt.payments.find(
        (p) => p.paymentType === "Membership Fee",
      );

      if (payment) {
        console.log("Membership Fee payment found:", payment);
        result = {
          receiptId: receipt._id,
          receiptNo: payment.receiptNo,
          amount: payment.amount,
          paymentInfo: payment,
        };
        break; // Stop at first match
      }
    }
    console.log("Membership Fee Receipt ID:", result);
    if (result) {
      res.status(200).json({ result: result, member: member });
    } else {
      res.status(404).json({ message: "Membership Fee receipt not found." });
    }
  } catch (error) {
    console.error("Error fetching membership receipt:", error);
    res.status(500).json({ message: "Server error" });
  }
};

const updateMemberDetails = async (req, res) => {
  try {
    console.log("Received request to update member details...");
    console.log("Updating member details...");
    console.log("Received files:", req.files);
    console.log("Received data:", req.fields);
    const data = req.fields;
    const files = req.files;
    const memberId = req.params.id; // ID should come from URL
    console.log("Updating Member ID:", memberId);
    let memberPhotoUrl = "";
    let memberSignUrl = "";
    // Upload new member photo if provided
    if (files?.memberPhoto) {
      const photoFile = files.memberPhoto;
      const result = await uploadToCloudinary(
        photoFile.buffer || photoFile.path,
      );
      memberPhotoUrl = result.secure_url;
    }
    // Upload new member sign if provided
    if (files?.memberSign) {
      const signFile = files.memberSign;
      const result = await uploadToCloudinary(signFile.buffer || signFile.path);
      memberSignUrl = result.secure_url;
    }

    const updateData = {
      refname: data.refencName,
      rankDesignation: data.rankDesignation,
      serviceId: data.ServiceId,
      relationship: data.relationship,
      saluation: data.salutation,
      name: data.name,
      mobileNumber: Number(data.mobile),
      AlternativeNumber: Number(data.altMobile),
      email: data.email,
      dateofbirth: new Date(data.dob),
      fatherName: data.fatherSpouse,
      contactAddress: data.correspondenceAddress,
      permanentAddress: data.permanentAddress,
      workingAddress: data.workingAddress,
      nomineeName: data.nomineeName,
      nomineeAge: Number(data.nomineeAge),
      nomineeRelation: data.nomineeRelationship,
      nomineeAddress: data.nomineeAddress,
      SeniorityID: data.seniorityId,
      MembershipNo: data.membershipNo,
      ConfirmationLetterNo: data.cunfirmationLetterNo,
      ShareCertificateNumber: data.shareCertificateNo,
      date: new Date(data.date),
      propertyDetails: {
        projectName: data.projectName || "",
        propertySize: Number(data.PropertySize) || 0,
        pricePerSqft: Number(data.perSqftPropertyPrice) || 0,
        propertyCost: Number(data.selectedPropertyCost?.replace(/,/g, "")) || 0,
        percentage: Number(data.percentage) || 0,
        percentageCost: Number(data.percentageCost?.replace(/,/g, "")) || 0,
        length: Number(data.plotLength) || 0,
        breadth: Number(data.plotBreadth) || 0,
      },
    };

    // Conditionally add photo/sign if uploaded
    if (memberPhotoUrl) updateData.MemberPhoto = memberPhotoUrl;
    if (memberSignUrl) updateData.MemberSign = memberSignUrl;

    const updatedMember = await Member.findByIdAndUpdate(memberId, updateData, {
      new: true,
    });
    // 1. Find the receipt with "Membership Fee" in its payments array
    const receipt = await Receipt.findOne({ member: memberId });

    if (!receipt) {
      return res
        .status(404)
        .json({ error: "Receipt not found for the member." });
    }

    // 2. Find the specific payment to update
    const paymentToUpdate = receipt.payments.find(
      (p) => p.paymentType === "Membership Fee",
    );

    if (!paymentToUpdate) {
      return res
        .status(404)
        .json({ error: "Membership Fee payment not found." });
    }

    // 3. Update fields on the found payment
    paymentToUpdate.paymentMode = data.paymentMode;
    paymentToUpdate.bankName = data.bankName;
    paymentToUpdate.branchName = data.branchName;
    paymentToUpdate.amount = Number(data.amount);
    paymentToUpdate.chequeNumber = data.chequeNumber || "";
    paymentToUpdate.transactionId = data.transactionId || "";
    paymentToUpdate.ddNumber = data.ddNumber || "";
    paymentToUpdate.applicationFee = Number(data.applicationFee) || 0;
    paymentToUpdate.admissionFee =
      Number(data.admissionFee || data.adminissionFee) || 0;
    paymentToUpdate.miscellaneousExpenses =
      Number(data.miscellaneousExpenses) || 0;
    paymentToUpdate.membershipFee =
      Number(data.membershipFee || data.memberShipFee) || 0;
    paymentToUpdate.shareFee = Number(data.shareFee) || 0;
    paymentToUpdate.numberOfShares = Number(data.numberOfShares) || 0;
    paymentToUpdate.date = new Date(data.date);

    // 4. Save the updated receipt
    const updatedReceipt = await receipt.save();

    // 5. Return success
    res.status(200).json({
      message: "Member and Membership Fee receipt updated successfully!",
      updatedMember,
      updatedReceipt,
    });

    if (!updatedMember) {
      return res.status(404).json({ error: "Member not found." });
    }
    res
      .status(200)
      .json({ message: "Member updated successfully!", updatedMember });
  } catch (error) {
    console.error("Update Member Error:", error);
    res.status(500).json({ error: "Failed to update member." });
  }
};

const addReceiptToMember = async (req, res) => {
  try {
    const { memberId } = req.params;
    const data = req.body;

    console.log("paid amount data", data);

    const existingMember = await Member.findById(memberId);

    if (!existingMember) {
      return res.status(404).json({ error: "Member not found" });
    }

    // Create the receipt
    const receiptResponse = await createReceipt(memberId, data);

    if (receiptResponse.status === 200) {
      const receiptAmount = Number(data.amount) || 0;
      const paymentType = (data.paymentType || "").toLowerCase();

      console.log("receipt paid amount", receiptAmount);
      console.log("payment type", paymentType);

      // Only update paidAmount for specific payment types
      const eligiblePaymentTypes = [
        "siteadvance",
        "sitedownpayment",
        "installments",
      ];

      if (eligiblePaymentTypes.includes(paymentType)) {
        existingMember.propertyDetails.paidAmount =
          (existingMember.propertyDetails.paidAmount || 0) + receiptAmount;

        await existingMember.save();
      }

      res.status(200).json({
        message: "Receipt added successfully",
        receipt: receiptResponse.data,
      });
    } else {
      res.status(500).json({ error: receiptResponse.error });
    }
  } catch (error) {
    console.error("Error in addReceiptToMember:", error);
    res.status(500).json({ error: "Failed to add receipt to member" });
  }
};

// const editConfirmationLetter = async (req, res) => {
//   try {
//     const { id } = req.params;
//     console.log(id, "idddddddddddddd");
//     // Find the existing affidavit by userId
//     const existingAffidavit = await MemberAffidavit.findOne({ userId: id });
//     if (!existingAffidavit) {
//       return res.status(404).json({ message: "Affidavit not found" });
//     }

//     // Optional: Upload new file if provided
//     if (req.file) {
//       const result = await uploadToCloudinary(req.file.buffer);
//       existingAffidavit.affidavitUrl = result.secure_url;
//       existingAffidavit.cloudinaryId = result.public_id;
//     }
//     // Update other fields
//     existingAffidavit.projectAddress =
//       req.body.projectAddress || existingAffidavit.projectAddress;
//     existingAffidavit.chequeNo =
//       req.body.ChequeNo || existingAffidavit.chequeNo;
//     existingAffidavit.duration =
//       req.body.duration || existingAffidavit.duration;
//     existingAffidavit.confirmationLetterIssueDate =
//       req.body.confirmationLetterIssueDate ||
//       existingAffidavit.confirmationLetterIssueDate;
//     existingAffidavit.totalPaidAmount =
//       req.body.Amount || existingAffidavit.totalPaidAmount;
//     // existingAffidavit.confirmationLetterReceiptNo =
//     //   req.body.confirmationLetterReceiptNo ||
//     //   existingAffidavit.confirmationLetterReceiptNo;
//     // existingAffidavit.confirmationLetterReceiptNo = Array.isArray(
//     //   req.body.confirmationLetterReceiptNo,
//     // )
//     //   ? req.body.confirmationLetterReceiptNo
//     //   : [req.body.confirmationLetterReceiptNo];
//     const confirmationPayments = req.body.confirmationPayments
//       ? JSON.parse(req.body.confirmationPayments)
//       : [];

//     existingAffidavit.confirmationLetterReceiptNo = Array.isArray(
//       req.body.confirmationLetterReceiptNo,
//     )
//       ? req.body.confirmationLetterReceiptNo
//       : [req.body.confirmationLetterReceiptNo];

//     existingAffidavit.confirmationPayments = confirmationPayments;
//     existingAffidavit.pricePerSqft =
//       req.body.pricePerSqft || existingAffidavit.pricePerSqft;
//     existingAffidavit.PaymentType =
//       req.body.PaymentType || existingAffidavit.PaymentType;
//     existingAffidavit.ConfirmationLetterNo =
//       req.body.ConfirmationLetterNo || existingAffidavit.ConfirmationLetterNo;
//     existingAffidavit.ConfirmationLetterDate =
//       req.body.ConfirmationLetterDate ||
//       existingAffidavit.ConfirmationLetterDate;
//     await existingAffidavit.save();
//     res.status(200).json({
//       message: "Confirmation letter updated successfully",
//       data: existingAffidavit,
//     });
//   } catch (error) {
//     console.error("Update error:", error);
//     res.status(500).json({ error: "Failed to update confirmation letter" });
//   }
// };

// const editConfirmationLetter = async (req, res) => {
//   try {
//     const { id } = req.params;

//     console.log(id, "idddddddddddddd");

//     // ✅ Fetch member first
//     const member = await Member.findById(id);

//     if (!member) {
//       return res.status(404).json({
//         message: "Member not found",
//       });
//     }

//     const membershipNo = member.MembershipNo;

//     // ✅ FIRST TRY using MembershipNo
//     let existingAffidavit = await MemberAffidavit.findOne({
//       MembershipNo: membershipNo,
//     });

//     // ✅ FALLBACK for old live DB records
//     if (!existingAffidavit) {
//       existingAffidavit = await MemberAffidavit.findOne({
//         userId: id,
//       });

//       // ✅ Auto migrate old records
//       if (existingAffidavit) {
//         existingAffidavit.MembershipNo = membershipNo;
//       }
//     }

//     if (!existingAffidavit) {
//       return res.status(404).json({
//         message: "Affidavit not found",
//       });
//     }

//     // ✅ Always keep latest references updated
//     existingAffidavit.userId = id;
//     existingAffidavit.MembershipNo = membershipNo;

//     // ✅ Optional file upload
//     if (req.file) {
//       const result = await uploadToCloudinary(req.file.buffer);

//       existingAffidavit.affidavitUrl = result.secure_url;
//       existingAffidavit.cloudinaryId = result.public_id;
//     }

//     // ✅ Parse confirmation payments
//     const confirmationPayments = req.body.confirmationPayments
//       ? JSON.parse(req.body.confirmationPayments)
//       : [];

//     // ✅ Update fields
//     existingAffidavit.projectAddress =
//       req.body.projectAddress || existingAffidavit.projectAddress;

//     existingAffidavit.chequeNo =
//       req.body.ChequeNo || existingAffidavit.chequeNo;

//     existingAffidavit.duration =
//       req.body.duration || existingAffidavit.duration;

//     existingAffidavit.confirmationLetterIssueDate =
//       req.body.confirmationLetterIssueDate ||
//       existingAffidavit.confirmationLetterIssueDate;

//     existingAffidavit.totalPaidAmount =
//       req.body.Amount || existingAffidavit.totalPaidAmount;

//     existingAffidavit.confirmationLetterReceiptNo = Array.isArray(
//       req.body.confirmationLetterReceiptNo,
//     )
//       ? req.body.confirmationLetterReceiptNo
//       : [req.body.confirmationLetterReceiptNo];

//     existingAffidavit.confirmationPayments = confirmationPayments;

//     existingAffidavit.pricePerSqft =
//       req.body.pricePerSqft || existingAffidavit.pricePerSqft;

//     existingAffidavit.PaymentType =
//       req.body.PaymentType || existingAffidavit.PaymentType;

//     existingAffidavit.ConfirmationLetterNo =
//       req.body.ConfirmationLetterNo || existingAffidavit.ConfirmationLetterNo;

//     existingAffidavit.ConfirmationLetterDate =
//       req.body.ConfirmationLetterDate ||
//       existingAffidavit.ConfirmationLetterDate;

//     await existingAffidavit.save();

//     res.status(200).json({
//       message: "Confirmation letter updated successfully",
//       data: existingAffidavit,
//     });
//   } catch (error) {
//     console.error("Update error:", error);

//     res.status(500).json({
//       error: "Failed to update confirmation letter",
//     });
//   }
// };

const editConfirmationLetter = async (req, res) => {
  try {
    const { id } = req.params;

    console.log(id, "idddddddddddddd");

    // ✅ Fetch member first
    const member = await Member.findById(id);

    if (!member) {
      return res.status(404).json({
        message: "Member not found",
      });
    }

    const membershipNo = member.MembershipNo;

    // ✅ FIRST TRY using MembershipNo
    let existingAffidavit = await MemberAffidavit.findOne({
      MembershipNo: membershipNo,
    });

    // ✅ FALLBACK for old live DB records
    if (!existingAffidavit) {
      existingAffidavit = await MemberAffidavit.findOne({
        userId: id,
      });

      // ✅ Auto migrate old records
      if (existingAffidavit) {
        existingAffidavit.MembershipNo = membershipNo;
      }
    }

    if (!existingAffidavit) {
      return res.status(404).json({
        message: "Affidavit not found",
      });
    }

    // ✅ Always keep latest references updated
    existingAffidavit.userId = id;
    existingAffidavit.MembershipNo = membershipNo;

    // ✅ Optional multiple file upload
    if (req.files && req.files.length > 0) {
      let uploadBuffer;

      // single pdf
      if (
        req.files.length === 1 &&
        req.files[0].mimetype === "application/pdf"
      ) {
        uploadBuffer = req.files[0].buffer;
      }

      // images / multiple files
      else {
        uploadBuffer = await createMergedPdf(req.files);
      }

      const result = await uploadToCloudinary(uploadBuffer);

      existingAffidavit.affidavitUrl = result.secure_url;
      existingAffidavit.cloudinaryId = result.public_id;
    }

    // ✅ Parse confirmation payments
    const confirmationPayments = req.body.confirmationPayments
      ? JSON.parse(req.body.confirmationPayments)
      : [];

    // ✅ Update fields
    existingAffidavit.projectAddress =
      req.body.projectAddress || existingAffidavit.projectAddress;

    existingAffidavit.chequeNo =
      req.body.ChequeNo || existingAffidavit.chequeNo;

    existingAffidavit.duration =
      req.body.duration || existingAffidavit.duration;

    existingAffidavit.confirmationLetterIssueDate =
      req.body.confirmationLetterIssueDate ||
      existingAffidavit.confirmationLetterIssueDate;

    existingAffidavit.totalPaidAmount =
      req.body.Amount || existingAffidavit.totalPaidAmount;

    existingAffidavit.confirmationLetterReceiptNo = Array.isArray(
      req.body.confirmationLetterReceiptNo,
    )
      ? req.body.confirmationLetterReceiptNo
      : [req.body.confirmationLetterReceiptNo];

    existingAffidavit.confirmationPayments = confirmationPayments;

    existingAffidavit.pricePerSqft =
      req.body.pricePerSqft || existingAffidavit.pricePerSqft;

    existingAffidavit.PaymentType =
      req.body.PaymentType || existingAffidavit.PaymentType;

    existingAffidavit.ConfirmationLetterNo =
      req.body.ConfirmationLetterNo || existingAffidavit.ConfirmationLetterNo;

    existingAffidavit.ConfirmationLetterDate =
      req.body.ConfirmationLetterDate ||
      existingAffidavit.ConfirmationLetterDate;

    await existingAffidavit.save();

    res.status(200).json({
      message: "Confirmation letter updated successfully",
      data: existingAffidavit,
    });
  } catch (error) {
    console.error("Update error:", error);

    res.status(500).json({
      error: "Failed to update confirmation letter",
    });
  }
};

const getAffidavitById = async (req, res) => {
  try {
    const { id } = req.params;
    // Fetch affidavit/confirmation letter based on userId (memberId)
    const affidavit = await MemberAffidavit.findOne({ userId: id });
    // const affidavit = await MemberAffidavit.findOne({ userId: new mongoose.Types.ObjectId(id) });
    if (!affidavit) {
      return res
        .status(404)
        .json({ message: "Affidavit not found for the given member ID" });
    }
    // Optionally get member data if you want to show name or project details
    const member = await Member.findById(id);
    const responseData = {
      name: member?.name || "",
      propertyDetails: member?.propertyDetails || {},
      Amount: affidavit.totalPaidAmount || "",
      PaymentType: affidavit.paymentMethod || "",
      ConfirmationLetterNo: affidavit.ConfirmationLetterNo || "",
      confirmationLetterIssueDate: affidavit.confirmationLetterIssueDate || "",
      duration: affidavit.duration || "",
      affidavitUrl: affidavit.affidavitUrl || "",
      confirmationLetterReceiptNo: affidavit.confirmationLetterReceiptNo || "",
    };
    res.status(200).json(responseData);
  } catch (error) {
    console.error("Error fetching affidavit data:", error);
    res.status(500).json({ error: "Internal server error" });
  }
};

const deleteAffidavit = async (req, res) => {
  try {
    const { id } = req.params;

    const affidavit = await MemberAffidavit.findById(id);

    if (!affidavit) {
      return res.status(404).json({ message: "Affidavit not found" });
    }

    // 🔥 OPTIONAL: delete from cloudinary
    if (affidavit.cloudinaryId) {
      await deleteFromCloudinary(affidavit.cloudinaryId);
    }

    await MemberAffidavit.findByIdAndDelete(id);

    res.status(200).json({ message: "Affidavit deleted successfully" });
  } catch (error) {
    console.error("Delete error:", error);
    res.status(500).json({ message: "Failed to delete affidavit" });
  }
};

const deleteAllAffidavits = async (req, res) => {
  try {
    // 🔴 ADD THIS HERE (FIRST LINE INSIDE TRY)
    if (!req.query.confirm || req.query.confirm !== "YES") {
      return res.status(400).json({
        message: "Please confirm deletion by passing ?confirm=YES",
      });
    }

    // ✅ AFTER THIS → actual logic
    const affidavits = await MemberAffidavit.find();

    // optional cloudinary delete
    for (const item of affidavits) {
      if (item.cloudinaryId) {
        await deleteFromCloudinary(item.cloudinaryId);
      }
    }

    await MemberAffidavit.deleteMany({});

    res.status(200).json({
      message: "All affidavits deleted successfully",
    });
  } catch (error) {
    console.error("Delete all error:", error);
    res.status(500).json({ message: "Failed to delete all affidavits" });
  }
};

const editReceiptToMember = async (req, res) => {
  try {
    const { memberId } = req.params;
    const data = req.body;
    const { paymentId } = req.query;

    // 1. Find the member
    const member = await Member.findById(memberId);
    if (!member) return res.status(404).json({ error: "Member not found" });

    // 2. Get all receipts for the member
    const receipts = await Receipt.find({ member: memberId });

    // 3. Find the payment in any of the receipts
    let paymentToUpdate = null;
    let receiptContainingPayment = null;

    for (const receipt of receipts) {
      const payment = receipt.payments.id(paymentId);
      if (payment) {
        paymentToUpdate = payment;
        receiptContainingPayment = receipt;
        break;
      }
    }

    if (!paymentToUpdate) {
      return res.status(404).json({ error: "Payment not found" });
    }

    // Prepare for paidAmount adjustment
    const eligibleTypes = ["siteadvance", "sitedownpayment", "installments"];
    const oldPaymentType = (paymentToUpdate.paymentType || "").toLowerCase();
    const oldAmount = Number(paymentToUpdate.amount || 0);
    const newPaymentType = (
      data.paymentType ||
      paymentToUpdate.paymentType ||
      ""
    ).toLowerCase();
    const newAmount =
      data.amount !== undefined ? Number(data.amount) : oldAmount;

    if (isNaN(oldAmount) || isNaN(newAmount)) {
      return res.status(400).json({ error: "Invalid amount format" });
    }

    const wasEligible = eligibleTypes.includes(oldPaymentType);
    const isEligible = eligibleTypes.includes(newPaymentType);

    // 4. Update fields
    Object.keys(data).forEach((key) => {
      if (data[key] !== undefined) {
        paymentToUpdate[key] = data[key];
      }
    });

    await receiptContainingPayment.save();

    // 5. Update member.paidAmount if needed
    if (wasEligible || isEligible) {
      let adjustment = 0;
      if (wasEligible) adjustment -= oldAmount;
      if (isEligible) adjustment += newAmount;

      member.propertyDetails.paidAmount =
        Number(member.propertyDetails.paidAmount || 0) + adjustment;

      await member.save();
    }

    return res.status(200).json({
      message: "Receipt payment updated successfully",
      updatedPayment: paymentToUpdate,
    });
  } catch (error) {
    console.error("Error in editReceiptToMember:", error);
    res.status(500).json({ error: "Failed to update receipt payment" });
  }
};

const checkDuplicatesPaymentTypeToAddReceipt = async (req, res) => {
  try {
    const { memberId } = req.params;
    console.log("memberid", memberId);

    if (!memberId) {
      return res.status(400).json({ error: "Member ID is required" });
    }

    // Find all receipts for the member
    const receipts = await Receipt.find({ member: memberId });

    if (!receipts || receipts.length === 0) {
      return res.status(200).json({ paymentTypes: [] }); // No receipts, no duplicates
    }

    // Extract all payment types from payments array
    const paymentTypes = [];

    receipts.forEach((receipt) => {
      receipt.payments.forEach((payment) => {
        if (payment.paymentType === "installments") {
          paymentTypes.push({
            paymentType: payment.paymentType,
            installmentNumber: payment.installmentNumber,
          });
        } else {
          paymentTypes.push({ paymentType: payment.paymentType });
        }
      });
    });

    res.status(200).json({ paymentTypes });
  } catch (error) {
    console.error("Error fetching duplicate payment types", error);
    res
      .status(500)
      .json({ error: "Failed to fetch the duplicate payment type" });
  }
};

const getMemberData = async (req, res) => {
  try {
  } catch (err) {}
};

const deleteMemberReceiptPaymentEach = async (req, res) => {
  const { memberId } = req.params;
  const { paymentType, installmentNumber } = req.body;

  try {
    // Step 1: Find the member
    const member = await Member.findById(memberId);
    if (!member) {
      return res.status(404).json({ message: "Member not found" });
    }

    // Step 2: Get the receipt(s) linked to this member
    const receipts = await Receipt.find({ _id: { $in: member.receiptId } });

    const eligibleTypes = ["siteadvance", "sitedownpayment", "installments"];
    let paymentDeleted = false;
    let deletedAmount = 0;

    // Step 3: Iterate through receipts and try to remove the matching payment
    for (const receipt of receipts) {
      const originalPayments = [...receipt.payments];

      // Filter payments and identify any deleted payment
      receipt.payments = receipt.payments.filter((payment) => {
        const isMatch = installmentNumber
          ? payment.paymentType === paymentType &&
            payment.installmentNumber === installmentNumber
          : payment.paymentType === paymentType;

        if (
          isMatch &&
          eligibleTypes.includes(payment.paymentType.toLowerCase())
        ) {
          deletedAmount += Number(payment.amount || 0);
        }

        return !isMatch;
      });

      if (receipt.payments.length < originalPayments.length) {
        await receipt.save();
        paymentDeleted = true;
        break; // Stop after deleting from first matching receipt
      }
    }

    if (!paymentDeleted) {
      return res.status(404).json({
        message: "No matching payment found to delete",
      });
    }

    // Step 4: Adjust member's paidAmount if applicable
    if (deletedAmount > 0) {
      member.propertyDetails.paidAmount =
        Number(member.propertyDetails.paidAmount || 0) - deletedAmount;
      await member.save();
    }

    res.status(200).json({
      message: "Payment deleted successfully",
    });
  } catch (err) {
    console.error("Error deleting receipt entry:", err);
    res.status(500).json({ message: "Server error" });
  }
};

const collectSeniorityIds = async (req, res) => {
  try {
    const members = await Member.find(
      { SeniorityID: { $exists: true, $ne: null } },
      { SeniorityID: 1, _id: 0 },
    );

    const SeniorityIds = members.map((member) => member.SeniorityID);

    res.status(200).json({ success: true, SeniorityIds });
  } catch (err) {
    console.error("error fetching seniority ids:", err);
    res.status(500).json({ success: false, message: "server error" });
  }
};

const collectMemberInfoOnSeniorityIds = async (req, res) => {
  try {
    const { SeniorityID } = req.query;
    console.log("seniority id", SeniorityID);

    if (!SeniorityID) {
      return res
        .status(400)
        .json({ success: false, message: "Seniority ID is required" });
    }

    const member = await Member.findOne({ SeniorityID });
    if (!member) {
      return res
        .status(404)
        .json({ success: false, message: "Member not found" });
    }

    console.log("member", member);

    res.status(200).json({ success: true, member });
  } catch (err) {
    console.error("error fetching member info", err);
    res.status(500).json({ success: false, message: "server error" });
  }
};

// controllers/receiptController.js

const getMemberReceipt = async (req, res) => {
  try {
    console.log("Received request to get member receipt...", req.params);
    const { memberId } = req.params;

    // Find the member by ID
    const member = await Member.findById(memberId);
    if (!member) {
      return res.status(404).json({ message: "Member not found" });
    }

    // Find all receipts for the member
    const receipts = await Receipt.find({ member: memberId });

    // Filter for "Membership Fee" payment
    let membershipPayment = null;
    for (const receipt of receipts) {
      const payment = receipt.payments.find(
        (p) => p.paymentType === "Membership Fee",
      );
      if (payment) {
        membershipPayment = payment;
        break;
      }
    }

    if (!membershipPayment) {
      return res
        .status(404)
        .json({ message: "Membership Fee payment not found" });
    }

    // Send the payment info as response
    return res.status(200).json(membershipPayment);
  } catch (error) {
    console.error("Error fetching membership receipt:", error);
    res.status(500).json({ message: "Server error" });
  }
};

const getMemberOnlineApplication = async (req, res) => {
  try {
    console.log(
      "Received request to get member online application...",
      req.params,
    );
    const applicationData = await Online.findById(req.params.id); // NOT .find()
    if (!applicationData) return res.status(404).json({ message: "Not found" });

    res.status(200).json(applicationData);
  } catch (error) {}
};

const ShareResetPasswordCredentials = async ({
  name,
  email,
  SeniorityID,
  password,
}) => {
  const mailOptions = {
    from: `"Defence Habitat Housing Co-operative Society Ltd." <${process.env.DHS_NODEMAILER_MAIL}>`,
    to: email,
    subject: "Your Member Login Credentials — Defence Habitat",
    html: `
      <div style="border:1px solid #1f4892; font-family: Arial, sans-serif;">
        <div style="background-color: #1f4892; height: 50px;"></div>
        <div style="padding: 20px;">
          <p>Dear <strong>${name}</strong>,</p>
          <p>Your account password has been changed. Below are your new login details.</p>

          <table cellpadding="10" style="border-collapse: collapse;">
            <tr>
              <td style="background-color: #666; color: white;"><strong>Member ID</strong></td>
              <td><div style="border: 1px solid #ccc; padding: 8px;">${SeniorityID}</div></td>
            </tr>
            <tr>
              <td style="background-color: #666; color: white;"><strong>Email</strong></td>
              <td><div style="border: 1px solid #ccc; padding: 8px;">${email}</div></td>
            </tr>
            <tr>
              <td style="background-color: #666; color: white;"><strong>Password</strong></td>
              <td><div style="border: 1px solid #ccc; padding: 8px;">${password}</div></td>
            </tr>
           
          </table>

          <p>Click here to login: <a href="https://defencehousingsociety.com/memberlogin">https://defencehousingsociety.com/memberlogin</a></p>

          <p><strong>THANK YOU</strong></p>
          <p><strong>For further details, contact</strong><br>
          Behind Swathi Garden Hotel<br>
          E Block, Sahakarnagar,<br>
          Bengaluru - 560 092. Ph: 080 - 29903931</p>
        </div>
      </div>
    `,
  };
  return transporter.sendMail(mailOptions);
};

const ResetPassword = async (req, res) => {
  try {
    console.log("Received request to reset password...", req.body);
    // const { seniorityId, password } = req.body;
    const { membershipNo, password } = req.body;

    if (!membershipNo || !password) {
      return res.status(400).json({
        message: "Membership Number and password are required.",
      });
    }

    // Find the member by seniority ID
    // const member = await Member.findOne({ SeniorityID: seniorityId });
    const member = await Member.findOne({
      MembershipNo: membershipNo,
    });

    if (!member) {
      return res.status(404).json({ message: "Member not found." });
    }

    // Update password directly (no bcrypt — matches your current approach)
    member.password = password;
    await member.save();

    // Create a short reference for this change (you can change format)
    const reference = `REF-${member._id
      .toString()
      .slice(-6)
      .toUpperCase()}-${Date.now().toString().slice(-5)}`;

    // Attempt to send email with new credentials
    try {
      await ShareResetPasswordCredentials({
        name: member.name || "Member",
        email: member.email,
        // SeniorityID: member.SeniorityID,
        MembershipNo: member.MembershipNo,
        password,
        // reference,
      });

      // Email succeeded
      return res.status(200).json({
        message:
          "Password updated successfully. Login details emailed to member.",
        // reference,
      });
    } catch (emailErr) {
      console.error("Password updated but failed to send email:", emailErr);
      // Still return success for password change, but inform about email failure
      return res.status(200).json({
        message:
          "Password updated successfully, but failed to send email to member. Please retry sending the email.",
        // reference,
        emailError: true,
      });
    }
  } catch (error) {
    console.error("Error resetting password:", error);
    res.status(500).json({ message: "Server error. Please try again." });
  }
};

const DeleteAllMembersAndReceipts = async (req, res) => {
  try {
    const memberResult = await Member.deleteMany({});
    const receiptsResult = await Receipt.deleteMany({});

    return res.status(200).json({
      success: true,
      message: "All members and receipts deleted successfully",
      membersDeleted: memberResult.deletedCount,
      receiptsDeleted: receiptsResult.deletedCount,
    });
  } catch (err) {
    console.error("DeleteAllMembersAndReceipts error:", err);
    return res.status(500).json({
      success: false,
      message: "Failed to delete members and receipts",
    });
  }
};

const DeleteReceiptsData = async (req, res) => {
  try {
    const receiptsResult = await Receipt.deleteMany({});
    return res.status(200).json({
      success: true,
      message: "All receipts deleted successfully",
      receiptsDeleted: receiptsResult.deletedCount,
    });
  } catch (err) {
    console.error("DeleteReceiptsData error:", err);
    return res.status(500).json({
      success: false,
      message: "Failed to delete receipts",
    });
  }
};

const DeleteReceiptsDataOtherThanMembershipFee = async (req, res) => {
  try {
    if (req.query.confirm !== "YES") {
      return res.status(400).json({
        message: "Please confirm deletion by passing ?confirm=YES",
      });
    }

    const receipts = await Receipt.find({}).populate("member");

    let totalModified = 0;
    let totalPaymentsRemoved = 0;
    let totalDeletedReceipts = 0;

    for (const receipt of receipts) {
      const originalPayments = receipt.payments;

      // 🔥 Calculate amount to subtract
      let amountToSubtract = 0;

      for (const p of originalPayments) {
        const type = (p.paymentType || "").toLowerCase();

        const isMembership = type === "membership fee";

        if (!isMembership) {
          const isInstallment = type.includes("install");
          const eligibleTypes = ["siteadvance", "sitedownpayment"];

          if (isInstallment || eligibleTypes.includes(type)) {
            amountToSubtract += Number(p.amount || 0);
          }
        }
      }

      // 🔥 Update member paidAmount
      if (amountToSubtract > 0 && receipt.member) {
        const member = receipt.member;

        member.propertyDetails = member.propertyDetails || {};

        member.propertyDetails.paidAmount = Math.max(
          0,
          Number(member.propertyDetails.paidAmount || 0) - amountToSubtract,
        );

        await member.save();
      }

      // ✅ Keep ONLY Membership Fee
      receipt.payments = receipt.payments.filter(
        (p) => (p.paymentType || "").toLowerCase() === "membership fee",
      );

      const newCount = receipt.payments.length;

      if (newCount === 0) {
        await Receipt.findByIdAndDelete(receipt._id);
        totalDeletedReceipts++;
        continue;
      }

      if (newCount !== originalPayments.length) {
        totalModified++;
        totalPaymentsRemoved += originalPayments.length - newCount;
        await receipt.save();
      }
    }

    return res.status(200).json({
      success: true,
      message: "Non-membership receipts deleted successfully",
      receiptsUpdated: totalModified,
      paymentsRemoved: totalPaymentsRemoved,
      receiptsDeleted: totalDeletedReceipts,
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Error deleting receipts" });
  }
};

export default {
  addMemberDetails,
  uploadFromGoogleSheet,
  getMemberDetails,
  checkDuplicates,
  updateStatus,
  getInactiveMembers,
  getConfirmation,
  addConfirmation,
  getAllAffidavits,
  sendMemberLoginDetails,
  deleteMember,
  getMemberById,
  updateMemberDetails,
  addReceiptToMember,
  editReceiptToMember,
  checkDuplicatesPaymentTypeToAddReceipt,
  editConfirmationLetter,
  getAffidavitById,
  getMemberData,
  deleteMemberReceiptPaymentEach,
  collectSeniorityIds,
  collectMemberInfoOnSeniorityIds,
  getMemberReceipt,
  getMemberOnlineApplication,
  ResetPassword,
  DeleteAllMembersAndReceipts,
  DeleteReceiptsData,
  deleteAffidavit,
  deleteAllAffidavits,
  DeleteReceiptsDataOtherThanMembershipFee,
};

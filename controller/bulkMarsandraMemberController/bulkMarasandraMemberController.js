import Member from "../../model/memberModel.js"; // adjust path as needed
import Receipt from "../../model/receiptModel.js";
import upload from "../../middleware/multer.js";
import MemberAffidavit from "../../model/memberAffidavit.js"; // adjust path as needed
import { uploadToCloudinary } from "../../utils/cloudinary.js"; // adjust path as needed
import { generateUniquePassword } from "../../utils/generatePassword.js";
import { transporter } from "../../utils/emailTransporter.js";
import { createReceipt } from "../receiptController/receiptController.js";
import Project from "../../model/projectModel.js"; // make sure the path is correct
import mongoose from "mongoose";
import Online from "../../model/onlineModel.js";
// controllers/googleSheetUploadController.js
import { google } from "googleapis";
import dotenv from "dotenv";
dotenv.config();

const SHEET_ID = process.env.MARASANDRA_GOOGLE_SHEET_ID;
const CLIENT_EMAIL = process.env.GOOGLE_SERVICE_ACCOUNT_CLIENT_EMAIL;
let PRIVATE_KEY = process.env.GOOGLE_PRIVATE_KEY;
const RANGE =
  process.env.MARASANDRA_GOOGLE_SHEET_RANGE || "UM-Marasandra!A1:BA";

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
  "father/spousename": "fatherName",
  "father/spouse name": "fatherName",
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

    // return new Date(Number(year), Number(month) - 1, Number(day));
    return new Date(Date.UTC(Number(year), Number(month) - 1, Number(day)));
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

const uploadMarasandraMembersFromGoogleSheet = async (req, res) => {
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
            // propertySize: parseNumber(rowObj.propertySize) || 0,
            propertySize:
              (parseNumber(rowObj.plotLength) || 0) *
              (parseNumber(rowObj.plotBreadth) || 0),
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

export default {
  uploadMarasandraMembersFromGoogleSheet,
};

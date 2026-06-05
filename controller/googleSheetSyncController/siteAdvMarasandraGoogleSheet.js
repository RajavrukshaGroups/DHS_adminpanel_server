import mongoose from "mongoose";
import Receipt from "../../model/receiptModel.js";
import Member from "../../model/memberModel.js";
import { createReceipt } from "../receiptController/receiptController.js";
import { google } from "googleapis";
import dotenv from "dotenv";
dotenv.config();

//live
// #test
// const SHEET_ID = "1id7Gr9MGZEjDjffo62saVbg-JQraV0BCu_VOdsJbwLA";

// #live
const SHEET_ID = "1vLjPNbkbxWIC_GLJzh8KvXprsMKbPC_irQJsYb9n5YU";

// #test
// const SHEET_RANGE = "Siteadv-Marasandra!A1:L"; // header included

// #live
const SHEET_RANGE = "Siteadv-Marasandra!A:O"; // header included
const CLIENT_EMAIL = process.env.GOOGLE_SERVICE_ACCOUNT_CLIENT_EMAIL;
let PRIVATE_KEY = process.env.GOOGLE_PRIVATE_KEY;

const authClient = new google.auth.JWT({
  email: CLIENT_EMAIL,
  key: PRIVATE_KEY,
  scopes: ["https://www.googleapis.com/auth/spreadsheets.readonly"],
});
const sheets = google.sheets({ version: "v4", auth: authClient });

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

const parseAmount = (value) =>
  Number(
    String(value || "")
      .replace(/,/g, "")
      .trim(),
  ) || 0;

const SyncSiteAdvanceFromMarasandraSheet = async (req, res) => {
  try {
    const { uniqueRowId } = req.body;

    if (!uniqueRowId) {
      return res.status(400).json({
        success: false,
        message: "uniqueRowId is required",
      });
    }

    const response = await sheets.spreadsheets.values.get({
      spreadsheetId: SHEET_ID,
      range: SHEET_RANGE,
    });

    const rows = response.data.values;

    if (!rows?.length) {
      return res.status(400).json({
        success: false,
        message: "No sheet data found",
      });
    }

    const row = rows
      .slice(1)
      .find((r) => String(r[12] || "").trim() === String(uniqueRowId).trim());

    if (!row) {
      return res.status(404).json({
        success: false,
        message: "Payment row not found in sheet",
      });
    }

    const membershipNo = String(row[1] || "").trim();

    const member = await Member.findOne({
      MembershipNo: membershipNo,
    });

    if (!member) {
      return res.status(404).json({
        success: false,
        message: "Member not found",
      });
    }

    const receipt = await Receipt.findOne({
      MembershipNo: membershipNo,
    });

    if (!receipt) {
      return res.status(404).json({
        success: false,
        message: "Receipt not found",
      });
    }

    const existingPayment = receipt.payments.find(
      (payment) => payment.uniqueRowId === uniqueRowId,
    );

    if (existingPayment) {
      return res.status(409).json({
        success: false,
        message: "Payment already exists",
      });
    }

    const paymentMode = String(row[6] || "").toLowerCase();

    const transactionDetails = row[10] || "";

    const paymentEntry = {
      uniqueRowId,

      receiptNo: row[3] || "",

      date: parseDate(row[2]),

      paymentType: row[4] || "",

      installmentNumber: row[5] || undefined,

      paymentMode,

      bankName: row[7] || "",

      branchName: row[8] || "",

      //   amount: Number(row[9]) || 0,
      amount: parseAmount(row[9]),

      correspondenceAddress: row[11] || "",

      chequeNumber: "",

      transactionId: "",

      ddNumber: "",
    };

    if (paymentMode === "cheque") {
      paymentEntry.chequeNumber = transactionDetails;
    }

    if (paymentMode === "netbanking/upi") {
      paymentEntry.transactionId = transactionDetails;
    }

    if (paymentMode === "dd") {
      paymentEntry.ddNumber = transactionDetails;
    }

    receipt.payments.push(paymentEntry);

    await receipt.save();

    await Member.findByIdAndUpdate(
      member._id,
      {
        $inc: {
          "propertyDetails.paidAmount": parseAmount(row[9]) || 0,
        },
      },
      { new: true },
    );

    return res.status(200).json({
      success: true,
      message: "Payment record created successfully",
      uniqueRowId,
      membershipNo,
    });
  } catch (err) {
    console.error("SyncSiteAdvanceFromTapasihalliSheet Error:", err);

    return res.status(500).json({
      success: false,
      message: err.message,
    });
  }
};

const UpdateSiteAdvanceFromMarasandraSheet = async (req, res) => {
  try {
    const { uniqueRowId } = req.body;

    if (!uniqueRowId) {
      return res.status(400).json({
        success: false,
        message: "uniqueRowId is required",
      });
    }

    const response = await sheets.spreadsheets.values.get({
      spreadsheetId: SHEET_ID,
      range: SHEET_RANGE,
    });

    const rows = response.data.values;

    const row = rows
      .slice(1)
      .find((r) => String(r[12] || "").trim() === String(uniqueRowId).trim());

    if (!row) {
      return res.status(404).json({
        success: false,
        message: "Payment row not found in sheet",
      });
    }

    // const membershipNo = String(row[1] || "").trim();
    const sheetMembershipNo = String(row[1] || "").trim();

    const originalMembershipNo = String(uniqueRowId).split("_")[0];

    if (sheetMembershipNo !== originalMembershipNo) {
      return res.status(400).json({
        success: false,
        message: "MembershipNo cannot be modified for existing payment",
      });
    }

    const member = await Member.findOne({
      MembershipNo: originalMembershipNo,
    });

    if (!member) {
      return res.status(404).json({
        success: false,
        message: "Member not found",
      });
    }

    const receipt = await Receipt.findOne({
      MembershipNo: originalMembershipNo,
    });

    if (!receipt) {
      return res.status(404).json({
        success: false,
        message: "Receipt not found",
      });
    }

    const payment = receipt.payments.find((p) => p.uniqueRowId === uniqueRowId);

    // if (receipt.MembershipNo !== membershipNo) {
    //   return res.status(400).json({
    //     success: false,
    //     message: "Membership mismatch detected",
    //   });
    // }

    if (!payment) {
      return res.status(400).json({
        success: false,
        message:
          "Payment not found. MembershipNo or UniqueRowId may have been modified.",
      });
    }

    const oldAmount = payment.amount || 0;

    const paymentMode = String(row[6] || "").toLowerCase();

    const transactionDetails = row[10] || "";

    payment.receiptNo = row[3] || "";

    payment.date = parseDate(row[2]);

    payment.paymentType = row[4] || "";

    payment.installmentNumber = row[5] || undefined;

    payment.paymentMode = paymentMode;

    payment.bankName = row[7] || "";

    payment.branchName = row[8] || "";

    payment.amount = parseAmount(row[9]);

    payment.correspondenceAddress = row[11] || "";

    payment.chequeNumber = "";
    payment.transactionId = "";
    payment.ddNumber = "";

    if (paymentMode === "cheque") {
      payment.chequeNumber = transactionDetails;
    }

    if (paymentMode === "netbanking/upi") {
      payment.transactionId = transactionDetails;
    }

    if (paymentMode === "dd") {
      payment.ddNumber = transactionDetails;
    }

    await receipt.save();

    const difference = parseAmount(row[9]) - oldAmount;

    await Member.findByIdAndUpdate(
      member._id,
      {
        $inc: {
          "propertyDetails.paidAmount": difference,
        },
      },
      { new: true },
    );

    return res.status(200).json({
      success: true,
      message: "payment record updated successfully",
      uniqueRowId,
      membershipNo: originalMembershipNo,
    });
  } catch (err) {
    console.error("UpdateSiteAdvanceFromTapasihalliSheet Error:", err);

    return res.status(500).json({
      success: false,
      message: err.message,
    });
  }
};

export default {
  SyncSiteAdvanceFromMarasandraSheet,
  UpdateSiteAdvanceFromMarasandraSheet,
};

import { google } from "googleapis";
import dotenv from "dotenv";
import Member from "../../model/memberModel.js";
import Receipt from "../../model/receiptModel.js";
import { generateUniquePassword } from "../../utils/generatePassword.js";
import { createReceipt } from "../receiptController/receiptController.js";
dotenv.config();

const SHEET_ID = process.env.MARASANDRA_GOOGLE_SHEET_ID;
const CLIENT_EMAIL = process.env.GOOGLE_SERVICE_ACCOUNT_CLIENT_EMAIL;
let PRIVATE_KEY = process.env.GOOGLE_PRIVATE_KEY;
const SHEET_RANGE =
  process.env.MARASANDRA_GOOGLE_SHEET_RANGE || "UM-Marasandra!A1:BA";

if (PRIVATE_KEY && PRIVATE_KEY.startsWith('"') && PRIVATE_KEY.endsWith('"')) {
  PRIVATE_KEY = PRIVATE_KEY.slice(1, -1);
}

if (PRIVATE_KEY) {
  PRIVATE_KEY = PRIVATE_KEY.replace(/\\n/g, "\n");
}

const authClient = new google.auth.JWT({
  email: CLIENT_EMAIL,
  key: PRIVATE_KEY,
  scopes: ["https://www.googleapis.com/auth/spreadsheets.readonly"],
});

const sheets = google.sheets({
  version: "v4",
  auth: authClient,
});

function parseDate(val) {
  if (!val) return undefined;

  const s = String(val).trim();
  if (!s) return undefined;

  const parts = s.split(/[\/\-\.]/);

  if (parts.length === 3) {
    let day = parts[0];
    let month = parts[1];
    let year = parts[2];

    if (year.length === 2) {
      year = `20${year}`;
    }

    if (day.length === 4) {
      year = day;
      month = parts[1];
      day = parts[2];
    }

    day = String(day).padStart(2, "0");
    month = String(month).padStart(2, "0");

    return new Date(Date.UTC(Number(year), Number(month) - 1, Number(day)));
  }

  return undefined;
}
const SyncSingleMemberFromMarasandraSheet = async (req, res) => {
  try {
    const { membershipNo } = req.body;

    if (!membershipNo) {
      return res.status(400).json({
        message: "MembershipNo required",
      });
    }

    const response = await sheets.spreadsheets.values.get({
      spreadsheetId: SHEET_ID,
      range: SHEET_RANGE,
    });

    const rows = response.data.values;

    if (!rows?.length) {
      return res.status(400).json({
        message: "No sheet data found",
      });
    }

    const headers = rows[0];

    const membershipIndex = headers.findIndex(
      (h) => String(h).trim().toLowerCase() === "membershipno",
    );

    const row = rows
      .slice(1)
      .find((r) => String(r[membershipIndex] || "").trim() === membershipNo);

    if (!row) {
      return res.status(404).json({
        message: "Membership not found in sheet",
      });
    }

    const memberData = {
      // Personal Details
      rankDesignation: row[1] || "",
      serviceId: row[2] || "",
      saluation: row[3] || "",
      name: row[4] || "",
      mobileNumber: Number(row[5]) || 0,
      AlternativeNumber: Number(row[6]) || 0,
      email: row[7] || "",
      //   dateofbirth: row[8] || "",
      dateofbirth: parseDate(row[8]),
      fatherName: row[9] || "",
      contactAddress: row[10] || "",
      permanentAddress: row[11] || "",
      workingAddress: row[12] || "",
      MemberPhoto: row[13] || "",

      // Nominee Details
      nomineeName: row[14] || "",
      nomineeAge: Number(row[15]) || 0,
      nomineeRelation: row[16] || "",
      nomineeAddress: row[17] || "",

      // Member Details
      SeniorityID: row[18] || "",
      MembershipNo: row[19] || "",
      ConfirmationLetterNo: row[20] || "",
      ShareCertificateNumber: row[21] || "",

      //   date: row[22] || "",
      date: parseDate(row[22]),
      // Property Details
      propertyDetails: {
        projectName: row[23] || "",

        propertySize: (Number(row[29]) || 0) * (Number(row[30]) || 0),

        pricePerSqft: Number(row[25]) || 0,
        propertyCost: Number(row[26]) || 0,
        percentage: Number(row[27]) || 0,
        percentageCost: Number(row[28]) || 0,
        length: Number(row[29]) || 0,
        breadth: Number(row[30]) || 0,
      },

      // Receipt Details
      receiptData: {
        receiptNo: row[31] || "",
        numberOfShares: Number(row[32]) || 0,
        shareFee: Number(row[33]) || 0,
        membershipFee: Number(row[34]) || 0,
        applicationFee: Number(row[35]) || 0,
        admissionFee: Number(row[36]) || 0,
        miscellaneousExpenses: Number(row[37]) || 0,
        paymentType: row[38] || "",
        paymentMode: row[39] || "",
        bankName: row[40] || "",
        branchName: row[41] || "",
        amount: Number(row[42]) || 0,
        transactionDetails: row[43] || "",
      },
    };

    console.log(JSON.stringify(memberData, null, 2));

    const existingMember = await Member.findOne({
      MembershipNo: String(memberData.MembershipNo).trim(),
    });

    // const existingMember = await Member.findOne({
    //   MembershipNo: String(memberData.MembershipNo).trim(),
    // });

    console.log("Existing Member:", existingMember?._id);

    let member;

    // if (existingMember) {
    //   return res.status(200).json({
    //     success: true,
    //     message: "Member already exists",
    //     memberId: existingMember._id,
    //   });
    // }

    if (existingMember) {
      return res.status(409).json({
        success: false,
        message: `Member already exists with MembershipNo ${memberData.MembershipNo}`,
        memberId: existingMember._id,
      });
    }

    const password = await generateUniquePassword();

    console.log("Creating Member...");

    member = await Member.create({
      rankDesignation: memberData.rankDesignation,
      serviceId: memberData.serviceId,
      saluation: memberData.saluation,
      name: memberData.name,
      mobileNumber: memberData.mobileNumber,
      AlternativeNumber: memberData.AlternativeNumber,
      email: memberData.email,
      dateofbirth: memberData.dateofbirth,
      fatherName: memberData.fatherName,
      contactAddress: memberData.contactAddress,
      permanentAddress: memberData.permanentAddress,
      workingAddress: memberData.workingAddress,
      MemberPhoto: memberData.MemberPhoto,

      nomineeName: memberData.nomineeName,
      nomineeAge: memberData.nomineeAge,
      nomineeRelation: memberData.nomineeRelation,
      nomineeAddress: memberData.nomineeAddress,

      SeniorityID: memberData.SeniorityID,
      MembershipNo: memberData.MembershipNo,
      ConfirmationLetterNo: memberData.ConfirmationLetterNo,
      ShareCertificateNumber: memberData.ShareCertificateNumber,

      propertyDetails: memberData.propertyDetails,

      password,
    });

    console.log("Member Created Successfully", member._id);

    // Create Membership Fee Receipt

    const receiptData = {
      recieptNo: memberData.receiptData.receiptNo,
      date: memberData.date,

      paymentType: memberData.receiptData.paymentType,
      paymentMode: memberData.receiptData.paymentMode,

      bankName: memberData.receiptData.bankName,
      branchName: memberData.receiptData.branchName,

      amount: memberData.receiptData.amount,

      numberOfShares: memberData.receiptData.numberOfShares,
      shareFee: memberData.receiptData.shareFee,
      memberShipFee: memberData.receiptData.membershipFee,
      applicationFee: memberData.receiptData.applicationFee,
      adminissionFee: memberData.receiptData.admissionFee,
      miscellaneousExpenses: memberData.receiptData.miscellaneousExpenses,
    };

    // Transaction Details Mapping

    if (memberData.receiptData.paymentMode?.toLowerCase() === "cheque") {
      receiptData.chequeNumber = memberData.receiptData.transactionDetails;
    }

    if (
      memberData.receiptData.paymentMode?.toLowerCase() === "netbanking/upi"
    ) {
      receiptData.transactionId = memberData.receiptData.transactionDetails;
    }

    if (memberData.receiptData.paymentMode?.toLowerCase() === "dd") {
      receiptData.ddNumber = memberData.receiptData.transactionDetails;
    }

    // Create Receipt

    const receiptResponse = await createReceipt(member._id, receiptData);

    console.log("Receipt Response", receiptResponse);

    return res.status(200).json({
      success: true,
      message: "Member and Receipt created successfully",
      memberId: member._id,
      receiptId: receiptResponse?.data?._id,
    });
  } catch (err) {
    console.error(err);

    return res.status(500).json({
      message: err.message,
    });
  }
};

const UpdateMemberFromMarasandraSheet = async (req, res) => {
  try {
    const { membershipNo } = req.body;

    if (!membershipNo) {
      return res.status(400).json({
        message: "MembershipNo required",
      });
    }

    const response = await sheets.spreadsheets.values.get({
      spreadsheetId: SHEET_ID,
      range: SHEET_RANGE,
    });

    const rows = response.data.values;

    if (!rows?.length) {
      return res.status(400).json({
        message: "No sheet data found",
      });
    }

    const headers = rows[0];

    const membershipIndex = headers.findIndex(
      (h) => String(h).trim().toLowerCase() === "membershipno",
    );

    const row = rows
      .slice(1)
      .find((r) => String(r[membershipIndex] || "").trim() === membershipNo);

    if (!row) {
      return res.status(404).json({
        message: "Membership not found in sheet",
      });
    }

    const existingMember = await Member.findOne({
      MembershipNo: membershipNo,
    });

    if (!existingMember) {
      return res.status(404).json({
        success: false,
        message:
          "Member not found in database. Use Sync API to create member first.",
      });
    }

    const memberData = {
      rankDesignation: row[1] || "",
      serviceId: row[2] || "",
      saluation: row[3] || "",
      name: row[4] || "",
      mobileNumber: Number(row[5]) || 0,
      AlternativeNumber: Number(row[6]) || 0,
      email: row[7] || "",
      dateofbirth: parseDate(row[8]),
      fatherName: row[9] || "",
      contactAddress: row[10] || "",
      permanentAddress: row[11] || "",
      workingAddress: row[12] || "",
      MemberPhoto: row[13] || "",

      nomineeName: row[14] || "",
      nomineeAge: Number(row[15]) || 0,
      nomineeRelation: row[16] || "",
      nomineeAddress: row[17] || "",

      SeniorityID: row[18] || "",
      MembershipNo: row[19] || "",
      ConfirmationLetterNo: row[20] || "",
      ShareCertificateNumber: row[21] || "",

      date: parseDate(row[22]),

      propertyDetails: {
        ...(existingMember.propertyDetails?.toObject?.() || {}),

        projectName: row[23] || "",
        propertySize: Number(row[29] || 0) * Number(row[30] || 0),

        pricePerSqft: Number(row[25]) || 0,
        propertyCost: Number(row[26]) || 0,
        percentage: Number(row[27]) || 0,
        percentageCost: Number(row[28]) || 0,
        length: Number(row[29]) || 0,
        breadth: Number(row[30]) || 0,
      },
    };

    const updatedMember = await Member.findByIdAndUpdate(
      existingMember._id,
      memberData,
      { new: true },
    );

    const receipt = await Receipt.findOne({
      MembershipNo: membershipNo,
    });

    if (receipt) {
      const membershipPayment = receipt.payments.find(
        (payment) =>
          payment.paymentType?.toLowerCase() === "membership fee".toLowerCase(),
      );

      if (membershipPayment) {
        membershipPayment.receiptNo = row[31] || "";

        membershipPayment.numberOfShares = Number(row[32]) || 0;

        membershipPayment.shareFee = Number(row[33]) || 0;

        membershipPayment.membershipFee = Number(row[34]) || 0;

        membershipPayment.applicationFee = Number(row[35]) || 0;

        membershipPayment.admissionFee = Number(row[36]) || 0;

        membershipPayment.miscellaneousExpenses = Number(row[37]) || 0;

        membershipPayment.paymentType = row[38] || "Membership Fee";

        membershipPayment.paymentMode = row[39] || "";

        membershipPayment.bankName = row[40] || "";

        membershipPayment.branchName = row[41] || "";

        membershipPayment.amount = Number(row[42]) || 0;

        membershipPayment.date = parseDate(row[22]);

        const transactionDetails = row[43] || "";

        membershipPayment.chequeNumber = "";
        membershipPayment.transactionId = "";
        membershipPayment.ddNumber = "";

        if (membershipPayment.paymentMode.toLowerCase() === "cheque") {
          membershipPayment.chequeNumber = transactionDetails;
        }

        if (membershipPayment.paymentMode.toLowerCase() === "netbanking/upi") {
          membershipPayment.transactionId = transactionDetails;
        }

        if (membershipPayment.paymentMode.toLowerCase() === "dd") {
          membershipPayment.ddNumber = transactionDetails;
        }

        await receipt.save();
      }
    }

    return res.status(200).json({
      success: true,
      message: "Member and Receipt updated successfully",
      memberId: updatedMember._id,
    });
  } catch (err) {
    console.error(err);

    return res.status(500).json({
      message: err.message,
    });
  }
};

export default {
  SyncSingleMemberFromMarasandraSheet,
  UpdateMemberFromMarasandraSheet,
};

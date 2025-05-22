// receiptController.js
import Receipt from "../../model/receiptModel.js";
import Member from "../../model/memberModel.js";
import numberToWords from "number-to-words";
import MemberAffidavit from "../../model/memberAffidavit.js";
import mongoose from "mongoose";
import numWords from 'num-words'; // Add this import at the top

export const createReceipt = async (memberId, data) => {
  console.log("data new receipt", data);
  try {
    const paymentEntry = {
      receiptNo: data.recieptNo,
      date: new Date(data.date),
      paymentType: data.paymentType, // 'Membership Fee'
      installmentNumber: data.installment || undefined,
      paymentMode: data.paymentMode,
      bankName: data.bankName,
      branchName: data.branchName,
      amount: Number(data.amount),
      chequeNumber: data.chequeNumber,
      ddNumber: data.ddNumber,
      transactionId: data.transactionId,

      // Membership Fee breakdown
      applicationFee: Number(data.applicationFee) || undefined,
      admissionFee: Number(data.adminissionFee) || undefined,
      miscellaneousExpenses: Number(data.miscellaneousExpenses) || undefined,
      membershipFee: Number(data.memberShipFee) || undefined,
      shareFee: Number(data.shareFee) || undefined,
    };
    console.log("payment entry installment", paymentEntry);
    let receipt = await Receipt.findOne({ member: memberId });

    if (receipt) {
      // Add new payment entry to existing receipt
      receipt.payments.push(paymentEntry);
    } else {
      // Create new receipt document
      receipt = new Receipt({
        member: memberId,
        payments: [paymentEntry],
      });
    }

    await receipt.save();
    // ✅ Add receipt ID to member.receiptIds (use $addToSet to avoid duplicates)
    await Member.findByIdAndUpdate(memberId, {
      $addToSet: { receiptId: receipt._id },
    });

    return {
      status: 200,
      data: receipt,
    };
  } catch (error) {
    console.error("Error creating receipt:", error);
    return {
      status: 500,
      error: error.message,
    };
  }
};

const fetchReceipts = async (req, res) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 10;
    const search = req.query.search?.trim() || "";
    const skip = (page - 1) * limit;

    let query = {};

    if (search) {
      // Find matching members based on name, SeniorityID, or project name
      const matchingMembers = await Member.find({
        $or: [
          { name: new RegExp(search, "i") },
          { SeniorityID: new RegExp(search, "i") },
          { "propertyDetails.projectName": new RegExp(search, "i") },
        ],
      }).select("_id");
      console.log("matching members", matchingMembers);

      const matchingMemberIds = matchingMembers.map((m) => m._id);

      query = {
        $or: [
          { receiptNo: new RegExp(search, "i") },
          { member: { $in: matchingMemberIds } },
        ],
      };
    }

    const totalCount = await Receipt.countDocuments(query);

    const receipts = await Receipt.find(query)
      .populate({
        path: "member",
        select:
          "name mobileNumber email SeniorityID isActive date propertyDetails",
      })
      .sort({ date: -1 })
      .skip(skip)
      .limit(limit);

    const totalPages = Math.ceil(totalCount / limit);

    res.status(200).json({
      data: receipts,
      totalPages,
      currentPage: page,
    });
  } catch (err) {
    console.error("error fetching receipts", err);
    res.status(500).json({ error: "Failed to fetch receipts." });
  }
};

const getReceiptDetailsById = async (req, res) => {
  try {
    const { id } = req.params;
    // const { paymentType } = req.query;
    const { paymentType, installmentNumber } = req.query;

    const receipt = await Receipt.findById(id).populate({
      path: "member",
      select:
        "name permanentAddress SeniorityID propertyDetails mobileNumber email",
    });

    if (!receipt) {
      return res.status(404).json({
        success: false,
        message: "Receipt not found",
      });
    }

    console.log("receipt-member", receipt);

    // const payment = receipt.payments.find((p) => p.paymentType === paymentType);
    let payment;

    if (paymentType === "installments" && installmentNumber) {
      payment = receipt.payments.find(
        (p) =>
          p.paymentType === "installments" &&
          p.installmentNumber === installmentNumber
      );
    } else {
      payment = receipt.payments.find((p) => p.paymentType === paymentType);
    }
    console.log("payment installment", payment);

    if (!payment) {
      return res.status(404).json({
        success: false,
        message: `Payment of type "${paymentType}" not found for this receipt.`,
      });
    }
    const allItems = [
      { name: "Membership Fee", amount: payment.membershipFee || 0 },
      { name: "Admission Fee", amount: payment.admissionFee || 0 },
      { name: "Share Fee", amount: payment.shareFee || 0 },
      { name: "Application Fee", amount: payment.applicationFee || 0 },
      {
        name: "Site Down Payment",
        amount: payment.paymentType === "siteDownPayment" ? payment.amount : 0,
      },
      {
        name: "Site Advance",
        amount: payment.paymentType === "siteAdvance" ? payment.amount : 0,
      },
      {
        name: "1st Installment",
        amount:
          payment.installmentNumber === "firstInstallment" ? payment.amount : 0,
      },
      {
        name: "2nd Installment",
        amount:
          payment.installmentNumber === "secondInstallment"
            ? payment.amount
            : 0,
      },
      {
        name: "3rd Installment",
        amount:
          payment.installmentNumber === "thirdInstallment" ? payment.amount : 0,
      },
      {
        name: "Miscellaneous Expenses",
        amount: payment.miscellaneousExpenses || 0,
      },
      { name: "Other Charges", amount: payment.otherCharges || 0 },
    ];

    // const filteredItems = allItems.filter((item) => item.amount > 0);
    const filteredItems = allItems.map((item) => ({
      ...item,
      amount: item.amount || 0, // default to 0 if undefined/null
    }));

    console.log("filteredItems", filteredItems);
    const totalAmount = filteredItems.reduce(
      (sum, item) => sum + item.amount,
      0
    );

    const receiptData = {
      projectName:
        payment.paymentType.toLowerCase() === "membership fee"
          ? ""
          : receipt.member.propertyDetails.projectName,
      plotDimension:
        payment.paymentType.toLowerCase() === "membership fee"
          ? ""
          : `${receipt.member.propertyDetails.length} X ${receipt.member.propertyDetails.breadth}`,
      paymentMode: payment.paymentMode,
      receiptNumber: payment.receiptNo,
      date: new Date(payment.date).toLocaleDateString("en-GB"),
      name: receipt.member.name,
      address: receipt.member.permanentAddress || "-",
      amountInWords: convertNumberToWords(payment.amount),
      // total: payment.amount,
      total: totalAmount,
      bankName: payment.bankName || "",
      branchName: payment.branchName || "",
      chequeNumber: payment.chequeNumber || "",
      ddNumber: payment.ddNumber || "",
      transactionId: payment.transactionId || "",
      items: filteredItems,
    };

    console.log("receipt for installment", receiptData);

    res.render("receipt", { ...receiptData });
  } catch (err) {
    console.error("Error fetching single receipt:", err);
    res.status(500).send("Failed to fetch receipt details.");
  }
};

// Converts number to capitalized words + "Only"
function convertNumberToWords(amount) {
  return (
    numberToWords
      .toWords(amount || 0)
      .replace(/\b\w/g, (char) => char.toUpperCase()) + " Only"
  );
}

//for receipt history at View User Details
const getViewReceiptHistory = async (req, res) => {
  try {
    const memberId = req.params.id;
    const member = await Member.findById(memberId);

    if (!member) return res.status(404).json({ message: "Member not found" });

    const receipts = await Receipt.find({
      _id: { $in: member.receiptId },
    });

    res.status(200).json(receipts);
  } catch (err) {
    console.error("Error fetching receipts:", err);
    res.status(500).json({ message: "Internal Server Error" });
  }
};

const viewconfirmation =async(req,res)=>{
  try {
    const { memberId } = req.params;
    console.log(memberId,'memberiddddddddd');
    const affidavit = await MemberAffidavit.findOne({
      userId: memberId,
    }).populate("userId");
    

    console.log("Affidavit data:", affidavit);

    if (!affidavit) {
      return res.status(404).send("Affidavit not found");
    }
      // Convert amount to words
    const amount = affidavit.totalPaidAmount || 0;
    const amountInWords = numWords(amount);
    const formattedAmountInWords = amountInWords.charAt(0).toUpperCase() + amountInWords.slice(1);
   console.log(formattedAmountInWords,'ffffffffffffffffffffffffffffff');
   
    res.render("viewsiteBookingConfirmation", {
      member: affidavit,
      amountInWords: formattedAmountInWords,
    });

    // res.render("viewsiteBookingConfirmation", { member: affidavit });
} catch (error) {
    console.error("Error:", error);
    // Return here too
    return res.status(500).send("Server Error");
  }
}



const CheckMembershipFee =async(req,res)=>{
const memberId = req.params.id;
  try {
    if (!mongoose.Types.ObjectId.isValid(memberId)) {
      return res.status(400).json({ feeAdded: false, message: "Invalid member ID" });
    }

    const receipt = await Receipt.findOne({ member: memberId }).lean();

    if (!receipt || !receipt.payments?.length) {
      return res.json({ feeAdded: false, message: "No payments found." });
    }

    const hasNonMembershipPayment = receipt.payments.some(
      (payment) => payment.paymentType !== "Membership Fee"
    );

    const totalMembershipAmount = receipt.payments
      .filter((payment) => payment.paymentType === "Membership Fee")
      .reduce((sum, payment) => sum + (payment.amount || 0), 0);

    if (hasNonMembershipPayment || totalMembershipAmount > 2500) {
      return res.json({ feeAdded: true });
    }

    return res.json({
      feeAdded: false,
      message:
        "Please add a receipt without membership fees to continue with the confirmation letter.",
    });

  } catch (err) {
    console.error("Error checking membership fee:", err);
    res.status(500).json({ feeAdded: false, message: "Server error." });
  }
}

export default {
  fetchReceipts,
  getReceiptDetailsById,
  getViewReceiptHistory,
  viewconfirmation,
  
  CheckMembershipFee,
  
};

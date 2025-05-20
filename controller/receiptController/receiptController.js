// receiptController.js
import Receipt from "../../model/receiptModel.js";
import Member from "../../model/memberModel.js";
import numberToWords from "number-to-words";
import MemberAffidavit from "../../model/memberAffidavit.js";

// export const createReceipt = async (memberId, data) => {
//   try {
//     const receiptData = {
//       member: memberId,
//       receiptNo: data.recieptNo,
//       date: new Date(data.date),
//       noOfShares: Number(data.numberOfShares),
//       shareFee: Number(data.shareFee),
//       membershipFee: Number(data.memberShipFee),
//       applicationFee: Number(data.applicationFee),
//       admissionFee: Number(data.adminissionFee),
//       miscellaneousExpenses: Number(data.miscellaneousExpenses),
//       paymentType: data.paymentType,
//       paymentMode: data.paymentMode,
//       bankName: data.bankName,
//       branchName: data.branchName,
//       amount: Number(data.amount),
//       chequeNumber: data.chequeNumber,
//       ddNumber: data.ddNumber,
//       transactionId: data.transactionId,
//     };
//     console.log("checkNocheck", receiptData);

//     const receipt = new Receipt(receiptData);
//     await receipt.save();

//     // Push the created receipt's ID into the member's receiptIds array
//     await Member.findByIdAndUpdate(memberId, {
//       // $push: { receiptIds: receipt._id },  Add the receipt ID to the member's receiptIds array
//       $addToSet: { receiptIds: receipt._id }, // Use $addToSet to prevent duplication
//     });

//     return {
//       status: 200,
//       data: receipt,
//     };
//   } catch (error) {
//     console.error("Error creating receipt:", error);
//     return {
//       status: 500,
//       error: error.message,
//     };
//   }
// };

export const createReceipt = async (memberId, data) => {
  try {
    const paymentEntry = {
      receiptNo: data.recieptNo,
      date: new Date(data.date),
      paymentType: data.paymentType, // 'Membership Fee'
      installmentNumber: data.installmentNumber || undefined,
      paymentMode: data.paymentMode,
      bankName: data.bankName,
      branchName: data.branchName,
      amount: Number(data.amount),
      chequeNumber: data.chequeNumber,
      ddNumber: data.ddNumber,
      transactionId: data.transactionId,

      // Membership Fee breakdown
      applicationFee: Number(data.applicationFee),
      admissionFee: Number(data.adminissionFee),
      miscellaneousExpenses: Number(data.miscellaneousExpenses),
      membershipFee: Number(data.memberShipFee),
      shareFee: Number(data.shareFee),
    };

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
      $addToSet: { receiptIds: receipt._id },
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
    const { paymentType } = req.query;

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

    const payment = receipt.payments.find((p) => p.paymentType === paymentType);

    if (!payment) {
      return res.status(404).json({
        success: false,
        message: `Payment of type "${paymentType}" not found for this receipt.`,
      });
    }

    console.log("reciept render", receipt);

    const receiptData = {
      receiptNumber: payment.receiptNo,
      date: new Date(payment.date).toLocaleDateString("en-GB"),
      name: receipt.member.name,
      address: receipt.member.permanentAddress || "-",
      amountInWords: convertNumberToWords(payment.amount),
      total: payment.amount,
      bankName: payment.bankName,
      branchName: payment.branchName,
      chequeNumber: payment.chequeNumber,
      ddNumber: payment.ddNumber,
      transactionId: payment.transactionId,
      items: [
        { name: "Membership Fee", amount: payment.membershipFee },
        { name: "Admission Fee", amount: payment.admissionFee },
        { name: "Share Fee", amount: payment.shareFee },
        { name: "Application Fee", amount: payment.applicationFee },
        { name: "Site Down Payment", amount: payment.siteDownPayment },
        { name: "Site Advance", amount: payment.siteAdvance },
        { name: "1st Installment", amount: payment.firstInstallment },
        { name: "2nd Installment", amount: payment.secondInstallment },
        { name: "3rd Installment", amount: payment.thirdInstallment },
        { name: "4th Installment", amount: payment.fourthInstallment },
        {
          name: "Miscellaneous Expenses",
          amount: payment.miscellaneousExpenses,
        },
        { name: "Other Charges", amount: payment.otherCharges },
      ].filter((item) => item.amount > 0), // only show items with value
    };

    // res.render("receipt", { receipt: receiptData });
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
      _id: { $in: member.receiptIds },
    });

    res.status(200).json(receipts);
  } catch (err) {
    console.error("Error fetching receipts:", err);
    res.status(500).json({ message: "Internal Server Error" });
  }
};

const getAffidavitByUserId = async (req, res ) => {
  console.log('function is called ',req.params.id);
  const { id } = req.params; // userId passed in URL
  try {
    const data = await MemberAffidavit.find({ userId: id })
      .populate(
        "userId",
        "refname name email mobileNumber SeniorityID ReceiptNo Amount"
      )
      .sort({ createdAt: -1 });
    if (data.length === 0) {
      return res.status(404).json({ message: "No affidavits found for this user" });
    }
    res.status(200).json(data);
  } catch (error) {
    console.error("Error fetching affidavits by user ID:", error);
    res.status(500).json({ message: "Failed to fetch affidavits" });
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

    res.render("viewsiteBookingConfirmation", { member: affidavit });
} catch (error) {
    console.error("Error:", error);
    // Return here too
    return res.status(500).send("Server Error");
  }
}

export default {
  fetchReceipts,
  getReceiptDetailsById,
  getViewReceiptHistory,
  getAffidavitByUserId,
  viewconfirmation
};

// receiptController.js
import Receipt from "../../model/receiptModel.js";
import Member from "../../model/memberModel.js";
import MemberAffidavit from "../../model/memberAffidavit.js";
import mongoose from "mongoose";
// import numWords from "num-words";
// import num2words from "num2words";
import numWords from "num-words";
import toWords from "number-to-words";
import Project from "../../model/projectModel.js";

export const createReceipt = async (memberId, data) => {
  console.log("data new receipt", data);
  try {
    const paymentEntry = {
      receiptNo: data.recieptNo,
      date: new Date(data.date),
      paymentType: data.paymentType, // 'Membership Fee'
      installmentNumber: data.installment || undefined,
      paymentMode: data.paymentMode.toLowerCase(),
      bankName: data.bankName,
      branchName: data.branchName,
      amount: Number(data.amount),
      chequeNumber: data.chequeNumber,
      ddNumber: data.ddNumber,
      transactionId: data.transactionId,
      otherCharges: data.otherCharges,

      // Membership Fee breakdown
      numberOfShares: Number(data.numberOfShares) || undefined,
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

// const fetchReceipts = async (req, res) => {
//   try {
//     const page = parseInt(req.query.page) || 1;
//     const limit = parseInt(req.query.limit) || 10;
//     const search = req.query.search?.trim() || "";
//     const skip = (page - 1) * limit;

//     let query = {};

//     if (search) {
//       // Find matching members based on name, SeniorityID, or project name
//       const matchingMembers = await Member.find({
//         $or: [
//           { name: new RegExp(search, "i") },
//           { SeniorityID: new RegExp(search, "i") },
//           { "propertyDetails.projectName": new RegExp(search, "i") },
//         ],
//       }).select("_id");
//       console.log("matching members", matchingMembers);

//       const matchingMemberIds = matchingMembers.map((m) => m._id);

//       query = {
//         $or: [
//           { receiptNo: new RegExp(search, "i") },
//           { member: { $in: matchingMemberIds } },
//         ],
//       };
//     }

//     const totalCount = await Receipt.countDocuments(query);

//     const receipts = await Receipt.find(query)
//       .populate({
//         path: "member",
//         select:
//           "name mobileNumber email SeniorityID isActive date propertyDetails",
//       })
//       .sort({ date: -1 })
//       .skip(skip)
//       .limit(limit);

//     const totalPages = Math.ceil(totalCount / limit);

//     res.status(200).json({
//       data: receipts,
//       totalPages,
//       currentPage: page,
//     });
//   } catch (err) {
//     console.error("error fetching receipts", err);
//     res.status(500).json({ error: "Failed to fetch receipts." });
//   }
// };

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

      const matchingMemberIds = matchingMembers.map((m) => m._id);

      query = {
        $or: [
          { "payments.receiptNo": new RegExp(search, "i") },
          { member: { $in: matchingMemberIds } },
        ],
      };
    }

    // First get the total count of payments across all receipts
    const aggregationForCount = [
      { $match: query },
      { $unwind: "$payments" },
      { $count: "totalPayments" },
    ];

    const countResult = await Receipt.aggregate(aggregationForCount);
    const totalCount = countResult[0]?.totalPayments || 0;

    // Then get the paginated results
    const receipts = await Receipt.aggregate([
      { $match: query },
      { $unwind: "$payments" },
      { $sort: { "payments.date": -1 } },
      { $skip: skip },
      { $limit: limit },
      {
        $lookup: {
          from: "members",
          localField: "member",
          foreignField: "_id",
          as: "member",
        },
      },
      { $unwind: "$member" },
      {
        $project: {
          _id: 1,
          member: {
            _id: "$member._id",
            name: "$member.name",
            mobileNumber: "$member.mobileNumber",
            email: "$member.email",
            SeniorityID: "$member.SeniorityID",
            isActive: "$member.isActive",
            date: "$member.date",
            propertyDetails: "$member.propertyDetails",
          },
          payment: "$payments",
        },
      },
    ]);

    const totalPages = Math.ceil(totalCount / limit);

    res.status(200).json({
      data: receipts,
      totalPages,
      currentPage: page,
    });

    console.log("receipts-members", receipts);
  } catch (err) {
    console.error("error fetching receipts", err);
    res.status(500).json({ error: "Failed to fetch receipts." });
  }
};

const getReceiptDetailsById = async (req, res) => {
  try {
    const { id } = req.params;
    const { paymentId } = req.query; // Now we'll use paymentId instead of paymentType/installmentNumber

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

    // Find the specific payment by its _id
    const payment = receipt.payments.find(
      (p) => p._id.toString() === paymentId
    );

    if (!payment) {
      return res.status(404).json({
        success: false,
        message: "Payment not found for this receipt.",
      });
    }

    const allItems = [
      { name: "Membership Fee", amount: payment.membershipFee || 0 },
      { name: "Admission Fee", amount: payment.admissionFee || 0 },
      { name: "Share Fee", amount: payment.shareFee || 0 },
      { name: "Application Fee", amount: payment.applicationFee || 0 },
      {
        name: "Site Advance",
        amount: payment.paymentType === "siteAdvance" ? payment.amount : 0,
      },
      {
        name: "Site Down Payment",
        amount: payment.paymentType === "siteDownPayment" ? payment.amount : 0,
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
      // { name: "Other Charges", amount: payment.otherCharges || 0 },
    ];

    if (payment.otherCharges) {
      allItems.push({
        name: payment.otherCharges,
        amount: payment.amount || 0,
      });
    }

    const filteredItems = allItems.map((item) => ({
      ...item,
      amount: item.amount || 0,
    }));

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
      total: new Intl.NumberFormat("en-IN").format(payment.amount),
      bankName: payment.bankName || "",
      branchName: payment.branchName || "",
      chequeNumber: payment.chequeNumber || "",
      ddNumber: payment.ddNumber || "",
      transactionId: payment.transactionId || "",
      items: filteredItems,
    };
    console.log("receipts data", receiptData);

    res.render("receipt", { ...receiptData });
  } catch (err) {
    console.error("Error fetching single receipt:", err);
    res.status(500).send("Failed to fetch receipt details.");
  }
};
function convertNumberToWords(amount) {
  return (
    numWords(amount || 0).replace(/\b\w/g, (char) => char.toUpperCase()) +
    " Only"
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

// const viewconfirmation = async (req, res) => {
//   try {
//     console.log("view confirmation called")
//     const { memberId } = req.params;
//     console.log("Member ID:", memberId);
//     // const reciptData = await Receipt.findOne({})
//      const receipt = await Receipt.findOne({ member: memberId }).populate("member");
//      console.log("receipt data",receipt);
//      const affidavit = await MemberAffidavit.findOne({
//       userId: memberId,
//     }).populate("userId");
//     // console.log("Affidavit data:", affidavit);
//     if (!affidavit) {
//       return res.status(404).send("Affidavit not found");
//       }
//     // Convert amount to words
//     const amount = affidavit.totalPaidAmount || 0;
//     const amountInWords = numWords(amount);
//     const formattedAmountInWords =
//     amountInWords.charAt(0).toUpperCase() + amountInWords.slice(1);
//     res.render("viewsiteBookingConfirmation", {
//       member: affidavit,
//       amountInWords: formattedAmountInWords,
//       receipt
//     });
//     // res.render("viewsiteBookingConfirmation", { member: affidavit });
//   } catch (error) {
//     console.error("Error:", error);
//     // Return here too
//     return res.status(500).send("Server Error");
//   }
// };

const viewconfirmation = async (req, res) => {
  try {
    const { memberId } = req.params;
    const receipt = await Receipt.findOne({ member: memberId }).populate(
      "member"
    );

    console.log("receipt-affidavit", receipt);

    const member = await Member.findById(memberId);
    if (!member) {
      return res.status(404).send("Member not found");
    }

    console.log("member affidavit", member);
    // Extract the siteDownPayment entry from the receipt
    const siteDownPayment = receipt?.payments?.find(
      (payment) => payment.paymentType === "siteDownPayment"
    );
    const project = await Project.findOne({
      projectName: member.propertyDetails.projectName,
    });
    const projectLocation = project?.location || "Location not found";
    const affidavit = await MemberAffidavit.findOne({
      userId: memberId,
    }).populate("userId");
    // console.log("Affidavit data:", affidavit);
    if (!affidavit) {
      return res.status(404).send("Affidavit not found");
    }
    const amount = affidavit.totalPaidAmount || 0;
    const amountInWords = numWords(amount);
    const formattedAmountInWords =
      amountInWords.charAt(0).toUpperCase() + amountInWords.slice(1);
    console.log(siteDownPayment, "project siteDownPayment");
    res.render("viewsiteBookingConfirmation", {
      member: affidavit,
      amountInWords: formattedAmountInWords,
      receipt,
      projectLocation,
      siteDownPayment,
    });
  } catch (error) {
    console.error("Error:", error);
    return res.status(500).send("Server Error");
  }
};

const EditAffidavit = async (req, res) => {
  try {
    console.log(req.body, "incoming datas");
  } catch (error) {
    console.log(error);
  }
};

// const CheckMembershipFee = async (req, res) => {
//   const memberId = req.params.id;
//   try {
//     if (!mongoose.Types.ObjectId.isValid(memberId)) {
//       return res
//         .status(400)
//         .json({ feeAdded: false, message: "Invalid member ID" });
//     }

//     const receipt = await Receipt.findOne({ member: memberId }).lean();

//     if (!receipt || !receipt.payments?.length) {
//       return res.json({ feeAdded: false, message: "No payments found." });
//     }

//     const hasNonMembershipPayment = receipt.payments.some(
//       (payment) => payment.paymentType !== "Membership Fee"
//     );

//     const totalMembershipAmount = receipt.payments
//       .filter((payment) => payment.paymentType === "Membership Fee")
//       .reduce((sum, payment) => sum + (payment.amount || 0), 0);

//     if (hasNonMembershipPayment || totalMembershipAmount > 2500) {
//       return res.json({ feeAdded: true });
//     }

//     return res.json({
//       feeAdded: false,
//       message:
//         "Please generate a receipt for site down payment to continue with the confirmation letter.",
//     });
//   } catch (err) {
//     console.error("Error checking membership fee:", err);
//     res.status(500).json({ feeAdded: false, message: "Server error." });
//   }
// };

// const FetchEditReceiptHistory = async (req, res) => {
//   try {
//     const { receiptId } = req.params;
//     const { paymentType, installmentNumber } = req.query;

//     console.log("receiptId", receiptId);
//     console.log("payment type", paymentType);

//     const receipt = await Receipt.findById(receiptId).populate({
//       path: "member",
//       select:
//         "name permanentAddress SeniorityID propertyDetails mobileNumber email",
//     });

//     if (!receipt) {
//       return res.status(404).json({
//         success: false,
//         message: "Receipt not found",
//       });
//     }

//     let payment;

//     if (paymentType === "installments" && installmentNumber) {
//       payment = receipt.payments.find(
//         (p) =>
//           p.paymentType === "installments" &&
//           p.installmentNumber === installmentNumber
//       );
//     } else {
//       payment = receipt.payments.find((p) => p.paymentType === paymentType);
//     }

//     if (!payment) {
//       return res.status(404).json({
//         success: false,
//         message: `Payment of type "${paymentType}" not found for this receipt.`,
//       });
//     }

//     // res.status(200).json(payment);
//     res.status(200).json({
//       payment,
//       member: receipt.member,
//     });
//     console.log("Fetched payment:", payment);
//   } catch (err) {
//     console.error("Error fetching details:", err);
//     res.status(500).send("Failed to fetch receipt details.");
//   }
// };

// In your backend routes

// Controller

const CheckMembershipFee = async (req, res) => {
  const memberId = req.params.id;
  try {
    if (!mongoose.Types.ObjectId.isValid(memberId)) {
      return res
        .status(400)
        .json({ feeAdded: false, message: "Invalid member ID" });
    }

    const receipt = await Receipt.findOne({ member: memberId }).lean();

    if (!receipt || !receipt.payments?.length) {
      return res.json({ feeAdded: false, message: "No payments found." });
    }

    const hasSiteDownPayment = receipt.payments.some(
      (payment) =>
        (payment.paymentType || "").toLowerCase() === "sitedownpayment"
    );

    if (hasSiteDownPayment) {
      return res.json({ feeAdded: true });
    }

    // const totalMembershipAmount = receipt.payments
    //   .filter((payment) => payment.paymentType === "Membership Fee")
    //   .reduce((sum, payment) => sum + (payment.amount || 0), 0);

    // if (hasNonMembershipPayment || totalMembershipAmount > 2500) {
    //   return res.json({ feeAdded: true });
    // }

    return res.json({
      feeAdded: false,
      message:
        "Please generate a receipt for site down payment to continue with the confirmation letter.",
    });
  } catch (err) {
    console.error("Error checking membership fee:", err);
    res.status(500).json({ feeAdded: false, message: "Server error." });
  }
};

//check memberaffidavit model if member id exist to navigate to edit confirmation letter details
const CheckMemberAffidavitModel = async (req, res) => {
  try {
    const { memberId } = req.params;

    if (!memberId) {
      return res
        .status(400)
        .json({ isExist: false, message: "Member ID is required" });
    }

    const affidavit = await MemberAffidavit.findOne({ userId: memberId });

    if (affidavit) {
      return res
        .status(200)
        .json({ isExist: true, message: "Affidavit exists", affidavit });
    } else {
      return res
        .status(200)
        .json({ isExist: false, message: "Affidavit does not exist" });
    }
  } catch (error) {
    console.error("Error checking affidavit:", error);
    res.status(500).json({ isExist: false, message: "Server error" });
  }
};

const FetchEditReceiptHistory = async (req, res) => {
  try {
    const { receiptId } = req.params;
    const { paymentId } = req.query;

    const receipt = await Receipt.findById(receiptId);
    if (!receipt) {
      return res.status(404).json({ error: "Receipt not found" });
    }

    const payment = receipt.payments.id(paymentId);
    if (!payment) {
      return res.status(404).json({ error: "Payment not found" });
    }

    const member = await Member.findById(receipt.member);
    if (!member) {
      return res.status(404).json({ error: "Member not found" });
    }

    res.status(200).json({ payment, member });
  } catch (error) {
    console.error("Error fetching payment for edit:", error);
    res.status(500).json({ error: "Failed to fetch payment details" });
  }
};

const collectShareCertificate = async (req, res) => {
  try {
    const { page = 1, limit = 10, search = "" } = req.query;
    const skip = (page - 1) * limit;

    // Step 1: Fetch all receipts with at least one payment having shareFee > 0 and numberOfShares > 0
    const matchCondition = {
      payments: {
        $elemMatch: {
          shareFee: { $gt: 0 },
          numberOfShares: { $gt: 0 },
        },
      },
    };

    const searchRegex = new RegExp(search, "i");

    // Step 2: Aggregate with member details
    const aggregateQuery = [
      { $match: matchCondition },

      // Lookup the member details
      {
        $lookup: {
          from: "members",
          localField: "member",
          foreignField: "_id",
          as: "member",
        },
      },
      { $unwind: "$member" },

      // Optional search on member name or email
      {
        $match: {
          $or: [
            { "member.name": { $regex: searchRegex } },
            { "member.email": { $regex: searchRegex } },
          ],
        },
      },

      // Sort by newest
      { $sort: { "payments.date": -1 } },

      // Pagination
      { $skip: parseInt(skip) },
      { $limit: parseInt(limit) },
    ];

    const results = await Receipt.aggregate(aggregateQuery);

    // Step 3: Get total count for pagination
    const totalCountAggregation = await Receipt.aggregate([
      { $match: matchCondition },
      {
        $lookup: {
          from: "members",
          localField: "member",
          foreignField: "_id",
          as: "member",
        },
      },
      { $unwind: "$member" },
      {
        $match: {
          $or: [
            { "member.name": { $regex: searchRegex } },
            { "member.email": { $regex: searchRegex } },
          ],
        },
      },
      { $count: "total" },
    ]);

    const totalCount = totalCountAggregation[0]?.total || 0;
    const totalPages = Math.ceil(totalCount / limit);

    return res.status(200).json({
      success: true,
      data: results,
      currentPage: parseInt(page),
      totalPages,
    });
  } catch (error) {
    console.error("Error fetching share certificate receipts:", error);
    res.status(500).json({
      success: false,
      message: "Failed to fetch share certificates",
    });
  }
};

const renderShareCertificate = async (req, res) => {
  try {
    const { receiptId } = req.params;
    console.log("receiptId", receiptId);

    const receipt = await Receipt.findById(receiptId).populate({
      path: "member",
      select:
        "name permanentAddress nomineeName nomineeRelation date ShareCertificateNumber",
    });

    console.log("receipt", receipt);

    if (!receipt || !receipt.member) {
      return res.status(404).json({
        success: false,
        message: "Share certificate member details not found",
      });
    }

    const member = receipt.member;

    const sharePayment = receipt.payments.find(
      (p) => p.paymentType.toLowerCase() === "membership fee"
    );

    if (!sharePayment) {
      return res.status(400).json({
        success: false,
        message: "No share certificate related payments made",
      });
    }

    res.render("shareCertificate", {
      member,
      sharePayment,
      numberOfSharesInWords:
        toWords.toWords(sharePayment.numberOfShares) + " shares",
      // shareValueInWords:
      //   toWords.toWords(sharePayment.shareFee) + " rupees",
      shareValueInWords: convertNumberToWords(sharePayment.shareFee),
    });
  } catch (err) {
    console.error("Error rendering share certificate:", err);
    res.status(500).send("Failed to fetch share certificate details.");
  }
};

const createExtraChargeReceipt = async (req, res) => {
  try {
  } catch (err) {
    console.error("error fetching details", err);
    res.status(500).send("server error");
  }
};

const collectAllExtraChargeHistory = async (req, res) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 10;
    const skip = (page - 1) * limit;
    const search = req.query.search?.toLowerCase() || "";

    const receipts = await Receipt.find({
      "payments.paymentType": "Extra Charge",
    }).lean();

    const result = [];

    for (const receipt of receipts) {
      const extraChargePayments = receipt.payments.filter(
        (p) => p.paymentType === "Extra Charge"
      );

      if (extraChargePayments.length > 0) {
        const member = await Member.findById(receipt.member).lean();
        if (!member) continue;

        extraChargePayments.forEach((payment) => {
          const data = {
            paymentId: payment._id,
            receiptId: receipt._id,
            receiptNo: payment.receiptNo,
            date: payment.date,
            amount: payment.amount,
            paymentMode: payment.paymentMode,
            bankName: payment.bankName,
            branchName: payment.branchName,
            transactionId: payment.transactionId,
            chequeNumber: payment.chequeNumber,
            ddNumber: payment.ddNumber,
            otherCharges: payment.otherCharges,
            memberName: member.name,
            email: member.email,
            SeniorityID: member.SeniorityID,
            projectName: member.propertyDetails?.projectName || "",
            plotDimension: member.propertyDetails
              ? `${member.propertyDetails.length} x ${member.propertyDetails.breadth}`
              : "",
          };

          // Apply search filter
          if (
            !search ||
            data.memberName?.toLowerCase().includes(search) ||
            data.projectName?.toLowerCase().includes(search) ||
            data.SeniorityID?.toLowerCase().includes(search)
          ) {
            result.push(data);
          }
        });
      }
    }

    const paginatedResult = result.slice(skip, skip + limit);

    return res.status(200).json({
      data: paginatedResult,
      total: result.length,
      page,
      totalPages: Math.ceil(result.length / limit),
    });
  } catch (err) {
    console.error("Error fetching extra charge history:", err);
    return res.status(500).json({ error: "Internal server error" });
  }
};

const fetchExtraChargeOnPaymentID = async (req, res) => {
  try {
    const paymentId = req.params.paymentId;

    if (!mongoose.Types.ObjectId.isValid(paymentId)) {
      return res
        .status(400)
        .json({ success: false, message: "Invalid paymentId" });
    }

    // Find the receipt document which has a payment with this paymentId
    const receipt = await Receipt.findOne({ "payments._id": paymentId }).lean();

    if (!receipt) {
      return res
        .status(404)
        .json({ success: false, message: "Payment not found" });
    }

    // Find the payment inside the payments array by _id
    const payment = receipt.payments.find(
      (p) => p._id.toString() === paymentId
    );

    if (!payment) {
      return res
        .status(404)
        .json({ success: false, message: "Payment not found inside receipt" });
    }

    // Fetch the member info linked to this receipt
    const member = await Member.findById(receipt.member).lean();

    // Return the combined data
    return res.json({
      success: true,
      data: {
        payment,
        member: member || null,
      },
    });
  } catch (err) {
    console.error("Error in fetchExtraChargeOnPaymentID:", err);
    return res.status(500).json({ success: false, message: "Server error" });
  }
};

const updateExtraChargeReceipt = async (req, res) => {
  try {
    const { paymentId } = req.params;
    const updateData = req.body;

    console.log("payment id", paymentId);
    console.log("updated data", updateData);

    const updatedReceipt = await Receipt.findOneAndUpdate(
      { "payments._id": paymentId }, // find the Receipt containing this payment
      {
        $set: {
          "payments.$.receiptNo": updateData.recieptNo,
          "payments.$.date": updateData.date,
          "payments.$.paymentMode": updateData.paymentMode,
          "payments.$.paymentType": updateData.paymentType,
          "payments.$.chequeNumber": updateData.chequeNumber,
          "payments.$.bankName": updateData.bankName,
          "payments.$.branchName": updateData.branchName,
          "payments.$.transactionId": updateData.transactionId,
          "payments.$.ddNumber": updateData.ddNumber,
          "payments.$.otherCharges": updateData.otherCharges,
          "payments.$.amount": updateData.amount,
        },
      },
      { new: true }
    );

    if (!updatedReceipt) {
      return res.status(404).json({ message: "Receipt not found" });
    }

    res.status(200).json({
      message: "Receipt updated successfully",
      data: updatedReceipt,
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Server error" });
  }
};

const getAllReceiptIds = async (req, res) => {
  try {
    // Fetch only the payments field to reduce data load
    const receipts = await Receipt.find({}, { payments: 1 });

    // Extract all receiptNo values from nested payments arrays
    const receiptIds = receipts.flatMap((receipt) =>
      receipt.payments
        .filter((payment) => payment.receiptNo) // ensure receiptNo exists
        .map((payment) => payment.receiptNo)
    );

    res.status(200).json({ receiptIds });
  } catch (err) {
    console.error("Error fetching receipt IDs:", err);
    res.status(500).json({ error: "Internal server error" });
  }
};

export default {
  fetchReceipts,
  getReceiptDetailsById,
  getViewReceiptHistory,
  viewconfirmation,
  EditAffidavit,
  CheckMembershipFee,
  CheckMemberAffidavitModel,
  FetchEditReceiptHistory,
  renderShareCertificate,
  createExtraChargeReceipt,
  collectAllExtraChargeHistory,
  fetchExtraChargeOnPaymentID,
  updateExtraChargeReceipt,
  getAllReceiptIds,
  collectShareCertificate,
};

// receiptController.js
import Receipt from "../../model/receiptModel.js";
import Member from "../../model/memberModel.js";

export const createReceipt = async (memberId, data) => {
  try {
    const receiptData = {
      member: memberId,
      receiptNo: data.recieptNo,
      date: new Date(data.date),
      noOfShares: Number(data.numberOfShares),
      shareFee: Number(data.shareFee),
      membershipFee: Number(data.memberShipFee),
      applicationFee: Number(data.applicationFee),
      admissionFee: Number(data.adminissionFee),
      miscellaneousExpenses: Number(data.miscellaneousExpenses),
      paymentType: data.paymentType,
      paymentMode: data.paymentMode,
      bankName: data.bankName,
      branchName: data.branchName,
      amount: Number(data.amount),
    };

    const receipt = new Receipt(receiptData);
    await receipt.save();

    // Push the created receipt's ID into the member's receiptIds array
    await Member.findByIdAndUpdate(memberId, {
      // $push: { receiptIds: receipt._id },  Add the receipt ID to the member's receiptIds array
      $addToSet: { receiptIds: receipt._id }, // Use $addToSet to prevent duplication
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
//     const search = req.query.search || "";
//     const skip = (page - 1) * limit;

//     // Build dynamic query
//     const query = search
//       ? {
//           $or: [
//             { receiptNo: { $regex: search, $options: "i" } },
//             { "member.name": { $regex: search, $options: "i" } },
//             { "member.SeniorityID": { $regex: search, $options: "i" } },
//             {
//               "member.propertyDetails.projectName": {
//                 $regex: search,
//                 $options: "i",
//               },
//             },
//           ],
//         }
//       : {};

//     // Count total matching documents
//     const totalCount = await Receipt.find(query)
//       .populate("member")
//       .countDocuments();

//     // Get matching receipts with population
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
//     res.status(500).json({ error: "failed to fetch receipts." });
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

export default { fetchReceipts };

import Member from "../../model/memberModel.js"; // adjust path as needed
import Transfer from "../../model/plotTransfer.js"



 const getMemberBySeniorityID = async (req, res) => {
  try {
    console.log(req.params.id,'paramssssssssssssssssssssssssssssssss');
    const  seniorityId  = req.params.id;
    const member = await Member.findOne({ SeniorityID: seniorityId });
    console.log(member,'membererrrrrrrrrrrrrrrr')
    if (!member) return res.status(404).json({ message: "Member not found" });
    res.status(200).json(member);
  } catch (error) {
    res.status(500).json({ message: "Error fetching member details" });
  }
};


// const CreateTransfer = async (req, res) => {
//   try {
//     console.log(req.body, 'incoming data in the req.body');
//     const {
//       fromMember,
//       toMember,
//       reason,
//       transferDate,
//     } = req.body;

//     const fromMemberRecord = await Member.findOne({ SeniorityID: fromMember.seniorityId });
//     console.log(fromMemberRecord, 'from member record');

//     if (!fromMemberRecord) {
//       return res.status(404).json({ message: "From member not found with given SeniorityID." });
//     }

//     const newTransfer = new Transfer({
//       fromMember: fromMemberRecord._id,
//       toMember,  // directly use the toMember object from frontend
//       reason,
//       transferDate,
//     });

//     await newTransfer.save();

//     await Member.findByIdAndUpdate(fromMemberRecord._id, { isTransferred: true });

//     res.status(201).json({ message: "Transfer recorded successfully." });

//   } catch (error) {
//     console.error("Transfer creation error:", error);
//     res.status(500).json({ message: "Error creating transfer", error });
//   }
// };

// const CreateTransfer = async (req, res) => {
//   try {
//     console.log(req.body, 'incoming data in the req.body');
//     const {
//       fromMember,
//       toMember, // New member details: name, email, mobileNumber
//       reason,
//       transferDate,
//     } = req.body;

//     const fromMemberRecord = await Member.findOne({ SeniorityID: fromMember.seniorityId });

//     if (!fromMemberRecord) {
//       return res.status(404).json({ message: "From member not found with given SeniorityID." });
//     }

//     // Save old data
//     const previousDetails = {
//       name: fromMemberRecord.name,
//       email: fromMemberRecord.email,
//       mobileNumber: fromMemberRecord.mobileNumber,
//     };

//     // Update member with new details and mark as transferred
//     await Member.findByIdAndUpdate(fromMemberRecord._id, {
//       name: toMember.name,
//       email: toMember.email,
//       mobileNumber: toMember.mobileNumber,
//       isTransferred: true,
//       previousMemberDetails: previousDetails,
//       refname:toMember.name
//     });

//     // Record the transfer
//     const newTransfer = new Transfer({
//       fromMember: fromMemberRecord._id,
//       toMember,
//       reason,
//       transferDate,
//     });

//     await newTransfer.save();

//     res.status(201).json({ message: "Transfer recorded and member updated successfully." });

//   } catch (error) {
//     console.error("Transfer creation error:", error);
//     res.status(500).json({ message: "Error creating transfer", error });
//   }
// };
const CreateTransfer = async (req, res) => {
  try {
    console.log(req.body, 'incoming data in the req.body');

    // Parse JSON strings from req.body
    const fromMember = JSON.parse(req.body.fromMember);
    const toMember = JSON.parse(req.body.toMember);
    const { reason, transferDate } = req.body;

    // Find the original member by SeniorityID
    const fromMemberRecord = await Member.findOne({ SeniorityID: fromMember.seniorityId });

    if (!fromMemberRecord) {
      return res.status(404).json({ message: "From member not found with given SeniorityID." });
    }

    // Save previous member details
    const previousDetails = {
      name: fromMemberRecord.name,
      email: fromMemberRecord.email,
      mobileNumber: fromMemberRecord.mobileNumber,
    };

    // Update member with new (toMember) details
    await Member.findByIdAndUpdate(fromMemberRecord._id, {
      name: toMember.name,
      email: toMember.email,
      mobileNumber: toMember.mobile,
      isTransferred: true,
      previousMemberDetails: previousDetails,
      refname: toMember.name,
    });

    // Create new transfer record
    const newTransfer = new Transfer({
      fromMember: fromMemberRecord._id,
      toMember,
      reason,
      transferDate,
    });

    await newTransfer.save();

    res.status(201).json({ message: "Transfer recorded and member updated successfully." });

  } catch (error) {
    console.error("Transfer creation error:", error);
    res.status(500).json({ message: "Error creating transfer", error });
  }
};


const plotTransferhistory = async (req, res) => {
  console.log('function called');
  try {
    const { page = 1, limit = 10, search = "" } = req.query;
    const skip = (page - 1) * limit;
    const searchRegex = new RegExp(search, "i");
    // Build match query for filtering member names, emails, or Seniority IDs
    const matchQuery = {
      $or: [
        { "fromMember.name": searchRegex },
        { "fromMember.email": searchRegex },
        { "fromMember.SeniorityID": searchRegex },
        { "toMember.name": searchRegex },
        { "toMember.email": searchRegex }
      ]
    };
    // First count total matches for pagination
    const totalCount = await Transfer.countDocuments({});
    // Populate both fromMember and toMember
    const transferData = await Transfer.find()
      .populate("fromMember")
      .populate("toMember")
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(parseInt(limit));

    // Apply filter after population (Mongo can't deep match on populated fields directly)
    const filteredData = transferData.filter((item) => {
      const from = item.fromMember || {};
      const to = item.toMember || {};
      return (
        from.name?.match(searchRegex) ||
        from.email?.match(searchRegex) ||
        from.SeniorityID?.match(searchRegex) ||
        to.name?.match(searchRegex) ||
        to.email?.match(searchRegex)
      );
    });

    const totalFilteredPages = Math.ceil(filteredData.length / limit);

   console.log(filteredData,'filtered dataass')

    res.status(200).json({
      success: true,
      data: filteredData,
      totalPages: totalFilteredPages,
      currentPage: Number(page)
    });
  } catch (error) {
    console.error("Error fetching plot transfer history:", error);
    res.status(500).json({
      success: false,
      message: "Server error while fetching transfer history.",
      error: error.message
    });
  }
};



// const plotTransferhistory = async (req, res) => {
//   try {
//     const plotTransferHistory = await Transfer.find();

//     if (plotTransferHistory && plotTransferHistory.length > 0) {
//       res.status(200).json({
//         success: true,
//         data: plotTransferHistory
//       });
//     } else {
//       res.status(404).json({
//         success: false,
//         message: "No transfer history found."
//       });
//     }

//   } catch (error) {
//     console.error("Error fetching plot transfer history:", error);
//     res.status(500).json({
//       success: false,
//       message: "Server error while fetching transfer history.",
//       error: error.message
//     });
//   }
// };



export default {
    
    getMemberBySeniorityID,
    CreateTransfer,
    plotTransferhistory
}
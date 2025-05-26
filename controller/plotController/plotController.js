import Member from "../../model/memberModel.js"; // adjust path as needed
import Transfer from "../../model/plotTransfer.js"
import { uploadToCloudinary } from "../../utils/cloudinary.js";


 const getMemberBySeniorityID = async (req, res) => {
  try {
    console.log(req.params.id,'paramssssssssssssssssssssss');
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
//     console.log("Body Data:", req.body);
//     console.log("Uploaded Files:", req.files);
//     // Parse JSON strings
//     const fromMember = JSON.parse(req.body.fromMember);
//     const toMember = JSON.parse(req.body.toMember);
//     const { reason, transferDate } = req.body;
//     // Find the existing member by SeniorityID
//     const fromMemberRecord = await Member.findOne({ SeniorityID: fromMember.seniorityId });
//     if (!fromMemberRecord) {
//       return res.status(404).json({ message: "From member not found with given SeniorityID." });
//     }
//     // Save previous member details
//     const previousDetails = {
//       name: fromMemberRecord.name,
//       email: fromMemberRecord.email,
//       mobileNumber: fromMemberRecord.mobileNumber,
//       MemberPhoto: fromMemberRecord.MemberPhoto,
//       MemberSign: fromMemberRecord.MemberSign,
//     };
//     // Upload new images if available
//     let memberPhotoUrl = fromMemberRecord.MemberPhoto;
//     let memberSignUrl = fromMemberRecord.MemberSign;
//     if (req.files?.memberPhoto?.[0]) {
//       const uploadedPhoto = await uploadToCloudinary(req.files.memberPhoto[0].buffer);
//       memberPhotoUrl = uploadedPhoto.secure_url;
//     }
//     if (req.files?.memberSign?.[0]) {
//       const uploadedSign = await uploadToCloudinary(req.files.memberSign[0].buffer);
//       memberSignUrl = uploadedSign.secure_url;
//     }
//     // Update member details
//     await Member.findByIdAndUpdate(fromMemberRecord._id, {
//       name: toMember.name,
//       email: toMember.email,
//       mobileNumber: toMember.mobile,
//       contactAddress: toMember.address,
//       isTransferred: true,
//       previousMemberDetails: previousDetails,
//       refname: toMember.name,
//       MemberPhoto: memberPhotoUrl,
//       MemberSign: memberSignUrl,

//     });
//     // Create new transfer record
//     const newTransfer = new Member({
//       fromMember: fromMemberRecord._id,
//       toMember,
//       transferDate,
//     });
//     await newTransfer.save();
//     res.status(201).json({ message: "Transfer recorded and member updated successfully." });
//   } catch (error) {
//     console.error("Transfer creation error:", error);
//     res.status(500).json({ message: "Error creating transfer", error });
//   }
// };

// const plotTransferhistory = async (req, res) => {
//   console.log('function called');
//   try {
//     const { page = 1, limit = 10, search = "" } = req.query;
//     const skip = (page - 1) * limit;
//     const searchRegex = new RegExp(search, "i");
//     // Build match query for filtering member names, emails, or Seniority IDs
//     const matchQuery = {
//       $or: [
//         { "fromMember.name": searchRegex },
//         { "fromMember.email": searchRegex },
//         { "fromMember.SeniorityID": searchRegex },
//         { "toMember.name": searchRegex },
//         { "toMember.email": searchRegex }
//       ]
//     };
//     // First count total matches for pagination
//     const totalCount = await Transfer.countDocuments({});
//     // Populate both fromMember and toMember
//     const transferData = await Transfer.find()
//       .populate("fromMember")
//       .populate("toMember")
//       .sort({ createdAt: -1 })
//       .skip(skip)
//       .limit(parseInt(limit));

//     // Apply filter after population (Mongo can't deep match on populated fields directly)
//     const filteredData = transferData.filter((item) => {
//       const from = item.fromMember || {};
//       const to = item.toMember || {};
//       return (
//         from.name?.match(searchRegex) ||
//         from.email?.match(searchRegex) ||
//         from.SeniorityID?.match(searchRegex) ||
//         to.name?.match(searchRegex) ||
//         to.email?.match(searchRegex)
//       );
//     });
//     const totalFilteredPages = Math.ceil(filteredData.length / limit);
//    console.log(filteredData,'filtered dataass')
//     res.status(200).json({
//       success: true,
//       data: filteredData,
//       totalPages: totalFilteredPages,
//       currentPage: Number(page)
//     });
//   } catch (error) {
//     console.error("Error fetching plot transfer history:", error);
//     res.status(500).json({
//       success: false,
//       message: "Server error while fetching transfer history.",
//       error: error.message
//     });
//   }
// };

const CreateTransfer = async (req, res) => {
  try {
    console.log("Body Data:", req.body);
    console.log("Uploaded Files:", req.files);

    // Parse JSON strings
    const fromMember = JSON.parse(req.body.fromMember);
    const toMember = JSON.parse(req.body.toMember);
    const { reason, transferDate } = req.body;

    // Find the existing member by SeniorityID
    const fromMemberRecord = await Member.findOne({ SeniorityID: fromMember.seniorityId });
    if (!fromMemberRecord) {
      return res.status(404).json({ message: "From member not found with given SeniorityID." });
    }

    // Save previous member details
    const previousDetails = {
      name: fromMemberRecord.name,
      email: fromMemberRecord.email,
      mobileNumber: fromMemberRecord.mobileNumber,
      MemberPhoto: fromMemberRecord.MemberPhoto,
      MemberSign: fromMemberRecord.MemberSign,
    };

    // Upload new images if available
    let memberPhotoUrl = fromMemberRecord.MemberPhoto;
    let memberSignUrl = fromMemberRecord.MemberSign;

    if (req.files?.memberPhoto?.[0]) {
      const uploadedPhoto = await uploadToCloudinary(req.files.memberPhoto[0].buffer);
      memberPhotoUrl = uploadedPhoto.secure_url;
    }

    if (req.files?.memberSign?.[0]) {
      const uploadedSign = await uploadToCloudinary(req.files.memberSign[0].buffer);
      memberSignUrl = uploadedSign.secure_url;
    }

    // ✅ Update the existing member with new details (no new creation)
    await Member.findByIdAndUpdate(fromMemberRecord._id, {
      name: toMember.name,
      email: toMember.email,
      mobileNumber: toMember.mobile,
      contactAddress: toMember.address,
      isTransferred: true,
      transferReason: reason,         // <-- include transfer reason
      refname: toMember.name,
      MemberPhoto: memberPhotoUrl,
      MemberSign: memberSignUrl,
      previousMemberDetails: previousDetails,
      date: transferDate,            // <-- optional: track transfer date
    });
    res.status(200).json({ message: "Member updated with transfer details successfully." });
  } catch (error) {
    console.error("Transfer creation error:", error);
    res.status(500).json({ message: "Error updating transfer", error });
  }
};

const plotTransferhistory = async (req, res) => {
  try {
    // Fetch members where isTransferred is true
    const transferredMembers = await Member.find({ isTransferred: true })
      .select("name mobileNumber email previousMemberDetails propertyDetails transferDate SeniorityID transferReason") // select only required fields
      .sort({ transferDate: -1 });
    const result = transferredMembers.map(member => ({
      toMemberName: member.name,
      toMemberMobile: member.mobileNumber,
      toMemberEmail: member.email,
      fromMemberName: member.previousMemberDetails?.name || "N/A",
      fromMemberMobile: member.previousMemberDetails?.mobileNumber || "N/A",
      fromMemberEmail: member.previousMemberDetails?.email || "N/A",
      projectName: member.propertyDetails?.projectName || "N/A",
      transferDate: member.transferDate || member.updatedAt, 
      SeniorityID	:member.SeniorityID,
      transferReason: member.transferReason
        }
      )
    );
    console.log(result,'this is the resutl')
    res.status(200).json(result);
  } catch (error) {
    console.error("Error fetching transferred plots:", error);
    res.status(500).json({ message: "Error fetching transfer history", error });
  }
};

export default {
    
    getMemberBySeniorityID,
    CreateTransfer,
    plotTransferhistory
}
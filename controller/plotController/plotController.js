import Member from "../../model/memberModel.js"; // adjust path as needed
import Transfer from "../../model/plotTransfer.js";
import Receipt from "../../model/receiptModel.js";
import { uploadToCloudinary } from "../../utils/cloudinary.js";

const getMemberBySeniorityID = async (req, res) => {
  try {
    const seniorityId = req.params.id;
    const member = await Member.findOne({ SeniorityID: seniorityId });
    console.log(member,'finded member');
    
    if (!member) return res.status(404).json({ message: "Member not found" });
    res.status(200).json(member);
  } catch (error) {
    res.status(500).json({ message: "Error fetching member details" });
  }
};

// Controller: getMember.js
// const getMember = async (req, res) => {
//   console.log('route is called ',req.params)
//   try {
//     const { query } = req.params; // could be name or seniorityId

//     let member = null;
//     let membersList = [];

//     // Try searching by SeniorityID first
//     member = await Member.findOne({ SeniorityID: query });
//     console.log(member,'finded memberrrrrrrr');
    

//     if (member) {
//       return res.status(200).json({ type: "single", data: member });
//     }

//     // If not found, search by Name (case-insensitive)
//     membersList = await Member.find({
//       name: { $regex: new RegExp("^" + query + "$", "i") },
//     }).select("name email mobileNumber SeniorityID");

//     if (membersList.length === 0) {
//       return res.status(404).json({ message: "No member found" });
//     }

//     // If multiple found, return list to select from
//     if (membersList.length > 1) {
//       return res.status(200).json({ type: "multiple", data: membersList });
//     }

//     // If exactly one found, fetch full details
//     const singleMember = await Member.findOne({ name: membersList[0].name });
//     return res.status(200).json({ type: "single", data: singleMember });
//   } catch (error) {
//     console.error(error);
//     res.status(500).json({ message: "Error fetching member details" });
//   }
// };

// const getMember = async (req, res) => {
//   console.log("route is called ", req.params);

//   try {
//     const { id } = req.params; // can be SeniorityID or name/refname
//     if (!id) return res.status(400).json({ message: "Invalid request" });

//     const searchValue = id.trim();

//     // 1️⃣ Try exact SeniorityID match
//     const bySeniority = await Member.findOne({ SeniorityID: searchValue });
//     if (bySeniority) {
//       console.log("Matched by SeniorityID ✅");
//       return res.status(200).json({ type: "single", data: bySeniority });
//     }

//     // 2️⃣ Try refname or name (case-insensitive, partial match)
//     console.log("Searching by name/refname for:", searchValue);

//     const membersList = await Member.find({
//       $or: [
//         { name: { $regex: searchValue, $options: "i" } },
//         { refname: { $regex: searchValue, $options: "i" } },
//       ],
//     }).select("name email mobileNumber SeniorityID refname");

//     console.log("membersList found:", membersList);

//     if (membersList.length === 0) {
//       return res.status(404).json({ message: "No member found" });
//     }

//     if (membersList.length > 1) {
//       return res.status(200).json({ type: "multiple", data: membersList });
//     }

//     const singleMember = await Member.findOne({ _id: membersList[0]._id });
//     return res.status(200).json({ type: "single", data: singleMember });

//   } catch (error) {
//     console.error("Error fetching member:", error);
//     res.status(500).json({ message: "Error fetching member details" });
//   }
// };
const getMember = async (req, res) => {
  console.log("route is called ", req.params);

  try {
    const { id } = req.params; // can be SeniorityID or name/refname
    if (!id) return res.status(400).json({ message: "Invalid request" });

    const searchValue = id.trim();

    // 1️⃣ Try exact SeniorityID match
    const bySeniority = await Member.findOne({ SeniorityID: searchValue });
    if (bySeniority) {
      console.log("Matched by SeniorityID ✅",bySeniority);
      return res.status(200).json({ member: bySeniority });
    }

    // 2️⃣ Try refname or name (case-insensitive, partial match)
    console.log("Searching by name/refname for:", searchValue);

    const membersList = await Member.find({
      $or: [
        { name: { $regex: searchValue, $options: "i" } },
        { refname: { $regex: searchValue, $options: "i" } },
      ],
    }).select("name email mobileNumber SeniorityID refname");

    console.log("membersList found:", membersList);

    if (membersList.length === 0) {
      return res.status(404).json({ message: "Member not found" });
    }

    // 3️⃣ If multiple found → let frontend show list
    if (membersList.length > 1) {
      return res.status(200).json({
        multiple: true,
        members: membersList, // return array under "members"
      });
    }

    // 4️⃣ If exactly one found → return as single "member"
    const singleMember = await Member.findOne({ _id: membersList[0]._id });
    return res.status(200).json({ member: singleMember });

  } catch (error) {
    console.error("Error fetching member:", error);
    res.status(500).json({ message: "Error fetching member details" });
  }
};



const CreateTransfer = async (req, res) => {
  try {
    // Parse JSON strings
    const fromMember = JSON.parse(req.body.fromMember);
    const toMember = JSON.parse(req.body.toMember);
    const { reason, transferDate } = req.body;

    console.log("req transfer date", transferDate);

    let newTransferDate;
    if (transferDate) {
      newTransferDate = new Date(transferDate);
      if (isNaN(newTransferDate.getTime())) {
        newTransferDate = new Date(); // Fallback to current date if invalid
      }
    } else {
      newTransferDate = new Date();
    }

    console.log("new transfer date", newTransferDate);

    // Find the existing member by SeniorityID
    const fromMemberRecord = await Member.findOne({
      SeniorityID: fromMember.seniorityId,
    });
    if (!fromMemberRecord) {
      return res
        .status(404)
        .json({ message: "From member not found with given SeniorityID." });
    }

    // Save previous member details
    const previousDetails = {
      saluation: fromMemberRecord.saluation,
      name: fromMemberRecord.name,
      email: fromMemberRecord.email,
      mobileNumber: fromMemberRecord.mobileNumber,
      AlternativeNumber: fromMemberRecord.AlternativeNumber,
      dateofbirth: fromMemberRecord.dateofbirth,
      fatherName: fromMemberRecord.fatherName,
      contactAddress: fromMemberRecord.contactAddress,
      permanentAddress: fromMemberRecord.permanentAddress,
      workingAddress: fromMemberRecord.workingAddress,
      nomineeName: fromMemberRecord.nomineeName,
      nomineeAge: fromMemberRecord.nomineeAge,
      nomineeRelation: fromMemberRecord.nomineeRelation,
      nomineeAddress: fromMemberRecord.nomineeAddress,
      MemberPhoto: fromMemberRecord.MemberPhoto,
      MemberSign: fromMemberRecord.MemberSign,
    };

    // Upload new images if available
    let memberPhotoUrl = fromMemberRecord.MemberPhoto;
    let memberSignUrl = fromMemberRecord.MemberSign;

    if (req.files?.memberPhoto?.[0]) {
      const uploadedPhoto = await uploadToCloudinary(
        req.files.memberPhoto[0].buffer
      );
      memberPhotoUrl = uploadedPhoto.secure_url;
    }

    if (req.files?.memberSign?.[0]) {
      const uploadedSign = await uploadToCloudinary(
        req.files.memberSign[0].buffer
      );
      memberSignUrl = uploadedSign.secure_url;
    }

    // let newTransferDate = transferDate ? new Date(transferDate) : new Date();

    // ✅ Update the existing member with new details (no new creation)
    const updatedMember = await Member.findByIdAndUpdate(
      fromMemberRecord._id,
      {
        //basic info
        saluation: toMember.saluation,
        name: toMember.name,
        email: toMember.email,
        mobileNumber: toMember.mobile,
        AlternativeNumber:
          toMember.AlternativeNumber || fromMemberRecord.AlternativeNumber,
        dateofbirth: toMember.dateofbirth,
        fatherName: toMember.fatherName,

        //addresses
        contactAddress: toMember.contactAddress,
        permanentAddress: toMember.permanentAddress,
        workingAddress: toMember.workingAddress,

        //nominee info
        nomineeName: toMember.nomineeName,
        nomineeAge: toMember.nomineeAge,
        nomineeRelation: toMember.nomineeRelation,
        nomineeAddress: toMember.nomineeAddress,

        //transfer meta data
        isTransferred: true,
        transferReason: reason, // <-- include transfer reason
        refname: toMember.name,

        //images
        MemberPhoto: memberPhotoUrl,
        MemberSign: memberSignUrl,

        //previous details
        previousMemberDetails: previousDetails,
        transferDate: newTransferDate,
      },
      { new: true }
    );

    if (toMember.contactAddress || transferDate) {
      const updateObj = {};
      if (toMember.contactAddress) {
        updateObj["payments.$[].correspondenceAddress"] =
          toMember.contactAddress;
      }

      if (transferDate) {
        updateObj["payments.$[].date"] = newTransferDate;
      }
      await Receipt.updateMany(
        { member: fromMemberRecord._id },
        { $set: updateObj }
      );
    }
    res.status(200).json({
      message: "Member updated with transfer details successfully.",
      member: updatedMember,
      updatedFields: {
        contactAddress: toMember.contactAddress,
        transferDate: newTransferDate,
      },
    });
  } catch (error) {
    console.error("Transfer creation error:", error);
    res.status(500).json({ message: "Error updating transfer", error });
  }
};

const plotTransferhistory = async (req, res) => {
  try {
    // Fetch only transferred members, select only the required fields.
    const transferredMembers = await Member.find({ isTransferred: true })
      .select(
        "name mobileNumber email previousMemberDetails propertyDetails transferDate SeniorityID transferReason"
      )
      .sort({ transferDate: -1 });

    const result = transferredMembers.map((member) => ({
      toMemberName: member.name,
      toMemberMobile: member.mobileNumber,
      toMemberEmail: member.email,
      fromMemberName: member.previousMemberDetails?.name || "N/A",
      fromMemberMobile: member.previousMemberDetails?.mobileNumber || "N/A",
      fromMemberEmail: member.previousMemberDetails?.email || "N/A",
      projectName: member.propertyDetails?.projectName || "N/A",
      transferDate: member.transferDate, // pick only from schema field!
      SeniorityID: member.SeniorityID,
      transferReason: member.transferReason,
    }));

    console.log(result, "this is the result");
    res.status(200).json(result);
  } catch (error) {
    console.error("Error fetching transferred plots:", error);
    res.status(500).json({ message: "Error fetching transfer history", error });
  }
};

const cancelMemberPlot = async (req, res) => {
  try {
    const { reason, remarks, cancellationDate, member } = req.body;

    // Parse the member JSON string
    const parsedMember = JSON.parse(member);
    const seniorityId = parsedMember.seniorityId;

    if (!seniorityId) {
      return res.status(400).json({ message: "Seniority ID is required" });
    }

    // Find the member by SeniorityID
    const memberDoc = await Member.findOne({ SeniorityID: seniorityId });

    if (!memberDoc) {
      return res.status(404).json({ message: "Member not found" });
    }

    // Upload cancellation letter to Cloudinary if file exists
    let cancellationLetterUrl = null;
    if (req.file && req.file.buffer) {
      const result = await uploadToCloudinary(
        req.file.buffer,
        "dhs-project-status/member-uploads"
      );
      cancellationLetterUrl = result.secure_url;
    }

    // Update the cancellation details
    memberDoc.cancellationDetails = {
      reason,
      remarks,
      cancellationDate: cancellationDate
        ? new Date(cancellationDate)
        : new Date(),
      cancellationLetter: cancellationLetterUrl,
    };

    await memberDoc.save();

    res
      .status(200)
      .json({ message: "Plot cancellation updated", data: memberDoc });
  } catch (error) {
    console.error("Cancel plot error:", error);
    res.status(500).json({ message: "Failed to cancel plot", error });
  }
};

// GET /api/members/cancelled
const getCancelledMembers = async (req, res) => {
  try {
    const cancelledMembers = await Member.find({
      cancellationDetails: { $ne: null },
    });
    console.log(cancelledMembers, "total cancelled members");
    res.status(200).json({ data: cancelledMembers });
  } catch (error) {
    console.error("Error fetching cancelled members:", error);
    res.status(500).json({ message: "Server Error", error });
  }
};

const DeletePlotCancelation = async (req, res) => {
  try {
    const { memberId } = req.body;
    console.log(memberId, "incomign member id");
    if (!memberId) {
      return res.status(400).json({ message: "Member ID is required" });
    }
    const member = await Member.findById(memberId);
    if (!member) {
      return res.status(404).json({ message: "Member not found" });
    }
    // Clear the cancellationDetails field
    member.cancellationDetails = null;
    await member.save();
    res
      .status(200)
      .json({ message: "Plot cancellation details deleted successfully" });
  } catch (error) {
    console.error("Error deleting cancellation details:", error);
    res.status(500).json({ message: "Internal Server Error" });
  }
};

export default {
  getMemberBySeniorityID,
  CreateTransfer,
  plotTransferhistory,
  cancelMemberPlot,
  getCancelledMembers,
  DeletePlotCancelation,
  getMember
};

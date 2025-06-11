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

 const cancelMemberPlot = async (req, res) => {
  try {
    console.log('Function is called', req.body);

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
      const result = await uploadToCloudinary(req.file.buffer, "dhs-project-status/member-uploads");
      cancellationLetterUrl = result.secure_url;
    }

    // Update the cancellation details
    memberDoc.cancellationDetails = {
      reason,
      remarks,
      cancellationDate: cancellationDate ? new Date(cancellationDate) : new Date(),
      cancellationLetter: cancellationLetterUrl,
    };

    await memberDoc.save();

    res.status(200).json({ message: "Plot cancellation updated", data: memberDoc });

  } catch (error) {
    console.error("Cancel plot error:", error);
    res.status(500).json({ message: "Failed to cancel plot", error });
  }
};

// GET /api/members/cancelled

 const getCancelledMembers = async (req, res) => {
  try {
    const cancelledMembers = await Member.find({ cancellationDetails: { $ne: null } });
    console.log(cancelledMembers,'total cancelled members')
    res.status(200).json({ data: cancelledMembers });
  } catch (error) {
    console.error("Error fetching cancelled members:", error);
    res.status(500).json({ message: "Server Error", error });
  }
};

const DeletePlotCancelation =async (req,res)=>{
try {
    const { memberId } = req.body;
    console.log(memberId,'incomign member id')
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
    res.status(200).json({ message: "Plot cancellation details deleted successfully" });
  } catch (error) {
    console.error("Error deleting cancellation details:", error);
    res.status(500).json({ message: "Internal Server Error" });
  }
}


export default {
    getMemberBySeniorityID,
    CreateTransfer,
    plotTransferhistory,
    cancelMemberPlot,
    getCancelledMembers,
    DeletePlotCancelation
}
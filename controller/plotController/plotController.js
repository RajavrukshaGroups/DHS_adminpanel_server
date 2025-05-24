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


const CreateTransfer = async (req, res) => {
  try {
    console.log(req.body, 'incoming data in the req.body');
    const {
      fromMember,
      toMember,
      reason,
      transferDate,
    } = req.body;

    const fromMemberRecord = await Member.findOne({ SeniorityID: fromMember.seniorityId });
    console.log(fromMemberRecord, 'from member record');

    if (!fromMemberRecord) {
      return res.status(404).json({ message: "From member not found with given SeniorityID." });
    }

    const newTransfer = new Transfer({
      fromMember: fromMemberRecord._id,
      toMember,  // directly use the toMember object from frontend
      reason,
      transferDate,
    });

    await newTransfer.save();

    await Member.findByIdAndUpdate(fromMemberRecord._id, { isTransferred: true });

    res.status(201).json({ message: "Transfer recorded successfully." });

  } catch (error) {
    console.error("Transfer creation error:", error);
    res.status(500).json({ message: "Error creating transfer", error });
  }
};

const plotTransferhistory = async (req, res) => {
  try {
    const plotTransferHistory = await Transfer.find();

    if (plotTransferHistory && plotTransferHistory.length > 0) {
      res.status(200).json({
        success: true,
        data: plotTransferHistory
      });
    } else {
      res.status(404).json({
        success: false,
        message: "No transfer history found."
      });
    }

  } catch (error) {
    console.error("Error fetching plot transfer history:", error);
    res.status(500).json({
      success: false,
      message: "Server error while fetching transfer history.",
      error: error.message
    });
  }
};



export default {
    
    getMemberBySeniorityID,
    CreateTransfer,
    plotTransferhistory
}